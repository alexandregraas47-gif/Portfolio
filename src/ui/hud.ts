import { SITE, STEPS } from '../content';
import type { Step } from '../content';

/* Panneaux de texte HTML, points de navigation, afficheur d'ascenseur, barre de progression. */

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function contactLinks(): string {
  const out: string[] = [];
  if (SITE.email) out.push(`<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`);
  else out.push('<span class="todo">[email à ajouter]</span>');
  if (SITE.linkedin) out.push(`<a href="${esc(SITE.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>`);
  else out.push('<span class="todo">[LinkedIn à ajouter]</span>');
  if (SITE.pdf) out.push(`<a href="${esc(import.meta.env.BASE_URL + SITE.pdf)}" download>Portfolio PDF ↓</a>`);
  return out.join('');
}

export function panelHTML(s: Step): string {
  if (s.type === 'intro') {
    return `<div class="box"><span class="tag accent">Alexandre Graas · ICN Business School · Nancy → Berlin</span><h1 class="big">Alex</h1><h2 class="big"><span class="serif accent">Brand</span> &amp; marketing</h2></div>`;
  }
  if (s.type === 'end') {
    return `<div class="box"><span class="tag accent">Une idée, un projet ?</span><h2 class="big">Parlons-en.</h2><div class="links">${contactLinks()}</div><button class="pill" data-top type="button">Revenir au début ↑</button></div>`;
  }
  const team = s.team?.length ? `<p class="team"><span class="serif">avec</span> ${s.team.map(esc).join(', ')}</p>` : '';
  const role = s.role ? `<p class="role"><b>Mon rôle :</b> ${esc(s.role)}</p>` : '';
  const screens = (s.screens ?? [])
    .filter((sc) => sc.url)
    .map((sc) => `<a class="ext" href="${esc(sc.url!)}" target="_blank" rel="noopener">${esc(sc.label)} ↗</a>`)
    .join('');
  return `<div class="box"><span class="num big" aria-hidden="true">${esc(s.n ?? '')}</span><span class="tag accent">${esc(s.tag)}</span><h2 class="big">${esc(s.title)}</h2><p>${esc(s.text ?? '')}</p>${role}${team}<ul class="chips">${(s.chips ?? []).map((c) => `<li>${esc(c)}</li>`).join('')}</ul><div class="acts"><button class="pill sm" type="button" data-gallery="${esc(s.slug)}">Voir les visuels</button>${screens}</div></div>`;
}

export interface Hud {
  panels: HTMLElement[];
  dots: HTMLButtonElement[];
  bar: HTMLElement;
  lab: HTMLElement;
  hint: HTMLElement;
  lift: HTMLElement;
  liftNum: HTMLElement;
  liftName: HTMLElement;
}

export function buildHud(onGoto: (k: number) => void, onGallery: (slug: string) => void): Hud {
  const hud = $('#hud');
  const hint = $('#hint');
  const dotsEl = $('#dots');
  const panels: HTMLElement[] = [];
  const N = STEPS.length;

  STEPS.forEach((s, k) => {
    const sec = document.createElement('section');
    sec.className = 'st';
    sec.setAttribute('aria-label', s.title);
    const objRight = k % 2 === 1;
    if (s.type === 'intro') sec.classList.add('intro');
    else if (s.type === 'end') sec.classList.add('end');
    else sec.classList.add(objRight ? 'l' : 'r');
    sec.innerHTML = panelHTML(s);
    hud.insertBefore(sec, hint);
    panels.push(sec);

    const b = document.createElement('button');
    b.type = 'button';
    const fl = N - 1 - k;
    b.setAttribute('aria-label', `Étage ${fl === 0 ? 'RDC' : fl} : ${s.title}`);
    b.title = s.title;
    b.addEventListener('click', () => onGoto(k));
    dotsEl.appendChild(b);
  });

  hud.querySelectorAll<HTMLButtonElement>('[data-top]').forEach((b) => b.addEventListener('click', () => onGoto(0)));
  hud.querySelectorAll<HTMLButtonElement>('[data-gallery]').forEach((b) =>
    b.addEventListener('click', () => onGallery(b.dataset.gallery!)),
  );

  fitTitles(hud);
  document.fonts?.ready.then(() => fitTitles(hud));
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(() => fitTitles(hud), 150); });

  return {
    panels,
    dots: Array.from(dotsEl.children) as HTMLButtonElement[],
    bar: $('#bar'),
    lab: $('#lab'),
    hint,
    lift: $('#lift'),
    liftNum: $('#liftNum'),
    liftName: $('#liftName'),
  };
}

/** Réduit la taille des titres qui débordent de leur panneau (mots longs : CHILD'N'FUN…). */
export function fitTitles(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.st h2.big, .st h1.big').forEach((h) => {
    h.style.fontSize = '';
    const box = h.parentElement!;
    const max = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) - parseFloat(getComputedStyle(box).paddingRight);
    let size = parseFloat(getComputedStyle(h).fontSize);
    let guard = 20;
    while (h.scrollWidth > Math.max(max, h.clientWidth) + 1 && size > 18 && guard--) {
      size *= 0.92;
      h.style.fontSize = size + 'px';
    }
  });
}

/** Version HTML statique (pas de WebGL) : tous les panneaux à la suite. */
export function buildStatic() {
  document.body.classList.add('nogl');
  const root = $('#static');
  root.hidden = false;
  root.innerHTML =
    `<p class="tag accent nogl-note">Version simplifiée : ton navigateur n'affiche pas la 3D.${SITE.pdf ? ` <a href="${esc(import.meta.env.BASE_URL + SITE.pdf)}" download>Télécharger le portfolio en PDF</a>.` : ''}</p>` +
    STEPS.map((s) => `<section class="st ${s.type === 'project' ? '' : s.type}">${panelHTML(s)}</section>`).join('');
  root.querySelectorAll<HTMLButtonElement>('[data-top]').forEach((b) =>
    b.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' })),
  );
}
