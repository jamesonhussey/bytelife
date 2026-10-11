import type { GameState, Person } from '../types';
import type { Rng } from '../rng';
import { clamp } from '../state';

export function baseHazard(age: number): number {
  if (age < 1) return 0.002;
  if (age < 15) return 0.0008;
  if (age < 30) return 0.0015;
  if (age < 45) return 0.003;
  if (age < 60) return 0.008;
  if (age < 70) return 0.02;
  if (age < 80) return 0.05;
  if (age < 90) return 0.12;
  if (age < 100) return 0.25;
  return 0.5;
}

export function deathChance(p: Person): number {
  if (p.stats.health <= 0) return 1;
  const healthFactor = Math.max(0.25, 1 + (50 - p.stats.health) / 50);
  return Math.min(0.95, baseHazard(p.age) * healthFactor);
}

const YOUNG_CAUSES = ['a car accident', 'a sudden illness', 'a freak accident', 'drowning'];
const MID_CAUSES = ['a heart attack', 'cancer', 'a car accident', 'a stroke', 'an undiagnosed condition'];
const OLD_CAUSES = ['natural causes', 'heart failure', 'pneumonia', 'a stroke', 'old age', 'complications from a fall'];

export function pickCause(p: Person, rng: Rng): string {
  if (p.stats.health <= 0) return rng.pick(['organ failure', 'a long illness']);
  if (p.age < 30) return rng.pick(YOUNG_CAUSES);
  if (p.age < 65) return rng.pick(MID_CAUSES);
  return rng.pick(OLD_CAUSES);
}

export function driftStats(state: GameState, rng: Rng): void {
  const p = state.player;
  const s = p.stats;
  const age = p.age;

  let healthDelta = 0;
  if (age <= 18) healthDelta += 2;
  else if (age >= 40 && age < 60) healthDelta -= 0.8;
  else if (age >= 60 && age < 75) healthDelta -= 1.6;
  else if (age >= 75) healthDelta -= 2.5;
  healthDelta += state.yearActions.workouts * 1.5;
  healthDelta += (rng.next() - 0.5) * 3;

  let looksDelta = 0;
  if (age < 22) looksDelta += 0.4;
  else if (age >= 35 && age < 55) looksDelta -= 0.7;
  else if (age >= 55) looksDelta -= 1.3;
  looksDelta += state.yearActions.workouts * 0.5;
  looksDelta += (rng.next() - 0.5) * 2;

  let smartsDelta = (rng.next() - 0.5) * 2;
  if (age >= 75) smartsDelta -= 0.8;

  let happinessDelta = (50 - s.happiness) * 0.08 + (rng.next() - 0.5) * 8;
  if (s.health < 30) happinessDelta -= 3;
  if (state.yearActions.familyTime.length > 0) happinessDelta += 2;

  s.health = clamp(Math.round(s.health + healthDelta));
  s.looks = clamp(Math.round(s.looks + looksDelta));
  s.smarts = clamp(Math.round(s.smarts + smartsDelta));
  s.happiness = clamp(Math.round(s.happiness + happinessDelta));
}
