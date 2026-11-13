// 공통 게임 루프(테마별 캐릭터·배경·성장 규칙은 theme로 받는다): 달리기, 차선 이동, 게이트 판정, 코인/하트, 콤보/왕코인, 결과
import * as THREE from 'three';
import { numberTexture, LANE_W, ROAD_W } from './world.js';
import { generateQuestion } from './mathgen.js';
import { sfx } from './audio.js';
import { healStep, HEARTS } from './progress.js';
import { taekwondoTheme } from './themes/taekwondo.js';

export const CONFIG = {
  totalQuestions: 20,
  maxHearts: HEARTS.max,
  coinPerCorrect: 10,
  kingCoin: 20, // 3연속 정답마다 나타나는 왕코인 한 개의 값
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

/**
 * theme = { progress, ui, createWorld(scene), createCharacter(), syncGrowth(growth, player),
 *           makeHurdle?(THREE, toon), init?(game),
 *           hooks?: { onStart, onMenu, onCorrect, onWrong, onClear, update, finish } }
 * 기본값은 태권도 버전이다.
 */
export function createGame(canvas, theme = taekwondoTheme) {
  const { progress, ui } = theme;
  const hooks = theme.hooks || {};
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
  const world = theme.createWorld(scene);

  const player = theme.createCharacter();
  scene.add(player.object);

  function resize(w = window.innerWidth, h = window.innerHeight) {
    if (!(w > 0 && h > 0)) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', () => resize());
  resize();

  // ---------- 상태 ----------
  const S = {
    mode: 'menu', // menu | playing | paused | ending | over
    lane: 1, x: 0, y: 0, vy: 0, airborne: false,
    speed: 6, hearts: 3, coins: 0, streak: 0, maxCombo: 0,
    correct: 0, wrong: 0, asked: 0, resolved: 0, time: 0,
    hitTimer: 0, slowTimer: 0, cheerTimer: 0, coinTimer: 0, shake: 0, endTimer: 0, kingNext: false,
    cleared: false, question: null, topic: 'mix', pace: 'slow',
    earned: 0, runId: 0, settled: false, wrongList: [],
    promo: null, promoSwap: 0, promoFx: 0, promoK: 0, pullTimer: 0, celebrate: 0,
  };
  theme.syncGrowth(progress.growth(), player);
  const L = () => SPEEDS[S.pace];
  const gates = [], coins = [], hurdles = [], particles = [];
  let finish = null;
  // 테마 훅에 넘기는 도구 모음
  const ctx = {
    THREE, scene, camera, S, CONFIG, ui, progress, sfx, player, LANE_W, ROAD_W,
    burst: (...a) => burst(...a), addCoins: (n) => addCoins(n), persist: () => persist(), summary: () => summary(),
  };

  // ---------- 공용 지오메트리 ----------
  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.4, 10);
  const bannerGeo = new THREE.BoxGeometry(2.2, 1.35, 0.2);
  const curtainGeo = new THREE.PlaneGeometry(2.0, 2.4);
  const coinGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.09, 18);
  const coinMat = toon(0xffd23f);
  const partGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const partMats = {};
  const partMat = (c) => (partMats[c] ||= new THREE.MeshBasicMaterial({ color: c }));

  // 왕코인: 보통 코인보다 훨씬 크고 왕관이 그려져 있다
  const kingGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.16, 28);
  const kingFace = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#ffb300'; x.fillRect(0, 0, 256, 256);
    x.beginPath(); x.arc(128, 128, 104, 0, Math.PI * 2); x.fillStyle = '#ffe14d'; x.fill();
    x.lineWidth = 8; x.strokeStyle = '#fff6b8'; x.stroke();
    x.font = '130px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('👑', 128, 136);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: t });
  })();
  const kingMats = [toon(0xff9f1c), kingFace, kingFace];

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
    // 왕코인은 코인 줄이 없는 차선에, 첫 코인 줄 옆에 놓는다
    if (S.kingNext) { S.kingNext = false; spawnKingCoin(3 - laneA - laneB, -dist + 62 * f - 4.8); }
  }

  function spawnKingCoin(lane, z) {
    const m = new THREE.Mesh(kingGeo, kingMats);
    m.rotation.x = Math.PI / 2;
    m.position.set((lane - 1) * LANE_W, 1.25, z);
    m.userData.king = true;
    scene.add(m);
    coins.push(m);
  }

  function spawnCoin(lane, y, z) {
    const m = new THREE.Mesh(coinGeo, coinMat);
    m.rotation.x = Math.PI / 2;
    m.position.set((lane - 1) * LANE_W, y, z);
    scene.add(m);
    coins.push(m);
  }

  function defaultHurdle() {
    const g = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 0.22), toon(0xff4757));
    bar.position.y = 0.65; g.add(bar);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.2), toon(0xffffff));
    bar2.position.y = 0.4; g.add(bar2);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.8, 0.5), toon(0xffffff));
      leg.position.set(s * 0.95, 0.4, 0); g.add(leg);
    }
    return g;
  }

  function spawnHurdle(lane, z) {
    const g = theme.makeHurdle ? theme.makeHurdle(THREE, toon) : defaultHurdle();
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
    if (S.kingNext) { S.kingNext = false; spawnKingCoin(Math.floor(Math.random() * 3), -28); }
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
  function addCoins(n) { S.coins += n; S.earned += n; ui.setCoins(S.coins); tryHeal(); }

  // 코인 200개가 모이면 생명 1개 자동 회복 (생명이 최대면 코인은 그대로 둔다)
  function tryHeal() {
    const r = healStep(S.hearts, S.coins);
    if (!r.healed) return false;
    S.hearts = r.hearts; S.coins = r.coins;
    ui.setCoins(S.coins); ui.setHearts(S.hearts, CONFIG.maxHearts);
    ui.healNote(`💖 생명 +1  🪙 -${HEARTS.healCost}`);
    burst(S.x, 2.2, 0, [0xff4f79, 0xffb3c7, 0xffffff], 20, 6);
    sfx.heal();
    return true;
  }

  const persist = () => progress.setWallet(S.coins, S.hearts);

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
      burst(S.x, 2, -2, [0xff4757, 0xffd23f, 0x2ed573, 0x1e90ff, 0xa55eea, 0xff7eb6], 90, 11);
      ui.flash('gold'); ui.toast(`🌈 ${S.streak}연속! 슈퍼 보너스 +50`); sfx.special();
    } else if (S.streak % 5 === 0) {
      addCoins(20);
      burst(S.x, 2, -1, [0xffd23f, 0xffe066], 40, 8);
      ui.toast(`💰 ${S.streak}연속! 보너스 +20`); sfx.bonus();
    } else if (S.streak % 3 === 0) {
      S.kingNext = true; // 다음 구간에 왕코인이 나타난다
      ui.toast('👑 왕코인 등장!'); sfx.bonus();
    } else {
      ui.toast('정답!');
    }
    hooks.onCorrect?.(ctx, { streak: S.streak });
  }

  function onWrong(gate, lane) {
    S.wrong++; S.streak = 0; S.hearts--;
    S.hitTimer = 1.0; S.shake = 0.5;
    ui.setHearts(S.hearts, CONFIG.maxHearts);
    ui.setCombo(0);
    ui.flash('red');
    sfx.wrong();
    S.wrongList.push({ expr: gate.q.expr, answer: gate.q.answer, picked: gate.q.choices[lane], explain: gate.q.explain });
    tryHeal(); // 모아 둔 코인이 있으면 바로 생명을 되찾는다
    // 부딪힌 게이트는 쓰러지고, 정답 게이트는 초록색으로 알려 준다
    gate.fall = lane;
    gate.banners[gate.q.correctIndex].material[4].map = numberTexture(gate.q.answer, '#2ed573');
    burst(S.x, 1.4, -0.5, [0xff4757, 0xffffff, 0x555555], 26, 7);
    ui.toast('틀림!', true);
    ui.answerNote(`괜찮아! ${gate.q.expr} = ${gate.q.answer}`);
    hooks.onWrong?.(ctx);
  }

  function resolveGate(gate) {
    gate.resolved = true;
    const lane = THREE.MathUtils.clamp(Math.round(S.x / LANE_W) + 1, 0, 2);
    const ok = lane === gate.q.correctIndex;
    if (ok) onCorrect(gate, lane); else onWrong(gate, lane);
    progress.recordAnswer(gate.q, ok, gate.q.choices[lane]);
    persist();
    S.resolved++;
    if (S.hearts <= 0) { S.mode = 'ending'; S.endTimer = 1.4; S.cleared = false; sfx.lose(); return; }
    if (S.resolved < CONFIG.totalQuestions) spawnGate(); else spawnFinish();
  }

  function finishGame() {
    S.mode = 'over';
    ui.hideFeedback();
    if (S.settled) return; // 한 판의 결과는 한 번만 반영한다 (중복 승급·중복 지급 방지)
    S.settled = true;
    persist();
    const sum = summary();
    if (hooks.finish) { hooks.finish(ctx, sum); return; }
    const res = progress.recordRun({
      id: S.runId, cleared: S.cleared, time: S.time, correct: S.correct, wrong: S.wrong,
      earned: S.earned, maxCombo: S.maxCombo, topic: S.topic, pace: S.pace,
    });
    const result = { ...sum, growth: res.growth };
    ui.renderGrowth(res.growth);
    if (res.promoted) {
      // 승급! 캐릭터가 기합을 넣고, 잠시 뒤 도복의 띠가 새 색으로 바뀐다
      S.promo = res.promoted; S.promoSwap = 0.9; S.promoFx = 0;
      sfx.promote();
      ui.showPromo(res.promoted, res.growth, () => { S.promo = null; ui.showResult(result); });
    } else {
      ui.showResult(result);
    }
  }

  // 한 판의 공통 결과 (테마와 상관없이 같은 항목)
  function summary() {
    const total = S.correct + S.wrong;
    return {
      cleared: S.cleared, time: S.time, total, correct: S.correct, wrong: S.wrong,
      accuracy: total ? Math.round((S.correct / total) * 100) : 0,
      earned: S.earned, coins: S.coins, hearts: S.hearts, maxHearts: CONFIG.maxHearts,
      maxCombo: S.maxCombo, topicName: TOPICS[S.topic].name, paceName: L().name,
      wrongList: S.wrongList, runId: S.runId, topic: S.topic, pace: S.pace,
    };
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
        hearts: progress.startHearts(), coins: progress.data.coins, streak: 0, maxCombo: 0, correct: 0, wrong: 0,
        asked: 0, resolved: 0, time: 0, kingNext: false, hitTimer: 0, slowTimer: 0, cheerTimer: 0,
        shake: 0, endTimer: 0, cleared: false, pullTimer: 0, celebrate: 0,
        earned: 0, runId: S.runId + 1, settled: false, wrongList: [], promo: null, promoSwap: 0,
      });
      hooks.onStart?.(ctx);
      theme.syncGrowth(progress.growth(), player);
      ui.setCoins(S.coins); ui.setHearts(S.hearts, CONFIG.maxHearts); ui.setCombo(0);
      ui.hideFeedback(); ui.clearToast();
      ui.showScreen('game');
      tryHeal();
      persist();
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
    toMenu() {
      if (S.mode === 'playing' || S.mode === 'paused') persist();
      clearAll(); S.mode = 'menu'; S.lane = 1; S.kingNext = false; S.hitTimer = 0; S.promo = null;
      hooks.onMenu?.(ctx);
      theme.syncGrowth(progress.growth(), player);
      ui.showScreen('start');
    },
    /** 처음 띠로 돌아가기 (메뉴 화면에서만) */
    resetBelt() {
      if (S.mode !== 'menu') return;
      theme.syncGrowth(progress.resetBelt(), player);
    },
    player, resize, ctx, theme,
  };
  window.addEventListener('pagehide', () => { if (S.mode === 'playing' || S.mode === 'paused') persist(); });
  theme.syncGrowth(progress.growth(), player);

  // ---------- 업데이트 ----------
  function update(dt) {
    const playing = S.mode === 'playing' || S.mode === 'ending';
    if (S.mode === 'paused') return;

    if (S.mode === 'playing') S.time += dt;

    // 속도
    let target = 6;
    if (playing) {
      target = L().speed + L().gain * (S.resolved / CONFIG.totalQuestions);
      if (S.hitTimer > 0) target *= 0.35;
      else if (S.slowTimer > 0) target *= 0.6;
      if (S.mode === 'ending' && !S.cleared) target = 0;
    }
    if (S.mode === 'over') target = S.cleared && !S.promo ? 5 : 0;

    // 승급 연출: 띠가 바뀌는 순간과 폭죽
    if (S.promo) {
      const black = S.promo.id === 'black';
      if (S.promoSwap > 0) {
        S.promoSwap -= dt;
        if (S.promoSwap <= 0) {
          player.setBelt(S.promo.id);
          burst(S.x, 0.9, 0.4, [0xffffff, 0xffd23f, 0xfff3a0], 50, 8);
          ui.flash('gold'); sfx.special();
        }
      }
      S.promoFx -= dt;
      if (S.promoFx <= 0) {
        S.promoFx = black ? 0.22 : 0.55;
        const cols = black ? [0xffd23f, 0xfff3a0, 0xffffff, 0xff4757, 0x1e90ff, 0xa55eea] : [0xff4757, 0xffd23f, 0x2ed573, 0x1e90ff];
        burst(S.x + (Math.random() - 0.5) * 7, 2.5 + Math.random() * 3, -2 - Math.random() * 5, cols, black ? 34 : 20, black ? 10 : 7);
        if (black) sfx.firework();
      }
    }
    S.promoK += ((S.promo ? 1 : 0) - S.promoK) * Math.min(1, dt * 3);
    S.speed += (target - S.speed) * Math.min(1, dt * 4);
    const dz = S.speed * dt;

    S.hitTimer = Math.max(0, S.hitTimer - dt);
    S.slowTimer = Math.max(0, S.slowTimer - dt);
    S.cheerTimer = Math.max(0, S.cheerTimer - dt);
    S.coinTimer = Math.max(0, S.coinTimer - dt);
    S.celebrate = Math.max(0, S.celebrate - dt);
    S.pullTimer = Math.max(0, S.pullTimer - dt);
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
      cheerTimer: S.cheerTimer, coinTimer: S.coinTimer,
      idle: S.mode === 'menu' || (S.mode === 'over' && !S.cleared),
      victory: (S.mode === 'over' || S.mode === 'ending') && S.cleared,
      promote: !!S.promo || S.celebrate > 0, pull: S.pullTimer > 0,
      lean: THREE.MathUtils.clamp((S.x - prevX) / Math.max(dt, 0.001) / 10, -1, 1),
    });

    world.update(dz, dt);
    hooks.update?.(dt, ctx);

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
      const king = c.userData.king;
      c.rotation.z += dt * (king ? 2.6 : 5);
      if (S.mode === 'playing' && Math.abs(c.position.z) < 0.9 && Math.abs(c.position.x - S.x) < 1.0 && Math.abs(c.position.y - (S.y + 0.9)) < (king ? 1.5 : 1.1)) {
        if (king) {
          addCoins(CONFIG.kingCoin); sfx.bonus(); S.coinTimer = 0.5;
          burst(c.position.x, c.position.y, 0, [0xffd23f, 0xffe066, 0xffffff], 36, 8);
          ui.toast(`👑 왕코인 +${CONFIG.kingCoin}`);
        } else {
          addCoins(1); sfx.coin(); S.coinTimer = 0.28;
          burst(c.position.x, c.position.y, 0, [0xffd23f], 5, 3);
        }
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
        hooks.onClear?.(ctx);
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

    // 카메라 (세로 화면에서는 더 넓게)
    const portrait = camera.aspect < 1;
    const fovT = portrait ? 78 : 62;
    if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov += (fovT - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
    const sh = S.shake > 0 ? S.shake * 0.6 : 0;
    // 승급 때는 카메라가 주호에게 가까이 다가간다
    const k = S.promoK, mix = THREE.MathUtils.lerp;
    camera.position.set(
      mix(S.x * 0.55, S.x, k) + (Math.random() - 0.5) * sh,
      mix(portrait ? 5.2 : 4.4, portrait ? 2.6 : 2.0, k) + (Math.random() - 0.5) * sh,
      mix(portrait ? 8.5 : 7.2, portrait ? 6.4 : 4.6, k));
    camera.lookAt(mix(S.x * 0.55, S.x, k), mix(0.9, portrait ? 2.5 : 2.3, k), mix(-10, 0, k));
  }

  // (개발용) 캐릭터를 가까이서 살펴볼 때 카메라를 덮어쓴다
  const baseUpdate = update;
  update = (dt) => { baseUpdate(dt); if (api.cameraHook) api.cameraHook(camera); };

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

  api.step = (dt) => update(dt); // 테스트용
  api.render = () => renderer.render(scene, camera); // 테스트용
  return api;
}
