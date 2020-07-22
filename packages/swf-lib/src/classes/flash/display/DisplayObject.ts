import { DisplayObject as PIXIDisplayObject } from "pixi.js";
import { EventDispatcher } from "../events/EventDispatcher";
import { Transform } from "../geom/Transform";

export class DisplayObject extends EventDispatcher {
  static readonly __pixiClass: new () => PIXIDisplayObject = PIXIDisplayObject;

  readonly __pixi: PIXIDisplayObject;
  __depth: number = -1;

  constructor() {
    super();
    this.__pixi = new (this.constructor as typeof DisplayObject).__pixiClass();
    this.__pixi.__flash = this;

    this.__pixi.interactive = false;
    this.__pixi.name = "";

    this.transform = new Transform(this);
  }

  readonly transform: Transform;

  get name(): string {
    return this.__pixi.name;
  }
  set name(value: string) {
    this.__pixi.name = value;
  }

  get parent(): DisplayObject | null {
    return this.__pixi.parent?.__flash ?? null;
  }

  get visible(): boolean {
    return this.__pixi.visible;
  }
  set visible(value: boolean) {
    this.__pixi.visible = value;
  }

  get x(): number {
    return this.__pixi.x;
  }
  set x(value: number) {
    this.__pixi.x = value;
  }

  get y(): number {
    return this.__pixi.y;
  }
  set y(value: number) {
    this.__pixi.y = value;
  }

  get scaleX(): number {
    return this.__pixi.scale.x;
  }
  set scaleX(value: number) {
    this.__pixi.scale.x = value;
  }

  get scaleY(): number {
    return this.__pixi.scale.y;
  }
  set scaleY(value: number) {
    this.__pixi.scale.y = value;
  }

  get width(): number {
    return 0;
  }
  set width(value: number) {}

  get height(): number {
    return 0;
  }
  set height(value: number) {}
}
