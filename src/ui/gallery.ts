/* Galerie plein écran (lightbox) : clavier, swipe, focus piégé, chargement à la demande. */

export interface GalleryItem {
  webp?: string;
  avif?: string;
  w?: number;
  h?: number;
  alt: string;
  caption?: string;
  /** Lien externe (écrans de sites). */
  link?: string;
  linkLabel?: string;
}

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

export class Gallery {
  private el = $('#lb');
  private pic = $<HTMLPictureElement>('#lbPic');
  private cap = $('#lbCap');
  private count = $('#lbCount');
  private link = $<HTMLAnchorElement>('#lbLink');
  private prev = $<HTMLButtonElement>('#lbPrev');
  private next = $<HTMLButtonElement>('#lbNext');
  private items: GalleryItem[] = [];
  private i = 0;
  private returnFocus: HTMLElement | null = null;
  onClose: () => void = () => {};

  constructor() {
    $('#lbX').addEventListener('click', () => this.close());
    this.prev.addEventListener('click', () => this.go(-1));
    this.next.addEventListener('click', () => this.go(1));
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el || (e.target as HTMLElement).classList.contains('lb-stage')) this.close();
    });
    this.el.addEventListener('keydown', (e) => {
      // Fenêtre modale : ses touches ne remontent pas (Échap ne doit pas aussi quitter le 360°).
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
      else if (e.key === 'ArrowRight') this.go(1);
      else if (e.key === 'ArrowLeft') this.go(-1);
      else if (e.key === 'Tab') this.trap(e);
    });
    // swipe
    let sx = 0, sy = 0;
    this.el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    this.el.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) this.go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  get isOpen() {
    return this.el.classList.contains('on');
  }

  open(items: GalleryItem[], start = 0) {
    if (!items.length) return;
    this.items = items;
    this.i = Math.min(start, items.length - 1);
    this.returnFocus = document.activeElement as HTMLElement | null;
    this.el.classList.add('on');
    this.el.setAttribute('aria-hidden', 'false');
    const multi = items.length > 1;
    this.prev.hidden = this.next.hidden = this.count.hidden = !multi;
    this.show();
    $<HTMLButtonElement>('#lbX').focus();
  }

  close() {
    if (!this.isOpen) return;
    this.el.classList.remove('on');
    this.el.setAttribute('aria-hidden', 'true');
    this.pic.innerHTML = '';
    this.returnFocus?.focus?.();
    this.onClose();
  }

  private go(d: number) {
    if (this.items.length < 2) return;
    this.i = (this.i + d + this.items.length) % this.items.length;
    this.show();
  }

  private show() {
    const it = this.items[this.i];
    this.pic.innerHTML = '';
    if (it.webp) {
      if (it.avif) {
        const s = document.createElement('source');
        s.type = 'image/avif';
        s.srcset = it.avif;
        this.pic.appendChild(s);
      }
      const img = document.createElement('img');
      img.src = it.webp;
      img.alt = it.alt;
      img.decoding = 'async';
      if (it.w && it.h) { img.width = it.w; img.height = it.h; }
      this.pic.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'lb-ph';
      ph.innerHTML = `<span class="tag">Bientôt ici</span><strong class="big">${it.alt}</strong>`;
      this.pic.appendChild(ph);
    }
    this.cap.textContent = it.caption ?? '';
    this.count.textContent = `${this.i + 1} / ${this.items.length}`;
    if (it.link) {
      this.link.hidden = false;
      this.link.href = it.link;
      this.link.textContent = (it.linkLabel ?? 'Ouvrir le site') + ' ↗';
    } else this.link.hidden = true;
    // préchargement de la suivante
    const nx = this.items[(this.i + 1) % this.items.length];
    if (nx?.webp && nx !== it) { const p = new Image(); p.src = nx.webp; }
  }

  private trap(e: KeyboardEvent) {
    const f = Array.from(this.el.querySelectorAll<HTMLElement>('button:not([hidden]), a:not([hidden])'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}
