import consola from "consola";
import yargs from "yargs";
import { readFileSync } from "fs";
import { SWFFile } from "./format/swf";
import { UnknownTag } from "./format/tags/unknown";
import { OutputContext } from "./output";
import { translate } from "./translation";
import { Tag } from "./format/tag";
import { DefineSpriteTag } from "./format/tags/define-sprite";

interface Arguments {
  inFile: string;
  outDir: string;
}

export async function main(args: Arguments) {
  consola.info(`reading from ${args.inFile}...`);
  const buf = readFileSync(args.inFile);
  const file = new SWFFile(buf);

  const unknownTags = new Set<number>();
  const populateUnknownTags = (tags: Tag[]) => {
    for (const tag of tags) {
      if (tag instanceof UnknownTag) {
        unknownTags.add(tag.code);
      } else if (tag instanceof DefineSpriteTag) {
        populateUnknownTags(tag.controlTags);
      }
    }
  };
  populateUnknownTags(file.tags);
  if (unknownTags.size > 0) {
    consola.warn(
      "unknown tags:",
      [...unknownTags].sort((a, b) => a - b).join(", ")
    );
  }

  consola.info(`translating...`);
  const ctx = new OutputContext();
  await translate(ctx, file);

  await ctx.writeTo(args.outDir);
  consola.success(`output written to ${args.outDir}`);
}

yargs.command(
  "build <inFile> <outDir>",
  "transform swf file",
  (builder) =>
    builder
      .positional("inFile", {
        type: "string",
        description: "input swf file",
      })
      .positional("outDir", {
        type: "string",
        description: "output directory",
      }),
  (argv) => {
    main(argv as Arguments)
      .then(() => process.exit(0))
      .catch((err) => {
        consola.error("unexpected error: ", err);
      });
  }
).argv;
