import * as THREE from 'three';
import type { GameState, Person } from '../core/types';
import { Avatar } from './character';
import { textSprite } from './buildings';
import type { Town } from './town';

interface Npc {
  person: Person;
  avatar: Avatar;
  label: THREE.Sprite;
  wanderTarget: THREE.Vector3;
  home: THREE.Vector3;
  pause: number;
}

export class NpcManager {
  readonly root = new THREE.Group();
  private npcs = new Map<string, Npc>();
  private graved = new Set<string>();
  private town: Town;

  constructor(town: Town) {
    this.town = town;
  }

  sync(state: GameState): void {
    const home = this.town.byKind('home');
    const slots = [
      new THREE.Vector3(-4.5, 0, 4.5),
      new THREE.Vector3(4.5, 0, 4.5),
      new THREE.Vector3(-5, 0, -1),
      new THREE.Vector3(5, 0, -1),
      new THREE.Vector3(-2, 0, 6),
    ];
    let slot = 0;
    for (const person of state.family) {
      const existing = this.npcs.get(person.id);
      if (!person.alive) {
        if (existing) {
          this.root.remove(existing.avatar.group, existing.label);
          this.npcs.delete(person.id);
        }
        if (!this.graved.has(person.id)) {
          this.graved.add(person.id);
          this.town.addGravestone(`${person.firstName} ${person.lastName}`, `${(person.deathAge ?? person.age)} yrs · ${person.deathCause ?? ''}`.trim());
        }
        continue;
      }
      const base = home.position.clone().add(slots[slot % slots.length]);
      slot++;
      if (existing) {
        existing.avatar.setAge(person.age);
        existing.home.copy(base);
        continue;
      }
      const avatar = new Avatar(person.genome, person.gender, person.age);
      avatar.group.position.copy(base);
      avatar.group.rotation.y = Math.random() * Math.PI * 2;
      const rel = person.relation.charAt(0).toUpperCase() + person.relation.slice(1);
      const label = textSprite(`${person.firstName} · ${rel}`, { size: 34, bg: 'rgba(0,0,0,0.55)', scale: 0.008 });
      this.root.add(avatar.group, label);
      this.npcs.set(person.id, {
        person,
        avatar,
        label,
        wanderTarget: base.clone(),
        home: base,
        pause: Math.random() * 3,
      });
    }
  }

  update(dt: number, t: number): void {
    for (const npc of this.npcs.values()) {
      const pos = npc.avatar.group.position;
      const toTarget = npc.wanderTarget.clone().sub(pos);
      toTarget.y = 0;
      const dist = toTarget.length();
      let moving = false;
      if (npc.pause > 0) {
        npc.pause -= dt;
      } else if (dist > 0.2) {
        const speed = Math.min(npc.avatar.walkSpeed * 0.5, 1.6);
        toTarget.normalize();
        pos.addScaledVector(toTarget, speed * dt);
        npc.avatar.group.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        moving = true;
      } else {
        npc.pause = 1.5 + Math.random() * 4;
        npc.wanderTarget.copy(npc.home).add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 3));
      }
      npc.avatar.animate(dt, moving, t);
      npc.label.position.set(pos.x, 2.1 * npc.avatar.body.scale.x + 0.3, pos.z);
    }
  }

  dispose(): void {
    this.root.clear();
    this.npcs.clear();
  }
}
