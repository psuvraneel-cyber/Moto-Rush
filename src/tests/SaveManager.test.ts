import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../persistence/SaveManager';
import { DEFAULT_SAVE_DATA } from '../persistence/SaveSchema';

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
    expect(manager.data.coins).toBe(0);
    expect(manager.data.unlockedLevel).toBe(1);
    expect(manager.data.selectedBikeId).toBe('street_racer');
  });

  it('safely recovers from corrupted or invalid json in storage', () => {
    localStorage.setItem('motorush3d_save_v1', '{corrupt json!@#$');
    const manager = new SaveManager();
    expect(manager.data.coins).toBe(0);
    expect(manager.data.unlockedLevel).toBe(1);
  });

  it('prevents negative coins and clamped fields', () => {
    const manager = new SaveManager();
    const validated = manager.validateAndMigrate({
      coins: -500,
      unlockedLevel: 99,
      upgrades: { starterFleet: 10 },
      settings: { sensitivity: 10 },
    });

    expect(validated.coins).toBe(0); // non-negative
    expect(validated.unlockedLevel).toBe(30); // clamped to 30
    expect(validated.upgrades.starterFleet).toBe(5); // clamped to 5
    expect(validated.settings.sensitivity).toBe(2.5); // clamped to 2.5
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
