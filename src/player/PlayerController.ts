import * as THREE from 'three';
import { GAME_CONFIG } from '../core/GameConfig';
import { PHYSICS_CONFIG } from '../core/PhysicsConfig';
import { MathUtils } from '../utilities/MathUtils';
import { Motorcycle } from './Motorcycle';
import { SpeedController } from '../racing/SpeedController';
import { NitroManager } from '../racing/NitroManager';
import { EventBus } from '../core/EventBus';
import { InputManager } from '../core/InputManager';

export class PlayerController {
  private motorcycle: Motorcycle;
  public speedController: SpeedController;
  public nitroManager: NitroManager;
  public inputManager: InputManager;

  private currentX: number = 0;
  private currentZ: number = 0;
  private currentVelocityX: number = 0;
  private lateralVelocity: number = 0;
  private lastLateralAccel: number = 0;

  private turboMultiplier: number = 1.0;
  private isTurboActive: boolean = false;
  private isOilSlicked: boolean = false;
  private oilSlickTimer: number = 0;
  private oilSlickDriftDir: number = 1;
  private bikeHandlingMultiplier: number = 1.0;
  private upgradeHandlingBonus: number = 0;
  private sensitivity: number = 1.0;
  private endlessSpeedMultiplier: number = 1.0;

  private onPauseCallback?: () => void;
  private onSpaceCallback?: () => void;
  private getScreenRightVectorFn?: () => THREE.Vector3;

  constructor(
    motorcycle: Motorcycle,
    getScreenRightVectorFn?: () => THREE.Vector3,
    eventBus?: EventBus,
    inputManager?: InputManager
  ) {
    this.motorcycle = motorcycle;
    this.getScreenRightVectorFn = getScreenRightVectorFn;
    this.speedController = new SpeedController({
      cruisingSpeed: PHYSICS_CONFIG.CRUISING_SPEED,
    });
    this.nitroManager = new NitroManager(undefined, eventBus);
    this.inputManager = inputManager || new InputManager();
  }

  public setHandlingModifiers(bikeMultiplier: number = 1.0, upgradeBonus: number = 0): void {
    this.bikeHandlingMultiplier = bikeMultiplier;
    this.upgradeHandlingBonus = upgradeBonus;
  }

  public setInputCallbacks(onPause?: () => void, onSpace?: () => void): void {
    this.onPauseCallback = onPause;
    this.onSpaceCallback = onSpace;
    this.inputManager.setCallbacks(onPause, onSpace);
  }

  public setCameraOrientationProvider(fn: () => THREE.Vector3): void {
    this.getScreenRightVectorFn = fn;
  }

  public setSensitivity(val: number): void {
    this.sensitivity = MathUtils.clamp(val, 0.5, 2.5);
    this.inputManager.setSensitivity(this.sensitivity);
  }

  public get x(): number {
    return this.currentX;
  }

  public get z(): number {
    return this.currentZ;
  }

  public get currentLateralVelocity(): number {
    return this.currentVelocityX;
  }

  public get lateralVel(): number {
    return this.currentVelocityX;
  }

  public setEndlessSpeedMultiplier(multiplier: number): void {
    this.endlessSpeedMultiplier = Math.max(1.0, multiplier);
  }

  public get speed(): number {
    return this.speedController.currentSpeed * this.turboMultiplier * this.endlessSpeedMultiplier;
  }

  public get lean(): number {
    return this.motorcycle.lean;
  }

  public get nitroRatio(): number {
    return this.nitroManager ? this.nitroManager.fuelRatio : 1.0;
  }

  public setTurbo(active: boolean): void {
    this.isTurboActive = active;
    this.turboMultiplier = active ? GAME_CONFIG.TURBO_SPEED_MULTIPLIER : 1.0;
  }

  public setNitroManager(manager: NitroManager): void {
    this.nitroManager = manager;
  }

  public setThrottle(active: boolean): void {
    this.inputManager.setThrottle(active);
  }

  public setBrake(active: boolean): void {
    this.inputManager.setBrake(active);
  }

  public setNitro(active: boolean): void {
    this.inputManager.setNitro(active);
  }

  public get isBraking(): boolean {
    return this.inputManager.getInputState().brake > 0;
  }

  public get isAccelerating(): boolean {
    return this.inputManager.getInputState().throttle > 0;
  }

  public get isNitroBoosting(): boolean {
    return this.nitroManager ? this.nitroManager.isBoosting : this.inputManager.getInputState().nitro;
  }

