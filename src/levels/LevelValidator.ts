import { LevelDefinition, LEVELS } from './LevelDefinitions';
import { ENVIRONMENTS } from '../core/GameConfig';

export class LevelValidator {
  public static validateLevel(level: LevelDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (level.levelNumber <= 0 || !Number.isInteger(level.levelNumber)) {
      errors.push(`Invalid levelNumber: ${level.levelNumber}`);
    }

    if (!ENVIRONMENTS[level.environmentId]) {
      errors.push(`Unknown environmentId: ${level.environmentId}`);
    }

    if (level.trackLength < 200) {
      errors.push(`Track length ${level.trackLength} is too short (min 200)`);
    }

    // Check obstacles bounds
    for (const obs of level.obstacles) {
      if (obs.z <= 0 || obs.z >= level.trackLength - 20) {
        errors.push(`Obstacle z=${obs.z} out of track bounds`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public static validateAllLevels(): { valid: boolean; totalLevels: number; allErrors: Record<number, string[]> } {
    const allErrors: Record<number, string[]> = {};
    let overallValid = true;

    for (const lvl of LEVELS) {
      const res = this.validateLevel(lvl);
      if (!res.valid) {
        overallValid = false;
        allErrors[lvl.levelNumber] = res.errors;
      }
    }

    return {
      valid: overallValid,
      totalLevels: LEVELS.length,
      allErrors,
    };
  }
}
