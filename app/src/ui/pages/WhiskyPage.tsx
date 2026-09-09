/**
 * WhiskyPage — 니트 위주 위스키 전용 탭.
 * [컬렉션] 분류·공식 노트·개인 메모  /  [축별 결손] 자동 커버리지 + 구매 시뮬레이터 + 캐스크 해설 + 원본 매트릭스.
 */
import { useMemo, useState } from 'react';
import { referenceRepo } from '../../repositories/referenceRepo';
import { WhiskyBrowser } from '../components/browsers';
import { computeCoverage, simulateAdd } from '../../services/whiskyDiversityService';
import { CANDIDATE_WHISKIES } from '../../data/candidateWhiskies';
import { CASK_SHERRY_VS_WINE } from '../../data/whiskyEducation';

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
  const whiskies = referenceRepo.whiskies();
  const coverage = useMemo(() => computeCoverage(whiskies), [whiskies]);

  const sims = useMemo(() =>
    CANDIDATE_WHISKIES
      .map((c) => ({ c, sim: simulateAdd(c.cls, whiskies) }))
      .sort((a, b) => b.sim.gain - a.sim.gain),
  [whiskies]);

  const totalGaps = coverage.reduce((s, f) => s + f.gapCount, 0);

  return (
    <>
      <div className="hint">보유 위스키 분류에서 <b>자동 계산</b>한 다양성 지도입니다. 컬렉션에 위스키가 추가되면 즉시 갱신됩니다. <b className="tag-na">결손</b> 축이 다음 구매 우선 후보입니다.</div>

      <div className="sechead">축별 커버리지 (자동) · 결손 {totalGaps}</div>
      {coverage.map((fam) => (
        <div className="grpbox" key={fam.key}>
          <h4>{fam.label} <small style={{ color: 'var(--dim)' }}>· 결손 {fam.gapCount}</small></h4>
          <div className="clstags">
            {fam.cells.map((c) => (
              <span key={c.value} className={`cltag ${c.gap ? 'gap' : 'have'}`} title={c.bottles.join(', ')}>
                {c.value}{c.gap ? ' · 결손' : ` · ${c.count}`}
              </span>
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
                {sim.newlyFilled.map((h, i) => <span key={i} className="cltag new">+ {h.value} <small>({h.family})</small></span>)}
              </div>
            )}
            {sim.overlaps.length > 0 && (
              <div className="clstags">
                {sim.overlaps.map((h, i) => <span key={i} className="cltag ov">{h.value} 겹침 <small>({h.count})</small></span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <CaskExplainerCard />

      <div className="sechead">원본 시음 매트릭스 (참고)</div>
      <LegacyMatrix />
    </>
  );
}

function CaskExplainerCard() {
  const e = CASK_SHERRY_VS_WINE;
  return (
    <>
      <div className="sechead">{e.title}</div>
      <div className="makernote">
        {e.rows.map((r) => (
          <p className="mn-line" key={r.label}><b>{r.label}</b><br />{r.text}</p>
        ))}
        <p className="mn-line" style={{ color: 'var(--amber)' }}><b>핵심</b> {e.key}</p>
        <div>{e.sources.map((s) => <a key={s.url} className="mn-src" style={{ display: 'block' }} href={s.url} target="_blank" rel="noopener">출처: {s.name} ↗</a>)}</div>
      </div>
    </>
  );
}

function LegacyMatrix() {
  const matrix = referenceRepo.matrix();
  const cask = referenceRepo.cask();
  const groups: { g: string; rows: typeof matrix }[] = [];
  for (const r of matrix) {
    const last = groups[groups.length - 1];
    if (last && last.g === r.g) last.rows.push(r);
    else groups.push({ g: r.g, rows: [r] });
  }
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>축</th><th>엔트리</th><th>스탠다드</th><th>고숙성 18+</th></tr></thead>
          <tbody>
            {groups.flatMap((grp) => [
              <tr key={grp.g}><td colSpan={4} style={{ color: 'var(--amber)', fontSize: 12, paddingTop: 12 }}>{grp.g}</td></tr>,
              ...grp.rows.map((m, i) => (
                <tr key={grp.g + i}>
                  <td>{m.axis}{m.note ? <div className="meta">{m.note}</div> : null}</td>
                  <td>{cell(m.entry)}</td><td>{cell(m.std)}</td><td>{cell(m.aged)}</td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
      <div className="sechead">캐스크 축</div>
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
      <p style={{ fontSize: 12, color: 'var(--dim)', marginTop: 10 }}>원본 스냅샷 표입니다. 위 “자동 커버리지”가 현재 컬렉션(추가된 병 포함)을 실시간 반영합니다.</p>
    </>
  );
}
