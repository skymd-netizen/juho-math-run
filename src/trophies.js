// 트로피 도감 100개: 누적 스테이지 성공 1~100회마다 트로피 하나씩.
// 100개를 따로 그리지 않고, 공통 트로피 한 벌에 [등급 소재·색] + [번호별 장식] + [번호판]을 조합해 만든다.
//   장식은 번호가 올라갈수록 늘어난다: 별 → 보석 → 리본 → 월계수 → 날개 → 후광 → 왕관 (한 등급 안에서 1~10번째)
//   100번째 '궁극의 태권도 마스터'는 황금 왕관 특별 트로피다.
// (띠 승급 기준은 progress.js의 BELTS이며 이 파일과 무관하다.)

export const TROPHY_COUNT = 100;

export const TIERS = [
  { id: 'bronze', name: '브론즈', theme: '기본기', pal: { hi: '#f5be8a', mid: '#c9823f', lo: '#7d4a1f', plate: '#4f2e12', gem: '#ff7a45', glow: '#ffb070' } },
  { id: 'silver', name: '실버', theme: '품새', pal: { hi: '#ffffff', mid: '#cdd5df', lo: '#808b9b', plate: '#434c59', gem: '#6ec1ff', glow: '#e6f0ff' } },
  { id: 'gold', name: '골드', theme: '겨루기', pal: { hi: '#fff3b0', mid: '#ffc928', lo: '#b97c00', plate: '#5c3f00', gem: '#ff4757', glow: '#ffe066' } },
  { id: 'platinum', name: '플래티넘', theme: '수련', pal: { hi: '#f7fcff', mid: '#cfe3ef', lo: '#8aa8bd', plate: '#2f4a62', gem: '#8fe3ff', glow: '#cfefff' } },
  { id: 'diamond', name: '다이아몬드', theme: '빛', pal: { hi: '#f0ffff', mid: '#7ee8f7', lo: '#2796c4', plate: '#1b4468', gem: '#ffffff', glow: '#8ff4ff' } },
  { id: 'ruby', name: '루비', theme: '불꽃', pal: { hi: '#ffb8bf', mid: '#e0314b', lo: '#850e25', plate: '#44091a', gem: '#ffd0d6', glow: '#ff5a72' } },
  { id: 'sapphire', name: '사파이어', theme: '푸른 물결', pal: { hi: '#c3dcff', mid: '#3d72e3', lo: '#1a3a99', plate: '#121f58', gem: '#a8d6ff', glow: '#6fa8ff' } },
  { id: 'emerald', name: '에메랄드', theme: '숲', pal: { hi: '#c2ffd8', mid: '#28bb69', lo: '#0c6636', plate: '#0a3a22', gem: '#d2ffe0', glow: '#6dffa8' } },
  { id: 'legend', name: '레전드', theme: '전설', pal: { hi: '#ecd4ff', mid: '#a055ff', lo: '#4a1aa8', plate: '#27105a', gem: '#ffd54a', glow: '#c99bff' } },
  { id: 'master', name: '마스터', theme: '달인', pal: { hi: '#6a6a8c', mid: '#2a2a3a', lo: '#0b0b12', plate: '#6b4a00', gem: '#ff2e63', glow: '#ffd23f' } },
];
TIERS.forEach((t) => { t.ring = t.id === 'master' ? '#ffd23f' : t.pal.mid; }); // 화면 테두리·점에 쓰는 색

