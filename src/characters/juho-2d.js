// 주호 2D 캐릭터: 실제 사진 얼굴 + 2D 태권도 도복 일러스트를 겹쳐서 만든 종이 인형.
//
// 레이어 (뒤 → 앞)
//   다리(종아리·신발, 허벅지) → 도복 상의 → [Layer 1] 주호 얼굴 사진 → 목 앞을 덮는 깃
//   → [Layer 3] 띠(아래 절반, 위 절반+매듭, 늘어진 끝) → 소매(윗팔, 아랫팔+주먹) → [Layer 4] 이펙트
//
// 얼굴: assets/jooho_original_photo_head_cutout.png 를 그대로 불러와 쓴다.
//       크기와 위치만 정하고(가로세로 비율은 파일에서 읽어 그대로 유지) 픽셀은 손대지 않는다.
// 몸체: assets/dobok/*.svg (투명 배경). 같은 이름의 파일로 바꾸면 의상이 바뀐다.
// 띠  : 흰색으로 그린 띠 그림에 색만 입힌다. setBelt(id)는 띠 레이어의 색만 바꾼다.
import * as THREE from 'three';
import headUrl from '../assets/jooho_original_photo_head_cutout.png';
import torsoUrl from '../assets/dobok/torso.svg';
import collarUrl from '../assets/dobok/collar.svg';
import beltUpperUrl from '../assets/dobok/belt-upper.svg';
import beltLowerUrl from '../assets/dobok/belt-lower.svg';
import beltTailUrl from '../assets/dobok/belt-tail.svg';
import armUpperUrl from '../assets/dobok/arm-upper.svg';
import armLowerUrl from '../assets/dobok/arm-lower.svg';
import legUpperUrl from '../assets/dobok/leg-upper.svg';
import legLowerUrl from '../assets/dobok/leg-lower.svg';

const U = 0.0035; // 그림 1칸(SVG 좌표 1) = 게임 속 길이

// 각 그림의 크기(viewBox)와 회전축 위치. 그림을 바꾸면 여기 숫자만 맞추면 된다.
const PART = {
  torso: { url: torsoUrl, w: 240, h: 250, px: 120, py: 196 },       // 축: 골반 가운데
  collar: { url: collarUrl, w: 240, h: 250, px: 120, py: 196 },
  beltUpper: { url: beltUpperUrl, w: 240, h: 250, px: 120, py: 196 },
  beltLower: { url: beltLowerUrl, w: 240, h: 250, px: 120, py: 196 },
  beltTail: { url: beltTailUrl, w: 20, h: 90, px: 10, py: 4 },
  armUpper: { url: armUpperUrl, w: 70, h: 96, px: 35, py: 22 },      // 축: 어깨
  armLower: { url: armLowerUrl, w: 84, h: 112, px: 42, py: 14 },     // 축: 팔꿈치
  legUpper: { url: legUpperUrl, w: 92, h: 104, px: 46, py: 16 },     // 축: 골반
  legLower: { url: legLowerUrl, w: 104, h: 128, px: 52, py: 12 },    // 축: 무릎
};
// 관절 위치 (상의 그림 좌표)
const JOINT = { shoulderX: 84, shoulderY: 36, hipX: 35, elbow: 60, knee: 70, sole: 111, beltKnot: [120, 164] };
// 얼굴 사진을 붙이는 기준: 사진 속 턱 끝(가로·세로 비율)이 상의 그림의 CHIN 위치에 온다.
const HEAD = { height: 304, chinU: 0.587, chinV: 0.941, chin: [120, 3], tilt: 0 };

// 띠 색 [위쪽 절반·매듭, 아래쪽 절반]. 품띠만 빨강/검정 두 색이다.
const BELT_COLORS = {
  white: [0xe9edf5, 0xe9edf5],
  yellow: [0xffd400, 0xffd400],
  green: [0x2e9e44, 0x2e9e44],
  blue: [0x1c6fd6, 0x1c6fd6],
  red: [0xe0312f, 0xe0312f],
  poom: [0xe0312f, 0x26262b],
  black: [0x26262b, 0x26262b],
};

