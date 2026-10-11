import * as THREE from 'three';
import type { Avatar } from './character';
import { HALF } from './town';

export class PlayerController {
  readonly keys = new Set<string>();
  yaw = 0;
  private target: THREE.Vector3 | null = null;
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragging = false;
  private dragMoved = false;
  private lastX = 0;
  enabled = true;
  moving = false;
  zoom = 1;
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private marker: THREE.Mesh;

  constructor(
    private avatar: Avatar,
    private camera: THREE.PerspectiveCamera,
    private colliders: THREE.Box3[],
    canvas: HTMLCanvasElement,
    scene: THREE.Object3D,
  ) {
    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.visible = false;
    scene.add(this.marker);

    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      this.keys.add(e.key.toLowerCase());
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        this.target = null;
        this.marker.visible = false;
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.dragging = true;
      this.dragMoved = false;
      this.lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      if (Math.abs(dx) > 3) this.dragMoved = true;
      if (this.dragMoved || e.buttons === 2) {
        this.yaw -= dx * 0.006;
        this.lastX = e.clientX;
      }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      canvas.releasePointerCapture(e.pointerId);
      if (!this.dragMoved && e.button === 0 && this.enabled) this.clickToMove(e.clientX, e.clientY);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => {
      this.zoom = THREE.MathUtils.clamp(this.zoom + e.deltaY * 0.0008, 0.6, 1.8);
    }, { passive: true });

    this.camPos.copy(camera.position);
    this.camLook.copy(avatar.group.position);
  }

  private clickToMove(cx: number, cy: number): void {
    const ndc = new THREE.Vector2((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
      hit.x = THREE.MathUtils.clamp(hit.x, -HALF + 1, HALF - 1);
      hit.z = THREE.MathUtils.clamp(hit.z, -HALF + 1, HALF - 1);
      this.target = hit;
      this.marker.position.set(hit.x, 0.03, hit.z);
      this.marker.visible = true;
    }
  }

  teleport(pos: THREE.Vector3): void {
    this.avatar.group.position.copy(pos);
    this.target = null;
    this.marker.visible = false;
    this.snapCamera();
  }

  snapCamera(): void {
    const offset = this.cameraOffset();
    this.camPos.copy(this.avatar.group.position).add(offset);
    this.camLook.copy(this.avatar.group.position).add(new THREE.Vector3(0, 1.2, 0));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  private cameraOffset(): THREE.Vector3 {
    const dist = 9.5 * this.zoom;
    const height = 8 * this.zoom;
    return new THREE.Vector3(Math.sin(this.yaw) * dist, height, Math.cos(this.yaw) * dist);
  }

  update(dt: number): void {
    const pos = this.avatar.group.position;
    const move = new THREE.Vector3();
    if (this.enabled) {
      if (this.keys.has('q')) this.yaw += dt * 1.8;
      if (this.keys.has('e') && !this.keys.has('shift')) {/* reserved for interact */}
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      if (this.keys.has('w') || this.keys.has('arrowup')) move.add(forward);
      if (this.keys.has('s') || this.keys.has('arrowdown')) move.sub(forward);
      if (this.keys.has('a') || this.keys.has('arrowleft')) move.sub(right);
      if (this.keys.has('d') || this.keys.has('arrowright')) move.add(right);
      if (this.keys.has('z')) this.yaw -= dt * 1.8;
      if (this.keys.has('c')) this.yaw += dt * 1.8;

      if (move.lengthSq() === 0 && this.target) {
        const to = this.target.clone().sub(pos);
        to.y = 0;
        if (to.length() < 0.25) {
          this.target = null;
          this.marker.visible = false;
        } else {
          move.copy(to.normalize());
        }
      }
    }

    this.moving = move.lengthSq() > 0;
    if (this.moving) {
      move.normalize().multiplyScalar(this.avatar.walkSpeed * dt);
      const next = pos.clone().add(move);
      this.resolveCollisions(next);
      next.x = THREE.MathUtils.clamp(next.x, -HALF + 1, HALF - 1);
      next.z = THREE.MathUtils.clamp(next.z, -HALF + 1, HALF - 1);
      const actual = next.clone().sub(pos);
      if (actual.lengthSq() > 1e-6) {
        const targetYaw = Math.atan2(actual.x, actual.z);
        let diff = targetYaw - this.avatar.group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.avatar.group.rotation.y += diff * Math.min(1, dt * 14);
      } else {
        this.moving = false;
        this.target = null;
        this.marker.visible = false;
      }
      pos.copy(next);
    }

    const offset = this.cameraOffset();
    const desired = pos.clone().add(offset);
    const k = 1 - Math.pow(0.001, dt);
    this.camPos.lerp(desired, k);
    this.camLook.lerp(pos.clone().add(new THREE.Vector3(0, 1.2 * this.avatar.body.scale.x + 0.3, 0)), k);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  private resolveCollisions(next: THREE.Vector3): void {
    const r = Math.max(0.3, this.avatar.radius);
    for (let iter = 0; iter < 3; iter++) {
      let pushed = false;
      for (const b of this.colliders) {
        if (next.x + r < b.min.x || next.x - r > b.max.x || next.z + r < b.min.z || next.z - r > b.max.z) continue;
        const dxMin = next.x + r - b.min.x;
        const dxMax = b.max.x - (next.x - r);
        const dzMin = next.z + r - b.min.z;
        const dzMax = b.max.z - (next.z - r);
        const m = Math.min(dxMin, dxMax, dzMin, dzMax);
        if (m === dxMin) next.x -= dxMin;
        else if (m === dxMax) next.x += dxMax;
        else if (m === dzMin) next.z -= dzMin;
        else next.z += dzMax;
        pushed = true;
      }
      if (!pushed) break;
    }
  }
}
