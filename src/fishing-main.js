// 낚시왕 에디션 시작점. 태권도 버전(main.js)과 같은 공통 게임 루프에 낚시 테마를 꽂는다.
import { startApp } from './app.js';
import { fishingTheme } from './themes/fishing/index.js';

startApp(fishingTheme);
