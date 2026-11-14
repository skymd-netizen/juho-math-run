import { DIFFICULTIES, buildPuzzle } from './jigsaw.js';
import { store } from './store.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MAX_SIDE = 1400;   // 성능을 위해 큰 사진은 이 크기로 줄여서 처리
const MIN_SIDE = 240;
const LIFT_PX = 46;      // 터치 시 손가락에 가려지지 않도록 조각을 위로 띄우는 거리

let photo = null;        // { canvas, w, h }
let levelKey = 'normal';
let game = null;

/* ---------- 공통 UI ---------- */
function show(id) { $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id)); if (id === 's-start') renderStart(); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const fmtDate = (t) => { const d = new Date(t); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; };
const vib = (n) => { try { navigator.vibrate && navigator.vibrate(n); } catch { /* 무시 */ } };

function renderStart() {
  const s = store.get();
  $('#w-coins').textContent = s.coins; $('#w-stars').textContent = s.stars; $('#w-count').textContent = s.records.length;
}

$$('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));
$('#btn-start').onclick = () => show('s-photo');
$('#btn-records').onclick = () => { renderRecords(); show('s-records'); };

/* ---------- STEP 2: 사진 선택 ---------- */
const fileInput = $('#file');
$('#drop').onclick = () => fileInput.click();
$('#btn-pick').onclick = () => fileInput.click();
$('#btn-change').onclick = () => fileInput.click();
$('#btn-clear').onclick = () => { clearPhoto(); };
fileInput.onchange = async () => {
  const f = fileInput.files && fileInput.files[0];
  fileInput.value = '';   // 같은 파일을 다시 골라도 change 가 발생하도록
  if (f) await pickPhoto(f);
};

function setMsg(t) { $('#photo-msg').textContent = t || ''; }

function clearPhoto() {
  destroyGame();
  photo = null;
  $('#preview').classList.add('hidden'); $('#drop-hint').classList.remove('hidden'); $('#drop').classList.remove('has');
  $('#btn-change').classList.add('hidden'); $('#btn-clear').classList.add('hidden'); $('#btn-pick').classList.remove('hidden');
  $('#btn-photo-next').disabled = true; setMsg('');
}

async function pickPhoto(file) {
  setMsg('사진을 불러오는 중이에요… ⏳');
  try {
    const p = await loadPhoto(file);
    destroyGame();            // 사진을 바꾸면 이전 퍼즐 데이터를 모두 초기화
    photo = p;
    const pv = $('#preview');
    pv.width = p.canvas.width; pv.height = p.canvas.height;
    pv.getContext('2d').drawImage(p.canvas, 0, 0);
    pv.classList.remove('hidden'); $('#drop-hint').classList.add('hidden'); $('#drop').classList.add('has');
    $('#btn-change').classList.remove('hidden'); $('#btn-clear').classList.remove('hidden'); $('#btn-pick').classList.add('hidden');
    $('#btn-photo-next').disabled = false;
    setMsg('');
  } catch (e) {
    setMsg(e && e.userMsg ? e.userMsg : '사진을 불러오지 못했어요. 다른 사진을 골라 주세요. 😢');
    if (!photo) $('#btn-photo-next').disabled = true;
  }
}

// 사진 파일 → 방향 보정 + 축소된 canvas (모두 브라우저 메모리 안에서 처리)
async function loadPhoto(file) {
  const okType = /^image\/(jpeg|png|webp)$/.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!okType) throw { userMsg: 'JPG, PNG, WEBP 사진만 쓸 수 있어요. 🙏' };
  let bmp = null, img = null, url = null;
  let w, h, src;
  try {
    if (window.createImageBitmap) {
      try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { bmp = null; }
    }
    if (bmp) { src = bmp; w = bmp.width; h = bmp.height; }
    else {   // 구형 브라우저: <img> 는 EXIF 방향을 자동 적용한다
      url = URL.createObjectURL(file);
      img = new Image(); img.src = url; await img.decode();
      src = img; w = img.naturalWidth; h = img.naturalHeight;
    }
    if (!w || !h) throw new Error('empty');
    if (Math.min(w, h) < MIN_SIDE) throw { userMsg: '사진이 너무 작아요. 더 큰 사진을 골라 주세요. 🔍' };
    const k = Math.min(1, MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);   // 투명 PNG 대비
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    return { canvas, w: canvas.width, h: canvas.height };
  } finally {
    if (bmp && bmp.close) bmp.close();
    if (url) URL.revokeObjectURL(url);
  }
}

