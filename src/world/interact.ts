import * as THREE from 'three';
import type { BuildingKind } from '../core/types';
import type { PlacedBuilding } from './town';

export class Interactor {
  current: PlacedBuilding | null = null;
  enabled = true;
  private ring: THREE.Mesh;

  constructor(
    private buildings: PlacedBuilding[],
    private playerPos: THREE.Vector3,
    scene: THREE.Object3D,
    private onPromptChange: (b: PlacedBuilding | null) => void,
    private onEnter: (kind: BuildingKind) => void,
  ) {
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.25, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    for (const b of buildings) {
      const r = this.ring.clone();
      r.position.copy(b.door).setY(0.03);
      scene.add(r);
    }
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && this.current) {
        e.preventDefault();
        this.onEnter(this.current.kind);
      }
    });
  }

  enter(): void {
    if (this.current && this.enabled) this.onEnter(this.current.kind);
  }

  update(): void {
    let best: PlacedBuilding | null = null;
    let bestD = 2.8;
    for (const b of this.buildings) {
      const d = Math.hypot(b.door.x - this.playerPos.x, b.door.z - this.playerPos.z);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    if (best !== this.current) {
      this.current = best;
      this.onPromptChange(best);
    }
  }
}
