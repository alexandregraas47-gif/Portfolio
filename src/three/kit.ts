import * as THREE from 'three';

/* Petits utilitaires partagés : matériaux, géométries en cache, helpers de placement. */

export const FONT = '"Archivo Variable", "Archivo", "Helvetica Neue", Arial, sans-serif';

export function glossy(c: number, r = 0.2, o: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: r,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.1,
    ...o,
  });
}
export function chrome(c: number) {
  return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.12, metalness: 1, envMapIntensity: 1.4 });
}
export function matte(c: number, e = 0.25) {
  return new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0, envMapIntensity: e });
}
export function metal(c: number) {
  return new THREE.MeshStandardMaterial({ color: c, roughness: 0.38, metalness: 0.85, envMapIntensity: 0.8 });
}

/* Les géométries de boîtes sont partagées par dimensions (des centaines de boîtes, ~40 formes). */
const boxCache = new Map<string, THREE.BoxGeometry>();
export function boxGeo(w: number, h: number, d: number) {
  const k = `${w}|${h}|${d}`;
  let g = boxCache.get(k);
  if (!g) boxCache.set(k, (g = new THREE.BoxGeometry(w, h, d)));
  return g;
}
export function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  parent?: THREE.Object3D,
) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat);
  m.position.set(x, y, z);
  parent?.add(m);
  return m;
}

const UP = new THREE.Vector3(0, 1, 0);
export function bar(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 16), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.clone().normalize());
  return m;
}

export function hexStr(col: number) {
  return '#' + ('000000' + col.toString(16)).slice(-6);
}

export function canvasTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Redessine une texture canvas quand les polices sont prêtes. */
export function whenFonts(draw: () => void) {
  draw();
  if (document.fonts?.ready) document.fonts.ready.then(draw);
}

/** Pose un texte sur plusieurs lignes en coupant aux espaces. */
export function wrapText(
  x: CanvasRenderingContext2D,
  text: string,
  left: number,
  top: number,
  maxW: number,
  lineH: number,
) {
  const words = text.split(' ');
  let line = '';
  let y = top;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (x.measureText(test).width > maxW && line) {
      x.fillText(line, left, y);
      y += lineH;
      line = w;
    } else line = test;
  }
  x.fillText(line, left, y);
  return y;
}

export interface Pointer {
  x: number;
  y: number;
}
export interface ExhibitApi {
  update(t: number, p: Pointer): void;
}

export function pivot(g: THREE.Object3D, t: number, p: Pointer) {
  g.rotation.y += (Math.sin(t * 0.0006) * 0.5 + p.x * 0.6 - g.rotation.y) * 0.06;
  g.rotation.x += (-p.y * 0.3 - g.rotation.x) * 0.06;
}
