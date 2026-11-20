# 요리조리 런 — Play Console 출시 안내

1.0.0을 처음 올리는 순서대로 썼습니다. 각 단계는 **어디서 → 무엇을 넣고 → 무엇을 고르는지**까지 적었습니다.

- 메뉴 이름은 Google 도움말에 나오는 영어 경로로 적었습니다(예: `Test and release > Testing > Closed testing`). 한국어 화면에서는 이름이 조금 다를 수 있지만 위치는 같습니다.
- Play Console 화면과 정책은 자주 바뀝니다. 아래 내용은 2026-11-20 기준입니다.
- 화면에 다른 질문이 나오면, 이 문서의 "앱 사실 정리"를 보고 답하면 됩니다.

---

## 0. 앱 사실 정리 (질문에 답할 때 기준)

| 항목 | 내용 |
|---|---|
| 앱 이름 / 패키지 | 요리조리 런 / `com.khcompany.yorijorirun` |
| 버전 | 1.0.0 (versionCode 1), targetSdk 37, minSdk 26 |
| 개발자 표시 이름 | KH Company |
| 종류 | 게임 · 아케이드, 무료, 인앱 결제 없음 |
| 로그인 | 없음 (회원가입·계정 없음) |
| 광고 | 있음: AdMob 전면광고(10판마다), 보상형 광고(이어하기). 웹 버전에는 광고 없음 |
| 서버에 보내는 것 | 순위표에 올릴 때만, 사용자가 직접 입력한 닉네임(최대 12자)과 점수 → Firebase Firestore. 순위표에 공개됨 |
| 기기에만 두는 것 | 최고 점수, 플레이 횟수, 진동·음량 설정 |
| 권한 | 인터넷, 진동. 광고 SDK가 광고 ID·네트워크 상태 등 권한을 자동으로 추가함 |
| 개인정보처리방침 | https://kwanghyeon-cpu.github.io/YorijoriRun/privacy-policy |
| 웹 게임 | https://kwanghyeon-cpu.github.io/YorijoriRun/web/ |
| 문의 이메일 | 개인정보처리방침 6번의 주소 (스토어 연락처도 같은 주소로) |

---

## 1. 출시 자료 만들기 (매 출시마다)

1. `app/build.gradle.kts`에서 `versionCode`를 1 올리고 `versionName`을 정합니다. 한 번 올린 versionCode는 다시 쓸 수 없습니다.
2. 테스트와 서명된 번들을 만듭니다.

   ```powershell
   $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"; .\gradlew.bat :app:testDebugUnitTest :app:bundleRelease
   ```

   서명에는 `keystore.properties`와 `keystore/yorijorirun-release.jks`를 씁니다.
   - 두 파일은 저장소에 올라가지 않습니다. **반드시 따로 백업하세요.**
   - 잃어버리면 Play Console의 `Test and release > App integrity`에서 업로드 키 재설정을 요청해야 하고, 며칠이 걸립니다.
3. 화면이 바뀌었으면 스크린샷을 다시 만듭니다.
   - `node tools/store-screenshots/serve.mjs`를 실행합니다.
   - 브라우저에서 `http://127.0.0.1:8145/shots.html?save=1`을 엽니다.
4. 출시 자료를 모읍니다.

   ```powershell
   node tools/make-release-assets.cjs
   ```

   `store-assets/release-<버전>/` 폴더(커밋 안 함)가 새로 만들어집니다. 번들이 앱 소스보다 오래됐으면 멈춥니다.

