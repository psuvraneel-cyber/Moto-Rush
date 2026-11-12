import { EventBus, GlobalEvents } from '../core/EventBus';

export interface RacingScoreStats {
  score: number;
  distance: number;
  overtakes: number;
  nearMisses: number;
  topSpeedKmH: number;
  maxCombo: number;
  cleanDistance: number;
  coinsEarned: number;
}

export class ScoreManager {
  private eventBus?: EventBus;

  public score: number = 0;
  public distance: number = 0;
  public overtakes: number = 0;
  public nearMisses: number = 0;
  public combo: number = 1;
  public comboStreak: number = 0;
  public maxComboAchieved: number = 1;
  public comboTimer: number = 0;
  public static readonly COMBO_TIMEOUT = 4.0; // Seconds before combo decays

  public cleanDistance: number = 0;
  public maxCleanDistance: number = 0;
  public topSpeedMps: number = 0;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  public get topSpeedKmH(): number {
    return Math.floor(this.topSpeedMps * 3.6);
  }

  public reset(): void {
    this.score = 0;
    this.distance = 0;
    this.overtakes = 0;
    this.nearMisses = 0;
    this.combo = 1;
    this.comboStreak = 0;
    this.maxComboAchieved = 1;
    this.comboTimer = 0;
    this.cleanDistance = 0;
    this.maxCleanDistance = 0;
    this.topSpeedMps = 0;
  }

  public addOvertake(): void {
    this.overtakes++;
    this.comboStreak++;
    this.combo = Math.min(10, 1 + Math.floor(this.comboStreak / 2));
    this.maxComboAchieved = Math.max(this.maxComboAchieved, this.combo);
    this.comboTimer = ScoreManager.COMBO_TIMEOUT;

    const basePoints = 250;
    const addedPoints = basePoints * this.combo;
    this.score += addedPoints;

    if (this.eventBus) {
      this.eventBus.emit(GlobalEvents.COMBO_UPDATED, {
        combo: this.combo,
        streak: this.comboStreak,
        addedScore: addedPoints,
      });
    }
  }

  public addNearMiss(): void {
    this.nearMisses++;
    this.comboStreak += 2; // Near miss is higher skill -> +2 to streak!
    this.combo = Math.min(10, 1 + Math.floor(this.comboStreak / 2));
    this.maxComboAchieved = Math.max(this.maxComboAchieved, this.combo);
    this.comboTimer = ScoreManager.COMBO_TIMEOUT;

    const basePoints = 500;
    const addedPoints = basePoints * this.combo;
    this.score += addedPoints;

    if (this.eventBus) {
      this.eventBus.emit(GlobalEvents.COMBO_UPDATED, {
        combo: this.combo,
        streak: this.comboStreak,
        addedScore: addedPoints,
      });
    }
  }

  public onCollision(): void {
    this.combo = 1;
    this.comboStreak = 0;
    this.comboTimer = 0;
    this.cleanDistance = 0;

    if (this.eventBus) {
      this.eventBus.emit(GlobalEvents.COMBO_UPDATED, {
        combo: 1,
        streak: 0,
        addedScore: 0,
      });
    }
  }

  public update(dt: number, speed: number, deltaZ: number): void {
    const clampedDt = Math.min(dt, 0.1);

    // Track distance and top speed
    this.distance += deltaZ;
    this.cleanDistance += deltaZ;
    this.maxCleanDistance = Math.max(this.maxCleanDistance, this.cleanDistance);
    if (speed > this.topSpeedMps) {
      this.topSpeedMps = speed;
    }

    // Distance points (10 pts per meter)
    this.score += Math.floor(deltaZ * 10 * this.combo);

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= clampedDt;
      if (this.comboTimer <= 0) {
        if (this.combo > 1) {
          this.combo--;
          this.comboTimer = ScoreManager.COMBO_TIMEOUT * 0.75;
          if (this.eventBus) {
            this.eventBus.emit(GlobalEvents.COMBO_UPDATED, {
              combo: this.combo,
              streak: this.comboStreak,
              addedScore: 0,
            });
          }
        }
      }
    }
  }

  public getFinalStats(coins: number): RacingScoreStats {
    return {
      score: this.score,
      distance: Math.floor(this.distance),
      overtakes: this.overtakes,
      nearMisses: this.nearMisses,
      topSpeedKmH: this.topSpeedKmH,
      maxCombo: this.maxComboAchieved,
      cleanDistance: Math.floor(this.maxCleanDistance),
      coinsEarned: coins,
    };
  }
}
