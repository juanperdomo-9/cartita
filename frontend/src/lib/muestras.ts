// Ilustraciones de muestra (solo para el ejemplo y para los lugares sin foto) y el ramo final.
// Portado tal cual del prototipo (MUESTRAS, florSVG, armarRamo).

export type Muestra = 'mar' | 'luces' | 'sierras' | 'ventana' | 'flores' | 'noche'

export function azar(semilla: number) { let s = semilla; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const GRANO = '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>';
const VINETA = '<radialGradient id="v" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#2a0f1e" stop-opacity="0"/><stop offset="1" stop-color="#2a0f1e" stop-opacity=".45"/></radialGradient>';
const CIERRE = '<rect width="400" height="500" fill="url(#v)"/><rect width="400" height="500" filter="url(#g)" opacity=".13"/>';
function florSVG(x: number, y: number, r: number, n: number, c1: string, c2: string, c3: string, rot: number, extra?: string) {
  let s = `<g ${extra || ""}><g transform="translate(${x} ${y}) rotate(${rot})">`;
  for (let i = 0; i < n; i++) s += `<ellipse cy="${(-r * .52).toFixed(1)}" rx="${(r * .4).toFixed(1)}" ry="${(r * .56).toFixed(1)}" fill="${c1}" stroke="#00000012" transform="rotate(${(i * 360 / n).toFixed(1)})"/>`;
  for (let i = 0; i < n; i++) s += `<ellipse cy="${(-r * .3).toFixed(1)}" rx="${(r * .26).toFixed(1)}" ry="${(r * .36).toFixed(1)}" fill="${c2}" transform="rotate(${(i * 360 / n + 180 / n).toFixed(1)})"/>`;
  s += `<circle r="${(r * .2).toFixed(1)}" fill="${c3}"/>`;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += `<circle cx="${(Math.cos(a) * r * .12).toFixed(1)}" cy="${(Math.sin(a) * r * .12).toFixed(1)}" r="${(r * .035).toFixed(1)}" fill="#fff" opacity=".75"/>`; }
  return s + "</g></g>";
}
const MUESTRAS: Record<Muestra, () => string> = {
  mar() {
    const R = azar(7); let ref = "";
    for (let y = 292; y < 384; y += 7) { const w = 10 + R() * 70 * (1 - (y - 292) / 140); ref += `<rect x="${(270 - w / 2 + (R() - .5) * 16).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="2.2" rx="1.1"/>`; }
    return `<defs><linearGradient id="c" x2="0" y2="1"><stop offset="0" stop-color="#e3a0b8"/><stop offset=".48" stop-color="#f5bfa6"/><stop offset=".58" stop-color="#ffdcae"/></linearGradient><radialGradient id="s" cx="270" cy="258" r="160" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff4d9"/><stop offset=".22" stop-color="#ffe0a3" stop-opacity=".85"/><stop offset="1" stop-color="#ffd09a" stop-opacity="0"/></radialGradient><linearGradient id="m" x2="0" y2="1"><stop offset="0" stop-color="#86aecb"/><stop offset="1" stop-color="#3b6c95"/></linearGradient><linearGradient id="a" x2="0" y2="1"><stop offset="0" stop-color="#efd4ae"/><stop offset="1" stop-color="#d7b086"/></linearGradient>${VINETA}${GRANO}</defs>
    <rect width="400" height="500" fill="url(#c)"/><rect width="400" height="500" fill="url(#s)"/><circle cx="270" cy="258" r="30" fill="#fff6e2"/>
    <rect y="286" width="400" height="110" fill="url(#m)"/><g fill="#fff1d2" opacity=".8">${ref}</g>
    <path d="M0 394Q100 380 200 388T400 382V500H0Z" fill="url(#a)"/><path d="M0 394Q100 380 200 388T400 382" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3"/>
    <g transform="translate(92 382)"><path d="M0 0V-64" stroke="#5b3a3a" stroke-width="3"/><path d="M-44 -58Q0 -96 44 -58Z" fill="#ee6b93"/><path d="M-15 -58Q0 -96 15 -58Z" fill="#fbe9dc"/></g>${CIERRE}`;
  },
  luces() {
    const R = azar(11), cols = ["#ffcf7a", "#ff9fb8", "#fff1d6", "#f08a5d", "#ffb36b"]; let b = "", p = "";
    for (let i = 0; i < 26; i++) b += `<circle cx="${(R() * 400).toFixed(0)}" cy="${(R() * 500).toFixed(0)}" r="${(14 + R() * 46).toFixed(0)}" fill="${cols[i % 5]}" opacity="${(.18 + R() * .45).toFixed(2)}"/>`;
    for (let i = 0; i < 14; i++) p += `<circle cx="${(R() * 400).toFixed(0)}" cy="${(R() * 500).toFixed(0)}" r="${(2 + R() * 3).toFixed(1)}" fill="#fff4dc" opacity=".85"/>`;
    return `<defs><radialGradient id="c" cx=".5" cy=".6" r=".8"><stop offset="0" stop-color="#5a2433"/><stop offset="1" stop-color="#170a12"/></radialGradient><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>${VINETA}${GRANO}</defs>
    <rect width="400" height="500" fill="url(#c)"/><g filter="url(#b)">${b}</g>${p}
    <g transform="translate(200 470)"><rect x="-80" y="-60" width="160" height="70" rx="10" fill="#f7d7de"/><rect x="-80" y="-60" width="160" height="16" rx="8" fill="#fff3f6"/>${[-50, -17, 17, 50].map((x) => `<rect x="${x - 3}" y="-96" width="6" height="36" rx="3" fill="#fff"/><ellipse cx="${x}" cy="-104" rx="5" ry="9" fill="#ffd27a"/>`).join("")}</g>${CIERRE}`;
  },
  sierras() {
    return `<defs><linearGradient id="c" x2="0" y2="1"><stop offset="0" stop-color="#5f4384"/><stop offset=".5" stop-color="#e48e8b"/><stop offset=".72" stop-color="#fbd2a0"/></linearGradient><radialGradient id="s" cx="200" cy="292" r="140" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff2d0"/><stop offset="1" stop-color="#ffd8a0" stop-opacity="0"/></radialGradient>${VINETA}${GRANO}</defs>
    <rect width="400" height="500" fill="url(#c)"/><rect width="400" height="500" fill="url(#s)"/><circle cx="200" cy="292" r="40" fill="#fff3d6"/>
    <path d="M0 300C60 250 120 280 170 256S280 232 400 274V500H0Z" fill="#c2758c" opacity=".9"/><path d="M0 352C70 312 140 346 210 316S330 302 400 332V500H0Z" fill="#82416c"/><path d="M0 412C90 372 170 402 250 374S360 368 400 388V500H0Z" fill="#3e2047"/>
    <path d="M120 150q8-8 16 0q8-8 16 0M170 128q6-6 12 0q6-6 12 0" fill="none" stroke="#3e2047" stroke-width="2.4" stroke-linecap="round"/>${CIERRE}`;
  },
  ventana() {
    return `<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3c9a2"/><stop offset="1" stop-color="#d98b68"/></linearGradient><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter><filter id="b2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>${VINETA}${GRANO}</defs>
    <rect width="400" height="500" fill="url(#c)"/>
    <g filter="url(#b)" fill="#fff3dd" opacity=".62" transform="translate(70 40) skewX(-16)"><rect x="40" y="40" width="110" height="150" rx="4"/><rect x="164" y="40" width="110" height="150" rx="4"/><rect x="40" y="204" width="110" height="150" rx="4"/><rect x="164" y="204" width="110" height="150" rx="4"/></g>
    <g filter="url(#b2)" fill="#5a2a22" opacity=".2">${([[60, 330, -30], [90, 300, -10], [120, 320, 20], [80, 360, -50], [130, 290, 35], [104, 270, 0]] as number[][]).map((h) => `<ellipse cx="${h[0]}" cy="${h[1]}" rx="12" ry="34" transform="rotate(${h[2]} ${h[0]} ${h[1]})"/>`).join("")}</g>
    <rect y="430" width="400" height="70" fill="#c87454" opacity=".55"/><g transform="translate(286 432)"><path d="M-16 0h32l-4 -44h-24z" fill="#b8573f"/><path d="M0 -44C-24 -70 -30 -98 -8 -116C-4 -90 0 -70 0 -44ZM0 -44C20 -66 34 -88 22 -112C10 -92 2 -70 0 -44Z" fill="#5f8d5c"/></g>${CIERRE}`;
  },
  flores() {
    const R = azar(23); let b = "", f = "";
    for (let i = 0; i < 14; i++) b += `<circle cx="${(R() * 400).toFixed(0)}" cy="${(R() * 500).toFixed(0)}" r="${(20 + R() * 40).toFixed(0)}" fill="${i % 2 ? "#8fb486" : "#fbe3ea"}" opacity="${(.25 + R() * .3).toFixed(2)}"/>`;
    ([[110, 150, 54, "#ee6b93", "#f7a8bf"], [290, 110, 40, "#fff6ee", "#f7e0d0"], [250, 300, 62, "#f7c9d6", "#fbe5ec"], [90, 380, 46, "#f4a76b", "#f9caa0"], [330, 430, 36, "#ee6b93", "#f7a8bf"]] as [number, number, number, string, string][]).forEach((p, i) => { f += florSVG(p[0], p[1], p[2], 7, p[3], p[4], "#e9b764", i * 23); });
    return `<defs><linearGradient id="c" x2="0" y2="1"><stop offset="0" stop-color="#f3d2dc"/><stop offset="1" stop-color="#d995ad"/></linearGradient><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter><filter id="b2"><feGaussianBlur stdDeviation="1.2"/></filter>${VINETA}${GRANO}</defs>
    <rect width="400" height="500" fill="url(#c)"/><g filter="url(#b)">${b}</g><g filter="url(#b2)">${f}</g>${CIERRE}`;
  },
  noche() {
    const R = azar(31); let e = "", v = "";
    for (let i = 0; i < 60; i++) e += `<circle cx="${(R() * 400).toFixed(0)}" cy="${(R() * 300).toFixed(0)}" r="${(.6 + R() * 1.4).toFixed(1)}" fill="#fff" opacity="${(.4 + R() * .6).toFixed(2)}"/>`;
    const edif: number[][] = [[0, 60, 150], [56, 50, 210], [104, 70, 170], [172, 46, 240], [216, 64, 190], [278, 52, 225], [328, 72, 160]];
    edif.forEach((b) => { for (let y = 500 - b[2] + 14; y < 486; y += 18) for (let x = b[0] + 8; x < b[0] + b[1] - 8; x += 14) if (R() > .45) v += `<rect x="${x}" y="${y}" width="6" height="8" fill="#ffd27a" opacity="${(.5 + R() * .5).toFixed(2)}"/>`; });
    return `<defs><linearGradient id="c" x2="0" y2="1"><stop offset="0" stop-color="#140c2c"/><stop offset=".7" stop-color="#3a1f4f"/><stop offset="1" stop-color="#7a3b5e"/></linearGradient>${VINETA}${GRANO}</defs>
    <rect width="400" height="500" fill="url(#c)"/>${e}<circle cx="300" cy="96" r="30" fill="#fff4dc"/><circle cx="314" cy="86" r="28" fill="#1b1033"/>
    <g fill="#1b1030">${edif.map((b) => `<rect x="${b[0]}" y="${500 - b[2]}" width="${b[1]}" height="${b[2]}"/>`).join("")}</g>${v}${CIERRE}`;
  }
};

