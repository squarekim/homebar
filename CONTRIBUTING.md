# 같이 개발하기

홈바 플랫폼에 코드로 참여하는 사람을 위한 문서. **먼저 [README](README.md) 로 앱이 뭘 하는지 훑고 오는 걸 권장한다.**

---

## 1. 10분 세팅

```bash
git clone https://github.com/squarekim/homebar.git
cd homebar/app
npm install
npm run dev      # http://localhost:5173
npm test         # 32건, 전부 통과해야 정상
```

Node 20 이상. 그 외 준비물 없다 — **서버도 DB도 API 키도 없다.** 전부 브라우저 안에서 돈다.
개발 서버는 `beta` 프로필이라 오너의 홈바 데이터가 들어간 상태로 뜬다. 정규 105 / 보유재료 69가 뜨면 정상이다.

## 2. 5분 만에 아키텍처 파악하기

데이터는 한 방향으로만 흐른다. **위 계층이 아래를 부르지 않는다.**

```
data(시드·파생)  →  models(타입)  →  db(Dexie)  →  repositories  →  services  →  ui
   읽기 전용                          사용자 상태만    DB 격리         순수 로직     화면
```

| 뭘 고치려면 | 어디 |
|---|---|
| 제조 가능 판정 규칙 | `src/services/availabilityService.ts` |
| 추천 점수·이유 | `src/services/recommendationService.ts`, `groupService.ts`, `purchaseService.ts` |
| 술 이름 검색(별칭·퍼지) | `src/services/liquorSearchService.ts` + `src/data/textMatch.ts` |
| 기준 제품 DB(275종) | `src/data/liquorMaster.ts`, 별칭은 `liquorAliases.ts` |
| 위스키 분류 체계·용어 | `src/data/whiskyClass.ts`, `glossary.ts` |
| 저장 스키마 | `src/db/schema.ts` (Dexie 버전 마이그레이션) |
| 화면 | `src/ui/pages/*`, 공용 컴포넌트는 `src/ui/components/*` |

핵심 흐름 하나만 외우면 된다:

```
레시피 재료 → ingredientId(표준 재료 128종) → 재고(IndexedDB) → 대체재 map
                                                     ↓
                            READY(정규) / SUBSTITUTE(근사) / MISSING / UNAVAILABLE
```

제품(봄베이 사파이어)은 **표준 재료(런던 드라이 진)로 환원된 뒤** 레시피와 매칭된다. 제품명으로 직접 매칭하지 않는다.

## 3. 건드리면 안 되는 것 (리뷰에서 반려되는 항목)

1. **`src/data/seed.ts` 를 손으로 고치지 않는다.** 원본 V54 데이터의 무손실 추출본이다.
   변환이 필요하면 `app/scripts/` 에 스크립트를 쓰고 일괄 적용한다(예: `cleanRecipeNotes.mjs`).
2. **기존 이름·ID를 바꾸지 않는다.** 재료 ID는 이름 해시 기반이라 이름을 바꾸면 사용자 재고가 끊긴다.
3. **판정에 텍스트를 쓰지 않는다.** `note.includes('보유')` 같은 코드는 금지. 구조화된 `ingredientId × 재고`로만 판단한다.
4. **UI에서 DB를 직접 부르지 않는다.** 반드시 `repositories/` 를 거친다(나중에 Supabase 등으로 갈아끼우기 위한 격리).
5. **의존성 추가는 최후수단.** 검색·퍼지매칭·초성까지 전부 무의존성으로 구현돼 있다. 라이브러리를 넣으려면 PR에 이유를 적을 것.
6. **없는 사실을 쓰지 않는다.** 도수·용량·테이스팅 노트는 공식 출처가 있을 때만 넣고, 없으면 비워 둔다(`abv: 0` = 미상).

## 4. 작업 흐름

```bash
git switch -c feat/무엇을-하는지        # fix/, chore/, docs/ 도 사용
# 작업
npm test && npm run build              # 둘 다 통과해야 push
git push -u origin feat/무엇을-하는지
```

- PR을 열고 리뷰를 받는다. `main` 직접 푸시는 하지 않는다.
- 커밋 메시지는 **무엇을 왜 바꿨는지** 한 줄 + 필요하면 본문. 이슈가 있으면 번호를 적는다.
- 판정 로직·데이터에 손댔다면 **PR 본문에 판정 수치 변화(정규/근사/불가)를 적는다.** 의도한 변화인지 리뷰어가 그것부터 본다.

