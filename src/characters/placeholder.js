// 임시 캐릭터: 기본 도형으로 만든 카툰 어린이 러너.
import * as THREE from 'three';

const toon = (color) => new THREE.MeshToonMaterial({ color });

export function createPlaceholderCharacter() {
  const root = new THREE.Group();
  const body = new THREE.Group(); // 달리기 흔들림용
  root.add(body);

  const skin = toon(0xffcfa3);
  const shirt = toon(0xff4757);
  const pants = toon(0x2f3ad6);
  const shoe = toon(0xffffff);
  const hair = toon(0x3b2416);

  // 몸통
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.35, 6, 14), shirt);
  torso.position.y = 0.95;
  body.add(torso);

  // 가방
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.2), toon(0xffd23f));
  pack.position.set(0, 0.98, 0.33);
  body.add(pack);

  // 머리
  const head = new THREE.Group();
  head.position.y = 1.62;
  body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), skin));
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.385, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairCap.rotation.x = 0.25;
  head.add(hairCap);
  // 모자 챙
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.38), toon(0x1e90ff));
  cap.position.y = 0.03;
  head.add(cap);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 16, 1, false, 0, Math.PI), toon(0x1e90ff));
  brim.rotation.y = Math.PI / 2 + Math.PI / 2;
  brim.position.set(0, 0.17, -0.3);
  head.add(brim);
  // 얼굴 (카메라가 뒤에서 보지만 옆으로 기울 때 보인다)
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x222222 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeM);
    eye.position.set(0.13 * s, 0.03, -0.33);
    head.add(eye);
  }

  // 팔/다리: 어깨·골반 피벗에서 회전
  const limb = (mat, len, r, endMat) => {
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
    m.position.y = -len / 2 - r * 0.5;
    pivot.add(m);
    const end = new THREE.Mesh(new THREE.SphereGeometry(r * 1.25, 10, 8), endMat);
    end.position.y = -len - r;
    pivot.add(end);
    return pivot;
  };
  const armL = limb(shirt, 0.3, 0.09, skin); armL.position.set(-0.42, 1.2, 0);
  const armR = limb(shirt, 0.3, 0.09, skin); armR.position.set(0.42, 1.2, 0);
  const legL = limb(pants, 0.36, 0.12, shoe); legL.position.set(-0.17, 0.62, 0);
  const legR = limb(pants, 0.36, 0.12, shoe); legR.position.set(0.17, 0.62, 0);
  body.add(armL, armR, legL, legR);

  // 그림자
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  root.traverse((o) => { if (o.isMesh && o !== shadow) o.castShadow = false; });

  let phase = 0;
  function update(dt, s) {
    const rate = 9 + (s.speed || 14) * 0.35;
    phase += dt * rate;
    const sw = Math.sin(phase);

    if (s.hitTimer > 0) {
      // 충돌: 뒤로 휘청 + 빙글
      const k = Math.min(1, s.hitTimer);
      body.rotation.x = -0.7 * k;
      body.rotation.y = Math.sin(s.hitTimer * 14) * 0.6 * k;
      armL.rotation.set(0, 0, -2.2 * k);
      armR.rotation.set(0, 0, 2.2 * k);
      legL.rotation.x = 0.6 * k; legR.rotation.x = -0.4 * k;
      body.position.y = 0;
    } else if (s.airborne) {
      body.rotation.x = 0.15;
      body.rotation.y = 0;
      armL.rotation.set(-2.6, 0, -0.3);
      armR.rotation.set(-2.6, 0, 0.3);
      legL.rotation.x = -1.0; legR.rotation.x = 0.7;
      body.position.y = 0;
    } else {
      body.rotation.x = s.boost ? 0.32 : 0.16;
      body.rotation.y = 0;
      legL.rotation.x = sw * 1.1;
      legR.rotation.x = -sw * 1.1;
      armL.rotation.set(-sw * 1.2, 0, -0.12);
      armR.rotation.set(sw * 1.2, 0, 0.12);
      body.position.y = Math.abs(Math.cos(phase)) * 0.1;
      if (s.cheerTimer > 0) { armL.rotation.set(-2.9, 0, -0.4); armR.rotation.set(-2.9, 0, 0.4); }
    }
    head.rotation.z = -(s.lean || 0) * 0.3;
    body.rotation.z = -(s.lean || 0) * 0.35;
    // 공중일수록 그림자를 작게
    const h = root.position.y;
    shadow.position.y = 0.02 - h;
    shadow.scale.setScalar(Math.max(0.4, 1 - h * 0.25));
  }

  return { object: root, update };
}
