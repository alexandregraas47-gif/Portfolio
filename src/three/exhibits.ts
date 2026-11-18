import * as THREE from 'three';
import type { ExhibitKind } from '../content';
import { FONT, bar, box, canvasTexture, chrome, glossy, matte, metal, pivot, whenFonts } from './kit';
import type { ExhibitApi } from './kit';

/* Objets 3D posés sur les socles, un par étage. Chaque builder ajoute ses meshes au groupe
   fourni et renvoie une petite API d'animation. Repris du prototype à l'identique. */

type Builder = (g0: THREE.Group) => ExhibitApi;
const V = THREE.Vector3;

const office: Builder = (g0) => {
  const g = new THREE.Group();
  g.rotation.y = Math.PI / 2;
  g0.add(g);
  const wood = matte(0xc9a27a, 0.3);
  const dark = matte(0x1c1f45, 0.2);
  box(4, 0.14, 2, wood, 0, -0.9, 0, g);
  for (const [lx, lz] of [[-1.8, -0.9], [1.8, -0.9], [-1.8, 0.9], [1.8, 0.9]]) box(0.1, 1.6, 0.1, dark, lx, -1.7, lz * 0.9, g);
  // écran dessiné en canvas
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 576;
  const x = c.getContext('2d')!;
  const tex = canvasTexture(c);
  whenFonts(() => {
    x.fillStyle = '#2230F5';
    x.fillRect(0, 0, 1024, 576);
    x.fillStyle = '#FFC3E6';
    x.font = `800 64px ${FONT}`;
    x.fillText('ALEX', 60, 150);
    x.fillStyle = '#F1EDFA';
    x.font = `700 40px ${FONT}`;
    x.fillText('Brand & marketing', 60, 215);
    x.font = `600 26px ${FONT}`;
    x.fillText('Portfolio 2026 · ICN Business School', 60, 520);
    x.strokeStyle = 'rgba(241,237,250,.5)';
    x.lineWidth = 3;
    x.strokeRect(560, 90, 380, 380);
    x.beginPath();
    x.arc(750, 280, 110, 0, Math.PI * 2);
    x.stroke();
    tex.needsUpdate = true;
  });
  const frameM = metal(0x0a0e33);
  box(3.3, 1.9, 0.12, frameM, 0, 0.3, -0.2, g);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.74), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scr.position.set(0, 0.3, -0.27); // devant la face du cadre tournée vers la caméra
  scr.rotation.y = Math.PI;
  g.add(scr);
  box(0.18, 0.7, 0.18, frameM, 0, -0.5, -0.2, g);
  box(1.1, 0.05, 0.5, frameM, 0, -0.84, -0.2, g);
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.28, 0.09, 120, 16, 2, 3), chrome(0xffc3e6));
  knot.position.set(1.5, -0.45, -0.45);
  g.add(knot);
  return {
    update(t, p) {
      knot.rotation.y = t * 0.001;
      knot.rotation.x = t * 0.0006;
      g0.rotation.y += (p.x * 0.15 - g0.rotation.y) * 0.05;
    },
  };
};

const duo: Builder = (g) => {
  const rose = glossy(0xe5b8c0, 0.12, { transparent: true, opacity: 0.93 });
  const slate = glossy(0x7f93ae, 0.12, { transparent: true, opacity: 0.93 });
  const cap = chrome(0x2b2b33);
  const red = glossy(0xb5403a, 0.3);
  const b1 = new THREE.Group();
  const b2 = new THREE.Group();
  b1.add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 2.6, 48), rose));
  const n1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.6, 24), rose);
  n1.position.y = 1.6;
  b1.add(n1);
  const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 24), cap);
  c1.position.y = 2.15;
  b1.add(c1);
  b2.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.6, 1), slate));
  const n2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.6, 24), slate);
  n2.position.y = 1.6;
  b2.add(n2);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), cap);
  c2.position.y = 2.15;
  b2.add(c2);
  box(0.12, 2.6, 0.1, red, 0.75, 0, 0.52, b2);
  b1.position.set(-0.7, 0, 0);
  b1.rotation.z = 0.12;
  b2.position.set(0.8, 0, 0.2);
  b2.rotation.z = -0.12;
  g.add(b1, b2);
  return {
    update(t, p) {
      b1.position.x = -0.7 - Math.sin(t * 0.0012) * 0.08;
      b2.position.x = 0.8 + Math.sin(t * 0.0012) * 0.08;
      pivot(g, t, p);
    },
  };
};

