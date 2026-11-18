/**
 * Contenu du site — source de vérité unique.
 *
 * Ajouter un projet = ajouter une entrée dans `STEPS` (entre l'intro et le contact)
 * + déposer ses images dans `raw/<slug>/` puis lancer `npm run images`.
 * L'ordre du tableau = l'ordre des étages, du haut (bureau) vers le bas (RDC).
 * Le numéro d'étage affiché est calculé automatiquement.
 */

export type ExhibitKind =
  | 'office'
  | 'duo'
  | 'dream'
  | 'closet'
  | 'bento'
  | 'mazic'
  | 'heart'
  | 'plane'
  | 'bag'
  | 'blocks'
  | 'globe'
  | 'contact';

export interface Screen {
  /** Libellé affiché sous la capture et sur le bouton de lien. */
  label: string;
  /** Lien externe (laisser vide tant qu'il n'est pas fourni). */
  url?: string;
  /** Nom de fichier de la capture dans raw/<slug>/ (sans extension), ex. "site-1". */
  image?: string;
}

export interface Step {
  type: 'intro' | 'project' | 'end';
  /** Identifiant = nom du dossier d'images (raw/<slug>, public/img/<slug>). */
  slug: string;
  /** Numéro affiché (« 01 »…). */
  n?: string;
  tag: string;
  title: string;
  text?: string;
  /** Une phrase sur le rôle d'Alex dans le projet. */
  role?: string;
  /** Coéquipiers (projets de groupe). */
  team?: string[];
  chips?: string[];
  /** Teinte d'accent de l'étage (mur nord, enseigne, cadres). */
  bg: number;
  exhibit: ExhibitKind;
  /** Écrans (captures de sites) affichés dans la salle. */
  screens?: Screen[];
}

/** Liens globaux : à compléter par Alex. Vide = non affiché. */
export const SITE = {
  name: 'Alexandre Graas',
  email: '', // ex. 'alexandre.graas@exemple.com'
  linkedin: '', // ex. 'https://www.linkedin.com/in/…'
  /** PDF du portfolio (Canva), à déposer dans public/ — ex. 'portfolio-alexandre-graas.pdf' */
  pdf: '',
};

