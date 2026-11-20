// Behind-the-car "highway" mode — the drawing half. Ported from ui/screens/HighwayScreen.kt and
// HighwayFx.kt. Needs highway-engine.js and art.js (drawCitySkylineSprite, drawRoadHaze,
// drawGroundShadow, hexA, updateFxQuality / fxState) to be loaded first.

const HW_STRIPE_LENGTH = 1;

// The path has no lane markings (a walking path, not a road); the five lanes are only in the game
// logic. The light/dark bands across the path still show the speed.
const HW_GRASS = '#2E7D32';
const HW_GRASS_DARK = '#276B2A';
// The path's edge is a pale stone curb in two shades (Lane Dash had red-and-white racing kerbs).
const HW_CURB_LIGHT = '#DCD5C8';
const HW_CURB_SHADE = '#B9B0A1';
/** Scale applied to the road layer so its vibration never exposes an empty edge. */
const HW_SHAKE_ZOOM = 1.02;
const HW_MAX_LEAN_DEGREES = 4;
const HW_VIGNETTE_MAX_ALPHA = 0.5;
/** Pickup badge radius, in road half-widths at the same depth. */
const HW_ITEM_RADIUS = 0.17;

const hwStrips = new RoadStrips();

/** Blends two #RRGGBB colors; t = 0 gives a, t = 1 gives b. */
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

const HW_ROADSIDE_SPACING = 5;
/** Lateral position (road half-widths) of lamp posts and bushes, just outside the rumble strip. */
const HW_LAMP_LATERAL = 1.34;
const HW_BUSH_LATERAL = 1.62;

/**
 * Park lamps on one side and bushes on the other, alternating, scrolling past at the road's own
 * pace — nothing tells you how fast you are going like objects whizzing by at the edge. Drawn
 * before the road haze so far ones fade into it.
 */
function drawHighwayRoadside(ctx, w, h, cameraZ, horizonY, rowH, city) {
  const roadH = h - horizonY;
  const posts = new Path2D();
  const lamps = new Path2D();
  const bushes = new Path2D();
  const firstIndex = Math.floor(cameraZ / HW_ROADSIDE_SPACING) + 1;
  const slots = Math.floor(HW_DRAW_DISTANCE / HW_ROADSIDE_SPACING) + 1;
  for (let n = slots; n >= 0; n--) { // far to near
    const index = firstIndex + n;
    const dz = index * HW_ROADSIDE_SPACING - cameraZ;
    if (dz < HW_D0 || dz > HW_DRAW_DISTANCE) continue;
    const t = tForDz(dz);
    const y = horizonY + roadH * t;
    const hw = roadHalfWidth(t, w);
    const cx = hwStrips.centerXAt(y, h, rowH);
    const lampSide = index % 2 === 0 ? -1 : 1;

    const postW = Math.max(1, hw * 0.035);
    // Posts and bushes shrink with distance faster than the (wide) far road does.
    const objScale = 0.35 + 0.65 * t;
    // A short park lamp: a post with a round globe on top (no arm reaching over the path).
    const postH = hw * 0.9 * objScale;
    const lampX = cx + lampSide * HW_LAMP_LATERAL * hw;
    posts.rect(lampX - postW / 2, y - postH, postW, postH);
    const globeR = Math.max(1, hw * 0.06 * objScale);
    lamps.moveTo(lampX + globeR, y - postH - globeR * 0.6);
    lamps.arc(lampX, y - postH - globeR * 0.6, globeR, 0, Math.PI * 2);

    const bushR = hw * 0.16 * objScale;
    const bushX = cx - lampSide * HW_BUSH_LATERAL * hw;
    bushes.moveTo(bushX + bushR * 1.3, y - bushR * 0.75);
    bushes.ellipse(bushX, y - bushR * 0.75, bushR * 1.3, bushR * 0.75, 0, 0, Math.PI * 2);
  }
  ctx.fillStyle = mixHex('#1F5E27', city.haze, 0.2);
  ctx.fill(bushes);
  ctx.fillStyle = mixHex('#3A3F4B', city.haze, 0.15);
  ctx.fill(posts);
  ctx.fillStyle = '#FFE9A8';
  ctx.fill(lamps);
}

