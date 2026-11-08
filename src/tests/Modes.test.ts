import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CampaignMode } from '../modes/CampaignMode';
import { EndlessMode } from '../modes/EndlessMode';
import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from '../progression/EconomyManager';
import { EventBus } from '../core/EventBus';

describe('Game Modes (Campaign & Endless)', () => {
  let saveManager: SaveManager;
  let economyManager: EconomyManager;
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
    eventBus = new EventBus();
  });

  it('progresses campaign levels and unlocks new levels', () => {
    const campaign = new CampaignMode(saveManager, economyManager, eventBus);
    expect(campaign.levelNumber).toBe(1);

    const rewards = campaign.finishLevel(15, 25);
    expect(rewards.totalCoins).toBeGreaterThan(0);
    expect(saveManager.data.unlockedLevel).toBe(2);

    const advanced = campaign.advanceToNextLevel();
    expect(advanced).toBe(true);
    expect(campaign.levelNumber).toBe(2);
  });

  it('generates deterministic endless chunks and updates records', () => {
    const endless = new EndlessMode(saveManager, 42);
    expect(endless.distance).toBe(0);

    const chunk1 = endless.generateNextChunk();
    expect(chunk1.chunkIndex).toBe(1);
    expect(chunk1.gatePairs.length).toBeGreaterThan(0);

    endless.updateDistance(450, 20);
    expect(endless.distance).toBe(450);
    expect(endless.bestDistance).toBe(450);
  });
});
