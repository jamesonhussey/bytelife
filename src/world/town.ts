import * as THREE from 'three';
import type { BuildingKind } from '../core/types';
import { Rng } from '../core/rng';
import { buildBuilding, box, mat, textSprite, BUILDING_LABEL } from './buildings';

export const GRID = 7;
export const LOT = 16;
export const ROAD = 6;
export const PITCH = LOT + ROAD;
export const HALF = ((GRID - 1) / 2) * PITCH + LOT / 2 + ROAD;

export interface PlacedBuilding {
  kind: BuildingKind;
  label: string;
  position: THREE.Vector3;
  door: THREE.Vector3;
  box: THREE.Box3;
  group: THREE.Group;
}

export interface Town {
  root: THREE.Group;
  buildings: PlacedBuilding[];
  colliders: THREE.Box3[];
  homeSpawn: THREE.Vector3;
  byKind: (k: BuildingKind) => PlacedBuilding;
  addGravestone: (name: string, years: string) => void;
}

const KINDS: BuildingKind[] = ['school', 'hospital', 'gym', 'store', 'office', 'bank', 'bar', 'courthouse', 'prison', 'cemetery'];

function lotCenter(i: number, j: number): THREE.Vector3 {
  return new THREE.Vector3((i - (GRID - 1) / 2) * PITCH, 0, (j - (GRID - 1) / 2) * PITCH);
}

