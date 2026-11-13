// 낚시 테마: 공통 게임 루프(game.js)에 낚시 캐릭터·부두 배경·낚시 성장 규칙을 꽂는다.
// 정답 → 경험치, 5연속 정답 → 물고기 한 마리, 도착 → 대어 뽑기, 판이 끝나면 레벨업 축하와 결과.
import { createWoojin } from './woojin-2d.js'; // 우진이 일러스트 캐릭터 (예전 3D 낚시꾼은 character.js에 남겨 둠)
import { createFishingWorld } from './world.js';
import { fishProgress } from './progress.js';
import { fishUi } from './ui.js';
import { XP, rollCatch, rewardFor, speciesById, spotFor } from './data.js';
import { makeFishMesh } from './fishart.js';

const UNIT_CM = 55; // 3D 화면에서 1 단위 = 55cm (낚시꾼 키 2 단위 ≈ 110cm)
const displayLen = (cm) => { const L = cm / UNIT_CM; return L <= 4 ? L : 4 + (L - 4) * 0.5; }; // 아주 큰 물고기는 화면을 덮지 않게 조금 줄여 보여 준다

let world = null;
let run = null;
const flyers = [];
let lineMesh = null;

function newRun() { return { catches: [], xp: 0, levelUps: [], correct: 0 }; }

/** 경험치를 올리고, 레벨이 오르면 축하 효과를 낸다 */
function gainXp(ctx, n) {
  const res = fishProgress.addXp(n);
  run.xp += n;
  fishUi.renderGrowth(res.growth);
  for (const lv of res.levelUps) levelUp(ctx, lv, res.growth);
}

function levelUp(ctx, lv, g) {
  run.levelUps.push(lv);
  const { S, sfx, burst } = ctx;
  S.celebrate = 1.8;
  burst(S.x, 1.4, 0, [0xfff3a0, 0xffffff, 0x7affd9, 0x4dd0ff], 80, 9);
  burst(S.x, 2.4, -1, [0xffd23f, 0xff8fc0, 0xffffff], 50, 10);
  ctx.ui.flash('gold'); sfx.promote();
  fishUi.levelBanner(lv);
  world?.setSpot(spotFor(lv).id); // 새 낚시터가 열리면 배경도 바뀐다
}

/** 물고기 한 마리를 잡는다: 뽑기 → 도감·코인·경험치 → 낚싯대 당기기와 물 밖으로 튀어 오르는 연출 */
function catchFish(ctx, { big = false, force = null } = {}) {
  const { S, sfx } = ctx;
  const level = fishProgress.growth().level.lv;
  const fish = force || rollCatch(level, { big });
  const reward = rewardFor(fish);
  const rec = fishProgress.recordCatch(fish);
  run.catches.push({ ...fish, ...reward });
  ctx.addCoins(reward.coin);
  S.pullTimer = fish.rarity === 'legend' ? 1.8 : 1.3;
  spawnFlyer(ctx, fish);
  const info = { fish, reward, rec };
  if (fish.rarity === 'legend') {
    fishUi.legendary(info); sfx.firework();
    ctx.ui.flash('gold');
    ctx.burst(S.x, 2.2, -1, [0xffd23f, 0xfff3a0, 0xffffff, 0xff9100], 120, 12);
  } else {
    fishUi.catchCard(info);
    if (fish.rarity === 'epic' || fish.big) sfx.special(); else sfx.bonus();
  }
  gainXp(ctx, reward.xp);
  return info;
}

