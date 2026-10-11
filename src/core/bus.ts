import type { Death, GameState, LogEntry, Mood } from './types';

type Events = {
  log: LogEntry;
  stats: GameState;
  age: GameState;
  death: Death;
  newLife: GameState;
  beat: Mood;
};

type Handler<T> = (payload: T) => void;

const handlers = new Map<keyof Events, Handler<unknown>[]>();

export function on<K extends keyof Events>(key: K, fn: Handler<Events[K]>): () => void {
  let list = handlers.get(key);
  if (!list) {
    list = [];
    handlers.set(key, list);
  }
  list.push(fn as Handler<unknown>);
  return () => {
    const i = list!.indexOf(fn as Handler<unknown>);
    if (i >= 0) list!.splice(i, 1);
  };
}

export function emit<K extends keyof Events>(key: K, payload: Events[K]): void {
  const list = handlers.get(key);
  if (!list) return;
  for (const fn of [...list]) fn(payload);
}
