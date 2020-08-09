import JSON5 from "json5";
import { OutputContext } from "../../output";
import { SWFFile } from "../../format/swf";
import { MorphShape, Shape } from "../../models/shape";
import { DefineSpriteTag } from "../../format/tags/define-sprite";
import { VariableDeclarationKind } from "ts-morph";
import { PlaceObject2Tag } from "../../format/tags/place-object-2";
import { PlaceObject3Tag } from "../../format/tags/place-object-3";
import { DefineMorphShapeTag } from "../../format/tags/define-morph-shape";
import { Tag } from "../../format/tag";
import {
  FillStyle,
  MorphFillStyle,
  ARGB,
  Matrix,
  MorphLineStyle,
  LineStyle,
  ShapeRecord,
  ShapeRecordCurvedEdge,
  ShapeRecordStraightEdge,
  shape,
} from "../../format/structs";
import { MorphGradient, Gradient } from "../../format/structs/gradient";
import { translateShape } from "./shape";

export async function translateMorphShapes(ctx: OutputContext, swf: SWFFile) {
  const morphShapes: Record<number, unknown> = {};

  const ratios = extractRatios(swf);
  for (const tag of swf.characters.values()) {
    let morphShape: MorphShape;
    if (tag instanceof DefineMorphShapeTag) {
      morphShape = translateMorphShape(tag, ratios);
    } else {
      continue;
    }

    const char = ctx.file("characters", `${tag.characterId}.ts`);
    char.tsSource.addImportDeclaration({
      defaultImport: "lib",
      moduleSpecifier: "@swf/lib",
    });
    char.tsSource.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `character`,
          type: "lib._internal.character.MorphShapeCharacter",
          initializer: JSON5.stringify(morphShape, null, 4),
        },
      ],
    });
    char.tsSource.addExportAssignment({
      expression: "character",
      isExportEquals: false,
    });

    const index = ctx.file("characters", `index.ts`);
    index.tsSource.addImportDeclaration({
      defaultImport: `character${tag.characterId}`,
      moduleSpecifier: `./${tag.characterId}`,
    });
    index.tsSource.addStatements(
      `bundle.morphShapes[${tag.characterId}] = character${tag.characterId};`
    );

    morphShapes[tag.characterId] = morphShape;
  }
  return morphShapes;
}

function extractRatios(swf: SWFFile): Map<number, number[]> {
  const ratios = new Map<number, number[]>();

  const processControlTags = (tags: Tag[]) => {
    const displayList = new Map<number, number>();
    for (const tag of tags) {
      if (tag instanceof PlaceObject2Tag || tag instanceof PlaceObject3Tag) {
        const charId = tag.placeCharacterId ?? displayList.get(tag.depth);
        if (!charId) {
          continue;
        }
        displayList.set(tag.depth, charId);

        const ratio = tag.ratio;
        if (ratio == null) {
          continue;
        }

        const charRatios = ratios.get(charId) || [];
        ratios.set(charId, [...charRatios, ratio]);
      }
    }
  };

  for (const tag of swf.characters.values()) {
    if (tag instanceof DefineSpriteTag) {
      processControlTags(tag.controlTags);
    }
  }
  processControlTags(swf.tags);

  return ratios;
}

function translateMorphShape(
  tag: DefineMorphShapeTag,
  ratios: Map<number, number[]>
): MorphShape {
  let charRatios = ratios.get(tag.characterId) || [];
  charRatios = Array.from(new Set([0, ...charRatios]));
  charRatios.sort((a, b) => a - b);

  const frames: [number, Shape][] = [];
  for (const ratio of charRatios) {
    frames.push([ratio, morphShape(tag, ratio / 65535)]);
  }
  return { frames };
}

function lerp(a: number, b: number, ratio: number): number {
  return a + (b - a) * ratio;
}

function lerpColor(a: ARGB, b: ARGB, ratio: number): ARGB {
  return {
    alpha: lerp(a.alpha, b.alpha, ratio),
    red: lerp(a.red, b.red, ratio),
    green: lerp(a.green, b.green, ratio),
    blue: lerp(a.blue, b.blue, ratio),
  };
}

function lerpMatrix(a: Matrix, b: Matrix, ratio: number): Matrix {
  return {
    scaleX: lerp(a.scaleX, b.scaleX, ratio),
    scaleY: lerp(a.scaleY, b.scaleY, ratio),
    rotateSkew0: lerp(a.rotateSkew0, b.rotateSkew0, ratio),
    rotateSkew1: lerp(a.rotateSkew1, b.rotateSkew1, ratio),
    translateX: lerp(a.translateX, b.translateX, ratio),
    translateY: lerp(a.translateY, b.translateY, ratio),
  };
}

