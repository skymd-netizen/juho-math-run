// 수영왕 테마: 공통 게임 루프(game.js)에 수영장 배경·현우 수영 캐릭터·수영 급수 성장 규칙을 꽂는다.
import { createSwimmer } from './character.js';
import { createSwimWorld } from './world.js';
import { swimProgress } from './progress.js';
import { swimUi } from './ui.js';

/** 점프로 넘는 장애물: 물 위에 떠 있는 풀 누들(막대) 두 개와 부이 */
function makeHurdle(THREE, toon) {
  const g = new THREE.Group();
  const noodle = (y, color) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 2.0, 12), toon(color));
    m.rotation.z = Math.PI / 2; m.position.y = y; return m;
  };
  g.add(noodle(0.3, 0xff7eb6), noodle(0.62, 0xffd23f));
  for (const s of [-1, 1]) {
    const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), toon(0xff4757));
    buoy.position.set(s * 1.0, 0.3, 0); g.add(buoy);
  }
  return g;
}

export const swimmingTheme = {
  id: 'swimming',
  progress: swimProgress,
  ui: swimUi,
  createWorld: createSwimWorld,
  createCharacter: createSwimmer,
  makeHurdle,
  /** 급수를 캐릭터(셔츠 색)와 화면(HUD·성장 칸)에 반영한다 */
  syncGrowth(g, player) { player.setBelt(g.rank.id); swimUi.renderGrowth(g); },
};
