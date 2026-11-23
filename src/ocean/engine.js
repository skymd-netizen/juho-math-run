// HYUNWOO'S OCEAN WORLD 규칙 엔진: 화면·저장소와 상관없이 "상태 → 새 상태 + 일어난 일(events)"만 계산한다.
//  - 경험치·레벨은 보상 이력(history)에서 계산한다. (저장된 레벨 숫자를 믿지 않는다)
//  - 보상은 key로 한 번만 지급한다. 기록을 지워도 이미 받은 보상은 남고, 보호자가 이력에서 따로 취소·복원한다.
//  - 날짜는 'YYYY-MM-DD'. 수영 기록은 날짜당 1건. 게임이 수영 실력을 자동으로 판정하지 않는다.
import { XP, LEVELS, SKILLS, CREATURES, TREASURES, MILESTONES, TITLES, SPECIALS, REGIONS, SKILL_STATUS, byId } from './data.js';

export const STATE_VERSION = 1;

export const newState = () => ({
  v: STATE_VERSION,
  records: [],     // swim_records
  skills: {},      // swim_skill_progress { skillId: { status, firstDate, practiceDate, memo } }
  collection: { creatures: {}, treasures: {}, titles: {} },   // swim_user_collections { id: { date, source } }
  history: [],     // swim_reward_history
  levelReached: 1, // 지금까지 도달한 가장 높은 레벨 (기록을 지워도 내려가지 않는다)
  pin: null,       // { salt, hash }
  seq: 0,
});

const clone = (s) => JSON.parse(JSON.stringify(s));
export const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// ---------------------------------------------------------------- 날짜 도구
export function isDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
const dayNum = (s) => { const [y, m, d] = s.split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 86400000); };
const weekIdx = (s) => Math.floor((dayNum(s) + 3) / 7);          // 월요일 시작 주 번호
const monthKey = (s) => s.slice(0, 7);
const monthIdx = (k) => { const [y, m] = k.split('-').map(Number); return y * 12 + (m - 1); };

// ---------------------------------------------------------------- 읽기 전용 계산
export const attendedRecords = (st) => st.records.filter((r) => r.attended);
export const attendedCount = (st) => attendedRecords(st).length;
export const xpTotal = (st) => st.history.reduce((a, h) => a + (!h.voided && h.xp ? h.xp : 0), 0);
export const levelFor = (xp) => { let l = LEVELS[0]; for (const x of LEVELS) if (xp >= x.need) l = x; return l; };
export const skillsDone = (st) => SKILLS.filter((s) => st.skills[s.id]?.status === 'done').length;
export const missionsDone = (st) => attendedRecords(st).filter((r) => r.missionDone).length;

/** 현재 레벨·경험치 진행률. 레벨은 도달한 최고 레벨과 경험치로 계산한 레벨 중 높은 쪽 */
export function growth(st) {
  const xp = xpTotal(st);
  const lv = Math.max(levelFor(xp).lv, st.levelReached || 1);
  const level = LEVELS[lv - 1];
  const next = LEVELS[lv] || null;
  return {
    xp, level, next,
    inLevel: Math.max(0, xp - level.need),
    span: next ? next.need - level.need : 0,
    remain: next ? Math.max(0, next.need - xp) : 0,
    pct: next ? Math.min(1, Math.max(0, (xp - level.need) / (next.need - level.need))) : 1,
    count: attendedCount(st),
  };
}

/** 다음 누적 횟수 보상과 남은 횟수 */
export function nextMilestone(st) {
  const count = attendedCount(st);
  const m = MILESTONES.find((x) => x.count > count);
  return m ? { milestone: m, remain: m.count - count } : null;
}

/** 오늘의 수영 미션: 연습 중인 기술이 있으면 그 기술, 없으면 아직 배우기 전인 첫 기술 */
export function todayMission(st) {
  const pick = SKILLS.find((s) => st.skills[s.id]?.status === 'practicing') || SKILLS.find((s) => !st.skills[s.id] || st.skills[s.id].status === 'before');
  return pick ? { skill: pick, text: pick.mission } : null;
}

