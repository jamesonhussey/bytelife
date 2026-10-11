import type { GameState, Person } from '../types';
import type { Rng } from '../rng';
import { addLog, clamp } from '../state';
import { deathChance, pickCause } from './health';

export function relationLabel(p: Person): string {
  switch (p.relation) {
    case 'mother': return 'Mother';
    case 'father': return 'Father';
    case 'brother': return 'Brother';
    case 'sister': return 'Sister';
    default: return 'Me';
  }
}

export function tickFamily(state: GameState, rng: Rng): void {
  for (const member of state.family) {
    if (!member.alive) continue;
    member.age++;

    const s = member.stats;
    if (member.age >= 50) s.health = clamp(s.health - rng.int(0, 3));
    else if (member.age < 18) s.health = clamp(s.health + 1);

    const spent = state.yearActions.familyTime.includes(member.id);
    member.relationship = clamp(member.relationship + (spent ? rng.int(3, 8) : -rng.int(0, 4)));

    if (rng.chance(deathChance(member))) {
      member.alive = false;
      member.deathAge = member.age;
      member.deathCause = pickCause(member, rng);
      const label = relationLabel(member).toLowerCase();
      addLog(state, `My ${label}, ${member.firstName}, passed away at age ${member.age} from ${member.deathCause}.`, 'bad');
      state.player.stats.happiness = clamp(state.player.stats.happiness - Math.round(10 + member.relationship * 0.2));
      if (member.relation === 'mother' || member.relation === 'father') {
        const inherit = rng.int(0, 1500);
        if (inherit > 100) {
          state.money += inherit;
          addLog(state, `I inherited $${inherit.toLocaleString('en-US')} from my ${label}'s estate.`, 'neutral');
        }
      }
    }
  }
}

export function livingParents(state: GameState): Person[] {
  return state.family.filter((p) => (p.relation === 'mother' || p.relation === 'father') && p.alive);
}