/** 물 밖으로 튀어 올라 낚시꾼 옆에 매달렸다가 물로 돌아가는 물고기 */
function spawnFlyer(ctx, fish) {
  const { THREE, scene, S } = ctx;
  const sp = speciesById(fish.id);
  const mesh = makeFishMesh(THREE, sp);
  const holder = new THREE.Group();
  holder.add(mesh);
  const len = displayLen(fish.cm);
  mesh.scale.setScalar(len);
  scene.add(holder);
  const side = Math.random() < 0.5 ? -1 : 1;
  const f = { holder, mesh, len, side, t: 0, sp, big: fish.rarity === 'legend', x0: S.x + side * 4.8, glow: sp.glow };
  flyers.push(f);
  if (!lineMesh) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]);
    lineMesh = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffff }));
    lineMesh.frustumCulled = false; lineMesh.visible = false; scene.add(lineMesh);
  }
}

const T_JUMP = 0.9, T_HOLD = 1.9, T_DROP = 0.6;

function updateFlyers(dt, ctx) {
  const { THREE, S, player } = ctx;
  let lineOn = false;
  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i];
    f.t += dt;
    const hold = { x: S.x + f.side * (1.0 + f.len * 0.45), y: 2.0 + f.len * 0.12, z: -0.6 };
    const out = { x: S.x + f.side * 5.2, y: -0.7, z: -2.2 };
    let p, tilt;
    if (f.t < T_JUMP) {
      // 물에서 힘차게 솟구쳐 낚시꾼 옆으로
      const u = f.t / T_JUMP, e = 1 - (1 - u) * (1 - u);
      p = { x: out.x + (hold.x - out.x) * e, y: out.y + (hold.y - out.y) * e + Math.sin(u * Math.PI) * (1.6 + f.len * 0.3), z: out.z + (hold.z - out.z) * e };
      tilt = 0.9 + 0.6 * (1 - u);
      if (f.t - dt < 0.03) ctx.burst(out.x, -0.6, out.z, [0xffffff, 0x9be7ff, 0x4dd0ff], 26, 6); // 물보라
    } else if (f.t < T_JUMP + T_HOLD) {
      // 낚싯줄에 매달려 흔들흔들
      const k = f.t - T_JUMP;
      p = { x: hold.x + Math.sin(k * 6) * 0.1, y: hold.y + Math.sin(k * 4) * 0.12, z: hold.z };
      tilt = 0.9 + Math.sin(k * 7) * 0.12;
      if (f.glow && Math.random() < 0.2) ctx.burst(p.x, p.y, p.z, [0xfff3a0, 0xffffff], 2, 2);
    } else if (f.t < T_JUMP + T_HOLD + T_DROP) {
      // 놓아주면 포물선을 그리며 물로 풍덩
      const u = (f.t - T_JUMP - T_HOLD) / T_DROP;
      p = { x: hold.x + (out.x - hold.x) * u, y: hold.y + (out.y - hold.y) * u * u + Math.sin(u * Math.PI) * 0.8, z: hold.z + (out.z - hold.z) * u };
      tilt = 0.9 - u * 2.2;
      if (u > 0.92 && !f.splashed) { f.splashed = true; ctx.burst(p.x, -0.6, p.z, [0xffffff, 0x9be7ff, 0x4dd0ff], 24, 6); }
    } else {
      ctx.scene.remove(f.holder); flyers.splice(i, 1); continue;
    }
    f.holder.position.set(p.x, p.y, p.z);
    f.holder.rotation.set(0, f.side > 0 ? Math.PI : 0, 0);
    f.mesh.rotation.z = tilt;
    // 낚싯줄: 대 끝에서 물고기 입까지
    if (f.t < T_JUMP + T_HOLD && i === flyers.length - 1) {
      f.holder.updateMatrixWorld(true);
      const mouth = f.mesh.userData.mouth.getWorldPosition(new THREE.Vector3());
      const tip = player.rodTip.getWorldPosition(new THREE.Vector3());
      const a = lineMesh.geometry.attributes.position;
      a.setXYZ(0, tip.x, tip.y, tip.z); a.setXYZ(1, mouth.x, mouth.y, mouth.z); a.needsUpdate = true;
      lineOn = true;
    }
  }
  if (lineMesh) lineMesh.visible = lineOn;
}