/** 기술 하나의 성장 기록: 연습 시작·습득 완료 지급 이력과, '오늘 배운 기술'로 남긴 수영 기록 날짜 */
export function skillHistory(st, skillId) {
  const evs = [];
  for (const h of st.history) {
    if (h.voided) continue;
    if (h.key === `practice:${skillId}`) evs.push({ type: 'practice', date: h.date, xp: h.xp });
    if (h.key === `skilldone:${skillId}`) evs.push({ type: 'done', date: h.date, xp: h.xp });
  }
  evs.sort((a, b) => a.date.localeCompare(b.date));
  const lessons = st.records.filter((r) => r.attended && r.skillsLearned.includes(skillId)).map((r) => r.date);
  return { events: evs, lessons };
}

export function monthlyCounts(st) {
  const out = {};
  for (const r of attendedRecords(st)) out[monthKey(r.date)] = (out[monthKey(r.date)] || 0) + 1;
  return out;
}

export function regionsStatus(st) {
  const n = Object.keys(st.collection.creatures).length;
  return REGIONS.map((r) => ({ ...r, open: n >= r.need }));
}

export function summary(st) {
  const g = growth(st);
  const recent = Object.entries(st.collection.creatures).map(([id, v]) => ({ id, ...v })).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 4);
  return {
    growth: g, nextMilestone: nextMilestone(st), mission: todayMission(st),
    creatures: Object.keys(st.collection.creatures).length, treasures: Object.keys(st.collection.treasures).length,
    skillsDone: skillsDone(st), recent, regions: regionsStatus(st),
  };
}

// ---------------------------------------------------------------- 보상 지급 (내부)
const nextId = (st, p) => { st.seq = (st.seq || 0) + 1; return `${p}${st.seq}`; };
const REGRANT = (key) => key.startsWith('swim:') || key.startsWith('mission:'); // 기록에 묶인 경험치는 기록을 지웠다 다시 쓰면 다시 받는다 (단, 같은 날짜에 한 번만)

function nameOf(kind, id) {
  return (kind === 'creature' ? byId(CREATURES, id) : kind === 'treasure' ? byId(TREASURES, id) : kind === 'title' ? byId(TITLES, id) : null)?.name || id;
}

/** key당 한 번만 지급한다. 이미 있으면(취소된 것 포함) 다시 주지 않는다. */
function grant(st, ctx, e) {
  const same = st.history.filter((h) => h.key === e.key);
  if (same.some((h) => !h.voided)) return false;
  if (same.length && !REGRANT(e.key)) return false;
  const entry = { id: nextId(st, 'h'), at: ctx.now, date: ctx.date, voided: false, xp: 0, note: '', source: '', refId: '', ...e };
  st.history.push(entry);
  if (entry.kind === 'creature' || entry.kind === 'treasure' || entry.kind === 'title') {
    const bag = st.collection[entry.kind === 'creature' ? 'creatures' : entry.kind === 'treasure' ? 'treasures' : 'titles'];
    if (!bag[entry.refId]) bag[entry.refId] = { date: entry.date, source: entry.source };
  }
  ctx.events.push({ kind: entry.kind, id: entry.refId, name: entry.kind === 'xp' ? '' : nameOf(entry.kind, entry.refId), xp: entry.xp, source: entry.source, key: entry.key });
  return true;
}

function specialMet(st, id) {
  const recs = attendedRecords(st);
  const perMonth = {};
  for (const r of recs) perMonth[monthKey(r.date)] = (perMonth[monthKey(r.date)] || 0) + 1;
  const run = (idxs) => { const s = [...new Set(idxs)].sort((a, b) => a - b); let best = 0, cur = 0, prev = null; for (const i of s) { cur = prev !== null && i === prev + 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = i; } return best; };
  switch (id) {
    case 'month4': return Object.values(perMonth).some((n) => n >= 4);
    case 'month8': return Object.values(perMonth).some((n) => n >= 8);
    case 'weeks3': return run(recs.map((r) => weekIdx(r.date))) >= 3;
    case 'months3': return run(Object.entries(perMonth).filter(([, n]) => n >= 4).map(([k]) => monthIdx(k))) >= 3;
    case 'skills2': {
      const byM = {};
      for (const s of SKILLS) { const d = st.skills[s.id]?.firstDate; if (d) byM[monthKey(d)] = (byM[monthKey(d)] || 0) + 1; }   // 최초 습득일이 같은 달인 기술 수
      return Object.values(byM).some((n) => n >= 2);
    }
    case 'legend': return skillsDone(st) >= SKILLS.length && attendedCount(st) >= 50;
    default: return false;
  }
}

