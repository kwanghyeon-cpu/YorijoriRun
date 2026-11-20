// Ported from the Android app's GameCatalog / Model.kt — keep values in sync by hand.

const CITIES = [
  {
    id: 'seoul', name: '서울', nameEn: 'SEOUL',
    skyTop: '#2E1A47', skyBottom: '#FF8C69',
    roadColor: '#7A3B2E',
    sprite: 'assets/cities/city_seoul.png',
    // Haze matches each skyline sprite's horizon color (the sky gradient colors above are only a
    // fallback and don't match the sprites) — used for the road haze in art.js.
    haze: '#D39A8E',
  },
  {
    id: 'tokyo', name: '도쿄', nameEn: 'TOKYO',
    skyTop: '#05021A', skyBottom: '#1B0F3D',
    roadColor: '#232B45',
    sprite: 'assets/cities/city_tokyo.png',
    haze: '#A3B8DA',
  },
  {
    id: 'newyork', name: '뉴욕', nameEn: 'NEW YORK',
    skyTop: '#FF9A56', skyBottom: '#FFD56B',
    roadColor: '#55606B',
    sprite: 'assets/cities/city_newyork.png',
    haze: '#9DCBE6',
  },
  {
    id: 'paris', name: '파리', nameEn: 'PARIS',
    skyTop: '#BFE3FF', skyBottom: '#F6E7D8',
    roadColor: '#A08A68',
    sprite: 'assets/cities/city_paris.png',
    haze: '#2B556B',
  },
];

// stats: speed / agility (side-steps) / stamina on 1..5 plus one strength and one weakness, for the character
// screen. Mirrors RideStats in Model.kt; the engine side is RIDE_TRAITS in highway-engine.js.
const CARS = [
  { id: 'jogging', name: '조깅', nameEn: 'JOGGING', rearSprite: 'assets/rear/car_rear_1.png',
    stats: { speed: 2, agility: 5, stamina: 4, strength: '좌우로 재빨라요', weakness: '가장 느려요' } },
  { id: 'bicycle', name: '자전거', nameEn: 'BICYCLE', rearSprite: 'assets/rear/car_rear_2.png',
    stats: { speed: 5, agility: 2, stamina: 3, strength: '가장 빨라 점수 쑥쑥', weakness: '좌우 이동이 무거워요' } },
  { id: 'inline', name: '인라인', nameEn: 'INLINE SKATES', rearSprite: 'assets/rear/car_rear_3.png',
    stats: { speed: 3, agility: 3, stamina: 2, strength: '아슬아슬 보너스 2배', weakness: '체력이 빨리 줄어요' } },
  { id: 'kickboard', name: '킥보드', nameEn: 'KICKBOARD', rearSprite: 'assets/rear/car_rear_4.png',
    stats: { speed: 3, agility: 3, stamina: 3, strength: '방어막·자석이 오래가요', weakness: '생수 회복이 적어요' } },
];

function cityById(id) { return CITIES.find(c => c.id === id) || CITIES[0]; }
function carById(id) { return CARS.find(c => c.id === id) || CARS[0]; }

// Speedometer scale, mirrors KMH_PER_UNIT in HighwayScreen.kt. Path speeds, not car speeds:
// the steady 28-unit cruise reads as about 21 km/h (25..31 units by ride).
const KMH_PER_UNIT = 0.75;
