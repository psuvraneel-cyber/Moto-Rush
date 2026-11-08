import * as THREE from 'three';
import { ObstacleType, ObstacleDef } from '../levels/LevelDefinitions';
import { GAME_CONFIG } from '../core/GameConfig';

export class Obstacle {
  public mesh: THREE.Group;
  public type: ObstacleType;
  public bounds: THREE.Box3 = new THREE.Box3();
  public damage: number = 0;
  public isHit: boolean = false;
  private def: ObstacleDef;
  private animTimer: number = Math.random() * Math.PI * 2;
  private initialX: number;
  private spinnerArm?: THREE.Mesh;
  private crusherPiston?: THREE.Mesh;

  constructor(def: ObstacleDef) {
    this.def = def;
    this.type = def.type;
    this.initialX = def.x;
    this.mesh = new THREE.Group();
    this.mesh.name = `obstacle_${def.type}`;
    this.mesh.position.set(def.x, 0, def.z);

    this.buildGeometry();
    this.assignDamage();
    this.updateBounds();
  }

  private assignDamage(): void {
    switch (this.type) {
      case 'barrier_small':
        this.damage = GAME_CONFIG.DAMAGE.BARRIER_SMALL;
        break;
      case 'barrier_large':
        this.damage = GAME_CONFIG.DAMAGE.BARRIER_LARGE;
        break;
      case 'traffic':
        this.damage = GAME_CONFIG.DAMAGE.VEHICLE_COLLISION;
        break;
      case 'crusher':
        this.damage = GAME_CONFIG.DAMAGE.CRUSHER;
        break;
      case 'spinner':
        this.damage = GAME_CONFIG.DAMAGE.SPINNER;
        break;
      case 'oil_slick':
        this.damage = 0; // Does not remove bikes, causes slip
        break;
    }
  }

  private buildGeometry(): void {
    switch (this.type) {
      case 'barrier_small': {
        // Traffic barrier with hazard stripes
        const baseGeom = new THREE.BoxGeometry(2.4, 0.8, 0.4);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 });
        const mesh = new THREE.Mesh(baseGeom, mat);
        mesh.position.y = 0.4;
        mesh.castShadow = true;

        const stripeGeom = new THREE.BoxGeometry(2.45, 0.2, 0.42);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const stripe = new THREE.Mesh(stripeGeom, stripeMat);
        stripe.position.y = 0.45;
        this.mesh.add(mesh, stripe);
        break;
      }

      case 'barrier_large': {
        // Concrete jersey barrier
        const concGeom = new THREE.BoxGeometry(3.6, 1.2, 0.6);
        const concMat = new THREE.MeshStandardMaterial({ color: 0x88929a, roughness: 0.8 });
        const concMesh = new THREE.Mesh(concGeom, concMat);
        concMesh.position.y = 0.6;
        concMesh.castShadow = true;
        this.mesh.add(concMesh);
        break;
      }

      case 'traffic': {
        // Low-poly sedan
        const carBody = new THREE.BoxGeometry(1.8, 0.65, 3.4);
        const carMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
        const bodyMesh = new THREE.Mesh(carBody, carMat);
        bodyMesh.position.y = 0.55;
        bodyMesh.castShadow = true;

        // Cabin
        const cabinGeom = new THREE.BoxGeometry(1.5, 0.55, 1.8);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 });
        const cabinMesh = new THREE.Mesh(cabinGeom, cabinMat);
        cabinMesh.position.set(0, 1.0, -0.2);
        cabinMesh.castShadow = true;

        // Headlights
        const lampGeom = new THREE.BoxGeometry(0.35, 0.15, 0.1);
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftLamp = new THREE.Mesh(lampGeom, lampMat);
        leftLamp.position.set(-0.6, 0.55, 1.72);
        const rightLamp = leftLamp.clone();
        rightLamp.position.x = 0.6;

        this.mesh.add(bodyMesh, cabinMesh, leftLamp, rightLamp);
        break;
      }

      case 'oil_slick': {
        // Flat glossy black road decal
        const puddleGeom = new THREE.CylinderGeometry(1.6, 1.6, 0.04, 16);
        const puddleMat = new THREE.MeshStandardMaterial({
          color: 0x050508,
          roughness: 0.05,
          metalness: 0.9,
        });
        const puddleMesh = new THREE.Mesh(puddleGeom, puddleMat);
        puddleMesh.position.y = 0.02;
        this.mesh.add(puddleMesh);
        break;
      }

      case 'spinner': {
        // Rotating hazard turnstile
        const poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 2.0, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.y = 1.0;

        const armGeom = new THREE.BoxGeometry(3.6, 0.3, 0.3);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        this.spinnerArm = new THREE.Mesh(armGeom, armMat);
        this.spinnerArm.position.y = 0.8;
        this.spinnerArm.castShadow = true;

        this.mesh.add(pole, this.spinnerArm);
        break;
      }

      case 'crusher': {
        // Overhead hydraulic frame with slamming piston
        const archGeom = new THREE.BoxGeometry(4.2, 0.4, 0.5);
        const archMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
        const arch = new THREE.Mesh(archGeom, archMat);
        arch.position.y = 3.6;

        const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 0.5), archMat);
        pillarL.position.set(-2.0, 1.8, 0);
        const pillarR = pillarL.clone();
        pillarR.position.x = 2.0;

        const pistonGeom = new THREE.BoxGeometry(2.8, 1.0, 0.6);
        const pistonMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
        this.crusherPiston = new THREE.Mesh(pistonGeom, pistonMat);
        this.crusherPiston.position.y = 2.4;
        this.crusherPiston.castShadow = true;

        this.mesh.add(arch, pillarL, pillarR, this.crusherPiston);
        break;
      }
    }
  }

  public update(dt: number): void {
    this.animTimer += dt;

    if (this.type === 'spinner' && this.spinnerArm) {
      const rotSpeed = this.def.speed || 3.0;
      this.spinnerArm.rotation.y += rotSpeed * dt;
    } else if (this.type === 'crusher' && this.crusherPiston) {
      const speed = this.def.speed || 2.5;
      // Slamming cycle
      const cycle = (Math.sin(this.animTimer * speed) + 1) / 2; // 0 to 1
      this.crusherPiston.position.y = 0.6 + cycle * 2.0;
    } else if (this.type === 'traffic') {
      // Moves forward slowly along road, or lane drifts
      const speed = this.def.speed || 8;
      this.mesh.position.z += speed * dt * 0.4;
      if (this.def.range) {
        this.mesh.position.x = this.initialX + Math.sin(this.animTimer * 1.5) * this.def.range;
      }
    }

    this.updateBounds();
  }

  public updateBounds(): void {
    this.bounds.setFromObject(this.mesh);
  }
}
