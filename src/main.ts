import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './looks';
import './styles.css';
import { STEPS } from './content';
import { projectImages, screenImage } from './images';
import { Gallery } from './ui/gallery';
import type { GalleryItem } from './ui/gallery';
import { buildHud, buildStatic } from './ui/hud';

/* Point d'entrée : HUD et galerie (DOM pur) tout de suite, la 3D en chargement différé
   (chunk séparé) avec préchargeur. Sans WebGL → version HTML statique. */

const N = STEPS.length;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gallery = new Gallery();
const loader = document.querySelector<HTMLElement>('#loader')!;
const loaderBar = document.querySelector<HTMLElement>('#loaderBar')!;
const loaderTxt = document.querySelector<HTMLElement>('#loaderTxt')!;

export function itemsFor(slug: string): GalleryItem[] {
  const s = STEPS.find((x) => x.slug === slug);
  if (!s) return [];
  const imgs = projectImages(s);
  if (!imgs.length) return [{ alt: s.title, caption: `${s.title} · visuels à venir` }];
  return imgs.map((im, i) => ({
    webp: im.full, avif: im.avif, w: im.w, h: im.h,
    alt: `${s.title}, visuel ${i + 1}`,
    caption: s.title,
  }));
}

export function screenItems(k: number): GalleryItem[] {
  const s = STEPS[k];
  return (s.screens ?? []).map((sc) => {
    const im = screenImage(s, sc.image);
    return {
      webp: im?.full, avif: im?.avif, w: im?.w, h: im?.h,
      alt: `${s.title} · ${sc.label}`,
      caption: `${s.title} · ${sc.label}`,
      link: sc.url || undefined,
      linkLabel: `Ouvrir ${sc.label.toLowerCase()}`,
    };
  });
}

function progress(p: number, txt?: string) {
  loaderBar.style.transform = `scaleX(${p})`;
  if (txt) loaderTxt.textContent = txt;
}
function hideLoader() {
  loader.classList.add('done');
  setTimeout(() => loader.remove(), 900);
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/* ---------- scroll : 1 station = max(640, innerHeight*1.5) ---------- */
let STEP = 1;
const sp = document.querySelector<HTMLElement>('#sp')!;
let lastW = 0;
let lastH = 0;
function layout(force = false) {
  const w = innerWidth;
  const h = document.documentElement.clientHeight;
  // Sur mobile, la barre d'adresse change la hauteur en scrollant : on ignore ces petites variations.
  if (!force && w === lastW && Math.abs(h - lastH) < 160) return false;
  const p = STEP > 1 ? scrollY / ((N - 1) * STEP) : 0;
  lastW = w;
  lastH = h;
  STEP = Math.max(640, h * 1.5);
  sp.style.height = (N - 1) * STEP + h + 'px';
  if (p > 0) scrollTo({ top: p * (N - 1) * STEP, behavior: 'instant' as ScrollBehavior });
  return true;
}
export const getStep = () => STEP;
export function goto(k: number) {
  scrollTo({ top: Math.max(0, Math.min(N - 1, k)) * STEP, behavior: reduce ? 'auto' : 'smooth' });
}

const hud = buildHud(goto, (slug) => gallery.open(itemsFor(slug)));

async function start() {
  if (!hasWebGL()) {
    buildStatic();
    document.querySelectorAll<HTMLButtonElement>('#static [data-gallery]').forEach((b) =>
      b.addEventListener('click', () => gallery.open(itemsFor(b.dataset.gallery!))),
    );
    hideLoader();
    return;
  }
  layout(true);
  progress(0.15, 'Chargement de la tour…');
  try {
    const [{ startScene }] = await Promise.all([
      import('./scene'),
      Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 2500))]),
    ]);
    progress(0.45, 'Construction des étages…');
    await startScene({
      hud, gallery, reduce, layout, goto, getStep, itemsFor, screenItems,
      progress: (p, t) => progress(0.45 + p * 0.55, t),
    });
    progress(1, 'Bienvenue.');
    hideLoader();
  } catch (e) {
    console.error(e);
    document.querySelector('#gl')?.remove();
    buildStatic();
    document.querySelectorAll<HTMLButtonElement>('#static [data-gallery]').forEach((b) =>
      b.addEventListener('click', () => gallery.open(itemsFor(b.dataset.gallery!))),
    );
    hideLoader();
  }
}

start();
