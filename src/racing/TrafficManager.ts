import * as THREE from 'three';
import { TrafficVehicle, TrafficVehicleType, TRAFFIC_ARCHETYPES } from './TrafficVehicle';

export interface TrafficSpawnConfig {
  maxActiveVehicles: number;    // e.g. 10 to 18
  minSpawnDistance: number;     // Meters ahead of player (e.g. 85)
  maxSpawnDistance: number;     // Meters ahead of player (e.g. 210)
  recycleDistanceBehind: number;// Meters behind player to cull (e.g. 35)
  laneChangeChancePerSec: number;// Probability per second a vehicle evaluates a lane change (e.g. 0.15)
}

export const DEFAULT_TRAFFIC_CONFIG: TrafficSpawnConfig = {
  maxActiveVehicles: 12,
  minSpawnDistance: 85,
  maxSpawnDistance: 200,
  recycleDistanceBehind: 35,
  laneChangeChancePerSec: 0.15,
};

export class TrafficManager {
  public group: THREE.Group;
  public static readonly LANE_X: number[] = [-4.5, -1.5, 1.5, 4.5];
  private vehicles: TrafficVehicle[] = [];
  private nextVehicleId: number = 1;
  private config: TrafficSpawnConfig;
  private spawnCooldown: number = 0;

  // Types list for random selection weighted toward everyday traffic
  private vehicleTypeDeck: TrafficVehicleType[] = [
    'compact', 'compact', 'sedan', 'sedan', 'sedan',
    'sports_car', 'suv', 'suv', 'taxi', 'taxi',
    'delivery_van', 'delivery_van', 'bus', 'heavy_truck',
    'police', 'motorcycle'
  ];

  constructor(config?: Partial<TrafficSpawnConfig>) {
    this.group = new THREE.Group();
    this.group.name = 'traffic_system';
    this.config = { ...DEFAULT_TRAFFIC_CONFIG, ...config };
  }

  public get activeVehicles(): TrafficVehicle[] {
    return this.vehicles;
  }

  public get count(): number {
    return this.vehicles.length;
  }

  public setDensity(maxVehicles: number): void {
    this.config.maxActiveVehicles = Math.max(2, maxVehicles);
  }

  public clear(): void {
    for (const v of this.vehicles) {
      this.group.remove(v.mesh);
    }
    this.vehicles = [];
  }

  /**
   * Spawns a vehicle in a specific lane and Z position (useful for level definitions or script scenes)
   */
  public spawnVehicle(
    type: TrafficVehicleType,
    laneIndex: number,
    z: number,
    speed?: number,
    color?: number
  ): TrafficVehicle | null {
    const clampedLane = Math.max(0, Math.min(TrafficManager.LANE_X.length - 1, laneIndex));
    const posX = TrafficManager.LANE_X[clampedLane];

    const v = new TrafficVehicle(this.nextVehicleId++, type, color);
    v.currentLane = clampedLane;
    v.targetLane = clampedLane;
    v.mesh.position.set(posX, 0, z);
    if (speed !== undefined) {
      v.speed = speed;
      v.baseSpeed = speed;
    }
    v.updateBounds();

    this.vehicles.push(v);
    this.group.add(v.mesh);
    return v;
  }

  /**
   * Checks if spawning or moving a vehicle to targetLane at targetZ would block all lanes.
   * Returns true if at least one clear lane corridor remains.
   */
  public isRoutePreserved(targetLane: number, targetZ: number, windowMeters: number = 18): boolean {
    const lanesBlocked = new Set<number>();
    lanesBlocked.add(targetLane);

    for (const v of this.vehicles) {
      if (Math.abs(v.mesh.position.z - targetZ) <= windowMeters) {
        lanesBlocked.add(v.currentLane);
        if (v.isChangingLane) {
          lanesBlocked.add(v.targetLane);
        }
      }
    }

    // If all 4 lanes are blocked in this slice, anti-block fails!
    return lanesBlocked.size < TrafficManager.LANE_X.length;
  }

