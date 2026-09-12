# Cocktail visuals

- Treat `app/src/data/drinkVisual.ts` and `app/src/ui/components/GlassArt.tsx` as one cocktail visual feature. Review both when changing visual rules or rendering.
- Keep GlassArt's public props limited to `cocktail: Cocktail` and optional `size: number`.
- Derive visuals deterministically from recipe data; never use photos, external image URLs, randomness, or time-dependent decoration.
- Keep recipe interpretation in drinkVisual.ts and SVG rendering in GlassArt.tsx. Exclude optional ingredients from texture calculations. Render the bubbles and foam returned by visualEffectOf.
- Preserve all eight glass kinds (coupe, martini, highball, rocks, flute, hurricane, shot, mug) and thirteen garnish kinds (lemon, lime, orange, cherry, olive, mint, pineapple, berry, celery, onion, ginger, dust, rim).
- Use an 80×80 viewBox. Every glass definition must provide an outline, inner clip, surface ellipse, rim, and iceArea. Keep liquid gradients, glass highlights, ground shadows, and dimensional ice readable at small sizes.
- Namespace every SVG clipPath, gradient, and filter ID with React useId() so multiple instances can coexist.
- Do not change ingredient ownership or cocktail availability logic as part of visual work.
- After changes, run `npm test` and `npm run build` from `app`.
