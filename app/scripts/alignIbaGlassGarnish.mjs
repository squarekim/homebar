/**
 * alignIbaGlassGarnish.mjs — IBA 원문의 잔·가니시와 IBA 등재 표시를 맞춘다 (정제 8단계).
 *
 * 2026-11-05 IBA 공식 목록(https://iba-world.com/cocktails/all-cocktails/, 102종) 대조 결과.
 *   gl  잔 규칙(drinkVisual.glassOf)이 원문과 다른 21종에 원문의 잔을 적는다. 키르·스프리츠는 와인잔(얼음 없음/있음).
 *   g   원문에는 가니시가 있는데 비어 있던 22종을 채운다(원문을 우리 표기로 옮김).
 *   iba 공식 목록에서 빠진 5종은 '구IBA'로 바꾸고, 404가 된 링크를 지운다.
 *       화이트 레이디는 위키백과 대신 IBA 페이지를 출처로 단다.
 * 이미 값이 있는 가니시는 덮어쓰지 않는다.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/alignIbaGlassGarnish.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

export const GLASS = {
  rocks: ['위스키 사워', '페니실린', '뉴욕 사워', '카지노', '브램블', '마이 타이', '정글 버드', '그랜드 마르가리타',
    '토미스 마르가리타', '사제락', '베.엔.토', '아메리카노', '페르난디토', '라보 데 갈로', '모스코 뮬'],
  highball: ['라모스 피즈', '섹스 온 더 비치', '러시안 스프링 펀치', '샤르트뢰즈 스위즐'],
  hurricane: ['싱가포르 슬링'],
  coupe: ['올드 쿠반'],
  wine: ['키르'],
  wineice: ['스프리츠'],
};

export const GARNISH = {
  '올드 패션드': '오렌지 슬라이스+체리',        // orange slice or zest, and a cocktail cherry
  '위스키 사워': '오렌지 슬라이스+마라스키노 체리', // half orange slice and maraschino cherry
  '러스티 네일': '레몬 제스트',
  '맨해튼': '칵테일 체리',
  '불바디에': '오렌지 제스트',
  '존 콜린스': '레몬 슬라이스+마라스키노 체리',
  '톰 콜린스': '레몬 슬라이스+마라스키노 체리',
  '진 피즈': '레몬 슬라이스',
  '네그로니': '오렌지 슬라이스',               // half orange slice
  '카지노': '레몬 제스트+마라스키노 체리',
  '브램블': '레몬 슬라이스·블랙베리 (선택)',
  '섹스 온 더 비치': '오렌지 슬라이스',
  '코스모폴리탄': '레몬 트위스트',
  '모스코 뮬': '라임 슬라이스',
  '씨 브리즈': '오렌지 제스트+체리',
  '쿠바 리브레': '라임 웨지',
  '마르가리타': '소금 림 (선택)',               // half salt rim (optional)
  '아메리카노': '오렌지 슬라이스+레몬 제스트',
  '프렌치 마르티니': '레몬 필',                 // squeeze oil from lemon peel
  '라보 데 갈로': '오렌지 트위스트',
  '에스프레소 마티니': '커피콩 3알',            // 그림 종류가 없어 글로만 남는다
  '스파이시 피프티': '홍고추',                  // 그림 종류가 없어 글로만 남는다
};

const RETIRED = ['뱀파이로', '하비 월뱅어', '로즈', '골든 드림', 'B-52'];
const WHITE_LADY = 'https://iba-world.com/iba-cocktail/white-lady/';

export function alignGlassGarnish({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));
  const get = (n) => { const r = data.recipes.find((x) => x.n === n); if (!r) throw new Error(`레시피 없음: ${n}`); return r; };
  const stat = { glass: 0, garnish: 0, retired: 0 };

  for (const [gl, names] of Object.entries(GLASS)) for (const n of names) { const r = get(n); if (r.gl !== gl) { r.gl = gl; stat.glass++; } }
  for (const [n, g] of Object.entries(GARNISH)) { const r = get(n); if (!r.g) { r.g = g; stat.garnish++; } }
  for (const n of RETIRED) {
    const r = get(n);
    if (r.iba !== '구IBA' || r.u) { r.iba = '구IBA'; r.u = ''; r.s = r.s || 'IBA 구 목록(현재 공식 목록 미등재)'; stat.retired++; }
  }
  const wl = get('화이트 레이디');
  if (wl.u !== WHITE_LADY) wl.u = WHITE_LADY;

  if (!dry) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return stat;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = alignGlassGarnish({ dry: process.argv.includes('--dry') });
  console.log(`잔 ${r.glass}종 · 가니시 ${r.garnish}종 · 구IBA 전환 ${r.retired}종`);
}
