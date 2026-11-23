// 바다 생물 30종 그림(SVG, viewBox 100×100). 모두 같은 스타일: 둥글고 부드러운 모양, 굵은 남색 외곽선, 큰 눈과 분홍 볼.
// 종마다 실루엣(몸 모양, 지느러미, 다리, 껍데기)이 다르고, 작은 아이콘으로 줄여도 알아볼 수 있게 단순하게 그린다.
// 얻지 못한 생물은 같은 그림을 CSS로 검게 칠해 실루엣으로 보여 준다.

const OL = '#1d3b5c';
const line = (w = 3) => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const eye = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${OL}" stroke-width="2"/><circle cx="${x + r * 0.2}" cy="${y + r * 0.12}" r="${r * 0.58}" fill="#14243b"/><circle cx="${x + r * 0.5}" cy="${y - r * 0.25}" r="${r * 0.24}" fill="#fff"/>`;
const cheek = (x, y, r = 3.4) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.68}" fill="#ff8fa3" opacity=".75"/>`;
const smile = (x, y, w = 7) => `<path d="M${x},${y} q${w / 2},${w * 0.7} ${w},0" fill="none" ${line(2)}/>`;
const P = (d, fill, w = 3, extra = '') => `<path d="${d}" fill="${fill}" ${line(w)} ${extra}/>`;
const E = (cx, cy, rx, ry, fill, w = 3, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${line(w)} ${extra}/>`;
const C = (cx, cy, r, fill, w = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${line(w)}/>`;
const tube = (d, color, w) => `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const star = (cx, cy, R, r, n = 5) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? r : R; pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`); } return `M${pts.join(' L')} Z`; };

