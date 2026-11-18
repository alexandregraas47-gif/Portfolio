import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { STEPS } from '../content';
import type { Step } from '../content';
import { projectImages, screenImage } from '../images';
import { EXHIBITS } from './exhibits';
import { box, canvasTexture, glossy, matte, metal } from './kit';
import type { ExhibitApi } from './kit';
import { carpetTexture, framePanel, numTexture, screenPanel, signTexture } from './textures';

/* Géométrie de la tour — valeurs du brief §4 (calées, ne pas modifier sans raison). */
export const H = 6; // hauteur d'un étage
export const RX = 7.5; // x de la caméra à l'arrêt
export const EX = 0.4; // x de la caméra dans la cabine
export const OBJ_X = 14; // x de l'objet sur socle
export const N = STEPS.length;
export const ROOM = { xMin: 3.2, xMax: 20.4, zMin: -5, zMax: 5 };
export const PLINTH_R = 1.6;
/** Réglages d'éclairage (à affiner sur vrais écrans). */
export const LIGHT = { hemi: 2.2, dir: 1.9, point: 0.9, exposure: 1 };

/** Élément cliquable dans une salle (cadre ou écran). */
export interface Clickable {
  mesh: THREE.Mesh;
  k: number;
  kind: 'frame' | 'screen';
  index: number;
}

export interface FloorRec {
  g: THREE.Group;
  k: number;
  step: Step;
  api: ExhibitApi;
  dL: THREE.Mesh;
  dR: THREE.Mesh;
  /** z de l'objet (±2.2, alterne d'un étage à l'autre) */
  oz: number;
  /** Charge les textures murales (appelé quand l'étage approche). */
  loadImages(): void;
}

export interface World {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  floors: FloorRec[];
  clickables: Clickable[];
  car: THREE.Group;
}

/** Générateur pseudo-aléatoire déterministe (skyline identique à chaque visite). */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function makeEnv(renderer: THREE.WebGLRenderer) {
  const es = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16);
  const pos = geo.attributes.position;
  const cols: number[] = [];
  const c1 = new THREE.Color(0x2230f5);
  const c2 = new THREE.Color(0xffc3e6);
  for (let i = 0; i < pos.count; i++) {
    const c = c1.clone().lerp(c2, (pos.getY(i) / 10 + 1) / 2);
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  es.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (x: number, y: number, z: number, w: number, h: number, col: THREE.Color) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    es.add(m);
  };
  panel(5, 6, 5, 5, 5, new THREE.Color(3, 3, 3));
  panel(-7, 2, 3, 3, 6, new THREE.Color(2.4, 1.5, 2.1));
  panel(0, -6, 4, 8, 2, new THREE.Color(1.2, 1.3, 3));
  panel(0, 3, -8, 10, 4, new THREE.Color(1.6, 1.6, 2.4));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(es, 0.04);
  pm.dispose();
  es.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return rt.texture;
}

function background() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 512;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#0A0E33');
  g.addColorStop(0.55, '#2230F5');
  g.addColorStop(0.85, '#8A7BE8');
  g.addColorStop(1, '#FFC3E6');
  x.fillStyle = g;
  x.fillRect(0, 0, 8, 512);
  return canvasTexture(c);
}

/** Skyline : 150 immeubles fusionnés en une seule géométrie (1 draw call). */
function skyline(scene: THREE.Scene) {
  const rand = rng(7);
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const x = c.getContext('2d')!;
  x.fillStyle = '#0d1250';
  x.fillRect(0, 0, 64, 64);
  const cols = ['#FFC3E6', '#ffe9a8', '#8A94FF'];
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++)
      if (rand() < 0.38) {
        x.fillStyle = cols[(rand() * 3) | 0];
        x.fillRect(i * 8 + 2, j * 8 + 2, 4, 5);
      }
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const geos: THREE.BufferGeometry[] = [];
  for (let n = 0; n < 150; n++) {
    const w = 4 + rand() * 9;
    const h = 16 + rand() * 48;
    const d = 4 + rand() * 9;
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.max(w, d)) / 6, (uv.getY(i) * h) / 6);
    g.translate(36 + rand() * 150, h / 2 - 14, (rand() - 0.5) * 300);
    geos.push(g);
  }
  const merged = mergeGeometries(geos)!;
  geos.forEach((g) => g.dispose());
  const mesh = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ map: t }));
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);
  return mesh;
}

