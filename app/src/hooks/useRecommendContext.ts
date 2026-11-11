import { useMemo } from 'react';
import { useHeldIds, useSubMap, useLogs, useMe, useRemainingMap, useWhiskies, neutralVector } from './useData';
import { type RecommendContext } from '../services/recommendationService';
import { isNeutralTaste } from '../services/flavorService';

export function useRecommendContext(): RecommendContext {
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const logs = useLogs();
  const me = useMe();
  const remainingById = useRemainingMap();
  const whiskies = useWhiskies();
  return useMemo(() => ({
    taste: me?.vector ?? neutralVector(),
    hasTaste: !!me && !isNeutralTaste(me.vector),
    heldIds, subMap, logs, remainingById, whiskies,
  }), [me, heldIds, subMap, logs, remainingById, whiskies]);
}
