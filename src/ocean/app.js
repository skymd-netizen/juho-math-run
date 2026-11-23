// HYUNWOO'S OCEAN WORLD 화면: 하단 탭 5개(HOME · 도감 · 기술 · 보물 · 기록)와 보호자 기능.
// 2단계: 보호자 PIN, 수영 기록 등록·수정·삭제, HOME의 '오늘의 수영'. (도감·기술·보물 화면은 4~6단계에서 다듬는다)
import faceUrl from '../themes/swimming/assets/hyunwoo-head.png';
import { createStore, exportBackup, backupFileName, parseBackup, makePin, verifyPin, isValidPin } from './store.js';
import * as E from './engine.js';
import { CREATURES, TREASURES, SKILLS, SKILL_STATUS, RARITY, TITLES, byId } from './data.js';
import { ART } from './art.js';
import { snapshot, buildPlan } from './plan.js';
import { celebrate, sourceText } from './celebrate.js';
import { sfx } from '../audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TABS = [
  { id: 'home', label: 'HOME', icon: '🏠' },
  { id: 'collection', label: '도감', icon: '🐠' },
  { id: 'skills', label: '기술', icon: '🏊' },
  { id: 'treasure', label: '보물', icon: '💎' },
  { id: 'record', label: '기록', icon: '📅' },
];
const fmtDate = (s) => (s ? s.replace(/-/g, '.') : '날짜 기록 없음');
const pct = (n, total) => Math.round((n / total) * 100);
const UI = { collFilter: 'all' };   // 바다 생물 도감의 희귀도 필터
const GUARD_MS = 5 * 60 * 1000;        // 보호자 확인 후 5분 동안은 다시 묻지 않는다
const ERRORS = {
  duplicate_date: '이 날짜에는 이미 수영 기록이 있어요. 기록 탭에서 고쳐 주세요.',
  invalid_date: '날짜를 확인해 주세요.',
  future_date: '아직 오지 않은 날은 기록할 수 없어요.',
  not_found: '기록을 찾을 수 없어요.',
};

function creatureHint(c) {
  const s = c.source;
  if (s.type === 'milestone') return `누적 수영 ${s.count}회`;
  if (s.type === 'skill') return `「${byId(SKILLS, s.skill).name}」 습득`;
  if (s.type === 'level') return `수영 레벨 ${s.level} 달성`;
  return '특별 미션';
}

const bar = (p, text) => `<div class="bar"><i style="width:${Math.round(p * 100)}%"></i><span>${esc(text)}</span></div>`;
const cell = (art, name, rarity, on, sub) =>
  `<div class="cell ${on ? 'on' : 'off'}" style="--c:${RARITY[rarity].color}"><div class="art">${art}</div><b>${on ? esc(name) : '???'}</b><small>${esc(sub)}</small></div>`;