const ART = {
  clownfish: () => `<defs><clipPath id="cp-clown"><ellipse cx="48" cy="54" rx="31" ry="23"/></clipPath></defs>
    ${P('M20,54 L3,36 Q11,54 3,72 Z', '#ff7a1a')}${P('M38,34 Q52,14 70,34 Z', '#ff6a00')}${P('M50,76 Q56,90 68,86 Q62,78 64,72 Z', '#ff6a00')}
    ${E(48, 54, 31, 23, '#ff8a2b')}
    <g clip-path="url(#cp-clown)"><path d="M30,28 Q24,54 30,80 L39,80 Q33,54 39,28Z M52,28 Q47,54 52,80 L60,80 Q55,54 60,28Z M72,30 Q70,54 74,78 L80,78 Q78,54 78,30Z" fill="#fff" stroke="${OL}" stroke-width="2"/></g>
    ${E(48, 54, 31, 23, 'none')}${eye(66, 46, 5.2)}${cheek(68, 60)}${smile(70, 57, 6)}`,

  turtle: () => `${P('M62,70 Q80,78 84,92 Q68,90 58,76Z', '#7fd98a')}${P('M28,68 Q12,80 10,92 Q28,90 38,76Z', '#7fd98a')}${P('M14,60 L2,56 L12,68Z', '#7fd98a')}
    ${C(88, 50, 11, '#7fd98a')}
    ${P('M14,64 Q12,22 52,22 Q92,22 90,64 Z', '#4fc36a')}${P('M12,64 H92 Q92,76 52,76 Q12,76 12,64Z', '#ffe9a8')}
    <path d="M52,24 V64 M30,34 Q42,48 36,64 M74,34 Q62,48 68,64 M20,50 H84" fill="none" stroke="#2f8f4a" stroke-width="2.4" stroke-linecap="round"/>
    ${eye(91, 47, 4.4)}${cheek(86, 56, 2.8)}${smile(86, 55, 5)}`,

  octopus: () => `${[22, 34, 46, 58, 70, 80].map((x, i) => tube(`M${x},54 q${i % 2 ? 10 : -10},14 0,24 q${i % 2 ? -8 : 8},8 ${i % 2 ? 4 : -4},14`, '#b784f0', 8)).join('')}
    ${E(50, 38, 28, 26, '#b784f0')}${E(40, 22, 7, 4, '#d9bdff', 0)}
    <circle cx="66" cy="24" r="3" fill="#d9bdff"/><circle cx="34" cy="52" r="2.5" fill="#d9bdff"/>
    ${eye(40, 40, 6)}${eye(60, 40, 6)}${cheek(32, 50)}${cheek(68, 50)}${smile(46, 52, 8)}`,

  dolphin: () => `${P('M18,68 Q4,56 2,48 Q14,52 20,60Z', '#4aa8ff')}${P('M18,70 Q6,80 3,90 Q16,86 24,76Z', '#4aa8ff')}
    ${P('M14,70 C18,42 48,28 74,40 C80,43 86,46 97,49 L86,55 C78,58 70,64 56,70 C40,80 22,80 14,70 Z', '#4aa8ff')}
    ${P('M30,74 C46,80 66,68 82,56 L86,55 C78,60 70,64 56,70 C44,77 36,77 30,74Z', '#d8f1ff', 2)}
    ${P('M44,38 Q50,18 66,36 Z', '#3a8fe6')}${P('M54,64 Q48,80 64,82 Q60,72 66,64 Z', '#3a8fe6')}
    ${eye(72, 47, 4.6)}${cheek(68, 56, 3)}<path d="M80,53 q6,3 12,-1" fill="none" ${line(2)}/>`,

  whale: () => `<path d="M62,28 Q58,16 50,10 M62,28 Q66,16 76,12" fill="none" stroke="#8fd8ff" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="8" r="3" fill="#8fd8ff"/><circle cx="78" cy="10" r="3" fill="#8fd8ff"/>
    ${P('M14,60 C4,52 2,38 8,28 C12,38 16,44 24,46 Z', '#2f78d4')}${P('M14,64 C4,66 0,76 6,84 C12,76 18,72 26,70Z', '#2f78d4')}
    ${P('M10,62 C10,36 40,28 66,34 C84,38 94,52 92,66 C88,80 40,84 24,76 C16,72 10,68 10,62Z', '#3c8ee6')}
    ${P('M14,68 C30,78 70,80 90,64 C86,78 60,88 30,82 C20,78 14,74 14,68Z', '#d5ebff', 2)}
    ${P('M56,70 Q50,84 66,84 Q62,76 68,70Z', '#2f78d4')}
    ${eye(72, 54, 5.4)}${cheek(78, 63)}<path d="M64,66 q10,6 22,-2" fill="none" ${line(2)}/>`,

  shark: () => `${P('M10,58 L0,36 L18,50 L4,78 L14,62Z', '#5a7b9c')}
    ${P('M8,58 C20,42 50,36 74,42 C86,46 95,54 95,59 C84,68 60,74 40,72 C24,70 14,64 8,58 Z', '#6f8fb0')}
    ${P('M30,70 C50,76 78,68 94,60 C84,72 56,80 34,74Z', '#f1f7fb', 2)}
    ${P('M44,41 L58,12 L70,43 Z', '#5a7b9c')}${P('M50,70 L44,88 L62,74Z', '#5a7b9c')}
    <path d="M62,60 Q78,68 92,60" fill="none" ${line(2)}/><path d="M68,63 l2,5 l3,-4 M76,66 l2,5 l3,-5 M84,63 l2,5 l3,-4" fill="#fff" ${line(1.6)}/>
    ${eye(74, 50, 4.6)}${cheek(66, 58, 3)}<path d="M52,50 q-2,6 0,11 M57,50 q-2,6 0,11" fill="none" ${line(1.6)}/>`,

  starfish: () => `${P(star(50, 54, 44, 20), '#ff9a3c', 3.4)}
    <circle cx="50" cy="22" r="2.6" fill="#ffd9a8"/><circle cx="24" cy="46" r="2.6" fill="#ffd9a8"/><circle cx="76" cy="46" r="2.6" fill="#ffd9a8"/><circle cx="34" cy="76" r="2.6" fill="#ffd9a8"/><circle cx="66" cy="76" r="2.6" fill="#ffd9a8"/>
    ${eye(42, 52, 5)}${eye(58, 52, 5)}${cheek(36, 62)}${cheek(64, 62)}${smile(46, 62, 8)}`,

  pufferfish: () => `${P('M20,52 L6,40 Q12,52 6,64Z', '#ff9a3c')}
    ${[[48, 20, 0], [66, 26, 45], [78, 42, 90], [74, 64, 135], [58, 78, 180], [38, 78, 200], [24, 66, 225], [20, 44, 270], [32, 26, 315]].map(([x, y, a]) => `<path d="M-4,0 L0,-12 L4,0Z" transform="translate(${x} ${y}) rotate(${a})" fill="#ff9a3c" ${line(2)}/>`).join('')}
    ${C(48, 52, 29, '#ffd23f')}${E(50, 62, 20, 12, '#fff3b0', 0)}
    ${P('M48,66 Q58,74 62,66 Q56,70 48,66Z', '#ff9a3c', 2)}
    ${eye(58, 46, 6)}${cheek(66, 60)}${E(78, 54, 4, 3, '#ff7a8a', 2)}`,

  penguin: () => `${E(38, 92, 9, 4, '#ff9a1f', 2.4)}${E(62, 92, 9, 4, '#ff9a1f', 2.4)}
    ${E(26, 58, 7, 18, '#2b3a55', 3, 'transform="rotate(14 26 58)"')}${E(74, 58, 7, 18, '#2b3a55', 3, 'transform="rotate(-14 74 58)"')}
    ${E(50, 56, 25, 34, '#2b3a55')}${E(50, 62, 16, 25, '#fff')}
    ${P('M44,46 L56,46 L50,56Z', '#ff9a1f', 2.4)}
    ${eye(42, 36, 6.4)}${eye(58, 36, 6.4)}${cheek(34, 48)}${cheek(66, 48)}`,

  marlin: () => `${P('M8,56 L0,38 Q8,56 0,74Z', '#2f7fd6')}
    ${P('M26,46 Q42,10 68,46 Z', '#5ab0ff')}<circle cx="46" cy="36" r="2.4" fill="#2f7fd6"/><circle cx="56" cy="40" r="2.4" fill="#2f7fd6"/>
    ${P('M8,56 C22,38 52,36 72,46 C78,48 80,50 82,52 C80,54 78,56 72,58 C52,68 22,66 8,56Z', '#2f7fd6')}
    ${P('M20,62 C42,68 64,62 78,56 C60,70 36,72 20,62Z', '#d5ebff', 2)}
    ${P('M80,51 L99,52 L80,53.4Z', '#4a5a73', 2)}${P('M44,64 Q40,78 54,76 Q50,70 54,64Z', '#2f7fd6', 2.4)}
    ${eye(68, 50, 4.4)}${cheek(64, 58, 2.6)}`,

  otter: () => `${E(14, 64, 12, 5, '#8a5a2b', 2.6)}
    ${E(46, 62, 32, 15, '#a9743f')}${E(48, 60, 22, 8, '#e8c79a', 0)}${E(54, 54, 8, 6, '#a9743f', 2.4)}
    ${C(76, 44, 16, '#a9743f')}${C(64, 32, 5, '#a9743f', 2.6)}${C(88, 32, 5, '#a9743f', 2.6)}${E(78, 50, 11, 9, '#f0d3ab', 0)}
    ${eye(71, 43, 4)}${eye(85, 43, 4)}${E(78, 49, 3.4, 2.4, '#3a2a1a', 1.6)}${smile(74, 52, 8)}<path d="M64,52 l-8,-1 M64,55 l-8,2 M92,52 l8,-1 M92,55 l8,2" fill="none" ${line(1.4)}/>
    <path d="M2,70 Q14,62 26,70 T50,70 T74,70 T98,70 V94 H2Z" fill="#5fc8f0" opacity=".88"/><path d="M2,70 Q14,62 26,70 T50,70 T74,70 T98,70" fill="none" stroke="#fff" stroke-width="3" opacity=".9"/>`,

  crab: () => `${[[22, 70, 10, 86], [30, 76, 24, 92], [38, 80, 38, 94], [78, 70, 90, 86], [70, 76, 76, 92], [62, 80, 62, 94]].map(([a, b, c, d]) => `<path d="M${a},${b} L${c},${d}" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M${a},${b} L${c},${d}" stroke="#ff7060" stroke-width="4" stroke-linecap="round"/>`).join('')}
    <path d="M30,52 Q12,48 14,34" fill="none" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M30,52 Q12,48 14,34" fill="none" stroke="#ff5a4d" stroke-width="6" stroke-linecap="round"/>
    <path d="M70,52 Q88,48 86,34" fill="none" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M70,52 Q88,48 86,34" fill="none" stroke="#ff5a4d" stroke-width="6" stroke-linecap="round"/>
    ${P('M14,32 L4,18 A13,13 0 1 0 4,40 Z', '#ff5a4d')}${P('M86,32 L96,18 A13,13 0 1 1 96,40 Z', '#ff5a4d')}
    ${E(50, 62, 28, 20, '#ff5a4d')}${E(50, 70, 20, 8, '#ff8a7d', 0)}
    <path d="M40,44 V34 M60,44 V34" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>${eye(40, 32, 6)}${eye(60, 32, 6)}${cheek(34, 60)}${cheek(66, 60)}${smile(45, 58, 10)}`,

  manta: () => `<path d="M50,68 Q56,84 50,98" fill="none" stroke="${OL}" stroke-width="5.4" stroke-linecap="round"/><path d="M50,68 Q56,84 50,98" fill="none" stroke="#3a5f9e" stroke-width="2.6" stroke-linecap="round"/>
    ${P('M50,24 C70,26 92,42 97,58 C82,60 66,56 50,68 C34,56 18,60 3,58 C8,42 30,26 50,24Z', '#3a5f9e')}
    ${P('M44,24 Q40,12 36,10 Q40,22 40,28Z M56,24 Q60,12 64,10 Q60,22 60,28Z', '#3a5f9e', 2.4)}
    ${P('M50,38 C64,40 80,50 88,58 C72,58 60,56 50,64 C40,56 28,58 12,58 C20,50 36,40 50,38Z', '#e8f4ff', 2.4)}
    ${eye(38, 50, 4.6)}${eye(62, 50, 4.6)}${cheek(31, 57, 2.8)}${cheek(69, 57, 2.8)}${smile(45, 56, 10)}`,

  anglerfish: () => `<circle cx="64" cy="12" r="11" fill="#ffe066" opacity=".35"/><path d="M44,34 Q38,14 62,12" fill="none" ${line(3)}/>${C(63, 12, 6, '#ffe066', 2.4)}
    ${P('M18,62 L2,48 Q10,64 2,80Z', '#2b2f66')}${P('M44,84 Q50,98 62,92 Q56,86 58,80Z', '#2b2f66')}
    ${E(52, 60, 36, 28, '#3b3f7a')}
    ${P('M20,66 Q52,92 84,64 Q52,74 20,66Z', '#14142e', 2.6)}
    <path d="M26,68 l3,-7 l3,8 M36,72 l3,-8 l3,9 M46,74 l3,-8 l3,9 M58,74 l3,-8 l3,9 M68,72 l3,-8 l3,8" fill="#fff" ${line(1.4)}/>
    ${eye(38, 46, 7)}${eye(64, 46, 7)}${cheek(30, 58)}${cheek(74, 58)}`,

  tropical: () => `<defs><clipPath id="cp-trop"><ellipse cx="52" cy="52" rx="22" ry="30"/></clipPath></defs>
    ${P('M32,52 L10,36 Q18,52 10,68Z', '#4aa8ff')}${P('M44,26 Q46,6 58,2 Q56,18 62,26Z', '#4aa8ff')}${P('M44,78 Q46,96 58,100 Q56,84 62,78Z', '#4aa8ff')}
    ${E(52, 52, 22, 30, '#ffd23f')}
    <g clip-path="url(#cp-trop)"><path d="M38,22 Q32,52 38,82 L46,82 Q40,52 46,22Z M58,22 Q52,52 58,82 L66,82 Q60,52 66,22Z" fill="#3a8fe6" stroke="${OL}" stroke-width="1.6"/></g>${E(52, 52, 22, 30, 'none')}
    ${eye(63, 42, 5.2)}${cheek(64, 56)}${smile(62, 62, 6)}`,

  clam: () => `${P('M8,56 Q6,14 50,12 Q94,14 92,56 Z', '#ffb3cf')}
    <path d="M50,56 L16,30 M50,56 L30,18 M50,56 L50,14 M50,56 L70,18 M50,56 L84,30" fill="none" stroke="#e57aa6" stroke-width="2.4" stroke-linecap="round"/>
    ${P('M8,56 Q8,92 50,92 Q92,92 92,56 Z', '#ff8fb5')}
    <path d="M50,56 L50,92 M50,56 L28,86 M50,56 L72,86 M50,56 L18,74 M50,56 L82,74" fill="none" stroke="#e57aa6" stroke-width="2.4" stroke-linecap="round"/>
    ${E(50, 56, 42, 5, '#ffe3ee', 2)}
    ${C(50, 52, 15, '#fff')}<circle cx="45" cy="46" r="4" fill="#f4f7ff"/>${eye(45, 52, 3)}${eye(56, 52, 3)}${smile(46, 58, 8)}`,

  seahorse: () => `${tube('M60,24 C74,32 70,48 54,54 C40,60 42,74 56,78 C64,80 66,90 56,92', '#ffc933', 15)}
    <path d="M68,38 l8,-2 M64,50 l8,2 M52,62 l-9,2 M54,74 l-8,6" fill="none" ${line(2.4)}/>
    ${C(58, 20, 12, '#ffc933')}${E(73, 22, 10, 4.4, '#ffc933', 2.6)}${P('M50,12 L46,2 L54,8 L56,0 L60,8Z', '#ff9a3c', 2.4)}
    ${E(58, 62, 6, 9, '#ffe9a0', 0)}<path d="M56,92 C46,94 44,82 52,82" fill="none" ${line(3)}/>
    ${eye(59, 18, 4.6)}${cheek(64, 28, 2.8)}`,

  jellyfish: () => `${[26, 38, 50, 62, 74].map((x, i) => tube(`M${x},52 q${i % 2 ? 7 : -7},12 0,22 q${i % 2 ? -7 : 7},10 0,20`, '#ff9ad1', 5)).join('')}
    ${P('M16,52 Q16,10 50,10 Q84,10 84,52 Q72,44 62,52 Q50,42 38,52 Q28,44 16,52 Z', '#ff9ad1')}
    <circle cx="36" cy="22" r="3.4" fill="#ffd0ea"/><circle cx="62" cy="20" r="3" fill="#ffd0ea"/><circle cx="72" cy="34" r="2.6" fill="#ffd0ea"/>${E(40, 20, 8, 4, '#ffd9ee', 0, 'transform="rotate(-24 40 20)"')}
    ${eye(39, 34, 5.4)}${eye(61, 34, 5.4)}${cheek(31, 43)}${cheek(69, 43)}${smile(46, 42, 8)}`,

  ray: () => `<path d="M50,74 Q58,88 46,98" fill="none" stroke="${OL}" stroke-width="5.4" stroke-linecap="round"/><path d="M50,74 Q58,88 46,98" fill="none" stroke="#46c2b8" stroke-width="2.6" stroke-linecap="round"/>
    ${P('M4,52 Q28,24 50,26 Q72,24 96,52 Q72,78 50,78 Q28,78 4,52Z', '#46c2b8')}
    <circle cx="20" cy="50" r="3.2" fill="#8de6dc"/><circle cx="80" cy="50" r="3.2" fill="#8de6dc"/><circle cx="30" cy="38" r="2.6" fill="#8de6dc"/><circle cx="70" cy="38" r="2.6" fill="#8de6dc"/>
    ${E(50, 54, 20, 15, '#9bece3', 0)}
    ${eye(40, 50, 5.4)}${eye(60, 50, 5.4)}${cheek(33, 58)}${cheek(67, 58)}${smile(45, 59, 10)}`,

  seal: () => `${E(34, 92, 9, 4.6, '#8a98aa', 2.6)}${E(66, 92, 9, 4.6, '#8a98aa', 2.6)}
    ${E(24, 66, 8, 16, '#8a98aa', 2.8, 'transform="rotate(20 24 66)"')}${E(76, 66, 8, 16, '#8a98aa', 2.8, 'transform="rotate(-20 76 66)"')}
    ${E(50, 68, 28, 26, '#9aa7b8')}${E(50, 72, 17, 19, '#e3eaf1', 0)}
    ${C(50, 40, 21, '#aebbc9')}${E(50, 48, 13, 10, '#eef3f7', 0)}
    ${eye(41, 37, 4.6)}${eye(59, 37, 4.6)}${E(50, 44, 4, 3, '#2a3a4f', 1.6)}${smile(46, 51, 8)}${cheek(35, 46, 2.8)}${cheek(65, 46, 2.8)}<path d="M36,47 l-12,-2 M36,50 l-12,3 M64,47 l12,-2 M64,50 l12,3" fill="none" ${line(1.4)}/>`,

  lobster: () => `<path d="M62,36 Q40,12 22,16 M64,38 Q50,6 30,6" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>
    ${P('M8,64 Q4,50 16,48 L24,58 Q22,70 8,64Z', '#d9371f')}${P('M10,60 L0,52 M10,66 L0,72', '#d9371f', 2.6)}
    ${P('M20,60 Q26,44 40,48 L40,72 Q26,76 20,60Z', '#e8402a')}${P('M36,50 Q50,40 62,48 L62,70 Q48,76 36,72Z', '#ec4b34')}
    <path d="M30,50 V74 M44,46 V74 M54,46 V72" stroke="#c22d18" stroke-width="2"/>
    ${P('M60,44 Q76,40 84,54 Q86,68 70,70 Q58,70 58,56Z', '#f0553d')}
    <path d="M66,66 Q72,80 62,84 M56,70 Q56,84 48,88" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>
    ${P('M76,52 Q88,42 94,30', 'none', 6)}${P('M76,52 Q88,42 94,30', 'none', 3, 'stroke="#f0553d"')}
    ${P('M72,48 L78,32 A10,10 0 1 1 90,38 Z', '#f0553d', 3)}
    ${eye(70, 52, 4.2)}${cheek(76, 62, 2.6)}${smile(72, 62, 5)}`,

  conch: () => `${P('M30,34 L8,8 L22,40Z', '#ffcfa0', 2.6)}
    ${E(24, 36, 12, 10, '#ffe9cc', 3, 'transform="rotate(-30 24 36)"')}${E(38, 46, 18, 14, '#ffe0bd', 3, 'transform="rotate(-24 38 46)"')}
    ${E(58, 62, 34, 26, '#ffe0bd', 3, 'transform="rotate(-14 58 62)"')}
    <path d="M18,32 q8,-6 14,2 M26,46 q12,-10 26,-2 M34,64 q24,-18 48,-4 M40,78 q22,-8 40,4" fill="none" stroke="#ffb27a" stroke-width="3" stroke-linecap="round"/>
    <path d="M40,40 l-2,-9 l9,5 M56,40 l0,-10 l8,7 M72,46 l4,-9 l5,9" fill="#ffcfa0" ${line(2)}/>
    ${P('M60,70 Q82,50 94,66 Q92,86 70,86 Q56,84 60,70Z', '#ff9aa6', 3)}${P('M68,72 Q82,62 88,70 Q84,80 72,80Z', '#ffd0d6', 0)}
    ${eye(50, 58, 4.6)}${eye(64, 54, 4.6)}${cheek(44, 68, 2.8)}${cheek(70, 62, 2.6)}${smile(52, 68, 7)}`,

  orca: () => `${P('M14,60 C4,52 2,38 8,28 C12,38 16,44 24,46 Z', '#22304a')}${P('M14,64 C4,66 0,76 6,84 C12,76 18,72 26,70Z', '#22304a')}
    ${P('M44,34 Q52,4 66,34 Z', '#22304a')}
    ${P('M10,62 C10,38 40,30 66,34 C84,38 94,52 92,66 C88,80 40,84 24,76 C16,72 10,68 10,62Z', '#22304a')}
    ${P('M16,70 C34,80 70,80 90,66 C84,80 58,88 30,82 C22,80 16,76 16,70Z', '#f6f9fc', 2.4)}
    ${E(70, 46, 8, 5, '#f6f9fc', 2, 'transform="rotate(-18 70 46)"')}${P('M54,70 Q48,86 64,86 Q60,78 66,70Z', '#22304a', 2.4)}
    ${eye(74, 52, 4.6)}${cheek(78, 62, 3)}<path d="M66,66 q10,6 22,-2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`,

  hammerhead: () => `${P('M12,60 L0,40 L18,52 L4,80 L14,64Z', '#5a7b9c')}
    ${P('M10,60 C22,46 50,44 72,50 L74,66 C54,72 26,70 10,60Z', '#6f8fb0')}${P('M26,68 C46,74 66,70 74,66 L74,70 C54,78 34,76 26,72Z', '#f1f7fb', 2)}
    ${P('M40,48 L52,22 L62,50Z', '#5a7b9c')}
    ${P('M68,36 Q82,32 96,38 Q100,52 96,66 Q82,72 68,68 Q74,52 68,36Z', '#6f8fb0')}
    ${eye(86, 38, 4.4)}${eye(86, 68, 4.4)}<path d="M92,52 q-6,4 -12,0" fill="none" ${line(2)}/>${cheek(86, 56, 2.4)}`,

  lionfish: () => `${[-70, -48, -26, -4, 18, 40, 62].map((a) => `<path d="M0,0 L-3,-44 L3,-44Z" transform="translate(50 54) rotate(${a})" fill="#ffb3a0" ${line(1.8)}/>`).join('')}
    ${P('M24,52 L4,40 Q12,54 4,68Z', '#e8553d')}
    <defs><clipPath id="cp-lion"><ellipse cx="50" cy="56" rx="26" ry="20"/></clipPath></defs>
    ${E(50, 56, 26, 20, '#fff')}<g clip-path="url(#cp-lion)"><path d="M32,30 Q26,56 32,84 L40,84 Q34,56 40,30Z M50,30 Q44,56 50,84 L58,84 Q52,56 58,30Z M68,30 Q62,56 68,84 L76,84 Q70,56 76,30Z" fill="#e8402a"/></g>${E(50, 56, 26, 20, 'none')}
    ${E(74, 62, 14, 12, '#ff9a8a', 3, 'transform="rotate(30 74 62)"')}
    ${eye(64, 50, 5)}${cheek(68, 62, 2.8)}${smile(66, 60, 6)}`,

  sunfish: () => `${P('M42,26 L52,2 L62,28Z', '#a6b7c9')}${P('M42,82 L52,100 L62,80Z', '#a6b7c9')}
    ${P('M22,30 Q8,54 22,78 Q16,54 22,30Z', '#a6b7c9', 2.6)}
    ${C(52, 54, 32, '#c4d2e0')}
    <path d="M30,34 Q36,26 46,24 M28,60 Q30,70 36,76" fill="none" stroke="#a6b7c9" stroke-width="3" stroke-linecap="round"/>
    <circle cx="40" cy="44" r="2.8" fill="#a6b7c9"/><circle cx="38" cy="62" r="2.4" fill="#a6b7c9"/><circle cx="50" cy="72" r="2.4" fill="#a6b7c9"/>
    ${eye(62, 46, 6.4)}${E(80, 58, 3.4, 2.6, '#ff8fa3', 1.8)}${cheek(70, 62, 3.4)}`,

  seasnake: () => `${tube('M8,82 C20,48 38,96 54,66 C70,36 78,58 86,40', '#3fc8b4', 12)}
    <path d="M8,82 C20,48 38,96 54,66 C70,36 78,58 86,40" fill="none" stroke="#1d3b5c" stroke-width="12" stroke-dasharray="3 9" opacity=".55"/>
    <path d="M86,40 L94,36 M86,40 L92,44" stroke="#ff4d6d" stroke-width="2" stroke-linecap="round" fill="none"/>
    ${E(84, 34, 11, 9.4, '#3fc8b4', 3, 'transform="rotate(-24 84 34)"')}${eye(86, 30, 4.4)}${cheek(80, 40, 2.4)}`,

  humpback: () => `${P('M14,58 C4,50 2,38 8,28 C12,38 16,42 24,44 Z', '#2f4a68')}${P('M14,62 C4,64 0,74 6,82 C12,74 18,70 26,68Z', '#2f4a68')}
    ${P('M10,60 C10,36 38,28 64,34 C82,38 94,52 92,64 C88,78 40,82 24,74 C16,70 10,66 10,60Z', '#3b5b7a')}
    ${P('M14,66 C30,76 70,78 90,62 C86,76 60,86 30,80 C20,76 14,72 14,66Z', '#e6f0f8', 2)}
    <path d="M30,72 q12,6 28,4 M36,76 q10,4 22,2" fill="none" stroke="#9fb6c8" stroke-width="1.6"/>
    ${P('M44,62 Q20,84 22,96 Q40,92 56,70Z', '#3b5b7a')}
    <circle cx="80" cy="44" r="2" fill="#7e98b0"/><circle cx="86" cy="50" r="2" fill="#7e98b0"/><circle cx="74" cy="40" r="2" fill="#7e98b0"/>
    ${eye(72, 54, 5.2)}${cheek(80, 63)}<path d="M64,64 q10,6 24,-2" fill="none" ${line(2)}/>`,

  bluewhale: () => `${P('M12,54 C6,48 2,40 6,30 C10,40 14,44 22,48Z', '#3f6fa6')}${P('M12,58 C6,64 2,72 6,82 C10,72 14,68 22,64Z', '#3f6fa6')}
    ${P('M44,40 Q50,30 56,42 Z', '#3f6fa6', 2.4)}
    ${P('M10,56 C14,38 50,34 74,42 C88,46 96,54 94,60 C88,70 50,76 22,68 C14,64 10,60 10,56Z', '#4f86c0')}
    <circle cx="36" cy="48" r="2.4" fill="#7fb0dc"/><circle cx="50" cy="44" r="2.4" fill="#7fb0dc"/><circle cx="62" cy="50" r="2.4" fill="#7fb0dc"/><circle cx="28" cy="56" r="2" fill="#7fb0dc"/>
    ${P('M18,64 C40,72 70,70 92,62 C84,72 56,78 26,72Z', '#dcecfa', 2)}
    <path d="M40,66 v6 M48,67 v6 M56,67 v6 M64,66 v6" stroke="#9fc4e4" stroke-width="1.6"/>
    ${P('M54,64 Q50,78 62,76 Q58,70 62,64Z', '#3f6fa6', 2.4)}
    ${eye(76, 52, 5)}${cheek(82, 60, 3)}<path d="M70,62 q10,6 22,-1" fill="none" ${line(2)}/>`,

  seadragon: () => `<circle cx="84" cy="62" r="13" fill="#fff6a8" opacity=".5"/><circle cx="84" cy="62" r="7" fill="#fff" stroke="#ffd23f" stroke-width="2.4"/>
    ${tube('M8,86 C20,52 38,100 52,68 C64,40 58,28 72,26', '#2fc7b0', 13)}
    <path d="M8,86 C20,52 38,100 52,68 C64,40 58,28 72,26" fill="none" stroke="#ffd23f" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>
    ${[[18, 66], [34, 82], [46, 80], [58, 52]].map(([x, y]) => `<path d="M-4,0 L0,-9 L4,0Z" transform="translate(${x} ${y})" fill="#ffd23f" ${line(1.6)}/>`).join('')}
    <path d="M62,14 Q54,2 48,4 M70,12 Q70,0 78,0" fill="none" stroke="#ffd23f" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M84,32 Q96,36 98,46 M84,36 Q92,48 90,54" fill="none" ${line(2)}/>
    ${E(74, 28, 14, 11, '#2fc7b0', 3, 'transform="rotate(-10 74 28)"')}${E(86, 32, 8, 6, '#2fc7b0', 2.6)}
    ${eye(72, 24, 5)}${cheek(78, 34, 2.8)}<path d="M64,18 Q70,10 78,12" fill="none" stroke="#ff6a8a" stroke-width="3" stroke-linecap="round"/>`,
};

/** id에 해당하는 SVG 문자열. 없으면 물음표 방울 */
export function creatureSvg(id) {
  const body = ART[id]?.() ?? `<circle cx="50" cy="50" r="30" fill="#bfe3f2" ${line(3)}/><text x="50" y="62" text-anchor="middle" font-size="34" fill="${OL}">?</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true">${body}</svg>`;
}
export const CREATURE_IDS = Object.keys(ART);
