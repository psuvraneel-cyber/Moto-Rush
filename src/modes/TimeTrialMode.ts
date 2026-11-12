import { SaveManager } from '../persistence/SaveManager';

export class TimeTrialMode {
  public timeRemaining: number = 35.0; // Seconds
  public distance: number = 0;
  public checkpointsPassed: number = 0;
  public nextCheckpointZ: number = 250;
  public static readonly CHECKPOINT_INTERVAL = 250;
  public static readonly CHECKPOINT_TIME_BONUS = 15.0;
  public isExpired: boolean = false;

  constructor(private saveManager: SaveManager) {}

  public reset(startingTime: number = 35.0): void {
    this.timeRemaining = startingTime;
    this.distance = 0;
    this.checkpointsPassed = 0;
    this.nextCheckpointZ = TimeTrialMode.CHECKPOINT_INTERVAL;
    this.isExpired = false;
  }

  public addTime(seconds: number): void {
    this.timeRemaining = Math.min(60.0, this.timeRemaining + seconds);
  }

  public onNearMiss(): void {
    this.addTime(1.5);
  }

  public onOvertake(): void {
    this.addTime(0.5);
  }

  public update(dt: number, playerZ: number): { checkpointTriggered: boolean; timeExpired: boolean } {
    if (this.isExpired) return { checkpointTriggered: false, timeExpired: true };

    const clampedDt = Math.min(dt, 0.1);
    this.distance = Math.max(0, playerZ);
    this.timeRemaining -= clampedDt;

    let checkpointTriggered = false;
    if (playerZ >= this.nextCheckpointZ) {
      this.checkpointsPassed++;
      this.nextCheckpointZ += TimeTrialMode.CHECKPOINT_INTERVAL;
      this.addTime(TimeTrialMode.CHECKPOINT_TIME_BONUS);
      checkpointTriggered = true;
    }

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.isExpired = true;
      return { checkpointTriggered, timeExpired: true };
    }

    return { checkpointTriggered, timeExpired: false };
  }
}
