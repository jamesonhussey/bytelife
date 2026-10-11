import type { GameState, StatKey, Mood } from '../core/types';
import { fullName, money } from '../core/state';
import { stageLabel, gradeLetter, isEnrolled } from '../core/systems/school';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

export class Hud {
  private identity = $('#identity');
  private stats = $('#stats');
  private prompt = $('#prompt');
  private ageBtn = $<HTMLButtonElement>('#ageup');
  private toastEl = $('#toast');
  private toastTimer = 0;

  constructor(onAgeUp: () => void, onEnter: () => void) {
    this.ageBtn.addEventListener('click', onAgeUp);
    this.prompt.querySelector('button')!.addEventListener('click', onEnter);
  }

  render(state: GameState): void {
    const p = state.player;
    this.identity.querySelector('.name')!.textContent = fullName(p);
    this.identity.querySelector('.sub')!.textContent = `Age ${p.age} · ${state.city}, ${state.country}`;
    this.identity.querySelector('.money')!.textContent = money(state.money);
    const edu = this.identity.querySelector('.edu')!;
    edu.textContent = isEnrolled(state)
      ? `${stageLabel(state.education.stage)} · Grade ${gradeLetter(state.education.grade)}`
      : state.education.stage === 'none' ? '' : stageLabel(state.education.stage);
    for (const k of ['happiness', 'health', 'smarts', 'looks'] as StatKey[]) {
      const row = this.stats.querySelector(`.stat[data-k="${k}"]`)!;
      (row.querySelector('.fill') as HTMLElement).style.width = `${p.stats[k]}%`;
      row.querySelector('.val')!.textContent = String(p.stats[k]);
    }
    this.ageBtn.disabled = state.dead;
  }

  setPrompt(text: string | null): void {
    if (!text) {
      this.prompt.classList.add('hidden');
      return;
    }
    this.prompt.querySelector('.text')!.textContent = text;
    this.prompt.classList.remove('hidden');
  }

  setBusy(busy: boolean): void {
    this.ageBtn.disabled = busy;
  }

  toast(text: string, mood: Mood = 'neutral', ms = 2600): void {
    this.toastEl.textContent = text;
    this.toastEl.className = `card show ${mood}`;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }
}
