declare module "libtess" {
  export enum windingRule {
    GLU_TESS_WINDING_ODD = 100130,
    GLU_TESS_WINDING_NONZERO = 100131,
    GLU_TESS_WINDING_POSITIVE = 100132,
    GLU_TESS_WINDING_NEGATIVE = 100133,
    GLU_TESS_WINDING_ABS_GEQ_TWO = 100134,
  }

  export enum primitiveType {
    GL_LINE_LOOP = 2,
    GL_TRIANGLES = 4,
    GL_TRIANGLE_STRIP = 5,
    GL_TRIANGLE_FAN = 6,
  }

  export enum errorType {
    GLU_TESS_MISSING_BEGIN_POLYGON = 100151,
    GLU_TESS_MISSING_END_POLYGON = 100153,
    GLU_TESS_MISSING_BEGIN_CONTOUR = 100152,
    GLU_TESS_MISSING_END_CONTOUR = 100154,
    GLU_TESS_COORD_TOO_LARGE = 100155,
    GLU_TESS_NEED_COMBINE_CALLBACK = 100156,
  }

  export enum gluEnum {
    GLU_TESS_BEGIN = 100100,
    GLU_TESS_VERTEX = 100101,
    GLU_TESS_END = 100102,
    GLU_TESS_ERROR = 100103,
    GLU_TESS_EDGE_FLAG = 100104,
    GLU_TESS_COMBINE = 100105,
    GLU_TESS_BEGIN_DATA = 100106,
    GLU_TESS_VERTEX_DATA = 100107,
    GLU_TESS_END_DATA = 100108,
    GLU_TESS_ERROR_DATA = 100109,
    GLU_TESS_EDGE_FLAG_DATA = 100110,
    GLU_TESS_COMBINE_DATA = 100111,

    GLU_TESS_MESH = 100112,
    GLU_TESS_TOLERANCE = 100142,
    GLU_TESS_WINDING_RULE = 100140,
    GLU_TESS_BOUNDARY_ONLY = 100141,

    GLU_INVALID_ENUM = 100900,
    GLU_INVALID_VALUE = 100901,
  }

  export class GluTesselator {
    gluTessProperty(which: gluEnum, value: unknown): void;
    gluTessNormal(x: number, y: number, z: number): void;
    gluTessCallback(which: gluEnum, fn: Function): void;
    gluTessVertex(coords: [number, number, number], data: unknown): void;
    gluTessBeginContour(): void;
    gluTessEndContour(): void;
    gluTessBeginPolygon(data: unknown): void;
    gluTessEndPolygon(): void;
  }
}
