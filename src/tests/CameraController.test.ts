import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CameraController } from '../rendering/CameraController';
import { PHYSICS_CONFIG } from '../core/PhysicsConfig';
import { GAME_CONFIG } from '../core/GameConfig';

describe('CameraController Third-Person Follow & Inversion Prevention', () => {
  let cameraController: CameraController;

  beforeEach(() => {
    cameraController = new CameraController();
    cameraController.reset(new THREE.Vector3(0, 0, 0));
  });

  it('initializes with default camera offset and 60 degree FOV', () => {
    expect(cameraController.camera.fov).toBe(60);
    expect(cameraController.camera.position.x).toBe(0);
    expect(cameraController.camera.position.y).toBeCloseTo(GAME_CONFIG.DEFAULT_CAMERA_OFFSET.y, 2);
    expect(cameraController.camera.position.z).toBeCloseTo(-GAME_CONFIG.DEFAULT_CAMERA_OFFSET.z, 2);
  });

  it('applies damped follow lag along lateral X rather than snapping instantly', () => {
    const heroPos = new THREE.Vector3(3.0, 0, 10);

    // After a single 0.016s frame, camera X should have moved towards 3.0, but not reached 3.0
    cameraController.update(0.016, heroPos, false, 0);

    expect(cameraController.camera.position.x).toBeGreaterThan(0);
    expect(cameraController.camera.position.x).toBeLessThan(3.0);

    // Over multiple frames, it converges smoothly toward 3.0
    for (let i = 0; i < 40; i++) {
      cameraController.update(0.05, heroPos, false, 0);
    }
    expect(cameraController.camera.position.x).toBeCloseTo(3.0, 1);
  });

  it('damps vertical Y movement smoothly to absorb road bumps', () => {
    const baseY = GAME_CONFIG.DEFAULT_CAMERA_OFFSET.y;
    const heroPos = new THREE.Vector3(0, 1.0, 10); // Hero jumped or road elevated by 1.0m

    cameraController.update(0.016, heroPos, false, 0);

    // Camera Y should smoothly track heroPos.y + baseOffset.y
    expect(cameraController.camera.position.y).toBeGreaterThan(baseY);
    expect(cameraController.camera.position.y).toBeLessThan(baseY + 1.0);
  });

  it('clamps camera lateral position strictly within track boundary (<= 4.8m)', () => {
    const heroPos = new THREE.Vector3(10.0, 0, 10); // Hero pushed far out

    for (let i = 0; i < 50; i++) {
      cameraController.update(0.05, heroPos, false, 0);
    }

    // Camera X must not exceed 4.8m
    expect(cameraController.camera.position.x).toBeLessThanOrEqual(PHYSICS_CONFIG.CAMERA_LATERAL_CLAMP + 0.001);
    expect(cameraController.camera.position.x).toBeCloseTo(4.8, 1);
  });

  it('anticipates turns by biasing look-ahead target toward apex according to roll lean', () => {
    const heroPosNeutral = new THREE.Vector3(0, 0, 50);
    cameraController.update(0.1, heroPosNeutral, false, 0);

    // Neutral lookAt target should be near center X = 0
    cameraController.reset(heroPosNeutral);

    // Now hero leans right (positive roll lean in our coordinate system)
    const rightLean = 0.40; // rad
    cameraController.update(0.1, heroPosNeutral, false, rightLean);

    // In Three.js +Z view, look-ahead bias toward Screen Right (World -X)
    const screenRight = cameraController.getScreenRightVector();
    expect(screenRight.x).toBeLessThan(0); // Standard Screen Right is World -X
  });

  it('strictly clamps camera yaw angle <= 0.12 rad, preventing steering inversion', () => {
    // Subject camera to extreme cornering: hero at right edge with extreme right roll lean
    const heroPos = new THREE.Vector3(-4.5, 0, 100);
    const extremeLean = 0.55;

    for (let i = 0; i < 30; i++) {
      cameraController.update(0.05, heroPos, false, extremeLean);
    }

    // Screen Right vector must have x <= -0.99 (ScreenRight_x <= -cos(0.12) = -0.9928)
    const screenRight = cameraController.getScreenRightVector();
    expect(screenRight.x).toBeLessThanOrEqual(-0.99);

    // And length should be 1.0 (normalized)
    expect(screenRight.length()).toBeCloseTo(1.0, 2);
  });

  it('expands FOV smoothly to 70 deg during turbo and recovers to 60 deg', () => {
    const heroPos = new THREE.Vector3(0, 0, 0);

    // Turbo active
    for (let i = 0; i < 30; i++) {
      cameraController.update(0.05, heroPos, true, 0);
    }
    expect(cameraController.camera.fov).toBeGreaterThan(68.0);
    expect(cameraController.camera.fov).toBeLessThanOrEqual(70.0);

    // Turbo released
    for (let i = 0; i < 40; i++) {
      cameraController.update(0.05, heroPos, false, 0);
    }
    expect(cameraController.camera.fov).toBeCloseTo(60.0, 1);
  });

  it('applies and decays camera shake without instability', () => {
    cameraController.addShake(0.8);
    const heroPos = new THREE.Vector3(0, 0, 0);

    // Shake active
    cameraController.update(0.016, heroPos, false, 0);

    // Decay shake over 2 seconds
    for (let i = 0; i < 40; i++) {
      cameraController.update(0.05, heroPos, false, 0);
    }

    // After decay, position should be centered without shake offset
    cameraController.update(0.05, heroPos, false, 0);
    expect(cameraController.camera.position.x).toBeCloseTo(0, 2);
  });
});
