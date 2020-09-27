import { Event } from "./Event";

export type ListenerFn<T extends Event> = (event: T) => void;

interface Listener {
  priority: number;
  listener: ListenerFn<Event>;
}

const forBroadcast = Symbol();
const broadcastEvents: Array<string | symbol> = [Event.ENTER_FRAME];

export class EventDispatcher {
  [forBroadcast] = false;

  #parent: EventDispatcher | null = null;
  #captureListeners = new Map<string | symbol, Listener[]>();
  #bubbleListeners = new Map<string | symbol, Listener[]>();

  __setEventParent(parent: EventDispatcher | null) {
    this.#parent = parent;
  }

  addEventListener<T extends Event>(
    type: string | symbol,
    listener: ListenerFn<T>,
    useCapture = false,
    priority = 0,
    useWeakReference = false
  ) {
    if (broadcastEvents.includes(type) && !this[forBroadcast]) {
      __broadcastDispatcher.addEventListener(
        type,
        listener,
        useCapture,
        priority,
        useWeakReference
      );
      return;
    }

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

    const newListeners = [
      ...oldListeners,
      { priority, listener: listener as ListenerFn<Event> },
    ];
    newListeners.sort((a, b) => b.priority - a.priority);
    listeners.set(type, newListeners);
  }

  removeEventListener<T extends Event>(
    type: string | symbol,
    listener: ListenerFn<T>,
    useCapture = false,
    priority = 0,
    useWeakReference = false
  ) {
    if (broadcastEvents.includes(type) && !this[forBroadcast]) {
      __broadcastDispatcher.removeEventListener(
        type,
        listener,
        useCapture,
        priority,
        useWeakReference
      );
      return;
    }

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

    for (const { listener } of listeners.get(event.type) || []) {
      listener(event);
    }
  };

  dispatchEvent(event: Event) {
    event.target = this;
    if (!event.bubbles) {
      event.currentTarget = this;
      this.#dispatchEvent(event, false);
      return;
    }

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

export const __broadcastDispatcher = new EventDispatcher();
__broadcastDispatcher[forBroadcast] = true;
