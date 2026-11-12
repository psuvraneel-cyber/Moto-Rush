import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../persistence/SaveManager';

describe('SaveManager', () => {
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
  });

  it('loads default data when storage is empty', () => {
    const manager = new SaveManager();
    expect(manager.data.version).toBe(2);
    expect(manager.data.coins).toBe(0);
    expect(manager.data.unlockedLevel).toBe(1);
    expect(manager.data.selectedBikeId).toBe('street_racer');
  });

  it('safely recovers from corrupted or invalid json in storage', () => {
    localStorage.setItem('motorush3d_save_v2', '{corrupt json!@#$');
    const manager = new SaveManager();
    expect(manager.data.coins).toBe(0);
    expect(manager.data.unlockedLevel).toBe(1);
  });

  it('prevents negative coins and clamped fields', () => {
    const manager = new SaveManager();
    const validated = manager.validateAndMigrate({
      coins: -500,
      unlockedLevel: 99,
      upgrades: { acceleration: 10, starterFleet: 10 },
      settings: { sensitivity: 10 },
    });

    expect(validated.coins).toBe(0); // non-negative
    expect(validated.unlockedLevel).toBe(30); // clamped to 30
    expect(validated.upgrades.acceleration).toBe(5); // clamped to 5
    expect(validated.settings.sensitivity).toBe(2.5); // clamped to 2.5
  });

  it('safely migrates V1 save schema to V2 racing upgrades preserving 100% of player progress', () => {
    const v1Save = {
      version: 1,
      coins: 1450,
      unlockedLevel: 7,
      levelStars: { 1: 3, 2: 3, 3: 2 },
      selectedBikeId: 'urban_comet',
      unlockedBikes: ['street_racer', 'urban_comet'],
      upgrades: {
        starterFleet: 3,
        fleetRecovery: 2,
        coinBonus: 4,
        shieldDuration: 1,
        turboDuration: 2,
      },
      achievements: { first_ride: { unlocked: true, claimed: true, unlockedAt: 123456 } },
      dailyChallenges: { date: '2026-11-09', progress: {}, completed: {}, claimed: {} },
      endless: { bestDistance: 620, bestScore: 930 },
      settings: { musicVolume: 0.5, sfxVolume: 0.8, mute: false, sensitivity: 1.2, graphicsQuality: 'high', cameraShake: true, reducedMotion: false },
    };

    localStorage.setItem('motorush3d_save_v1', JSON.stringify(v1Save));
    const manager = new SaveManager();

    expect(manager.data.version).toBe(2);
    expect(manager.data.coins).toBe(1450);
    expect(manager.data.unlockedLevel).toBe(7);
    expect(manager.data.selectedBikeId).toBe('urban_comet');
    expect(manager.data.unlockedBikes).toEqual(['street_racer', 'urban_comet']);

    // V1 -> V2 upgrade mappings
    expect(manager.data.upgrades.acceleration).toBe(3); // mapped from starterFleet
    expect(manager.data.upgrades.handling).toBe(2);     // mapped from fleetRecovery
    expect(manager.data.upgrades.nitroCapacity).toBe(4); // mapped from coinBonus
    expect(manager.data.upgrades.shieldDuration).toBe(1);
    expect(manager.data.upgrades.turboDuration).toBe(2);
    expect(manager.data.endless.bestDistance).toBe(620);

    // Verify subsequent page reload (new SaveManager instance) preserves migrated data instead of "undefined" corruption
    const reloaded = new SaveManager();
    expect(reloaded.data.coins).toBe(1450);
    expect(reloaded.data.unlockedLevel).toBe(7);
    expect(reloaded.data.upgrades.acceleration).toBe(3);
    expect(reloaded.data.endless.bestDistance).toBe(620);
  });

  it('saves and reloads valid state', () => {
    const manager = new SaveManager();
    manager.data.coins = 250;
    manager.data.unlockedLevel = 4;
    manager.saveData();

    const reloadManager = new SaveManager();
    expect(reloadManager.data.coins).toBe(250);
    expect(reloadManager.data.unlockedLevel).toBe(4);
  });
});
