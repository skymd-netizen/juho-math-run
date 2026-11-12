// 캐릭터 리소스 진입점.
// 게임 코드는 이 파일의 createPlayerCharacter()만 사용한다.
// 추후 주호 사진 기반 캐릭터(GLB 모델, 스프라이트 등)로 교체할 때는
// 같은 인터페이스를 가진 모듈을 만들어 아래 import 한 줄만 바꾸면 된다.
//
// 인터페이스:
//   const ch = createPlayerCharacter();
//   ch.object              -> THREE.Object3D (발바닥이 y=0, -z 방향을 바라봄)
//   ch.update(dt, state)   -> 매 프레임 호출
//     state = { speed, airborne, hitTimer, cheerTimer, boost, lean }
import { createJuhoCharacter } from './juho.js';
// import { createPlaceholderCharacter } from './placeholder.js'; // 임시 3D 캐릭터

export function createPlayerCharacter() {
  return createJuhoCharacter();
}
