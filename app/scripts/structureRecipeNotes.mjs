/**
 * structureRecipeNotes.mjs — 레시피 설명란 구조화 (정제 3단계).
 *
 * 설명란(note) 하나에 성격이 다른 네 가지 글이 섞여 있었다.
 *   ① 출처 표기     "Ole Smoky 공식", "마실랭", "커뮤니티 표준 레시피(홈텐딩·디시 교차 확인)"
 *   ② 변형 관계     "올드 패션드에 설탕 대신 베네딕틴을 쓴 변형."
 *   ③ IBA 등재 연혁 "2020년 IBA 목록에서 제외."   ← 화면의 IBA 배지가 이미 같은 말을 한다
 *   ④ 코멘터리      맛·기법·유래
 *
 * 각각 제자리로 보낸다: ① → s, ② → v, ③ → 삭제, ④ → note 에 한 문장.
 * 남길 한 문장은 "만들 때 달라지는 것" 우선으로 고른다(스펙·기법 > 맛 > 유래).
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/structureRecipeNotes.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from './cleanRecipeNotes.mjs';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

/** ① 출처 표기 — 사람 이름·매체명·"공식"·"커뮤니티 표준" 등 레시피의 근거를 밝히는 줄 */
const SOURCE = [
  /^(루리웹|마실랭|나무위키|디시|커뮤니티)\b/,
  /^(A Couple Cooks|Food\.com|Bucket List|Bona Furtuna|Difford|Wikipedia|Insanely Good|Homebody|Cocktail Contessa|Ole Smoky|Liquor\.com|Punch|Serious Eats)/i,
  /^IBA [a-z][a-z-]+$/,
  /커뮤니티 표준|교차 확인|활용 리스트|사용자 제공/,
  /(공식|고안|시그니처 칵테일)( 사이트 제공 레시피)?\.?$/,
  /배합비 준용/,
  /^클래식( 레시피)?\.?$/,
  /^\d{4}년(대)? .{0,14}(클래식|금주법 시대 클래식)\s*$/,
  /기준\([\d:~.\s]+\)/,            // "어쿠스틱 드링크 잭콕 기준(1:3) · 산토리 하이볼 표준 1:3~1:3.5"
];

/** ③ IBA 등재/이탈 연혁 — 화면의 IBA 배지(현행IBA·구IBA·비IBA)와 중복이라 설명란에서 뺀다 */
const IBA_HISTORY = [
  /IBA.{0,12}(등재|제외|이탈)/,
  /코드화(까지|에서)/,
  /목록에서 제외/,
  /The Unforgettables.{0,8}(등재|제외)/,
];

/**
 * 데이터를 만들며 남긴 편집 판단 메모 — 마시는 사람에게는 가리키는 것이 없다.
 * ("IBA 분류상 … 위스키 계열로 함께 둡니다", "IBA 사이트 스펙을 정본으로 삼습니다")
 */
const EDITORIAL = [
  /분류상.{0,30}둡니다/,
  /정본으로 삼/,
  /스펙을 우선했습니다/,
  /별개 재료로 둠/,
  /별개 등재 유지/,
];

/** ② 변형 관계를 가리키는 말 */
const VARIANT_WORD = /변형|치환|파생|버전|후손|대신|바꾼|바꾸어|바꿔|같되|같은 배합|와 달리|과 달리/;

/** "X 배합비 준용 (Y 대입)" — 원형과 바뀐 재료를 그대로 알려주는 문장 */
const DERIVED = /^(?:IBA\s+)?(.+?)\s*배합비\s*준용\s*(?:[(（]\s*(.+?)\s*대입\s*[)）])?/;

/** 원문이 영문·약칭으로 적은 레시피 이름 */
const PARENT_ALIAS = { 'John Collins': '존 콜린스', '콜린스': '존 콜린스' };

/** 남길 한 문장의 우선순위 — 숫자가 작을수록 먼저 */
const PRIORITY = [
  /\d+\s*(ml|cl|oz|tsp|dash|방울|바스푼)|비율|등량|동량|플로트|저어|셰이크|머들|갈아|녹이|선행 공정|대체되지 않|대체 가능|특정합니다|지정|스펙|선택이 아니라/, // 만드는 법이 달라진다
  /맛|풍미|향|노트|어울|산미|단맛|드라이|스파이스|캐릭터|느낌|더블|구조/,  // 어떤 맛인지
  /\d{4}년|고안|유래|상징|국민|채록|발명|이름/,                            // 어디서 왔는지
];

const trim = (s) => s.replace(/\s+/g, ' ').trim();
const test = (list, s) => list.some((re) => re.test(s));
/** 띄어쓰기를 무시하고 이름을 찾는다 ("블루마르가리타" 안에서도 "블루 마르가리타"를 본다) */
const squash = (s) => s.replace(/\s+/g, '');

/** 앞 문장을 지워서 홀로 남으면 뜻이 통하지 않는 표현을 보정한다 */
const REWRITE = [
  [/^삭제 직전 스펙은/, 'IBA 삭제 직전 스펙은'],
  [/^즉\s+/, ''],
];

/** 변형 설명에 붙은 내부 메모·출처 꼬리를 떼어낸다 */
function cleanVariant(s) {
  return trim(s)
    .replace(/\s*—\s*(사용자 제공|커뮤니티 표준).*$/, '')
    .replace(/^즉\s+/, '');
}

/** 스프레드시트 행 번호(id 74) 같은 내부 참조 — 사용자에게는 가리키는 것이 없다 */
function stripInternalIds(s) {
  return trim(s.replace(/\s*[(（]\s*id\s*\d+\s*[)）]/gi, ''));
}
const INTERNAL_REF = /※?.{0,20}\bid\s*\d+\b.{0,20}(별도 존재|참조)/i;

