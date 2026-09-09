/**
 * AddBottleDialog — 보유 술 직접 추가.
 * 위스키를 고르면 분류(원산지·타입·지역·캐스크·캐릭터)까지 입력받아
 * 저장 즉시 컬렉션·축별 커버리지·지역×숙성 매트릭스·구매 시뮬레이터에 반영된다.
 */
import { useEffect, useState } from 'react';
import { useUI } from '../UIContext';
import { userBottleRepo } from '../../repositories/userBottleRepo';
import { WhiskyClass } from '../../models/types';

const GROUPS = ['위스키', '진', '보드카', '럼·데킬라·브랜디', '리큐르', '기타'];
const USES = ['시음-축', '겸용', '조주', '미활용'];
const ORIGINS = ['스카치', '버번', '테네시', '아이리시', '재패니즈', '코리안', '기타'];
const TYPES = ['싱글몰트', '블렌디드', '블렌디드 몰트', '스트레이트 버번', '휘티드 버번', '테네시 위스키', '싱글 팟 스틸'];
const REGIONS = ['스페이사이드', '하이랜드', '아일라', '아일랜드', '캠벨타운', '로우랜드', '켄터키'];
const CASKS = ['셰리', '버번', 'PX', '올로로소', '와인', '프렌치오크', '버진오크', '뉴 차드 오크', '미즈나라'];
const CHARACTERS = ['피티드', '논피트', '스모키', '왁시', '캐스크 스트렝스', '휘티드', '해양성'];

function Pick({ options, value, onPick, allowNone }: {
  options: string[]; value: string; onPick: (v: string) => void; allowNone?: boolean;
}) {
  return (
    <div className="controls" style={{ paddingTop: 0 }}>
      {allowNone && <button className="chip" aria-pressed={value === ''} onClick={() => onPick('')}>없음</button>}
      {options.map((o) => (
        <button key={o} className="chip" aria-pressed={value === o} onClick={() => onPick(o)}>{o}</button>
      ))}
    </div>
  );
}

function MultiPick({ options, values, onToggle }: {
  options: string[]; values: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className="controls" style={{ paddingTop: 0 }}>
      {options.map((o) => (
        <button key={o} className="chip" aria-pressed={values.includes(o)} onClick={() => onToggle(o)}>{o}</button>
      ))}
    </div>
  );
}

export function AddBottleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useUI();
  const [name, setName] = useState('');
  const [group, setGroup] = useState('위스키');
  const [abv, setAbv] = useState('');
  const [qty, setQty] = useState(1);
  const [use, setUse] = useState('시음-축');
  const [note, setNote] = useState('');
  const [origin, setOrigin] = useState('스카치');
  const [type, setType] = useState('싱글몰트');
  const [region, setRegion] = useState('');
  const [casks, setCasks] = useState<string[]>([]);
  const [chars, setChars] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(''); setGroup('위스키'); setAbv(''); setQty(1); setUse('시음-축'); setNote('');
      setOrigin('스카치'); setType('싱글몰트'); setRegion(''); setCasks([]); setChars([]); setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = async () => {
    const n = name.trim();
    if (!n) { toast('이름을 입력하세요'); return; }
    setSaving(true);
    const whiskyClass: WhiskyClass | undefined = group === '위스키'
      ? { origin, type, region: region || undefined, cask: casks, character: chars }
      : undefined;
    await userBottleRepo.add({
      name: n,
      group,
      abv: abv.trim() ? `${abv.trim().replace(/%$/, '')}%` : undefined,
      qty,
      use,
      note: note.trim() || undefined,
      whiskyClass,
    });
    toast(`${n} 추가됨`);
    onClose();
  };

  return (
    <>
      <div className="scrim on" onClick={onClose} />
      <div className="modal on" role="dialog" aria-modal="true">
        <button className="close" onClick={onClose} aria-label="닫기">×</button>
        <h2>술 추가</h2>
        <p className="hint" style={{ margin: '4px 0 10px' }}>추가하면 컬렉션·분류·축별 결손·구매 시뮬레이터에 바로 반영됩니다.</p>

        <div className="sechead" style={{ margin: '10px 0 6px' }}>이름</div>
        <input type="text" value={name} placeholder="예: 라가불린 16년" onChange={(e) => setName(e.target.value)} />

        <div className="sechead" style={{ margin: '14px 0 6px' }}>종류</div>
        <Pick options={GROUPS} value={group} onPick={setGroup} />

        <div className="sechead" style={{ margin: '14px 0 6px' }}>도수 · 수량</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" value={abv} placeholder="도수 (예: 46)" onChange={(e) => setAbv(e.target.value)} />
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} style={{ maxWidth: 96 }} />
        </div>

        <div className="sechead" style={{ margin: '14px 0 6px' }}>용도</div>
        <Pick options={USES} value={use} onPick={setUse} />

        {group === '위스키' && (
          <>
            <div className="sechead" style={{ margin: '16px 0 6px' }}>원산지</div>
            <Pick options={ORIGINS} value={origin} onPick={setOrigin} />
            <div className="sechead" style={{ margin: '14px 0 6px' }}>타입</div>
            <Pick options={TYPES} value={type} onPick={setType} />
            <div className="sechead" style={{ margin: '14px 0 6px' }}>지역 <small style={{ color: 'var(--dim)', fontWeight: 400 }}>스카치면 선택</small></div>
            <Pick options={REGIONS} value={region} onPick={setRegion} allowNone />
            <div className="sechead" style={{ margin: '14px 0 6px' }}>캐스크 <small style={{ color: 'var(--dim)', fontWeight: 400 }}>복수 선택</small></div>
            <MultiPick options={CASKS} values={casks} onToggle={(v) => toggle(casks, setCasks, v)} />
            <div className="sechead" style={{ margin: '14px 0 6px' }}>캐릭터 <small style={{ color: 'var(--dim)', fontWeight: 400 }}>복수 선택</small></div>
            <MultiPick options={CHARACTERS} values={chars} onToggle={(v) => toggle(chars, setChars, v)} />
          </>
        )}

        <div className="sechead" style={{ margin: '16px 0 6px' }}>메모</div>
        <textarea rows={2} value={note} placeholder="구매처·가격·시음 소감 등" onChange={(e) => setNote(e.target.value)} />

        <div className="btnrow">
          <button className="btn primary" onClick={save} disabled={saving}>저장</button>
          <button className="btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </>
  );
}