$('#btn-photo-next').onclick = () => { if (!photo) return; drawPreviewTo($('#level-preview'), photo.canvas, 600); renderLevels(); show('s-level'); };

function drawPreviewTo(cv, src, max) {
  const k = Math.min(1, max / Math.max(src.width, src.height));
  cv.width = Math.round(src.width * k); cv.height = Math.round(src.height * k);
  cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
}

/* ---------- STEP 3: 난이도 ---------- */
function renderLevels() {
  const box = $('#levels'); box.innerHTML = '';
  Object.values(DIFFICULTIES).forEach((d) => {
    const b = document.createElement('button');
    b.className = 'lv' + (d.key === levelKey ? ' sel' : ''); b.style.setProperty('--lvc', d.color);
    b.innerHTML = `<span><b>${d.label}</b><small>${d.cols}×${d.rows} · 총 ${d.cols * d.rows}조각 · ⭐${d.stars} · 🪙${d.coins}</small></span><span class="grid-ico">${d.cols}×${d.rows}</span>`;
    b.onclick = () => { levelKey = d.key; renderLevels(); };
    box.appendChild(b);
  });
}
$('#btn-make').onclick = () => startGame();

/* ---------- STEP 4~5: 퍼즐 생성과 플레이 ---------- */
const stage = $('#stage'), layer = $('#layer'), boardCv = $('#board');
const hitCtx = document.createElement('canvas').getContext('2d');

function startGame() {
  if (!photo) { toast('먼저 사진을 골라 주세요!'); show('s-photo'); return; }
  destroyGame();
  const lv = DIFFICULTIES[levelKey];
  show('s-play');
  const puz = buildPuzzle(photo.canvas, lv.cols, lv.rows);
  const g = game = {
    lv, puz, pieces: puz.pieces, srcW: photo.w, srcH: photo.h, src: photo.canvas,
    placed: 0, moves: 0, hints: 0, elapsed: 0, last: performance.now(), paused: false, done: false, rewarded: false,
    drag: null, z: 10, ghost: false, mini: false, ac: new AbortController(), timer: 0, ro: null,
    k: 1, bx: 0, by: 0, bw: 0, bh: 0, slots: [], hintT: 0,
  };
  g.pieces.forEach((p) => {
    p.el = p.canvas; p.el.className = 'piece'; p.s = 1; p.slot = 0; layer.appendChild(p.el);
  });
  $('#hud-level').textContent = lv.label; $('#hud-level').style.background = lv.color;
  $('#mini').classList.add('hidden'); $('#big').classList.add('hidden'); $('#pause').classList.add('hidden'); $('#hint-menu').classList.add('hidden');
  drawPreviewTo($('#mini canvas'), photo.canvas, 240);
  const sig = g.ac.signal;
  layer.addEventListener('pointerdown', onDown, { signal: sig });
  layer.addEventListener('pointermove', onMove, { signal: sig });
  layer.addEventListener('pointerup', onUp, { signal: sig });
  layer.addEventListener('pointercancel', onUp, { signal: sig });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); }, { signal: sig });
  g.ro = new ResizeObserver(() => { layoutAll(true); });
  g.ro.observe(stage);
  shuffleSlots(false);
  layoutAll(false);
  g.timer = setInterval(tick, 250);
  updateHud();
}

function destroyGame() {
  const g = game; if (!g) return;
  game = null;
  g.ac.abort(); clearInterval(g.timer); clearTimeout(g.hintT);
  if (g.ro) g.ro.disconnect();
  layer.replaceChildren();
  g.pieces.forEach((p) => { p.canvas.width = 0; p.canvas.height = 0; p.canvas = p.el = p.path = null; });   // 메모리 해제
  $$('.spark').forEach((e) => e.remove());
  $('#showcase').classList.add('hidden'); $('#showcase').classList.remove('go');
  $$('.confetti').forEach((e) => e.remove());
}

function tick() {
  const g = game; if (!g) return;
  const now = performance.now();
  if (!g.paused && !g.done) g.elapsed += now - g.last;
  g.last = now;
  $('#hud-time').textContent = fmtTime(g.elapsed);
}

