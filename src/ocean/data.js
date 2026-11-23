// HYUNWOO'S OCEAN WORLD 정적 데이터: 레벨, 바다 생물 30종, 수영 기술 10종, 보물 10종, 누적 횟수 보상, 바닷속 지도.
// 보호자가 나중에 조건·항목을 바꾸거나 늘릴 수 있도록 규칙은 모두 이 파일의 데이터로 둔다 (엔진은 이 데이터를 읽기만 한다).
// 그림(SVG)은 4~6단계에서 id별로 붙인다.

export const RARITY = {
  common: { id: 'common', name: '일반', color: '#7aa6bd' },
  rare: { id: 'rare', name: '레어', color: '#2f8fe8' },
  epic: { id: 'epic', name: '에픽', color: '#a55eea' },
  legend: { id: 'legend', name: '레전드', color: '#f5a300' },
};

/** 경험치 규칙 (한 곳에서 조정) */
export const XP = {
  swim: 100,       // 수영 수업 완료(날짜당 1회)
  mission: 30,     // 오늘의 미션 완료
  practice: 20,    // 기술을 '연습 중'으로 처음 바꿀 때(기술당 1회)
  skillDone: 150,  // 기술 '습득 완료'(기술당 최초 1회)
  special: 80,     // 특별 미션 달성
};

/** 수영 레벨 10단계. need = 누적 경험치. (낚시 버전과 같은 방식) */
export const LEVELS = [
  { lv: 1, name: '물놀이 새싹', need: 0 },
  { lv: 2, name: '물장구 친구', need: 150 },
  { lv: 3, name: '헤엄 꼬마', need: 400 },
  { lv: 4, name: '파도 탐험가', need: 750 },
  { lv: 5, name: '바다 친구', need: 1200 },
  { lv: 6, name: '산호초 탐험가', need: 1800 },
  { lv: 7, name: '깊은 바다 용사', need: 2600 },
  { lv: 8, name: '바다 수호자', need: 3600 },
  { lv: 9, name: '바다 영웅', need: 4800 },
  { lv: 10, name: '바다왕', need: 6200 },
];

/** 수영 기술 10종 (실제 수업 내용을 보호자가 확인해 상태를 바꾼다. 게임이 수영 실력을 자동 판정하지 않는다) */
export const SKILL_STATUS = { before: '배우기 전', practicing: '연습 중', done: '습득 완료' };
export const SKILLS = [
  { id: 'face', name: '물에 얼굴 담그기', desc: '물에 얼굴을 넣어도 무섭지 않아요.', mission: '세수하듯 물에 얼굴을 담가 보기', creature: 'starfish' },
  { id: 'breath', name: '물속에서 숨 내쉬기', desc: '물속에서 코와 입으로 보글보글 숨을 내쉬어요.', mission: '물속에서 보글보글 3번 하기', creature: 'pufferfish' },
  { id: 'kick', name: '킥판 발차기', desc: '킥판을 잡고 다리를 쭉 펴서 물장구를 쳐요.', mission: '킥판 잡고 한 바퀴 가 보기', creature: 'penguin' },
  { id: 'free', name: '자유형', desc: '팔을 번갈아 저으며 앞으로 나아가요.', mission: '자유형으로 5미터 가 보기', creature: 'marlin' },
  { id: 'back', name: '배영', desc: '누워서 하늘을 보며 헤엄쳐요.', mission: '물 위에 편안하게 누워 보기', creature: 'otter' },
  { id: 'breast', name: '평영', desc: '개구리처럼 팔다리를 모았다 펴며 나아가요.', mission: '개구리 발차기 연습하기', creature: 'crab' },
  { id: 'fly', name: '접영', desc: '돌고래처럼 몸을 물결치며 두 팔로 물을 저어요.', mission: '돌고래 킥 5번 해 보기', creature: 'manta' },
  { id: 'dive', name: '잠수', desc: '물속 깊이 내려갔다가 올라와요.', mission: '바닥의 물건 줍고 올라오기', creature: 'anglerfish' },
  { id: 'turn', name: '물속에서 방향 전환', desc: '물속에서 몸을 돌려 반대로 나아가요.', mission: '벽을 차고 방향 바꿔 보기', creature: 'tropical' },
  { id: 'safety', name: '수영장 안전 수칙 익히기', desc: '뛰지 않기, 선생님 말씀 듣기 등 안전 약속을 알아요.', mission: '안전 약속 3가지 말해 보기', creature: 'clam' },
];

