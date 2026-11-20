# 탈것·장애물 그림 — 제미나이 프롬프트

Lane Dash의 차 그림을 요리조리 런 그림으로 바꾸기 위한 프롬프트입니다. 그림은 모두 10장입니다.
프롬프트 본문은 영어로 두었고(이미지 생성 품질이 더 안정적), 설명은 한국어입니다.
받은 그림은 `make-sprites.cjs`로 한 번에 다듬어 앱과 웹에 넣습니다(아래 4번).

## 0. 이 그림이 게임에서 쓰이는 방식 (프롬프트에 반영한 제약)

| 사실 | 프롬프트에 어떻게 반영했나 |
|---|---|
| 카메라가 **바로 뒤에서** 봅니다. 모든 그림은 정면 뒷모습이고 좌우 대칭에 가깝습니다. | `straight-on rear view, eye level, no perspective tilt` |
| 그림의 **가로 폭은 코드가 정하고**, 세로는 그림 비율을 따릅니다. 아래 끝이 바닥에 닿습니다. | 대상이 그림 폭을 꽉 채우게 합니다. 바닥선과 그림자는 넣지 않습니다(그림자는 코드가 그립니다). "ground line"이라고 쓰면 제미나이가 선을 그려 넣어서, 그리지 말라고 적었습니다. |
| 배경은 투명이어야 하는데 제미나이는 투명 배경을 잘 못 만듭니다. | **단색 마젠타(#FF00FF) 배경**을 요구하고, 스크립트가 그 색을 지웁니다. 그래서 그림 안에는 마젠타·분홍 계열을 쓰지 않습니다. |
| 지금 그림들은 또렷한 픽셀아트에 **얇은 크림색 테두리**가 있어 길 위에서 잘 보입니다. | 같은 테두리를 요구합니다. |
| 사람이 다치는 표현은 피합니다. | 장애물 속 사람은 평범하게 앞으로 가는 모습만 그립니다. |

## 1. 그림 목록 (파일 이름은 코드가 쓰는 이름 그대로)

| 파일 | 내용 | 결과 폭 | 비고 |
|---|---|---|---|
| `car_rear_1.png` | 내 탈것: 조깅 | 384px | 선택 화면 1번 |
| `car_rear_2.png` | 내 탈것: 자전거 | 384px | 2번 |
| `car_rear_3.png` | 내 탈것: 배달 전동 카트 (예전 리어카) | 384px | 3번. 세로로 긴 그림이어야 다른 탈것과 같은 높이로 보여요 |
| `car_rear_4.png` | 내 탈것: 킥보드 | 384px | 4번 |
| `traffic_rear_sedan.png` | 움직이는 장애물: 자전거 탄 사람 | 332px | 가장 자주 나옴 |
| `traffic_rear_suv.png` | 움직이는 장애물: 강아지 산책 | 332px | 자주 나옴 |
| `traffic_rear_bus.png` | 움직이는 장애물: 러닝 크루 | 332px | 가끔, 폭이 가장 넓음 |
| `traffic_rear_truck.png` | 움직이는 장애물: 배달 오토바이 | 332px | 가끔, 키가 큼 |
| `hw_barrier.png` | 멈춰 있는 장애물: 포트홀 | 444px | 게이트(한 칸만 빈 장애물 줄)에도 쓰임 |
| `hw_cone.png` | 멈춰 있는 장애물: 라바콘 | 357px | **지금 그림이 이미 라바콘이라 그대로 써도 됩니다** |

파일 이름 속 `sedan`, `bus` 같은 말은 Lane Dash에서 온 이름입니다. 그림만 바꾸고 이름은 그대로 둡니다.

## 2. 사용 방법

1. 제미나이에서 **이미지 생성**을 열고 **공통 스타일 블록**과 **그림별 블록 하나**를 이어 붙여 입력합니다.
2. 스타일을 맞추려면 지금 그림을 참고 이미지로 함께 첨부하세요: `web/assets/rear/traffic_rear_sedan.png` (자동차지만 그림체 참고용).
3. 비율은 **1:1**, 해상도는 가장 높게 선택합니다. 대상 주변의 마젠타 여백은 스크립트가 잘라 냅니다.
4. 마음에 드는 결과를 `design/sprites/gemini-originals/` 폴더에 **위 표의 파일 이름 그대로** 저장합니다(png, webp, jpg 모두 가능).
5. 아래 명령을 실행하면 배경을 지우고, 여백을 자르고, 폭을 맞춰 앱(`app/src/main/res/drawable-nodpi`)과 웹(`web/assets/rear`)에 함께 넣습니다. 폴더에 있는 파일만 처리하므로 몇 장씩 나눠 넣어도 됩니다.

```powershell
node design/sprites/make-sprites.cjs
```

먼저 결과만 보고 싶으면 `--dry`를 붙이세요. 이때는 앱·웹 폴더를 건드리지 않고 임시 폴더에만 저장합니다.

## 3. 공통 스타일 블록 (모든 그림 맨 앞에 붙입니다)

```text
Create a single game sprite, aspect ratio 1:1, highest resolution.

STYLE: clean, detailed 16-bit retro arcade pixel art, like a modern pixel-art racing game sprite. Crisp pixel edges, limited palette, simple cel shading with one light source from the upper left. A thin 2-pixel light cream (#F5EBD7) outline around the whole silhouette so it stands out on a path.

VIEW: straight-on REAR view from directly behind, at eye level, no perspective tilt, no three-quarter angle, nearly left-right symmetric. The subject is moving away from the camera.

FRAMING: exactly one subject, centered, filling about 85% of the image width. The lowest point of the subject (feet, wheels or base) is near the bottom edge. Do NOT draw any ground line, floor, shadow or scenery under or around it.

BACKGROUND: one perfectly flat solid magenta color #FF00FF everywhere around the subject, no gradient, no texture, no vignette. Do not use magenta, pink or purple anywhere on the subject itself.

DO NOT INCLUDE: any text, letters, numbers, logos, brand names, license plates, watermarks, UI, borders, frames, speech bubbles, motion lines, extra characters.
```

## 4. 그림별 블록 (공통 블록 뒤에 하나만 이어 붙입니다)

### `car_rear_1` — 내 탈것: 조깅

```text
SUBJECT: a cheerful young runner jogging away from the camera, seen from directly behind: sporty short ponytail or short hair, bright red running cap, sky-blue running T-shirt, black running shorts, white running shoes with neon soles, a small water bottle on a waist belt. Mid-stride but nearly symmetric pose, arms bent at the sides. Friendly, energetic, clearly the hero character.
```

### `car_rear_2` — 내 탈것: 자전거

```text
SUBJECT: a cyclist riding a city bicycle away from the camera, seen from directly behind: rider in a bright red helmet and sky-blue jersey, sitting upright, both hands on the handlebar. The rear wheel is centered and drawn as a thin upright ellipse, with a small red rear reflector under the saddle and a rear rack. The handlebar ends stick out slightly on both sides.
```

### `car_rear_3` — 내 탈것: 배달 전동 카트 (기록용, 2026-11-20에 인라인스케이트로 바뀜 → 7절의 `car_rear_3_frames`)

리어카는 가로로 넓고 낮은 그림이라, 모든 탈것을 같은 높이로 그리면 차선 폭 한도에 걸려 혼자 작아 보였습니다.
그래서 서서 타는 키 큰 배달 카트로 바꿉니다. 동네에서 음료를 배달하는 전동 카트 느낌이지만,
**특정 회사의 카트 모양·색 배합·로고는 따라 하지 않고** 일반적인 모양으로 그립니다.
결과는 **세로가 가로보다 1.8배 이상 긴** 그림이어야 다른 탈것과 크기가 맞습니다.

```text
SUBJECT: a cheerful delivery rider driving a small stand-up electric delivery cart away from the camera, seen from directly behind. The rider stands upright on a low platform at the back of the cart, holding a T-shaped handlebar in front: bright red cap, sky-blue jacket, dark pants, white sneakers — the rider's back is the center of the picture. In front of the rider (so it shows above and slightly beside the rider's shoulders) is a tall, narrow, rounded insulated cooler box in plain cream white with one thin pale-green stripe, no text, no logo. Small wheels at the bottom corners, a small round red tail light under the platform. The whole sprite is TALL AND NARROW: about twice as tall as it is wide, no wider than the rider's shoulders plus a little.
```

2026-11-20에 이 그림으로 바꾸고 게임 속 이름도 "배달 카트"로 바꿨습니다(`Model.kt`의 `displayName`, 웹 `catalog.js`의 `name`).

### `car_rear_4` — 내 탈것: 킥보드

```text
SUBJECT: a rider on a kick scooter (non-electric, two wheels, tall T-shaped handlebar) gliding away from the camera, seen from directly behind: rider standing on the narrow deck in a bright red helmet, sky-blue hoodie, dark pants and white sneakers, both hands on the handlebar grips which stick out on both sides. Small rear wheel with a red rear fender light at the bottom center.
```

### `traffic_rear_sedan` — 움직이는 장애물: 자전거 탄 사람

```text
SUBJECT: an ordinary commuter riding a city bicycle away from the camera, seen from directly behind: gray helmet, olive-green jacket, a dark backpack, rear basket or rack, thin rear wheel centered with a red rear reflector. Calm, everyday look — a background character, slightly less saturated than a hero.
```

### `traffic_rear_suv` — 움직이는 장애물: 강아지 산책

```text
SUBJECT: a person walking a medium-size dog away from the camera, seen from directly behind: the person in a mustard-yellow cardigan and blue jeans on the left half, holding a leash; a happy golden-brown dog with a wagging tail trotting on the right half, both walking on the same ground line. Calm, everyday look.
```

### `traffic_rear_bus` — 움직이는 장애물: 러닝 크루

```text
SUBJECT: a running crew of three runners side by side jogging away from the camera, seen from directly behind, shoulder to shoulder in a tight row that spans the whole width: matching teal-green crew T-shirts with a plain white stripe (no text), black shorts, colorful running shoes, different hairstyles and heights. Friendly group, nearly symmetric arrangement.
```

### `traffic_rear_truck` — 움직이는 장애물: 배달 오토바이

```text
SUBJECT: a delivery rider on a small scooter-type motorbike riding away from the camera, seen from directly behind: rider in a white helmet and dark navy jacket, a tall plain orange insulated delivery box mounted on the back (no text, no logo), round red tail light under the box, rear wheel centered, mirrors sticking out on both sides.
```

### `hw_barrier` — 멈춰 있는 장애물: 포트홀

```text
SUBJECT: a pothole in the paved path, seen from behind at a low angle so it appears as a wide, flat, irregular dark hole: cracked broken pavement edges, a few loose chunks of asphalt around it, a little muddy water at the bottom. Short and wide — about four times wider than tall. Surround it with a small low warning frame: two short yellow-and-black striped A-frame safety barriers standing at the left and right ends of the hole.
```

### `hw_cone` — 멈춰 있는 장애물: 라바콘 (선택)

지금 그림이 이미 라바콘이라 바꾸지 않아도 됩니다. 산책로 느낌으로 바꾸고 싶을 때만 쓰세요.

```text
SUBJECT: a single orange traffic cone with two white reflective stripes on a square black rubber base, seen from directly behind. No flashing light on top.
```

## 5. 결과 점검표 (받은 그림을 볼 때)

- [ ] 정면 뒷모습이다 (옆이나 비스듬히 보이지 않는다)
- [ ] 배경이 평평한 마젠타 한 가지 색이고, 대상 안에는 마젠타·분홍이 없다
- [ ] 대상이 하나이고, 발밑에 바닥선이나 그림자가 없다 (얇은 선은 스크립트가 지웁니다)
- [ ] 글자·숫자·로고·번호판이 없다 (배달 상자, 러닝 크루 티셔츠 포함)
- [ ] 얇은 크림색 테두리가 있다
- [ ] 내 탈것 4종은 빨간 모자·하늘색 옷으로 색이 통일돼 있다 (장애물과 바로 구분된다)

한 번에 마음에 드는 결과가 안 나오면, 점검표에서 어긋난 항목 한 줄만 프롬프트 끝에 덧붙여 다시 생성하는 편이 효과적입니다.
예) `The background must be one perfectly flat magenta #FF00FF with nothing else.`

