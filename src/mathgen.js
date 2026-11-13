// 수학 문제 생성기. 정답 1개 + 오답 2개, 난이도는 문제 번호(index)에 따라 올라간다.
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 진행도에 따른 숫자 난이도(1~3): 쉬운 문제로 시작해서 뒤로 갈수록 어려워진다
export function levelFor(index, total) {
  const r = index / total;
  return r < 0.4 ? 1 : r < 0.75 ? 2 : 3;
}

function makeAdd(level) {
  let a, b;
  if (level === 1) { a = rnd(1, 9); b = rnd(1, 9); }
  else if (level === 2) { a = rnd(10, 40); b = rnd(2, 30); }
  else { a = rnd(20, 99); b = rnd(10, 60); }
  const ans = a + b;
  const tens = Math.floor(b / 10) * 10;
  const explain = b > 10 && tens > 0
    ? `${a} + ${tens} = ${a + tens}, 거기에 ${b - tens}을 더하면 ${ans}`
    : `${a}에서 ${b}만큼 더 세면 ${ans}`;
  return { text: `${a} + ${b}`, ans, explain, kind: 'add', hints: [1, 2, 10, a, b] };
}

function makeSub(level) {
  let a, b;
  if (level === 1) { a = rnd(5, 18); b = rnd(1, Math.min(9, a - 1)); }
  else if (level === 2) { a = rnd(20, 60); b = rnd(5, a - 5); }
  else { a = rnd(40, 99); b = rnd(10, a - 5); }
  const ans = a - b; // 항상 0 이상
  const tens = Math.floor(b / 10) * 10;
  const explain = b > 10 && tens > 0
    ? `${a} - ${tens} = ${a - tens}, 거기에서 ${b - tens}을 빼면 ${ans}`
    : `${a}에서 ${b}만큼 거꾸로 세면 ${ans}`;
  return { text: `${a} - ${b}`, ans, explain, kind: 'sub', hints: [1, 2, 10] };
}

function makeMul(level) {
  let a, b;
  if (level === 1) { a = rnd(2, 5); b = rnd(1, 5); }
  else if (level === 2) { a = rnd(2, 9); b = rnd(2, 9); }
  else { a = rnd(2, 9); b = rnd(5, 9); }
  const ans = a * b;
  return { text: `${a} × ${b}`, ans, explain: `${a}단: ${a} × ${b} = ${a}을 ${b}번 더하면 ${ans}`, kind: 'mul', a, b, hints: [] };
}

function wrongAnswers(q) {
  const { ans } = q;
  const pool = new Set();
  if (q.kind === 'mul') {
    // 구구단 헷갈리기 쉬운 값들 (옆 칸 값, 십의 자리/일의 자리 실수)
    [q.a * (q.b - 1), q.a * (q.b + 1), (q.a - 1) * q.b, (q.a + 1) * q.b, ans + 1, ans - 1, ans + 10, ans - 10].forEach((v) => pool.add(v));
  } else {
    [1, 2, 3, 10, -1, -2, -3, -10].forEach((d) => pool.add(ans + d));
    if (q.kind === 'add') pool.add(ans + 9), pool.add(ans - 9); // 받아올림 실수
  }
  let cands = [...pool].filter((v) => v >= 0 && v !== ans);
  // 정답과 너무 동떨어지지 않게 (정답 크기에 비례, 최대 ±12)
  const near = cands.filter((v) => Math.abs(v - ans) <= Math.max(3, Math.ceil(ans * 0.4)));
  cands = near.length >= 2 ? near : cands.filter((v) => Math.abs(v - ans) <= 12);
  const out = [];
  while (out.length < 2 && cands.length) {
    const v = pick(cands);
    out.push(v);
    cands = cands.filter((c) => c !== v);
  }
  let k = 1;
  while (out.length < 2) {
    const v = ans + k;
    if (v >= 0 && v !== ans && !out.includes(v)) out.push(v);
    k = k > 0 ? -k : -k + 1;
    if (k > 30) break;
  }
  return out;
}

/**
 * 문제 하나를 만든다. choices는 섞인 3개의 숫자, correctIndex는 정답 위치(0~2)
 * topic: 'add'(더하기) | 'sub'(빼기) | 'mul'(구구단) | 'mix'(전부 섞어서)
 */
export function generateQuestion(index, total, topic = 'mix') {
  const level = levelFor(index, total);
  const op = topic === 'mix' ? pick(['add', 'sub', 'mul']) : topic;
  const q = op === 'add' ? makeAdd(level) : op === 'sub' ? makeSub(level) : makeMul(level);
  const wrongs = wrongAnswers(q);
  const choices = [q.ans, ...wrongs];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {
    text: q.text + ' = ?',
    expr: q.text,
    answer: q.ans,
    explain: q.explain,
    choices,
    correctIndex: choices.indexOf(q.ans),
    level,
    op, // 'add' | 'sub' | 'mul' (학습 기록용)
  };
}
