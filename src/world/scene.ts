import * as THREE from 'three';

export class SceneHost {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  private clock = new THREE.Clock();
  private tickers: ((dt: number, t: number) => void)[] = [];
  private timeOfDay = 0.3;
  private targetTime = 0.3;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9fd0ff);
    this.scene.fog = new THREE.Fog(0x9fd0ff, 70, 160);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
    this.camera.position.set(0, 8, 12);

    this.hemi = new THREE.HemisphereLight(0xbfe3ff, 0x6a8f4a, 0.9);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const d = 45;
    this.sun.shadow.camera.left = -d;
    this.sun.shadow.camera.right = d;
    this.sun.shadow.camera.top = d;
    this.sun.shadow.camera.bottom = -d;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 150;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.applyTimeOfDay(this.timeOfDay);
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onTick(fn: (dt: number, t: number) => void): () => void {
    this.tickers.push(fn);
    return () => {
      const i = this.tickers.indexOf(fn);
      if (i >= 0) this.tickers.splice(i, 1);
    };
  }

  setTimeOfDay(t: number): void {
    this.targetTime = ((t % 1) + 1) % 1;
  }

  private applyTimeOfDay(t: number): void {
    const angle = t * Math.PI * 2;
    const elevation = Math.sin(angle);
    const dayness = THREE.MathUtils.smoothstep(elevation, -0.15, 0.35);

    this.sun.position.set(Math.cos(angle) * 60, Math.max(elevation, 0.05) * 60 + 5, 30);
    this.sun.intensity = 0.15 + dayness * 2.1;
    const warm = new THREE.Color(0xffb070);
    const white = new THREE.Color(0xffffff);
    const moon = new THREE.Color(0x8fa6ff);
    const sunColor = white.clone().lerp(warm, 1 - THREE.MathUtils.smoothstep(elevation, 0.05, 0.5));
    this.sun.color.copy(dayness < 0.1 ? moon : sunColor);

    const daySky = new THREE.Color(0x9fd0ff);
    const duskSky = new THREE.Color(0xf4a470);
    const nightSky = new THREE.Color(0x0b1230);
    let sky: THREE.Color;
    if (elevation > 0.35) sky = daySky;
    else if (elevation > -0.15) sky = nightSky.clone().lerp(duskSky, (elevation + 0.15) / 0.5).lerp(daySky, Math.max(0, elevation) / 0.35 * 0.6);
    else sky = nightSky;
    (this.scene.background as THREE.Color).copy(sky);
    (this.scene.fog as THREE.Fog).color.copy(sky);

    this.hemi.intensity = 0.25 + dayness * 0.7;
  }

  start(): void {
    const loop = () => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;
      if (Math.abs(this.targetTime - this.timeOfDay) > 0.0005) {
        let diff = this.targetTime - this.timeOfDay;
        if (diff > 0.5) diff -= 1;
        if (diff < -0.5) diff += 1;
        this.timeOfDay = (((this.timeOfDay + diff * Math.min(1, dt * 1.5)) % 1) + 1) % 1;
        this.applyTimeOfDay(this.timeOfDay);
      }
      for (const fn of this.tickers) fn(dt, t);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
