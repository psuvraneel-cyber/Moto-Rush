import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from '../progression/EconomyManager';
import { UpgradeManager } from '../progression/UpgradeManager';
import { DailyChallengeManager } from '../progression/DailyChallengeManager';
import { EventBus } from '../core/EventBus';

describe('Progression and Economy', () => {
  let saveManager: SaveManager;
  let economyManager: EconomyManager;
  let upgradeManager: UpgradeManager;
  let dailyChallengeManager: DailyChallengeManager;
  let eventBus: EventBus;

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    });

    saveManager = new SaveManager();
    economyManager = new EconomyManager(saveManager);
    upgradeManager = new UpgradeManager(saveManager, economyManager);
    eventBus = new EventBus();
    dailyChallengeManager = new DailyChallengeManager(saveManager, economyManager, eventBus);
  });

  it('calculates level completion rewards accurately', () => {
    const rewards = economyManager.calculateLevelRewards({
      levelNumber: 1,
      survivingFleet: 10,
      collectedCoins: 20,
    });

    // baseReward = 50 + 1 * 10 = 60
    // fleetBonus = 10 * 4 = 40
    // collectedCoins = 20
    // upgradeBonus = 0
    expect(rewards.baseReward).toBe(60);
    expect(rewards.fleetBonus).toBe(40);
    expect(rewards.collectedCoins).toBe(20);
    expect(rewards.totalCoins).toBe(120);
    expect(rewards.stars).toBe(2);
  });

  it('manages coins correctly without allowing negative balances', () => {
    economyManager.addCoins(200);
    expect(economyManager.coins).toBe(200);

    const spent = economyManager.spendCoins(150);
    expect(spent).toBe(true);
    expect(economyManager.coins).toBe(50);

    const overspent = economyManager.spendCoins(100);
    expect(overspent).toBe(false);
    expect(economyManager.coins).toBe(50);
  });

  it('handles upgrade purchasing and tier benefits', () => {
    economyManager.addCoins(500);
    expect(upgradeManager.getLevel('starterFleet')).toBe(0);
    expect(upgradeManager.canAfford('starterFleet')).toBe(true);

    const bought = upgradeManager.purchaseUpgrade('starterFleet');
    expect(bought).toBe(true);
    expect(upgradeManager.getLevel('starterFleet')).toBe(1);
    expect(upgradeManager.getStarterFleetBonus()).toBe(1);
    expect(economyManager.coins).toBe(400); // 500 - 100
  });

  it('manages daily challenge progress and claiming', () => {
    dailyChallengeManager.addProgress('complete_levels', 2);
    expect(dailyChallengeManager.getProgress('complete_levels')).toBe(2);
    expect(dailyChallengeManager.isCompleted('complete_levels')).toBe(false);

    dailyChallengeManager.addProgress('complete_levels', 1);
    expect(dailyChallengeManager.isCompleted('complete_levels')).toBe(true);

    const coinsBefore = economyManager.coins;
    const claimed = dailyChallengeManager.claimReward('complete_levels');
    expect(claimed).toBe(true);
    expect(economyManager.coins).toBe(coinsBefore + 120);

    // cannot claim twice
    expect(dailyChallengeManager.claimReward('complete_levels')).toBe(false);
  });
});