function updateHud() {
  const g = game; if (!g) return;
  const n = g.pieces.length, pct = Math.round((g.placed / n) * 100);
  $('#hud-fill').style.width = pct + '%'; $('#hud-pct').textContent = `완성 ${pct}% (${g.placed}/${n})`;
  $('#hud-left').textContent = n - g.placed;
  $('#hud-time').textContent = fmtTime(g.elapsed);
}

/* --- 레이아웃: 보드와 대기 트레이 --- */
function layoutAll(animate) {
  const g = game; if (!g) return;
  const W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return;
  const A = g.srcW / g.srcH, m = 8;
  const land = W >= H * 1.2;
  const area = land ? { x: 0, y: 0, w: W * 0.54, h: H } : { x: 0, y: 0, w: W, h: H * 0.5 };
  const tray = land ? { x: W * 0.54, y: 0, w: W * 0.46, h: H } : { x: 0, y: H * 0.5, w: W, h: H * 0.5 };
  const bw = Math.max(40, Math.min(area.w - m * 2, (area.h - m * 2) * A)), bh = bw / A;
  g.bw = bw; g.bh = bh; g.k = bw / g.srcW;
  g.bx = area.x + (area.w - bw) / 2; g.by = area.y + (area.h - bh) / 2;
  // 트레이 슬롯: 조각 수만큼 격자를 만들고 가장 크게 보이는 열 수를 고른다
  const n = g.pieces.length, { cw, ch, pad } = g.puz;
  const fw = (cw + pad) * g.k, fh = (ch + pad) * g.k;
  const tm = 6; let best = { s: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols), sw = (tray.w - tm * 2) / cols, sh = (tray.h - tm * 2) / rows;
    const s = Math.min(1, sw / fw, sh / fh);
    if (s > best.s) best = { s, cols, rows, sw, sh };
  }
  g.traySc = best.s;
  g.slots = [];
  for (let i = 0; i < n; i++) {
    const cI = i % best.cols, rI = Math.floor(i / best.cols);
    g.slots.push({ x: tray.x + tm + best.sw * (cI + 0.5), y: tray.y + tm + best.sh * (rI + 0.5) });
  }
  drawBoard();
  g.pieces.forEach((p) => {
    p.el.style.width = p.w * g.k + 'px'; p.el.style.height = p.h * g.k + 'px';
    if (p === (g.drag && g.drag.p)) return;
    if (p.placed) { p.cx = bxOf(p); p.cy = byOf(p); p.s = 1; }
    else { const sl = g.slots[p.slot]; p.cx = sl.x; p.cy = sl.y; p.s = g.traySc; }
    renderPiece(p, animate);
  });
}
const bxOf = (p) => game.bx + (p.ox + p.w / 2) * game.k;
const byOf = (p) => game.by + (p.oy + p.h / 2) * game.k;

function renderPiece(p, anim) {
  const g = game, w = p.w * g.k, h = p.h * g.k;
  p.el.classList.toggle('anim', !!anim);
  p.el.style.transform = `translate(${p.cx - w / 2}px,${p.cy - h / 2}px) scale(${p.s})`;
}

function shuffleSlots(animate) {
  const g = game; if (!g) return;
  const free = g.pieces.filter((p) => !p.placed);
  const idx = free.map((p) => p.slot);
  if (g.pieces.every((p) => !p.placed)) { for (let i = 0; i < g.pieces.length; i++) idx[i] = i; }
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  free.forEach((p, i) => { p.slot = idx[i]; });
  if (animate) layoutAll(true);
}

function drawBoard() {
  const g = game, dpr = Math.min(window.devicePixelRatio || 1, 2);
  boardCv.style.left = g.bx + 'px'; boardCv.style.top = g.by + 'px';
  boardCv.style.width = g.bw + 'px'; boardCv.style.height = g.bh + 'px';
  boardCv.width = Math.round(g.bw * dpr); boardCv.height = Math.round(g.bh * dpr);
  const ctx = boardCv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(0, 0, g.bw, g.bh);
  if (g.ghost) { ctx.globalAlpha = 0.3; ctx.drawImage(g.src, 0, 0, g.bw, g.bh); ctx.globalAlpha = 1; }
  ctx.save(); ctx.scale(g.k, g.k);
  ctx.setLineDash([10 / g.k, 8 / g.k]); ctx.lineWidth = 2 / g.k; ctx.strokeStyle = 'rgba(70,90,160,.55)';
  g.puz.guides.forEach((path) => ctx.stroke(path));
  ctx.restore();
  ctx.strokeStyle = 'rgba(43,45,87,.5)'; ctx.lineWidth = 3; ctx.setLineDash([]); ctx.strokeRect(0, 0, g.bw, g.bh);
}

