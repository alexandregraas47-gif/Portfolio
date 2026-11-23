import * as THREE from 'three';
import { STEPS } from './content';
import { Explore360 } from './explore360';
import { Quality, isMobile } from './quality';
import type { Gallery, GalleryItem } from './ui/gallery';
import type { Hud } from './ui/hud';
import { EX, H, LIGHT, N, OBJ_X, RX, buildWorld } from './three/world';
import type { Clickable } from './three/world';

interface Ctx {
  hud: Hud;
  gallery: Gallery;
  reduce: boolean;
  layout: (force?: boolean) => boolean;
  goto: (k: number) => void;
  getStep: () => number;
  itemsFor: (slug: string) => GalleryItem[];
  screenItems: (k: number) => GalleryItem[];
  progress: (p: number, txt?: string) => void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const sg = (f: number, a: number, b: number) => clamp((f - a) / (b - a), 0, 1);
const sm = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

export async function startScene(ctx: Ctx) {
  const { hud, gallery, reduce } = ctx;
  const canvas = $<HTMLCanvasElement>('#gl');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile || (window.devicePixelRatio || 1) < 2,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Tone mapping neutre : compresse les hautes lumières sans délaver la charte.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = LIGHT.exposure;
  const quality = new Quality(renderer);

  const world = buildWorld(renderer);
  const { scene, camera, floors, car, spot } = world;
  ctx.progress(0.3, 'Allumage des lumières…');

  /* ---------- taille ---------- */
  // Portrait : champ plus large (sinon l'objet est coupé) et regard un peu plus bas
  // pour placer l'objet au-dessus du panneau de texte.
  let baseFov = 55, lookDrop = 0, zAim = 0.45;
  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setSize(w, h, false);
    const a = w / h;
    const pk = clamp((1 - a) / 0.55, 0, 1);
    baseFov = lerp(55, 76, pk);
    lookDrop = lerp(0, 0.85, pk);
    zAim = lerp(0.45, 0.85, pk);
    camera.aspect = a;
    camera.updateProjectionMatrix();
    ctx.layout();
  };
  addEventListener('resize', resize);
  quality.onChange = resize;
  resize();

