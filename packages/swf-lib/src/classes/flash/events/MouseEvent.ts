import { Event } from "./Event";

export class MouseEvent extends Event {
  static readonly CLICK = "click";
  static readonly MOUSE_DOWN = "mouseDown";
  static readonly MOUSE_MOVE = "mouseMove";
  static readonly MOUSE_OUT = "mouseOut";
  static readonly MOUSE_OVER = "mouseOver";
  static readonly MOUSE_UP = "mouseUp";

  buttonDown = false;
  localX = 0;
  localY = 0;
  stageX = 0;
  stageY = 0;
}
