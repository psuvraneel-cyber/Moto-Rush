import { CampaignMode } from './CampaignMode';
import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager, RewardBreakdown } from '../progression/EconomyManager';
import { EventBus, GlobalEvents } from '../core/EventBus';
import { LEVELS, LevelDefinition } from '../levels/LevelDefinitions';

export type RacingObjectiveType =
  | 'reach_finish'
  | 'overtake_count'
  | 'time_limit'
  | 'clean_run'
  | 'near_miss_count'
  | 'defeat_rivals';

export interface CareerObjective {
  type: RacingObjectiveType;
  description: string;
  targetValue: number;
}

export class CareerMode extends CampaignMode {
  constructor(saveManager: SaveManager, economyManager: EconomyManager, eventBus: EventBus) {
    super(saveManager, economyManager, eventBus);
  }

  /**
   * Generates a clear racing objective for each career event level.
   */
  public getLevelObjective(levelNum: number): CareerObjective {
    if (levelNum % 6 === 0) {
      return {
        type: 'defeat_rivals',
        description: 'Finish 1st place ahead of rival racers',
        targetValue: 1,
      };
    } else if (levelNum % 5 === 0) {
      return {
        type: 'near_miss_count',
        description: `Perform at least ${Math.min(8, 3 + Math.floor(levelNum / 5))} near misses`,
        targetValue: Math.min(8, 3 + Math.floor(levelNum / 5)),
      };
    } else if (levelNum % 3 === 0) {
      return {
        type: 'overtake_count',
        description: `Overtake at least ${Math.min(25, 8 + Math.floor(levelNum / 2))} traffic vehicles`,
        targetValue: Math.min(25, 8 + Math.floor(levelNum / 2)),
      };
    } else if (levelNum % 2 === 0) {
      return {
        type: 'time_limit',
        description: `Reach finish line within ${Math.max(30, 60 - Math.floor(levelNum / 3))}s`,
        targetValue: Math.max(30, 60 - Math.floor(levelNum / 3)),
      };
    } else {
      return {
        type: 'clean_run',
        description: 'Complete the track without colliding with traffic',
        targetValue: 0,
      };
    }
  }

  public evaluateStars(
    levelNum: number,
    stats: {
      zeroDamage: boolean;
      overtakes: number;
      nearMisses: number;
      timeElapsedSeconds: number;
      rank?: number;
    }
  ): number {
    let stars = 1; // Completed the course
    const obj = this.getLevelObjective(levelNum);

    // Star 2: Main objective met
    switch (obj.type) {
      case 'defeat_rivals':
        if (stats.rank !== undefined && stats.rank <= 1) stars++;
        break;
      case 'near_miss_count':
        if (stats.nearMisses >= obj.targetValue) stars++;
        break;
      case 'overtake_count':
        if (stats.overtakes >= obj.targetValue) stars++;
        break;
      case 'time_limit':
        if (stats.timeElapsedSeconds <= obj.targetValue) stars++;
        break;
      case 'clean_run':
        if (stats.zeroDamage) stars++;
        break;
      default:
        stars++;
    }

    // Star 3: Mastery performance (clean driving or high near misses)
    if (stats.zeroDamage || stats.nearMisses >= 4 || (stats.rank !== undefined && stats.rank === 1)) {
      stars = Math.min(3, stars + 1);
    }

    return stars;
  }

  public finishCareerLevel(
    collectedCoins: number,
    zeroDamage: boolean,
    calculatedStars: number
  ): RewardBreakdown {
    const rewards = this.economyManager.calculateLevelRewards({
      levelNumber: this.levelNumber,
      collectedCoins,
      tookZeroDamage: zeroDamage,
    });
    rewards.stars = calculatedStars;

    // Credit coins
    this.economyManager.addCoins(rewards.totalCoins);

    // Record stars (keep best)
    const currentStars = this.saveManager.data.levelStars[this.levelNumber] || 0;
    if (calculatedStars > currentStars) {
      this.saveManager.data.levelStars[this.levelNumber] = calculatedStars;
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
      tookZeroDamage: zeroDamage,
      nextLevelUnlocked: nextLevel <= LEVELS.length,
    });

    return rewards;
  }
}
