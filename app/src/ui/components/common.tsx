import { AvailabilityStatus, FlavorVector, FLAVOR_AXES, FLAVOR_LABELS_KO, RecommendationResult, MakerNote } from '../../models/types';
import { STATUS_LABEL_KO } from '../../services/availabilityService';

/** 제조사/공식 테이스팅 노트 표시 (출처 링크 포함) */
export function MakerNoteView({ note }: { note?: MakerNote }) {
  if (!note) {
    return <div className="hint" style={{ margin: '6px 0 0' }}>공식 노트 미확보 — 아래에 직접 기록할 수 있습니다.</div>;
  }
  return (
    <div className="makernote">
      {note.text && <p className="mn-line">{note.text}</p>}
      {note.nose && <p className="mn-line"><b>향(Nose)</b> {note.nose}</p>}
      {note.palate && <p className="mn-line"><b>맛(Palate)</b> {note.palate}</p>}
      {note.finish && <p className="mn-line"><b>피니시(Finish)</b> {note.finish}</p>}
      <a className="mn-src" href={note.source} target="_blank" rel="noopener">출처: {note.sourceName ?? note.source} ↗</a>
    </div>
  );
}

export function StatusBadge({ status }: { status: AvailabilityStatus }) {
  return <span className={`badge b-${status}`}>{STATUS_LABEL_KO[status]}</span>;
}

/** 향미 14축 막대 (0 인 축 생략 옵션) */
export function FlavorBars({ vector, compact }: { vector: FlavorVector; compact?: boolean }) {
  const axes = compact
    ? [...FLAVOR_AXES].filter((a) => vector[a] > 0).sort((x, y) => vector[y] - vector[x]).slice(0, 6)
    : FLAVOR_AXES;
  return (
    <div className="flavbars">
      {axes.map((a) => (
        <div className="fb" key={a}>
          <span className="lb">{FLAVOR_LABELS_KO[a]}</span>
          <span className="track"><span className="fill" style={{ width: `${vector[a] * 10}%` }} /></span>
          <span className="vv">{vector[a].toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

export function RecCard({ rec, onClick }: { rec: RecommendationResult; onClick?: () => void }) {
  return (
    <button className="rec" onClick={onClick}>
      <div className="top">
        <span className="nm">{rec.name}{rec.kind === 'whisky' ? ' 🥃' : ''}</span>
        <span className="sc">{rec.score}</span>
      </div>
      <div className="rs">{rec.reason}</div>
      <div className="subscores">
        <span className="ss">취향 <b>{rec.tasteScore}</b></span>
        {rec.kind === 'cocktail' && <span className="ss">가용 <b>{rec.availabilityScore}</b></span>}
        {rec.kind === 'cocktail' && <span className="ss">재고 <b>{rec.inventoryScore}</b></span>}
        <span className="ss">신선 <b>{rec.noveltyScore}</b></span>
      </div>
    </button>
  );
}

export function ChipRow<T extends string>({
  value, options, onChange, className,
}: {
  value: T;
  options: { v: T; label: string; cls?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`controls strip ${className ?? ''}`}>
      {options.map((o) => (
        <button key={o.v} className={`chip ${o.cls ?? ''}`} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
