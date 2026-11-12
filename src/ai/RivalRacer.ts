import * as THREE from 'three';
import { MotorcycleModels, MotorcycleMeshResult } from '../player/MotorcycleModels';
import { MathUtils } from '../utilities/MathUtils';
import { TrafficManager } from '../racing/TrafficManager';
import { TrafficVehicle } from '../racing/TrafficVehicle';

export interface RivalProfile {
  id: number;
  name: string;
  primaryColor: number;
  secondaryColor: number;
  glowColor: number;
  targetSpeed: number;    // Base speed in m/s (e.g. 21 to 26)
  aggression: number;     // 0.0 to 1.0 (frequency of lane changes / overtaking)
}

export const RIVAL_ROSTER: RivalProfile[] = [
  {
    id: 1,
    name: 'Red Phantom',
    primaryColor: 0xef4444,
    secondaryColor: 0x1f2937,
    glowColor: 0xff0033,
    targetSpeed: 23.5,
    aggression: 0.7,
  },
  {
    id: 2,
    name: 'Cyber Viper',
    primaryColor: 0x10b981,
    secondaryColor: 0x064e3b,
    glowColor: 0x00ff88,
    targetSpeed: 22.0,
    aggression: 0.5,
  },
  {
    id: 3,
    name: 'Apex Striker',
    primaryColor: 0xf59e0b,
    secondaryColor: 0x78350f,
    glowColor: 0xffaa00,
    targetSpeed: 25.0,
    aggression: 0.85,
  },
  {
    id: 4,
    name: 'Neon Ghost',
    primaryColor: 0x8b5cf6,
    secondaryColor: 0x2e1065,
    glowColor: 0xbf00ff,
    targetSpeed: 24.0,
    aggression: 0.6,
  },
];

export class RivalRacer {
  public profile: RivalProfile;
  public mesh: THREE.Group;
  private components: MotorcycleMeshResult;
  public bounds: THREE.Box3;

  public currentLane: number;
  public targetLane: number;
  public isChangingLane: boolean = false;
  public laneChangeProgress: number = 0;
  public startX: number = 0;
  public targetX: number = 0;

  public speed: number;
  public currentLean: number = 0;
  private wheelRotation: number = 0;

  constructor(profile: RivalProfile, initialLane: number, startZ: number) {
    this.profile = profile;
    this.currentLane = initialLane;
    this.targetLane = initialLane;
    this.speed = profile.targetSpeed;

    this.components = MotorcycleModels.createMotorcycle({
      id: `rival_${profile.id}`,
      name: profile.name,
      unlocked: true,
      price: 0,
      handlingMultiplier: 1.0,
      accelerationBonus: 0,
      primaryColor: profile.primaryColor,
      secondaryColor: profile.secondaryColor,
      glowColor: profile.glowColor,
    });

    this.mesh = this.components.group;
    this.mesh.name = `rival_bike_${profile.id}`;

    // Add rooftop name banner tag
    const namePlate = this.createNamePlate(profile.name, profile.glowColor);
    this.mesh.add(namePlate);

    const initialX = TrafficManager.LANE_X[initialLane];
    this.mesh.position.set(initialX, 0, startZ);
    this.bounds = new THREE.Box3();
    this.updateBounds();
  }

  private createNamePlate(name: string, glowColor: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(4, 4, 248, 56, 12);
        ctx.fill();
      } else {
        ctx.fillRect(4, 4, 248, 56);
      }
      ctx.strokeStyle = `#${glowColor.toString(16).padStart(6, '0')}`;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 128, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), mat);
    plate.position.set(0, 1.85, 0);
    return plate;
  }

  public updateBounds(): void {
    const p = this.mesh.position;
    this.bounds.min.set(p.x - 0.45, p.y, p.z - 1.1);
    this.bounds.max.set(p.x + 0.45, p.y + 1.4, p.z + 1.1);
  }

  public update(dt: number, trafficAhead: TrafficVehicle[]): void {
    const clampedDt = Math.min(dt, 0.1);

    // 1. Traffic avoidance ahead in same lane
    let obstacleNear = false;
    for (const tv of trafficAhead) {
      if (tv.currentLane === this.currentLane && tv.mesh.position.z > this.mesh.position.z) {
        const gap = tv.mesh.position.z - this.mesh.position.z;
        if (gap < 24) {
          obstacleNear = true;
          // Decelerate or initiate dodge
          this.speed = Math.min(this.speed, tv.speed * 0.95);
          if (!this.isChangingLane) {
            this.attemptEvasiveLaneChange();
          }
          break;
        }
      }
    }

    if (!obstacleNear) {
      // Accelerate back to target racing speed
      if (this.speed < this.profile.targetSpeed) {
        this.speed = Math.min(this.profile.targetSpeed, this.speed + 8.0 * clampedDt);
      }
    }

    // 2. Lane changing interpolation
    let targetLeanAngle = 0;
    if (this.isChangingLane) {
      this.laneChangeProgress += clampedDt * 0.9;
      if (this.laneChangeProgress >= 1.0) {
        this.laneChangeProgress = 1.0;
        this.isChangingLane = false;
        this.currentLane = this.targetLane;
        this.mesh.position.x = this.targetX;
      } else {
        const t = this.laneChangeProgress;
        const smoothT = t * t * (3 - 2 * t);
        this.mesh.position.x = this.startX + (this.targetX - this.startX) * smoothT;
        const dir = Math.sign(this.targetX - this.startX);
        targetLeanAngle = -dir * 0.35;
      }
    }

    // Forward translation
    this.mesh.position.z += this.speed * clampedDt;

    // Kinematics: Lean and Wheel spin
    this.currentLean = MathUtils.damp(this.currentLean, targetLeanAngle, 10, clampedDt);
    this.components.chassis.rotation.z = -this.currentLean;
    this.components.chassis.rotation.y = this.currentLean * 0.25;

    const angularSpeed = this.speed / 0.42;
    this.wheelRotation -= angularSpeed * clampedDt;
    this.components.frontWheel.rotation.x = this.wheelRotation;
    this.components.rearWheel.rotation.x = this.wheelRotation;

    this.updateBounds();
  }

  private attemptEvasiveLaneChange(): void {
    const candidates: number[] = [];
    if (this.currentLane > 0) candidates.push(this.currentLane - 1);
    if (this.currentLane < TrafficManager.LANE_X.length - 1) candidates.push(this.currentLane + 1);

    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    this.isChangingLane = true;
    this.targetLane = target;
    this.startX = this.mesh.position.x;
    this.targetX = TrafficManager.LANE_X[target];
    this.laneChangeProgress = 0;
  }
}
