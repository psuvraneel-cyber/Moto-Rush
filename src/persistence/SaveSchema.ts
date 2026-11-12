export interface SaveSchemaV1 {
  version: 1;
  coins: number;
  unlockedLevel: number;
  levelStars: Record<number, number>;
  selectedBikeId: string;
  unlockedBikes: string[];
  upgrades: {
    starterFleet: number;
    coinBonus: number;
    shieldDuration: number;
    turboDuration: number;
    fleetRecovery: number;
  };
  achievements: Record<string, { unlocked: boolean; claimed: boolean; unlockedAt: number }>;
  dailyChallenges: {
    date: string;
    progress: Record<string, number>;
    completed: Record<string, boolean>;
    claimed: Record<string, boolean>;
  };
  endless: {
    bestDistance: number;
    bestScore: number;
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    mute: boolean;
    sensitivity: number;
    graphicsQuality: 'low' | 'medium' | 'high';
    cameraShake: boolean;
    reducedMotion: boolean;
  };
}

export interface SaveSchemaV2 {
  version: 2;
  coins: number;
  unlockedLevel: number; // 1-indexed, starts at 1
  levelStars: Record<number, number>; // levelNumber -> stars (1-3)
  selectedBikeId: string;
  unlockedBikes: string[];
  upgrades: {
    acceleration: number; // level 0-5 (migrated from starterFleet)
    topSpeed: number; // level 0-5
    handling: number; // level 0-5 (migrated from fleetRecovery)
    braking: number; // level 0-5
    nitroCapacity: number; // level 0-5 (migrated from coinBonus)
    nitroRecovery: number; // level 0-5
    coinBonus: number; // level 0-5
    shieldDuration: number; // level 0-5
    turboDuration: number; // level 0-5
  };
  achievements: Record<string, { unlocked: boolean; claimed: boolean; unlockedAt: number }>;
  dailyChallenges: {
    date: string; // YYYY-MM-DD
    progress: Record<string, number>;
    completed: Record<string, boolean>;
    claimed: Record<string, boolean>;
  };
  endless: {
    bestDistance: number;
    bestScore: number;
  };
  settings: {
    musicVolume: number; // 0 to 1
    sfxVolume: number; // 0 to 1
    mute: boolean;
    sensitivity: number; // 0.5 to 2.5
    graphicsQuality: 'low' | 'medium' | 'high';
    cameraShake: boolean;
    reducedMotion: boolean;
  };
}

export type CurrentSaveSchema = SaveSchemaV2;

export const DEFAULT_SAVE_DATA: CurrentSaveSchema = {
  version: 2,
  coins: 0,
  unlockedLevel: 1,
  levelStars: {},
  selectedBikeId: 'street_racer',
  unlockedBikes: ['street_racer'],
  upgrades: {
    acceleration: 0,
    topSpeed: 0,
    handling: 0,
    braking: 0,
    nitroCapacity: 0,
    nitroRecovery: 0,
    coinBonus: 0,
    shieldDuration: 0,
    turboDuration: 0,
  },
  achievements: {},
  dailyChallenges: {
    date: '',
    progress: {},
    completed: {},
    claimed: {},
  },
  endless: {
    bestDistance: 0,
    bestScore: 0,
  },
  settings: {
    musicVolume: 0.7,
    sfxVolume: 0.85,
    mute: false,
    sensitivity: 1.0,
    graphicsQuality: 'high',
    cameraShake: true,
    reducedMotion: false,
  },
};
