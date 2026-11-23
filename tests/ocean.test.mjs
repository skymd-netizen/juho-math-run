// HYUNWOO'S OCEAN WORLD 규칙 엔진 시험. 실행: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/ocean/data.js';
import * as E from '../src/ocean/engine.js';
import { createStore, memoryAdapter, exportBackup, parseBackup, makePin, verifyPin, isValidPin } from '../src/ocean/store.js';

const date = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const add = (st, dt, extra = {}) => { const r = E.addRecord(st, { date: dt, ...extra }); assert.ok(r.ok, `addRecord ${dt}: ${r.error}`); return r; };
const has = (st, kind, id) => !!st.collection[kind][id];
// 서로 다른 날짜 n개를 하루 간격으로 넣는다 (2026-01-01부터)
const addMany = (st, n, start = date(2026, 1, 1)) => {
  let s = st; const [y, m, d] = start.split('-').map(Number);
  for (let i = 0; i < n; i++) { const dt = new Date(Date.UTC(y, m - 1, d + i)); s = add(s, dt.toISOString().slice(0, 10)).state; }
  return s;
};

test('데이터: 생물 30종·기술 10종·보물 10종, 모든 생물은 정확히 한 가지 방법으로 얻는다', () => {
  assert.equal(D.CREATURES.length, 30);
  assert.equal(D.SKILLS.length, 10);
  assert.equal(D.TREASURES.length, 10);
  assert.equal(new Set(D.CREATURES.map((c) => c.id)).size, 30);
  const from = new Map();
  for (const c of D.CREATURES) from.set(c.id, 0);
  for (const m of D.MILESTONES) if (m.kind === 'creature') from.set(m.id, from.get(m.id) + 1);
  for (const s of D.SKILLS) from.set(s.creature, from.get(s.creature) + 1);
  for (const sp of D.SPECIALS) from.set(sp.creature, from.get(sp.creature) + 1);
  for (let L = 2; L <= 9; L++) for (const c of D.CREATURES) if (c.source.type === 'level' && c.source.level === L) from.set(c.id, from.get(c.id) + 1);
  for (const [id, n] of from) assert.equal(n, 1, `${id}: 획득 경로 ${n}개`);
  for (const r of Object.keys(D.RARITY)) assert.ok(D.CREATURES.some((c) => c.rarity === r), `희귀도 ${r} 없음`);
  for (const t of D.TREASURES) assert.ok(D.RARITY[t.rarity]);
});

test('수영 기록: 첫 기록은 경험치 100과 작은 물고기(흰동가리), 같은 날짜는 거절', () => {
  const r = add(E.newState(), '2026-03-01');
  assert.equal(E.xpTotal(r.state), 100);
  assert.ok(has(r.state, 'creatures', 'clownfish'));
  assert.ok(r.events.some((e) => e.kind === 'creature' && e.id === 'clownfish'));
  const dup = E.addRecord(r.state, { date: '2026-03-01' });
  assert.equal(dup.ok, false);
  assert.equal(dup.error, 'duplicate_date');
  assert.equal(E.attendedCount(dup.state), 1);
  assert.equal(E.addRecord(r.state, { date: '2026-02-30' }).error, 'invalid_date');
  assert.equal(E.addRecord(r.state, { date: 'abc' }).error, 'invalid_date');
  assert.equal(E.addRecord(r.state, { date: '2999-01-01' }).error, 'future_date');                 // 미래 날짜 거절
  assert.equal(E.addRecord(r.state, { date: '2026-03-05' }, { today: '2026-03-04' }).error, 'future_date');
  assert.ok(E.addRecord(r.state, { date: '2026-03-04' }, { today: '2026-03-04' }).ok);
  assert.equal(E.updateRecord(r.state, r.record.id, { date: '2999-01-01' }).error, 'future_date');
});

