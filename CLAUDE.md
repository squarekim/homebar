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

# Bottle visuals

- Treat `app/src/data/bottleVisual.ts` and `app/src/ui/components/BottleArt.tsx` as the same feature for bottles, and follow every rule above: 80×80 viewBox, useId-namespaced IDs, no photos or randomness, representation only — never judgment.
- Derive the bottle shape from `whiskyClass` origin and type, falling back to `bottleKind`. Derive the liquid color from the spirit kind, then pull it toward the cask (sherry/PX redder, virgin oak deeper).
- The public build replaces `whiskyClassSeed` with an empty record because owning a bottle is personal data, so every bottle rule must still produce a sane result with `whiskyClass` undefined.
- Bottles are drawn in lists and in the whisky detail sheet; a whisky recommended in Today's lead spot is served as a glass instead (`NeatPour`), because that spot invites you to drink it. Keep glass geometry in GlassArt.tsx only.
- Whiskies are drawn as oak casks instead (`app/src/data/caskVisual.ts` + `app/src/ui/components/CaskArt.tsx`, same rules); other spirits keep the bottle. The cask lies on its side with the head facing front-right; the body takes the first cask's wood colour and the head boards are split into one band per cask (up to four), smoke appears only when the spec says 피티드, and the head shows the label age or `CS` only from 56px up. Do not stamp flavour symbols until the reference DB has real flavour values.
