import { GLState } from "./GLState";

export class Texture {
  readonly data:
    | HTMLImageElement
    | {
        width: number;
        height: number;
      };
  readonly width: number;
  readonly height: number;

  static readonly WHITE: Texture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 16, 16);

    return new Texture(canvas);
  })();

  private constructor(data: Texture["data"]) {
    this.data = data;
    this.width = data.width;
    this.height = data.height;
  }

  static image(image: HTMLImageElement | HTMLCanvasElement) {
    return new Texture(image);
  }

  static size(width: number, height: number) {
    return new Texture({ width, height });
  }

  ensure(state: GLState) {
    return state.ensureInstance(this, (gl) => {
      const tex = gl.createTexture();
      state.bindTexture(0, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      if (this.data instanceof HTMLElement) {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          this.data
        );
      } else {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          this.width,
          this.height,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null
        );
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      return tex;
    });
  }

  delete(state: GLState) {
    state.deleteInstance<WebGLTexture>(this, (gl, tex) => {
      gl.deleteTexture(tex);
    });
  }
}