test('누적 횟수 보상: 1·3·5·7·10·15회 생물, 20·30·50·100회 칭호를 자동 지급하고 중복 지급하지 않는다', () => {
  let st = E.newState();
  const expect = { 1: 'clownfish', 3: 'turtle', 5: 'octopus', 7: 'dolphin', 10: 'whale', 15: 'shark' };
  for (let n = 1; n <= 15; n++) {
    st = add(st, new Date(Date.UTC(2026, 0, n)).toISOString().slice(0, 10)).state;
    for (const [at, id] of Object.entries(expect)) assert.equal(has(st, 'creatures', id), n >= Number(at), `${n}회째 ${id}`);
  }
  st = addMany(E.newState(), 100, '2026-01-01');
  for (const t of ['sea_king_trophy', 'explorer', 'legend_king', 'ocean_legend']) assert.ok(has(st, 'titles', t), t);
  const keys = st.history.filter((h) => h.kind !== 'xp').map((h) => h.key);
  assert.equal(new Set(keys).size, keys.length, '보상 key 중복');
  assert.equal(Object.keys(st.collection.titles).length, 4);
});

test('경험치와 레벨: 150에서 레벨 2와 해마, 레벨업 이벤트', () => {
  let st = add(E.newState(), '2026-01-01').state;                // 100
  assert.equal(E.growth(st).level.lv, 1);
  const r = add(st, '2026-01-02');                                // 200 → Lv.2
  assert.equal(E.growth(r.state).level.lv, 2);
  assert.ok(r.events.some((e) => e.kind === 'levelup' && e.level === 2));
  assert.ok(has(r.state, 'creatures', 'seahorse'));
  const g = E.growth(r.state);
  assert.equal(g.xp, 200);
  assert.ok(g.pct > 0 && g.pct < 1);
});

test('수영 기술: 연습 중 +20, 습득 완료 +150과 기술 생물은 기술당 한 번만, 상태를 왔다 갔다 해도 다시 주지 않는다', () => {
  let r = E.setSkillStatus(E.newState(), 'face', 'practicing', { date: '2026-02-01' });
  assert.equal(E.xpTotal(r.state), 20);
  r = E.setSkillStatus(r.state, 'face', 'done', { date: '2026-02-05' });
  assert.equal(E.xpTotal(r.state), 20 + 150);
  assert.ok(has(r.state, 'creatures', 'starfish'));
  assert.equal(r.state.skills.face.firstDate, '2026-02-05');
  r = E.setSkillStatus(r.state, 'face', 'practicing', { date: '2026-02-09' });
  r = E.setSkillStatus(r.state, 'face', 'done', { date: '2026-02-11' });
  assert.equal(E.xpTotal(r.state), 170);
  assert.equal(r.state.skills.face.firstDate, '2026-02-05');
  assert.equal(E.setSkillStatus(r.state, 'nope', 'done').error, 'unknown_skill');
  assert.equal(E.setSkillStatus(r.state, 'face', 'bad').error, 'invalid_status');
});

test('기록 삭제: 경험치는 취소되지만 받은 보상은 남고, 같은 날짜를 다시 써도 경험치는 한 번만', () => {
  let r = add(E.newState(), '2026-04-01');
  const id = r.record.id;
  const del = E.deleteRecord(r.state, id);
  assert.equal(E.xpTotal(del.state), 0);
  assert.ok(has(del.state, 'creatures', 'clownfish'));
  assert.equal(E.attendedCount(del.state), 0);
  const again = add(del.state, '2026-04-01');
  assert.equal(E.xpTotal(again.state), 100);
  const triple = E.addRecord(again.state, { date: '2026-04-01' });
  assert.equal(triple.ok, false);
});

test('레벨은 기록을 지워도 내려가지 않는다', () => {
  let st = add(add(E.newState(), '2026-01-01').state, '2026-01-02').state;   // Lv.2
  assert.equal(E.growth(st).level.lv, 2);
  for (const r of [...st.records]) st = E.deleteRecord(st, r.id).state;
  assert.equal(E.xpTotal(st), 0);
  assert.equal(E.growth(st).level.lv, 2);
});

