import { SWFFile } from "../../format/swf";
import { OutputContext } from "../../output";
import { SymbolClassTag } from "../../format/tags/symbol-class";

export async function translateLinkages(ctx: OutputContext, swf: SWFFile) {
  const index = ctx.file("characters", `index.js`);
  for (const tag of swf.tags) {
    if (tag instanceof SymbolClassTag) {
      for (const symbol of tag.symbols) {
        index.content.push(`
          bundle.linkages[${symbol.characterId}] = ${JSON.stringify(
          symbol.name
        )};`);
      }
    }
  }
}
