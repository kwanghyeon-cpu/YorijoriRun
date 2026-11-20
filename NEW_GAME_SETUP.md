# 요리조리 런 — 새 게임 준비 체크리스트

Lane Dash(하이웨이 3.0.5)를 복제해서 만든 새 프로젝트입니다. 게임 엔진·조작·난이도·광고/순위표 구조는 그대로이고,
이름과 계정 연결만 분리해 둔 상태입니다.

## 이름 (2026-11-20 확정)
이름은 **요리조리 런**(코드 이름 `YorijoriRun`, 패키지 `com.khcompany.yorijorirun`)으로 정했습니다.
Path Dash는 임시 이름이었습니다. 프로젝트 폴더는 `C:\Users\innocean\AndroidStudioProjects\YorijoriRun`입니다.
패키지명은 스토어에 올린 뒤에는 바꿀 수 없습니다. 올리기 전에 이름을 또 바꾼다면 아래 한 줄이면 됩니다.

```
node tools/rename-project.cjs YorijoriRun 새이름 "요리조리 런" "새 이름"
```

## 이미 분리해 둔 것
- **패키지**: `com.khcompany.yorijorirun` (Lane Dash와 별개의 앱)
- **버전**: 1.0.0 (versionCode 1) — 첫 출시 버전
- **광고**: Lane Dash의 AdMob ID를 지우고, 이 게임 전용 AdMob 앱의 ID를 넣음 (`AndroidManifest.xml`, `ads/AdManager.kt`)
- **순위표**: 컬렉션을 `scores_yorijorirun`로 분리 (앱·웹), `firestore.rules`도 이 컬렉션만 열도록 정리
- **웹 저장 키**: `yorijori_run_*` (같은 github.io 도메인에서 Lane Dash 기록과 섞이지 않음)

## 직접 해 주셔야 하는 것 (계정 작업)
1. **Firebase** (끝남, 2026-11-20): 새 프로젝트 `yorijori-run`(Lane Dash 프로젝트 lanedash-2cc5d와 분리). Android 앱과 웹 앱을 등록했고,
   진짜 `google-services.json`(로컬 전용)과 웹 설정(`web/js/leaderboard.js`)을 넣었습니다. 순서 기록:
   - 프로젝트 추가(Google 애널리틱스 끔) → Android 앱 `com.khcompany.yorijorirun` 등록 → `google-services.json`을 받아 `app/`에 넣기.
     지금 `app/google-services.json`은 빌드만 되게 만든 **임시 파일**입니다(로컬 전용, 커밋 안 됨, 안에는 Lane Dash 프로젝트 정보).
   - 웹 앱도 등록(호스팅 체크 안 함)하고 `firebaseConfig` 값으로 `web/js/leaderboard.js`의 설정을 바꾸기.
2. **Firestore** (끝남, 2026-11-20, 규칙 게시 확인: 순위표 읽기 성공, 잘못된 기록과 다른 컬렉션은 거부): 데이터베이스 만들기(프로덕션 모드, 위치 asia-northeast3 서울 추천) → 규칙 탭에 `firestore.rules` 전체를 붙여 넣고 게시.
   게시 전까지는 이 게임의 순위표가 "권한 없음"으로 실패합니다(의도된 안전장치).
3. **AdMob** (끝남, 2026-11-20): 새 앱 `요리조리 런` 등록. 앱 ID `ca-app-pub-4172722948933624~3343896247`,
   전면 `…/6180270589`, 보상형 `…/4675617223`을 넣음(디버그 빌드는 계속 Google 샘플 광고). 유럽·영국용 동의 화면(UMP)은 아직 없음.
   `app-ads.txt`는 개발자 사이트에 이미 있으면 그대로 됩니다.
4. **Play Console**: 새 앱 만들기, 스토어 등록정보, 콘텐츠 등급, 개인정보처리방침 주소.
   스토어 문구·카테고리·콘텐츠 등급·데이터 보안 답변 초안은 `store-listing.md`, 스크린샷 7장은 `store-assets/screenshots-1.0/`
   (커밋 안 함, 도구로 다시 만들 수 있음), 개인정보처리방침은 `privacy-policy.md`(2026-11-20 새 앱 기준으로 고침).
   피처 그래픽(1024×500)은 `design/icon/feature_graphic.png`(`node design/title-icon/make-feature-graphic.cjs`).
   개인 개발자 계정은 새 앱마다 비공개 테스트 요건이 있을 수 있으니 콘솔에서 확인.