const dream: Builder = (g) => {
  const rings: THREE.Mesh[] = [];
  for (const [r, c] of [[1, 0x0a0e33], [1.8, 0x2230f5], [2.6, 0xffc3e6]]) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 24, 96), glossy(c, 0.2));
    g.add(m);
    rings.push(m);
  }
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 40, 28), glossy(0xffc3e6, 0.15)));
  const a = new V(0.3, 0.3, 0.9);
  const b = new V(1.9, 1.9, 0.9);
  g.add(bar(a, b, 0.1, chrome(0x2230f5)));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.65, 24), chrome(0x2230f5));
  cone.position.copy(b);
  cone.quaternion.setFromUnitVectors(new V(0, 1, 0), new V(1, 1, 0).normalize());
  g.add(cone);
  return {
    update(t, p) {
      rings.forEach((r, i) => r.scale.setScalar(1 + 0.06 * Math.sin(t * 0.002 + i * 1.1)));
      pivot(g, t, p);
    },
  };
};

const closet: Builder = (g0) => {
  const g = new THREE.Group();
  g.scale.setScalar(0.85);
  g.position.y = 0.2;
  g0.add(g);
  const m = chrome(0x2230f5);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 16, 40, Math.PI * 1.5), m);
  hook.position.set(0, 2.3, 0);
  hook.rotation.z = Math.PI * 0.1;
  g.add(hook);
  g.add(bar(new V(0, 1.9, 0), new V(0, 1.2, 0), 0.08, m));
  g.add(bar(new V(0, 1.2, 0), new V(-2.3, -0.2, 0), 0.08, m));
  g.add(bar(new V(0, 1.2, 0), new V(2.3, -0.2, 0), 0.08, m));
  g.add(bar(new V(-2.3, -0.2, 0), new V(2.3, -0.2, 0), 0.08, m));
  const pink = glossy(0xffc3e6, 0.35);
  const part = (w: number, h: number, x: number, y: number, rz = 0) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.35), pink);
    b.position.set(x, y, 0);
    b.rotation.z = rz;
    g.add(b);
  };
  part(1.7, 1.7, 0, -1.15);
  part(0.8, 0.5, -1.1, -0.55, 0.5);
  part(0.8, 0.5, 1.1, -0.55, -0.5);
  return {
    update(t, p) {
      g.rotation.z = Math.sin(t * 0.0015) * 0.06;
      pivot(g, t, p);
    },
  };
};

const bento: Builder = (g0) => {
  const g = new THREE.Group();
  g.scale.setScalar(0.95);
  g0.add(g);
  box(3.6, 0.5, 2.5, glossy(0x1c1f45, 0.2), 0, -0.35, 0, g);
  const div = glossy(0xf1edfa, 0.3);
  box(0.08, 0.5, 2.5, div, 0.1, -0.1, 0, g);
  box(1.7, 0.5, 0.08, div, -0.85, -0.1, 0, g);
  const white = glossy(0xffffff, 0.3);
  for (const z of [-0.62, 0.62]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.45, 32), white);
    r.position.set(-0.95, 0.1, z);
    g.add(r);
  }
  const plum = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), glossy(0xb5403a, 0.2));
  plum.position.set(-0.95, 0.4, -0.62);
  g.add(plum);
  box(1.2, 0.4, 0.8, glossy(0xffd46b, 0.3), 0.95, 0.05, -0.62, g);
  box(1.2, 0.4, 0.8, glossy(0xff8a5c, 0.3), 0.95, 0.05, 0.55, g);
  const green = glossy(0x3daa6b, 0.4);
  for (let i = 0; i < 3; i++) {
    const br = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), green);
    br.position.set(0.5 + i * 0.32, 0.35, 0.55 + (i % 2) * 0.1);
    g.add(br);
  }
  const lid = box(
    3.6, 0.12, 2.5,
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.1, clearcoat: 1 }),
    0, 1.5, 0, g,
  );
  return {
    update(t, p) {
      lid.position.y = 1.5 + Math.sin(t * 0.0018) * 0.12;
      lid.rotation.y = Math.sin(t * 0.001) * 0.15;
      pivot(g, t, p);
    },
  };
};

