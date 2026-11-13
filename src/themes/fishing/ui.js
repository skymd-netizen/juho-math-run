// 낚시 버전 화면: HUD(레벨·경험치·최고어), 물고기 카드, 레벨업·전설 연출, 결과, 도감.
// 문제·코인·생명·콤보·토스트 같은 공통 HUD는 기본 ui.js를 그대로 쓰고, 낚시에만 있는 부분을 덧붙인다.
import { ui as base } from '../../ui.js';
import { fishProgress } from './progress.js';
import { LEVELS, SPECIES, RARITY, SPOTS, speciesById, unlocksAt, fmtCm, fmtKg, MASTER_TITLE } from './data.js';
import { fishSvg, fishHtml } from './fishart.js';

const $ = (id) => document.getElementById(id);
const retrigger = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
const timers = {};
const hideLater = (key, node, ms, cls = 'show') => {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => node.classList.remove(cls), ms);
};
let levelDone = null;

const rarChip = (r) => `<span class="rar r-${r}">${RARITY[r].name}</span>`;
const dateKo = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`; };
const bestText = (b) => (b ? `${b.name} ${fmtCm(b.cm)}` : '아직 없어요');

/** 길이를 눈으로 비교하는 그림: 같은 눈금 위에 낚시꾼(키 110cm)과 물고기를 나란히 그린다 */
function compareHtml(cm, sp) {
  const k = Math.min(0.9, 170 / cm);
  const fw = Math.max(26, Math.round(cm * k)), mh = Math.max(16, Math.round(110 * k));
  return `<div class="cmp"><span class="me" style="font-size:${mh}px" title="낚시꾼 키 110cm">🧍</span><span class="fb" style="width:${fw}px">${fishSvg(sp)}</span></div><div class="cmp-note">🧍 키 110cm와 비교</div>`;
}

export const fishUi = {
  ...base,

  showScreen(name) {
    base.showScreen(name === 'dex' ? 'result' : name);
    $('screen-dex').classList.toggle('hidden', name !== 'dex');
    if (name === 'dex') $('screen-result').classList.add('hidden');
    if (name !== 'game') $('legend-fx')?.classList.add('hidden');
  },
  clearToast() {
    base.clearToast();
    for (const id of ['catch-card', 'levelup-banner']) $(id)?.classList.remove('show');
    $('legend-fx')?.classList.add('hidden');
  },

  /** 낚시 레벨·경험치·낚시터·최고어를 HUD와 각 화면의 .growth 칸에 그린다 */
  renderGrowth(g) {
    const d = fishProgress.data;
    const crown = g.title ? '👑 ' : '';
    $('level').innerHTML = `🎣 ${crown}Lv.${g.level.lv} ${g.level.name}`;
    $('xp-fill').style.width = `${Math.round(g.pct * 100)}%`;
    $('xp-text').textContent = g.next ? `경험치 ${g.xp} · 다음 레벨까지 ${g.remain}` : `경험치 ${g.xp} · 최고 레벨!`;
    $('hud-info').textContent = `📍 ${g.spot.name}  🏅 최고어 ${bestText(d.best)}`;
    const html = `
      <div class="g-row"><b>${crown}Lv.${g.level.lv} ${g.level.name}</b><span>경험치 ${g.xp}</span></div>
      <div class="g-bar"><div style="width:${Math.round(g.pct * 100)}%"></div><span>${g.next ? `${g.inLevel} / ${g.span}` : 'MAX'}</span></div>
      <div class="g-next">${g.next ? `<span>다음 <b>Lv.${g.next.lv} ${g.next.name}</b></span> <span>경험치 <b>${g.remain}</b> 필요</span>` : `🏆 <b>${g.title}</b> · 최고 레벨 달성!`}</div>
      <div class="g-next"><span>📍 ${g.spot.name}</span> <span>🏅 최고어 <b>${bestText(d.best)}</b></span> <span>📖 도감 <b>${fishProgress.dexCount()}/${SPECIES.length}</b></span></div>`;
    document.querySelectorAll('.growth').forEach((n) => { n.innerHTML = html; });
  },

  /** 물고기를 잡았을 때 화면 옆에 잠깐 뜨는 카드 (게임은 계속 진행된다) */
  catchCard({ fish, reward, rec }) {
    const sp = speciesById(fish.id);
    const tags = [];
    if (rec.isNew) tags.push('🆕 도감 등록!');
    if (rec.isBest) tags.push('🏅 최고어 신기록!');
    else if (rec.speciesRecord) tags.push('📈 신기록!');
    if (fish.big) tags.push('💪 대어!');
    const c = $('catch-card');
    c.className = `r-${fish.rarity}`;
    c.innerHTML = `
      <div class="cc-top">${rarChip(fish.rarity)}<b class="cc-name">${fish.name}</b></div>
      <div class="cc-fish">${fishSvg(sp)}</div>
      <div class="cc-stats">📏 <b>${fmtCm(fish.cm)}</b> &nbsp; ⚖️ <b>${fmtKg(fish.kg)}</b></div>
      ${compareHtml(fish.cm, sp)}
      <div class="cc-reward">⭐ +${reward.xp} &nbsp; 🪙 +${reward.coin}</div>
      ${tags.length ? `<div class="cc-tags">${tags.join(' · ')}</div>` : ''}`;
    retrigger(c, 'show');
    hideLater('catch', c, 3600);
  },

  /** 전설의 물고기: 화면 전체 황금 연출 */
  legendary({ fish, reward, rec }) {
    const sp = speciesById(fish.id);
    const el = $('legend-fx');
    el.innerHTML = `
      <div class="lg-rays"></div>
      <div class="lg-body">
        <div class="lg-kicker">✨ 전설의 물고기 획득! ✨</div>
        <div class="lg-fish">${fishSvg(sp)}</div>
        <div class="lg-name">${fish.name}</div>
        <div class="lg-stats">📏 ${fmtCm(fish.cm)} &nbsp; ⚖️ ${fmtKg(fish.kg)}</div>
        <div class="lg-reward">⭐ +${reward.xp} &nbsp; 🪙 +${reward.coin}</div>
        <div class="lg-reg">${rec.isNew ? '📖 도감에 새로 등록되었어요!' : '📖 도감에 기록되었어요!'}</div>
      </div>`;
    el.classList.remove('hidden');
    retrigger(el, 'go');
    clearTimeout(timers.legend);
    timers.legend = setTimeout(() => el.classList.add('hidden'), 4200);
  },

  /** 게임 중 레벨이 오를 때 위에 뜨는 축하 배너 */
  levelBanner(lv) {
    const L = LEVELS[lv - 1], u = unlocksAt(lv);
    const b = $('levelup-banner');
    b.innerHTML = `
      <div class="lb-title">🎣 LEVEL UP!</div>
      <div class="lb-name">Lv.${lv} ${L.name}</div>
      ${u.species.length ? `<div class="lb-un">🆕 새 물고기 해금: ${u.species.map((s) => s.name).join(', ')}</div>` : ''}
      ${u.spot ? `<div class="lb-un">📍 새 낚시터 해금: ${u.spot.name}</div>` : ''}`;
    retrigger(b, 'show');
    hideLater('lvl', b, 3800);
  },

  /** 판이 끝났을 때 레벨이 오른 경우의 축하 화면 */
  showLevelUp(levelUps, g, onDone) {
    const top = levelUps[levelUps.length - 1];
    const L = LEVELS[top - 1], master = top === 10;
    const sc = $('screen-promo');
    sc.classList.toggle('black', master);
    $('promo-kicker').textContent = master ? '🎆 최종 레벨 달성! 🎆' : '🎣 낚시 레벨 UP!';
    $('promo-belt').className = 'lvbadge';
    $('promo-belt').textContent = `Lv.${top}`;
    $('promo-name').textContent = L.name;
    const sp = [], spots = [];
    for (const lv of levelUps) { const u = unlocksAt(lv); sp.push(...u.species); if (u.spot) spots.push(u.spot); }
    $('promo-msg').innerHTML = [
      master ? '축하해! 우진이가 전설의 낚시왕이 되었어요!' : `${levelUps.length > 1 ? `Lv.${levelUps[0]}~${top}` : `Lv.${top}`} 달성! 낚시 실력이 쑥쑥 늘었어요!`,
      sp.length ? `🆕 새 물고기: ${sp.map((s) => s.name).join(', ')}` : '',
      spots.length ? `📍 새 낚시터: ${spots.map((s) => s.name).join(', ')}` : '',
    ].filter(Boolean).join('<br>');
    $('promo-title').textContent = master ? `👑 특별 칭호 「${MASTER_TITLE}」 획득` : (g.next ? `다음 목표는 Lv.${g.next.lv} ${g.next.name}!` : '');
    const colors = master ? ['#ffd23f', '#fff3a0', '#ffffff', '#4dd0ff', '#7affd9'] : ['#4dd0ff', '#ffd23f', '#7affd9', '#1e90ff', '#ff8fc0'];
    let html = '';
    for (let i = 0; i < (master ? 70 : 40); i++) {
      html += `<i class="confetti" style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 3).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 2).toFixed(2)}s"></i>`;
    }
    $('promo-fx').innerHTML = html;
    levelDone = onDone;
    base.showScreen('promo');
  },

  showResult(r) {
    const g = r.growth, d = fishProgress.data;
    $('result-title').textContent = r.cleared ? '도착! 참 잘했어요!' : '아깝다! 다시 도전!';
    $('result-sub').textContent = `${r.topicName} · ${r.paceName}`;
    $('result-emoji').textContent = r.cleared ? (r.accuracy >= 90 ? '🏆' : '🎣') : '💪';
    $('screen-result').classList.toggle('cleared', !!r.cleared);
    const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60);
    const rows = [
      ['⏱ 플레이 시간', `${mm}분 ${String(ss).padStart(2, '0')}초`],
      ['⭕ 정답 수', `${r.correct}개 (전체 ${r.total}문제)`],
      ['❌ 오답 수', `${r.wrong}개`],
      ['🎯 정답률', `${r.accuracy}%`],
      ['🪙 획득 코인', `+${r.earned}개 (보유 ${r.coins}개)`],
      ['🔥 최고 콤보', `${r.maxCombo}연속`],
      ['🐟 잡은 물고기', `${r.catches.length}마리`],
      ['⭐ 획득 경험치', `+${r.xpGain}`],
      ['🎣 낚시 레벨', `Lv.${g.level.lv} ${g.level.name}`],
      ['⏫ 다음 레벨까지', g.next ? `경험치 ${g.remain}` : '최고 레벨!'],
      ['🏅 최고어', bestText(d.best)],
    ];
    $('result-table').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
    const box = $('result-catches');
    if (r.catches.length) {
      box.innerHTML = r.catches.map((c) => `<div class="chip r-${c.rarity}">${fishHtml(speciesById(c.id))}<span>${c.name}<small>${fmtCm(c.cm)} · ${fmtKg(c.kg)}</small></span></div>`).join('');
      box.classList.remove('hidden');
    } else box.classList.add('hidden');
    const wrongBox = $('result-wrongs');
    if (r.wrongList?.length) {
      wrongBox.innerHTML = `<summary>📖 틀린 문제 다시 보기 (${r.wrongList.length})</summary>` +
        r.wrongList.map((w) => `<p><b>${w.expr} = ${w.answer}</b><br/><small>${w.explain}</small></p>`).join('');
      wrongBox.open = false; wrongBox.classList.remove('hidden');
    } else wrongBox.classList.add('hidden');
    fishUi.showScreen('result');
  },

  /** 물고기 도감: 잡은 물고기는 그림과 기록을, 못 잡은 물고기는 실루엣을 보여 준다 */
  openDex() {
    const dex = fishProgress.data.dex, lv = fishProgress.growth().level.lv;
    $('dex-count').textContent = `${fishProgress.dexCount()} / ${SPECIES.length}`;
    $('dex-grid').innerHTML = SPECIES.map((sp) => {
      const e = dex[sp.id];
      if (!e) return `<div class="dex-cell unknown r-${sp.rarity}">${fishHtml(sp, true)}<b>???</b><small>${sp.minLv <= lv ? '아직 못 잡았어요' : `Lv.${sp.minLv}부터 만날 수 있어요`}</small></div>`;
      return `<div class="dex-cell r-${sp.rarity}">${fishHtml(sp)}<b>${sp.name}</b>${rarChip(sp.rarity)}
        <small>🎣 ${e.count}회 잡음</small><small>📏 ${fmtCm(e.maxCm)} · ⚖️ ${fmtKg(e.maxKg)}</small><small>📅 ${dateKo(e.first)} 첫 획득</small></div>`;
    }).join('');
    const spots = SPOTS.map((s) => `<span class="${s.unlock <= lv ? 'on' : ''}">${s.unlock <= lv ? '📍' : '🔒'} ${s.name}${s.unlock <= lv ? '' : ` (Lv.${s.unlock})`}</span>`).join('');
    $('dex-spots').innerHTML = spots;
    fishUi.showScreen('dex');
  },
};

$('btn-promo').addEventListener('click', () => {
  // 기본 ui.js의 확인 버튼 처리(승급 화면 닫기)와 같은 버튼이다: 여기서는 레벨업 화면을 닫고 결과로 넘어간다
  const fn = levelDone; levelDone = null;
  $('promo-fx').innerHTML = '';
  $('promo-belt').className = '';
  if (fn) fn();
});
$('legend-fx').addEventListener('click', () => $('legend-fx').classList.add('hidden'));
