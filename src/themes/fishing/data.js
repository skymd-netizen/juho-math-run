// 낚시 테마의 게임 데이터: 낚시 레벨, 낚시터, 물고기, 희귀도, 크기·무게·보상 계산.
// 모두 게임용 가상 수치이며 실제 어종의 생물학적 특성과 정확히 같지 않다.

export const RARITY = {
  common: { id: 'common', name: '일반', color: '#9aa7b8', xp: 1, coin: 1 },
  rare: { id: 'rare', name: '희귀', color: '#3fa9ff', xp: 1.6, coin: 2 },
  epic: { id: 'epic', name: '에픽', color: '#b96bff', xp: 2.6, coin: 3.5 },
  legend: { id: 'legend', name: '전설', color: '#ffc400', xp: 4, coin: 6 },
};
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legend'];

/** 낚시 레벨: 누적 경험치(need)에 따라 오른다. 태권도 20회 클리어와 비슷한 속도(약 25~30판)로 Lv.10에 닿도록 잡았다. */
export const LEVELS = [
  { lv: 1, name: '초보 낚시꾼', need: 0 },
  { lv: 2, name: '견습 낚시꾼', need: 120 },
  { lv: 3, name: '중급 낚시꾼', need: 320 },
  { lv: 4, name: '숙련 낚시꾼', need: 650 },
  { lv: 5, name: '고급 낚시꾼', need: 1150 },
  { lv: 6, name: '프로 낚시꾼', need: 1850 },
  { lv: 7, name: '베테랑 낚시꾼', need: 2800 },
  { lv: 8, name: '마스터 낚시꾼', need: 4100 },
  { lv: 9, name: '전설의 도전자', need: 5800 },
  { lv: 10, name: '전설의 낚시왕', need: 8000 },
];
export const MASTER_TITLE = '전설의 낚시왕';

/** 경험치 규칙 */
export const XP = { correct: 5, comboCap: 5, clear: 50 };

/** 낚시터: 레벨이 오르면 새로 열린다 (배경 모습은 world.js의 SPOT_LOOK) */
export const SPOTS = [
  { id: 'pond', name: '작은 연못', unlock: 1 },
  { id: 'creek', name: '맑은 시냇가', unlock: 2 },
  { id: 'river', name: '넓은 강', unlock: 4 },
  { id: 'lake', name: '푸른 호수', unlock: 6 },
  { id: 'sea', name: '탁 트인 바다', unlock: 8 },
  { id: 'deep', name: '전설의 심해', unlock: 10 },
];

/**
 * 물고기 도감 종류.
 *  cm: [최소, 최대] 길이 범위 / wk: 길이 100cm일 때의 무게(kg) / h: 몸통 높이 비율(그림·3D 공통)
 *  shape: 그림 모양 / body·belly·fin·accent: 색 / minLv: 이 레벨부터 낚인다
 */
