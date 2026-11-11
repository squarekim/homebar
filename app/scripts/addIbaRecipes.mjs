/**
 * addIbaRecipes.mjs — 현행 IBA 목록(102종) 중 빠져 있던 8종을 넣는다 (정제 9단계).
 *
 * 근거는 각 레시피의 u(IBA 페이지, 2026-11-05 확인). 재료 마스터에 없는 재료는 새로 만들지 않고
 * 가장 가까운 기존 재료로 맞추며, 재료 줄에 원문 이름을 괄호로 남긴다(alignIbaRecipes.mjs 와 같은 원칙).
 * 같은 이름의 레시피가 있으면 이 표의 내용으로 덮어쓰고, 끝으로 재료별 사용 레시피 수(q)를 다시 센다.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/addIbaRecipes.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');
const L = (name, raw, optional = 0) => [name, raw, optional, 0];
const U = (slug) => `https://iba-world.com/iba-cocktail/${slug}/`;

export const RECIPES = [
  { n: '호스스 넥', b: '브랜디', iba: '현행IBA', m: 'Build', gl: 'highball', u: U('horses-neck'), g: '레몬 필 (긴 나선)',
    i: [L('코냑', '코냑 40ml'), L('진저에일', '진저에일 120ml'), L('앙고스투라 비터', '앙고스투라 비터 1dash (선택)', 1)] },
  { n: '네이키드 앤 페이머스', b: '데킬라', iba: '현행IBA', m: 'Shake', gl: 'coupe', u: U('naked-and-famous'),
    i: [L('메즈칼', '메즈칼 22.5ml'), L('그린 샤르트뢰즈', '그린 샤르트뢰즈 22.5ml (원문: 옐로 샤르트뢰즈)'),
      L('아페롤', '아페롤 22.5ml'), L('라임즙', '라임즙 22.5ml')] },
  { n: '피스코 펀치', b: '브랜디', iba: '현행IBA', m: 'Shake + Build', gl: 'wine', u: U('pisco-punch'),
    note: '원문은 정향 3개를 시럽과 함께 으깨 씁니다.',
    i: [L('피스코', '피스코 60ml'), L('파인애플 주스', '파인애플 주스 22.5ml'), L('설탕시럽', '설탕시럽 15ml'),
      L('레몬즙', '레몬즙 15ml'), L('드라이 화이트 와인', '드라이 화이트 와인 30ml')] },
  { n: '포른 스타 마티니', b: '보드카', iba: '현행IBA', m: 'Shake', gl: 'coupe', u: U('porn-star-martini'), g: '패션프루트 반쪽',
    note: '샴페인 한 잔을 곁들여 냅니다.',
    i: [L('플레인 보드카', '플레인 보드카 50ml (원문: 바닐라 보드카)'), L('기타 리큐르', '기타 리큐르 20ml (원문: 패션프루트 리큐르)'),
      L('패션프루트 퓨레', '패션프루트 퓨레 50ml'), L('정제 설탕', '정제 설탕 2바스푼 (원문: 바닐라 설탕)'),
      L('샴페인', '샴페인 50ml (곁들임, 선택)', 1)] },
  { n: '셰리 코블러', b: '멀티', iba: '현행IBA', m: 'Shake', gl: 'rocks', u: U('sherry-cobbler'), g: '베리·오렌지 슬라이스·레몬 슬라이스',
    note: '원문은 아몬티야도 45ml와 팔로 코르타도 45ml를 섞어 씁니다.',
    i: [L('셰리(아몬티야도)', '셰리(아몬티야도) 90ml (원문: 아몬티야도 45ml + 팔로 코르타도 45ml)'), L('정제 설탕', '정제 설탕 1tsp')] },
  { n: '서퍼링 바스터드', b: '멀티', iba: '현행IBA', m: 'Shake + Build', gl: 'highball', u: U('suffering-bastard'), g: '민트 스프링·오렌지 슬라이스 (선택)',
    i: [L('코냑', '코냑 30ml'), L('런던 드라이 진', '런던 드라이 진 30ml'), L('라임즙', '라임즙 15ml'),
      L('앙고스투라 비터', '앙고스투라 비터 2dash'), L('진저비어', '진저비어 Top')] },
  { n: '스리 도츠 앤 어 대시', b: '럼', iba: '현행IBA', m: 'Blend', gl: 'hurricane', u: U('three-dots-and-a-dash'), g: '체리 3알+파인애플',
    i: [L('마르티니크 럼 아그리콜', '마르티니크 럼 아그리콜 45ml'), L('골드 럼', '골드 럼 15ml (원문: 블렌디드 숙성 럼)'),
      L('팔레르넘', '팔레르넘 7.5ml'), L('기타 리큐르', '기타 리큐르 7.5ml (원문: 올스파이스 드램)'), L('라임즙', '라임즙 15ml'),
      L('오렌지 주스', '오렌지 주스 15ml'), L('허니 시럽', '허니 시럽 15ml'), L('앙고스투라 비터', '앙고스투라 비터 2dash')] },
  { n: '티퍼레리', b: '위스키', iba: '현행IBA', m: 'Stir', gl: 'martini', u: U('tipperary'), g: '오렌지 슬라이스',
    i: [L('아이리시 위스키', '아이리시 위스키 50ml'), L('스위트 베르무트', '스위트 베르무트 25ml'),
      L('그린 샤르트뢰즈', '그린 샤르트뢰즈 15ml'), L('앙고스투라 비터', '앙고스투라 비터 2dash')] },
];

/** 셰리 코블러는 셰리가 술의 전부라 대체 재료로 맞추지 않고 셰리를 재료로 넣는다(개인 재고 플래그 own 은 0) */
const NEW_INGS = [{ n: '셰리(아몬티야도)', c: '베르무트·와인', q: 0, own: 0 }];

export function addRecipes({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));
  const added = [];
  for (const ing of NEW_INGS) if (!data.ings.some((x) => x.n === ing.n)) { data.ings.push({ ...ing }); added.push(ing.n); }
  for (const r of RECIPES) {
    const at = data.recipes.findIndex((x) => x.n === r.n);
    const copy = JSON.parse(JSON.stringify(r));
    if (at >= 0) { if (JSON.stringify(data.recipes[at]) === JSON.stringify(copy)) continue; data.recipes[at] = copy; }
    else data.recipes.push(copy);
    added.push(r.n);
  }
  const count = new Map();
  for (const r of data.recipes) for (const n of new Set(r.i.map(([x]) => x))) count.set(n, (count.get(n) ?? 0) + 1);
  for (const ing of data.ings) ing.q = count.get(ing.n) ?? 0;
  const unknown = [...count.keys()].filter((n) => !data.ings.some((i) => i.n === n));
  if (unknown.length) throw new Error(`재료 마스터에 없는 재료: ${unknown.join(', ')}`);
  if (!dry && added.length) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { added };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('추가:', addRecipes({ dry: process.argv.includes('--dry') }).added.join(', ') || '없음');
}
