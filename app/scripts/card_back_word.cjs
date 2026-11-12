/**
 * card_back_word.cjs — 오늘의 잔 카드 뒷면의 필기체 "Homebar" 글자를 그림(투명 PNG)으로 만든다.
 *
 * 왜: 갤럭시 + 삼성 인터넷처럼 휴대폰에 설정한 글꼴이 웹 글꼴보다 앞서는 브라우저에서는 뒷면 글자가
 * 필기체(Great Vibes)가 아니라 휴대폰 글꼴로 보였다. 글자를 그림으로 넣으면 기기 글꼴 설정과 상관없이 같다.
 * 그림은 앱에 넣은 Great Vibes(src/assets/fonts/great-vibes, SIL OFL 1.1)로 Chromium 이 그린 것을 4배로 찍는다.
 * 색과 그림자는 styles.css 의 .stage .back span 과 같다. 기울기(-8도)는 그림에 넣지 않고 CSS 가 준다.
 *
 * 사용: node scripts/card_back_word.cjs   (Playwright 가 설치된 환경. 결과: src/assets/cardback/homebar-word.png)
 */
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const FONT = resolve(__dirname, '../src/assets/fonts/great-vibes/files/great-vibes-latin-400-normal.woff2');
const OUT = resolve(__dirname, '../src/assets/cardback/homebar-word.png');
const SCALE = 4; // 화면 24px 글자를 96px 로 그려 고해상도 화면에서도 선명하게

(async () => {
  const font = readFileSync(FONT).toString('base64');
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><style>
    @font-face{font-family:GV;src:url(data:font/woff2;base64,${font}) format('woff2')}
    html,body{margin:0;background:transparent}
    span{display:inline-block;padding:${3 * SCALE}px ${4 * SCALE}px;font-family:GV;font-size:${24 * SCALE}px;line-height:1;color:#F2E7D0;
      text-shadow:0 0 ${6 * SCALE}px #5E1A26,0 0 ${3 * SCALE}px #5E1A26,0 ${SCALE}px 0 rgba(0,0,0,.4)}
  </style><span>Homebar</span>`);
  await p.evaluate(() => document.fonts.ready);
  const ok = await p.evaluate(() => document.fonts.check('96px GV'));
  if (!ok) throw new Error('Great Vibes 를 불러오지 못했어요');
  await p.locator('span').screenshot({ path: OUT, omitBackground: true });
  const box = await p.locator('span').boundingBox();
  console.log(`저장: ${OUT} (${Math.round(box.width)}×${Math.round(box.height)}px, 화면에서는 ${Math.round(box.width / SCALE)}×${Math.round(box.height / SCALE)}px)`);
  await b.close();
})();
