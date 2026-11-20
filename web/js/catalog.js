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

const CARS = [
  { id: 'jogging', name: '조깅', nameEn: 'JOGGING', rearSprite: 'assets/rear/car_rear_1.png' },
  { id: 'bicycle', name: '자전거', nameEn: 'BICYCLE', rearSprite: 'assets/rear/car_rear_2.png' },
  { id: 'cart', name: '배달 카트', nameEn: 'DELIVERY CART', rearSprite: 'assets/rear/car_rear_3.png' },
  { id: 'kickboard', name: '킥보드', nameEn: 'KICKBOARD', rearSprite: 'assets/rear/car_rear_4.png' },
];

function cityById(id) { return CITIES.find(c => c.id === id) || CITIES[0]; }
function carById(id) { return CARS.find(c => c.id === id) || CARS[0]; }

// Speedometer scale, mirrors KMH_PER_UNIT in HighwayScreen.kt. Path speeds, not car speeds:
// the engine's 20..33 units read as about 15..25 km/h.
const KMH_PER_UNIT = 0.75;