  /**
   * Checks if a lane has enough longitudinal clearance around targetZ.
   */
  public hasLaneClearance(laneIndex: number, targetZ: number, minClearance: number = 22): boolean {
    for (const v of this.vehicles) {
      const usesLane = v.currentLane === laneIndex || (v.isChangingLane && v.targetLane === laneIndex);
      if (usesLane && Math.abs(v.mesh.position.z - targetZ) < minClearance) {
        return false;
      }
    }
    return true;
  }

  private trySpawnAhead(playerZ: number): void {
    if (this.vehicles.length >= this.config.maxActiveVehicles) return;

    // Pick random vehicle type and random lane
    const type = this.vehicleTypeDeck[Math.floor(Math.random() * this.vehicleTypeDeck.length)];
    const laneIndex = Math.floor(Math.random() * TrafficManager.LANE_X.length);
    const spawnZ = playerZ + this.config.minSpawnDistance + Math.random() * (this.config.maxSpawnDistance - this.config.minSpawnDistance);

    // Verify clearance and anti-block route guarantee
    if (this.hasLaneClearance(laneIndex, spawnZ, 26) && this.isRoutePreserved(laneIndex, spawnZ, 20)) {
      this.spawnVehicle(type, laneIndex, spawnZ);
    }
  }

  private updateLaneFollowingAndAI(dt: number): void {
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];

      // 1. Safe following distance: inspect vehicle ahead in the same lane
      let nearestAhead: TrafficVehicle | null = null;
      let minGap = Infinity;

      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (other.currentLane === v.currentLane && other.mesh.position.z > v.mesh.position.z) {
          const gap = other.mesh.position.z - v.mesh.position.z;
          if (gap < minGap) {
            minGap = gap;
            nearestAhead = other;
          }
        }
      }

      // If approaching vehicle ahead too closely (< 20m), slow down to match or initiate lane change
      if (nearestAhead && minGap < 22) {
        v.speed = Math.min(v.speed, nearestAhead.speed * 0.95);

        // Attempt lane change to pass
        if (!v.isChangingLane && Math.random() < 0.05) {
          this.attemptLaneChange(v);
        }
      } else {
        // Accelerate gently back to base speed
        if (v.speed < v.baseSpeed) {
          v.speed = Math.min(v.baseSpeed, v.speed + 6.0 * dt);
        }
      }

      // 2. Occasional spontaneous lane changes
      if (!v.isChangingLane && Math.random() < this.config.laneChangeChancePerSec * dt) {
        this.attemptLaneChange(v);
      }

      // Update vehicle kinematics
      v.update(dt);
    }
  }

  private attemptLaneChange(v: TrafficVehicle): void {
    const cur = v.currentLane;
    const candidates: number[] = [];
    if (cur > 0) candidates.push(cur - 1);
    if (cur < TrafficManager.LANE_X.length - 1) candidates.push(cur + 1);

    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];

    // Check clearance in target lane and ensure anti-block guarantee
    if (
      this.hasLaneClearance(target, v.mesh.position.z, 24) &&
      this.isRoutePreserved(target, v.mesh.position.z, 18)
    ) {
      v.startLaneChange(target, TrafficManager.LANE_X[target]);
    }
  }

  public update(dt: number, playerX: number, playerZ: number): void {
    const clampedDt = Math.min(dt, 0.1);

    // Update traffic AI and positions
    this.updateLaneFollowingAndAI(clampedDt);

    // Recycle vehicles that fall behind player
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      if (v.mesh.position.z < playerZ - this.config.recycleDistanceBehind) {
        this.group.remove(v.mesh);
        this.vehicles.splice(i, 1);
      }
    }

    // Spawn new vehicles ahead
    this.spawnCooldown -= clampedDt;
    if (this.spawnCooldown <= 0) {
      this.trySpawnAhead(playerZ);
      this.spawnCooldown = 0.4 + Math.random() * 0.5;
    }
  }

  /**
   * Fast AABB collision test against the player motorcycle bounding box.
   */
  public checkCollisions(heroBox: THREE.Box3): TrafficVehicle | null {
    for (const v of this.vehicles) {
      if (v.bounds.intersectsBox(heroBox)) {
        return v;
      }
    }
    return null;
  }
}
