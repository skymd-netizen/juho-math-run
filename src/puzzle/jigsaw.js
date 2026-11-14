// 지그소 퍼즐 생성기: 사진(canvas)을 받아 돌출부/들어간 부분이 맞물리는 조각 canvas들을 만든다.
// 난이도를 늘리려면 DIFFICULTIES 에 항목만 추가하면 된다 (예: 5x5, 6x6).

export const DIFFICULTIES = {
  easy:   { key: 'easy',   label: 'EASY',   cols: 2, rows: 2, stars: 1, coins: 10, speedSec: 60,  color: '#4cc96b' },
  normal: { key: 'normal', label: 'NORMAL', cols: 3, rows: 3, stars: 2, coins: 20, speedSec: 150, color: '#ffa726' },
  hard:   { key: 'hard',   label: 'HARD',   cols: 4, rows: 4, stars: 3, coins: 30, speedSec: 300, color: '#ef5350' },
};

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 모서리(edge) 하나의 모양 파라미터. 인접한 두 조각이 같은 edge 객체를 공유하므로 반드시 맞물린다.
function makeEdge(rand) {
  const j = 0.035;
  const r = () => (rand() * 2 - 1) * j;
  return { sign: rand() < 0.5 ? 1 : -1, a: r(), b: r(), c: r(), d: r(), e: r(), t: 0.095 + rand() * 0.015 };
}

export function makeEdges(cols, rows, rand) {
  // h[r][c]: r번째 가로선(위→아래 r=0..rows), c번째 칸. 왼→오 방향 기준, sign=+1 이면 아래쪽으로 볼록
  // v[r][c]: c번째 세로선(c=0..cols), r번째 칸. 위→아래 방향 기준, sign=+1 이면 오른쪽으로 볼록
  const h = [], v = [];
  for (let r = 0; r <= rows; r++) {
    h.push([]);
    for (let c = 0; c < cols; c++) h[r].push(r === 0 || r === rows ? null : makeEdge(rand));
  }
  for (let r = 0; r < rows; r++) {
    v.push([]);
    for (let c = 0; c <= cols; c++) v[r].push(c === 0 || c === cols ? null : makeEdge(rand));
  }
  return { h, v };
}

// 기준 방향(A→B)의 베지어 3구간 [ [c1,c2,end], ... ] 을 절대좌표로 계산
function edgeCurve(edge, A, B, normal) {
  const L = Math.hypot(B.x - A.x, B.y - A.y);
  const ux = (B.x - A.x) / L, uy = (B.y - A.y) / L;
  const { sign, a, b, c, d, e, t } = edge;
  const P = (l, w) => ({
    x: A.x + ux * l * L + normal.x * w * L * sign,
    y: A.y + uy * l * L + normal.y * w * L * sign,
  });
  const p = [
    P(0.2, a), P(0.5 + b + d, -t + c), P(0.5 - t + b, t + c),
    P(0.5 - 2 * t + b - d, 3 * t + c), P(0.5 + 2 * t + b - d, 3 * t + c), P(0.5 + t + b, t + c),
    P(0.5 + b + d, -t + c), P(0.8, e), P(1, 0),
  ];
  return [[p[0], p[1], p[2]], [p[3], p[4], p[5]], [p[6], p[7], p[8]]];
}

function reverseCurve(segs, start) {
  // 곡선을 반대 방향으로 걸을 때의 베지어 구간
  const pts = [start];
  segs.forEach((s) => pts.push(s[0], s[1], s[2]));
  const out = [];
  for (let i = segs.length - 1; i >= 0; i--) {
    const e = pts[i * 3], c1 = pts[i * 3 + 1], c2 = pts[i * 3 + 2];
    out.push([c2, c1, e]);
  }
  return out;
}

// (r,c) 조각의 외곽선 Path2D. ox,oy 는 조각 canvas 원점(원본 사진 좌표)
export function piecePath(edges, cw, ch, r, c, ox, oy) {
  const path = new Path2D();
  const X = (x) => x - ox, Y = (y) => y - oy;
  const x0 = c * cw, x1 = (c + 1) * cw, y0 = r * ch, y1 = (r + 1) * ch;
  path.moveTo(X(x0), Y(y0));
  const seg = (curve, end) => {
    if (!curve) { path.lineTo(X(end.x), Y(end.y)); return; }
    curve.forEach(([c1, c2, e]) => path.bezierCurveTo(X(c1.x), Y(c1.y), X(c2.x), Y(c2.y), X(e.x), Y(e.y)));
  };
  const hn = { x: 0, y: 1 }, vn = { x: 1, y: 0 };
  // 위 (왼→오)
  const top = edges.h[r][c];
  seg(top && edgeCurve(top, { x: x0, y: y0 }, { x: x1, y: y0 }, hn), { x: x1, y: y0 });
  // 오른쪽 (위→아래)
  const right = edges.v[r][c + 1];
  seg(right && edgeCurve(right, { x: x1, y: y0 }, { x: x1, y: y1 }, vn), { x: x1, y: y1 });
  // 아래 (오→왼): 같은 edge 를 반대로 걷는다
  const bot = edges.h[r + 1][c];
  seg(bot && reverseCurve(edgeCurve(bot, { x: x0, y: y1 }, { x: x1, y: y1 }, hn), { x: x0, y: y1 }), { x: x0, y: y1 });
  // 왼쪽 (아래→위)
  const left = edges.v[r][c];
  seg(left && reverseCurve(edgeCurve(left, { x: x0, y: y0 }, { x: x0, y: y1 }, vn), { x: x0, y: y0 }), { x: x0, y: y0 });
  path.closePath();
  return path;
}

// src: 원본 사진 canvas. 반환: 조각 목록과 공통 정보
export function buildPuzzle(src, cols, rows, seed = Date.now()) {
  const W = src.width, H = src.height;
  const cw = W / cols, ch = H / rows;
  const pad = Math.ceil(Math.max(cw, ch) * 0.3);
  const edges = makeEdges(cols, rows, mulberry32(seed));
  const lw = Math.max(1.5, Math.min(cw, ch) * 0.012);
  const pieces = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = Math.floor(c * cw - pad), oy = Math.floor(r * ch - pad);
      const w = Math.ceil(cw + pad * 2) + 1, h = Math.ceil(ch + pad * 2) + 1;
      const path = piecePath(edges, cw, ch, r, c, ox, oy);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.clip(path);
      // 사진 범위 안쪽만 잘라 그린다
      const sx = Math.max(0, ox), sy = Math.max(0, oy);
      const ex = Math.min(W, ox + w), ey = Math.min(H, oy + h);
      ctx.drawImage(src, sx, sy, ex - sx, ey - sy, sx - ox, sy - oy, ex - sx, ey - sy);
      // 안쪽 하이라이트
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,.45)';
      ctx.lineWidth = lw * 3;
      ctx.stroke(path);
      ctx.restore();
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(30,30,50,.55)';
      ctx.lineWidth = lw;
      ctx.stroke(path);
      pieces.push({
        id: r * cols + c, r, c, canvas, path, ox, oy, w, h,
        // 정답 위치: 원본 사진 좌표계에서 조각 canvas 중심
        cx: ox + w / 2, cy: oy + h / 2,
        placed: false,
      });
    }
  }
  // 보드에 그릴 점선 가이드용 전역 좌표 경로
  const guides = pieces.map((p) => piecePath(edges, cw, ch, p.r, p.c, 0, 0));
  return { pieces, guides, cw, ch, pad, cols, rows, W, H };
}