## 6. 그림을 넣은 뒤 코드에서 맞출 것

장애물 그림의 화면 폭은 `TrafficKind`(`HighwayEngine.kt`)와 `TRAFFIC_KINDS`(`highway-engine.js`)의 `drawHalfWidth`가 정합니다.
충돌 범위(`halfWidth`)와는 따로라서, 그림 크기만 바꿔도 게임 난이도는 그대로입니다.
`heightFactor`는 그림의 세로/가로 비율로 맞춥니다(스크립트가 출력하는 값).
그림을 바꾸면 화면을 보고 사람 키가 비슷해지도록 `drawHalfWidth`를 앱·웹 같이 고칩니다.

스크립트는 제미나이 표시(오른쪽 아래 ✦) 같은 작은 조각과 발밑의 얇은 바닥선도 자동으로 지웁니다.

## 7. 2프레임 그림 (걷기·페달 움직임)

코드가 주는 움직임(튀기·흔들기)만으로는 팔다리가 그대로라서, 다리를 움직이는 캐릭터 6명은 **두 프레임**을 번갈아 보여 줍니다.
게임은 발이 땅에 닿는 순간(자전거는 페달이 반 바퀴 돌 때)에 프레임을 바꿉니다. 배달 오토바이는 다리가 움직이지 않아 한 장 그대로 씁니다.