export const SPECIES = [
  { id: 'pirami', name: '피라미', rarity: 'common', minLv: 1, cm: [8, 18], wk: 9, h: 0.2, shape: 'slim', body: '#8fb4c9', belly: '#e8f3f7', fin: '#f08a4b', accent: '#e4572e', pattern: 'lateral' },
  { id: 'crucian_s', name: '작은 붕어', rarity: 'common', minLv: 1, cm: [10, 22], wk: 16, h: 0.3, shape: 'round', body: '#a99a5a', belly: '#e9e0a8', fin: '#8a7d3f', accent: '#6b5f2a', pattern: 'scales' },
  { id: 'carp_s', name: '작은 잉어', rarity: 'common', minLv: 1, cm: [18, 38], wk: 14, h: 0.27, shape: 'round', body: '#d8892f', belly: '#ffe3a1', fin: '#c4671d', accent: '#8f4a12', pattern: 'scales', whisker: true },
  { id: 'crucian', name: '대형 붕어', rarity: 'common', minLv: 3, cm: [24, 48], wk: 17, h: 0.33, shape: 'round', body: '#b3a24f', belly: '#efe7ae', fin: '#8f8138', accent: '#665a22', pattern: 'scales' },
  { id: 'carp', name: '잉어', rarity: 'common', minLv: 3, cm: [32, 100], wk: 15, h: 0.28, shape: 'round', body: '#e0782a', belly: '#ffe0a0', fin: '#c85d17', accent: '#8f4a12', pattern: 'scales', whisker: true },
  { id: 'catfish', name: '메기', rarity: 'common', minLv: 3, cm: [40, 110], wk: 11, h: 0.24, shape: 'cat', body: '#5c6a50', belly: '#b9c19c', fin: '#47533f', accent: '#2f3a2b', pattern: 'mottle', whisker: true },
  { id: 'trout', name: '송어', rarity: 'rare', minLv: 3, cm: [28, 75], wk: 12, h: 0.2, shape: 'slim', body: '#7fa36b', belly: '#f2efe0', fin: '#d8a36a', accent: '#c0392b', pattern: 'spots' },
  { id: 'catfish_l', name: '대형 메기', rarity: 'rare', minLv: 5, cm: [80, 150], wk: 11, h: 0.25, shape: 'cat', body: '#4a5a52', belly: '#aebcae', fin: '#39463f', accent: '#232c27', pattern: 'mottle', whisker: true },
  { id: 'salmon', name: '연어', rarity: 'rare', minLv: 5, cm: [50, 110], wk: 11, h: 0.22, shape: 'slim', body: '#c8826b', belly: '#fde4d6', fin: '#b9604a', accent: '#8a3d2c', pattern: 'spots' },
  { id: 'tuna', name: '참치', rarity: 'rare', minLv: 5, cm: [60, 150], wk: 20, h: 0.27, shape: 'torpedo', body: '#27408b', belly: '#dfe6f5', fin: '#f2c230', accent: '#f2c230', pattern: 'lateral' },
  { id: 'tuna_l', name: '대형 참치', rarity: 'epic', minLv: 7, cm: [140, 200], wk: 22, h: 0.28, shape: 'torpedo', body: '#1c2f73', belly: '#d6def2', fin: '#f2c230', accent: '#f2c230', pattern: 'lateral' },
  { id: 'marlin', name: '청새치', rarity: 'epic', minLv: 7, cm: [150, 260], wk: 9, h: 0.2, shape: 'marlin', body: '#2a6fb0', belly: '#e4f0fa', fin: '#2158a0', accent: '#8fd0ff', pattern: 'stripes' },
  { id: 'carp_xl', name: '초대형 잉어', rarity: 'epic', minLv: 7, cm: [100, 180], wk: 16, h: 0.3, shape: 'round', body: '#d95f1f', belly: '#ffd89a', fin: '#b94a12', accent: '#7a3209', pattern: 'scales', whisker: true },
  { id: 'marlin_xl', name: '초대형 청새치', rarity: 'epic', minLv: 9, cm: [250, 400], wk: 8, h: 0.19, shape: 'marlin', body: '#1d4f94', belly: '#dcecf8', fin: '#173f7c', accent: '#6fc2ff', pattern: 'stripes' },
  { id: 'golden', name: '전설의 황금 물고기', rarity: 'legend', minLv: 9, cm: [200, 320], wk: 12, h: 0.3, shape: 'round', body: '#ffc928', belly: '#fff2a8', fin: '#ffb000', accent: '#ff9100', pattern: 'scales', glow: true, whisker: true },
  { id: 'deep', name: '전설의 심해어', rarity: 'legend', minLv: 9, cm: [220, 360], wk: 13, h: 0.32, shape: 'deep', body: '#35295e', belly: '#6b4fa8', fin: '#7d5cd6', accent: '#7affd9', pattern: 'glowdots', glow: true },
];
export const speciesById = (id) => SPECIES.find((s) => s.id === id);

