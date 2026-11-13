// 낚시 테마의 배경: 물 위로 길게 뻗은 나무 부두를 달린다. 낚시터(연못·시냇가·강·호수·바다·심해)마다 하늘·물·소품이 달라진다.
import * as THREE from 'three';
import { LANE_W, ROAD_W } from '../../world.js';
import { makeFishMesh } from './fishart.js';
import { speciesById } from './data.js';

const SPAN = 160;
const WATER_Y = -0.9;
const toon = (color) => new THREE.MeshToonMaterial({ color });
const rnd = (a, b) => a + Math.random() * (b - a);

const SPOT_LOOK = {
  pond: { sky: ['#4fb3ff', '#a8e6ff', '#fff1c9'], water: 0x58c9ad, ripple: 0xc9fff0, fog: 0xd6f4ee, hill: [0x7bd66a, 0x58c48c, 0x9be07a], sun: 0xfff0a0, hemi: [0xffffff, 0x6fbf8a], props: ['lily', 'reed', 'buoy'] },
  creek: { sky: ['#5cc0ff', '#b4ecff', '#fff6d5'], water: 0x4cc6ea, ripple: 0xd9f7ff, fog: 0xd9f4ff, hill: [0x6fcf7a, 0x4fb38a, 0xa5e08a], sun: 0xfff0a0, hemi: [0xffffff, 0x6fb7c9], props: ['rock', 'reed', 'buoy'] },
  river: { sky: ['#4aa8f0', '#9fd8ff', '#ffe9b8'], water: 0x3a9fd8, ripple: 0xcdeeff, fog: 0xcbe8fb, hill: [0x5fb865, 0x3f9d77, 0x8ed06f], sun: 0xffe08a, hemi: [0xffffff, 0x5f9fc0], props: ['isle', 'reed', 'buoy'] },
  lake: { sky: ['#3f8cf0', '#8cc6ff', '#ffe3c0'], water: 0x2f7fd0, ripple: 0xbfe0ff, fog: 0xc3defa, hill: [0x7a93c9, 0x6b86bd, 0x9bb0dc], sun: 0xffd98a, hemi: [0xffffff, 0x4f84bd], props: ['isle', 'boat', 'buoy'], peaks: true },
  sea: { sky: ['#2f8be8', '#79c0ff', '#ffd9a6'], water: 0x1d78c9, ripple: 0xb5dcff, fog: 0xbcdcf7, hill: [], sun: 0xffc971, hemi: [0xffffff, 0x3f7fb8], props: ['sail', 'buoy', 'rock'] },
  deep: { sky: ['#1e1450', '#6a3fa0', '#ff9d6b'], water: 0x1a2f6e, ripple: 0x6f8cff, fog: 0x4a3a86, hill: [0x2a2160, 0x35297a], sun: 0xffb36b, hemi: [0xc9b8ff, 0x24206a], props: ['orb', 'rock', 'buoy'], peaks: true },
};