두 프레임을 따로 생성하면 얼굴·옷·크기가 매번 달라져 깜빡거려 보입니다. 그래서 **한 장에 두 프레임을 나란히** 그리게 하고,
스크립트가 반으로 잘라 같은 크기·같은 발 위치로 맞춥니다.

| 원본 파일 (`gemini-originals/`) | 캐릭터 | 왼쪽 = 1프레임 | 오른쪽 = 2프레임 | 참고 이미지로 첨부 |
|---|---|---|---|---|
| `car_rear_1_frames.png` | 조깅 (내 탈것) | 왼발 앞, 오른발 뒤로 차올림 | 오른발 앞, 왼발 뒤로 차올림 | `web/assets/rear/car_rear_1.png` |
| `car_rear_2_frames.png` | 자전거 (내 탈것) | 왼쪽 페달 아래 | 오른쪽 페달 아래 | `web/assets/rear/car_rear_2.png` |
| `car_rear_3_frames.png` | 인라인스케이트 (내 탈것, 2026-11-20 배달 카트 대신) | 왼발로 밀고 오른발로 미끄러짐 | 오른발로 밀고 왼발로 미끄러짐 | `web/assets/rear/car_rear_1.png`(옷 색 참고) |
| `car_rear_4_frames.png` | 킥보드 (내 탈것) | 두 발 모두 보드 위 | 한 발로 땅을 구름 | `web/assets/rear/car_rear_4.png` |
| `traffic_rear_sedan_frames.png` | 자전거 탄 사람 | 왼쪽 페달 아래 | 오른쪽 페달 아래 | `web/assets/rear/traffic_rear_sedan.png` |
| `traffic_rear_suv_frames.png` | 강아지 산책 | 사람 왼발 앞, 강아지 앞다리 한쪽 앞 | 사람 오른발 앞, 강아지 다른 쪽 다리 앞 | `web/assets/rear/traffic_rear_suv.png` |
| `traffic_rear_bus_frames.png` | 러닝 크루 | 세 사람 왼발 앞 (가운데 사람만 반대여도 좋음) | 세 사람 반대 발 앞 | `web/assets/rear/traffic_rear_bus.png` |

