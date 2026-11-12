export type EventCallback<T = any> = (payload: T) => void;

export class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);

    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback): void {
    const handlers = this.events.get(event);
    if (!handlers) return;
    this.events.set(
      event,
      handlers.filter(h => h !== callback)
    );
  }

  public emit<T = any>(event: string, payload?: T): void {
    const handlers = this.events.get(event);
    if (!handlers) return;
    for (const h of handlers) {
      try {
        h(payload);
      } catch (err) {
        console.error(`Error in EventBus handler for event "${event}":`, err);
      }
    }
  }

  public clear(): void {
    this.events.clear();
  }
}

export const GlobalEvents = {
  STATE_CHANGE: 'state:change',
  OBSTACLE_HIT: 'obstacle:hit',
  COIN_COLLECTED: 'coin:collected',
  POWERUP_COLLECTED: 'powerup:collected',
  POWERUP_EXPIRED: 'powerup:expired',
  LEVEL_PROGRESS: 'level:progress',
  LEVEL_FINISHED: 'level:finished',
  CAMERA_SHAKE: 'camera:shake',
  UI_NAVIGATE: 'ui:navigate',
  SETTINGS_CHANGED: 'settings:changed',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  DAILY_CHALLENGE_UPDATED: 'daily_challenge:updated',
  NEAR_MISS: 'game:near_miss',
  COMBO_UPDATED: 'combo:updated',
  OVERTAKE: 'game:overtake',
  NITRO_CHANGED: 'nitro:changed',
  NITRO_ENGAGED: 'nitro:engaged',
  NITRO_DISENGAGED: 'nitro:disengaged',
  RIVAL_OVERTAKEN: 'rival:overtaken',
} as const;