function clearFlyers(ctx) {
  for (const f of flyers) ctx.scene.remove(f.holder);
  flyers.length = 0;
  if (lineMesh) lineMesh.visible = false;
}

/** 작은 위험 방어물: 부두 위 나무 상자 (점프로 넘는다) */
function makeHurdle(THREE, toon) {
  const g = new THREE.Group();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.62, 0.7), toon(0xb87a3d));
  crate.position.y = 0.34; g.add(crate);
  for (const x of [-0.7, 0, 0.7]) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.66, 0.74), toon(0x8a5a2b));
    slat.position.set(x, 0.34, 0); g.add(slat);
  }
  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.8), toon(0xd9a05b)); lid.position.y = 0.68; g.add(lid);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 3), toon(0x5aa9e6)); // 상자 밖으로 삐져나온 물고기 꼬리
  tail.rotation.z = Math.PI; tail.position.set(0.5, 0.92, 0); g.add(tail);
  return g;
}

export const fishingTheme = {
  id: 'fishing',
  progress: fishProgress,
  ui: fishUi,
  createWorld(scene) { world = createFishingWorld(scene, fishProgress.growth().spot.id); return world; },
  createCharacter: createWoojin,
  makeHurdle,
  /** 낚시 레벨·경험치를 화면에 반영하고 현재 낚시터로 배경을 맞춘다 */
  syncGrowth(g) { fishUi.renderGrowth(g); world?.setSpot(g.spot.id); },

  init(game) {
    if (import.meta.env.DEV) {
      // (개발용) 물고기를 바로 잡아 보거나 뽑기 결과를 살펴본다
      window.__fishing = { catchFish: (o) => catchFish(game.ctx, o), rollCatch, rewardFor, gainXp: (n) => gainXp(game.ctx, n), run: () => run };
    }
    const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
    on('btn-dex', () => fishUi.openDex());
    on('btn-dex-close', () => fishUi.showScreen('start'));
  },

  hooks: {
    onStart(ctx) { run = newRun(); clearFlyers(ctx); },
    onMenu(ctx) { clearFlyers(ctx); },
    onCorrect(ctx, { streak }) {
      run.correct++;
      gainXp(ctx, XP.correct + Math.min(XP.comboCap, Math.floor(streak / 2))); // 콤보가 이어질수록 경험치를 조금 더
      if (streak % 5 === 0) catchFish(ctx); // 5연속 정답 → 물고기 한 마리
    },
    onClear(ctx) {
      // 도착: 클리어 경험치 + 대어 뽑기. 연출이 끝난 뒤 결과가 나오도록 잠깐 기다린다.
      gainXp(ctx, XP.clear);
      const info = catchFish(ctx, { big: true });
      ctx.S.endTimer = info.fish.rarity === 'legend' ? 4.6 : 3.4;
    },
    update(dt, ctx) { updateFlyers(dt, ctx); },

    /** 한 판의 마무리: 기록 저장 → (레벨이 올랐다면 축하 화면) → 결과 */
    finish(ctx, sum) {
      const res = fishProgress.recordRun({
        id: sum.runId, cleared: sum.cleared, time: sum.time, correct: sum.correct, wrong: sum.wrong,
        earned: sum.earned, maxCombo: sum.maxCombo, topic: sum.topic, pace: sum.pace,
        fish: run.catches.length, xp: run.xp,
      });
      const result = { ...sum, growth: res.growth, catches: run.catches, xpGain: run.xp, levelUps: run.levelUps };
      fishUi.renderGrowth(res.growth);
      if (run.levelUps.length) {
        ctx.S.celebrate = 3; ctx.sfx.promote();
        fishUi.showLevelUp(run.levelUps, res.growth, () => { ctx.S.celebrate = 0; fishUi.showResult(result); });
      } else {
        fishUi.showResult(result);
      }
    },
  },
};