// ---------------------------------------------------------------- 화면들
function viewHome(st) {
  const s = E.summary(st), g = s.growth, nm = s.nextMilestone;
  const today = E.todayStr();
  const todayRec = st.records.find((r) => r.date === today);
  const recent = s.recent.length
    ? s.recent.map((r) => { const c = byId(CREATURES, r.id); return `<span class="chip" style="--c:${RARITY[c.rarity].color}">${ART.creatures[c.id]} ${esc(c.name)}</span>`; }).join('')
    : '<span class="muted">아직 만난 바다 친구가 없어요. 수영을 하면 만날 수 있어요!</span>';
  const todayCard = todayRec
    ? `<section class="card today done"><h3>✅ 오늘은 수영 완료!</h3><p>${todayRec.attended ? '오늘도 멋지게 헤엄쳤어요 🏊' : '오늘은 쉬었어요.'}${todayRec.timeSlot ? ` <small class="muted">${esc(todayRec.timeSlot)}</small>` : ''}</p>
        <div class="btns"><button class="btn alt" data-act="edit-record" data-id="${esc(todayRec.id)}">오늘 기록 고치기</button></div></section>`
    : `<section class="card today"><h3>🏊 오늘 수영했나요?</h3><p>수영 수업을 마쳤다면 보호자가 기록을 남겨 주세요. 경험치와 바다 친구가 기다려요!</p>
        <div class="btns"><button class="btn" data-act="add-record">📝 수영 기록 남기기</button></div></section>`;
  return `
  <section class="card hero">
    <div class="hero-top"><img class="face" src="${faceUrl}" alt="현우" /><div><div class="lv">Lv.${g.level.lv}</div><h2>${esc(g.level.name)}</h2></div></div>
    ${bar(g.pct, g.next ? `경험치 ${g.xp} / ${g.next.need}` : `경험치 ${g.xp} · 최고 레벨!`)}
    <div class="stats">
      <div><b>${g.count}</b><small>누적 수영</small></div>
      <div><b>${s.creatures}/${CREATURES.length}</b><small>바다 생물</small></div>
      <div><b>${s.skillsDone}/${SKILLS.length}</b><small>수영 기술</small></div>
      <div><b>${s.treasures}/${TREASURES.length}</b><small>보물</small></div>
    </div>
  </section>
  ${todayCard}
  <section class="card"><h3>🎁 다음 보상</h3>
    ${nm ? `<p><b>${nm.remain}번</b> 더 수영하면 <b>${esc(nm.milestone.label)}</b>을(를) 만나요! <small class="muted">(누적 ${nm.milestone.count}회)</small></p>` : '<p>누적 횟수 보상을 모두 받았어요! 🎉</p>'}
  </section>
  <section class="card"><h3>🌊 최근 만난 바다 친구</h3><div class="chips">${recent}</div></section>
  <section class="card"><h3>🎯 오늘의 수영 미션</h3>
    ${s.mission ? `<p><b>${esc(s.mission.skill.name)}</b> · ${esc(s.mission.text)}</p>` : '<p>모든 기술을 배웠어요! 마음껏 헤엄쳐요 🏊</p>'}
    <small class="muted">미션을 마쳤다면 수영 기록을 남길 때 보호자가 체크해 주세요. (+30 경험치)</small>
  </section>
  <section class="card"><h3>🗺️ 바닷속 탐험 지도</h3>
    <div class="regions">${s.regions.map((r) => `<div class="region ${r.open ? 'open' : ''}"><span>${r.open ? r.emoji : '🔒'}</span><b>${esc(r.name)}</b><small>${r.open ? '탐험 가능' : `생물 ${r.need}종 모으면 열려요`}</small></div>`).join('')}</div>
  </section>
  <section class="card"><h3>💾 데이터 백업</h3>
    <p class="muted">기록은 이 기기의 브라우저에만 저장돼요. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 꼭 백업해 두세요.</p>
    <div class="btns"><button class="btn" data-act="export">백업 파일 저장</button><button class="btn alt" data-act="import">백업 불러오기</button></div>
    <input type="file" id="importFile" accept="application/json,.json" hidden />
    <p id="backupMsg" class="msg" role="status"></p>
  </section>`;
}

function viewCollection(st) {
  const got = Object.keys(st.collection.creatures).length;
  const filters = [['all', '전체'], ...Object.values(RARITY).map((r) => [r.id, r.name])];
  const count = (f) => { const l = f === 'all' ? CREATURES : CREATURES.filter((c) => c.rarity === f); return `${l.filter((c) => st.collection.creatures[c.id]).length}/${l.length}`; };
  const list = UI.collFilter === 'all' ? CREATURES : CREATURES.filter((c) => c.rarity === UI.collFilter);
  return `
  <section class="card"><h3>🐠 바다 생물 도감</h3>${bar(got / CREATURES.length, `${got} / ${CREATURES.length}종 · 수집률 ${pct(got, CREATURES.length)}%`)}
    <div class="fchips" role="tablist" aria-label="희귀도">${filters.map(([id, name]) => `<button class="fchip ${UI.collFilter === id ? 'on' : ''}" data-act="filter" data-v="${id}" ${id !== 'all' ? `style="--c:${RARITY[id].color}"` : ''}>${esc(name)} <small>${count(id)}</small></button>`).join('')}</div>
  </section>
  <div class="grid">${list.map((c) => {
    const have = st.collection.creatures[c.id];
    return `<button class="cell ${have ? 'on' : 'off'}" data-act="creature" data-id="${c.id}" style="--c:${RARITY[c.rarity].color}" aria-label="${have ? esc(c.name) : '아직 만나지 못한 바다 친구'}"><div class="art">${ART.creatures[c.id]}</div><b>${have ? esc(c.name) : '???'}</b><small>${have ? `${RARITY[c.rarity].name} · ${fmtDate(have.date)}` : esc(creatureHint(c))}</small></button>`;
  }).join('')}</div>`;
}

