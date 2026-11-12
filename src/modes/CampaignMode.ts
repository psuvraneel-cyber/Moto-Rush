import { LEVELS, LevelDefinition } from '../levels/LevelDefinitions';
import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager, RewardBreakdown } from '../progression/EconomyManager';
import { EventBus, GlobalEvents } from '../core/EventBus';

export class CampaignMode {
  private currentLevelIndex: number = 0; // 0-indexed into LEVELS
  private levelStartedAt: number = 0;

  constructor(
    protected saveManager: SaveManager,
    protected economyManager: EconomyManager,
    protected eventBus: EventBus
  ) {}

  public get currentLevel(): LevelDefinition {
    return LEVELS[this.currentLevelIndex] || LEVELS[0];
  }

  public get levelNumber(): number {
    return this.currentLevel.levelNumber;
  }

  public setLevel(levelNum: number): boolean {
    const idx = LEVELS.findIndex(l => l.levelNumber === levelNum);
    if (idx !== -1) {
      this.currentLevelIndex = idx;
      return true;
    }
    return false;
  }

  public startLevel(): void {
    this.levelStartedAt = Date.now();
  }

  public finishLevel(collectedCoins: number, tookZeroDamage: boolean = false): RewardBreakdown {
    const rewards = this.economyManager.calculateLevelRewards({
      levelNumber: this.levelNumber,
      collectedCoins,
      tookZeroDamage,
    });

    // Credit coins
    this.economyManager.addCoins(rewards.totalCoins);

    // Record stars (keep best)
    const currentStars = this.saveManager.data.levelStars[this.levelNumber] || 0;
    if (rewards.stars > currentStars) {
      this.saveManager.data.levelStars[this.levelNumber] = rewards.stars;
    }

    // Unlock next level up to 30
    const nextLevel = this.levelNumber + 1;
    if (nextLevel <= LEVELS.length && nextLevel > this.saveManager.data.unlockedLevel) {
      this.saveManager.data.unlockedLevel = nextLevel;
    }

    this.saveManager.saveData();

    this.eventBus.emit(GlobalEvents.LEVEL_FINISHED, {
      levelNumber: this.levelNumber,
      rewards,
      collectedCoins,
      tookZeroDamage,
      nextLevelUnlocked: nextLevel <= LEVELS.length,
    });

    return rewards;
  }

  public advanceToNextLevel(): boolean {
    if (this.currentLevelIndex + 1 < LEVELS.length) {
      this.currentLevelIndex++;
      return true;
    }
    return false;
  }
}
