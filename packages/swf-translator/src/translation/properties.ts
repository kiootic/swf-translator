import { OutputContext } from "../output";
import { SWFFile } from "../format/swf";
import { SetBackgroundColorTag } from "../format/tags/set-background-color";

export async function generateProperties(ctx: OutputContext, swf: SWFFile) {
  const bgColor = swf.tags.find(
    (t): t is SetBackgroundColorTag => t instanceof SetBackgroundColorTag
  )?.backgroundColor ?? { red: 255, green: 255, blue: 255 };

  const props = {
    width: swf.frameSize.xMax - swf.frameSize.xMin,
    height: swf.frameSize.yMax - swf.frameSize.yMin,
    fps: swf.frameRate,
    backgroundColor:
      (bgColor.red << 16) | (bgColor.green << 8) | (bgColor.blue << 0),
  };

  const properties = ctx.file("properties.json");
  properties.content.push(JSON.stringify(props));
}
