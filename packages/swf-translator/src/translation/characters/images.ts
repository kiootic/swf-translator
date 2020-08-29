import sharp, { Sharp } from "sharp";
import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output/context";
import { DefineBitsTag } from "../../format/tags/define-bits";
import { DefineBitsJPEG2Tag } from "../../format/tags/define-bits-jpeg-2";
import { DefineBitsJPEG3Tag } from "../../format/tags/define-bits-jpeg-3";
import { DefineBitsLossless2Tag } from "../../format/tags/define-bits-loseless-2";
import { File } from "../../output";
import { VariableDeclarationKind } from "ts-morph";

export async function translateImages(ctx: OutputContext, swf: SWFFile) {
  for (const tag of swf.characters.values()) {
    let assetFile: File;
    if (tag instanceof DefineBitsTag) {
      assetFile = await translateBits(ctx, tag);
    } else if (tag instanceof DefineBitsJPEG2Tag) {
      assetFile = await translateBitsJPEG2(ctx, tag);
    } else if (tag instanceof DefineBitsJPEG3Tag) {
      assetFile = await translateBitsJPEG3(ctx, tag);
    } else if (tag instanceof DefineBitsLossless2Tag) {
      assetFile = await translateBitsLossless2(ctx, tag);
    } else {
      continue;
    }

    const index = ctx.file("characters", "index.ts");
    index.tsSource.addImportDeclaration({
      defaultImport: `character${tag.characterId}`,
      moduleSpecifier: index.relPathTo(assetFile),
    });
    index.tsSource.addStatements(
      `bundle.images[${tag.characterId}] = { path: character${tag.characterId} };`
    );
  }
}

async function translateBits(ctx: OutputContext, tag: DefineBitsTag) {
  const image = sharp(tag.jpegData);
  const { format } = await image.metadata();
  const data = await image.toBuffer();

  const file = ctx.file("assets", `${tag.characterId}.${format}`);
  file.content = data;
  return file;
}

async function translateBitsJPEG2(ctx: OutputContext, tag: DefineBitsJPEG2Tag) {
  const image = sharp(tag.imageData);
  const { format } = await image.metadata();
  const data = await image.toBuffer();

  const file = ctx.file("assets", `${tag.characterId}.${format}`);
  file.content = data;
  return file;
}

async function translateBitsJPEG3(ctx: OutputContext, tag: DefineBitsJPEG3Tag) {
  let image = sharp(tag.imageData);
  const { width, height } = await image.metadata();
  image.joinChannel(tag.alphaBitmapData, {
    raw: {
      width: width || 0,
      height: height || 0,
      channels: 1,
    },
  });

  image = await unMultiplyAlpha(image);
  const data = await image.png().toBuffer();

  const file = ctx.file("assets", `${tag.characterId}.png`);
  file.content = data;
  return file;
}

async function translateBitsLossless2(
  ctx: OutputContext,
  tag: DefineBitsLossless2Tag
) {
  const buf = Buffer.alloc(tag.bitmapWidth * tag.bitmapHeight * 4);
  let i = 0;
  for (let y = 0; y < tag.bitmapHeight; y++) {
    for (let x = 0; x < tag.bitmapWidth; x++) {
      buf[i * 4 + 0] = tag.bitmapData[i].red;
      buf[i * 4 + 1] = tag.bitmapData[i].green;
      buf[i * 4 + 2] = tag.bitmapData[i].blue;
      buf[i * 4 + 3] = tag.bitmapData[i].alpha;
      i++;
    }
  }

  let image = sharp(buf, {
    raw: {
      width: tag.bitmapWidth,
      height: tag.bitmapHeight,
      channels: 4,
    },
  });
  image = await unMultiplyAlpha(image);
  const data = await image.png().toBuffer();
  const file = ctx.file("assets", `${tag.characterId}.png`);
  file.content = data;
  return file;
}

async function unMultiplyAlpha(img: Sharp): Promise<Sharp> {
  const { width = 0, height = 0 } = await img.metadata();
  const data = await img.raw().toBuffer();

  let i = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[i * 4 + 3] / 255;
      if (a) {
        data[i * 4 + 0] = Math.min(255, Math.max(0, data[i * 4 + 0] / a));
        data[i * 4 + 1] = Math.min(255, Math.max(0, data[i * 4 + 1] / a));
        data[i * 4 + 2] = Math.min(255, Math.max(0, data[i * 4 + 2] / a));
      }
      i++;
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } });
}
