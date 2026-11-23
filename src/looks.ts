/**
 * Ambiances (« looks ») de la tour : même structure, habillage différent.
 * Choix : ?look=nuit | galerie | pop dans l'URL (ou #nuit, #galerie, #pop). Défaut : DEFAULT_LOOK.
 */

export type LookName = 'nuit' | 'galerie' | 'pop';

export interface Look {
  name: LookName;
  label: string;
  /** Dégradé du ciel, de haut en bas. */
  sky: string[];
  fog: [number, number];
  env: [number, number];
  hemi: [number, number, number]; // ciel, sol, intensité
  dir: number;
  point: number;
  exposure: number;
  /** Projecteur unique qui suit l'objet de l'étage courant (0 = aucun). */
  spot: number;
  spotColor: number;
  wall: number;
  /** Mur nord : teinte de l'étage, ou couleur fixe. */
  accentWall: 'tint' | number;
  ceiling: number;
  floor: { color: number; rough: number; metal: number; carpet: boolean };
  /** Éclairage du plafond : dalles blanches ou lignes néon. */
  ceilingLights: 'panels' | 'neon';
  lightColor: number;
  /** Lignes néon au pied des murs. */
  trim: number | null;
  plinth: { color: number; rough: number; metal: number };
  halo: number;
  plants: boolean;
  frame: number;
  shaft: number;
  carWall: number;
  windows: string[];
  towerFill: string;
}

export const LOOKS: Record<LookName, Look> = {
  /* Nuit : tour de nuit, encre et cobalt, néons roses, objets en vitrine sous un projecteur. */
  nuit: {
    name: 'nuit',
    label: 'Nuit',
    sky: ['#03041A', '#0A0E33', '#1B2290', '#5B3FA8'],
    fog: [0x0a0e33, 0.006],
    env: [0x0a0e33, 0x8a94ff],
    hemi: [0x8a94ff, 0x0a0e33, 0.55],
    dir: 0.35,
    point: 0.5,
    exposure: 1.05,
    spot: 60,
    spotColor: 0xfff0f8,
    wall: 0x141a4a,
    accentWall: 0x0f1438,
    ceiling: 0x0a0e33,
    floor: { color: 0x0b0f30, rough: 0.18, metal: 0.4, carpet: false },
    ceilingLights: 'neon',
    lightColor: 0xffc3e6,
    trim: 0xffc3e6,
    plinth: { color: 0x0a0e33, rough: 0.12, metal: 0.3 },
    halo: 0xffc3e6,
    plants: false,
    frame: 0x05061a,
    shaft: 0x05061a,
    carWall: 0x2a2f66,
    windows: ['#FFC3E6', '#ffe9a8', '#8A94FF'],
    towerFill: '#070a2a',
  },
  /* Galerie : musée blanc, sol béton ciré, l'objet et les visuels sont les stars. */
  galerie: {
    name: 'galerie',
    label: 'Galerie',
    sky: ['#DCE3FF', '#F1EDFA', '#FFE9F5', '#FFFFFF'],
    fog: [0xf1edfa, 0.004],
    env: [0xf1edfa, 0xffffff],
    hemi: [0xffffff, 0xd9d4e8, 1.6],
    dir: 1.2,
    point: 0.35,
    exposure: 1,
    spot: 25,
    spotColor: 0xffffff,
    wall: 0xf7f5fb,
    accentWall: 0xf7f5fb,
    ceiling: 0xffffff,
    floor: { color: 0xcfcbd8, rough: 0.35, metal: 0, carpet: false },
    ceilingLights: 'panels',
    lightColor: 0xffffff,
    trim: null,
    plinth: { color: 0xffffff, rough: 0.5, metal: 0 },
    halo: 0x2230f5,
    plants: false,
    frame: 0xffffff,
    shaft: 0xe6e2f0,
    carWall: 0xdedbe8,
    windows: ['#ffffff', '#F1EDFA', '#C9D4FF'],
    towerFill: '#b9c3ef',
  },
  /* Pop : la charte à fond, aplats cobalt et rose, contrastes francs. */
  pop: {
    name: 'pop',
    label: 'Pop',
    sky: ['#FFC3E6', '#FFC3E6', '#8A94FF', '#2230F5'],
    fog: [0x8a94ff, 0.003],
    env: [0x2230f5, 0xffc3e6],
    hemi: [0xffffff, 0xffc3e6, 1.9],
    dir: 1.3,
    point: 0.4,
    exposure: 1,
    spot: 0,
    spotColor: 0xffffff,
    wall: 0x2230f5,
    accentWall: 'tint',
    ceiling: 0x2230f5,
    floor: { color: 0xffc3e6, rough: 0.6, metal: 0, carpet: false },
    ceilingLights: 'panels',
    lightColor: 0xffffff,
    trim: null,
    plinth: { color: 0x0a0e33, rough: 0.2, metal: 0.1 },
    halo: 0xffffff,
    plants: false,
    frame: 0x0a0e33,
    shaft: 0x0a0e33,
    carWall: 0x2230f5,
    windows: ['#FFC3E6', '#FFFFFF', '#0A0E33'],
    towerFill: '#2230F5',
  },
};

export const DEFAULT_LOOK: LookName = 'nuit';

function pick(): LookName {
  const q = new URLSearchParams(location.search).get('look');
  const h = location.hash.slice(1);
  for (const c of [q, h]) if (c && c in LOOKS) return c as LookName;
  return DEFAULT_LOOK;
}

export const LOOK: Look = LOOKS[pick()];
document.documentElement.dataset.look = LOOK.name;

/** Sélecteur d'ambiance affiché en haut de page, le temps de choisir. Passer à false ensuite. */
export const SHOW_LOOK_PICKER = true;

if (SHOW_LOOK_PICKER) {
  const bar = document.createElement('div');
  bar.className = 'lookpick';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Ambiance');
  for (const l of Object.values(LOOKS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l.label;
    b.setAttribute('aria-pressed', String(l.name === LOOK.name));
    b.addEventListener('click', () => {
      if (l.name === LOOK.name) return;
      location.hash = l.name;
    });
    bar.appendChild(b);
  }
  const mount = () => document.body.appendChild(bar);
  if (document.body) mount();
  else addEventListener('DOMContentLoaded', mount);
}

// Changer d'ambiance demande de reconstruire la scène : on recharge la page.
addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (h in LOOKS && h !== LOOK.name) location.reload();
});
