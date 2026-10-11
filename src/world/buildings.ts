import * as THREE from 'three';
import type { BuildingKind } from '../core/types';

export interface BuiltBuilding {
  group: THREE.Group;
  width: number;
  depth: number;
  door: THREE.Vector3;
}

export const BUILDING_LABEL: Record<BuildingKind, string> = {
  home: 'Home',
  school: 'School',
  hospital: 'Hospital',
  gym: 'Gym',
  store: 'General Store',
  office: 'Office Tower',
  bank: 'Bank',
  bar: 'The Rusty Nail',
  courthouse: 'Courthouse',
  prison: 'State Prison',
  cemetery: 'Cemetery',
};

const matCache = new Map<number, THREE.MeshStandardMaterial>();
export function mat(color: number, opts: { roughness?: number; metalness?: number; emissive?: number } = {}): THREE.MeshStandardMaterial {
  const key = color ^ ((opts.roughness ?? 0.85) * 1000 << 24) ^ ((opts.emissive ?? 0) << 1);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissive ? 0.8 : 0,
    });
    matCache.set(key, m);
  }
  return m;
}

export function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, opts?: Parameters<typeof mat>[1]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function textSprite(text: string, opts: { size?: number; color?: string; bg?: string; scale?: number } = {}): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const font = `bold ${opts.size ?? 48}px system-ui, sans-serif`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 40;
  const h = (opts.size ?? 48) + 28;
  canvas.width = w;
  canvas.height = h;
  ctx.font = font;
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 14);
    ctx.fill();
  }
  ctx.fillStyle = opts.color ?? '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  const s = opts.scale ?? 0.012;
  sprite.scale.set(w * s, h * s, 1);
  return sprite;
}

function signPlane(text: string, width: number, color = '#ffffff', bg = '#1f2937'): THREE.Mesh {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 128;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = color;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 64;
  while (ctx.measureText(text).width > 470 && size > 20) {
    size -= 4;
    ctx.font = `bold ${size}px system-ui, sans-serif`;
  }
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  return mesh;
}

function pitchedRoof(w: number, d: number, h: number, color: number, y: number): THREE.Mesh {
  const geo = new THREE.ConeGeometry(Math.max(w, d) * 0.75, h, 4);
  const m = new THREE.Mesh(geo, mat(color));
  m.rotation.y = Math.PI / 4;
  m.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  m.position.y = y + h / 2;
  m.castShadow = true;
  return m;
}

function windows(g: THREE.Group, w: number, h: number, d: number, floors: number, cols: number, color = 0x9ad7ff, lit = false): void {
  const geo = new THREE.BoxGeometry(0.7, 0.9, 0.06);
  const m = mat(color, lit ? { emissive: color, roughness: 0.3 } : { roughness: 0.3, metalness: 0.2 });
  const floorH = h / floors;
  for (let f = 0; f < floors; f++) {
    const y = floorH * f + floorH / 2;
    for (let c = 0; c < cols; c++) {
      const x = -w / 2 + (w / (cols + 1)) * (c + 1);
      const front = new THREE.Mesh(geo, m);
      front.position.set(x, y, d / 2 + 0.03);
      g.add(front);
      const back = new THREE.Mesh(geo, m);
      back.position.set(x, y, -d / 2 - 0.03);
      g.add(back);
    }
  }
}

function door(g: THREE.Group, w: number, d: number, color = 0x5b3a1e): void {
  const dm = box(1.2, 2.1, 0.12, color, 0, 1.05, d / 2 + 0.06);
  g.add(dm);
  const knob = box(0.1, 0.1, 0.08, 0xffd36b, 0.4, 1.0, d / 2 + 0.14);
  g.add(knob);
  void w;
}

function columns(g: THREE.Group, w: number, d: number, h: number, count: number, color: number): void {
  const geo = new THREE.CylinderGeometry(0.3, 0.3, h, 10);
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + 1 + ((w - 2) / (count - 1)) * i;
    const c = new THREE.Mesh(geo, mat(color));
    c.position.set(x, h / 2, d / 2 + 1.2);
    c.castShadow = true;
    g.add(c);
  }
  const lintel = box(w, 0.5, 1.6, color, 0, h + 0.25, d / 2 + 1.0);
  g.add(lintel);
}

