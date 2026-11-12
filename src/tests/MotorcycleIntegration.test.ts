import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { AssetLoader } from '../assets/AssetLoader';
import { Motorcycle } from '../player/Motorcycle';
import { MOTORCYCLES, MotorcycleInfo } from '../progression/GarageManager';
import { GAME_CONFIG, WHEEL_CALIBRATION } from '../core/GameConfig';

describe('Motorcycle Integration & Animation Suite', () => {
  let streetRacerInfo: MotorcycleInfo;

  beforeEach(() => {
    streetRacerInfo = MOTORCYCLES.find((b) => b.id === 'street_racer')!;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AssetLoader Error Handling & Caching', () => {
    it('returns null safely when GLB cannot be loaded without throwing', async () => {
      const loader = AssetLoader.getInstance();
      const result = await loader.loadGLTF('nonexistent_model.glb');
      expect(result).toBeNull();
    });

    it('returns cached clone if model was previously cached', async () => {
      const loader = AssetLoader.getInstance();
      const mockScene = new THREE.Group();
      mockScene.name = 'cached_scene_test';
      (loader as any).modelCache.set('mock_cached.glb', mockScene);

      const loaded = await loader.loadGLTF('mock_cached.glb');
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('cached_scene_test');
      expect(loaded).not.toBe(mockScene); // Must be a clone, not the same instance
    });
  });

  describe('AssetLoader.adaptMotorcycleModel Node Categorization', () => {
    it('categorizes FrontWheelPivot, RearWheelPivot, ChassisGroup, RiderRoot, LightingComponents, and steering', () => {
      const mockGLTF = new THREE.Group();
      mockGLTF.name = 'MotorcycleRoot';

      const chassisGroup = new THREE.Group();
      chassisGroup.name = 'ChassisGroup';
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.5));
      bodyMesh.name = 'ChassisMesh';
      chassisGroup.add(bodyMesh);

      const frontWheelPivot = new THREE.Group();
      frontWheelPivot.name = 'FrontWheelPivot';
      frontWheelPivot.position.set(0, 0.35, 0.72);
      const fwMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15));
      frontWheelPivot.add(fwMesh);

      const rearWheelPivot = new THREE.Group();
      rearWheelPivot.name = 'RearWheelPivot';
      rearWheelPivot.position.set(0, 0.32, -0.74);
      const rwMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2));
      rearWheelPivot.add(rwMesh);

      const steeringNode = new THREE.Group();
      steeringNode.name = 'steering';
      steeringNode.position.set(0, 0.6, 0.6);

      const riderRoot = new THREE.Group();
      riderRoot.name = 'RiderRoot';

      const lightingGroup = new THREE.Group();
      lightingGroup.name = 'LightingComponents';
      const emissiveMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: new THREE.Color(0xff0000),
        emissiveIntensity: 2.0,
      });
      const lightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), emissiveMat);
      lightingGroup.add(lightMesh);

      mockGLTF.add(chassisGroup, frontWheelPivot, rearWheelPivot, steeringNode, riderRoot, lightingGroup);

      const adapted = AssetLoader.getInstance().adaptMotorcycleModel(mockGLTF, streetRacerInfo);

      expect(adapted.frontWheel).toBe(frontWheelPivot);
      expect(adapted.rearWheel).toBe(rearWheelPivot);
      expect(adapted.steering).toBe(steeringNode);
      expect(adapted.emissives).toContain(emissiveMat);
      expect(adapted.group.name).toBe('motorcycle_glb_street_racer');
      // Since riderRoot had no mesh, stylized rider was mounted to riderRoot
      expect(adapted.riderRoot).toBe(riderRoot);
      expect(adapted.rider).toBeDefined();
      expect(adapted.rider.name).toBe('stylized_rider_mount');
      expect(adapted.rider.parent).toBe(adapted.riderRoot);
    });

    it('enforces road ground contact at Y = 0.0m by offsetting lowest vertex', () => {
      const mockGLTF = new THREE.Group();
      // Create mesh with bounds from Y = -0.4 to +0.8 (lowest vertex at -0.4)
      const geom = new THREE.BoxGeometry(1, 1.2, 2);
      geom.translate(0, 0.2, 0); // min Y is -0.4, max Y is 0.8
      const mesh = new THREE.Mesh(geom);
      mockGLTF.add(mesh);

      AssetLoader.getInstance().adaptMotorcycleModel(mockGLTF, streetRacerInfo);

      // loadedGroup position.y should have been adjusted upwards by +0.4
      expect(mockGLTF.position.y).toBeCloseTo(0.4, 4);
    });

    it('creates defensive rotation anchors when wheels are not present in glTF', () => {
      const emptyGLTF = new THREE.Group();
      const adapted = AssetLoader.getInstance().adaptMotorcycleModel(emptyGLTF, streetRacerInfo);

      expect(adapted.frontWheel).toBeDefined();
      expect(adapted.frontWheel.name).toBe('frontWheel_anchor');
      expect(adapted.rearWheel).toBeDefined();
      expect(adapted.rearWheel.name).toBe('rearWheel_anchor');
      expect(adapted.riderRoot).toBeDefined();
      expect(adapted.rider).toBeDefined();
      expect(adapted.rider.name).toBe('stylized_rider_mount');
      expect(adapted.rider.parent).toBe(adapted.riderRoot);
    });
  });

  describe('Motorcycle 5-Part Animation Suite', () => {
    it('1. Pure calibrated wheel spin: independent front (r=0.3491m) and rear (r=0.3173m) spin without slip', () => {
      const motorcycle = new Motorcycle(streetRacerInfo);
      const components = motorcycle.components;

      const speed = 21.0; // m/s
      const dt = 0.05; // s
      const expectedFrontDelta = -(speed / WHEEL_CALIBRATION.FRONT_RADIUS) * dt; // ~ -3.0077 rad
      const expectedRearDelta = -(speed / WHEEL_CALIBRATION.REAR_RADIUS) * dt;   // ~ -3.3092 rad

      motorcycle.update(dt, speed, 0);

      expect(components.frontWheel.rotation.x).toBeCloseTo(expectedFrontDelta, 3);
      expect(components.rearWheel.rotation.x).toBeCloseTo(expectedRearDelta, 3);
      // Rear wheel rotates ~10% faster than front wheel
      expect(Math.abs(components.rearWheel.rotation.x)).toBeGreaterThan(Math.abs(components.frontWheel.rotation.x));
      expect(components.rearWheel.rotation.x / components.frontWheel.rotation.x).toBeCloseTo(WHEEL_CALIBRATION.RATIO, 2);
      // Wheels must spin purely on local X with zero yaw/roll drift
      expect(components.frontWheel.rotation.y).toBe(0);
      expect(components.frontWheel.rotation.z).toBe(0);
      expect(components.rearWheel.rotation.y).toBe(0);
      expect(components.rearWheel.rotation.z).toBe(0);
    });

    it('2. Motorcycle roll and yaw heading into turns', () => {
      const motorcycle = new Motorcycle(streetRacerInfo);
      const targetLean = 0.35; // ~20 degrees right turn

      // Step physics multiple frames to allow dampening to converge
      for (let i = 0; i < 30; i++) {
        motorcycle.update(0.016, 20, targetLean);
      }

      expect(motorcycle.lean).toBeGreaterThan(0.3);
      expect(motorcycle.components.chassis.rotation.z).toBeCloseTo(-motorcycle.lean, 4);
      expect(motorcycle.components.chassis.rotation.y).toBeCloseTo(motorcycle.lean * 0.25, 4);
    });

    it('3. Steering response: turns handlebars and fork into corner when steering pivot exists', () => {
      const motorcycle = new Motorcycle(streetRacerInfo);
      const steeringPivot = new THREE.Object3D();
      steeringPivot.name = 'steering_test';
      motorcycle.components.steering = steeringPivot;

      const targetLean = 0.28;
      for (let i = 0; i < 20; i++) {
        motorcycle.update(0.016, 20, targetLean);
      }

      expect(steeringPivot.rotation.y).toBeCloseTo(-motorcycle.lean * 0.35, 4);
    });

    it('4. Dynamic rider posture: cornering hang-off roll/shift, speed tuck, and saddle-locked hip pivot', () => {
      const motorcycle = new Motorcycle(streetRacerInfo);
      const rider = motorcycle.components.rider;
      expect(rider).toBeDefined();

      // Test cornering hang-off
      const targetLean = 0.3;
      for (let i = 0; i < 25; i++) {
        motorcycle.update(0.016, 20, targetLean);
      }

      expect(rider.rotation.z).toBeCloseTo(-motorcycle.lean * 0.50, 2);
      expect(rider.position.x).toBeCloseTo(-motorcycle.lean * 0.14, 2);

      // Test speed crouch tuck under turbo speed
      const turboSpeed = GAME_CONFIG.BASE_SPEED * 1.5;
      for (let i = 0; i < 30; i++) {
        motorcycle.update(0.016, turboSpeed, 0, 0, true);
      }

      expect(motorcycle.currentRiderTuck).toBeGreaterThan(0.20);
      // Saddle lock: hip pivot stays pinned to saddle (Delta Z = 0)
      expect(rider.position.z).toBeCloseTo(0, 3);
    });

    it('5. Suspension dynamics: pitch dive on braking, pitch squat on acceleration', () => {
      const motorcycle = new Motorcycle(streetRacerInfo);

      // Accelerate rapidly: speed jumps from 0 to 30 m/s
      motorcycle.update(0.05, 30, 0);
      // Nose lifts on acceleration (squat -> negative pitch)
      expect(motorcycle.currentSuspensionPitch).toBeLessThan(0);

      // Decelerate rapidly: speed drops from 30 to 5 m/s (heavy braking)
      motorcycle.update(0.05, 5, 0);
      // Nose drops on braking (dive -> positive pitch)
      expect(motorcycle.currentSuspensionPitch).toBeGreaterThan(0);
    });

    it('6. Anchors rider directly to RiderRoot socket at [0, 0.65, -0.05] with saddle-origin hierarchy', () => {
      const motorcycle = new Motorcycle(streetRacerInfo);
      const riderRoot = motorcycle.components.riderRoot;
      const rider = motorcycle.components.rider;

      expect(riderRoot).toBeDefined();
      expect(riderRoot.name).toBe('RiderRoot');
      expect(riderRoot.position.y).toBeCloseTo(0.65, 2);
      expect(riderRoot.position.z).toBeCloseTo(-0.05, 2);

      expect(rider.parent).toBe(riderRoot);
      // Rider origin is at local (0, 0, 0)
      expect(rider.position.x).toBeCloseTo(0, 2);
      expect(rider.position.z).toBeCloseTo(0, 2);

      // Subnodes are articulated
      const torso = rider.getObjectByName('rider_torso');
      const head = rider.getObjectByName('rider_head');
      const pelvis = rider.getObjectByName('rider_pelvis');
      const legs = rider.getObjectByName('rider_legs');

      expect(torso).toBeDefined();
      expect(head).toBeDefined();
      expect(pelvis).toBeDefined();
      expect(legs).toBeDefined();
    });
  });

  describe('Progressive Dual-Layer Loading & Hot-Swap Fallback', () => {
    it('initializes immediately with synchronous procedural baseline without blocking', () => {
      const motorcycle = new Motorcycle(streetRacerInfo);
      expect(motorcycle.mesh).toBeDefined();
      expect(motorcycle.isLoadedGLB).toBe(false);
      expect(motorcycle.components.frontWheel).toBeDefined();
      expect(motorcycle.components.rearWheel).toBeDefined();
      expect(motorcycle.components.chassis).toBeDefined();
    });

    it('seamlessly hot-swaps mesh components when GLB resolves without losing world transform', async () => {
      const motorcycle = new Motorcycle(streetRacerInfo);
      motorcycle.mesh.position.set(2.5, 0, 48.0);
      motorcycle.mesh.rotation.y = 1.2;

      // Mock AssetLoader to return a mock GLB
      const mockScene = new THREE.Group();
      const mockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1));
      mockScene.add(mockMesh);

      vi.spyOn(AssetLoader.getInstance(), 'loadGLTF').mockResolvedValue(mockScene);

      await motorcycle.tryLoadGLB(streetRacerInfo);

      expect(motorcycle.isLoadedGLB).toBe(true);
      // World transform must be preserved exactly
      expect(motorcycle.mesh.position.x).toBe(2.5);
      expect(motorcycle.mesh.position.z).toBe(48.0);
      expect(motorcycle.mesh.rotation.y).toBe(1.2);
    });

    it('resets state correctly upon motorcycle.reset()', () => {
      const motorcycle = new Motorcycle(streetRacerInfo);
      motorcycle.update(0.1, 25, 0.3);
      motorcycle.setInvulnerable(2.0);

      motorcycle.reset(10, 50);

      expect(motorcycle.position.x).toBe(10);
      expect(motorcycle.position.z).toBe(50);
      expect(motorcycle.lean).toBe(0);
      expect(motorcycle.currentSuspensionPitch).toBe(0);
      expect(motorcycle.invulnerable).toBe(false);
    });
  });
});