/**
 * 바다 생물 30종.
 *  source: 어떻게 얻는가 → milestone(누적 횟수) | skill(기술 습득) | level(레벨 도달) | special(특별 미션)
 */
export const CREATURES = [
  { id: 'clownfish', name: '흰동가리', rarity: 'common', desc: '말미잘 속에 사는 주황색 물고기예요. 줄무늬가 귀여워요.', source: { type: 'milestone', count: 1 } },
  { id: 'turtle', name: '바다거북', rarity: 'rare', desc: '느릿느릿 헤엄치는 바다의 어르신이에요. 오래오래 살아요.', source: { type: 'milestone', count: 3 } },
  { id: 'octopus', name: '문어', rarity: 'rare', desc: '다리가 여덟 개! 머리가 아주 좋아요.', source: { type: 'milestone', count: 5 } },
  { id: 'dolphin', name: '돌고래', rarity: 'rare', desc: '물 위로 폴짝 뛰어오르는 똑똑한 친구예요.', source: { type: 'milestone', count: 7 } },
  { id: 'whale', name: '고래', rarity: 'epic', desc: '아주 커다란 바다 포유류예요. 노래를 부르기도 해요.', source: { type: 'milestone', count: 10 } },
  { id: 'shark', name: '상어', rarity: 'epic', desc: '바다의 날쌘 사냥꾼이에요. 헤엄이 아주 빨라요.', source: { type: 'milestone', count: 15 } },

  { id: 'starfish', name: '불가사리', rarity: 'common', desc: '별 모양 몸을 가진 바다 바닥의 친구예요.', source: { type: 'skill', skill: 'face' } },
  { id: 'pufferfish', name: '복어', rarity: 'common', desc: '놀라면 몸을 동그랗게 부풀려요.', source: { type: 'skill', skill: 'breath' } },
  { id: 'penguin', name: '펭귄', rarity: 'rare', desc: '날지는 못하지만 물속에서는 날쌘 수영 선수예요.', source: { type: 'skill', skill: 'kick' } },
  { id: 'marlin', name: '청새치', rarity: 'epic', desc: '바다에서 가장 빠른 물고기 중 하나예요. 뾰족한 코가 멋져요.', source: { type: 'skill', skill: 'free' } },
  { id: 'otter', name: '해달', rarity: 'rare', desc: '물 위에 누워서 둥둥 떠다니며 쉬어요.', source: { type: 'skill', skill: 'back' } },
  { id: 'crab', name: '게', rarity: 'common', desc: '옆으로 걷는 집게발 친구예요.', source: { type: 'skill', skill: 'breast' } },
  { id: 'manta', name: '만타가오리', rarity: 'epic', desc: '커다란 날개를 펄럭이며 하늘을 나는 듯 헤엄쳐요.', source: { type: 'skill', skill: 'fly' } },
  { id: 'anglerfish', name: '아귀', rarity: 'epic', desc: '깊은 바다에서 머리 위 불빛으로 길을 밝혀요.', source: { type: 'skill', skill: 'dive' } },
  { id: 'tropical', name: '열대어', rarity: 'common', desc: '알록달록한 색이 예쁜 작은 물고기예요.', source: { type: 'skill', skill: 'turn' } },
  { id: 'clam', name: '조개', rarity: 'common', desc: '단단한 껍데기로 몸을 지켜요. 가끔 진주가 숨어 있어요.', source: { type: 'skill', skill: 'safety' } },

  { id: 'seahorse', name: '해마', rarity: 'common', desc: '말을 닮은 작은 물고기예요. 꼿꼿이 서서 헤엄쳐요.', source: { type: 'level', level: 2 } },
  { id: 'jellyfish', name: '해파리', rarity: 'rare', desc: '투명한 몸이 우산처럼 두둥실 떠다녀요.', source: { type: 'level', level: 3 } },
  { id: 'ray', name: '가오리', rarity: 'rare', desc: '납작한 몸으로 모래 위를 미끄러지듯 헤엄쳐요.', source: { type: 'level', level: 4 } },
  { id: 'seal', name: '바다표범', rarity: 'rare', desc: '동글동글한 얼굴로 물속과 얼음 위를 오가요.', source: { type: 'level', level: 5 } },
  { id: 'lobster', name: '바닷가재', rarity: 'rare', desc: '커다란 집게발과 단단한 갑옷을 입었어요.', source: { type: 'level', level: 6 } },
  { id: 'conch', name: '소라', rarity: 'common', desc: '귀에 대면 바다 소리가 들리는 나선 껍데기예요.', source: { type: 'level', level: 7 } },
  { id: 'orca', name: '범고래', rarity: 'epic', desc: '검정과 하양 무늬의 힘센 바다 대장이에요.', source: { type: 'level', level: 8 } },
  { id: 'hammerhead', name: '귀상어', rarity: 'epic', desc: '망치 모양 머리로 바닷속을 살펴요.', source: { type: 'level', level: 9 } },

  { id: 'lionfish', name: '쏠배감펭', rarity: 'epic', desc: '화려한 지느러미를 활짝 펼치는 산호초의 멋쟁이예요.', source: { type: 'special', mission: 'month4' } },
  { id: 'sunfish', name: '개복치', rarity: 'epic', desc: '둥글고 납작한 몸으로 느긋하게 떠다니는 큰 물고기예요.', source: { type: 'special', mission: 'weeks3' } },
  { id: 'seasnake', name: '바다뱀', rarity: 'legend', desc: '길고 매끈한 몸으로 산호 사이를 누비는 바다의 달인이에요.', source: { type: 'special', mission: 'skills2' } },
  { id: 'humpback', name: '흑등고래', rarity: 'legend', desc: '긴 지느러미를 흔들며 멋진 노래를 부르는 고래예요.', source: { type: 'special', mission: 'month8' } },
  { id: 'bluewhale', name: '흰긴수염고래', rarity: 'legend', desc: '지구에서 가장 큰 동물! 바다의 진짜 거인이에요.', source: { type: 'special', mission: 'months3' } },
  { id: 'seadragon', name: '전설의 바다용', rarity: 'legend', desc: '모든 기술을 익힌 수영왕 앞에만 나타난다는 전설의 용이에요.', source: { type: 'special', mission: 'legend' } },
];