| 파일 | 넣는 곳 | 규격 확인 |
|---|---|---|
| `yorijorirun-<버전>.aab` | 각 트랙의 새 버전 > App bundles | 서명됨(업로드 키, CN=KH Company) |
| `icon_512.png` | 기본 스토어 등록정보 > 앱 아이콘 | 512×512 PNG, 1MB 이하 (약 100KB) |
| `feature_graphic_1024x500.png` | 기본 스토어 등록정보 > 그래픽 이미지 | 1024×500, 투명 채널 없는 24비트 PNG |
| `screenshots/01~08.png` | 기본 스토어 등록정보 > 휴대전화 스크린샷 | 1080×1920(9:16) 8장, 투명 채널 없는 24비트 PNG. 최소 2장, 최대 8장 |
| `store-listing.md` | 앱 이름·짧은 설명·자세한 설명 문구 | 30자 / 80자 / 4000자 이내 |
| `mapping.txt` | **올리지 않아도 됩니다** | R8 매핑 파일이 번들 안(`BUNDLE-METADATA/.../proguard.map`)에 이미 들어 있어, Play가 오류 기록을 자동으로 읽을 수 있게 풉니다. 이 파일은 확인용 사본입니다 |

---

## 2. 앱 만들기

`Home > Create app`

| 칸 | 입력 |
|---|---|
| App name | `요리조리 런` |
| Default language | 한국어 – ko-KR |
| App or game | **Game** |
| Free or paid | **Free** (무료로 낸 앱은 나중에 유료로 바꿀 수 없음) |
| Declarations | 개발자 프로그램 정책, 미국 수출법 두 개 모두 체크 |

만들면 **Dashboard**로 갑니다. 아래 3~5번의 "앱 설정" 항목을 끝내야 테스트 트랙이나 프로덕션에 낼 수 있습니다.

---

## 3. 앱 콘텐츠 (정책 선언)

`Monitor and improve > Policy and programs > App content`

대시보드의 "Set up your app" 목록에서 각 항목을 눌러도 같은 화면으로 갑니다. 항목마다 답을 고르고 **Save**를 눌러야 저장됩니다.

### 3-1. Privacy policy (개인정보처리방침)
- URL에 `https://kwanghyeon-cpu.github.io/YorijoriRun/privacy-policy`를 넣습니다.
- 브라우저에서 이 주소가 열리는지 먼저 확인하세요.

### 3-2. App access (앱 액세스 권한)
- **All functionality in my app is available without any access restrictions**를 고릅니다.
- 로그인이나 특별한 접근 절차가 없기 때문입니다.

### 3-3. Ads (광고)
- **Yes, my app contains ads**를 고릅니다.
- 스토어에 "광고 포함" 표시가 붙습니다.

### 3-4. Content rating (콘텐츠 등급, IARC 설문)
- Email: 문의 이메일
- Category: **Game** (게임)

설문 답은 아래와 같습니다. 문항 수와 순서는 바뀔 수 있으니 뜻을 보고 답하세요.

| 질문 내용 | 답 | 이유 |
|---|---|---|
| 폭력(Violence) | 아니요 | 장애물에 닿으면 "부딪혔어요"와 함께 판이 끝날 뿐, 다치거나 피가 나는 표현 없음 |
| 공포·성적 내용·욕설·약물·음주·흡연·조잡한 유머 | 모두 아니요 | |
| 도박 또는 도박 흉내 | 아니요 | 실제 돈·가상 화폐 내기, 뽑기 없음 |
| 사용자끼리 상호작용·콘텐츠 공유(Users interact) | **예** | 사용자가 입력한 닉네임이 전 세계 순위표에 보임. 채팅·메시지는 없음 |
| 사용자 위치 공유 | 아니요 | |
| 디지털 상품 구매 | 아니요 | |
| 무제한 웹 접근 | 아니요 | |

- 결과는 대부분의 지역에서 전체이용가(3+)이고, "사용자 상호작용" 표시가 붙는 것이 정상입니다.
- 등급을 **Apply**해야 끝납니다.

### 3-5. Target audience and content (타겟층 및 콘텐츠)
- **Target age groups:** `13-15`, `16-17`, `18 and over` 세 개만 고릅니다.
  - **13세 미만은 고르지 마세요.** 고르면 가족 정책이 적용되어, AdMob을 아동용 설정으로 바꾸는 등 추가 작업이 필요합니다.
  - 개인정보처리방침 5번도 "만 14세 미만을 주 대상으로 하지 않음"으로 되어 있습니다.
