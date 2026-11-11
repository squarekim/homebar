# Cloudflare Pages 배포 안내

홈바 공개판(개인 보유 데이터를 뺀 빌드)을 Cloudflare Pages로 올리는 방법이에요.
서버와 데이터베이스가 없는 정적 사이트라 호스팅 비용은 0원이에요. 드는 돈은 도메인을 살 때뿐이에요.

## 0. Workers로 만들어진 경우

Cloudflare가 Pages 대신 Workers로 프로젝트를 만들었다면 **Settings → Build**에서 아래처럼 바꿔요. 설정 파일은 `app/wrangler.jsonc`에 있어요.

| 항목 | 값 |
|---|---|
| Root directory | `app` |
| Build command | `npm run build:public` |
| Deploy command | `npx wrangler deploy` |

## 1. 처음 한 번만 하는 일 (Pages로 만들 때)

1. Cloudflare 계정을 만들어요. 무료 요금제로 충분하고 결제 수단은 등록하지 않아도 돼요.
2. 대시보드에서 **Workers & Pages → Create → Pages → Connect to Git**을 눌러요.
3. GitHub 계정을 연결하고 `squarekim/homebar` 저장소를 골라요.
4. 빌드 설정을 아래처럼 넣어요.

| 항목 | 값 |
|---|---|
| Project name | `homebar` (주소가 `homebar.pages.dev`가 돼요. 이미 쓰이면 다른 이름) |
| Production branch | `main` |
| Framework preset | None |
| Root directory | `app` |
| Build command | `npm run build:public` |
| Build output directory | `dist-public` |

5. **Save and Deploy**를 눌러요. 첫 빌드는 2~3분쯤 걸려요.

Node 버전은 `app/.node-version`(22)으로 고정해 두었어요. 따로 환경 변수를 넣지 않아도 돼요.

## 2. 빌드 횟수 아끼기 (무료 한도 월 500회)

**Settings → Builds & deployments → Branch control**에서

- Production branch: `main`
- Preview branches: **None** (작업 브랜치나 외부 PR이 올라와도 빌드하지 않아요)

이렇게 두면 `main`에 합칠 때만 빌드가 1회 늘어요. 사이트 방문자는 빌드나 비용에 영향을 주지 않아요.

## 3. 업데이트하는 방법

작업 브랜치에서 고친 뒤 `main`에 합치면 자동으로 다시 배포돼요.
배포된 화면이 어느 커밋인지는 앱의 **설정 → 버전**에서 확인할 수 있어요.

## 4. 도메인 연결 (선택)

- **Custom domains → Set up a custom domain**에서 도메인을 넣어요.
- Cloudflare에서 산 도메인이면 DNS가 자동으로 잡혀요. 다른 곳(가비아 등)에서 샀으면 안내되는 CNAME을 그쪽 DNS에 넣어요.

## 5. 함께 켜면 좋은 무료 기능

- **Web Analytics**: 쿠키를 쓰지 않는 방문 통계. 개인정보 처리방침 부담이 작아요.
- **Email Routing**: `문의@내도메인` 주소를 쓰던 메일함으로 전달 (도메인을 Cloudflare에 연결했을 때).

## 저장소에 들어 있는 배포 설정

| 파일 | 하는 일 |
|---|---|
| `app/.node-version` | 빌드 서버의 Node 버전을 22로 고정 |
| `app/public/_headers` | 해시가 붙은 파일은 1년 캐시, `index.html`·서비스 워커는 매번 새로 확인해 업데이트가 바로 보이게 함. 기본 보안 헤더 |

경로를 바꾸는 화면 이동이 없어서(`pushState`에 주소를 넣지 않음) `_redirects`는 필요 없어요.
