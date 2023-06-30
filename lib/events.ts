type EventResolver = (...args) => void | Promise<void>;

export class EventEmitter {
  private events: Map<string, Set<EventResolver>> = new Map();
  private limitListeners = 10;

  get countMaxListeners() {
    return this.limitListeners;
  }

  listenerCount(name: string) {
    const event = this.events.get(name);
    if (event) return event.size;
    return 0;
  }

  on(name: string, fn: EventResolver) {
    const event = this.events.get(name);
    if (event) {
      event.add(fn);
      const isOverflow = event.size > this.limitListeners;
      if (isOverflow) {
        console.warn(
          'ListenerOverflowWarning: Potential memory leak detected in EventEmitter.',
        );
      }
    } else {
      this.events.set(name, new Set([fn]));
    }
  }

  once(name: string, fn: EventResolver) {
    const dispose = (...args) => {
      this.remove(name, dispose);
      return fn(...args);
    };
    this.on(name, dispose);
  }

  emit(name: string, ...args) {
    const event = this.events.get(name);
    if (!event) return;
    for (const fn of event.values()) {
      fn(...args);
    }
  }

  remove(name, fn) {
    const event = this.events.get(name);
    if (!event) return;
    event.delete(fn);
  }

  clear(name: string) {
    if (!name) {
      this.events.clear();
      return;
    }
    this.events.delete(name);
  }

  static once(emitter: EventEmitter, name: string) {
    return new Promise((resolve) => emitter.once(name, resolve));
  }
}
