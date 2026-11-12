import * as THREE from 'three';
import { RivalRacer, RIVAL_ROSTER, RivalProfile } from './RivalRacer';
import { TrafficManager } from '../racing/TrafficManager';
import { EventBus, GlobalEvents } from '../core/EventBus';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  z: number;
  isPlayer: boolean;
}

export class RivalRaceManager {
  public group: THREE.Group;
  private rivals: RivalRacer[] = [];
  private eventBus?: EventBus;
  private overtakenRivals: Set<number> = new Set();

  constructor(eventBus?: EventBus) {
    this.group = new THREE.Group();
    this.group.name = 'rival_racers';
    this.eventBus = eventBus;
  }

  public get count(): number {
    return this.rivals.length;
  }

  public get activeRivals(): RivalRacer[] {
    return this.rivals;
  }

  public clear(): void {
    for (const r of this.rivals) {
      this.group.remove(r.mesh);
    }
    this.rivals = [];
    this.overtakenRivals.clear();
  }

  /**
   * Spawns rival racers ahead of player starting grid
   */
  public spawnRivals(count: number = 3, startBaseZ: number = 30): void {
    this.clear();
    const clampedCount = Math.min(RIVAL_ROSTER.length, Math.max(1, count));

    for (let i = 0; i < clampedCount; i++) {
      const profile = RIVAL_ROSTER[i];
      // Assign distinct lanes across the 4 highway lanes
      const lane = (i + 1) % TrafficManager.LANE_X.length;
      const startZ = startBaseZ + (i * 22);

      const rival = new RivalRacer(profile, lane, startZ);
      this.rivals.push(rival);
      this.group.add(rival.mesh);
    }
  }

  public update(dt: number, trafficManager: TrafficManager, playerZ: number): void {
    const traffic = trafficManager.activeVehicles;

    for (const rival of this.rivals) {
      rival.update(dt, traffic);

      // Check if player has overtaken this rival
      if (!this.overtakenRivals.has(rival.profile.id)) {
        if (playerZ > rival.mesh.position.z + 1.2) {
          this.overtakenRivals.add(rival.profile.id);
          if (this.eventBus) {
            this.eventBus.emit(GlobalEvents.RIVAL_OVERTAKEN, {
              rivalId: rival.profile.id,
              name: rival.profile.name,
              playerZ,
            });
          }
        }
      }
    }
  }

  /**
   * Calculates live race ranking across player and rivals based on forward track distance (Z).
   */
  public getLeaderboard(playerZ: number): { playerRank: number; totalRacers: number; standings: LeaderboardEntry[] } {
    const allRacers: { name: string; z: number; isPlayer: boolean }[] = [
      { name: 'YOU', z: playerZ, isPlayer: true }
    ];

    for (const r of this.rivals) {
      allRacers.push({
        name: r.profile.name,
        z: r.mesh.position.z,
        isPlayer: false,
      });
    }

    // Sort descending by forward track position Z
    allRacers.sort((a, b) => b.z - a.z);

    let playerRank = 1;
    const standings: LeaderboardEntry[] = allRacers.map((racer, idx) => {
      const rank = idx + 1;
      if (racer.isPlayer) playerRank = rank;
      return {
        rank,
        name: racer.name,
        z: racer.z,
        isPlayer: racer.isPlayer,
      };
    });

    return {
      playerRank,
      totalRacers: allRacers.length,
      standings,
    };
  }

  /**
   * Fast AABB collision test against the player motorcycle bounding box.
   */
  public checkCollisions(heroBox: THREE.Box3): RivalRacer | null {
    for (const r of this.rivals) {
      if (r.bounds.intersectsBox(heroBox)) {
        return r;
      }
    }
    return null;
  }
}