- **Appeal to children** 질문은 "아니요"로 답합니다.
  - 그림이 귀여운 픽셀아트라 검토 중에 다시 물어볼 수 있습니다.
  - 그때는 "모든 연령이 즐기는 일반 아케이드 게임이고, 아동을 대상으로 만들거나 광고하지 않는다"고 설명하면 됩니다.

### 3-6. Data safety (데이터 보안)

AdMob이 자동으로 모으는 4종은 Google 공식 문서([AdMob Play data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure), SDK 25.5.0 기준)를 따랐습니다. 이 앱도 25.5.0을 씁니다.

**첫 화면**

| 질문 | 답 |
|---|---|
| 요구되는 사용자 데이터 유형을 수집하거나 공유하나요? | **Yes** |
| 수집하는 모든 데이터가 전송 중 암호화되나요? | **Yes** (Firestore·AdMob 모두 HTTPS/TLS) |
| 사용자가 데이터 삭제를 요청할 방법을 제공하나요? | **Yes**: 문의 이메일로 순위표 기록 삭제 요청 (방침 4번). 계정이 없어 별도 삭제 URL은 필요 없음 |

**데이터 유형**: 아래 6개를 체크합니다. 다른 유형은 체크하지 않습니다.

| 분류 > 데이터 유형 | 수집 | 공유 | 처리 방식 | 필수/선택 | 목적 | 어디서 |
|---|---|---|---|---|---|---|
| Personal info > **Name** (닉네임) | 예 | 아니요 | 일시적 처리 아님 | **선택** (TOP 10일 때만, 안 넣어도 됨) | App functionality | 순위표(Firestore) |
| App activity > **Other actions** (게임 점수) | 예 | 아니요 | 일시적 처리 아님 | 선택 (순위표에 올릴 때만) | App functionality | 순위표(Firestore) |
| App activity > **App interactions** | 예 | **예** | 일시적 처리 아님 | 필수 | Advertising or marketing, Analytics, Fraud prevention, security, and compliance | AdMob SDK |
| App info and performance > **Diagnostics** | 예 | **예** | 일시적 처리 아님 | 필수 | Analytics, Fraud prevention, security, and compliance | AdMob SDK |
| Location > **Approximate location** (IP로 추정) | 예 | **예** | 일시적 처리 아님 | 필수 | Advertising or marketing, Analytics, Fraud prevention, security, and compliance | AdMob SDK |
| Device or other IDs (광고 ID, 앱 세트 ID) | 예 | **예** | 일시적 처리 아님 | 필수 | Advertising or marketing, Analytics, Fraud prevention, security, and compliance | AdMob SDK |

- Google 문서는 이 4종을 광고·분석·부정 사용 방지 목적으로 "수집하고 공유한다"고 적고 있어서, 공유를 "예"로 답했습니다.
- 닉네임을 Name으로 고른 이유: Play의 "Name" 정의에 별명(nickname)이 들어갑니다.
- 맨 끝 미리보기에서 개인정보처리방침 1번과 어긋나는 곳이 없는지 확인하고 **Submit**합니다.

### 3-7. Advertising ID (광고 ID)
- **Yes**: 앱이 광고 ID를 사용합니다. 광고 SDK가 `com.google.android.gms.permission.AD_ID` 권한을 자동으로 넣습니다.
- 목적은 **Advertising or marketing**, **Analytics**, **Fraud prevention, security, and compliance**를 고릅니다.
- 여기서 "아니요"라고 하면, 번들에 권한이 있어서 출시가 거부됩니다.

### 3-8. 나머지 선언
| 항목 | 답 |
|---|---|
| Government apps | 아니요 |
| Financial features | 금융 기능 없음 |
| Health apps | 건강 기능 없음 |
| News apps | 뉴스 앱 아님 |

