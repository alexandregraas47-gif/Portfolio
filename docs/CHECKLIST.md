# Checklist de test

Légende : ✅ vérifié · ⬜ à faire · ⚠️ à surveiller

Ajouter `#debug` à l'URL affiche fps, pixelRatio, draw calls et le nom du GPU (à noter ci-dessous).

## Déjà vérifié (Chromium sans carte graphique, rendu logiciel SwiftShader)

Ces tests ont été faits dans un navigateur automatisé, sans GPU : ils valident le comportement et
la mise en page, **pas** les performances ni le rendu exact des couleurs sur un vrai écran.

| Test | Desktop 1440×900 | Mobile 390×844 (émulé) |
| --- | --- | --- |
| Préchargeur, puis arrivée dans le bureau | ✅ | ✅ |
| Descente : marche → portes → ascenseur → portes → salle | ✅ | ✅ |
| Afficheur d'ascenseur (▼ numéro + nom) | ✅ | ✅ |
| Les 12 étages : objet sur socle visible, panneau lisible | ✅ | ✅ (5 étages contrôlés) |
| Titres longs (CHILD'N'FUN, PRINTEMPS) contenus dans le panneau | ✅ | ✅ |
| Points de navigation, barre de progression, compteur | ✅ | ✅ |
| Bouton « Explorer en 360° » à l'arrêt, entrée / sortie | ✅ | ⬜ |
| 360° : regarder (drag), marcher (clavier), collisions murs / socle | ✅ | ⬜ |
| Clic sur un écran / cadre → galerie (en scroll et en 360°) | ✅ | ⬜ |
| Galerie : flèches, compteur, Échap (ne quitte pas le 360° en même temps) | ✅ | ⬜ |
| Images réelles : cadres muraux, galerie, écran de site (images de test) | ✅ | ⬜ |
| Clavier : PageDown → étage suivant | ✅ | — |
| Repli sans WebGL (version HTML) | ✅ | ✅ |
| Qualité dynamique : baisse du pixelRatio quand le fps chute | ✅ | ⬜ |

## À faire sur vrais appareils

Noter pour chaque appareil : modèle, navigateur, fps affiché par `#debug`, remarques.

### Ordinateur de l'école (sans carte graphique dédiée)
- ⬜ Chrome : fluidité de la descente (cible 60 fps), lisibilité sur vidéoprojecteur
- ⬜ Firefox
- ⬜ Télécommande de présentation (PageDown / PageUp)
- ⬜ Couleurs et éclairage : murs blancs pas « brûlés », teintes d'étage fidèles (réglages : `LIGHT` dans `src/three/world.ts`)

### Mac
- ⬜ Safari : rendu, polices, scroll
- ⬜ Chrome

### iPhone (Safari)
- ⬜ Scroll et descente fluides (cible ≥ 30 fps)
- ⬜ Barre d'adresse qui apparaît / disparaît : pas de saut de position
- ⬜ 360° : glisser pour regarder, boutons ▲▼
- ⬜ Gyroscope : bouton ◉, demande d'autorisation iOS, le regard suit le téléphone
- ⬜ Galerie : swipe, bouton Fermer accessible
- ⬜ Portrait et paysage

### Android (Chrome)
- ⬜ Mêmes points que l'iPhone (le gyroscope n'a pas de demande d'autorisation)

### Accessibilité
- ⬜ Navigation au clavier seul (Tab sur les points, les boutons, la galerie)
- ⬜ Lecteur d'écran (VoiceOver) : panneaux et boutons annoncés
- ⬜ « Réduire les animations » activé dans le système : pas de tremblement ni de lissage

### Partage
- ⬜ Aperçu du lien (WhatsApp, LinkedIn) avec l'image `og.jpg` une fois `VITE_SITE_URL` renseigné
