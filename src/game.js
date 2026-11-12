// 게임 루프: 달리기, 차선 이동, 게이트 판정, 코인/하트, 콤보/부스트, 결과
import * as THREE from 'three';
import { createWorld, numberTexture, LANE_W, ROAD_W } from './world.js';
import { createPlayerCharacter } from './characters/index.js';
import { generateQuestion } from './mathgen.js';
import { sfx } from './audio.js';
import { ui } from './ui.js';

export const CONFIG = {
  totalQuestions: 20,
  maxHearts: 3,
  coinPerCorrect: 10,
  boostMult: 1.5,
  boostTime: 4.5,
  jumpVel: 9.5,
  gravity: 27,
};

// 문제 종류 (1단계 선택)
export const TOPICS = {
  add: { name: '더하기 마스터' },
  sub: { name: '빼기 마스터' },
  mul: { name: '구구단 마스터' },
  mix: { name: '수학 마스터' },
};

// 속도 (2단계 선택). speed: 시작 속도, gain: 후반으로 갈수록 빨라지는 양, gateDistance: 게이트 간격
export const SPEEDS = {
  slow: { name: '천천히', speed: 8, gain: 1.5, gateDistance: 62 },
  mid: { name: '중간', speed: 11.5, gain: 3, gateDistance: 78 },
  fast: { name: '빠르게', speed: 15, gain: 4.5, gateDistance: 90 },
};

const toon = (color) => new THREE.MeshToonMaterial({ color });
const GATE_COLORS = ['#a55eea', '#3742fa', '#ff9f1c'];

