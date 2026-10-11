import type { GameState, Gender } from '../core/types';
import type { NewLifeOptions } from '../core/state';
import { fullName, money } from '../core/state';
import { COUNTRIES } from '../core/data/countries';
import { MALE_NAMES, FEMALE_NAMES, LAST_NAMES } from '../core/data/names';
import { stageLabel } from '../core/systems/school';

const root = document.querySelector('#screen') as HTMLElement;

function show(el: HTMLElement): void {
  root.innerHTML = '';
  root.appendChild(el);
  root.classList.remove('hidden');
}

export function hideScreen(): void {
  root.classList.add('hidden');
  root.innerHTML = '';
}

export function newLifeScreen(hasSave: boolean): Promise<NewLifeOptions | 'continue'> {
  return new Promise((resolve) => {
    const d = document.createElement('div');
    d.className = 'dialog form';
    let gender: Gender = Math.random() < 0.5 ? 'male' : 'female';
    const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    d.innerHTML = `
      <h1 class="title-big">BitLife 3D</h1>
      <p>Walk through a whole life, one year at a time.</p>
      <label>First name</label>
      <div class="row"><input id="fn" value="${pick(gender === 'male' ? MALE_NAMES : FEMALE_NAMES)}" /><button id="rand" class="menu-btn" style="flex:0 0 auto">🎲</button></div>
      <label>Last name</label>
      <input id="ln" value="${pick(LAST_NAMES)}" />
      <label>Gender</label>
      <div class="seg"><button data-g="male">Male</button><button data-g="female">Female</button></div>
      <label>Country</label>
      <select id="country">${COUNTRIES.map((c) => `<option>${c.name}</option>`).join('')}</select>
      <button class="primary">Start a new life</button>
      ${hasSave ? '<button class="secondary">Continue saved life</button>' : ''}
    `;
    const fn = d.querySelector('#fn') as HTMLInputElement;
    const ln = d.querySelector('#ln') as HTMLInputElement;
    const country = d.querySelector('#country') as HTMLSelectElement;
    country.value = pick(COUNTRIES).name;
    const segs = d.querySelectorAll<HTMLButtonElement>('.seg button');
    const syncSeg = () => segs.forEach((b) => b.classList.toggle('active', b.dataset.g === gender));
    segs.forEach((b) => b.addEventListener('click', () => {
      gender = b.dataset.g as Gender;
      fn.value = pick(gender === 'male' ? MALE_NAMES : FEMALE_NAMES);
      syncSeg();
    }));
    syncSeg();
    d.querySelector('#rand')!.addEventListener('click', () => {
      fn.value = pick(gender === 'male' ? MALE_NAMES : FEMALE_NAMES);
      ln.value = pick(LAST_NAMES);
      country.value = pick(COUNTRIES).name;
    });
    d.querySelector('.primary')!.addEventListener('click', () => {
      hideScreen();
      resolve({ firstName: fn.value.trim(), lastName: ln.value.trim(), gender, country: country.value });
    });
    d.querySelector('.secondary')?.addEventListener('click', () => {
      hideScreen();
      resolve('continue');
    });
    show(d);
  });
}

export function deathScreen(state: GameState): Promise<void> {
  return new Promise((resolve) => {
    const p = state.player;
    const d = document.createElement('div');
    d.className = 'dialog form';
    const goodYears = state.log.filter((l) => l.mood === 'good').length;
    const badYears = state.log.filter((l) => l.mood === 'bad').length;
    const survivors = state.family.filter((m) => m.alive).map((m) => m.firstName);
    d.innerHTML = `
      <h2>Rest in Peace</h2>
      <p><b>${fullName(p)}</b> died at age <b>${state.death?.age}</b> from <b>${state.death?.cause}</b>.</p>
      <div class="summary">
        <div>Net worth<b>${money(state.money)}</b></div>
        <div>Education<b>${stageLabel(state.education.stage)}</b></div>
        <div>Happiness<b>${p.stats.happiness}</b></div>
        <div>Smarts<b>${p.stats.smarts}</b></div>
        <div>Good memories<b>${goodYears}</b></div>
        <div>Hard times<b>${badYears}</b></div>
      </div>
      <p>${survivors.length ? `Survived by ${survivors.join(', ')}.` : 'Outlived everyone they knew.'}</p>
      <button class="primary">Start a new life</button>
    `;
    d.querySelector('.primary')!.addEventListener('click', () => {
      hideScreen();
      resolve();
    });
    show(d);
  });
}
