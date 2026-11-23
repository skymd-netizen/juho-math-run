// 보상·레벨업·지역 해금 축하 연출. plan.js가 만든 순서(steps)대로 전체 화면 카드를 하나씩 보여 준다.
// 희귀도마다 움직임·배경 효과·효과음이 다르다: 일반(방울) → 레어(반짝임) → 에픽(회전·번개빛) → 레전드(황금 번쩍·햇살) / 칭호(황금).
import { CREATURES, TREASURES, TITLES, SKILLS, SPECIALS, MILESTONES, RARITY, LEVELS, byId } from './data.js';
import { ART } from './art.js';
import { sfx } from '../audio.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rand = (a, b) => a + Math.random() * (b - a);
const fmtDate = (s) => (s ? s.replace(/-/g, '.') : '');

/** 어떻게 얻었는지 한 줄 */
export function sourceText(kind, id) {
  if (kind === 'creature') {
    const s = byId(CREATURES, id).source;
    if (s.type === 'milestone') return `누적 수영 ${s.count}회 달성`;
    if (s.type === 'skill') return `「${byId(SKILLS, s.skill).name}」 기술 습득`;
    if (s.type === 'level') return `수영 레벨 ${s.level} 달성`;
    return `특별 미션: ${SPECIALS.find((x) => x.id === s.mission).name}`;
  }
  if (kind === 'treasure') return byId(TREASURES, id).condText;
  const m = MILESTONES.find((x) => x.id === id);
  return m ? `누적 수영 ${m.count}회 달성` : '';
}

const KINDS = {
  creature: { kicker: '🎁 새로운 바다 친구!', list: CREATURES, art: ART.creatures, bag: 'creatures' },
  treasure: { kicker: '💎 새로운 보물을 찾았어요!', list: TREASURES, art: ART.treasures, bag: 'treasures' },
  title: { kicker: '🏅 새로운 칭호!', list: TITLES, art: ART.titles, bag: 'titles' },
};

// ---------------------------------------------------------------- 배경 효과 조각
function fx(kind) {
  let h = '';
  const bits = (ch, cls, n, extra = '') => { for (let i = 0; i < n; i++) h += `<b class="${cls}" style="left:${rand(2, 98).toFixed(1)}%;animation-delay:${rand(0, 3).toFixed(2)}s;animation-duration:${rand(2.6, 4.8).toFixed(2)}s;font-size:${rand(14, 34).toFixed(0)}px;${extra}">${ch}</b>`; };
  const confetti = (cols, n) => { for (let i = 0; i < n; i++) h += `<i class="oc-confetti" style="left:${rand(0, 100).toFixed(1)}%;background:${cols[i % cols.length]};animation-delay:${rand(0, 3).toFixed(2)}s;animation-duration:${rand(2.4, 4.4).toFixed(2)}s"></i>`; };
  switch (kind) {
    case 'common': bits('○', 'oc-bubble', 22, 'color:#ffffffcc'); break;
    case 'rare': bits('✦', 'oc-twinkle', 24, 'color:#d9f2ff'); bits('○', 'oc-bubble', 10, 'color:#ffffffaa'); h += '<i class="oc-ring"></i><i class="oc-ring r2"></i>'; break;
    case 'epic': bits('✦', 'oc-twinkle', 30, 'color:#f0dcff'); bits('✧', 'oc-twinkle', 14, 'color:#fff'); h += '<i class="oc-ring"></i><i class="oc-ring r2"></i><i class="oc-ring r3"></i>'; break;
    case 'legend': confetti(['#ffd23f', '#fff3a0', '#ffffff', '#ffb300', '#7affd9'], 70); bits('✦', 'oc-twinkle', 26, 'color:#fff3a0'); h += '<i class="oc-flash"></i>'; break;
    case 'levelup': confetti(['#4dd0ff', '#5fe3c8', '#ffd23f', '#ffffff', '#ff8fc0'], 50); bits('○', 'oc-bubble', 14, 'color:#ffffffcc'); break;
    case 'region': bits('○', 'oc-bubble', 18, 'color:#ffffffcc'); h += '<i class="oc-ring"></i><i class="oc-ring r2"></i>'; break;
    case 'summary': bits('○', 'oc-bubble', 12, 'color:#ffffffaa'); break;
    default: break;
  }
  return h;
}

