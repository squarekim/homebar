/**
 * AddBottleDialog — 술 추가.
 * 기본 흐름: [제품명 검색] → [제품 선택] → 시스템이 분류·도수·용량·원산지·표준 재료를 자동 입력 → [내 홈바에 추가].
 * 사용자가 싱글몰트/셰리/스카치 같은 분류를 직접 판단할 필요가 없다.
 * 기준 DB에 없으면 [직접 추가]로 넘어가고, 이 경우에도 이름에서 카테고리를 추정해 입력을 최소화한다.
 */
import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { bottleService, resolveIngredient } from '../../services/bottleService';
import { searchLiquor, guessCategory, guessWhiskySubcategory } from '../../services/liquorSearchService';
import { draftFromMaster, draftManual } from '../../data/userBottles';
import { CATEGORY_LABELS, CATEGORY_ORDER, CATEGORY_DEFAULT_INGREDIENT, SUBCATEGORY_INGREDIENT } from '../../data/liquorCategory';
import { referenceRepo } from '../../repositories/referenceRepo';
import { LiquorCategory, LiquorMasterItem, UserBottle, WhiskyClass } from '../../models/types';

const USES = ['시음-축', '겸용', '조주', '미활용'];
const ORIGINS = ['스카치', '버번', '테네시', '아이리시', '재패니즈', '코리안', '기타'];
const TYPES = ['싱글몰트', '블렌디드', '블렌디드 몰트', '스트레이트 버번', '휘티드 버번', '테네시 위스키', '싱글 팟 스틸'];
const REGIONS = ['스페이사이드', '하이랜드', '아일라', '아일랜드', '캠벨타운', '로우랜드', '켄터키'];
const CASKS = ['셰리', '버번', 'PX', '올로로소', '와인', '프렌치오크', '버진오크', '뉴 차드 오크', '미즈나라'];
const CHARACTERS = ['피티드', '논피트', '스모키', '왁시', '캐스크 스트렝스', '휘티드', '해양성'];

function Pick({ options, value, onPick, allowNone }: { options: string[]; value: string; onPick: (v: string) => void; allowNone?: boolean }) {
  return (
    <div className="controls" style={{ paddingTop: 0 }}>
      {allowNone && <button className="chip" aria-pressed={value === ''} onClick={() => onPick('')}>없음</button>}
      {options.map((o) => <button key={o} className="chip" aria-pressed={value === o} onClick={() => onPick(o)}>{o}</button>)}
    </div>
  );
}