- 위 표에 없는 항목(예: 포그라운드 서비스 권한)이 나오면 "앱 사실 정리"를 보고 답합니다.
- 번들에는 광고·Firebase 라이브러리가 넣은 일반 `FOREGROUND_SERVICE` 권한만 있습니다. 앱이 직접 포그라운드 서비스를 쓰지는 않습니다.

---

## 4. 스토어 설정

`Grow users > Store presence > Store settings`

| 칸 | 입력 |
|---|---|
| App category | Game > **Arcade** |
| Tags | 최대 5개. 추천: 아케이드, 러너(Runner), 캐주얼, 싱글 플레이어, 픽셀 아트 (목록에 있는 것만 고를 수 있음) |
| Email address | 문의 이메일 (스토어에 공개됨) |
| Phone number | 비워 둬도 됨 |
| Website | `https://kwanghyeon-cpu.github.io/YorijoriRun/web/` 또는 비워 둠 (아래 7-2의 app-ads.txt 참고) |

---

## 5. 기본 스토어 등록정보

`Grow users > Store presence > Main store listing`

1. **App name**: `요리조리 런`
   - 부제를 붙이고 싶으면 `store-listing.md`의 두 후보 중 하나를 씁니다. 30자 이내입니다.
2. **Short description**: `store-listing.md`의 "짧은 설명" 블록을 그대로 붙여 넣습니다(80자 이내).
3. **Full description**: `store-listing.md`의 "자세한 설명" 블록을 그대로 붙여 넣습니다(4000자 이내).
4. **App icon**: `icon_512.png`
5. **Feature graphic**: `feature_graphic_1024x500.png`
6. **Phone screenshots**: `screenshots/01_gameplay.png` ~ `08_gameover.png` 8장을 이 순서대로 올립니다.
   - 처음 2~3장이 검색 결과에 보이니 순서를 바꾸지 마세요(게임 화면 → 캐릭터 선택 → 아슬아슬 보너스).
   - 대체 텍스트(alt text)는 아래처럼 넣습니다(화면 읽기 사용자용).

   | 파일 | 대체 텍스트 |
   |---|---|
   | 01_gameplay | 노을 지는 서울 산책로에서 조깅하며 앞의 사람들을 피하는 게임 화면 |
   | 02_characters | 조깅·자전거·인라인·킥보드 네 캐릭터의 속도·몸놀림·체력과 장단점을 고르는 화면 |
   | 03_nearmiss | 장애물을 아슬아슬하게 비켜 가 NEAR MISS 보너스를 받는 장면 |
   | 04_items | 생수병·방어막·자석 아이템을 모으는 장면 |
   | 05_speed | 장애물이 촘촘해진 5칸 산책로를 킥보드로 달리는 장면 |
   | 06_gate | 한 칸만 열린 라바콘·포트홀 줄을 자전거로 빠져나가는 장면 |
   | 07_cities | 서울·도쿄·뉴욕·파리 네 도시의 산책로 |
   | 08_gameover | 게임 오버 화면에서 TOP 10에 들어 닉네임을 입력하는 장면 |

7. 태블릿·Chromebook 스크린샷은 비워 둡니다(선택 사항). 비워 두면 태블릿용 추천에 덜 노출될 뿐입니다.
8. **Save**를 누릅니다.

---

## 6. 국가·가격

`Test and release > Production > Countries / regions`. 테스트 트랙에도 같은 탭이 있습니다.

- **처음에는 대한민국만(또는 유럽 경제 지역·영국·스위스를 뺀 나라들) 고르는 것을 권합니다.**
  - 그 지역은 AdMob에 Google 인증 동의 화면(CMP)이 있어야 광고가 제대로 나옵니다.
  - 지금 앱에는 동의 화면이 없습니다.
  - 그 지역에 내고 싶으면 먼저 UMP 동의 화면을 넣어야 합니다(별도 작업).
