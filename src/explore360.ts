import * as THREE from 'three';
import { H, N, OBJ_X, PLINTH_R, ROOM, RX } from './three/world';
import type { Clickable, World } from './three/world';

/* Mode 360° : la caméra entre au centre de la salle.
   Glisser = regarder (avec inertie) · ▲▼ / molette / WASD (ZQSD) = marcher · clic sur un cadre = galerie
   · gyroscope sur mobile · Échap = sortie. Collision avec murs et socle. */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const PIT_MAX = 1.15;
const BODY_R = 0.55; // "rayon" du visiteur
const SPEED = 5.4; // unités / s
const TURN = 1.9; // rad / s (flèches gauche/droite)

type DOEvent = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

export class Explore360 {
  active = false;
  /** Fondu entre caméra de scroll (0) et caméra 360 (1). */
  t = 0;
  k = 0;
  private x = RX;
  private z = 0;
  private yaw = 0;
  private pit = 0;
  private yawS = 0;
  private pitS = 0;
  private vYaw = 0;
  private vPit = 0;
  private mvF = 0;
  private mvS = 0;
  private turn = 0;
  private keys = new Set<string>();
  private drag = false;
  private moved = 0;
  private lastX = 0;
  private lastY = 0;
  private lastT = 0;
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private q = new THREE.Quaternion();
  private eul = new THREE.Euler(0, 0, 0, 'YXZ');
  // gyroscope
  gyroOn = false;
  private gyroBase: number | null = null;
  private gyroYaw = 0;
  private gyroPit = 0;
  private gq = new THREE.Quaternion();
  private ge = new THREE.Euler();
  private gq1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  private gq0 = new THREE.Quaternion();
  private zee = new THREE.Vector3(0, 0, 1);

  onPick: (c: Clickable) => void = () => {};
  onChange: () => void = () => {};

