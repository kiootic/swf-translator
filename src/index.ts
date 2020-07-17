import { readFileSync } from "fs";
import { SWFFile } from "./format/swf";
import { UnknownTag } from "./format/tags/unknown";
import { OutputContext } from "./output/context";

export function main(args: string[]) {
  if (args.length !== 2) {
    console.error("usage: swf-translator <in swf> <out dir>");
    process.exit(1);
  }

  const buf = readFileSync(args[0]);
  const file = new SWFFile(buf);

  const unknownTags = new Set(
    file.tags
      .map((tag) => (tag instanceof UnknownTag ? tag.code : 0))
      .filter((code) => code !== 0)
  );
  if (unknownTags.size > 0) {
    console.warn(
      "unknown tags:",
      [...unknownTags].sort((a, b) => a - b)
    );
  }

  const ctx = new OutputContext();

  const outDir = args[1];
  ctx.writeTo(outDir);
  console.log(`output written to ${outDir}`);
}

main(process.argv.slice(2));
