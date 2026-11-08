import { describe, it, expect } from 'vitest';
import { LevelValidator } from '../levels/LevelValidator';
import { LEVELS } from '../levels/LevelDefinitions';

describe('LevelValidator & Campaign Definitions', () => {
  it('has at least 30 campaign levels', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(30);
  });

  it('validates all 30 levels without errors', () => {
    const result = LevelValidator.validateAllLevels();
    if (!result.valid) {
      console.error('Level validation errors:', JSON.stringify(result.allErrors, null, 2));
    }
    expect(result.valid).toBe(true);
    expect(Object.keys(result.allErrors).length).toBe(0);
  });

  it('covers all 5 distinct environments in the campaign', () => {
    const envs = new Set(LEVELS.map(l => l.environmentId));
    expect(envs.size).toBe(5);
    expect(envs.has('sunny_city')).toBe(true);
    expect(envs.has('coastal_highway')).toBe(true);
    expect(envs.has('desert_expressway')).toBe(true);
    expect(envs.has('mountain_road')).toBe(true);
    expect(envs.has('neon_future')).toBe(true);
  });
});
