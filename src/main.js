import { createGame, TOPICS, SPEEDS } from './game.js';
import { setupInput } from './input.js';
import { sfx } from './audio.js';
import { ui } from './ui.js';

const game = createGame(document.getElementById('game'));

setupInput({
  onLeft: () => game.left(),
  onRight: () => game.right(),
  onJump: () => game.jump(),
  onPause: () => game.togglePause(),
});

const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
// 선택 순서: ① 문제 종류 → ② 속도. 마지막으로 고른 값을 기억한다
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
let topic = store.get('juho-topic', 'add');
let pace = store.get('juho-pace', 'slow');
if (!TOPICS[topic]) topic = 'add';
if (!SPEEDS[pace]) pace = 'slow';

const stepTopic = document.getElementById('step-topic');
const stepPace = document.getElementById('step-pace');
const topicButtons = [...document.querySelectorAll('[data-topic]')];
const paceButtons = [...document.querySelectorAll('[data-pace]')];
const mark = () => {
  topicButtons.forEach((b) => b.classList.toggle('last', b.dataset.topic === topic));
  paceButtons.forEach((b) => b.classList.toggle('last', b.dataset.pace === pace));
};
const showStep = (step) => {
  stepTopic.classList.toggle('hidden', step !== 'topic');
  stepPace.classList.toggle('hidden', step !== 'pace');
  document.getElementById('picked-topic').textContent = TOPICS[topic].name;
};
const begin = () => { sfx.unlock(); game.start(topic, pace); };

topicButtons.forEach((b) => b.addEventListener('click', () => {
  topic = b.dataset.topic; store.set('juho-topic', topic); mark(); showStep('pace');
}));
paceButtons.forEach((b) => b.addEventListener('click', () => {
  pace = b.dataset.pace; store.set('juho-pace', pace); mark(); begin();
}));
const toMenu = () => { showStep('topic'); game.toMenu(); };
on('btn-back', () => showStep('topic'));
on('btn-retry', begin);
on('btn-levels', toMenu);
mark();
// 처음 띠로 돌아가기: 실수로 누르지 않도록 두 번 눌러야 한다
{
  const b = document.getElementById('btn-reset-belt');
  const label = b.textContent;
  let timer = 0;
  const idle = () => { clearTimeout(timer); b.classList.remove('ask'); b.textContent = label; };
  b.addEventListener('click', () => {
    if (!b.classList.contains('ask')) {
      b.classList.add('ask'); b.textContent = '정말 흰띠로 돌아갈까요? 한 번 더 누르기';
      timer = setTimeout(idle, 4000);
      return;
    }
    idle(); game.resetBelt();
    b.textContent = '흰띠로 돌아왔어요!'; timer = setTimeout(idle, 1800);
  });
}
on('btn-pause', () => game.togglePause());
on('btn-resume', () => game.togglePause());
on('btn-quit', toMenu);
on('btn-mute', (e) => { e.currentTarget.textContent = sfx.toggleMute() ? '🔇' : '🔊'; });

// 결과 화면에서 Enter·Space로 같은 설정으로 다시 시작
window.addEventListener('keydown', (e) => {
  if ((e.code === 'Enter' || e.code === 'Space') && game.state.mode === 'over' && !game.state.promo) begin();
});

// 게이트 숫자(캔버스)에도 같은 글자체가 쓰이도록 미리 불러 둔다
document.fonts?.load('700 100px Gaegu');

ui.showScreen('start');
if (import.meta.env.DEV) { window.__game = game; import('./progress.js').then((m) => { window.__progress = m; }); }
