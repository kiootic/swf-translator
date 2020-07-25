export class Texture {
  gl?: WebGLTexture;
  dirty = true;
  data: TexImageSource;

  static readonly WHITE: Texture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 16, 16);

    return new Texture(canvas);
  })();

  constructor(data: TexImageSource) {
    this.data = data;
  }

  static async load(src: string): Promise<Texture> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });

    return new Texture(img);
  }

  get width() {
    return this.data.width;
  }
  get height() {
    return this.data.height;
  }

  ensure(gl: WebGLRenderingContext): WebGLTexture {
    if (!this.gl) {
      const tex = gl.createTexture();
      if (!tex) {
        throw new Error("Cannot create texture");
      }
      this.gl = tex;
    }

    if (this.dirty) {
      gl.bindTexture(gl.TEXTURE_2D, this.gl);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this.data
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      this.dirty = false;
    }

    return this.gl;
  }

  markDirty() {
    this.dirty = true;
  }

  delete(gl: WebGLRenderingContext) {
    if (this.gl) {
      gl.deleteTexture(this.gl);
    }
    this.gl = undefined;
    this.dirty = true;
  }
}
