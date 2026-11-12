// 도로, 배경, 스크롤되는 장식물
import * as THREE from 'three';

export const LANE_W = 2.5;
export const ROAD_W = LANE_W * 3 + 0.6;
const SPAN = 160; // 스크롤 반복 구간 길이
const FAR = -140;

const toon = (color) => new THREE.MeshToonMaterial({ color });

function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#3fa9ff');
  grd.addColorStop(0.55, '#9fe0ff');
  grd.addColorStop(1, '#fff3c4');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createWorld(scene) {
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0xcdeeff, 60, 150);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x88cc66, 1.5));
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.6);
  sun.position.set(6, 12, 8);
  scene.add(sun);

  const scrollers = []; // z 방향으로 흐르다가 뒤로 가면 앞으로 되돌아가는 물체들

  // 잔디
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), toon(0x6fd34f));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.05, -100);
  scene.add(grass);

  // 도로
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 400), toon(0x5b5f8a));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, -150);
  scene.add(road);

  // 도로 가장자리 (빨강/흰색 줄무늬 연석)
  const curbGeo = new THREE.BoxGeometry(0.5, 0.25, 4);
  const curbA = toon(0xff4757), curbB = toon(0xffffff);
  for (let i = 0; i < SPAN / 4; i++) {
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(curbGeo, i % 2 ? curbA : curbB);
      m.position.set(s * (ROAD_W / 2 + 0.25), 0.1, 10 - i * 4);
      scene.add(m); scrollers.push(m);
    }
  }

  // 차선 점선
  const dashGeo = new THREE.BoxGeometry(0.18, 0.02, 2.2);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < SPAN / 5; i++) {
    for (const s of [-0.5, 0.5]) {
      const m = new THREE.Mesh(dashGeo, dashMat);
      m.position.set(s * LANE_W, 0.02, 10 - i * 5);
      scene.add(m); scrollers.push(m);
    }
  }

  // 잔디 줄무늬 (속도감)
  const stripeGeo = new THREE.PlaneGeometry(120, 8);
  const stripeMat = toon(0x5fc443);
  for (let i = 0; i < SPAN / 16; i++) {
    const m = new THREE.Mesh(stripeGeo, stripeMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, -0.03, 10 - i * 16);
    scene.add(m); scrollers.push(m);
  }

  // 나무 / 버섯 / 풍선 등 길가 장식
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.6, 8);
  const leafGeo = new THREE.SphereGeometry(1.3, 12, 10);
  const coneGeo = new THREE.ConeGeometry(1.2, 2.8, 10);
  const leafColors = [0x2ecc71, 0x27ae60, 0xff7eb6, 0xffb347, 0x38d9a9];
  const makeTree = () => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, toon(0x9b6a3c));
    trunk.position.y = 0.8;
    g.add(trunk);
    const color = leafColors[Math.floor(Math.random() * leafColors.length)];
    if (Math.random() < 0.5) {
      const l = new THREE.Mesh(leafGeo, toon(color)); l.position.y = 2.4; g.add(l);
      const l2 = new THREE.Mesh(leafGeo, toon(color)); l2.position.set(0.5, 3.2, 0.2); l2.scale.setScalar(0.7); g.add(l2);
    } else {
      const l = new THREE.Mesh(coneGeo, toon(color)); l.position.y = 2.8; g.add(l);
    }
    g.scale.setScalar(0.8 + Math.random() * 0.7);
    return g;
  };
  const makeMushroom = () => {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 10), toon(0xfff5e1));
    stem.position.y = 0.4; g.add(stem);
    const capM = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(Math.random() < 0.5 ? 0xff4757 : 0xa55eea));
    capM.position.y = 0.7; g.add(capM);
    return g;
  };
  for (let i = 0; i < 36; i++) {
    for (const s of [-1, 1]) {
      const obj = Math.random() < 0.75 ? makeTree() : makeMushroom();
      obj.position.set(s * (ROAD_W / 2 + 2.5 + Math.random() * 14), 0, 10 - i * (SPAN / 36) - Math.random() * 3);
      scene.add(obj); scrollers.push(obj);
    }
  }

  // 먼 산과 구름 (고정 배경)
  const hillColors = [0x7bd66a, 0x58c48c, 0x9be07a];
  for (let i = 0; i < 9; i++) {
    const r = 18 + Math.random() * 16;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: hillColors[i % 3], fog: false }));
    hill.position.set(-120 + i * 30 + Math.random() * 10, -4, -150);
    hill.scale.y = 0.6;
    scene.add(hill);
  }
  const clouds = [];
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 1.5, 10, 8), cloudMat);
      p.position.set(k * 2.4 - 3.6, Math.random() * 1.2, 0);
      g.add(p);
    }
    g.position.set(-90 + Math.random() * 180, 22 + Math.random() * 16, -130 + Math.random() * 30);
    scene.add(g); clouds.push(g);
  }

  function update(dz, dt) {
    for (const o of scrollers) {
      o.position.z += dz;
      if (o.position.z > 14) o.position.z -= SPAN;
    }
    for (const c of clouds) {
      c.position.x += dt * 0.8;
      if (c.position.x > 100) c.position.x = -100;
    }
  }

  return { update, FAR };
}

/** 숫자가 적힌 캔버스 텍스처 */
export function numberTexture(text, bg = '#3742fa') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 160);
  g.strokeStyle = '#fff'; g.lineWidth = 12;
  g.strokeRect(6, 6, 244, 148);
  g.fillStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const s = String(text);
  g.font = `bold ${s.length >= 3 ? 112 : 140}px "Gaegu", "Jua", "Arial Black", sans-serif`;
  g.lineJoin = 'round';
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.4)';
  g.strokeText(s, 128, 86);
  g.fillText(s, 128, 86);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
