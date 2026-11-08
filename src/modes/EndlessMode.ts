import { SaveManager } from '../persistence/SaveManager';
import { GatePairDef, ObstacleDef, CoinGroupDef, PowerUpDef } from '../levels/LevelDefinitions';
import { GateEffect } from '../gameplay/GateCalculator';
import { MathUtils } from '../utilities/MathUtils';

export interface GeneratedChunk {
  chunkIndex: number;
  startZ: number;
  endZ: number;
  gatePairs: GatePairDef[];
  obstacles: ObstacleDef[];
  coinGroups: CoinGroupDef[];
  powerUps: PowerUpDef[];
}

export class EndlessMode {
  private currentDistance: number = 0;
  private currentScore: number = 0;
  private rng: () => number;
  private chunkLength: number = 120;
  private nextChunkZ: number = 80;
  private chunkCounter: number = 0;

  constructor(private saveManager: SaveManager, seed: number = 12345) {
    this.rng = MathUtils.createSeededRandom(seed);
  }

  public get distance(): number {
    return Math.floor(this.currentDistance);
  }

  public get score(): number {
    return Math.floor(this.currentScore);
  }

  public get bestDistance(): number {
    return this.saveManager.data.endless.bestDistance;
  }

  public get bestScore(): number {
    return this.saveManager.data.endless.bestScore;
  }

  public reset(seed?: number): void {
    this.currentDistance = 0;
    this.currentScore = 0;
    this.nextChunkZ = 80;
    this.chunkCounter = 0;
    if (seed !== undefined) {
      this.rng = MathUtils.createSeededRandom(seed);
    }
  }

  public updateDistance(playerZ: number, fleetCount: number): void {
    this.currentDistance = Math.max(0, playerZ);
    this.currentScore += fleetCount * 0.1;

    // Check personal bests
    if (this.currentDistance > this.saveManager.data.endless.bestDistance) {
      this.saveManager.data.endless.bestDistance = Math.floor(this.currentDistance);
    }
    if (this.currentScore > this.saveManager.data.endless.bestScore) {
      this.saveManager.data.endless.bestScore = Math.floor(this.currentScore);
    }
    this.saveManager.saveData();
  }

  public shouldGenerateNextChunk(playerZ: number): boolean {
    return playerZ + 250 > this.nextChunkZ;
  }

  public generateNextChunk(): GeneratedChunk {
    const startZ = this.nextChunkZ;
    const endZ = startZ + this.chunkLength;
    this.nextChunkZ = endZ;
    this.chunkCounter++;

    const gatePairs: GatePairDef[] = [];
    const obstacles: ObstacleDef[] = [];
    const coinGroups: CoinGroupDef[] = [];
    const powerUps: PowerUpDef[] = [];

    // Gate pair midway through chunk
    const gateZ = startZ + 45;
    const isMult = this.rng() > 0.4;
    const leftEffect: GateEffect = isMult
      ? { operation: 'MULTIPLY', value: this.rng() > 0.6 ? 3 : 2 }
      : { operation: 'ADD', value: Math.floor(5 + this.rng() * 20) };

    const rightEffect: GateEffect = this.rng() > 0.5
      ? { operation: 'SUBTRACT', value: Math.floor(5 + this.rng() * 15) }
      : { operation: 'DIVIDE', value: 2 };

    // Swap sides randomly
    const swap = this.rng() > 0.5;
    gatePairs.push({
      z: gateZ,
      left: swap ? rightEffect : leftEffect,
      right: swap ? leftEffect : rightEffect,
    });

    // Obstacles ahead of or after gate (avoiding direct collision with gate)
    if (this.chunkCounter > 1) {
      const obsType = this.rng() > 0.6 ? 'traffic' : this.rng() > 0.5 ? 'barrier_small' : 'spinner';
      const obsX = (this.rng() - 0.5) * 4.5;
      obstacles.push({
        type: obsType,
        x: obsX,
        z: startZ + 85,
        speed: obsType === 'traffic' ? 8 : 4,
      });
    }

    // Coins
    coinGroups.push({
      pattern: 'line',
      startX: (this.rng() - 0.5) * 4.0,
      startZ: startZ + 15,
      count: 6,
    });

    // Occasional power-up
    if (this.rng() > 0.65) {
      const types: PowerUpDef['type'][] = ['shield', 'turbo', 'magnet', 'repair', 'double_coins'];
      const chosen = types[Math.floor(this.rng() * types.length)];
      powerUps.push({
        type: chosen,
        x: (this.rng() - 0.5) * 4.0,
        z: startZ + 70,
      });
    }

    return {
      chunkIndex: this.chunkCounter,
      startZ,
      endZ,
      gatePairs,
      obstacles,
      coinGroups,
      powerUps,
    };
  }
}