export function buildWorld(renderer: THREE.WebGLRenderer): World {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x2a3a9a, 0.0035);
  scene.background = background();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  scene.add(camera);

  try {
    scene.environment = makeEnv(renderer);
  } catch {
    /* sans environnement : l'éclairage direct suffit */
  }
  // Intensités ajustées après rendu réel (Three récent : éclairage physique + sortie sRGB).
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a94ff, LIGHT.hemi));
  const dl = new THREE.DirectionalLight(0xffffff, LIGHT.dir);
  dl.position.set(2, 4, 2);
  camera.add(dl);
  dl.target.position.set(6, 0, 0);
  camera.add(dl.target);
  const pl = new THREE.PointLight(0xfff4e8, LIGHT.point, 34, 1);
  pl.position.set(0, 0.6, 0);
  camera.add(pl);

  skyline(scene);

  /* ---------- la tour ---------- */
  const floors: FloorRec[] = [];
  const clickables: Clickable[] = [];
  const carpet = carpetTexture();
  const plinthMat = glossy(0xf1edfa, 0.25);
  const wallWhite = matte(0xf4f1fa, 0.2);
  const ceilMat = matte(0xffffff, 0.1);
  const doorMat = metal(0xc9cee6);
  const frameMat = metal(0x0a0e33);
  const lintel = matte(0x10132e, 0.1);
  const potMat = matte(0x1c1f45, 0.2);
  const leafMat = matte(0x2f8f6a, 0.2);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pinkGlow = new THREE.MeshBasicMaterial({ color: 0xffc3e6 });
  const carpetMat = new THREE.MeshStandardMaterial({ map: carpet, roughness: 0.95, envMapIntensity: 0.1 });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
  const glassGeo = new THREE.PlaneGeometry(12, 4.4);
  const potGeo = new THREE.CylinderGeometry(0.34, 0.28, 0.55, 24);
  const leafGeo = new THREE.SphereGeometry(0.6, 24, 18);
  const plinthGeo = new THREE.CylinderGeometry(1.5, PLINTH_R, 0.5, 48);
  const haloGeo = new THREE.TorusGeometry(1.62, 0.03, 8, 64);

  STEPS.forEach((s, k) => {
    // Objet à droite (z>0) aux étages impairs ; le panneau HTML est du côté opposé.
    const objRight = k === 0 || k === N - 1 ? true : k % 2 === 1;
    const fg = new THREE.Group();
    fg.position.y = (N - 1 - k) * H;
    scene.add(fg);

    // dalles
    box(20.4, 0.3, 12.4, carpetMat, 11.95, -0.15, 0, fg);
    box(20.4, 0.3, 12.4, ceilMat, 11.95, 4.55, 0, fg);
    // murs : accent (nord), blanc (sud), mur palier avec ouverture
    const accent = s.bg;
    box(20.4, 4.4, 0.2, matte(accent, 0.2), 11.95, 2.2, -6.1, fg);
    box(20.4, 4.4, 0.2, wallWhite, 11.95, 2.2, 6.1, fg);
    box(0.3, 4.4, 5, wallWhite, 1.7, 2.2, -3.5, fg);
    box(0.3, 4.4, 5, wallWhite, 1.7, 2.2, 3.5, fg);
    box(0.3, 2, 2, wallWhite, 1.7, 3.4, 0, fg);
    box(0.3, 1.6, 4, lintel, 1.7, 5.2, 0, fg);
    // baie vitrée (est) et meneaux
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(22.1, 2.2, 0);
    glass.rotation.y = Math.PI / 2;
    fg.add(glass);
    for (let z = -6; z <= 6; z += 3) box(0.14, 4.4, 0.14, doorMat, 22.1, 2.2, z, fg);
    box(0.2, 0.14, 12.2, doorMat, 22.1, 0.07, 0, fg);
    box(0.2, 0.14, 12.2, doorMat, 22.1, 4.4, 0, fg);
    // dalles lumineuses
    for (let lx = 0; lx < 4; lx++) for (let lz = -1; lz <= 1; lz++) box(2.2, 0.04, 1.3, lightMat, 6 + lx * 5.2, 4.38, lz * 3.6, fg);
    // enseigne (nord)
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 2.57),
      new THREE.MeshBasicMaterial({ map: signTexture(s.n ?? '', s.title, s.tag, accent), toneMapped: false }),
    );
    sign.position.set(14, 2.5, -5.98);
    fg.add(sign);

    // Mur sud : 2 emplacements. Les écrans (captures de sites) prennent les emplacements
    // en partant du fond, les cadres de visuels occupent le reste.
    const loaders: (() => void)[] = [];
    if (s.type === 'project') {
      const imgs = projectImages(s);
      const screens = (s.screens ?? []).slice(0, 2);
      const slots = [11, 17];
      const screenSlots = slots.slice(slots.length - screens.length).reverse(); // 17 puis 11
      const frameSlots = slots.slice(0, slots.length - screens.length);
      screens.forEach((sc, ix) => {
        const sp = screenPanel(sc.label, s.bg);
        sp.group.scale.setScalar(1.35);
        sp.group.position.set(screenSlots[ix], 2.3, 5.94);
        sp.group.rotation.y = Math.PI;
        fg.add(sp.group);
        clickables.push({ mesh: sp.plane, k, kind: 'screen', index: ix });
        const im = screenImage(s, sc.image);
        if (im) loaders.push(() => sp.setImage(im.wall).catch(() => {}));
      });
      frameSlots.forEach((fx, ix) => {
        const fp = framePanel(s.n ?? '', s.title, s.bg);
        fp.group.scale.setScalar(1.25);
        fp.group.position.set(fx, 2.2, 5.95);
        fp.group.rotation.y = Math.PI;
        fg.add(fp.group);
        clickables.push({ mesh: fp.plane, k, kind: 'frame', index: ix });
        const im = imgs[ix];
        if (im) loaders.push(() => fp.setImage(im.wall).catch(() => {}));
      });
    }

    // plantes
    for (const [px, pz] of [[3.2, -5], [3.2, 5], [20.5, -5], [20.5, 5]]) {
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(px, 0.28, pz);
      fg.add(pot);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(px, 1.1, pz);
      leaf.scale.y = 1.2;
      fg.add(leaf);
    }

    // socle + objet
    const oz = objRight ? 2.2 : -2.2;
    const ex = new THREE.Group();
    ex.position.set(OBJ_X, 2.5, oz);
    ex.scale.setScalar(0.66);
    fg.add(ex);
    if (s.exhibit === 'office') {
      ex.scale.setScalar(0.6);
      ex.position.set(OBJ_X, 1.5, oz);
    } else {
      const pl = new THREE.Mesh(plinthGeo, plinthMat);
      pl.position.set(OBJ_X, 0.25, oz);
      fg.add(pl);
      const halo = new THREE.Mesh(haloGeo, pinkGlow);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(OBJ_X, 0.52, oz);
      fg.add(halo);
    }
    // Groupe intermédiaire : les animations des objets peuvent bouger leur groupe librement
    // sans écraser la position sur le socle.
    const inner = new THREE.Group();
    ex.add(inner);
    const api = EXHIBITS[s.exhibit](inner);

    // portes palières + encadrement + plaques
    const dL = box(0.05, 2.4, 1.02, doorMat, 1.48, 1.2, -0.5, fg);
    const dR = box(0.05, 2.4, 1.02, doorMat, 1.48, 1.2, 0.5, fg);
    box(0.1, 2.4, 0.1, frameMat, 1.9, 1.2, -1.05, fg);
    box(0.1, 2.4, 0.1, frameMat, 1.9, 1.2, 1.05, fg);
    box(0.1, 0.12, 2.2, frameMat, 1.9, 2.46, 0, fg);
    const lbl = N - 1 - k === 0 ? 'RDC' : String(N - 1 - k);
    const nt = numTexture(lbl);
    const plIn = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: nt }));
    plIn.position.set(1.53, 2.75, 0);
    plIn.rotation.y = -Math.PI / 2;
    fg.add(plIn);
    const plOut = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: nt }));
    plOut.position.set(1.86, 2.95, 0);
    plOut.rotation.y = Math.PI / 2;
    fg.add(plOut);

    let loaded = false;
    floors.push({
      g: fg, k, step: s, api, dL, dR, oz,
      loadImages() {
        if (loaded) return;
        loaded = true;
        loaders.forEach((f) => f());
      },
    });
  });

  /* gaine + cabine */
  const shaftMat = matte(0x0c0f2a, 0.05);
  box(0.2, H * N + 4, 3.6, shaftMat, -1.7, (H * N) / 2 - 2, 0, scene);
  box(3.6, H * N + 4, 0.2, shaftMat, 0, (H * N) / 2 - 2, -1.8, scene);
  box(3.6, H * N + 4, 0.2, shaftMat, 0, (H * N) / 2 - 2, 1.8, scene);
  const car = new THREE.Group();
  scene.add(car);
  const carWall = metal(0xb9bedb);
  box(3, 0.1, 3.2, matte(0x1c1f45, 0.2), 0, -0.05, 0, car);
  box(3, 0.1, 3.2, carWall, 0, 3.05, 0, car);
  box(1.6, 0.04, 1.6, lightMat, 0, 2.98, 0, car);
  box(0.1, 3, 3.2, carWall, -1.5, 1.5, 0, car);
  box(3, 3, 0.1, carWall, 0, 1.5, -1.6, car);
  box(3, 3, 0.1, carWall, 0, 1.5, 1.6, car);
  box(0.04, 1.6, 0.9, metal(0x0a0e33), -1.43, 1.5, 0, car);
  const panelDots = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.2), new THREE.MeshBasicMaterial({ color: 0xffc3e6 }));
  panelDots.position.set(-1.4, 1.5, 0);
  panelDots.rotation.y = Math.PI / 2;
  car.add(panelDots);

  return { scene, camera, floors, clickables, car };
}
