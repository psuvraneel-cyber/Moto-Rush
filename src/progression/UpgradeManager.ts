import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from './EconomyManager';

export type UpgradeType =
  | 'acceleration'
  | 'topSpeed'
  | 'handling'
  | 'braking'
  | 'nitroCapacity'
  | 'nitroRecovery'
  | 'coinBonus'
  | 'shieldDuration'
  | 'turboDuration';

export interface UpgradeConfig {
  id: UpgradeType;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  costs: number[]; // Length = maxLevel
  getFormattedBonus: (level: number) => string;
}

export const UPGRADES: Record<UpgradeType, UpgradeConfig> = {
  acceleration: {
    id: 'acceleration',
    name: 'Engine Acceleration',
    description: 'Boost motorcycle takeoff and acceleration rate',
    icon: '🚀',
    maxLevel: 5,
    costs: [100, 250, 600, 1200, 2500],
    getFormattedBonus: (lvl: number) => `+${(lvl * 12).toFixed(0)}% accel`,
  },
  topSpeed: {
    id: 'topSpeed',
    name: 'Top Speed',
    description: 'Increase maximum racing speed limit',
    icon: '🏎️',
    maxLevel: 5,
    costs: [150, 350, 800, 1600, 3200],
    getFormattedBonus: (lvl: number) => `+${lvl * 3} km/h`,
  },
  handling: {
    id: 'handling',
    name: 'Responsive Handling',
    description: 'Increase cornering agility and lateral lane response',
    icon: '🔄',
    maxLevel: 5,
    costs: [120, 280, 650, 1400, 2800],
    getFormattedBonus: (lvl: number) => `+${lvl * 10}% agility`,
  },
  braking: {
    id: 'braking',
    name: 'High-Performance Brakes',
    description: 'Enhance braking responsiveness and stopping power',
    icon: '🛑',
    maxLevel: 5,
    costs: [100, 240, 550, 1200, 2400],
    getFormattedBonus: (lvl: number) => `+${lvl * 15}% brake`,
  },
  nitroCapacity: {
    id: 'nitroCapacity',
    name: 'Nitro Tank',
    description: 'Expands total nitro boost capacity and burn time',
    icon: '⚡',
    maxLevel: 5,
    costs: [120, 300, 700, 1500, 3000],
    getFormattedBonus: (lvl: number) => `+${lvl * 20}% capacity`,
  },
  nitroRecovery: {
    id: 'nitroRecovery',
    name: 'Nitro Recharger',
    description: 'Faster passive and near-miss nitro regeneration',
    icon: '🔋',
    maxLevel: 5,
    costs: [140, 320, 750, 1600, 3200],
    getFormattedBonus: (lvl: number) => `+${lvl * 15}% regen`,
  },
  coinBonus: {
    id: 'coinBonus',
    name: 'Coin Magnetizer',
    description: 'Permanent multiplier on all collected coins',
    icon: '🪙',
    maxLevel: 5,
    costs: [120, 300, 700, 1500, 3000],
    getFormattedBonus: (lvl: number) => `+${lvl * 10}% coins`,
  },
  shieldDuration: {
    id: 'shieldDuration',
    name: 'Shield Booster',
    description: 'Extends protection duration of active shields',
    icon: '🛡️',
    maxLevel: 5,
    costs: [90, 220, 500, 1100, 2200],
    getFormattedBonus: (lvl: number) => `+${lvl}s duration`,
  },
  turboDuration: {
    id: 'turboDuration',
    name: 'Nitro Overdrive',
    description: 'Increases the duration of turbo power-up boosts',
    icon: '🔥',
    maxLevel: 5,
    costs: [90, 220, 500, 1100, 2200],
    getFormattedBonus: (lvl: number) => `+${(lvl * 0.8).toFixed(1)}s boost`,
  },
};

export class UpgradeManager {
  constructor(
    private saveManager: SaveManager,
    private economyManager: EconomyManager
  ) {}

  public getLevel(type: UpgradeType): number {
    return this.saveManager.data.upgrades[type] || 0;
  }

  public getCost(type: UpgradeType): number | null {
    const current = this.getLevel(type);
    const config = UPGRADES[type];
    if (!config || current >= config.maxLevel) return null;
    return config.costs[current];
  }

  public canAfford(type: UpgradeType): boolean {
    const cost = this.getCost(type);
    if (cost === null) return false;
    return this.economyManager.coins >= cost;
  }

  public purchaseUpgrade(type: UpgradeType): boolean {
    const cost = this.getCost(type);
    if (cost === null) return false;

    if (this.economyManager.spendCoins(cost)) {
      this.saveManager.data.upgrades[type] = this.getLevel(type) + 1;
      this.saveManager.saveData();
      return true;
    }
    return false;
  }

  public getAccelerationBonus(): number {
    return this.getLevel('acceleration') * 0.12;
  }

  public getTopSpeedBonus(): number {
    return this.getLevel('topSpeed') * 0.8333; // ~3 km/h per tier in m/s
  }

  public getHandlingBonus(): number {
    return this.getLevel('handling') * 0.10;
  }

  public getBrakingBonus(): number {
    return this.getLevel('braking') * 0.15; // +15% per tier
  }

  public getNitroCapacityBonus(): number {
    return this.getLevel('nitroCapacity') * 0.20;
  }

  public getNitroRecoveryBonus(): number {
    return this.getLevel('nitroRecovery') * 0.15; // +15% per tier
  }

  public getShieldDurationBonus(): number {
    return this.getLevel('shieldDuration');
  }

  public getTurboDurationBonus(): number {
    return this.getLevel('turboDuration') * 0.8;
  }

  public getCoinBonusMultiplier(): number {
    return 1 + this.getLevel('coinBonus') * 0.10;
  }
}