function treasureMet(st, t) {
  const n = t.cond.n;
  switch (t.cond.type) {
    case 'count': return attendedCount(st) >= n;
    case 'level': return growth(st).level.lv >= n;
    case 'skills': return skillsDone(st) >= n;
    case 'missions': return missionsDone(st) >= n;
    default: return false;
  }
}

/** 조건을 확인해 새로 받을 보상을 모두 지급한다. 경험치가 늘어 레벨이 오르면 그 보상까지 이어서 지급한다. */
function evaluate(st, ctx) {
  for (let round = 0; round < 8; round++) {
    let changed = false;
    const count = attendedCount(st);
    for (const m of MILESTONES) {
      if (count >= m.count) changed = grant(st, ctx, { key: `milestone:${m.count}`, kind: m.kind, refId: m.id, source: `milestone:${m.count}`, note: `누적 수영 ${m.count}회` }) || changed;
    }
    for (const sp of SPECIALS) {
      if (specialMet(st, sp.id)) {
        changed = grant(st, ctx, { key: `special:${sp.id}`, kind: 'creature', refId: sp.creature, source: `special:${sp.id}`, note: `특별 미션: ${sp.name}` }) || changed;
        changed = grant(st, ctx, { key: `specialxp:${sp.id}`, kind: 'xp', xp: XP.special, source: `special:${sp.id}`, note: `특별 미션 달성: ${sp.name}` }) || changed;
      }
    }
    // 레벨업: 경험치로 계산한 레벨이 도달한 최고 레벨보다 높으면 한 단계씩 올리며 보상을 준다
    const lvNow = levelFor(xpTotal(st)).lv;
    while ((st.levelReached || 1) < lvNow) {
      st.levelReached += 1;
      const L = st.levelReached;
      ctx.events.push({ kind: 'levelup', level: L, name: LEVELS[L - 1].name });
      for (const c of CREATURES) if (c.source.type === 'level' && c.source.level === L) grant(st, ctx, { key: `level:${L}`, kind: 'creature', refId: c.id, source: `level:${L}`, note: `수영 레벨 ${L} 달성` });
      changed = true;
    }
    for (const t of TREASURES) {
      if (treasureMet(st, t)) changed = grant(st, ctx, { key: `treasure:${t.id}`, kind: 'treasure', refId: t.id, source: `treasure:${t.id}`, note: `보물 조건: ${t.condText}` }) || changed;
    }
    if (!changed) break;
  }
}

const makeCtx = (opts = {}) => ({ now: opts.now || new Date().toISOString(), date: opts.date || todayStr(), events: [] });
const fail = (state, error) => ({ ok: false, error, state, events: [] });

// ---------------------------------------------------------------- 수영 기록
/** 기록에 묶인 경험치(수영 완료 +100, 오늘의 미션 +30)를 기록 내용에 맞게 맞춘다 */
function syncRecordXp(st, rec, ctx) {
  const want = [];
  if (rec.attended) want.push({ key: `swim:${rec.date}`, xp: XP.swim, note: `수영 수업 완료 (${rec.date})` });
  if (rec.attended && rec.missionDone) want.push({ key: `mission:${rec.date}`, xp: XP.mission, note: `오늘의 미션 완료 (${rec.date})` });
  const keys = new Set(want.map((w) => w.key));
  for (const h of st.history) if (!h.voided && h.refId === rec.id && h.source === 'record' && !keys.has(h.key)) h.voided = true;
  for (const w of want) grant(st, { ...ctx, date: rec.date }, { key: w.key, kind: 'xp', xp: w.xp, refId: rec.id, source: 'record', note: w.note });
}

const cleanRecord = (input) => ({
  date: input.date,
  attended: input.attended !== false,
  timeSlot: String(input.timeSlot || '').slice(0, 40),
  skillsLearned: Array.isArray(input.skillsLearned) ? input.skillsLearned.filter((id) => byId(SKILLS, id)) : [],
  achievement: String(input.achievement || '').slice(0, 200),
  memo: String(input.memo || '').slice(0, 500),
  missionDone: !!input.missionDone,
});

/** 수영 기록 추가. 같은 날짜의 기록이 이미 있으면 거절한다(중복 완료 방지). */
export function addRecord(state, input, opts = {}) {
  if (!isDate(input?.date)) return fail(state, 'invalid_date');
  if (input.date > (opts.today || todayStr())) return fail(state, 'future_date');   // 아직 오지 않은 날은 기록할 수 없다
  if (state.records.some((r) => r.date === input.date)) return fail(state, 'duplicate_date');
  const st = clone(state), ctx = makeCtx({ ...opts, date: input.date });
  const rec = { id: nextId(st, 'r'), createdAt: ctx.now, ...cleanRecord(input) };
  st.records.push(rec);
  st.records.sort((a, b) => a.date.localeCompare(b.date));
  syncRecordXp(st, rec, ctx);
  evaluate(st, ctx);
  return { ok: true, state: st, events: ctx.events, record: rec };
}

