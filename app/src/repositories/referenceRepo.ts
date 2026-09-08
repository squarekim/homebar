/**
 * referenceRepo — 읽기 전용 참조 데이터(시드 파생) 접근점.
 * UI/서비스는 원본 seed 를 직접 import 하지 않고 이 레포를 통한다.
 */
import {
  ingredients, ingredientById, ingredientIdOf, ingredientFlavor,
  cocktails, cocktailById, bottles, whiskies, spirits,
  mixers, mixerPairings, purchaseSeeds, categories,
} from '../data/adapters';
import { Ingredient, Cocktail, Bottle } from '../models/types';

export const referenceRepo = {
  ingredients: (): Ingredient[] => ingredients,
  ingredientById: (id: string): Ingredient | undefined => ingredientById.get(id),
  ingredientIdOf,
  ingredientFlavor,
  categories: (): string[] => categories,

  cocktails: (): Cocktail[] => cocktails,
  cocktailById: (id: string): Cocktail | undefined => cocktailById.get(id),

  bottles: (): Bottle[] => bottles,
  whiskies: (): Bottle[] => whiskies,
  spirits: (): Bottle[] => spirits,

  mixers: () => mixers,
  mixerPairings: () => mixerPairings,
  purchaseSeeds: () => purchaseSeeds,
};
