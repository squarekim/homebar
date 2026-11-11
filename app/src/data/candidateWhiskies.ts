/**
 * candidateWhiskies.ts — 미보유 후보 위스키(구매 시뮬레이터용).
 * 결손 축을 채울 수 있는 대표적 위스키를 분류와 함께 큐레이션했다(사실 기준).
 * 시뮬레이터는 이 후보를 보유 컬렉션에 넣었을 때의 겹침/신규 축을 계산한다.
 */
import { type WhiskyClass } from '../models/types';

export interface CandidateWhisky {
  id: string;
  name: string;
  cls: WhiskyClass;
  note: string;
}

export const CANDIDATE_WHISKIES: CandidateWhisky[] = [
  { id: 'lagavulin16', name: '라가불린 16', note: '아일라 싱글몰트. 피트 향이 강하고 셰리 캐스크를 함께 써요.', cls: { origin: '스카치', type: '싱글몰트', region: '아일라', cask: ['셰리'], character: ['피티드', '스모키'] } },
  { id: 'ardbeg10', name: '아드벡 10', note: '아일라 싱글몰트. 버번 캐스크에서 숙성한 피티드예요.', cls: { origin: '스카치', type: '싱글몰트', region: '아일라', cask: ['버번'], character: ['피티드', '스모키'] } },
  { id: 'springbank10', name: '스프링뱅크 10', note: '캠벨타운 싱글몰트. 셰리와 버번 캐스크, 약한 피트예요.', cls: { origin: '스카치', type: '싱글몰트', region: '캠벨타운', cask: ['셰리', '버번'], character: ['피티드', '해양성'] } },
  { id: 'auchentoshan12', name: '오켄토션 12', note: '로우랜드 싱글몰트. 세 번 증류하고 피트를 쓰지 않아요.', cls: { origin: '스카치', type: '싱글몰트', region: '로우랜드', cask: ['셰리', '버번'], character: ['논피트'] } },
  { id: 'glendronach12', name: '글렌드로낙 12', note: '하이랜드 싱글몰트. PX와 올로로소 셰리 캐스크예요.', cls: { origin: '스카치', type: '싱글몰트', region: '하이랜드', cask: ['PX', '올로로소'], character: ['논피트'] } },
  { id: 'bunnahabhain12', name: '부나하벤 12', note: '아일라 싱글몰트. 피트를 쓰지 않고 셰리 캐스크를 써요.', cls: { origin: '스카치', type: '싱글몰트', region: '아일라', cask: ['셰리'], character: ['논피트'] } },
  { id: 'redbreast12', name: '레드브레스트 12', note: '아이리시 싱글 팟 스틸. 셰리와 버번 캐스크예요.', cls: { origin: '아이리시', type: '싱글 팟 스틸', cask: ['셰리', '버번'], character: ['논피트'] } },
  { id: 'yamazaki12', name: '야마자키 12', note: '재패니즈 싱글몰트. 미즈나라 캐스크도 써요.', cls: { origin: '재패니즈', type: '싱글몰트', cask: ['셰리', '버번', '미즈나라'], character: ['논피트'] } },
];
