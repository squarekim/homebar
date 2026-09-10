import { SyntheticEvent } from 'react';
import { MethodKey, METHOD_LABELS_KO, AvailabilityStatus, FlavorVector, FLAVOR_AXES, FLAVOR_LABELS_KO, RecommendationResult, MakerNote, WhiskyClass } from '../../models/types';
import { STATUS_LABEL_KO } from '../../services/availabilityService';
import { lookupTerm, normalizeTerm } from '../../data/glossary';
import { useUI } from '../UIContext';
import { IconBuild, IconShake, IconStir, IconMuddle, IconBlend, IconLayer, IconSwizzle, IconFloat } from './icons';

/** 해설이 붙는 분류 태그. 데스크톱은 hover(native title), 모바일/클릭은 고정 팝오버(어떤 컨테이너에도 안 잘림). */
export function Term({ label, term, className }: { label: string; term?: string; className?: string }) {
  const { showTerm } = useUI();
  const def = lookupTerm(term ?? label);
  const base = `cltag ${className ?? ''}`.trim();
  if (!def) return <span className={base}>{label}</span>;
  const title = term ?? normalizeTerm(label);
  const open = (e: SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); showTerm(title, def); };
  return (
    <span
      className={`${base} term`}
      role="button"
      tabIndex={0}
      title={def}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(e); }}
    >
      {label}
    </span>
  );
}

/** 위스키 분류 배지 (원산지·타입·지역·캐스크·캐릭터). 각 태그에 용어 해설 툴팁. */
export function WhiskyClassTags({ cls }: { cls?: WhiskyClass }) {
  if (!cls) return null;
  const stripParen = (s: string) => s.replace(/\s*\(.*?\)\s*$/, '');
  return (
    <div className="clstags">
      <Term label={cls.origin} className="or" />
      <Term label={cls.type} />
      {cls.region && <Term label={cls.region} term={stripParen(cls.region)} />}
      {cls.cask.map((c, i) => <Term key={'k' + i} label={`${c} 캐스크`} term={c} />)}
      {cls.character.map((c, i) => <Term key={'c' + i} label={c} className="ch" />)}
    </div>
  );
}

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
/** 조주법 아이콘 — 이름 옆에 붙어 만드는 방식을 글자 없이 알려준다 */
const METHOD_ICONS: Record<MethodKey, () => JSX.Element> = {
  build: IconBuild, shake: IconShake, stir: IconStir, muddle: IconMuddle,
  blend: IconBlend, layer: IconLayer, swizzle: IconSwizzle, float: IconFloat,
};

export function MethodIcon({ keys, raw }: { keys: MethodKey[]; raw?: string }) {
  if (!keys.length) return null;
  const label = raw || keys.map((k) => METHOD_LABELS_KO[k]).join(' + ');
  return (
    <span className="methods" title={label} aria-label={`조주법 ${label}`}>
      {keys.slice(0, 2).map((k) => {
        const Ic = METHOD_ICONS[k];
        return <span className="mic" key={k}><Ic /></span>;
      })}
    </span>
  );
}

/**
 * 향미 프로파일 — 14축 각 0~10점.
 * 눈으로 강도가 바로 읽히도록 눈금(0·5·10)을 깔고, 가장 센 축을 진하게 준다.
 */
export function FlavorBars({ vector, compact }: { vector: FlavorVector; compact?: boolean }) {
  const axes = compact
    ? [...FLAVOR_AXES].filter((a) => vector[a] > 0).sort((x, y) => vector[y] - vector[x]).slice(0, 6)
    : FLAVOR_AXES;
  if (!axes.length) return null;
  const top = axes.reduce((m, a) => (vector[a] > vector[m] ? a : m), axes[0]);
  return (
    <div className="flavbars">
      <div className="fbscale"><span>0</span><span>5</span><span>10</span></div>
      {axes.map((a) => (
        <div className={`fb ${a === top ? 'lead' : ''}`} key={a}>
          <span className="lb">{FLAVOR_LABELS_KO[a]}</span>
          <span className="track">
            <i className="tick" /><i className="tick mid" />
            <span className="fill" style={{ width: `${Math.min(100, vector[a] * 10)}%` }} />
          </span>
          <span className="vv">{Math.round(vector[a])}</span>
        </div>
      ))}
      <div className="fbfoot">10점 만점</div>
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