const loader = new THREE.TextureLoader();
function texture(url) {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function material(url, order, color = 0xffffff) {
  const m = new THREE.MeshBasicMaterial({ map: texture(url), color, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
  m.userData.order = order;
  return m;
}
/** 회전축(px, py)이 원점에 오도록 놓은 그림 한 장 */
function sprite(def, mat) {
  const geo = new THREE.PlaneGeometry(def.w * U, def.h * U);
  geo.translate((def.w / 2 - def.px) * U, -(def.h / 2 - def.py) * U, 0);
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = mat.userData.order;
  return m;
}

export function createJuho2D() {
  const root = new THREE.Group();
  const body = new THREE.Group();   // 전체(통통 튀는 움직임)
  const upper = new THREE.Group();  // 상체: 상의 + 얼굴 + 깃 + 띠 + 팔
  root.add(body);

  const hipY = (JOINT.knee + JOINT.sole) * U;
  upper.position.y = hipY;
  body.add(upper);
  /** 상의 그림 좌표 → 상체 그룹 안의 위치 */
  const at = (x, y) => [(x - PART.torso.px) * U, (PART.torso.py - y) * U];

  // ---------- 다리 (Layer 2: 몸체) ----------
  const legUpperMat = material(legUpperUrl, 12), legLowerMat = material(legLowerUrl, 11);
  const makeLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * JOINT.hipX * U, hipY, 0);
    const knee = new THREE.Group();
    knee.position.y = -JOINT.knee * U;
    knee.add(sprite(PART.legLower, legLowerMat));
    hip.add(knee, sprite(PART.legUpper, legUpperMat));
    body.add(hip);
    return { hip, knee };
  };
  const legL = makeLeg(-1), legR = makeLeg(1);

  // ---------- 상의 ----------
  upper.add(sprite(PART.torso, material(torsoUrl, 20)));

  // ---------- 얼굴 (Layer 1: 실제 사진, 픽셀 그대로) ----------
  const head = new THREE.Group();
  {
    const [cx, cy] = at(...HEAD.chin);
    head.position.set(cx, cy, 0);
  }
  upper.add(head);
  const headMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, visible: false });
  const headMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), headMat);
  headMesh.renderOrder = 30;
  head.add(headMesh);
  loader.load(headUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    // 가로세로 비율은 사진 파일에서 읽어 그대로 쓴다 (늘리거나 누르지 않는다)
    const h = HEAD.height * U, w = h * (tex.image.width / tex.image.height);
    headMesh.scale.set(w, h, 1);
    // 턱 끝이 head 그룹의 원점(=깃 위)에 오도록 놓는다
    headMesh.position.set((0.5 - HEAD.chinU) * w, (HEAD.chinV - 0.5) * h, 0);
    headMat.map = tex; headMat.visible = true; headMat.needsUpdate = true;
  });

  // 목 앞을 덮는 깃: 얼굴 사진의 아래쪽 경계를 가려 몸과 이어지게 한다
  upper.add(sprite(PART.collar, material(collarUrl, 40)));

  // ---------- 띠 (Layer 3) ----------
  const beltA = material(beltUpperUrl, 52), beltB = material(beltLowerUrl, 51);
  const tailA = material(beltTailUrl, 50), tailB = material(beltTailUrl, 50);
  upper.add(sprite(PART.beltLower, beltB), sprite(PART.beltUpper, beltA));
  const makeTail = (side) => {
    const pivot = new THREE.Group();
    const [x, y] = at(JOINT.beltKnot[0] + side * 7, JOINT.beltKnot[1]);
    pivot.position.set(x, y, 0);
    const a = sprite(PART.beltTail, tailA); a.position.x = -5.5 * U;
    const b = sprite(PART.beltTail, tailB); b.position.x = 5.5 * U;
    pivot.add(a, b);
    upper.add(pivot);
    return pivot;
  };
  const tailL = makeTail(-1), tailR = makeTail(1);

  // ---------- 팔 ----------
  const armUpperMat = material(armUpperUrl, 60), armLowerMat = material(armLowerUrl, 61);
  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    const [x, y] = at(PART.torso.px + side * JOINT.shoulderX, JOINT.shoulderY);
    shoulder.position.set(x, y, 0);
    const elbow = new THREE.Group();
    elbow.position.y = -JOINT.elbow * U;
    elbow.add(sprite(PART.armLower, armLowerMat));
    shoulder.add(sprite(PART.armUpper, armUpperMat), elbow);
    if (side > 0) shoulder.scale.x = -1; // 오른팔은 왼팔 그림을 뒤집어 쓴다
    upper.add(shoulder);
    return { shoulder, elbow, side };
  };
  const armL = makeArm(-1), armR = makeArm(1);

  // ---------- 이펙트 (Layer 4): 검은띠 전용 금빛 고리와 별 ----------
  const aura = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.66, 0.84, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04;
  aura.add(ring);
  const stars = [];
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.075), starMat); aura.add(s); stars.push(s); }
  aura.visible = false;
  root.add(aura);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  let beltId = 'white';
  function setBelt(id) {
    if (!BELT_COLORS[id]) return;
    beltId = id;
    const [a, b] = BELT_COLORS[id];
    beltA.color.setHex(a); tailA.color.setHex(a);
    beltB.color.setHex(b); tailB.color.setHex(b);
    aura.visible = id === 'black';
  }

  // 자세: 팔(앞뒤로 젖힘, 옆으로 벌림, 팔꿈치 굽힘) / 다리(앞뒤, 옆, 무릎)
  // 앞뒤 회전은 종이 인형을 기울여 짧아 보이게 하는 방식이다.
  // twist: 팔꿈치를 화면 안에서 안쪽으로 접는 각도 (오른팔은 뒤집힌 그림이라 같은 값이 좌우 대칭이 된다)
  const arm = (a, x, z, bend, twist = 0) => { a.shoulder.rotation.set(x, 0, z); a.elbow.rotation.set(bend, 0, twist); };
  const leg = (l, x, z, bend) => { l.hip.rotation.set(x, 0, z); l.knee.rotation.x = bend; };

  let phase = 0, t = 0, wasAir = false, land = 0;
  function update(dt, s) {
    t += dt;
    phase += dt * (9 + (s.speed || 12) * 0.35);
    const sw = Math.sin(phase), cw = Math.cos(phase);
    body.rotation.set(0, 0, 0); body.position.set(0, 0, 0); body.scale.set(1, 1, 1);
    upper.rotation.set(0, 0, 0); upper.position.set(0, hipY, 0);
    head.rotation.set(0, 0, HEAD.tilt);
    let tailSwing = 0, tailLift = 0;

    // 착지 반동
    if (wasAir && !s.airborne) land = 0.22;
    wasAir = !!s.airborne;
    land = Math.max(0, land - dt);

    if (s.promote) {
      // 승급: 기마 자세로 번갈아 주먹 지르기
      const punch = Math.sin(t * 9) > 0;
      body.position.y = -0.03 + Math.abs(Math.sin(t * 9)) * 0.03;
      // 지르는 팔은 옆으로 쭉 뻗고, 반대 팔은 허리로 당긴다
      if (punch) { arm(armL, -0.15, -1.5, 0, 0); arm(armR, 0, 0.3, -0.2, 1.75); }
      else { arm(armL, 0, -0.3, -0.2, 1.75); arm(armR, -0.15, 1.5, 0, 0); }
      leg(legL, -0.5, -0.3, 0.9); leg(legR, -0.5, 0.3, 0.9);
      upper.position.y = hipY - 0.05;
      upper.rotation.z = punch ? 0.05 : -0.05;
      tailSwing = punch ? 0.2 : -0.2; tailLift = 0.2;
    } else if (s.hitTimer > 0) {
      // 충돌: 뒤로 밀리며 휘청 (얼굴은 상체에 붙어 함께 움직인다)
      const k = Math.min(1, s.hitTimer);
      body.position.z = 0.35 * k;
      body.rotation.x = 0.35 * k;
      body.rotation.z = Math.sin(s.hitTimer * 16) * 0.28 * k;
      arm(armL, -0.3 * k, -1.7 * k - 0.15, -0.4 * k); arm(armR, -0.3 * k, 1.7 * k + 0.15, -0.4 * k);
      leg(legL, -0.7 * k, -0.15 * k, 0.6 * k); leg(legR, 0.2 * k, 0.15 * k, 0.9 * k);
      tailLift = 0.5 * k; tailSwing = Math.sin(s.hitTimer * 16) * 0.3;
    } else if (s.airborne) {
      // 점프: 두 팔 번쩍, 무릎을 당겨 올린다
      arm(armL, -0.2, -2.5, -0.2); arm(armR, -0.2, 2.5, -0.2);
      leg(legL, -1.0, -0.12, 1.5); leg(legR, -0.55, 0.12, 1.25);
      body.scale.set(0.96, 1.05, 1);
      tailLift = 0.8;
    } else if (s.victory) {
      // 승리: 양팔을 들고 폴짝폴짝
      const hop = Math.abs(Math.sin(t * 6));
      body.position.y = hop * 0.28;
      const wave = Math.sin(t * 12) * 0.18;
      arm(armL, -0.15, -2.55 + wave, -0.2); arm(armR, -0.15, 2.55 - wave, -0.2);
      leg(legL, -0.25 - hop * 0.35, -0.1, 0.4 + hop * 0.7); leg(legR, -0.25 - hop * 0.35, 0.1, 0.4 + hop * 0.7);
      upper.rotation.z = Math.sin(t * 6) * 0.05;
      tailLift = hop * 0.7;
    } else if (s.idle) {
      // 기본 자세: 차렷, 숨 쉬듯 살짝 움직인다
      arm(armL, 0, -0.16, -0.05); arm(armR, 0, 0.16, -0.05);
      leg(legL, 0, -0.04, 0); leg(legR, 0, 0.04, 0);
      body.position.y = Math.sin(t * 2.4) * 0.008;
    } else {
      // 달리기: 팔다리가 번갈아 움직이고 몸이 위아래로 통통 튄다
      const reach = s.boost ? 1.0 : 0.85;
      leg(legL, -Math.max(0, sw) * reach * 1.15 + 0.1, -0.04, 0.2 + Math.max(0, sw) * 1.25 + Math.max(0, -cw) * 0.5);
      leg(legR, -Math.max(0, -sw) * reach * 1.15 + 0.1, 0.04, 0.2 + Math.max(0, -sw) * 1.25 + Math.max(0, cw) * 0.5);
      if (s.cheerTimer > 0) {
        // 정답: 두 팔 번쩍
        arm(armL, -0.15, -2.5, -0.2); arm(armR, -0.15, 2.5, -0.2);
      } else {
        // 팔꿈치를 접고 앞뒤로 흔든다 (앞으로 나온 팔은 주먹이 더 올라온다)
        arm(armL, -sw * 0.4 - 0.1, -0.32 + sw * 0.08, -0.25, 1.05 + sw * 0.4);
        arm(armR, sw * 0.4 - 0.1, 0.32 + sw * 0.08, -0.25, 1.05 - sw * 0.4);
        if (s.coinTimer > 0) arm(armR, -0.15, 2.3, -0.3); // 코인: 한 팔을 번쩍
      }
      body.position.y = Math.abs(cw) * 0.1;
      body.rotation.x = s.boost ? -0.2 : -0.06;
      upper.rotation.z = sw * 0.045;
      upper.position.x = sw * 0.012;
      tailSwing = sw * 0.3;
      tailLift = 0.3 + Math.abs(sw) * 0.25;
    }
    if (land > 0) {
      // 착지 순간 살짝 눌렸다가 돌아온다
      const k = Math.sin((land / 0.22) * Math.PI);
      body.scale.set(1 + 0.1 * k, 1 - 0.12 * k, 1);
    }
    tailL.rotation.set(tailLift, 0, -0.32 + tailSwing * 0.7);
    tailR.rotation.set(tailLift * 0.85, 0, 0.32 + tailSwing * 0.7);
    if (!s.promote) body.rotation.z -= (s.lean || 0) * 0.28;

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
