import { GateEffect } from '../gameplay/GateCalculator';

export type ObstacleType =
  | 'barrier_small'
  | 'barrier_large'
  | 'traffic'
  | 'oil_slick'
  | 'spinner'
  | 'crusher';

export type PowerUpType = 'shield' | 'turbo' | 'magnet' | 'repair' | 'double_coins';

export interface GatePairDef {
  z: number;
  left: GateEffect;
  right: GateEffect;
}

export interface ObstacleDef {
  type: ObstacleType;
  x: number;
  z: number;
  speed?: number; // for moving traffic / lateral oscillators
  range?: number;
}

export interface CoinGroupDef {
  pattern: 'line' | 'arc' | 'cluster';
  startX: number;
  startZ: number;
  count: number;
}

export interface PowerUpDef {
  type: PowerUpType;
  x: number;
  z: number;
}

export interface LevelDefinition {
  levelNumber: number;
  name: string;
  environmentId: 'sunny_city' | 'coastal_highway' | 'desert_expressway' | 'mountain_road' | 'neon_future';
  trackLength: number;
  startingFleet: number;
  gatePairs: GatePairDef[];
  obstacles: ObstacleDef[];
  coinGroups: CoinGroupDef[];
  powerUps: PowerUpDef[];
  targetStars: { twoStar: number; threeStar: number };
}