## 5. 자주 하는 작업 레시피

**기준 제품 추가** (`src/data/liquorMaster.ts`)
```ts
['m_아이디', '한글명', 'English Name', '브랜드', '세부분류', 도수, 용량ml, '원산지', '표준재료명', '별칭 공백구분', wc?]
```
- 도수·용량을 모르면 `0` (미상 처리된다).
- `표준재료명`은 재료 마스터 128종의 **정확한 이름**이어야 한다. 오타는 테스트가 잡는다.
- 위스키는 마지막 인자로 분류를 넣는다. `sm('아일라', ['셰리'], ['피티드'])` 같은 헬퍼가 파일 상단에 있다.

**검색이 안 되는 제품** → `src/data/liquorAliases.ts` 에 별칭만 추가한다.

**새 판정/추천 로직** → `services/` 에 순수 함수로 짜고 `src/__tests__/` 에 테스트를 붙인다. UI에 로직을 넣지 않는다.

**저장 항목 추가** → `models/types.ts` 에 타입 → `db/schema.ts` 에 버전 하나 올려 `.upgrade()` 로 기존 행 보정 → `repositories/` 에 접근 함수. 기존 스토어는 지우지 않는다.

## 6. 테스트 기준

```bash
npm test          # vitest 32건
npm run build     # tsc --noEmit + vite build
```

데이터를 만졌다면 **판정이 의도치 않게 변하지 않았는지**가 가장 중요하다.
원본 재고 기준 기대값은 **정규 105 · 근사 16 · 일부부족 57 · 불가 24** 이고 `core.test.ts` 가 이를 지킨다.
숫자가 바뀌는 변경이라면 왜 바뀌는 게 맞는지 PR에 근거를 적을 것.

## 7. 배포

정식 공개 전이라 **자동 배포는 꺼져 있다.** 푸시해도 아무 데도 게시되지 않는다.
올릴 때만 Actions 탭 → `Deploy to GitHub Pages` → **Run workflow** 로 직접 실행한다.

| 프로필 | 내용 |
|---|---|
| `beta` (기본) | 오너의 홈바 데이터 포함. 내부 확인용 |
| `public` | 개인 데이터를 뺀 정식 공개판. 기본 홈바 세트 41종으로 시작 |

`public` 빌드는 `scripts/makePublicSeed.mjs` 가 개인 데이터를 제거한 시드를 만들어 vite 플러그인이 원본 대신 물린다.
**개인 데이터가 번들에 들어가는지는 빌드 산출물을 직접 grep 해서 확인한다.**

## 8. 지금 열려 있는 과제

난이도 순. 골라서 이슈로 등록하고 시작하면 된다.

| | 과제 | 왜 필요한가 |
|---|---|---|
| 쉬움 | 기준 제품 DB 확장 (현재 275종) | 검색해서 안 나오는 술이 아직 많다. 데이터만 추가하면 된다 |
| 쉬움 | 추가한 술 **편집** 기능 | 지금은 추가/삭제만 된다 |
| 중간 | 제조사 공식 노트를 **마스터 제품에 재매핑** | 지금은 오너 보유 병 id에 묶여 있어 public 빌드에서 전부 빠진다 |
| 중간 | 재고 잔량 UI 개선 | 잔량 입력이 슬라이더뿐이라 실사용이 번거롭다 |
| 중간 | 그룹 추천 UX | 사람 등록·선택 흐름이 아직 투박하다 |
| 어려움 | 계정·동기화(Supabase 등) | 기기 간 동기화. `repositories/` 뒤만 갈아끼우면 되도록 이미 격리해 뒀다 |
| 어려움 | Capacitor 로 Android APK | 브라우저 전용 의존성은 이미 저장소 계층 뒤에 있다 |

## 9. 데이터·프라이버시 주의

- `beta` 빌드와 저장소의 `seed.ts` 에는 **오너의 실제 보유 주류·재고**가 들어 있다. 스크린샷·데모를 외부에 뿌릴 땐 `public` 빌드를 쓴다.
- 사용자 기록(재고·음용 로그·취향·메모)은 **각자 브라우저 IndexedDB**에만 저장된다. 서버로 보내는 코드를 추가하려면 먼저 논의할 것.
