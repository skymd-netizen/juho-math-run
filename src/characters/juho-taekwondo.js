// 태권도 도복을 입은 주호 캐릭터 (3D 카툰).
//
// 구조
//   머리  : 둥근 3D 머리(피부) + 머리카락 + 앞면에 주호 사진을 둥글게 입힌 얼굴
//   상의  : 어깨~허리(윗부분)와 허리 아래로 퍼지는 자락(아랫부분), V자 깃, 여밈선
//   소매  : 어깨-팔꿈치-손목 2마디, 끝으로 갈수록 넓어지는 통소매
//   바지  : 골반-무릎-발목 2마디, 밑단이 넓은 통바지, 맨발
//   띠    : 허리를 감싸는 띠 + 앞 매듭 + 늘어진 두 가닥 (setBelt로 색 변경)
//
// 얼굴 사진을 바꾸려면 assets/juho-face.png만 교체하면 된다.
// 피부색과 머리카락 색은 사진에서 자동으로 뽑아 몸과 맞춘다.
import * as THREE from 'three';
import faceUrl from '../assets/juho-face.png';

const FACE_ASPECT = 321 / 274; // 사진 세로/가로

// 띠 색상 [위쪽 절반, 아래쪽 절반]. 품띠만 빨강/검정 두 색이다.
const BELT_COLORS = {
  white: [0xdfe4ee, 0xdfe4ee],
  yellow: [0xffd400, 0xffd400],
  green: [0x2e9e44, 0x2e9e44],
  blue: [0x1c6fd6, 0x1c6fd6],
  red: [0xe0312f, 0xe0312f],
  poom: [0xe0312f, 0x1c1c1c],
  black: [0x1c1c1c, 0x1c1c1c],
};
// 깃 색 [왼쪽, 오른쪽]: 품띠는 빨강/검정, 검은띠는 검정, 나머지는 흰 깃
const COLLAR_COLORS = { poom: [0xe0312f, 0x1c1c1c], black: [0x1c1c1c, 0x1c1c1c] };
const COLLAR_DEFAULT = [0xeef1f8, 0xeef1f8];

