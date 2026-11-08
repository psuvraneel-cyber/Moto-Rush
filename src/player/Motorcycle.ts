import * as THREE from 'three';
import { MotorcycleInfo } from '../progression/GarageManager';
import { MotorcycleModels, MotorcycleMeshResult } from './MotorcycleModels';
import { MathUtils } from '../utilities/MathUtils';

export class Motorcycle {
  public mesh: THREE.Group;
  private meshComponents: MotorcycleMeshResult;
  private wheelRotation: number = 0;
  private currentLean: number = 0;
  private suspensionPhase: number = 0;
  private isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;
  private info: MotorcycleInfo;

  constructor(info: MotorcycleInfo) {
    this.info = info;
    this.meshComponents = MotorcycleModels.createMotorcycle(info);
    this.mesh = this.meshComponents.group;
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  public get lean(): number {
    return this.currentLean;
  }

  public setInvulnerable(duration: number): void {
    this.isInvulnerable = true;
    this.invulnerableTimer = duration;
  }

  public get invulnerable(): boolean {
    return this.isInvulnerable;
  }

  public update(dt: number, speed: number, targetLean: number): void {
    // 1. Wheel spin based on forward speed
    const wheelRadius = 0.42;
    const angularSpeed = speed / wheelRadius;
    this.wheelRotation -= angularSpeed * dt;
    this.meshComponents.frontWheel.rotation.x = this.wheelRotation;
    this.meshComponents.rearWheel.rotation.x = this.wheelRotation;

    // 2. Smooth steering lean roll
    this.currentLean = MathUtils.damp(this.currentLean, targetLean, 12, dt);
    this.meshComponents.chassis.rotation.z = -this.currentLean;
    this.meshComponents.chassis.rotation.y = this.currentLean * 0.25; // Slight yaw into turn

    // 3. Small suspension bobbing
    this.suspensionPhase += speed * dt * 0.8;
    const bob = Math.sin(this.suspensionPhase) * 0.025;
    this.meshComponents.chassis.position.y = bob;

    // 4. Invulnerability flicker effect
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.mesh.visible = true;
      } else {
        // Blink visible/invisible rapidly
        this.mesh.visible = Math.floor(this.invulnerableTimer * 20) % 2 === 0;
      }
    } else {
      this.mesh.visible = true;
    }
  }

  public changeMotorcycle(info: MotorcycleInfo): void {
    const parent = this.mesh.parent;
    const currentPos = this.mesh.position.clone();

    if (parent) {
      parent.remove(this.mesh);
    }

    this.info = info;
    this.meshComponents = MotorcycleModels.createMotorcycle(info);
    this.mesh = this.meshComponents.group;
    this.mesh.position.copy(currentPos);

    if (parent) {
      parent.add(this.mesh);
    }
  }

  public reset(x: number = 0, z: number = 0): void {
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.set(0, 0, 0);
    this.meshComponents.chassis.rotation.set(0, 0, 0);
    this.currentLean = 0;
    this.wheelRotation = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.mesh.visible = true;
  }
}
