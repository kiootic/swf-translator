export class Event {
  type: string | symbol = "";
  target: unknown;
  currentTarget: unknown;
}