/** 문장을 네 갈래로 나눈다. 레시피 이름 목록은 변형의 원형을 찾는 데 쓴다. */
export function classifyNote(note, selfName, recipeNames) {
  const sentences = note
    .split(/\n+/)
    .flatMap((line) => splitSentences(line))
    .map(trim)
    .filter(Boolean);

  const source = [];
  const commentary = [];
  const dropped = [];
  const variants = [];

  const flat = squash(selfName);
  for (const raw of sentences) {
    const s = stripInternalIds(raw);
    if (!s || INTERNAL_REF.test(raw)) { dropped.push(raw); continue; }
    const hay = squash(s);

    // "X 배합비 준용 (Y 대입)" 은 출처가 아니라 변형 선언이다
    const d = DERIVED.exec(s);
    if (d) {
      const nameRaw = trim(d[1] ?? '');
      const parentName = PARENT_ALIAS[nameRaw] ?? nameRaw;
      const found = recipeNames.find((n) => squash(n) === squash(parentName));
      if (found && squash(found) !== flat) {
        variants.push({
          parent: found,
          text: d[2] ? `${found}의 배합비에 ${trim(d[2])}를 대입한 버전.` : `${found}와 같은 배합비.`,
        });
        continue;
      }
    }
    const parent = recipeNames.find((n) => squash(n) !== flat && hay.includes(squash(n)));
    if (parent && VARIANT_WORD.test(s)) {
      variants.push({ parent, text: cleanVariant(s) });
      continue;
    }
    if (test(EDITORIAL, s)) { dropped.push(s); continue; }
    if (test(SOURCE, s)) { source.push(s); continue; }
    // 등재 연혁이라도 제조 스펙을 함께 담고 있으면 버리지 않는다
    if (test(IBA_HISTORY, s) && !PRIORITY[0].test(s)) { dropped.push(s); continue; }
    commentary.push(s);
  }

  // 코멘터리는 한 문장만. 만들 때 달라지는 것 → 맛 → 유래 순으로 고른다.
  let keep = '';
  if (commentary.length) {
    const scored = commentary.map((s) => {
      const rank = PRIORITY.findIndex((re) => re.test(s));
      return { s, rank: rank === -1 ? PRIORITY.length : rank };
    });
    scored.sort((a, b) => a.rank - b.rank);
    keep = scored[0].s;
    for (const [re, to] of REWRITE) keep = keep.replace(re, to);
    for (const { s } of scored.slice(1)) dropped.push(s);
  }

  // 변형 문장이 여럿이면 "무엇을 어떻게 바꿨는지"까지 말하는 쪽을 고른다
  const variant = variants.slice().sort((a, b) => variantScore(b) - variantScore(a))[0] ?? null;
  for (const v of variants) if (v !== variant) dropped.push(v.text);

  const sources = source.map(cleanSource).filter(Boolean);
  return { note: keep, source: sources[0] ?? '', variant, dropped };
}

/** 구체적인 변경("설탕 대신 베네딕틴")을 말하는 문장이 이긴다 */
function variantScore(v) {
  return (/대신|바꾼|바꿔|바꾸어|더한|뺀|얹은|추가한|늘인|플로트/.test(v.text) ? 100 : 0) + v.text.length;
}

/** 출처 줄에서 표기명만 남긴다 ("Ole Smoky 공식" → "Ole Smoky 공식", "IBA espresso-martini" → "IBA") */
function cleanSource(s) {
  const t = trim(s).replace(/[.·]\s*$/, '');
  if (/^IBA [a-z][a-z-]+$/.test(t)) return 'IBA';
  if (/사용자 제공 리큐르 활용 리스트/.test(t)) return '';    // 내부 메모 — 출처가 아니다
  return t.replace(/\s*—\s*사용자 제공.*$/, '').replace(/\s*—\s*커뮤니티 표준\s*$/, ' · 커뮤니티 표준');
}

export function structureSeed({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const json = text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, '');
  const data = JSON.parse(json);

  // 긴 이름을 먼저 대조해야 "블루 마르가리타"가 "마르가리타"로 잘못 잡히지 않는다
  const names = data.recipes.map((r) => r.n).sort((a, b) => b.length - a.length);

  const stat = { variant: 0, source: 0, oneLine: 0, emptied: 0, dropped: 0 };
  const samples = [];

  for (const r of data.recipes) {
    if (!r.note || !r.note.trim()) continue;
    const before = r.note;
    const { note, source, variant, dropped } = classifyNote(before, r.n, names);

    if (note) { r.note = note; stat.oneLine++; } else { delete r.note; stat.emptied++; }
    if (source) { r.s = source; stat.source++; }
    if (variant) { r.v = [variant.parent, variant.text]; stat.variant++; }
    stat.dropped += dropped.length;

    if (samples.length < 10 && (variant || dropped.length)) samples.push([r.n, before, r.note ?? '', r.s, r.v]);
  }

  if (!dry) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { ...stat, recipes: data.recipes.length, samples };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dry = process.argv.includes('--dry');
  const r = structureSeed({ dry });
  console.log(
    `레시피 ${r.recipes}건 · 변형 관계 ${r.variant} · 출처 분리 ${r.source} · 코멘터리 1문장 ${r.oneLine} · 설명 비움 ${r.emptied} · 삭제 문장 ${r.dropped}`,
  );
  if (dry) {
    for (const [n, b, a, s, v] of r.samples) {
      console.log(`\n### ${n}\n- ${b.replace(/\n/g, '\n- ')}\n+ ${a || '(비움)'}`);
      if (s) console.log(`@ 출처: ${s}`);
      if (v) console.log(`@ 변형: ${v[0]} → ${v[1]}`);
    }
  }
}
