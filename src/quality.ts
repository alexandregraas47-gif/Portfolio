import type * as THREE from 'three';

/* Qualité dynamique : ajuste le pixelRatio selon le fps mesuré.
   Plafond 2 sur desktop, 1.5 sur mobile ; plancher 0.75. */

export const isMobile = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export class Quality {
  readonly max: number;
  private dpr: number;
  private acc = 0;
  private frames = 0;
  private good = 0;
  private cooldown = 0;
  /** Appelé quand le pixelRatio change (pour redimensionner). */
  onChange: () => void = () => {};

  constructor(private renderer: THREE.WebGLRenderer) {
    const dev = window.devicePixelRatio || 1;
    this.max = Math.min(dev, isMobile ? 1.5 : 2);
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4 || ((navigator as { deviceMemory?: number }).deviceMemory ?? 8) <= 3;
    this.dpr = weak ? Math.min(this.max, 1) : this.max;
    renderer.setPixelRatio(this.dpr);
  }

  get pixelRatio() {
    return this.dpr;
  }

  /** dt en secondes. Mesure par fenêtres de ~1 s. */
  tick(dt: number) {
    if (document.hidden || dt > 0.25) return; // onglet en arrière-plan / à-coup isolé
    this.acc += dt;
    this.frames++;
    if (this.cooldown > 0) { this.cooldown -= dt; return; }
    if (this.acc < 1) return;
    const fps = this.frames / this.acc;
    this.acc = 0;
    this.frames = 0;
    const target = isMobile ? 30 : 50;
    if (fps < target && this.dpr > 0.75) {
      this.set(Math.max(0.75, this.dpr - 0.25));
      this.good = 0;
    } else if (fps > 57 && this.dpr < this.max) {
      if (++this.good >= 4) { this.set(Math.min(this.max, this.dpr + 0.25)); this.good = 0; }
    } else this.good = 0;
  }

  private set(v: number) {
    if (v === this.dpr) return;
    this.dpr = v;
    this.renderer.setPixelRatio(v);
    this.cooldown = 1.5;
    this.onChange();
  }
}
