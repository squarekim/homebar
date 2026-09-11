/**
 * structureBottleNotes.mjs — 보유 병 메모 구조화.
 *
 * 병(note) 한 칸에 성격이 다른 다섯 가지가 섞여 있었다.
 *   ① 마일스톤   "첫 피트 싱글몰트", "보유 최초 블렌디드 몰트"   ← 남이 보면 뜬금없는 개인사
 *   ② 입수 경위   "★신규", "선물로 1병 추가 (1→2병)"
 *   ③ 구매 기록   "16만원", "코스트코 2.4만"                      ← 제품 정보가 아니라 구매 이력
 *   ④ 제품 제원   "1L", "375ml"                                   ← 용량은 필드로 있어야 한다
 *   ⑤ 제품 사실   "농축과즙 — 개봉 후 냉장", "소비기한 2026-10-11"
 *
 * ①②는 뱃지(t), ③은 구매 기록(buy), ④는 용량(ml)으로 보내고 ⑤만 note 에 남긴다.
 * "N종 해금" 류는 앱이 재고에서 실시간으로 계산하는 값이라(services/purchaseService.ts)
 * 하드코딩된 옛 숫자를 남겨둘 이유가 없어 삭제한다.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/structureBottleNotes.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

const trim = (s) => s.replace(/\s+/g, ' ').trim();

/** 메모를 조각으로 나눈다. 마침표는 뒤에 공백이 올 때만 — "2.4만"이 쪼개지지 않게. */
function fragments(note) {
  return note.split(/(?:\.\s+|,\s*|\n+)/).map(trim).filter(Boolean);
}

/** 앱이 실시간으로 계산하는 값의 옛 스냅샷 — 남겨두면 거짓이 된다 */
const STALE = /\d+\s*종\s*해금|단독\s*해금/;

/** 데이터를 만들며 남긴 분류 판단 메모 — 마시는 사람에게는 가리키는 것이 없다 */
const EDITORIAL = /분류\(|인지 기준\)|분류함|분류 기준/;

/** 조각 → 뱃지. 순서대로 본다. */
const BADGES = [
  { kind: 'gift', re: /선물/, label: () => '선물' },
  { kind: 'new', re: /^★?\s*신규/, label: () => '신규' },
  { kind: 'first', re: /^(?:보유\s*)?(?:최초|첫)\s+(.+)$/, label: (m) => `첫 ${trim(m[1])}` },
  { kind: 'use', re: /^(.+?\s*전용)$/, label: (m) => trim(m[1]) },
  { kind: 'status', re: /^(단종|한정판)$/, label: (m) => m[1] },
];

/** 용량 표기 → ml */
const VOLUME = /^(\d+(?:\.\d+)?)\s*(ml|mL|ML|L|리터)$/;
/** 구매 기록 — 값을 치른 흔적(가격·구매처) */
const PRICE = /\d+(?:\.\d+)?\s*만원?$|\d+\s*원$/;

export function classifyBottleNote(note) {
  const badges = [];
  const keep = [];
  const dropped = [];
  let ml;
  let buy;

  for (const f of fragments(note)) {
    if (STALE.test(f) || EDITORIAL.test(f)) { dropped.push(f); continue; }

    const v = VOLUME.exec(f);
    if (v) { ml = Math.round(parseFloat(v[1]) * (/^(L|리터)$/.test(v[2]) ? 1000 : 1)); continue; }

    if (PRICE.test(f)) { buy = buy ? `${buy} · ${f}` : f; continue; }

    // 한 조각이 여러 뱃지를 담기도 한다 ("★신규 (생일 선물)")
    let matchedAny = false;
    for (const b of BADGES) {
      const m = b.re.exec(f);
      if (!m) continue;
      const label = b.label(m);
      if (!badges.some((x) => x[1] === label)) badges.push([b.kind, label]);
      matchedAny = true;
      if (b.kind !== 'gift' && b.kind !== 'new') break;  // 나머지는 조각 전체를 소비한다
    }
    if (matchedAny) continue;

    keep.push(f);
  }

  return { badges, note: keep.join('. '), ml, buy, dropped };
}

export function structureBottleSeed({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));

  const stat = { badges: 0, tagged: 0, volume: 0, buy: 0, kept: 0, emptied: 0, dropped: 0 };
  const samples = [];

  for (const b of data.bottles) {
    if (!b.note || !b.note.trim()) continue;
    const before = b.note;
    const { badges, note, ml, buy, dropped } = classifyBottleNote(before);

    if (badges.length) { b.t = badges; stat.badges += badges.length; stat.tagged++; }
    if (ml) { b.ml = ml; stat.volume++; }
    if (buy) { b.buy = buy; stat.buy++; }
    if (note) { b.note = note; stat.kept++; } else { delete b.note; stat.emptied++; }
    stat.dropped += dropped.length;

    samples.push([b.ko, before, b.note ?? '', badges, ml, buy]);
  }

  if (!dry) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { ...stat, bottles: data.bottles.length, samples };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dry = process.argv.includes('--dry');
  const r = structureBottleSeed({ dry });
  console.log(
    `병 ${r.bottles}종 · 뱃지 ${r.badges}개(${r.tagged}병) · 용량 ${r.volume} · 구매 기록 ${r.buy} · 메모 유지 ${r.kept} · 메모 비움 ${r.emptied} · 삭제 조각 ${r.dropped}`,
  );
  if (dry) {
    for (const [ko, before, after, badges, ml, buy] of r.samples) {
      console.log(`\n### ${ko}\n- ${before}\n+ ${after || '(비움)'}`);
      if (badges.length) console.log(`@ 뱃지: ${badges.map(([k, l]) => `${l}(${k})`).join(', ')}`);
      if (ml) console.log(`@ 용량: ${ml}ml`);
      if (buy) console.log(`@ 구매: ${buy}`);
    }
  }
}
