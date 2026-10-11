import type { GameState, SchoolStage } from '../types';
import type { Rng } from '../rng';
import { addLog, clamp } from '../state';

const STAGE_FOR_AGE: [number, number, SchoolStage][] = [
  [5, 10, 'elementary'],
  [11, 13, 'middle'],
  [14, 17, 'high'],
];

export function stageLabel(stage: SchoolStage): string {
  switch (stage) {
    case 'elementary': return 'Elementary School';
    case 'middle': return 'Middle School';
    case 'high': return 'High School';
    case 'graduated': return 'High School Graduate';
    case 'dropout': return 'High School Dropout';
    default: return 'Not in school';
  }
}

export function gradeLetter(grade: number): string {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 65) return 'C';
  if (grade >= 50) return 'D';
  return 'F';
}

export function isEnrolled(state: GameState): boolean {
  const s = state.education.stage;
  return s === 'elementary' || s === 'middle' || s === 'high';
}

export function tickSchool(state: GameState, rng: Rng): void {
  const edu = state.education;
  const age = state.player.age;
  const stats = state.player.stats;

  if (edu.stage === 'dropout' || edu.stage === 'graduated') return;

  if (isEnrolled(state)) {
    const target = stats.smarts + (state.yearActions.studied ? 15 : 0) - (state.yearActions.skipped ? 15 : 0);
    const noise = (rng.next() - 0.5) * 12;
    edu.grade = clamp(Math.round(edu.grade + (target - edu.grade) * 0.5 + noise));
    stats.smarts = clamp(stats.smarts + (state.yearActions.studied ? 3 : 1));
    edu.yearsInStage++;
  }

  const expected = STAGE_FOR_AGE.find(([lo, hi]) => age >= lo && age <= hi)?.[2];

  if (expected && expected !== edu.stage) {
    if (edu.stage === 'none') {
      addLog(state, `I started ${stageLabel(expected).toLowerCase()}.`, 'neutral');
    } else {
      addLog(state, `I finished ${stageLabel(edu.stage).toLowerCase()} with a ${gradeLetter(edu.grade)} average and moved on to ${stageLabel(expected).toLowerCase()}.`, 'good');
    }
    edu.stage = expected;
    edu.yearsInStage = 0;
  } else if (!expected && edu.stage === 'high' && age >= 18) {
    if (edu.grade >= 45) {
      edu.stage = 'graduated';
      addLog(state, `I graduated high school with a ${gradeLetter(edu.grade)} average.`, 'good');
      state.flags.graduated = 1;
    } else {
      edu.stage = 'dropout';
      addLog(state, 'My grades were too low. I did not graduate high school.', 'bad');
    }
  }
}

export function dropOut(state: GameState): string {
  state.education.stage = 'dropout';
  const msg = 'I dropped out of high school.';
  addLog(state, msg, 'bad');
  return msg;
}