/** 바닷속 보물 10종. cond: count(누적 횟수) | level | skills(습득한 기술 수) | missions(완료한 오늘의 미션 수) */
export const TREASURES = [
  { id: 'pearl', name: '진주', rarity: 'common', desc: '조개 속에서 반짝이는 하얀 보석이에요.', cond: { type: 'count', n: 2 }, condText: '누적 수영 2회' },
  { id: 'goldshell', name: '황금 조개', rarity: 'rare', desc: '금빛으로 빛나는 신비한 조개예요.', cond: { type: 'skills', n: 3 }, condText: '기술 3개 습득' },
  { id: 'chest', name: '보물상자', rarity: 'rare', desc: '열쇠로 열어야 하는 오래된 상자예요.', cond: { type: 'count', n: 12 }, condText: '누적 수영 12회' },
  { id: 'coralcrown', name: '산호 왕관', rarity: 'epic', desc: '붉은 산호로 만든 바다 임금님의 왕관이에요.', cond: { type: 'level', n: 5 }, condText: '수영 레벨 5 달성' },
  { id: 'piratecoin', name: '해적의 동전', rarity: 'rare', desc: '가라앉은 해적선에서 찾아낸 금화예요.', cond: { type: 'count', n: 25 }, condText: '누적 수영 25회' },
  { id: 'crystal', name: '마법의 수정', rarity: 'epic', desc: '만지면 따뜻한 빛이 나는 푸른 수정이에요.', cond: { type: 'skills', n: 5 }, condText: '기술 5개 습득' },
  { id: 'seakey', name: '바다의 열쇠', rarity: 'rare', desc: '바닷속 비밀 문을 여는 황금 열쇠예요.', cond: { type: 'missions', n: 5 }, condText: '오늘의 미션 5번 완료' },
  { id: 'relic', name: '해저 유물', rarity: 'epic', desc: '아주 옛날 바다 왕국에서 온 신비한 유물이에요.', cond: { type: 'count', n: 40 }, condText: '누적 수영 40회' },
  { id: 'mermaidgem', name: '인어의 보석', rarity: 'legend', desc: '인어가 아끼던 무지갯빛 보석이에요.', cond: { type: 'skills', n: 10 }, condText: '기술 10개 모두 습득' },
  { id: 'trident', name: '전설의 삼지창', rarity: 'legend', desc: '바다왕만이 들 수 있는 전설의 창이에요.', cond: { type: 'level', n: 10 }, condText: '수영 레벨 10 달성' },
];