const mazic: Builder = (g) => {
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 16, 64, Math.PI), chrome(0xf1edfa));
  band.position.y = 0.4;
  g.add(band);
  const cupM = glossy(0x2230f5, 0.2);
  const padM = glossy(0xffc3e6, 0.5);
  for (const x of [-1.5, 1.5]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.5, 40), cupM);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(x, 0.4, 0);
    g.add(cup);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.14, 12, 40), padM);
    pad.rotation.y = Math.PI / 2;
    pad.position.set(x > 0 ? x - 0.3 : x + 0.3, 0.4, 0);
    g.add(pad);
  }
  const bars: THREE.Mesh[] = [];
  const m1 = glossy(0xffc3e6, 0.2);
  const m2 = glossy(0xf1edfa, 0.2);
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), i % 2 ? m1 : m2);
    b.position.set(-1.6 + i * 0.4, -1.4, 0);
    g.add(b);
    bars.push(b);
  }
  return {
    update(t, p) {
      bars.forEach((b, i) => {
        const h = 0.4 + Math.abs(Math.sin(t * 0.004 + i * 0.7)) * 1.4;
        b.scale.y = h;
        b.position.y = -1.9 + h / 2;
      });
      pivot(g, t, p);
    },
  };
};

const heart: Builder = (g) => {
  const sh = new THREE.Shape();
  sh.moveTo(0, -1.3);
  sh.bezierCurveTo(-2.6, 0.4, -1.4, 2, 0, 0.9);
  sh.bezierCurveTo(1.4, 2, 2.6, 0.4, 0, -1.3);
  const hg = new THREE.ExtrudeGeometry(sh, {
    depth: 0.5, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 6, curveSegments: 32,
  });
  const h = new THREE.Mesh(hg, glossy(0xffc3e6, 0.15));
  h.position.set(0, -0.1, -0.25);
  h.scale.setScalar(0.8);
  g.add(h);
  const ring = new THREE.Group();
  g.add(ring);
  const cols = [0x2230f5, 0xffe3a3, 0xd8f3e6, 0xe4d2ff, 0xff8a5c, 0xc9d4ff, 0x3daa6b, 0xf1edfa];
  const sg = new THREE.SphereGeometry(0.28, 24, 18);
  cols.forEach((c, i) => {
    const a = (i / 8) * Math.PI * 2;
    const m = new THREE.Mesh(sg, glossy(c, 0.2));
    m.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6 * 0.8, 0);
    ring.add(m);
  });
  return {
    update(t, p) {
      ring.rotation.z = t * 0.0005;
      h.scale.setScalar(0.8 * (1 + 0.05 * Math.sin(t * 0.004)));
      pivot(g, t, p);
    },
  };
};

const plane: Builder = (g) => {
  const body = glossy(0xffffff, 0.15);
  const gold = glossy(0xd6b36a, 0.2);
  const navy = glossy(0x14204a, 0.2);
  const f = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 40), body);
  f.rotation.z = Math.PI / 2;
  g.add(f);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), body);
  nose.position.x = 2;
  nose.scale.set(1.5, 1, 1);
  g.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 32), body);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -2.7;
  g.add(tail);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.18, 40), gold);
  stripe.rotation.z = Math.PI / 2;
  stripe.position.x = 0.6;
  g.add(stripe);
  for (const s of [1, -1]) {
    const w = box(1.3, 0.08, 2.3, body, 0.3, -0.1, s * 1.35, g);
    w.rotation.y = -s * 0.45;
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 20), navy);
    e.rotation.z = Math.PI / 2;
    e.position.set(0.9, -0.38, s * 1.3);
    g.add(e);
    const st = box(0.7, 0.06, 1, body, -2.4, 0, s * 0.6, g);
    st.rotation.y = -s * 0.35;
  }
  const fin = box(1, 0.9, 0.08, gold, -2.3, 0.65, 0, g);
  fin.rotation.z = -0.5;
  return {
    update(t, p) {
      g.rotation.y = Math.sin(t * 0.0006) * 0.6 + p.x * 0.5 - 0.4;
      g.rotation.z = Math.sin(t * 0.0012) * 0.08 + 0.1;
      g.position.y = Math.sin(t * 0.0015) * 0.15;
    },
  };
};

