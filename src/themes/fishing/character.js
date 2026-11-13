// 낚시꾼 캐릭터: 귀여운 3D 카툰 스타일의 가상 인물 (주호 사진·태권도 캐릭터와 무관하다).
// 버킷햇, 카키색 낚시 조끼, 네이비 긴팔 이너, 카고 팬츠, 낚시 장화, 낚싯대와 낚시 가방.
// 인터페이스는 다른 캐릭터와 같다: { object, update(dt, state), rodTip }  (+ pull: 낚싯대를 힘껏 당기는 동작)
import * as THREE from 'three';

const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, ...extra });
const C = {
  skin: 0xffcfa3, navy: 0x24376b, vest: 0xc9ad6a, vestDark: 0xa98d4e, pants: 0x7d8160, pantsDark: 0x666a4c,
  boot: 0x2f6b4a, bootTop: 0x6fae7e, sole: 0x242424, hat: 0xeadfb4, hair: 0x4a2f1c,
  bag: 0x56733f, bagFlap: 0x3f5a2e, tackle: 0xffa726, rod: 0x2a2f3a, cork: 0xc98f52,
};

export function createFisher() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // ---- 몸통: 네이비 이너 + 카키 조끼(앞이 열린 통) + 등 무늬
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.32, 6, 16), toon(C.navy));
  torso.position.y = 0.98; body.add(torso);
  const vest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.345, 0.37, 0.5, 20, 1, true, -Math.PI * 0.86, Math.PI * 1.72),
    toon(C.vest, { side: THREE.DoubleSide }));
  vest.position.y = 0.96; body.add(vest);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.018, 6, 24, Math.PI * 1.72), toon(C.vestDark));
  hem.rotation.x = Math.PI / 2; hem.rotation.z = Math.PI * 0.64; hem.position.y = 0.71; body.add(hem);
  for (const sx of [-1, 1]) { // 어깨끈
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.3), toon(C.vest));
    st.position.set(sx * 0.2, 1.43, 0); st.rotation.z = sx * -0.2; body.add(st);
  }
  // 등에 붙은 물고기 패치
  const fishShape = new THREE.Shape();
  fishShape.moveTo(-0.11, 0); fishShape.quadraticCurveTo(0, 0.09, 0.09, 0); fishShape.quadraticCurveTo(0, -0.09, -0.11, 0);
  fishShape.moveTo(0.09, 0); fishShape.lineTo(0.17, 0.07); fishShape.lineTo(0.17, -0.07); fishShape.closePath();
  const patch = new THREE.Mesh(new THREE.ShapeGeometry(fishShape), new THREE.MeshBasicMaterial({ color: 0xff7a45, side: THREE.DoubleSide }));
  patch.rotation.y = Math.PI; patch.position.set(0.0, 1.25, 0.352); patch.scale.setScalar(0.9); body.add(patch);

  // ---- 낚시 가방(등)과 허리의 태클 박스
  const pack = new THREE.Group(); pack.position.set(0, 0.98, 0.5); body.add(pack);
  pack.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.22), toon(C.bag)));
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.24), toon(C.bagFlap)); flap.position.y = 0.2; pack.add(flap);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.03), toon(0xf2c230)); buckle.position.set(0, 0.1, 0.135); pack.add(buckle);
  for (const sx of [-1, 1]) {
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.1), toon(C.bagFlap)); pocket.position.set(sx * 0.3, -0.08, 0.02); pack.add(pocket);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.03), toon(C.navy)); strap.position.set(sx * 0.17, 0.12, -0.13); pack.add(strap);
  }
  const net = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 14), toon(0xd9d9d9)); // 가방에 매단 뜰채 고리
  net.position.set(-0.2, -0.38, 0.1); net.rotation.x = 0.4; pack.add(net);
  const tackle = new THREE.Group(); tackle.position.set(-0.42, 0.66, 0.12); body.add(tackle);
  tackle.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.24), toon(C.tackle)));
  const th = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.04), toon(0x6b4a1c)); th.position.y = 0.09; tackle.add(th);

  // ---- 머리: 피부 + 얼굴 + 뒷머리 + 버킷햇
  const head = new THREE.Group(); head.position.y = 1.62; body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 18), toon(C.skin)));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.415, 20, 12, 0, Math.PI, Math.PI * 0.16, Math.PI * 0.62), toon(C.hair, { side: THREE.DoubleSide }));
  head.add(hair);
  const dark = new THREE.MeshBasicMaterial({ color: 0x2a1c14 });
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), dark);
    eye.scale.set(1, 1.3, 0.5); eye.position.set(sx * 0.15, 0.0, -0.375); head.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(sx * 0.15 + 0.015, 0.025, -0.395); head.add(shine);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.06, 14), new THREE.MeshBasicMaterial({ color: 0xff9aa2, transparent: true, opacity: 0.7 }));
    cheek.position.set(sx * 0.25, -0.1, -0.335); cheek.rotation.y = Math.PI + sx * 0.55; head.add(cheek);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), toon(C.skin)); ear.position.set(sx * 0.4, -0.02, 0.02); head.add(ear);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 14, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8a3b2a }));
  smile.rotation.z = Math.PI; smile.position.set(0, -0.12, -0.385); head.add(smile);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), toon(0xf0b088)); nose.position.set(0, -0.04, -0.4); head.add(nose);
  // 버킷햇
  const hat = new THREE.Group(); hat.position.y = 0.12; head.add(hat);
  const hatMat = toon(C.hat, { side: THREE.DoubleSide });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.43, 0.3, 24), hatMat); crown.position.y = 0.2; hat.add(crown);
  const top = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), hatMat); top.rotation.x = -Math.PI / 2; top.position.y = 0.351; hat.add(top);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.76, 0.2, 30, 1, true), hatMat); brim.position.y = 0.0; hat.add(brim); // 아래로 처진 버킷햇 챙
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.435, 0.07, 24), toon(C.navy)); band.position.y = 0.12; hat.add(band);
  for (const [x, y, col] of [[0.28, 0.2, 0xff4757], [0.36, 0.14, 0xffffff]]) { // 모자에 꽂은 루어
    const lure = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), toon(col)); lure.position.set(x, y, -0.18); hat.add(lure);
  }

  // ---- 팔·다리: 어깨·골반 피벗
  const sleeve = toon(C.navy), pants = toon(C.pants);
  const arm = (sx) => {
    const p = new THREE.Group(); p.position.set(sx * 0.43, 1.2, 0);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 4, 10), sleeve); m.position.y = -0.2; p.add(m);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), toon(C.vestDark)); cuff.position.y = -0.37; p.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), toon(C.skin)); hand.position.y = -0.46; p.add(hand);
    body.add(p); p.userData.hand = hand; return p;
  };
  const armL = arm(-1), armR = arm(1);
  const leg = (sx) => {
    const p = new THREE.Group(); p.position.set(sx * 0.17, 0.62, 0);
    const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.2, 4, 10), pants); th.position.y = -0.17; p.add(th);
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.15), toon(C.pantsDark)); pocket.position.set(sx * 0.12, -0.2, 0); p.add(pocket);
    const flapP = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.04, 0.16), toon(C.pants)); flapP.position.set(sx * 0.125, -0.12, 0); p.add(flapP);
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.155, 0.3, 14), toon(C.boot)); boot.position.y = -0.45; p.add(boot);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.15, 0.06, 14), toon(C.bootTop)); cuff.position.y = -0.3; p.add(cuff);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), toon(C.boot)); toe.scale.set(1, 0.7, 1.25); toe.position.set(0, -0.54, -0.07); p.add(toe);
    const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.05, 14), toon(C.sole)); sole.position.set(0, -0.6, -0.03); sole.scale.z = 1.35; p.add(sole);
    body.add(p); return p;
  };
  const legL = leg(-1), legR = leg(1);

  // ---- 낚싯대: 오른손에 쥐고, 어깨 뒤로 비스듬히 멘다. 줄 끝에는 찌가 달려 있다.
  const rod = new THREE.Group();
  armR.userData.hand.add(rod);
  const dWorld = new THREE.Vector3(0.28, 0.82, 0.5).normalize();
  const dLocal = dWorld.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), -1.0); // 팔이 앞으로 1.0 돌아가 있을 때 기준
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dLocal);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 10), toon(C.cork)); grip.position.y = -0.04; rod.add(grip);
  const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 12), toon(0xcfd6e0)); reel.rotation.z = Math.PI / 2; reel.position.set(0.07, 0.12, 0); rod.add(reel);
  const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 1.0, 8), toon(C.rod)); seg1.position.y = 0.67; rod.add(seg1);
  const bendJoint = new THREE.Group(); bendJoint.position.y = 1.17; rod.add(bendJoint);
  const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.022, 1.0, 8), toon(0xd8412f)); seg2.position.y = 0.5; bendJoint.add(seg2);
  const rodTip = new THREE.Object3D(); rodTip.position.y = 1.0; bendJoint.add(rodTip);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -1, 0)]);
  const line = new THREE.Line(lineGeo, lineMat); line.frustumCulled = false; root.add(line);
  const bobber = new THREE.Group();
  const bTop = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xff4757));
  const bBot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon(0xffffff));
  bobber.add(bTop, bBot); root.add(bobber);

  // ---- 그림자, 레벨업 반짝이
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; root.add(shadow);
  const sparkle = new THREE.Group(); root.add(sparkle);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0 });
  const sparks = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), sparkMat); sparkle.add(m); sparks.push(m);
  }
  sparkle.visible = false;

  let phase = 0, t = 0;
  const tmp = new THREE.Vector3();
  const set = (a, x, y, z) => a.rotation.set(x, y, z);

  function update(dt, s) {
    t += dt;
    const rate = 9 + (s.speed || 14) * 0.35;
    phase += dt * rate;
    const sw = Math.sin(phase);
    let bend = 0.05 + sw * 0.03; // 낚싯대 휘어짐

    if (s.hitTimer > 0) {
      const k = Math.min(1, s.hitTimer);
      body.rotation.x = 0.7 * k; body.rotation.y = Math.sin(s.hitTimer * 14) * 0.6 * k; body.position.y = 0;
      set(armL, -1.0 * k, 0, -2.0 * k); set(armR, 0.2, 0, 2.0 * k);
      legL.rotation.x = -0.5 * k; legR.rotation.x = 0.5 * k; bend = 0.5;
    } else if (s.pull) {
      // 대어! 낚싯대를 두 손으로 힘껏 당긴다
      const k = 0.5 + 0.5 * Math.sin(t * 16);
      body.rotation.set(0.38 + k * 0.1, 0, 0); body.position.y = 0.02;
      set(armR, 2.1 + k * 0.25, 0, -0.1); set(armL, 1.8 + k * 0.25, 0, 0.35);
      legL.rotation.x = -0.35; legR.rotation.x = 0.3; bend = 0.95 + k * 0.2;
    } else if (s.airborne) {
      body.rotation.set(-0.1, 0, 0); body.position.y = 0;
      set(armL, 2.6, 0, 0.3); set(armR, 2.3, 0, -0.2);
      legL.rotation.x = 1.0; legR.rotation.x = -0.7; bend = 0.3;
    } else if (s.promote || s.victory) {
      // 레벨업/승리: 두 팔을 번쩍 들고 폴짝폴짝
      body.rotation.set(-0.05, Math.sin(t * 5) * 0.25, 0); body.position.y = Math.abs(Math.sin(t * 7)) * 0.2;
      set(armL, 2.9, 0, 0.45); set(armR, 2.9, 0, -0.45);
      legL.rotation.x = Math.sin(t * 7) * 0.3; legR.rotation.x = -Math.sin(t * 7) * 0.3; bend = 0.4;
    } else if (s.idle) {
      body.rotation.set(0, 0, 0); body.position.y = Math.sin(t * 2) * 0.012;
      set(armL, 0.05, 0, 0.1); set(armR, 1.0, 0, -0.1); legL.rotation.x = 0; legR.rotation.x = 0;
    } else {
      body.rotation.set(-0.15, 0, 0);
      legL.rotation.x = sw * 1.1; legR.rotation.x = -sw * 1.1;
      set(armL, -sw * 1.2, 0, 0.12);
      set(armR, 1.0 + Math.sin(phase * 2) * 0.05, 0, -0.1);
      body.position.y = Math.abs(Math.cos(phase)) * 0.1;
      if (s.cheerTimer > 0 || s.coinTimer > 0) set(armL, 2.8, 0, 0.4); // 정답·코인: 한 팔을 번쩍
    }
    head.rotation.z = -(s.lean || 0) * 0.3;
    body.rotation.z = -(s.lean || 0) * 0.35;
    bendJoint.rotation.x = bend; // 낚싯대가 휜다

    // 낚싯줄: 대 끝에서 아래로 늘어진다 (대어를 잡는 동안은 게임 쪽에서 물고기에 연결한다)
    rodTip.getWorldPosition(tmp); root.worldToLocal(tmp);
    const sway = Math.sin(t * 4) * 0.05;
    const p = lineGeo.attributes.position;
    p.setXYZ(0, tmp.x, tmp.y, tmp.z);
    p.setXYZ(1, tmp.x + sway, tmp.y - 0.85, tmp.z + 0.1);
    p.needsUpdate = true;
    bobber.position.set(tmp.x + sway, tmp.y - 0.85, tmp.z + 0.1);

    // 레벨업·승급 반짝이
    const sp = !!(s.promote || s.victory);
    sparkle.visible = sp;
    if (sp) sparks.forEach((m, i) => {
      const a = t * 2.2 + (i / sparks.length) * Math.PI * 2;
      m.position.set(Math.cos(a) * 0.85, 1.1 + Math.sin(t * 3 + i) * 0.7 + 0.3, Math.sin(a) * 0.85);
      m.rotation.y = t * 4; m.scale.setScalar(0.7 + 0.5 * Math.sin(t * 6 + i));
    });

    const h = root.position.y;
    shadow.position.y = 0.02 - h;
    shadow.scale.setScalar(Math.max(0.4, 1 - h * 0.25));
  }

  return { object: root, update, rodTip, setBelt() {}, head };
}
