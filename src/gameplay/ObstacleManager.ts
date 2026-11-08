import * as THREE from 'three';
import { Obstacle } from './Obstacle';
import { ObstacleDef } from '../levels/LevelDefinitions';
import { FleetManager } from '../convoy/FleetManager';
import { PlayerController } from '../player/PlayerController';
import { EventBus, GlobalEvents } from '../core/EventBus';

export class ObstacleManager {
  public group: THREE.Group;
  private obstacles: Obstacle[] = [];

  constructor(
    private fleetManager: FleetManager,
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
    // Approximate hero + convoy collision zone
    const fleetWidth = Math.min(6, 1.2 + Math.sqrt(this.fleetManager.count) * 0.4);
    heroBox.min.set(heroPosition.x - fleetWidth / 2, 0, heroPosition.z - 1.2);
    heroBox.max.set(heroPosition.x + fleetWidth / 2, 2.5, heroPosition.z + 1.2);

    for (const obs of this.obstacles) {
      obs.update(dt);

      if (obs.isHit) continue;

      // Check collision
      if (heroBox.intersectsBox(obs.bounds)) {
        if (obs.type === 'oil_slick') {
          // Triggers slippery steering without destroying bikes
          this.playerController.applyOilSlick();
          obs.isHit = true;
          this.eventBus.emit(GlobalEvents.OBSTACLE_HIT, {
            type: obs.type,
            lostBikes: 0,
            wasShielded: false,
          });
        } else {
          // Destructive obstacle
          obs.isHit = true;

          if (isShielded) {
            // Shield absorbed hit!
            this.eventBus.emit(GlobalEvents.OBSTACLE_HIT, {
              type: obs.type,
              lostBikes: 0,
              wasShielded: true,
            });
            this.eventBus.emit(GlobalEvents.CAMERA_SHAKE, { intensity: 0.2 });
          } else {
            const lost = this.fleetManager.takeDamage(obs.damage);
            this.eventBus.emit(GlobalEvents.OBSTACLE_HIT, {
              type: obs.type,
              lostBikes: lost,
              wasShielded: false,
            });
            this.eventBus.emit(GlobalEvents.CAMERA_SHAKE, { intensity: 0.45 });
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
  }
}
