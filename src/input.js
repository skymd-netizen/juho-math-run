// 키보드 / 스와이프 / 화면 버튼 입력을 하나의 콜백 인터페이스로 통합
export function setupInput({ onLeft, onRight, onJump, onPause }) {
  window.addEventListener('keydown', (e) => {
    if (e.repeat && e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return;
    switch (e.code) {
      case 'ArrowLeft': case 'KeyA': onLeft(); e.preventDefault(); break;
      case 'ArrowRight': case 'KeyD': onRight(); e.preventDefault(); break;
      case 'Space': case 'ArrowUp': case 'KeyW': onJump(); e.preventDefault(); break;
      case 'Escape': case 'KeyP': onPause(); break;
    }
  });

  // 스와이프
  const canvas = document.getElementById('game');
  let sx = 0, sy = 0, st = 0, active = false;
  const start = (x, y) => { sx = x; sy = y; st = performance.now(); active = true; };
  const end = (x, y) => {
    if (!active) return;
    active = false;
    const dx = x - sx, dy = y - sy;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? onLeft : onRight)();
    else if (dy < -35) onJump();
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && performance.now() - st < 250) onJump(); // 탭 = 점프
  };
  canvas.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; start(t.clientX, t.clientY); }, { passive: true });
  canvas.addEventListener('touchend', (e) => { const t = e.changedTouches[0]; end(t.clientX, t.clientY); }, { passive: true });

  // 화면 버튼
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); });
  };
  bind('btn-left', onLeft);
  bind('btn-right', onRight);
  bind('btn-jump', onJump);
}
