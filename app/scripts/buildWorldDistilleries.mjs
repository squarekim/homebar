/**
 * buildWorldDistilleries.mjs — 세계 증류소 조사 결과(JSON) → src/data/worldDistilleries.ts.
 *
 * 입력 scripts/data/worldDistilleries.json 은 2026-10-28 GPT·제미나이 조사 병합본이다(드라이브 '01 증류소 조사 / 증류소 최종_1~6').
 *   좌표가 없던 곳은 Wikidata 에서 소재 마을 좌표를 찾아 coord: '마을' 로 표시했다.
 *   isle 은 Natural Earth 1:10m 그레이트브리튼 해안선 밖 2km 넘게 떨어진 하이랜드 증류소다.
 *   appId 는 기존 싱글몰트 40곳(distilleries.ts) 중 같은 증류소의 id 다.
 * 생성 파일은 손으로 고치지 않는다. 값을 고칠 때는 JSON 을 고치고 다시 돌린다.
 * 사용: node scripts/buildWorldDistilleries.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const IN = resolve(here, 'data/worldDistilleries.json');
const OUT = resolve(here, '../src/data/worldDistilleries.ts');

const STATUS = ['운영', '운영 (근거 약함)', '증류 중단', '준공 (생산 시작 미확인)', '법정관리 중', '청산 중'];
const TOUR = ['운영', '중단', '없음'];

export function buildWorldDistilleries(rows) {
  const ids = new Set();
  for (const r of rows) {
    if (ids.has(r.id)) throw new Error(`id 중복: ${r.id}`);
    ids.add(r.id);
    if (!STATUS.includes(r.status)) throw new Error(`${r.id}: 모르는 운영 상태 ${r.status}`);
    if (r.tour && !TOUR.includes(r.tour)) throw new Error(`${r.id}: 모르는 투어 값 ${r.tour}`);
    if ((r.lat == null) !== (r.lng == null)) throw new Error(`${r.id}: 위도·경도 한쪽만 있음`);
    for (const k of ['lat', 'lng', 'founded']) if (r[k] != null && typeof r[k] !== 'number') throw new Error(`${r.id}: ${k} 가 숫자가 아님`);
  }
  const body = rows.map((r) => `  ${JSON.stringify(r)},`).join('\n');
  return `/**
 * worldDistilleries.ts — 세계 증류소 ${rows.length}곳. scripts/buildWorldDistilleries.mjs 가 만든 파일이라 손으로 고치지 않는다.
 * 출처·병합 기준은 생성 스크립트 머리말에 있다.
 */
import { type WorldDistillery } from '../models/types';

export const WORLD_DISTILLERIES: WorldDistillery[] = [
${body}
];
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rows = JSON.parse(readFileSync(IN, 'utf8'));
  writeFileSync(OUT, buildWorldDistilleries(rows));
  console.log(`worldDistilleries.ts — ${rows.length}곳`);
}
