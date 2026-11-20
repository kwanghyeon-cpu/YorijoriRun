# 요리조리 런

이름은 2026-11-20에 **요리조리 런**(코드 `YorijoriRun`, 패키지 `com.khcompany.yorijorirun`)으로 정했다. 임시 이름은 Path Dash였다. 프로젝트 폴더는 `C:\Users\innocean\AndroidStudioProjects\YorijoriRun`(2026-11-20에 `D:\Dev\PathDash`에서 옮김).

Lane Dash 3.0.5(`C:\Users\innocean\AndroidStudioProjects\LaneDash`, 별도로 운영 중인 앱)를 복제해 만든 **새 게임**. 게임 방식은 그대로 두고, 조종 대상을 자동차에서 조깅·자전거·인라인·킥보드 4종(앱 id `jogging`/`bicycle`/`inline`/`kickboard`)으로, 무대를 도로에서 산책로·자전거길 느낌의 "길"로 바꾸는 것이 목표다.

## 핵심 구조 (Lane Dash에서 그대로 가져옴)

- 세로 화면, 차 뒤에서 바라보는 의사 3D 5차선 길. 좌우 버튼으로 한 번에 한 차선씩 이동.
- 엔진은 순수 로직이고 앱과 웹이 같은 값을 쓴다: `app/.../game/highway/HighwayEngine.kt`·`HighwayRoad.kt` ↔ `web/js/highway-engine.js`. **숫자를 바꾸면 양쪽을 같이 바꾼다.**
- 렌더링: `ui/screens/HighwayScreen.kt`·`HighwayFx.kt` ↔ `web/js/highway-render.js`.
- 체력·생수병·방어막·자석(코드에서는 Lane Dash 이름 그대로 `fuel`/`FUEL`. 화면 문구와 그림만 체력·생수로 바꿨다), 근접 회피 보너스, 후반 난이도 상승(`late`), 게이트(한 차선만 비운 장애물 줄).
- 광고: 게임오버 전면광고(10판마다) + 보상형 이어하기. 순위표: Firestore `scores_yorijorirun`.

## 이 프로젝트에서 지켜야 할 것

- **Lane Dash의 계정 ID를 절대 다시 쓰지 않는다.** AdMob은 이 게임 전용 앱(`ca-app-pub-4172722948933624~3343896247`)의 ID를 쓴다(같은 AdMob 계정이라 게시자 번호만 Lane Dash와 같다). 디버그 빌드는 `AdManager`가 자동으로 Google 샘플 광고를 쓴다.
- `app/google-services.json`은 yorijori-run 프로젝트의 진짜 파일이지만 로컬 전용이다(gitignore, 저장소에 올리지 않음).
- 스토어에 올리기 전에 이름을 다시 바꿀 일이 생기면 `node tools/rename-project.cjs YorijoriRun <New> "요리조리 런" "<New Name>"` 한 번으로 패키지·클래스·표시 이름·저장 키·순위표 컬렉션을 바꾼다. 패키지명은 스토어에 올린 뒤에는 못 바꾼다.
- 사람·아기가 다치는 표현은 피한다(사람 장애물은 "피하는" 표현, 부딪히면 "부딪혔어요" 정도로).
- 아이콘은 Iconify에서 가져오고 세트별 라이선스를 확인한다(전역 지침).

## 검증

- 앱 테스트: `JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" ./gradlew.bat :app:testDebugUnitTest`
- 웹 테스트: `node --test web/test/highway.test.mjs`
- 난이도 측정: `node tools/difficulty-planner.mjs` (앞을 내다보는 봇으로 생존 시간 측정)
- 스토어 스크린샷 생성: `node tools/store-screenshots/serve.mjs` 후 `http://127.0.0.1:8145/shots.html?save=1` → `store-assets/screenshots-1.0/`(커밋 안 함). 스토어 문구 초안은 `store-listing.md`. 피처 그래픽(1024×500)은 `node design/title-icon/make-feature-graphic.cjs` → `design/icon/feature_graphic.png`(타이틀 그림·탈것 그림·로고로 조합, 셋 중 하나가 바뀌면 다시 만든다). 기능을 바꾸면 문구와 `privacy-policy.md`도 맞춘다.
- 배경 가공: `design/city-backdrops/make-backdrops.cjs`, 제미나이 프롬프트 예시 `design/city-backdrops/gemini-prompts.md`
- 탈것·장애물 그림 가공: `node design/sprites/make-sprites.cjs` (`--dry`는 임시 폴더에만 저장), 프롬프트 `design/sprites/gemini-prompts.md`. 원본은 `design/sprites/gemini-originals/`(커밋 안 함)
- 타이틀·앱 아이콘 가공: `node design/title-icon/make-title-icon.cjs` (`--dry` 가능), 프롬프트 `design/title-icon/gemini-prompts.md`. 원본 `home_portrait.*`·`app_icon.*`은 `design/title-icon/gemini-originals/`(커밋 안 함). 스토어 아이콘은 `design/icon/store_icon_512.png`. `design/icon/make_icon.mjs`와 svg들은 Lane Dash 시절 자동차 아이콘용이라 쓰지 않는다.
- 효과음 합성: `node design/sounds/synth-sounds.cjs` (`--dry` 가능). 지금 소리 7개는 이 스크립트가 만든 칩튠이다(외부 음원 없음). 소리를 바꾸면 웹 `audio.js`의 `SOUND_VERSION`을 올린다. 최대 음량은 자리별 Lane Dash 소리에 맞췄다.
- 효과음 가공(무료 사이트 소리로 바꿀 때): `node design/sounds/make-sounds.cjs` (`--dry` 가능). 원본은 `design/sounds/originals/<파일 이름>.wav`(커밋 안 함), 출처·라이선스는 `design/sounds/SOURCES.md`, CC BY는 `NOTICE.md`에도 적는다. WAV는 바로 읽고 MP3·OGG는 ffmpeg가 필요한데 이 PC에는 없다. 음량은 자리별 Lane Dash 소리의 최대 음량(peak)에 맞춘다.