const HW_SPEED_LINE_COUNT = 14;

/**
 * Streaks rushing outward from near the vanishing point, only once you are well past cruising
 * speed (speedRatio 0..1 of the top speed), so the top end feels different from the start.
 */
function drawHighwaySpeedLines(ctx, w, h, speedRatio, elapsedSeconds, focalY) {
  const strength = Math.min(1, Math.max(0, (speedRatio - 0.6) / 0.4));
  if (strength <= 0.02) return;
  const cx = w / 2;
  const maxR = Math.hypot(cx, h - focalY);
  const stroke = Math.max(2, w * 0.0035);
  ctx.lineCap = 'butt';
  for (let i = 0; i < HW_SPEED_LINE_COUNT; i++) {
    const phase = (elapsedSeconds * 1.9 + i * 0.371) % 1;
    const side = i % 2 === 0 ? 1 : -1;
    const spread = (((i * 53) % 100) / 100 - 0.5) * 1.7; // ~ -49..49 degrees in radians
    const dirX = side * Math.cos(spread);
    const dirY = Math.sin(spread);
    const r0 = maxR * (0.28 + 0.62 * phase);
    const r1 = r0 + maxR * (0.04 + 0.14 * phase);
    ctx.strokeStyle = `rgba(255,255,255,${(strength * 0.42 * phase).toFixed(3)})`;
    ctx.lineWidth = stroke * (0.6 + phase);
    ctx.beginPath();
    ctx.moveTo(cx + dirX * r0, focalY + dirY * r0);
    ctx.lineTo(cx + dirX * r1, focalY + dirY * r1);
    ctx.stroke();
  }
}

// Procedural "alive" motion so riders bob and sway instead of sliding like paper cut-outs. Drawing
// only: the engine, hitboxes and lanes are untouched. Mirrors HighwayMotion.kt — change both together.
// frame: 0 = the main sprite, 1 = its second animation frame (SPRITE_FRAME_B in sprite-frames.js).
const STILL_POSE = { lift: 0, scaleX: 1, scaleY: 1, tilt: 0, frame: 0 };
const RIDE_MOTION = { jogging: 'RUN', bicycle: 'BIKE', kickboard: 'KICK', inline: 'SKATE' };
const TRAFFIC_MOTION = { SEDAN: 'BIKE', SUV: 'RUN', BUS: 'RUN', TRUCK: 'MOTOR', CONE: 'NONE', BARRIER: 'NONE' };

/**
 * The pose at `seconds` of game time: lift (fraction of sprite height), squash about the bottom
 * center, and tilt in degrees about the same point. `cadence` scales the rhythm; `phase` (0..1)
 * keeps neighbours from moving in lockstep.
 */
