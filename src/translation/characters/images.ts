import sharp from "sharp";
import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output/context";
import { DefineBitsTag } from "../../format/tags/define-bits";
import { DefineBitsJPEG2Tag } from "../../format/tags/define-bits-jpeg-2";
import { DefineBitsJPEG3Tag } from "../../format/tags/define-bits-jpeg-3";
import { DefineBitsLossless2Tag } from "../../format/tags/define-bits-loseless-2";

export async function translateImages(ctx: OutputContext, swf: SWFFile) {
  for (const tag of swf.characters.values()) {
    if (tag instanceof DefineBitsTag) {
      await translateBits(ctx, tag);
    } else if (tag instanceof DefineBitsJPEG2Tag) {
      await translateBitsJPEG2(ctx, tag);
    } else if (tag instanceof DefineBitsJPEG3Tag) {
      await translateBitsJPEG3(ctx, tag);
    } else if (tag instanceof DefineBitsLossless2Tag) {
      await translateBitsLossless2(ctx, tag);
    }
  }
}

async function translateBits(ctx: OutputContext, tag: DefineBitsTag) {
  const image = sharp(tag.jpegData);
  const { format } = await image.metadata();
  const data = await image.toBuffer();
  ctx.addFile(data, "assets", `${tag.characterId}.${format}`);
}

async function translateBitsJPEG2(ctx: OutputContext, tag: DefineBitsJPEG2Tag) {
  const image = sharp(tag.imageData);
  const { format } = await image.metadata();
  const data = await image.toBuffer();
  ctx.addFile(data, "assets", `${tag.characterId}.${format}`);
}

async function translateBitsJPEG3(ctx: OutputContext, tag: DefineBitsJPEG3Tag) {
  const image = sharp(tag.imageData);
  const { width, height } = await image.metadata();
  image.joinChannel(tag.alphaBitmapData, {
    raw: {
      width: width || 0,
      height: height || 0,
      channels: 1,
    },
  });

  const data = await image.png().toBuffer();
  ctx.addFile(data, "assets", `${tag.characterId}.png`);
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

  const image = sharp(buf, {
    raw: {
      width: tag.bitmapWidth,
      height: tag.bitmapHeight,
      channels: 4,
    },
  });
  const data = await image.png().toBuffer();
  ctx.addFile(data, "assets", `${tag.characterId}.png`);
}
