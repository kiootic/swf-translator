import { DisplayObject } from "./DisplayObject";
import { InteractiveObject } from "./InteractiveObject";

export class DisplayObjectContainer extends InteractiveObject {
  __children!: DisplayObject[];

  constructor() {
    super();
    this.__children = this.__children ?? [];
  }

  get numChildren(): number {
    return this.__children.length;
  }

  addChild(child: DisplayObject) {
    child.parent?.removeChild(child);

    this.__children.push(child);
    child.parent = this;
    child.__node.setParent(this.__node, this.__node.children.length);
    return child;
  }

  addChildAt(child: DisplayObject, index: number) {
    child.parent?.removeChild(child);

    this.__children.splice(index, 0, child);
    child.parent = this;
    child.__node.setParent(this.__node, index);
    return child;
  }

  getChildByName(name: string) {
    return this.__children.find((c) => c.name === name) ?? null;
  }

  getChildAt(index: number) {
    return this.__children[index] ?? null;
  }

  removeChild(child: DisplayObject) {
    const i = this.__children.indexOf(child);
    if (i < 0) {
      return null;
    }
    this.__children.splice(i, 1);
    child.parent = null;
    child.__node.setParent(null, 0);
    return child;
  }

  removeChildAt(index: number) {
    const child = this.__children.splice(index, 1)[0] ?? null;
    if (child) {
      child.parent = null;
      child.__node.setParent(null, 0);
    }
    return child;
  }

  removeChildren(beginIndex = 0, endIndex = this.__children.length) {
    const removedChildren = this.__children.splice(
      beginIndex,
      endIndex - beginIndex
    );
    for (const child of removedChildren) {
      child.parent = null;
      child.__node.setParent(null, 0);
    }
  }

  contains(child: DisplayObject) {
    return this.__children.includes(child);
  }

  __onAddToStage() {
    for (const child of this.__children) {
      child.__onAddToStage();
    }
    super.__onAddToStage();
  }

  __onRender() {
    super.__onRender();
    for (const child of this.__children) {
      child.__onRender();
    }
  }

  __getChildren(list: DisplayObject[]) {
    for (const child of this.__children) {
      list.push(child);
    }
  }
}
