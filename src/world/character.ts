import * as THREE from 'three';
import type { Genome, Gender } from '../core/types';
import { box, mat } from './buildings';

const SKIN = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3a1e];
const HAIR = [0x2b1b0e, 0x5a3a1a, 0xa0622d, 0xd9a441, 0xf2e4b8, 0x1a1a1a];
const SHIRT = [0xe63946, 0x457b9d, 0x2a9d8f, 0xf4a261, 0x8338ec, 0xffb703, 0x06d6a0, 0xef476f];
const PANTS = [0x1d3557, 0x3a3a3a, 0x6c584c, 0x264653, 0x8d99ae];
const GREY = 0xbdbdbd;

export interface AvatarParts {
  head: THREE.Mesh;
  hair: THREE.Group;
  torso: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  cane?: THREE.Mesh;
}

export class Avatar {
  readonly group = new THREE.Group();
  readonly body = new THREE.Group();
  readonly parts: AvatarParts;
  private hairMat: THREE.MeshStandardMaterial;
  private walkPhase = 0;
  private falling = false;
  private fallT = 0;
  age = 20;
  readonly gender: Gender;
  readonly genome: Genome;

  constructor(genome: Genome, gender: Gender, age = 0) {
    this.genome = genome;
    this.gender = gender;
    const skin = SKIN[genome.skin % SKIN.length];
    const shirt = SHIRT[genome.shirt % SHIRT.length];
    const pants = PANTS[genome.pants % PANTS.length];
    this.hairMat = new THREE.MeshStandardMaterial({ color: HAIR[genome.hairColor % HAIR.length], roughness: 0.9 });

    const head = box(0.5, 0.5, 0.5, skin, 0, 0, 0);
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
    const eyeMat = mat(0x111111, { roughness: 0.4 });
    for (const sx of [-0.12, 0.12]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(sx, 0.05, 0.26);
      head.add(eye);
    }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), mat(0x9c4a3a));
    mouth.position.set(0, -0.14, 0.26);
    head.add(mouth);

    const hair = new THREE.Group();
    const style = genome.hairStyle % 4;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.54), this.hairMat);
    cap.position.y = 0.2;
    hair.add(cap);
    if (style === 1 || gender === 'female') {
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.45, 0.14), this.hairMat);
      back.position.set(0, -0.05, -0.22);
      hair.add(back);
    }
    if (style === 2) {
      const tuft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.3), this.hairMat);
      tuft.position.set(0, 0.36, 0.05);
      hair.add(tuft);
    }
    if (style === 1 && gender === 'female') {
      for (const sx of [-0.3, 0.3]) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.4), this.hairMat);
        side.position.set(sx, -0.08, -0.05);
        hair.add(side);
      }
    }
    head.add(hair);

    const torso = box(0.5, 0.6, 0.3, shirt, 0, 0, 0);
    const armL = this.limb(0.14, 0.55, 0.14, shirt, skin, true);
    const armR = this.limb(0.14, 0.55, 0.14, shirt, skin, true);
    const legL = this.limb(0.2, 0.6, 0.2, pants, 0x222222, false);
    const legR = this.limb(0.2, 0.6, 0.2, pants, 0x222222, false);

    this.body.add(head, torso, armL, armR, legL, legR);
    this.group.add(this.body);
    this.parts = { head, hair, torso, armL, armR, legL, legR };
    this.setAge(age);
    this.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
  }

  private limb(w: number, h: number, d: number, topColor: number, tipColor: number, sleeve: boolean): THREE.Group {
    const g = new THREE.Group();
    const upper = box(w, sleeve ? h * 0.5 : h, d, topColor, 0, sleeve ? -h * 0.25 : -h / 2, 0);
    g.add(upper);
    if (sleeve) {
      const lower = box(w * 0.95, h * 0.5, d * 0.95, tipColor, 0, -h * 0.75, 0);
      g.add(lower);
    } else {
      const shoe = box(w * 1.1, 0.1, d * 1.3, tipColor, 0, -h - 0.05, d * 0.1);
      g.add(shoe);
    }
    return g;
  }

  setAge(age: number): void {
    this.age = age;
    const t = THREE.MathUtils.clamp(age, 0, 100);
    const scale = t < 1 ? 0.42 : t < 6 ? THREE.MathUtils.lerp(0.42, 0.62, (t - 1) / 5)
      : t < 13 ? THREE.MathUtils.lerp(0.62, 0.8, (t - 6) / 7)
      : t < 18 ? THREE.MathUtils.lerp(0.8, 1.0, (t - 13) / 5)
      : t < 65 ? 1.0 : THREE.MathUtils.lerp(1.0, 0.94, Math.min(1, (t - 65) / 20));
    const headScale = t < 1 ? 1.5 : t < 6 ? THREE.MathUtils.lerp(1.5, 1.25, (t - 1) / 5) : t < 14 ? THREE.MathUtils.lerp(1.25, 1.0, (t - 6) / 8) : 1.0;

    const legH = 0.6;
    const torsoH = 0.6;
    const p = this.parts;
    p.legL.position.set(-0.13, legH + 0.05, 0);
    p.legR.position.set(0.13, legH + 0.05, 0);
    p.torso.position.set(0, legH + 0.05 + torsoH / 2, 0);
    p.armL.position.set(-0.33, legH + 0.05 + torsoH - 0.02, 0);
    p.armR.position.set(0.33, legH + 0.05 + torsoH - 0.02, 0);
    p.head.position.set(0, legH + 0.05 + torsoH + 0.25 * headScale + 0.03, 0);
    p.head.scale.setScalar(headScale);

    this.body.scale.setScalar(scale);
    const hunch = t >= 65 ? Math.min(1, (t - 65) / 25) * 0.25 : 0;
    this.body.rotation.x = hunch;

    const grey = t >= 45 ? Math.min(1, (t - 45) / 25) : 0;
    const base = new THREE.Color(HAIR[this.genome.hairColor % HAIR.length]);
    this.hairMat.color.copy(base.lerp(new THREE.Color(GREY), grey));
    const bald = this.gender === 'male' && this.genome.hairStyle === 3 && t >= 40;
    p.hair.visible = !bald;

    if (t >= 70 && !p.cane) {
      const cane = box(0.06, 0.9, 0.06, 0x5b3a1e, 0.45, 0.45, 0.2);
      this.body.add(cane);
      p.cane = cane;
    } else if (t < 70 && p.cane) {
      this.body.remove(p.cane);
      p.cane = undefined;
    }
  }

  get walkSpeed(): number {
    const a = this.age;
    if (a < 1) return 1.2;
    if (a < 6) return 2.6;
    if (a < 13) return 3.6;
    if (a < 60) return 4.2;
    if (a < 75) return 3.2;
    return 2.2;
  }

  get radius(): number {
    return 0.35 * this.body.scale.x;
  }

  fall(): void {
    this.falling = true;
    this.fallT = 0;
  }

  reset(): void {
    this.falling = false;
    this.group.rotation.x = 0;
    this.group.position.y = 0;
  }

  animate(dt: number, moving: boolean, t: number): void {
    const p = this.parts;
    if (this.falling) {
      this.fallT = Math.min(1, this.fallT + dt * 1.2);
      const e = 1 - Math.pow(1 - this.fallT, 3);
      this.group.rotation.x = -Math.PI / 2 * e;
      this.group.position.y = 0.25 * e;
      return;
    }
    if (moving) {
      this.walkPhase += dt * (this.age < 1 ? 6 : 9);
      const s = Math.sin(this.walkPhase) * 0.7;
      p.legL.rotation.x = s;
      p.legR.rotation.x = -s;
      p.armL.rotation.x = -s * 0.8;
      p.armR.rotation.x = s * 0.8;
      this.body.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.05;
    } else {
      const k = Math.min(1, dt * 10);
      p.legL.rotation.x += (0 - p.legL.rotation.x) * k;
      p.legR.rotation.x += (0 - p.legR.rotation.x) * k;
      p.armL.rotation.x += (Math.sin(t * 1.5) * 0.05 - p.armL.rotation.x) * k;
      p.armR.rotation.x += (-Math.sin(t * 1.5) * 0.05 - p.armR.rotation.x) * k;
      this.body.position.y += (Math.sin(t * 2) * 0.01 - this.body.position.y) * k;
    }
  }
}
