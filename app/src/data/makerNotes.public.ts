/**
 * 공개 배포용 스텁 — 어떤 병을 보유했는지는 개인 정보라 "내 병 → 제품" 연결을 싣지 않는다.
 * 공개 빌드에는 seed 병 자체가 없어 이 표가 쓰일 자리도 없다.
 * 노트 본문(제품 정보)은 makerNotesMaster.ts 에 있고 공개 빌드에도 그대로 실린다 —
 * 술을 추가할 때 기준 DB 제품의 공식 노트를 보여주는 것은 누구에게나 필요한 기능이기 때문이다.
 */
import { type MakerNote } from '../models/types';

export const SEED_BOTTLE_MASTER: Record<string, string> = {};
export const MAKER_NOTES: Record<string, MakerNote> = {};
