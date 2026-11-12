export type ObstacleType =
  | 'barrier_small'
  | 'barrier_large'
  | 'traffic'
  | 'delivery_van'
  | 'heavy_truck'
  | 'traffic_cones'
  | 'oil_slick'
  | 'pothole'
  | 'spinner'
  | 'crusher'
  | 'swinging_barrier'
  | 'road_gate'
  | 'construction_zone';

export type PowerUpType = 'shield' | 'turbo' | 'magnet' | 'repair' | 'double_coins';

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
  obstacles: ObstacleDef[];
  coinGroups: CoinGroupDef[];
  powerUps: PowerUpDef[];
  targetStars: { twoStar: number; threeStar: number };
}

export const LEVELS: LevelDefinition[] = [
  {
    "levelNumber": 1,
    "name": "First Engine Rev",
    "environmentId": "sunny_city",
    "trackLength": 1000,
    "obstacles": [
      {
        "type": "traffic_cones",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "traffic_cones",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "traffic_cones",
        "x": -1.5,
        "z": 810
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 6
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      }
    ],
    "targetStars": {
      "twoStar": 12,
      "threeStar": 21
    }
  },
  {
    "levelNumber": 2,
    "name": "Lane Mastery",
    "environmentId": "sunny_city",
    "trackLength": 1800,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -2.5,
        "z": 190
      },
      {
        "type": "barrier_small",
        "x": 2.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 1530
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 7
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      }
    ],
    "targetStars": {
      "twoStar": 25,
      "threeStar": 44
    }
  },
  {
    "levelNumber": 3,
    "name": "Double Trouble",
    "environmentId": "sunny_city",
    "trackLength": 1900,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 1740
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 8
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      }
    ],
    "targetStars": {
      "twoStar": 32,
      "threeStar": 56
    }
  },
  {
    "levelNumber": 4,
    "name": "Traffic Surge",
    "environmentId": "sunny_city",
    "trackLength": 2000,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "barrier_large",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "barrier_large",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 1890
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 5
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      }
    ],
    "targetStars": {
      "twoStar": 22,
      "threeStar": 38
    }
  },
  {
    "levelNumber": 5,
    "name": "Rush Hour Prep",
    "environmentId": "sunny_city",
    "trackLength": 2100,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1890
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 6
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      }
    ],
    "targetStars": {
      "twoStar": 26,
      "threeStar": 46
    }
  },
  {
    "levelNumber": 6,
    "name": "Metropolis Dash",
    "environmentId": "sunny_city",
    "trackLength": 2200,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 2070
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 7
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      }
    ],
    "targetStars": {
      "twoStar": 33,
      "threeStar": 58
    }
  },
  {
    "levelNumber": 7,
    "name": "Ocean Boulevard",
    "environmentId": "coastal_highway",
    "trackLength": 2250,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 2070
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 2030,
        "count": 8
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      }
    ],
    "targetStars": {
      "twoStar": 38,
      "threeStar": 67
    }
  },
  {
    "levelNumber": 8,
    "name": "Sunset Cruise",
    "environmentId": "coastal_highway",
    "trackLength": 2300,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 2070
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2030,
        "count": 5
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      }
    ],
    "targetStars": {
      "twoStar": 24,
      "threeStar": 42
    }
  },
  {
    "levelNumber": 9,
    "name": "Tidal Split",
    "environmentId": "coastal_highway",
    "trackLength": 2350,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 2280
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2240,
        "count": 6
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      }
    ],
    "targetStars": {
      "twoStar": 31,
      "threeStar": 54
    }
  },
  {
    "levelNumber": 10,
    "name": "Palisade Bypass",
    "environmentId": "coastal_highway",
    "trackLength": 2400,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 2280
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 2030,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 2240,
        "count": 7
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      }
    ],
    "targetStars": {
      "twoStar": 36,
      "threeStar": 63
    }
  },
  {
    "levelNumber": 11,
    "name": "Seaside Slalom",
    "environmentId": "coastal_highway",
    "trackLength": 2450,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 2280
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2030,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2240,
        "count": 8
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      }
    ],
    "targetStars": {
      "twoStar": 41,
      "threeStar": 72
    }
  },
  {
    "levelNumber": 12,
    "name": "Coastal Climax",
    "environmentId": "coastal_highway",
    "trackLength": 2500,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 2280
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 2430
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2240,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2390,
        "count": 5
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -4.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 28,
      "threeStar": 49
    }
  },
  {
    "levelNumber": 13,
    "name": "Canyon Straight",
    "environmentId": "desert_expressway",
    "trackLength": 2550,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "pothole",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "road_gate",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 1890
      },
      {
        "type": "pothole",
        "x": 4.5,
        "z": 2070
      },
      {
        "type": "road_gate",
        "x": -1.5,
        "z": 2280
      },
      {
        "type": "construction_zone",
        "x": 4.5,
        "z": 2430
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 2030,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 2240,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 2390,
        "count": 6
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -1.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 33,
      "threeStar": 58
    }
  },
  {
    "levelNumber": 14,
    "name": "Red Rock Fury",
    "environmentId": "desert_expressway",
    "trackLength": 2600,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 1890
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 2070
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 2280
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 2430
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2030,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2240,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2390,
        "count": 7
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": 1.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 39,
      "threeStar": 68
    }
  },
  {
    "levelNumber": 15,
    "name": "Dune Drifter",
    "environmentId": "desert_expressway",
    "trackLength": 2650,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 2070
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 2280
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 2430
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2240,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2390,
        "count": 8
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -4.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 44,
      "threeStar": 78
    }
  },
  {
    "levelNumber": 16,
    "name": "Sunbaked Grid",
    "environmentId": "desert_expressway",
    "trackLength": 2700,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "pothole",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "road_gate",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 1890
      },
      {
        "type": "pothole",
        "x": 4.5,
        "z": 2070
      },
      {
        "type": "road_gate",
        "x": -1.5,
        "z": 2280
      },
      {
        "type": "construction_zone",
        "x": 4.5,
        "z": 2430
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 2610
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 2030,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 2240,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 2390,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 2570,
        "count": 5
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -1.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 30,
      "threeStar": 52
    }
  },
  {
    "levelNumber": 17,
    "name": "Mirage Pass",
    "environmentId": "desert_expressway",
    "trackLength": 2750,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 1890
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 2070
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 2280
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 2430
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 2610
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2030,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2240,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2390,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2570,
        "count": 6
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": 1.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 36,
      "threeStar": 62
    }
  },
  {
    "levelNumber": 18,
    "name": "Desert Tempest",
    "environmentId": "desert_expressway",
    "trackLength": 2800,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 2070
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 2280
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 2430
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 2610
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2240,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2390,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2570,
        "count": 7
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -4.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 42,
      "threeStar": 73
    }
  },
  {
    "levelNumber": 19,
    "name": "Alpine Ascent",
    "environmentId": "mountain_road",
    "trackLength": 2850,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "swinging_barrier",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "swinging_barrier",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "construction_zone",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 2280
      },
      {
        "type": "swinging_barrier",
        "x": 4.5,
        "z": 2430
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 2610
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 2030,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 2240,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 2390,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 2570,
        "count": 8
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -1.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 48,
      "threeStar": 84
    }
  },
  {
    "levelNumber": 20,
    "name": "Misty Switchback",
    "environmentId": "mountain_road",
    "trackLength": 2900,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "swinging_barrier",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "swinging_barrier",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 2280
      },
      {
        "type": "swinging_barrier",
        "x": -4.5,
        "z": 2430
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 2610
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 2820
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2030,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2240,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2390,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2570,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2780,
        "count": 5
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": 1.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 32,
      "threeStar": 56
    }
  },
  {
    "levelNumber": 21,
    "name": "Granite Pass",
    "environmentId": "mountain_road",
    "trackLength": 2950,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "swinging_barrier",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "swinging_barrier",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 2280
      },
      {
        "type": "swinging_barrier",
        "x": 1.5,
        "z": 2430
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 2610
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 2820
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2240,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2390,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2570,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2780,
        "count": 6
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -4.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 38,
      "threeStar": 67
    }
  },
  {
    "levelNumber": 22,
    "name": "Timber Ridge",
    "environmentId": "mountain_road",
    "trackLength": 3000,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "swinging_barrier",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "swinging_barrier",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "construction_zone",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": -1.5,
        "z": 2280
      },
      {
        "type": "swinging_barrier",
        "x": 4.5,
        "z": 2430
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 2610
      },
      {
        "type": "barrier_small",
        "x": 4.5,
        "z": 2820
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 2030,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 2240,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 2390,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 2570,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 2780,
        "count": 7
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -1.5,
        "z": 2410
      }
    ],
    "targetStars": {
      "twoStar": 44,
      "threeStar": 78
    }
  },
  {
    "levelNumber": 23,
    "name": "Summit Run",
    "environmentId": "mountain_road",
    "trackLength": 3050,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "swinging_barrier",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "swinging_barrier",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 2280
      },
      {
        "type": "swinging_barrier",
        "x": -4.5,
        "z": 2430
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 2610
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 2820
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 2970
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2030,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2240,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2390,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2570,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2780,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2930,
        "count": 8
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": 1.5,
        "z": 2410
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 2950
      }
    ],
    "targetStars": {
      "twoStar": 54,
      "threeStar": 95
    }
  },
  {
    "levelNumber": 24,
    "name": "Peak Velocity",
    "environmentId": "mountain_road",
    "trackLength": 3100,
    "obstacles": [
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "swinging_barrier",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "pothole",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "swinging_barrier",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "barrier_small",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 2070
      },
      {
        "type": "pothole",
        "x": -4.5,
        "z": 2280
      },
      {
        "type": "swinging_barrier",
        "x": 1.5,
        "z": 2430
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 2610
      },
      {
        "type": "barrier_small",
        "x": 1.5,
        "z": 2820
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 2970
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2240,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2390,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2570,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2780,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2930,
        "count": 5
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -4.5,
        "z": 2410
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 2950
      }
    ],
    "targetStars": {
      "twoStar": 34,
      "threeStar": 59
    }
  },
  {
    "levelNumber": 25,
    "name": "Cyber Grid Ingress",
    "environmentId": "neon_future",
    "trackLength": 3200,
    "obstacles": [
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "road_gate",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "spinner",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "crusher",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "spinner",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "crusher",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 2070
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 2280
      },
      {
        "type": "road_gate",
        "x": 4.5,
        "z": 2430
      },
      {
        "type": "spinner",
        "x": -1.5,
        "z": 2610
      },
      {
        "type": "crusher",
        "x": 4.5,
        "z": 2820
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 2970
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 2030,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 2240,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 2390,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 2570,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 2780,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 2930,
        "count": 6
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -1.5,
        "z": 2410
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 2950
      }
    ],
    "targetStars": {
      "twoStar": 40,
      "threeStar": 71
    }
  },
  {
    "levelNumber": 26,
    "name": "Synthwave Highway",
    "environmentId": "neon_future",
    "trackLength": 3300,
    "obstacles": [
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "spinner",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "crusher",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "spinner",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "crusher",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 2070
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 2280
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 2430
      },
      {
        "type": "spinner",
        "x": 1.5,
        "z": 2610
      },
      {
        "type": "crusher",
        "x": -4.5,
        "z": 2820
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 2970
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 3150
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2030,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2240,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2390,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2570,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2780,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2930,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 3110,
        "count": 7
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": 1.5,
        "z": 2410
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 2950
      }
    ],
    "targetStars": {
      "twoStar": 50,
      "threeStar": 88
    }
  },
  {
    "levelNumber": 27,
    "name": "Overclocked Arterial",
    "environmentId": "neon_future",
    "trackLength": 3400,
    "obstacles": [
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "spinner",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "crusher",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "spinner",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "crusher",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 2070
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 2280
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 2430
      },
      {
        "type": "spinner",
        "x": -4.5,
        "z": 2610
      },
      {
        "type": "crusher",
        "x": 1.5,
        "z": 2820
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 2970
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 3150
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2240,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2390,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2570,
        "count": 8
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2780,
        "count": 8
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2930,
        "count": 8
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 3110,
        "count": 8
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -4.5,
        "z": 2410
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 2950
      }
    ],
    "targetStars": {
      "twoStar": 57,
      "threeStar": 100
    }
  },
  {
    "levelNumber": 28,
    "name": "Quantum Bypass",
    "environmentId": "neon_future",
    "trackLength": 3450,
    "obstacles": [
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 120
      },
      {
        "type": "road_gate",
        "x": 4.5,
        "z": 270
      },
      {
        "type": "spinner",
        "x": -1.5,
        "z": 450
      },
      {
        "type": "crusher",
        "x": 4.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 990
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": 4.5,
        "z": 1350
      },
      {
        "type": "spinner",
        "x": -1.5,
        "z": 1530
      },
      {
        "type": "crusher",
        "x": 4.5,
        "z": 1740
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 2070
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 2280
      },
      {
        "type": "road_gate",
        "x": 4.5,
        "z": 2430
      },
      {
        "type": "spinner",
        "x": -1.5,
        "z": 2610
      },
      {
        "type": "crusher",
        "x": 4.5,
        "z": 2820
      },
      {
        "type": "construction_zone",
        "x": -1.5,
        "z": 2970
      },
      {
        "type": "traffic_cones",
        "x": 4.5,
        "z": 3150
      },
      {
        "type": "barrier_large",
        "x": -1.5,
        "z": 3360
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 80,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 230,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 410,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 620,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 770,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 950,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 1160,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 1310,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 1490,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 1700,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 1850,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 2030,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 2240,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": -4.5,
        "startZ": 2390,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": 1.5,
        "startZ": 2570,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": -4.5,
        "startZ": 2780,
        "count": 5
      },
      {
        "pattern": "arc",
        "startX": 1.5,
        "startZ": 2930,
        "count": 5
      },
      {
        "pattern": "cluster",
        "startX": -4.5,
        "startZ": 3110,
        "count": 5
      },
      {
        "pattern": "line",
        "startX": 1.5,
        "startZ": 3320,
        "count": 5
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -1.5,
        "z": 2410
      },
      {
        "type": "shield",
        "x": 4.5,
        "z": 2950
      }
    ],
    "targetStars": {
      "twoStar": 38,
      "threeStar": 66
    }
  },
  {
    "levelNumber": 29,
    "name": "Neon Gauntlet",
    "environmentId": "neon_future",
    "trackLength": 3500,
    "obstacles": [
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 120
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 270
      },
      {
        "type": "spinner",
        "x": 1.5,
        "z": 450
      },
      {
        "type": "crusher",
        "x": -4.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 990
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 1350
      },
      {
        "type": "spinner",
        "x": 1.5,
        "z": 1530
      },
      {
        "type": "crusher",
        "x": -4.5,
        "z": 1740
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 2070
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 2280
      },
      {
        "type": "road_gate",
        "x": -4.5,
        "z": 2430
      },
      {
        "type": "spinner",
        "x": 1.5,
        "z": 2610
      },
      {
        "type": "crusher",
        "x": -4.5,
        "z": 2820
      },
      {
        "type": "construction_zone",
        "x": 1.5,
        "z": 2970
      },
      {
        "type": "traffic_cones",
        "x": -4.5,
        "z": 3150
      },
      {
        "type": "barrier_large",
        "x": 1.5,
        "z": 3360
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 80,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 230,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 410,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 620,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 770,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 950,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1160,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1310,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 1490,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1700,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1850,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2030,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2240,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2390,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2570,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2780,
        "count": 6
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2930,
        "count": 6
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 3110,
        "count": 6
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 3320,
        "count": 6
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": 1.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": 1.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": -4.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": 1.5,
        "z": 2410
      },
      {
        "type": "shield",
        "x": -4.5,
        "z": 2950
      }
    ],
    "targetStars": {
      "twoStar": 45,
      "threeStar": 79
    }
  },
  {
    "levelNumber": 30,
    "name": "Grand Finale: Traffic Rush",
    "environmentId": "neon_future",
    "trackLength": 3600,
    "obstacles": [
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 120
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 270
      },
      {
        "type": "spinner",
        "x": -4.5,
        "z": 450
      },
      {
        "type": "crusher",
        "x": 1.5,
        "z": 660
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 810
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 990
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 1200
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 1350
      },
      {
        "type": "spinner",
        "x": -4.5,
        "z": 1530
      },
      {
        "type": "crusher",
        "x": 1.5,
        "z": 1740
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 1890
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 2070
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 2280
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 2430
      },
      {
        "type": "spinner",
        "x": -4.5,
        "z": 2610
      },
      {
        "type": "crusher",
        "x": 1.5,
        "z": 2820
      },
      {
        "type": "construction_zone",
        "x": -4.5,
        "z": 2970
      },
      {
        "type": "traffic_cones",
        "x": 1.5,
        "z": 3150
      },
      {
        "type": "barrier_large",
        "x": -4.5,
        "z": 3360
      },
      {
        "type": "road_gate",
        "x": 1.5,
        "z": 3510
      }
    ],
    "coinGroups": [
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 80,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 230,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 410,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 620,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 770,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 950,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 1160,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 1310,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 1490,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 1700,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 1850,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 2030,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 2240,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 2390,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": -1.5,
        "startZ": 2570,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": 4.5,
        "startZ": 2780,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": -1.5,
        "startZ": 2930,
        "count": 7
      },
      {
        "pattern": "cluster",
        "startX": 4.5,
        "startZ": 3110,
        "count": 7
      },
      {
        "pattern": "line",
        "startX": -1.5,
        "startZ": 3320,
        "count": 7
      },
      {
        "pattern": "arc",
        "startX": 4.5,
        "startZ": 3470,
        "count": 7
      }
    ],
    "powerUps": [
      {
        "type": "turbo",
        "x": -4.5,
        "z": 250
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 790
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 1330
      },
      {
        "type": "magnet",
        "x": 1.5,
        "z": 1870
      },
      {
        "type": "turbo",
        "x": -4.5,
        "z": 2410
      },
      {
        "type": "shield",
        "x": 1.5,
        "z": 2950
      },
      {
        "type": "double_coins",
        "x": -4.5,
        "z": 3490
      }
    ],
    "targetStars": {
      "twoStar": 56,
      "threeStar": 98
    }
  }
];