/** 수영 기록 수정 (날짜를 바꾸면 그 날짜의 중복도 확인한다) */
export function updateRecord(state, id, patch, opts = {}) {
  const idx = state.records.findIndex((r) => r.id === id);
  if (idx < 0) return fail(state, 'not_found');
  const merged = { ...state.records[idx], ...patch };
  if (!isDate(merged.date)) return fail(state, 'invalid_date');
  if (merged.date > (opts.today || todayStr())) return fail(state, 'future_date');
  if (state.records.some((r) => r.id !== id && r.date === merged.date)) return fail(state, 'duplicate_date');
  const st = clone(state), ctx = makeCtx({ ...opts, date: merged.date });
  const rec = { ...st.records[idx], ...cleanRecord(merged) };
  st.records[idx] = rec;
  st.records.sort((a, b) => a.date.localeCompare(b.date));
  syncRecordXp(st, rec, ctx);
  evaluate(st, ctx);
  return { ok: true, state: st, events: ctx.events, record: rec };
}

/** 수영 기록 삭제: 그 기록의 경험치는 취소되지만, 이미 받은 생물·보물·칭호는 남는다 (이력에서 보호자가 따로 취소할 수 있다) */
export function deleteRecord(state, id) {
  if (!state.records.some((r) => r.id === id)) return fail(state, 'not_found');
  const st = clone(state);
  st.records = st.records.filter((r) => r.id !== id);
  for (const h of st.history) if (h.refId === id && h.source === 'record') h.voided = true;
  return { ok: true, state: st, events: [] };
}

// ---------------------------------------------------------------- 수영 기술
/** 기술 상태 변경(보호자). 연습 중 +20, 습득 완료 +150과 기술 생물은 기술당 최초 1회만 지급한다. */
export function setSkillStatus(state, skillId, status, opts = {}) {
  const skill = byId(SKILLS, skillId);
  if (!skill) return fail(state, 'unknown_skill');
  if (!SKILL_STATUS[status]) return fail(state, 'invalid_status');
  if (opts.date !== undefined && opts.date !== '' && !isDate(opts.date)) return fail(state, 'invalid_date');
  if (opts.date && opts.date > (opts.today || todayStr())) return fail(state, 'future_date');   // 아직 오지 않은 날은 기록할 수 없다
  const date = opts.date || todayStr();
  const st = clone(state), ctx = makeCtx({ ...opts, date });
  const cur = st.skills[skillId] || { status: 'before', firstDate: '', practiceDate: '', memo: '' };
  cur.status = status;
  if (opts.memo !== undefined) cur.memo = String(opts.memo).slice(0, 500);
  if (status === 'practicing' || status === 'done') {
    if (!cur.practiceDate) cur.practiceDate = date;
    grant(st, ctx, { key: `practice:${skillId}`, kind: 'xp', xp: XP.practice, source: 'skill', refId: skillId, note: `${skill.name} 연습 시작` });
  }
  if (status === 'done') {
    if (!cur.firstDate) cur.firstDate = date;
    grant(st, ctx, { key: `skilldone:${skillId}`, kind: 'xp', xp: XP.skillDone, source: 'skill', refId: skillId, note: `${skill.name} 습득 완료` });
    grant(st, ctx, { key: `skillcreature:${skillId}`, kind: 'creature', refId: skill.creature, source: `skill:${skillId}`, note: `기술 습득: ${skill.name}` });
  }
  st.skills[skillId] = cur;
  evaluate(st, ctx);
  return { ok: true, state: st, events: ctx.events };
}

export function setSkillMemo(state, skillId, memo) {
  if (!byId(SKILLS, skillId)) return fail(state, 'unknown_skill');
  const st = clone(state);
  st.skills[skillId] = { status: 'before', firstDate: '', practiceDate: '', memo: '', ...(st.skills[skillId] || {}), memo: String(memo || '').slice(0, 500) };
  return { ok: true, state: st, events: [] };
}