function skyTexture([top, mid, bot]) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, top); grd.addColorStop(0.55, mid); grd.addColorStop(1, bot);
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createFishingWorld(scene, spotId = 'pond') {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6fbf8a, 1.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.6); sun.position.set(6, 12, 8); scene.add(sun);

  const scrollers = [];   // 항상 있는 것 (부두, 물결)
  let dyn = [];           // 낚시터마다 바뀌는 것 (소품, 먼 풍경)
  let dynGroup = null;

  // 물
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x58c9ad });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(0, WATER_Y, -150); scene.add(water);
  const rippleGeo = new THREE.BoxGeometry(2.2, 0.02, 0.14);
  const rippleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(rippleGeo, rippleMat);
    const s = Math.random() < 0.5 ? -1 : 1;
    m.position.set(s * rnd(ROAD_W / 2 + 1.5, 34), WATER_Y + 0.02, 10 - Math.random() * SPAN);
    m.scale.x = rnd(0.6, 2); scene.add(m); scrollers.push(m);
  }

  // 부두 바닥: 판자가 일정하게 이어진다
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 400), toon(0xb9854f));
  deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0, -150); scene.add(deck);
  const plankGeo = new THREE.BoxGeometry(ROAD_W, 0.05, 1.5);
  const plankA = toon(0xc9965c), plankB = toon(0xae7a47);
  for (let i = 0; i < SPAN / 1.6; i++) {
    const m = new THREE.Mesh(plankGeo, i % 2 ? plankA : plankB);
    m.position.set(0, 0.02, 10 - i * 1.6); scene.add(m); scrollers.push(m);
  }
  // 차선 표시: 밧줄 점선
  const dashGeo = new THREE.BoxGeometry(0.16, 0.03, 2.0);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6 });
  for (let i = 0; i < SPAN / 5; i++) for (const s of [-0.5, 0.5]) {
    const m = new THREE.Mesh(dashGeo, dashMat);
    m.position.set(s * LANE_W, 0.07, 10 - i * 5); scene.add(m); scrollers.push(m);
  }
  // 난간: 긴 가로대 + 기둥, 기둥 위에는 줄 달린 등
  const railX = ROAD_W / 2 + 0.2;
  const woodDark = toon(0x7a4f28), woodMid = toon(0x93602f);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 400), woodMid);
    rail.position.set(s * railX, 0.95, -150); scene.add(rail);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 400), woodMid);
    rail2.position.set(s * railX, 0.5, -150); scene.add(rail2);
  }
  const postGeo = new THREE.BoxGeometry(0.24, 1.15, 0.24);
  const capGeo = new THREE.SphereGeometry(0.17, 10, 8);
  for (let i = 0; i < SPAN / 4; i++) for (const s of [-1, 1]) {
    const g = new THREE.Group();
    const p = new THREE.Mesh(postGeo, woodDark); p.position.y = 0.52; g.add(p);
    const c = new THREE.Mesh(capGeo, i % 2 ? toon(0xff6b6b) : toon(0xfff3d6)); c.position.y = 1.2; g.add(c);
    g.position.set(s * railX, 0, 10 - i * 4); scene.add(g); scrollers.push(g);
  }

  // ---- 낚시터별 소품
  const makeProp = (kind) => {
    const g = new THREE.Group();
    if (kind === 'buoy') {
      const a = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xff4757));
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon(0xffffff));
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), toon(0x555555)); pole.position.y = 0.55;
      a.position.y = WATER_Y + 0.12; b.position.y = WATER_Y + 0.12; pole.position.y = WATER_Y + 0.6;
      g.add(a, b, pole);
    } else if (kind === 'lily') {
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const pad = new THREE.Mesh(new THREE.CircleGeometry(rnd(0.5, 0.9), 14), toon(0x3fae5a)); pad.rotation.x = -Math.PI / 2;
        pad.position.set(rnd(-1.2, 1.2), WATER_Y + 0.04, rnd(-1.2, 1.2)); g.add(pad);
        if (Math.random() < 0.5) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), toon(0xff8fc0)); f.position.set(pad.position.x, WATER_Y + 0.14, pad.position.z); g.add(f); }
      }
    } else if (kind === 'reed') {
      for (let i = 0; i < 6; i++) {
        const r = new THREE.Mesh(new THREE.ConeGeometry(0.07, rnd(1.4, 2.4), 5), toon(i % 2 ? 0x6bb84a : 0x4f9a3a));
        r.position.set(rnd(-0.5, 0.5), WATER_Y + 0.8, rnd(-0.5, 0.5)); r.rotation.z = rnd(-0.15, 0.15); g.add(r);
        if (i % 3 === 0) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 6), toon(0x7a4f28)); t.position.set(r.position.x, WATER_Y + 1.7, r.position.z); g.add(t); }
      }
    } else if (kind === 'rock') {
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.7, 1.5)), toon(0x8d96a5));
      r.position.y = WATER_Y + 0.2; r.scale.y = 0.7; r.rotation.set(Math.random(), Math.random(), 0); g.add(r);
    } else if (kind === 'isle') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x7ed957)); m.position.y = WATER_Y - 0.1; m.scale.y = 0.5; g.add(m);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.3, 7), toon(0x9b6a3c)); tr.position.y = WATER_Y + 0.9; g.add(tr);
      const lf = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), toon(0x2ecc71)); lf.position.y = WATER_Y + 2.0; g.add(lf);
    } else if (kind === 'boat') {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 2.6), toon(0xd9534f)); hull.position.y = WATER_Y + 0.15; g.add(hull);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.1, 2.66), toon(0xfff3d6)); rim.position.y = WATER_Y + 0.4; g.add(rim);
    } else if (kind === 'sail') {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 3.2), toon(0xfff3d6)); hull.position.y = WATER_Y + 0.15; g.add(hull);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6), toon(0x7a4f28)); mast.position.y = WATER_Y + 2.0; g.add(mast);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 3.1); sh.lineTo(1.7, 0.2); sh.closePath();
      const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshToonMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      sail.rotation.y = Math.PI / 2; sail.position.set(0.04, WATER_Y + 0.6, 0.1); g.add(sail);
    } else if (kind === 'orb') {
      const cols = [0x7affd9, 0xff8fe0, 0xfff08a];
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshBasicMaterial({ color: cols[Math.floor(Math.random() * 3)] }));
      o.position.y = WATER_Y + rnd(1.2, 3.2); o.userData.bob = Math.random() * 6; g.add(o);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), new THREE.MeshBasicMaterial({ color: o.material.color, transparent: true, opacity: 0.22, depthWrite: false }));
      halo.position.copy(o.position); g.add(halo);
    }
    return g;
  };

  function buildSpot(id) {
    const look = SPOT_LOOK[id] || SPOT_LOOK.pond;
    if (dynGroup) scene.remove(dynGroup);
    dyn = []; dynGroup = new THREE.Group(); scene.add(dynGroup);

    scene.background = skyTexture(look.sky);
    scene.fog = new THREE.Fog(look.fog, 60, 150);
    waterMat.color.set(look.water);
    rippleMat.color.set(look.ripple);
    hemi.color.set(look.hemi[0]); hemi.groundColor.set(look.hemi[1]);
    sun.color.set(id === 'deep' ? 0xffb0d0 : 0xfff2cc); sun.intensity = id === 'deep' ? 1.1 : 1.6;

    // 소품: 부두 양옆의 물 위에 흩어 놓는다
    const kinds = look.props;
    for (let i = 0; i < 40; i++) for (const s of [-1, 1]) {
      const kind = kinds[(i + (s > 0 ? 1 : 0)) % kinds.length];
      const g = makeProp(Math.random() < 0.35 ? 'buoy' : kind);
      g.position.set(s * (ROAD_W / 2 + 2 + Math.random() * (kind === 'sail' || kind === 'boat' ? 20 : 11)), 0, 10 - i * (SPAN / 40) - Math.random() * 3);
      if (kind === 'sail' || kind === 'boat') g.position.x += s * 4;
      dynGroup.add(g); dyn.push(g);
    }
    // 먼 풍경: 언덕·산·섬, 해(또는 노을)
    look.hill.forEach((col, i) => {
      for (let k = 0; k < 4; k++) {
        const r = 18 + Math.random() * 16;
        const geo = look.peaks ? new THREE.ConeGeometry(r * 0.8, r * 1.6, 7) : new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
        const h = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, fog: false }));
        h.position.set(-120 + (i * 4 + k) * (240 / (look.hill.length * 4)) + Math.random() * 10, look.peaks ? r * 0.7 - 6 : -4, -150);
        if (!look.peaks) h.scale.y = 0.6;
        dynGroup.add(h);
      }
    });
    const sunMesh = new THREE.Mesh(new THREE.CircleGeometry(id === 'deep' ? 14 : 9, 32), new THREE.MeshBasicMaterial({ color: look.sun, fog: false }));
    sunMesh.position.set(id === 'deep' ? -20 : 34, id === 'deep' ? 6 : 26, -160); dynGroup.add(sunMesh);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(id === 'deep' ? 24 : 16, 32), new THREE.MeshBasicMaterial({ color: look.sun, fog: false, transparent: true, opacity: 0.28 }));
    halo.position.set(sunMesh.position.x, sunMesh.position.y, -161); dynGroup.add(halo);
  }

  // 구름
  const clouds = [];
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 1.5, 10, 8), cloudMat);
      p.position.set(k * 2.4 - 3.6, Math.random() * 1.2, 0); g.add(p);
    }
    g.position.set(-90 + Math.random() * 180, 22 + Math.random() * 16, -130 + Math.random() * 30);
    scene.add(g); clouds.push(g);
  }

  // ---- 물 위로 튀어 오르는 물고기(배경 연출)와 물결 고리
  const jumpers = [];
  const pool = ['pirami', 'crucian_s', 'carp_s', 'trout'].map(speciesById);
  const ringGeo = new THREE.RingGeometry(0.5, 0.62, 24);
  for (let i = 0; i < 4; i++) {
    const holder = new THREE.Group();
    const fish = makeFishMesh(THREE, pool[i % pool.length]);
    fish.scale.setScalar(0.9 + Math.random() * 0.5);
    holder.add(fish); holder.visible = false; scene.add(holder);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; scene.add(ring);
    jumpers.push({ holder, fish, ring, wait: rnd(0.3, 2.5), t: -1, dur: 0.9, h: 1.8, vx: 1.5, ringT: 9 });
  }

  function update(dz, dt) {
    for (const o of scrollers) { o.position.z += dz; if (o.position.z > 14) o.position.z -= SPAN; }
    for (const o of dyn) { o.position.z += dz; if (o.position.z > 14) o.position.z -= SPAN; }
    for (const c of clouds) { c.position.x += dt * 0.8; if (c.position.x > 100) c.position.x = -100; }
    const tt = performance.now() / 1000;
    for (const o of dyn) { const orb = o.children[0]; if (orb?.userData.bob !== undefined) { orb.position.y += Math.sin(tt * 2 + orb.userData.bob) * 0.004; } }
    for (const j of jumpers) {
      j.holder.position.z += dz; j.ring.position.z += dz;
      if (j.t < 0) {
        j.wait -= dt;
        if (j.wait <= 0) {
          const s = Math.random() < 0.5 ? -1 : 1;
          j.holder.position.set(s * rnd(ROAD_W / 2 + 2.5, 14), WATER_Y, rnd(-50, -6));
          j.vx = -s * rnd(1.2, 2.6) * (Math.random() < 0.5 ? 1 : -1);
          j.holder.rotation.y = j.vx < 0 ? Math.PI : 0;
          j.h = rnd(1.4, 2.6); j.dur = rnd(0.8, 1.1); j.t = 0; j.holder.visible = true;
          j.x0 = j.holder.position.x; j.y0 = WATER_Y;
        }
      } else {
        j.t += dt / j.dur;
        if (j.t >= 1) {
          j.t = -1; j.holder.visible = false; j.wait = rnd(1.2, 4);
          j.ring.position.set(j.holder.position.x, WATER_Y + 0.03, j.holder.position.z); j.ringT = 0;
        } else {
          const u = j.t;
          j.holder.position.y = WATER_Y + 4 * j.h * u * (1 - u);
          j.holder.position.x = j.x0 + j.vx * (u - 0.5) * 1.6;
          const vy = 4 * j.h * (1 - 2 * u), vx = Math.abs(j.vx) * 1.2;
          j.fish.rotation.z = Math.atan2(vy, vx);
        }
      }
      if (j.ringT < 1) {
        j.ringT += dt * 1.4;
        j.ring.scale.setScalar(0.4 + j.ringT * 2.4);
        j.ring.material.opacity = Math.max(0, 0.7 * (1 - j.ringT));
      }
    }
  }

  buildSpot(spotId);
  return { update, setSpot: buildSpot, WATER_Y };
}
