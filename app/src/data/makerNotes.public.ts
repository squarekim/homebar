/**
 * 공개 배포용 스텁 — 제조사 공식 노트는 개인 보유 병 id 로 키가 잡혀 있어(= 소유 목록이 드러남)
 * 공개 빌드에서는 싣지 않는다. 공개 빌드에는 seed 병 자체가 없어 화면에 노출되던 자리도 없다.
 * (기준 DB 제품에 노트를 다시 붙이는 작업은 별도 과제)
 */
import { MakerNote } from '../models/types';

export const MAKER_NOTES: Record<string, MakerNote> = {};
