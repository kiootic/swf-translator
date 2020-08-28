import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output";
import { SymbolClassTag } from "../../format/tags/symbol-class";

export async function translateLinkages(ctx: OutputContext, swf: SWFFile) {
  const linkage: Record<number, string> = {};
  for (const tag of swf.tags) {
    if (tag instanceof SymbolClassTag) {
      for (const symbol of tag.symbols) {
        linkage[symbol.characterId] = symbol.name;
      }
    }
  }
  return linkage;
}
