import consola from "consola";
import { readFileSync } from "fs";
import { SWFFile } from "./format/swf";
import { UnknownTag } from "./format/tags/unknown";
import { OutputContext } from "./output/context";
import { translate } from "./translation";

export async function main(args: string[]) {
  if (args.length !== 2) {
    consola.error("usage: swf-translator <in swf> <out dir>");
    process.exit(1);
  }

  const inFile = args[0];
  const outDir = args[1];

  consola.info(`reading from ${inFile}...`);
  const buf = readFileSync(inFile);
  const file = new SWFFile(buf);

  const unknownTags = new Set(
    file.tags
      .map((tag) => (tag instanceof UnknownTag ? tag.code : 0))
      .filter((code) => code !== 0)
  );
  if (unknownTags.size > 0) {
    consola.warn(
      "unknown tags:",
      [...unknownTags].sort((a, b) => a - b).join(", ")
    );
  }

  consola.info(`translating...`);
  const ctx = new OutputContext();
  await translate(ctx, file);

  await ctx.writeTo(outDir);
  consola.success(`output written to ${outDir}`);
}

main(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((err) => {
    consola.error("unexpected error: ", err);
  });