// ---------------------------------------------------------------- 보호자: 보상 이력 정정
/** 잘못 지급된 보상 취소: 경험치는 빠지고 도감에서 사라지며, 같은 조건으로 자동 재지급되지 않는다 */
export function voidHistory(state, historyId) {
  const idx = state.history.findIndex((h) => h.id === historyId);
  if (idx < 0) return fail(state, 'not_found');
  const st = clone(state);
  const h = st.history[idx];
  if (h.voided) return { ok: true, state: st, events: [] };
  h.voided = true;
  const bag = h.kind === 'creature' ? st.collection.creatures : h.kind === 'treasure' ? st.collection.treasures : h.kind === 'title' ? st.collection.titles : null;
  if (bag && !st.history.some((x) => x !== h && !x.voided && x.kind === h.kind && x.refId === h.refId)) delete bag[h.refId];
  return { ok: true, state: st, events: [] };
}

export function restoreHistory(state, historyId) {
  const idx = state.history.findIndex((h) => h.id === historyId);
  if (idx < 0) return fail(state, 'not_found');
  const st = clone(state);
  const h = st.history[idx];
  h.voided = false;
  const bag = h.kind === 'creature' ? st.collection.creatures : h.kind === 'treasure' ? st.collection.treasures : h.kind === 'title' ? st.collection.titles : null;
  if (bag && !bag[h.refId]) bag[h.refId] = { date: h.date, source: h.source };
  const ctx = makeCtx({ date: h.date });
  evaluate(st, ctx);
  return { ok: true, state: st, events: ctx.events };
}

// ---------------------------------------------------------------- 저장 데이터 정리 (불러오기·가져오기에서 사용)
/** 알 수 없는 값은 버리고 안전한 상태로 돌려준다. 이전 버전 데이터는 여기서 이어받는다. */
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const st = newState();
  const str = (v, n) => String(v ?? '').slice(0, n);
  if (Array.isArray(raw.records)) {
    const seen = new Set();
    for (const r of raw.records) {
      if (!r || !isDate(r.date) || seen.has(r.date)) continue;
      seen.add(r.date);
      st.records.push({ id: str(r.id, 20) || `r${st.records.length + 1}`, createdAt: str(r.createdAt, 40), ...cleanRecord(r) });
    }
    st.records.sort((a, b) => a.date.localeCompare(b.date));
  }
  if (raw.skills && typeof raw.skills === 'object') {
    for (const s of SKILLS) {
      const v = raw.skills[s.id];
      if (v && SKILL_STATUS[v.status]) st.skills[s.id] = { status: v.status, firstDate: isDate(v.firstDate) ? v.firstDate : '', practiceDate: isDate(v.practiceDate) ? v.practiceDate : '', memo: str(v.memo, 500) };
    }
  }
  const col = raw.collection || {};
  const pick = (bag, list) => { const out = {}; for (const it of list) { const v = bag?.[it.id]; if (v && typeof v === 'object') out[it.id] = { date: isDate(v.date) ? v.date : '', source: str(v.source, 40) }; } return out; };
  st.collection = { creatures: pick(col.creatures, CREATURES), treasures: pick(col.treasures, TREASURES), titles: pick(col.titles, TITLES) };
  if (Array.isArray(raw.history)) {
    for (const h of raw.history.slice(0, 5000)) {
      if (!h || typeof h.key !== 'string') continue;
      st.history.push({ id: str(h.id, 20), at: str(h.at, 40), date: isDate(h.date) ? h.date : '', key: str(h.key, 60), kind: ['xp', 'creature', 'treasure', 'title'].includes(h.kind) ? h.kind : 'xp', refId: str(h.refId, 40), source: str(h.source, 40), xp: Number.isFinite(h.xp) ? Math.round(h.xp) : 0, note: str(h.note, 120), voided: !!h.voided });
    }
  }
  st.levelReached = Math.min(LEVELS.length, Math.max(1, Math.floor(Number(raw.levelReached) || 1)));
  if (raw.pin && typeof raw.pin.salt === 'string' && typeof raw.pin.hash === 'string') st.pin = { salt: raw.pin.salt.slice(0, 64), hash: raw.pin.hash.slice(0, 128) };
  const maxNum = Math.max(0, ...st.records.map((r) => Number(String(r.id).slice(1)) || 0), ...st.history.map((h) => Number(String(h.id).slice(1)) || 0));
  st.seq = Math.max(Math.floor(Number(raw.seq) || 0), maxNum);
  return st;
}
