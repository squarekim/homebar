/**
 * WhiskyPage — 니트 위주 위스키 전용 탭.
 * [컬렉션] 분류·공식 노트·개인 메모  /  [축별 결손] 자동 커버리지 + 지역×숙성 매트릭스(실시간) + 구매 시뮬레이터.
 */
import { useMemo, useState } from 'react';
import { useWhiskies } from '../../hooks/useData';
import { WhiskyBrowser } from '../components/browsers';
import { Term, ChipRow, type ChipOption } from '../components/common';
import {
  computeCoverage, simulateAdd, computeRegionMaturityMatrix, MATRIX_TIERS,
} from '../../services/whiskyDiversityService';
import { CANDIDATE_WHISKIES } from '../../data/candidateWhiskies';

type Sub = 'collection' | 'matrix';
const SUBS: ChipOption<Sub>[] = [{ v: 'collection', label: '컬렉션' }, { v: 'matrix', label: '축별 결손' }];

export function WhiskyPage() {
  const [sub, setSub] = useState<Sub>('collection');
  return (
    <>
      <ChipRow value={sub} options={SUBS} onChange={setSub} />
      {sub === 'collection' && <WhiskyBrowser />}
      {sub === 'matrix' && <MatrixView />}
    </>
  );
}

function MatrixView() {
  const whiskies = useWhiskies();
  const coverage = useMemo(() => computeCoverage(whiskies), [whiskies]);
  const matrix = useMemo(() => computeRegionMaturityMatrix(whiskies), [whiskies]);
  const sims = useMemo(() =>
    CANDIDATE_WHISKIES
      .map((c) => ({ c, sim: simulateAdd(c.cls, whiskies) }))
      .sort((a, b) => b.sim.gain - a.sim.gain),
  [whiskies]);

  const totalGaps = coverage.reduce((s, f) => s + f.gapCount, 0);

  return (
    <>
      <div className="hint">보유 위스키에서 <b>실시간 계산</b>한 다양성 지도입니다. 위스키를 추가하면 즉시 갱신됩니다. <b className="tag-na">결손</b> 칸이 다음 구매 우선 후보입니다.</div>

      {/* 지역 × 숙성 매트릭스 — 원본 시음 매트릭스를 현재 컬렉션으로 연결 */}
      <div className="sechead">스카치 싱글몰트 · 지역 × 숙성 (실시간)</div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>지역</th>{MATRIX_TIERS.map((t) => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.region}>
                <td style={{ whiteSpace: 'nowrap' }}><Term label={row.region} /></td>
                {MATRIX_TIERS.map((t) => {
                  const list = row.cells[t];
                  return (
                    <td key={t}>
                      {list.length === 0
                        ? <span className="tag-na">결손</span>
                        : list.map((n, i) => <div key={i} className="tag-ok" style={{ fontSize: 12 }}>{n}</div>)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: 'var(--dim)', margin: '8px 0 4px' }}>숙성: 엔트리 ≤11년 · 스탠다드 12–17년 · 고숙성 18년+ (병 이름의 연수로 판정, NAS 제외). 지역·연수가 다른 원산지(버번·재패니즈·코리안 등)는 아래 축별 커버리지로 본다.</p>

      <div className="sechead">축별 커버리지 (자동) · 결손 {totalGaps}</div>
      {coverage.map((fam) => (
        <div className="grpbox" key={fam.key}>
          <h4>{fam.label} <small style={{ color: 'var(--dim)' }}>· 결손 {fam.gapCount}</small></h4>
          <div className="clstags">
            {fam.cells.map((c) => (
              <Term key={c.value} term={c.value} label={`${c.value}${c.gap ? ' · 결손' : ` · ${c.count}`}`} className={c.gap ? 'gap' : 'have'} />
            ))}
          </div>
        </div>
      ))}

      <div className="sechead">구매 시뮬레이터 · 후보를 넣으면 겹침/신규 축 계산</div>
      <div className="hint">각 후보를 보유 컬렉션에 더했을 때, 이미 겹치는 축과 새로 열리는(결손 해소) 축을 보여줍니다. 신규 축이 많을수록 다양성 확장 효과가 큽니다.</div>
      <div className="list">
        {sims.map(({ c, sim }) => (
          <div className="card" key={c.id}>
            <h3>{c.name}<em className={sim.gain > 0 ? 'delta' : ''}>{sim.gain > 0 ? `신규 +${sim.gain}` : '겹침만'}</em></h3>
            <div style={{ fontSize: 12, color: 'var(--mute)', margin: '2px 0 6px' }}>{c.note}</div>
            {sim.newlyFilled.length > 0 && (
              <div className="clstags" style={{ marginBottom: 4 }}>
                {sim.newlyFilled.map((h, i) => <Term key={i} term={h.value} label={`+ ${h.value}`} className="new" />)}
              </div>
            )}
            {sim.overlaps.length > 0 && (
              <div className="clstags">
                {sim.overlaps.map((h, i) => <Term key={i} term={h.value} label={`${h.value} 겹침 ${h.count}`} className="ov" />)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
