import { useMemo, useRef, useState } from 'react';
import { useUI } from '../UIContext';
import { BUILD_STAMP } from '../../config';
import { useMe, useTasteProfiles, useLogs } from '../../hooks/useData';
import { tasteService } from '../../services/tasteService';
import { tasteProfileRepo } from '../../repositories/tasteProfileRepo';
import { drinkLogRepo } from '../../repositories/drinkLogRepo';
import { backupService } from '../../services/backupService';
import { FlavorBars, LogCard } from '../components/common';
import {
  FLAVOR_AXES, FLAVOR_LABELS_KO, type FlavorVector, type FlavorAxis, SERVING_LABELS_KO,
} from '../../models/types';

export function ProfilePage() {
  return (
    <>
      <TasteEditor />
      <PeopleManager />
      <Stats />
      <LogList />
      <BackupRestore />
    </>
  );
}

function TasteEditor() {
  const me = useMe();
  const { toast } = useUI();
  const [draft, setDraft] = useState<FlavorVector | null>(null);
  const vector = draft ?? me?.vector;

  if (!vector) return null;
  const set = (a: FlavorAxis, v: number) => setDraft({ ...vector, [a]: v });

  return (
    <>
      <div className="sechead">내 취향 프로파일 {me?.source === 'mixed' ? '(기록 반영됨)' : ''}</div>
      {FLAVOR_AXES.map((a) => (
        <div className="slider" key={a}>
          <label>{FLAVOR_LABELS_KO[a]} <b>{vector[a].toFixed(0)}</b></label>
          <input type="range" min={0} max={10} step={1} value={vector[a]} onChange={(e) => set(a, +e.target.value)} />
        </div>
      ))}
      <div className="btnrow">
        <button className="btn primary" disabled={!draft} onClick={async () => { if (draft) { await tasteService.setManual(draft); setDraft(null); toast('취향 저장'); } }}>저장</button>
        <button className="btn" onClick={async () => { await tasteService.recomputeMe(); setDraft(null); toast('음용 기록으로 재계산'); }}>기록으로 재계산</button>
        {draft && <button className="btn ghost" onClick={() => setDraft(null)}>되돌리기</button>}
      </div>
    </>
  );
}

function PeopleManager() {
  const profiles = useTasteProfiles();
  const { toast } = useUI();
  const [name, setName] = useState('');
  const others = profiles.filter((p) => p.id !== 'me');

  return (
    <>
      <div className="sechead">그룹 인원 (그룹 추천용)</div>
      <div className="people">
        {others.map((p) => (
          <div className="person" key={p.id}>
            <div className="ph"><b>{p.name}</b>
              <button className="btn ghost" onClick={async () => { await tasteProfileRepo.remove(p.id); toast('삭제됨'); }}>삭제</button>
            </div>
            <FlavorBars vector={p.vector} compact />
          </div>
        ))}
        {others.length === 0 && <div className="hint">추가된 인원이 없습니다. 이름을 입력해 중립(5) 프로필을 만든 뒤, 편집이 필요하면 값을 조정하세요.</div>}
      </div>
      <div className="controls">
        <input type="text" placeholder="인원 이름" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} />
        <button className="btn primary" onClick={async () => {
          if (!name.trim()) return;
          const neutral = FLAVOR_AXES.reduce((v, a) => { v[a] = 5; return v; }, {} as FlavorVector);
          await tasteProfileRepo.create(name.trim(), neutral); setName(''); toast('인원 추가');
        }}>추가</button>
      </div>
    </>
  );
}

function Stats() {
  const logs = useLogs();
  const me = useMe();
  const stats = useMemo(() => {
    const n = logs.length;
    const avg = n ? logs.reduce((s, l) => s + l.rating, 0) / n : 0;
    const retry = n ? logs.filter((l) => l.retryIntent).length / n : 0;
    const styleCount: Record<string, number> = {};
    for (const l of logs) styleCount[l.servingStyle] = (styleCount[l.servingStyle] ?? 0) + 1;
    return { n, avg, retry, styleCount };
  }, [logs]);
  const top = useMemo(() => me ? [...FLAVOR_AXES].sort((a, b) => me.vector[b] - me.vector[a]).slice(0, 4) : [], [me]);

  return (
    <>
      <div className="sechead">통계</div>
      <div className="stat">
        <div className="box"><b>{stats.n}</b><small>총 기록</small></div>
        <div className="box"><b>{stats.avg.toFixed(1)}</b><small>평균 평점</small></div>
        <div className="box"><b>{Math.round(stats.retry * 100)}%</b><small>재음용 의향</small></div>
        <div className="box"><b>{top.map((a) => FLAVOR_LABELS_KO[a]).join('·') || '-'}</b><small>선호 상위</small></div>
      </div>
      {stats.n > 0 && (
        <div className="meta" style={{ marginTop: 10 }}>
          {Object.entries(stats.styleCount).map(([s, c]) => <span className="mi" key={s}>{SERVING_LABELS_KO[s as keyof typeof SERVING_LABELS_KO] ?? s} {c}</span>)}
        </div>
      )}
    </>
  );
}

function LogList() {
  const logs = useLogs();
  const { toast } = useUI();
  return (
    <>
      <div className="sechead">음용 기록 ({logs.length})</div>
      {logs.length === 0 && <div className="hint">기록이 없습니다.</div>}
      <div className="list">
        {logs.map((l) => (
          <LogCard key={l.id} log={l}>
            {l.memo && <div className="hint" style={{ margin: '6px 0 0' }}>{l.memo}</div>}
            <div className="btnrow"><button className="btn ghost" onClick={async () => { await drinkLogRepo.remove(l.id); toast('삭제됨'); }}>삭제</button></div>
          </LogCard>
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
    toast('백업 파일 내보내기');
  };

  const doImport = async (file: File) => {
    try {
      const text = await file.text();
      await backupService.importJson(text, 'replace');
      toast('복원 완료');
    } catch (e) {
      toast('복원 실패: ' + (e as Error).message);
    }
  };

  return (
    <>
      <div className="sechead">백업 / 복원</div>
      <div className="hint">재고·기록·취향·대체재를 JSON 파일로 내보내고 복원합니다. 서버 없이 브라우저에 저장됩니다.</div>
      <div className="btnrow">
        <button className="btn primary" onClick={doExport}>JSON 내보내기</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>JSON 복원</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ''; }} />
      </div>

      <div className="sechead">버전</div>
      <div className="hint">
        지금 보고 있는 화면: <b>{BUILD_STAMP}</b>
        <br />최신이 아니라면 브라우저를 완전히 닫았다 열거나, 새로고침을 한 번 더 해주세요.
      </div>
    </>
  );
}