export const LEVELS: LevelDefinition[] = [
  // --- ENVIRONMENT 1: SUNNY CITY (Levels 1 - 6) ---
  {
    levelNumber: 1,
    name: 'First Engine Rev',
    environmentId: 'sunny_city',
    trackLength: 320,
    startingFleet: 1,
    gatePairs: [
      { z: 60, left: { operation: 'ADD', value: 3 }, right: { operation: 'ADD', value: 1 } },
      { z: 130, left: { operation: 'ADD', value: 2 }, right: { operation: 'ADD', value: 5 } },
      { z: 210, left: { operation: 'ADD', value: 10 }, right: { operation: 'ADD', value: 4 } },
    ],
    obstacles: [],
    coinGroups: [
      { pattern: 'line', startX: -2.5, startZ: 85, count: 5 },
      { pattern: 'line', startX: 2.5, startZ: 155, count: 5 },
      { pattern: 'line', startX: 0, startZ: 240, count: 8 },
    ],
    powerUps: [
      { type: 'magnet', x: 0, z: 170 },
    ],
    targetStars: { twoStar: 10, threeStar: 18 },
  },
  {
    levelNumber: 2,
    name: 'Lane Mastery',
    environmentId: 'sunny_city',
    trackLength: 360,
    startingFleet: 1,
    gatePairs: [
      { z: 70, left: { operation: 'ADD', value: 5 }, right: { operation: 'ADD', value: 2 } },
      { z: 150, left: { operation: 'SUBTRACT', value: 2 }, right: { operation: 'ADD', value: 6 } },
      { z: 230, left: { operation: 'ADD', value: 8 }, right: { operation: 'ADD', value: 3 } },
    ],
    obstacles: [
      { type: 'barrier_small', x: -2.5, z: 190 },
      { type: 'barrier_small', x: 2.5, z: 270 },
    ],
    coinGroups: [
      { pattern: 'line', startX: 2.5, startZ: 95, count: 6 },
      { pattern: 'line', startX: -2.5, startZ: 175, count: 6 },
    ],
    powerUps: [
      { type: 'shield', x: 0, z: 110 },
    ],
    targetStars: { twoStar: 12, threeStar: 20 },
  },
  {
    levelNumber: 3,
    name: 'Double Trouble',
    environmentId: 'sunny_city',
    trackLength: 400,
    startingFleet: 2,
    gatePairs: [
      { z: 80, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'ADD', value: 4 } },
      { z: 170, left: { operation: 'ADD', value: 6 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 260, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'SUBTRACT', value: 5 } },
    ],
    obstacles: [
      { type: 'barrier_small', x: 0, z: 125 },
      { type: 'barrier_small', x: -2.8, z: 215 },
      { type: 'barrier_small', x: 2.8, z: 300 },
    ],
    coinGroups: [
      { pattern: 'cluster', startX: 0, startZ: 105, count: 6 },
      { pattern: 'line', startX: 2.8, startZ: 195, count: 7 },
    ],
    powerUps: [
      { type: 'double_coins', x: 0, z: 140 },
    ],
    targetStars: { twoStar: 15, threeStar: 28 },
  },
  {
    levelNumber: 4,
    name: 'Convoy Boom',
    environmentId: 'sunny_city',
    trackLength: 420,
    startingFleet: 2,
    gatePairs: [
      { z: 75, left: { operation: 'ADD', value: 8 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 165, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 12 } },
      { z: 265, left: { operation: 'SUBTRACT', value: 6 }, right: { operation: 'MULTIPLY', value: 2 } },
    ],
    obstacles: [
      { type: 'barrier_small', x: -2.5, z: 120 },
      { type: 'barrier_large', x: 2.5, z: 210 },
      { type: 'barrier_small', x: 0, z: 310 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: -2.0, startZ: 100, count: 8 },
      { pattern: 'line', startX: 0, startZ: 200, count: 7 },
    ],
    powerUps: [
      { type: 'turbo', x: 0, z: 135 },
    ],
    targetStars: { twoStar: 20, threeStar: 40 },
  },
  {
    levelNumber: 5,
    name: 'Rush Hour Prep',
    environmentId: 'sunny_city',
    trackLength: 450,
    startingFleet: 2,
    gatePairs: [
      { z: 80, left: { operation: 'ADD', value: 10 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 175, left: { operation: 'SUBTRACT', value: 8 }, right: { operation: 'ADD', value: 15 } },
      { z: 275, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
      { z: 355, left: { operation: 'ADD', value: 20 }, right: { operation: 'SUBTRACT', value: 10 } },
    ],
    obstacles: [
      { type: 'barrier_large', x: -2.6, z: 130 },
      { type: 'barrier_small', x: 2.6, z: 220 },
      { type: 'barrier_large', x: 0, z: 315 },
    ],
    coinGroups: [
      { pattern: 'line', startX: -2.5, startZ: 110, count: 8 },
      { pattern: 'line', startX: 2.5, startZ: 200, count: 8 },
      { pattern: 'cluster', startX: 0, startZ: 300, count: 6 },
    ],
    powerUps: [
      { type: 'repair', x: 0, z: 240 },
      { type: 'magnet', x: 2.5, z: 330 },
    ],
    targetStars: { twoStar: 24, threeStar: 48 },
  },
  {
    levelNumber: 6,
    name: 'Metropolis Dash',
    environmentId: 'sunny_city',
    trackLength: 480,
    startingFleet: 3,
    gatePairs: [
      { z: 85, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'ADD', value: 12 } },
      { z: 185, left: { operation: 'ADD', value: 15 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 290, left: { operation: 'SUBTRACT', value: 10 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 380, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'ADD', value: 25 } },
    ],
    obstacles: [
      { type: 'barrier_large', x: 2.5, z: 135 },
      { type: 'barrier_large', x: -2.5, z: 235 },
      { type: 'barrier_small', x: 0, z: 335 },
      { type: 'barrier_large', x: 2.5, z: 415 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: 0, startZ: 110, count: 10 },
      { pattern: 'line', startX: -2.5, startZ: 215, count: 8 },
    ],
    powerUps: [
      { type: 'shield', x: -2.5, z: 150 },
      { type: 'double_coins', x: 2.5, z: 350 },
    ],
    targetStars: { twoStar: 30, threeStar: 60 },
  },

  // --- ENVIRONMENT 2: COASTAL HIGHWAY (Levels 7 - 12) ---
  {
    levelNumber: 7,
    name: 'Ocean Boulevard',
    environmentId: 'coastal_highway',
    trackLength: 500,
    startingFleet: 2,
    gatePairs: [
      { z: 90, left: { operation: 'ADD', value: 15 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 195, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'SUBTRACT', value: 8 } },
      { z: 310, left: { operation: 'ADD', value: 20 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 410, left: { operation: 'SUBTRACT', value: 12 }, right: { operation: 'ADD', value: 18 } },
    ],
    obstacles: [
      { type: 'oil_slick', x: -1.5, z: 140 },
      { type: 'barrier_small', x: 2.8, z: 240 },
      { type: 'oil_slick', x: 2.0, z: 350 },
    ],
    coinGroups: [
      { pattern: 'line', startX: 2.5, startZ: 120, count: 8 },
      { pattern: 'arc', startX: 0, startZ: 220, count: 8 },
    ],
    powerUps: [
      { type: 'turbo', x: 0, z: 160 },
    ],
    targetStars: { twoStar: 32, threeStar: 65 },
  },
  {
    levelNumber: 8,
    name: 'Sunset Cruise',
    environmentId: 'coastal_highway',
    trackLength: 520,
    startingFleet: 2,
    gatePairs: [
      { z: 95, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'ADD', value: 14 } },
      { z: 205, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'ADD', value: 25 } },
      { z: 320, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 30 } },
      { z: 425, left: { operation: 'SUBTRACT', value: 15 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'traffic', x: -2.2, z: 150, speed: 6 },
      { type: 'oil_slick', x: 2.0, z: 255 },
      { type: 'barrier_large', x: 0, z: 365 },
    ],
    coinGroups: [
      { pattern: 'line', startX: -2.5, startZ: 125, count: 8 },
      { pattern: 'cluster', startX: 0, startZ: 230, count: 8 },
    ],
    powerUps: [
      { type: 'shield', x: 2.2, z: 170 },
      { type: 'magnet', x: -2.2, z: 345 },
    ],
    targetStars: { twoStar: 35, threeStar: 70 },
  },
  {
    levelNumber: 9,
    name: 'Tidal Split',
    environmentId: 'coastal_highway',
    trackLength: 540,
    startingFleet: 3,
    gatePairs: [
      { z: 95, left: { operation: 'ADD', value: 18 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 215, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 335, left: { operation: 'SUBTRACT', value: 10 }, right: { operation: 'ADD', value: 24 } },
      { z: 440, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'traffic', x: 2.0, z: 155, speed: 7 },
      { type: 'traffic', x: -2.0, z: 270, speed: 6 },
      { type: 'oil_slick', x: 0, z: 380 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: 0, startZ: 130, count: 10 },
      { pattern: 'line', startX: 2.5, startZ: 360, count: 8 },
    ],
    powerUps: [
      { type: 'double_coins', x: 0, z: 180 },
      { type: 'repair', x: 2.5, z: 300 },
    ],
    targetStars: { twoStar: 40, threeStar: 80 },
  },
  {
    levelNumber: 10,
    name: 'Palisade Bypass',
    environmentId: 'coastal_highway',
    trackLength: 560,
    startingFleet: 3,
    gatePairs: [
      { z: 100, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'ADD', value: 20 } },
      { z: 220, left: { operation: 'ADD', value: 25 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 345, left: { operation: 'SUBTRACT', value: 15 }, right: { operation: 'ADD', value: 30 } },
      { z: 460, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'DIVIDE', value: 2 } },
    ],
    obstacles: [
      { type: 'barrier_large', x: -2.8, z: 155 },
      { type: 'traffic', x: 2.2, z: 170, speed: 8 },
      { type: 'oil_slick', x: -1.8, z: 280 },
      { type: 'barrier_large', x: 0, z: 395 },
    ],
    coinGroups: [
      { pattern: 'line', startX: 0, startZ: 130, count: 8 },
      { pattern: 'cluster', startX: 2.5, startZ: 255, count: 8 },
    ],
    powerUps: [
      { type: 'shield', x: 0, z: 185 },
      { type: 'turbo', x: -2.5, z: 365 },
    ],
    targetStars: { twoStar: 42, threeStar: 85 },
  },
  {
    levelNumber: 11,
    name: 'Seaside Slalom',
    environmentId: 'coastal_highway',
    trackLength: 580,
    startingFleet: 4,
    gatePairs: [
      { z: 100, left: { operation: 'ADD', value: 25 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 230, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'ADD', value: 35 } },
      { z: 360, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'SUBTRACT', value: 20 } },
      { z: 475, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'MULTIPLY', value: 3 } },
    ],
    obstacles: [
      { type: 'traffic', x: -2.2, z: 160, speed: 8 },
      { type: 'traffic', x: 2.2, z: 185, speed: 8 },
      { type: 'oil_slick', x: 0, z: 295 },
      { type: 'barrier_large', x: -2.5, z: 410 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: -2.0, startZ: 130, count: 10 },
      { pattern: 'line', startX: 0, startZ: 320, count: 10 },
    ],
    powerUps: [
      { type: 'magnet', x: 2.5, z: 140 },
      { type: 'shield', x: 0, z: 380 },
    ],
    targetStars: { twoStar: 48, threeStar: 95 },
  },
  {
    levelNumber: 12,
    name: 'Coastal Climax',
    environmentId: 'coastal_highway',
    trackLength: 600,
    startingFleet: 4,
    gatePairs: [
      { z: 105, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 30 } },
      { z: 240, left: { operation: 'SUBTRACT', value: 15 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 375, left: { operation: 'ADD', value: 40 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 495, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'traffic', x: 0, z: 170, speed: 9 },
      { type: 'barrier_large', x: 2.8, z: 280 },
      { type: 'barrier_large', x: -2.8, z: 300 },
      { type: 'traffic', x: -2.0, z: 425, speed: 8 },
    ],
    coinGroups: [
      { pattern: 'cluster', startX: 0, startZ: 140, count: 10 },
      { pattern: 'arc', startX: 2.0, startZ: 330, count: 10 },
    ],
    powerUps: [
      { type: 'turbo', x: 0, z: 195 },
      { type: 'repair', x: 2.5, z: 440 },
    ],
    targetStars: { twoStar: 55, threeStar: 110 },
  },

  // --- ENVIRONMENT 3: DESERT EXPRESSWAY (Levels 13 - 18) ---
  {
    levelNumber: 13,
    name: 'Canyon Straight',
    environmentId: 'desert_expressway',
    trackLength: 620,
    startingFleet: 3,
    gatePairs: [
      { z: 110, left: { operation: 'ADD', value: 25 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 250, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'SUBTRACT', value: 20 } },
      { z: 390, left: { operation: 'ADD', value: 35 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
      { z: 510, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'DIVIDE', value: 2 } },
    ],
    obstacles: [
      { type: 'crusher', x: -2.5, z: 180, speed: 2 },
      { type: 'barrier_large', x: 2.5, z: 310 },
      { type: 'traffic', x: 0, z: 445, speed: 9 },
    ],
    coinGroups: [
      { pattern: 'line', startX: -2.5, startZ: 140, count: 10 },
      { pattern: 'line', startX: 2.5, startZ: 335, count: 10 },
    ],
    powerUps: [
      { type: 'shield', x: 2.5, z: 195 },
      { type: 'double_coins', x: 0, z: 465 },
    ],
    targetStars: { twoStar: 50, threeStar: 105 },
  },
  {
    levelNumber: 14,
    name: 'Red Rock Fury',
    environmentId: 'desert_expressway',
    trackLength: 640,
    startingFleet: 4,
    gatePairs: [
      { z: 115, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'ADD', value: 30 } },
      { z: 260, left: { operation: 'ADD', value: 40 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 400, left: { operation: 'SUBTRACT', value: 25 }, right: { operation: 'ADD', value: 50 } },
      { z: 530, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'DIVIDE', value: 2 } },
    ],
    obstacles: [
      { type: 'crusher', x: 2.5, z: 185, speed: 2.5 },
      { type: 'crusher', x: -2.5, z: 325, speed: 2.5 },
      { type: 'traffic', x: 2.0, z: 460, speed: 9 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: 0, startZ: 145, count: 10 },
      { pattern: 'cluster', startX: 0, startZ: 345, count: 10 },
    ],
    powerUps: [
      { type: 'magnet', x: 0, z: 205 },
      { type: 'repair', x: -2.5, z: 475 },
    ],
    targetStars: { twoStar: 60, threeStar: 125 },
  },
  {
    levelNumber: 15,
    name: 'Dune Drifter',
    environmentId: 'desert_expressway',
    trackLength: 660,
    startingFleet: 4,
    gatePairs: [
      { z: 120, left: { operation: 'ADD', value: 35 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 270, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'ADD', value: 45 } },
      { z: 415, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'SUBTRACT', value: 30 } },
      { z: 550, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'MULTIPLY', value: 3 } },
    ],
    obstacles: [
      { type: 'oil_slick', x: -1.5, z: 180 },
      { type: 'traffic', x: 2.2, z: 205, speed: 9 },
      { type: 'crusher', x: 0, z: 340, speed: 3 },
      { type: 'traffic', x: -2.2, z: 480, speed: 10 },
    ],
    coinGroups: [
      { pattern: 'line', startX: 2.5, startZ: 150, count: 10 },
      { pattern: 'arc', startX: -2.0, startZ: 360, count: 10 },
    ],
    powerUps: [
      { type: 'turbo', x: 0, z: 220 },
      { type: 'shield', x: 2.5, z: 495 },
    ],
    targetStars: { twoStar: 65, threeStar: 135 },
  },
  {
    levelNumber: 16,
    name: 'Sunbaked Grid',
    environmentId: 'desert_expressway',
    trackLength: 680,
    startingFleet: 5,
    gatePairs: [
      { z: 120, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 40 } },
      { z: 275, left: { operation: 'ADD', value: 50 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 425, left: { operation: 'SUBTRACT', value: 30 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 565, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'crusher', x: -2.5, z: 190, speed: 3 },
      { type: 'barrier_large', x: 2.5, z: 330 },
      { type: 'traffic', x: 0, z: 360, speed: 10 },
      { type: 'crusher', x: 2.5, z: 490, speed: 3 },
    ],
    coinGroups: [
      { pattern: 'cluster', startX: 0, startZ: 155, count: 12 },
      { pattern: 'line', startX: -2.5, startZ: 375, count: 10 },
    ],
    powerUps: [
      { type: 'double_coins', x: 0, z: 210 },
      { type: 'magnet', x: -2.5, z: 510 },
    ],
    targetStars: { twoStar: 70, threeStar: 150 },
  },
  {
    levelNumber: 17,
    name: 'Mirage Pass',
    environmentId: 'desert_expressway',
    trackLength: 700,
    startingFleet: 5,
    gatePairs: [
      { z: 125, left: { operation: 'ADD', value: 45 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 285, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 440, left: { operation: 'ADD', value: 60 }, right: { operation: 'SUBTRACT', value: 35 } },
      { z: 585, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'traffic', x: -2.0, z: 195, speed: 10 },
      { type: 'traffic', x: 2.0, z: 215, speed: 10 },
      { type: 'crusher', x: 0, z: 350, speed: 3.5 },
      { type: 'oil_slick', x: -2.0, z: 505 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: 0, startZ: 160, count: 12 },
      { pattern: 'line', startX: 2.5, startZ: 385, count: 10 },
    ],
    powerUps: [
      { type: 'shield', x: 0, z: 235 },
      { type: 'repair', x: 2.5, z: 525 },
    ],
    targetStars: { twoStar: 75, threeStar: 165 },
  },
  {
    levelNumber: 18,
    name: 'Desert Tempest',
    environmentId: 'desert_expressway',
    trackLength: 720,
    startingFleet: 5,
    gatePairs: [
      { z: 130, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 50 } },
      { z: 295, left: { operation: 'SUBTRACT', value: 40 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 455, left: { operation: 'ADD', value: 70 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 600, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'MULTIPLY', value: 3 } },
    ],
    obstacles: [
      { type: 'crusher', x: -2.5, z: 200, speed: 4 },
      { type: 'traffic', x: 2.2, z: 230, speed: 11 },
      { type: 'crusher', x: 2.5, z: 370, speed: 4 },
      { type: 'traffic', x: -2.0, z: 520, speed: 11 },
    ],
    coinGroups: [
      { pattern: 'cluster', startX: 0, startZ: 165, count: 14 },
      { pattern: 'arc', startX: -2.0, startZ: 400, count: 12 },
    ],
    powerUps: [
      { type: 'turbo', x: 0, z: 245 },
      { type: 'shield', x: -2.5, z: 540 },
    ],
    targetStars: { twoStar: 85, threeStar: 180 },
  },

  // --- ENVIRONMENT 4: MOUNTAIN ROAD (Levels 19 - 24) ---
  {
    levelNumber: 19,
    name: 'Alpine Ascent',
    environmentId: 'mountain_road',
    trackLength: 740,
    startingFleet: 5,
    gatePairs: [
      { z: 130, left: { operation: 'ADD', value: 50 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 300, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'SUBTRACT', value: 35 } },
      { z: 465, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'ADD', value: 80 } },
      { z: 615, left: { operation: 'MULTIPLY', value: 2 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'spinner', x: 0, z: 205, speed: 3 },
      { type: 'barrier_large', x: -2.8, z: 360 },
      { type: 'spinner', x: 2.2, z: 530, speed: 3.5 },
    ],
    coinGroups: [
      { pattern: 'line', startX: -2.5, startZ: 170, count: 12 },
      { pattern: 'cluster', startX: 0, startZ: 390, count: 12 },
    ],
    powerUps: [
      { type: 'shield', x: 2.5, z: 230 },
      { type: 'magnet', x: -2.5, z: 485 },
    ],
    targetStars: { twoStar: 90, threeStar: 195 },
  },
  {
    levelNumber: 20,
    name: 'Misty Switchback',
    environmentId: 'mountain_road',
    trackLength: 760,
    startingFleet: 6,
    gatePairs: [
      { z: 135, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 60 } },
      { z: 310, left: { operation: 'ADD', value: 75 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 480, left: { operation: 'SUBTRACT', value: 45 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 635, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'ADD', value: 100 } },
    ],
    obstacles: [
      { type: 'spinner', x: -2.0, z: 215, speed: 4 },
      { type: 'traffic', x: 2.2, z: 245, speed: 11 },
      { type: 'spinner', x: 0, z: 385, speed: 4 },
      { type: 'barrier_large', x: 2.5, z: 550 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: 0, startZ: 175, count: 12 },
      { pattern: 'line', startX: 2.5, startZ: 410, count: 12 },
    ],
    powerUps: [
      { type: 'double_coins', x: 0, z: 260 },
      { type: 'repair', x: 2.5, z: 570 },
    ],
    targetStars: { twoStar: 100, threeStar: 220 },
  },
  {
    levelNumber: 21,
    name: 'Granite Pass',
    environmentId: 'mountain_road',
    trackLength: 780,
    startingFleet: 6,
    gatePairs: [
      { z: 140, left: { operation: 'ADD', value: 65 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 320, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 495, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'SUBTRACT', value: 50 } },
      { z: 650, left: { operation: 'ADD', value: 120 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'spinner', x: 2.2, z: 225, speed: 4.5 },
      { type: 'crusher', x: -2.5, z: 390, speed: 4 },
      { type: 'traffic', x: 0, z: 430, speed: 12 },
      { type: 'spinner', x: -2.0, z: 570, speed: 4.5 },
    ],
    coinGroups: [
      { pattern: 'cluster', startX: 0, startZ: 180, count: 14 },
      { pattern: 'arc', startX: -2.0, startZ: 440, count: 12 },
    ],
    powerUps: [
      { type: 'shield', x: 0, z: 270 },
      { type: 'turbo', x: 2.5, z: 590 },
    ],
    targetStars: { twoStar: 110, threeStar: 240 },
  },
  {
    levelNumber: 22,
    name: 'Timber Ridge',
    environmentId: 'mountain_road',
    trackLength: 800,
    startingFleet: 6,
    gatePairs: [
      { z: 145, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 75 } },
      { z: 330, left: { operation: 'ADD', value: 90 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 510, left: { operation: 'SUBTRACT', value: 60 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 670, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'MULTIPLY', value: 2 } },
    ],
    obstacles: [
      { type: 'spinner', x: 0, z: 235, speed: 5 },
      { type: 'spinner', x: -2.5, z: 405, speed: 5 },
      { type: 'traffic', x: 2.2, z: 445, speed: 12 },
      { type: 'crusher', x: 0, z: 590, speed: 4.5 },
    ],
    coinGroups: [
      { pattern: 'line', startX: 2.5, startZ: 185, count: 14 },
      { pattern: 'cluster', startX: 0, startZ: 460, count: 14 },
    ],
    powerUps: [
      { type: 'magnet', x: -2.5, z: 280 },
      { type: 'shield', x: 0, z: 610 },
    ],
    targetStars: { twoStar: 120, threeStar: 260 },
  },
  {
    levelNumber: 23,
    name: 'Summit Run',
    environmentId: 'mountain_road',
    trackLength: 820,
    startingFleet: 7,
    gatePairs: [
      { z: 150, left: { operation: 'ADD', value: 80 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 340, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'SUBTRACT', value: 70 } },
      { z: 525, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'ADD', value: 140 } },
      { z: 685, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'MULTIPLY', value: 3 } },
    ],
    obstacles: [
      { type: 'spinner', x: 2.2, z: 240, speed: 5 },
      { type: 'traffic', x: -2.2, z: 270, speed: 13 },
      { type: 'spinner', x: -2.2, z: 420, speed: 5 },
      { type: 'crusher', x: 2.5, z: 610, speed: 5 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: 0, startZ: 195, count: 14 },
      { pattern: 'line', startX: -2.5, startZ: 470, count: 14 },
    ],
    powerUps: [
      { type: 'turbo', x: 0, z: 290 },
      { type: 'repair', x: 2.5, z: 630 },
    ],
    targetStars: { twoStar: 130, threeStar: 290 },
  },
  {
    levelNumber: 24,
    name: 'Peak Velocity',
    environmentId: 'mountain_road',
    trackLength: 840,
    startingFleet: 7,
    gatePairs: [
      { z: 150, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 100 } },
      { z: 350, left: { operation: 'ADD', value: 120 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 540, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'SUBTRACT', value: 80 } },
      { z: 705, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'MULTIPLY', value: 3 } },
    ],
    obstacles: [
      { type: 'spinner', x: 0, z: 245, speed: 5.5 },
      { type: 'traffic', x: 2.2, z: 280, speed: 13 },
      { type: 'crusher', x: -2.5, z: 435, speed: 5 },
      { type: 'spinner', x: 2.2, z: 625, speed: 5.5 },
    ],
    coinGroups: [
      { pattern: 'cluster', startX: 0, startZ: 200, count: 16 },
      { pattern: 'arc', startX: 2.0, startZ: 485, count: 14 },
    ],
    powerUps: [
      { type: 'double_coins', x: 0, z: 300 },
      { type: 'shield', x: -2.5, z: 650 },
    ],
    targetStars: { twoStar: 145, threeStar: 320 },
  },

  // --- ENVIRONMENT 5: NEON FUTURE CITY (Levels 25 - 30) ---
  {
    levelNumber: 25,
    name: 'Cyber Grid Ingress',
    environmentId: 'neon_future',
    trackLength: 860,
    startingFleet: 8,
    gatePairs: [
      { z: 155, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 120 } },
      { z: 360, left: { operation: 'ADD', value: 150 }, right: { operation: 'MULTIPLY', value: 2 } },
      { z: 555, left: { operation: 'SUBTRACT', value: 90 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 720, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'traffic', x: -2.2, z: 250, speed: 14 },
      { type: 'crusher', x: 2.5, z: 290, speed: 5 },
      { type: 'spinner', x: 0, z: 450, speed: 6 },
      { type: 'traffic', x: 2.2, z: 640, speed: 14 },
    ],
    coinGroups: [
      { pattern: 'line', startX: -2.5, startZ: 210, count: 16 },
      { pattern: 'cluster', startX: 0, startZ: 500, count: 16 },
    ],
    powerUps: [
      { type: 'shield', x: 2.5, z: 310 },
      { type: 'magnet', x: -2.5, z: 665 },
    ],
    targetStars: { twoStar: 160, threeStar: 360 },
  },
  {
    levelNumber: 26,
    name: 'Synthwave Highway',
    environmentId: 'neon_future',
    trackLength: 880,
    startingFleet: 8,
    gatePairs: [
      { z: 160, left: { operation: 'ADD', value: 140 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 375, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'ADD', value: 180 } },
      { z: 570, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'SUBTRACT', value: 100 } },
      { z: 740, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'MULTIPLY', value: 3 } },
    ],
    obstacles: [
      { type: 'spinner', x: -2.2, z: 260, speed: 6 },
      { type: 'traffic', x: 2.0, z: 300, speed: 14 },
      { type: 'crusher', x: 0, z: 465, speed: 5.5 },
      { type: 'spinner', x: 2.2, z: 660, speed: 6 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: 0, startZ: 215, count: 16 },
      { pattern: 'line', startX: 2.5, startZ: 515, count: 16 },
    ],
    powerUps: [
      { type: 'turbo', x: 0, z: 325 },
      { type: 'repair', x: 2.5, z: 685 },
    ],
    targetStars: { twoStar: 180, threeStar: 400 },
  },
  {
    levelNumber: 27,
    name: 'Overclocked Arterial',
    environmentId: 'neon_future',
    trackLength: 900,
    startingFleet: 9,
    gatePairs: [
      { z: 165, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 160 } },
      { z: 385, left: { operation: 'ADD', value: 200 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 585, left: { operation: 'SUBTRACT', value: 120 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 760, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'crusher', x: -2.5, z: 270, speed: 6 },
      { type: 'spinner', x: 2.2, z: 310, speed: 6.5 },
      { type: 'traffic', x: -2.0, z: 480, speed: 15 },
      { type: 'crusher', x: 2.5, z: 675, speed: 6 },
    ],
    coinGroups: [
      { pattern: 'cluster', startX: 0, startZ: 220, count: 18 },
      { pattern: 'arc', startX: -2.0, startZ: 530, count: 16 },
    ],
    powerUps: [
      { type: 'double_coins', x: 0, z: 335 },
      { type: 'shield', x: -2.5, z: 700 },
    ],
    targetStars: { twoStar: 200, threeStar: 450 },
  },
  {
    levelNumber: 28,
    name: 'Quantum Bypass',
    environmentId: 'neon_future',
    trackLength: 920,
    startingFleet: 9,
    gatePairs: [
      { z: 170, left: { operation: 'ADD', value: 180 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 400, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'SUBTRACT', value: 140 } },
      { z: 600, left: { operation: 'DIVIDE', value: 2 }, right: { operation: 'ADD', value: 250 } },
      { z: 780, left: { operation: 'PERCENTAGE', value: 0.5 }, right: { operation: 'MULTIPLY', value: 3 } },
    ],
    obstacles: [
      { type: 'traffic', x: 2.2, z: 280, speed: 15 },
      { type: 'traffic', x: -2.2, z: 320, speed: 15 },
      { type: 'spinner', x: 0, z: 495, speed: 7 },
      { type: 'crusher', x: -2.5, z: 695, speed: 6.5 },
    ],
    coinGroups: [
      { pattern: 'line', startX: 2.5, startZ: 230, count: 18 },
      { pattern: 'cluster', startX: 0, startZ: 545, count: 18 },
    ],
    powerUps: [
      { type: 'shield', x: 0, z: 350 },
      { type: 'magnet', x: 2.5, z: 720 },
    ],
    targetStars: { twoStar: 230, threeStar: 500 },
  },
  {
    levelNumber: 29,
    name: 'Neon Gauntlet',
    environmentId: 'neon_future',
    trackLength: 950,
    startingFleet: 10,
    gatePairs: [
      { z: 175, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'ADD', value: 220 } },
      { z: 415, left: { operation: 'ADD', value: 300 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 620, left: { operation: 'SUBTRACT', value: 160 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 805, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'spinner', x: -2.2, z: 290, speed: 7 },
      { type: 'crusher', x: 2.5, z: 335, speed: 7 },
      { type: 'traffic', x: 0, z: 510, speed: 16 },
      { type: 'spinner', x: 2.2, z: 715, speed: 7 },
      { type: 'crusher', x: -2.5, z: 750, speed: 7 },
    ],
    coinGroups: [
      { pattern: 'arc', startX: 0, startZ: 235, count: 20 },
      { pattern: 'line', startX: -2.5, startZ: 560, count: 18 },
    ],
    powerUps: [
      { type: 'turbo', x: 0, z: 365 },
      { type: 'repair', x: -2.5, z: 735 },
    ],
    targetStars: { twoStar: 260, threeStar: 600 },
  },
  {
    levelNumber: 30,
    name: 'Grand Finale: Convoy Mayhem',
    environmentId: 'neon_future',
    trackLength: 1000,
    startingFleet: 10,
    gatePairs: [
      { z: 180, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 430, left: { operation: 'ADD', value: 400 }, right: { operation: 'MULTIPLY', value: 3 } },
      { z: 645, left: { operation: 'SUBTRACT', value: 200 }, right: { operation: 'DIVIDE', value: 2 } },
      { z: 835, left: { operation: 'MULTIPLY', value: 3 }, right: { operation: 'PERCENTAGE', value: 0.5 } },
    ],
    obstacles: [
      { type: 'spinner', x: 0, z: 300, speed: 7.5 },
      { type: 'traffic', x: -2.2, z: 350, speed: 16 },
      { type: 'traffic', x: 2.2, z: 375, speed: 16 },
      { type: 'crusher', x: -2.5, z: 535, speed: 7.5 },
      { type: 'crusher', x: 2.5, z: 570, speed: 7.5 },
      { type: 'spinner', x: 0, z: 740, speed: 8 },
    ],
    coinGroups: [
      { pattern: 'cluster', startX: 0, startZ: 245, count: 24 },
      { pattern: 'arc', startX: 0, startZ: 585, count: 24 },
      { pattern: 'line', startX: 0, startZ: 775, count: 20 },
    ],
    powerUps: [
      { type: 'shield', x: 0, z: 390 },
      { type: 'double_coins', x: 2.5, z: 610 },
      { type: 'turbo', x: 0, z: 790 },
    ],
    targetStars: { twoStar: 300, threeStar: 800 },
  },
];
