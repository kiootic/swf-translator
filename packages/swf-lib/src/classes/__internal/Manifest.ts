import { Properties } from "./Properties";

export interface Manifest {
  data: string;
  properties: Properties;
  assets: Record<string, AssetInfo>;
}

export interface AssetInfo {
  url: URL;
  size: number;
}