export const levelFor = (xp) => {
  let l = LEVELS[0];
  for (const x of LEVELS) if (xp >= x.need) l = x;
  return l;
};
/** 이 레벨에서 가장 높은(가장 새로 열린) 낚시터 */
export const spotFor = (lv) => SPOTS.filter((s) => s.unlock <= lv).pop();

/** 레벨 n이 되었을 때 새로 열리는 것: 물고기 종류(들)와 낚시터 */
export function unlocksAt(lv) {
  return {
    species: SPECIES.filter((s) => s.minLv === lv),
    spot: SPOTS.find((s) => s.unlock === lv && lv > 1) || null,
  };
}

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * 물고기 한 마리를 뽑는다.
 *  1) 희귀도 뽑기 (스테이지 클리어 대어 뽑기는 희귀할 확률이 높다)
 *  2) 이 레벨에서 낚을 수 있는 그 희귀도의 종류 뽑기
 *  3) 길이: 레벨이 높을수록 범위의 위쪽이 열린다 (Lv.1은 최대의 40%쯤까지, Lv.10은 끝까지)
 */
export function rollCatch(level, { big = false, rng = Math.random } = {}) {
  const base = big
    ? { common: 0.3, rare: 0.4, epic: 0.22, legend: 0.08 }
    : { common: 0.68, rare: 0.24, epic: 0.07, legend: 0.012 };
  base.common *= Math.max(0.3, 1 - 0.08 * (level - 1)); // 높은 레벨일수록 작은 일반 고기는 줄어든다
  const avail = RARITY_ORDER.filter((r) => SPECIES.some((s) => s.rarity === r && s.minLv <= level));
  const total = avail.reduce((a, r) => a + base[r], 0);
  let x = rng() * total, tier = avail[0];
  for (const r of avail) { x -= base[r]; if (x <= 0) { tier = r; break; } }

  const pool = SPECIES.filter((s) => s.rarity === tier && s.minLv <= level);
  const w = pool.map((s) => Math.max(0.12, 1 - 0.2 * (level - s.minLv)) + (s.minLv >= level - 1 ? 0.6 : 0));
  let y = rng() * w.reduce((a, b) => a + b, 0), sp = pool[0];
  for (let i = 0; i < pool.length; i++) { y -= w[i]; if (y <= 0) { sp = pool[i]; break; } }

  const lo = 0.04 * (level - 1), hi = Math.min(1, 0.42 + 0.065 * (level - 1));
  let t = lo + (hi - lo) * rng();
  t = Math.min(1, t + { common: 0, rare: 0.05, epic: 0.1, legend: 0.15 }[sp.rarity]);
  if (big) t = Math.min(1, t + 0.12);
  const cm = Math.round(lerp(sp.cm[0], sp.cm[1], t) * 10) / 10;
  const kg = Math.round(sp.wk * Math.pow(cm / 100, 3) * (0.9 + rng() * 0.2) * 100) / 100;
  return { id: sp.id, name: sp.name, rarity: sp.rarity, cm, kg, t, big: t >= 0.8 };
}

/** 한 마리를 잡았을 때의 경험치·코인: 클수록, 희귀할수록 많다. 대어(크기 상위)와 전설은 보너스. */
export function rewardFor(fish) {
  const r = RARITY[fish.rarity];
  let xp = Math.round((10 + fish.cm / 5) * r.xp);
  let coin = Math.round((5 + fish.cm / 10) * r.coin);
  if (fish.big) { xp = Math.round(xp * 1.5); coin += 30; }
  if (fish.rarity === 'legend') { xp += 100; coin += 100; }
  return { xp, coin };
}

export const fmtKg = (kg) => (kg < 1 ? `${Math.round(kg * 1000)}g` : `${kg >= 100 ? Math.round(kg) : kg.toFixed(1)}kg`);
export const fmtCm = (cm) => `${cm % 1 ? cm.toFixed(1) : cm}cm`;
