/**
 * WhiskyPage — 니트 위주 위스키 전용 탭.
 * [컬렉션] 분류·공식 노트·개인 메모  /  [축별 결손] 지역×숙성 매트릭스 + 캐스크 축(구매 참고).
 */
import { useMemo, useState } from 'react';
import { referenceRepo } from '../../repositories/referenceRepo';
import { WhiskyBrowser } from '../components/browsers';

type Sub = 'collection' | 'matrix';

export function WhiskyPage() {
  const [sub, setSub] = useState<Sub>('collection');
  return (
    <>
      <div className="controls strip">
        <button className="chip" aria-pressed={sub === 'collection'} onClick={() => setSub('collection')}>컬렉션</button>
        <button className="chip" aria-pressed={sub === 'matrix'} onClick={() => setSub('matrix')}>축별 결손</button>
      </div>
      {sub === 'collection' && <WhiskyBrowser />}
      {sub === 'matrix' && <MatrixView />}
    </>
  );
}

function cell(v: string) {
  if (!v || v === '—') return <span style={{ color: 'var(--dim)' }}>—</span>;
  if (v === '결손') return <span className="tag-na">결손</span>;
  return <span className="tag-ok">{v}</span>;
}

function MatrixView() {
  const matrix = referenceRepo.matrix();
  const cask = referenceRepo.cask();

  const gaps = useMemo(() => {
    const m = matrix.filter((r) => r.entry === '결손' || r.std === '결손' || r.aged === '결손').length;
    const agedGaps = matrix.filter((r) => r.aged === '결손').length;
    const caskGaps = cask.filter((c) => c.state === '결손').length;
    return { m, agedGaps, caskGaps };
  }, [matrix, cask]);

  // 그룹별로 묶기 (원본 순서 유지)
  const groups: { g: string; rows: typeof matrix }[] = [];
  for (const r of matrix) {
    const last = groups[groups.length - 1];
    if (last && last.g === r.g) last.rows.push(r);
    else groups.push({ g: r.g, rows: [r] });
  }

  return (
    <>
      <div className="hint">보유 위스키를 지역·숙성·캐스크 축으로 본 다양성 지도입니다. <b className="tag-na">결손</b>은 그 축에 보유가 없다는 뜻 — 다음 구매의 우선 후보입니다. (시음 축이며 칵테일 조주와는 무관)</div>
      <div className="stat">
        <div className="box"><b className="tag-na">{gaps.agedGaps}</b><small>고숙성(18+) 결손 축</small></div>
        <div className="box"><b className="tag-na">{gaps.caskGaps}</b><small>캐스크 결손 축</small></div>
      </div>

      <div className="sechead">지역 × 숙성 매트릭스</div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>축</th><th>엔트리</th><th>스탠다드</th><th>고숙성 18+</th></tr></thead>
          <tbody>
            {groups.flatMap((grp) => [
              <tr key={grp.g}><td colSpan={4} style={{ color: 'var(--amber)', fontSize: 12, paddingTop: 12 }}>{grp.g}</td></tr>,
              ...grp.rows.map((m, i) => (
                <tr key={grp.g + i}>
                  <td>{m.axis}{m.note ? <div className="meta">{m.note}</div> : null}</td>
                  <td>{cell(m.entry)}</td>
                  <td>{cell(m.std)}</td>
                  <td>{cell(m.aged)}</td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>

      <div className="sechead">캐스크 축 (보조)</div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>캐스크</th><th>보유</th><th>상태</th></tr></thead>
          <tbody>
            {cask.map((c, i) => (
              <tr key={i}>
                <td>{c.axis}{c.note ? <div className="meta">{c.note}</div> : null}</td>
                <td>{c.have}</td>
                <td>{c.state === '결손' ? <span className="tag-na">결손</span> : <span className="tag-ok">{c.state}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tnote" style={{ fontSize: 12, color: 'var(--dim)', marginTop: 10 }}>시음 다양성 지도입니다. 조주 가능 여부는 홈바 탭의 칵테일 판정이 담당합니다.</p>
    </>
  );
}
