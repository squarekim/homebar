import { useMemo } from 'react';
import { useHeldIds, useSubMap, useLogs, useMe, useRemainingMap, neutralVector } from './useData';
import { type RecommendContext } from '../services/recommendationService';

export function useRecommendContext(): RecommendContext {
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const logs = useLogs();
  const me = useMe();
  const remainingById = useRemainingMap();
  return useMemo(() => ({
    taste: me?.vector ?? neutralVector(),
    heldIds, subMap, logs, remainingById,
  }), [me, heldIds, subMap, logs, remainingById]);
}
