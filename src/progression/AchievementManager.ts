import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from './EconomyManager';
import { EventBus, GlobalEvents } from '../core/EventBus';

export interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  coinReward: number;
}

export const ACHIEVEMENTS_LIST: AchievementConfig[] = [
  {
    id: 'first_ride',
    title: 'First Ride',
    description: 'Complete your first campaign level',
    icon: '🏁',
    coinReward: 50,
  },
  {
    id: 'first_multiplier',
    title: 'First Multiplier',
    description: 'Pass through any multiplication gate',
    icon: '✖️',
    coinReward: 50,
  },
  {
    id: 'convoy_builder',
    title: 'Convoy Builder',
    description: 'Amass a convoy of at least 25 motorcycles',
    icon: '🛵',
    coinReward: 100,
  },
  {
    id: 'fleet_master',
    title: 'Fleet Master',
    description: 'Reach a legendary convoy size of 100 motorcycles',
    icon: '👑',
    coinReward: 300,
  },
  {
    id: 'perfect_run',
    title: 'Perfect Run',
    description: 'Earn a 3-star rating on any level',
    icon: '⭐',
    coinReward: 150,
  },
  {
    id: 'coin_collector',
    title: 'Coin Collector',
    description: 'Collect 150 coins across your career',
    icon: '💰',
    coinReward: 120,
  },
  {
    id: 'endless_explorer',
    title: 'Endless Explorer',
    description: 'Reach 500 meters in Endless Survival Mode',
    icon: '🚀',
    coinReward: 200,
  },
  {
    id: 'no_damage_run',
    title: 'Untouchable',
    description: 'Finish a campaign level without losing a single bike',
    icon: '🛡️',
    coinReward: 250,
  },
];

export class AchievementManager {
  constructor(
    private saveManager: SaveManager,
    private economyManager: EconomyManager,
    private eventBus: EventBus
  ) {}

  public get list(): AchievementConfig[] {
    return ACHIEVEMENTS_LIST;
  }

  public isUnlocked(id: string): boolean {
    return Boolean(this.saveManager.data.achievements[id]?.unlocked);
  }

  public isClaimed(id: string): boolean {
    return Boolean(this.saveManager.data.achievements[id]?.claimed);
  }

  public unlock(id: string): boolean {
    if (this.isUnlocked(id)) return false;

    const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
    if (!ach) return false;

    this.saveManager.data.achievements[id] = {
      unlocked: true,
      claimed: false,
      unlockedAt: Date.now(),
    };
    this.saveManager.saveData();

    this.eventBus.emit(GlobalEvents.ACHIEVEMENT_UNLOCKED, ach);
    return true;
  }

  public claim(id: string): boolean {
    if (!this.isUnlocked(id) || this.isClaimed(id)) return false;

    const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
    if (!ach) return false;

    this.saveManager.data.achievements[id].claimed = true;
    this.economyManager.addCoins(ach.coinReward);
    this.saveManager.saveData();
    return true;
  }
}
