# Path Dash — 새 게임 준비 체크리스트

Lane Dash(하이웨이 3.0.5)를 복제해서 만든 새 프로젝트입니다. 게임 엔진·조작·난이도·광고/순위표 구조는 그대로이고,
이름과 계정 연결만 분리해 둔 상태입니다. "Path Dash"는 **임시 이름**입니다.

## 이름 바꾸기 (출시 전, 한 번에)
패키지명은 스토어에 올린 뒤에는 바꿀 수 없습니다. 이름이 정해지면 아래 한 줄로 패키지·클래스·표시 이름·저장 키를 모두 바꿉니다.

```
node tools/rename-project.cjs PathDash 새이름 "Path Dash" "새 이름"
```

## 이미 분리해 둔 것
- **패키지**: `com.khcompany.pathdash` (Lane Dash와 별개의 앱)
- **버전**: 0.1.0 (versionCode 1)
- **광고**: Lane Dash의 실제 AdMob ID를 지우고 Google 샘플 ID로 바꿔 둠 (`AndroidManifest.xml`, `ads/AdManager.kt`)
- **순위표**: 컬렉션을 `scores_pathdash`로 분리 (앱·웹), `firestore.rules`도 이 컬렉션만 열도록 정리
- **웹 저장 키**: `path_dash_*` (같은 github.io 도메인에서 Lane Dash 기록과 섞이지 않음)

## 직접 해 주셔야 하는 것 (계정 작업)
1. **Firebase**: 프로젝트 콘솔에서 Android 앱 `com.khcompany.pathdash`를 등록하고 `google-services.json`을 받아 `app/`에 넣기.
   지금 `app/google-services.json`은 빌드만 되게 만든 **임시 파일**입니다(로컬 전용, 커밋 안 됨).
   같은 Firebase 프로젝트(lanedash-2cc5d)를 쓰셔도 되고 새 프로젝트를 만드셔도 됩니다.
2. **Firestore 규칙**: `firestore.rules`의 `scores_pathdash` 블록을 콘솔 규칙에 추가해 게시하기.
   같은 Firebase 프로젝트를 쓰신다면 Lane Dash의 기존 블록(`scores`, `scores_highway`)은 **지우지 말고 함께 두세요.**
   게시 전까지는 이 게임의 순위표가 "권한 없음"으로 실패합니다(의도된 안전장치).
3. **AdMob**: 새 앱 등록 → 앱 ID(`~`)와 전면·보상형 광고 단위 ID(`/`)를 받아서 위 두 파일의 샘플 ID 교체.
   `app-ads.txt`는 개발자 사이트에 이미 있으면 그대로 됩니다.
4. **Play Console**: 새 앱 만들기, 스토어 등록정보, 콘텐츠 등급, 개인정보처리방침 주소(`privacy-policy.md` 내용 확인).
   개인 개발자 계정은 새 앱마다 비공개 테스트 요건이 있을 수 있으니 콘솔에서 확인.
5. **서명**: 릴리스 서명은 `keystore.properties`(커밋 안 됨)로 합니다. Lane Dash의 업로드 키를 재사용해도 되고 새로 만들어도 됩니다.
6. **GitHub / 웹**: 새 저장소를 만들어 푸시하고 Pages를 켜면 공유 링크(`WEB_PLAY_URL`)가 살아납니다.
   지금은 `https://kwanghyeon-cpu.github.io/PathDash/web/`로 가정해 두었습니다.

## 교체할 그림·소리 (지금은 Lane Dash 것을 임시로 사용)
| 파일 | 새 내용 |
|---|---|
| `car_rear_1..4.png` (앱 `drawable-nodpi`, 웹 `assets/rear`) | 조깅·자전거·리어카·킥보드 (뒷모습, 순서대로 1~4) |
| `traffic_rear_*.png` (움직이는 장애물 4칸, 같은 방향으로 가는 뒷모습) | 자전거·강아지 산책·배달 오토바이·러닝 크루 |
| `hw_cone.png`, `hw_barrier.png` (멈춰 있는 장애물 2칸) | 후보: 벤치·포트홀·라바콘·공사 울타리 (2칸에 넣을 2개를 고르거나 칸을 늘림) |
| `city_*.png` | 그대로 써도 됨 (길 건너편 도시) |
| `home_portrait.png`, 앱 아이콘 | 새 타이틀 화면, 새 아이콘 |
| 효과음 (`res/raw`, `web/assets`) | 발소리·자전거 벨 등 |

코드 쪽 남은 일: 없음(그림·소리 교체만 남음).
(문구 정리·속도계도 끝남. 탈것 이름은 조깅·자전거·리어카·킥보드, 속도계는 15~25 km/h, 게임오버는 "부딪혔어요".)
(도로 → 산책로는 끝남. 도시별 길 색: 서울 적갈색 우레탄, 도쿄 남색, 뉴욕 회청색, 파리 모래색. 연석은 회색 경계석, 가로등은 낮은 공원 등.)
(연료 → 체력(생수병)은 끝남. 화면 문구·아이콘·게이지만 바꿨고 엔진 이름 `fuel`은 그대로다. `sfx_fuel_low` 경고음은 효과음 교체 때 같이 바꾼다.)
