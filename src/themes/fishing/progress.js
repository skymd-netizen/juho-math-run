// 낚시 버전의 성장 기록 (태권도 버전과 완전히 따로 저장한다: localStorage 'juho-fishing-save').
// 낚시 레벨·경험치, 코인·생명, 학습 기록, 물고기 도감, 최고어 기록을 담는다.
import { HEARTS } from '../../progress.js'; // 생명 규칙(기본 3개, 최대 5개, 코인 200개로 1개 회복)은 공통
import { LEVELS, MASTER_TITLE, SPECIES, levelFor, spotFor } from './data.js';

const KEY = 'juho-fishing-save';

/** 현재 레벨·다음 레벨까지 남은 경험치·진행률·낚시터 */
export function growthFor(xp) {
  const level = levelFor(xp);
  const next = LEVELS[LEVELS.indexOf(level) + 1] || null;
  return {
    xp, level, next,
    inLevel: xp - level.need,
    span: next ? next.need - level.need : 0,
    remain: next ? next.need - xp : 0,
    pct: next ? (xp - level.need) / (next.need - level.need) : 1,
    spot: spotFor(level.lv),
    title: level.lv === 10 ? MASTER_TITLE : '',
  };
}

const blank = () => ({
  v: 1,
  xp: 0, level: 1,
  clears: 0,
  coins: 0, hearts: HEARTS.base,
  bestCombo: 0,
  totals: { plays: 0, time: 0, correct: 0, wrong: 0, fish: 0 },
  ops: { add: { n: 0, ok: 0 }, sub: { n: 0, ok: 0 }, mul: { n: 0, ok: 0 } },
  plays: [], wrongs: [],
  dex: {},      // 종류 id → { first, count, maxCm, maxKg, rarity }
  best: null,   // 지금까지 잡은 가장 긴 물고기 { id, name, cm, kg, rarity }
});

const int = (v, min, max, d) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function load() {
  const d = blank();
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { raw = null; }
  if (raw && typeof raw === 'object') {
    d.xp = int(raw.xp, 0, 1e9, 0);
    d.clears = int(raw.clears, 0, 1e6, 0);
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
    if (raw.dex && typeof raw.dex === 'object') {
      for (const sp of SPECIES) {
        const e = raw.dex[sp.id];
        if (e && typeof e === 'object') {
          d.dex[sp.id] = { first: String(e.first || ''), count: int(e.count, 1, 1e9, 1), maxCm: num(e.maxCm), maxKg: num(e.maxKg), rarity: sp.rarity };
        }
      }
    }
    if (raw.best && typeof raw.best === 'object' && num(raw.best.cm) > 0) {
      d.best = { id: String(raw.best.id), name: String(raw.best.name), cm: num(raw.best.cm), kg: num(raw.best.kg), rarity: String(raw.best.rarity) };
    }
  }
  sync(d);
  return d;
}

/** 레벨은 항상 경험치에서 계산한다 */
function sync(d) { d.level = levelFor(d.xp).lv; }

let data = load();
let lastRunId = null;

export const fishProgress = {
  get data() { return data; },
  growth() { return growthFor(data.xp); },
  save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 저장 불가 환경 */ } },
  reload() { data = load(); lastRunId = null; return data; },

  startHearts() { return Math.max(HEARTS.base, Math.min(HEARTS.max, data.hearts)); },
  setWallet(coins, hearts) {
    data.coins = Math.max(0, Math.floor(coins));
    data.hearts = Math.max(0, Math.min(HEARTS.max, Math.floor(hearts)));
    this.save();
  },

  /** 경험치를 더한다. 레벨이 오른 경우 올라간 레벨 번호들을 알려 준다. */
  addXp(n) {
    const before = data.level;
    data.xp += Math.max(0, Math.floor(n));
    sync(data);
    this.save();
    const levelUps = [];
    for (let lv = before + 1; lv <= data.level; lv++) levelUps.push(lv);
    return { levelUps, growth: this.growth() };
  },

  /** 잡은 물고기를 도감에 자동 등록하고 기록 갱신 여부를 알려 준다 */
  recordCatch(fish) {
    data.totals.fish++;
    const prev = data.dex[fish.id];
    const isNew = !prev;
    const e = prev || (data.dex[fish.id] = { first: new Date().toISOString(), count: 0, maxCm: 0, maxKg: 0, rarity: fish.rarity });
    e.count++;
    const speciesRecord = !isNew && fish.cm > e.maxCm;
    e.maxCm = Math.max(e.maxCm, fish.cm);
    e.maxKg = Math.max(e.maxKg, fish.kg);
    const isBest = !data.best || fish.cm > data.best.cm;
    if (isBest) data.best = { id: fish.id, name: fish.name, cm: fish.cm, kg: fish.kg, rarity: fish.rarity };
    this.save();
    return { isNew, speciesRecord, isBest };
  },
  dexCount() { return Object.keys(data.dex).length; },

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
    if (run.id === lastRunId) return { duplicate: true, growth: this.growth() };
    lastRunId = run.id;
    data.totals.plays++;
    data.totals.time += Math.round(run.time);
    data.bestCombo = Math.max(data.bestCombo, run.maxCombo);
    if (run.cleared) data.clears++;
    data.plays.push({
      t: Date.now(), topic: run.topic, pace: run.pace, cleared: !!run.cleared, time: Math.round(run.time),
      correct: run.correct, wrong: run.wrong, coins: run.earned, maxCombo: run.maxCombo, fish: run.fish || 0, xp: run.xp || 0,
    });
    if (data.plays.length > 30) data.plays.shift();
    this.save();
    return { duplicate: false, growth: this.growth() };
  },
};
