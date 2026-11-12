import * as THREE from 'three';
import { MotorcycleInfo } from '../progression/GarageManager';
import { MotorcycleModels, MotorcycleMeshResult } from './MotorcycleModels';
import { MathUtils } from '../utilities/MathUtils';
import { AssetLoader } from '../assets/AssetLoader';
import { GAME_CONFIG, WHEEL_CALIBRATION } from '../core/GameConfig';
import { PHYSICS_CONFIG } from '../core/PhysicsConfig';
import { RiderController } from './RiderController';
import { RiderMeshBuilder } from './RiderMeshBuilder';

export class Motorcycle {
  public mesh: THREE.Group;
  public riderController: RiderController;
  public bounds: THREE.Box3 = new THREE.Box3();
  private meshComponents: MotorcycleMeshResult;
  private frontWheelRotation: number = 0;
  private rearWheelRotation: number = 0;
  private frontWheelRadius: number = WHEEL_CALIBRATION.FRONT_RADIUS;
  private rearWheelRadius: number = WHEEL_CALIBRATION.REAR_RADIUS;
  private currentLean: number = 0;
  private rollVelocity: number = 0;
  private riderTuck: number = 0.08;
  private riderBrakeBrace: number = 0;
  private riderAccelHunch: number = 0;
  private breathPhase: number = 0;
  private suspensionPhase: number = 0;
  private suspensionPitch: number = 0;
  private prevSpeed: number = 0;
  private _isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;
  private info: MotorcycleInfo;
  private isGLBModel: boolean = false;

  constructor(info: MotorcycleInfo) {
    this.info = info;
    this.riderController = new RiderController(
      info.primaryColor,
      info.secondaryColor,
      info.modelStyle === 'cruiser'
    );
    // 1. Instant synchronous procedural baseline
    this.meshComponents = MotorcycleModels.createMotorcycle(info);
    this.riderController.bindRiderMesh(this.meshComponents.rider);
    this.mesh = this.meshComponents.group;
    this.mesh.name = 'motorcycle_root';

    // 2. Progressive asynchronous GLB enhancement
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      this.tryLoadGLB(info);
    }
    this.updateBounds();
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  public get lean(): number {
    return this.currentLean;
  }

  public get isLoadedGLB(): boolean {
    return this.isGLBModel;
  }

  public get components(): MotorcycleMeshResult {
    return this.meshComponents;
  }

  public get currentSuspensionPitch(): number {
    return this.suspensionPitch;
  }

  public get currentRiderTuck(): number {
    return this.riderController ? this.riderController.tuck : this.riderTuck;
  }

  public get frontRotation(): number {
    return this.frontWheelRotation;
  }

  public get rearRotation(): number {
    return this.rearWheelRotation;
  }

  public get brakeBrace(): number {
    return this.riderController ? this.riderController.brakeBrace : this.riderBrakeBrace;
  }

  public get accelHunch(): number {
    return this.riderController ? this.riderController.accelHunch : this.riderAccelHunch;
  }

  public setInvulnerable(duration: number): void {
    this._isInvulnerable = true;
    this.invulnerableTimer = duration;
  }

  public get isInvulnerable(): boolean {
    return this._isInvulnerable;
  }

  public get invulnerable(): boolean {
    return this._isInvulnerable;
  }

  public mountRider(newRider: THREE.Object3D): void {
    const socket = this.meshComponents.riderRoot;
    if (socket) {
      if (this.meshComponents.rider && this.meshComponents.rider.parent === socket) {
        socket.remove(this.meshComponents.rider);
      }
      newRider.name = 'stylized_rider_mount';
      newRider.position.set(0, 0, 0);
      newRider.rotation.set(0, 0, 0);
      newRider.scale.set(1, 1, 1);
      socket.add(newRider);
      this.meshComponents.rider = newRider;
      if (this.riderController) {
        this.riderController.bindRiderMesh(newRider);
      }
    }
  }

