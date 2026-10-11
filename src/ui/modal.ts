import type { Choice, GameEvent, GameState } from '../core/types';
import { eventText } from '../core/events';

const root = document.querySelector('#modal') as HTMLElement;

function effectTag(c: Choice): string {
  if (!c.effects) return '';
  const parts: string[] = [];
  const names: Record<string, string> = { happiness: '😊', health: '❤️', smarts: '🧠', looks: '✨', money: '$' };
  for (const [k, v] of Object.entries(c.effects)) {
    if (!v) continue;
    const n = v as number;
    parts.push(`${names[k] ?? k}${n > 0 ? '+' : ''}${n}`);
  }
  return parts.length ? `<span class="tag">${parts.join(' ')}</span>` : '';
}

export function showEvent(ev: GameEvent, state: GameState): Promise<Choice> {
  return new Promise((resolve) => {
    root.innerHTML = '';
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.innerHTML = `<h2>${ev.title}</h2><p>${eventText(ev, state)}</p><div class="choices"></div>`;
    const list = dialog.querySelector('.choices')!;
    ev.choices.forEach((c) => {
      const b = document.createElement('button');
      b.innerHTML = `${c.label}${effectTag(c)}`;
      b.addEventListener('click', () => {
        root.classList.add('hidden');
        resolve(c);
      });
      list.appendChild(b);
    });
    root.appendChild(dialog);
    root.classList.remove('hidden');
  });
}

export function showMessage(title: string, html: string, button = 'OK'): Promise<void> {
  return new Promise((resolve) => {
    root.innerHTML = '';
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.innerHTML = `<h2>${title}</h2><p>${html}</p><div class="choices"><button>${button}</button></div>`;
    dialog.querySelector('button')!.addEventListener('click', () => {
      root.classList.add('hidden');
      resolve();
    });
    root.appendChild(dialog);
    root.classList.remove('hidden');
  });
}
