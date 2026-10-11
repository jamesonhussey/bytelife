import type { BuildingKind, GameState, Mood } from '../core/types';
import * as actions from '../core/actions';
import { gradeLetter, isEnrolled, stageLabel } from '../core/systems/school';
import { relationLabel } from '../core/systems/family';
import { money } from '../core/state';
import { BUILDING_LABEL } from '../world/buildings';

const root = document.querySelector('#menu') as HTMLElement;

interface MenuItem {
  label: string;
  hint?: string;
  disabled?: boolean;
  run: () => actions.ActionResult | Promise<actions.ActionResult>;
}

export interface MenuContext {
  onChange: () => void;
  onAgeUp: () => void;
  onBeat: (mood: Mood) => void;
}

export function closeMenu(): void {
  root.classList.add('hidden');
  root.innerHTML = '';
  lastResult = null;
  current = null;
}

export function isMenuOpen(): boolean {
  return !root.classList.contains('hidden');
}

let lastResult: actions.ActionResult | null = null;
let current: { kind: BuildingKind; state: GameState; ctx: MenuContext } | null = null;

function renderMenu(title: string, subtitle: string, items: MenuItem[], ctx: MenuContext, extra?: HTMLElement): void {
  root.innerHTML = '';
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  dialog.innerHTML = `<h2>${title}</h2><p>${subtitle}</p>`;
  if (extra) dialog.appendChild(extra);
  const list = document.createElement('div');
  list.className = 'choices';
  const result = document.createElement('div');
  result.className = `result ${lastResult?.mood ?? ''}`;
  result.textContent = lastResult?.text || 'What would you like to do?';
  for (const item of items) {
    const b = document.createElement('button');
    b.className = 'menu-btn';
    b.innerHTML = `${item.label}${item.hint ? `<small>${item.hint}</small>` : ''}`;
    b.disabled = !!item.disabled;
    b.addEventListener('click', async () => {
      const r = await item.run();
      ctx.onChange();
      if (!isMenuOpen() || !current) return;
      lastResult = r;
      openMenu(current.kind, current.state, current.ctx);
    });
    list.appendChild(b);
  }
  dialog.appendChild(list);
  dialog.appendChild(result);
  const close = document.createElement('button');
  close.className = 'close';
  close.textContent = 'Leave';
  close.addEventListener('click', closeMenu);
  dialog.appendChild(close);
  root.appendChild(dialog);
  root.classList.remove('hidden');
}

function familyPanel(state: GameState, ctx: MenuContext, result: (r: actions.ActionResult) => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'family';
  for (const m of state.family) {
    const row = document.createElement('div');
    row.className = 'member';
    const status = m.alive ? `Age ${m.age}` : `Died at ${m.deathAge}`;
    row.innerHTML = `<div><div>${m.firstName} ${m.lastName} <span class="tag">${relationLabel(m)}</span></div><div class="meta">${status}</div><div class="rel"><i style="width:${m.relationship}%"></i></div></div>`;
    const b = document.createElement('button');
    b.textContent = 'Spend time';
    b.disabled = !m.alive || state.yearActions.familyTime.includes(m.id);
    b.addEventListener('click', () => {
      const r = actions.spendTime(state, m);
      ctx.onChange();
      result(r);
    });
    row.appendChild(b);
    wrap.appendChild(row);
  }
  return wrap;
}

