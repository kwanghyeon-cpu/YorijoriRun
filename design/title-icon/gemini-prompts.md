# 타이틀 화면·앱 아이콘 — 제미나이 프롬프트

홈 화면 배경 그림 1장과 앱 아이콘 그림 1장을 만들기 위한 프롬프트입니다.
프롬프트 본문은 영어로 두었고(이미지 생성 품질이 더 안정적), 설명은 한국어입니다.
받은 그림은 `make-title-icon.cjs`로 다듬어 앱과 웹에 넣습니다(아래 4번).

## 0. 이 그림들이 쓰이는 방식 (프롬프트에 반영한 제약)

### 타이틀 화면 (`home_portrait.png`)

| 사실 | 프롬프트에 어떻게 반영했나 |
|---|---|
| 세로 1080×2160(1:2) 그림 한 장이 화면을 꽉 채우고, 기기 비율에 따라 **위아래가 잘립니다**. | 중요한 것은 세로 15~92% 안에 둡니다. 제미나이는 9:16으로 받고 스크립트가 좌우를 조금 잘라 1:2로 맞춥니다. |
| "요리조리 런" 로고(`design/title-icon/logo`에서 따로 디자인)·부제·최고 기록은 **코드가 위쪽 약 8~38%에**, 작은 PLAY 버튼은 **맨 아래 약 86~95%에** 올립니다. 제미나이는 한글을 잘 못 그립니다. | 위쪽 40%는 하늘과 먼 도시만, 맨 아래 14%는 빈 길만 둡니다. **글자는 넣지 않습니다.** |
| 게임 속 길에는 차선 표시가 없습니다. | 길에 점선·차선을 그리지 않습니다. |
| 위아래에 코드가 어두운 그라데이션을 깝니다. | 그림 자체는 밝고 선명해도 됩니다. |
| 게임 그림체는 또렷한 픽셀아트이고, 주인공들은 빨간 모자·헬멧과 하늘색 옷입니다. | 가운데 아래(48~84%)에 네 탈것(조깅·자전거·인라인·킥보드)을 게임 속 그림과 같은 모습의 뒷모습으로 둡니다. 게임 그림 4장을 참고 이미지로 함께 넣습니다. |

### 앱 아이콘

