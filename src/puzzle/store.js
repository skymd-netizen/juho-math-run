// 기록 저장소: 사진 원본은 저장하지 않고 썸네일과 게임 기록만 브라우저(localStorage)에 보관한다.
const KEY = 'juho-photo-puzzle-v1';
const MAX_RECORDS = 60;

const fresh = () => ({ coins: 0, stars: 0, firstDone: false, streak: 0, records: [] });
let mem = null;

function read() {
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(KEY);
    mem = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch { mem = fresh(); }
  return mem;
}

function write() {
  // 용량이 부족하면 가장 오래된 기록부터 줄여가며 저장
  for (let i = 0; i < 20; i++) {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); return true; }
    catch { if (mem.records.length <= 1) break; mem.records.pop(); }
  }
  return false;
}

export const store = {
  get() { return read(); },
  addRecord(rec) {
    const s = read();
    if (s.records.some((r) => r.id === rec.id)) return false; // 중복 지급/저장 방지
    s.records.unshift(rec);
    if (s.records.length > MAX_RECORDS) s.records.length = MAX_RECORDS;
    write();
    return true;
  },
  patch(fn) { fn(read()); write(); },
};