받은 그림을 위 이름으로 `design/sprites/gemini-originals/`에 넣으면, `node design/sprites/make-sprites.cjs`가
`car_rear_1.png`(1프레임)과 `car_rear_1_b.png`(2프레임)처럼 두 장으로 나눠 앱·웹에 넣고, 웹이 쓸 목록(`web/js/sprite-frames.js`)도 만듭니다.
같은 이름의 한 장짜리 원본(`car_rear_1.png`)이 함께 있으면 2프레임 그림을 우선 씁니다.

### 2프레임 공통 블록 (아래 캐릭터별 블록 앞에 붙입니다)

```text
Create a 2-frame animation sprite sheet for a game, aspect ratio 16:9 (wide), highest resolution.

LAYOUT: exactly two frames side by side. The LEFT HALF is frame 1, the RIGHT HALF is frame 2. Each frame shows the same single character, centered in its own half, with empty space between the two frames. The character is the same size and stands at the same height in both frames, and the lowest point (feet or wheels) is on the same horizontal line in both frames.

CONSISTENCY (most important): match the attached reference sprite exactly — same person, same face and hair from behind, same clothes, colors, accessories, proportions and pixel style. Between the two frames, ONLY the legs (and pedals or the kicking foot) change. Head, torso, arms, vehicle body and colors are identical in both frames.

STYLE: clean, detailed 16-bit retro arcade pixel art. Crisp pixel edges, limited palette, simple cel shading with one light source from the upper left. A thin 2-pixel light cream (#F5EBD7) outline around each silhouette.

VIEW: straight-on REAR view from directly behind, at eye level, no perspective tilt, moving away from the camera.

BACKGROUND: one perfectly flat solid magenta color #FF00FF everywhere, no gradient, no texture, no ground line, no shadow, no scenery. Do not use magenta, pink or purple anywhere on the character.

DO NOT INCLUDE: any text, letters, numbers, frame labels, arrows, logos, watermarks, borders, dividing lines, extra characters.
```

