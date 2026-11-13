// 앱 시작: 테마 하나를 받아 게임을 만들고 시작 화면(① 문제 종류 → ② 속도)·버튼을 연결한다.
// 태권도 버전(main.js)과 낚시 버전(fishing-main.js)이 같은 코드를 쓴다.
import { createGame, TOPICS, SPEEDS } from './game.js';
import { setupInput } from './input.js';
import { sfx } from './audio.js';

export function startApp(theme) {
  const { ui } = theme;
  const game = createGame(document.getElementById('game'), theme);

  setupInput({
    onLeft: () => game.left(),
    onRight: () => game.right(),
    onJump: () => game.jump(),
    onPause: () => game.togglePause(),
  });

  const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
  // 마지막으로 고른 문제 종류·속도를 기억한다 (테마마다 따로)
  const store = {
    get: (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  const kTopic = theme.id === 'taekwondo' ? 'juho-topic' : `juho-${theme.id}-topic`;
  const kPace = theme.id === 'taekwondo' ? 'juho-pace' : `juho-${theme.id}-pace`;
  let topic = store.get(kTopic, 'add');
  let pace = store.get(kPace, 'slow');
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
    topic = b.dataset.topic; store.set(kTopic, topic); mark(); showStep('pace');
  }));
  paceButtons.forEach((b) => b.addEventListener('click', () => {
    pace = b.dataset.pace; store.set(kPace, pace); mark(); begin();
  }));
  const toMenu = () => { showStep('topic'); game.toMenu(); };
  on('btn-back', () => showStep('topic'));
  on('btn-retry', begin);
  on('btn-levels', toMenu);
  mark();
  on('btn-pause', () => game.togglePause());
  on('btn-resume', () => game.togglePause());
  on('btn-quit', toMenu);
  on('btn-mute', (e) => { e.currentTarget.textContent = sfx.toggleMute() ? '🔇' : '🔊'; });

  // 결과 화면에서 Enter·Space로 같은 설정으로 다시 시작
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Enter' || e.code === 'Space') && game.state.mode === 'over' && !game.state.promo && !game.state.locked) begin();
  });

  // 게이트 숫자(캔버스)에도 같은 글자체가 쓰이도록 미리 불러 둔다
  document.fonts?.load('700 100px Gaegu');

  theme.init?.(game);
  ui.showScreen('start');
  if (import.meta.env.DEV) { window.__game = game; window.__progress = { progress: theme.progress }; }
  return game;
}
