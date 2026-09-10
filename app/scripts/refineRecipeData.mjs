/**
 * refineRecipeData.mjs — 레시피 데이터 정제 2단계.
 *
 *  1) 가니시 분리   note 끝에 문장으로 붙어 있던 "레몬 제스트 가니시." 를 recipes[].g 필드로 옮긴다.
 *                   사용자도 잔을 낼 때 필요한 정보라 화면에 따로 표시해야 한다.
 *  2) 개정 이력 제거 "V33은 …", "[V48] …", "V35 전수 대조 결과 일치" 처럼
 *                   이 데이터를 만들던 엑셀의 버전 관리 메모를 지운다. 사용자에게 의미 없는 내부 기록이다.
 *                   레시피·병·믹서 note 전부를 훑는다. IBA 등재 연혁 같은 실제 칵테일 역사는 남긴다.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/refineRecipeData.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from './cleanRecipeNotes.mjs';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

/** 엑셀 개정 이력 · 데이터 편집 메모 — 문장째 제거 (사용자에게는 의미 없는 내부 기록) */
const REVISION = [
  /색상\s*미확인/,            // "색상 미확인 — 그래스호퍼가 근사 판정인 원인"
  /통일\s*규칙/,              // "1:3 통일 규칙" — 데이터 정리 정책
  /근사\s*판정|판정인\s*원인/, // 판정 결과를 글로 적어둔 것 (앱이 실시간 계산한다)
  /행\d+/,                    // "원본 IBA 공식(행106)과 …" — 스프레드시트 행 참조
  /별개\s*등재\s*유지/,
  /대조할\s*'?공식'?\s*이?\s*존재하지/,
  /\[V\d+(\.\d+)?\]/,          // [V48] 상비품에 … 확보 확인 → 해금
  /\bV\d{2}(\.\d+)?\b/,        // V33은 … / V35 전수 대조
  /전수\s*대조/,
  /(이|레시피)\s*시트|시트\s*기준|시트에서/,
  /재료\s*ID/i,
];

/** 문장 끝에 붙은 가니시 표기 (예: "레몬 제스트 가니시.", "체리 가니시(선택).") */
const GARNISH_TAIL = /^(.*?)\s*가니(?:시|쉬)\s*(\(선택\))?\s*[.!]?$/;

/**
 * 개정 이력 문장을 지우면 뒤 문장이 앞을 잃고 붕 뜨는 경우 — 해당 문장만 지정해 정리한다.
 * (예: "V33은 레몬즙을 30ml로 적었습니다. 5ml 과다라 …" 에서 뒤 문장만 남으면 무슨 말인지 알 수 없다)
 */
const ORPHAN = {
  '위스키 사워': [['5ml 과다라 실제보다 시게 나옵니다.', '']],
  '씨 브리즈': [['IBA 스펙 복원으로 그 구조 오류도 해소됐습니다.', '']],
  '레몬 드롭 마티니': [['기주는 줄고 부재료는 늘어납니다.', '']],
  '카미카제': [['2020년 제외.', '2020년 IBA 목록에서 제외.']],
};

/** 자동 규칙으로 못 잡는 두 건 — 문장이 서술형이라 손으로 지정한다 */
const GARNISH_OVERRIDE = {
  '깁슨': '칵테일 어니언',
  '팔로마': '라임 웨지 · 소금 리밍(선택)',
};

function tidy(text) {
  return text.replace(/\s{2,}/g, ' ').replace(/^\s*[—·]\s*/, '').replace(/\s*[—·]\s*$/, '').trim();
}

/** note 를 문장 단위로 훑어 가니시를 뽑고 개정 이력을 지운다 */
function refineNote(note, { pullGarnish }) {
  const keptLines = [];
  let garnish = null;
  let droppedRevision = 0;
  for (const line of note.split('\n')) {
    const segments = line.split(' — ').map((seg) => {
      const kept = [];
      for (const s of splitSentences(seg)) {
        if (REVISION.some((re) => re.test(s))) { droppedRevision++; continue; }
        const m = pullGarnish && !garnish ? s.trim().match(GARNISH_TAIL) : null;
        if (m && m[1].trim()) {
          garnish = tidy(m[1] + (m[2] ? ` ${m[2]}` : ''));
          continue;
        }
        kept.push(s.trim());
      }
      return tidy(kept.join(' '));
    }).filter(Boolean);
    const merged = segments
      .reduce((acc, seg) => (acc ? `${acc}${/[.!?]$/.test(acc) ? ' ' : ' — '}${seg}` : seg), '')
      .replace(/^\s*—\s*/, '').replace(/\s*—\s*$/, '').trim();
    if (merged) keptLines.push(merged);
  }
  return { note: keptLines.join('\n').trim(), garnish, droppedRevision };
}

export function refineSeed({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const start = text.indexOf('{', text.indexOf('export const SEED'));
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s+as\s+RawData\s*;?\s*)$/)?.[1] ?? ';\n';
  const data = JSON.parse(text.slice(start).replace(/\s+as\s+RawData\s*;?\s*$/, '').replace(/;\s*$/, '').trim());

  let garnishCount = 0, revisionCount = 0, noteChanged = 0;
  const samples = [];

  for (const r of data.recipes) {
    const before = r.note ?? '';
    const { note, garnish, droppedRevision } = refineNote(before, { pullGarnish: true });
    let fixed = note;
    for (const [from, to] of ORPHAN[r.n] ?? []) fixed = tidy(fixed.split(from).join(to));
    const g = GARNISH_OVERRIDE[r.n] ?? garnish;
    if (g) { r.g = g; garnishCount++; }
    revisionCount += droppedRevision;
    if (fixed !== before) { r.note = fixed; noteChanged++; if (samples.length < 8) samples.push([r.n, before, fixed, g]); }
  }
  // 병·믹서 note 의 개정 이력도 같은 규칙으로 제거
  for (const row of [...data.bottles, ...data.mixers]) {
    if (!row.note) continue;
    const { note, droppedRevision } = refineNote(row.note, { pullGarnish: false });
    revisionCount += droppedRevision;
    row.note = note;
  }

  if (!dry) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { garnishCount, revisionCount, noteChanged, samples, recipes: data.recipes.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dry = process.argv.includes('--dry');
  const r = refineSeed({ dry });
  console.log(`레시피 ${r.recipes}건 · 가니시 분리 ${r.garnishCount} · 개정 이력 문장 제거 ${r.revisionCount} · note 수정 ${r.noteChanged}`);
  if (dry) for (const [n, b, a, g] of r.samples) console.log(`\n### ${n}\n- ${b.replace(/\n/g, '\n- ')}\n+ ${a.replace(/\n/g, '\n+ ') || '(비움)'}\n@ 가니시: ${g ?? '-'}`);
}
