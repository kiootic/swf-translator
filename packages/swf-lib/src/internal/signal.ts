interface ListenerSlot<T extends (...args: any[]) => void> {
  disabled: boolean;
  handler: T;
}

export class Signal<T extends (...args: any[]) => void> {
  private listeners: ListenerSlot<T>[] = [];

  subscribe(handler: T) {
    this.listeners.push({ disabled: false, handler });
  }

  unsubscribe(handler: T) {
    for (const l of this.listeners) {
      if (l.handler === handler) {
        l.disabled = true;
      }
    }
    this.listeners = this.listeners.filter((h) => !h.disabled);
  }

  reset() {
    this.listeners = [];
  }

  emit(...args: Parameters<T>) {
    for (const { disabled, handler } of this.listeners) {
      if (!disabled) {
        handler(...args);
      }
    }
  }
}
