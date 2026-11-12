// 주호 캐릭터: 사진 스티커를 오려낸 이미지(assets/juho.png)를 종이 인형처럼 세워서 사용한다.
// 몸통과 두 다리를 따로 잘라 붙여서 달릴 때 다리가 번갈아 움직인다.
// 이미지를 바꾸려면 assets/juho.png만 교체하고, 필요하면 아래 LEG_CUT / LEG_SPLIT 비율을 조정한다.
import * as THREE from 'three';
import juhoUrl from '../assets/juho.png';

const IMG_W = 386, IMG_H = 640;
const HEIGHT = 2.0;                 // 게임 안에서의 키
const LEG_CUT = 535 / IMG_H;        // 위에서부터 이 비율 지점(반바지 끝)에서 다리를 분리
const LEG_SPLIT = 193 / IMG_W;      // 왼쪽/오른쪽 다리를 나누는 가로 위치

/** 텍스처의 일부분(u0~u1, v0~v1)만 보여 주는 평면 */
function part(mat, u0, u1, vTop, vBottom, width, height) {
  const geo = new THREE.PlaneGeometry(width, height);
  const uv = geo.attributes.uv;
  // PlaneGeometry 정점 순서: 좌상, 우상, 좌하, 우하
  uv.setXY(0, u0, 1 - vTop); uv.setXY(1, u1, 1 - vTop);
  uv.setXY(2, u0, 1 - vBottom); uv.setXY(3, u1, 1 - vBottom);
  return new THREE.Mesh(geo, mat);
}

export function createJuhoCharacter() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const tex = new THREE.TextureLoader().load(juhoUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });

  const W = HEIGHT * (IMG_W / IMG_H);
  const legH = HEIGHT * (1 - LEG_CUT);
  const upperH = HEIGHT - legH;

  // 상체 (머리 + 몸통 + 반바지)
  const upper = part(mat, 0, 1, 0, LEG_CUT, W, upperH);
  upper.position.y = legH + upperH / 2;
  body.add(upper);

  // 다리: 위쪽(골반)을 축으로 움직이도록 피벗 그룹에 넣는다
  const makeLeg = (u0, u1) => {
    const w = W * (u1 - u0);
    const pivot = new THREE.Group();
    const m = part(mat, u0, u1, LEG_CUT, 1, w, legH);
    m.position.y = -legH / 2;
    pivot.add(m);
    pivot.position.set((u0 + u1) / 2 * W - W / 2, legH, -0.01);
    return pivot;
  };
  const legL = makeLeg(0, LEG_SPLIT);
  const legR = makeLeg(LEG_SPLIT, 1);
  body.add(legL, legR);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  let phase = 0;
  function update(dt, s) {
    phase += dt * (8 + (s.speed || 12) * 0.4);
    const sw = Math.sin(phase);
    body.rotation.set(0, 0, 0);
    body.scale.set(1, 1, 1);
    legL.rotation.z = legR.rotation.z = 0;

    if (s.hitTimer > 0) {
      // 충돌: 뒤로 넘어질 듯 휘청휘청
      const k = Math.min(1, s.hitTimer);
      body.rotation.x = -0.5 * k;
      body.rotation.z = Math.sin(s.hitTimer * 16) * 0.5 * k;
      body.position.y = 0;
      legL.position.y = legR.position.y = legH;
    } else if (s.airborne) {
      // 점프: 다리를 접고 쭉 늘어난다
      body.scale.set(0.94, 1.06, 1);
      body.position.y = 0;
      legL.position.y = legR.position.y = legH + legH * 0.35;
      legL.rotation.z = -0.25; legR.rotation.z = 0.25;
    } else {
      // 달리기: 다리를 번갈아 들고, 몸은 통통 튀면서 좌우로 살짝 흔들린다
      legL.position.y = legH + Math.max(0, sw) * legH * 0.45;
      legR.position.y = legH + Math.max(0, -sw) * legH * 0.45;
      legL.rotation.z = Math.max(0, sw) * -0.2;
      legR.rotation.z = Math.max(0, -sw) * 0.2;
      body.position.y = Math.abs(Math.cos(phase)) * 0.12;
      body.rotation.z = sw * 0.07;
      const sq = 1 + Math.abs(Math.cos(phase)) * 0.04;
      body.scale.set(1 / sq, sq, 1);
      if (s.cheerTimer > 0) body.position.y += 0.25 * Math.sin(Math.min(1, s.cheerTimer / 0.6) * Math.PI);
      if (s.boost) body.rotation.x = -0.12;
    }
    body.rotation.z -= (s.lean || 0) * 0.3;

    const h = root.position.y;
    shadow.position.y = 0.02 - h;
    shadow.scale.setScalar(Math.max(0.4, 1 - h * 0.25));
  }

  return { object: root, update };
}
