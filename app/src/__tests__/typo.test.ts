import { it, expect } from 'vitest';
import { searchLiquor } from '../services/liquorSearchService';

it('잘못 들은 이름으로도 진을 찾는다', () => {
  expect(searchLiquor('턴키레이', { limit: 3 })[0]?.item.id).toBe('m_tanqueray');
});
