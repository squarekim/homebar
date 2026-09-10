/**
 * whiskyClassSeed.ts — 개인 보유 위스키(seed bottles)의 분류 레코드.
 * 공개 배포 빌드에서는 whiskyClassSeed.public.ts(빈 레코드)로 치환된다 — 어떤 병을 갖고 있는지 자체가 개인 정보이므로.
 * 분류 체계(용어·필터·매칭 함수)는 whiskyClass.ts 에 남아 공용으로 쓰인다.
 */
import { type WhiskyClass } from '../models/types';

export const WHISKY_CLASS: Record<string, WhiskyClass> = {
  // ── 스카치 싱글몰트 ──
  macallan:     { origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: ['셰리', '버번'], character: ['논피트'] },
  glenallachie: { origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: ['PX', '올로로소', '와인', '버진오크'], character: ['캐스크 스트렝스', '논피트'] },
  glenmorangie: { origin: '스카치', type: '싱글몰트', region: '하이랜드', cask: ['버번'], character: ['논피트'] },
  glenfiddich:  { origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: ['셰리', '버번', '버진오크'], character: ['논피트', '솔레라'] },
  glenlivet:    { origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: ['프렌치오크'], character: ['논피트'] },
  ballantine_sm:{ origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: [], character: ['논피트'] },
  talisker10:   { origin: '스카치', type: '싱글몰트', region: '아일랜드(스카이)', cask: [], character: ['피티드', '해양성'] },
  clynelish14:  { origin: '스카치', type: '싱글몰트', region: '하이랜드(해안)', cask: ['버번'], character: ['논피트', '왁시'] },
  kiwon_tiger:  { origin: '코리안', type: '싱글몰트', cask: ['셰리', '와인'], character: ['논피트'] },
  kiwon_eagle:  { origin: '코리안', type: '싱글몰트', cask: ['버번', '버진오크'], character: ['논피트'] },

  // ── 스카치 블렌디드 / 블렌디드 몰트 ──
  jw_green:     { origin: '스카치', type: '블렌디드 몰트', cask: [], character: ['피티드', '스모키'] },
  jw_black:     { origin: '스카치', type: '블렌디드', cask: [], character: ['스모키'] },
  jw_ruby:      { origin: '스카치', type: '블렌디드', cask: [], character: ['스모키'] },
  jw_blue:      { origin: '스카치', type: '블렌디드', cask: [], character: ['스모키'] },
  ballantine12: { origin: '스카치', type: '블렌디드', cask: [], character: [] },
  ballantine_f: { origin: '스카치', type: '블렌디드', cask: [], character: [] },
  dewars12:     { origin: '스카치', type: '블렌디드', cask: [], character: ['더블 에이징'] },
  kakubin:      { origin: '재패니즈', type: '블렌디드', cask: [], character: [] },

  // ── 아메리칸 ──
  wildturkey8:  { origin: '버번', type: '스트레이트 버번', region: '켄터키', cask: ['뉴 차드 오크'], character: ['하이프루프'] },
  buffalo:      { origin: '버번', type: '스트레이트 버번', region: '켄터키', cask: ['뉴 차드 오크'], character: [] },
  weller:       { origin: '버번', type: '휘티드 버번', region: '켄터키', cask: ['뉴 차드 오크'], character: ['휘티드'] },
  makers:       { origin: '버번', type: '휘티드 버번', region: '켄터키', cask: ['뉴 차드 오크'], character: ['휘티드'] },
  jack:         { origin: '테네시', type: '테네시 위스키', cask: ['뉴 차드 오크'], character: ['차콜 멜로잉'] },
  // 올레 스모키 피넛버터: 리큐르로 재분류(제조사 인지 기준) → 위스키 분류에서 제외
};