export function createGame(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
  const world = createWorld(scene);

  const player = createPlayerCharacter();
  scene.add(player.object);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- 상태 ----------
  const S = {
    mode: 'menu', // menu | playing | paused | ending | over
    lane: 1, x: 0, y: 0, vy: 0, airborne: false,
    speed: 6, hearts: 3, coins: 0, streak: 0, maxCombo: 0,
    correct: 0, wrong: 0, asked: 0, resolved: 0, time: 0,
    boostTimer: 0, hitTimer: 0, slowTimer: 0, cheerTimer: 0, shake: 0, endTimer: 0,
    cleared: false, question: null, topic: 'mix', pace: 'slow',
  };
  const L = () => SPEEDS[S.pace];
  const gates = [], coins = [], hurdles = [], particles = [];
  let finish = null;

  // ---------- 공용 지오메트리 ----------
  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.4, 10);
  const bannerGeo = new THREE.BoxGeometry(2.2, 1.35, 0.2);
  const curtainGeo = new THREE.PlaneGeometry(2.0, 2.4);
  const coinGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.09, 18);
  const coinMat = toon(0xffd23f);
  const partGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const partMats = {};
  const partMat = (c) => (partMats[c] ||= new THREE.MeshBasicMaterial({ color: c }));

  // 부스트 속도선
  const streaks = [];
  const streakMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 36; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 5), streakMat);
    m.position.set((Math.random() - 0.5) * 22, 0.4 + Math.random() * 6, -Math.random() * 90);
    m.visible = false;
    scene.add(m); streaks.push(m);
  }

  // ---------- 생성 ----------
  function spawnGate(dist = L().gateDistance) {
    const q = generateQuestion(S.asked, CONFIG.totalQuestions, S.topic);
    const f = dist / 85; // 게이트 간격에 맞춰 코인·허들 위치도 조정
    S.asked++;
    S.question = q;
    ui.setQuestion(q.text);
    ui.setProgress(S.resolved, CONFIG.totalQuestions);

    const group = new THREE.Group();
    const banners = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * LANE_W;
      const color = new THREE.Color(GATE_COLORS[i]);
      const postMat = toon(color);
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(postGeo, postMat);
        p.position.set(x + s * 1.08, 1.7, 0);
        group.add(p);
      }
      const side = toon(color);
      const face = new THREE.MeshBasicMaterial({ map: numberTexture(q.choices[i], GATE_COLORS[i]) });
      const banner = new THREE.Mesh(bannerGeo, [side, side, side, side, face, side]);
      banner.position.set(x, 3.35, 0);
      group.add(banner);
      banners.push(banner);
      const curtain = new THREE.Mesh(curtainGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
      curtain.position.set(x, 1.3, 0);
      group.add(curtain);
    }
    group.position.z = -dist;
    scene.add(group);
    gates.push({ group, banners, q, resolved: false });

    // 게이트 사이 구간: 코인 줄 + 허들
    const laneA = Math.floor(Math.random() * 3);
    for (let k = 0; k < 5; k++) spawnCoin(laneA, 0.9, -dist + 62 * f - k * 2.4);
    if (S.asked > 2) {
      const laneH = Math.floor(Math.random() * 3);
      spawnHurdle(laneH, -dist + 40 * f);
      [[1.5, 2], [2.1, 0], [1.5, -2]].forEach(([y, z]) => spawnCoin(laneH, y, -dist + 40 * f + z));
    }
    const laneB = (laneA + 1 + Math.floor(Math.random() * 2)) % 3;
    for (let k = 0; k < 4; k++) spawnCoin(laneB, 0.9, -dist + 26 * f - k * 2.4);
  }

  function spawnCoin(lane, y, z) {
    const m = new THREE.Mesh(coinGeo, coinMat);
    m.rotation.x = Math.PI / 2;
    m.position.set((lane - 1) * LANE_W, y, z);
    scene.add(m);
    coins.push(m);
  }

  function spawnHurdle(lane, z) {
    const g = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 0.22), toon(0xff4757));
    bar.position.y = 0.65; g.add(bar);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.2), toon(0xffffff));
    bar2.position.y = 0.4; g.add(bar2);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.8, 0.5), toon(0xffffff));
      leg.position.set(s * 0.95, 0.4, 0); g.add(leg);
    }
    g.position.set((lane - 1) * LANE_W, 0, z);
    scene.add(g);
    hurdles.push({ group: g, hit: false });
  }

  function spawnFinish() {
    const g = new THREE.Group();
    const c = document.createElement('canvas'); c.width = 512; c.height = 96;
    const x = c.getContext('2d');
    for (let i = 0; i < 16; i++) for (let j = 0; j < 3; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 32, j * 32, 32, 32); }
    x.fillStyle = '#ff2e63'; x.fillRect(136, 12, 240, 72);
    x.fillStyle = '#fff'; x.font = 'bold 60px "Gaegu", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('도착!', 256, 50);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const banner = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 1, 1.6, 0.25), new THREE.MeshBasicMaterial({ map: tex }));
    banner.position.y = 4.4; g.add(banner);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5.2, 12), toon(0xffd23f));
      p.position.set(s * (ROAD_W / 2 + 0.3), 2.6, 0); g.add(p);
    }
    g.position.z = -70;
    scene.add(g);
    finish = g;
    ui.setQuestion('🏁 도착 지점까지 달려요!');
    ui.setProgress(CONFIG.totalQuestions, CONFIG.totalQuestions);
  }

  function burst(x, y, z, colors, n = 18, power = 6) {
    for (let i = 0; i < n && particles.length < 260; i++) {
      const m = new THREE.Mesh(partGeo, partMat(colors[i % colors.length]));
      m.position.set(x, y, z);
      scene.add(m);
      particles.push({
        m, life: 0.7 + Math.random() * 0.6,
        v: new THREE.Vector3((Math.random() - 0.5) * power, Math.random() * power * 0.9 + 2, (Math.random() - 0.5) * power),
      });
    }
  }

  function clearAll() {
    for (const g of gates) scene.remove(g.group);
    for (const c of coins) scene.remove(c);
    for (const h of hurdles) scene.remove(h.group);
    for (const p of particles) scene.remove(p.m);
    if (finish) scene.remove(finish);
    gates.length = coins.length = hurdles.length = particles.length = 0;
    finish = null;
  }

  // ---------- 판정 ----------
  function addCoins(n) { S.coins += n; ui.setCoins(S.coins); }

  function onCorrect(gate, lane) {
    S.correct++; S.streak++;
    S.maxCombo = Math.max(S.maxCombo, S.streak);
    addCoins(CONFIG.coinPerCorrect);
    S.cheerTimer = 0.6;
    gate.banners[lane].material[4].map = numberTexture(gate.q.answer, '#2ed573');
    burst(S.x, 1.6, 0, [0xffd23f, 0xffffff, 0x2ed573], 22);
    sfx.correct();
    ui.setCombo(S.streak);

    if (S.streak % 10 === 0) {
      // 10연속: 특별 보상
      addCoins(50);
      if (S.hearts < CONFIG.maxHearts) { S.hearts++; ui.setHearts(S.hearts, CONFIG.maxHearts); }
      S.boostTimer = CONFIG.boostTime;
      burst(S.x, 2, -2, [0xff4757, 0xffd23f, 0x2ed573, 0x1e90ff, 0xa55eea, 0xff7eb6], 90, 11);
      ui.flash('gold'); ui.toast(`🌈 ${S.streak}연속! 슈퍼 보너스 +50`); sfx.special();
    } else if (S.streak % 5 === 0) {
      addCoins(20);
      burst(S.x, 2, -1, [0xffd23f, 0xffe066], 40, 8);
      ui.toast(`💰 ${S.streak}연속! 보너스 +20`); sfx.bonus();
    } else if (S.streak % 3 === 0) {
      S.boostTimer = CONFIG.boostTime;
      ui.toast('⚡ 스피드 부스트!'); sfx.boost();
    } else {
      ui.toast('정답!');
    }
  }

  function onWrong(gate, lane) {
    S.wrong++; S.streak = 0; S.hearts--;
    S.boostTimer = 0; S.hitTimer = 1.0; S.shake = 0.5;
    ui.setHearts(S.hearts, CONFIG.maxHearts);
    ui.setCombo(0);
    ui.flash('red');
    sfx.wrong();
    // 부딪힌 게이트는 쓰러지고, 정답 게이트는 초록색으로 알려 준다
    gate.fall = lane;
    gate.banners[gate.q.correctIndex].material[4].map = numberTexture(gate.q.answer, '#2ed573');
    burst(S.x, 1.4, -0.5, [0xff4757, 0xffffff, 0x555555], 26, 7);
    ui.toast('틀림!', true);
  }

  function resolveGate(gate) {
    gate.resolved = true;
    const lane = THREE.MathUtils.clamp(Math.round(S.x / LANE_W) + 1, 0, 2);
    if (lane === gate.q.correctIndex) onCorrect(gate, lane); else onWrong(gate, lane);
    S.resolved++;
    if (S.hearts <= 0) { S.mode = 'ending'; S.endTimer = 1.4; S.cleared = false; sfx.lose(); return; }
    if (S.resolved < CONFIG.totalQuestions) spawnGate(); else spawnFinish();
  }

  function finishGame() {
    S.mode = 'over';
    ui.hideFeedback();
    const total = S.correct + S.wrong;
    ui.showResult({
      cleared: S.cleared, time: S.time, total, correct: S.correct, wrong: S.wrong,
      accuracy: total ? Math.round((S.correct / total) * 100) : 0,
      coins: S.coins, maxCombo: S.maxCombo, topicName: TOPICS[S.topic].name, paceName: L().name,
    });
  }

  // ---------- 조작 ----------
  const api = {
    state: S,
    start(topic, pace) {
      clearAll();
      if (TOPICS[topic]) S.topic = topic;
      if (SPEEDS[pace]) S.pace = pace;
      Object.assign(S, {
        mode: 'playing', lane: 1, x: 0, y: 0, vy: 0, airborne: false, speed: 8,
        hearts: CONFIG.maxHearts, coins: 0, streak: 0, maxCombo: 0, correct: 0, wrong: 0,
        asked: 0, resolved: 0, time: 0, boostTimer: 0, hitTimer: 0, slowTimer: 0, cheerTimer: 0,
        shake: 0, endTimer: 0, cleared: false,
      });
      ui.setCoins(0); ui.setHearts(S.hearts, CONFIG.maxHearts); ui.setCombo(0);
      ui.hideFeedback(); ui.clearToast();
      ui.showScreen('game');
      ui.setLevel(TOPICS[S.topic].name);
      spawnGate(Math.min(70, L().gateDistance));
    },
    left() { if (S.mode === 'playing' && S.lane > 0) { S.lane--; sfx.lane(); } },
    right() { if (S.mode === 'playing' && S.lane < 2) { S.lane++; sfx.lane(); } },
    jump() {
      if (S.mode === 'playing' && !S.airborne && S.hitTimer <= 0) { S.airborne = true; S.vy = CONFIG.jumpVel; sfx.jump(); }
    },
    togglePause() {
      if (S.mode === 'playing') { S.mode = 'paused'; ui.showScreen('pause'); }
      else if (S.mode === 'paused') { S.mode = 'playing'; ui.showScreen('game'); }
    },
    toMenu() { clearAll(); S.mode = 'menu'; S.lane = 1; S.boostTimer = 0; S.hitTimer = 0; ui.showScreen('start'); },
  };

  // ---------- 업데이트 ----------
  function update(dt) {
    const playing = S.mode === 'playing' || S.mode === 'ending';
    if (S.mode === 'paused') return;

    if (S.mode === 'playing') S.time += dt;

    // 속도
    let target = 6;
    if (playing) {
      target = L().speed + L().gain * (S.resolved / CONFIG.totalQuestions);
      if (S.boostTimer > 0) target *= CONFIG.boostMult;
      if (S.hitTimer > 0) target *= 0.35;
      else if (S.slowTimer > 0) target *= 0.6;
      if (S.mode === 'ending' && !S.cleared) target = 0;
    }
    if (S.mode === 'over') target = S.cleared ? 5 : 0;
    S.speed += (target - S.speed) * Math.min(1, dt * 4);
    const dz = S.speed * dt;

    S.boostTimer = Math.max(0, S.boostTimer - dt);
    S.hitTimer = Math.max(0, S.hitTimer - dt);
    S.slowTimer = Math.max(0, S.slowTimer - dt);
    S.cheerTimer = Math.max(0, S.cheerTimer - dt);
    S.shake = Math.max(0, S.shake - dt);

    // 플레이어 이동
    const tx = (S.lane - 1) * LANE_W;
    const prevX = S.x;
    S.x += (tx - S.x) * Math.min(1, dt * 14);
    if (S.airborne) {
      S.vy -= CONFIG.gravity * dt;
      S.y += S.vy * dt;
      if (S.y <= 0) { S.y = 0; S.vy = 0; S.airborne = false; }
    }
    player.object.position.set(S.x, S.y, 0);
    player.update(dt, {
      speed: S.speed, airborne: S.airborne, hitTimer: S.hitTimer,
      cheerTimer: S.mode === 'over' && S.cleared ? 1 : S.cheerTimer,
      boost: S.boostTimer > 0, lean: THREE.MathUtils.clamp((S.x - prevX) / Math.max(dt, 0.001) / 10, -1, 1),
    });

    world.update(dz, dt);

    // 게이트
    for (let i = gates.length - 1; i >= 0; i--) {
      const g = gates[i];
      g.group.position.z += dz;
      if (g.fall !== undefined) {
        const b = g.banners[g.fall];
        b.rotation.x = Math.max(-1.4, b.rotation.x - dt * 5);
        b.position.y = Math.max(1.2, b.position.y - dt * 4);
      }
      if (!g.resolved && S.mode === 'playing' && g.group.position.z >= -0.4) resolveGate(g);
      if (g.group.position.z > 12) { scene.remove(g.group); gates.splice(i, 1); }
    }

    // 코인
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.position.z += dz;
      c.rotation.z += dt * 5;
      if (S.mode === 'playing' && Math.abs(c.position.z) < 0.9 && Math.abs(c.position.x - S.x) < 1.0 && Math.abs(c.position.y - (S.y + 0.9)) < 1.1) {
        addCoins(1); sfx.coin();
        burst(c.position.x, c.position.y, 0, [0xffd23f], 5, 3);
        scene.remove(c); coins.splice(i, 1);
        continue;
      }
      if (c.position.z > 10) { scene.remove(c); coins.splice(i, 1); }
    }

    // 허들 (점프로 넘는 장애물, 부딪히면 잠깐 느려진다)
    for (let i = hurdles.length - 1; i >= 0; i--) {
      const h = hurdles[i];
      h.group.position.z += dz;
      if (h.hit) h.group.rotation.x = Math.max(-1.5, h.group.rotation.x - dt * 8);
      if (!h.hit && S.mode === 'playing' && Math.abs(h.group.position.z) < 0.5 && Math.abs(h.group.position.x - S.x) < 1.0 && S.y < 0.55) {
        h.hit = true; S.slowTimer = 0.8; S.shake = 0.25; sfx.hurdle();
        burst(S.x, 0.6, -0.3, [0xffffff, 0xff4757], 10, 4);
      }
      if (h.group.position.z > 10) { scene.remove(h.group); hurdles.splice(i, 1); }
    }

    // 도착 지점
    if (finish) {
      finish.position.z += dz;
      if (S.mode === 'playing' && finish.position.z >= 0) {
        S.mode = 'ending'; S.cleared = true; S.endTimer = 1.6;
        sfx.win(); ui.toast('🎉 도착!'); ui.flash('gold');
        burst(S.x, 2.5, -2, [0xff4757, 0xffd23f, 0x2ed573, 0x1e90ff, 0xa55eea], 100, 12);
      }
    }

    if (S.mode === 'ending') {
      S.endTimer -= dt;
      if (S.endTimer <= 0) finishGame();
    }

    // 파티클
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.v.y -= 14 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.position.z += dz * 0.5;
      p.m.rotation.x += dt * 8; p.m.rotation.y += dt * 6;
      p.m.scale.setScalar(Math.max(0.01, Math.min(1, p.life * 2)));
      if (p.life <= 0) { scene.remove(p.m); particles.splice(i, 1); }
    }

    // 속도선
    const boosting = S.boostTimer > 0 && playing;
    for (const s of streaks) {
      s.visible = boosting;
      if (!boosting) continue;
      s.position.z += dz * 3;
      if (s.position.z > 8) { s.position.z = -90; s.position.x = (Math.random() - 0.5) * 22; }
    }

    // 카메라 (세로 화면에서는 더 넓게)
    const portrait = camera.aspect < 1;
    const fovT = (portrait ? 78 : 62) + (boosting ? 9 : 0);
    if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov += (fovT - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
    const sh = S.shake > 0 ? S.shake * 0.6 : 0;
    camera.position.set(S.x * 0.55 + (Math.random() - 0.5) * sh, (portrait ? 5.2 : 4.4) + (Math.random() - 0.5) * sh, portrait ? 8.5 : 7.2);
    camera.lookAt(S.x * 0.55, 0.9, -10);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 탭을 벗어나면 자동 일시정지
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.mode === 'playing') api.togglePause(); });

  api.step = update; // 테스트용
  return api;
}
