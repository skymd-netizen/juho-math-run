// 성장 기록: 태권도 띠 승급, 코인 지갑, 생명, 학습 기록을 localStorage에 저장한다.
// 게임 로직(game.js)과 화면(ui.js)은 이 모듈의 함수만 사용한다.

import { TROPHY_COUNT, trophyStatus } from './trophies.js';

const KEY = 'juho-save';

/** 누적 스테이지 성공 횟수(need)에 따른 띠와 캐릭터 레벨 */
export const BELTS = [
  { id: 'white', name: '흰띠', need: 0, level: 1 },
  { id: 'yellow', name: '노란띠', need: 1, level: 2 },
  { id: 'green', name: '초록띠', need: 3, level: 3 },
  { id: 'blue', name: '파란띠', need: 5, level: 4 },
  { id: 'red', name: '빨간띠', need: 7, level: 5 },
  { id: 'poom', name: '품띠', need: 10, level: 6 },
  { id: 'black', name: '검은띠', need: 20, level: 7 },
];
export const MASTER_TITLE = '태권도 마스터';

/** 생명 규칙: 기본 3개, 최대 5개, 코인 200개로 1개 회복 */
export const HEARTS = { base: 3, max: 5, healCost: 200 };

export function beltFor(clears) {
  let b = BELTS[0];
  for (const x of BELTS) if (clears >= x.need) b = x;
  return b;
}

/** 현재 띠, 다음 목표, 남은 횟수, 진행률(0~1) */
export function growthFor(clears) {
  const belt = beltFor(clears);
  const next = BELTS[BELTS.indexOf(belt) + 1] || null;
  return {
    clears, belt, next,
    remain: next ? next.need - clears : 0,
    pct: next ? (clears - belt.need) / (next.need - belt.need) : 1,
    title: belt.id === 'black' ? MASTER_TITLE : '',
  };
}

/**
 * 코인 회복 1회분. 생명이 최대가 아니고 코인이 200개 이상일 때만
 * 생명 +1과 코인 -200이 함께 일어난다. (최대 생명이면 코인은 그대로)
 */
export function healStep(hearts, coins) {
  if (hearts < HEARTS.max && coins >= HEARTS.healCost) {
    return { hearts: hearts + 1, coins: coins - HEARTS.healCost, healed: true };
  }
  return { hearts, coins, healed: false };
}

const blank = () => ({
  v: 1,
  clears: 0,            // 누적 스테이지 성공 횟수 (띠 승급 기준. '처음 띠로 돌아가기'로 0이 될 수 있다)
  trophyClears: 0,      // 평생 누적 성공 횟수 (트로피 수집 기준. 띠를 되돌려도 줄지 않는다)
  trophyDates: {},      // 트로피 번호 → 획득 날짜(ISO). 날짜 기록이 없던 예전 트로피는 ''
  belt: 'white', level: 1, title: '',
  coins: 0, hearts: HEARTS.base,
  bestCombo: 0,
  totals: { plays: 0, time: 0, correct: 0, wrong: 0 },
  ops: { add: { n: 0, ok: 0 }, sub: { n: 0, ok: 0 }, mul: { n: 0, ok: 0 } }, // 연산별 학습 기록
  plays: [],            // 최근 플레이 기록 (최대 30개)
  wrongs: [],           // 최근 오답 기록 (최대 40개)
});

const int = (v, min, max, d) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