  public async tryLoadGLB(info: MotorcycleInfo = this.info): Promise<void> {
    if (!info.modelUrl) return;
    try {
      const loader = AssetLoader.getInstance();
      const loadedGroup = await loader.loadGLTF(info.modelUrl);
      if (!loadedGroup || this.info.id !== info.id) return;

      // Load starter pack racing rider model
      let riderMount: THREE.Object3D | undefined = undefined;
      const riderGLB = await loader.loadRiderModel();
      if (riderGLB && this.riderController) {
        riderMount = this.riderController.prepareRiderGLB(riderGLB);
      }

      const glbComponents = loader.adaptMotorcycleModel(loadedGroup, info, riderMount);
      this.applyMeshComponents(glbComponents);
      this.isGLBModel = true;
    } catch (err) {
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        console.warn(`[Motorcycle] Failed to load GLB for ${info.id}:`, err);
      }
    }
  }

  private applyMeshComponents(newComponents: MotorcycleMeshResult): void {
    const parent = this.mesh.parent;
    const currentPos = this.mesh.position.clone();
    const currentRot = this.mesh.rotation.clone();

    if (parent) {
      parent.remove(this.mesh);
    }

    this.meshComponents = newComponents;
    if (this.riderController && newComponents.rider) {
      this.riderController.bindRiderMesh(newComponents.rider);
    }
    this.mesh = newComponents.group;
    this.mesh.name = 'motorcycle_root';
    this.mesh.position.copy(currentPos);
    this.mesh.rotation.copy(currentRot);

    if (parent) {
      parent.add(this.mesh);
    }
  }

  public update(
    dt: number,
    speed: number,
    targetLean: number,
    brake: number = 0,
    isNitro: boolean = false,
    lateralAccel: number = 0,
    steerInput: number = 0
  ): void {
    const clampedDt = Math.min(dt, 0.1);

    // --- 1. CALIBRATED INDEPENDENT WHEEL SPIN (v / r without slip on local X) ---
    const frontOmega = speed / this.frontWheelRadius;
    const rearOmega = speed / this.rearWheelRadius;
    this.frontWheelRotation -= frontOmega * clampedDt;
    this.rearWheelRotation -= rearOmega * clampedDt;
    this.meshComponents.frontWheel.rotation.x = this.frontWheelRotation;
    this.meshComponents.rearWheel.rotation.x = this.rearWheelRotation;

    // --- 2. MOTORCYCLE ROLL / LEAN AND YAW INTO TURNS ---
    const maxRoll = PHYSICS_CONFIG.MAX_ROLL_ANGLE;
    let steadyLean: number;
    if (lateralAccel !== 0 || steerInput !== 0) {
      // Steady-state roll lean derived from lateral acceleration and steering anticipation
      const g = 9.81;
      const accelComponent = (-lateralAccel / g) * (PHYSICS_CONFIG.ROLL_ACCEL_FACTOR * 0.65);
      const steerComponent = steerInput * 0.35 * maxRoll;
      steadyLean = MathUtils.clamp(accelComponent + steerComponent, -maxRoll, maxRoll);
    } else {
      steadyLean = MathUtils.clamp(targetLean, -maxRoll, maxRoll);
    }

    // Second-order analytical critically damped spring smoothing (omega_n = 14.0 rad/s)
    const omega = PHYSICS_CONFIG.ROLL_SPRING_OMEGA;
    const deltaLean = this.currentLean - steadyLean;
    const expDecay = Math.exp(-omega * clampedDt);
    const newLean = steadyLean + (deltaLean + (this.rollVelocity + omega * deltaLean) * clampedDt) * expDecay;
    this.rollVelocity = (this.rollVelocity - omega * (this.rollVelocity + omega * deltaLean) * clampedDt) * expDecay;
    this.currentLean = newLean;

    this.meshComponents.chassis.rotation.z = -this.currentLean;
    this.meshComponents.chassis.rotation.y = this.currentLean * 0.25;

    // --- 3. STEERING RESPONSE (Handlebar & Fork Turn) ---
    if (this.meshComponents.steering) {
      this.meshComponents.steering.rotation.y = -this.currentLean * 0.35;
    }

    // --- 4. RIDER KINEMATICS & ANALYTICAL 2-BONE IK ---
    if (this.riderController) {
      this.riderController.update(clampedDt, speed, this.currentLean, isNitro, brake);
    }

    const accel = (speed - this.prevSpeed) / Math.max(clampedDt, 0.001);
    this.prevSpeed = speed;

    // --- 5. SUSPENSION DYNAMICS (Dive on brake, Squat on accel, road vibration hum) ---
    const divePitch = Math.min(
      PHYSICS_CONFIG.PITCH_DIVE_MAX,
      Math.max(0, -accel * 0.004 + brake * 0.03)
    );
    const squatPitch = -Math.min(
      PHYSICS_CONFIG.PITCH_SQUAT_MAX,
      Math.max(0, accel * 0.003 + (isNitro ? 0.02 : 0))
    );
    const targetPitch = divePitch + squatPitch;
    this.suspensionPitch = MathUtils.damp(this.suspensionPitch, targetPitch, 10, clampedDt);

    this.suspensionPhase += speed * clampedDt * 0.8;
    const bob = Math.sin(this.suspensionPhase) * 0.015;
    const roadHum =
      (Math.sin(this.suspensionPhase * 3.7) * 0.001 + Math.sin(this.suspensionPhase * 7.1) * 0.0005) *
      (speed / Math.max(PHYSICS_CONFIG.CRUISING_SPEED, 1));

    this.meshComponents.chassis.position.y = bob + roadHum;
    this.meshComponents.chassis.rotation.x = this.suspensionPitch;

    // --- 6. INVULNERABILITY FLICKER ---
    if (this._isInvulnerable) {
      this.invulnerableTimer -= clampedDt;
      if (this.invulnerableTimer <= 0) {
        this._isInvulnerable = false;
        this.mesh.visible = true;
      } else {
        // Blink visible/invisible rapidly
        this.mesh.visible = Math.floor(this.invulnerableTimer * 20) % 2 === 0;
      }
    } else {
      this.mesh.visible = true;
    }

    this.updateBounds();
  }

  public updateBounds(): void {
    const halfW = GAME_CONFIG.MOTORCYCLE_WIDTH / 2;
    const halfL = GAME_CONFIG.MOTORCYCLE_LENGTH / 2;
    const h = GAME_CONFIG.MOTORCYCLE_HEIGHT;
    const px = this.mesh.position.x;
    const pz = this.mesh.position.z;
    this.bounds.min.set(px - halfW, 0, pz - halfL);
    this.bounds.max.set(px + halfW, h, pz + halfL);
  }

  public changeMotorcycle(info: MotorcycleInfo): void {
    this.info = info;
    this.isGLBModel = false;
    this.riderController = new RiderController(info.primaryColor, info.secondaryColor);
    const proc = MotorcycleModels.createMotorcycle(info);
    this.applyMeshComponents(proc);
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      this.tryLoadGLB(info);
    }
  }

  public reset(x: number = 0, z: number = 0): void {
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.set(0, 0, 0);
    this.meshComponents.chassis.rotation.set(0, 0, 0);
    this.meshComponents.chassis.position.set(0, 0, 0);
    this.frontWheelRotation = 0;
    this.rearWheelRotation = 0;
    this.currentLean = 0;
    this.rollVelocity = 0;
    this.riderTuck = 0.08;
    this.riderBrakeBrace = 0;
    this.riderAccelHunch = 0;
    this.breathPhase = 0;
    this.suspensionPitch = 0;
    this.suspensionPhase = 0;
    this.prevSpeed = 0;
    if (this.riderController) {
      this.riderController.reset();
    }
    if (this.meshComponents.rider) {
      this.meshComponents.rider.rotation.set(0, 0, 0);
      this.meshComponents.rider.position.set(0, 0, 0);
      const head = this.meshComponents.rider.getObjectByName('rider_head');
      if (head) {
        head.rotation.set(0, 0, 0);
      }
    }
    if (this.meshComponents.steering) {
      this.meshComponents.steering.rotation.set(0, 0, 0);
    }
    this.meshComponents.frontWheel.rotation.set(0, 0, 0);
    this.meshComponents.rearWheel.rotation.set(0, 0, 0);
    this._isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.mesh.visible = true;
    this.updateBounds();
  }

  public dispose(): void {
    if (this.riderController) {
      this.riderController.dispose();
    }
    if (this.mesh) {
      RiderMeshBuilder.disposeHierarchy(this.mesh);
    }
  }
}

