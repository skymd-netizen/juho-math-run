// 수영왕 버전 화면: 급수(수영모 색) 표시, 급수 승급 축하, 결과.
// 문제·코인·생명·콤보·토스트 같은 공통 HUD는 기본 ui.js를 그대로 쓰고, 급수와 관련된 부분만 바꾼다.
import { ui as base } from '../../ui.js';

const $ = (id) => document.getElementById(id);
const cap = (r) => `<i class="cap c-${r.id}"></i>`;
let promoDone = null;

export const swimUi = {
  ...base,

  /** 급수·누적 성공·다음 목표를 HUD와 각 화면의 .growth 칸에 그린다 */
  renderGrowth(g) {
    const crown = g.title ? '👑 ' : '';
    $('level').innerHTML = `${cap(g.rank)}${crown}Lv.${g.rank.level} ${g.rank.name}`;
    const next = g.next
      ? `<span>다음 목표: ${cap(g.next)}<b>${g.next.name}</b></span> <span>승급까지 <b>${g.remain}회</b> 성공 필요</span>`
      : `🏆 <b>${g.title}</b> · 최고 급수 달성!`;
    const html = `
      <div class="g-row">${cap(g.rank)}<b>${crown}${g.rank.name} Lv.${g.rank.level}</b><span>${g.rank.skill}</span></div>
      <div class="g-bar"><div style="width:${Math.round(g.pct * 100)}%"></div><span>${g.next ? `${g.clears} / ${g.next.need}` : 'MAX'}</span></div>
      <div class="g-next"><span>누적 성공 <b>${g.clears}회</b></span></div>
      <div class="g-next">${next}</div>`;
    document.querySelectorAll('.growth').forEach((n) => { n.innerHTML = html; });
  },

  /** 급수 승급 축하 화면. 확인을 누르면 onDone이 불린다. */
  showPromo(rank, g, onDone) {
    const grand = !!rank.grand;
    $('screen-promo').classList.toggle('black', grand);
    $('promo-kicker').textContent = grand ? '🎆 최종 급수 🎆' : '🏊 급수 승급!';
    $('promo-belt').className = `cap big c-${rank.id}`;
    $('promo-name').textContent = `${rank.name} · Lv.${rank.level}`;
    $('promo-msg').textContent = grand ? '축하해! 현우가 수영왕이 되었어요!' : `현우가 「${rank.skill}」 급수가 되었어요!`;
    $('promo-title').textContent = grand ? `👑 특별 칭호 「${g.title}」 획득` : (g.next ? `다음 목표는 ${g.next.name}(${g.next.skill})!` : '');
    const colors = grand ? ['#ffd23f', '#fff3a0', '#ffffff', '#4dd0ff', '#2f86e6'] : ['#4dd0ff', '#ffffff', '#2f86e6', '#7affd9', '#ffd23f'];
    let html = '';
    for (let i = 0; i < (grand ? 70 : 40); i++) {
      html += `<i class="confetti" style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 3).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 2).toFixed(2)}s"></i>`;
    }
    if (grand) {
      for (let b = 0; b < 7; b++) {
        const x = 8 + Math.random() * 84, y = 6 + Math.random() * 50, delay = (b * 0.45).toFixed(2);
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2, r = 60 + Math.random() * 50;
          html += `<i class="spark" style="left:${x}%;top:${y}%;background:${colors[(b + i) % colors.length]};--dx:${(Math.cos(a) * r).toFixed(0)}px;--dy:${(Math.sin(a) * r).toFixed(0)}px;animation-delay:${delay}s"></i>`;
        }
      }
    }
    $('promo-fx').innerHTML = html;
    promoDone = onDone;
    base.showScreen('promo');
  },

  showResult(r) {
    const g = r.growth;
    $('result-title').textContent = r.cleared ? '도착! 참 잘했어요!' : '아깝다! 다시 도전!';
    $('result-sub').textContent = `${r.topicName} · ${r.paceName}`;
    $('result-emoji').textContent = r.cleared ? (r.accuracy >= 90 ? '🏆' : '🏊') : '💪';
    $('screen-result').classList.toggle('cleared', !!r.cleared);
    const mm = Math.floor(r.time / 60), ss = Math.floor(r.time % 60);
    const rows = [
      ['⏱ 플레이 시간', `${mm}분 ${String(ss).padStart(2, '0')}초`],
      ['📝 전체 문제 수', `${r.total}문제`],
      ['⭕ 정답 수', `${r.correct}개`],
      ['❌ 오답 수', `${r.wrong}개`],
      ['🎯 정답률', `${r.accuracy}%`],
      ['🪙 획득 코인', `+${r.earned}개 (보유 ${r.coins}개)`],
      ['🔥 최고 콤보', `${r.maxCombo}연속`],
      ['🏊 현재 급수', `${cap(g.rank)}${g.rank.name} (${g.rank.skill})`],
      ['🏁 누적 성공', `${g.clears}회`],
      ['⏫ 다음 승급까지', g.next ? `${g.remain}회 (${g.next.name})` : '최고 급수!'],
    ];
    $('result-table').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
    const wrongBox = $('result-wrongs');
    if (r.wrongList?.length) {
      wrongBox.innerHTML = `<summary>📖 틀린 문제 다시 보기 (${r.wrongList.length})</summary>` +
        r.wrongList.map((w) => `<p><b>${w.expr} = ${w.answer}</b><br/><small>${w.explain}</small></p>`).join('');
      wrongBox.open = false; wrongBox.classList.remove('hidden');
    } else wrongBox.classList.add('hidden');
    base.showScreen('result');
  },
};

$('btn-promo').addEventListener('click', () => {
  const fn = promoDone; promoDone = null;
  $('promo-fx').innerHTML = '';
  if (fn) fn();
});
