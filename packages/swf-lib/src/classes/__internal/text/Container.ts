import { action, autorun, computed, observable } from "mobx";
import { TextFormat } from "../../flash/text/TextFormat";
import { TextFormatAlign } from "../../flash/text";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";
import { TextSegment } from "./TextSegment";
import { layout } from "./layout";
import { rect } from "../../../internal/math/rect";

const htmlParser = new DOMParser();

export class Container {
  @observable.shallow
  segments: TextSegment[] = [];

  @observable
  readonly htmlRoot = htmlParser.parseFromString("<root />", "text/xml")
    .documentElement;

  @observable
  defaultTextFormat = new TextFormat();

  @observable
  wordWrap = false;

  @observable
  multiline = false;

  @observable.ref
  bounds: rect = rect.create();

  @observable.ref
  textBounds: rect = rect.create();

  @observable.ref
  renderObjects: RenderObjectSprite[] = [];

  @computed
  get text(): string {
    return this.segments.map((s) => s.text).join("");
  }

  @computed
  get htmlText(): string {
    return this.htmlRoot.innerHTML;
  }

  setText(text: string) {
    this.htmlRoot.textContent = text;
    this.parseHTML();
  }

  setHTMLText(html: string) {
    try {
      this.htmlRoot.innerHTML = html;
    } catch {}
    this.parseHTML();
  }

  @action
  parseHTML() {
    const walker = this.htmlRoot.ownerDocument.createTreeWalker(
      this.htmlRoot,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
    );

    let currentSegment: TextSegment = {
      format: this.defaultTextFormat.__clone(),
      text: "",
    };
    const segmentStack = [currentSegment];
    const segments: TextSegment[] = [];

    const beginElement = (element: Element) => {
      const format = currentSegment.format.__clone();
      let text = "";
      switch (element.tagName.toLowerCase()) {
        case "b":
          format.bold = true;
          break;
        case "br":
          text = "\n";
          break;
        case "font":
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            switch (attr.name.toLowerCase()) {
              case "color":
                if (/^#[0-9a-fA-F]{6}$/.test(attr.value)) {
                  format.color = parseInt(attr.value.slice(1), 16) + 0xff000000;
                }
                break;
              case "face":
                format.font = attr.value;
                break;
              case "size":
                if (/^\d+$/.test(attr.value)) {
                  format.size = Number(attr.value);
                }
                break;
            }
          }
          break;
        case "i":
          format.italic = true;
          break;
        case "p":
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            switch (attr.name.toLowerCase()) {
              case "align":
                switch (attr.value) {
                  case "left":
                    format.align = TextFormatAlign.LEFT;
                    break;
                  case "right":
                    format.align = TextFormatAlign.RIGHT;
                    break;
                  case "justify":
                    format.align = TextFormatAlign.JUSTIFY;
                    break;
                  case "center":
                    format.align = TextFormatAlign.CENTER;
                    break;
                }
                break;
            }
            break;
          }
          break;
      }

      currentSegment = { format, text };
      segmentStack.push(currentSegment);
      segments.push(currentSegment);
    };

    const endElement = (element: Element) => {
      segmentStack.pop();
      currentSegment = segmentStack[segmentStack.length - 1];
    };

    const onText = (text: Text) => {
      currentSegment.text += text.textContent;
    };

    let node: Node | null = walker.root;
    while (node) {
      if (node instanceof Text) {
        onText(node);
      } else if (node instanceof Element) {
        beginElement(node);
      }

      let nextNode: Node | null;
      if ((nextNode = walker.firstChild())) {
        node = nextNode;
        continue;
      } else if ((nextNode = walker.nextSibling())) {
        node = nextNode;
        continue;
      }

      while ((nextNode = walker.parentNode())) {
        if (nextNode instanceof Element) {
          endElement(nextNode);
        }
        if ((nextNode = walker.nextSibling())) {
          break;
        }
      }
      if (!nextNode && node instanceof Element) {
        endElement(node);
      }
      node = nextNode;
    }

    this.segments = segments.filter((s) => s.text.length > 0);
  }

  #layout = autorun(() => {
    const result = layout(
      this.segments,
      this.bounds,
      this.wordWrap,
      this.multiline
    );
    this.textBounds = result.bounds;
    this.renderObjects = result.renderObjects;
  });
}
