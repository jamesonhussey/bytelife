import type { GameState, Mood, Person } from './types';
import { addLog, applyEffects, commitRng, rngFor, save } from './state';
import { emit } from './bus';
import { dropOut, isEnrolled } from './systems/school';

export interface ActionResult {
  text: string;
  mood: Mood;
}

function done(state: GameState, text: string, mood: Mood = 'neutral'): ActionResult {
  addLog(state, text, mood);
  emit('beat', mood);
  save(state);
  return { text, mood };
}

export function study(state: GameState): ActionResult {
  if (!isEnrolled(state)) return { text: "I'm not in school.", mood: 'neutral' };
  if (state.yearActions.studied) return { text: 'I already studied hard this year.', mood: 'neutral' };
  state.yearActions.studied = true;
  applyEffects(state, { smarts: 2, happiness: -2 });
  return done(state, 'I studied hard this year.', 'good');
}

export function skipSchool(state: GameState): ActionResult {
  if (!isEnrolled(state)) return { text: "I'm not in school.", mood: 'neutral' };
  if (state.yearActions.skipped) return { text: "I've already been skipping school this year.", mood: 'neutral' };
  state.yearActions.skipped = true;
  applyEffects(state, { happiness: 4, smarts: -1 });
  return done(state, 'I skipped school and hung out at the arcade.', 'neutral');
}

export function leaveSchool(state: GameState): ActionResult {
  if (state.education.stage !== 'high' || state.player.age < 16) return { text: "I'm not old enough to drop out.", mood: 'neutral' };
  const text = dropOut(state);
  applyEffects(state, { happiness: 3 });
  save(state);
  emit('beat', 'bad');
  return { text, mood: 'bad' };
}

export function workout(state: GameState): ActionResult {
  if (state.player.age < 12) return { text: 'The gym says I need to be at least 12.', mood: 'neutral' };
  if (state.yearActions.workouts >= 3) return { text: "I've worked out enough this year. My muscles need rest.", mood: 'neutral' };
  const cost = 20;
  if (state.money < cost) return { text: `A gym session costs $${cost}. I can't afford it.`, mood: 'bad' };
  state.yearActions.workouts++;
  applyEffects(state, { money: -cost, health: 3, looks: 2, happiness: 1 });
  const rng = rngFor(state);
  const flavor = rng.pick(['I crushed leg day.', 'I ran on the treadmill until I saw stars.', 'I lifted weights and felt great.', 'I took a spin class and nearly died, in a good way.']);
  commitRng(state, rng);
  return done(state, flavor, 'good');
}

export function checkup(state: GameState): ActionResult {
  const h = state.player.stats.health;
  state.yearActions.checkup = true;
  let verdict: string;
  if (h >= 85) verdict = 'The doctor says I am in excellent health.';
  else if (h >= 65) verdict = 'The doctor says I am in good health, with a few things to watch.';
  else if (h >= 40) verdict = 'The doctor is concerned about my health and recommends treatment.';
  else verdict = 'The doctor is alarmed. I need treatment urgently.';
  save(state);
  return { text: `${verdict} (Health: ${h}/100)`, mood: h >= 65 ? 'good' : 'bad' };
}

export function treatment(state: GameState): ActionResult {
  const h = state.player.stats.health;
  if (h >= 75) return { text: "The doctor says I don't need treatment right now.", mood: 'neutral' };
  const cost = 150 + Math.round((75 - h) * 6);
  if (state.money < cost) return { text: `Treatment costs $${cost}. I can't afford it.`, mood: 'bad' };
  const rng = rngFor(state);
  const gain = rng.int(10, 22);
  commitRng(state, rng);
  applyEffects(state, { money: -cost, health: gain });
  return done(state, `I received medical treatment for $${cost} and feel much better.`, 'good');
}

export function spendTime(state: GameState, member: Person): ActionResult {
  if (!member.alive) return { text: `${member.firstName} is no longer with us.`, mood: 'bad' };
  if (state.yearActions.familyTime.includes(member.id)) return { text: `I already spent quality time with ${member.firstName} this year.`, mood: 'neutral' };
  state.yearActions.familyTime.push(member.id);
  const rng = rngFor(state);
  const gain = rng.int(4, 10);
  const activity = rng.pick(['played board games', 'went for a long walk', 'cooked dinner together', 'watched old movies', 'talked for hours']);
  commitRng(state, rng);
  member.relationship = Math.min(100, member.relationship + gain);
  applyEffects(state, { happiness: 3 });
  return done(state, `${member.firstName} and I ${activity}.`, 'good');
}

export function buyItem(state: GameState, item: { name: string; cost: number; effects: Parameters<typeof applyEffects>[1]; log: string }): ActionResult {
  if (state.money < item.cost) return { text: `I can't afford ${item.name} ($${item.cost}).`, mood: 'bad' };
  state.yearActions.shopped++;
  applyEffects(state, { ...item.effects, money: -item.cost });
  return done(state, item.log, 'good');
}