/* --- Pointer Events: 마우스/터치/펜 공통 조작 --- */
function stagePt(e) { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

function hit(pt) {
  const g = game;
  const cand = g.pieces.filter((p) => !p.placed).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0));
  for (const p of cand) {
    const sc = p.s * g.k;
    const lx = (pt.x - p.cx) / sc + p.w / 2, ly = (pt.y - p.cy) / sc + p.h / 2;
    if (lx < -20 || ly < -20 || lx > p.w + 20 || ly > p.h + 20) continue;
    if (hitCtx.isPointInPath(p.path, lx, ly)) return p;
  }
  // 손가락이 살짝 빗나가도 가까운 조각을 잡을 수 있도록 테두리 허용 범위로 한 번 더 검사
  for (const p of cand) {
    const sc = p.s * g.k;
    const lx = (pt.x - p.cx) / sc + p.w / 2, ly = (pt.y - p.cy) / sc + p.h / 2;
    hitCtx.lineWidth = 22 / sc;
    if (hitCtx.isPointInStroke(p.path, lx, ly)) return p;
  }
  return null;
}

function onDown(e) {
  const g = game; if (!g || g.paused || g.done || g.drag) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  $('#hint-menu').classList.add('hidden');
  const pt = stagePt(e), p = hit(pt); if (!p) return;
  e.preventDefault();
  try { layer.setPointerCapture(e.pointerId); } catch { /* 캡처 실패해도 조작은 계속 */ }
  const lift = e.pointerType === 'mouse' ? 0 : LIFT_PX;
  g.drag = { p, id: e.pointerId, dx: (pt.x - p.cx) / p.s, dy: (pt.y - p.cy) / p.s, lift };
  p.s = 1; p.el.style.zIndex = ++g.z; p.el.classList.add('drag');
  p.cx = pt.x - g.drag.dx; p.cy = pt.y - g.drag.dy - lift;
  renderPiece(p, true);   // 집어 올릴 때만 부드럽게 확대
  setTimeout(() => { if (g.drag && g.drag.p === p) p.el.classList.remove('anim'); }, 140);
}

function onMove(e) {
  const g = game; if (!g || !g.drag || e.pointerId !== g.drag.id) return;
  const pt = stagePt(e), d = g.drag, p = d.p;
  p.cx = pt.x - d.dx; p.cy = pt.y - d.dy - d.lift;
  renderPiece(p, false);
}

function onUp(e) {
  const g = game; if (!g || !g.drag || e.pointerId !== g.drag.id) return;
  const p = g.drag.p; g.drag = null;
  try { layer.releasePointerCapture(e.pointerId); } catch { /* 이미 해제됨 */ }
  p.el.classList.remove('drag');
  if (e.type === 'pointercancel') { returnToTray(p); return; }
  g.moves++;
  const tx = bxOf(p), ty = byOf(p);
  const snap = Math.max(22, Math.min(g.puz.cw, g.puz.ch) * g.k * 0.4);   // 자동 스냅 범위
  if (Math.hypot(p.cx - tx, p.cy - ty) <= snap) lockPiece(p, tx, ty); else returnToTray(p);
}

function returnToTray(p) {
  const g = game, sl = g.slots[p.slot];
  p.cx = sl.x; p.cy = sl.y; p.s = g.traySc;
  renderPiece(p, true);
}

function lockPiece(p, tx, ty) {
  const g = game;
  p.placed = true; p.cx = tx; p.cy = ty; p.s = 1;
  p.el.classList.add('placed', 'pop'); p.el.style.zIndex = 2;
  renderPiece(p, true);
  const sp = document.createElement('div'); sp.className = 'spark'; sp.style.left = tx + 'px'; sp.style.top = ty + 'px';
  stage.appendChild(sp); setTimeout(() => sp.remove(), 600);
  vib(25);
  g.placed++; updateHud();
  if (g.placed === g.pieces.length) finishGame();
}

/* --- 도구 버튼 --- */
$('#t-shuffle').onclick = () => { if (game && !game.done && !game.paused) shuffleSlots(true); };
$('#t-pause').onclick = () => pauseGame();
$('#btn-resume').onclick = () => resumeGame();
function pauseGame() { const g = game; if (!g || g.done || g.paused) return; g.paused = true; $('#pause').classList.remove('hidden'); }
function resumeGame() { const g = game; if (!g) return; g.paused = false; g.last = performance.now(); $('#pause').classList.add('hidden'); }

