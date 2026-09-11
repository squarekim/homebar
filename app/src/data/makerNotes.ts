/**
 * makerNotes.ts — 개인 보유 병(seed bottles) → 공식 노트 연결.
 *
 * 노트 본문은 makerNotesMaster.ts 가 제품 id 로 한 벌만 갖고 있고, 여기서는 "내 병 = 어떤 제품"인지만 잇는다.
 * 같은 글을 두 번 두지 않기 위해서다. 어떤 병을 갖고 있는지는 개인 정보라
 * 이 파일은 공개 빌드에서 makerNotes.public.ts(빈 레코드)로 치환된다.
 */
import { type MakerNote } from '../models/types';
import { MASTER_MAKER_NOTES } from './makerNotesMaster';

/** 보유 병 id → 기준 DB 제품 id */
export const SEED_BOTTLE_MASTER: Record<string, string> = {
  macallan: 'm_macallan12dc',
  talisker10: 'm_talisker10',
  clynelish14: 'm_clynelish14',
  glenfiddich: 'm_glenfiddich15',
  glenlivet: 'm_glenlivet15',
  glenmorangie: 'm_glenmorangie12',
  glenallachie: 'm_glenallachie10cs',
  ballantine_sm: 'm_ballantine_glenburgie12',
  ballantine_f: 'm_ballantine_f',
  ballantine12: 'm_ballantine12',
  jw_green: 'm_jw_green',
  jw_black: 'm_jw_black',
  jw_blue: 'm_jw_blue',
  dewars12: 'm_dewars12',
  wildturkey8: 'm_wildturkey8',
  buffalo: 'm_buffalotrace',
  weller: 'm_weller_special',
  makers: 'm_makers',
  jack: 'm_jackdaniels',
  kakubin: 'm_kakubin',
  kiwon_tiger: 'm_kiwon_tiger',
  kiwon_eagle: 'm_kiwon_eagle',
  olesmoky: 'm_olesmoky_pb',
  drambuie: 'm_drambuie',
  benedictine: 'm_benedictine',
  disaronno: 'm_disaronno',
  midori: 'm_midori',
  baileys: 'm_baileys',
  campari: 'm_campari',
  stgermain: 'm_stgermain',
  luxardo: 'm_luxardo_maraschino',
  kahlua: 'm_kahlua',
  bombay: 'm_bombay_sapphire',
  bacardi: 'm_bacardi_blanca',
  malibu: 'm_malibu',
  cuervo: 'm_cuervo_gold',
  gordons: 'm_gordons',
  hwayo41: 'm_hwayo41',
  jw_ruby: 'm_jw_ruby',
  buja: 'm_buja',
  kirkland: 'm_kirkland_french',
  triplesec: 'm_dekuyper_triplesec',
  peachtree: 'm_peachtree',
  bluecuracao: 'm_dekuyper_blue',
  cacao: 'm_dekuyper_cacao',
  menthe: 'm_dekuyper_menthe',
  cassis: 'm_dekuyper_cassis',
  greentea: 'm_hermes_greentea',
  hwayo25: 'm_hwayo25',
  yeontae: 'm_yeontae',
  wolgyegwan: 'm_wolgyegwan_junmai',
  gouden: 'm_gouden_carolus_imperial',
  neungi: 'm_neungi',
  songi: 'm_songi',
  yumeginga: 'm_yumeginga',
  kagua_blanc: 'm_kagua_blanc',
  kagua_rouge: 'm_kagua_rouge',
};

export const MAKER_NOTES: Record<string, MakerNote> = Object.fromEntries(
  Object.entries(SEED_BOTTLE_MASTER)
    .map(([bottleId, masterId]) => [bottleId, MASTER_MAKER_NOTES[masterId]])
    .filter((e): e is [string, MakerNote] => !!e[1]),
);
