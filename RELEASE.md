# 요리조리 런 — 출시 자료 만들기와 Play Console 올리기

## 1. 자료 만들기 (매 출시마다)

1. `app/build.gradle.kts`의 `versionCode`를 1 올리고 `versionName`을 정합니다(1.0.0은 versionCode 1).
2. 테스트와 서명된 번들:

   ```powershell
   $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"; .\gradlew.bat :app:testDebugUnitTest :app:bundleRelease
   ```

   서명은 `keystore.properties`와 `keystore/yorijorirun-release.jks`(둘 다 로컬 전용, 저장소에 올리지 않음)를 씁니다. **이 두 파일은 따로 백업해 두세요.** 잃어버리면 Play Console에서 업로드 키 재설정을 요청해야 합니다.
3. 화면이 바뀌었으면 스크린샷을 다시 만듭니다: `node tools/store-screenshots/serve.mjs` → `http://127.0.0.1:8145/shots.html?save=1`.
4. 모으기:

   ```powershell
   node tools/make-release-assets.cjs
   ```

   `store-assets/release-<버전>/`(커밋 안 함)에 아래가 모입니다. 번들이 앱 소스보다 오래됐으면 멈추고 다시 빌드하라고 알려 줍니다.

| 파일 | Play Console 어디에 |
|---|---|
| `yorijorirun-<버전>.aab` | 테스트 및 출시 > (비공개/내부 테스트 또는 프로덕션) > 새 버전 만들기 > App Bundle |
| `mapping.txt` | 같은 버전 화면 > App Bundle 탐색기 > 해당 버전 > 다운로드 탭 > ReTrace 매핑 파일 업로드 (난독화된 오류 기록을 읽기 위함. 번들에 이미 들어가 있으면 생략 가능) |
| `icon_512.png` | 스토어 등록정보 > 그래픽 > 앱 아이콘 |
| `feature_graphic_1024x500.png` | 스토어 등록정보 > 그래픽 > 그래픽 이미지 |
| `screenshots/01~07.png` | 스토어 등록정보 > 휴대전화 스크린샷 (1080×1920, 투명 채널 없는 24비트 PNG) |
| `store-listing.md` | 앱 이름·짧은 설명·자세한 설명, 카테고리, 콘텐츠 등급·데이터 보안 답변 참고 |

## 2. 처음 올릴 때 Play Console에서 할 일 (1.0.0)

1. **앱 만들기**: 앱 이름 "요리조리 런", 기본 언어 한국어, 게임, 무료.
2. **앱 서명**: Play 앱 서명을 그대로 사용(기본값). 처음 올린 번들의 서명(CN=KH Company)이 업로드 키로 등록됩니다.
3. **앱 콘텐츠**(대시보드의 "앱 설정" 항목들):
   - 개인정보처리방침: https://kwanghyeon-cpu.github.io/YorijoriRun/privacy-policy
   - 광고: **예, 광고가 포함되어 있음**
   - 앱 액세스 권한: 모든 기능을 로그인 없이 사용 가능
   - 콘텐츠 등급 설문: `store-listing.md`의 "콘텐츠 등급 설문 참고"
   - 타겟층: 만 13세 이상 권장(만 13세 미만을 넣으면 가족 정책·광고 제한이 추가로 걸림)
   - 데이터 보안: `store-listing.md`의 "데이터 보안 양식 참고"
   - 광고 ID: **예, 사용함**(AdMob). 목적은 광고·분석
   - 정부 앱 / 금융 기능 / 건강: 해당 없음
4. **스토어 등록정보**: 1번 표의 파일과 문구를 넣습니다. 카테고리 게임 > 아케이드, 연락처 이메일은 개인정보처리방침의 문의처와 같은 주소.
5. **테스트 트랙**: 2023-11-13 이후 만든 **개인** 개발자 계정은 프로덕션에 내기 전에 **비공개 테스트에서 12명 이상이 14일 연속 참여**해야 합니다. 이 경우 먼저 비공개 테스트 트랙에 번들을 올리고 테스터 이메일 목록을 만듭니다. 조직 계정이면 바로 프로덕션(또는 내부 테스트로 먼저 확인)도 됩니다.
6. **출시 노트**(예, 한국어):

   ```text
   요리조리 런 첫 출시! 조깅·자전거·인라인·킥보드로 도시 산책로를 요리조리 달려 보세요.
   ```

## 3. 올린 뒤

- AdMob: 앱이 스토어에 올라가면 AdMob 앱 설정에서 **스토어 연결**(Play 스토어 앱 찾기)을 해야 광고가 정상적으로 채워집니다. `app-ads.txt`도 개발자 웹사이트에 올리면 좋습니다.
- Firebase: Play 앱 서명 키의 SHA-1/SHA-256(Play Console > 앱 무결성)을 Firebase 프로젝트 `yorijori-run`의 Android 앱에 추가해 두면 나중에 인증 기능을 붙일 때 편합니다(지금 순위표는 필요 없음).
- 사전 출시 보고서(Play Console > 테스트 > 사전 출시 보고서)에서 비정상 종료가 없는지 확인합니다.