export function ramoSVG(): string {
  const tallos: number[][] = [[150, 106], [98, 124], [204, 122], [122, 66], [180, 64], [62, 164], [238, 162], [88, 82], [214, 84]];
  let s = '<path class="envoltorio" d="M46 148L254 148 178 326H122Z" fill="#c4976c"/><path class="envoltorio" d="M46 148L254 148 236 190 64 190Z" fill="#b48660" opacity=".6"/>';
  tallos.forEach((t, i) => { s += `<path class="tallo" pathLength="1" style="animation-delay:${(.15 + i * .07).toFixed(2)}s" d="M150 300Q${((150 + t[0]) / 2).toFixed(0)} ${((300 + t[1]) / 2 + 24).toFixed(0)} ${t[0]} ${t[1]}"/>`; });
  ([[70, 140, -55], [232, 138, 55], [110, 150, -25], [192, 150, 28], [150, 140, 0], [56, 110, -70], [246, 108, 70]] as number[][]).forEach((h, i) => {
    s += `<g transform="translate(${h[0]} ${h[1]}) rotate(${h[2]})"><path class="hoja-r" style="animation-delay:${(1 + i * .06).toFixed(2)}s" d="M0 0C11 -14 9 -34 0 -50C-9 -34 -11 -14 0 0Z" fill="${i % 2 ? "#6f9c69" : "#5f8d5c"}"/></g>`;
  });
  ([[70, 104], [232, 100], [150, 34], [42, 140], [258, 138], [110, 30], [192, 30]] as number[][]).forEach((p, i) => {
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + i; s += `<circle class="flor" style="animation-delay:${(1.5 + i * .05).toFixed(2)}s" cx="${(p[0] + Math.cos(a) * 7).toFixed(1)}" cy="${(p[1] + Math.sin(a) * 7).toFixed(1)}" r="${(2.4 + (k % 2)).toFixed(1)}" fill="#fff8f0"/>`; }
  });
  const tulipan = (x: number, y: number, rot: number, c1: string, c2: string, d: number) => `<g class="flor" style="animation-delay:${d}s"><g transform="translate(${x} ${y}) rotate(${rot}) scale(1.15)"><path d="M-14 -2C-16 -22 -8 -30 -6 -30L0 -20 6 -30C8 -30 16 -22 14 -2C12 10 -12 10 -14 -2Z" fill="${c1}"/><path d="M-6 -30L0 -20 6 -30C4 -16 2 6 0 8C-2 6 -4 -16 -6 -30Z" fill="${c2}"/></g></g>`;
  s += tulipan(88, 98, -24, "#ee6b93", "#c43c68", 1.35) + tulipan(214, 100, 24, "#f4a76b", "#e07b4a", 1.45);
  const F: [number, number, number, number, string, string, string, number, number][] = [
    [122, 66, 24, 6, "#c3aef0", "#ddd2f7", "#fff3d6", 10, 1.3], [180, 64, 24, 6, "#fff6ee", "#f6e2d2", "#e9b764", -8, 1.4],
    [98, 124, 31, 7, "#f7c9d6", "#fbe4ec", "#c43c68", 14, 1.2], [204, 122, 31, 7, "#f4a76b", "#f9c99d", "#9a3b5c", -12, 1.3],
    [62, 164, 18, 6, "#fbe4ec", "#fff", "#e9b764", 0, 1.55], [238, 162, 18, 6, "#ee6b93", "#f7a8bf", "#fff3d6", 20, 1.6],
    [150, 106, 38, 8, "#ee6b93", "#f7a8bf", "#e9b764", 0, 1.1]
  ];
  F.forEach((f) => { s += florSVG(f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], `class="flor" style="animation-delay:${f[8]}s"`); });
  s += '<g class="envoltorio"><path d="M60 186Q150 222 240 186L178 328H122Z" fill="#e5c39a"/><path d="M100 200L138 326M200 200L162 326" stroke="#d0a87d" stroke-width="1.4" fill="none"/>';
  s += '<path d="M150 266C126 244 104 254 112 271C119 286 140 277 150 266Z" fill="#ee6b93"/><path d="M150 266C174 244 196 254 188 271C181 286 160 277 150 266Z" fill="#ee6b93"/><path d="M146 268L130 304 139 301 145 310 150 270ZM154 268L170 304 161 301 155 310 150 270Z" fill="#c43c68"/><rect x="142" y="258" width="16" height="16" rx="6" fill="#c43c68"/></g>';
  return s;
}

const cache: Partial<Record<Muestra, string>> = {}

/** Para fondos CSS: `url("data:image/svg+xml,…")`. */
export function imagenMuestra(k: Muestra = 'flores'): string {
  if (!cache[k])
    cache[k] = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">${MUESTRAS[k]()}</svg>`)}")`
  return cache[k]!
}

/** Para <img> o <image>: una ilustración con el tamaño pedido. */
export function fuenteMuestra(k: Muestra = 'flores', w = 400, h = 500): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">${MUESTRAS[k]()}</svg>`)}`
}
