import * as THREE from 'three';
import { MathUtils } from '../utilities/MathUtils';
import { GAME_CONFIG } from '../core/GameConfig';
import { PHYSICS_CONFIG } from '../core/PhysicsConfig';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5.0;
  private isCelebrating: boolean = false;
  private celebrationAngle: number = 0;
  private cameraShakeEnabled: boolean = true;
  private reducedMotion: boolean = false;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.5,
      400
    );
    this.camera.position.set(0, GAME_CONFIG.DEFAULT_CAMERA_OFFSET.y, -GAME_CONFIG.DEFAULT_CAMERA_OFFSET.z);

    window.addEventListener('resize', this.onResize);
  }

  public getScreenRightVector(): THREE.Vector3 {
    // Camera's local +X axis projected onto world XZ plane
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    right.y = 0;
    if (right.lengthSq() > 0.0001) {
      right.normalize();
    } else {
      right.set(-1, 0, 0); // Default for forward +Z view
    }
    return right;
  }

  public setSettings(cameraShake: boolean, reducedMotion: boolean): void {
    this.cameraShakeEnabled = cameraShake;
    this.reducedMotion = reducedMotion;
  }

  public addShake(intensity: number): void {
    if (!this.cameraShakeEnabled || this.reducedMotion) return;
    this.shakeIntensity = Math.min(1.2, this.shakeIntensity + intensity);
  }

  public setCelebrating(celebrating: boolean): void {
    this.isCelebrating = celebrating;
    if (celebrating) {
      // Start celebration orbit from behind hero to smoothly transition without a 180° jump
      this.celebrationAngle = Math.PI;
    }
  }

  public setShowroomMode(): void {
    this.isCelebrating = false;
    this.camera.position.set(0, 1.35, -3.5);
    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 0.72, 0);
  }

  public setHeroMenuMode(isPortrait: boolean = false): void {
    this.isCelebrating = false;
    if (isPortrait) {
      // In portrait, motorcycle is centered in the upper 48% of the viewport
      this.camera.position.set(-0.6, 1.45, -3.2);
      this.camera.fov = 52;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(0.0, 0.58, 0.1);
    } else {
      // In widescreen landscape, motorcycle is framed in the right 60% of the viewport at 3/4 angle
      this.camera.position.set(-2.2, 1.25, -2.8);
      this.camera.fov = 48;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(0.68, 0.62, 0.05);
    }
  }

  public reset(heroPos: THREE.Vector3): void {
    this.isCelebrating = false;
    this.celebrationAngle = 0;
    this.shakeIntensity = 0;
    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();

    const clampedX = MathUtils.clamp(
      heroPos.x,
      -PHYSICS_CONFIG.CAMERA_LATERAL_CLAMP,
      PHYSICS_CONFIG.CAMERA_LATERAL_CLAMP
    );
    this.camera.position.set(
      clampedX,
      heroPos.y + GAME_CONFIG.DEFAULT_CAMERA_OFFSET.y,
      heroPos.z - GAME_CONFIG.DEFAULT_CAMERA_OFFSET.z
    );
    this.targetPosition.set(clampedX, heroPos.y + 1.2, heroPos.z + GAME_CONFIG.CAMERA_LOOK_AHEAD);
    this.camera.lookAt(this.targetPosition);
  }

  public update(
    dt: number,
    heroPos: THREE.Vector3,
    isTurbo: boolean = false,
    heroLean: number = 0
  ): void {
    if (this.isCelebrating) {
      // Orbit celebration camera around the hero motorcycle
      this.celebrationAngle += dt * 0.7;
      const radius = 8.5;
      const camX = heroPos.x + Math.sin(this.celebrationAngle) * radius;
      const camZ = heroPos.z + Math.cos(this.celebrationAngle) * radius;
      const camY = heroPos.y + 3.8;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(heroPos.x, heroPos.y + 1.2, heroPos.z);
      return;
    }

    const clampedDt = Math.min(dt, 0.1);
    const baseOffset = GAME_CONFIG.DEFAULT_CAMERA_OFFSET;

    // 1. Damped lateral X with strict road boundary clamp (<= 4.8m)
    const rawCamX = MathUtils.damp(
      this.camera.position.x,
      heroPos.x,
      PHYSICS_CONFIG.CAMERA_FOLLOW_LAG_X,
      clampedDt
    );
    const clampedCamX = MathUtils.clamp(
      rawCamX,
      -PHYSICS_CONFIG.CAMERA_LATERAL_CLAMP,
      PHYSICS_CONFIG.CAMERA_LATERAL_CLAMP
    );

    // 2. Damped vertical Y (smoothly absorbs road bumps/suspension motion)
    const targetCamY = heroPos.y + baseOffset.y;
    const camY = MathUtils.damp(
      this.camera.position.y,
      targetCamY,
      PHYSICS_CONFIG.CAMERA_FOLLOW_LAG_Y,
      clampedDt
    );

    // 3. Longitudinal Z
    const camZ = heroPos.z - baseOffset.z;

    // 4. FOV punch during turbo
    const targetFov = isTurbo ? 70 : 60;
    this.camera.fov = MathUtils.damp(this.camera.fov, targetFov, 6, clampedDt);
    this.camera.updateProjectionMatrix();

    // 5. Camera shake calculation
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeIntensity > 0.01) {
      shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - clampedDt * this.shakeDecay);
    }

    this.camera.position.set(
      clampedCamX + shakeOffsetX,
      camY + shakeOffsetY,
      camZ
    );

    // 6. Look ahead point along track with turn yaw anticipation biased toward apex by roll lean
    const leanAnticipation = -heroLean * 4.5;
    const targetLookX = heroPos.x * 0.40 + leanAnticipation;
    const lookX = MathUtils.damp(this.targetPosition.x, targetLookX, 7.0, clampedDt);
    const lookY = heroPos.y + 1.2;
    const lookZ = heroPos.z + GAME_CONFIG.CAMERA_LOOK_AHEAD;

    // 7. Strict yaw angle clamping (|psi_cam| <= 0.12 rad) to prevent steering inversion
    const deltaZ = Math.max(1.0, lookZ - camZ);
    const maxDeltaX = Math.tan(PHYSICS_CONFIG.CAMERA_YAW_CLAMP) * deltaZ;
    const deltaX = lookX - clampedCamX;
    const safeLookX = clampedCamX + MathUtils.clamp(deltaX, -maxDeltaX, maxDeltaX);

    this.targetPosition.set(safeLookX, lookY, lookZ);
    this.camera.lookAt(this.targetPosition);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
