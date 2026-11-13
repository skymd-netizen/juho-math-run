// 태권도 테마: 기존 숫자왕(주호의 수학 런닝 어드벤처)의 캐릭터·배경·성장 규칙을 하나로 묶는다.
import { createWorld } from '../world.js';
import { createPlayerCharacter } from '../characters/index.js';
import { ui } from '../ui.js';
import { progress } from '../progress.js';

export const taekwondoTheme = {
  id: 'taekwondo',
  progress,
  ui,
  createWorld,
  createCharacter: createPlayerCharacter,
  /** 성장 정보를 캐릭터(띠 색)와 화면(HUD·성장 칸)에 반영한다 */
  syncGrowth(g, player) { player.setBelt(g.belt.id); ui.renderGrowth(g); },

  /** 시작 화면의 태권도 전용 버튼: 처음 띠로 돌아가기 (실수 방지를 위해 두 번 눌러야 한다) */
  init(game) {
    document.getElementById('btn-trophies')?.addEventListener('click', () => ui.openTrophies());
    document.getElementById('btn-trophy-close')?.addEventListener('click', () => ui.showScreen('start'));
    const b = document.getElementById('btn-reset-belt');
    if (!b) return;
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
  },
};
