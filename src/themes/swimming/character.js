// 수영왕 현우 캐릭터: 현우 사진의 머리(원본 그대로) + 직접 그린 수영복 몸체의 2D 종이 인형.
//  - 얼굴 사진은 가로세로 비율을 지킨 채 같은 비율로만 키우고 옮긴다. 얼굴 위에는 아무것도 덧그리지 않는다.
//  - 셔츠·소매는 급수 색으로 물들이고(setRank), 피부·얼굴은 물들이지 않는다.
//  - 몸의 아랫부분은 반투명한 물(water.svg) 속에 잠겨 있다.
// 인터페이스는 다른 캐릭터와 같다: { object, update(dt, state), setBelt(id) }
import * as THREE from 'three';
import headUrl from './assets/hyunwoo-head.png';
import torsoUrl from './assets/torso.svg';
import neckUrl from './assets/neck.svg';
import armUpperUrl from './assets/arm-upper.svg';
import sleeveUrl from './assets/sleeve.svg';
import armLowerUrl from './assets/arm-lower.svg';
import goggleUrl from './assets/goggles.svg';
import waterUrl from './assets/water.svg';

export const RANK_COLORS = { white: 0xf4f6fb, yellow: 0xffd400, green: 0x35b55a, blue: 0x2f86e6, red: 0xe8403d, purple: 0x9a5cf0, gold: 0xffc21a };

const HEAD_ASPECT = 337 / 420;   // 오려 낸 머리 조각의 가로/세로 비율
const HEAD_H = 1.1;             // 머리(목 윗부분 포함) 높이 (단위: 월드)
const HEAD_W = HEAD_H * HEAD_ASPECT;
const SHOULDER = { x: 0.5, y: 0.93 };
const UPPER = 0.42, LOWER = 0.5; // 위팔·아래팔 길이

const loader = new THREE.TextureLoader();
const tex = (url, repeat = false) => {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = THREE.RepeatWrapping;
  return t;
};
const mat = (t, extra = {}) => new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, ...extra });

/** 피벗(회전축)이 평면의 위쪽 가운데에 오도록 만든 판 */
function piece(t, w, h, order, pivot = 'center', extra) {
  const g = new THREE.PlaneGeometry(w, h);
  if (pivot === 'top') g.translate(0, -h / 2, 0);
  const m = new THREE.Mesh(g, mat(t, extra));
  m.renderOrder = order;
  return m;
}

