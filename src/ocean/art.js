// 그림 자리. 바다 생물(creature-art.js)과 기술 배지(skill-art.js)는 SVG, 보물·칭호는 6단계에서 SVG로 바꾸기 전까지 이모지로 표시한다.
import { CREATURES, SKILLS } from './data.js';
import { creatureSvg } from './creature-art.js';
import { skillBadgeSvg } from './skill-art.js';

export const ART = {
  creatures: Object.fromEntries(CREATURES.map((c) => [c.id, creatureSvg(c.id)])),   // 4단계: 직접 그린 SVG
  treasures: { pearl: '⚪', goldshell: '🐚', chest: '🧰', coralcrown: '👑', piratecoin: '🪙', crystal: '🔮', seakey: '🗝️', relic: '🏺', mermaidgem: '💎', trident: '🔱' },
  titles: { sea_king_trophy: '🏆', explorer: '🧭', legend_king: '👑', ocean_legend: '🌊' },
  skills: Object.fromEntries(SKILLS.map((s) => [s.id, skillBadgeSvg(s.id)])),   // 5단계: 기술 배지 SVG
};