test('기록 수정: 날짜 중복 거절, 참석 해제하면 경험치 취소, 미션 완료는 +30', () => {
  let a = add(E.newState(), '2026-05-01');
  const b = add(a.state, '2026-05-02');
  assert.equal(E.updateRecord(b.state, b.record.id, { date: '2026-05-01' }).error, 'duplicate_date');
  let u = E.updateRecord(b.state, b.record.id, { missionDone: true });
  assert.equal(E.xpTotal(u.state), 100 + 100 + 30);
  u = E.updateRecord(u.state, b.record.id, { missionDone: false });
  assert.equal(E.xpTotal(u.state), 200);
  u = E.updateRecord(u.state, b.record.id, { attended: false });
  assert.equal(E.xpTotal(u.state), 100);
  assert.equal(E.attendedCount(u.state), 1);
  u = E.updateRecord(u.state, b.record.id, { date: '2026-05-09', attended: true });
  assert.equal(E.xpTotal(u.state), 200);
  assert.equal(u.state.records.find((r) => r.id === b.record.id).date, '2026-05-09');
});

test('보상 이력 정정: 취소하면 도감에서 사라지고 자동으로 다시 지급되지 않으며, 복원하면 돌아온다', () => {
  let st = add(E.newState(), '2026-06-01').state;
  const h = st.history.find((x) => x.kind === 'creature' && x.refId === 'clownfish');
  let v = E.voidHistory(st, h.id);
  assert.ok(!has(v.state, 'creatures', 'clownfish'));
  v = add(v.state, '2026-06-02');                                   // 조건을 다시 확인해도 다시 주지 않는다
  assert.ok(!has(v.state, 'creatures', 'clownfish'));
  const back = E.restoreHistory(v.state, h.id);
  assert.ok(has(back.state, 'creatures', 'clownfish'));
  const hx = back.state.history.find((x) => x.kind === 'xp');
  const vx = E.voidHistory(back.state, hx.id);
  assert.equal(E.xpTotal(vx.state), E.xpTotal(back.state) - hx.xp);
  assert.equal(E.voidHistory(st, 'zzz').error, 'not_found');
});

test('특별 미션: 한 달 4번·8번, 3주 연속, 3달 연속, 같은 달 기술 2개, 전설(기술 10개+50회)', () => {
  let st = addMany(E.newState(), 4, '2026-03-01');
  assert.ok(has(st, 'creatures', 'lionfish'));
  assert.ok(!has(st, 'creatures', 'humpback'));
  assert.equal(E.xpTotal(st), 4 * 100 + 80);                       // 수영 4번 + 특별 미션 80
  st = addMany(E.newState(), 8, '2026-03-01');
  assert.ok(has(st, 'creatures', 'humpback'));

  st = E.newState();
  for (const dt of ['2026-03-02', '2026-03-09', '2026-03-16']) st = add(st, dt).state;   // 월요일 3주 연속
  assert.ok(has(st, 'creatures', 'sunfish'));
  let gap = E.newState();
  for (const dt of ['2026-03-02', '2026-03-09', '2026-03-23']) gap = add(gap, dt).state;
  assert.ok(!has(gap, 'creatures', 'sunfish'));

  st = E.newState();
  for (const month of [1, 2, 3]) for (let d = 1; d <= 4; d++) st = add(st, date(2026, month, d)).state;
  assert.ok(has(st, 'creatures', 'bluewhale'));

  st = E.setSkillStatus(E.newState(), 'face', 'done', { date: '2026-07-01' }).state;
  assert.ok(!has(st, 'creatures', 'seasnake'));
  st = E.setSkillStatus(st, 'breath', 'done', { date: '2026-07-20' }).state;
  assert.ok(has(st, 'creatures', 'seasnake'));

  st = E.newState();
  for (const s of D.SKILLS) st = E.setSkillStatus(st, s.id, 'done', { date: '2026-01-01' }).state;
  assert.ok(!has(st, 'creatures', 'seadragon'));
  st = addMany(st, 50, '2026-02-01');
  assert.ok(has(st, 'creatures', 'seadragon'));
});

