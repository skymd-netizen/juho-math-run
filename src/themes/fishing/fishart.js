// 물고기 그림: 같은 종류 정보(data.js)로 SVG(도감·카드·전설 연출)와 3D 모델(게임 화면)을 만든다.
// 모든 물고기는 직접 그린 가상의 캐릭터이며, 오른쪽을 보고 있다.

const f1 = (n) => Math.round(n * 10) / 10;

const BODY_SHAPE = {
  round: { a: 16, m1: 1.35, b: 56, m2: 1.2 },
  slim: { a: 26, m1: 1.0, b: 48, m2: 1.05 },
  torpedo: { a: 30, m1: 1.2, b: 60, m2: 1.25 },
  cat: { a: 18, m1: 0.9, b: 34, m2: 1.4 },
  marlin: { a: 26, m1: 1.0, b: 44, m2: 1.1 },
  deep: { a: 12, m1: 1.5, b: 40, m2: 1.5 },
};

/** SVG 문자열 (viewBox 200×100). 도감에서 못 잡은 물고기는 CSS로 실루엣 처리한다. */
export function fishSvg(sp) {
  const cy = 50, x0 = 34, x1 = sp.shape === 'marlin' ? 150 : 176;
  const hh = Math.min(38, sp.h * 90);
  const sn = Math.max(4, hh * 0.28);
  const k = BODY_SHAPE[sp.shape];
  const ol = '#23304a';
  const body = `M${x0},${cy} C${x0 + k.a},${f1(cy - hh * k.m1)} ${x1 - k.b},${f1(cy - hh * k.m2)} ${x1},${f1(cy - sn)} Q${x1 + 5},${cy} ${x1},${f1(cy + sn)} C${x1 - k.b},${f1(cy + hh * k.m2)} ${x0 + k.a},${f1(cy + hh * k.m1)} ${x0},${cy} Z`;
  const id = `fa-${sp.id}`;
  const top = f1(cy - hh * 0.85), bot = f1(cy + hh * 0.85);
  const fork = sp.shape === 'slim' || sp.shape === 'torpedo' || sp.shape === 'marlin';
  const ts = f1(hh * 1.25 + 8);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" role="img" aria-label="${sp.name}">`;
  s += `<defs><clipPath id="cp-${id}"><path d="${body}"/></clipPath>`;
  if (sp.glow) s += `<filter id="gl-${id}" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter>`;
  s += `</defs>`;
  if (sp.glow) s += `<path d="${body}" fill="none" stroke="${sp.rarity === 'legend' && sp.id === 'deep' ? '#7affd9' : '#fff3a0'}" stroke-width="9" opacity=".75" filter="url(#gl-${id})"/>`;

  // 꼬리
  s += fork
    ? `<path d="M${x0 + 8},${cy} L${x0 - 28},${f1(cy - ts)} Q${x0 - 14},${cy} ${x0 - 28},${f1(cy + ts)} Z" fill="${sp.fin}" stroke="${ol}" stroke-width="2.4" stroke-linejoin="round"/>`
    : `<path d="M${x0 + 8},${cy} L${x0 - 24},${f1(cy - ts * 0.9)} Q${x0 - 32},${cy} ${x0 - 24},${f1(cy + ts * 0.9)} Z" fill="${sp.fin}" stroke="${ol}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // 등지느러미 / 배지느러미
  const df = sp.shape === 'marlin' ? hh * 1.5 : sp.shape === 'torpedo' ? hh * 0.55 : sp.shape === 'deep' ? hh * 0.8 : hh * 0.6;
  const d0 = x0 + (sp.shape === 'round' || sp.shape === 'cat' ? 26 : 44), d1 = x0 + (sp.shape === 'round' || sp.shape === 'cat' ? 100 : 86);
  s += `<path d="M${d0},${top} Q${f1((d0 + d1) / 2 - 8)},${f1(top - df)} ${d1},${top} Z" fill="${sp.fin}" stroke="${ol}" stroke-width="2.2" stroke-linejoin="round"/>`;
  s += `<path d="M${x0 + 50},${bot} Q${x0 + 64},${f1(bot + hh * 0.5)} ${x0 + 78},${bot} Z" fill="${sp.fin}" stroke="${ol}" stroke-width="2" stroke-linejoin="round"/>`;
  // 몸통 + 배
  s += `<path d="${body}" fill="${sp.body}" stroke="${ol}" stroke-width="2.8" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#cp-${id})">`;
  s += `<ellipse cx="${(x0 + x1) / 2 + 4}" cy="${f1(cy + hh * 0.95)}" rx="${f1((x1 - x0) * 0.62)}" ry="${f1(hh * 0.95)}" fill="${sp.belly}"/>`;
  // 무늬
  const p = sp.pattern;
  if (p === 'lateral') s += `<path d="M${x0 + 12},${cy + 1} Q${(x0 + x1) / 2},${f1(cy - hh * 0.12)} ${x1 - 26},${f1(cy - 1)}" fill="none" stroke="${sp.accent}" stroke-width="${f1(Math.max(3, hh * 0.2))}" stroke-linecap="round" opacity=".8"/>`;
  if (p === 'scales') {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
      const x = x0 + 20 + c * 15 + (r % 2) * 7, y = cy - hh * 0.55 + r * hh * 0.5;
      s += `<path d="M${f1(x)},${f1(y)} q5,6 10,0" fill="none" stroke="${sp.accent}" stroke-width="1.8" stroke-linecap="round" opacity=".4"/>`;
    }
  }
  if (p === 'spots') for (let i = 0; i < 12; i++) s += `<circle cx="${f1(x0 + 24 + ((i * 37) % 100) * 1.1)}" cy="${f1(cy - hh * 0.6 + ((i * 53) % 10) * hh * 0.1)}" r="${f1(2 + (i % 3) * 0.8)}" fill="${sp.accent}" opacity=".75"/>`;
  if (p === 'mottle') for (let i = 0; i < 7; i++) s += `<ellipse cx="${f1(x0 + 22 + i * 17)}" cy="${f1(cy - hh * 0.3 + (i % 2) * hh * 0.5)}" rx="9" ry="${f1(hh * 0.28)}" fill="${sp.accent}" opacity=".35"/>`;
  if (p === 'stripes') for (let i = 0; i < 6; i++) s += `<path d="M${x0 + 24 + i * 15},${f1(cy - hh)} l-5,${f1(hh * 1.1)}" stroke="${sp.accent}" stroke-width="3" opacity=".6"/>`;
  if (p === 'glowdots') for (let i = 0; i < 9; i++) s += `<circle cx="${f1(x0 + 20 + i * 14)}" cy="${f1(cy + hh * 0.35 + (i % 2) * 5)}" r="2.6" fill="${sp.accent}"/>`;
  s += `</g>`;
  // 가슴지느러미, 아가미
  s += `<path d="M${x1 - 52},${f1(cy + hh * 0.35)} q-12,${f1(hh * 0.9)} 6,${f1(hh * 0.75)} q8,-${f1(hh * 0.3)} 2,-${f1(hh * 0.6)} Z" fill="${sp.fin}" stroke="${ol}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<path d="M${x1 - 40},${f1(cy - hh * 0.62)} Q${x1 - 47},${cy} ${x1 - 40},${f1(cy + hh * 0.62)}" fill="none" stroke="${ol}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
  // 수염 · 부리 · 심해어의 등불과 이빨
  if (sp.whisker) {
    const n = sp.shape === 'cat' ? 3 : 1;
    for (let i = 0; i < n; i++) for (const dy of [1, -1]) {
      s += `<path d="M${x1 - 2},${f1(cy + sn * 0.5 + i * 2)} q${10 + i * 3},${f1(dy * 7 + 8 + i * 3)} ${18 + i * 5},${f1(dy * 4 + 10 + i * 6)}" fill="none" stroke="${ol}" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  if (sp.shape === 'marlin') s += `<path d="M${x1 - 4},${cy - 3.5} L198,${cy} L${x1 - 4},${cy + 3.5} Z" fill="#3a4a63" stroke="${ol}" stroke-width="2" stroke-linejoin="round"/>`;
  if (sp.shape === 'deep') {
    s += `<path d="M${x1 - 46},${f1(cy - hh * 1.05)} Q${x1 - 30},${f1(cy - hh * 1.9)} ${x1 - 6},${f1(cy - hh * 1.5)}" fill="none" stroke="${ol}" stroke-width="2.6" stroke-linecap="round"/>`;
    s += `<circle cx="${x1 - 6}" cy="${f1(cy - hh * 1.5 + 2)}" r="7" fill="${sp.accent}" stroke="#fff" stroke-width="2"/><circle cx="${x1 - 6}" cy="${f1(cy - hh * 1.5 + 2)}" r="12" fill="${sp.accent}" opacity=".3"/>`;
    s += `<path d="M${x1 - 30},${f1(cy + sn)} Q${x1 - 8},${f1(cy + sn + 8)} ${x1 + 2},${f1(cy + sn - 2)}" fill="none" stroke="${ol}" stroke-width="2.4" stroke-linecap="round"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M${x1 - 26 + i * 6},${f1(cy + sn + 3 - i * 0.2)} l2.2,-6 l2.2,6 Z" fill="#fff" stroke="${ol}" stroke-width="1"/>`;
  } else {
    s += `<path d="M${x1 - 5},${f1(cy + sn * 0.45)} q4,3.4 8,0" fill="none" stroke="${ol}" stroke-width="2" stroke-linecap="round"/>`;
  }
  // 눈
  const er = f1(Math.max(4.2, hh * 0.22)), ex = x1 - (sp.shape === 'marlin' ? 20 : 26), ey = f1(cy - hh * 0.2);
  s += `<circle cx="${ex}" cy="${ey}" r="${er}" fill="#fff" stroke="${ol}" stroke-width="1.8"/><circle cx="${f1(ex + 1)}" cy="${f1(+ey + 0.5)}" r="${f1(er * 0.55)}" fill="#14182b"/><circle cx="${f1(ex + 2)}" cy="${f1(ey - 1.2)}" r="${f1(er * 0.2)}" fill="#fff"/>`;
  if (sp.id === 'golden') s += `<g fill="#fff6c2"><path d="M40,16 l3,7 7,3 -7,3 -3,7 -3,-7 -7,-3 7,-3z"/><path d="M168,12 l2,5 5,2 -5,2 -2,5 -2,-5 -5,-2 5,-2z"/><path d="M178,78 l2,5 5,2 -5,2 -2,5 -2,-5 -5,-2 5,-2z"/></g>`;
  return s + '</svg>';
}

