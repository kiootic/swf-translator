import consola from "consola";
import yargs from "yargs";
import { glob } from "glob";
import { join, dirname } from "path";
import { readFileSync, writeFileSync } from "fs";
import { SWFFile } from "./format/swf";
import { UnknownTag } from "./format/tags/unknown";
import { OutputContext } from "./output";
import { translateSWF } from "./translation";
import { Tag } from "./format/tag";
import { DefineSpriteTag } from "./format/tags/define-sprite";
import { File, parseAS3 } from "./as3/parse";
import mkdirp from "mkdirp";
import { translateAS3 } from "./translation/as3";

interface SWFArguments {
  inFile: string;
  outDir: string;
}

export async function buildSWF(args: SWFArguments) {
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
  await translateSWF(ctx, file);

  await ctx.writeTo(args.outDir);
  consola.success(`output written to ${args.outDir}`);
}

interface AS3Arguments {
  inDir: string;
  outDir: string;
}

export async function buildAS3(args: AS3Arguments) {
  consola.info(`reading from ${args.inDir}...`);

  const paths = await new Promise<string[]>((resolve, reject) =>
    glob("**/*.as", { cwd: args.inDir }, (err, paths) => {
      if (err) {
        reject(err);
      }
      resolve(paths);
    })
  );
  const files: File[] = [];
  for (const path of paths) {
    const src = readFileSync(join(args.inDir, path));
    files.push(parseAS3(path, src.toString("utf-8")));
  }

  consola.info(`translating...`);
  await translateAS3(files, args.outDir);
}

yargs
  .command(
    "build-swf <inFile> <outDir>",
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
      buildSWF(argv as SWFArguments)
        .then(() => process.exit(0))
        .catch((err) => {
          consola.error("unexpected error: ", err);
        });
    }
  )
  .command(
    "build-as3 <inDir> <outDir>",
    "transform as3 scripts",
    (builder) =>
      builder
        .positional("inDir", {
          type: "string",
          description: "input as3 directory",
        })
        .positional("outDir", {
          type: "string",
          description: "output directory",
        }),
    (argv) => {
      buildAS3(argv as AS3Arguments)
        .then(() => process.exit(0))
        .catch((err) => {
          consola.error("unexpected error: ", err);
        });
    }
  ).argv;