export function createSwimmer() {
  const root = new THREE.Group();
  const body = new THREE.Group();          // 어깨 흔들림·기울임용 (원점 = 수면)
  root.add(body);

  const shirtMats = [];
  const tinted = (m) => { shirtMats.push(m.material); return m; };

  // 목(뒤) → 셔츠 → 수경 → 머리 → 팔 → 물 순서로 겹친다
  const neck = piece(tex(neckUrl), 0.3, 0.3, 18); neck.position.set(0, 1.0, 0); body.add(neck);
  // 머리의 목 부분 위에 깃이 덮이도록 셔츠는 머리(30)보다 나중에 그린다
  const torso = tinted(piece(tex(torsoUrl), 1.1, 1.0, 36)); torso.position.set(0, 0.5, 0); body.add(torso);
  const goggles = piece(tex(goggleUrl), 0.36, 0.18, 38); goggles.position.set(0, 0.78, 0.01); body.add(goggles);

  const head = new THREE.Group(); head.position.set(0, 0.95, 0.02); body.add(head);   // 목 아래쪽이 회전축
  const face = piece(tex(headUrl), HEAD_W, HEAD_H, 30, 'center', { transparent: true });
  face.position.set(0.0, HEAD_H / 2, 0);
  head.add(face);

  const makeArm = (side) => {
    const shoulder = new THREE.Group(); shoulder.position.set(side * SHOULDER.x, SHOULDER.y, 0.03); body.add(shoulder);
    const upper = piece(tex(armUpperUrl), 0.15, UPPER + 0.06, 40, 'top'); shoulder.add(upper);
    const sleeve = tinted(piece(tex(sleeveUrl), 0.26, 0.33, 42, 'top')); sleeve.position.set(0, 0.05, 0.005); shoulder.add(sleeve);
    const elbow = new THREE.Group(); elbow.position.set(0, -UPPER, 0); shoulder.add(elbow);
    const lower = piece(tex(armLowerUrl), 0.15, LOWER, 41, 'top'); elbow.add(lower);
    return { shoulder, elbow };
  };
  const armL = makeArm(-1), armR = makeArm(1);

  // 몸에 걸친 물 (수면 위로 0.4쯤 올라온다). 점프할 때도 수면에 머물도록 매 프레임 높이를 보정한다.
  const waterTex = tex(waterUrl, true);
  waterTex.repeat.set(1.2, 1);
  const water = piece(waterTex, 2.4, 0.6, 50);
  water.position.set(0, 0.15, 0.06); root.add(water);

  // 헤엄칠 때 뒤로 퍼지는 물결 고리 세 개
  const rings = [];
  const ringGeo = new THREE.RingGeometry(0.5, 0.62, 28);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.03, 0.4); root.add(m); rings.push({ m, t: i / 3 });
  }
  // 승급·승리 반짝이
  const sparkle = new THREE.Group(); root.add(sparkle); sparkle.visible = false;
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
  const sparks = [];
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), sparkMat); sparkle.add(m); sparks.push(m); }

  const deg = Math.PI / 180;
  let phase = 0, t = 0;

  function setRank(id) {
    const c = RANK_COLORS[id] ?? RANK_COLORS.white;
    shirtMats.forEach((m) => m.color.setHex(c));
  }
  setRank('white');

  function update(dt, s) {
    t += dt;
    phase += dt * (6.5 + (s.speed || 12) * 0.28);
    const sw = Math.sin(phase);
    let by = 0, rz = 0, bz = 0, headTilt = 0, op = 1, k = 1;
    let aL = -(80 + 70 * sw) * deg, aR = (80 - 70 * sw) * deg;     // 자유형: 두 팔이 번갈아 들린다 (왼팔은 음수 = 바깥쪽)
    let eL = -12 * deg, eR = 12 * deg;                             // 팔꿈치 굽힘

    if (s.hitTimer > 0) {
      const h = Math.min(1, s.hitTimer);
      rz = Math.sin(s.hitTimer * 14) * 0.3 * h; bz = 0.4 * h; headTilt = Math.sin(s.hitTimer * 18) * 0.25 * h;
      aL = -(40 + 30 * Math.sin(s.hitTimer * 20)) * deg; aR = (40 + 30 * Math.cos(s.hitTimer * 20)) * deg;
      op = Math.sin(s.hitTimer * 45) > -0.2 ? 1 : 0.45;
    } else if (s.airborne) {
      aL = -150 * deg; aR = 150 * deg; eL = -8 * deg; eR = 8 * deg; rz = sw * 0.04; k = 1.03;
    } else if (s.promote || s.victory) {
      by = Math.abs(Math.sin(t * 7)) * 0.2; aL = -(155 + 8 * Math.sin(t * 12)) * deg; aR = (155 - 8 * Math.sin(t * 12)) * deg;
      rz = Math.sin(t * 7) * 0.08; headTilt = Math.sin(t * 5) * 0.12; k = 1 + 0.03 * Math.sin(t * 14);
    } else if (s.idle) {
      by = Math.sin(t * 2.2) * 0.02; aL = -(32 + 10 * Math.sin(t * 3)) * deg; aR = (32 + 10 * Math.cos(t * 3)) * deg;
      rz = Math.sin(t * 1.4) * 0.015;
    } else {
      by = Math.sin(phase * 2) * 0.025; rz = sw * 0.05; headTilt = -sw * 0.04;
      if (s.cheerTimer > 0 || s.coinTimer > 0) { aR = (165 + 10 * Math.sin(t * 16)) * deg; eR = 5 * deg; by += Math.abs(Math.sin(t * 14)) * 0.05; }
    }
    rz -= (s.lean || 0) * 0.22;

    body.position.set(0, by, bz);
    body.rotation.set(0, 0, rz);
    body.scale.setScalar(k);
    head.rotation.z = headTilt;
    armL.shoulder.rotation.z = aL; armR.shoulder.rotation.z = aR;
    armL.elbow.rotation.z = eL; armR.elbow.rotation.z = eR;
    body.traverse((o) => { if (o.material && o.material.opacity !== undefined) o.material.opacity = op; });

    // 물: 수면 높이에 고정, 속도에 따라 흐른다
    water.position.y = 0.15 - root.position.y + by * 0.4;
    waterTex.offset.x = (waterTex.offset.x - dt * (0.15 + (s.speed || 0) * 0.04)) % 1;

    // 물결 고리: 헤엄치는 동안 뒤로 퍼진다
    const moving = !s.idle;
    rings.forEach((r, i) => {
      r.t += dt * (moving ? 0.9 : 0.4);
      if (r.t >= 1) r.t -= 1;
      r.m.position.y = 0.03 - root.position.y;
      r.m.scale.setScalar(0.8 + r.t * 2.6);
      r.m.material.opacity = (moving ? 0.5 : 0.25) * (1 - r.t);
    });

    const sp = !!(s.promote || s.victory);
    sparkle.visible = sp;
    if (sp) sparks.forEach((m, i) => {
      const a = t * 2.2 + (i / sparks.length) * Math.PI * 2;
      m.position.set(Math.cos(a) * 1.1, 1.3 + Math.sin(t * 3 + i) * 0.8 + 0.3, 0.3 + Math.sin(a) * 0.4);
      m.rotation.y = t * 4; m.scale.setScalar(0.7 + 0.5 * Math.sin(t * 6 + i));
    });
  }

  return { object: root, update, setBelt: setRank };
}
