import { SaveManager } from '../persistence/SaveManager';

export interface LevelFinishMetrics {
  levelNumber: number;
  survivingFleet: number;
  collectedCoins: number;
  hasDoubleCoins?: boolean;
  tookZeroDamage?: boolean;
}

export interface RewardBreakdown {
  baseReward: number;
  fleetBonus: number;
  collectedCoins: number;
  upgradeBonus: number;
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
    const fleetBonus = metrics.survivingFleet * 4;

    const coinMultiplier = metrics.hasDoubleCoins ? 2 : 1;
    const rawCoinCollection = metrics.collectedCoins * coinMultiplier;

    const coinUpgradeTier = this.saveManager.data.upgrades.coinBonus || 0;
    const coinUpgradePercent = coinUpgradeTier * 0.1; // +10% per tier
    const upgradeBonus = Math.floor(rawCoinCollection * coinUpgradePercent);

    const totalCoins = baseReward + fleetBonus + rawCoinCollection + upgradeBonus;

    // Star calculation:
    // 3 stars: surviving fleet >= 15 or (level >= 10 and fleet >= 25)
    // 2 stars: surviving fleet >= 5
    // 1 star: surviving fleet >= 1
    let stars = 1;
    const target3Star = metrics.levelNumber >= 15 ? 30 : metrics.levelNumber >= 5 ? 20 : 12;
    const target2Star = Math.floor(target3Star / 2);

    if (metrics.survivingFleet >= target3Star) {
      stars = 3;
    } else if (metrics.survivingFleet >= target2Star) {
      stars = 2;
    }

    return {
      baseReward,
      fleetBonus,
      collectedCoins: rawCoinCollection,
      upgradeBonus,
      totalCoins,
      stars,
    };
  }
}
