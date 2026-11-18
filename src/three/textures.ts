import * as THREE from 'three';
import { FONT, box, canvasTexture, hexStr, metal, whenFonts, wrapText } from './kit';

/** Charge une image et la décode hors du thread principal quand c'est possible. */
export async function loadBitmap(url: string): Promise<CanvasImageSource & { width: number; height: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const blob = await res.blob();
  if ('createImageBitmap' in window) return createImageBitmap(blob);
  return await new Promise((ok, ko) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = ko;
    im.src = URL.createObjectURL(blob);
  });
}

function drawCover(x: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, W: number, H: number, bg = '#fff') {
  const sc = Math.max(W / img.width, H / img.height);
  const dw = img.width * sc;
  const dh = img.height * sc;
  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);
  x.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

export interface FramePanel {
  group: THREE.Group;
  /** Surface cliquable (raycast en 360°). */
  plane: THREE.Mesh;
  setImage(url: string): Promise<void>;
}

/** Cadre mural : visuel du projet, ou placeholder graphique tant qu'il n'y a pas d'image. */
export function framePanel(num: string, title: string, col: number): FramePanel {
  const W = 1024;
  const H = 640;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  const tex = canvasTexture(c);
  const hex = hexStr(col);
  let hasImage = false;

  whenFonts(() => {
    if (hasImage) return;
    x.fillStyle = hex;
    x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(10,14,51,.16)';
    x.lineWidth = 2;
    for (let i = 0; i <= W; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for (let j = 0; j <= H; j += 64) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
    x.fillStyle = '#0A0E33';
    x.font = `700 30px ${FONT}`;
    x.fillText(num + ' · PROJET', 48, 76);
    x.font = `800 84px ${FONT}`;
    wrapText(x, title.toUpperCase(), 48, 170, 900, 88);
    x.setLineDash([16, 12]);
    x.lineWidth = 4;
    x.strokeStyle = '#0A0E33';
    x.strokeRect(48, 360, 928, 224);
    x.beginPath();
    x.moveTo(48, 360); x.lineTo(976, 584); x.moveTo(976, 360); x.lineTo(48, 584);
    x.stroke();
    x.setLineDash([]);
    x.fillStyle = hex;
    x.fillRect(352, 448, 320, 48);
    x.fillStyle = '#0A0E33';
    x.font = `700 30px ${FONT}`;
    x.textAlign = 'center';
    x.fillText('VISUEL À VENIR', 512, 482);
    x.textAlign = 'left';
    tex.needsUpdate = true;
  });

  const group = new THREE.Group();
  box(3.7, 2.35, 0.12, metal(0x0a0e33), 0, 0, 0, group);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.19), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  plane.position.z = 0.07;
  group.add(plane);

  return {
    group,
    plane,
    async setImage(url) {
      const img = await loadBitmap(url);
      hasImage = true;
      drawCover(x, img, W, H);
      tex.needsUpdate = true;
      if ('close' in img && typeof img.close === 'function') img.close();
    },
  };
}

export interface ScreenPanel extends FramePanel {}

/** Écran mural affichant la capture d'un site (barre de navigateur + libellé). */
export function screenPanel(label: string, col: number): ScreenPanel {
  const W = 1024;
  const H = 640;
  const BAR = 56;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  const tex = canvasTexture(c);
  let img: (CanvasImageSource & { width: number; height: number }) | null = null;

  const draw = () => {
    // barre de navigateur
    x.fillStyle = '#0A0E33';
    x.fillRect(0, 0, W, BAR);
    ['#FF8A5C', '#FFD46B', '#3DAA6B'].forEach((cc, i) => {
      x.fillStyle = cc;
      x.beginPath();
      x.arc(32 + i * 30, BAR / 2, 9, 0, Math.PI * 2);
      x.fill();
    });
    x.fillStyle = 'rgba(241,237,250,.14)';
    x.fillRect(140, 12, W - 170, BAR - 24);
    x.fillStyle = '#F1EDFA';
    x.font = `600 22px ${FONT}`;
    x.fillText(label, 160, BAR / 2 + 8);
    if (img) {
      const sc = W / img.width; // capture : calée en largeur, haut de page visible
      x.fillStyle = '#fff';
      x.fillRect(0, BAR, W, H - BAR);
      x.drawImage(img, 0, BAR, W, img.height * sc);
    } else {
      x.fillStyle = hexStr(col);
      x.fillRect(0, BAR, W, H - BAR);
      x.fillStyle = '#0A0E33';
      x.font = `800 64px ${FONT}`;
      x.textAlign = 'center';
      x.fillText(label.toUpperCase(), W / 2, H / 2 + 10);
      x.font = `600 28px ${FONT}`;
      x.fillText('Capture du site à venir', W / 2, H / 2 + 60);
      x.textAlign = 'left';
    }
    tex.needsUpdate = true;
  };
  whenFonts(draw);

  const group = new THREE.Group();
  const m = metal(0x0a0e33);
  box(3.3, 2.15, 0.14, m, 0, 0, 0, group);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.94), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  plane.position.z = 0.08;
  group.add(plane);
  return {
    group,
    plane,
    async setImage(url) {
      img = await loadBitmap(url);
      draw();
    },
  };
}

/** Enseigne d'étage : numéro géant + titre + tag sur la teinte d'accent. */
export function signTexture(num: string, title: string, tag: string, col: number) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 480;
  const x = c.getContext('2d')!;
  const tex = canvasTexture(c);
  whenFonts(() => {
    x.fillStyle = hexStr(col);
    x.fillRect(0, 0, 2048, 480);
    x.fillStyle = '#0A0E33';
    x.font = `700 44px ${FONT}`;
    x.fillText(tag.toUpperCase(), 90, 100);
    x.font = `850 250px ${FONT}`;
    x.fillText(num, 90, 370);
    x.font = `850 130px ${FONT}`;
    wrapText(x, title.toUpperCase(), num ? 600 : 90, 270, 1350, 130);
    tex.needsUpdate = true;
  });
  return tex;
}

/** Petite plaque « numéro d'étage » à côté des portes. */
export function numTexture(txt: string) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const x = c.getContext('2d')!;
  const tex = canvasTexture(c);
  whenFonts(() => {
    x.fillStyle = '#0A0E33';
    x.fillRect(0, 0, 128, 64);
    x.fillStyle = '#FFC3E6';
    x.font = `800 44px ${FONT}`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(txt, 64, 34);
    tex.needsUpdate = true;
  });
  return tex;
}

export function carpetTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#262a52';
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(255,255,255,.07)';
  x.lineWidth = 3;
  x.strokeRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(7, 4);
  return t;
}
