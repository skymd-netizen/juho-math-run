// HUD / 화면 전환 (DOM)
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
    el.hud.classList.toggle('hidden', name === 'start' || name === 'result' || name === 'promo');
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
    const html = `
      <div class="g-row">${beltChip(g.belt)}<b>${crown}${g.belt.name} Lv.${g.belt.level}</b><span>누적 성공 ${g.clears}회</span></div>
      <div class="g-bar"><div style="width:${Math.round(g.pct * 100)}%"></div><span>${g.next ? `${g.clears} / ${g.next.need}` : 'MAX'}</span></div>
      <div class="g-next">${next}</div>`;
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
