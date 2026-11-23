// HYUNWOO'S OCEAN WORLD 저장소: 상태를 저장·불러오고, 백업 파일(내보내기/가져오기)과 보호자 PIN을 다룬다.
// 지금은 브라우저(localStorage)에 저장한다. 나중에 서버를 붙일 때는 이 파일의 adapter만 바꾸면 된다.
// 수학왕 계열 게임의 저장 키(juho-*)와 완전히 분리된 키를 쓴다.
import { newState, normalizeState } from './engine.js';

export const SAVE_KEY = 'juho-ocean-save';
export const BACKUP_APP = 'hyunwoo-ocean';

export const localAdapter = {
  get() { try { return localStorage.getItem(SAVE_KEY); } catch { return null; } },
  set(text) { try { localStorage.setItem(SAVE_KEY, text); return true; } catch { return false; } },
};
/** 시험·임시용 저장소 */
export const memoryAdapter = (init = null) => { let v = init; return { get: () => v, set: (t) => { v = t; return true; } }; };

export function createStore(adapter = localAdapter) {
  let state = load();
  const listeners = new Set();

  function load() {
    try { return normalizeState(JSON.parse(adapter.get() || 'null')) || newState(); } catch { return newState(); }
  }
  function persist() { return adapter.set(JSON.stringify(state)); }

  return {
    get state() { return state; },
    /** 엔진 결과({ok, state, events})를 받아 성공하면 저장하고 구독자에게 알린다 */
    commit(result) {
      if (result?.ok) { state = result.state; persist(); listeners.forEach((fn) => fn(state, result.events || [])); }
      return result;
    },
    replace(next) { state = next; persist(); listeners.forEach((fn) => fn(state, [])); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reload() { state = load(); listeners.forEach((fn) => fn(state, [])); return state; },
  };
}

// ---------------------------------------------------------------- 백업
/** 백업 파일 내용 (JSON 문자열) */
export function exportBackup(state, now = new Date()) {
  return JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), data: state }, null, 2);
}
export function backupFileName(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `ocean-world-backup-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}.json`;
}
/** 백업 파일 읽기. 형식이 맞지 않으면 { ok:false, error } */
export function parseBackup(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'not_json' }; }
  if (!raw || raw.app !== BACKUP_APP || !raw.data) return { ok: false, error: 'not_ocean_backup' };
  const st = normalizeState(raw.data);
  return st ? { ok: true, state: st } : { ok: false, error: 'invalid_data' };
}

// ---------------------------------------------------------------- 보호자 PIN (4자리 숫자)
// 브라우저에만 저장되는 간단한 잠금이다. 보안용이 아니라 아이의 실수를 막기 위한 장치다.
const bytesToHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return bytesToHex(await crypto.subtle.digest('SHA-256', data));
}
export const isValidPin = (pin) => /^\d{4}$/.test(String(pin));
export async function makePin(pin) {
  if (!isValidPin(pin)) return null;
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(8)));
  return { salt, hash: await hashPin(pin, salt) };
}
export async function verifyPin(state, pin) {
  if (!state.pin) return true;           // PIN을 아직 정하지 않았으면 잠금 없음
  if (!isValidPin(pin)) return false;
  return (await hashPin(pin, state.pin.salt)) === state.pin.hash;
}