function riderPose(style, seconds, cadence, phase) {
  const tau = Math.PI * 2;
  switch (style) {
    case 'RUN': {
      // One bounce per step; the body sways toward the planted foot (tilt flips every step).
      const steps = seconds * 2.7 * cadence + phase * 2;
      const air = Math.abs(Math.sin(Math.PI * steps));
      const land = Math.pow(1 - air, 3);
      // The legs swap at each landing, in step with the bounce.
      return { lift: 0.05 * air, scaleX: 1 + 0.04 * land, scaleY: 1 - 0.06 * land, tilt: 3.2 * Math.sin(Math.PI * steps), frame: Math.floor(steps) & 1 };
    }
    case 'BIKE': {
      const turns = seconds * 1.4 * cadence + phase;
      const crank = tau * turns;
      // The other pedal comes down every half turn.
      return { lift: 0.01 * Math.abs(Math.sin(crank)), scaleX: 1, scaleY: 1, tilt: 3.5 * Math.sin(crank), frame: Math.floor(turns * 2) & 1 };
    }
    case 'KICK': {
      const cycle = seconds * 0.8 * cadence + phase;
      const u = cycle - Math.floor(cycle);
      const push = u < 0.25 ? Math.sin(Math.PI * u / 0.25) : 0;
      // The pushing foot is down only during the push.
      return { lift: 0.035 * push, scaleX: 1, scaleY: 1 + 0.02 * push, tilt: -2.2 * push + 0.8 * Math.sin(tau * cycle), frame: push > 0 ? 1 : 0 };
    }
    case 'SKATE': {
      // Inline skating: long alternating pushes, a big lean over the gliding leg (flips every
      // stride), a touch of rise mid-glide, and the legs swap each stride.
      const strides = seconds * 1.3 * cadence + phase * 2;
      const glide = Math.abs(Math.sin(Math.PI * strides));
      return { lift: 0.012 * glide, scaleX: 1, scaleY: 1, tilt: 5 * Math.sin(Math.PI * strides), frame: Math.floor(strides) & 1 };
    }
    case 'MOTOR': {
      const t = seconds + phase * 10;
      return { lift: 0.006 * (0.5 + 0.5 * Math.sin(tau * 13 * t)), scaleX: 1, scaleY: 1, tilt: 1.2 * Math.sin(tau * 1.1 * cadence * t), frame: 0 };
    }
    default:
      return STILL_POSE;
  }
}
/** The image for a pose: the second frame when the pose asks for it and that frame has loaded. */
function frameImage(images, path, pose) {
  const second = pose.frame === 1 && typeof SPRITE_FRAME_B !== 'undefined' && SPRITE_FRAME_B[path];
  const img = second && images[second];
  return img && img.complete && img.naturalWidth ? img : images[path];
}
function motionPhase(id) { const x = id * 0.6180339; return x - Math.floor(x); }
function trafficCadence(speed) { return Math.min(1.25, Math.max(0.7, 0.8 + 0.4 * (speed - 6) / 7)); }
function playerCadence(speedRatio) { return 0.85 + 0.4 * Math.min(1, Math.max(0, speedRatio)); }

/** Rear-view sprite, bottom-anchored; the height follows the image's own aspect ratio. */
function drawHighwayRearSprite(ctx, img, cx, bottomY, width, leanRadians, fallbackColor, pose = STILL_POSE) {
  if (!img || !img.complete || img.naturalWidth === 0) {
    const height = width * 0.8;
    drawGroundShadow(ctx, cx, bottomY, width, height);
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(cx - width / 2, bottomY - height, width, height);
    return;
  }
  const height = width * img.naturalHeight / img.naturalWidth;
  // The shadow stays on the ground; it shrinks and fades a little while the rider is in the air.
  const air = Math.min(0.2, Math.max(0, pose.lift));
  drawGroundShadow(ctx, cx, bottomY, width * (1 - 2 * air), height, 0.38 * (1 - 4 * air));
  // Leaning and the pose's rock pivot on the contact line; the hop lifts the sprite off its shadow;
  // the squash keeps the feet on the ground.
  ctx.save();
  ctx.translate(cx, bottomY);
  ctx.rotate(leanRadians + pose.tilt * Math.PI / 180);
  ctx.translate(0, -air * height);
  ctx.scale(pose.scaleX, pose.scaleY);
  ctx.drawImage(img, -width / 2, -height, width, height);
  ctx.restore();
}

let hwVignette = { key: '', gradient: null };

