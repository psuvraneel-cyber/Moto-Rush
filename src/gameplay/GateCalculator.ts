import { GAME_CONFIG } from '../core/GameConfig';

export type GateOperation = 'ADD' | 'MULTIPLY' | 'SUBTRACT' | 'DIVIDE' | 'PERCENTAGE';

export interface GateEffect {
  operation: GateOperation;
  value: number;
}

export class GateCalculator {
  public static calculateNewFleet(currentFleet: number, effect: GateEffect): number {
    const minFleet = GAME_CONFIG.MIN_FLEET;
    const maxFleet = GAME_CONFIG.MAX_FLEET;

    let newCount = currentFleet;

    switch (effect.operation) {
      case 'ADD':
        newCount = currentFleet + effect.value;
        break;

      case 'MULTIPLY':
        newCount = currentFleet * effect.value;
        break;

      case 'SUBTRACT':
        newCount = Math.max(minFleet, currentFleet - effect.value);
        break;

      case 'DIVIDE':
        if (effect.value <= 0) {
          newCount = currentFleet;
        } else {
          newCount = Math.max(minFleet, Math.floor(currentFleet / effect.value));
        }
        break;

      case 'PERCENTAGE':
        // e.g., value = 0.5 for +50%
        newCount = Math.max(minFleet, Math.floor(currentFleet * (1 + effect.value)));
        break;

      default:
        newCount = currentFleet;
    }

    return Math.max(minFleet, Math.min(maxFleet, Math.floor(newCount)));
  }

  public static formatGateLabel(effect: GateEffect): string {
    switch (effect.operation) {
      case 'ADD':
        return `+${effect.value}`;
      case 'MULTIPLY':
        return `×${effect.value}`;
      case 'SUBTRACT':
        return `-${effect.value}`;
      case 'DIVIDE':
        return `÷${effect.value}`;
      case 'PERCENTAGE':
        return `+${Math.round(effect.value * 100)}%`;
      default:
        return `${effect.value}`;
    }
  }

  public static isPositive(effect: GateEffect): boolean {
    if (effect.operation === 'ADD' || effect.operation === 'MULTIPLY') return true;
    if (effect.operation === 'PERCENTAGE') return effect.value > 0;
    return false;
  }
}
