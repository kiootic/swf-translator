import { Program } from "../Program";
import { vertBasic } from "./vertex";
import { fragSprite } from "./sprite";

export const programSprite = new Program(vertBasic, fragSprite);
