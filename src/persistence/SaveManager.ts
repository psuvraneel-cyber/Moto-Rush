import { CurrentSaveSchema, DEFAULT_SAVE_DATA } from './SaveSchema';

export class SaveManager {
  private static readonly STORAGE_KEY = 'motorush3d_save_v1';
  private currentData: CurrentSaveSchema;

  constructor() {
    this.currentData = this.loadData();
  }

  public get data(): CurrentSaveSchema {
    return this.currentData;
  }

  public loadData(): CurrentSaveSchema {
    try {
      const raw = localStorage.getItem(SaveManager.STORAGE_KEY);
      if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
      }

      const parsed = JSON.parse(raw);
      return this.validateAndMigrate(parsed);
    } catch (e) {
      console.warn('Failed to load save data from localStorage, falling back to defaults:', e);
      return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    }
  }

  public saveData(): boolean {
    try {
      localStorage.setItem(SaveManager.STORAGE_KEY, JSON.stringify(this.currentData));
      return true;
    } catch (e) {
      console.error('Failed to write save data to localStorage:', e);
      return false;
    }
  }

  public validateAndMigrate(input: any): CurrentSaveSchema {
    if (!input || typeof input !== 'object') {
      return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    }

    // Clone defaults to fill in any missing fields
    const validated: CurrentSaveSchema = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));

    if (typeof input.coins === 'number' && !isNaN(input.coins) && input.coins >= 0) {
      validated.coins = Math.floor(input.coins);
    }
    if (typeof input.unlockedLevel === 'number' && input.unlockedLevel >= 1) {
      validated.unlockedLevel = Math.max(1, Math.min(30, Math.floor(input.unlockedLevel)));
    }
    if (input.levelStars && typeof input.levelStars === 'object') {
      validated.levelStars = { ...input.levelStars };
    }
    if (typeof input.selectedBikeId === 'string' && input.selectedBikeId.length > 0) {
      validated.selectedBikeId = input.selectedBikeId;
    }
    if (Array.isArray(input.unlockedBikes) && input.unlockedBikes.length > 0) {
      validated.unlockedBikes = Array.from(new Set(input.unlockedBikes.filter((b: unknown): b is string => typeof b === 'string')));
    }
    if (input.upgrades && typeof input.upgrades === 'object') {
      validated.upgrades = {
        starterFleet: Math.max(0, Math.min(5, Number(input.upgrades.starterFleet) || 0)),
        coinBonus: Math.max(0, Math.min(5, Number(input.upgrades.coinBonus) || 0)),
        shieldDuration: Math.max(0, Math.min(5, Number(input.upgrades.shieldDuration) || 0)),
        turboDuration: Math.max(0, Math.min(5, Number(input.upgrades.turboDuration) || 0)),
        fleetRecovery: Math.max(0, Math.min(5, Number(input.upgrades.fleetRecovery) || 0)),
      };
    }
    if (input.achievements && typeof input.achievements === 'object') {
      validated.achievements = { ...input.achievements };
    }
    if (input.dailyChallenges && typeof input.dailyChallenges === 'object') {
      validated.dailyChallenges = {
        date: String(input.dailyChallenges.date || ''),
        progress: input.dailyChallenges.progress || {},
        completed: input.dailyChallenges.completed || {},
        claimed: input.dailyChallenges.claimed || {},
      };
    }
    if (input.endless && typeof input.endless === 'object') {
      validated.endless = {
        bestDistance: Math.max(0, Number(input.endless.bestDistance) || 0),
        bestScore: Math.max(0, Number(input.endless.bestScore) || 0),
      };
    }
    if (input.settings && typeof input.settings === 'object') {
      validated.settings = {
        musicVolume: Math.max(0, Math.min(1, Number(input.settings.musicVolume) ?? 0.7)),
        sfxVolume: Math.max(0, Math.min(1, Number(input.settings.sfxVolume) ?? 0.85)),
        mute: Boolean(input.settings.mute),
        sensitivity: Math.max(0.5, Math.min(2.5, Number(input.settings.sensitivity) ?? 1.0)),
        graphicsQuality: ['low', 'medium', 'high'].includes(input.settings.graphicsQuality)
          ? input.settings.graphicsQuality
          : 'high',
        cameraShake: input.settings.cameraShake !== false,
        reducedMotion: Boolean(input.settings.reducedMotion),
      };
    }

    this.currentData = validated;
    return validated;
  }

  public resetProgress(): void {
    this.currentData = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    this.saveData();
  }
}
