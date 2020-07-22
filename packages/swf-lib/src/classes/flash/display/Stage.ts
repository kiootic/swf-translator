import {
  Application,
  Ticker,
  DisplayObject as PIXIDisplayObject,
  Container,
  Rectangle,
} from "pixi.js";
import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { Properties } from "../../_internal/Properties";
import type { DisplayObject } from "./DisplayObject";

export class Stage extends DisplayObjectContainer {
  readonly __app = new Application({ antialias: true });
  readonly __displayList = new Set<DisplayObject>();

  constructor(properties?: Properties) {
    super();
    this.__app.stage.addChild(this.__pixi);
    this.__app.stage.scale.set(1 / 20, 1 / 20);

    if (properties) {
      const { width, height, backgroundColor, fps } = properties;
      this.__app.renderer.backgroundColor = backgroundColor;
      this.__app.renderer.resize(width / 20, height / 20);
      this.__app.ticker.maxFPS = fps;
    }

    this.__app.ticker.add(this.#onFrame);

    this.__pixi.addListener("childAdded", updateStage);
  }

  #onFrame = () => {
    for (const dispObject of this.__displayList) {
      dispObject.__onNewFrame();
    }
    this.#updateCull();
  };

  #updateCull = () => {
    const bounds = this.__app.screen;

    for (const dispObject of this.__displayList) {
      dispObject.__pixi.visible = true;
    }

    this.__pixi.updateTransform();
    this.__pixi.calculateBounds();

    for (const dispObject of this.__displayList) {
      const objBounds = dispObject.__pixi.getBounds(true);
      const inBounds =
        objBounds.left < bounds.right &&
        objBounds.right > bounds.left &&
        objBounds.top < bounds.bottom &&
        objBounds.bottom > bounds.top;

      dispObject.__pixi.visible = inBounds && dispObject.visible;
    }
  };
}

function updateStage(child: PIXIDisplayObject) {
  if (child instanceof Container) {
    child.addListener("childAdded", updateStage);
    for (const obj of child.children) {
      updateStage(obj);
    }
  }

  if (child.__flash) {
    let root = child.__flash.parent;
    while (root && root.parent) {
      root = root.parent;
    }
    if (root instanceof Stage) {
      child.__flash.stage = root;
    } else {
      child.__flash.stage = null;
    }
  }
}
