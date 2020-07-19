import JSON5 from "json5";
import { VariableDeclarationKind } from "ts-morph";
import { SWFFile } from "../../format/swf";
import { DefineShapeTag } from "../../format/tags/define-shape";
import { OutputContext } from "../../output";
import { DefineShape2Tag } from "../../format/tags/define-shape-2";
import { DefineShape3Tag } from "../../format/tags/define-shape-3";
import { DefineShape4Tag } from "../../format/tags/define-shape-4";
import * as format from "../../format/structs";
import { Shape, ShapeContour } from "../../models/shape";
import { FillStyle, FillStyleKind } from "../../models/styles";
import { fillStyle } from "../../models/styles";
import { FillMesh } from "../../geom/fill-mesh";
import { LineMesh } from "../../geom/line-mesh";
import { color } from "../../models/primitives";

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

  const contours: ShapeContour[] = [];
  for (const group of groups) {
    group.finalize(contours);
  }
  return { contours };
}

interface ShapePath {
  readonly fillStyle: format.FillStyle | null;
  readonly lineStyle: format.LineStyle | null;
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
    readonly fillStyles: format.FillStyle[],
    readonly lineStyles: format.LineStyle[]
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

  private simplifyPath(segments: ShapeSegment[]): ShapeSegment[][] {
    let paths: ShapeSegment[][] = [];
    for (const segment of segments) {
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
    return paths;
  }

  finalize(contours: ShapeContour[]) {
    const finalizePath = (path: ShapePath) => {
      if (path.segments.length === 0) {
        return;
      }

      const pathContours = this.simplifyPath(path.segments);

      let mesh: FillMesh | LineMesh;
      let fill: FillStyle;
      if (path.fillStyle) {
        mesh = new FillMesh();
        fill = fillStyle(path.fillStyle);
      } else if (path.lineStyle) {
        mesh = new LineMesh();
        mesh.lineStyle(
          path.lineStyle.width,
          path.lineStyle.startCapStyle,
          path.lineStyle.endCapStyle,
          path.lineStyle.joinStyle,
          path.lineStyle.miterLimitFactor ?? 20,
          path.lineStyle.noClose
        );

        if (typeof path.lineStyle.color === "object") {
          fill = {
            kind: FillStyleKind.SolidColor,
            color: color(path.lineStyle.color),
          };
        } else {
          fill = fillStyle(path.lineStyle.fillType!);
        }
      } else {
        throw new Error("unexpected path styles");
      }

      for (const contour of pathContours) {
        mesh.moveTo(contour[0].start[0], contour[0].start[1]);
        for (const segment of contour) {
          if (segment.control) {
            mesh.curveTo(
              segment.control[0],
              segment.control[1],
              segment.end[0],
              segment.end[1]
            );
          } else {
            mesh.lineTo(segment.end[0], segment.end[1]);
          }
        }
      }

      const [vertices, indices] = mesh.triangulate();
      contours.push({ fill, vertices, indices });
    };
    for (const path of this.fillPaths) {
      finalizePath(path);
    }
    for (const path of this.linePaths) {
      finalizePath(path);
    }
  }
}
