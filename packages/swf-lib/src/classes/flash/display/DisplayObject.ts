import { mat2d, vec2 } from "gl-matrix";
import { CharacterInstance } from "../../../internal/character/CharacterInstance";
import { rect } from "../../../internal/math/rect";
import type { DisplayObjectContainer } from "./DisplayObjectContainer";
import type { Stage } from "./Stage";
import { EventDispatcher } from "../events/EventDispatcher";
import { Event } from "../events/Event";
import { Transform } from "../geom/Transform";
import { Point } from "../geom/Point";
import { Rectangle } from "../geom/Rectangle";
import { BitmapFilter } from "../filters/BitmapFilter";
import { SceneNode, roundTwips } from "../../../internal/render2/SceneNode";

const tmpRect = rect.create();
const tmpVec2 = vec2.create();

interface CharacterInit<T> {
  fn: (char: T) => void;
}
let charInit: CharacterInit<any> | null = null;

export class DisplayObject extends EventDispatcher {
  private __parent!: DisplayObjectContainer | null;
  __character!: CharacterInstance | null;
  __depth!: number;
  __clipDepth!: number;
  transform!: Transform;
  name!: string;
  private __mask!: DisplayObject | null;
  private __maskRefs!: number;
  private __filters!: BitmapFilter[];

  __node!: SceneNode;

  static __initChar<T>(fn: () => T, init: (char: T) => void): T {
    charInit = { fn: init };
    return fn();
  }

  // @ts-ignore
  constructor() {
    const initChar = charInit;
    charInit = null;
    super();
    initChar?.fn(this);
  }

  __preInit() {
    this.__character = null;
    this.__depth = -1;
    this.__clipDepth = -1;
    this.__parent = null;
    this.name = "";
    this.__mask = null;
    this.__maskRefs = 0;
    this.__filters = [];

    this.__node = new SceneNode(this);
    this.transform = new Transform();
    this.transform.__setNode(this.__node);
    super.__preInit();
  }

  get visible() {
    return this.__node.visible;
  }
  set visible(value) {
    this.__node.visible = value;
  }

  get parent() {
    return this.__parent;
  }
  set parent(value) {
    const oldStage = this.stage;
    this.__parent = value;
    const newStage = this.stage;

    if (newStage !== oldStage) {
      if (newStage) {
        newStage.__displayListDirty = true;
        this.__onAddedToStage(newStage);
      } else if (oldStage) {
        this.__onRemovedFromStage(oldStage);
      }
    }
    this.__setEventParent(this.parent);
  }

  get stage(): Stage | null {
    return this.parent?.stage ?? null;
  }

  get mask() {
    return this.__mask;
  }

  set mask(value) {
    if (this.__mask) {
      this.__mask.__maskRefs--;
      this.__mask.__node.isMask = this.__mask.__maskRefs > 0;
    }

    this.__mask = value;
    this.__node.mask = value?.__node ?? null;
    this.__node.markRenderDirty();

    if (this.__mask) {
      this.__mask.__maskRefs++;
      this.__mask.__node.isMask = this.__mask.__maskRefs > 0;
    }
  }

  get filters() {
    return this.__filters;
  }

  set filters(value) {
    this.__filters = value;
    this.__node.filters = value
      .map((f) => f.__filter)
      .filter((f) => f.filter.isEffective(f));
    this.__node.markRenderDirty();
  }

  get cacheAsBitmap() {
    return this.__node.cacheAsBitmap || this.__node.filters.length > 0;
  }
  set cacheAsBitmap(value) {
    this.__node.cacheAsBitmap = value;
  }

  get x(): number {
    return this.__node.transformLocal[4];
  }
  set x(value: number) {
    value = roundTwips(value);
    if (this.__node.transformLocal[4] !== value) {
      this.__node.transformLocal[4] = value;
      this.__node.markLayoutDirty();
    }
  }

  get y(): number {
    return this.__node.transformLocal[5];
  }
  set y(value: number) {
    value = roundTwips(value);
    if (this.__node.transformLocal[5] !== value) {
      this.__node.transformLocal[5] = value;
      this.__node.markLayoutDirty();
    }
  }

  get scaleX(): number {
    return this.__node.transformLocal[0];
  }
  set scaleX(value: number) {
    if (this.__node.transformLocal[0] !== value) {
      this.__node.transformLocal[0] = value;
      this.__node.markLayoutDirty();
    }
  }

  get scaleY(): number {
    return this.__node.transformLocal[3];
  }
  set scaleY(value: number) {
    if (this.__node.transformLocal[3] !== value) {
      this.__node.transformLocal[3] = value;
      this.__node.markLayoutDirty();
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
      this.__node.markLayoutDirty();
    }
  }

  get width(): number {
    this.__node.ensureLayout();
    return Math.abs(this.__node.boundsLocal[2] * this.__node.transformLocal[0]);
  }
  set width(value: number) {
    if (value < 0) {
      return;
    }
    this.__node.ensureLayout();
    let scaleX =
      this.__node.boundsLocal[2] === 0 ? 1 : value / this.__node.boundsLocal[2];
    if (this.__node.transformLocal[0] !== 0) {
      scaleX *= Math.sign(this.__node.transformLocal[0]);
    }
    if (this.__node.transformLocal[0] !== scaleX) {
      this.__node.transformLocal[0] = scaleX;
      this.__node.markLayoutDirty();
    }
  }

  get height(): number {
    this.__node.ensureLayout();
    return this.__node.boundsLocal[3] * this.__node.transformLocal[3];
  }
  set height(value: number) {
    if (value < 0) {
      return;
    }
    this.__node.ensureLayout();
    let scaleY =
      this.__node.boundsLocal[3] === 0 ? 1 : value / this.__node.boundsLocal[3];
    if (this.__node.transformLocal[3] !== 0) {
      scaleY *= Math.sign(this.__node.transformLocal[3]);
    }
    if (this.__node.transformLocal[3] !== scaleY) {
      this.__node.transformLocal[3] = scaleY;
      this.__node.markLayoutDirty();
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
      this.__node.ensureLayout();
    }
    vec2.transformMat2d(out, pt, this.__node.transformWorldInvert);
  }

  globalToLocal(point: Point): Point {
    const local = new Point();
    this.__globalToLocal(local.__value, point.__value, true);
    return local;
  }

  hitTestPoint(x: number, y: number, shapeFlag = false): boolean {
    if (!this.visible) {
      return false;
    }
    this.__node.ensureLayout();
    vec2.set(tmpVec2, x, y);
    return this.__node.hitTest(tmpVec2, shapeFlag);
  }

  hitTestObject(obj: DisplayObject): boolean {
    this.__node.ensureLayout();
    obj.__node.ensureLayout();
    return rect.intersects(obj.__node.boundsWorld, this.__node.boundsWorld);
  }

  getBounds(obj: DisplayObject): Rectangle {
    this.__node.ensureLayout();
    obj.__node.ensureLayout();
    const result = new Rectangle();
    rect.apply(
      result.__rect,
      this.__node.boundsWorld,
      obj.__node.transformWorldInvert
    );
    return result;
  }

  __initFrame(stage: Stage) {}

  __onRender() {}

  __onAddedToStage(stage: Stage) {
    this.dispatchEvent(new Event(Event.ADDED_TO_STAGE, false, false));
  }

  __onRemovedFromStage(stage: Stage) {
    this.dispatchEvent(new Event(Event.REMOVED_FROM_STAGE, false, false));
  }
}
