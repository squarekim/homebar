# 인수인계 — claude/spirits-platform-web-expansion-gtm96h

`main`에 아직 합치지 않은 작업 브랜치. 개선을 더 한 뒤 PR로 합친다(사용자 결정, 11/19).

## 이 브랜치에서 한 것 (main 대비)

| 커밋 | 내용 |
|---|---|
| `c835b47` | 메인 밖 탭·술 추가 창을 처음 열 때 받기(첫 JS 349→320kB gzip), 하단 탭 글자 12px·터치 48px, 로고 터치 44px |
| `ef2724c` `7e09b6a` | 조각 그림 방식의 꼬치·휠 위치 보정 (통그림이 없는 조합에만 쓰임) |
| `2630f08` | CLAUDE.md 그림 규칙: 잔+가니시 통그림 방식 |
| `9c38dad` | 통그림 적용 — 가니시 레시피 61개 → 36장(레몬·라임·오렌지 변형 포함 74벌) |
| `e56f045` | `.pyc` 제거, `__pycache__` 무시 |

## 통그림 구조

- 키: `comboKey()` (`app/src/data/drinkVisual.ts`) = `<잔>_<조각>+<조각>` (이름순)
- 그림: `app/src/assets/glass/combo/<키>-glass.webp`, `<키>-liquid.webp`
- 자리: `app/src/ui/components/comboAssets.ts` (자동 생성, 직접 고치지 말 것)
- `GlassArt`는 키에 맞는 통그림이 있으면 그것으로 잔·술을 그리고, 없으면 조각 그림 배치로 그린다.
- 다시 만들기: Drive `홈바_잔_가니시_gpt_생성원본_20261105` 폴더의 `glass_*.png`, `gpt_combo_*.png`를 한 폴더에 받은 뒤
  `glass_wine_ice.png` → `glass_wineice.png` 로 이름을 바꾸고
  `python3 app/scripts/combo_assets.py <폴더>` (Pillow·NumPy 필요, 약 4분)

## 남은 일 / 개선 후보

1. 올드 패션드 화면 확인 — 점검 스크린샷에서 가니시가 비어 보였다(검색 첫 결과를 찍어 다른 레시피였을 수 있음). 키 연결 검사에서는 통그림을 찾는다.
2. 통그림 아쉬운 점: 락 잔 휠이 커서 잔 위를 가림(입구의 약 57%), 셰리 코블러는 가니시가 붐빔, 뉴욕 사워 꼬치가 오른쪽 벽 가까이까지 내려감.
3. 첫 로딩: 남은 큰 덩어리는 React·Dexie·seed·주류 목록. 데이터를 나눠 받으려면 읽는 쪽을 비동기로 바꿔야 함.
4. 데이터: 위스키 공식 노트 보류 26종, 전통주 칵테일 레시피(T5) seed 반영, 감홍로 명인 여부 등 미확인 항목.
5. 다른 세션이 main에 넣은 문구(맛 한 줄 221개·영어 이름·가이드 문체) 교정 점검.

## 제미나이 비교 결과 (참고)

- 1차: 검은 배경·잔 재작성·1024px → 사용 불가
- 3판(`gemini 3판` 폴더): 참고로 첨부한 GPT 그림을 흰 배경에 거의 그대로 복사(차이 0.2~1.4%) → 쓸 이유 없음
- 아스트라 업로드분은 GPT 원본 재업로드(해시 동일)라 정리함.

## 로컬 실행 (Windows PowerShell)

```powershell
git fetch origin
git checkout claude/spirits-platform-web-expansion-gtm96h
git pull
cd app
npm ci
npm run dev
```

PowerShell 5에서는 `&&` 대신 한 줄씩 입력한다. 변경 후 `npm test`, `npm run build` (CLAUDE.md).
