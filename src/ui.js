// HUD / 화면 전환 (DOM)
import { trophySvg, trophyOf, allTrophies, TIERS, TROPHY_COUNT, trophyStatus } from './trophies.js';
import { progress } from './progress.js';
import { sfx } from './audio.js';
const $ = (id) => document.getElementById(id);

const el = {
  hud: $('hud'), question: $('question'), qText: $('q-text'),
  coinN: $('coin-n'), hearts: $('hearts'), combo: $('combo'), comboN: $('combo-n'),
  bar: $('progress-bar'), barText: $('progress-text'),
  toast: $('toast'), feedback: $('feedback'), flash: $('flash'),
  answerNote: $('answer-note'), healNote: $('heal-note'),
  start: $('screen-start'), pause: $('screen-pause'), result: $('screen-result'), promo: $('screen-promo'),
  resultTitle: $('result-title'), resultEmoji: $('result-emoji'), resultTable: $('result-table'),
};

const retrigger = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
const beltChip = (belt) => `<i class="belt b-${belt.id}"></i>`;
let feedbackTimer = 0;
let promoDone = null;

$('btn-promo').addEventListener('click', () => {
  const fn = promoDone; promoDone = null;
  $('promo-fx').innerHTML = '';
  if (fn) fn();
});

export const ui = {
  showScreen(name) {
    el.start.classList.toggle('hidden', name !== 'start');
    el.pause.classList.toggle('hidden', name !== 'pause');
    el.result.classList.toggle('hidden', name !== 'result');
    el.promo.classList.toggle('hidden', name !== 'promo');
    $('screen-trophy')?.classList.toggle('hidden', name !== 'trophy');
    $('screen-trophy-pop')?.classList.toggle('hidden', name !== 'trophypop');
    el.hud.classList.toggle('hidden', ['start', 'result', 'promo', 'trophy', 'trophypop'].includes(name));
  },
  setQuestion(text) { el.qText.textContent = text; retrigger(el.question, 'pop'); },
  setCoins(n) { el.coinN.textContent = n; },
  setHearts(n, max = 5) {
    el.hearts.innerHTML = `${'❤️'.repeat(Math.max(0, n))}<span class="empty">${'🤍'.repeat(Math.max(0, max - n))}</span>`;
    el.hearts.setAttribute('aria-label', `생명 ${n} / ${max}`);
  },
  setCombo(n) { el.comboN.textContent = n; el.combo.classList.toggle('hot', n >= 3); },
  setProgress(done, total) {
    el.bar.style.width = `${(done / total) * 100}%`;
    el.barText.textContent = `${Math.min(done + 1, total)} / ${total}`;
  },
  toast(text, bad = false) { el.toast.textContent = text; el.toast.classList.toggle('bad', bad); retrigger(el.toast, 'show'); },
  /** 오답일 때 정답을 잠깐 알려 주는 작은 안내 */
  answerNote(text) { el.answerNote.textContent = text; retrigger(el.answerNote, 'show'); },
  /** 코인으로 생명을 회복했을 때의 안내 */
  healNote(text) { el.healNote.textContent = text; retrigger(el.healNote, 'show'); retrigger(el.hearts, 'heal'); },
  flash(kind) { el.flash.className = ''; void el.flash.offsetWidth; el.flash.className = kind; },
  feedback(html, ms = 3200) {
    el.feedback.innerHTML = html;
    el.feedback.classList.add('show');
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => el.feedback.classList.remove('show'), ms);
  },
  clearToast() { el.toast.classList.remove('show'); el.answerNote.classList.remove('show'); el.healNote.classList.remove('show'); },
  hideFeedback() { clearTimeout(feedbackTimer); el.feedback.classList.remove('show'); },

  /** 성장 정보(띠·레벨·누적 성공·다음 목표)를 HUD와 각 화면의 .growth 칸에 그린다 */
  renderGrowth(g) {
    const crown = g.title ? '👑 ' : '';
    $('level').innerHTML = `${beltChip(g.belt)}${crown}Lv.${g.belt.level} ${g.belt.name}`;
    const next = g.next
      ? `<span>다음 목표: ${beltChip(g.next)}<b>${g.next.name}</b></span> <span>승급까지 <b>${g.remain}회</b> 성공 필요</span>`
      : `🏆 <b>${g.title}</b> · 최고 단계 달성!`;
    // 트로피 수집: 검은띠 이후에도 100개까지 새로운 목표가 이어진다
    const tr = g.trophy;
    const trophyRow = tr ? `<div class="g-next g-trophy"><span>🏆 트로피 <b>${tr.count}/${TROPHY_COUNT}</b> (${tr.pct}%)</span> ${tr.next ? `<span>🎯 다음 <b>${tr.next.n}번 「${tr.next.name}」</b></span>` : '<span><b>모두 모았어요!</b></span>'}</div>` : '';
    const html = `
      <div class="g-row">${beltChip(g.belt)}<b>${crown}${g.belt.name} Lv.${g.belt.level}</b><span>누적 성공 ${g.clears}회</span></div>
      <div class="g-bar"><div style="width:${Math.round(g.pct * 100)}%"></div><span>${g.next ? `${g.clears} / ${g.next.need}` : 'MAX'}</span></div>
      <div class="g-next">${next}</div>${trophyRow}`;
    document.querySelectorAll('.growth').forEach((n) => { n.innerHTML = html; });
  },

  /** 승급 축하 화면. 확인을 누르면 onDone이 불린다. */
  showPromo(belt, g, onDone) {
    const black = belt.id === 'black';
    el.promo.classList.toggle('black', black);
    $('promo-kicker').textContent = black ? '🎆 최종 승급 🎆' : '🥋 띠 승급!';
    $('promo-belt').className = `belt big b-${belt.id}`;
    $('promo-name').textContent = `${belt.name} · Lv.${belt.level}`;
    $('promo-msg').textContent = black ? '축하해! 주호가 태권도 검은띠를 획득했어요!' : `주호가 ${belt.name}로 승급했어요!`;
    $('promo-title').textContent = black ? `👑 특별 칭호 「${g.title}」 획득` : (g.next ? `다음 목표는 ${g.next.name}!` : '');
    // 색종이 + (검은띠) 불꽃
    const fx = $('promo-fx');
    const colors = black ? ['#ffd23f', '#fff3a0', '#ffffff', '#ff4757', '#1e90ff'] : ['#ff4757', '#ffd23f', '#2ed573', '#1e90ff', '#a55eea'];
    let html = '';
    for (let i = 0; i < (black ? 70 : 40); i++) {
      html += `<i class="confetti" style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 3).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 2).toFixed(2)}s"></i>`;
    }
    if (black) {
      for (let b = 0; b < 7; b++) {
        const x = 8 + Math.random() * 84, y = 6 + Math.random() * 50, delay = (b * 0.45).toFixed(2);
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2, r = 60 + Math.random() * 50;
          html += `<i class="spark" style="left:${x}%;top:${y}%;background:${colors[(b + i) % colors.length]};--dx:${(Math.cos(a) * r).toFixed(0)}px;--dy:${(Math.sin(a) * r).toFixed(0)}px;animation-delay:${delay}s"></i>`;
        }
      }
    }
    fx.innerHTML = html;
    promoDone = onDone;
    ui.showScreen('promo');
  },

  showResult(r) {
    el.resultTitle.textContent = r.cleared ? '도착! 참 잘했어요!' : '아깝다! 다시 도전!';
    $('result-sub').textContent = `${r.topicName} · ${r.paceName}`;
    el.resultEmoji.textContent = r.cleared ? (r.accuracy >= 90 ? '🏆' : '🎉') : '💪';
    el.result.classList.toggle('cleared', !!r.cleared);
    const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60);
    const g = r.growth;
    const rows = [
      ['⏱ 플레이 시간', `${mm}분 ${String(ss).padStart(2, '0')}초`],
      ['📝 전체 문제 수', `${r.total}문제`],
      ['⭕ 정답 수', `${r.correct}개`],
      ['❌ 오답 수', `${r.wrong}개`],
      ['🎯 정답률', `${r.accuracy}%`],
      ['🪙 획득 코인', `+${r.earned}개 (보유 ${r.coins}개)`],
      ['🔥 최고 콤보', `${r.maxCombo}연속`],
      ['🥋 현재 띠', `${beltChip(g.belt)}${g.belt.name}`],
      ['⭐ 캐릭터 레벨', `Lv.${g.belt.level}`],
      ['🏁 누적 성공', `${g.clears}회`],
      ['⏫ 다음 승급까지', g.next ? `${g.remain}회 (${g.next.name})` : '최고 단계!'],
      ['🏆 트로피 수집', `${g.trophy.count}/${TROPHY_COUNT}개 (${g.trophy.pct}%)`],
    ];
    el.resultTable.innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
    const wrongBox = $('result-wrongs');
    if (r.wrongList?.length) {
      wrongBox.innerHTML = `<summary>📖 틀린 문제 다시 보기 (${r.wrongList.length})</summary>` +
        r.wrongList.map((w) => `<p><b>${w.expr} = ${w.answer}</b><br/><small>${w.explain}</small></p>`).join('');
      wrongBox.open = false;
      wrongBox.classList.remove('hidden');
    } else wrongBox.classList.add('hidden');
    ui.showScreen('result');
  },
};

