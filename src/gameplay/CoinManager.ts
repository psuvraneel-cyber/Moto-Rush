import * as THREE from 'three';
import { CoinGroupDef } from '../levels/LevelDefinitions';
import { EventBus, GlobalEvents } from '../core/EventBus';
import { MathUtils } from '../utilities/MathUtils';

export interface ActiveCoin {
  mesh: THREE.Mesh;
  collected: boolean;
  baseY: number;
}

export class CoinManager {
  public group: THREE.Group;
  private coins: ActiveCoin[] = [];
  private coinGeom: THREE.CylinderGeometry;
  private coinMat: THREE.MeshStandardMaterial;
  private spinAngle: number = 0;
  private collectedCount: number = 0;

  constructor(private eventBus: EventBus) {
    this.group = new THREE.Group();
    this.group.name = 'coins_manager';

    this.coinGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 12);
    this.coinGeom.rotateX(Math.PI / 2);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.25,
      metalness: 0.85,
      emissive: 0xff9900,
      emissiveIntensity: 0.3,
    });
  }

  public get collected(): number {
    return this.collectedCount;
  }

  public addBonusCoins(amount: number): void {
    this.collectedCount += amount;
  }

  public loadCoins(defs: CoinGroupDef[]): void {
    this.clear();
    this.collectedCount = 0;

    for (const group of defs) {
      this.spawnGroup(group);
    }
  }

  private spawnGroup(def: CoinGroupDef): void {
    const spacingZ = 2.4;

    switch (def.pattern) {
      case 'line': {
        for (let i = 0; i < def.count; i++) {
          this.createCoin(def.startX, 0.6, def.startZ + i * spacingZ);
        }
        break;
      }
      case 'arc': {
        for (let i = 0; i < def.count; i++) {
          const t = i / (def.count - 1); // 0 to 1
          const x = def.startX + Math.sin(t * Math.PI) * 2.8;
          this.createCoin(x, 0.6, def.startZ + i * spacingZ);
        }
        break;
      }
      case 'cluster': {
        for (let i = 0; i < def.count; i++) {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = def.startX + (col - 1) * 1.2;
          this.createCoin(x, 0.6, def.startZ + row * spacingZ);
        }
        break;
      }
    }
  }

  private createCoin(x: number, y: number, z: number): void {
    const mesh = new THREE.Mesh(this.coinGeom, this.coinMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.group.add(mesh);

    this.coins.push({
      mesh,
      collected: false,
      baseY: y,
    });
  }

  public update(
    dt: number,
    heroPos: THREE.Vector3,
    isMagnetActive: boolean = false,
    isDoubleCoins: boolean = false,
    magnetRadius: number = 14
  ): void {
    this.spinAngle += dt * 4.0;
    const heroX = heroPos.x;
    const heroZ = heroPos.z;

    const pickupRadiusSq = 1.6 * 1.6;
    const magnetRadiusSq = magnetRadius * magnetRadius;

    for (const coin of this.coins) {
      if (coin.collected) continue;

      coin.mesh.rotation.y = this.spinAngle;
      coin.mesh.position.y = coin.baseY + Math.sin(this.spinAngle * 0.8) * 0.1;

      const dx = heroX - coin.mesh.position.x;
      const dz = heroZ - coin.mesh.position.z;
      const distSq = dx * dx + dz * dz;

      // Magnet pull towards player
      if (isMagnetActive && distSq < magnetRadiusSq) {
        coin.mesh.position.x = MathUtils.damp(coin.mesh.position.x, heroX, 10, dt);
        coin.mesh.position.z = MathUtils.damp(coin.mesh.position.z, heroZ, 10, dt);
      }

      // Check collection
      if (distSq < pickupRadiusSq) {
        coin.collected = true;
        coin.mesh.visible = false;
        const gain = isDoubleCoins ? 2 : 1;
        this.collectedCount += gain;

        this.eventBus.emit(GlobalEvents.COIN_COLLECTED, {
          totalCollected: this.collectedCount,
          gain,
          position: coin.mesh.position.clone(),
        });
      }
    }
  }

  public clear(): void {
    for (const coin of this.coins) {
      this.group.remove(coin.mesh);
    }
    this.coins = [];
    this.collectedCount = 0;
  }
}