// 번호마다 고유한 이름 (1~100)
export const NAMES = [
  // 브론즈 · 기본기
  '첫 도전', '차렷 경례', '바른 자세', '힘찬 기합', '앞차기 입문', '막기의 시작', '지르기 연습', '튼튼한 다리', '끈기 있는 도전', '브론즈 졸업',
  // 실버 · 품새
  '태극 1장', '태극 2장', '태극 3장', '태극 4장', '태극 5장', '태극 6장', '태극 7장', '태극 8장', '부드러운 돌려차기', '실버 챔피언',
  // 골드 · 겨루기
  '첫 겨루기', '빠른 발차기', '번개 앞차기', '날쌘 옆차기', '정확한 돌려차기', '호랑이의 용기', '매서운 뒤차기', '불꽃 연속차기', '흔들림 없는 균형', '골드 챔피언',
  // 플래티넘 · 수련
  '백두산 수련', '새벽 훈련', '바람을 가르는 발', '단단한 마음', '인내의 한 걸음', '집중의 눈빛', '쓰러지지 않는 중심', '학이 날다', '굳센 의지', '플래티넘 챔피언',
  // 다이아몬드 · 빛
  '반짝이는 노력', '빛나는 기합', '다이아 앞차기', '투명한 집중', '흔들리지 않는 빛', '수정 같은 마음', '눈부신 돌려차기', '별빛 도전', '빛의 속도', '다이아몬드 챔피언',
  // 루비 · 불꽃
  '붉은 열정', '타오르는 투지', '용의 숨결', '불꽃 주먹', '홍련의 발차기', '뜨거운 심장', '붉은 노을 수련', '화염 돌개차기', '불사조의 용기', '루비 챔피언',
  // 사파이어 · 푸른 물결
  '푸른 파도', '깊은 바다의 집중', '청룡의 발', '물결 같은 품새', '푸른 번개', '고요한 호수', '얼음 같은 침착', '폭풍 속 균형', '푸른 별의 도전', '사파이어 챔피언',
  // 에메랄드 · 숲
  '숲속 수련', '푸른 대나무', '생명의 기합', '나뭇잎 차기', '초록 번개', '자라나는 힘', '숲의 수호자', '푸른 용의 비상', '대자연의 균형', '에메랄드 챔피언',
  // 레전드 · 전설
  '전설의 시작', '전설의 기합', '천둥 앞차기', '하늘을 가르는 발', '불패의 정신', '산을 옮기는 힘', '전설의 품새', '영웅의 발걸음', '끝없는 도전', '레전드 챔피언',
  // 마스터 · 달인
  '달인의 길', '마스터 입문', '고요한 달인', '바람의 달인', '불꽃의 달인', '하늘의 달인', '태극의 완성', '무예의 깨달음', '챔피언 중의 챔피언', '궁극의 태권도 마스터',
];

export function trophyOf(n) {
  const tier = TIERS[Math.floor((n - 1) / 10)];
  return { n, tier, k: ((n - 1) % 10) + 1, name: NAMES[n - 1], cond: `누적 스테이지 ${n}회 성공`, grand: n === TROPHY_COUNT };
}
export const allTrophies = () => Array.from({ length: TROPHY_COUNT }, (_, i) => trophyOf(i + 1));

/** 누적 성공 횟수로 본 수집 현황: 개수, 수집률, 현재 등급, 다음 목표 */
export function trophyStatus(clears) {
  const count = Math.max(0, Math.min(TROPHY_COUNT, clears));
  const latest = count ? trophyOf(count) : null;
  const next = count < TROPHY_COUNT ? trophyOf(count + 1) : null;
  const tier = latest ? latest.tier : null;
  return {
    count, pct: Math.round((count / TROPHY_COUNT) * 100), latest, next, remain: next ? 1 : 0,
    tier, tierDone: latest ? latest.k : 0, nextTier: next ? next.tier : null,
    complete: count >= TROPHY_COUNT,
  };
}

// ------------------------------------------------------------------ 그림 (SVG)

