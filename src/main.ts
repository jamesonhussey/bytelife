import * as THREE from 'three';
import type { GameEvent, GameState, BuildingKind } from './core/types';
import { newLife, load, save, clearSave } from './core/state';
import { beginYear, resolveChoice } from './core/ageUp';
import { on } from './core/bus';
import { SceneHost } from './world/scene';
import { buildTown, type Town } from './world/town';
import { Avatar } from './world/character';
import { NpcManager } from './world/npcs';
import { PlayerController } from './world/controller';
import { Interactor } from './world/interact';
import { Effects } from './world/effects';
import { Hud } from './ui/hud';
import { LifeLog } from './ui/log';
import { showEvent, showMessage } from './ui/modal';
import { openMenu, closeMenu, isMenuOpen } from './ui/menus';
import { newLifeScreen, deathScreen } from './ui/screens';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const host = new SceneHost(canvas);
const effects = new Effects(host.scene);
const log = new LifeLog();
const vignette = document.getElementById('vignette')!;

let state: GameState;
let town: Town;
let avatar: Avatar;
let npcs: NpcManager;
let controller: PlayerController;
let interactor: Interactor;
let busy = false;
let worldGroup: THREE.Group | null = null;
let stopTick: (() => void) | null = null;

const hud = new Hud(() => void ageUp(), () => interactor?.enter());

on('log', (e) => log.append(e));
on('stats', (s) => hud.render(s));
on('age', (s) => {
  hud.render(s);
  avatar.setAge(s.player.age);
  host.setTimeOfDay(0.22 + (s.player.age % 12) / 12);
});
on('beat', (mood) => {
  if (mood === 'good') effects.confetti(avatar.group.position);
  else if (mood === 'bad') effects.gloom(avatar.group.position);
});

function setInputEnabled(v: boolean): void {
  controller.enabled = v;
  interactor.enabled = v;
  if (!v) hud.setPrompt(null);
}

function buildWorld(s: GameState): void {
  if (worldGroup) {
    host.scene.remove(worldGroup);
    worldGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
  }
  stopTick?.();
  vignette.classList.remove('dead');

  worldGroup = new THREE.Group();
  town = buildTown(s.seed);
  worldGroup.add(town.root);

  avatar = new Avatar(s.player.genome, s.player.gender, s.player.age);
  avatar.group.position.copy(town.homeSpawn);
  worldGroup.add(avatar.group);

  npcs = new NpcManager(town);
  npcs.sync(s);
  worldGroup.add(npcs.root);

  host.scene.add(worldGroup);

  controller = new PlayerController(avatar, host.camera, town.colliders, canvas, worldGroup);
  controller.yaw = 0;
  controller.snapCamera();
  interactor = new Interactor(
    town.buildings,
    avatar.group.position,
    worldGroup,
    (b) => hud.setPrompt(b ? `Enter ${b.label}` : null),
    (kind) => enterBuilding(kind),
  );

  stopTick = host.onTick((dt, t) => {
    controller.update(dt);
    interactor.update();
    avatar.animate(dt, controller.moving, t);
    npcs.update(dt, t);
    effects.update(dt);
  });

  host.setTimeOfDay(0.22 + (s.player.age % 12) / 12);
  hud.render(s);
  log.load(s.log);
}

function enterBuilding(kind: BuildingKind): void {
  if (busy || state.dead) return;
  if (isMenuOpen()) return;
  setInputEnabled(false);
  openMenu(kind, state, {
    onChange: () => {
      hud.render(state);
      npcs.sync(state);
    },
    onAgeUp: () => void ageUp(),
    onBeat: () => {},
  });
  const observer = new MutationObserver(() => {
    if (!isMenuOpen()) {
      observer.disconnect();
      if (!busy) setInputEnabled(true);
    }
  });
  observer.observe(document.getElementById('menu')!, { attributes: true, attributeFilter: ['class'] });
}

async function runEventChain(ev: GameEvent): Promise<void> {
  let current: GameEvent | undefined = ev;
  while (current && !state.dead) {
    const choice = await showEvent(current, state);
    current = resolveChoice(state, current, choice);
    hud.render(state);
  }
}

async function ageUp(): Promise<void> {
  if (busy || state.dead) return;
  busy = true;
  closeMenu();
  setInputEnabled(false);
  hud.setBusy(true);
  const prevZoom = controller.zoom;
  controller.zoom = 0.75;

  const result = beginYear(state);
  npcs.sync(state);
  hud.render(state);

  if (!result.died) {
    for (const ev of result.events) {
      await runEventChain(ev);
      if (state.dead) break;
    }
  }

  if (state.dead) {
    await handleDeath();
    return;
  }

  controller.zoom = prevZoom;
  busy = false;
  hud.setBusy(false);
  setInputEnabled(true);
}

async function handleDeath(): Promise<void> {
  vignette.classList.add('dead');
  avatar.fall();
  controller.zoom = 0.6;
  await new Promise((r) => setTimeout(r, 1600));
  await deathScreen(state);
  clearSave();
  await startNewLife(false);
}

async function startNewLife(allowContinue: boolean): Promise<void> {
  busy = true;
  const saved = allowContinue ? load() : null;
  const choice = await newLifeScreen(!!saved && !saved.dead);
  const fresh = !(choice === 'continue' && saved);
  if (!fresh) {
    state = saved!;
  } else {
    state = newLife(choice === 'continue' ? {} : choice);
    save(state);
  }
  buildWorld(state);
  busy = false;
  hud.setBusy(false);
  setInputEnabled(true);
  if (fresh) {
    await showMessage('A new life begins', `You were born in <b>${state.city}, ${state.country}</b>. Walk around town with <b>WASD</b> or click to move. Press <b>E</b> at a doorway to go inside. Age up from the button or by sleeping at home.`, 'Let\'s go');
  }
}

host.start();
void startNewLife(true);

if (import.meta.env.DEV) {
  (window as unknown as { __game: unknown }).__game = {
    get state() { return state; },
    goto(kind: BuildingKind) {
      const b = town.byKind(kind);
      controller.teleport(b.door.clone().add(new THREE.Vector3(0, 0, 0.5)));
    },
    setAge(age: number) { avatar.setAge(age); },
    enter(kind: BuildingKind) { enterBuilding(kind); },
  };
}
