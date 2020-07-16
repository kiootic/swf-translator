import { readFileSync } from "fs";
import { SWFFile } from "./format/swf";

export function main(args: string[]) {
  if (args.length !== 2) {
    console.error("usage: swf-translator <in swf> <out dir>");
    process.exit(1);
  }

  const buf = readFileSync(args[0]);
  const file = new SWFFile(buf);
  console.log(file);
}

main(process.argv.slice(2));
