// 개발용 캐릭터 확인 화면 (character.html). 동작과 띠를 버튼으로 바꿔 본다.
import * as THREE from 'three';
import { createPlayerCharacter } from './characters/index.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd8ff);
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x5b5f8a }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const ch = createPlayerCharacter();
scene.add(ch.object);

const state = { pose: 'run', belt: 'white', y: 0, vy: 0, air: false, hit: 0 };
const POSES = { stand: '기본', run: '달리기', jump: '점프', hit: '충돌', cheer: '정답', coin: '코인', victory: '승리', promote: '승급' };
const BELTS = { white: '흰띠', yellow: '노란띠', green: '초록띠', blue: '파란띠', red: '빨간띠', poom: '품띠', black: '검은띠' };
const bar = document.getElementById('bar');
const buttons = [];
const add = (group, key, label) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.onclick = () => { api.set(group, key); };
  bar.appendChild(b); buttons.push({ b, group, key });
};
for (const [k, v] of Object.entries(POSES)) add('pose', k, v);
for (const [k, v] of Object.entries(BELTS)) add('belt', k, v);

const api = {
  state, ch,
  set(group, key) {
    state[group] = key;
    if (group === 'belt') ch.setBelt(key);
    if (key === 'jump') { state.vy = 9.5; state.air = true; }
    if (key === 'hit') state.hit = 1;
    buttons.forEach((x) => x.b.classList.toggle('on', state[x.group] === x.key));
  },
  /** 화면을 멈추고 dt만큼만 진행 (자동 확인용) */
  step(dt) { tick(dt); renderer.render(scene, camera); },
  paused: false, dist: 6.2, angle: 0,
};
window.__char = api;
api.set('pose', 'run'); api.set('belt', 'white');

function resize(w = window.innerWidth, h = window.innerHeight) {
  if (!(w > 0 && h > 0)) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
api.resize = resize;
window.addEventListener('resize', () => resize()); resize();

function tick(dt) {
  if (state.air) {
    state.vy -= 27 * dt; state.y += state.vy * dt;
    if (state.y <= 0) { state.y = 0; state.air = false; if (state.pose === 'jump') { state.vy = 9.5; state.air = true; } }
  }
  if (state.pose !== 'jump' && !state.air) state.y = 0;
  if (state.pose === 'hit') { state.hit -= dt; if (state.hit <= 0) state.hit = 1; } else state.hit = 0;
  ch.object.position.y = state.y;
  ch.update(dt, {
    speed: state.pose === 'stand' ? 0 : 11, airborne: state.air, hitTimer: state.hit,
    cheerTimer: state.pose === 'cheer' ? 1 : 0, coinTimer: state.pose === 'coin' ? 1 : 0,
    victory: state.pose === 'victory', promote: state.pose === 'promote', boost: false, lean: 0,
    idle: state.pose === 'stand',
  });
  camera.position.set(Math.sin(api.angle) * api.dist, 1.5, Math.cos(api.angle) * api.dist);
  camera.lookAt(0, 1.08, 0);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!api.paused) { tick(dt); renderer.render(scene, camera); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