export function openMenu(kind: BuildingKind, state: GameState, ctx: MenuContext): void {
  if (!current || current.kind !== kind) lastResult = null;
  current = { kind, state, ctx };
  const age = state.player.age;
  const title = BUILDING_LABEL[kind];
  switch (kind) {
    case 'home': {
      const panel = familyPanel(state, ctx, (r) => {
        lastResult = r;
        openMenu('home', state, ctx);
      });
      renderMenu(title, `Home sweet home. ${money(state.money)} in my piggy bank.`, [
        {
          label: 'Go to sleep (Age Up)',
          hint: 'Advance one year',
          run: () => {
            closeMenu();
            ctx.onAgeUp();
            return { text: '', mood: 'neutral' };
          },
        },
      ], ctx, panel);
      return;
    }
    case 'school': {
      if (!isEnrolled(state)) {
        const msg = age < 5 ? "I'm too young for school." : `I'm no longer a student. (${stageLabel(state.education.stage)})`;
        renderMenu(title, msg, [], ctx);
        return;
      }
      renderMenu(title, `${stageLabel(state.education.stage)} · Current grade: ${gradeLetter(state.education.grade)} (${state.education.grade}/100)`, [
        { label: 'Study harder', hint: 'Boosts grades and smarts, costs some happiness', disabled: state.yearActions.studied, run: () => actions.study(state) },
        { label: 'Skip school', hint: 'Fun now, grades later', disabled: state.yearActions.skipped, run: () => actions.skipSchool(state) },
        ...(state.education.stage === 'high' && age >= 16
          ? [{ label: 'Drop out', hint: 'Leave school for good', run: () => actions.leaveSchool(state) }]
          : []),
      ], ctx);
      return;
    }
    case 'hospital': {
      renderMenu(title, 'The waiting room smells like hand sanitizer.', [
        { label: 'Get a checkup', hint: 'Free. See how healthy I really am', run: () => actions.checkup(state) },
        { label: 'Seek treatment', hint: 'Costs money, restores health', run: () => actions.treatment(state) },
      ], ctx);
      return;
    }
    case 'gym': {
      renderMenu(title, `Workouts this year: ${state.yearActions.workouts}/3 · $20 per session`, [
        { label: 'Work out', hint: '+Health +Looks', disabled: age < 12, run: () => actions.workout(state) },
      ], ctx);
      return;
    }
    case 'store': {
      const items = [
        { name: 'candy', cost: 5, effects: { happiness: 3, health: -1 }, log: 'I bought a bag of candy and ate it all at once.' },
        { name: 'a new outfit', cost: 60, effects: { looks: 3, happiness: 2 }, log: 'I bought a new outfit and strutted around town.' },
        { name: 'a stack of books', cost: 40, effects: { smarts: 3, happiness: 1 }, log: 'I bought a stack of books and read every one.' },
        { name: 'a skincare kit', cost: 90, effects: { looks: 4 }, log: 'I bought a skincare kit. My face thanks me.' },
      ];
      renderMenu(title, `I have ${money(state.money)}.`, items.map((it) => ({
        label: `Buy ${it.name}`,
        hint: `$${it.cost}`,
        disabled: state.money < it.cost,
        run: () => actions.buyItem(state, it),
      })), ctx);
      return;
    }
    case 'cemetery': {
      const dead = state.family.filter((m) => !m.alive);
      const text = dead.length
        ? 'Resting here: ' + dead.map((m) => `${m.firstName} ${m.lastName} (${relationLabel(m)}, ${m.deathAge})`).join(', ')
        : 'Quiet. Nobody I know is buried here yet.';
      renderMenu(title, text, [], ctx);
      return;
    }
    case 'bar': {
      renderMenu(title, age < 18 ? 'The bouncer laughs and points at the door. Come back when you are 18.' : 'Dating, drinks and bad decisions arrive in a future update.', [], ctx);
      return;
    }
    case 'office': {
      renderMenu(title, age < 16 ? 'The receptionist asks if I am lost.' : 'Careers, job listings and promotions arrive in a future update.', [], ctx);
      return;
    }
    case 'bank': {
      renderMenu(title, `Balance: ${money(state.money)}. Loans, savings and investments arrive in a future update.`, [], ctx);
      return;
    }
    case 'courthouse': {
      renderMenu(title, 'Lawsuits, trials and licenses arrive in a future update.', [], ctx);
      return;
    }
    case 'prison': {
      renderMenu(title, 'Nothing to see here. Yet. Crime and prison arrive in a future update.', [], ctx);
      return;
    }
  }
}