### 캐릭터별 블록

`car_rear_1_frames` — 조깅
```text
CHARACTER: the jogger from the attached reference (red running cap, sky-blue T-shirt, black shorts, white running shoes with neon soles, small water bottle on a waist belt), running away from the camera.
FRAME 1: left foot forward and planted, right foot kicked up behind with the sole showing; right arm forward, left arm back.
FRAME 2: the mirror stride: right foot forward and planted, left foot kicked up behind with the sole showing; left arm forward, right arm back.
```

`car_rear_2_frames` — 자전거 (내 탈것)
```text
CHARACTER: the cyclist on a city bicycle from the attached reference (red helmet, sky-blue jersey), riding away from the camera, both hands on the handlebar.
FRAME 1: left pedal at the bottom with the left leg extended, right knee raised.
FRAME 2: right pedal at the bottom with the right leg extended, left knee raised. The bicycle itself does not move or change between frames.
```

`car_rear_3_frames` — 인라인스케이트 (참고 이미지는 조깅 그림을 옷 색 참고용으로)
```text
CHARACTER: a new hero character in the same team colors as the attached reference: an inline skater skating away from the camera, seen from directly behind: bright red helmet, sky-blue long-sleeve top, black leggings, black-and-white inline skates with four small wheels in a row and red wheels, small knee pads. Slim, upright, nearly as tall as the reference jogger. No backpack.
FRAME 1: pushing with the left skate: the left leg is extended out to the side and back, the right skate glides straight under the body with the knee slightly bent; the body leans a little to the right; the arms swing for balance.
FRAME 2: the mirror stride: pushing with the right skate out to the side and back, the left skate gliding under the body; the body leans a little to the left.
```

`car_rear_4_frames` — 킥보드
```text
CHARACTER: the kick-scooter rider from the attached reference (red helmet, sky-blue hoodie, dark pants, white sneakers), riding away from the camera, both hands on the handlebar.
FRAME 1: gliding: both feet on the narrow deck, one in front of the other.
FRAME 2: pushing off: the left foot stays on the deck, the right foot is down beside the scooter touching the ground mid-push. The scooter itself does not move between frames.
```

`traffic_rear_sedan_frames` — 자전거 탄 사람
```text
CHARACTER: the commuter cyclist from the attached reference (gray helmet, olive-green jacket, dark backpack, rear basket), riding away from the camera.
FRAME 1: left pedal at the bottom with the left leg extended, right knee raised.
FRAME 2: right pedal at the bottom with the right leg extended, left knee raised. The bicycle itself does not move between frames.
```

`traffic_rear_suv_frames` — 강아지 산책
```text
CHARACTER: the dog walker and the golden-brown dog from the attached reference (person in a mustard-yellow cardigan and blue jeans on the left, holding a leash; dog on the right), walking away from the camera.
FRAME 1: the person's left foot forward; the dog's front-left and back-right legs forward.
FRAME 2: the person's right foot forward; the dog's front-right and back-left legs forward. The dog's tail is wagged to the other side.
```

`traffic_rear_bus_frames` — 러닝 크루
```text
CHARACTER: the running crew of three from the attached reference (matching teal-green crew T-shirts with a plain white stripe, black shorts, colorful running shoes), jogging away from the camera side by side.
FRAME 1: the left and right runners have their left foot forward, the middle runner has the right foot forward (so the group doesn't look like marching soldiers).
FRAME 2: every runner on the opposite foot.
```