function viewSkills(st) {
  const done = E.skillsDone(st);
  const practicing = SKILLS.filter((s) => st.skills[s.id]?.status === 'practicing').length;
  return `
  <section class="card"><h3>🏊 수영 기술 도감</h3>${bar(done / SKILLS.length, `${done} / ${SKILLS.length}개 습득`)}
    <div class="chips"><span class="chip">🏅 습득 ${done}</span><span class="chip">💪 연습 중 ${practicing}</span><span class="chip">🌱 배우기 전 ${SKILLS.length - done - practicing}</span></div>
    <small class="muted">기술을 눌러 보세요. 상태는 수업 내용을 확인한 보호자가 바꿔 줘요. 습득하면 배지와 경험치, 바다 친구를 받아요!</small></section>
  <div class="grid skills">${SKILLS.map((sk, i) => {
    const p = st.skills[sk.id] || { status: 'before' };
    return `<button class="cell skillcell s-${p.status}" data-act="skill" data-id="${sk.id}"><div class="art">${ART.skills[sk.id]}</div><b>${i + 1}. ${esc(sk.name)}</b><span class="pill">${SKILL_STATUS[p.status]}</span><small>${p.firstDate ? `🏅 ${fmtDate(p.firstDate)}` : p.practiceDate ? `💪 ${fmtDate(p.practiceDate)} 시작` : '아직 배우기 전'}</small></button>`;
  }).join('')}</div>`;
}

function viewTreasure(st) {
  const got = Object.keys(st.collection.treasures).length;
  const titles = TITLES.map((t) => { const have = st.collection.titles[t.id]; return `<span class="chip ${have ? '' : 'off'}">${ART.titles[t.id]} ${have ? esc(t.name) : '???'}</span>`; }).join('');
  return `
  <section class="card"><h3>💎 바닷속 보물 도감</h3>${bar(got / TREASURES.length, `${got} / ${TREASURES.length}종`)}</section>
  <div class="grid">${TREASURES.map((t) => {
    const have = st.collection.treasures[t.id];
    return cell(ART.treasures[t.id], t.name, t.rarity, !!have, have ? `${RARITY[t.rarity].name} · ${fmtDate(have.date)}` : t.condText);
  }).join('')}</div>
  <section class="card"><h3>🏅 칭호와 트로피</h3><div class="chips">${titles}</div></section>`;
}

function viewRecord(st) {
  const recs = [...st.records].reverse();
  const months = Object.entries(E.monthlyCounts(st)).sort((a, b) => b[0].localeCompare(a[0]));
  return `
  <section class="card"><h3>📅 수영 기록</h3>
    <p>누적 수영 <b>${E.attendedCount(st)}회</b></p>
    ${months.length ? `<div class="chips">${months.map(([m, n]) => `<span class="chip">${esc(m.replace('-', '.'))} · ${n}회</span>`).join('')}</div>` : ''}
    <div class="btns" style="margin-top:8px"><button class="btn" data-act="add-record">➕ 수영 기록 추가</button></div>
  </section>
  ${recs.length ? `<div class="list">${recs.map((r) => `<div class="row rec"><span class="ico">${r.attended ? '✅' : '➖'}</span><div><b>${fmtDate(r.date)}</b>
      <small>${r.attended ? '수영 완료' : '쉬었어요'}${r.timeSlot ? ` · ${esc(r.timeSlot)}` : ''}${r.missionDone ? ' · 🎯 미션 완료' : ''}</small>
      ${r.skillsLearned.length ? `<small>🏊 ${r.skillsLearned.map((id) => esc(byId(SKILLS, id).name)).join(', ')}</small>` : ''}
      ${r.achievement ? `<small>⭐ ${esc(r.achievement)}</small>` : ''}${r.memo ? `<small>📝 ${esc(r.memo)}</small>` : ''}</div>
      <div class="mini"><button class="btn tiny alt" data-act="edit-record" data-id="${esc(r.id)}">수정</button><button class="btn tiny danger" data-act="delete-record" data-id="${esc(r.id)}">삭제</button></div></div>`).join('')}</div>`
    : '<section class="card"><p class="muted">아직 수영 기록이 없어요. 수영 수업을 마친 날 보호자가 기록을 남기면 경험치와 바다 친구를 만나요!</p></section>'}`;
}

const VIEWS = { home: viewHome, collection: viewCollection, skills: viewSkills, treasure: viewTreasure, record: viewRecord };

