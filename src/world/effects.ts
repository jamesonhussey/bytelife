import * as THREE from 'three';

interface Burst {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;
}

export class Effects {
  private bursts: Burst[] = [];
  constructor(private scene: THREE.Scene) {}

  confetti(origin: THREE.Vector3, count = 120, colors = [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93]): void {
    const positions = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y + 1.5;
      positions[i * 3 + 2] = origin.z;
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 4;
      velocities[i * 3] = Math.cos(a) * s * 0.6;
      velocities[i * 3 + 1] = 3 + Math.random() * 5;
      velocities[i * 3 + 2] = Math.sin(a) * s * 0.6;
      c.setHex(colors[i % colors.length]);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const matl = new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 1 });
    const points = new THREE.Points(geo, matl);
    this.scene.add(points);
    this.bursts.push({ points, velocities, life: 2.2 });
  }

  gloom(origin: THREE.Vector3): void {
    this.confetti(origin, 60, [0x444444, 0x222222, 0x666666]);
  }

  update(dt: number): void {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life -= dt;
      const pos = b.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let j = 0; j < arr.length / 3; j++) {
        b.velocities[j * 3 + 1] -= 9.8 * dt;
        arr[j * 3] += b.velocities[j * 3] * dt;
        arr[j * 3 + 1] += b.velocities[j * 3 + 1] * dt;
        arr[j * 3 + 2] += b.velocities[j * 3 + 2] * dt;
        if (arr[j * 3 + 1] < 0.05) {
          arr[j * 3 + 1] = 0.05;
          b.velocities[j * 3 + 1] = 0;
          b.velocities[j * 3] *= 0.9;
          b.velocities[j * 3 + 2] *= 0.9;
        }
      }
      pos.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = Math.min(1, b.life);
      if (b.life <= 0) {
        this.scene.remove(b.points);
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
        this.bursts.splice(i, 1);
      }
    }
  }
}
