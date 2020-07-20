import { ARGB, rgba, rgb2rgba } from "./color";
import { Parser, object, uint8, fixed8, uint16 } from "../../binary";

export interface Gradient {
  spreadMode: number;
  interpolationMode: number;
  gradientRecords: GradientRecord[];
}

export function gradient(version: 1 | 2 | 3 | 4): Parser<Gradient> {
  const record = gradientRecord(version);
  return (reader) => {
    const spreadMode = reader.nextBits(2);
    const interpolationMode = reader.nextBits(2);
    const numGradients = reader.nextBits(4);
    const gradientRecords = new Array<GradientRecord>(numGradients);
    for (let i = 0; i < gradientRecords.length; i++) {
      gradientRecords[i] = record(reader);
    }
    return { spreadMode, interpolationMode, gradientRecords };
  };
}

export interface FocalGradient {
  spreadMode: number;
  interpolationMode: number;
  gradientRecords: GradientRecord[];
  focalPoint: number;
}

export function focalGradient(version: 1 | 2 | 3 | 4): Parser<FocalGradient> {
  const record = gradientRecord(version);
  return (reader) => {
    const spreadMode = reader.nextBits(2);
    const interpolationMode = reader.nextBits(2);
    const numGradients = reader.nextBits(4);
    const gradientRecords = new Array<GradientRecord>(numGradients);
    for (let i = 0; i < gradientRecords.length; i++) {
      gradientRecords[i] = record(reader);
    }
    const focalPoint = fixed8(uint16)(reader);
    return { spreadMode, interpolationMode, gradientRecords, focalPoint };
  };
}

export interface GradientRecord {
  ratio: number;
  color: ARGB;
}

function gradientRecord(version: 1 | 2 | 3 | 4): Parser<GradientRecord> {
  return object<GradientRecord>(
    ["ratio", uint8],
    ["color", version >= 3 ? rgba : rgb2rgba]
  );
}
