import { SaveManager } from '../persistence/SaveManager';
import { ObstacleDef, CoinGroupDef, PowerUpDef } from '../levels/LevelDefinitions';
import { MathUtils } from '../utilities/MathUtils';

export interface GeneratedChunk {
  chunkIndex: number;
  startZ: number;
  endZ: number;
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

  public updateDistance(playerZ: number, pointsBonus: number = 0): void {
    this.currentDistance = Math.max(0, playerZ);
    this.currentScore = Math.floor(this.currentDistance * 1.5 + pointsBonus);

    // Check personal bests in memory
    if (this.currentDistance > this.saveManager.data.endless.bestDistance) {
      this.saveManager.data.endless.bestDistance = Math.floor(this.currentDistance);
    }
    if (this.currentScore > this.saveManager.data.endless.bestScore) {
      this.saveManager.data.endless.bestScore = Math.floor(this.currentScore);
    }
  }

  public saveRecord(): void {
    if (this.currentDistance > this.saveManager.data.endless.bestDistance) {
      this.saveManager.data.endless.bestDistance = Math.floor(this.currentDistance);
    }
    if (this.currentScore > this.saveManager.data.endless.bestScore) {
      this.saveManager.data.endless.bestScore = Math.floor(this.currentScore);
    }
    this.saveManager.saveData();
  }

  public getSpeedMultiplier(): number {
    // Gradual speed scaling up to +50% at 2000m
    return 1.0 + Math.min(0.5, (this.currentDistance / 2000) * 0.5);
  }

  public shouldGenerateNextChunk(playerZ: number): boolean {
    return playerZ + 250 > this.nextChunkZ;
  }

  public generateNextChunk(): GeneratedChunk {
    const startZ = this.nextChunkZ;
    const endZ = startZ + this.chunkLength;
    this.nextChunkZ = endZ;
    this.chunkCounter++;

    const obstacles: ObstacleDef[] = [];
    const coinGroups: CoinGroupDef[] = [];
    const powerUps: PowerUpDef[] = [];

    // Obstacles scale with chunkCounter (increasing frequency and hazard variety)
    if (this.chunkCounter > 1) {
      const allObstacleTypes: ObstacleDef['type'][] = [
        'barrier_small',
        'barrier_large',
        'traffic',
        'delivery_van',
        'heavy_truck',
        'traffic_cones',
        'oil_slick',
        'pothole',
        'spinner',
        'crusher',
        'swinging_barrier',
        'road_gate',
        'construction_zone',
      ];

      const numObstacles = this.chunkCounter > 8 && this.rng() > 0.5 ? 2 : 1;
      for (let i = 0; i < numObstacles; i++) {
        const obsTypeIndex = Math.floor(this.rng() * allObstacleTypes.length);
        const obsType = allObstacleTypes[obsTypeIndex];

        // Ensure fair open lane by choosing a distinct lane (-2.6, 0, or +2.6)
        const laneChoice = this.rng() > 0.66 ? -2.6 : this.rng() > 0.33 ? 2.6 : 0;
        const obsZ = startZ + (i === 0 ? 82 : 105);

        obstacles.push({
          type: obsType,
          x: laneChoice,
          z: obsZ,
          speed: obsType === 'traffic' || obsType === 'delivery_van' || obsType === 'heavy_truck' ? 6 + Math.min(6, this.chunkCounter * 0.25) : 3.5,
          range: obsType === 'traffic' ? 1.5 : undefined,
        });
      }
    }

    // Coins
    coinGroups.push({
      pattern: this.rng() > 0.5 ? 'arc' : 'line',
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
      obstacles,
      coinGroups,
      powerUps,
    };
  }
}
