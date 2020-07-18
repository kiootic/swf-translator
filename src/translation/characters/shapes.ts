import JSON5 from "json5";
import { VariableDeclarationKind } from "ts-morph";
import { SWFFile } from "../../format/swf";
import { DefineShapeTag } from "../../format/tags/define-shape";
import { OutputContext } from "../../output";
import { DefineShape2Tag } from "../../format/tags/define-shape-2";
import { DefineShape3Tag } from "../../format/tags/define-shape-3";
import { DefineShape4Tag } from "../../format/tags/define-shape-4";
import { FillStyle, LineStyle } from "../../format/structs";
import { ShapeCommand, ShapeCommandKind, Shape } from "../../models/shape";
import { fillStyle, lineStyle } from "../../models/styles";

export async function translateShapes(ctx: OutputContext, swf: SWFFile) {
  for (const tag of swf.characters.values()) {
    let shape: Shape;
    if (
      tag instanceof DefineShapeTag ||
      tag instanceof DefineShape2Tag ||
      tag instanceof DefineShape3Tag ||
      tag instanceof DefineShape4Tag
    ) {
      shape = translateShape(ctx, tag);
    } else {
      continue;
    }

    const charFile = ctx.file("characters", `${tag.characterId}.ts`);
    const src = charFile.tsSource;
    src
      .addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: `character${tag.characterId}`,
            type: "unknown",
            initializer: JSON5.stringify(shape, null, 4),
          },
        ],
      })
      .setIsExported(true);
  }
}

// ref: https://github.com/open-flash/swf-renderer/blob/master/ts/src/lib/shape/decode-swf-shape.ts
//      https://github.com/mozilla/shumway/blob/16451d8836fa85f4b16eeda8b4bda2fa9e2b22b0/src/swf/parser/shape.ts
//      http://wahlers.com.br/claus/blog/hacking-swf-1-shapes-in-flash/
function translateShape(ctx: OutputContext, tag: DefineShapeTag): Shape {
  const { shapes } = tag;

  const { shapeRecords } = shapes;
  let group = new ShapeGroup(shapes.fillStyles, shapes.lineStyles);
  const groups = [group];
  let x = 0,
    y = 0;

  for (const record of shapeRecords) {
    switch (record.type) {
      case 0:
        if (record.moveTo) {
          x = record.moveTo.x;
          y = record.moveTo.y;
        }
        if (record.fillStyle0 != null) {
          group.fillStyle0Id = record.fillStyle0;
        }
        if (record.fillStyle1 != null) {
          group.fillStyle1Id = record.fillStyle1;
        }
        if (record.lineStyle != null) {
          group.lineStyleId = record.lineStyle;
        }
        if (record.fillStyles || record.lineStyles) {
          group = new ShapeGroup(
            record.fillStyles ?? group.fillStyles,
            record.lineStyles ?? group.lineStyles
          );
          groups.push(group);
        }
        break;
      case 1:
        switch (record.straight) {
          case 0: {
            const controlX = x + record.controlDeltaX;
            const controlY = y + record.controlDeltaY;
            const endX = controlX + record.anchorDeltaX;
            const endY = controlY + record.anchorDeltaY;
            group.addSegment({
              start: [x, y],
              control: [controlX, controlY],
              end: [endX, endY],
            });
            x = endX;
            y = endY;
            break;
          }
          case 1: {
            const endX = x + record.deltaX;
            const endY = y + record.deltaY;
            group.addSegment({
              start: [x, y],
              end: [endX, endY],
            });
            x = endX;
            y = endY;
            break;
          }
        }
        break;
    }
  }

  const commands: ShapeCommand[] = [];
  for (const group of groups) {
    group.finalize(commands);
  }
  return { commands };
}

interface ShapePath {
  readonly fillStyle: FillStyle | null;
  readonly lineStyle: LineStyle | null;
  readonly segments: ShapeSegment[];
}

interface ShapeSegment {
  readonly start: [number, number];
  readonly control?: [number, number];
  readonly end: [number, number];
}

class ShapeGroup {
  private readonly fillPaths: ShapePath[];
  private readonly linePaths: ShapePath[];
  fillStyle0Id = 0;
  fillStyle1Id = 0;
  lineStyleId = 0;

  constructor(
    readonly fillStyles: FillStyle[],
    readonly lineStyles: LineStyle[]
  ) {
    this.fillPaths = new Array(fillStyles.length);
    for (let i = 0; i < fillStyles.length; i++) {
      this.fillPaths[i] = {
        fillStyle: fillStyles[i],
        lineStyle: null,
        segments: [],
      };
    }
    this.linePaths = new Array(lineStyles.length);
    for (let i = 0; i < lineStyles.length; i++) {
      this.linePaths[i] = {
        fillStyle: null,
        lineStyle: lineStyles[i],
        segments: [],
      };
    }
  }

  addSegment(segment: ShapeSegment) {
    if (this.fillStyle0Id) {
      this.fillPaths[this.fillStyle0Id - 1].segments.push({
        start: segment.end,
        control: segment.control,
        end: segment.start,
      });
    }
    if (this.fillStyle1Id) {
      this.fillPaths[this.fillStyle1Id - 1].segments.push(segment);
    }
    if (this.lineStyleId) {
      this.linePaths[this.lineStyleId - 1].segments.push(segment);
    }
  }

  finalize(commands: ShapeCommand[]) {
    const finalizePath = (path: ShapePath) => {
      if (path.segments.length === 0) {
        return;
      }

      commands.push({
        kind: ShapeCommandKind.Style,
        fill: path.fillStyle && fillStyle(path.fillStyle),
        line: path.lineStyle && lineStyle(path.lineStyle),
      });

      let paths: ShapeSegment[][] = [];
      for (const segment of path.segments) {
        paths.push([segment]);
      }

      let worked: boolean;
      do {
        worked = false;
        for (const path of paths) {
          const toDelete = new Set<ShapeSegment[]>();
          while (true) {
            const { end } = path[path.length - 1];
            const nextPath = paths.find(
              (p) =>
                p !== path &&
                !toDelete.has(p) &&
                p[0].start[0] === end[0] &&
                p[0].start[1] === end[1]
            );
            if (!nextPath) {
              break;
            }
            path.push(...nextPath);
            toDelete.add(nextPath);
          }

          if (toDelete.size === 0) {
            continue;
          }

          paths = paths.filter((p) => !toDelete.has(p));
          worked = true;
          break;
        }
      } while (worked);

      let x: number | undefined, y: number | undefined;
      for (const path of paths) {
        if (x !== path[0].start[0] || y !== path[0].start[1]) {
          commands.push({
            kind: ShapeCommandKind.MoveTo,
            x: path[0].start[0],
            y: path[0].start[1],
          });
          x = path[0].start[0];
          y = path[0].start[1];
        }
        for (const segment of path) {
          if (segment.control) {
            commands.push({
              kind: ShapeCommandKind.CurveTo,
              controlX: segment.control[0],
              controlY: segment.control[1],
              x: segment.end[0],
              y: segment.end[1],
            });
          } else {
            commands.push({
              kind: ShapeCommandKind.LineTo,
              x: segment.end[0],
              y: segment.end[1],
            });
          }
          x = segment.end[0];
          y = segment.end[1];
        }
      }

      commands.push({ kind: ShapeCommandKind.EndPath });
    };
    for (const path of this.fillPaths) {
      finalizePath(path);
    }
    for (const path of this.linePaths) {
      finalizePath(path);
    }
  }
}