/** 누적 수영 횟수 보상 (지시서의 기본 설계안). kind: creature | trophy | title */
export const MILESTONES = [
  { count: 1, kind: 'creature', id: 'clownfish', label: '작은 물고기 (흰동가리)' },
  { count: 3, kind: 'creature', id: 'turtle', label: '바다거북' },
  { count: 5, kind: 'creature', id: 'octopus', label: '문어' },
  { count: 7, kind: 'creature', id: 'dolphin', label: '돌고래' },
  { count: 10, kind: 'creature', id: 'whale', label: '고래' },
  { count: 15, kind: 'creature', id: 'shark', label: '상어' },
  { count: 20, kind: 'title', id: 'sea_king_trophy', label: '바다왕 트로피' },
  { count: 30, kind: 'title', id: 'explorer', label: '해저 탐험가 칭호' },
  { count: 50, kind: 'title', id: 'legend_king', label: '전설의 바다왕' },
  { count: 100, kind: 'title', id: 'ocean_legend', label: '오션 레전드 칭호' },
];
export const TITLES = [
  { id: 'sea_king_trophy', name: '바다왕 트로피', desc: '수영 20회를 채운 기념 트로피예요.' },
  { id: 'explorer', name: '해저 탐험가', desc: '수영 30회! 바닷속을 누비는 탐험가가 되었어요.' },
  { id: 'legend_king', name: '전설의 바다왕', desc: '수영 50회! 모두가 인정하는 바다의 왕이에요.' },
  { id: 'ocean_legend', name: '오션 레전드', desc: '수영 100회! 바다의 전설이 되었어요.' },
];

/** 특별 미션 (자동 판정: 보호자가 입력한 수영 기록의 날짜로 계산한다) */
export const SPECIALS = [
  { id: 'month4', name: '한 달에 4번 수영하기', creature: 'lionfish' },
  { id: 'weeks3', name: '3주 연속 매주 수영하기', creature: 'sunfish' },
  { id: 'skills2', name: '같은 달에 새 기술 2개 습득하기', creature: 'seasnake' },
  { id: 'month8', name: '한 달에 8번 수영하기', creature: 'humpback' },
  { id: 'months3', name: '3달 연속 매달 4번 이상 수영하기', creature: 'bluewhale' },
  { id: 'legend', name: '기술 10개 모두 습득하고 누적 50회 달성하기', creature: 'seadragon' },
];

/** 바닷속 탐험 지도: 모은 바다 생물 수로 영역이 열린다 (초기 버전은 해금 상태만 보여 준다) */
export const REGIONS = [
  { id: 'coral', name: '산호초 바다', need: 0, emoji: '🪸' },
  { id: 'turtle', name: '거북이 해변', need: 5, emoji: '🐢' },
  { id: 'dolphin', name: '돌고래 바다', need: 10, emoji: '🐬' },
  { id: 'whale', name: '고래 심해', need: 15, emoji: '🐋' },
  { id: 'shark', name: '상어 왕국', need: 20, emoji: '🦈' },
  { id: 'legend', name: '전설의 해저 왕국', need: 25, emoji: '🔱' },
];

export const byId = (list, id) => list.find((x) => x.id === id);
