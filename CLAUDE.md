# Path Dash (임시 이름)

Lane Dash 3.0.5(`C:\Users\innocean\AndroidStudioProjects\LaneDash`, 별도로 운영 중인 앱)를 복제해 만든 **새 게임**. 게임 방식은 그대로 두고, 조종 대상을 자동차에서 조깅·자전거·리어카·킥보드 4종(앱 id `jogging`/`bicycle`/`cart`/`kickboard`)으로, 무대를 도로에서 산책로·자전거길 느낌의 "길"로 바꾸는 것이 목표다.

## 핵심 구조 (Lane Dash에서 그대로 가져옴)

- 세로 화면, 차 뒤에서 바라보는 의사 3D 5차선 길. 좌우 버튼으로 한 번에 한 차선씩 이동.
- 엔진은 순수 로직이고 앱과 웹이 같은 값을 쓴다: `app/.../game/highway/HighwayEngine.kt`·`HighwayRoad.kt` ↔ `web/js/highway-engine.js`. **숫자를 바꾸면 양쪽을 같이 바꾼다.**
- 렌더링: `ui/screens/HighwayScreen.kt`·`HighwayFx.kt` ↔ `web/js/highway-render.js`.
- 체력·생수병·방어막·자석(코드에서는 Lane Dash 이름 그대로 `fuel`/`FUEL`. 화면 문구와 그림만 체력·생수로 바꿨다), 근접 회피 보너스, 후반 난이도 상승(`late`), 게이트(한 차선만 비운 장애물 줄).
- 광고: 게임오버 전면광고(10판마다) + 보상형 이어하기. 순위표: Firestore `scores_pathdash`.

## 이 프로젝트에서 지켜야 할 것

- **Lane Dash의 계정 ID를 절대 다시 쓰지 않는다.** AdMob은 지금 Google 샘플 ID, 실제 ID는 이 게임 전용으로 새로 받는다.
- `app/google-services.json`은 빌드용 임시 파일(로컬 전용, gitignore). Firebase에 이 앱을 등록하면 교체.
- 이름이 정해지면 `node tools/rename-project.cjs PathDash <New> "Path Dash" "<New Name>"` 한 번으로 패키지·클래스·표시 이름·저장 키를 바꾼다. 패키지명은 스토어에 올린 뒤에는 못 바꾼다.
- 사람·아기가 다치는 표현은 피한다(사람 장애물은 "피하는" 표현, 부딪히면 "부딪혔어요" 정도로).
- 아이콘은 Iconify에서 가져오고 세트별 라이선스를 확인한다(전역 지침).

## 검증

- 앱 테스트: `JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" ./gradlew.bat :app:testDebugUnitTest`
- 웹 테스트: `node --test web/test/highway.test.mjs`
- 난이도 측정: `node tools/difficulty-planner.mjs` (앞을 내다보는 봇으로 생존 시간 측정)
- 스토어 스크린샷 생성: `node tools/store-screenshots/serve.mjs` 후 `http://127.0.0.1:8145/shots.html?save=1`
- 배경 가공: `design/city-backdrops/make-backdrops.cjs`, 제미나이 프롬프트 예시 `design/city-backdrops/gemini-prompts.md`
- 탈것·장애물 그림 가공: `node design/sprites/make-sprites.cjs` (`--dry`는 임시 폴더에만 저장), 프롬프트 `design/sprites/gemini-prompts.md`. 원본은 `design/sprites/gemini-originals/`(커밋 안 함)

## 진행 상황

- 남은 계정 작업과 교체할 그림 목록은 `NEW_GAME_SETUP.md`.
- 그림(탈것 4종 뒷모습, 새 장애물, 타이틀, 아이콘)은 아직 Lane Dash 것을 임시로 사용 중.
- GitHub 원격 저장소 없음(로컬 git만).
- 작업마다 새 `feature/...` 브랜치에서 한다. 커밋과 master 합치기(fast-forward)는 요청이 있을 때만.
