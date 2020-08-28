import { Event } from "./Event";

export class KeyboardEvent extends Event {
  static readonly KEY_DOWN = "KEY_DOWN";
  static readonly KEY_UP = "KEY_UP";

  keyCode = 0;
}
