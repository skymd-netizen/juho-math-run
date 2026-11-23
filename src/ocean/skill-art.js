// 수영 기술 배지 10종(SVG, viewBox 100×100): 메달 + 기술을 나타내는 그림. 바다 생물과 같은 스타일(굵은 남색 외곽선).
// 배우기 전·연습 중·습득 완료의 모양은 화면(CSS)에서 정한다: 전은 어둡게, 연습 중은 점선 테두리, 완료는 금빛 별.
const OL = '#1d3b5c';
const ln = (w = 2.6) => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const wave = (y, color = '#fff', op = 0.95) => `<path d="M22,${y} q7,-7 14,0 t14,0 t14,0 t14,0 V${y + 14} H22Z" fill="${color}" opacity="${op}" ${ln(1.8)}/>`;

const ICONS = {
  face: () => `<circle cx="50" cy="38" r="14" fill="#ffe0c2" ${ln()}/><path d="M43,36 q3,3 6,0 M52,36 q3,3 6,0" fill="none" ${ln(2)}/><path d="M45,44 q5,5 10,0" fill="none" ${ln(2)}/><circle cx="41" cy="43" r="2.6" fill="#ff8fa3" opacity=".8"/><circle cx="59" cy="43" r="2.6" fill="#ff8fa3" opacity=".8"/>${wave(50, '#8fe0ff')}`,
  breath: () => `<circle cx="42" cy="50" r="11" fill="#fff" ${ln()}/><circle cx="62" cy="38" r="7.6" fill="#fff" ${ln()}/><circle cx="48" cy="26" r="4.6" fill="#fff" ${ln(2.2)}/><path d="M36,46 q2,-4 6,-4 M59,35 q1,-2 4,-2" fill="none" stroke="#9fdcff" stroke-width="2.4" stroke-linecap="round"/>`,
  kick: () => `<rect x="32" y="26" width="38" height="22" rx="9" fill="#ffd84a" ${ln()}/><path d="M40,32 h22 M40,40 h22" stroke="#e8a800" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="42" cy="58" rx="7" ry="3.8" fill="#ffe0c2" ${ln(2.2)} transform="rotate(-20 42 58)"/><ellipse cx="60" cy="54" rx="7" ry="3.8" fill="#ffe0c2" ${ln(2.2)} transform="rotate(-30 60 54)"/><circle cx="30" cy="52" r="2.4" fill="#fff"/><circle cx="72" cy="46" r="2.4" fill="#fff"/><circle cx="68" cy="58" r="2" fill="#fff"/>`,
  free: () => `<circle cx="66" cy="44" r="8" fill="#ffe0c2" ${ln()}/><path d="M28,52 Q34,28 54,26 Q62,26 62,32" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M28,52 Q34,28 54,26 Q62,26 62,32" fill="none" stroke="#ffe0c2" stroke-width="5" stroke-linecap="round"/>${wave(50, '#8fe0ff')}`,
  back: () => `<circle cx="66" cy="22" r="7" fill="#ffe27a" ${ln(2.2)}/><circle cx="34" cy="44" r="7.4" fill="#ffe0c2" ${ln()}/><path d="M40,48 L72,50" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M40,48 L72,50" stroke="#ffe0c2" stroke-width="6" stroke-linecap="round"/>${wave(50, '#8fe0ff')}`,
  breast: () => `<ellipse cx="50" cy="46" rx="17" ry="14" fill="#8ee88a" ${ln()}/><circle cx="40" cy="31" r="7" fill="#8ee88a" ${ln()}/><circle cx="60" cy="31" r="7" fill="#8ee88a" ${ln()}/><circle cx="40" cy="31" r="4" fill="#fff"/><circle cx="60" cy="31" r="4" fill="#fff"/><circle cx="41" cy="32" r="2" fill="#14243b"/><circle cx="61" cy="32" r="2" fill="#14243b"/><path d="M40,50 q10,8 20,0" fill="none" ${ln(2.2)}/>`,
  fly: () => `<ellipse cx="36" cy="32" rx="13" ry="10" fill="#fff" ${ln()} transform="rotate(-24 36 32)"/><ellipse cx="64" cy="32" rx="13" ry="10" fill="#fff" ${ln()} transform="rotate(24 64 32)"/><ellipse cx="38" cy="50" rx="10" ry="8" fill="#ffd0e6" ${ln()} transform="rotate(20 38 50)"/><ellipse cx="62" cy="50" rx="10" ry="8" fill="#ffd0e6" ${ln()} transform="rotate(-20 62 50)"/><ellipse cx="50" cy="42" rx="3.6" ry="14" fill="${OL}"/><path d="M48,28 q-4,-8 -8,-9 M52,28 q4,-8 8,-9" fill="none" ${ln(2)}/>`,
  dive: () => `<path d="M68,34 Q74,20 82,18" fill="none" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M68,34 Q74,20 82,18" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
    <rect x="28" y="30" width="42" height="26" rx="12" fill="#2a3a5a" ${ln()}/><rect x="33" y="34" width="32" height="18" rx="8" fill="#8fdcff"/><path d="M38,38 q4,-3 8,-2" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="38" cy="22" r="3.4" fill="#fff" ${ln(1.8)}/><circle cx="46" cy="16" r="2.4" fill="#fff" ${ln(1.6)}/>`,
  turn: () => `<path d="M30,26 V58" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M30,26 V58" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <path d="M38,48 A15,15 0 0 1 64,38" fill="none" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M38,48 A15,15 0 0 1 64,38" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M60,28 L72,38 L58,44Z" fill="#fff" ${ln(2.2)}/>
    <path d="M66,44 A15,15 0 0 1 44,56" fill="none" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M66,44 A15,15 0 0 1 44,56" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  safety: () => `<path d="M50,22 L69,29 V44 Q69,58 50,66 Q31,58 31,44 V29Z" fill="#fff" ${ln()}/><path d="M40,43 l8,8 l13,-15" fill="none" stroke="#2fb866" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>`,
};

const COLORS = { face: ['#ffb86b', '#e8892a'], breath: ['#7fd6ff', '#3aa6e0'], kick: ['#5fe3a0', '#22b872'], free: ['#3da8ff', '#1f76d6'], back: ['#9a8aff', '#6a55e6'], breast: ['#6fd36a', '#3fa63a'], fly: ['#ff8fc0', '#e8508f'], dive: ['#3f7fe0', '#2152b0'], turn: ['#ffd23f', '#e8a800'], safety: ['#ff7a7a', '#d63e3e'] };

/** 기술 배지 SVG */
export function skillBadgeSvg(id) {
  const [c1, c2] = COLORS[id] || ['#9fd3ea', '#5aa6c8'];
  const icon = ICONS[id]?.() ?? `<text x="50" y="52" text-anchor="middle" font-size="30" fill="#fff">?</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
    <path d="M30,64 L20,96 L35,88 L44,98 L50,68Z" fill="${c2}" ${ln(2.6)}/><path d="M70,64 L80,96 L65,88 L56,98 L50,68Z" fill="${c2}" ${ln(2.6)}/>
    <circle cx="50" cy="42" r="37" fill="${c1}" ${ln(3.2)}/><circle cx="50" cy="42" r="30" fill="${c2}" opacity=".35"/><circle cx="50" cy="42" r="30" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="2 5" stroke-linecap="round" opacity=".9"/>
    ${icon}</svg>`;
}
export const SKILL_BADGE_IDS = Object.keys(ICONS);