export const STEPS: Step[] = [
  {
    type: 'intro',
    slug: 'bureau',
    n: '00',
    tag: 'Dernier étage',
    title: 'Mon bureau',
    bg: 0x2230f5,
    exhibit: 'office',
  },
  {
    type: 'project',
    slug: 'duo',
    n: '01',
    tag: 'Brand Management · Projet final',
    title: 'DUO by UNSEEN',
    bg: 0xffc3e6,
    exhibit: 'duo',
    text: "Un duo de parfums premium inspiré des Amants de Magritte. Deux flacons complémentaires qui forment une seule sculpture, le mantra « Feel What You Cannot See », une persona de créatif urbain, une musique de Satie et une publicité imprimée.",
    chips: ['Positionnement', 'Identité de marque', 'Storytelling', 'Extensions de gamme'],
  },
  {
    type: 'project',
    slug: 'accessible-dream',
    n: '02',
    tag: 'Branding · Campagne ICN',
    title: 'The Accessible Dream',
    bg: 0xffe3a3,
    exhibit: 'dream',
    text: "Campagne de notoriété internationale pour ICN Business School : l'étudiant est le héros, ICN est la rampe de lancement. Trois piliers (Prove it, Live it, Reach it), un court-métrage, des Future Talks et la signature « Dream Big. Start Here. ».",
    team: ['Axelle Thomas', 'Adrita Dam', 'Gerardo Hidalgo'],
    chips: ['Stratégie de campagne', 'Réseaux sociaux', 'Gestion de crise'],
  },
  {
    type: 'project',
    slug: 'fashion-lab',
    n: '03',
    tag: 'Business Models & Entrepreneurship',
    title: 'Fashion Lab',
    bg: 0xe4d2ff,
    exhibit: 'closet',
    text: "Une app de styliste personnel IA qui transforme sa garde-robe en tenues, avec revente en un geste et récompenses. Sondage de 28 réponses, business model canvas, analyse de valeur durable, seuil de rentabilité, et un site web sur Wix.",
    chips: ['App IA', 'Business model', 'Étude utilisateurs', 'Site Wix'],
    screens: [{ label: 'Le site Wix', url: '', image: 'site-wix' }],
  },
  {
    type: 'project',
    slug: 'umami-bento',
    n: '04',
    tag: 'Étude de marché · 2025',
    title: 'Umami Bento',
    bg: 0xd8f3e6,
    exhibit: 'bento',
    text: "Étude de marché de la marque Umami Bento : marché du bento en Europe, offre, SWOT, PESTEL, segmentation avec persona, plan de communication et extensions de gamme (bento chauffant, gourdes).",
    chips: ['Étude de marché', 'SWOT & PESTEL', 'Persona', 'Extension de gamme'],
  },
  {
    type: 'project',
    slug: 'mazic',
    n: '05',
    tag: 'Étude qualitative · 2024',
    title: 'MAZIC',
    bg: 0xc9d4ff,
    exhibit: 'mazic',
    text: "Étude qualitative de MAZIC, une entreprise qui utilise la musique pour améliorer le bien-être au travail : ses offres, ses concurrents, ses clients, un guide d'entretien, un SWOT et une revue de littérature.",
    chips: ['Entretiens', 'Concurrence', 'SWOT'],
  },
  {
    type: 'project',
    slug: 'child-n-fun',
    n: '06',
    tag: 'Engagement · Association · 2024',
    title: "Child'N'Fun",
    bg: 0xffd0bf,
    exhibit: 'heart',
    text: "Rapport final d'un mandat dans l'association d'ICN qui aide des enfants en situation de handicap : visite d'un IME, visioconférence de sensibilisation, projet d'escape game, bilan et pistes pour l'avenir.",
    chips: ['Inclusion', 'Gestion de projet', 'Partenariats'],
  },
  {
    type: 'project',
    slug: 'celestia-airways',
    n: '07',
    tag: 'Entrepreneuriat · Compagnie fictive',
    title: 'Celestia Airways',
    bg: 0xf3e2b3,
    exhibit: 'plane',
    text: "Une compagnie aérienne haut de gamme fictive, avec son hub à Los Angeles, et deux sites web créés pour l'incarner.",
    chips: ['Branding', 'Sites web', 'Wix'],
    screens: [
      { label: 'Site n°1', url: '', image: 'site-1' },
      { label: 'Site n°2', url: '', image: 'site-2' },
    ],
  },
  {
    type: 'project',
    slug: 'printemps',
    n: '08',
    tag: 'Expérience professionnelle',
    title: 'Printemps',
    bg: 0xe6e6f5,
    exhibit: 'bag',
    text: 'Mon expérience chez Printemps : missions et visuels à compléter.',
    chips: ['À compléter'],
  },
  {
    type: 'project',
    slug: 'bandai',
    n: '09',
    tag: 'Expérience professionnelle',
    title: 'Bandai',
    bg: 0xffe3a3,
    exhibit: 'blocks',
    text: 'Mon expérience chez Bandai : missions et visuels à compléter.',
    chips: ['À compléter'],
  },
  {
    type: 'project',
    slug: 'port-douglas',
    n: '10',
    tag: 'Volontariat · 2 mois',
    title: 'Port Douglas',
    bg: 0xc9d4ff,
    exhibit: 'globe',
    text: "Wildlife Habitat, en Australie : nettoyage des enclos, préparation de la nourriture, accueil des visiteurs et logistique. Un terrain où l'on apprend la rigueur et le contact avec le public.",
    chips: ['Australie', 'Terrain', 'Accueil du public'],
  },
  {
    type: 'end',
    slug: 'contact',
    n: '',
    tag: 'Rez-de-chaussée',
    title: 'Accueil',
    bg: 0x2230f5,
    exhibit: 'contact',
  },
];
