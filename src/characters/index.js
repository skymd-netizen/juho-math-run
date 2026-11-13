// 캐릭터 리소스 진입점.
// 게임 코드는 이 파일의 createPlayerCharacter()만 사용한다.
// 추후 주호 사진 기반 캐릭터(GLB 모델, 스프라이트 등)로 교체할 때는
// 같은 인터페이스를 가진 모듈을 만들어 아래 import 한 줄만 바꾸면 된다.
//
// 인터페이스:
//   const ch = createPlayerCharacter();
//   ch.object              -> THREE.Object3D (발바닥이 y=0, 카메라(+z) 쪽을 바라봄)
//   ch.update(dt, state)   -> 매 프레임 호출
//     state = { speed, airborne, hitTimer, cheerTimer, coinTimer, boost, lean, victory, promote, idle }
//   ch.setBelt(id)         -> 도복의 띠 색 변경 (white|yellow|green|blue|red|poom|black)
import { createJuho2D } from './juho-2d.js';                     // 실제 사진 얼굴 + 2D 도복 일러스트
// import { createTaekwondoJuho } from './juho-taekwondo.js';  // 예전 3D 도복 캐릭터
// import { createJuhoCharacter } from './juho.js';               // 예전 사진 스티커 캐릭터
// import { createPlaceholderCharacter } from './placeholder.js'; // 임시 3D 캐릭터

export function createPlayerCharacter() {
  const ch = createJuho2D();
  if (!ch.setBelt) ch.setBelt = () => {}; // 띠가 없는 캐릭터로 바꿔도 게임이 멈추지 않게
  return ch;
}
