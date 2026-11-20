# 효과음·배경음악 고르기 가이드

지금 들어 있는 소리 7개는 `synth-sounds.cjs`로 직접 합성한 칩튠입니다(2026-11-20).
이 가이드는 그중 일부를 **무료 사이트의 소리로 바꾸고 싶을 때** 씁니다.
마음에 드는 소리를 골라 `design/sounds/originals/`에 아래 이름으로 넣으면 `make-sounds.cjs`로 다듬어 앱과 웹에 넣습니다.
웹에 넣은 뒤에는 `web/js/audio.js`의 `SOUND_VERSION`을 올립니다.

## 1. 바꿀 소리 7개

| 파일 이름 | 언제 나나 | 지금 길이 | 이런 느낌이면 좋아요 | 검색어 (영어) |
|---|---|---|---|---|
| `sfx_lane` | 좌우로 한 칸 옮길 때 (아주 자주) | 0.04초 | 아주 짧고 가벼운 "탁"·"휙". 발소리나 바퀴 구르는 소리 한 번 | `whoosh short`, `swish`, `footstep`, `click soft` |
| `sfx_coin` | 생수병·방어막·자석을 주울 때 | 0.15초 | 밝고 짧은 "띵"·"뾰롱". 자전거 벨도 좋아요 | `pickup`, `collect`, `coin`, `bicycle bell` |
| `sfx_crash` | 장애물에 부딪힐 때 | 0.18초 | 다치는 느낌 없이 "뿅"·"퉁" 하고 튕기는 소리. 고무공·만화 효과음 | `bump cartoon`, `boing`, `bounce`, `pop` |
| `sfx_fuel_low` | 체력이 20% 아래로 떨어질 때 | 0.35초 | 숨찬 느낌의 짧은 경고. "삐삐"나 헥헥 | `low health`, `warning beep`, `alert soft` |
| `sfx_gameover` | 체력이 다 떨어졌을 때 | 0.64초 | 힘이 빠지는 "뿌우우" 내려가는 소리 | `game over`, `lose`, `fail jingle` |
| `sfx_newbest` | 최고 기록을 세웠을 때 | 0.42초 | 신나는 짧은 팡파르 | `win jingle`, `level up`, `success fanfare` |
| `bgm_loop` | 게임하는 동안 계속 반복 | 2.9초 | 밝고 경쾌한 칩튠·8비트, 처음과 끝이 자연스럽게 이어지는 곡 | `chiptune loop`, `8-bit happy loop`, `retro game music loop` |

- 같은 소리가 다른 일에도 쓰입니다. 차선 이동 소리는 높게 바꿔 **근접 회피**에, 줍기 소리는 낮게 바꿔 **방어막·자석**에, 부딪힘 소리는 높고 작게 바꿔 **방어막에 맞을 때**에 씁니다. 그래서 너무 특이하지 않은 소리가 좋아요.
- 길이는 지금보다 조금 길어도 괜찮아요. 스크립트가 앞뒤 빈 부분을 자르고 너무 긴 끝은 부드럽게 줄입니다.
- 배경음악은 짧아도 됩니다. 길면 앱 용량이 커지니 1분 이내를 추천합니다.

## 2. 어디서 찾나 (라이선스 꼭 확인)

| 사이트 | 라이선스 | 출처 표기 | 메모 |
|---|---|---|---|
| **Kenney** (kenney.nl/assets, "audio" 분류) | CC0 | 필요 없음 | 게임용 묶음이 많아요. *Interface Sounds*, *Impact Sounds*, *Music Jingles*, *Digital Audio* 추천. 파일은 OGG |
| **Freesound** (freesound.org) | 파일마다 다름 | CC0는 필요 없음, CC BY는 필요 | 검색 필터에서 **Creative Commons 0**만 고르면 편해요. 원본 WAV를 받을 수 있는 경우가 많아요 |
| **Pixabay** (pixabay.com/sound-effects, /music) | Pixabay Content License | 필요 없음 | 무료, 상업 이용 가능. 파일은 MP3 |
| **OpenGameArt** (opengameart.org) | 파일마다 다름 | 라이선스에 따라 | CC0·CC BY가 섞여 있어요 |

- **피해야 할 것**: "개인 용도만", "비상업", "NC"가 붙은 라이선스, 출처가 불분명한 유튜브 음원.
- 고른 소리의 **출처 주소와 라이선스**를 아래 `SOURCES.md` 표에 적어 주세요(주소만 남겨 주셔도 제가 채울게요). CC BY 소리는 앱의 `NOTICE.md`에 표기해야 합니다.

## 3. 파일 형식

- **WAV가 가장 좋아요.** 받을 때 고를 수 있으면 WAV로 받아 주세요.
- MP3·OGG도 괜찮아요. 다만 이 PC에는 변환 도구(ffmpeg)가 없어서, 그 파일들은 제가 따로 변환해서 넣을게요.

## 4. 스크립트가 하는 일 (`make-sounds.cjs`)

- 스테레오는 모노로 합치고, 샘플레이트를 맞춥니다(효과음 22,050Hz, 배경음악 32,000Hz).
- 효과음은 앞뒤 무음을 자르고, 너무 길면 끝을 부드럽게 줄입니다.
- **음량은 각 자리의 Lane Dash 소리와 같은 최대 음량(peak)으로 맞춥니다.** 차선 이동은 작게, 팡파르는 크게 하는 식의 균형이 그대로 유지돼요. (예전 소리는 8비트 사각파라 평균 음량이 최대치에 붙어 있어서, 평균으로 맞추면 녹음된 소리가 찌그러집니다.)
- 결과는 16비트 WAV로 앱(`app/src/main/res/raw`)과 웹(`web/assets/sfx`, `web/assets/bgm`)에 함께 넣습니다.
- 실행: `node design/sounds/make-sounds.cjs` (`--dry`를 붙이면 임시 폴더에만 저장).
