import { Properties } from "./Properties";

export interface Manifest {
  data: string;
  properties: Properties;
  assets: Record<string, URL>;
}
