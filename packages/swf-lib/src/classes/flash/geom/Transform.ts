import { createAtom } from "mobx";
import { Matrix } from "./Matrix";

export class Transform {
  #matrix = new Matrix();
  #matrixAtom = createAtom("matrix");
  #worldMatrix = new Matrix();
  #worldMatrixAtom = createAtom("worldMatrix");

  get matrix() {
    this.#matrixAtom.reportObserved();
    return this.#matrix;
  }
  set matrix(value) {
    this.#matrix = value;
    this.#matrixAtom.reportChanged();
  }

  get __worldMatrix() {
    this.#worldMatrixAtom.reportObserved();
    return this.#worldMatrix;
  }
  set __worldMatrix(value) {
    this.#worldMatrix = value;
    this.#worldMatrixAtom.reportChanged();
  }

  __reportMatrixUpdated() {
    this.#matrixAtom.reportChanged();
  }

  __reportWorldMatrixUpdated() {
    this.#worldMatrixAtom.reportChanged();
  }
}