- 가격은 무료(2번에서 정함)이고, 인앱 상품은 없습니다.

---

## 7. 테스트 트랙과 첫 버전

### 7-1. 어느 트랙으로 낼지

| 계정 종류 | 해야 하는 것 |
|---|---|
| **개인 계정**, 2023-11-13 이후 만듦 | 프로덕션 전에 **비공개 테스트(Closed testing)** 에서 **테스터 12명 이상이 14일 연속 참여**해야 합니다. 그다음 대시보드에서 **Apply for production**을 신청합니다. 검토는 보통 7일 이내입니다 ([Google 도움말](https://support.google.com/googleplay/android-developer/answer/14151465)) |
| 조직 계정, 또는 그 전에 만든 개인 계정 | 바로 프로덕션에 낼 수 있습니다. 내부 테스트(Internal testing, 최대 100명, 검토 거의 없음)로 먼저 설치해 보는 것을 권합니다 |

### 7-2. 비공개 테스트 만들기 (개인 계정)

`Test and release > Testing > Closed testing`

1. 기본 트랙(Closed testing - Alpha)의 **Manage track**을 누릅니다.
2. **Countries / regions** 탭에서 6번과 같은 나라를 고릅니다.
3. **Testers** 탭에서 테스터를 정합니다.
   - **Email lists**에 테스터의 Gmail 주소 목록을 만들어 체크합니다. Google 그룹을 써도 됩니다.
   - **Feedback URL or email**에는 문의 이메일을 넣습니다.
   - 저장하면 나오는 **참여 링크(Join on the web)**를 복사해 둡니다.
4. **Create new release**를 누릅니다.
   - 처음이면 **App signing**에서 Google이 만든 키를 쓰는 기본값(**Use Google-generated key**)을 그대로 둡니다.
     - 이 키는 Google이 보관하는 실제 서명 키입니다.
     - 우리가 가진 `yorijorirun-release.jks`는 그 키에 번들을 올릴 때만 쓰는 **업로드 키**입니다.
   - **App bundles**에 `yorijorirun-1.0.0.aab`를 올립니다.
   - **Release name**: `1.0.0 (1)` (자동으로 채워짐)
   - **Release notes**:

     ```text
     <ko-KR>
     요리조리 런 첫 테스트 버전입니다. 조깅·자전거·인라인·킥보드 중 하나를 골라 도시 산책로를 요리조리 달려 보세요. 캐릭터마다 장단점이 달라요!
     </ko-KR>
     ```

5. **Next**를 누르면 검토 화면이 나옵니다. 경고(노란색)와 오류(빨간색)를 봅니다.
   - 오류는 고쳐야 합니다.
   - 아래 "자주 나오는 경고"는 무시해도 됩니다.
6. **Save** 후 **Publishing overview**(게시 개요)에서 **Send changes for review**를 누릅니다.
   - 첫 검토는 며칠 걸릴 수 있습니다.
   - 승인되면 참여 링크가 작동합니다.
7. 테스터에게 할 일을 알려 줍니다.
   - 참여 링크를 열고 Gmail 계정으로 **테스터 되기**를 누릅니다.
   - Play 스토어에서 설치하고 여러 날 실제로 플레이합니다. Google은 참여 정도도 봅니다.
   - **14일이 지나기 전에 테스트를 그만두지 않게** 부탁합니다. 중간에 나갔다 다시 들어오면 14일을 처음부터 셉니다.
8. 14일이 지나면 Dashboard에서 **Apply for production**을 누르고 설문에 답합니다.
   - 설문에는 테스트를 어떻게 했는지, 피드백을 받아 무엇을 고쳤는지, 출시 준비가 됐다고 보는 이유를 적습니다.
   - 테스트 중에 고친 것이 있으면 버전을 올려(versionCode 2) 같은 트랙에 다시 내고, 그 내용을 적으면 좋습니다.

### 7-3. 자주 나오는 경고 (무시해도 됨)
- **네이티브 디버그 기호를 올리지 않음**: 번들 안의 아주 작은 `.so` 파일 2개는 AndroidX 라이브러리 것이라 기호 파일이 필요 없습니다.
- **난독화 매핑 파일 없음**: 이 경고는 나오지 않아야 합니다. 매핑이 번들에 들어 있습니다. 혹시 나오면 `App bundle explorer`에서 1.0.0을 고르고 `Downloads` 탭의 `Assets > ReTrace mapping file`에 `mapping.txt`를 올립니다.

---

## 8. 프로덕션 출시

`Test and release > Production`

1. **Create new release**를 누릅니다. 테스트 트랙에서 올린 번들을 **Add from library**로 가져올 수 있습니다.
2. 출시 노트:

   ```text
   <ko-KR>
   요리조리 런 첫 출시! 조깅·자전거·인라인·킥보드로 도시 산책로를 요리조리 달려 보세요.
   </ko-KR>
   ```

3. **단계적 출시(Staged rollout)** 비율을 정합니다.
   - 처음에는 20% 정도로 시작해 Android vitals에 비정상 종료가 없는지 보고 100%로 올리는 방법을 권합니다.
   - 처음부터 100%로 내도 됩니다.
4. **Publishing overview > Send changes for review**를 누릅니다.
   - 검토 후 공개됩니다. 신규 앱은 며칠 걸릴 수 있습니다.
   - **Managed publishing**을 켜 두면 승인 뒤 공개 시점을 직접 정할 수 있습니다.

---

## 9. 출시 뒤 할 일

1. **AdMob 스토어 연결**
   - AdMob에서 `Apps > 요리조리 런 > App settings`로 갑니다.
   - **Add store**로 Play 스토어의 앱을 찾아 연결합니다.
   - 연결 전에는 광고 채우기가 제한될 수 있습니다.
2. **app-ads.txt**
   - AdMob은 스토어 등록정보의 **Website** 칸에 적은 도메인의 **맨 위 경로**(`https://<도메인>/app-ads.txt`)에서 이 파일을 찾습니다.
   - `kwanghyeon-cpu.github.io/YorijoriRun/...`처럼 GitHub Pages 프로젝트 주소를 적었다면, 파일은 `https://kwanghyeon-cpu.github.io/app-ads.txt`에 있어야 합니다.
     - 이 위치에 파일을 두려면 `kwanghyeon-cpu.github.io`라는 이름의 저장소가 필요합니다.
     - Lane Dash 때 만든 개발자 사이트가 있으면 그 사이트를 Website로 적고, 거기 있는 app-ads.txt를 그대로 쓰면 됩니다. 같은 게시자 ID라 한 줄이면 됩니다.
   - 없어도 광고는 나오지만, AdMob에 경고가 뜨고 수익이 줄 수 있습니다.
3. **사전 출시 보고서**
   - `Test and release > Testing > Pre-launch report`에서 Google 테스트 기기의 비정상 종료·접근성 경고를 확인합니다.
4. **Android vitals**
   - `Monitor and improve > Android vitals`에서 비정상 종료율과 ANR(응답 없음)을 확인합니다.
5. **Firebase**
   - `Test and release > App integrity`의 **앱 서명 키 인증서** SHA-1·SHA-256을 Firebase 프로젝트 `yorijori-run`의 Android 앱에 추가해 두면, 나중에 로그인 등을 붙일 때 편합니다.
   - 지금 순위표에는 필요 없습니다.

---

## 10. 다음 버전 올리기
1. versionCode를 올리고 1번을 다시 합니다.
2. 같은 트랙에 **Create new release**를 하고 출시 노트를 적습니다.
3. 데이터 수집이나 광고를 바꿨으면 함께 고칩니다: 3-6 데이터 보안, `privacy-policy.md`, `store-listing.md`.
