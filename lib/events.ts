import { Application } from './application';

type EventResolver = (payload?: any, app?: Application) => void | Promise<void>;

export class EventEmitter {
  private events: Map<IEventName, Set<EventResolver>> = new Map();
  private limitListeners = 10;

  constructor(protected app: Application) {}

  get countMaxListeners() {
    return this.limitListeners;
  }

  listenerCount(name: IEventName) {
    const event = this.events.get(name);
    if (event) return event.size;
    return 0;
  }

  on(name: IEventName, fn: EventResolver) {
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

  once(name: IEventName, fn: EventResolver) {
    const dispose: EventResolver = (app, payload) => {
      this.remove(name, dispose);
      return fn(app ?? this.app, payload);
    };
    this.on(name, dispose);
  }

  emit(name: IEventName, payload?: any, app?: Application) {
    const event = this.events.get(name);
    if (!event) return;
    for (const fn of event.values()) {
      fn(app ?? this.app, payload);
    }
  }

  remove(name: IEventName, fn: EventResolver) {
    const event = this.events.get(name);
    if (!event) return;
    event.delete(fn);
  }

  clear(name: IEventName) {
    if (!name) {
      this.events.clear();
      return;
    }
    this.events.delete(name);
  }

  static once(emitter: EventEmitter, name: IEventName) {
    return new Promise((resolve) => emitter.once(name, resolve));
  }
}
