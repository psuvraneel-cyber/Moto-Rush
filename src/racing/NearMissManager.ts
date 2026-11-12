import * as THREE from 'three';
import { TrafficVehicle } from './TrafficVehicle';
import { EventBus, GlobalEvents } from '../core/EventBus';

export interface NearMissEvent {
  vehicleId: number;
  vehicleType: string;
  clearance: number;       // Lateral distance between bounding boxes (0.15m to 1.1m)
  playerSpeed: number;
  comboCount: number;
  timestamp: number;
}

export class NearMissManager {
  private eventBus?: EventBus;
  private totalNearMisses: number = 0;
  public static readonly MIN_CLEARANCE = 0.15;
  public static readonly MAX_CLEARANCE = 1.10;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  public get nearMisses(): number {
    return this.totalNearMisses;
  }

  public reset(): void {
    this.totalNearMisses = 0;
  }

  /**
   * Evaluates vehicles currently alongside the player motorcycle for sub-meter near misses.
   */
  public update(
    playerBox: THREE.Box3,
    playerSpeed: number,
    trafficVehicles: TrafficVehicle[],
    currentCombo: number
  ): NearMissEvent[] {
    const events: NearMissEvent[] = [];

    for (const v of trafficVehicles) {
      if (v.nearMissed) continue;

      // 1. Must overlap longitudinally (alongside each other in Z)
      const zOverlap = Math.min(playerBox.max.z, v.bounds.max.z) - Math.max(playerBox.min.z, v.bounds.min.z);
      if (zOverlap > 0.4) {
        // 2. Calculate lateral clearance between boxes
        let lateralClearance: number;
        if (playerBox.max.x < v.bounds.min.x) {
          lateralClearance = v.bounds.min.x - playerBox.max.x;
        } else if (v.bounds.max.x < playerBox.min.x) {
          lateralClearance = playerBox.min.x - v.bounds.max.x;
        } else {
          // Overlapping in X as well -> this is an actual collision, not a near miss!
          continue;
        }

        // 3. Verify sub-meter clearance bounds: 0.15m <= clearance <= 1.10m
        if (
          lateralClearance >= NearMissManager.MIN_CLEARANCE &&
          lateralClearance <= NearMissManager.MAX_CLEARANCE
        ) {
          v.nearMissed = true;
          this.totalNearMisses++;

          const event: NearMissEvent = {
            vehicleId: v.id,
            vehicleType: v.type,
            clearance: lateralClearance,
            playerSpeed,
            comboCount: currentCombo,
            timestamp: Date.now(),
          };

          events.push(event);

          if (this.eventBus) {
            this.eventBus.emit(GlobalEvents.NEAR_MISS, event);
          }
        }
      }
    }

    return events;
  }
}
