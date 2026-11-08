import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from './EconomyManager';

export type UpgradeType =
  | 'starterFleet'
  | 'coinBonus'
  | 'shieldDuration'
  | 'turboDuration'
  | 'fleetRecovery';

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
  starterFleet: {
    id: 'starterFleet',
    name: 'Starter Fleet',
    description: 'Start every run with extra bikes in your convoy',
    icon: '🏍️',
    maxLevel: 5,
    costs: [100, 250, 600, 1200, 2500],
    getFormattedBonus: (lvl: number) => `+${lvl} bikes`,
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
    icon: '⚡',
    maxLevel: 5,
    costs: [90, 220, 500, 1100, 2200],
    getFormattedBonus: (lvl: number) => `+${(lvl * 0.8).toFixed(1)}s boost`,
  },
  fleetRecovery: {
    id: 'fleetRecovery',
    name: 'Emergency Repair',
    description: 'Repair pickups restore a higher percentage of fleet',
    icon: '🔧',
    maxLevel: 5,
    costs: [150, 350, 800, 1600, 3200],
    getFormattedBonus: (lvl: number) => `+${lvl * 15}% recovery`,
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
    if (current >= config.maxLevel) return null;
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

  public getStarterFleetBonus(): number {
    return this.getLevel('starterFleet');
  }

  public getShieldDurationBonus(): number {
    return this.getLevel('shieldDuration');
  }

  public getTurboDurationBonus(): number {
    return this.getLevel('turboDuration') * 0.8;
  }

  public getRepairMultiplier(): number {
    return 1 + this.getLevel('fleetRecovery') * 0.15;
  }
}
