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
    skyColor: 0x38bdf8,
    horizonColor: 0xbae6fd,
    fogColor: 0x7dd3fc,
    fogNear: 70,
    fogFar: 260,
    sunColor: 0xfffaed,
    ambientColor: 0x475569,
    roadColor: 0x1e242d,
    roadStripeColor: 0xffffff,
    shoulderColor: 0x334155,
    propColors: [0x0284c7, 0x0d9488, 0xf59e0b, 0xef4444, 0x8b5cf6],
    musicTempo: 124,
    musicScale: 'major',
  },
  coastal_highway: {
    id: 'coastal_highway',
    name: 'Coastal Highway',
    skyColor: 0x38bdf8,
    horizonColor: 0xfef08a,
    fogColor: 0xfde047,
    fogNear: 80,
    fogFar: 280,
    sunColor: 0xfff7ed,
    ambientColor: 0x334e68,
    roadColor: 0x242832,
    roadStripeColor: 0xfbbf24,
    shoulderColor: 0xd97706,
    propColors: [0x06b6d4, 0xf43f5e, 0xf59e0b, 0x0f172a],
    musicTempo: 128,
    musicScale: 'mixolydian',
  },
  desert_expressway: {
    id: 'desert_expressway',
    name: 'Desert Expressway',
    skyColor: 0x60a5fa,
    horizonColor: 0xfed7aa,
    fogColor: 0xfdba74,
    fogNear: 75,
    fogFar: 270,
    sunColor: 0xffedd5,
    ambientColor: 0x64402a,
    roadColor: 0x292524,
    roadStripeColor: 0xfacc15,
    shoulderColor: 0x9a3412,
    propColors: [0xc2410c, 0xd97706, 0x65a30d, 0x365314],
    musicTempo: 130,
    musicScale: 'dorian',
  },
  mountain_road: {
    id: 'mountain_road',
    name: 'Mountain Road',
    skyColor: 0x1e3a8a,
    horizonColor: 0x93c5fd,
    fogColor: 0x60a5fa,
    fogNear: 70,
    fogFar: 260,
    sunColor: 0xf8fafc,
    ambientColor: 0x1e293b,
    roadColor: 0x18181b,
    roadStripeColor: 0xffffff,
    shoulderColor: 0x3f3f46,
    propColors: [0x15803d, 0x166534, 0x047857, 0x475569],
    musicTempo: 126,
    musicScale: 'minor',
  },
  neon_future: {
    id: 'neon_future',
    name: 'Neon Future City',
    skyColor: 0x12082b,
    horizonColor: 0x4c1d95,
    fogColor: 0x2e1065,
    fogNear: 60,
    fogFar: 240,
    sunColor: 0x00f0ff,
    ambientColor: 0x3b0764,
    roadColor: 0x140e26,
    roadStripeColor: 0x00f0ff,
    shoulderColor: 0xff007f,
    propColors: [0x00f0ff, 0xff007f, 0xa855f7, 0x10b981],
    musicTempo: 134,
    musicScale: 'synthwave',
  },
};

export const WHEEL_CALIBRATION = {
  FRONT_RADIUS: 0.3491, // meters (FrontWheelPivot Y in street_racer.glb)
  REAR_RADIUS: 0.3173,  // meters (RearWheelPivot Y in street_racer.glb)
  RATIO: 1.1004,        // Rear/Front angular velocity ratio
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
  MOTORCYCLE_WIDTH: 0.9,
  MOTORCYCLE_LENGTH: 2.2,
  MOTORCYCLE_HEIGHT: 1.4,

  INVULNERABILITY_AFTER_HIT_DURATION: 0.8, // seconds
  DEFAULT_CAMERA_OFFSET: { x: 0, y: 4.8, z: 9.5 },
  CAMERA_LOOK_AHEAD: 16,
  CAMERA_LAG_FACTOR: 0.08,

  POWERUPS: {
    SHIELD: { id: 'shield', name: 'Shield', duration: 8 },
    TURBO: { id: 'turbo', name: 'Turbo', duration: 4.5 },
    MAGNET: { id: 'magnet', name: 'Coin Magnet', duration: 7, radius: 14 },
    REPAIR: { id: 'repair', name: 'Emergency Repair', ratio: 0.4 },
    DOUBLE_COINS: { id: 'double_coins', name: '2x Coins', duration: 8 },
  },

  DAMAGE: {
    BARRIER_SMALL: 2,
    BARRIER_LARGE: 5,
    VEHICLE_COLLISION: 6,
    DELIVERY_VAN: 8,
    HEAVY_TRUCK: 12,
    TRAFFIC_CONES: 1,
    POTHOLE: 3,
    CRUSHER: 10,
    SPINNER: 4,
    SWINGING_BARRIER: 5,
    ROAD_GATE: 6,
    CONSTRUCTION_ZONE: 8,
    OIL_SLICK_TIME: 2.2, // seconds of reduced steering traction
  },

  GRAPHICS_PRESETS: {
    low: {
      shadows: false,
      pixelRatio: 1,
      particlesEnabled: false,
      propDensity: 0.4,
    },
    medium: {
      shadows: true,
      shadowMapSize: 1024,
      pixelRatio: 1.5,
      particlesEnabled: true,
      propDensity: 0.75,
    },
    high: {
      shadows: true,
      shadowMapSize: 2048,
      pixelRatio: 2,
      particlesEnabled: true,
      propDensity: 1.0,
    },
  },
};
