import type { LogEntry } from '../core/types';

export class LifeLog {
  private entries = document.querySelector('#log .entries') as HTMLElement;

  clear(): void {
    this.entries.innerHTML = '';
  }

  append(entry: LogEntry, scroll = true): void {
    const el = document.createElement('div');
    const isAge = entry.text.startsWith('--- Age');
    el.className = `entry ${isAge ? 'age' : entry.mood}`;
    el.textContent = isAge ? `Age ${entry.age}` : entry.text;
    this.entries.appendChild(el);
    if (scroll) this.entries.scrollTop = this.entries.scrollHeight;
  }

  load(entries: LogEntry[]): void {
    this.clear();
    for (const e of entries) this.append(e, false);
    this.entries.scrollTop = this.entries.scrollHeight;
  }
}