/** Tunnel vision: the screen edges darken as the speed climbs. */
function drawHighwayVignette(ctx, w, h, speedRatio) {
  const alpha = Math.min(1, Math.max(0, (speedRatio - 0.5) / 0.5)) * HW_VIGNETTE_MAX_ALPHA;
  if (alpha <= 0.01) return;
  const key = `${w}x${h}`;
  if (hwVignette.key !== key) {
    const g = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, Math.hypot(w, h) * 0.55);
    g.addColorStop(0.5, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    hwVignette = { key, gradient: g };
  }
  ctx.globalAlpha = alpha;
  ctx.fillStyle = hwVignette.gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

/** Draws one full highway frame. `images` maps sprite path -> HTMLImageElement. */
function drawHighwayFrame(ctx, w, h, engine, city, car, images) {
  const horizonY = h * HW_HORIZON_FRACTION;
  const roadH = h - horizonY;
  const rowH = Math.max(3, roadH / 110);
  const speedRatio = Math.min(1, Math.max(0, engine.speed / HW.MAX_SPEED));
  const fancy = !fxState.low;

  // Road vibration: grows with speed. The slight zoom
  // keeps the shifted frame from showing an empty edge.
  const amplitude = h * 0.0009 * speedRatio * speedRatio;
  const shakeY = (Math.sin(engine.z * 1.7) * 0.6 + Math.sin(engine.z * 4.1) * 0.4) * amplitude;
  ctx.save();
  ctx.translate(w / 2, h / 2 + shakeY);
  ctx.scale(HW_SHAKE_ZOOM, HW_SHAKE_ZOOM);
  ctx.translate(-w / 2, -h / 2);

  // The road first: the skyline reads its bend (see skylineScroll).
  hwStrips.compute(engine.z, w, horizonY, h, rowH, HW_STRIPE_LENGTH);
  const drewSky = drawCitySkylineSprite(ctx, images[city.sprite], w, horizonY, skylineScroll(hwStrips, w), 1);
  if (!drewSky) {
    const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
    grad.addColorStop(0, city.skyTop);
    grad.addColorStop(1, city.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, horizonY);
  }

  ctx.fillStyle = mixHex(HW_GRASS, city.haze, 0.2);
  ctx.fillRect(0, horizonY, w, roadH);

  const darkGrass = new Path2D();
  const roadLight = new Path2D();
  const roadDark = new Path2D();
  const rumbleRed = new Path2D();
  const rumbleWhite = new Path2D();
  for (let i = 0; i < hwStrips.count; i++) {
    const top = hwStrips.yTop[i];
    const height = hwStrips.yBottom[i] + 0.5 - top;
    const cx = hwStrips.centerX[i];
    const hw = hwStrips.halfWidth[i];
    const odd = hwStrips.band[i] === 1;
    if (odd) darkGrass.rect(0, top, w, height);
    const rumble = hw * 0.14;
    const rumblePath = odd ? rumbleWhite : rumbleRed;
    rumblePath.rect(cx - hw - rumble, top, rumble, height);
    rumblePath.rect(cx + hw, top, rumble, height);
    (odd ? roadDark : roadLight).rect(cx - hw, top, hw * 2, height);
  }
  ctx.fillStyle = mixHex(HW_GRASS_DARK, city.haze, 0.2);
  ctx.fill(darkGrass);
  ctx.fillStyle = HW_CURB_SHADE;
  ctx.fill(rumbleRed);
  ctx.fillStyle = HW_CURB_LIGHT;
  ctx.fill(rumbleWhite);
  ctx.fillStyle = mixHex(city.roadColor, '#FFFFFF', 0.10);
  ctx.fill(roadLight);
  ctx.fillStyle = mixHex(city.roadColor, '#FFFFFF', 0.05);
  ctx.fill(roadDark);

  drawHighwayRoadside(ctx, w, h, engine.z, horizonY, rowH, city);
  if (fancy) {
    drawRoadHaze(ctx, city, w, horizonY, roadH);
    drawHighwaySpeedLines(ctx, w, h, speedRatio, engine.elapsedSeconds, horizonY + roadH * 0.2);
  }

  // Pickups, far to near; they hover just above the road with a small shadow.
  const itemsFarToNear = engine.items.slice().sort((a, b) => b.z - a.z);
  for (const item of itemsFarToNear) {
    const dz = item.z - engine.z;
    if (dz < 1 || dz > HW_DRAW_DISTANCE) continue;
    const t = tForDz(dz);
    const y = horizonY + roadH * t;
    const half = roadHalfWidth(t, w);
    const pulse = 1 + 0.08 * Math.sin(engine.elapsedSeconds * 6 + item.id);
    const radius = HW_ITEM_RADIUS * half * pulse;
    const cx = hwStrips.centerXAt(y, h, rowH) + item.lx * half;
    ctx.save();
    ctx.globalAlpha = fadeForDz(dz);
    const color = item.type === 'FUEL' ? WATER_ITEM_COLOR : item.type === 'SHIELD' ? SHIELD_ITEM_COLOR : MAGNET_ITEM_COLOR;
    // A pickup must never be mistaken for a car: a pad ringed on the road, a halo, a white rim and
    // a gentle bob — none of which a vehicle or an obstacle has.
    ctx.strokeStyle = hexA(color, 0.85);
    ctx.lineWidth = Math.max(2, radius * 0.14);
    ctx.beginPath();
    ctx.ellipse(cx, y, radius * 1.5, radius * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    const cy = y - radius * 1.35 + Math.sin(engine.elapsedSeconds * 4 + item.id) * radius * 0.12;
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.3);
    halo.addColorStop(0, hexA(color, 0.6));
    halo.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2.3, 0, Math.PI * 2);
    ctx.fill();
    if (item.type === 'FUEL') drawWaterBottleItem(ctx, cx, cy, radius);
    else if (item.type === 'SHIELD') drawShieldItem(ctx, cx, cy, radius);
    else drawMagnetItem(ctx, cx, cy, radius);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(1.5, radius * 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Traffic, far to near so closer cars paint over farther ones.
  const sorted = engine.traffic.slice().sort((a, b) => b.z - a.z);
  for (const traffic of sorted) {
    const dz = traffic.z - engine.z;
    if (dz < 1 || dz > HW_DRAW_DISTANCE) continue;
    const t = tForDz(dz);
    const y = horizonY + roadH * t;
    const half = roadHalfWidth(t, w);
    const width = traffic.kind.drawHalfWidth * 2 * half;
    const cx = hwStrips.centerXAt(y, h, rowH) + traffic.lx * half;
    ctx.save();
    ctx.globalAlpha = fadeForDz(dz);
    const pose = riderPose(TRAFFIC_MOTION[traffic.kind.name], engine.elapsedSeconds, trafficCadence(traffic.speed), motionPhase(traffic.id));
    drawHighwayRearSprite(ctx, frameImage(images, traffic.kind.sprite, pose), cx, y, width, 0, traffic.kind.color, pose);
    ctx.restore();
  }

  // The road is fixed at the bottom of the screen: the car moves across it.
  const playerY = horizonY + roadH * HW_PLAYER_T;
  const playerHalf = roadHalfWidth(HW_PLAYER_T, w);
  const playerCx = hwStrips.centerXAt(playerY, h, rowH) + engine.playerX * playerHalf;
  // Every ride is drawn the same height; a wide sprite is capped to its lane and keeps its shape.
  const playerImg = images[car.rearSprite];
  const playerAspect = playerImg && playerImg.naturalWidth ? playerImg.naturalHeight / playerImg.naturalWidth : 0.8;
  const playerWidth = Math.min(HW.PLAYER_DRAW_HEIGHT / playerAspect, HW.PLAYER_DRAW_MAX_WIDTH) * playerHalf;
  const playerHeight = playerWidth * playerAspect;
  const playerPose = riderPose(RIDE_MOTION[car.id], engine.elapsedSeconds, playerCadence(engine.speed / HW.MAX_SPEED), 0);
  drawHighwayRearSprite(
    ctx, frameImage(images, car.rearSprite, playerPose), playerCx, playerY, playerWidth,
    engine.steerLean * HW_MAX_LEAN_DEGREES * Math.PI / 180, '#E63946', playerPose,
  );
  // Power-up effects around the car.
  const bodyY = playerY - playerHeight / 2;
  if (engine.magnetTimeLeft > 0) drawMagnetAura(ctx, playerCx, bodyY, playerWidth * 0.62, playerHeight * 0.95, engine.elapsedSeconds * 60);
  if (engine.shieldTimeLeft > 0) {
    // Blinks during the last 1.5 s so you see it about to run out.
    const ending = engine.shieldTimeLeft < 1.5;
    const alpha = ending && Math.floor(engine.shieldTimeLeft * 8) % 2 === 0 ? 0.3 : 1;
    drawShieldBubble(ctx, playerCx, bodyY, playerWidth * 0.58, playerHeight * 0.85, alpha);
  }

  ctx.restore();
  if (fancy) drawHighwayVignette(ctx, w, h, speedRatio);
}
