/**
 * publicSeedPlugin — 공개 프로필 빌드에서 src/data/seed.ts 를 seed.public.ts 로 치환한다.
 * (개인 보유 주류·재고가 번들에 들어가지 않게 하는 유일한 지점)
 */
import { makePublicSeed } from './makePublicSeed.mjs';

export function publicSeedPlugin() {
  return {
    name: 'homebar-public-seed',
    enforce: 'pre',
    buildStart() {
      const r = makePublicSeed();
      this.info?.(`[public] 개인 데이터 제외 — 보유 주류 ${r.removedBottles}종 · 개인 재고 ${r.removedOwned}건 · 매트릭스 ${r.removedMatrix}행`);
    },
    async resolveId(source, importer, options) {
      if (!importer) return null;
      if (!/(^|[./])(seed|makerNotes|whiskyClassSeed)(\.ts)?$/.test(source)) return null;
      const r = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!r) return null;
      const m = r.id.match(/[\\/]src[\\/]data[\\/](seed|makerNotes|whiskyClassSeed)\.ts$/);
      return m ? r.id.replace(/\.ts$/, '.public.ts') : null;
    },
  };
}