// ---------- 카툰 재질 ----------
// 밝은 면/그늘 면이 또렷하게 나뉘는 2단 음영. 장면의 초록빛 반사에 물들지 않도록
// 캐릭터 전용 셰이더를 쓴다 (빛은 앞-오른쪽-위에서 온다).
const LIGHT = new THREE.Vector3(0.4, 0.74, 0.54).normalize();
const VERT = `varying vec3 vN;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG = `uniform vec3 uBase, uShade, uL;
varying vec3 vN;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  float k = smoothstep(-0.03, 0.05, dot(n, uL));
  gl_FragColor = vec4(mix(uShade, uBase, k), 1.0);
  #include <colorspace_fragment>
}`;

/** shade: 그늘 면의 색을 만들 때 곱하는 값 [r, g, b] */
function cel(hex, { shade = [0.72, 0.72, 0.72], side = THREE.FrontSide } = {}) {
  const m = new THREE.ShaderMaterial({
    side, vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uBase: { value: new THREE.Color() }, uShade: { value: new THREE.Color() }, uL: { value: LIGHT } },
  });
  m.userData = { shade };
  paint(m, new THREE.Color(hex));
  return m;
}
function paint(m, c) {
  const [r, g, b] = m.userData.shade;
  m.uniforms.uBase.value.copy(c);
  m.uniforms.uShade.value.setRGB(c.r * r, c.g * g, c.b * b);
}

const outlineMat = new THREE.MeshBasicMaterial({ color: 0x47506f, side: THREE.BackSide });
/** 모양을 바깥으로 살짝 부풀린 외곽선용 지오메트리 */
function hull(geo, t) {
  const g = geo.clone();
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * t, p.getY(i) + n.getY(i) * t, p.getZ(i) + n.getZ(i) * t);
  return g;
}
/** 외곽선이 붙은 메시 */
function piece(geo, mat, t = 0.02) {
  const m = new THREE.Mesh(geo, mat);
  if (t > 0) m.add(new THREE.Mesh(hull(geo, t), outlineMat));
  return m;
}

// ---------- 도복 상의 단면 ([높이, 반지름]) ----------
const DEPTH = 0.76; // 몸통은 원통이 아니라 앞뒤로 납작한 타원
const JACKET = [[0.40, 0.45], [0.48, 0.425], [0.58, 0.385], [0.70, 0.35], [0.82, 0.345], [0.96, 0.36], [1.08, 0.355], [1.18, 0.325], [1.25, 0.26], [1.31, 0.17], [1.345, 0.12]];
const WAIST = 0.70;
function radiusAt(y) {
  for (let i = 1; i < JACKET.length; i++) {
    const [y0, r0] = JACKET[i - 1], [y1, r1] = JACKET[i];
    if (y <= y1) return r0 + (r1 - r0) * Math.max(0, (y - y0) / (y1 - y0));
  }
  return JACKET[JACKET.length - 1][1];
}
/** 상의 겉면 위의 한 점 (a: 정면에서 옆으로 돌아간 각도) */
const onJacket = (y, a, out = 0.012) => {
  const r = radiusAt(y) + out;
  return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r * DEPTH);
};
const lathe = (pts) => new THREE.LatheGeometry(pts.map(([y, r]) => new THREE.Vector2(r, y)), 28);

export function createTaekwondoJuho() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // 흰 도복: 그늘은 푸르스름한 회색으로
  const COOL = [0.66, 0.73, 0.92];
  const cloth = cel(0xfcfdff, { shade: COOL, side: THREE.DoubleSide });
  const pantsMat = cel(0xf4f6fc, { shade: COOL, side: THREE.DoubleSide });
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x8b95b3 });
  const skin = cel(0xf2c7a5, { shade: [0.9, 0.76, 0.72] });
  const hairMat = cel(0x2a211d, { shade: [0.62, 0.6, 0.7] });
  const beltA = cel(0xdfe4ee, { shade: [0.68, 0.68, 0.74] }), beltB = cel(0xdfe4ee, { shade: [0.68, 0.68, 0.74] });
  const collarA = cel(COLLAR_DEFAULT[0], { shade: COOL }), collarB = cel(COLLAR_DEFAULT[1], { shade: COOL });

  // ---------- 바지 ----------
  const pelvis = piece(new THREE.SphereGeometry(0.3, 18, 12), pantsMat, 0);
  pelvis.scale.set(1.05, 0.62, DEPTH); pelvis.position.y = 0.6;
  body.add(pelvis);

  const thighGeo = new THREE.CylinderGeometry(0.168, 0.16, 0.3, 14, 1, true);
  const shinGeo = new THREE.CylinderGeometry(0.158, 0.2, 0.27, 14, 1, true);   // 밑단이 넓다
  const kneeGeo = new THREE.SphereGeometry(0.16, 12, 10);
  const footGeo = new THREE.SphereGeometry(0.1, 12, 10);
  const makeLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.155, 0.6, 0);
    const thigh = piece(thighGeo, pantsMat); thigh.position.y = -0.11;
    const knee = new THREE.Group(); knee.position.y = -0.25;
    const kneeBall = piece(kneeGeo, pantsMat, 0);
    const shin = piece(shinGeo, pantsMat); shin.position.y = -0.12;
    // 바지 앞주름
    const crease = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.01), seamMat);
    crease.position.set(0, -0.13, 0.182); crease.rotation.x = -0.15;
    const foot = piece(footGeo, skin, 0.014);
    foot.scale.set(0.95, 0.62, 1.5); foot.position.set(0, -0.285, 0.05);
    knee.add(kneeBall, shin, crease, foot);
    hip.add(thigh, knee);
    body.add(hip);
    return { hip, knee };
  };
  const legL = makeLeg(-1), legR = makeLeg(1);

  // ---------- 상의 ----------
  const upper = piece(lathe(JACKET.filter(([y]) => y >= WAIST)), cloth);
  upper.scale.z = DEPTH;
  body.add(upper);

  // 허리 아래로 퍼지는 자락: 달릴 때 살짝 펄럭이도록 허리를 축으로 따로 움직인다
  const skirt = new THREE.Group();
  skirt.position.y = WAIST;
  const skirtMesh = piece(lathe(JACKET.filter(([y]) => y <= WAIST).map(([y, r]) => [y - WAIST, r])), cloth);
  skirtMesh.scale.z = DEPTH;
  skirt.add(skirtMesh);
  // 자락 옆트임
  for (const s of [-1, 1]) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.02), seamMat);
    slit.position.set(s * (radiusAt(0.46) + 0.012), 0.48 - WAIST, 0); slit.rotation.z = s * 0.3;
    skirt.add(slit);
  }
  body.add(skirt);

  // 목과 V자로 파인 가슴
  const neck = piece(new THREE.CylinderGeometry(0.105, 0.115, 0.2, 12), skin, 0);
  neck.position.y = 1.38;
  body.add(neck);
  const V_Y = 0.94, V_TOP = 1.32, V_HALF = 0.15;
  /** 상의 앞면 위의 점 (x: 좌우 위치) */
  const front = (x, y, out) => {
    const r = radiusAt(y) + out;
    return new THREE.Vector3(x, y, DEPTH * Math.sqrt(Math.max(0.0001, r * r - x * x)));
  };
  const vHalf = (y) => V_HALF * Math.min(1, (y - V_Y) / (V_TOP - V_Y));
  // V자로 파인 부분에 보이는 가슴 (상의 겉면을 따라 휘어진 삼각형)
  const chestMat = new THREE.MeshBasicMaterial({ color: 0xf2c7a5, side: THREE.DoubleSide });
  {
    const pos = [], idx = [], ROWS = 8;
    for (let i = 0; i <= ROWS; i++) {
      const y = V_Y + ((V_TOP - V_Y) * i) / ROWS, h = vHalf(y);
      for (const x of [-h, 0, h]) { const p = front(x, y, 0.008); pos.push(p.x, p.y, p.z); }
      if (i > 0) { const a = (i - 1) * 3, b = i * 3; idx.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1); }
    }
    const vGeo = new THREE.BufferGeometry();
    vGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    vGeo.setIndex(idx);
    body.add(new THREE.Mesh(vGeo, chestMat));
  }

  // 깃: 목 뒤에서 내려와 가슴 앞에서 V자로 겹친다 (왼쪽 깃이 오른쪽 깃 위로)
  const collarPath = (s, out) => {
    const pts = [new THREE.Vector3(0, 1.385, -0.13), new THREE.Vector3(s * 0.11, 1.375, -0.07), new THREE.Vector3(s * 0.15, 1.35, 0.04)];
    for (let i = 0; i <= 6; i++) {
      const y = V_TOP - ((V_TOP - V_Y + 0.05) * i) / 6;
      pts.push(front(s * (vHalf(Math.max(y, V_Y)) + 0.012) - (y < V_Y ? s * 0.03 : 0), y, out));
    }
    return new THREE.CatmullRomCurve3(pts);
  };
  const collar = (s, mat, out) => {
    const m = piece(new THREE.TubeGeometry(collarPath(s, out), 28, 0.043, 8), mat, 0.014);
    return m;
  };
  body.add(collar(1, collarB, 0.012), collar(-1, collarA, 0.03));

  // 여밈선: V자 끝에서 허리 옆으로 내려가는 겹침 선
  const closure = [];
  for (let i = 0; i <= 10; i++) { const k = i / 10; closure.push(onJacket(V_Y - 0.04 - (V_Y - 0.04 - 0.44) * k, -0.06 + k * 0.7, 0.006)); }
  // 허리 위는 상의에, 허리 아래는 자락에 붙인다
  const line = (pts, parent, dy = 0) => {
    if (pts.length < 2) return;
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y - dy, p.z))), 12, 0.011, 5), seamMat);
    parent.add(m);
  };
  line(closure.filter((p) => p.y >= WAIST - 0.02), body);
  line(closure.filter((p) => p.y <= WAIST + 0.02), skirt, WAIST);

  // ---------- 소매 ----------
  const sleeveUpGeo = new THREE.CylinderGeometry(0.118, 0.128, 0.27, 12, 1, true);
  const sleeveLowGeo = new THREE.CylinderGeometry(0.128, 0.162, 0.24, 12, 1, true); // 손목 쪽이 넓다
  const jointGeo = new THREE.SphereGeometry(0.128, 12, 10);
  const handGeo = new THREE.SphereGeometry(0.088, 12, 10);
  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.355, 1.16, 0);
    const cap = piece(jointGeo, cloth); cap.scale.setScalar(1.06);
    const up = piece(sleeveUpGeo, cloth); up.position.y = -0.12;
    const elbow = new THREE.Group(); elbow.position.y = -0.25;
    const elbowBall = piece(jointGeo, cloth, 0);
    const low = piece(sleeveLowGeo, cloth); low.position.y = -0.11;
    const hand = piece(handGeo, skin, 0.014); hand.position.y = -0.255;
    elbow.add(elbowBall, low, hand);
    shoulder.add(cap, up, elbow);
    body.add(shoulder);
    return { shoulder, elbow };
  };
  const armL = makeArm(-1), armR = makeArm(1);

  // ---------- 띠 ----------
  const belt = new THREE.Group();
  belt.position.y = WAIST + 0.01;
  const bandR = radiusAt(WAIST) + 0.022;
  const bandGeo = new THREE.CylinderGeometry(bandR, bandR, 0.05, 28, 1, true);
  const bandTop = piece(bandGeo, beltA, 0.012); bandTop.position.y = 0.025; bandTop.scale.z = DEPTH;
  const bandBottom = piece(bandGeo, beltB, 0.012); bandBottom.position.y = -0.025; bandBottom.scale.z = DEPTH;
  belt.add(bandTop, bandBottom);
  const frontZ = bandR * DEPTH;
  // 매듭
  const knot = piece(new THREE.SphereGeometry(0.07, 10, 8), beltA, 0.012);
  knot.scale.set(1.15, 0.85, 0.7); knot.position.set(0, 0, frontZ + 0.035);
  belt.add(knot);
  // 늘어진 두 가닥: 띠를 길게 반으로 나눈 두 줄(품띠는 빨강+검정)
  const stripGeo = new THREE.BoxGeometry(0.046, 0.3, 0.03);
  const makeTail = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.03, -0.01, frontZ + 0.04);
    const a = piece(stripGeo, beltA, 0.01); a.position.set(-0.023, -0.16, 0);
    const b = piece(stripGeo, beltB, 0.01); b.position.set(0.023, -0.16, 0);
    pivot.add(a, b);
    belt.add(pivot);
    return pivot;
  };
  const tailL = makeTail(-1), tailR = makeTail(1);
  body.add(belt);

  // ---------- 머리 ----------
  const R = 0.47;
  const head = new THREE.Group();
  head.position.y = 1.36;
  const skull = new THREE.Group();
  skull.position.y = R * 1.08 - 0.06;
  skull.scale.set(1, 1.08, 0.96);
  head.add(skull);
  body.add(head);

  // 아래로 갈수록 갸름해지는 머리 (사진의 턱선 뒤에 숨는다)
  const scalpGeo = new THREE.SphereGeometry(R * 0.97, 28, 20);
  {
    const p = scalpGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = Math.max(0, -p.getY(i) / R);
      p.setX(i, p.getX(i) * (1 - 0.42 * Math.pow(k, 1.2)));
      p.setZ(i, p.getZ(i) * (1 - 0.16 * k));
    }
    scalpGeo.computeVertexNormals();
  }
  const scalp = piece(scalpGeo, skin, 0.018);
  // 머리카락: 정수리와 뒤통수를 덮는다
  const hair = piece(new THREE.SphereGeometry(R, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat, 0.018);
  hair.rotation.x = -0.3;
  // 옆머리와 뒷머리: 귀 뒤쪽부터 목덜미까지 감싼다
  const hairBack = piece(new THREE.SphereGeometry(R, 28, 16, Math.PI * 0.93, Math.PI * 1.14, 0, Math.PI * 0.7), hairMat, 0.018);
  skull.add(scalp, hair, hairBack);
  // 귀
  for (const sd of [-1, 1]) {
    const ear = piece(new THREE.SphereGeometry(R * 0.13, 10, 8), skin, 0.014);
    ear.scale.set(0.55, 1, 0.8); ear.position.set(sd * R * 0.93, -R * 0.08, R * 0.2);
    skull.add(ear);
  }

  // 얼굴: 사진을 머리 앞면에 둥글게 입힌다 (정면에서 본 모양은 사진 그대로)
  const faceGeo = new THREE.SphereGeometry(R * 1.03, 32, 24, 0.13 * Math.PI, 0.74 * Math.PI);
  {
    const p = faceGeo.attributes.position, uv = faceGeo.attributes.uv;
    const h = 2 * R * 1.03, w = (h * 1.08) / FACE_ASPECT; // skull의 세로 늘림(1.08)을 감안한 가로 폭
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  }
  const faceMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.5, visible: false });
  skull.add(new THREE.Mesh(faceGeo, faceMat));

  // 사진을 불러와 살짝 만화풍으로 보정하고, 피부색·머리색을 뽑아 몸에 맞춘다
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.filter = 'saturate(1.18) contrast(1.06) brightness(1.03)';
    g.drawImage(img, 0, 0);
    g.filter = 'none';
    const sample = (fx, fy, fw, fh) => {
      const d = g.getImageData(Math.floor(fx * c.width), Math.floor(fy * c.height), Math.max(1, Math.floor(fw * c.width)), Math.max(1, Math.floor(fh * c.height))).data;
      let r = 0, gg = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
      return n ? new THREE.Color().setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace) : null;
    };
    const skinC = sample(0.28, 0.6, 0.14, 0.1);  // 볼
    const hairC = sample(0.4, 0.05, 0.2, 0.08);  // 정수리
    if (skinC) { paint(skin, skinC); chestMat.color.copy(skinC).multiplyScalar(0.9); }
    if (hairC) paint(hairMat, hairC);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    faceMat.map = tex; faceMat.visible = true; faceMat.needsUpdate = true;
  };
  img.src = faceUrl;

  // ---------- 검은띠 전용 효과: 발밑 금빛 고리 + 주위를 도는 별 ----------
  const aura = new THREE.Group();
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.66, 0.84, 32), goldMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04;
  aura.add(ring);
  const stars = [];
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.075), starMat);
    aura.add(s); stars.push(s);
  }
  aura.visible = false;
  root.add(aura);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  let beltId = 'white';
  const tmp = new THREE.Color();
  function setBelt(id) {
    if (!BELT_COLORS[id]) return;
    beltId = id;
    const [a, b] = BELT_COLORS[id];
    paint(beltA, tmp.setHex(a)); paint(beltB, tmp.setHex(b));
    const [ca, cb] = COLLAR_COLORS[id] || COLLAR_DEFAULT;
    paint(collarA, tmp.setHex(ca)); paint(collarB, tmp.setHex(cb));
    aura.visible = id === 'black';
  }

  // 팔다리 자세: [어깨/골반 앞뒤, 옆으로 벌림, 팔꿈치/무릎 굽힘]
  const arm = (a, x, z, bend) => { a.shoulder.rotation.set(x, 0, z); a.elbow.rotation.x = bend; };
  const leg = (l, x, z, bend) => { l.hip.rotation.set(x, 0, z); l.knee.rotation.x = bend; };

  let phase = 0, t = 0;
  function update(dt, s) {
    t += dt;
    phase += dt * (9 + (s.speed || 12) * 0.35);
    const sw = Math.sin(phase), cw = Math.cos(phase);
    body.rotation.set(0, 0, 0);
    body.position.y = 0;
    head.rotation.set(0, 0, 0);
    skirt.rotation.set(0, 0, 0);
    skirt.scale.set(1, 1, 1);
    let tailSwing = 0.12, tailLift = 0.05;

    if (s.promote) {
      // 승급: 기마 자세로 주먹 지르기, 가끔 한 바퀴 돈다
      const k = (t * 0.55) % 1;
      body.rotation.y = k < 0.3 ? (k / 0.3) * Math.PI * 2 : 0;
      body.position.y = -0.04 + Math.abs(Math.sin(t * 9)) * 0.03;
      const punch = Math.sin(t * 9) > 0;
      arm(armL, punch ? -1.5 : 0.25, -0.12, punch ? -0.05 : -1.9);
      arm(armR, punch ? 0.25 : -1.5, 0.12, punch ? -1.9 : -0.05);
      leg(legL, -0.25, -0.32, 0.5); leg(legR, -0.25, 0.32, 0.5);
      tailSwing = 0.2; tailLift = 0.1 + Math.abs(Math.sin(t * 9)) * 0.2;
    } else if (s.hitTimer > 0) {
      // 충돌: 뒤로 휘청휘청
      const k = Math.min(1, s.hitTimer);
      body.rotation.x = 0.5 * k;
      body.rotation.z = Math.sin(s.hitTimer * 16) * 0.35 * k;
      arm(armL, -0.4 * k, -1.9 * k - 0.15, -0.5 * k); arm(armR, -0.4 * k, 1.9 * k + 0.15, -0.5 * k);
      leg(legL, -0.6 * k, -0.1, 0.5 * k); leg(legR, 0.35 * k, 0.1, 0.9 * k);
      head.rotation.z = Math.sin(s.hitTimer * 20) * 0.22 * k;
      tailLift = 0.5 * k;
    } else if (s.airborne) {
      // 점프: 두 팔 번쩍, 무릎을 당겨 올린다
      arm(armL, -2.75, -0.3, -0.25); arm(armR, -2.75, 0.3, -0.25);
      leg(legL, -1.0, -0.08, 1.5); leg(legR, -0.35, 0.08, 1.2);
      skirt.rotation.x = -0.12; skirt.scale.set(1.06, 0.94, 1.06);
      tailLift = 0.7; tailSwing = 0.3;
    } else if (s.victory) {
      // 승리: 만세하며 폴짝폴짝
      const hop = Math.abs(Math.sin(t * 6));
      body.position.y = hop * 0.28;
      arm(armL, -2.8, -0.35 + Math.sin(t * 12) * 0.2, -0.3); arm(armR, -2.8, 0.35 - Math.sin(t * 12) * 0.2, -0.3);
      leg(legL, -0.2 - hop * 0.3, -0.1, 0.3 + hop * 0.6); leg(legR, -0.2 - hop * 0.3, 0.1, 0.3 + hop * 0.6);
      head.rotation.z = Math.sin(t * 6) * 0.1;
      skirt.scale.set(1 + hop * 0.06, 1, 1 + hop * 0.06);
      tailLift = hop * 0.6;
    } else {
      // 달리기: 팔꿈치를 굽혀 앞뒤로 흔들고, 뒤로 가는 다리는 무릎을 접는다
      const reach = s.boost ? 1.05 : 0.9;
      leg(legL, -sw * reach - 0.12, -0.03, 0.25 + Math.max(0, -cw) * 1.25);
      leg(legR, sw * reach - 0.12, 0.03, 0.25 + Math.max(0, cw) * 1.25);
      if (s.cheerTimer > 0) { arm(armL, -2.8, -0.35, -0.3); arm(armR, -2.8, 0.35, -0.3); }
      else { arm(armL, sw * 0.95 - 0.1, -0.16, -1.35); arm(armR, -sw * 0.95 - 0.1, 0.16, -1.35); }
      body.position.y = Math.abs(cw) * 0.1;
      body.rotation.x = s.boost ? -0.2 : -0.07;
      body.rotation.y = sw * 0.1; // 어깨가 살짝 돌아간다
      head.rotation.y = -sw * 0.08;
      head.rotation.z = sw * 0.04;
      // 자락은 다리를 따라 흔들리고, 발을 디딜 때 살짝 퍼진다
      skirt.rotation.x = cw * 0.07;
      skirt.rotation.z = sw * 0.05;
      const puff = 1 + Math.abs(cw) * 0.05;
      skirt.scale.set(puff, 1, puff);
      tailSwing = 0.14 + sw * 0.16;
      tailLift = 0.28 + Math.abs(sw) * 0.3;
    }
    tailL.rotation.set(tailLift, 0, -0.2 + tailSwing * 0.6 - 0.1);
    tailR.rotation.set(tailLift * 0.9, 0, 0.2 + tailSwing * 0.6);
    if (!s.promote) body.rotation.z -= (s.lean || 0) * 0.3;

    if (aura.visible) {
      ring.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
      stars.forEach((st, i) => {
        const a = t * 2.2 + (i / stars.length) * Math.PI * 2;
        st.position.set(Math.cos(a) * 0.85, 0.5 + (i % 3) * 0.6 + Math.sin(t * 3 + i) * 0.12, Math.sin(a) * 0.85);
        st.rotation.y = t * 4;
      });
    }

    const h = root.position.y;
    shadow.position.y = 0.02 - h;
    shadow.scale.setScalar(Math.max(0.4, 1 - h * 0.25));
    aura.position.y = -h;
  }

  setBelt('white');
  return { object: root, update, setBelt, get belt() { return beltId; } };
}