  // Compilation des shaders hors du premier frame (évite le gel à l'arrivée).
  camera.position.set(RX, (N - 1) * H + 1.6, 0);
  camera.lookAt(OBJ_X, (N - 1) * H + 1.7, 0);
  floors.forEach((f, i) => (f.g.visible = i < 3));
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    renderer.compile(scene, camera);
  }
  ctx.progress(0.8, 'Ouverture des portes…');
  floors[0].loadImages();
  floors[1]?.loadImages();

  /* ---------- pointeur (regard qui suit légèrement) ---------- */
  let px = 0, py = 0, hasPointer = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    px = (e.clientX / innerWidth) * 2 - 1;
    py = -((e.clientY / innerHeight) * 2 - 1);
    hasPointer = true;
  }, { passive: true });

  /* ---------- mode 360° ---------- */
  const explore = new Explore360(world, canvas, reduce);
  const b360 = $<HTMLButtonElement>('#b360');
  const x360 = $<HTMLButtonElement>('#x360');
  const walkEl = $('#walk');
  const gyroBtn = $<HTMLButtonElement>('#gyro');
  const t360 = $('#t360');
  if (!Explore360.gyroSupported()) gyroBtn.remove();
  if (isMobile) t360.textContent = "Glisse pour regarder autour · ▲▼ pour marcher · touche un cadre pour l'agrandir";

  const openPick = (c: Clickable) => {
    if (c.kind === 'screen') gallery.open(ctx.screenItems(c.k), c.index);
    else gallery.open(ctx.itemsFor(STEPS[c.k].slug), c.index);
  };
  explore.onPick = openPick;
  explore.onChange = () => {
    document.body.classList.toggle('v360', explore.active);
    document.documentElement.style.overflow = explore.active ? 'hidden' : '';
    gyroBtn.setAttribute('aria-pressed', String(explore.gyroOn));
    if (explore.active) x360.focus({ preventScroll: true });
    else if (document.activeElement === x360 || !document.activeElement || document.activeElement === document.body) b360.focus({ preventScroll: true });
  };
  b360.addEventListener('click', () => explore.enter(Math.round(clamp(smoothP * (N - 1), 0, N - 1))));
  x360.addEventListener('click', () => explore.exit());
  gyroBtn.addEventListener('click', () => { explore.toggleGyro(); });
  walkEl.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    const d = Number(b.dataset.d);
    b.addEventListener('pointerdown', (e) => {
      explore.setWalk(d);
      try { b.setPointerCapture(e.pointerId); } catch { /* ok */ }
    });
    for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(n, () => explore.setWalk(0));
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); explore.setWalk(d); } });
    b.addEventListener('keyup', () => explore.setWalk(0));
  });
  gallery.onClose = () => { /* retour à la vue courante */ };

  // Clic sur un cadre hors 360° (quand on est arrêté dans une salle).
  let downX = 0, downY = 0;
  canvas.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
  canvas.addEventListener('click', (e) => {
    if (explore.active || Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
    const u = smoothP * (N - 1);
    const k = Math.round(u);
    if (Math.abs(u - k) > 0.04) return;
    const hit = explore.pick(e, k);
    if (hit) openPick(hit);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (explore.active || e.pointerType !== 'mouse') return;
    const u = smoothP * (N - 1);
    const k = Math.round(u);
    canvas.style.cursor = Math.abs(u - k) <= 0.04 && explore.pick(e, k) ? 'pointer' : '';
  });

  /* ---------- clavier (télécommande de présentation : PageDown/PageUp, flèches ←→, espace) ---------- */
  addEventListener('keydown', (e) => {
    if (explore.active || gallery.isOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    const tgt = e.target as HTMLElement;
    if (tgt.closest('input,textarea,select')) return;
    const k = Math.round(clamp(smoothP * (N - 1), 0, N - 1));
    const target = clamp(scrollY / ((N - 1) * ctx.getStep()), 0, 1) * (N - 1);
    let next: number | null = null;
    if (e.key === 'PageDown' || e.key === 'ArrowRight' || (e.key === ' ' && !e.shiftKey && tgt.tagName !== 'BUTTON')) next = Math.floor(target + 0.05) + 1;
    else if (e.key === 'PageUp' || e.key === 'ArrowLeft' || (e.key === ' ' && e.shiftKey)) next = Math.ceil(target - 0.05) - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = N - 1;
    else if ((e.key === 'Enter' || e.key.toLowerCase() === 'e') && tgt === document.body && b360.classList.contains('show')) {
      e.preventDefault();
      explore.enter(k);
      return;
    }
    if (next == null) return;
    e.preventDefault();
    ctx.goto(clamp(next, 0, N - 1));
  });

  /* ---------- boucle ---------- */
  let smoothP = clamp(scrollY / ((N - 1) * ctx.getStep()), 0, 1);
  let lx = 0, ly = 0, fovNow = baseFov, last = performance.now();
  let nearPrev = -1, liftShownPrev = -1;
  const panelO = new Array(N).fill(-1);
  const p = { x: 0, y: 0 };
  const pv = { x: 0, y: 0 };

  let lastDt = 1 / 60;
  let frame = (t: number) => {
    const dt = Math.min(0.1, Math.max(0.001, (t - last) / 1000));
    lastDt = dt;
    last = t;
    quality.tick(dt);
    const f60 = dt * 60;

    const tgt = clamp(scrollY / ((N - 1) * ctx.getStep()), 0, 1);
    const prev = smoothP;
    smoothP = reduce ? tgt : smoothP + (tgt - smoothP) * (1 - Math.pow(1 - 0.08, f60));
    if (Math.abs(tgt - smoothP) < 1e-5) smoothP = tgt;
    const u = smoothP * (N - 1);
    const seg = Math.min(N - 2, Math.floor(u));
    const f = u - seg;
    const walk = sm(sg(f, 0.12, 0.3));
    const close = sm(sg(f, 0.3, 0.4));
    const ride = sm(sg(f, 0.4, 0.78));
    const open = sm(sg(f, 0.78, 0.88));
    const fwd = sm(sg(f, 0.88, 1));
    const doorAmt = f < 0.3 ? 1 : f < 0.4 ? 1 - close : f < 0.78 ? 0 : f < 0.88 ? open : 1;
    const carFloor = f < 0.5 ? seg : seg + 1;
    const carY = lerp((N - 1 - seg) * H, (N - 2 - seg) * H, ride);
    const camX = f < 0.5 ? lerp(RX, EX, walk) : lerp(EX, RX, fwd);
    const shake = !reduce && f > 0.45 && f < 0.75 ? Math.sin(t * 0.05) * 0.008 : 0;
    const camY = carY + 1.6 + shake;
    const tgtZ = floors[carFloor].oz * zAim;
    const w = f < 0.5 ? walk : f < 0.78 ? 1 : 1 - fwd;
    let nx = hasPointer ? px : Math.sin(t * 0.0004) * 0.3;
    let ny = hasPointer ? py : Math.cos(t * 0.0005) * 0.2;
    if (reduce) nx = ny = 0;
    const a05 = 1 - Math.pow(0.95, f60);
    lx += (nx - lx) * a05;
    ly += (ny - ly) * a05;
    camera.position.set(camX, camY, 0);
    const tx = lerp(OBJ_X, camX + 10, w);
    const ty = lerp((N - 1 - carFloor) * H + 1.7 - lookDrop, camY, w);
    const tz = lerp(tgtZ, 0, w);
    camera.lookAt(tx, ty + ly * 1.4, tz + lx * 3.2);

    explore.update(dt, camera);

    // « punch » de FOV proportionnel à la vitesse de scroll
    const vel = Math.abs(smoothP - prev) / f60;
    const tf = reduce ? baseFov : baseFov + Math.min(10, vel * 700);
    fovNow += (tf - fovNow) * (1 - Math.pow(0.9, f60));
    if (Math.abs(camera.fov - fovNow) > 0.01) {
      camera.fov = fovNow;
      camera.updateProjectionMatrix();
    }
    car.position.y = carY;
    // projecteur : au-dessus de l'objet de l'étage le plus proche
    if (spot) {
      const sk = Math.round(clamp(u, 0, N - 1));
      const fy = (N - 1 - sk) * H;
      const oz = floors[sk].oz;
      spot.position.set(OBJ_X - 1.2, fy + 4.3, oz);
      spot.target.position.set(OBJ_X, fy + 1.4, oz);
      spot.target.updateMatrixWorld();
    }

    // étages : visibilité (±1.7 niveau), portes, animations, chargement des images
    const camF = camera.position.y / H;
    const anim = reduce ? 0 : t;
    p.x = lx; p.y = ly;
    floors.forEach((r, i) => {
      const fi = N - 1 - i;
      const dist = Math.abs(fi - camF);
      if (dist < 2.6) r.loadImages();
      const near = dist < 1.7;
      r.g.visible = near;
      if (!near) return;
      const amt = i === carFloor ? doorAmt : 0;
      r.dL.position.z = -(0.5 + amt);
      r.dR.position.z = 0.5 + amt;
      if (dist < 1.1) r.api.update(anim, explore.active ? pv : p);
    });

    // panneaux de texte
    for (let i = 0; i < N; i++) {
      const d = u - i;
      let o = d >= 0 ? 1 - sg(d, 0.05, 0.17) : sg(d, -0.12, -0.02);
      o = Math.round(o * 100) / 100;
      if (o === panelO[i]) continue;
      panelO[i] = o;
      const el = hud.panels[i];
      el.style.opacity = String(o);
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      el.style.transform = o >= 1 ? '' : `translateY(${(1 - o) * 26}px)`;
    }

    // afficheur d'ascenseur
    const lo = sm(sg(f, 0.28, 0.4)) * (1 - sm(sg(f, 0.8, 0.92)));
    hud.lift.style.opacity = String(Math.round(lo * 100) / 100);
    const shown = Math.round(lerp(seg, seg + 1, ride));
    if (shown !== liftShownPrev) {
      liftShownPrev = shown;
      const flNum = N - 1 - shown;
      hud.liftNum.textContent = flNum === 0 ? 'RDC' : String(flNum);
      hud.liftName.textContent = STEPS[shown].title;
    }

    hud.bar.style.transform = `scaleX(${smoothP})`;
    const nearK = Math.round(clamp(u, 0, N - 1));
    if (nearK !== nearPrev) {
      nearPrev = nearK;
      hud.lab.textContent = String(nearK + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
      hud.dots.forEach((b, i) => {
        b.classList.toggle('on', i === nearK);
        if (i === nearK) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
    }
    hud.hint.style.opacity = scrollY > 40 ? '0' : '1';
    const stopped = Math.abs(u - nearK) < 0.035;
    const lbOpen = gallery.isOpen;
    b360.classList.toggle('show', !explore.active && stopped);
    x360.classList.toggle('show', explore.active && !lbOpen);
    walkEl.classList.toggle('show', explore.active && !lbOpen);

    renderer.render(scene, camera);
  };
  // Mode diagnostic (pour la checklist sur vrais appareils) : ajouter #debug à l'URL.
  if (location.hash === '#debug') {
    const dbg = document.createElement('pre');
    dbg.className = 'debug';
    document.body.appendChild(dbg);
    let acc = 0, n = 0;
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '?';
    const inner = frame;
    frame = (t: number) => {
      const t0 = performance.now();
      inner(t);
      acc += performance.now() - t0;
      if (++n % 30 === 0) {
        const i = renderer.info.render;
        dbg.textContent = `fps ~${(1 / Math.max(0.001, lastDt)).toFixed(0)}  cpu ${(acc / 30).toFixed(1)} ms\ndpr ${quality.pixelRatio}  calls ${i.calls}  tris ${(i.triangles / 1000).toFixed(0)}k\n${gpu}`;
        acc = 0;
      }
    };
  }
  renderer.setAnimationLoop((t) => frame(t));

  // Pause du rendu quand l'onglet est caché.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else { last = performance.now(); renderer.setAnimationLoop((t) => frame(t)); }
  });
  // Perte de contexte GPU (onglets multiples, GPU faible) : on bascule proprement.
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); renderer.setAnimationLoop(null); });
  canvas.addEventListener('webglcontextrestored', () => location.reload());

  ctx.progress(1);
}