function MultiPick({ options, values, onToggle }: { options: string[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="controls" style={{ paddingTop: 0 }}>
      {options.map((o) => <button key={o} className="chip" aria-pressed={values.includes(o)} onClick={() => onToggle(o)}>{o}</button>)}
    </div>
  );
}

/** 제품 → 표준 재료 연결 선택 (칵테일 레시피와 이어지는 canonical 키) */
function IngredientLink({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cats = referenceRepo.categories();
  const all = referenceRepo.ingredients();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%' }}>
      <option value="">연결 안 함</option>
      {cats.map((c) => (
        <optgroup key={c} label={c}>
          {all.filter((i) => i.category === c).map((i) => <option key={i.id} value={i.name}>{i.name}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

type Step = 'search' | 'confirm' | 'manual';

/** 직접 추가 시 이름·카테고리에서 표준 재료를 추정 (위스키는 세부분류까지 보고 고른다) */
function guessIngredientName(category: LiquorCategory, name: string): string | undefined {
  if (category === 'whisky') {
    const sub = guessWhiskySubcategory(name);
    return sub ? SUBCATEGORY_INGREDIENT[sub] : undefined;
  }
  return CATEGORY_DEFAULT_INGREDIENT[category];
}

export function AddBottleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useUI();
  const [step, setStep] = useState<Step>('search');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<LiquorMasterItem | null>(null);

  // 공통 입력값 (마스터 선택 시 자동 채워짐)
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LiquorCategory>('whisky');
  const [abv, setAbv] = useState('');
  const [volume, setVolume] = useState('');
  const [qty, setQty] = useState(1);
  const [use, setUse] = useState('시음-축');
  const [note, setNote] = useState('');
  const [ingName, setIngName] = useState('');
  const [link, setLink] = useState(true);
  const [detail, setDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // 직접 추가 시 위스키 분류(선택 입력)
  const [origin, setOrigin] = useState('스카치');
  const [type, setType] = useState('싱글몰트');
  const [region, setRegion] = useState('');
  const [casks, setCasks] = useState<string[]>([]);
  const [chars, setChars] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setStep('search'); setQ(''); setPicked(null);
    setName(''); setCategory('whisky'); setAbv(''); setVolume(''); setQty(1); setUse('시음-축');
    setNote(''); setIngName(''); setLink(true); setDetail(false); setSaving(false);
    setOrigin('스카치'); setType('싱글몰트'); setRegion(''); setCasks([]); setChars([]);
  }, [open]);

  const hits = useMemo(() => (open ? searchLiquor(q, { limit: 8 }) : []), [q, open]);

  if (!open) return null;

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const choose = (item: LiquorMasterItem) => {
    const d = draftFromMaster(item);
    setPicked(item);
    setName(d.name);
    setCategory(item.category);
    setAbv(item.abv ? String(item.abv) : '');
    setVolume(item.volumeMl ? String(item.volumeMl) : '');
    setUse(d.use);
    setQty(1); setNote(''); setDetail(false);
    setIngName(d.ingredientName ?? '');
    setLink(!!d.ingredientName);
    setStep('confirm');
  };

  const goManual = () => {
    const nm = q || name;
    const guessed = guessCategory(nm);
    const ing = guessIngredientName(guessed, nm);
    setName(q);
    setCategory(guessed);
    setUse(guessed === 'whisky' ? '시음-축' : '조주');
    setIngName(ing ?? '');
    setLink(!!ing);
    if (guessed === 'whisky') {
      const sub = guessWhiskySubcategory(nm);
      if (sub?.includes('버번')) { setOrigin('버번'); setType('스트레이트 버번'); setRegion('켄터키'); setCasks(['뉴 차드 오크']); }
      else if (sub?.includes('아이리시')) { setOrigin('아이리시'); setType('블렌디드'); setRegion('아일랜드'); }
      else if (sub?.includes('블렌디드')) { setOrigin('스카치'); setType('블렌디드'); }
    }
    setPicked(null);
    setStep('manual');
  };

  const pickCategory = (c: LiquorCategory) => {
    const ing = guessIngredientName(c, name);
    setCategory(c);
    setIngName(ing ?? '');
    setLink(!!ing);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) { toast('이름을 입력하세요'); return; }
    setSaving(true);
    const over: Partial<UserBottle> = {
      qty, use,
      note: note.trim() || undefined,
      abv: abv.trim() ? `${abv.trim().replace(/%$/, '')}%` : undefined,
      volumeMl: volume.trim() ? Number(volume.trim()) || undefined : undefined,
      ingredientName: ingName || undefined,
    };
    let draft: Omit<UserBottle, 'id' | 'createdAt'>;
    if (picked) {
      draft = draftFromMaster(picked, over);
    } else {
      const whiskyClass: WhiskyClass | undefined = category === 'whisky'
        ? { origin, type, region: region || undefined, cask: casks, character: chars }
        : undefined;
      draft = draftManual(n, category, { ...over, whiskyClass });
    }
    await bottleService.add(draft, { linkIngredient: link });
    const ing = link ? resolveIngredient(ingName) : undefined;
    toast(ing ? `${n} 추가됨 · 재료 '${ing.name}' 보유 ON` : `${n} 추가됨`);
    onClose();
  };

  return (
    <>
      <div className="scrim on" onClick={onClose} />
      <div className="modal on" role="dialog" aria-modal="true">
        <button className="close" onClick={onClose} aria-label="닫기">×</button>

        {step === 'search' && (
          <>
            <h2>술 추가</h2>
            <p className="hint" style={{ margin: '4px 0 10px' }}>
              제품명만 입력하면 분류·도수·용량·원산지·칵테일 재료가 자동으로 채워집니다.
            </p>
            <input type="search" autoFocus value={q} placeholder="예: 발베니 12 / 조니블랙 / Absolut" onChange={(e) => setQ(e.target.value)} />
            {q.trim() === '' && <div className="hint" style={{ marginTop: 10 }}>한글·영문·줄임말 모두 검색됩니다.</div>}
            {q.trim() !== '' && (
              <div className="list" style={{ marginTop: 10 }}>
                {hits.map(({ item, matched }) => (
                  <button className="card row" key={item.id} style={{ width: '100%', textAlign: 'left' }} onClick={() => choose(item)}>
                    <h3>{item.nameKo}{matched !== 'exact' && matched !== 'partial' && <em>{matched === 'alias' ? '별칭' : '유사'}</em>}</h3>
                    <div className="hint" style={{ margin: '2px 0 4px' }}>{item.nameEn}</div>
                    <div className="meta">
                      <span className="mi">{CATEGORY_LABELS[item.category]}</span>
                      <span className="mi">{item.subcategory}</span>
                      {item.abv ? <span className="mi">{item.abv}%</span> : null}
                      <span className="mi">{item.country}</span>
                    </div>
                  </button>
                ))}
                {hits.length === 0 && <div className="hint">검색 결과가 없습니다. 아래 <b>직접 추가</b>로 등록하세요.</div>}
              </div>
            )}
            <div className="btnrow">
              <button className="btn" onClick={goManual}>직접 추가</button>
              <button className="btn ghost" onClick={onClose}>취소</button>
            </div>
          </>
        )}

        {step !== 'search' && (
          <>
            <h2>{step === 'confirm' ? '이 제품이 맞나요?' : '직접 추가'}</h2>

            {step === 'confirm' && picked && (
              <div className="card" style={{ marginTop: 6 }}>
                <h3>{picked.nameKo}</h3>
                <div className="hint" style={{ margin: '2px 0 6px' }}>{picked.nameEn}</div>
                <div className="meta">
                  <span className="mi">{CATEGORY_LABELS[picked.category]}</span>
                  <span className="mi">{picked.subcategory}</span>
                  {picked.abv ? <span className="mi">{picked.abv}%</span> : null}
                  {picked.volumeMl ? <span className="mi">{picked.volumeMl}ml</span> : null}
                  <span className="mi">{picked.country}</span>
                  {picked.brand ? <span className="mi">{picked.brand}</span> : null}
                </div>
                {picked.whiskyClass && (
                  <div className="hint" style={{ marginTop: 6 }}>
                    자동 분류: {[picked.whiskyClass.origin, picked.whiskyClass.type, picked.whiskyClass.region,
                      ...picked.whiskyClass.cask.map((c) => `${c} 캐스크`), ...picked.whiskyClass.character].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            )}

            {step === 'manual' && (
              <>
                <div className="sechead" style={{ margin: '10px 0 6px' }}>이름</div>
                <input type="text" value={name} placeholder="예: 라가불린 16년" onChange={(e) => setName(e.target.value)} />
                <div className="sechead" style={{ margin: '14px 0 6px' }}>종류 <small style={{ color: 'var(--dim)', fontWeight: 400 }}>이름에서 자동 추정됨</small></div>
                <div className="controls" style={{ paddingTop: 0 }}>
                  {CATEGORY_ORDER.map((c) => (
                    <button key={c} className="chip" aria-pressed={category === c} onClick={() => pickCategory(c)}>{CATEGORY_LABELS[c]}</button>
                  ))}
                </div>
              </>
            )}

            <div className="sechead" style={{ margin: '14px 0 6px' }}>칵테일 재료 연결</div>
            <label className="it" style={{ marginBottom: 6 }}>
              <input type="checkbox" checked={link} onChange={(e) => setLink(e.target.checked)} />
              <span>이 술을 표준 재료로 재고에 반영 (레시피 판정에 즉시 적용)</span>
            </label>
            <IngredientLink value={ingName} onChange={(v) => { setIngName(v); setLink(!!v); }} />

            <div className="sechead" style={{ margin: '14px 0 6px' }}>수량 · 용도</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} style={{ maxWidth: 90 }} />
              <div style={{ flex: 1 }}><Pick options={USES} value={use} onPick={setUse} /></div>
            </div>

            <div className="btnrow" style={{ marginTop: 6 }}>
              <button className="btn ghost" onClick={() => setDetail((v) => !v)}>{detail ? '세부 항목 접기' : '도수·용량·메모 수정'}</button>
            </div>

            {detail && (
              <>
                <div className="sechead" style={{ margin: '10px 0 6px' }}>도수 · 용량(ml)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={abv} placeholder="도수 (예: 46)" onChange={(e) => setAbv(e.target.value)} />
                  <input type="number" value={volume} placeholder="용량 (예: 700)" onChange={(e) => setVolume(e.target.value)} />
                </div>
                <div className="sechead" style={{ margin: '14px 0 6px' }}>메모</div>
                <textarea rows={2} value={note} placeholder="구매처·가격·시음 소감 등" onChange={(e) => setNote(e.target.value)} />
              </>
            )}

            {step === 'manual' && category === 'whisky' && (
              <>
                <div className="sechead" style={{ margin: '16px 0 6px' }}>위스키 세부 분류 <small style={{ color: 'var(--dim)', fontWeight: 400 }}>선택 — 축별 결손 계산에 쓰입니다</small></div>
                <div className="hint" style={{ marginBottom: 6 }}>원산지</div>
                <Pick options={ORIGINS} value={origin} onPick={setOrigin} />
                <div className="hint" style={{ margin: '8px 0 6px' }}>타입</div>
                <Pick options={TYPES} value={type} onPick={setType} />
                <div className="hint" style={{ margin: '8px 0 6px' }}>지역</div>
                <Pick options={REGIONS} value={region} onPick={setRegion} allowNone />
                <div className="hint" style={{ margin: '8px 0 6px' }}>캐스크</div>
                <MultiPick options={CASKS} values={casks} onToggle={(v) => toggle(casks, setCasks, v)} />
                <div className="hint" style={{ margin: '8px 0 6px' }}>캐릭터</div>
                <MultiPick options={CHARACTERS} values={chars} onToggle={(v) => toggle(chars, setChars, v)} />
              </>
            )}

            <div className="btnrow">
              <button className="btn primary" onClick={save} disabled={saving}>내 홈바에 추가</button>
              <button className="btn" onClick={() => setStep('search')}>다시 검색</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