test('보물: 횟수·레벨·기술 수·오늘의 미션 조건으로 지급', () => {
  let st = addMany(E.newState(), 2);
  assert.ok(has(st, 'treasures', 'pearl'));
  assert.ok(!has(st, 'treasures', 'chest'));
  st = addMany(E.newState(), 12);
  assert.ok(has(st, 'treasures', 'chest'));
  st = E.newState();
  for (const id of ['face', 'breath', 'kick']) st = E.setSkillStatus(st, id, 'done', { date: '2026-01-01' }).state;
  assert.ok(has(st, 'treasures', 'goldshell'));
  assert.ok(!has(st, 'treasures', 'crystal'));
  for (const id of ['free', 'back']) st = E.setSkillStatus(st, id, 'done', { date: '2026-01-02' }).state;
  assert.ok(has(st, 'treasures', 'crystal'));
  st = E.newState();
  for (let i = 1; i <= 5; i++) st = add(st, date(2026, 1, i), { missionDone: true }).state;
  assert.ok(has(st, 'treasures', 'seakey'));
  // 모든 기술 + 많은 수영 → 레벨 10, 인어의 보석, 삼지창
  st = E.newState();
  for (const s of D.SKILLS) st = E.setSkillStatus(st, s.id, 'done', { date: '2026-01-01' }).state;
  st = addMany(st, 50, '2026-02-01');                              // 기술 1780 + 수영 5000 + 특별 미션 → 레벨 10 (미션 없이 약 45회)
  assert.equal(E.growth(st).level.lv, 10);
  assert.ok(has(st, 'treasures', 'mermaidgem'));
  assert.ok(has(st, 'treasures', 'trident'));
  assert.ok(has(st, 'treasures', 'coralcrown'));
});

test('경험치 곡선: 기술 10개를 모두 익히고 약 35회 수영하면 최고 레벨 근처', () => {
  let st = E.newState();
  for (const s of D.SKILLS) { st = E.setSkillStatus(st, s.id, 'practicing', { date: '2026-01-01' }).state; st = E.setSkillStatus(st, s.id, 'done', { date: '2026-01-02' }).state; }
  let n = 0;
  while (E.growth(st).level.lv < 10 && n < 100) { st = add(st, new Date(Date.UTC(2026, 2, 1 + n)).toISOString().slice(0, 10), { missionDone: true }).state; n++; }
  assert.ok(n >= 20 && n <= 45, `최고 레벨까지 ${n}회`);
});

test('오늘의 미션·다음 보상·지도 해금', () => {
  let st = E.newState();
  assert.equal(E.todayMission(st).skill.id, 'face');
  assert.deepEqual(E.nextMilestone(st).milestone.count, 1);
  st = E.setSkillStatus(st, 'free', 'practicing').state;
  assert.equal(E.todayMission(st).skill.id, 'free');
  st = addMany(E.newState(), 3);
  assert.equal(E.nextMilestone(st).remain, 2);
  assert.equal(E.regionsStatus(E.newState()).filter((r) => r.open).length, 1);
  assert.ok(E.regionsStatus(st).find((r) => r.id === 'coral').open);
  assert.equal(E.nextMilestone(addMany(E.newState(), 100)), null);
});

test('저장·백업·PIN: 정리, 백업 왕복, 잘못된 파일 거절, 저장소 독립', async () => {
  let st = addMany(E.newState(), 5);
  st = E.setSkillStatus(st, 'face', 'done', { date: '2026-02-01', memo: '잘했어요' }).state;
  const norm = E.normalizeState(JSON.parse(JSON.stringify(st)));
  assert.equal(E.xpTotal(norm), E.xpTotal(st));
  assert.deepEqual(Object.keys(norm.collection.creatures).sort(), Object.keys(st.collection.creatures).sort());
  const parsed = parseBackup(exportBackup(st));
  assert.ok(parsed.ok);
  assert.equal(E.attendedCount(parsed.state), 5);
  assert.equal(parsed.state.skills.face.memo, '잘했어요');
  assert.equal(parseBackup('not json').error, 'not_json');
  assert.equal(parseBackup(JSON.stringify({ app: 'other', data: {} })).error, 'not_ocean_backup');
  // 이상한 값은 버린다
  const dirty = E.normalizeState({ records: [{ date: 'x' }, { date: '2026-01-01' }, { date: '2026-01-01' }], skills: { face: { status: 'bad' } }, collection: { creatures: { fake: { date: '2026-01-01' } } }, levelReached: 99 });
  assert.equal(dirty.records.length, 1);
  assert.equal(dirty.skills.face, undefined);
  assert.deepEqual(dirty.collection.creatures, {});
  assert.equal(dirty.levelReached, 10);
  assert.equal(E.normalizeState(null), null);

  const mem = memoryAdapter();
  const store = createStore(mem);
  store.commit(E.addRecord(store.state, { date: '2026-08-01' }));
  assert.equal(createStore(mem).state.records.length, 1);
  const seen = [];
  store.subscribe((s, ev) => seen.push(ev.length));
  store.commit(E.addRecord(store.state, { date: '2026-08-01' }));          // 중복: 저장·알림 없음
  assert.equal(seen.length, 0);
  store.commit(E.addRecord(store.state, { date: '2026-08-02' }));
  assert.equal(seen.length, 1);
  assert.equal(createStore(memoryAdapter('깨진 데이터')).state.records.length, 0);

  assert.ok(isValidPin('1234') && !isValidPin('12a4') && !isValidPin('123'));
  const pin = await makePin('4321');
  const withPin = { ...st, pin };
  assert.equal(await verifyPin(withPin, '4321'), true);
  assert.equal(await verifyPin(withPin, '1111'), false);
  assert.equal(await verifyPin(st, 'anything'), true);
  assert.equal(await makePin('12'), null);
});

