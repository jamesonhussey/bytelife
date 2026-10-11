import type { Choice, GameEvent, GameState } from './types';
import { addLog, applyEffects, commitRng, freshYearActions, rngFor, save } from './state';
import { emit } from './bus';
import { driftStats, deathChance, pickCause } from './systems/health';
import { tickSchool } from './systems/school';
import { tickFamily, livingParents } from './systems/family';
import { rollEvents } from './events';

export interface YearResult {
  events: GameEvent[];
  died: boolean;
}

export function beginYear(state: GameState): YearResult {
  if (state.dead) return { events: [], died: true };
  const rng = rngFor(state);
  const p = state.player;

  p.age++;
  addLog(state, `--- Age ${p.age} ---`, 'neutral');

  driftStats(state, rng);
  tickSchool(state, rng);
  tickFamily(state, rng);

  if (p.age >= 5 && p.age <= 17 && livingParents(state).length > 0) {
    const allowance = p.age * 5;
    state.money += allowance;
    if (p.age === 5 || rng.chance(0.25)) {
      addLog(state, `My parents gave me $${allowance} in allowance this year.`, 'neutral');
    }
  }

  emit('stats', state);
  emit('age', state);

  if (rng.chance(deathChance(p))) {
    const cause = pickCause(p, rng);
    commitRng(state, rng);
    die(state, cause);
    return { events: [], died: true };
  }

  const events = rollEvents(state, rng);
  state.yearActions = freshYearActions();
  commitRng(state, rng);
  save(state);
  return { events, died: false };
}

export function resolveChoice(state: GameState, ev: GameEvent, choice: Choice): GameEvent | undefined {
  if (!state.eventsSeen.includes(ev.id)) state.eventsSeen.push(ev.id);
  applyEffects(state, choice.effects);
  if (choice.flag) state.flags[choice.flag] = (state.flags[choice.flag] ?? 0) + 1;
  addLog(state, choice.log, choice.mood ?? 'neutral');
  emit('beat', choice.mood ?? 'neutral');
  if (state.player.stats.health <= 0 && !state.dead) {
    const rng = rngFor(state);
    const cause = pickCause(state.player, rng);
    commitRng(state, rng);
    die(state, cause);
    return undefined;
  }
  save(state);
  return choice.next;
}

export function die(state: GameState, cause: string): void {
  state.dead = true;
  state.player.alive = false;
  state.death = { age: state.player.age, cause };
  addLog(state, `I died at age ${state.player.age} from ${cause}.`, 'bad');
  save(state);
  emit('death', state.death);
}
