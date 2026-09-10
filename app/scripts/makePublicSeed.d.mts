/** makePublicSeed.mjs 의 타입 선언 — 스크립트는 Node 가 그대로 실행할 수 있게 .mjs 로 두고, 타입만 여기서 준다. */
export interface PublicSeedResult {
  /** 생성된 seed.public.ts 경로 */
  out: string;
  /** 제거한 보유 주류 수 */
  removedBottles: number;
  /** 제거한 개인 재고 플래그 수 */
  removedOwned: number;
  /** 제거한 레거시 컬렉션 매트릭스 행 수 */
  removedMatrix: number;
}

export function makePublicSeed(): PublicSeedResult;
