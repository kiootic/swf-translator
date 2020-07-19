import { GluTesselator, gluEnum, windingRule } from "libtess";
import { optimizeTriangles } from "./optimize";

export abstract class Tessellator {
  protected readonly contours: [number, number][][] = [];
  protected readonly windingRule: windingRule =
    windingRule.GLU_TESS_WINDING_ODD;

  triangulate(): [number[], number[]] {
    const tessellator = new GluTesselator();

    const result: [number, number][] = [];
    tessellator.gluTessCallback(gluEnum.GLU_TESS_VERTEX_DATA, (v: number[]) => {
      result.push([Number(v[0]), Number(v[1])]);
    });
    tessellator.gluTessCallback(gluEnum.GLU_TESS_COMBINE, (v: number[]) => {
      return [v[0], v[1], v[2]];
    });
    tessellator.gluTessCallback(gluEnum.GLU_TESS_EDGE_FLAG, () => {});

    tessellator.gluTessNormal(0, 0, 1);
    tessellator.gluTessProperty(
      gluEnum.GLU_TESS_WINDING_RULE,
      this.windingRule
    );
    tessellator.gluTessBeginPolygon(null);
    for (const c of this.contours) {
      tessellator.gluTessBeginContour();
      for (const v of c) {
        const coords: [number, number, number] = [v[0], v[1], 0];
        tessellator.gluTessVertex(coords, coords);
      }
      tessellator.gluTessEndContour();
    }
    tessellator.gluTessEndPolygon();

    return optimizeTriangles(result);
  }
}