$('#t-hint').onclick = () => $('#hint-menu').classList.toggle('hidden');
$$('#hint-menu button').forEach((b) => b.addEventListener('click', () => {
  const g = game; if (!g || g.done || g.paused) return;
  $('#hint-menu').classList.add('hidden');
  const h = b.dataset.hint;
  if (h === 'mini') { g.mini = !g.mini; $('#mini').classList.toggle('hidden', !g.mini); if (g.mini) g.hints++; }
  else if (h === 'ghost') { g.ghost = !g.ghost; drawBoard(); if (g.ghost) g.hints++; }
  else {
    g.hints++;
    drawPreviewTo($('#big canvas'), g.src, 900); $('#big').classList.remove('hidden');
    clearTimeout(g.hintT); g.hintT = setTimeout(() => $('#big').classList.add('hidden'), 3000);
  }
}));

$('#t-quit').onclick = () => {
  const g = game; if (!g || g.done) return;
  pauseGame();
  const m = $('#modal'); $('#modal-body').innerHTML = `<h2>그만할까요? 🚪</h2><p>지금까지의 퍼즐은 저장되지 않아요.</p>
    <div class="row"><button class="big alt" id="q-no">계속하기</button><button class="big blue" id="q-yes">종료</button></div>`;
  m.classList.remove('hidden');
  $('#q-no').onclick = () => { m.classList.add('hidden'); resumeGame(); };
  $('#q-yes').onclick = () => {
    m.classList.add('hidden');
    if (game.moves > 0) store.patch((s) => { s.streak = 0; });   // 도중 포기하면 연속 기록이 끊겨요
    destroyGame(); show('s-start');
  };
};

/* ---------- STEP 6: 완성 · 보상 ---------- */
function finishGame() {
  const g = game; if (!g || g.done) return;
  g.done = true; tick(); clearInterval(g.timer);
  const reward = grantReward(g);
  playShowcase(g, () => { fillResult(g, reward); show('s-result'); });
}

// 보상은 한 판에 한 번만 지급된다 (g.rewarded + 기록 id 중복 검사)
function grantReward(g) {
  if (g.rewarded) return g.rewardInfo;
  g.rewarded = true;
  const lv = g.lv, bonus = [];
  const s = store.get();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  let coins = lv.coins;
  if (!s.firstDone) { coins += 20; bonus.push('🎖️ 최초 완성 +20'); }
  if (g.elapsed / 1000 <= lv.speedSec) { coins += 10; bonus.push('⚡ 스피드 +10'); }
  if (g.hints === 0) { coins += 10; bonus.push('🧠 노힌트 +10'); }
  const streak = (s.streak || 0) + 1;
  if (streak >= 2) { const b = Math.min(streak - 1, 5) * 5; coins += b; bonus.push(`🔥 ${streak}연속 +${b}`); }
  const rec = {
    id, thumb: thumbOf(g.src, 320), level: lv.key, date: Date.now(), time: Math.round(g.elapsed), moves: g.moves,
    hints: g.hints, stars: lv.stars, coins,
  };
  if (store.addRecord(rec)) {
    store.patch((st) => { st.coins += coins; st.stars += lv.stars; st.firstDone = true; st.streak = streak; });
  }
  g.rewardInfo = { rec, bonus, coins };
  return g.rewardInfo;
}

function thumbOf(src, max) {
  const k = Math.min(1, max / Math.max(src.width, src.height));
  const c = document.createElement('canvas'); c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}