const bag: Builder = (g) => {
  box(2.2, 2.5, 1.2, glossy(0xffc3e6, 0.25), 0, -0.2, 0, g);
  const h1 = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.07, 12, 32, Math.PI), chrome(0xf1edfa));
  h1.position.set(0, 1.05, 0.2);
  g.add(h1);
  const h2 = h1.clone();
  h2.position.z = -0.2;
  g.add(h2);
  box(2.24, 0.14, 1.24, glossy(0x2230f5, 0.25), 0, 0.55, 0, g);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), chrome(0xf1edfa));
  star.position.set(0, -0.3, 0.65);
  g.add(star);
  return {
    update(t, p) {
      star.rotation.y = t * 0.002;
      g.position.y = Math.sin(t * 0.0014) * 0.1;
      pivot(g, t, p);
    },
  };
};

const blocks: Builder = (g) => {
  const stud = new THREE.CylinderGeometry(0.2, 0.2, 0.18, 20);
  const brick = (w: number, d: number, col: number, x: number, y: number, z: number, sx: number, sz: number) => {
    const m = glossy(col, 0.25);
    box(w, 0.8, d, m, x, y, z, g);
    for (let i = 0; i < sx; i++)
      for (let j = 0; j < sz; j++) {
        const s = new THREE.Mesh(stud, m);
        s.position.set(x - w / 2 + 0.35 + i * 0.7, y + 0.49, z - d / 2 + 0.35 + j * 0.7);
        g.add(s);
      }
  };
  brick(2.8, 1.4, 0x2230f5, 0, -0.8, 0, 4, 2);
  brick(2.1, 1.4, 0xffc3e6, 0.35, 0, 0, 3, 2);
  brick(1.4, 1.4, 0xffe3a3, -0.3, 0.8, 0, 2, 2);
  return {
    update(t, p) {
      g.rotation.y += (Math.sin(t * 0.0008) * 0.6 + p.x * 0.5 - g.rotation.y) * 0.06;
      g.rotation.x += (-p.y * 0.25 - g.rotation.x) * 0.06;
    },
  };
};

const globe: Builder = (g) => {
  g.add(new THREE.Mesh(new THREE.SphereGeometry(2, 48, 32), glossy(0x2230f5, 0.3)));
  g.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(2.05, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xffc3e6, wireframe: true, transparent: true, opacity: 0.45 }),
    ),
  );
  const ll = (lat: number, lon: number, r: number) => {
    const ph = ((90 - lat) * Math.PI) / 180;
    const th = ((lon + 180) * Math.PI) / 180;
    return new V(-r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
  };
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), glossy(0xffc3e6, 0.1));
  pin.position.copy(ll(-16.5, 145.5, 2.12)); // Port Douglas
  g.add(pin);
  const dotM = glossy(0xf1edfa, 0.1);
  for (const [la, lo] of [[52.5, 13.4], [48.7, 6.2]]) { // Berlin, Nancy
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), dotM);
    m.position.copy(ll(la, lo, 2.1));
    g.add(m);
  }
  const orb = new THREE.Mesh(new THREE.TorusGeometry(3, 0.02, 12, 120), chrome(0xf1edfa));
  orb.rotation.x = 1.2;
  g.add(orb);
  return {
    update(t, p) {
      g.rotation.y = t * 0.00025 + p.x * 0.5 - 1.2;
      g.rotation.x = -p.y * 0.25 + 0.2;
      pin.scale.setScalar(1 + 0.35 * Math.sin(t * 0.004));
    },
  };
};

const contact: Builder = (g) => {
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, 0.42, 200, 32, 3, 2), glossy(0xffc3e6, 0.15));
  g.add(knot);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.12, 24, 96), chrome(0xf1edfa));
  g.add(ring);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 28), glossy(0x2230f5, 0.15));
  g.add(ball);
  return {
    update(t, p) {
      knot.rotation.y = t * 0.0006;
      knot.rotation.x = t * 0.0004 + p.y * 0.4;
      ring.rotation.x = 1.2 + p.y * 0.3;
      ring.rotation.y = t * 0.0005 + p.x * 0.5;
      ball.position.set(Math.sin(t * 0.0012) * 2.1, Math.cos(t * 0.0012) * 0.9, Math.cos(t * 0.0012) * 1.4);
    },
  };
};

export const EXHIBITS: Record<ExhibitKind, Builder> = {
  office, duo, dream, closet, bento, mazic, heart, plane, bag, blocks, globe, contact,
};
