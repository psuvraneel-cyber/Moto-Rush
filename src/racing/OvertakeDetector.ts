import * as THREE from 'three';
import { TrafficVehicle } from './TrafficVehicle';
import { EventBus, GlobalEvents } from '../core/EventBus';

export interface OvertakeEvent {
  vehicleId: number;
  vehicleType: string;
  speed: number;
  playerSpeed: number;
  comboCount: number;
  timestamp: number;
}

export class OvertakeDetector {
  private eventBus?: EventBus;
  private totalOvertakes: number = 0;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  public get overtakes(): number {
    return this.totalOvertakes;
  }

  public reset(): void {
    this.totalOvertakes = 0;
  }

  /**
   * Evaluates vehicles in traffic to detect newly completed overtakes.
   * An overtake occurs when the motorcycle was behind the vehicle and is now
   * longitudinally ahead of the vehicle's front boundary in an adjacent or different lane.
   */
  public update(
    playerBox: THREE.Box3,
    playerSpeed: number,
    trafficVehicles: TrafficVehicle[],
    currentCombo: number
  ): OvertakeEvent[] {
    const events: OvertakeEvent[] = [];
    const playerMinZ = playerBox.min.z;
    const playerMaxZ = playerBox.max.z;

    for (const v of trafficVehicles) {
      if (v.overtaken) continue;

      // Check if motorcycle has passed beyond the front bumper of the traffic vehicle
      if (playerMinZ > v.bounds.max.z) {
        // Must have been in an overtaking trajectory (within reasonable lateral distance, e.g. < 8m)
        const lateralDist = Math.abs(playerBox.min.x - v.mesh.position.x);
        if (lateralDist < 8.0) {
          v.overtaken = true;
          this.totalOvertakes++;

          const event: OvertakeEvent = {
            vehicleId: v.id,
            vehicleType: v.type,
            speed: v.speed,
            playerSpeed,
            comboCount: currentCombo,
            timestamp: Date.now(),
          };

          events.push(event);

          if (this.eventBus) {
            this.eventBus.emit(GlobalEvents.OVERTAKE, event);
          }
        }
      }
    }

    return events;
  }
}
