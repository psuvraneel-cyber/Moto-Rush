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

    if (level.startingFleet < 1) {
      errors.push(`Starting fleet must be >= 1, got ${level.startingFleet}`);
    }

    // Check gate pairs
    let lastGateZ = 0;
    for (const gp of level.gatePairs) {
      if (gp.z <= 0 || gp.z >= level.trackLength - 30) {
        errors.push(`GatePair z=${gp.z} out of bounds for trackLength=${level.trackLength}`);
      }
      if (gp.z <= lastGateZ + 40) {
        errors.push(`GatePairs too close together at z=${gp.z} (last was ${lastGateZ})`);
      }
      lastGateZ = gp.z;

      if (!['ADD', 'MULTIPLY', 'SUBTRACT', 'DIVIDE', 'PERCENTAGE'].includes(gp.left.operation)) {
        errors.push(`Invalid left gate operation: ${gp.left.operation}`);
      }
      if (!['ADD', 'MULTIPLY', 'SUBTRACT', 'DIVIDE', 'PERCENTAGE'].includes(gp.right.operation)) {
        errors.push(`Invalid right gate operation: ${gp.right.operation}`);
      }
    }

    // Check obstacles: never placed directly on top of or 10m directly after a gate
    for (const obs of level.obstacles) {
      if (obs.z <= 0 || obs.z >= level.trackLength - 20) {
        errors.push(`Obstacle z=${obs.z} out of track bounds`);
      }
      for (const gp of level.gatePairs) {
        if (Math.abs(obs.z - gp.z) < 12) {
          errors.push(`Obstacle at z=${obs.z} too close to gate at z=${gp.z}`);
        }
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
