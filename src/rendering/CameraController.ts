import * as THREE from 'three';
import { MathUtils } from '../utilities/MathUtils';
import { GAME_CONFIG } from '../core/GameConfig';

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
      this.celebrationAngle = 0;
    }
  }

  public reset(heroPos: THREE.Vector3): void {
    this.isCelebrating = false;
    this.celebrationAngle = 0;
    this.shakeIntensity = 0;
    this.camera.position.set(
      heroPos.x,
      heroPos.y + GAME_CONFIG.DEFAULT_CAMERA_OFFSET.y,
      heroPos.z - GAME_CONFIG.DEFAULT_CAMERA_OFFSET.z
    );
    this.camera.lookAt(heroPos.x, heroPos.y + 1.2, heroPos.z + GAME_CONFIG.CAMERA_LOOK_AHEAD);
  }

  public update(dt: number, heroPos: THREE.Vector3, fleetCount: number, isTurbo: boolean = false): void {
    if (this.isCelebrating) {
      // Orbit celebration camera around the convoy
      this.celebrationAngle += dt * 0.7;
      const radius = 10 + Math.min(8, Math.sqrt(fleetCount) * 0.5);
      const camX = heroPos.x + Math.sin(this.celebrationAngle) * radius;
      const camZ = heroPos.z + Math.cos(this.celebrationAngle) * radius;
      const camY = heroPos.y + 4.5;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(heroPos.x, heroPos.y + 1.2, heroPos.z);
      return;
    }

    // Dynamic camera framing based on convoy size
    const fleetBonusDistance = Math.min(5.5, Math.sqrt(Math.max(0, fleetCount - 1)) * 0.42);
    const fleetBonusHeight = Math.min(3.2, Math.sqrt(Math.max(0, fleetCount - 1)) * 0.24);

    const baseOffset = GAME_CONFIG.DEFAULT_CAMERA_OFFSET;
    const targetCamX = MathUtils.damp(this.camera.position.x, heroPos.x, 10, dt);
    const targetCamY = heroPos.y + baseOffset.y + fleetBonusHeight;
    const targetCamZ = heroPos.z - baseOffset.z - fleetBonusDistance;

    // FOV punch during turbo
    const targetFov = isTurbo ? 70 : 60;
    this.camera.fov = MathUtils.damp(this.camera.fov, targetFov, 6, dt);
    this.camera.updateProjectionMatrix();

    // Camera shake calculation
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeIntensity > 0.01) {
      shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * this.shakeDecay);
    }

    this.camera.position.set(
      targetCamX + shakeOffsetX,
      targetCamY + shakeOffsetY,
      targetCamZ
    );

    // Look ahead point along track
    const lookX = MathUtils.damp(this.targetPosition.x, heroPos.x * 0.5, 8, dt);
    const lookY = heroPos.y + 1.2;
    const lookZ = heroPos.z + GAME_CONFIG.CAMERA_LOOK_AHEAD;
    this.targetPosition.set(lookX, lookY, lookZ);

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
