import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RiderController, RiderKinematicState, solve2BoneIK, TwoBoneIKOutput } from '../player/RiderController';
import { Motorcycle } from '../player/Motorcycle';
import { MOTORCYCLES } from '../progression/GarageManager';

describe('Feature 3 & 4: Rider Kinematic State Machine & Analytical IK Suite', () => {
  let rider: RiderController;
  let motorcycle: Motorcycle;

  // Authoritative contact positions in chassis coordinate space
  // RiderRoot is at [0, 0.65, -0.05] relative to chassis.
  // Handlebar grips at [±0.24, 0.85, 0.38] world
  // Footpegs at [±0.21, 0.40, -0.12] world
  const GRIP_LEFT = new THREE.Vector3(-0.24, 0.85, 0.38);
  const GRIP_RIGHT = new THREE.Vector3(0.24, 0.85, 0.38);
  const PEG_LEFT = new THREE.Vector3(-0.21, 0.40, -0.12);
  const PEG_RIGHT = new THREE.Vector3(0.21, 0.40, -0.12);

  beforeEach(() => {
    rider = new RiderController();
    motorcycle = new Motorcycle(MOTORCYCLES[0]);
  });

  describe('Hand & Foot Anchor Invariants Across Extremes', () => {
    it('verifies hands remain pinned to handlebar grips during high-speed racing tuck', () => {
      // High speed tuck (34 m/s + nitro)
      for (let i = 0; i < 30; i++) {
        rider.update(0.016, 34, 0, true, 0);
      }
      expect(rider.tuck).toBeGreaterThan(0.25);

      const leftHandPos = rider.getHandPosition('left');
      const rightHandPos = rider.getHandPosition('right');

      // Hand must not detach: distance error < 0.015m (1.5 cm tolerance)
      expect(leftHandPos.distanceTo(GRIP_LEFT)).toBeLessThan(0.015);
      expect(rightHandPos.distanceTo(GRIP_RIGHT)).toBeLessThan(0.015);
    });

    it('verifies hands remain pinned to handlebar grips during maximum cornering lean', () => {
      // 30 degree cornering lean (0.52 rad)
      for (let i = 0; i < 30; i++) {
        rider.update(0.016, 20, 0.52, false, 0);
      }
      expect(rider.hangOff).toBeGreaterThan(0.20);

      const leftHandPos = rider.getHandPosition('left');
      const rightHandPos = rider.getHandPosition('right');

      expect(leftHandPos.distanceTo(GRIP_LEFT)).toBeLessThan(0.015);
      expect(rightHandPos.distanceTo(GRIP_RIGHT)).toBeLessThan(0.015);
    });

    it('verifies hands remain pinned to handlebar grips during heavy braking brace', () => {
      // Heavy braking from high speed
      for (let i = 0; i < 30; i++) {
        rider.update(0.016, 15, 0, false, 1.0);
      }
      expect(rider.brakeBrace).toBeGreaterThan(0.05);

      const leftHandPos = rider.getHandPosition('left');
      const rightHandPos = rider.getHandPosition('right');

      expect(leftHandPos.distanceTo(GRIP_LEFT)).toBeLessThan(0.015);
      expect(rightHandPos.distanceTo(GRIP_RIGHT)).toBeLessThan(0.015);
    });

    it('verifies boots remain pinned to footpegs across tuck and lean extremes', () => {
      for (let i = 0; i < 30; i++) {
        rider.update(0.016, 30, -0.45, true, 0.5);
      }

      const leftFootPos = rider.getFootPosition('left');
      const rightFootPos = rider.getFootPosition('right');

      expect(leftFootPos.distanceTo(PEG_LEFT)).toBeLessThan(0.012);
      expect(rightFootPos.distanceTo(PEG_RIGHT)).toBeLessThan(0.012);
    });
  });

  describe('Kinematic State Transitions & Blending', () => {
    it('executes 0.3 Hz breathing cycle at idle without frame hitching', () => {
      // 0.3 Hz period T = 1 / 0.3 = 3.333333s
      const period = 1.0 / 0.3;
      const initialPhase = rider.breathPhase;

      // Step forward by exactly one period
      rider.update(period, 0, 0, false, 0);

      const deltaPhase = rider.breathPhase - initialPhase;
      // Phase should have advanced by 2 * PI radians (+/- 0.05)
      expect(deltaPhase).toBeCloseTo(2 * Math.PI, 1);
    });

    it('transitions to HIGH_SPEED_TUCK state above 120 km/h (33.33 m/s)', () => {
      // 110 km/h (30.5 m/s) -> CRUISING, not high-speed tuck state
      for (let i = 0; i < 20; i++) {
        rider.update(0.016, 30.5, 0, false, 0);
      }
      expect(rider.currentState).not.toBe(RiderKinematicState.HIGH_SPEED_TUCK);

      // Accelerate past 120 km/h to 130 km/h (36.1 m/s)
      for (let i = 0; i < 30; i++) {
        rider.update(0.016, 36.1, 0, false, 0);
      }
      expect(rider.currentState).toBe(RiderKinematicState.HIGH_SPEED_TUCK);
      expect(rider.tuck).toBeGreaterThan(0.30);
    });

    it('smoothly blends braking posture without snapping or sudden velocity spikes', () => {
      rider.update(0.016, 25, 0, false, 0);
      const prevBrakeBrace = rider.brakeBrace;

      // Apply sudden 100% brake
      rider.update(0.016, 23, 0, false, 1.0);
      const deltaBrakeBrace = Math.abs(rider.brakeBrace - prevBrakeBrace);

      // Must damp smoothly: one-frame delta must not exceed 0.04 rad
      expect(deltaBrakeBrace).toBeLessThan(0.04);
      expect(rider.currentState).toBe(RiderKinematicState.BRAKING);
    });

    it('supports arcade crash ejection state', () => {
      rider.setCrashing(true);
      rider.update(0.016, 20, 0, false, 0);
      expect(rider.currentState).toBe(RiderKinematicState.CRASHING);
    });
  });

  describe('Node Contract & Saddle Invariants', () => {
    it('preserves all mandatory node names and saddle lock invariant', () => {
      const mesh = rider.riderMesh;
      expect(mesh.getObjectByName('rider_torso')).toBeDefined();
      expect(mesh.getObjectByName('rider_head')).toBeDefined();
      expect(mesh.getObjectByName('rider_pelvis')).toBeDefined();
      expect(mesh.getObjectByName('rider_legs')).toBeDefined();

      // Saddle lock: z position remains 0
      rider.update(0.1, 30, 0.4, true, 0.8);
      expect(mesh.position.z).toBeCloseTo(0, 3);
    });

    it('delegates rider kinematics cleanly from Motorcycle to RiderController', () => {
      const riderMesh = motorcycle.components.rider;
      expect(riderMesh).toBeDefined();

      // Update motorcycle
      motorcycle.update(0.05, 35, 0.3, 0, true);

      // Motorcycle getters forward to riderController
      expect(motorcycle.currentRiderTuck).toBe(motorcycle.riderController.tuck);
      expect(motorcycle.brakeBrace).toBe(motorcycle.riderController.brakeBrace);
      expect(motorcycle.accelHunch).toBe(motorcycle.riderController.accelHunch);

      // Rider mesh received updates
      expect(riderMesh.rotation.z).toBeCloseTo(-motorcycle.lean * 0.50, 2);
      expect(riderMesh.position.x).toBeCloseTo(-motorcycle.lean * 0.14, 2);
      expect(riderMesh.position.z).toBeCloseTo(0, 3);
    });
  });

  describe('Dynamic Moving Bike Kinematics & Contact Invariance', () => {
    it('verifies world translation invariance when motorcycle travels down the track (Z = 100m)', () => {
      motorcycle.mesh.position.set(0, 0, 100);
      motorcycle.update(0.016, 25, 0, 0, false);

      const chassis = motorcycle.components.chassis;
      chassis.updateMatrixWorld(true);

      const worldGripL = chassis.localToWorld(new THREE.Vector3(-0.24, 0.85, 0.38));
      const worldGripR = chassis.localToWorld(new THREE.Vector3(0.24, 0.85, 0.38));
      const worldPegL = chassis.localToWorld(new THREE.Vector3(-0.21, 0.40, -0.12));
      const worldPegR = chassis.localToWorld(new THREE.Vector3(0.21, 0.40, -0.12));

      const handL = new THREE.Vector3();
      const handR = new THREE.Vector3();
      const bootL = new THREE.Vector3();
      const bootR = new THREE.Vector3();

      motorcycle.components.rider.getObjectByName('hand_l')!.getWorldPosition(handL);
      motorcycle.components.rider.getObjectByName('hand_r')!.getWorldPosition(handR);
      motorcycle.components.rider.getObjectByName('boot_l')!.getWorldPosition(bootL);
      motorcycle.components.rider.getObjectByName('boot_r')!.getWorldPosition(bootR);

      // Distance error must be < 0.015m for hands and < 0.012m for feet
      expect(handL.distanceTo(worldGripL)).toBeLessThan(0.015);
      expect(handR.distanceTo(worldGripR)).toBeLessThan(0.015);
      expect(bootL.distanceTo(worldPegL)).toBeLessThan(0.012);
      expect(bootR.distanceTo(worldPegR)).toBeLessThan(0.012);

      // Also verify RiderController world getters directly
      expect(motorcycle.riderController.getHandPosition('left').distanceTo(worldGripL)).toBeLessThan(0.015);
      expect(motorcycle.riderController.getHandPosition('right').distanceTo(worldGripR)).toBeLessThan(0.015);
      expect(motorcycle.riderController.getFootPosition('left').distanceTo(worldPegL)).toBeLessThan(0.012);
      expect(motorcycle.riderController.getFootPosition('right').distanceTo(worldPegR)).toBeLessThan(0.012);
    });

    it('verifies cornering lean invariance under extreme roll angles (+0.55 rad and -0.55 rad)', () => {
      // 1. Extreme right lean (+0.55 rad)
      for (let i = 0; i < 40; i++) {
        motorcycle.update(0.016, 25, 0.55, 0, false);
      }
      const chassis = motorcycle.components.chassis;
      chassis.updateMatrixWorld(true);

      let worldGripL = chassis.localToWorld(new THREE.Vector3(-0.24, 0.85, 0.38));
      let worldGripR = chassis.localToWorld(new THREE.Vector3(0.24, 0.85, 0.38));
      let worldPegL = chassis.localToWorld(new THREE.Vector3(-0.21, 0.40, -0.12));
      let worldPegR = chassis.localToWorld(new THREE.Vector3(0.21, 0.40, -0.12));

      const handL = new THREE.Vector3();
      const handR = new THREE.Vector3();
      const bootL = new THREE.Vector3();
      const bootR = new THREE.Vector3();

      motorcycle.components.rider.getObjectByName('hand_l')!.getWorldPosition(handL);
      motorcycle.components.rider.getObjectByName('hand_r')!.getWorldPosition(handR);
      motorcycle.components.rider.getObjectByName('boot_l')!.getWorldPosition(bootL);
      motorcycle.components.rider.getObjectByName('boot_r')!.getWorldPosition(bootR);

      expect(handL.distanceTo(worldGripL)).toBeLessThan(0.015);
      expect(handR.distanceTo(worldGripR)).toBeLessThan(0.015);
      expect(bootL.distanceTo(worldPegL)).toBeLessThan(0.012);
      expect(bootR.distanceTo(worldPegR)).toBeLessThan(0.012);

      // 2. Extreme left lean (-0.55 rad)
      for (let i = 0; i < 40; i++) {
        motorcycle.update(0.016, 25, -0.55, 0, false);
      }
      chassis.updateMatrixWorld(true);

      worldGripL = chassis.localToWorld(new THREE.Vector3(-0.24, 0.85, 0.38));
      worldGripR = chassis.localToWorld(new THREE.Vector3(0.24, 0.85, 0.38));
      worldPegL = chassis.localToWorld(new THREE.Vector3(-0.21, 0.40, -0.12));
      worldPegR = chassis.localToWorld(new THREE.Vector3(0.21, 0.40, -0.12));

      motorcycle.components.rider.getObjectByName('hand_l')!.getWorldPosition(handL);
      motorcycle.components.rider.getObjectByName('hand_r')!.getWorldPosition(handR);
      motorcycle.components.rider.getObjectByName('boot_l')!.getWorldPosition(bootL);
      motorcycle.components.rider.getObjectByName('boot_r')!.getWorldPosition(bootR);

      expect(handL.distanceTo(worldGripL)).toBeLessThan(0.015);
      expect(handR.distanceTo(worldGripR)).toBeLessThan(0.015);
      expect(bootL.distanceTo(worldPegL)).toBeLessThan(0.012);
      expect(bootR.distanceTo(worldPegR)).toBeLessThan(0.012);
    });

    it('verifies zero longitudinal or lateral drift over 100 frames of forward movement', () => {
      const chassis = motorcycle.components.chassis;
      const handL = new THREE.Vector3();
      const bootL = new THREE.Vector3();
      const speed = 30.0; // 30 m/s ~ 108 km/h
      const dt = 0.016;

      for (let frame = 1; frame <= 100; frame++) {
        motorcycle.mesh.position.z += speed * dt;
        motorcycle.mesh.position.x = Math.sin(frame * 0.1) * 1.5; // weaving
        motorcycle.update(dt, speed, Math.sin(frame * 0.1) * 0.3, 0, false);

        chassis.updateMatrixWorld(true);
        const worldGripL = chassis.localToWorld(new THREE.Vector3(-0.24, 0.85, 0.38));
        const worldPegL = chassis.localToWorld(new THREE.Vector3(-0.21, 0.40, -0.12));

        motorcycle.components.rider.getObjectByName('hand_l')!.getWorldPosition(handL);
        motorcycle.components.rider.getObjectByName('boot_l')!.getWorldPosition(bootL);

        expect(handL.distanceTo(worldGripL)).toBeLessThan(0.015);
        expect(bootL.distanceTo(worldPegL)).toBeLessThan(0.012);
      }
    });

    it('verifies solve2BoneIK supports preallocated output buffers with zero heap allocations', () => {
      const out: TwoBoneIKOutput = {
        midPoint: new THREE.Vector3(),
        upperQuat: new THREE.Quaternion(),
        lowerQuat: new THREE.Quaternion(),
        hingeAngle: 0,
      };

      const p0 = new THREE.Vector3(0, 0, 0);
      const target = new THREE.Vector3(0.2, -0.3, 0.1);
      const pole = new THREE.Vector3(0.3, -0.1, -0.1);

      const result = solve2BoneIK(p0, target, pole, 0.25, 0.25, out);
      expect(result).toBe(out);
      expect(out.midPoint.length()).toBeGreaterThan(0);
      expect(out.upperQuat.length()).toBeCloseTo(1.0, 5);
      expect(out.lowerQuat.length()).toBeCloseTo(1.0, 5);
      expect(Number.isFinite(out.hingeAngle)).toBe(true);
    });

    it('verifies solve2BoneIK handles degenerate zero bone lengths with unit-length quaternions and no NaNs', () => {
      const out: TwoBoneIKOutput = {
        midPoint: new THREE.Vector3(),
        upperQuat: new THREE.Quaternion(),
        lowerQuat: new THREE.Quaternion(),
        hingeAngle: 0,
      };

      const p0 = new THREE.Vector3(0, 0, 0);
      const target = new THREE.Vector3(0.3, 0.3, 0.3);
      const pole = new THREE.Vector3(0, 1, 0);

      // l1 = 0, l2 = 0
      solve2BoneIK(p0, target, pole, 0, 0, out);
      expect(out.upperQuat.length()).toBeCloseTo(1.0, 5);
      expect(out.lowerQuat.length()).toBeCloseTo(1.0, 5);
      expect(Number.isNaN(out.upperQuat.x)).toBe(false);

      // l1 = 0, l2 = 0.5
      solve2BoneIK(p0, target, pole, 0, 0.5, out);
      expect(out.upperQuat.length()).toBeCloseTo(1.0, 5);
      expect(out.lowerQuat.length()).toBeCloseTo(1.0, 5);

      // l1 = 0.5, l2 = 0
      solve2BoneIK(p0, target, pole, 0.5, 0, out);
      expect(out.upperQuat.length()).toBeCloseTo(1.0, 5);
      expect(out.lowerQuat.length()).toBeCloseTo(1.0, 5);

      // Collinear target and pole along Y
      const colTarget = new THREE.Vector3(0, 1, 0);
      const colPole = new THREE.Vector3(0, 0.5, 0);
      solve2BoneIK(p0, colTarget, colPole, 0.5, 0.5, out);
      expect(out.upperQuat.length()).toBeCloseTo(1.0, 5);
      expect(out.lowerQuat.length()).toBeCloseTo(1.0, 5);
      expect(Number.isNaN(out.hingeAngle)).toBe(false);

      // Collinear target and pole along X
      const colTargetX = new THREE.Vector3(1, 0, 0);
      const colPoleX = new THREE.Vector3(2, 0, 0);
      solve2BoneIK(p0, colTargetX, colPoleX, 0.6, 0.6, out);
      expect(out.upperQuat.length()).toBeCloseTo(1.0, 5);
      expect(out.lowerQuat.length()).toBeCloseTo(1.0, 5);
      expect(Number.isNaN(out.hingeAngle)).toBe(false);

      // Coincident p0 and target (dist = 0)
      solve2BoneIK(p0, p0, pole, 0.25, 0.25, out);
      expect(out.upperQuat.length()).toBeCloseTo(1.0, 5);
      expect(out.lowerQuat.length()).toBeCloseTo(1.0, 5);
      expect(Number.isNaN(out.hingeAngle)).toBe(false);
    });

    it('verifies EXACTLY 0 heap allocations (Vector3 & Quaternion) during steady-state RiderController.update and Motorcycle.update', () => {
      let v3AllocCount = 0;
      let quatAllocCount = 0;

      // Warm up
      for (let i = 0; i < 10; i++) {
        rider.update(0.016, 25, 0.3, false, 0);
        motorcycle.update(0.016, 25, 0.3, 0, false);
      }

      const origV3Prop = Object.getOwnPropertyDescriptor(THREE.Vector3.prototype, 'isVector3');
      const origQuatProp = Object.getOwnPropertyDescriptor(THREE.Quaternion.prototype, 'isQuaternion');

      try {
        Object.defineProperty(THREE.Vector3.prototype, 'isVector3', {
          set(_val: boolean) {
            v3AllocCount++;
          },
          get() {
            return true;
          },
          configurable: true,
        });

        Object.defineProperty(THREE.Quaternion.prototype, 'isQuaternion', {
          set(_val: boolean) {
            quatAllocCount++;
          },
          get() {
            return true;
          },
          configurable: true,
        });

        // Test 60 frames of RiderController.update (1 second of steady-state gameplay)
        v3AllocCount = 0;
        quatAllocCount = 0;
        for (let i = 0; i < 60; i++) {
          rider.update(0.016, 25, 0.3, false, 0);
        }
        expect(v3AllocCount).toBe(0);
        expect(quatAllocCount).toBe(0);

        // Test 60 frames of Motorcycle.update (1 second of steady-state vehicle update)
        v3AllocCount = 0;
        quatAllocCount = 0;
        for (let i = 0; i < 60; i++) {
          motorcycle.update(0.016, 25, 0.3, 0, false);
        }
        expect(v3AllocCount).toBe(0);
        expect(quatAllocCount).toBe(0);
      } finally {
        if (origV3Prop) {
          Object.defineProperty(THREE.Vector3.prototype, 'isVector3', origV3Prop);
        } else {
          delete (THREE.Vector3.prototype as any).isVector3;
          (THREE.Vector3.prototype as any).isVector3 = true;
        }

        if (origQuatProp) {
          Object.defineProperty(THREE.Quaternion.prototype, 'isQuaternion', origQuatProp);
        } else {
          delete (THREE.Quaternion.prototype as any).isQuaternion;
          (THREE.Quaternion.prototype as any).isQuaternion = true;
        }
      }
    });

    it('executes lifecycle disposal cleanly without errors and unbinds resources', () => {
      expect(() => {
        rider.dispose();
      }).not.toThrow();

      expect(() => {
        motorcycle.dispose();
      }).not.toThrow();
    });
  });
});

