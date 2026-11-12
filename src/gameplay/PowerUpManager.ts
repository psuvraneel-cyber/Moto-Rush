import * as THREE from 'three';
import { PowerUpType, PowerUpDef } from '../levels/LevelDefinitions';
import { UpgradeManager } from '../progression/UpgradeManager';
import { PlayerController } from '../player/PlayerController';
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
    private eventBus: EventBus
  ) {
    this.group = new THREE.Group();
    this.group.name = 'powerups_manager';
  }

  public isActive(type: PowerUpType): boolean {
    return (this.activeTimers.get(type) || 0) > 0;
  }

  public consumeShield(): boolean {
    if (this.isActive('shield')) {
      this.activeTimers.delete('shield');
      this.deactivatePowerUp('shield');
      return true;
    }
    return false;
  }

  public getActivePowerUps(): { type: PowerUpType; name: string; icon: string; remaining: number }[] {
    const list: { type: PowerUpType; name: string; icon: string; remaining: number }[] = [];
    const icons: Record<PowerUpType, string> = {
      shield: '🛡️',
      turbo: '⚡',
      magnet: '🧲',
      repair: '🔧',
      double_coins: '🪙',
    };
    for (const [type, timer] of this.activeTimers.entries()) {
      if (timer > 0) {
        list.push({
          type,
          name: (GAME_CONFIG.POWERUPS as any)[type.toUpperCase()]?.name || type,
          icon: icons[type] || '✨',
          remaining: Math.ceil(timer),
        });
      }
    }
    return list;
  }

  public getRemainingTime(type: PowerUpType): number {
    return Math.max(0, this.activeTimers.get(type) || 0);
  }

  public loadPowerUps(defs: PowerUpDef[]): void {
    this.clear();
    for (const def of defs) {
      const mesh = this.createPowerUpMesh(def.type);
      mesh.position.set(def.x, 1.2, def.z);
      this.group.add(mesh);
      this.items.push({
        type: def.type,
        mesh,
        collected: false,
        baseY: 1.2,
      });
    }
  }

  public update(dt: number, heroPosition: THREE.Vector3): void {
    // 1. Tick active timers
    for (const [type, timer] of this.activeTimers.entries()) {
      const next = timer - dt;
      if (next <= 0) {
        this.activeTimers.delete(type);
        this.deactivatePowerUp(type);
        this.eventBus.emit(GlobalEvents.POWERUP_EXPIRED, { type });
      } else {
        this.activeTimers.set(type, next);
      }
    }

    // 2. Animate items & check collection
    this.spinAngle += dt * 3.5;
    const heroBox = new THREE.Box3();
    heroBox.min.set(heroPosition.x - 0.7, 0, heroPosition.z - 1.2);
    heroBox.max.set(heroPosition.x + 0.7, 2.0, heroPosition.z + 1.2);

    for (const item of this.items) {
      if (item.collected) continue;

      item.mesh.rotation.y = this.spinAngle;
      item.mesh.position.y = item.baseY + Math.sin(this.spinAngle * 1.5) * 0.15;

      const itemBox = new THREE.Box3().setFromObject(item.mesh);
      if (heroBox.intersectsBox(itemBox)) {
        item.collected = true;
        this.group.remove(item.mesh);
        this.activatePowerUp(item.type);
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
        // Quick Repair provides temporary emergency shield protection
        duration = 5;
        this.activeTimers.set('shield', 5);
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
  }

  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const group = new THREE.Group();

    const colors: Record<PowerUpType, number> = {
      shield: 0x00f0ff,
      turbo: 0xff0055,
      magnet: 0xffd700,
      repair: 0x22c55e,
      double_coins: 0xffaa00,
    };
    const col = colors[type] || 0xffffff;

    // Glowing orb
    const geom = new THREE.SphereGeometry(0.5, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const orb = new THREE.Mesh(geom, mat);
    group.add(orb);

    // Orbiting ring
    const ringGeom = new THREE.TorusGeometry(0.75, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: col });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 4;
    group.add(ring);

    return group;
  }

  public clear(): void {
    for (const item of this.items) {
      this.group.remove(item.mesh);
    }
    this.items = [];
    this.activeTimers.clear();
  }
}
