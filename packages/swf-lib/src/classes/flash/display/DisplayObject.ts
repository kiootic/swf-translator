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
import { SceneNode } from "../../../internal/render2/SceneNode";
import { pixelToTwips, twipsToPixel } from "../../../internal/twips";
import {
  compose,
  MatrixComposition,
  reduceAngle,
} from "../../../internal/math/matrix";
import { fpMat, fpMatMul } from "../../../internal/fp16";
import { bounds } from "../../../internal/math/bounds";

const tmpBounds = bounds.create();
const tmpVec2 = vec2.create();
const tmpMat2d = mat2d.create();

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
  __scaleSkews: MatrixComposition = {
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
  };

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
    return twipsToPixel(this.__node.transformLocal[4]);
  }
  set x(value: number) {
    value = pixelToTwips(value);
    if (this.__node.transformLocal[4] !== value) {
      this.__node.transformLocal[4] = value;
      this.__node.markLayoutDirty();
    }
  }

  get y(): number {
    return twipsToPixel(this.__node.transformLocal[5]);
  }
  set y(value: number) {
    value = pixelToTwips(value);
    if (this.__node.transformLocal[5] !== value) {
      this.__node.transformLocal[5] = value;
      this.__node.markLayoutDirty();
    }
  }

  get scaleX(): number {
    return this.__scaleSkews.scaleX;
  }
  set scaleX(value: number) {
    this.__scaleSkews.scaleX = value;
    if (compose(this.__node.transformLocal, this.__scaleSkews)) {
      this.transform.matrix.__fromMat2d(this.__node.transformLocal);
      this.__node.markLayoutDirty();
    }
  }

  get scaleY(): number {
    return this.__scaleSkews.scaleY;
  }
  set scaleY(value: number) {
    this.__scaleSkews.scaleY = value;
    if (compose(this.__node.transformLocal, this.__scaleSkews)) {
      this.transform.matrix.__fromMat2d(this.__node.transformLocal);
      this.__node.markLayoutDirty();
    }
  }

  get rotation(): number {
    return reduceAngle((this.__scaleSkews.skewY * 180) / Math.PI);
  }
  set rotation(value: number) {
    const delta = (value / 180) * Math.PI - this.__scaleSkews.skewY;
    this.__scaleSkews.skewX += delta;
    this.__scaleSkews.skewY += delta;
    if (compose(this.__node.transformLocal, this.__scaleSkews)) {
      this.transform.matrix.__fromMat2d(this.__node.transformLocal);
      this.__node.markLayoutDirty();
    }
  }

  get width(): number {
    if (this.parent) {
      return this.getBounds(this.parent).width;
    } else {
      this.__node.ensureLayout();
      this.__node.ensureBounds();
      return twipsToPixel(
        this.__node.boundsLocal[2] - this.__node.boundsLocal[0]
      );
    }
  }
  set width(value: number) {
    this.__node.ensureLayout();
    this.__node.ensureBounds();
    value = pixelToTwips(value);

    // https://github.com/ruffle-rs/ruffle/blob/ed4d51dfc1b28e2547925e927a94fffabcdb994f/core/src/display_object.rs#L556
    const width = this.__node.bounds[2] - this.__node.bounds[0];
    const height = this.__node.bounds[3] - this.__node.bounds[1];
    const aspectRatio = height / width;
    const targetScaleX = width === 0 ? 0 : value / width;
    const targetScaleY = height === 0 ? 0 : value / height;

    const cos = Math.abs(Math.cos(this.__scaleSkews.skewY));
    const sin = Math.abs(Math.sin(this.__scaleSkews.skewY));
    const newScaleX =
      (aspectRatio * (cos * targetScaleX + sin * targetScaleY)) /
      ((cos + aspectRatio * sin) * (aspectRatio * cos + sin));
    const newScaleY =
      (sin * this.__scaleSkews.scaleX +
        aspectRatio * cos * this.__scaleSkews.scaleY) /
      (aspectRatio * cos + sin);
    this.__scaleSkews.scaleX = newScaleX;
    this.__scaleSkews.scaleY = newScaleY;

    if (compose(this.__node.transformLocal, this.__scaleSkews)) {
      this.transform.matrix.__fromMat2d(this.__node.transformLocal);
      this.__node.markLayoutDirty();
    }
  }

  get height(): number {
    if (this.parent) {
      return this.getBounds(this.parent).height;
    } else {
      this.__node.ensureLayout();
      this.__node.ensureBounds();
      return twipsToPixel(
        this.__node.boundsLocal[3] - this.__node.boundsLocal[1]
      );
    }
  }
  set height(value: number) {
    this.__node.ensureLayout();
    this.__node.ensureBounds();
    value = pixelToTwips(value);

    // https://github.com/ruffle-rs/ruffle/blob/ed4d51dfc1b28e2547925e927a94fffabcdb994f/core/src/display_object.rs#L556
    const width = this.__node.bounds[2] - this.__node.bounds[0];
    const height = this.__node.bounds[3] - this.__node.bounds[1];
    const aspectRatio = width / height;
    const targetScaleX = width === 0 ? 0 : value / width;
    const targetScaleY = height === 0 ? 0 : value / height;

    const cos = Math.abs(Math.cos(this.__scaleSkews.skewY));
    const sin = Math.abs(Math.sin(this.__scaleSkews.skewY));
    const newScaleX =
      (aspectRatio * cos * this.__scaleSkews.scaleX +
        sin * this.__scaleSkews.scaleY) /
      (aspectRatio * cos + sin);
    const newScaleY =
      (aspectRatio * (sin * targetScaleX + cos * targetScaleY)) /
      ((cos + aspectRatio * sin) * (aspectRatio * cos + sin));
    this.__scaleSkews.scaleX = newScaleX;
    this.__scaleSkews.scaleY = newScaleY;

    if (compose(this.__node.transformLocal, this.__scaleSkews)) {
      this.transform.matrix.__fromMat2d(this.__node.transformLocal);
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
    out[0] = pixelToTwips(pt[0]);
    out[1] = pixelToTwips(pt[1]);
    vec2.transformMat2d(out, out, this.__node.transformWorldInvert);
    out[0] = twipsToPixel(out[0]);
    out[1] = twipsToPixel(out[1]);
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
    this.__node.ensureBounds();
    obj.__node.ensureBounds();
    return bounds.intersects(obj.__node.boundsWorld, this.__node.boundsWorld);
  }

  getBounds(obj: DisplayObject): Rectangle {
    this.__node.ensureLayout();
    obj.__node.ensureLayout();
    this.__node.ensureBounds();
    obj.__node.ensureBounds();
    fpMatMul(
      tmpMat2d,
      obj.__node.transformWorldInvert,
      this.__node.transformWorld
    );
    bounds.apply(tmpBounds, this.__node.bounds, tmpMat2d);
    const result = new Rectangle();
    result.x = twipsToPixel(tmpBounds[0]);
    result.y = twipsToPixel(tmpBounds[1]);
    result.width = twipsToPixel(tmpBounds[2] - tmpBounds[0]);
    result.height = twipsToPixel(tmpBounds[3] - tmpBounds[1]);
    return result;
  }

  __initFrame(stage: Stage, isRoot: boolean) {}

  __onRender() {}

  __onAddedToStage(stage: Stage) {
    this.dispatchEvent(new Event(Event.ADDED_TO_STAGE, false, false));
  }

  __onRemovedFromStage(stage: Stage) {
    this.dispatchEvent(new Event(Event.REMOVED_FROM_STAGE, false, false));
  }
}