/** 못 잡은 물고기 실루엣 (도감용 HTML) */
export const fishHtml = (sp, silhouette = false) => `<span class="fish-img${silhouette ? ' sil' : ''}">${fishSvg(sp)}</span>`;

// ---------------------------------------------------------------- 3D 모델

/**
 * 게임 화면용 3D 물고기. 길이 1(코가 +x 쪽 0.5, 꼬리가 -0.5)로 만든 뒤 scale로 실제 크기를 준다.
 * mouth: 낚싯줄이 걸리는 입 위치.
 */
export function makeFishMesh(THREE, sp) {
  const g = new THREE.Group();
  const hh = sp.h * 0.55;
  const c = (hex) => new THREE.Color(hex);
  const cBody = c(sp.body), cBelly = c(sp.belly);

  const geo = new THREE.SphereGeometry(1, 24, 16);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.smoothstep(-pos.getY(i), -0.05, 0.55);
    const m = cBody.clone().lerp(cBelly, t);
    col.set([m.r, m.g, m.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshToonMaterial({ vertexColors: true });
  if (sp.glow) { mat.emissive = c(sp.id === 'deep' ? 0x1d2a66 : 0x6a4300); }
  const body = new THREE.Mesh(geo, mat);
  body.scale.set(0.5, hh, hh * 0.78);
  g.add(body);

  const finMat = new THREE.MeshToonMaterial({ color: sp.fin, side: THREE.DoubleSide });
  const tri = (pts) => { const s = new THREE.Shape(); s.moveTo(...pts[0]); for (const p of pts.slice(1)) s.lineTo(...p); s.closePath(); return new THREE.ShapeGeometry(s); };
  const fork = sp.shape === 'slim' || sp.shape === 'torpedo' || sp.shape === 'marlin';
  const tailH = hh * 1.5 + 0.06;
  const tail = new THREE.Mesh(tri(fork
    ? [[0.04, 0], [-0.24, tailH], [-0.15, 0], [-0.24, -tailH]]
    : [[0.04, 0], [-0.2, tailH * 0.85], [-0.26, 0], [-0.2, -tailH * 0.85]]), finMat);
  tail.position.x = -0.48;
  g.add(tail);
  const dh = sp.shape === 'marlin' ? hh * 1.7 : hh * 0.7;
  const dorsal = new THREE.Mesh(tri([[-0.16, hh * 0.8], [-0.02, hh * 0.8 + dh], [0.16, hh * 0.8]]), finMat);
  g.add(dorsal);
  const pect = new THREE.Mesh(tri([[0, 0], [-0.14, -hh * 0.9], [0.04, -hh * 0.2]]), finMat);
  pect.position.set(0.18, -hh * 0.2, hh * 0.62);
  g.add(pect);
  const pect2 = pect.clone(); pect2.position.z = -hh * 0.62; g.add(pect2);

  // 눈
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff }), dark = new THREE.MeshBasicMaterial({ color: 0x14182b });
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(hh * 0.3, 10, 8), white);
    eye.position.set(0.34, hh * 0.3, sz * hh * 0.62);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(hh * 0.16, 8, 6), dark);
    pupil.position.set(hh * 0.12, 0, sz * hh * 0.12);
    eye.add(pupil); g.add(eye);
  }
  if (sp.shape === 'marlin') {
    const bill = new THREE.Mesh(new THREE.ConeGeometry(hh * 0.12, 0.42, 8), new THREE.MeshToonMaterial({ color: 0x3a4a63 }));
    bill.rotation.z = -Math.PI / 2; bill.position.x = 0.5 + 0.18;
    g.add(bill);
  }
  if (sp.whisker) {
    const wm = new THREE.MeshToonMaterial({ color: 0x23304a });
    for (const sz of [-1, 1]) for (let i = 0; i < (sp.shape === 'cat' ? 2 : 1); i++) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.005, 0.2, 5), wm);
      w.rotation.z = -Math.PI / 2 + 0.5 + i * 0.35; w.rotation.x = sz * 0.5;
      w.position.set(0.5, -hh * 0.15 - i * 0.02, sz * hh * 0.3);
      g.add(w);
    }
  }
  if (sp.shape === 'deep') {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 5), new THREE.MeshToonMaterial({ color: 0x23304a }));
    stalk.position.set(0.3, hh + 0.12, 0); stalk.rotation.z = -0.9;
    g.add(stalk);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: sp.accent }));
    bulb.position.set(0.42, hh + 0.24, 0);
    g.add(bulb);
  }
  const mouth = new THREE.Object3D(); mouth.position.set(sp.shape === 'marlin' ? 0.86 : 0.5, -hh * 0.1, 0);
  g.add(mouth);
  g.userData.mouth = mouth;
  g.userData.body = body;
  return g;
}