  public applyOilSlick(duration: number = GAME_CONFIG.DAMAGE.OIL_SLICK_TIME): void {
    this.isOilSlicked = true;
    this.oilSlickTimer = duration;
    this.oilSlickDriftDir = Math.random() > 0.5 ? 1 : -1;
  }

  public reset(startX: number = 0, startZ: number = 0): void {
    this.currentX = startX;
    this.currentZ = startZ;
    this.currentVelocityX = 0;
    this.lateralVelocity = 0;
    this.lastLateralAccel = 0;
    this.isTurboActive = false;
    this.turboMultiplier = 1.0;
    this.isOilSlicked = false;
    this.oilSlickTimer = 0;
    this.inputManager.reset();
    this.speedController.reset();
    this.motorcycle.reset(startX, startZ);
  }

  /**
   * Retrieves the camera's screen-right vector projected onto the world XZ plane.
   * For standard third-person camera looking along +Z, screen-right is world (-1, 0, 0).
   */
  public getScreenRightVector(): THREE.Vector3 {
    if (this.getScreenRightVectorFn) {
      return this.getScreenRightVectorFn();
    }
    return new THREE.Vector3(-1, 0, 0);
  }

  /**
   * Converts a normalized screen direction (-1 = Screen Left, +1 = Screen Right)
   * into a world lateral direction vector along the track.
   */
  public convertScreenDirectionToWorld(screenDir: number): number {
    const screenRight = this.getScreenRightVector();
    return screenDir * screenRight.x;
  }

  /**
   * Converts a screen-space horizontal delta (in pixels) into a world lateral delta.
   * Preserved for backward compatibility.
   */
  public convertScreenDeltaToWorld(screenDeltaX: number, screenWidth: number = 800): number {
    const screenRight = this.getScreenRightVector();
    const dragTraction = this.isOilSlicked ? 0.4 : 1.0;
    const roadSensitivity = ((GAME_CONFIG.TRACK_WIDTH * 1.5) / screenWidth) * this.sensitivity * dragTraction;
    return screenDeltaX * screenRight.x * roadSensitivity;
  }

  /**
   * Computes the speed-dependent steering scale S(v):
   * S(v) = 1.0 - 0.28 * clamp((v - v_min) / (v_max - v_min), 0, 1)
   * High agility at 50 km/h (1.0), deliberate stable steering at 160+ km/h (0.72).
   */
  public getSpeedDependentSteeringScale(speed: number): number {
    const vMin = PHYSICS_CONFIG.STEER_SPEED_MIN;
    const vMax = PHYSICS_CONFIG.STEER_SPEED_MAX;
    const ratio = MathUtils.clamp((speed - vMin) / Math.max(0.01, vMax - vMin), 0, 1);
    return (
      PHYSICS_CONFIG.STEER_SPEED_SCALE_MIN -
      (PHYSICS_CONFIG.STEER_SPEED_SCALE_MIN - PHYSICS_CONFIG.STEER_SPEED_SCALE_MAX) * ratio
    );
  }

