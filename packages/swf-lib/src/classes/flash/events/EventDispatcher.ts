import { AVMObject } from "../../__internal/avm2/AVMObject";
import { Event } from "./Event";

export type ListenerFn<T extends Event> = (event: T) => void;

interface Listener {
  priority: number;
  listener: ListenerFn<Event>;
}

const forBroadcast = Symbol();
const broadcastEvents: Array<string | symbol> = [Event.ENTER_FRAME];
const broadcastEventDispatchers = new WeakMap<object, EventDispatcher>();

export class EventDispatcher extends AVMObject {
  [forBroadcast] = false;

  static __eventContext: object | null = null;
  static get __broadcastDispatcher() {
    if (!this.__eventContext) {
      throw new Error("Event context not present");
    }

    let dispatcher = broadcastEventDispatchers.get(this.__eventContext);
    if (!dispatcher) {
      dispatcher = new EventDispatcher();
      dispatcher[forBroadcast] = true;
      broadcastEventDispatchers.set(this.__eventContext, dispatcher);
    }
    return dispatcher;
  }

  __eventParent: EventDispatcher | null = null;
  __captureListeners = new Map<string | symbol, Listener[]>();
  __bubbleListeners = new Map<string | symbol, Listener[]>();

  __setEventParent(parent: EventDispatcher | null) {
    this.__eventParent = parent;
  }

  addEventListener<T extends Event>(
    type: string | symbol,
    listener: ListenerFn<T>,
    useCapture = false,
    priority = 0,
    useWeakReference = false
  ) {
    if (broadcastEvents.includes(type) && !this[forBroadcast]) {
      EventDispatcher.__broadcastDispatcher.addEventListener(
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
      listeners = this.__captureListeners;
    } else {
      listeners = this.__bubbleListeners;
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
      EventDispatcher.__broadcastDispatcher.removeEventListener(
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
      listeners = this.__captureListeners;
    } else {
      listeners = this.__bubbleListeners;
    }

    const oldListeners = listeners.get(type) || [];
    const newListeners = oldListeners.filter((l) => l.listener !== listener);
    if (newListeners.length !== oldListeners.length) {
      listeners.set(type, newListeners);
    }
  }

  __dispatchEvent = (event: Event, isCapturing: boolean) => {
    let listeners: Map<string | symbol, Listener[]>;
    if (isCapturing) {
      listeners = this.__captureListeners;
    } else {
      listeners = this.__bubbleListeners;
    }

    for (const { listener } of listeners.get(event.type) || []) {
      listener(event);
    }
  };

  dispatchEvent(event: Event) {
    event.target = this;
    if (!event.bubbles) {
      event.currentTarget = this;
      this.__dispatchEvent(event, false);
      return;
    }

    const path: EventDispatcher[] = [this];
    let current: EventDispatcher | null = this;
    while (current && current.__eventParent) {
      current = current.__eventParent;
      path.push(current);
    }

    for (let i = path.length - 1; i > 0; i--) {
      event.currentTarget = path[i];
      path[i].__dispatchEvent(event, true);
    }
    for (let i = 0; i < path.length; i++) {
      event.currentTarget = path[i];
      path[i].__dispatchEvent(event, false);
    }
  }
}
