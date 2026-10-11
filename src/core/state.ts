import { Rng, randomSeed } from './rng';
import { emit } from './bus';
import { MALE_NAMES, FEMALE_NAMES, LAST_NAMES } from './data/names';
import { COUNTRIES } from './data/countries';
import type { GameState, Gender, Genome, LogEntry, Mood, Person, Relation, Stats, Effects, YearActions } from './types';

export const SAVE_KEY = 'bitlife3d.save';
export const SAVE_VERSION = 1;

export interface NewLifeOptions {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  country?: string;
  seed?: number;
}

let idCounter = 0;
function nextId(rng: Rng): string {
  idCounter++;
  return `${Math.floor(rng.next() * 1e9).toString(36)}${idCounter.toString(36)}`;
}

export function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

function randomGenome(rng: Rng, parentA?: Genome, parentB?: Genome): Genome {
  const inherit = <K extends keyof Genome>(k: K, range: number): number => {
    if (parentA && parentB) return rng.chance(0.5) ? parentA[k] : parentB[k];
    return rng.int(0, range - 1);
  };
  return {
    skin: inherit('skin', 6),
    hairColor: inherit('hairColor', 6),
    hairStyle: rng.int(0, 3),
    shirt: rng.int(0, 7),
    pants: rng.int(0, 4),
  };
}

function randomStats(rng: Rng, base = 50, spread = 30): Stats {
  const roll = () => clamp(Math.round(base + (rng.next() + rng.next() - 1) * spread));
  return { happiness: roll(), health: roll(), smarts: roll(), looks: roll() };
}

function makePerson(
  rng: Rng,
  relation: Relation,
  gender: Gender,
  lastName: string,
  age: number,
  opts: { firstName?: string; genome?: Genome; stats?: Stats } = {},
): Person {
  const firstName = opts.firstName ?? rng.pick(gender === 'male' ? MALE_NAMES : FEMALE_NAMES);
  return {
    id: nextId(rng),
    firstName,
    lastName,
    gender,
    age,
    alive: true,
    genome: opts.genome ?? randomGenome(rng),
    stats: opts.stats ?? randomStats(rng),
    relation,
    relationship: relation === 'self' ? 100 : rng.int(60, 95),
  };
}

export function newLife(opts: NewLifeOptions = {}): GameState {
  const seed = opts.seed ?? randomSeed();
  const rng = new Rng(seed);
  const country = opts.country ?? rng.pick(COUNTRIES).name;
  const countryDef = COUNTRIES.find((c) => c.name === country) ?? COUNTRIES[0];
  const city = rng.pick(countryDef.cities);
  const lastName = opts.lastName || rng.pick(LAST_NAMES);
  const gender: Gender = opts.gender ?? (rng.chance(0.5) ? 'male' : 'female');

  const mother = makePerson(rng, 'mother', 'female', lastName, rng.int(19, 42));
  const father = makePerson(rng, 'father', 'male', lastName, rng.int(20, 48));
  const genome = randomGenome(rng, mother.genome, father.genome);
  const inheritedStats: Stats = {
    happiness: clamp(Math.round(50 + (rng.next() - 0.5) * 40)),
    health: clamp(Math.round(62 + ((mother.stats.health + father.stats.health) / 2) * 0.3 + (rng.next() - 0.5) * 16)),
    smarts: clamp(Math.round((mother.stats.smarts + father.stats.smarts) / 2 + (rng.next() - 0.5) * 50)),
    looks: clamp(Math.round((mother.stats.looks + father.stats.looks) / 2 + (rng.next() - 0.5) * 50)),
  };
  const player = makePerson(rng, 'self', gender, lastName, 0, {
    firstName: opts.firstName || undefined,
    genome,
    stats: inheritedStats,
  });

  const family: Person[] = [mother, father];
  const siblingCount = rng.weighted([0, 1, 2], (n) => [4, 4, 2][n])!;
  const maxSiblingAge = Math.max(1, Math.min(mother.age - 17, 14));
  for (let i = 0; i < siblingCount; i++) {
    const g: Gender = rng.chance(0.5) ? 'male' : 'female';
    const sib = makePerson(rng, g === 'male' ? 'brother' : 'sister', g, lastName, rng.int(1, maxSiblingAge), {
      genome: randomGenome(rng, mother.genome, father.genome),
    });
    family.push(sib);
  }

  const state: GameState = {
    version: SAVE_VERSION,
    seed,
    rngState: rng.state,
    country,
    city,
    money: 0,
    player,
    family,
    education: { stage: 'none', grade: 50, yearsInStage: 0 },
    log: [],
    flags: {},
    yearActions: freshYearActions(),
    dead: false,
    eventsSeen: [],
  };

  const pronoun = gender === 'male' ? 'boy' : 'girl';
  addLog(state, `I was born a ${pronoun} named ${player.firstName} ${player.lastName} in ${city}, ${country}.`, 'good', false);
  addLog(state, `My mother is ${mother.firstName}, age ${mother.age}. My father is ${father.firstName}, age ${father.age}.`, 'neutral', false);
  for (const sib of family.slice(2)) {
    addLog(state, `I have an older ${sib.relation}, ${sib.firstName}, age ${sib.age}.`, 'neutral', false);
  }
  return state;
}

export function freshYearActions(): YearActions {
  return { workouts: 0, studied: false, skipped: false, checkup: false, familyTime: [], shopped: 0 };
}

export function addLog(state: GameState, text: string, mood: Mood = 'neutral', notify = true): LogEntry {
  const entry: LogEntry = { age: state.player.age, text, mood };
  state.log.push(entry);
  if (notify) emit('log', entry);
  return entry;
}

export function applyEffects(state: GameState, fx: Effects | undefined): void {
  if (!fx) return;
  const s = state.player.stats;
  if (fx.happiness) s.happiness = clamp(s.happiness + fx.happiness);
  if (fx.health) s.health = clamp(s.health + fx.health);
  if (fx.smarts) s.smarts = clamp(s.smarts + fx.smarts);
  if (fx.looks) s.looks = clamp(s.looks + fx.looks);
  if (fx.money) state.money = Math.max(0, Math.round(state.money + fx.money));
  emit('stats', state);
}

export function rngFor(state: GameState): Rng {
  return new Rng(state.rngState);
}

export function commitRng(state: GameState, rng: Rng): void {
  state.rngState = rng.state;
}

export function save(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== SAVE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`;
}

export function money(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}
