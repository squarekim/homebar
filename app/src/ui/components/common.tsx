import { useEffect, type ReactNode, type SyntheticEvent } from 'react';
import { type MethodKey, METHOD_LABELS_KO, type AvailabilityStatus, type FlavorVector, FLAVOR_AXES, FLAVOR_LABELS_KO, type RecommendationResult, type MakerNote, type BottleBadge, type WhiskyClass, type DrinkLog, SERVING_LABELS_KO } from '../../models/types';
import { STATUS_LABEL_KO } from '../../services/availabilityService';
import { lookupTerm, normalizeTerm } from '../../data/glossary';
import { useUI } from '../UIContext';
import { IconBuild, IconShake, IconStir, IconMuddle, IconBlend, IconLayer, IconSwizzle, IconFloat } from './icons';

/**
 * 모달 껍데기 — 스크림 · 닫기 버튼 · ESC 닫기 · 배경 스크롤 잠금.
 * 다이얼로그 네 곳이 같은 마크업을 각자 들고 있었고, 그 어느 것도 ESC 로 닫히지 않았다.
 * `.modal` 은 열림 전환(opacity)을 위해 항상 마운트된 채 `on` 만 토글한다.
 */
export function Modal({ open, onClose, shell = 'modal', children }: {
  open: boolean;
  onClose: () => void;
  /** 화면 가운데 큰 다이얼로그(modal) / 하단 용어 팝오버(terminfo) */
  shell?: 'modal' | 'terminfo';
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (shell === 'terminfo' && !open) return null;
  return (
    <>
      <div className={`scrim ${open ? 'on' : ''}`.trim()} onClick={onClose} />
      <div className={`${shell} ${open ? 'on' : ''}`.trim()} role="dialog" aria-modal="true">
        {open && (
          <>
            <button className="close" onClick={onClose} aria-label="닫기">×</button>
            {children}
          </>
        )}
      </div>
    </>
  );
}

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

/**
 * 병 뱃지 — "첫 피트 싱글몰트"처럼 메모에 적던 개인 이력을 한 칸으로.
 * 라벨 텍스트를 해석하지 않는다. 종류(kind)는 데이터가 들고 온다.
 */
export function BottleBadges({ badges }: { badges: BottleBadge[] }) {
  if (!badges.length) return null;
  return (
    <div className="badges">
      {badges.map((b, i) => (
        <span className={`bdg ${b.kind}`} key={`${b.kind}${i}`}>
          {b.label}{b.detail && <i>{b.detail}</i>}
        </span>
      ))}
    </div>
  );
}

/** 제조사/공식 테이스팅 노트 표시 (출처 링크 포함) */
export function MakerNoteView({ note, empty }: { note?: MakerNote | undefined; empty?: string | undefined }) {
  if (!note) {
    return <div className="hint" style={{ margin: '6px 0 0' }}>{empty ?? '제조사 공식 노트가 아직 없는 술입니다. 아래에 직접 기록해 두세요.'}</div>;
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

/** 추천 카드 목록 — 추천 화면 4곳이 같은 래퍼를 반복하고 있었다 */
export function RecList({ recs, onPick, empty }: {
  recs: RecommendationResult[];
  onPick: (rec: RecommendationResult) => void;
  empty?: string | undefined;
}) {
  return (
    <div className="list">
      {recs.length === 0 && empty && <div className="empty">{empty}</div>}
      {recs.map((r) => <RecCard key={r.id} rec={r} onClick={() => onPick(r)} />)}
    </div>
  );
}

/** 음용 기록 카드 (홈 '최근 기록' · 프로필 '음용 기록' 공용). 추가 액션은 children 으로. */
export function LogCard({ log, children }: { log: DrinkLog; children?: ReactNode }) {
  return (
    <div className="card">
      <h3>{log.drinkName}<em>{new Date(log.date).toLocaleDateString('ko')}</em></h3>
      <div className="meta">
        <span className="mi">{SERVING_LABELS_KO[log.servingStyle]}</span>
        <span className="mi">{'★'.repeat(log.rating)}{'☆'.repeat(5 - log.rating)}</span>
        {log.retryIntent && <span className="mi">재음용</span>}
      </div>
      {children}
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

/**
 * 칩·검색 UI — 화면 곳곳에서 같은 마크업을 손으로 반복하지 않도록 한곳에 모았다.
 * 선택 상태는 aria-pressed 로 표현하고 스타일은 .chip 이 전담한다.
 */

export interface ChipOption<T extends string> {
  v: T;
  label: string;
  /** 상태 색을 다르게 줄 때 (ok / no) */
  cls?: string | undefined;
}

/** 문자열 목록을 그대로 칩 옵션으로 */
export function chips(values: readonly string[]): ChipOption<string>[] {
  return values.map((v) => ({ v, label: v }));
}

/** 문자열 목록을 칩 옵션으로. 맨 앞에 '전체'(값 `all`)를 붙인다 — 가장 흔한 필터 모양. */
export function allChips(values: readonly string[], allLabel = '전체'): ChipOption<string>[] {
  return [{ v: 'all', label: allLabel }, ...chips(values)];
}

interface ChipBarProps {
  /** 가로 스크롤(strip) 대신 줄바꿈 */
  wrap?: boolean | undefined;
  /** 위 여백 제거 (제목 바로 아래 붙일 때) */
  tight?: boolean | undefined;
  className?: string | undefined;
  /** 같은 줄 끝에 덧붙일 칩 (예: 보유만 토글) */
  children?: ReactNode;
}

function barClass({ wrap, tight, className }: ChipBarProps) {
  return ['controls', wrap ? '' : 'strip', tight ? 'tight' : '', className ?? ''].filter(Boolean).join(' ');
}

/** 하나만 고르는 칩 줄 (서브탭·필터) */
export function ChipRow<T extends string>({
  value, options, onChange, children, ...bar
}: ChipBarProps & {
  value: T;
  options: readonly ChipOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className={barClass(bar)}>
      {options.map((o) => (
        <button key={o.v} className={`chip ${o.cls ?? ''}`.trim()} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
      {children}
    </div>
  );
}

/** 여러 개를 켜고 끄는 칩 줄 (캐스크·캐릭터·인원 등) */
export function ChipMulti<T extends string>({
  options, values, onToggle, children, ...bar
}: ChipBarProps & {
  options: readonly ChipOption<T>[];
  values: readonly T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className={barClass(bar)}>
      {options.map((o) => (
        <button key={o.v} className="chip" aria-pressed={values.includes(o.v)} onClick={() => onToggle(o.v)}>{o.label}</button>
      ))}
      {children}
    </div>
  );
}

/** 단독 on/off 칩 (보유만·바로 가능·잔량 표시) */
export function ChipToggle({ label, on, onToggle, cls }: { label: string; on: boolean; onToggle: () => void; cls?: string | undefined }) {
  return <button className={`chip ${cls ?? ''}`.trim()} aria-pressed={on} onClick={onToggle}>{label}</button>;
}

/** 목록 위의 검색 입력 — 6개 화면이 같은 마크업을 쓰고 있었다 */
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="controls">
      <input type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
