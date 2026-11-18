# raw/ — images sources

Un dossier par projet, nommé comme le `slug` dans `src/content.ts` :

```
raw/
  duo/                 01-affiche.png  02-flacons.png  03-persona.png
  accessible-dream/    …
  fashion-lab/         01-….png  site-wix.png      ← capture du site (nom = screens[].image)
  celestia-airways/    01-….png  site-1.png  site-2.png
  printemps/  bandai/  port-douglas/  (photos)
```

- L'ordre = l'ordre alphabétique : préfixer `01-`, `02-`… Les 2 premières vont sur les cadres muraux.
- Formats acceptés : PNG, JPG, WebP, TIFF, AVIF. Taille conseillée ≥ 1600 px de large.
- Captures de sites : de préférence au format paysage (16:10). Une capture « pleine page »
  très haute est acceptée : l'écran 3D en montre le haut.
- Puis : `npm run images` → `public/img/<slug>/` + `src/generated/images.json`.

Ce dossier est ignoré par git (fichiers lourds) ; seul ce README est versionné.