const f = (v) => Math.round(v * 10) / 10;
function starPath(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** 소재(등급)별 몸통 무늬 */
function motif(tier) {
  switch (tier) {
    case 'bronze': return [34, 46, 66, 58].map((x, i) => `<circle cx="${x}" cy="${[36, 70, 36, 70][i]}" r="1.4" fill="#5a3414" opacity=".6"/>`).join('');
    case 'silver': return '<path d="M24,40 H76 M26,46 H74" stroke="#fff" stroke-width="1.2" opacity=".6"/>';
    case 'gold': return '<path d="M23,41 H77 V45 H23Z" fill="#fff3b0" opacity=".75"/><path d="M23,41 H77" stroke="#b97c00" stroke-width=".8"/>';
    case 'platinum': return '<path d="M30,34 L44,50 M38,32 L56,52 M52,32 L68,50" stroke="#fff" stroke-width="1.2" opacity=".7"/>';
    case 'diamond': return '<path d="M26,32 L50,52 L74,32 M50,52 L50,82 M34,46 L50,82 L66,46" fill="none" stroke="#fff" stroke-width="1" opacity=".65"/>';
    case 'ruby': return '<path d="M32,80 q-3,-8 1,-12 q1,5 4,4 q-1,5 3,8Z M50,84 q-3,-9 1,-14 q2,6 5,5 q-1,6 3,9Z M68,80 q-3,-8 1,-12 q1,5 4,4 q-1,5 3,8Z" fill="#ffd0d6" opacity=".75"/>';
    case 'sapphire': return '<path d="M24,38 q6,-4 12,0 t12,0 t12,0 t12,0 M24,70 q6,-4 12,0 t12,0 t12,0 t12,0" fill="none" stroke="#c3dcff" stroke-width="1.6" opacity=".75"/>';
    case 'emerald': return '<path d="M30,70 q-6,-10 2,-16 q6,6 -2,16Z M70,70 q6,-10 -2,-16 q-6,6 2,16Z" fill="#c2ffd8" opacity=".7"/>';
    case 'legend': return '<path d="M52,30 L40,52 H50 L44,76 L62,48 H52 L58,30Z" fill="#ffd54a" opacity=".9" stroke="#fff" stroke-width=".6"/>';
    case 'master': return [32, 41, 59, 68].map((x) => `<path d="${starPath(x, 72, 3.2)}" fill="#fff4a8" opacity=".9"/>`).join('');
    default: return '';
  }
}

/** 트로피 한 개의 SVG (viewBox 100×120). 잠금 처리는 CSS에서 한다. */
export function trophySvg(n) {
  const t = trophyOf(n), p = t.tier.pal, k = t.k, g = t.grand, tid = t.tier.id;
  const gold = g ? TIERS[2].pal : p;
  const hi = gold.hi, mid = gold.mid, lo = gold.lo;
  const gem = g ? '#ff2e63' : p.gem;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" role="img" aria-label="트로피 ${n}번 ${t.name}">`;
  s += `<defs>
    <linearGradient id="bg-${tid}${g ? 'g' : ''}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${lo}"/><stop offset=".28" stop-color="${hi}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
    <radialGradient id="ga-${tid}${g ? 'g' : ''}"><stop offset="0" stop-color="${p.glow}" stop-opacity=".75"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
  </defs>`;
  const fill = `url(#bg-${tid}${g ? 'g' : ''})`, ol = lo;
  const sw = 'stroke-linejoin="round" stroke-linecap="round"';

  if (k >= 9 || g) s += `<circle cx="50" cy="58" r="52" fill="url(#ga-${tid}${g ? 'g' : ''})"/>`;
  if (k >= 8 || g) { // 날개
    const wing = `<path d="M26,46 C8,26 -2,48 10,64 C3,62 1,72 14,78 C9,77 11,85 25,82 Z" fill="${hi}" stroke="${ol}" stroke-width="1.6" ${sw}/><path d="M24,52 C14,44 8,54 14,62 M22,62 C14,60 10,68 18,72" fill="none" stroke="${mid}" stroke-width="1.4"/>`;
    s += wing + `<g transform="translate(100 0) scale(-1 1)">${wing}</g>`;
  }
  // 손잡이
  const hw = k < 4 ? 3.2 : 4.6;
  const handle = `<path d="M25,32 C6,32 6,64 31,66" fill="none" stroke="${ol}" stroke-width="${hw + 2.4}" ${sw}/><path d="M25,32 C6,32 6,64 31,66" fill="none" stroke="${fill}" stroke-width="${hw}" ${sw}/>`;
  s += handle + `<g transform="translate(100 0) scale(-1 1)">${handle}</g>`;
  // 받침과 번호판
  s += `<rect x="33" y="91" width="34" height="9" rx="2" fill="${fill}" stroke="${ol}" stroke-width="1.4"/>`;
  s += `<rect x="26" y="99" width="48" height="14" rx="3" fill="${p.plate}" stroke="${ol}" stroke-width="1.4"/><rect x="26" y="99" width="48" height="3" rx="1.5" fill="${mid}" opacity=".8"/>`;
  const numText = `<text x="50" y="110.6" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${n >= 100 ? 8.6 : n >= 10 ? 10 : 11}" fill="${tid === 'master' && !g ? '#ffd23f' : hi}">${n}</text>`;
  // 기둥
  s += `<rect x="43" y="78" width="14" height="15" fill="${fill}" stroke="${ol}" stroke-width="1.4"/><ellipse cx="50" cy="80" rx="10" ry="3.6" fill="${fill}" stroke="${ol}" stroke-width="1.4"/>`;
  // 몸통
  s += `<path d="M21,28 H79 C79,60 68,80 50,84 C32,80 21,60 21,28Z" fill="${fill}" stroke="${ol}" stroke-width="2" ${sw}/>`;
  s += motif(g ? 'gold' : tid);
  s += `<path d="M29,34 C29,52 33,66 42,76" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".55"/>`;
  // 태극 마크
  s += `<circle cx="50" cy="56" r="11.5" fill="#fff" opacity=".85"/><circle cx="50" cy="56" r="10" fill="#e0312f"/><path d="M40,56 A10,10 0 0 0 60,56 A5,5 0 0 0 50,56 A5,5 0 0 1 40,56Z" fill="#1c6fd6"/><circle cx="45" cy="56" r="1.6" fill="#e0312f"/><circle cx="55" cy="56" r="1.6" fill="#1c6fd6"/>`;
  // 윗테두리
  s += `<ellipse cx="50" cy="28" rx="29" ry="5.4" fill="${hi}" stroke="${ol}" stroke-width="1.8"/><ellipse cx="50" cy="28.6" rx="24.5" ry="3.4" fill="${lo}"/>`;
  // 번호가 높을수록 늘어나는 장식
  if (k >= 7) { // 월계수
    let leaves = '';
    for (let i = 0; i < 5; i++) {
      const y = 70 - i * 7, x = 23 + (i > 2 ? (i - 2) * 1.5 : 0) + i * 0.8;
      leaves += `<ellipse cx="${f(x)}" cy="${y}" rx="4.6" ry="2" transform="rotate(${-50 + i * 14} ${f(x)} ${y})" fill="${hi}" stroke="${ol}" stroke-width=".8"/>`;
    }
    s += leaves + `<g transform="translate(100 0) scale(-1 1)">${leaves}</g>`;
  }
  if (k >= 6) s += `<path d="M44,88 L34,103 L40,101 L43,107 L50,92Z M56,88 L66,103 L60,101 L57,107 L50,92Z" fill="${gem}" stroke="${ol}" stroke-width="1" ${sw} opacity=".95"/>`;
  if (k >= 5) s += `<circle cx="50" cy="85" r="3.8" fill="${gem}" stroke="#fff" stroke-width="1.2"/>`;
  if (g || k === 10) {
    // 왕관
    const cy = g ? 1 : 3;
    s += `<path d="M29,${cy + 26} L33,${cy + 6} L42,${cy + 17} L50,${cy} L58,${cy + 17} L67,${cy + 6} L71,${cy + 26} Z" fill="${fill}" stroke="${ol}" stroke-width="1.8" ${sw}/>`;
    s += `<path d="M29,${cy + 22} H71" stroke="${hi}" stroke-width="2" opacity=".8"/>`;
    for (const [x, y] of [[33, cy + 6], [50, cy], [67, cy + 6]]) s += `<circle cx="${x}" cy="${y}" r="${g ? 3.4 : 2.6}" fill="${gem}" stroke="#fff" stroke-width="1"/>`;
    if (g) for (const x of [41, 59]) s += `<circle cx="${x}" cy="${cy + 15}" r="2" fill="#1c6fd6" stroke="#fff" stroke-width=".8"/>`;
  } else {
    const stars = k >= 5 ? [[50, 12, 5.4], [35, 19, 4], [65, 19, 4]] : k === 4 ? [[39, 17, 4.6], [61, 17, 4.6]] : k === 3 ? [[50, 16, 5]] : [];
    for (const [x, y, r] of stars) s += `<path d="${starPath(x, y, r)}" fill="${hi}" stroke="${ol}" stroke-width="1" ${sw}/>`;
  }
  if (g) for (const [x, y, r] of [[8, 14, 4], [92, 20, 3.4], [6, 96, 3], [94, 92, 3.8]]) s += `<path d="${starPath(x, y, r)}" fill="#fff6b8"/>`;
  return s + numText + '</svg>';
}
