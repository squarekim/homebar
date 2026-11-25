import { it, expect } from 'vitest';
import { scaledAmount } from '../services/scaleAmount';

it('잔 수와 단위로 용량을 바꾼다', () => {
  expect(scaledAmount(45, 1, 'ml')).toBe('45ml');
  expect(scaledAmount(45, 2, 'ml')).toBe('90ml');
  expect(scaledAmount(45, 1, 'oz')).toBe('1.5 oz');
  expect(scaledAmount(20, 1, 'oz')).toBe('0.75 oz');
  expect(scaledAmount(null, 4, 'oz')).toBeNull();
});
