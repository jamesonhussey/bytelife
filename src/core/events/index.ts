import type { GameEvent, GameState } from '../types';
import type { Rng } from '../rng';
import { CHILDHOOD_EVENTS } from './childhood';
import { SCHOOL_EVENTS } from './school';
import { RANDOM_EVENTS } from './random';
import { HEALTH_EVENTS } from './health';

export const ALL_EVENTS: GameEvent[] = [
  ...CHILDHOOD_EVENTS,
  ...SCHOOL_EVENTS,
  ...RANDOM_EVENTS,
  ...HEALTH_EVENTS,
];

export function eligibleEvents(state: GameState): GameEvent[] {
  const age = state.player.age;
  return ALL_EVENTS.filter((e) => {
    if (age < e.minAge || age > e.maxAge) return false;
    if (e.once && state.eventsSeen.includes(e.id)) return false;
    if (e.condition && !e.condition(state)) return false;
    return true;
  });
}

export function rollEvents(state: GameState, rng: Rng): GameEvent[] {
  const count = rng.weighted([0, 1, 2], (n) => [2, 6, 2][n]) ?? 1;
  const pool = eligibleEvents(state);
  const picked: GameEvent[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const ev = rng.weighted(pool, (e) => e.weight ?? 1);
    if (!ev) break;
    picked.push(ev);
    pool.splice(pool.indexOf(ev), 1);
  }
  return picked;
}

export function eventText(ev: GameEvent, state: GameState): string {
  return typeof ev.text === 'function' ? ev.text(state) : ev.text;
}