5. **서명**: 릴리스 서명은 `keystore.properties`(커밋 안 됨)로 합니다. Lane Dash의 업로드 키를 재사용해도 되고 새로 만들어도 됩니다.
6. **GitHub / 웹** (끝남, 2026-11-20): 공개 저장소 https://github.com/kwanghyeon-cpu/YorijoriRun 에 master를 올리고 Pages를 켰습니다.
   웹 게임 https://kwanghyeon-cpu.github.io/YorijoriRun/web/ (앱 공유 문구의 `WEB_PLAY_URL`), 개인정보처리방침 https://kwanghyeon-cpu.github.io/YorijoriRun/privacy-policy .
   웹 순위표는 Firebase에 **웹 앱도 등록**해서 `web/js/leaderboard.js`의 `REPLACE_ME`(apiKey, appId 등)를 채워야 동작합니다.

## 교체할 그림·소리

그림과 소리는 모두 교체를 마쳤습니다(2026-11-20). 도시 배경만 그대로 씁니다.

| 파일 | 내용 | 상태 |
|---|---|---|
| `car_rear_1..4.png` (앱 `drawable-nodpi`, 웹 `assets/rear`) | 조깅·자전거·배달 카트·킥보드 (뒷모습, 순서대로 1~4) | 교체함 |
| `traffic_rear_*.png` (움직이는 장애물 4칸) | sedan 자전거 탄 사람·suv 강아지 산책·bus 러닝 크루·truck 배달 오토바이 | 교체함 |
| `hw_barrier.png`, `hw_cone.png` (멈춰 있는 장애물 2칸) | 포트홀, 라바콘 | 교체함 |
| `home_portrait.png` (앱 `drawable-nodpi`, 웹 `assets/ui`) | 강변 산책로와 네 탈것 타이틀 화면 | 교체함 (2026-11-20 두 번째: 배달 카트, 차선 없는 길) |
| `title_logo.png` (앱 `drawable-nodpi`, 웹 `assets/ui`) | "요리조리 런" 로고, 지그재그 화살표가 "런"으로 들어가는 C3 시안 (`design/title-icon/logo.html`) | 새로 넣음 |
| `ic_launcher_foreground.png`, `design/icon/store_icon_512.png` | 요리조리 피하는 러너 아이콘 (배경 층은 보라색 그라데이션 그대로) | 교체함 |
| `city_*.png` | 길 건너편 도시 | 그대로 씀 |
| 효과음 7개 (`res/raw`, `web/assets/sfx`, `web/assets/bgm`) | `design/sounds/synth-sounds.cjs`로 직접 합성한 칩튠 소리(라이선스 필요 없음) | 교체함 |

그림을 다시 만들 때:
- 탈것·장애물: 프롬프트 `design/sprites/gemini-prompts.md` → `design/sprites/gemini-originals/`에 같은 파일 이름으로 저장 →
  `node design/sprites/make-sprites.cjs`. 그림 크기가 달라지면 `TRAFFIC_KINDS`의 `drawHalfWidth`를 다시 맞춥니다.
- 타이틀·아이콘: 프롬프트 `design/title-icon/gemini-prompts.md` → `design/title-icon/gemini-originals/`에
  `home_portrait.png`·`app_icon.png`로 저장 → `node design/title-icon/make-title-icon.cjs`.
- Play Console에는 `design/icon/store_icon_512.png`를 고해상도 아이콘으로 올립니다.
- 소리: `design/sounds/synth-sounds.cjs`의 해당 함수를 고치고 `node design/sounds/synth-sounds.cjs`를 실행합니다. 웹은 `audio.js`의
  `SOUND_VERSION`을 올립니다. 무료 사이트 소리로 바꾸려면 `design/sounds/README.md`(고르기 가이드)와 `make-sounds.cjs`를 씁니다.

코드 쪽 남은 일: 없음(그림·소리 교체도 끝남).
(문구 정리·속도계도 끝남. 탈것 이름은 조깅·자전거·배달 카트(처음엔 리어카)·킥보드, 속도계는 15~25 km/h, 게임오버는 "부딪혔어요".)
(도로 → 산책로는 끝남. 도시별 길 색: 서울 적갈색 우레탄, 도쿄 남색, 뉴욕 회청색, 파리 모래색. 연석은 회색 경계석, 가로등은 낮은 공원 등. 차선 점선은 없앴다(5칸 이동은 게임 규칙에만 있음).)
(연료 → 체력(생수병)은 끝남. 화면 문구·아이콘·게이지만 바꿨고 엔진 이름 `fuel`은 그대로다. `sfx_fuel_low` 경고음도 새 "삐삐" 소리로 바꿨다.)
