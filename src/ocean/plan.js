// 수영 기록을 저장한 뒤 보여 줄 축하 순서를 만든다 (화면과 상관없는 순수 계산).
//   경험치 요약 → 레벨업(낮은 레벨부터) → 새 보상(일반 → 레전드 순, 가장 화려한 것이 마지막) → 새로 열린 지역
import { CREATURES, TREASURES, REGIONS, byId } from './data.js';
import * as E from './engine.js';

const RANK = { common: 0, rare: 1, epic: 2, legend: 3 };

/** 보상의 희귀도. 칭호·트로피는 가장 높은 등급처럼 보여 준다 */
export const rarityOf = (kind, id) => (kind === 'title' ? 'legend' : byId(kind === 'creature' ? CREATURES : TREASURES, id)?.rarity || 'common');

/** 저장 전·후를 비교하기 위한 상태 요약 */
export function snapshot(state) {
  const g = E.growth(state);
  return {
    xp: g.xp, pct: g.pct, lv: g.level.lv, levelName: g.level.name, next: g.next, remain: g.remain, count: g.count,
    creatures: Object.keys(state.collection.creatures).length,
    openRegions: E.regionsStatus(state).filter((r) => r.open).map((r) => r.id),
  };
}

export function buildPlan(events, before, after) {
  const steps = [];
  const xpEvents = events.filter((e) => e.kind === 'xp');
  const xp = xpEvents.reduce((n, e) => n + e.xp, 0);
  // 수영 기록에서 온 경험치면 '수영 완료', 기술 상태 변경에서 온 경험치면 '기술 성장'으로 보여 준다
  const reason = xpEvents.some((e) => e.source === 'record') ? 'swim' : xpEvents.some((e) => e.source === 'skill') ? 'skill' : 'other';
  const ups = events.filter((e) => e.kind === 'levelup').sort((a, b) => a.level - b.level);
  if (xp > 0 || ups.length) steps.push({ type: 'summary', xp, from: before, to: after, levelUps: ups.length, reason });
  for (const u of ups) steps.push({ type: 'levelup', level: u.level, name: u.name });
  // 기술을 처음 습득하면 새 배지
  for (const e of events) if (e.kind === 'xp' && e.key?.startsWith('skilldone:')) steps.push({ type: 'badge', skill: e.key.slice('skilldone:'.length) });
  const rewards = events.map((e, i) => ({ e, i })).filter(({ e }) => e.kind === 'creature' || e.kind === 'treasure' || e.kind === 'title');
  rewards.sort((a, b) => RANK[rarityOf(a.e.kind, a.e.id)] - RANK[rarityOf(b.e.kind, b.e.id)] || a.i - b.i);
  for (const { e } of rewards) steps.push({ type: 'reward', kind: e.kind, id: e.id, rarity: rarityOf(e.kind, e.id), source: e.source });
  for (const id of after.openRegions) {
    if (!before.openRegions.includes(id)) { const r = byId(REGIONS, id); steps.push({ type: 'region', id, name: r.name, emoji: r.emoji, need: r.need }); }
  }
  return steps;
}