function morphGradient(grad: MorphGradient, ratio: number): Gradient {
  return {
    spreadMode: grad.spreadMode,
    interpolationMode: grad.interpolationMode,
    gradientRecords: grad.gradientRecords.map((record) => ({
      color: lerpColor(record.startColor, record.endColor, ratio),
      ratio: lerp(record.startRatio, record.endRatio, ratio),
    })),
  };
}

function morphFillStyle(style: MorphFillStyle, ratio: number): FillStyle {
  const morphedStyle: FillStyle = {
    type: style.type,
    bitmapId: style.bitmapId,
  };
  if (style.startColor && style.endColor) {
    morphedStyle.color = lerpColor(style.startColor, style.endColor, ratio);
  }
  if (style.startGradientMatrix && style.endGradientMatrix) {
    morphedStyle.gradientMatrix = lerpMatrix(
      style.startGradientMatrix,
      style.endGradientMatrix,
      ratio
    );
  }
  if (style.gradient) {
    morphedStyle.gradient = morphGradient(style.gradient, ratio);
  }
  if (style.startBitmapMatrix && style.endBitmapMatrix) {
    morphedStyle.bitmapMatrix = lerpMatrix(
      style.startBitmapMatrix,
      style.endBitmapMatrix,
      ratio
    );
  }
  return morphedStyle;
}

function morphLineStyle(style: MorphLineStyle, ratio: number): LineStyle {
  const morphedStyle: LineStyle = {
    width: lerp(style.startWidth, style.endWidth, ratio),
    startCapStyle: style.startCapStyle,
    joinStyle: style.joinStyle,
    noHScale: style.noHScale,
    noVScale: style.noVScale,
    pixelHinting: style.pixelHinting,
    noClose: style.noClose,
    endCapStyle: style.endCapStyle,
    miterLimitFactor: style.miterLimitFactor,
  };
  if (style.startColor && style.endColor) {
    morphedStyle.color = lerpColor(style.startColor, style.endColor, ratio);
  }
  if (style.fillType) {
    morphedStyle.fillType = morphFillStyle(style.fillType, ratio);
  }
  return morphedStyle;
}

function morphShape(tag: DefineMorphShapeTag, ratio: number) {
  const fillStyles = tag.fillStyles.map((s) => morphFillStyle(s, ratio));
  const lineStyles = tag.lineStyles.map((s) => morphLineStyle(s, ratio));

  const simplifyEdgeRecord = (
    record: ShapeRecordCurvedEdge | ShapeRecordStraightEdge
  ): ShapeRecordCurvedEdge => {
    if (record.straight === 0) {
      return record;
    }
    return {
      type: 1,
      straight: 0,
      controlDeltaX: record.deltaX / 2,
      controlDeltaY: record.deltaY / 2,
      anchorDeltaX: record.deltaX / 2,
      anchorDeltaY: record.deltaY / 2,
    };
  };

  let i = 0;
  const nextEndMoveTo = () => {
    let record: ShapeRecord | undefined;
    do {
      record = tag.endEdges.shapeRecords[i++];
    } while (record.type !== 0 && i < tag.endEdges.shapeRecords.length);

    return record?.type === 0 ? record.moveTo : undefined;
  };
  const nextEndEdge = () => {
    let record: ShapeRecord | undefined;
    do {
      record = tag.endEdges.shapeRecords[i++];
    } while (record.type !== 1 && i < tag.endEdges.shapeRecords.length);

    if (record?.type !== 1) {
      return undefined;
    }
    return simplifyEdgeRecord(record);
  };

  const shapeRecords: ShapeRecord[] = [];
  for (const record of tag.startEdges.shapeRecords) {
    switch (record.type) {
      case 0: {
        const newRecord = { ...record };
        if (newRecord.moveTo) {
          const a = newRecord.moveTo;
          const b = nextEndMoveTo();
          if (!b) {
            throw new Error(`mismatched moveTo in #${tag.characterId}`);
          }

          newRecord.moveTo = {
            x: lerp(a.x, b.x, ratio),
            y: lerp(a.y, b.y, ratio),
          };
        }

        shapeRecords.push(newRecord);
        break;
      }
      case 1: {
        const a = simplifyEdgeRecord(record);
        const b = nextEndEdge();
        if (!b) {
          throw new Error(`mismatched edge in #${tag.characterId}`);
        }

        shapeRecords.push({
          type: 1,
          straight: 0,
          controlDeltaX: lerp(a.controlDeltaX, b.controlDeltaX, ratio),
          controlDeltaY: lerp(a.controlDeltaY, b.controlDeltaY, ratio),
          anchorDeltaX: lerp(a.anchorDeltaX, b.anchorDeltaX, ratio),
          anchorDeltaY: lerp(a.anchorDeltaY, b.anchorDeltaY, ratio),
        });
        break;
      }
    }
  }

  return translateShape({
    fillStyles,
    lineStyles,
    shapeRecords,
  });
}