  /**
   * Frame physics update:
   * 1. Evaluates unified input state
   * 2. Calculates speed-scaled lateral acceleration ax
   * 3. Solves analytical exponential velocity integration:
   *    vx(t+dt) = vx(t) * e^(-gamma*dt) + ax * (1 - e^(-gamma*dt)) / gamma
   * 4. Applies soft boundary spring beyond 4.6m, hard clamped at 5.2m
   * 5. Progressive speed update and motorcycle kinematics
   */
  public update(dt: number): void {
    const clampedDt = Math.min(dt, 0.1);

    // 1. Unified Input System
    const input = this.inputManager.update(clampedDt);
    let screenSteer = input.steering;

    // Dead zone filtering
    if (Math.abs(screenSteer) < PHYSICS_CONFIG.STEER_DEAD_ZONE) {
      screenSteer = 0;
    }

    // Oil slick disturbance
    let steerTraction = 1.0;
    if (this.isOilSlicked) {
      this.oilSlickTimer -= clampedDt;
      if (this.oilSlickTimer <= 0) {
        this.isOilSlicked = false;
      } else {
        steerTraction = 0.45;
        screenSteer = screenSteer * 0.45 + this.oilSlickDriftDir * 0.45;
      }
    }

    // 2. Speed-Dependent Steering Scale S(v)
    const currentForwardSpeed = this.speed;
    const speedScale = this.getSpeedDependentSteeringScale(currentForwardSpeed);

    // 3. Directional Steering Acceleration
    const worldSteerDir = this.convertScreenDirectionToWorld(screenSteer);
    const handlingBonus = 1 + (this.upgradeHandlingBonus || 0);
    const bikeMult = this.bikeHandlingMultiplier || 1.0;

    let lateralAccel =
      worldSteerDir *
      PHYSICS_CONFIG.LATERAL_ACCELERATION *
      speedScale *
      this.sensitivity *
      bikeMult *
      handlingBonus *
      steerTraction;

    // 4. Soft Road Boundary Restoring Spring
    const softLimit = PHYSICS_CONFIG.ROAD_BOUNDARY_SOFT; // 4.6 m
    let boundaryAccel = 0;
    if (Math.abs(this.currentX) > softLimit) {
      const sign = Math.sign(this.currentX);
      const penetration = Math.abs(this.currentX) - softLimit;
      const springForce = -sign * PHYSICS_CONFIG.BOUNDARY_SPRING_K * penetration;
      const springDamp = -PHYSICS_CONFIG.BOUNDARY_SPRING_DAMPING * this.currentVelocityX;
      boundaryAccel = springForce + springDamp;
    }

    const totalLateralAccel = lateralAccel + boundaryAccel;
    this.lastLateralAccel = totalLateralAccel;

    // 5. Analytical Exponential Velocity Integration
    // dv_x / dt = a_x - gamma * v_x
    // v_x(t+dt) = v_x(t) * e^(-gamma*dt) + a_x * (1 - e^(-gamma*dt)) / gamma
    const gamma = PHYSICS_CONFIG.LATERAL_DAMPING; // 6.0 s^-1
    const gammaDt = gamma * clampedDt;
    const expDecay = Math.exp(-gammaDt);
    const integralFactor = gammaDt > 1e-5 ? (1.0 - expDecay) / gamma : clampedDt;

    this.currentVelocityX = this.currentVelocityX * expDecay + totalLateralAccel * integralFactor;
    this.lateralVelocity = this.currentVelocityX;

    // 6. Position Integration & Hard Road Boundary Clamp
    this.currentX += this.currentVelocityX * clampedDt;

    const hardLimit = PHYSICS_CONFIG.ROAD_BOUNDARY_HARD; // 5.2 m
    if (this.currentX > hardLimit) {
      this.currentX = hardLimit;
      if (this.currentVelocityX > 0) this.currentVelocityX = 0;
    } else if (this.currentX < -hardLimit) {
      this.currentX = -hardLimit;
      if (this.currentVelocityX < 0) this.currentVelocityX = 0;
    }

    // 7. Progressive Speed Control
    const isBraking = input.brake > 0;
    const wantsNitro = (input.nitro || this.isTurboActive) && !isBraking;

    let isNitroBoosting = false;
    if (this.nitroManager) {
      isNitroBoosting = this.nitroManager.update(clampedDt, wantsNitro);
    } else {
      isNitroBoosting = wantsNitro;
    }

    this.speedController.update(clampedDt, input.throttle, input.brake, isNitroBoosting);
    this.currentZ += this.speed * clampedDt;

    // 8. Roll Lean & Motorcycle Kinematics
    // Steady-state roll lean from lateral acceleration and steering
    const normalizedLateral = MathUtils.clamp(
      this.currentVelocityX / PHYSICS_CONFIG.MAX_STEADY_LATERAL_SPEED,
      -1,
      1
    );
    const targetLean = normalizedLateral * GAME_CONFIG.LEAN_ANGLE;

    this.motorcycle.mesh.position.set(this.currentX, 0, this.currentZ);
    this.motorcycle.update(
      clampedDt,
      this.speed,
      targetLean,
      input.brake,
      isNitroBoosting,
      lateralAccel,
      screenSteer
    );
  }

  // Backward compatibility handlers for tests or direct invocations
  public handleKeyDown(e: KeyboardEvent): void {
    (this.inputManager as any).handleKeyDown(e);
  }

  public handleKeyUp(e: KeyboardEvent): void {
    (this.inputManager as any).handleKeyUp(e);
  }

  public handlePointerDown(e: PointerEvent): void {
    (this.inputManager as any).handlePointerDown(e);
  }

  public handlePointerMove(e: PointerEvent): void {
    (this.inputManager as any).handlePointerMove(e);
  }

  public handlePointerUp(e?: PointerEvent): void {
    (this.inputManager as any).handlePointerUp(e);
  }

  public handleBlur(): void {
    this.inputManager.reset();
  }

  public dispose(): void {
    this.inputManager.dispose();
  }
}
