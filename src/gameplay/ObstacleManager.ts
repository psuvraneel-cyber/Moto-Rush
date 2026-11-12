import * as THREE from 'three';
import { Obstacle } from './Obstacle';
import { ObstacleDef } from '../levels/LevelDefinitions';
import { PlayerController } from '../player/PlayerController';
import { EventBus, GlobalEvents } from '../core/EventBus';

export class ObstacleManager {
  public group: THREE.Group;
  private obstacles: Obstacle[] = [];
  private prevHeroZ: number | null = null;

  constructor(
    private playerController: PlayerController,
    private eventBus: EventBus
  ) {
    this.group = new THREE.Group();
    this.group.name = 'obstacles_manager';
  }

  public get list(): Obstacle[] {
    return this.obstacles;
  }

  public loadObstacles(defs: ObstacleDef[]): void {
    this.clear();
    for (const def of defs) {
      const obs = new Obstacle(def);
      this.group.add(obs.mesh);
      this.obstacles.push(obs);
    }
  }

  public update(dt: number, heroPosition: THREE.Vector3, isShielded: boolean = false): void {
    const heroBox = new THREE.Box3();
    // Precise single-motorcycle collision box (0.9m width, 2.2m length, 1.6m height)
    const halfWidth = 0.45;
    const halfLength = 1.1;
    const height = 1.6;

    // Swept continuous collision checking between frames to prevent tunnelling at 34-45 m/s
    const zMin = this.prevHeroZ !== null && Math.abs(heroPosition.z - this.prevHeroZ) < 8.0
      ? Math.min(this.prevHeroZ, heroPosition.z) - halfLength
      : heroPosition.z - halfLength;
    const zMax = this.prevHeroZ !== null && Math.abs(heroPosition.z - this.prevHeroZ) < 8.0
      ? Math.max(this.prevHeroZ, heroPosition.z) + halfLength
      : heroPosition.z + halfLength;
    this.prevHeroZ = heroPosition.z;

    heroBox.min.set(heroPosition.x - halfWidth, 0, zMin);
    heroBox.max.set(heroPosition.x + halfWidth, height, zMax);

    for (const obs of this.obstacles) {
      obs.update(dt);

      if (obs.isHit) continue;

      // 1. Check Collision
      if (heroBox.intersectsBox(obs.bounds)) {
        if (obs.type === 'oil_slick') {
          // Triggers slippery steering without crash
          this.playerController.applyOilSlick();
          obs.isHit = true;
          this.eventBus.emit(GlobalEvents.OBSTACLE_HIT, {
            type: obs.type,
            damage: 0,
            lostBikes: 0,
            wasShielded: false,
          });
        } else {
          // Destructive obstacle collision
          obs.isHit = true;

          if (isShielded) {
            // Shield absorbed hit!
            this.eventBus.emit(GlobalEvents.OBSTACLE_HIT, {
              type: obs.type,
              damage: 0,
              lostBikes: 0,
              wasShielded: true,
            });
            this.eventBus.emit(GlobalEvents.CAMERA_SHAKE, { intensity: 0.22 });
          } else {
            this.eventBus.emit(GlobalEvents.OBSTACLE_HIT, {
              type: obs.type,
              damage: obs.damage,
              lostBikes: 1,
              wasShielded: false,
            });
            this.eventBus.emit(GlobalEvents.CAMERA_SHAKE, {
              intensity: obs.type === 'heavy_truck' || obs.type === 'crusher' ? 0.65 : 0.45,
            });
          }
        }
      }
      // 2. Near-Miss Detection: player has just passed alongside the obstacle safely
      else if (!obs.hasNearMissed && obs.type !== 'oil_slick') {
        const obsZ = obs.mesh.position.z;
        // Check when player's front passes the obstacle's rear plane
        if (heroPosition.z > obsZ - 0.5 && heroPosition.z - obsZ < 3.2) {
          const obsLeft = obs.bounds.min.x;
          const obsRight = obs.bounds.max.x;
          const heroLeft = heroBox.min.x;
          const heroRight = heroBox.max.x;

          // Lateral clearance gap
          let lateralClearance = 999;
          if (heroLeft > obsRight) {
            lateralClearance = heroLeft - obsRight;
          } else if (heroRight < obsLeft) {
            lateralClearance = obsLeft - heroRight;
          }

          if (lateralClearance > 0.05 && lateralClearance <= 1.8) {
            obs.hasNearMissed = true;
            this.eventBus.emit(GlobalEvents.NEAR_MISS, {
              type: obs.type,
              clearance: lateralClearance,
            });
          }
        }
      }
    }
  }

  public clear(): void {
    for (const obs of this.obstacles) {
      this.group.remove(obs.mesh);
    }
    this.obstacles = [];
    this.prevHeroZ = null;
  }
}
