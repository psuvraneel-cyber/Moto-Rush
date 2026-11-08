import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from './EconomyManager';
import { EventBus, GlobalEvents } from '../core/EventBus';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  icon: string;
}

export class DailyChallengeManager {
  private todayDate: string = '';

  constructor(
    private saveManager: SaveManager,
    private economyManager: EconomyManager,
    private eventBus: EventBus
  ) {
    this.refreshForToday();
  }

  public get challenges(): DailyChallenge[] {
    return [
      {
        id: 'complete_levels',
        title: 'Road Warrior',
        description: 'Complete 3 campaign levels',
        target: 3,
        reward: 120,
        icon: '🏁',
      },
      {
        id: 'collect_coins',
        title: 'Bounty Hunter',
        description: 'Collect 80 gold coins',
        target: 80,
        reward: 100,
        icon: '🪙',
      },
      {
        id: 'pass_multipliers',
        title: 'Fleet Amplifier',
        description: 'Pass through 5 multiplier gates',
        target: 5,
        reward: 150,
        icon: '✖️',
      },
    ];
  }

  public refreshForToday(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.todayDate = today;

    const saved = this.saveManager.data.dailyChallenges;
    if (saved.date !== today) {
      saved.date = today;
      saved.progress = {};
      saved.completed = {};
      saved.claimed = {};
      this.saveManager.saveData();
    }
  }

  public getProgress(challengeId: string): number {
    this.refreshForToday();
    return this.saveManager.data.dailyChallenges.progress[challengeId] || 0;
  }

  public isCompleted(challengeId: string): boolean {
    this.refreshForToday();
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (!challenge) return false;
    return this.getProgress(challengeId) >= challenge.target;
  }

  public isClaimed(challengeId: string): boolean {
    this.refreshForToday();
    return Boolean(this.saveManager.data.dailyChallenges.claimed[challengeId]);
  }

  public addProgress(challengeId: string, amount: number = 1): void {
    this.refreshForToday();
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const current = this.getProgress(challengeId);
    const newProg = Math.min(challenge.target, current + amount);
    this.saveManager.data.dailyChallenges.progress[challengeId] = newProg;

    if (newProg >= challenge.target && !this.saveManager.data.dailyChallenges.completed[challengeId]) {
      this.saveManager.data.dailyChallenges.completed[challengeId] = true;
      this.eventBus.emit(GlobalEvents.DAILY_CHALLENGE_UPDATED, { challenge, completed: true });
    }

    this.saveManager.saveData();
  }

  public claimReward(challengeId: string): boolean {
    this.refreshForToday();
    if (!this.isCompleted(challengeId) || this.isClaimed(challengeId)) return false;

    const challenge = this.challenges.find(c => c.id === challengeId);
    if (!challenge) return false;

    this.saveManager.data.dailyChallenges.claimed[challengeId] = true;
    this.economyManager.addCoins(challenge.reward);
    this.saveManager.saveData();
    return true;
  }
}
