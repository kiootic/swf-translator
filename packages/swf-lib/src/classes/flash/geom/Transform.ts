import { mat2d, vec4 } from "gl-matrix";
import { createAtom, computed } from "mobx";
import { Matrix } from "./Matrix";
import { ColorTransform } from "./ColorTransform";

export class Transform {
  static readonly __empty = new Transform();

  #matrix = new Matrix();
  #matrixAtom = createAtom("matrix");
  #worldMatrix = new Matrix();
  #worldMatrixAtom = createAtom("worldMatrix");

  #colorTransform = new ColorTransform();
  #colorTransformAtom = createAtom("colorTransform");
  #worldColorTransform = new ColorTransform();
  #worldColorTransformAtom = createAtom("worldColorTransform");

  get matrix() {
    this.#matrixAtom.reportObserved();
    return this.#matrix;
  }
  set matrix(value) {
    this.#matrix = value;
    this.#matrixAtom.reportChanged();
  }

  @computed
  get __matrixInverted() {
    const mat = mat2d.create();
    mat2d.invert(mat, this.matrix.__value);
    return mat;
  }

  get __worldMatrix() {
    this.#worldMatrixAtom.reportObserved();
    return this.#worldMatrix;
  }
  set __worldMatrix(value) {
    this.#worldMatrix = value;
    this.#worldMatrixAtom.reportChanged();
  }

  @computed
  get __worldMatrixInverted() {
    const mat = mat2d.create();
    mat2d.invert(mat, this.__worldMatrix.__value);
    return mat;
  }

  get colorTransform() {
    this.#colorTransformAtom.reportObserved();
    this.#colorTransform.__atom.reportObserved();
    return this.#colorTransform;
  }
  set colorTransform(value) {
    this.#colorTransform = value;
    this.#colorTransformAtom.reportChanged();
  }

  get __worldColorTransform() {
    this.#worldColorTransformAtom.reportObserved();
    this.#worldColorTransform.__atom.reportObserved();
    return this.#worldColorTransform;
  }
  set __worldColorTransform(value) {
    this.#worldColorTransform = value;
    this.#worldColorTransformAtom.reportChanged();
  }

  __reportMatrixUpdated() {
    this.#matrixAtom.reportChanged();
  }

  __reportWorldMatrixUpdated() {
    this.#worldMatrixAtom.reportChanged();
  }

  __reportColorTransformUpdated() {
    this.#colorTransformAtom.reportChanged();
  }

  __reportWorldColorTransformUpdated() {
    this.#worldColorTransformAtom.reportChanged();
  }

  __update(parent: Transform): boolean {
    let isDirty = false;

    parent.#worldMatrixAtom.reportObserved();
    parent.#worldColorTransformAtom.reportObserved();
    this.#matrixAtom.reportObserved();
    this.#colorTransformAtom.reportObserved();

    const oldMatrix = mat2d.copy(mat2d.create(), this.#worldMatrix.__value);
    mat2d.mul(
      this.#worldMatrix.__value,
      parent.#worldMatrix.__value,
      this.#matrix.__value
    );
    if (!mat2d.equals(oldMatrix, this.#worldMatrix.__value)) {
      this.#worldMatrixAtom.reportChanged();
      isDirty = true;
    }

    const oldColorMul = vec4.copy(
      vec4.create(),
      this.#worldColorTransform.__mul
    );
    const oldColorAdd = vec4.copy(
      vec4.create(),
      this.#worldColorTransform.__add
    );
    this.#worldColorTransform.__concat(
      this.#colorTransform,
      parent.#worldColorTransform
    );
    if (
      !vec4.equals(oldColorMul, this.#worldColorTransform.__mul) ||
      !vec4.equals(oldColorAdd, this.#worldColorTransform.__add)
    ) {
      this.#worldColorTransformAtom.reportChanged();
      isDirty = true;
    }

    return isDirty;
  }
}
