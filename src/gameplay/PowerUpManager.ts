import * as THREE from 'three';
import { PowerUpType, PowerUpDef } from '../levels/LevelDefinitions';
import { UpgradeManager } from '../progression/UpgradeManager';
import { PlayerController } from '../player/PlayerController';
import { FleetManager } from '../convoy/FleetManager';
import { EventBus, GlobalEvents } from '../core/EventBus';
import { GAME_CONFIG } from '../core/GameConfig';

export interface ActivePowerUpItem {
  type: PowerUpType;
  mesh: THREE.Group;
  collected: boolean;
  baseY: number;
}

export class PowerUpManager {
  public group: THREE.Group;
  private items: ActivePowerUpItem[] = [];
  private activeTimers: Map<PowerUpType, number> = new Map();
  private spinAngle: number = 0;

  constructor(
    private upgradeManager: UpgradeManager,
    private playerController: PlayerController,
    private fleetManager: FleetManager,
    private eventBus: EventBus
  ) {
    this.group = new THREE.Group();
    this.group.name = 'powerups_manager';
  }

  public isActive(type: PowerUpType): boolean {
    return (this.activeTimers.get(type) || 0) > 0;
  }

  public getRemainingTime(type: PowerUpType): number {
    return Math.max(0, this.activeTimers.get(type) || 0);
  }

  public loadPowerUps(defs: PowerUpDef[]): void {
    this.clear();

    for (const def of defs) {
      const itemGroup = this.createPowerUpMesh(def.type);
      itemGroup.position.set(def.x, 0.8, def.z);
      this.group.add(itemGroup);

      this.items.push({
        type: def.type,
        mesh: itemGroup,
        collected: false,
        baseY: 0.8,
      });
    }
  }

  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const grp = new THREE.Group();
    let mainColor = 0x3b82f6;

    switch (type) {
      case 'shield':
        mainColor = 0x06b6d4;
        break;
      case 'turbo':
        mainColor = 0xfacc15;
        break;
      case 'magnet':
        mainColor = 0xef4444;
        break;
      case 'repair':
        mainColor = 0x22c55e;
        break;
      case 'double_coins':
        mainColor = 0xf59e0b;
        break;
    }

    // Outer floating glowing crystal / sphere
    const orbGeom = new THREE.OctahedronGeometry(0.5, 0);
    const orbMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      emissive: mainColor,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const orbMesh = new THREE.Mesh(orbGeom, orbMat);
    orbMesh.castShadow = true;
    grp.add(orbMesh);

    // Glowing halo ring around it
    const ringGeom = new THREE.TorusGeometry(0.7, 0.05, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: mainColor, wireframe: true });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    grp.add(ringMesh);

    return grp;
  }

  public update(dt: number, heroPos: THREE.Vector3): void {
    this.spinAngle += dt * 3.0;

    // 1. Update floating pickups
    const heroX = heroPos.x;
    const heroZ = heroPos.z;
    const pickupRadiusSq = 1.8 * 1.8;

    for (const item of this.items) {
      if (item.collected) continue;

      item.mesh.rotation.y = this.spinAngle;
      item.mesh.position.y = item.baseY + Math.sin(this.spinAngle * 0.9) * 0.15;

      const dx = heroX - item.mesh.position.x;
      const dz = heroZ - item.mesh.position.z;
      if (dx * dx + dz * dz < pickupRadiusSq) {
        item.collected = true;
        item.mesh.visible = false;
        this.activatePowerUp(item.type);
      }
    }

    // 2. Decrement active timers
    for (const [type, timer] of this.activeTimers.entries()) {
      if (timer > 0) {
        const nextTime = timer - dt;
        if (nextTime <= 0) {
          this.activeTimers.delete(type);
          this.deactivatePowerUp(type);
        } else {
          this.activeTimers.set(type, nextTime);
        }
      }
    }
  }

  public activatePowerUp(type: PowerUpType): void {
    let duration = 5;

    switch (type) {
      case 'shield':
        duration = GAME_CONFIG.POWERUPS.SHIELD.duration + this.upgradeManager.getShieldDurationBonus();
        break;
      case 'turbo':
        duration = GAME_CONFIG.POWERUPS.TURBO.duration + this.upgradeManager.getTurboDurationBonus();
        this.playerController.setTurbo(true);
        break;
      case 'magnet':
        duration = GAME_CONFIG.POWERUPS.MAGNET.duration;
        break;
      case 'repair': {
        const ratio = GAME_CONFIG.POWERUPS.REPAIR.ratio * this.upgradeManager.getRepairMultiplier();
        this.fleetManager.repair(ratio);
        break;
      }
      case 'double_coins':
        duration = GAME_CONFIG.POWERUPS.DOUBLE_COINS.duration;
        break;
    }

    if (type !== 'repair') {
      this.activeTimers.set(type, duration);
    }

    this.eventBus.emit(GlobalEvents.POWERUP_COLLECTED, {
      type,
      duration,
    });
  }

  private deactivatePowerUp(type: PowerUpType): void {
    if (type === 'turbo') {
      this.playerController.setTurbo(false);
    }

    this.eventBus.emit(GlobalEvents.POWERUP_EXPIRED, { type });
  }

  public clear(): void {
    for (const item of this.items) {
      this.group.remove(item.mesh);
    }
    this.items = [];
    this.activeTimers.clear();
    this.playerController.setTurbo(false);
  }
}
