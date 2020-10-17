export class Event {
  static readonly ENTER_FRAME = "ENTER_FRAME";
  static readonly ADDED_TO_STAGE = "ADDED_TO_STAGE";
  static readonly REMOVED_FROM_STAGE = "REMOVED_FROM_STAGE";
  static readonly SOUND_COMPLETE = "SOUND_COMPLETE";
  static readonly DEACTIVATE = "DEACTIVATE";

  target: unknown;
  currentTarget: unknown;

  constructor(
    public type: string,
    public readonly bubbles = false,
    public readonly cancelable = false
  ) {}

  formatToString(className: string, ...fields: string[]): string {
    const values = fields.map((field) => (this as any)[field]).join(", ");
    return `${className}(${values})`;
  }
}