/** 저장된 값을 읽는다. 없거나 일부만 있어도 기본값과 합쳐서 안전하게 돌려준다. */
function load() {
  const d = blank();
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { raw = null; }
  if (raw && typeof raw === 'object') {
    d.clears = int(raw.clears, 0, 1e6, 0);
    // 예전 저장 기록(트로피 항목 없음)과 호환: 이미 클리어한 만큼 트로피로 인정하고 지우지 않는다
    d.trophyClears = Math.max(int(raw.trophyClears, 0, 1e6, 0), d.clears);
    if (raw.trophyDates && typeof raw.trophyDates === 'object') {
      for (let n = 1; n <= TROPHY_COUNT; n++) if (typeof raw.trophyDates[n] === 'string') d.trophyDates[n] = raw.trophyDates[n];
    }
    d.coins = int(raw.coins, 0, 1e9, 0);
    d.hearts = int(raw.hearts, 0, HEARTS.max, HEARTS.base);
    d.bestCombo = int(raw.bestCombo, 0, 1e6, 0);
    for (const k of Object.keys(d.totals)) d.totals[k] = int(raw.totals?.[k], 0, 1e9, 0);
    for (const k of Object.keys(d.ops)) {
      d.ops[k].n = int(raw.ops?.[k]?.n, 0, 1e9, 0);
      d.ops[k].ok = int(raw.ops?.[k]?.ok, 0, 1e9, 0);
    }
    if (Array.isArray(raw.plays)) d.plays = raw.plays.slice(-30);
    if (Array.isArray(raw.wrongs)) d.wrongs = raw.wrongs.slice(-40);
  }
  for (let n = 1; n <= Math.min(TROPHY_COUNT, d.trophyClears); n++) if (!(n in d.trophyDates)) d.trophyDates[n] = '';
  sync(d);
  return d;
}

/** 띠·레벨·칭호는 항상 누적 성공 횟수에서 계산한다 (중복 승급 방지) */
function sync(d) {
  const g = growthFor(d.clears);
  d.belt = g.belt.id; d.level = g.belt.level; d.title = g.title;
}

let data = load();
let lastRunId = null;

export const progress = {
  get data() { return data; },
  growth() { return { ...growthFor(data.clears), trophy: trophyStatus(data.trophyClears) }; },
  trophyDate(n) { return data.trophyDates[n]; },
  save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 저장 불가 환경 */ } },
  reload() { data = load(); lastRunId = null; return data; },

  /** 게임을 시작할 때의 생명: 기본 3개, 모아 둔 생명(4~5개)은 이어진다 */
  startHearts() { return Math.max(HEARTS.base, Math.min(HEARTS.max, data.hearts)); },

  setWallet(coins, hearts) {
    data.coins = Math.max(0, Math.floor(coins));
    data.hearts = Math.max(0, Math.min(HEARTS.max, Math.floor(hearts)));
    this.save();
  },

  /** 처음 띠(흰띠)로 돌아간다. 누적 성공 횟수만 0으로 하고 코인·생명·학습 기록은 그대로 둔다. */
  resetBelt() { data.clears = 0; sync(data); lastRunId = null; this.save(); return this.growth(); },

  /** 문제 하나의 결과를 학습 기록에 남긴다 */
  recordAnswer(q, ok, picked) {
    const o = data.ops[q.op];
    if (o) { o.n++; if (ok) o.ok++; }
    if (ok) data.totals.correct++; else {
      data.totals.wrong++;
      data.wrongs.push({ q: q.expr, a: q.answer, picked, op: q.op, t: Date.now() });
      if (data.wrongs.length > 40) data.wrongs.shift();
    }
  },

  /**
   * 한 판이 끝났을 때 한 번만 호출한다. 같은 runId로 다시 불러도 두 번 반영되지 않는다.
   * 스테이지를 클리어한 경우에만 누적 성공 횟수가 1 늘어난다.
   */
  recordRun(run) {
    if (run.id === lastRunId) return { promoted: null, trophy: null, growth: this.growth(), duplicate: true };
    lastRunId = run.id;
    const before = beltFor(data.clears);
    data.totals.plays++;
    data.totals.time += Math.round(run.time);
    data.bestCombo = Math.max(data.bestCombo, run.maxCombo);
    let trophy = null;
    if (run.cleared) {
      data.clears++;
      data.trophyClears++;
      // 새 트로피: 번호당 한 번만 지급하고 날짜를 남긴다
      const n = data.trophyClears;
      if (n <= TROPHY_COUNT && !data.trophyDates[n]) { data.trophyDates[n] = new Date().toISOString(); trophy = n; }
    }
    sync(data);
    data.plays.push({
      t: Date.now(), topic: run.topic, pace: run.pace, cleared: !!run.cleared, time: Math.round(run.time),
      correct: run.correct, wrong: run.wrong, coins: run.earned, maxCombo: run.maxCombo,
    });
    if (data.plays.length > 30) data.plays.shift();
    this.save();
    const after = beltFor(data.clears);
    return { promoted: after !== before ? after : null, trophy, growth: this.growth(), duplicate: false };
  },
};
