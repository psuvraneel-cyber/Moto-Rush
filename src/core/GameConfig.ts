export interface EnvironmentConfig {
  id: string;
  name: string;
  skyColor: number;
  horizonColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  sunColor: number;
  ambientColor: number;
  roadColor: number;
  roadStripeColor: number;
  shoulderColor: number;
  propColors: number[];
  musicTempo: number;
  musicScale: string;
}

export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  sunny_city: {
    id: 'sunny_city',
    name: 'Sunny City',
    skyColor: 0x4aa3df,
    horizonColor: 0xbae0f5,
    fogColor: 0x72bdec,
    fogNear: 60,
    fogFar: 220,
    sunColor: 0xfffaed,
    ambientColor: 0x3d4a58,
    roadColor: 0x22242a,
    roadStripeColor: 0xffffff,
    shoulderColor: 0x454b54,
    propColors: [0x4a90e2, 0x50e3c2, 0xf5a623, 0xff5a5f, 0x9b51e0],
    musicTempo: 124,
    musicScale: 'major',
  },
  coastal_highway: {
    id: 'coastal_highway',
    name: 'Coastal Highway',
    skyColor: 0xff7b54,
    horizonColor: 0xffd275,
    fogColor: 0xffa07a,
    fogNear: 50,
    fogFar: 200,
    sunColor: 0xffeedd,
    ambientColor: 0x4f3f45,
    roadColor: 0x2b2930,
    roadStripeColor: 0xffe600,
    shoulderColor: 0xd4a373,
    propColors: [0x2ec4b6, 0xe71d36, 0xff9f1c, 0x011627],
    musicTempo: 128,
    musicScale: 'mixolydian',
  },
  desert_expressway: {
    id: 'desert_expressway',
    name: 'Desert Expressway',
    skyColor: 0xe07a5f,
    horizonColor: 0xf4f1de,
    fogColor: 0xd48c66,
    fogNear: 50,
    fogFar: 190,
    sunColor: 0xffe8cc,
    ambientColor: 0x5a3e36,
    roadColor: 0x332c27,
    roadStripeColor: 0xffe600,
    shoulderColor: 0xb5651d,
    propColors: [0xb85d19, 0xd4a373, 0x606c38, 0x283618],
    musicTempo: 130,
    musicScale: 'dorian',
  },
  mountain_road: {
    id: 'mountain_road',
    name: 'Mountain Road',
    skyColor: 0x2b4162,
    horizonColor: 0x7da2a9,
    fogColor: 0x50727b,
    fogNear: 45,
    fogFar: 180,
    sunColor: 0xe0e8f0,
    ambientColor: 0x203040,
    roadColor: 0x1f2326,
    roadStripeColor: 0xffffff,
    shoulderColor: 0x435058,
    propColors: [0x2d6a4f, 0x40916c, 0x52796f, 0x84a59d],
    musicTempo: 126,
    musicScale: 'minor',
  },
  neon_future: {
    id: 'neon_future',
    name: 'Neon Future City',
    skyColor: 0x090514,
    horizonColor: 0x3d0c5a,
    fogColor: 0x240638,
    fogNear: 40,
    fogFar: 180,
    sunColor: 0x00f0ff,
    ambientColor: 0x1b003a,
    roadColor: 0x0f0b1a,
    roadStripeColor: 0xff007f,
    shoulderColor: 0x00f0ff,
    propColors: [0x00f0ff, 0xff007f, 0x7928ca, 0x00ff88],
    musicTempo: 134,
    musicScale: 'synthwave',
  },
};

export const GAME_CONFIG = {
  TRACK_WIDTH: 12,
  ROAD_SEGMENT_LENGTH: 80,
  VISIBLE_ROAD_SEGMENTS: 4,
  MAX_LATERAL_OFFSET: 5.2,

  BASE_SPEED: 28,
  TURBO_SPEED_MULTIPLIER: 1.6,
  ACCELERATION: 18,
  LATERAL_SPEED: 16,
  LATERAL_SMOOTHING: 0.18,
  LEAN_ANGLE: 0.38,

  MIN_FLEET: 1,
  MAX_FLEET: 9999,
  MAX_RENDERED_FOLLOWERS: 130,

  INVULNERABILITY_AFTER_HIT_DURATION: 0.8, // seconds
  DEFAULT_CAMERA_OFFSET: { x: 0, y: 4.8, z: 9.5 },
  CAMERA_LOOK_AHEAD: 16,
  CAMERA_LAG_FACTOR: 0.08,

  POWERUPS: {
    SHIELD: { id: 'shield', name: 'Shield', duration: 8 },
    TURBO: { id: 'turbo', name: 'Turbo', duration: 4.5 },
    MAGNET: { id: 'magnet', name: 'Coin Magnet', duration: 7, radius: 14 },
    REPAIR: { id: 'repair', name: 'Fleet Repair', ratio: 0.4 },
    DOUBLE_COINS: { id: 'double_coins', name: '2x Coins', duration: 8 },
  },

  DAMAGE: {
    BARRIER_SMALL: 2,
    BARRIER_LARGE: 5,
    VEHICLE_COLLISION: 6,
    CRUSHER: 10,
    SPINNER: 4,
    OIL_SLICK_TIME: 2.2, // seconds of reduced steering traction
  },

  GRAPHICS_PRESETS: {
    low: {
      shadows: false,
      pixelRatio: 1,
      maxFollowers: 60,
      particlesEnabled: false,
      propDensity: 0.4,
    },
    medium: {
      shadows: true,
      shadowMapSize: 1024,
      pixelRatio: 1.5,
      maxFollowers: 100,
      particlesEnabled: true,
      propDensity: 0.75,
    },
    high: {
      shadows: true,
      shadowMapSize: 2048,
      pixelRatio: 2,
      maxFollowers: 130,
      particlesEnabled: true,
      propDensity: 1.0,
    },
  },
};