// ---------------------------------------------------------------- 트로피 도감 · 획득 팝업
const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
const rand = (a, b) => a + Math.random() * (b - a);

/** 등급마다 다른 배경 효과 (색종이·반짝임·불씨·물방울·잎·번개·불꽃놀이) */
function trophyFx(tierId, grand) {
  let h = '';
  const confetti = (cols, n) => { for (let i = 0; i < n; i++) h += `<i class="confetti" style="left:${rand(0, 100).toFixed(1)}%;background:${cols[i % cols.length]};animation-delay:${rand(0, 3).toFixed(2)}s;animation-duration:${rand(2.4, 4.4).toFixed(2)}s"></i>`; };
  const float = (ch, cls, n, extra = '') => { for (let i = 0; i < n; i++) h += `<b class="${cls}" style="left:${rand(2, 98).toFixed(1)}%;animation-delay:${rand(0, 3).toFixed(2)}s;animation-duration:${rand(2.2, 4.2).toFixed(2)}s;font-size:${rand(16, 34).toFixed(0)}px;${extra}">${ch}</b>`; };
  const bursts = (cols, n, per) => { for (let b = 0; b < n; b++) { const x = rand(8, 92), y = rand(6, 55); for (let i = 0; i < per; i++) { const a = (i / per) * Math.PI * 2, r = rand(60, 120); h += `<i class="spark" style="left:${x.toFixed(0)}%;top:${y.toFixed(0)}%;background:${cols[(b + i) % cols.length]};--dx:${(Math.cos(a) * r).toFixed(0)}px;--dy:${(Math.sin(a) * r).toFixed(0)}px;animation-delay:${(b * 0.4).toFixed(2)}s"></i>`; } } };
  if (grand) { confetti(['#ffd23f', '#fff3a0', '#ffffff', '#ff2e63', '#ffb300'], 90); bursts(['#ffd23f', '#fff3a0', '#ff2e63', '#fff'], 9, 16); float('👑', 'tp-fall', 10); return h; }
  switch (tierId) {
    case 'bronze': confetti(['#f5be8a', '#c9823f', '#ffe3c2', '#ff9a5c'], 36); break;
    case 'silver': confetti(['#ffffff', '#cdd5df', '#9fb4d0', '#e6f0ff'], 44); break;
    case 'gold': confetti(['#ffd23f', '#fff3b0', '#ffb300', '#fff'], 56); break;
    case 'platinum': float('✦', 'tp-twinkle', 26, 'color:#d9f2ff'); confetti(['#cfefff', '#fff'], 18); break;
    case 'diamond': float('✦', 'tp-twinkle', 34, 'color:#8ff4ff'); float('◆', 'tp-twinkle', 14, 'color:#fff'); break;
    case 'ruby': float('●', 'tp-ember', 34, 'color:#ff5a72'); float('●', 'tp-ember', 14, 'color:#ffb347'); break;
    case 'sapphire': float('○', 'tp-bubble', 30, 'color:#a8d6ff'); h += '<i class="tp-ring"></i><i class="tp-ring r2"></i><i class="tp-ring r3"></i>'; break;
    case 'emerald': float('🍃', 'tp-fall', 22); confetti(['#28bb69', '#c2ffd8'], 16); break;
    case 'legend': float('⚡', 'tp-twinkle', 16, 'color:#ffd54a'); float('✦', 'tp-twinkle', 22, 'color:#ecd4ff'); h += '<i class="tp-flash"></i>'; break;
    case 'master': bursts(['#ffd23f', '#fff3a0', '#ff2e63', '#fff'], 6, 14); confetti(['#ffd23f', '#fff3a0', '#14141c'], 40); break;
    default: break;
  }
  return h;
}

