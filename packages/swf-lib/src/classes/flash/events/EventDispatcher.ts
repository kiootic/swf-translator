import type { Event } from "./Event";

export type ListenerFn = (event: Event) => void;

interface Listener {
  priority: number;
  listener: ListenerFn;
}

export class EventDispatcher {
  #parent: EventDispatcher | null = null;
  #captureListeners = new Map<string | symbol, Listener[]>();
  #bubbleListeners = new Map<string | symbol, Listener[]>();

  addEventListener(
    type: string | symbol,
    listener: ListenerFn,
    useCapture = false,
    priority = 0,
    useWeakReference = false
  ) {
    let listeners: Map<string | symbol, Listener[]>;
    if (useCapture) {
      listeners = this.#captureListeners;
    } else {
      listeners = this.#bubbleListeners;
    }

    const oldListeners = listeners.get(type) || [];
    if (oldListeners.find((l) => l.listener === listener)) {
      return;
    }

    const newListeners = [...oldListeners, { priority, listener }];
    newListeners.sort((a, b) => b.priority - a.priority);
    listeners.set(type, newListeners);
  }

  removeEventListener(
    type: string | symbol,
    listener: ListenerFn,
    useCapture = false,
    priority = 0,
    useWeakReference = false
  ) {
    let listeners: Map<string | symbol, Listener[]>;
    if (useCapture) {
      listeners = this.#captureListeners;
    } else {
      listeners = this.#bubbleListeners;
    }

    const oldListeners = listeners.get(type) || [];
    const newListeners = oldListeners.filter((l) => l.listener !== listener);
    if (newListeners.length !== oldListeners.length) {
      listeners.set(type, newListeners);
    }
  }

  #dispatchEvent = (event: Event, isCapturing: boolean) => {
    let listeners: Map<string | symbol, Listener[]>;
    if (isCapturing) {
      listeners = this.#captureListeners;
    } else {
      listeners = this.#bubbleListeners;
    }

    for (const { listener } of this.#bubbleListeners.get(event.type) || []) {
      listener(event);
    }
  };

  dispatchEvent(event: Event) {
    event.target = this;

    const path: EventDispatcher[] = [this];
    let current: EventDispatcher | null = this;
    while (current && current.#parent) {
      current = current.#parent;
      path.push(current);
    }

    for (let i = path.length - 1; i > 0; i--) {
      event.currentTarget = path[i];
      path[i].#dispatchEvent(event, true);
    }
    for (let i = 0; i < path.length; i++) {
      event.currentTarget = path[i];
      path[i].#dispatchEvent(event, false);
    }
  }
}
