# La Tour d'Alex — portfolio 3D

Portfolio immersif d'Alexandre Graas (ICN Business School, MSc Brand & Marketing Management).
On commence dans le bureau d'Alex au dernier étage, on prend l'ascenseur (scroll = descente) :
un étage par projet, et au rez-de-chaussée, « Parlons-en. ».

Vite + TypeScript + Three.js, sans CDN. Un seul canvas plein écran, HUD en HTML/CSS par-dessus.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173 (ajouter #debug pour voir fps / draw calls)
npm run build      # vérifie les types puis construit dans dist/
npm run preview    # sert dist/ en local
```

Node 20 ou plus récent.

## Ajouter ou modifier un projet

1. **Texte** : ajouter / modifier une entrée dans [`src/content.ts`](src/content.ts) (`STEPS`).
   L'ordre du tableau = l'ordre des étages, du haut vers le bas. Le numéro d'étage se calcule tout seul.
   Champs utiles : `title`, `tag`, `text`, `role` (une phrase sur ton rôle), `team` (coéquipiers),
   `chips`, `bg` (teinte de l'étage), `exhibit` (objet 3D sur le socle), `screens` (captures de sites + liens).
2. **Images** : déposer les fichiers dans `raw/<slug>/` (voir [`raw/README.md`](raw/README.md)), puis :
   ```bash
   npm run images
   ```
   Le script produit `public/img/<slug>/<nom>-1600.webp|.avif` (galerie) et `<nom>-1024.webp`
   (texture murale), et met à jour `src/generated/images.json`. Les 2 premières images vont
   sur les cadres muraux, toutes sont dans la galerie.
3. **Liens globaux** (email, LinkedIn, PDF du portfolio) : objet `SITE` en haut de `src/content.ts`.
   Le PDF se dépose dans `public/`.

Un nouvel objet 3D se code dans [`src/three/exhibits.ts`](src/three/exhibits.ts) (un builder = une fonction).

## Organisation

| Fichier | Rôle |
| --- | --- |
| `src/content.ts` | Tous les textes, liens, teintes : la source de vérité |
| `src/main.ts` | Démarrage, préchargeur, scroll, repli sans WebGL |
| `src/scene.ts` | Renderer, boucle, caméra de scroll (phases du brief §4), clavier |
| `src/explore360.ts` | Mode 360° : drag avec inertie, marche, collisions, gyroscope, clic sur cadres |
| `src/three/world.ts` | La tour : étages, murs, cadres, écrans, ascenseur, skyline |
| `src/three/exhibits.ts` | Les 12 objets sur socle |
| `src/three/textures.ts` | Textures canvas : enseignes, cadres, écrans, plaques |
| `src/ui/hud.ts`, `src/ui/gallery.ts` | Panneaux de texte, navigation, galerie plein écran |
| `src/quality.ts` | Qualité dynamique (pixelRatio selon le fps) |
| `scripts/prepare-images.mjs` | `raw/` → `public/img/` optimisé |

## Commandes au clavier

- **Scroll / ↑↓** : descendre et monter. **PageDown, →, Espace** : étage suivant ; **PageUp, ←** : précédent
  (une télécommande de présentation fonctionne donc directement). **Début / Fin** : bureau / accueil.
- À l'arrêt sur un étage : **Entrée** ou **E** = mode 360°.
- En 360° : **WASD / ZQSD / flèches** pour marcher et tourner, molette pour avancer, **Échap** pour sortir.
- Galerie : **← →**, **Échap**. Sur mobile : glisser.

## Déploiement

Le build est un site statique (`dist/`), chemins relatifs : il marche à la racine d'un domaine
comme dans un sous-dossier.

- **Cloudflare Pages** : commande de build `npm run build`, dossier `dist`. Les en-têtes de cache
  sont dans `public/_headers`. Brotli et HTTPS sont automatiques.
- **Vercel** : importer le dépôt, `vercel.json` est déjà configuré.

Une fois le domaine choisi, renseigner `VITE_SITE_URL` (dans `.env` ou dans les variables
d'environnement de l'hébergeur) pour que l'image de partage (`public/og.jpg`) ait une URL absolue.
Garder aussi le lien direct de l'hébergeur (`*.pages.dev` / `*.vercel.app`) comme version de secours.

## Performance et robustesse

- Premier chargement ≈ 0,5 Mo (JS 3D ~160 Ko gzip, polices ~110 Ko, image de partage à part).
  Les textures murales sont chargées quand l'étage approche, les images de galerie à l'ouverture.
- Seuls les étages à moins de 1,7 niveau de la caméra sont rendus ; la skyline est une seule
  géométrie fusionnée ; les géométries de boîtes sont partagées. ~70–100 draw calls par image.
- pixelRatio plafonné à 2 (1,5 sur mobile), puis ajusté en continu selon le fps mesuré.
- Rendu en pause quand l'onglet est caché ; perte de contexte GPU gérée.
- Sans WebGL (ou en cas d'erreur) : version HTML statique lisible, galerie comprise.
- `prefers-reduced-motion` : pas de lissage, pas de tremblement, pas de « punch » de FOV.

## Tests

Voir [`docs/CHECKLIST.md`](docs/CHECKLIST.md).
