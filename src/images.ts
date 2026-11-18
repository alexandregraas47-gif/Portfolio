import manifest from './generated/images.json';
import type { Step } from './content';

export interface ImageEntry {
  name: string;
  w: number;
  h: number;
  /** Galerie, WebP 1600 px */
  full: string;
  /** Galerie, AVIF 1600 px */
  avif: string;
  /** Texture murale, WebP 1024 px */
  wall: string;
}

const M = manifest as Record<string, ImageEntry[]>;
const base = import.meta.env.BASE_URL;
const withBase = (e: ImageEntry): ImageEntry => ({
  ...e,
  full: base + e.full,
  avif: base + e.avif,
  wall: base + e.wall,
});

/** Toutes les images d'un projet, dans l'ordre des fichiers. */
export function allImages(slug: string): ImageEntry[] {
  return (M[slug] ?? []).map(withBase);
}

/** Images de la galerie / des cadres muraux (hors captures d'écrans). */
export function projectImages(step: Step): ImageEntry[] {
  const screenNames = new Set((step.screens ?? []).map((s) => s.image).filter(Boolean));
  return allImages(step.slug).filter((e) => !screenNames.has(e.name));
}

/** Capture associée à un écran, si elle existe. */
export function screenImage(step: Step, name?: string): ImageEntry | undefined {
  if (!name) return undefined;
  return allImages(step.slug).find((e) => e.name === name);
}
