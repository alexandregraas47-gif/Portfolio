#!/usr/bin/env node
/**
 * Préparation des images : raw/<slug>/*.{png,jpg,jpeg,webp,tif} → public/img/<slug>/
 *
 *   <nom>-1600.webp  + <nom>-1600.avif   (galerie, chargées à la demande)
 *   <nom>-1024.webp                      (texture murale dans la salle 3D)
 *
 * Écrit aussi src/generated/images.json (manifeste lu par le site).
 * L'ordre des images = l'ordre alphabétique des fichiers : préfixer par 01-, 02-…
 *
 * Usage : npm run images            (ne régénère que ce qui a changé)
 *         npm run images -- --force (tout régénérer)
 */
import { readdir, mkdir, stat, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'raw');
const OUT = path.join(root, 'public', 'img');
const MANIFEST = path.join(root, 'src', 'generated', 'images.json');
const FORCE = process.argv.includes('--force');
const EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.avif']);

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function newer(src, dst) {
  if (FORCE || !existsSync(dst)) return true;
  const [a, b] = await Promise.all([stat(src), stat(dst)]);
  return a.mtimeMs > b.mtimeMs;
}

async function main() {
  if (!existsSync(RAW)) {
    console.log('Aucun dossier raw/ : rien à faire.');
    return;
  }
  const manifest = {};
  const dirs = (await readdir(RAW, { withFileTypes: true })).filter((d) => d.isDirectory());
  let count = 0;

  for (const dir of dirs) {
    const slug = dir.name;
    const files = (await readdir(path.join(RAW, slug)))
      .filter((f) => EXT.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
    if (!files.length) continue;

    const outDir = path.join(OUT, slug);
    await mkdir(outDir, { recursive: true });
    manifest[slug] = [];

    for (const file of files) {
      const src = path.join(RAW, slug, file);
      const name = slugify(path.parse(file).name);
      const base = (w, ext) => path.join(outDir, `${name}-${w}.${ext}`);
      const img = sharp(src, { failOn: 'none' }).rotate(); // respecte l'orientation EXIF
      const meta = await img.metadata();
      const w0 = meta.autoOrient?.width ?? meta.width;
      const h0 = meta.autoOrient?.height ?? meta.height;

      if (await newer(src, base(1600, 'webp'))) {
        const big = img.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });
        await big.clone().webp({ quality: 80, effort: 5 }).toFile(base(1600, 'webp'));
        await big.clone().avif({ quality: 55, effort: 4 }).toFile(base(1600, 'avif'));
        // Texture murale : bornée à 1024 px (le cadre fait un "cover").
        // Capture de page très haute : on garde le haut de la page, en pleine largeur.
        const tall = h0 / w0 > 1.4;
        await img
          .clone()
          .resize(
            tall
              ? { width: 1024, height: 640, fit: 'cover', position: 'top' }
              : { width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true },
          )
          .webp({ quality: 78, effort: 5 })
          .toFile(base(1024, 'webp'));
        count++;
        console.log(`  ✓ ${slug}/${file}`);
      }
      const scale = Math.min(1, 1600 / Math.max(w0, h0));
      manifest[slug].push({
        name,
        w: Math.round(w0 * scale),
        h: Math.round(h0 * scale),
        full: `img/${slug}/${name}-1600.webp`,
        avif: `img/${slug}/${name}-1600.avif`,
        wall: `img/${slug}/${name}-1024.webp`,
      });
    }
  }

  // Nettoyage des dossiers de sortie dont la source a disparu.
  if (existsSync(OUT)) {
    for (const d of await readdir(OUT, { withFileTypes: true })) {
      if (d.isDirectory() && !manifest[d.name]) await rm(path.join(OUT, d.name), { recursive: true });
    }
  }

  await mkdir(path.dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  const total = Object.values(manifest).reduce((n, l) => n + l.length, 0);
  console.log(`${count} image(s) convertie(s), ${total} au total. Manifeste : src/generated/images.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
