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
    id: 'first_overtake',
    title: 'First Overtake',
    description: 'Execute a clean pass in traffic',
    icon: '⚡',
    coinReward: 50,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Maintain high cruising speed on the highway',
    icon: '🚀',
    coinReward: 100,
  },
  {
    id: 'highway_master',
    title: 'Highway Master',
    description: 'Conquer the expressway with elite distance',
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
    description: 'Reach 500 meters in Traffic Rush Mode',
    icon: '🏎️',
    coinReward: 200,
  },
  {
    id: 'no_damage_run',
    title: 'Untouchable',
    description: 'Finish a campaign level without taking any collision damage',
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
