import { SaveManager } from '../persistence/SaveManager';

export interface LevelFinishMetrics {
  levelNumber: number;
  collectedCoins: number;
  hasDoubleCoins?: boolean;
  tookZeroDamage?: boolean;
}

export interface RewardBreakdown {
  baseReward: number;
  collectedCoins: number;
  upgradeBonus: number;
  cleanBonus: number;
  totalCoins: number;
  stars: number;
}

export class EconomyManager {
  constructor(private saveManager: SaveManager) {}

  public get coins(): number {
    return this.saveManager.data.coins;
  }

  public addCoins(amount: number): void {
    if (amount <= 0) return;
    this.saveManager.data.coins += Math.floor(amount);
    this.saveManager.saveData();
  }

  public spendCoins(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.saveManager.data.coins < amount) return false;
    this.saveManager.data.coins -= Math.floor(amount);
    this.saveManager.saveData();
    return true;
  }

  public calculateLevelRewards(metrics: LevelFinishMetrics): RewardBreakdown {
    const baseReward = 50 + metrics.levelNumber * 10;
    const cleanBonus = metrics.tookZeroDamage ? 40 : 0;

    const coinMultiplier = metrics.hasDoubleCoins ? 2 : 1;
    const rawCoinCollection = metrics.collectedCoins * coinMultiplier;

    const coinUpgradeTier = this.saveManager.data.upgrades.coinBonus || 0;
    const coinUpgradePercent = coinUpgradeTier * 0.1; // +10% per tier
    const upgradeBonus = Math.floor(rawCoinCollection * coinUpgradePercent);

    const totalCoins = baseReward + cleanBonus + rawCoinCollection + upgradeBonus;

    // Star calculation decoupled from fleet size:
    // 3 stars: Zero damage AND collected at least 6 coins
    // 2 stars: Zero damage OR collected at least 6 coins
    // 1 star: Level completed
    let stars = 1;
    if (metrics.tookZeroDamage && rawCoinCollection >= 6) {
      stars = 3;
    } else if (metrics.tookZeroDamage || rawCoinCollection >= 6) {
      stars = 2;
    }

    return {
      baseReward,
      cleanBonus,
      collectedCoins: rawCoinCollection,
      upgradeBonus,
      totalCoins,
      stars,
    };
  }
}
