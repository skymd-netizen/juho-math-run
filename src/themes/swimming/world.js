// 수영왕 배경: 야외 수영장. 세 레인을 헤엄쳐 가고, 레인 줄(부이)이 양옆을 지나간다.
// 물가에는 타일 바닥, 파라솔, 야자수, 안전요원 의자가 있고 머리 위로는 깃발 줄이 지나간다.
import * as THREE from 'three';
import { LANE_W, ROAD_W } from '../../world.js';

const SPAN = 160;
const toon = (c) => new THREE.MeshToonMaterial({ color: c });
const basic = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, ...extra });
const rnd = (a, b) => a + Math.random() * (b - a);

function skyTexture() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#2f9cff'); grd.addColorStop(0.55, '#a6e4ff'); grd.addColorStop(1, '#fff6d6');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createSwimWorld(scene) {
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0xc9ecff, 60, 150);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8fd0ff, 1.55));
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.5); sun.position.set(6, 12, 8); scene.add(sun);

  const scrollers = [];
  const add = (o) => { scene.add(o); scrollers.push(o); return o; };
  const POOL_HALF = ROAD_W / 2 + 0.1;      // 수영장 폭의 절반 (바깥 레인 줄 위치)

  // 수영장 물 + 바닥의 레인 선
  const water = new THREE.Mesh(new THREE.PlaneGeometry(POOL_HALF * 2, 400), basic(0x37c2ee));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0, -150); scene.add(water);
  const lineMat = basic(0x1c6fc0, { transparent: true, opacity: 0.55 });
  for (const x of [-LANE_W, 0, LANE_W]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 400), lineMat);
    l.rotation.x = -Math.PI / 2; l.position.set(x, 0.012, -150); scene.add(l);
  }
  for (let i = 0; i < SPAN / 20; i++) { // 바닥의 가로 줄(T자 표시)
    const t = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.35), lineMat);
    t.rotation.x = -Math.PI / 2; t.position.set(0, 0.013, 10 - i * 20); add(t);
  }
  // 물빛 일렁임(햇빛 무늬): 흰 조각이 흘러간다
  const glintGeo = new THREE.PlaneGeometry(0.9, 0.16);
  const glintMat = basic(0xffffff, { transparent: true, opacity: 0.45 });
  for (let i = 0; i < 120; i++) {
    const g = new THREE.Mesh(glintGeo, glintMat);
    g.rotation.x = -Math.PI / 2; g.position.set(rnd(-POOL_HALF + 0.3, POOL_HALF - 0.3), 0.02, 10 - Math.random() * SPAN);
    g.scale.x = rnd(0.5, 2); add(g);
  }

  // 레인 줄: 빨강·흰색·파랑 부이가 이어진 줄 (레인 사이 2개 + 바깥 2개)
  const buoyGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.42, 10);
  const buoyMats = [toon(0xff4757), toon(0xffffff), toon(0x2f86e6), toon(0xffffff)];
  const ropeXs = [-1.5 * LANE_W, -0.5 * LANE_W, 0.5 * LANE_W, 1.5 * LANE_W];
  for (const x of ropeXs) {
    const cable = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 400), basic(0xffffff));
    cable.position.set(x, 0.12, -150); scene.add(cable);
    for (let i = 0; i < SPAN / 0.7; i++) {
      const m = new THREE.Mesh(buoyGeo, buoyMats[Math.floor(i / 6) % 4]);
      m.rotation.z = Math.PI / 2; m.position.set(x, 0.1, 10 - i * 0.7); add(m);
    }
  }

  // 수영장 벽과 타일 바닥(물가)
  const wallH = 0.5;
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, wallH, 400), toon(0x2f86e6));
    wall.position.set(s * (POOL_HALF + 0.35), wallH / 2 - 0.12, -150); scene.add(wall);
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(60, 400), toon(0xf4e7cf));
    deck.rotation.x = -Math.PI / 2; deck.position.set(s * (POOL_HALF + 0.6 + 30), wallH - 0.12, -150); scene.add(deck);
    // 타일 줄무늬
    const tileGeo = new THREE.PlaneGeometry(60, 0.18);
    for (let i = 0; i < SPAN / 3; i++) {
      const t = new THREE.Mesh(tileGeo, basic(0xd8c6a3));
      t.rotation.x = -Math.PI / 2; t.position.set(s * (POOL_HALF + 0.6 + 30), wallH - 0.11, 10 - i * 3); add(t);
    }
  }
  const DECK_Y = wallH - 0.12;

  // 물가 소품: 파라솔, 야자수, 안전요원 의자, 공
  const umbrellaCols = [0xff4757, 0xffd23f, 0x2ed573, 0x1e90ff, 0xff7eb6];
  const makeUmbrella = () => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), toon(0xffffff)); pole.position.y = 1.2; g.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 10), toon(umbrellaCols[Math.floor(Math.random() * 5)])); top.position.y = 2.6; g.add(top);
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 1.5), toon(0xffffff)); chair.position.set(0.2, 0.18, 1.1); chair.rotation.x = -0.25; g.add(chair);
    return g;
  };
  const makePalm = () => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3.2, 8), toon(0x9b6a3c)); trunk.position.y = 1.6; trunk.rotation.z = rnd(-0.12, 0.12); g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.2, 5), toon(0x2ecc71));
      leaf.position.set(Math.cos(i) * 0.9, 3.3, Math.sin(i) * 0.9); leaf.rotation.z = Math.cos(i) * 1.1; leaf.rotation.x = -Math.sin(i) * 1.1; g.add(leaf);
    }
    return g;
  };
  const makeGuard = () => {
    const g = new THREE.Group();
    for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), toon(0xffffff)); leg.position.set(x, 1.1, z); g.add(leg);
    }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 1.3), toon(0xff4757)); seat.position.y = 2.2; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.12), toon(0xff4757)); back.position.set(0, 2.65, 0.6); g.add(back);
    return g;
  };
  const makeBall = () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), toon([0xff4757, 0xffd23f, 0x1e90ff][Math.floor(Math.random() * 3)]));
    m.position.y = 0.45; return m;
  };
  for (let i = 0; i < 34; i++) for (const s of [-1, 1]) {
    const r = Math.random();
    const o = r < 0.4 ? makeUmbrella() : r < 0.62 ? makePalm() : r < 0.74 ? makeGuard() : makeBall();
    o.position.set(s * (POOL_HALF + 2.4 + Math.random() * 12), DECK_Y, 10 - i * (SPAN / 34) - Math.random() * 3);
    o.rotation.y = Math.random() * Math.PI;
    add(o);
  }

  // 머리 위 깃발 줄 (배영 구간 표시): 일정한 간격으로 지나간다
  const flagColors = [0xff4757, 0xffd23f, 0x2ed573, 0x1e90ff, 0xff7eb6];
  for (let k = 0; k < 8; k++) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 6), toon(0xffffff)); p.position.set(s * (POOL_HALF + 0.9), DECK_Y + 2.2, 0); g.add(p); }
    const rope = new THREE.Mesh(new THREE.BoxGeometry(POOL_HALF * 2 + 1.8, 0.03, 0.03), basic(0xffffff)); rope.position.y = DECK_Y + 4.3; g.add(rope);
    for (let i = 0; i < 16; i++) {
      const tri = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 3), toon(flagColors[i % 5]));
      tri.rotation.x = Math.PI; tri.position.set(-POOL_HALF + 0.5 + i * ((POOL_HALF * 2 - 1) / 15), DECK_Y + 4.0, 0); g.add(tri);
    }
    g.position.z = 10 - k * (SPAN / 8); add(g);
  }

  // 먼 풍경: 관중석 건물과 구름, 해
  const stand = new THREE.Mesh(new THREE.BoxGeometry(150, 14, 10), basic(0xcfe0f2, { fog: false })); stand.position.set(0, 7, -158); scene.add(stand);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(154, 1.4, 12), basic(0x2f86e6, { fog: false })); roof.position.set(0, 14.6, -158); scene.add(roof);
  for (let i = 0; i < 60; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.5), basic([0xff4757, 0xffd23f, 0x2ed573, 0x1e90ff, 0xffffff, 0xff7eb6][i % 6], { fog: false }));
    p.position.set(-70 + (i % 30) * 4.8, 4 + Math.floor(i / 30) * 4, -152.6); scene.add(p);
  }
  const sunM = new THREE.Mesh(new THREE.CircleGeometry(8, 32), basic(0xfff0a0, { fog: false })); sunM.position.set(40, 40, -165); scene.add(sunM);
  const clouds = [];
  const cloudMat = basic(0xffffff, { fog: false });
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 1.5, 10, 8), cloudMat); p.position.set(k * 2.4 - 3.6, Math.random() * 1.2, 0); g.add(p); }
    g.position.set(-90 + Math.random() * 180, 26 + Math.random() * 14, -135 + Math.random() * 25); scene.add(g); clouds.push(g);
  }

  function update(dz, dt) {
    for (const o of scrollers) { o.position.z += dz; if (o.position.z > 14) o.position.z -= SPAN; }
    for (const c of clouds) { c.position.x += dt * 0.8; if (c.position.x > 100) c.position.x = -100; }
  }
  return { update };
}