// ---------------------------------------------------------------- 단계별 카드
function cardFor(step, state) {
  if (step.type === 'summary') {
    const f = step.from, t = step.to;
    const up = step.levelUps > 0;
    return {
      theme: 'summary', fxKind: 'summary', sound: () => sfx.bonus(),
      html: `<div class="c-kicker">${step.reason === 'skill' ? '💪 수영 기술이 쑥쑥 자라요!' : '🏊 수영 완료!'}</div>
        <div class="c-art oc-pop">✨</div>
        <div class="c-name">경험치 +${step.xp}</div>
        <div class="c-lvl">Lv.${f.lv} ${esc(f.levelName)}</div>
        <div class="c-bar"><i style="width:${Math.round(f.pct * 100)}%" data-to="${up ? 100 : Math.round(t.pct * 100)}"></i></div>
        <div class="c-desc">${up ? '경험치가 가득 찼어요! 🎉' : t.next ? `다음 레벨까지 ${t.remain} 남았어요` : '최고 레벨이에요!'}</div>
        <div class="c-meta">누적 수영 ${t.count}회</div>`,
    };
  }
  if (step.type === 'badge') {
    const sk = byId(SKILLS, step.skill), have = state.skills[step.skill];
    return {
      theme: 'badge', fxKind: 'levelup', sound: () => sfx.trophy(4),
      html: `<div class="c-kicker">🏅 새로운 기술 배지!</div>
        <div class="c-art oc-spin">${ART.skills[step.skill]}</div>
        <div class="c-rar" style="--c:#22b872">습득 완료</div>
        <div class="c-name">${esc(sk.name)}</div>
        <div class="c-desc">${esc(sk.desc)}</div>
        <div class="c-meta">최초 습득 ${fmtDate(have?.firstDate)}</div>`,
    };
  }
  if (step.type === 'levelup') {
    const L = LEVELS[step.level - 1], next = LEVELS[step.level];
    return {
      theme: 'levelup', fxKind: 'levelup', sound: () => sfx.promote(),
      html: `<div class="c-kicker">🎉 LEVEL UP!</div>
        <div class="c-badge oc-pop">Lv.${step.level}</div>
        <div class="c-name">${esc(L.name)}</div>
        <div class="c-desc">${step.level === LEVELS.length ? '최고 레벨! 바다왕이 되었어요 👑' : `다음 레벨 「${esc(next.name)}」까지 경험치 ${next.need}`}</div>`,
    };
  }
  if (step.type === 'region') {
    return {
      theme: 'region', fxKind: 'region', sound: () => sfx.special(),
      html: `<div class="c-kicker">🗺️ 새로운 지역이 열렸어요!</div>
        <div class="c-art oc-swim">${step.emoji}</div>
        <div class="c-name">${esc(step.name)}</div>
        <div class="c-desc">바다 생물을 ${step.need}종 모아서 탐험할 수 있게 되었어요!</div>`,
    };
  }
  // 보상
  const K = KINDS[step.kind], item = byId(K.list, step.id);
  const have = state.collection[K.bag][step.id];
  const rar = step.rarity, label = RARITY[rar].name;
  const motion = { common: 'oc-pop', rare: 'oc-swim', epic: 'oc-spin', legend: 'oc-slam' }[rar];
  const total = step.kind === 'creature' ? CREATURES.length : step.kind === 'treasure' ? TREASURES.length : 0;
  const got = Object.keys(state.collection[K.bag]).length;
  const sound = () => {
    if (step.kind === 'title') sfx.trophy(9, step.id === 'ocean_legend');
    else if (rar === 'legend') { sfx.trophy(9, false); setTimeout(() => sfx.promote(), 500); }
    else if (rar === 'epic') sfx.trophy(6);
    else if (rar === 'rare') sfx.trophy(3);
    else sfx.bonus();
  };
  return {
    theme: `r-${rar}`, fxKind: rar, sound,
    html: `<div class="c-kicker">${step.kind === 'creature' && rar === 'legend' ? `✨ ${item.name.startsWith('전설의') ? '' : '전설의 '}${esc(item.name)} 등장! ✨` : K.kicker}</div>
      <div class="c-art ${motion}">${K.art[step.id]}</div>
      ${step.kind === 'title' ? '<div class="c-rar" style="--c:#f5a300">칭호 · 트로피</div>' : `<div class="c-rar" style="--c:${RARITY[rar].color}">${esc(label)}</div>`}
      <div class="c-name">${esc(item.name)}</div>
      <div class="c-desc">${esc(item.desc)}</div>
      <div class="c-meta">얻은 방법: ${esc(sourceText(step.kind, step.id))}${have?.date ? ` · ${fmtDate(have.date)}` : ''}</div>
      ${total ? `<div class="c-meta">${step.kind === 'creature' ? '바다 생물 도감' : '보물 도감'} ${got}/${total}</div>` : ''}`,
  };
}

/** steps를 차례로 보여 준다. 끝나거나 건너뛰면 resolve */
export function celebrate(steps, state) {
  if (!steps.length) return Promise.resolve();
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog');
    dlg.className = 'o-celebrate';
    document.body.appendChild(dlg);
    let i = 0;
    const finish = () => { if (dlg.open) dlg.close(); dlg.remove(); resolve(); };
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); finish(); });

    function show() {
      const step = steps[i], c = cardFor(step, state);
      const last = i === steps.length - 1;
      dlg.className = `o-celebrate ${c.theme}`;
      dlg.innerHTML = `<div class="c-fx" aria-hidden="true">${fx(c.fxKind)}</div><div class="c-rays" aria-hidden="true"></div>
        <div class="c-body" role="status">${c.html}</div>
        <div class="c-nav"><span class="c-count">${i + 1} / ${steps.length}</span>
          <button class="btn" data-next autofocus>${last ? '확인' : '다음 ▶'}</button>${steps.length > 1 && !last ? '<button class="btn alt" data-skip>건너뛰기</button>' : ''}</div>`;
      dlg.querySelector('[data-next]').addEventListener('click', () => { if (last) finish(); else { i += 1; show(); } });
      dlg.querySelector('[data-skip]')?.addEventListener('click', finish);
      const bar = dlg.querySelector('.c-bar i');
      if (bar) setTimeout(() => { bar.style.width = `${bar.dataset.to}%`; }, 450);   // 경험치 막대가 차오른다
      c.sound();
    }
    dlg.showModal();
    show();
  });
}
