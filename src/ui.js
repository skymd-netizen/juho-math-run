// HUD / 화면 전환 (DOM)
const $ = (id) => document.getElementById(id);

const el = {
  hud: $('hud'), question: $('question'), qText: $('q-text'),
  coinN: $('coin-n'), hearts: $('hearts'), combo: $('combo'), comboN: $('combo-n'),
  bar: $('progress-bar'), barText: $('progress-text'),
  toast: $('toast'), feedback: $('feedback'), flash: $('flash'),
  start: $('screen-start'), pause: $('screen-pause'), result: $('screen-result'),
  resultTitle: $('result-title'), resultEmoji: $('result-emoji'), resultTable: $('result-table'),
};

const retrigger = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
let feedbackTimer = 0;

export const ui = {
  showScreen(name) {
    el.start.classList.toggle('hidden', name !== 'start');
    el.pause.classList.toggle('hidden', name !== 'pause');
    el.result.classList.toggle('hidden', name !== 'result');
    el.hud.classList.toggle('hidden', name === 'start' || name === 'result');
  },
  setLevel(name) { $('level').textContent = name; },
  setQuestion(text) { el.qText.textContent = text; retrigger(el.question, 'pop'); },
  setCoins(n) { el.coinN.textContent = n; },
  setHearts(n, max = 3) { el.hearts.textContent = '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n)); },
  setCombo(n) { el.comboN.textContent = n; el.combo.classList.toggle('hot', n >= 3); },
  setProgress(done, total) {
    el.bar.style.width = `${(done / total) * 100}%`;
    el.barText.textContent = `${Math.min(done + 1, total)} / ${total}`;
  },
  toast(text, bad = false) { el.toast.textContent = text; el.toast.classList.toggle('bad', bad); retrigger(el.toast, 'show'); },
  flash(kind) { el.flash.className = ''; void el.flash.offsetWidth; el.flash.className = kind; },
  feedback(html, ms = 3200) {
    el.feedback.innerHTML = html;
    el.feedback.classList.add('show');
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => el.feedback.classList.remove('show'), ms);
  },
  clearToast() { el.toast.classList.remove('show'); },
  hideFeedback() { clearTimeout(feedbackTimer); el.feedback.classList.remove('show'); },
  showResult(r) {
    el.resultTitle.textContent = r.cleared ? '도착! 참 잘했어요!' : '게임 오버';
    $('result-sub').textContent = `${r.topicName} · ${r.paceName}`;
    el.resultEmoji.textContent = r.cleared ? (r.accuracy >= 90 ? '🏆' : '🎉') : '💪';
    const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60);
    const rows = [
      ['⏱ 플레이 시간', `${mm}분 ${String(ss).padStart(2, '0')}초`],
      ['📝 전체 문제 수', `${r.total}문제`],
      ['⭕ 정답 수', `${r.correct}개`],
      ['❌ 오답 수', `${r.wrong}개`],
      ['🎯 정답률', `${r.accuracy}%`],
      ['🪙 획득 코인', `${r.coins}개`],
      ['🔥 최고 콤보', `${r.maxCombo}연속`],
    ];
    el.resultTable.innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
    ui.showScreen('result');
  },
};
