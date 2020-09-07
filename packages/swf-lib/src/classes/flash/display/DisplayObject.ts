import { mat2d, vec2 } from "gl-matrix";
import { CharacterInstance } from "../../../internal/character/CharacterInstance";
import { rect } from "../../../internal/math/rect";
import type { DisplayObjectContainer } from "./DisplayObjectContainer";
import type { Stage } from "./Stage";
import { EventDispatcher } from "../events/EventDispatcher";
import { Event } from "../events/Event";
import { Transform } from "../geom/Transform";
import { Point } from "../geom/Point";
import { BitmapFilter } from "../filters/BitmapFilter";
import { SceneNode } from "../../../internal/render2/SceneNode";

const tmpRect = rect.create();
const tmpVec2 = vec2.create();

interface CharacterInit<T> {
  fn: (char: T) => void;
}
let charInit: CharacterInit<any> | null = null;

export class DisplayObject extends EventDispatcher {
  __character: CharacterInstance | null = null;
  __depth: number = -1;
  __clipDepth: number = -1;

  readonly __node = new SceneNode();

  static __initChar<T>(fn: () => T, init: (char: T) => void): T {
    charInit = { fn: init };
    return fn();
  }

  constructor() {
    super();
    this.transform = new Transform();
    this.transform.__setNode(this.__node);

    if (charInit) {
      charInit.fn(this);
      charInit = null;
    }
  }

  readonly transform: Transform;

  name: string = "";

  get visible() {
    return this.__node.visible;
  }
  set visible(value) {
    this.__node.visible = value;
  }

  private __parent: DisplayObjectContainer | null = null;

  get parent() {
    return this.__parent;
  }
  set parent(value) {
    const oldStage = this.stage;
    this.__parent = value;
    const newStage = this.stage;

    if (newStage && newStage !== oldStage) {
      this.__onAddToStage();
    }
    this.__setEventParent(this.parent);
  }

  get stage(): Stage | null {
    return this.parent?.stage ?? null;
  }

  private __filters: BitmapFilter[] = [];

  get filters() {
    return this.__filters;
  }

  set filters(value) {
    this.__filters = value;
    this.__node.filters = value.map((f) => f.__filter);
    this.__node.markRenderDirty();
  }

  get cacheAsBitmap() {
    return this.__node.cacheAsBitmap; // || this.__node.filters.length > 0;
  }
  set cacheAsBitmap(value) {
    this.__node.cacheAsBitmap = value;
  }

  get x(): number {
    return this.__node.transformLocal[4];
  }
  set x(value: number) {
    if (this.__node.transformLocal[4] !== value) {
      this.__node.transformLocal[4] = value;
      this.__node.markTransformDirty();
    }
  }

  get y(): number {
    return this.__node.transformLocal[5];
  }
  set y(value: number) {
    if (this.__node.transformLocal[5] !== value) {
      this.__node.transformLocal[5] = value;
      this.__node.markTransformDirty();
    }
  }

  get scaleX(): number {
    return this.__node.transformLocal[0];
  }
  set scaleX(value: number) {
    if (this.__node.transformLocal[0] !== value) {
      this.__node.transformLocal[0] = value;
      this.__node.markTransformDirty();
    }
  }

  get scaleY(): number {
    return this.__node.transformLocal[3];
  }
  set scaleY(value: number) {
    if (this.__node.transformLocal[3] !== value) {
      this.__node.transformLocal[3] = value;
      this.__node.markTransformDirty();
    }
  }

  get rotation(): number {
    const angle = Math.atan2(
      this.__node.transformLocal[1],
      this.__node.transformLocal[3]
    );
    return (angle * 180) / Math.PI;
  }
  set rotation(value: number) {
    const rotation = this.rotation;
    const delta = ((value - rotation) / 180) * Math.PI;
    if (delta !== 0) {
      mat2d.rotate(
        this.__node.transformLocal,
        this.__node.transformLocal,
        delta
      );
      this.__node.markTransformDirty();
    }
  }

  get width(): number {
    this.__node.ensureLocalBounds();
    return this.__node.boundsLocal[2] * this.__node.transformLocal[0];
  }
  set width(value: number) {
    this.__node.ensureLocalBounds();
    const scaleX =
      this.__node.boundsLocal[2] === 0 ? 1 : value / this.__node.boundsLocal[2];
    if (this.__node.transformLocal[0] !== scaleX) {
      this.__node.transformLocal[0] = scaleX;
      this.__node.markTransformDirty();
    }
  }

  get height(): number {
    this.__node.ensureLocalBounds();
    return this.__node.boundsLocal[3] * this.__node.transformLocal[3];
  }
  set height(value: number) {
    this.__node.ensureLocalBounds();
    const scaleY =
      this.__node.boundsLocal[3] === 0 ? 1 : value / this.__node.boundsLocal[3];
    if (this.__node.transformLocal[3] !== scaleY) {
      this.__node.transformLocal[3] = scaleY;
      this.__node.markTransformDirty();
    }
  }

  get mouseX(): number {
    const stage = this.stage;
    if (!stage) {
      return 0;
    }
    this.__globalToLocal(tmpVec2, stage.__mousePosition, true);
    return tmpVec2[0];
  }

  get mouseY(): number {
    const stage = this.stage;
    if (!stage) {
      return 0;
    }
    this.__globalToLocal(tmpVec2, stage.__mousePosition, true);
    return tmpVec2[1];
  }

  __globalToLocal(out: vec2, pt: vec2, ensure: boolean) {
    if (ensure) {
      this.__node.ensureWorldTransform();
    }
    vec2.transformMat2d(out, pt, this.__node.transformWorldInvert);
  }

  globalToLocal(point: Point): Point {
    const local = new Point();
    this.__globalToLocal(local.__value, point.__value, true);
    return local;
  }

  hitTestPoint(x: number, y: number, shapeFlag = false): boolean {
    this.__node.ensureWorldTransform();
    vec2.transformMat2d(tmpVec2, [x, y], this.__node.transformWorld);
    return this.__node.hitTest(tmpVec2, shapeFlag);
  }

  hitTestObject(obj: DisplayObject): boolean {
    obj.__node.ensureWorldTransform();
    obj.__node.ensureLocalBounds();
    this.__node.ensureWorldTransform();
    this.__node.ensureLocalBounds();
    rect.apply(
      tmpRect,
      obj.__node.boundsLocal,
      obj.__node.transformWorldInvert
    );
    rect.apply(tmpRect, tmpRect, this.__node.transformWorld);
    return rect.intersects(tmpRect, this.__node.boundsLocal);
  }

  __onFrameEnter() {
    this.dispatchEvent(new Event(Event.ENTER_FRAME, false));
  }

  __onFrameConstruct() {}

  __onFrameExit() {}

  __onAddToStage() {
    this.dispatchEvent(new Event(Event.ADDED_TO_STAGE, false, false));
  }
}