## 진행 상황

- 남은 계정 작업과 교체할 그림 목록은 `NEW_GAME_SETUP.md`.
- 그림(탈것 4종, 장애물, 타이틀 화면, 앱 아이콘)과 소리 7개는 모두 새것으로 교체함. Lane Dash에서 온 것은 도시 배경 그림뿐이다.
- 홈 화면은 앱·웹 모두 로고·부제·BEST를 위쪽 하늘에, 작은 PLAY 버튼(폭 50%)을 맨 아래 가까운 길 위에 두고, 그 사이는 타이틀 그림의 네 탈것이 보이게 비워 둔다.
- 제목은 글자가 아니라 디자인한 로고 그림 `title_logo.png`다(앱 `drawable-nodpi`, 웹 `assets/ui`, 화면 읽기용 설명 "요리조리 런"). `design/title-icon/logo.html`의 C3 시안(Black Han Sans, OFL)으로 그린다. 다시 만들 때: `node tools/store-screenshots/serve.mjs <출력 폴더>` → `http://127.0.0.1:8145/design/title-icon/logo.html?c=C3&save=1` → `node design/title-icon/make-logo.cjs <출력 폴더>`.
- 장애물 종류 이름은 Lane Dash 그대로다: SEDAN=자전거 탄 사람, SUV=강아지 산책, BUS=러닝 크루, TRUCK=배달 오토바이, CONE=라바콘, BARRIER=포트홀. 그림 크기는 종류별 `drawHalfWidth`, 충돌 폭은 모든 장애물이 `OBSTACLE_HALF_WIDTH`(0.15) 하나다. 장애물은 늘 차선 한가운데 있어서 폭은 차선을 옮기는 중에만 의미가 있고, 그림과 상관없게 했다.
- 내 탈것은 모두 같은 높이 `PLAYER_DRAW_HEIGHT`(0.62)로 그리고, 가로로 넓은 그림은 폭이 `PLAYER_DRAW_MAX_WIDTH`(0.38, 한 차선 안)에서 멈춘다(비율 유지). 충돌은 모든 탈것이 `PLAYER_HALF_WIDTH`로 같다. 3번 탈것은 처음에 리어카였는데 넓은 그림이라 작게 보여서, 세로로 긴 배달 전동 카트로 바꿨다가, 2026-11-20에 인라인스케이트("인라인", id `inline`, 그림 파일은 그대로 `car_rear_3`)로 바꿨다. 인라인은 `SKATE` 움직임(좌우로 크게 기울며 다리 교대).
- 길에는 차선 점선을 그리지 않는다(산책로라서). 5칸은 게임 규칙에만 있다.
- 캐릭터는 코드로 움직인다(종이인형처럼 미끄러지지 않게): 달리기는 걸음마다 튀고 착지 때 눌리며 좌우로 흔들리고, 자전거는 페달 박자로 흔들리고, 킥보드는 주기적으로 발을 구르고, 전동 탈것은 미세하게 떤다. 그리기 전용이라 엔진·충돌은 그대로다. 앱 `ui/screens/HighwayMotion.kt` ↔ 웹 `highway-render.js`의 `riderPose`, 숫자는 같이 바꾼다. 다리가 움직이는 6명(조깅·자전거·킥보드, 자전거 탄 사람·강아지 산책·러닝 크루)은 2프레임 그림을 걸음·페달 박자에 맞춰 번갈아 보여 줄 수 있다: 원본 `<이름>_frames.png`(왼쪽·오른쪽 반)를 `make-sprites.cjs`가 `<이름>.png`·`<이름>_b.png`로 나누고(같은 배율, 발밑 가운데 기준), 웹용 목록 `web/js/sprite-frames.js`를 만든다. `_b`가 없으면 한 장으로 그린다. 제미나이가 두 프레임에 같은 다리를 그린 경우 `MIRROR_LEGS`로 고친다: 조깅은 2프레임 = 1프레임의 허리 아래를 좌우로 뒤집은 것, 러닝 크루는 가운데·오른쪽 사람 다리만 그 자리에서 뒤집어 넣는다. 오른쪽 아래 구석의 제미나이 별 표시는 크기와 상관없이 지운다. 프롬프트는 `design/sprites/gemini-prompts.md` 7절.
- GitHub 공개 저장소 `kwanghyeon-cpu/YorijoriRun`(2026-11-20, origin). GitHub Pages가 master 루트를 배포한다: 웹 게임 https://kwanghyeon-cpu.github.io/YorijoriRun/web/ , 개인정보처리방침 https://kwanghyeon-cpu.github.io/YorijoriRun/privacy-policy . master에 합친 뒤 푸시하면 바로 반영되니, 웹 파일을 바꾸면 `?v=` 캐시 번호를 꼭 올린다. Firebase는 이 게임 전용 새 프로젝트 `yorijori-run`이다(Lane Dash와 분리). 앱은 `app/google-services.json`(로컬 전용), 웹은 `web/js/leaderboard.js`의 설정(공개돼도 되는 값)을 쓴다. 규칙은 `firestore.rules`를 콘솔에 붙여 넣어 게시한다.
- 작업마다 새 `feature/...` 브랜치에서 한다. 커밋과 master 합치기(fast-forward)는 요청이 있을 때만.