  constructor(private world: World, private canvas: HTMLCanvasElement, private reduce: boolean) {
    const c = canvas;
    c.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      this.drag = true;
      this.moved = 0;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastT = performance.now();
      this.vYaw = this.vPit = 0;
      try { c.setPointerCapture(e.pointerId); } catch { /* ok */ }
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.active) return;
      if (!this.drag) {
        if (e.pointerType === 'mouse') c.style.cursor = this.pick(e) ? 'pointer' : '';
        return;
      }
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      const now = performance.now();
      const dt = Math.max(1, now - this.lastT);
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastT = now;
      this.moved += Math.abs(dx) + Math.abs(dy);
      const k = e.pointerType === 'touch' ? 0.0068 : 0.0055;
      this.yaw += dx * k;
      this.pit = clamp(this.pit + dy * k * 0.76, -PIT_MAX, PIT_MAX);
      // vitesse en rad / 16 ms, lissée, pour l'inertie
      this.vYaw = this.vYaw * 0.5 + ((dx * k) / dt) * 16 * 0.5;
      this.vPit = this.vPit * 0.5 + ((dy * k * 0.76) / dt) * 16 * 0.5;
    });
    const end = (e: PointerEvent) => {
      if (!this.active || !this.drag) return;
      this.drag = false;
      if (performance.now() - this.lastT > 80) this.vYaw = this.vPit = 0; // relâché à l'arrêt
      if (this.reduce) this.vYaw = this.vPit = 0;
      if (this.moved < 6 && e.type === 'pointerup') {
        const hit = this.pick(e);
        if (hit) this.onPick(hit);
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.active) return;
        e.preventDefault();
        const d = clamp(-e.deltaY * 0.01, -1.2, 1.2);
        this.move(-Math.sin(this.yaw) * d, -Math.cos(this.yaw) * d);
      },
      { passive: false },
    );
    addEventListener('keydown', (e) => {
      if (!this.active || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { this.exit(); return; }
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'z', 's', 'a', 'q', 'd', ' '].includes(k)) {
        e.preventDefault();
        this.keys.add(k);
        this.readKeys();
      }
    });
    addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
      this.readKeys();
    });
    addEventListener('blur', () => { this.keys.clear(); this.readKeys(); });
  }

  private readKeys() {
    const k = this.keys;
    this.mvF = (k.has('arrowup') || k.has('w') || k.has('z') ? 1 : 0) - (k.has('arrowdown') || k.has('s') ? 1 : 0);
    this.mvS = (k.has('d') ? 1 : 0) - (k.has('a') || k.has('q') ? 1 : 0);
    this.turn = (k.has('arrowleft') ? 1 : 0) - (k.has('arrowright') ? 1 : 0);
  }

  /** Boutons tactiles ▲▼ */
  setWalk(d: number) {
    this.mvF = d;
  }

  enter(k: number) {
    this.active = true;
    this.k = k;
    const oz = this.world.floors[k].oz;
    this.x = RX;
    this.z = 0;
    // regarde vers l'objet, comme la caméra d'arrêt
    this.yaw = this.yawS = Math.atan2(-(OBJ_X - RX), -oz * 0.45);
    this.pit = this.pitS = 0;
    this.vYaw = this.vPit = 0;
    this.mvF = this.mvS = this.turn = 0;
    this.keys.clear();
    this.gyroBase = null;
    this.onChange();
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.drag = false;
    this.canvas.style.cursor = '';
    this.setGyro(false);
    this.onChange();
  }

  /* ---------- gyroscope ---------- */
  static gyroSupported() {
    return typeof window.DeviceOrientationEvent !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  }

  /** À appeler depuis un geste utilisateur (exigence iOS). */
  async toggleGyro() {
    if (this.gyroOn) { this.setGyro(false); return false; }
    const DOE = window.DeviceOrientationEvent as DOEvent;
    if (typeof DOE.requestPermission === 'function') {
      try {
        if ((await DOE.requestPermission()) !== 'granted') return false;
      } catch {
        return false;
      }
    }
    this.setGyro(true);
    return true;
  }

  private onOrient = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;
    const d2r = Math.PI / 180;
    const orient = ((screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0) as number) * d2r;
    this.ge.set(e.beta * d2r, e.alpha * d2r, -e.gamma * d2r, 'YXZ');
    this.gq.setFromEuler(this.ge).multiply(this.gq1).multiply(this.gq0.setFromAxisAngle(this.zee, -orient));
    this.eul.setFromQuaternion(this.gq, 'YXZ');
    const gy = this.eul.y;
    const gp = this.eul.x;
    if (this.gyroBase == null) {
      this.gyroBase = gy;
      this.gyroYaw = 0;
    }
    // delta de cap relatif au moment de l'activation, inclinaison absolue (téléphone droit = horizon)
    let dy = gy - this.gyroBase - this.gyroYaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.gyroYaw += dy;
    this.yaw += dy;
    const pitTarget = clamp(gp, -PIT_MAX, PIT_MAX);
    this.pit += pitTarget - this.gyroPit;
    this.pit = clamp(this.pit, -PIT_MAX, PIT_MAX);
    this.gyroPit = pitTarget;
  };

  private setGyro(on: boolean) {
    if (on === this.gyroOn) return;
    this.gyroOn = on;
    this.gyroBase = null;
    this.gyroPit = 0;
    if (on) addEventListener('deviceorientation', this.onOrient);
    else removeEventListener('deviceorientation', this.onOrient);
    this.onChange();
  }

  /* ---------- déplacement + collisions ---------- */
  private move(dx: number, dz: number) {
    let x = clamp(this.x + dx, ROOM.xMin, ROOM.xMax);
    let z = clamp(this.z + dz, ROOM.zMin, ROOM.zMax);
    // socle : on glisse le long du cercle au lieu de le traverser
    const oz = this.world.floors[this.k].oz;
    const r = PLINTH_R + BODY_R;
    const ox = x - OBJ_X;
    const oz2 = z - oz;
    const d = Math.hypot(ox, oz2);
    if (d < r) {
      const s = d < 1e-4 ? 1 : r / d;
      x = OBJ_X + (d < 1e-4 ? r : ox * s);
      z = oz + (d < 1e-4 ? 0 : oz2 * s);
    }
    this.x = x;
    this.z = z;
  }

  pick(e: { clientX: number; clientY: number }, k = this.k): Clickable | null {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.world.camera);
    const list = this.world.clickables.filter((c) => c.k === k);
    const hits = this.ray.intersectObjects(list.map((c) => c.mesh), false);
    if (!hits.length) return null;
    return list.find((c) => c.mesh === hits[0].object) ?? null;
  }

  /** Avance la simulation et mélange la caméra 360 avec la caméra de scroll déjà posée. */
  update(dt: number, camera: THREE.PerspectiveCamera) {
    const target = this.active ? 1 : 0;
    this.t = this.reduce ? target : this.t + (target - this.t) * (1 - Math.pow(1 - 0.09, dt * 60));
    if (this.t < 0.002) { this.t = 0; return; }

    if (this.active) {
      this.yaw += this.turn * TURN * dt;
      if (!this.drag && (Math.abs(this.vYaw) > 1e-5 || Math.abs(this.vPit) > 1e-5)) {
        const f = dt * 60;
        this.yaw += this.vYaw * f;
        this.pit = clamp(this.pit + this.vPit * f, -PIT_MAX, PIT_MAX);
        const decay = Math.pow(0.92, f);
        this.vYaw *= decay;
        this.vPit *= decay;
      }
      if (this.mvF || this.mvS) {
        const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
        const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
        const sp = SPEED * dt;
        this.move((fx * this.mvF + rx * this.mvS) * sp, (fz * this.mvF + rz * this.mvS) * sp);
      }
    }
    const a = this.reduce ? 1 : 1 - Math.pow(1 - 0.18, dt * 60);
    this.yawS += (this.yaw - this.yawS) * a;
    this.pitS += (this.pit - this.pitS) * a;
    this.eul.set(this.pitS, this.yawS, 0, 'YXZ');
    this.q.setFromEuler(this.eul);
    const gy = (N - 1 - this.k) * H + 1.6;
    const t = this.t;
    camera.position.set(
      camera.position.x + (this.x - camera.position.x) * t,
      camera.position.y + (gy - camera.position.y) * t,
      camera.position.z + (this.z - camera.position.z) * t,
    );
    camera.quaternion.slerp(this.q, t);
  }
}