let trophyDone = null;
$('btn-trophy-ok')?.addEventListener('click', () => {
  const fn = trophyDone; trophyDone = null;
  $('tp-fx').innerHTML = '';
  if (fn) fn();
});

Object.assign(ui, {
  /** 새 트로피 축하 팝업. 등급마다 색·움직임·효과음이 다르고, 100번째는 특별 연출이다. 확인을 누르면 onDone. */
  showTrophyPop(n, onDone) {
    const t = trophyOf(n), tier = t.tier, st = trophyStatus(progress.data.trophyClears);
    const pop = $('screen-trophy-pop');
    pop.className = `screen tier-${tier.id}${t.grand ? ' grand' : ''}`;
    pop.style.setProperty('--tp', tier.pal.glow);
    pop.style.setProperty('--tp2', tier.pal.mid);
    $('tp-kicker').textContent = t.grand ? '🎆 마지막 트로피! 🎆' : '🏆 새 트로피 획득!';
    $('tp-cup').innerHTML = trophySvg(n);
    $('tp-tier').textContent = `${tier.name} · ${n}번 트로피`;
    $('tp-name').textContent = t.grand ? `👑 ${t.name} 👑` : t.name;
    $('tp-cond').textContent = t.cond;
    $('tp-next').textContent = st.next ? `🎯 다음 목표: ${st.next.n}번 「${st.next.name}」` : '🎉 트로피 100개를 모두 모았어요!';
    $('tp-count').textContent = `수집 ${st.count}/${TROPHY_COUNT}개 (${st.pct}%)`;
    $('tp-fx').innerHTML = trophyFx(tier.id, t.grand);
    trophyDone = onDone;
    ui.showScreen('trophypop');
    sfx.trophy(TIERS.indexOf(tier), t.grand);
  },

  /** 트로피 도감: 10×10 칸(한 줄이 한 등급), 수집률, 현재 단계와 다음 목표, 칸을 누르면 이름·조건·날짜 */
  openTrophies(selectN) {
    const clears = progress.data.trophyClears, st = trophyStatus(clears);
    const sel = selectN || (st.next ? st.next.n : TROPHY_COUNT);
    $('tr-sum').innerHTML = `
      <div class="tr-top"><b>🏆 ${st.count} / ${TROPHY_COUNT}개</b><span>수집률 <b>${st.pct}%</b></span></div>
      <div class="g-bar"><div style="width:${st.pct}%"></div><span>${st.count} / ${TROPHY_COUNT}</span></div>
      <div class="tr-line">현재 단계: <b>${st.tier ? `${st.tier.name} (${st.tierDone}/10)` : '시작 전'}</b></div>
      <div class="tr-line">${st.next ? `다음 목표: <b>${st.next.n}번 「${st.next.name}」</b> · ${st.next.cond}` : '🎉 <b>모든 트로피를 모았어요!</b>'}</div>`;
    $('tr-legend').innerHTML = TIERS.map((x, i) => `<span style="--c:${x.ring}">${i * 10 + 1}~${i * 10 + 10} ${x.name}</span>`).join('');
    $('tr-grid').innerHTML = allTrophies().map((t) => {
      const on = t.n <= clears;
      return `<button class="tr-cell ${on ? 'on' : 'off'}${t.n === sel ? ' sel' : ''}" data-n="${t.n}" style="--c:${t.tier.ring}" aria-label="${t.n}번 ${on ? t.name : '잠금'}">${trophySvg(t.n)}<i>${t.n}</i></button>`;
    }).join('');
    const show = (n) => {
      const t = trophyOf(n), on = n <= clears, d = progress.trophyDate(n);
      $('tr-detail').className = on ? 'on' : 'off';
      $('tr-detail').style.setProperty('--c', t.tier.ring);
      $('tr-detail').innerHTML = `<span class="tr-big">${trophySvg(n)}</span><span class="tr-info">
        <b>${n}번 · ${on ? t.name : '???'}</b>
        <small>${t.tier.name} 등급 · ${t.tier.theme}</small>
        <small>달성 조건: ${t.cond}</small>
        <small>${on ? `🗓 획득: ${d ? fmtDate(d) : '날짜 기록 이전에 달성'}` : `🔒 잠금 · 앞으로 ${n - clears}회 더 성공하면 획득`}</small></span>`;
      $('tr-grid').querySelectorAll('.tr-cell').forEach((c) => c.classList.toggle('sel', Number(c.dataset.n) === n));
    };
    $('tr-grid').onclick = (e) => { const c = e.target.closest('.tr-cell'); if (c) show(Number(c.dataset.n)); };
    show(sel);
    ui.showScreen('trophy');
  },
});