| 사실 | 프롬프트에 어떻게 반영했나 |
|---|---|
| 안드로이드 적응형 아이콘은 **배경 층**과 **그림 층**으로 나뉩니다. 배경은 지금의 보라색 그라데이션을 그대로 씁니다. | 그림 층만 **마젠타(#FF00FF) 단색 배경** 위에 받고, 스크립트가 배경을 지웁니다. |
| 기기마다 아이콘을 원·둥근 사각형 등으로 잘라서, 가운데 원(지름의 약 60%)만 항상 보입니다. | 대상 하나를 가운데에 크게, 단순한 실루엣으로 그립니다. 스크립트가 안전 영역 안으로 줄여 넣습니다. |
| Android 13 이상의 테마 아이콘은 그림 층의 **모양만** 써서 한 가지 색으로 칠합니다. | 테두리가 분명한 하나의 덩어리 모양이 되게 합니다. |
| 홈 화면 아이콘은 작게(약 48dp) 보입니다. | 디테일을 줄이고 큰 색 덩어리와 굵은 외곽선으로 그립니다. |

## 1. 사용 방법

1. 제미나이에서 **이미지 생성**을 열고 아래 블록을 그대로 입력합니다(타이틀과 아이콘은 따로 생성).
2. 타이틀은 게임 속 네 캐릭터와 똑같이 보이도록 참고 이미지 4장을 함께 첨부하세요: `web/assets/rear/car_rear_1.png`(조깅), `car_rear_2.png`(자전거), `car_rear_3.png`(인라인), `car_rear_4.png`(킥보드). 배경 톤은 `web/assets/cities/city_seoul.png`를 더해도 좋아요. 아이콘은 `car_rear_1.png`만.
3. 비율은 타이틀 **9:16(세로)**, 아이콘 **1:1**, 해상도는 가장 높게 선택합니다.
4. 마음에 드는 결과를 `design/title-icon/gemini-originals/` 폴더에 아래 이름으로 저장합니다(png, webp, jpg 모두 가능).
   - 타이틀: `home_portrait.png`
   - 아이콘: `app_icon.png`
5. 저장해 두시면 제가 가공해서 넣을게요. 직접 실행할 때는 아래 명령입니다(`--dry`를 붙이면 임시 폴더에만 저장).

```powershell
node design/title-icon/make-title-icon.cjs
```

## 2. 타이틀 화면 프롬프트

```text
Create a tall vertical mobile game title screen background, aspect ratio 9:16 (portrait), highest resolution.

STYLE: clean, detailed 16-bit retro arcade pixel art, bright and cheerful, like a modern pixel-art game. Crisp pixel edges, limited palette, simple cel shading. Match the pixel style and the four characters of the attached sprite references exactly.

SCENE: a warm sunset over a city riverside walking path, seen from behind and slightly above. The path runs straight away from the viewer to a vanishing point. It is a plain red-brown rubber (urethane) jogging track with NO lane lines, no dashes and no markings, pale stone curbs on both sides, green grass and small round bushes beside it, and short park lamps with round glowing globes along the edges. Far away on the horizon: a soft, low, slightly hazy Seoul-like skyline (Namsan tower silhouette, one tall slim tower, apartment blocks) with a river glint, under a warm purple-to-orange gradient sky with a few flat pixel clouds.

THE FOUR CHARACTERS (copy the attached references; all seen from directly behind, moving away from the viewer, side by side, each in its own part of the path, all about the same height):
1. a jogger mid-stride: short dark hair under a red cap, sky-blue T-shirt, black shorts, small waist belt with a water bottle, white running shoes with neon-green soles, one foot kicked up behind;
2. a cyclist on a city bicycle: red helmet, sky-blue jersey, black backpack, front basket, legs pedalling;
3. an inline skater mid-push: red helmet, sky-blue long-sleeve top, black leggings, knee pads, black-and-white inline skates with red wheels, one leg pushing out to the side;
4. a kick-scooter rider: red helmet, sky-blue hoodie, black backpack, dark pants, standing on the narrow deck with both hands on the handlebar.
Energetic, playful, mid-motion, nobody falling.

COMPOSITION (very important, vertical positions from the top of the image):
- 0%-40%: sky and the far skyline only, calm and low in detail, with the horizon at about 40%. Leave this area open: the game logo will be drawn on top of it later.
- 40%-48%: the far part of the walking path, empty.
- 48%-84%: the four characters, their feet at about 80%-84%.
- 84%-100%: just the near path in front of them, empty and plain: a button will be drawn on top of it later.
- Keep everything important within the central 88% of the width; the sides may be cropped.

DO NOT INCLUDE: any text, letters, numbers, logos, titles, signage letters, watermarks, UI, buttons, borders, frames; cars, delivery carts or other traffic; lane lines; anyone falling or getting hurt; photo-realism or 3D render look.
```

## 3. 앱 아이콘 프롬프트

```text
Create a single app icon character illustration, aspect ratio 1:1, highest resolution.

SUBJECT: a cheerful runner dashing and dodging, seen from a three-quarter back view, leaning into a quick side-step: bright red running cap, sky-blue T-shirt, black shorts, white running shoes with neon soles, a small water bottle on a waist belt. A few short bold speed streaks behind the runner in warm yellow #FFC93C to show the zig-zag dodge.

STYLE: bold, simple, chunky 16-bit pixel art designed to read at very small sizes: few large color areas, minimal detail, a thick dark outline around the whole silhouette and a thin cream (#F5EBD7) outer outline. Friendly and playful.

FRAMING: the character and streaks form one compact shape, centered, filling about 70% of the image. Nothing touches the edges.

BACKGROUND: one perfectly flat solid magenta color #FF00FF everywhere around the subject, no gradient, no texture, no shadow, no ground. Do not use magenta, pink or purple anywhere on the subject.

DO NOT INCLUDE: any text, letters, numbers, logos, watermarks, borders, frames, rounded-square icon backgrounds, extra characters.
```

## 4. 결과 점검표

타이틀
- [ ] 위쪽 약 30%가 하늘과 먼 도시뿐이다 (로고 자리)
- [ ] 가운데 아래(55~75%)가 단순한 길이다 (버튼 자리)
- [ ] 네 캐릭터가 아래쪽에 뒷모습으로 있고, 모두 빨간 모자·하늘색 옷이다
- [ ] 글자·간판 글씨·자동차가 없다

아이콘
- [ ] 배경이 평평한 마젠타 한 가지 색이다 (둥근 사각형 바탕 같은 것이 없다)
- [ ] 캐릭터가 하나의 덩어리 모양이고, 작게 줄여도 알아볼 수 있다
- [ ] 글자가 없다

한 번에 마음에 드는 결과가 안 나오면, 점검표에서 어긋난 항목 한 줄만 프롬프트 끝에 덧붙여 다시 생성하는 편이 효과적입니다.
예) `Leave the top third of the image as open sky with nothing but a distant low skyline.`

## 5. 가공 스크립트가 하는 일

- 타이틀: 가운데를 기준으로 좌우를 잘라 1:2로 맞추고, 1080×2160으로 줄여 앱(`res/drawable-nodpi/home_portrait.png`)과 웹(`web/assets/ui/home_portrait.png`)에 넣습니다.
- 아이콘: 마젠타 배경과 제미나이 별 표시(✦)를 지우고, 그림을 적응형 아이콘의 안전 영역(512px 그림에서 반지름 154px 원) 안에 맞춰 `res/drawable-nodpi/ic_launcher_foreground.png`로 넣습니다. 배경 층(`ic_launcher_background.png`, 보라색 그라데이션)은 그대로 둡니다.
  스토어용 512×512 아이콘(배경 + 그림)은 `design/icon/store_icon_512.png`로 만듭니다.
- 타이틀 오른쪽 아래의 제미나이 별 표시(✦)도 주변 색으로 채워 지웁니다.
- 홈 화면의 PLAY 버튼은 앱·웹 모두 부제 바로 아래(위쪽 약 1/3)에 있어서, 캐릭터가 화면 가운데~아래에 있어도 가리지 않습니다.
