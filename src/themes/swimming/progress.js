// 수영왕 버전의 성장 기록 (다른 버전과 따로 저장한다: localStorage 'juho-swimming-save').
// 누적 스테이지 성공 횟수에 따라 수영 급수(수영모 색)가 오르고, 20회에 '수영왕'이 된다.
// (급수 기준 횟수는 태권도 띠 승급과 같은 구조: 1, 3, 5, 7, 10, 20회)
import { HEARTS } from '../../progress.js'; // 생명 규칙(기본 3개, 최대 5개, 코인 200개로 1개 회복)은 공통

const KEY = 'juho-swimming-save';

export const RANKS = [
  { id: 'white', name: '흰 모자', skill: '물과 친해지기', need: 0, level: 1 },
  { id: 'yellow', name: '노란 모자', skill: '물장구', need: 1, level: 2 },
  { id: 'green', name: '초록 모자', skill: '자유형', need: 3, level: 3 },
  { id: 'blue', name: '파란 모자', skill: '배영', need: 5, level: 4 },
  { id: 'red', name: '빨간 모자', skill: '평영', need: 7, level: 5 },
  { id: 'purple', name: '보라 모자', skill: '접영', need: 10, level: 6 },
  { id: 'gold', name: '금 모자', skill: '수영왕', need: 20, level: 7, grand: true },
];
export const MASTER_TITLE = '수영왕 현우';

export function rankFor(clears) {
  let r = RANKS[0];
  for (const x of RANKS) if (clears >= x.need) r = x;
  return r;
}

export function growthFor(clears) {
  const rank = rankFor(clears);
  const next = RANKS[RANKS.indexOf(rank) + 1] || null;
  return {
    clears, rank, next,
    remain: next ? next.need - clears : 0,
    pct: next ? (clears - rank.need) / (next.need - rank.need) : 1,
    title: rank.grand ? MASTER_TITLE : '',
  };
}

const blank = () => ({
  v: 1, clears: 0, rank: 'white', level: 1, title: '',
  coins: 0, hearts: HEARTS.base, bestCombo: 0,
  totals: { plays: 0, time: 0, correct: 0, wrong: 0 },
  ops: { add: { n: 0, ok: 0 }, sub: { n: 0, ok: 0 }, mul: { n: 0, ok: 0 } },
  plays: [], wrongs: [],
});

const int = (v, min, max, d) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

function sync(d) { const r = rankFor(d.clears); d.rank = r.id; d.level = r.level; d.title = r.grand ? MASTER_TITLE : ''; }

function load() {
  const d = blank();
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { raw = null; }
  if (raw && typeof raw === 'object') {
    d.clears = int(raw.clears, 0, 1e6, 0);
    d.coins = int(raw.coins, 0, 1e9, 0);
    d.hearts = int(raw.hearts, 0, HEARTS.max, HEARTS.base);
    d.bestCombo = int(raw.bestCombo, 0, 1e6, 0);
    for (const k of Object.keys(d.totals)) d.totals[k] = int(raw.totals?.[k], 0, 1e9, 0);
    for (const k of Object.keys(d.ops)) { d.ops[k].n = int(raw.ops?.[k]?.n, 0, 1e9, 0); d.ops[k].ok = int(raw.ops?.[k]?.ok, 0, 1e9, 0); }
    if (Array.isArray(raw.plays)) d.plays = raw.plays.slice(-30);
    if (Array.isArray(raw.wrongs)) d.wrongs = raw.wrongs.slice(-40);
  }
  sync(d);
  return d;
}

let data = load();
let lastRunId = null;

export const swimProgress = {
  get data() { return data; },
  growth() { return growthFor(data.clears); },
  save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 저장 불가 환경 */ } },
  reload() { data = load(); lastRunId = null; return data; },
  startHearts() { return Math.max(HEARTS.base, Math.min(HEARTS.max, data.hearts)); },
  setWallet(coins, hearts) {
    data.coins = Math.max(0, Math.floor(coins));
    data.hearts = Math.max(0, Math.min(HEARTS.max, Math.floor(hearts)));
    this.save();
  },
  recordAnswer(q, ok, picked) {
    const o = data.ops[q.op];
    if (o) { o.n++; if (ok) o.ok++; }
    if (ok) data.totals.correct++; else {
      data.totals.wrong++;
      data.wrongs.push({ q: q.expr, a: q.answer, picked, op: q.op, t: Date.now() });
      if (data.wrongs.length > 40) data.wrongs.shift();
    }
  },
  /** 한 판이 끝났을 때 한 번만 반영한다 (같은 runId는 두 번 세지 않는다) */
  recordRun(run) {
    if (run.id === lastRunId) return { promoted: null, trophy: null, growth: this.growth(), duplicate: true };
    lastRunId = run.id;
    const before = rankFor(data.clears);
    data.totals.plays++;
    data.totals.time += Math.round(run.time);
    data.bestCombo = Math.max(data.bestCombo, run.maxCombo);
    if (run.cleared) data.clears++;
    sync(data);
    data.plays.push({ t: Date.now(), topic: run.topic, pace: run.pace, cleared: !!run.cleared, time: Math.round(run.time), correct: run.correct, wrong: run.wrong, coins: run.earned, maxCombo: run.maxCombo });
    if (data.plays.length > 30) data.plays.shift();
    this.save();
    const after = rankFor(data.clears);
    return { promoted: after !== before ? after : null, trophy: null, growth: this.growth(), duplicate: false };
  },
};