test('축하 순서: 경험치 → 레벨업 → 보상(일반부터 레전드 순) → 새 지역', async () => {
  const { buildPlan, snapshot, rarityOf } = await import('../src/ocean/plan.js');
  // 첫 기록: 경험치 + 흰동가리, 지역 변화 없음
  let st = E.newState();
  let before = snapshot(st);
  let r = add(st, '2026-03-01');
  let plan = buildPlan(r.events, before, snapshot(r.state));
  assert.deepEqual(plan.map((p) => p.type), ['summary', 'reward']);
  assert.equal(plan[0].xp, 100);
  assert.equal(plan[1].id, 'clownfish');

  // 한 번에 많이 받는 날: 기술 10개 → 레벨업, 생물·보물, 지역이 한꺼번에 열린다
  st = E.newState();
  for (const s of D.SKILLS) st = E.setSkillStatus(st, s.id, 'done', { date: '2026-01-01' }).state;
  before = snapshot(st);
  r = add(st, '2026-02-01');
  plan = buildPlan(r.events, before, snapshot(r.state));
  const types = plan.map((p) => p.type);
  assert.equal(types[0], 'summary');
  const rewards = plan.filter((p) => p.type === 'reward');
  const ranks = rewards.map((p) => ['common', 'rare', 'epic', 'legend'].indexOf(p.rarity));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), '보상은 희귀도 순');
  // 레벨업은 보상보다 먼저, 지역 해금은 마지막
  const lastLevel = types.lastIndexOf('levelup'), firstReward = types.indexOf('reward'), firstRegion = types.indexOf('region');
  if (lastLevel >= 0 && firstReward >= 0) assert.ok(lastLevel < firstReward);
  if (firstRegion >= 0) assert.ok(types.slice(firstRegion).every((t) => t === 'region'));
  // 같은 보상이 두 번 나오지 않는다
  const ids = rewards.map((p) => `${p.kind}:${p.id}`);
  assert.equal(new Set(ids).size, ids.length);

  // 변화가 없으면 연출도 없다
  assert.deepEqual(buildPlan([], snapshot(st), snapshot(st)), []);
  assert.equal(rarityOf('title', 'explorer'), 'legend');
  assert.equal(rarityOf('creature', 'whale'), 'epic');
  assert.equal(rarityOf('treasure', 'pearl'), 'common');
});

test('바다 생물 그림: 30종 모두 있고, 서로 다르며, SVG 태그가 짝이 맞는다', async () => {
  const { creatureSvg, CREATURE_IDS } = await import('../src/ocean/creature-art.js');
  assert.equal(CREATURE_IDS.length, 30);
  const seen = new Set();
  for (const c of D.CREATURES) {
    const svg = creatureSvg(c.id);
    assert.ok(CREATURE_IDS.includes(c.id), `${c.id} 그림 없음`);
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), c.id);
    assert.ok(!/undefined|NaN|\[object/.test(svg), `${c.id}: 값 오류`);
    assert.ok(svg.length > 400 && svg.length < 9000, `${c.id}: 크기 ${svg.length}`);
    assert.ok(/<circle/.test(svg), `${c.id}: 눈이 없음`);
    // 태그 짝 맞추기 (스스로 닫는 태그 제외)
    const open = [], re = /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g; let m;
    while ((m = re.exec(svg))) {
      if (m[4] === '/') continue;
      if (m[1]) assert.equal(open.pop(), m[2], `${c.id}: </${m[2]}> 짝이 안 맞음`); else open.push(m[2]);
    }
    assert.equal(open.length, 0, `${c.id}: 닫히지 않은 태그 ${open}`);
    assert.ok(!seen.has(svg), `${c.id}: 다른 생물과 같은 그림`);
    seen.add(svg);
  }
  assert.ok(creatureSvg('nope').includes('?'));
});