export function buildBuilding(kind: BuildingKind, homeColor = 0xf2d6a2): BuiltBuilding {
  const g = new THREE.Group();
  let w = 8;
  let d = 7;
  switch (kind) {
    case 'home': {
      w = 7; d = 6;
      g.add(box(w, 3.2, d, homeColor, 0, 1.6, 0));
      g.add(pitchedRoof(w + 0.8, d + 0.8, 2.4, 0x8b3a2f, 3.2));
      g.add(box(0.8, 1.6, 0.8, 0x6b6b6b, w / 2 - 1.2, 4.4, -1));
      windows(g, w, 3.2, d, 1, 2, 0xa8e0ff);
      door(g, w, d);
      g.add(box(1.6, 0.3, 1.2, 0x9c9c9c, 0, 0.15, d / 2 + 0.7));
      g.add(signPlane('HOME', 2.4, '#ffffff', '#3b5b2a')).position.set(0, 2.6, d / 2 + 0.07);
      break;
    }
    case 'school': {
      w = 11; d = 7;
      g.add(box(w, 4, d, 0xc8623f, 0, 2, 0));
      g.add(box(w + 0.4, 0.3, d + 0.4, 0x5c3b2e, 0, 4.15, 0));
      g.add(box(2, 2, 2, 0xe8e8e8, 0, 5.15, 0));
      g.add(pitchedRoof(2.6, 2.6, 1.4, 0x8b3a2f, 6.15));
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 8), mat(0xffd36b, { metalness: 0.6, roughness: 0.3 }));
      bell.position.set(0, 5.3, 1.05);
      g.add(bell);
      windows(g, w, 4, d, 1, 4, 0xa8e0ff);
      door(g, w, d, 0x3a2416);
      g.add(signPlane('SCHOOL', 4, '#ffffff', '#1d3557')).position.set(0, 3.3, d / 2 + 0.07);
      const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 6), mat(0xdddddd, { metalness: 0.5 }));
      flagpole.position.set(w / 2 - 1, 3, d / 2 + 2.5);
      g.add(flagpole);
      const flag = box(1.2, 0.7, 0.05, 0xe63946, w / 2 - 1 + 0.6, 5.5, d / 2 + 2.5);
      g.add(flag);
      break;
    }
    case 'hospital': {
      w = 10; d = 8;
      g.add(box(w, 7, d, 0xf4f6f8, 0, 3.5, 0));
      windows(g, w, 7, d, 3, 4, 0xbfe9ff);
      door(g, w, d, 0x7ab8d9);
      g.add(box(2.2, 0.6, 0.2, 0xe63946, 0, 8, 0, { emissive: 0xe63946 }).translateY(-0.2));
      g.add(box(0.6, 2.2, 0.2, 0xe63946, 0, 7.8, 0, { emissive: 0xe63946 }));
      g.add(box(2.2, 0.6, 0.2, 0xe63946, 0, 7.8, 0, { emissive: 0xe63946 }));
      g.add(signPlane('HOSPITAL', 4, '#e63946', '#ffffff')).position.set(0, 2.8, d / 2 + 0.07);
      g.add(box(w, 0.2, 2.5, 0xdfe6ec, 0, 2.45, d / 2 + 1.25));
      break;
    }
    case 'gym': {
      w = 9; d = 7;
      g.add(box(w, 4.5, d, 0x2b2d42, 0, 2.25, 0));
      g.add(box(w, 0.6, d, 0xef476f, 0, 4.8, 0));
      windows(g, w, 4.5, d, 1, 3, 0x8ecae6);
      door(g, w, d, 0x111111);
      g.add(signPlane('IRON GYM', 4, '#ffffff', '#ef476f')).position.set(0, 3.5, d / 2 + 0.07);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 8), mat(0x999999, { metalness: 0.8, roughness: 0.3 }));
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 5.9, 0);
      g.add(bar);
      for (const sx of [-1.2, 1.2]) {
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16), mat(0x222222));
        plate.rotation.z = Math.PI / 2;
        plate.position.set(sx, 5.9, 0);
        g.add(plate);
      }
      break;
    }
    case 'store': {
      w = 9; d = 7;
      g.add(box(w, 3.8, d, 0xf7e1a1, 0, 1.9, 0));
      g.add(box(w + 0.4, 0.3, d + 0.4, 0x8a6d3b, 0, 3.95, 0));
      windows(g, w, 3.8, d, 1, 3, 0xd8f3ff);
      door(g, w, d, 0x6b4a2b);
      const awning = box(w, 0.15, 1.8, 0x2a9d8f, 0, 2.5, d / 2 + 0.9);
      g.add(awning);
      for (let i = 0; i < 5; i++) {
        g.add(box(w / 5, 0.16, 1.8, i % 2 ? 0xffffff : 0x2a9d8f, -w / 2 + (w / 5) * (i + 0.5), 2.5, d / 2 + 0.9));
      }
      g.add(signPlane('GENERAL STORE', 5, '#ffffff', '#2a9d8f')).position.set(0, 3.3, d / 2 + 0.07);
      break;
    }
    case 'office': {
      w = 9; d = 9;
      g.add(box(w, 16, d, 0x3d5a80, 0, 8, 0, { roughness: 0.3, metalness: 0.4 }));
      windows(g, w, 16, d, 7, 4, 0x98c1d9);
      door(g, w, d, 0x1b263b);
      g.add(box(w + 0.6, 0.4, d + 0.6, 0x293241, 0, 16.2, 0));
      g.add(box(0.2, 3, 0.2, 0xdddddd, 0, 17.9, 0, { metalness: 0.6 }));
      g.add(signPlane('OFFICE', 3, '#ffffff', '#293241')).position.set(0, 3, d / 2 + 0.07);
      break;
    }
    case 'bank': {
      w = 10; d = 8;
      g.add(box(w, 5, d, 0xe9e4d4, 0, 2.5, 0));
      columns(g, w, d, 5, 4, 0xf3efe3);
      g.add(pitchedRoof(w + 0.5, 1, 1.6, 0xd4cfbf, 5).rotateY(0));
      windows(g, w, 5, d, 1, 3, 0xcfe8ff);
      door(g, w, d, 0x2f2f2f);
      g.add(signPlane('BANK', 3, '#2b2b2b', '#f0c060')).position.set(0, 3.9, d / 2 + 0.07);
      break;
    }
    case 'bar': {
      w = 8; d = 7;
      g.add(box(w, 3.6, d, 0x4a2c2a, 0, 1.8, 0));
      g.add(box(w + 0.4, 0.3, d + 0.4, 0x2a1a19, 0, 3.75, 0));
      windows(g, w, 3.6, d, 1, 2, 0xffc857, true);
      door(g, w, d, 0x1a0f0e);
      g.add(signPlane('THE RUSTY NAIL', 5, '#ffb703', '#120a0a')).position.set(0, 3.1, d / 2 + 0.07);
      const neon = box(0.15, 1.2, 0.15, 0xff4d6d, w / 2 + 0.3, 2.6, d / 2 - 0.5, { emissive: 0xff4d6d });
      g.add(neon);
      break;
    }
    case 'courthouse': {
      w = 11; d = 9;
      g.add(box(w, 6, d, 0xd9d4c7, 0, 3, 0));
      columns(g, w, d, 6, 5, 0xe8e3d6);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5a8f7b, { metalness: 0.3, roughness: 0.4 }));
      dome.position.y = 6;
      dome.castShadow = true;
      g.add(dome);
      windows(g, w, 6, d, 2, 4, 0xcfe8ff);
      door(g, w, d, 0x3a2f2a);
      g.add(signPlane('COURTHOUSE', 5, '#2b2b2b', '#e8e3d6')).position.set(0, 5.1, d / 2 + 0.07);
      break;
    }
    case 'prison': {
      w = 11; d = 9;
      g.add(box(w, 5, d, 0x6c757d, 0, 2.5, 0));
      const barGeo = new THREE.BoxGeometry(0.08, 1, 0.08);
      const barMat = mat(0x222222, { metalness: 0.7, roughness: 0.3 });
      for (let i = 0; i < 6; i++) {
        const x = -w / 2 + 1 + ((w - 2) / 5) * i;
        for (let j = 0; j < 4; j++) {
          const b = new THREE.Mesh(barGeo, barMat);
          b.position.set(x - 0.3 + j * 0.2, 3.5, d / 2 + 0.05);
          g.add(b);
        }
        g.add(box(0.8, 1, 0.05, 0x111111, x, 3.5, d / 2 + 0.01));
      }
      door(g, w, d, 0x222222);
      g.add(signPlane('STATE PRISON', 5, '#ffffff', '#343a40')).position.set(0, 2.4, d / 2 + 0.07);
      const tower = box(1.6, 3, 1.6, 0x495057, w / 2 - 1, 6.5, -d / 2 + 1);
      g.add(tower);
      g.add(box(2.2, 0.3, 2.2, 0x343a40, w / 2 - 1, 8.1, -d / 2 + 1));
      const fenceMat = mat(0xadb5bd, { metalness: 0.5, roughness: 0.4 });
      const fenceGeo = new THREE.BoxGeometry(0.05, 2.2, 0.05);
      for (let i = 0; i <= 14; i++) {
        const x = -w / 2 - 1.2 + ((w + 2.4) / 14) * i;
        const p = new THREE.Mesh(fenceGeo, fenceMat);
        p.position.set(x, 1.1, d / 2 + 2.6);
        g.add(p);
      }
      g.add(box(w + 2.4, 0.06, 0.06, 0xadb5bd, 0, 2.15, d / 2 + 2.6));
      break;
    }
    case 'cemetery': {
      w = 10; d = 9;
      const fenceMat = mat(0x222222, { metalness: 0.5, roughness: 0.5 });
      const postGeo = new THREE.BoxGeometry(0.08, 1.4, 0.08);
      const perimeter: [number, number][] = [];
      for (let i = 0; i <= 16; i++) perimeter.push([-w / 2 + (w / 16) * i, -d / 2], [-w / 2 + (w / 16) * i, d / 2]);
      for (let i = 0; i <= 14; i++) perimeter.push([-w / 2, -d / 2 + (d / 14) * i], [w / 2, -d / 2 + (d / 14) * i]);
      for (const [x, z] of perimeter) {
        if (Math.abs(x) < 1 && z > 0) continue;
        const p = new THREE.Mesh(postGeo, fenceMat);
        p.position.set(x, 0.7, z);
        g.add(p);
      }
      g.add(box(w, 0.06, 0.06, 0x222222, 0, 1.3, -d / 2));
      g.add(box(0.06, 0.06, d, 0x222222, -w / 2, 1.3, 0));
      g.add(box(0.06, 0.06, d, 0x222222, w / 2, 1.3, 0));
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          const x = -w / 2 + 1.5 + i * 2.3;
          const z = -d / 2 + 1.5 + j * 2.2;
          const stone = box(0.7, 0.9, 0.2, 0x9ca3af, x, 0.45, z);
          g.add(stone);
          const top = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12, 1, false, 0, Math.PI), mat(0x9ca3af));
          top.rotation.x = Math.PI / 2;
          top.rotation.z = Math.PI;
          top.position.set(x, 0.9, z);
          g.add(top);
        }
      }
      const arch = box(3, 0.4, 0.3, 0x333333, 0, 2.6, d / 2);
      g.add(arch);
      g.add(box(0.2, 2.6, 0.3, 0x333333, -1.4, 1.3, d / 2));
      g.add(box(0.2, 2.6, 0.3, 0x333333, 1.4, 1.3, d / 2));
      g.add(signPlane('CEMETERY', 2.8, '#dddddd', '#222222')).position.set(0, 2.6, d / 2 + 0.16);
      break;
    }
  }
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return { group: g, width: w, depth: d, door: new THREE.Vector3(0, 0, d / 2 + 1.6) };
}
