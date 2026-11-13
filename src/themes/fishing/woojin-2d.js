// 우진이 낚시꾼 캐릭터: 제공받은 일러스트(실제 사진 얼굴 + 낚시 조끼·장화·낚싯대)를 배경만 오려 내어 그대로 쓴다.
//  - 이미지는 한 장이다. 크기는 가로세로 비율을 지킨 채 같은 비율로만 키우고 줄인다(찌그러뜨리지 않는다).
//  - 움직임은 이동·기울임·통통 튀기·같은 비율의 커졌다 작아지기로만 표현한다. 얼굴을 다시 그리거나 보정하지 않는다.
// 인터페이스는 다른 캐릭터와 같다: { object, update(dt, state), rodTip }
import * as THREE from 'three';
import fisherUrl from './assets/woojin-fisher.png';

const ASPECT = 792 / 880;                 // 오려 낸 그림의 가로/세로 비율
const FEET = { u: 0.3245, v: 0.0129 };    // 두 발 가운데 (그림 안의 위치 0~1, 아래가 0)
const TIP = { u: 0.9857, v: 0.9327 };     // 낚싯대 끝
const H = 2.8;                            // 화면 속 키 (낚싯대 끝까지)
const W = H * ASPECT;

export function createWoojin() {
  const root = new THREE.Group();
  const body = new THREE.Group();          // 발바닥이 원점: 여기서 기울이고 튕긴다
  root.add(body);

  const tex = new THREE.TextureLoader().load(fisherUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const geo = new THREE.PlaneGeometry(W, H);
  geo.translate((0.5 - FEET.u) * W, (0.5 - FEET.v) * H, 0);
  const sprite = new THREE.Mesh(geo, mat);
  sprite.renderOrder = 20;
  body.add(sprite);

  // 낚싯대 끝 (물고기에 낚싯줄을 잇는 자리)
  const rodTip = new THREE.Object3D();
  rodTip.position.set((TIP.u - FEET.u) * W, (TIP.v - FEET.v) * H, 0.02);
  body.add(rodTip);

  // 낚싯줄과 찌
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -1, 0)]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
  line.frustumCulled = false; root.add(line);
  const bobber = new THREE.Group();
  bobber.add(
    new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshToonMaterial({ color: 0xff4757 })),
    new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshToonMaterial({ color: 0xffffff })));
  root.add(bobber);

  // 그림자
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; root.add(shadow);

  // 레벨업·승리 반짝이
  const sparkle = new THREE.Group(); root.add(sparkle); sparkle.visible = false;
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
  const sparks = [];
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), sparkMat); sparkle.add(m); sparks.push(m); }

  let phase = 0, t = 0;
  const tmp = new THREE.Vector3();

  function update(dt, s) {
    t += dt;
    phase += dt * (9 + (s.speed || 14) * 0.35);
    const sw = Math.sin(phase);
    let y = 0, rz = 0, rx = 0, z = 0, k = 1, op = 1;

    if (s.hitTimer > 0) {
      // 충돌: 뒤로 밀리며 휘청, 깜빡인다
      const h = Math.min(1, s.hitTimer);
      rz = Math.sin(s.hitTimer * 14) * 0.28 * h; rx = 0.35 * h; z = 0.45 * h;
      op = Math.sin(s.hitTimer * 45) > -0.2 ? 1 : 0.45;
    } else if (s.pull) {
      // 대어! 낚싯대를 힘껏 당긴다: 뒤로 젖히고 부르르 떤다
      const sh = Math.sin(t * 28);
      rx = 0.3 + 0.04 * sh; rz = 0.06 * Math.sin(t * 19); y = 0.03 + 0.03 * Math.abs(sh); k = 1.03;
    } else if (s.airborne) {
      rx = -0.08; rz = sw * 0.04; k = 1.04;
    } else if (s.promote || s.victory) {
      // 레벨업·승리: 폴짝폴짝 뛰며 흔든다
      y = Math.abs(Math.sin(t * 7)) * 0.28; rz = Math.sin(t * 7) * 0.1; k = 1 + 0.04 * Math.sin(t * 14);
    } else if (s.idle) {
      y = Math.sin(t * 2) * 0.015; rz = Math.sin(t * 1.3) * 0.015;
    } else {
      // 달리기: 통통 튀며 좌우로 뒤뚱뒤뚱, 앞으로 살짝 숙인다
      y = Math.abs(Math.cos(phase)) * 0.13; rz = sw * 0.06; rx = -0.1;
      if (s.cheerTimer > 0 || s.coinTimer > 0) { y += Math.abs(Math.sin(t * 16)) * 0.14; k = 1.03; } // 정답·코인: 신나서 폴짝
    }
    rz -= (s.lean || 0) * 0.25;
    body.position.set(0, y, z);
    body.rotation.set(rx, 0, rz);
    body.scale.setScalar(k);
    mat.opacity = op;

    // 낚싯줄: 대 끝에서 아래로 늘어진다 (대어를 잡는 동안은 게임 쪽에서 물고기에 연결한다)
    rodTip.getWorldPosition(tmp); root.worldToLocal(tmp);
    const sway = Math.sin(t * 4) * 0.05;
    const p = lineGeo.attributes.position;
    p.setXYZ(0, tmp.x, tmp.y, tmp.z);
    p.setXYZ(1, tmp.x + sway, tmp.y - 0.8, tmp.z + 0.05);
    p.needsUpdate = true;
    bobber.position.set(tmp.x + sway, tmp.y - 0.8, tmp.z + 0.05);

    const sp = !!(s.promote || s.victory);
    sparkle.visible = sp;
    if (sp) sparks.forEach((m, i) => {
      const a = t * 2.2 + (i / sparks.length) * Math.PI * 2;
      m.position.set(Math.cos(a) * 1.0, 1.2 + Math.sin(t * 3 + i) * 0.8 + 0.3, 0.3 + Math.sin(a) * 0.5);
      m.rotation.y = t * 4; m.scale.setScalar(0.7 + 0.5 * Math.sin(t * 6 + i));
    });

    const h = root.position.y;
    shadow.position.y = 0.02 - h;
    shadow.scale.setScalar(Math.max(0.4, 1 - h * 0.25));
  }

  return { object: root, update, rodTip, setBelt() {} };
}
