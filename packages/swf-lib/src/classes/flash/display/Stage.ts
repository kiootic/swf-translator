import { DisplayObjectContainer } from "./DisplayObjectContainer";
import { Application, Container } from "pixi.js";

export class Stage extends DisplayObjectContainer {
  readonly __app = new Application({ antialias: true });

  constructor() {
    super();
    this.__app.stage.addChild(this.__pixi);
    this.__app.stage.scale.set(1 / 20, 1 / 20);
  }
}
