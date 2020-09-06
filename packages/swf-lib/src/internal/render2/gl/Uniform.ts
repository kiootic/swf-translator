import { GLState } from "./GLState";
import { TypedArray, TypedArrayConstructor } from "./typed-array";

interface TypeDef {
  type: "float" | "int" | "uint" | "bool" | "mat" | "sampler2D";
  components: number;
  setter: string;
}

function toTypedArray<T extends TypedArray>(
  value: unknown,
  cls: TypedArrayConstructor<T>
): T {
  if (typeof value === "number" || typeof value === "boolean") {
    const array = new cls(1);
    array[0] = Number(value);
    return array;
  } else if (Array.isArray(value)) {
    return cls.from(value);
  } else if (value instanceof cls) {
    return value.slice();
  } else {
    throw new Error("Invalid typed array value");
  }
}

function arrayEquals<T extends ArrayLike<unknown>>(
  oldArray: T | null,
  newArray: T
): boolean {
  if (!oldArray || oldArray.length !== newArray.length) {
    return false;
  }
  for (let i = 0; i < oldArray.length; i++) {
    if (newArray[i] !== oldArray[i]) {
      return false;
    }
  }
  return true;
}

export class Uniform {
  readonly state: GLState;
  readonly name: string;
  readonly type: GLenum;
  readonly size: number;
  readonly location: WebGLUniformLocation;
  readonly typeDef: TypeDef;
  value: unknown = null;

  constructor(
    state: GLState,
    info: WebGLActiveInfo,
    location: WebGLUniformLocation
  ) {
    this.state = state;
    this.name = info.name;
    this.type = info.type;
    this.size = info.size;
    this.location = location;

    const gl = this.state.gl;
    const types: Record<GLenum, TypeDef> = {
      [gl.FLOAT]: { type: "float", components: 1, setter: "uniform1fv" },
      [gl.FLOAT_VEC2]: { type: "float", components: 2, setter: "uniform2fv" },
      [gl.FLOAT_VEC3]: { type: "float", components: 3, setter: "uniform3fv" },
      [gl.FLOAT_VEC4]: { type: "float", components: 4, setter: "uniform4fv" },
      [gl.INT]: { type: "int", components: 1, setter: "uniform1iv" },
      [gl.INT_VEC2]: { type: "int", components: 2, setter: "uniform2iv" },
      [gl.INT_VEC3]: { type: "int", components: 3, setter: "uniform3iv" },
      [gl.INT_VEC4]: { type: "int", components: 4, setter: "uniform4iv" },
      [gl.UNSIGNED_INT]: { type: "uint", components: 1, setter: "uniform1uiv" },
      [gl.UNSIGNED_INT_VEC2]: {
        type: "uint",
        components: 2,
        setter: "uniform2uiv",
      },
      [gl.UNSIGNED_INT_VEC3]: {
        type: "uint",
        components: 3,
        setter: "uniform3uiv",
      },
      [gl.UNSIGNED_INT_VEC4]: {
        type: "uint",
        components: 4,
        setter: "uniform4uiv",
      },
      [gl.BOOL]: { type: "bool", components: 1, setter: "uniform1iv" },
      [gl.BOOL_VEC2]: { type: "bool", components: 2, setter: "uniform2iv" },
      [gl.BOOL_VEC3]: { type: "bool", components: 3, setter: "uniform3iv" },
      [gl.BOOL_VEC4]: { type: "bool", components: 4, setter: "uniform4iv" },
      [gl.FLOAT_MAT2]: {
        type: "mat",
        components: 4,
        setter: "uniformMatrix2fv",
      },
      [gl.FLOAT_MAT3]: {
        type: "mat",
        components: 9,
        setter: "uniformMatrix3fv",
      },
      [gl.FLOAT_MAT4]: {
        type: "mat",
        components: 16,
        setter: "uniformMatrix4fv",
      },
      [gl.SAMPLER_2D]: { type: "bool", components: 1, setter: "uniform1iv" },
    };
    const typeDef = types[info.type];
    if (!typeDef) {
      throw new Error(`Unsupported uniform type: ${info.type}`);
    }
    this.typeDef = typeDef;
  }

  set(program: WebGLProgram | null, value: unknown) {
    this.state.useProgram(program);
    switch (this.typeDef.type) {
      case "float": {
        const newValue = toTypedArray(value, Float32Array);
        const oldValue = (this.value as Float32Array) ?? new Float32Array(0);
        if (arrayEquals(oldValue, newValue)) {
          return;
        }
        (this.state.gl as any)[this.typeDef.setter](this.location, newValue);
        this.value = newValue;
        break;
      }
      case "int":
      case "bool": {
        const newValue = toTypedArray(value, Int32Array);
        const oldValue = (this.value as Int32Array) ?? new Int32Array(0);
        if (arrayEquals(oldValue, newValue)) {
          return;
        }
        (this.state.gl as any)[this.typeDef.setter](this.location, newValue);
        this.value = newValue;
        break;
      }
      case "uint": {
        const newValue = toTypedArray(value, Uint32Array);
        const oldValue = (this.value as Uint32Array) ?? new Uint32Array(0);
        if (arrayEquals(oldValue, newValue)) {
          return;
        }
        (this.state.gl as any)[this.typeDef.setter](this.location, newValue);
        this.value = newValue;
        break;
      }
      case "mat": {
        const newValue = toTypedArray(value, Float32Array);
        const oldValue = (this.value as Float32Array) ?? new Float32Array(0);
        if (arrayEquals(oldValue, newValue)) {
          return;
        }
        (this.state.gl as any)[this.typeDef.setter](
          this.location,
          false,
          newValue
        );
        this.value = newValue;
        break;
      }
      case "sampler2D": {
        const newValue = Array.isArray(value)
          ? (value.slice() as WebGLTexture[])
          : [value as WebGLTexture];
        const oldValue = (this.value as WebGLTexture[]) ?? [];
        if (arrayEquals(oldValue, newValue)) {
          return;
        }
        (this.state.gl as any)[this.typeDef.setter](
          this.location,
          false,
          newValue
        );
        this.value = newValue;
        break;
      }
    }
  }
}
