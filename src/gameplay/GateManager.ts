import * as THREE from 'three';
import { Gate } from './Gate';
import { GatePairDef } from '../levels/LevelDefinitions';
import { GateCalculator } from './GateCalculator';
import { FleetManager } from '../convoy/FleetManager';
import { EventBus, GlobalEvents } from '../core/EventBus';

export interface ActiveGatePair {
  z: number;
  leftGate: Gate;
  rightGate: Gate;
  isResolved: boolean;
}

export class GateManager {
  public group: THREE.Group;
  private activePairs: ActiveGatePair[] = [];

  constructor(
    private fleetManager: FleetManager,
    private eventBus: EventBus
  ) {
    this.group = new THREE.Group();
    this.group.name = 'gates_manager';
  }

  public get pairs(): ActiveGatePair[] {
    return this.activePairs;
  }

  public loadGatePairs(defs: GatePairDef[]): void {
    this.clear();

    const gateWidth = 4.8;
    const laneOffset = 2.7;

    for (const def of defs) {
      const leftGate = new Gate(def.left, gateWidth);
      leftGate.mesh.position.set(-laneOffset, 0, def.z);
      leftGate.updateBounds();

      const rightGate = new Gate(def.right, gateWidth);
      rightGate.mesh.position.set(laneOffset, 0, def.z);
      rightGate.updateBounds();

      this.group.add(leftGate.mesh, rightGate.mesh);

      this.activePairs.push({
        z: def.z,
        leftGate,
        rightGate,
        isResolved: false,
      });
    }
  }

  public update(dt: number, playerX: number, playerZ: number): void {
    const triggerThreshold = 1.2;

    for (const pair of this.activePairs) {
      // Update visual pulse animations
      pair.leftGate.update(dt);
      pair.rightGate.update(dt);

      if (pair.isResolved) continue;

      // Check if player is passing through the gate plane (z distance)
      if (Math.abs(playerZ - pair.z) <= triggerThreshold) {
        // Determine whether player passed left or right
        const selectedGate = playerX < 0 ? pair.leftGate : pair.rightGate;
        const otherGate = playerX < 0 ? pair.rightGate : pair.leftGate;

        pair.isResolved = true;
        selectedGate.trigger();

        const currentFleet = this.fleetManager.count;
        const newFleet = GateCalculator.calculateNewFleet(currentFleet, selectedGate.effect);
        const delta = newFleet - currentFleet;

        this.fleetManager.setFleet(newFleet);

        this.eventBus.emit(GlobalEvents.GATE_PASSED, {
          effect: selectedGate.effect,
          label: GateCalculator.formatGateLabel(selectedGate.effect),
          delta,
          isPositive: GateCalculator.isPositive(selectedGate.effect),
          position: selectedGate.mesh.position.clone(),
        });

        // Dim the unchosen gate
        otherGate.mesh.visible = false;
      }
    }
  }

  public clear(): void {
    for (const pair of this.activePairs) {
      this.group.remove(pair.leftGate.mesh, pair.rightGate.mesh);
      pair.leftGate.dispose();
      pair.rightGate.dispose();
    }
    this.activePairs = [];
  }
}