// ---------------------------------------------------------------- 시작
export function startOcean(root, store = createStore()) {
  root.innerHTML = `
    <header class="o-head"><div class="o-top"><a class="o-back" href="./games.html">◀ 게임 선택</a><span class="o-right"><button class="o-mute" data-act="mute" aria-label="소리 켜기/끄기">🔊</button><button class="o-lock" data-act="guardian" aria-label="보호자 메뉴">🔒 보호자</button></span></div><h1>HYUNWOO'S <span>OCEAN WORLD</span></h1></header>
    <main id="view" tabindex="-1"></main>
    <nav id="tabs" aria-label="메뉴">${TABS.map((t) => `<a href="#${t.id}" data-tab="${t.id}"><span>${t.icon}</span><b>${t.label}</b></a>`).join('')}</nav>
    <div id="toasts" aria-live="polite"></div>`;
  // 현우의 숫자왕(수영왕 에디션) 안에서 열린 경우: 돌아가기 링크가 게임 창을 닫는다
  if (new URLSearchParams(location.search).has('embed')) {
    const back = root.querySelector('.o-back');
    back.textContent = '◀ 게임으로 돌아가기';
    back.removeAttribute('href');
    back.setAttribute('role', 'button'); back.tabIndex = 0;
    const close = () => window.parent.postMessage({ type: 'ocean-close' }, location.origin);
    back.addEventListener('click', close);
    back.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } });
    back.style.cursor = 'pointer';
  }
  const view = root.querySelector('#view');
  const toasts = root.querySelector('#toasts');
  const lockBtn = root.querySelector('.o-lock');
  const current = () => (VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'home');

  // ---- 보호자 확인
  let guardUntil = 0, fails = 0, blockedUntil = 0;
  const unlocked = () => Date.now() < guardUntil;
  const refreshLock = () => { lockBtn.textContent = unlocked() ? '🔓 보호자 모드' : '🔒 보호자'; lockBtn.classList.toggle('on', unlocked()); };
  const unlock = () => { guardUntil = Date.now() + GUARD_MS; fails = 0; refreshLock(); };
  setInterval(refreshLock, 10000);

  function modal(html, mount) {
    return new Promise((resolve) => {
      const dlg = document.createElement('dialog');
      dlg.className = 'o-modal'; dlg.innerHTML = html;
      document.body.appendChild(dlg);
      const done = (v) => { if (dlg.open) dlg.close(); dlg.remove(); resolve(v); };
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); done(null); });
      dlg.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) done(null); });
      mount(dlg, done);
      dlg.showModal();
      dlg.querySelector('[autofocus], input, textarea, button')?.focus();
    });
  }
  const pinInput = (name, label) => `<label>${label}<input class="pin" name="${name}" type="password" inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" required></label>`;

  const confirmBox = (title, text, okLabel = '확인') => modal(
    `<form method="dialog" class="o-form"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="btns"><button class="btn danger" value="ok">${esc(okLabel)}</button><button type="button" class="btn alt" data-close>취소</button></div></form>`,
    (dlg, done) => { dlg.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); done(true); }); });

  /** 새 PIN 만들기 (처음 한 번) 또는 바꾸기 */
  const createPin = (title = '보호자 PIN 만들기') => modal(
    `<form class="o-form"><h3>🔐 ${esc(title)}</h3><p>수영 기록은 보호자만 남길 수 있어요. 숫자 4자리를 정해 주세요.<br><small class="muted">아이의 실수를 막는 간단한 잠금이에요. 기억하기 쉬운 숫자로 정해 주세요.</small></p>
      ${pinInput('a', 'PIN 4자리')}${pinInput('b', '한 번 더')}<p class="msg bad" id="m"></p>
      <div class="btns"><button class="btn">저장</button><button type="button" class="btn alt" data-close>취소</button></div></form>`,
    (dlg, done) => {
      const f = dlg.querySelector('form'), m = dlg.querySelector('#m');
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const a = f.a.value, b = f.b.value;
        if (!isValidPin(a)) { m.textContent = '숫자 4자리를 넣어 주세요.'; return; }
        if (a !== b) { m.textContent = '두 번 입력한 숫자가 달라요.'; return; }
        try { done(await makePin(a)); } catch { m.textContent = '이 환경에서는 PIN을 만들 수 없어요. (https 주소에서 열어 주세요)'; }
      });
    });

  const askPin = () => modal(
    `<form class="o-form"><h3>🔒 보호자 확인</h3><p>보호자 PIN 4자리를 넣어 주세요.</p>${pinInput('p', 'PIN')}<p class="msg bad" id="m"></p>
      <div class="btns"><button class="btn">확인</button><button type="button" class="btn alt" data-close>취소</button></div>
      <p><button type="button" class="link" data-forgot>PIN을 잊었어요</button></p></form>`,
    (dlg, done) => {
      const f = dlg.querySelector('form'), m = dlg.querySelector('#m');
      dlg.querySelector('[data-forgot]').addEventListener('click', () => done('forgot'));
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (Date.now() < blockedUntil) { m.textContent = `잠시 뒤에 다시 해 주세요. (${Math.ceil((blockedUntil - Date.now()) / 1000)}초)`; return; }
        if (await verifyPin(store.state, f.p.value)) { done(true); return; }
        fails += 1;
        if (fails >= 5) { blockedUntil = Date.now() + 30000; fails = 0; m.textContent = '여러 번 틀렸어요. 30초 뒤에 다시 해 주세요.'; } else m.textContent = `PIN이 달라요. (${fails}/5)`;
        f.p.value = ''; f.p.focus();
      });
    });

  const forgotPin = () => modal(
    `<form class="o-form"><h3>PIN을 잊었어요</h3><p>PIN을 지우고 새로 만들 수 있어요. <b>수영 기록과 도감은 그대로 남아요.</b><br><small class="muted">계속하려면 아래 칸에 <b>PIN 초기화</b>라고 적어 주세요.</small></p>
      <label>확인 문구<input name="t" autocomplete="off" required></label><p class="msg bad" id="m"></p>
      <div class="btns"><button class="btn danger">PIN 지우기</button><button type="button" class="btn alt" data-close>취소</button></div></form>`,
    (dlg, done) => {
      const f = dlg.querySelector('form');
      f.addEventListener('submit', (e) => { e.preventDefault(); if (f.t.value.trim() === 'PIN 초기화') done(true); else dlg.querySelector('#m').textContent = '문구가 달라요.'; });
    });

  /** 보호자 확인이 필요한 동작 앞에서 부른다. 처음이면 PIN을 만들게 하고, 통과하면 true */
  async function requireGuardian() {
    if (unlocked()) return true;
    if (!store.state.pin) {
      const pin = await createPin();
      if (!pin) return false;
      store.replace({ ...store.state, pin });
      unlock(); toast('🔐 보호자 PIN을 만들었어요');
      return true;
    }
    for (;;) {
      const r = await askPin();
      if (r === true) { unlock(); return true; }
      if (r === 'forgot') {
        if (await forgotPin()) { store.replace({ ...store.state, pin: null }); guardUntil = 0; refreshLock(); toast('PIN을 지웠어요. 새 PIN을 만들어 주세요'); return requireGuardian(); }
        continue;
      }
      return false;
    }
  }

  async function guardianMenu() {
    if (!(await requireGuardian())) return;
    const pick = await modal(
      `<div class="o-form"><h3>🔓 보호자 메뉴</h3><div class="stack">
        <button class="btn" data-v="add">📝 수영 기록 남기기</button>
        <button class="btn alt" data-v="pin">🔐 PIN 바꾸기</button>
        <button class="btn alt" data-v="lock">🔒 지금 잠그기</button>
        <button class="btn alt" data-close>닫기</button></div></div>`,
      (dlg, done) => dlg.addEventListener('click', (e) => { const v = e.target.closest('[data-v]')?.dataset.v; if (v) done(v); }));
    if (pick === 'add') recordForm(null);
    else if (pick === 'pin') { const pin = await createPin('PIN 바꾸기'); if (pin) { store.replace({ ...store.state, pin }); toast('🔐 PIN을 바꿨어요'); } }
    else if (pick === 'lock') { guardUntil = 0; refreshLock(); toast('🔒 잠갔어요'); }
  }

  // ---- 수영 기록 폼
  async function recordForm(existing) {
    if (!(await requireGuardian())) return;
    const today = E.todayStr();
    const st = store.state, mission = E.todayMission(st);
    const r = existing || { date: today, attended: true, timeSlot: '', skillsLearned: [], achievement: '', memo: '', missionDone: false };
    const ok = await modal(
      `<form class="o-form wide"><h3>📝 ${existing ? '수영 기록 고치기' : '수영 기록 남기기'}</h3>
        <label>날짜<input type="date" name="date" max="${today}" value="${esc(r.date)}" required></label>
        <label class="check"><input type="checkbox" name="attended" ${r.attended ? 'checked' : ''}> 수영 수업에 참여했어요</label>
        <label>수업 시간 또는 시간대<input name="timeSlot" list="slots" maxlength="40" placeholder="예: 오후 4시 수업" value="${esc(r.timeSlot)}"></label>
        <datalist id="slots"><option value="오전"><option value="오후"><option value="저녁"></datalist>
        <fieldset><legend>오늘 배운 수영 기술</legend><div class="checks">${SKILLS.map((s) => `<label class="check"><input type="checkbox" name="skill" value="${s.id}" ${r.skillsLearned.includes(s.id) ? 'checked' : ''}> ${esc(s.name)}</label>`).join('')}</div>
          <small class="muted">기술 상태(연습 중·습득 완료)는 '기술' 탭에서 바꿔요.</small></fieldset>
        <label>오늘의 성취<input name="achievement" maxlength="200" placeholder="예: 킥판으로 한 바퀴 완주!" value="${esc(r.achievement)}"></label>
        <label>메모<textarea name="memo" maxlength="500" rows="3" placeholder="선생님 말씀, 느낌 등">${esc(r.memo)}</textarea></label>
        <label class="check"><input type="checkbox" name="mission" ${r.missionDone ? 'checked' : ''}> 오늘의 미션을 마쳤어요 (+30 경험치)${mission ? `<small>🎯 ${esc(mission.skill.name)} · ${esc(mission.text)}</small>` : ''}</label>
        <p class="msg bad" id="m" role="alert"></p>
        <div class="btns"><button class="btn">저장</button><button type="button" class="btn alt" data-close>취소</button></div></form>`,
      (dlg, done) => {
        const f = dlg.querySelector('form'), m = dlg.querySelector('#m');
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = {
            date: f.date.value, attended: f.attended.checked, timeSlot: f.timeSlot.value, achievement: f.achievement.value, memo: f.memo.value,
            missionDone: f.mission.checked, skillsLearned: [...f.querySelectorAll('input[name=skill]:checked')].map((x) => x.value),
          };
          const res = existing ? E.updateRecord(store.state, existing.id, input) : E.addRecord(store.state, input);
          if (!res.ok) { m.textContent = ERRORS[res.error] || '저장하지 못했어요.'; return; }
          const before = snapshot(store.state);
          store.commit(res);
          done({ res, before });
        });
      });
    if (ok) { toast('✅ 수영 기록을 저장했어요'); await showCelebration(ok.res.events, ok.before); }
  }

  /** 저장으로 생긴 일(경험치·레벨업·보상·새 지역)을 축하 카드로 차례로 보여 준다 */
  async function showCelebration(events, before) {
    const plan = buildPlan(events, before, snapshot(store.state));
    if (plan.length) await celebrate(plan, store.state);
  }

  async function deleteRecord(id) {
    if (!(await requireGuardian())) return;
    const rec = store.state.records.find((x) => x.id === id);
    if (!rec) return;
    const yes = await confirmBox('수영 기록 삭제', `${fmtDate(rec.date)} 기록을 지울까요? 이 기록으로 받은 경험치는 취소되고, 이미 만난 바다 친구와 보물은 그대로 남아요.`, '삭제');
    if (yes) { store.commit(E.deleteRecord(store.state, id)); toast('🗑️ 기록을 삭제했어요'); }
  }

  // ---- 바다 생물 상세: 이전/다음으로 지금 필터의 생물을 넘겨 본다
  async function creatureDetail(id) {
    const list = UI.collFilter === 'all' ? CREATURES : CREATURES.filter((c) => c.rarity === UI.collFilter);
    let idx = Math.max(0, list.findIndex((c) => c.id === id));
    for (;;) {
      const c = list[idx], have = store.state.collection.creatures[c.id], no = CREATURES.indexOf(c) + 1;
      const go = await modal(
        `<div class="o-form detail" style="--c:${RARITY[c.rarity].color}">
          <div class="d-top"><span class="d-no">No.${String(no).padStart(2, '0')}</span><span class="rar-badge">${esc(RARITY[c.rarity].name)}</span></div>
          <div class="d-art ${have ? '' : 'locked'}">${ART.creatures[c.id]}</div>
          <h3>${have ? esc(c.name) : '???'}</h3>
          <p class="d-desc">${have ? esc(c.desc) : '아직 만나지 못했어요. 조건을 채우면 모습과 이야기가 열려요!'}</p>
          <div class="d-info"><div><small>🎯 획득 조건</small><b>${esc(sourceText('creature', c.id))}</b></div><div><small>🗓 획득 날짜</small><b>${have ? (have.date ? fmtDate(have.date) : '날짜 기록 없음') : '아직 없어요'}</b></div></div>
          <div class="btns"><button class="btn alt" data-v="prev" ${list.length < 2 ? 'disabled' : ''}>◀</button><button class="btn" data-close>닫기</button><button class="btn alt" data-v="next" ${list.length < 2 ? 'disabled' : ''}>▶</button></div></div>`,
        (dlg, done) => dlg.addEventListener('click', (e) => { const v = e.target.closest('[data-v]')?.dataset.v; if (v) done(v); }));
      if (go === 'next') idx = (idx + 1) % list.length;
      else if (go === 'prev') idx = (idx - 1 + list.length) % list.length;
      else return;
    }
  }

  // ---- 수영 기술 상세: 보는 화면과 (보호자 확인 후) 상태를 바꾸는 화면
  async function skillDetail(id, editing = false) {
    const sk = byId(SKILLS, id), no = SKILLS.indexOf(sk) + 1, cre = byId(CREATURES, sk.creature);
    for (;;) {
      const st = store.state, p = st.skills[id] || { status: 'before', firstDate: '', practiceDate: '', memo: '' };
      const hist = E.skillHistory(st, id);
      const today = E.todayStr();
      const logRows = [
        ...hist.events.map((e) => `<li>${e.type === 'done' ? '🏅 습득 완료' : '💪 연습 시작'} · ${fmtDate(e.date)} <small>+${e.xp} 경험치</small></li>`),
        hist.lessons.length ? `<li>📅 수업에서 배운 날 · ${hist.lessons.slice(-5).map((d) => fmtDate(d).slice(5)).join(', ')}${hist.lessons.length > 5 ? ` 외 ${hist.lessons.length - 5}번` : ''}</li>` : '',
      ].join('');
      const view = `<div class="o-form detail skilldetail s-${p.status}" style="--c:#22b872">
          <div class="d-top"><span class="d-no">기술 ${no}/${SKILLS.length}</span><span class="pill">${SKILL_STATUS[p.status]}</span></div>
          <div class="d-art ${p.status === 'before' ? 'locked' : ''}">${ART.skills[id]}</div>
          <h3>${esc(sk.name)}</h3><p class="d-desc">${esc(sk.desc)}</p>
          <div class="d-info">
            <div><small>🎯 연습 미션</small><b>${esc(sk.mission)}</b></div>
            <div><small>💪 연습 시작 / 🏅 최초 습득</small><b>${p.practiceDate ? fmtDate(p.practiceDate) : '아직'} / ${p.firstDate ? fmtDate(p.firstDate) : '아직'}</b></div>
            <div><small>📝 보호자 메모</small><b>${p.memo ? esc(p.memo) : '아직 없어요'}</b></div>
            <div><small>🎁 습득하면</small><b>경험치 +150, 바다 친구 「${esc(cre.name)}」</b></div>
          </div>
          ${logRows ? `<ul class="d-log">${logRows}</ul>` : ''}
          <div class="btns"><button class="btn" data-v="edit">🔒 보호자: 상태 바꾸기</button><button class="btn alt" data-close>닫기</button></div></div>`;
      const edit = `<form class="o-form detail skilldetail" style="--c:#22b872">
          <h3>${esc(sk.name)}</h3><p>수업 내용을 확인한 뒤 상태를 골라 주세요.</p>
          <div class="seg">${Object.entries(SKILL_STATUS).map(([k, label]) => `<label><input type="radio" name="status" value="${k}" ${p.status === k ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div>
          <label>바뀐 날짜<input type="date" name="date" max="${today}" value="${today}" required></label>
          <label>보호자 메모<textarea name="memo" maxlength="500" rows="3" placeholder="선생님 평가, 느낀 점 등">${esc(p.memo)}</textarea></label>
          <small class="muted">습득 완료로 바꾸면 경험치와 배지, 바다 친구를 받아요. 실제로 확인한 뒤에만 바꿔 주세요.</small>
          <p class="msg bad" id="m" role="alert"></p>
          <div class="btns"><button class="btn">저장</button><button type="button" class="btn alt" data-v="back">취소</button></div></form>`;
      const out = await modal(editing ? edit : view, (dlg, done) => {
        dlg.addEventListener('click', (e) => { const v = e.target.closest('[data-v]')?.dataset.v; if (v) done(v); });
        const f = dlg.querySelector('form');
        if (f) f.addEventListener('submit', async (e) => {
          e.preventDefault();
          const status = f.status.value, m = dlg.querySelector('#m');
          const firstDone = status === 'done' && !st.history.some((h) => h.key === `skilldone:${id}` && !h.voided);
          if (firstDone && !(await confirmBox('습득 완료로 바꿀까요?', `「${sk.name}」를 정말 익혔는지 확인했나요? 경험치 +150과 배지, 바다 친구를 받아요.`, '네, 습득했어요'))) return;
          const before = snapshot(store.state);
          const res = status === p.status ? E.setSkillMemo(store.state, id, f.memo.value) : E.setSkillStatus(store.state, id, status, { date: f.date.value, memo: f.memo.value });
          if (!res.ok) { m.textContent = ERRORS[res.error] || '저장하지 못했어요.'; return; }
          store.commit(res);
          done({ res, before });
        });
      });
      if (out === 'edit') { editing = await requireGuardian(); continue; }
      if (out === 'back') { editing = false; continue; }
      if (out && out.res) { toast('✅ 저장했어요'); await showCelebration(out.res.events, out.before); editing = false; continue; }
      return;
    }
  }

  // ---- 화면 그리기
  let lastPct = null;
  function render() {
    const id = current();
    view.innerHTML = VIEWS[id](store.state);
    root.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === id));
    refreshLock();
    if (id === 'home') {   // 경험치 막대가 이전 값에서 새 값으로 차오른다
      const fill = view.querySelector('.hero .bar i');
      const to = Math.round(E.growth(store.state).pct * 100);
      if (fill && lastPct !== null && lastPct !== to) {
        fill.style.transition = 'none'; fill.style.width = `${to < lastPct ? 0 : lastPct}%`; void fill.offsetWidth;
        fill.style.transition = ''; fill.style.width = `${to}%`;
      }
      lastPct = to;
    }
  }
  function toast(text) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; toasts.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  store.subscribe(() => render());
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

  // ---- 클릭 처리
  const say = (text, ok = true) => { const m = view.querySelector('#backupMsg'); if (m) { m.textContent = text; m.className = `msg ${ok ? 'ok' : 'bad'}`; } };
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    sfx.unlock();
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'add-record') recordForm(null);
    else if (act === 'filter') { UI.collFilter = el.dataset.v; render(); }
    else if (act === 'creature') creatureDetail(el.dataset.id);
    else if (act === 'skill') skillDetail(el.dataset.id);
    else if (act === 'edit-record') { const r = store.state.records.find((x) => x.id === el.dataset.id); if (r) recordForm(r); }
    else if (act === 'delete-record') deleteRecord(el.dataset.id);
    else if (act === 'guardian') guardianMenu();
    else if (act === 'mute') el.textContent = sfx.toggleMute() ? '🔇' : '🔊';
    else if (act === 'export') {
      const blob = new Blob([exportBackup(store.state)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = backupFileName(); a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      say('백업 파일을 저장했어요. 안전한 곳에 보관해 주세요.');
    } else if (act === 'import') view.querySelector('#importFile').click();
  });
  view.addEventListener('change', async (ev) => {
    if (ev.target.id !== 'importFile' || !ev.target.files[0]) return;
    const res = parseBackup(await ev.target.files[0].text());
    ev.target.value = '';
    if (!res.ok) { say('이 파일은 수영왕 백업 파일이 아니에요.', false); return; }
    if (!(await requireGuardian())) { say('보호자 확인이 필요해요.', false); return; }
    const n = E.attendedCount(res.state);
    if (!(await confirmBox('백업 불러오기', `지금 기록이 백업의 내용(수영 ${n}회)으로 바뀌어요. 계속할까요?`, '불러오기'))) { say('불러오기를 취소했어요.'); return; }
    store.replace(res.state);
    say('백업을 불러왔어요.');
  });

  render();
  if (import.meta.env?.DEV) window.__ocean = { store, E, celebrate, buildPlan, snapshot };
  return store;
}