// 조각이 하나의 사진으로 합쳐지고 전체 화면으로 커지는 연출 + 축하 효과
function playShowcase(g, done) {
  const sc = $('#showcase'), cv = $('canvas', sc), r = boardCv.getBoundingClientRect();
  const cw = window.innerWidth, ch = window.innerHeight;
  drawPreviewTo(cv, g.src, 1200);
  const set = (x, y, w, h) => Object.assign(cv.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  cv.style.transition = 'none'; cv.style.opacity = '0';
  set(r.left, r.top, r.width, r.height);
  sc.classList.remove('hidden', 'go'); sc.style.background = 'rgba(20,20,60,0)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cv.style.transition = 'opacity .5s'; cv.style.opacity = '1';    // 1) 이음새가 사라지며 한 장의 사진이 된다
    setTimeout(() => {
      cv.style.transition = 'all .9s cubic-bezier(.2,.8,.2,1)';
      sc.style.transition = 'background .9s'; sc.style.background = 'rgba(20,20,60,.9)';
      const A = g.srcW / g.srcH, mw = cw * 0.92, mh = ch * 0.78;
      const w = Math.min(mw, mh * A), h = w / A;
      set((cw - w) / 2, (ch - h) / 2 + ch * 0.04, w, h);               // 2) 전체 화면으로 확대
      sc.classList.add('go'); confetti(sc); vib([40, 40, 80]);
    }, 650);
  }));
  const t = setTimeout(done, 3300);
  sc.onclick = () => { clearTimeout(t); sc.onclick = null; done(); };
}

function confetti(root) {
  const colors = ['#ff6fa5', '#ffd54a', '#4cc96b', '#3b82f6', '#ff9f1c', '#b388ff'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + '%'; c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's'; c.style.animationDelay = Math.random() * 0.8 + 's';
    root.appendChild(c); setTimeout(() => c.remove(), 4500);
  }
}

function fillResult(g, rw) {
  $('#showcase').classList.add('hidden'); $('#showcase').classList.remove('go'); $$('.confetti').forEach((e) => e.remove());
  const rec = rw.rec, lv = g.lv;
  drawPreviewTo($('#result-photo'), g.src, 900);
  $('#result-stars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= lv.stars ? '' : 'off'}">⭐</span>`).join('');
  $('#result-stats').innerHTML = `<li>난이도 <b>${lv.label}</b> (${lv.cols}×${lv.rows})</li><li>⏱ <b>${fmtTime(rec.time)}</b></li>
    <li>👆 이동 <b>${rec.moves}</b>번</li><li>💡 힌트 <b>${rec.hints}</b>번</li><li>⭐ 별 <b>${rec.stars}</b>개</li><li>🪙 코인 <b>+${rw.coins}</b></li>`;
  $('#result-bonus').innerHTML = rw.bonus.map((b) => `<li>${b}</li>`).join('');
}

$('#btn-again').onclick = () => startGame();                       // 같은 사진·난이도로 새로 섞어서
$('#btn-other').onclick = () => { destroyGame(); clearPhoto(); show('s-photo'); };
$('#btn-home').onclick = () => { destroyGame(); show('s-start'); };

/* ---------- 도감 ---------- */
function renderRecords() {
  const s = store.get(), grid = $('#rec-grid');
  $('#rec-sum').textContent = `완성한 퍼즐 ${s.records.length}개 · 🪙 ${s.coins} · ⭐ ${s.stars}`;
  grid.innerHTML = '';
  if (!s.records.length) { grid.innerHTML = '<div class="empty">아직 완성한 퍼즐이 없어요.<br/>첫 퍼즐에 도전해 봐요! 🧩</div>'; return; }
  s.records.forEach((r) => {
    const lv = DIFFICULTIES[r.level] || { label: r.level, color: '#888' };
    const b = document.createElement('button'); b.className = 'rc';
    b.innerHTML = `<img alt="" src="${r.thumb}" /><span class="lvl" style="background:${lv.color}">${lv.label}</span> ${'⭐'.repeat(r.stars)}<br/>${fmtDate(r.date)}<br/>⏱ ${fmtTime(r.time)} · 👆${r.moves} · 💡${r.hints}`;
    b.onclick = () => openRecord(r, lv);
    grid.appendChild(b);
  });
}
function openRecord(r, lv) {
  $('#modal-body').innerHTML = `<img alt="" src="${r.thumb}" /><h2>${lv.label} ${'⭐'.repeat(r.stars)}</h2>
    <p>📅 ${fmtDate(r.date)}<br/>⏱ ${fmtTime(r.time)} · 👆 이동 ${r.moves}번 · 💡 힌트 ${r.hints}번<br/>🪙 코인 +${r.coins}</p><button class="big blue" id="m-close">닫기</button>`;
  $('#modal').classList.remove('hidden');
  $('#m-close').onclick = () => $('#modal').classList.add('hidden');
}
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && !game) $('#modal').classList.add('hidden'); });

// 테스트용 디버그 훅 (?debug 로 열었을 때만)
if (location.search.includes('debug')) Object.defineProperty(window, '__pp', { get: () => game });
renderStart();