test('기술 성장: 미래 날짜 거절, 성장 기록, 기술 배지 축하(요약 문구는 기술로)', async () => {
  const { buildPlan, snapshot } = await import('../src/ocean/plan.js');
  let st = E.newState();
  assert.equal(E.setSkillStatus(st, 'face', 'done', { date: '2999-01-01' }).error, 'future_date');
  assert.equal(E.setSkillStatus(st, 'face', 'done', { date: '2026-13-40' }).error, 'invalid_date');
  assert.ok(E.setSkillStatus(st, 'face', 'done', { date: '2026-03-04', today: '2026-03-04' }).ok);
  // 연습 시작 → 습득 완료: 성장 기록과 축하 순서
  let r = E.setSkillStatus(st, 'free', 'practicing', { date: '2026-02-01' });
  st = r.state;
  let plan = buildPlan(r.events, snapshot(E.newState()), snapshot(st));
  assert.equal(plan[0].type, 'summary');
  assert.equal(plan[0].reason, 'skill');
  assert.ok(!plan.some((p) => p.type === 'badge'), '연습 시작에는 배지가 없다');
  const before = snapshot(st);
  r = E.setSkillStatus(st, 'free', 'done', { date: '2026-02-20' });
  plan = buildPlan(r.events, before, snapshot(r.state));
  const types = plan.map((p) => p.type);
  assert.ok(types.includes('badge'));
  assert.equal(plan.find((p) => p.type === 'badge').skill, 'free');
  assert.ok(types.indexOf('badge') < types.indexOf('reward'), '배지가 보상(청새치)보다 먼저');
  assert.ok(plan.some((p) => p.type === 'reward' && p.id === 'marlin'));
  st = r.state;
  // 같은 상태를 다시 눌러도 배지·보상은 다시 나오지 않는다
  const again = E.setSkillStatus(st, 'free', 'done', { date: '2026-02-21' });
  assert.deepEqual(buildPlan(again.events, snapshot(st), snapshot(again.state)).filter((p) => p.type === 'badge' || p.type === 'reward'), []);
  // 수업 기록의 '오늘 배운 기술'이 성장 기록에 나온다
  st = add(st, '2026-02-10', { skillsLearned: ['free', 'face'] }).state;
  const h = E.skillHistory(st, 'free');
  assert.deepEqual(h.events.map((e) => [e.type, e.date, e.xp]), [['practice', '2026-02-01', 20], ['done', '2026-02-20', 150]]);
  assert.deepEqual(h.lessons, ['2026-02-10']);
  // 수영 기록으로 받은 경험치는 '수영 완료'
  const sw = add(E.newState(), '2026-03-01');
  assert.equal(buildPlan(sw.events, snapshot(E.newState()), snapshot(sw.state))[0].reason, 'swim');
});

test('기술 배지 그림: 10종 모두 있고 서로 다르며 태그가 짝이 맞는다', async () => {
  const { skillBadgeSvg, SKILL_BADGE_IDS } = await import('../src/ocean/skill-art.js');
  assert.equal(SKILL_BADGE_IDS.length, 10);
  const seen = new Set();
  for (const sk of D.SKILLS) {
    const svg = skillBadgeSvg(sk.id);
    assert.ok(SKILL_BADGE_IDS.includes(sk.id), sk.id);
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>') && !/undefined|NaN/.test(svg), sk.id);
    const open = [], re = /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g; let m;
    while ((m = re.exec(svg))) { if (m[4] === '/') continue; if (m[1]) assert.equal(open.pop(), m[2], sk.id); else open.push(m[2]); }
    assert.equal(open.length, 0, sk.id);
    assert.ok(!seen.has(svg)); seen.add(svg);
  }
});
