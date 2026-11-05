# Cocktail visuals

- Treat `app/src/data/drinkVisual.ts` and `app/src/ui/components/GlassArt.tsx` as one cocktail visual feature. Review both when changing visual rules or rendering.
- Keep GlassArt's public props limited to `cocktail: Cocktail` and optional `size: number`.
- Derive visuals deterministically from recipe data; never use photos, external image URLs, randomness, or time-dependent decoration. Illustrations bundled with the app (imported from `app/src/assets/glass/`, never fetched from a URL) are allowed.
- Glasses, ice and garnishes may be drawn from those bundled illustrations. Each glass kind has two layers made from one source image: the glass with its ice, and a liquid mask. The source images are generated with the liquid painted in pure magenta `#FF00FF`; keep the step that splits them into layers as a script in the repo so the assets can be rebuilt.
- The liquid colour always comes from `drinkColor`; never bake a drink colour into an illustration. GlassArt tints the liquid mask with it, so two cocktails in the same glass differ only by their data.
- Stack the layers in this order: ground shadow, liquid, in-drink slices (highball only), bubbles, foam and dust, picks and sprigs (so they read as standing inside the glass), glass and ice, rim-edge fruit, then the salt or sugar rim. Foam, bubbles, rims, dust and the shadow stay drawn in code.
- `scripts/glass_assets.py` writes the images to `app/src/assets/glass/` and their positions to `app/src/ui/components/glassAssets.ts`; regenerate both together and never edit the generated file by hand. The GPT originals live in the Drive folder named in the script header, not in the repo.
- Garnish placement follows the recipe text: peel, wedge and wheel sit on the rim edge; cherry, olive, onion, berry and candied ginger go on a pick; mint and celery stand up above the glass; only lemon, lime or orange slices in a highball go inside the drink; salt and sugar are a rim crust; nutmeg is surface dust.
- Keep recipe interpretation in drinkVisual.ts and rendering in GlassArt.tsx. Exclude optional ingredients from texture calculations. Render the bubbles and foam returned by visualEffectOf.
- Preserve all eight glass kinds (coupe, martini, highball, rocks, flute, hurricane, shot, mug) and thirteen garnish kinds (lemon, lime, orange, cherry, olive, mint, pineapple, berry, celery, onion, ginger, dust, rim).
- Use an 80×80 viewBox. Every glass kind must provide its glass and liquid images plus a box, surface ellipse, rim ellipse and liquid bottom (the anchors for foam, bubbles and garnish). Ice is part of the glass image. Keep the liquid, glass, ground shadow and ice readable at 44px on both the dark and light themes.
- Namespace every SVG clipPath, gradient, and filter ID with React useId() so multiple instances can coexist.
- Do not change ingredient ownership or cocktail availability logic as part of visual work.
- Today's pick card shuffle (`app/src/ui/components/TodayReel.tsx` + `app/src/services/pickService.ts`) draws a random winner among the cocktails you can make right now. That randomness chooses which drink is offered; it is outside the visual rules, and the glasses themselves are still drawn deterministically from recipe data.
- After changes, run `npm test` and `npm run build` from `app`.

# Bottle visuals

- Treat `app/src/data/bottleVisual.ts` and `app/src/ui/components/BottleArt.tsx` as the same feature for bottles, and follow every rule above: 80×80 viewBox, useId-namespaced IDs, no photos or randomness, representation only — never judgment.
- Derive the bottle shape from `whiskyClass` origin and type, falling back to `bottleKind`. Derive the liquid color from the spirit kind, then pull it toward the cask (sherry/PX redder, virgin oak deeper).
- The public build replaces `whiskyClassSeed` with an empty record because owning a bottle is personal data, so every bottle rule must still produce a sane result with `whiskyClass` undefined.
- Bottles are drawn in lists and in the whisky detail sheet; a whisky recommended in Today's lead spot is served as a glass instead (`NeatPour`), because that spot invites you to drink it. Keep glass geometry in GlassArt.tsx only.
- Whiskies are drawn as oak casks instead (`app/src/data/caskVisual.ts` + `app/src/ui/components/CaskArt.tsx`, same rules); other spirits keep the bottle. The cask lies on its side with the head facing front-right; the body takes the first cask's wood colour and the head boards are split into one band per cask (up to four), smoke appears only when the spec says 피티드, and the head shows the label age or `CS` only from 56px up. Do not stamp flavour symbols until the reference DB has real flavour values.