export function buildTown(seed: number): Town {
  const rng = new Rng(seed ^ 0x5eed);
  const root = new THREE.Group();
  const colliders: THREE.Box3[] = [];
  const buildings: PlacedBuilding[] = [];

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2 + 80, HALF * 2 + 80), mat(0x6fae4e, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const roadMat = mat(0x3a3f47, { roughness: 0.95 });
  const walkMat = mat(0xb8b4a8, { roughness: 0.9 });
  const lineMat = mat(0xf2e6a0, { roughness: 0.8 });
  const span = HALF * 2;
  for (let k = 0; k <= GRID; k++) {
    const c = (k - GRID / 2) * PITCH;
    const h = new THREE.Mesh(new THREE.PlaneGeometry(span, ROAD), roadMat);
    h.rotation.x = -Math.PI / 2;
    h.position.set(0, 0.01, c);
    h.receiveShadow = true;
    root.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(ROAD, span), roadMat);
    v.rotation.x = -Math.PI / 2;
    v.position.set(c, 0.01, 0);
    v.receiveShadow = true;
    root.add(v);
    for (const side of [-1, 1]) {
      const hw = new THREE.Mesh(new THREE.PlaneGeometry(span, 1.2), walkMat);
      hw.rotation.x = -Math.PI / 2;
      hw.position.set(0, 0.015, c + side * (ROAD / 2 + 0.6));
      root.add(hw);
      const vw = new THREE.Mesh(new THREE.PlaneGeometry(1.2, span), walkMat);
      vw.rotation.x = -Math.PI / 2;
      vw.position.set(c + side * (ROAD / 2 + 0.6), 0.015, 0);
      root.add(vw);
    }
  }
  const dashGeo = new THREE.PlaneGeometry(2, 0.25);
  const dashCount = Math.floor(span / 4);
  const dashes = new THREE.InstancedMesh(dashGeo, lineMat, dashCount * (GRID + 1) * 2);
  const dummy = new THREE.Object3D();
  let di = 0;
  for (let k = 0; k <= GRID; k++) {
    const c = (k - GRID / 2) * PITCH;
    for (let n = 0; n < dashCount; n++) {
      const p = -span / 2 + 2 + n * 4;
      dummy.position.set(p, 0.02, c);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      dashes.setMatrixAt(di++, dummy.matrix);
      dummy.position.set(c, 0.02, p);
      dummy.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      dummy.updateMatrix();
      dashes.setMatrixAt(di++, dummy.matrix);
    }
  }
  root.add(dashes);

  const center = (GRID - 1) / 2;
  const lots: [number, number][] = [];
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) lots.push([i, j]);
  const homeLot: [number, number] = [center, center + 1];
  const candidates = lots.filter(([i, j]) => !(i === homeLot[0] && j === homeLot[1]) && Math.abs(i - center) + Math.abs(j - center) <= 4);
  rng.shuffle(candidates);
  const near = candidates.filter(([i, j]) => Math.abs(i - center) + Math.abs(j - center) <= 2);
  const far = candidates.filter(([i, j]) => Math.abs(i - center) + Math.abs(j - center) > 2);
  const ordered = [...near, ...far];

  const assignments = new Map<string, BuildingKind>();
  assignments.set(homeLot.join(','), 'home');
  const kindOrder = [...KINDS];
  const prioritized: BuildingKind[] = ['school', 'hospital', 'gym', 'store'];
  const rest = rng.shuffle(kindOrder.filter((k) => !prioritized.includes(k)));
  const placeOrder = [...prioritized, ...rest];
  let li = 0;
  for (const kind of placeOrder) {
    while (li < ordered.length && assignments.has(ordered[li].join(','))) li++;
    if (li >= ordered.length) break;
    assignments.set(ordered[li].join(','), kind);
    li++;
  }

  const homeColor = rng.pick([0xf2d6a2, 0xcfe3f5, 0xf6c7c7, 0xd7eccb, 0xf3e0b3, 0xe0d4f5]);

  const treeTrunk = new THREE.CylinderGeometry(0.18, 0.25, 1.4, 6);
  const treeTop = new THREE.ConeGeometry(1.1, 2.4, 6);
  const treeTop2 = new THREE.ConeGeometry(0.85, 1.8, 6);
  const trunkMat = mat(0x6b4a2b);
  const leafMats = [mat(0x3f8f3f), mat(0x4caf50), mat(0x2e7d32), mat(0x7cb342)];
  const treePositions: THREE.Vector3[] = [];

  const lampGeoPost = new THREE.CylinderGeometry(0.06, 0.08, 3.6, 6);
  const lampGeoHead = new THREE.BoxGeometry(0.5, 0.25, 0.5);
  const lampMat = mat(0x333333, { metalness: 0.5 });
  const lampLight = mat(0xfff1b8, { emissive: 0xffe08a });
  const lampGroup = new THREE.Group();

  for (const [i, j] of lots) {
    const c = lotCenter(i, j);
    const kind = assignments.get(`${i},${j}`);
    if (kind) {
      const built = buildBuilding(kind, homeColor);
      built.group.position.copy(c);
      root.add(built.group);
      const bb = new THREE.Box3(
        new THREE.Vector3(c.x - built.width / 2 - 0.4, 0, c.z - built.depth / 2 - 0.4),
        new THREE.Vector3(c.x + built.width / 2 + 0.4, 10, c.z + built.depth / 2 + 0.4),
      );
      colliders.push(bb);
      const doorWorld = built.door.clone().add(c);
      const label = textSprite(BUILDING_LABEL[kind], { size: 40, color: '#ffffff', bg: 'rgba(15,23,42,0.75)', scale: 0.01 });
      label.position.set(c.x, 7.5 + (kind === 'office' ? 11 : kind === 'hospital' ? 2.5 : 0), c.z);
      root.add(label);
      buildings.push({ kind, label: BUILDING_LABEL[kind], position: c.clone(), door: doorWorld, box: bb, group: built.group });

      const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, LOT / 2 - built.depth / 2 + 0.5), walkMat);
      path.rotation.x = -Math.PI / 2;
      path.position.set(c.x, 0.012, c.z + built.depth / 2 + (LOT / 2 - built.depth / 2) / 2 + 0.2);
      root.add(path);

      const n = rng.int(1, 3);
      for (let t = 0; t < n; t++) {
        const side = rng.chance(0.5) ? -1 : 1;
        treePositions.push(new THREE.Vector3(c.x + side * (built.width / 2 + rng.int(2, 3)), 0, c.z + rng.int(-4, 4)));
      }
    } else {
      const parkKind = rng.pick(['park', 'park', 'field', 'pond']);
      if (parkKind === 'pond') {
        const pond = new THREE.Mesh(new THREE.CircleGeometry(3.5, 20), mat(0x4aa3df, { roughness: 0.2, metalness: 0.1 }));
        pond.rotation.x = -Math.PI / 2;
        pond.position.set(c.x, 0.02, c.z);
        root.add(pond);
        for (let t = 0; t < 4; t++) treePositions.push(new THREE.Vector3(c.x + rng.int(-6, 6), 0, c.z + rng.int(-6, 6)).add(new THREE.Vector3(0, 0, 0)));
      } else {
        const n = parkKind === 'park' ? rng.int(5, 9) : rng.int(1, 3);
        for (let t = 0; t < n; t++) treePositions.push(new THREE.Vector3(c.x + rng.int(-6, 6), 0, c.z + rng.int(-6, 6)));
        if (parkKind === 'park') {
          for (let b = 0; b < 2; b++) {
            const bench = new THREE.Group();
            bench.add(box(1.6, 0.1, 0.5, 0x8d6e63, 0, 0.45, 0));
            bench.add(box(1.6, 0.5, 0.1, 0x8d6e63, 0, 0.75, -0.22));
            bench.add(box(0.1, 0.45, 0.5, 0x5d4037, -0.7, 0.22, 0));
            bench.add(box(0.1, 0.45, 0.5, 0x5d4037, 0.7, 0.22, 0));
            bench.position.set(c.x + rng.int(-4, 4), 0, c.z + rng.int(-4, 4));
            bench.rotation.y = rng.next() * Math.PI * 2;
            root.add(bench);
          }
        }
      }
    }
    for (const [dx, dz] of [[-LOT / 2 - 0.9, -LOT / 2 - 0.9], [LOT / 2 + 0.9, LOT / 2 + 0.9]]) {
      const post = new THREE.Mesh(lampGeoPost, lampMat);
      post.position.set(c.x + dx, 1.8, c.z + dz);
      post.castShadow = true;
      lampGroup.add(post);
      const head = new THREE.Mesh(lampGeoHead, lampLight);
      head.position.set(c.x + dx, 3.7, c.z + dz);
      lampGroup.add(head);
    }
  }
  root.add(lampGroup);

  const trunks = new THREE.InstancedMesh(treeTrunk, trunkMat, treePositions.length);
  const tops = new THREE.InstancedMesh(treeTop, leafMats[0], treePositions.length);
  const tops2 = new THREE.InstancedMesh(treeTop2, leafMats[1], treePositions.length);
  trunks.castShadow = tops.castShadow = tops2.castShadow = true;
  const color = new THREE.Color();
  treePositions.forEach((p, idx) => {
    const s = 0.8 + rng.next() * 0.6;
    dummy.position.set(p.x, 0.7 * s, p.z);
    dummy.rotation.set(0, rng.next() * Math.PI, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    trunks.setMatrixAt(idx, dummy.matrix);
    dummy.position.set(p.x, 1.4 * s + 1.0 * s, p.z);
    dummy.updateMatrix();
    tops.setMatrixAt(idx, dummy.matrix);
    dummy.position.set(p.x, 1.4 * s + 2.2 * s, p.z);
    dummy.updateMatrix();
    tops2.setMatrixAt(idx, dummy.matrix);
    color.setHex(leafMats[rng.int(0, leafMats.length - 1)].color.getHex());
    tops.setColorAt(idx, color);
    tops2.setColorAt(idx, color.clone().offsetHSL(0, 0, 0.06));
    colliders.push(new THREE.Box3(new THREE.Vector3(p.x - 0.35, 0, p.z - 0.35), new THREE.Vector3(p.x + 0.35, 3, p.z + 0.35)));
  });
  root.add(trunks, tops, tops2);

  const home = buildings.find((b) => b.kind === 'home')!;
  const homeSpawn = home.door.clone().add(new THREE.Vector3(0, 0, 1.5));

  const byKind = (k: BuildingKind) => buildings.find((b) => b.kind === k)!;
  let graveIndex = 0;
  const addGravestone = (name: string, years: string) => {
    const cem = byKind('cemetery');
    const x = cem.position.x - 3.5 + (graveIndex % 4) * 2.3 + 1.15;
    const z = cem.position.z - 3.5 + Math.floor(graveIndex / 4) * 2.2 + 1.1;
    graveIndex++;
    const g = new THREE.Group();
    g.add(box(0.9, 1.1, 0.25, 0xdfe3e8, 0, 0.55, 0));
    const label = textSprite(`${name}\n${years}`.split('\n')[0], { size: 30, color: '#111111', bg: '#f1f3f5', scale: 0.008 });
    label.position.set(0, 1.5, 0);
    g.add(label);
    const years2 = textSprite(years, { size: 26, color: '#444444', bg: '#f1f3f5', scale: 0.007 });
    years2.position.set(0, 1.2, 0);
    g.add(years2);
    g.position.set(x, 0, z + 0.2);
    root.add(g);
  };

  return { root, buildings, colliders, homeSpawn, byKind, addGravestone };
}
