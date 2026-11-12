/**
 * SettingsPage — '설정'. 화면·음주 안내·백업을 모았다. 취향과 함께 마시는 사람은 취향 화면이 가져다 쓴다.
 * 취향은 좋아하는 맛 몇 개를 고르는 것으로 시작하고, 14축 슬라이더는 '세부 취향 조정'으로 접어 둔다.
 * 새 학습 알고리즘은 넣지 않는다 — 기존 값 편집과 기록 기반 재계산 그대로다.
 */
import { useRef, useState } from 'react';
import { useUI } from '../UIContext';
import { BUILD_STAMP } from '../../config';
import { useMe, useTasteProfiles } from '../../hooks/useData';
import { tasteService } from '../../services/tasteService';
import { tasteProfileRepo } from '../../repositories/tasteProfileRepo';
import { backupService } from '../../services/backupService';
import { isNeutralTaste } from '../../services/flavorService';
import { FlavorBars } from '../components/common';
import { applyTheme, savedTheme, type Theme } from '../theme';
import { FLAVOR_AXES, FLAVOR_LABELS_KO, type FlavorVector, type FlavorAxis } from '../../models/types';

/** 시작점으로 고르기 좋은 맛 — 14축 중 사람들이 말로 쓰는 것들 */
const QUICK_AXES: FlavorAxis[] = ['sweet', 'citrus', 'fruit', 'smoke', 'peat', 'herbal', 'spice', 'chocolate'];

export function SettingsPage() {
  return (
    <>
      <h2 className="pagetitle" data-k="Settings">설정</h2>
      <ScreenSetup />
      <BackupRestore />
    </>
  );
}

export function TasteSetup() {
  const me = useMe();
  const { toast } = useUI();
  const [draft, setDraft] = useState<FlavorVector | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const vector = draft ?? me?.vector;
  if (!vector) return null;

  const liked = QUICK_AXES.filter((a) => vector[a] >= 7);
  const toggleLike = (a: FlavorAxis) => setDraft({ ...vector, [a]: vector[a] >= 7 ? 5 : 8 });
  const set = (a: FlavorAxis, v: number) => setDraft({ ...vector, [a]: v });
  const save = async () => { if (draft) { await tasteService.setManual(draft); setDraft(null); toast('취향을 저장했어요'); } };

  return (
    <>
      <div className="sechead">좋아하는 맛</div>
      {!isNeutralTaste(vector) && !liked.length && <p className="hint">세부 조정 적용 중</p>}
      <div className="controls">
        {QUICK_AXES.map((a) => (
          <button key={a} className="chip" aria-pressed={vector[a] >= 7} onClick={() => toggleLike(a)}>
            {FLAVOR_LABELS_KO[a]}
          </button>
        ))}
      </div>
      <div className="btnrow">
        <button className="btn primary" disabled={!draft} onClick={save}>저장</button>
        <button className="btn" onClick={async () => { await tasteService.recomputeMe(); setDraft(null); toast('기록으로 다시 계산했어요'); }}>기록으로 다시 계산</button>
        {draft && <button className="btn ghost" onClick={() => setDraft(null)}>되돌리기</button>}
      </div>

      <div className="more">
        <button onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced}>
          {advanced ? '세부 조정 접기' : '세부 조정 (14축)'}
        </button>
        {advanced && (
          <div className="inner">
            {FLAVOR_AXES.map((a) => (
              <div className="slider" key={a}>
                <label>{FLAVOR_LABELS_KO[a]} <b>{vector[a].toFixed(0)}</b></label>
                <input type="range" min={0} max={10} step={1} value={vector[a]} onChange={(e) => set(a, +e.target.value)} />
              </div>
            ))}
            <div className="btnrow"><button className="btn primary" disabled={!draft} onClick={save}>저장</button></div>
          </div>
        )}
      </div>
    </>
  );
}

export function PeopleManager() {
  const profiles = useTasteProfiles();
  const { toast } = useUI();
  const [name, setName] = useState('');
  const others = profiles.filter((p) => p.id !== 'me');

  return (
    <>
      <div className="sechead">함께 마시는 사람</div>
      <div className="people">
        {others.map((p) => (
          <div className="person" key={p.id}>
            <div className="ph">
              <b>{p.name}</b>
              <button className="btn sm ghost" onClick={async () => { await tasteProfileRepo.remove(p.id); toast('지웠어요'); }}>삭제</button>
            </div>
            <FlavorBars vector={p.vector} compact />
          </div>
        ))}
      </div>
      <div className="controls">
        <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} />
        <button className="btn primary" onClick={async () => {
          if (!name.trim()) return;
          const neutral = FLAVOR_AXES.reduce((v, a) => { v[a] = 5; return v; }, {} as FlavorVector);
          await tasteProfileRepo.create(name.trim(), neutral); setName(''); toast('추가했어요');
        }}>추가</button>
      </div>
    </>
  );
}

const THEMES: { v: Theme; label: string }[] = [{ v: 'light', label: '라이트' }, { v: 'dark', label: '다크' }];

function ScreenSetup() {
  const [theme, setTheme] = useState<Theme>(savedTheme);
  return (
    <>
      <div className="sechead">화면</div>
      <div className="controls tight">
        {THEMES.map((o) => (
          <button key={o.v} className="chip" aria-pressed={theme === o.v}
            onClick={() => { setTheme(o.v); applyTheme(o.v, true); }}>{o.label}</button>
        ))}
      </div>
    </>
  );
}

function BackupRestore() {
  const { toast } = useUI();
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    const json = await backupService.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `homebar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('백업 파일을 만들었어요');
  };
  const doImport = async (file: File) => {
    try {
      await backupService.importJson(await file.text(), 'replace');
      toast('백업을 불러왔어요');
    } catch (e) {
      toast('백업을 불러오지 못했어요: ' + (e as Error).message);
    }
  };

  return (
    <>
      <div className="sechead">백업 · 복원</div>
      <p className="hint">이 브라우저에만 저장됩니다.</p>
      <div className="btnrow">
        <button className="btn primary" onClick={doExport}>백업 파일 만들기</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>백업 파일로 복원하기</button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ''; }} />
      </div>
      <div className="sechead">버전</div>
      <p className="hint"><b>{BUILD_STAMP}</b> · 최신 화면이 아니면 새로고침해 주세요.</p>
    </>
  );
}
