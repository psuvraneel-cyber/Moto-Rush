import * as THREE from 'three';
import { ObstacleType, ObstacleDef } from '../levels/LevelDefinitions';
import { GAME_CONFIG } from '../core/GameConfig';
import { AssetLoader } from '../assets/AssetLoader';

export class ObstacleModelCache {
  private static instance: ObstacleModelCache;
  private templates: Map<string, THREE.Group> = new Map();
  private isPreloading: boolean = false;
  private isPreloaded: boolean = false;

  private constructor() {
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      this.preload();
    }
  }

  public static getInstance(): ObstacleModelCache {
    if (!ObstacleModelCache.instance) {
      ObstacleModelCache.instance = new ObstacleModelCache();
    }
    return ObstacleModelCache.instance;
  }

  public async preload(): Promise<void> {
    if (this.isPreloaded || this.isPreloading) return;
    this.isPreloading = true;

    const loader = AssetLoader.getInstance();
    const items: Array<{ key: string; file: 'traffic_cone' | 'road_barrier' | 'traffic_barrel' | 'construction_roadblock' | 'road_debris' }> = [
      { key: 'cone', file: 'traffic_cone' },
      { key: 'barrier', file: 'road_barrier' },
      { key: 'barrel', file: 'traffic_barrel' },
      { key: 'roadblock', file: 'construction_roadblock' },
      { key: 'debris', file: 'road_debris' },
    ];

    await Promise.all(
      items.map(async ({ key, file }) => {
        try {
          const grp = await loader.loadObstacleModel(file);
          if (grp) {
            grp.traverse((c) => {
              if ((c as THREE.Mesh).isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
              }
            });
            this.templates.set(key, grp);
          }
        } catch (_) {}
      })
    );

    this.isPreloaded = true;
    this.isPreloading = false;
  }

  public getModel(key: string): THREE.Group | null {
    const t = this.templates.get(key);
    return t ? t.clone(true) : null;
  }
}

export class Obstacle {
  public mesh: THREE.Group;
  public type: ObstacleType;
  public bounds: THREE.Box3 = new THREE.Box3();
  public damage: number = 0;
  public isHit: boolean = false;
  public hasNearMissed: boolean = false;
  public def: ObstacleDef;

  private animTimer: number = Math.random() * Math.PI * 2;
  private initialX: number;
  private animatedMesh?: THREE.Object3D;
  private secondaryAnimatedMesh?: THREE.Mesh;
  private flashingLights: THREE.Mesh[] = [];

  constructor(def: ObstacleDef) {
    this.def = def;
    this.type = def.type;
    this.initialX = def.x;
    this.mesh = new THREE.Group();
    this.mesh.name = `obstacle_${def.type}`;
    this.mesh.position.set(def.x, 0, def.z);

    this.assignDamage();
    this.buildGeometry();
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
      case 'delivery_van':
        this.damage = GAME_CONFIG.DAMAGE.DELIVERY_VAN;
        break;
      case 'heavy_truck':
        this.damage = GAME_CONFIG.DAMAGE.HEAVY_TRUCK;
        break;
      case 'traffic_cones':
        this.damage = GAME_CONFIG.DAMAGE.TRAFFIC_CONES;
        break;
      case 'pothole':
        this.damage = GAME_CONFIG.DAMAGE.POTHOLE;
        break;
      case 'crusher':
        this.damage = GAME_CONFIG.DAMAGE.CRUSHER;
        break;
      case 'spinner':
        this.damage = GAME_CONFIG.DAMAGE.SPINNER;
        break;
      case 'swinging_barrier':
        this.damage = GAME_CONFIG.DAMAGE.SWINGING_BARRIER;
        break;
      case 'road_gate':
        this.damage = GAME_CONFIG.DAMAGE.ROAD_GATE;
        break;
      case 'construction_zone':
        this.damage = GAME_CONFIG.DAMAGE.CONSTRUCTION_ZONE;
        break;
      case 'oil_slick':
        this.damage = 0; // Triggers slippery drift rather than removing bikes
        break;
    }
  }

  private buildGeometry(): void {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.8 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.9, metalness: 0.1 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.15, metalness: 0.95 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.9 });
    const hazardOrangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const hazardYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const headlampMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    switch (this.type) {
      // 1. SMALL TRAFFIC BARRIER (1 Lane)
      case 'barrier_small': {
        const glb = ObstacleModelCache.getInstance().getModel('barrier');
        if (glb) {
          glb.name = 'glb_road_barrier';
          this.mesh.add(glb);
          break;
        }

        const width = 2.6;
        const height = 0.9;
        const baseGeom = new THREE.BoxGeometry(width, height, 0.45);
        const mesh = new THREE.Mesh(baseGeom, hazardOrangeMat);
        mesh.position.y = height / 2;
        mesh.castShadow = true;

        // White reflective chevron stripes
        const stripeGeom = new THREE.BoxGeometry(width * 1.02, 0.22, 0.48);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const stripe = new THREE.Mesh(stripeGeom, stripeMat);
        stripe.position.y = height / 2;

        // Flashing amber beacon light
        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 10), beaconMat);
        beacon.position.set(0, height + 0.11, 0);
        this.flashingLights.push(beacon);

        this.mesh.add(mesh, stripe, beacon);
        break;
      }

      // 2. LARGE CONCRETE JERSEY BARRIER (2 Lanes)
      case 'barrier_large': {
        const glb = ObstacleModelCache.getInstance().getModel('roadblock');
        if (glb) {
          glb.name = 'glb_construction_roadblock';
          this.mesh.add(glb);
          break;
        }

        const width = 4.8;
        const height = 1.25;
        const concMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85, metalness: 0.1 });

        // Sloped Jersey barrier profile
        const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, 0.95), concMat);
        base.position.y = 0.225;
        const stem = new THREE.Mesh(new THREE.BoxGeometry(width, 0.85, 0.5), concMat);
        stem.position.y = 0.825;
        base.castShadow = true;
        stem.castShadow = true;

        // Reflective yellow warning chevrons
        const refL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.52), hazardYellowMat);
        refL.position.set(-width * 0.35, 0.85, 0);
        const refR = refL.clone();
        refR.position.x = width * 0.35;

        this.mesh.add(base, stem, refL, refR);
        break;
      }

      // 3. COMMUTER TRAFFIC SEDAN CAR
      case 'traffic': {
        const carGrp = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.7 });

        // Lower Chassis & Body
        const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.55, 3.8), bodyMat);
        lowerBody.position.y = 0.5;
        lowerBody.castShadow = true;

        // Cabin Greenhouse
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 2.0), glassMat);
        cabin.position.set(0, 0.98, -0.2);
        cabin.castShadow = true;

        // 4 Wheels
        const wheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
        wheelGeom.rotateZ(Math.PI / 2);
        const wFL = new THREE.Mesh(wheelGeom, rubberMat);
        wFL.position.set(-0.95, 0.32, 1.2);
        const wFR = wFL.clone();
        wFR.position.x = 0.95;
        const wRL = wFL.clone();
        wRL.position.z = -1.2;
        const wRR = wFR.clone();
        wRR.position.z = -1.2;

        // Headlights & Taillights
        const hL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.08), headlampMat);
        hL.position.set(-0.65, 0.55, 1.92);
        const hR = hL.clone();
        hR.position.x = 0.65;
        // Tail lights & Rear details (approached from rear)
        const tL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.08), taillightMat);
        tL.position.set(-0.65, 0.58, -1.92);
        const tR = tL.clone();
        tR.position.x = 0.65;

        // Rear Bumper & License Plate
        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.22, 0.16), metalMat);
        rBumper.position.set(0, 0.35, -1.92);
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.15, 0.04), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        plate.position.set(0, 0.5, -1.93);

        carGrp.add(lowerBody, cabin, wFL, wFR, wRL, wRR, hL, hR, tL, tR, rBumper, plate);
        this.mesh.add(carGrp);
        break;
      }

      // 4. DELIVERY VAN (Wider & Taller Commercial Obstacle)
      case 'delivery_van': {
        const vanGrp = new THREE.Group();
        const vanMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.4 });

        // High boxy cargo box
        const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.8, 3.2), vanMat);
        cargoBox.position.set(0, 1.4, -0.5);
        cargoBox.castShadow = true;

        // Rear cargo twin doors (seen from behind)
        const doorTrimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const doorLine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.7, 0.04), doorTrimMat);
        doorLine.position.set(0, 1.4, -2.12);

        const rBumperVan = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.22, 0.18), metalMat);
        rBumperVan.position.set(0, 0.42, -2.12);

        const vanTL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.06), taillightMat);
        vanTL.position.set(-1.02, 1.25, -2.12);
        const vanTR = vanTL.clone();
        vanTR.position.x = 1.02;

        const vanHighBrake = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.06), taillightMat);
        vanHighBrake.position.set(0, 2.22, -2.12);

        // Front cab
        const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.3, 1.5), vanMat);
        cab.position.set(0, 1.15, 1.6);
        cab.castShadow = true;

        // Windshield
        const wind = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 0.1), glassMat);
        wind.position.set(0, 1.4, 2.36);

        // 4 Large wheels
        const wGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.26, 12);
        wGeom.rotateZ(Math.PI / 2);
        const w1 = new THREE.Mesh(wGeom, rubberMat);
        w1.position.set(-1.18, 0.4, 1.5);
        const w2 = w1.clone();
        w2.position.x = 1.18;
        const w3 = w1.clone();
        w3.position.z = -1.3;
        const w4 = w2.clone();
        w4.position.z = -1.3;

        // Headlights
        const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), headlampMat);
        h1.position.set(-0.8, 0.9, 2.36);
        const h2 = h1.clone();
        h2.position.x = 0.8;

        vanGrp.add(cargoBox, doorLine, rBumperVan, vanTL, vanTR, vanHighBrake, cab, wind, w1, w2, w3, w4, h1, h2);
        this.mesh.add(vanGrp);
        break;
      }

      // 5. HEAVY TRUCK (Imposing 18-Wheeler Semi Trailer)
      case 'heavy_truck': {
        const truckGrp = new THREE.Group();
        const cabMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.7 });
        const trailerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45, metalness: 0.3 });

        // Giant semi cab
        const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.2), cabMat);
        cab.position.set(0, 1.8, 3.2);
        cab.castShadow = true;

        // Chrome front grille
        const grille = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.12), chromeMat);
        grille.position.set(0, 1.2, 4.32);

        // Smokestacks
        const stackL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), chromeMat);
        stackL.position.set(-1.35, 2.8, 2.2);
        const stackR = stackL.clone();
        stackR.position.x = 1.35;

        // Huge 30-foot cargo trailer container
        const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.8, 6.2), trailerMat);
        trailer.position.set(0, 2.0, -1.2);
        trailer.castShadow = true;

        // === REAR TRAILER DETAILS (Approached directly by player from behind) ===
        const rearZ = -4.31;

        // Rear cargo doors lock bars
        const lockBarGeom = new THREE.CylinderGeometry(0.025, 0.025, 2.4, 8);
        const lockL = new THREE.Mesh(lockBarGeom, chromeMat);
        lockL.position.set(-0.45, 2.0, rearZ);
        const lockR = lockL.clone();
        lockR.position.x = 0.45;

        // Rear underrun steel bumper
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.22, 0.14), metalMat);
        bumper.position.set(0, 0.58, rearZ);

        // Red & white reflective hazard tape across bumper
        const hazardTapeGeom = new THREE.PlaneGeometry(2.64, 0.14);
        const hazardTapeMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const hazardTape = new THREE.Mesh(hazardTapeGeom, hazardTapeMat);
        hazardTape.position.set(0, 0.58, rearZ - 0.08);

        // Glowing red taillights
        const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.08), taillightMat);
        tailL.position.set(-1.05, 0.88, rearZ);
        const tailR = tailL.clone();
        tailR.position.x = 1.05;

        // Black rubber mudflaps
        const flapGeom = new THREE.BoxGeometry(0.58, 0.45, 0.04);
        const flapL = new THREE.Mesh(flapGeom, rubberMat);
        flapL.position.set(-0.95, 0.28, rearZ);
        const flapR = flapL.clone();
        flapR.position.x = 0.95;

        // Top marker lights
        for (let m = -1.0; m <= 1.0; m += 0.5) {
          const marker = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), beaconMat);
          marker.position.set(m, 3.32, rearZ);
          truckGrp.add(marker);
        }

        // Multiple tandem truck wheels
        const wGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.3, 12);
        wGeom.rotateZ(Math.PI / 2);
        for (const zOff of [3.2, 1.8, -2.4, -3.5]) {
          const wL = new THREE.Mesh(wGeom, rubberMat);
          wL.position.set(-1.38, 0.48, zOff);
          const wR = wL.clone();
          wR.position.x = 1.38;
          truckGrp.add(wL, wR);
        }

        // Amber cab roof marker lights
        for (let xOff = -0.9; xOff <= 0.9; xOff += 0.45) {
          const marker = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), beaconMat);
          marker.position.set(xOff, 3.12, 3.2);
          this.flashingLights.push(marker);
          truckGrp.add(marker);
        }

        truckGrp.add(cab, grille, stackL, stackR, trailer, lockL, lockR, bumper, hazardTape, tailL, tailR, flapL, flapR);
        this.mesh.add(truckGrp);
        break;
      }

      // 6. TRAFFIC CONES SLALOM
      case 'traffic_cones': {
        const glb = ObstacleModelCache.getInstance().getModel('cone');
        if (glb) {
          const coneGrp = new THREE.Group();
          for (let i = 0; i < 3; i++) {
            const c = glb.clone(true);
            c.position.set((i - 1) * 0.9, 0, (i - 1) * 0.8);
            coneGrp.add(c);
          }
          this.mesh.add(coneGrp);
          break;
        }

        const coneGrp = new THREE.Group();
        const coneGeom = new THREE.ConeGeometry(0.24, 0.75, 10);
        const stripeGeom = new THREE.CylinderGeometry(0.12, 0.16, 0.18, 10);
        const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const baseGeom = new THREE.BoxGeometry(0.55, 0.08, 0.55);

        // 3 Cones in a staggered slalom line
        for (let i = 0; i < 3; i++) {
          const coneObj = new THREE.Group();
          const baseMesh = new THREE.Mesh(baseGeom, rubberMat);
          baseMesh.position.y = 0.04;
          const coneMesh = new THREE.Mesh(coneGeom, hazardOrangeMat);
          coneMesh.position.y = 0.42;
          coneMesh.castShadow = true;
          const stripeMesh = new THREE.Mesh(stripeGeom, whiteMat);
          stripeMesh.position.y = 0.42;

          coneObj.add(baseMesh, coneMesh, stripeMesh);
          coneObj.position.set((i - 1) * 0.9, 0, (i - 1) * 0.8);
          coneGrp.add(coneObj);
        }
        this.mesh.add(coneGrp);
        break;
      }

      // 7. OIL SLICK HAZARD
      case 'oil_slick': {
        const puddleGeom = new THREE.CylinderGeometry(2.0, 2.0, 0.03, 16);
        const puddleMat = new THREE.MeshStandardMaterial({
          color: 0x07070b,
          roughness: 0.04,
          metalness: 0.92,
        });
        const puddle = new THREE.Mesh(puddleGeom, puddleMat);
        puddle.position.y = 0.015;

        // Iridescent sheen ring
        const sheenGeom = new THREE.RingGeometry(0.5, 1.8, 16);
        sheenGeom.rotateX(-Math.PI / 2);
        const sheenMat = new THREE.MeshBasicMaterial({
          color: 0x8b5cf6,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        });
        const sheen = new THREE.Mesh(sheenGeom, sheenMat);
        sheen.position.y = 0.025;
        this.animatedMesh = sheen;

        this.mesh.add(puddle, sheen);
        break;
      }

      // 8. POTHOLE CRATER / DEBRIS
      case 'pothole': {
        const glb = ObstacleModelCache.getInstance().getModel('debris');
        if (glb) {
          glb.name = 'glb_road_debris';
          this.mesh.add(glb);
          break;
        }

        const potGrp = new THREE.Group();
        // Cracked dark road crater
        const craterGeom = new THREE.CylinderGeometry(1.5, 1.3, 0.12, 12);
        const craterMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.95, metalness: 0.05 });
        const crater = new THREE.Mesh(craterGeom, craterMat);
        crater.position.y = 0.01;

        // Yellow warning spray paint circle around pothole
        const rimGeom = new THREE.RingGeometry(1.4, 1.65, 12);
        rimGeom.rotateX(-Math.PI / 2);
        const rimMat = new THREE.MeshBasicMaterial({ color: 0xeab308, side: THREE.DoubleSide });
        const rim = new THREE.Mesh(rimGeom, rimMat);
        rim.position.y = 0.02;

        potGrp.add(crater, rim);
        this.mesh.add(potGrp);
        break;
      }

      // 9. ROTATING MECHANICAL SPINNER
      case 'spinner': {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 2.2, 8), metalMat);
        pylon.position.y = 1.1;

        const armGrp = new THREE.Group();
        armGrp.position.y = 0.85;

        // Dual rotating hazard sweepers with red/white stripes
        const armGeom = new THREE.BoxGeometry(4.2, 0.28, 0.28);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.5 });
        const arm = new THREE.Mesh(armGeom, armMat);
        arm.castShadow = true;
        armGrp.add(arm);

        // Flashing beacon light on center
        const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), beaconMat);
        strobe.position.y = 2.3;
        this.flashingLights.push(strobe);

        this.animatedMesh = armGrp;
        this.mesh.add(pylon, armGrp, strobe);
        break;
      }

      // 10. INDUSTRIAL HYDRAULIC CRUSHER
      case 'crusher': {
        const archWidth = 4.6;
        const archHeight = 4.2;

        const arch = new THREE.Mesh(new THREE.BoxGeometry(archWidth, 0.5, 0.6), metalMat);
        arch.position.y = archHeight;

        const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.5, archHeight, 0.6), metalMat);
        pillarL.position.set(-archWidth / 2, archHeight / 2, 0);
        const pillarR = pillarL.clone();
        pillarR.position.x = archWidth / 2;

        // Slamming heavy piston block
        const pistonGeom = new THREE.BoxGeometry(archWidth * 0.72, 1.2, 0.75);
        const pistonMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.7 });
        const piston = new THREE.Mesh(pistonGeom, pistonMat);
        piston.position.y = 2.4;
        piston.castShadow = true;
        this.animatedMesh = piston;

        // Warning red underglow light
        const warningLight = new THREE.Mesh(
          new THREE.PlaneGeometry(archWidth * 0.7, 0.7),
          new THREE.MeshBasicMaterial({ color: 0xff0033, side: THREE.DoubleSide })
        );
        warningLight.rotateX(-Math.PI / 2);
        warningLight.position.y = 0.05;
        this.secondaryAnimatedMesh = warningLight;

        this.mesh.add(arch, pillarL, pillarR, piston, warningLight);
        break;
      }

      // 11. SWINGING BOOM BARRIER
      case 'swinging_barrier': {
        const basePost = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.6, 8), metalMat);
        basePost.position.set(-2.4, 0.8, 0);

        const boomPivot = new THREE.Group();
        boomPivot.position.set(-2.4, 1.1, 0);

        const boomGeom = new THREE.CylinderGeometry(0.08, 0.08, 4.6, 8);
        boomGeom.rotateZ(Math.PI / 2);
        const boomMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
        const boomMesh = new THREE.Mesh(boomGeom, boomMat);
        boomMesh.position.x = 2.3;
        boomMesh.castShadow = true;
        boomPivot.add(boomMesh);

        // Flashing red LED on boom tip
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), taillightMat);
        led.position.x = 4.5;
        boomPivot.add(led);
        this.flashingLights.push(led);

        this.animatedMesh = boomPivot;
        this.mesh.add(basePost, boomPivot);
        break;
      }

      // 12. SECURITY ROAD GATE (Narrow aperture passage)
      case 'road_gate': {
        const gateMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.8 });
        const postGeom = new THREE.BoxGeometry(0.6, 3.2, 0.6);

        const p1 = new THREE.Mesh(postGeom, gateMat);
        p1.position.set(-2.6, 1.6, 0);
        const p2 = new THREE.Mesh(postGeom, gateMat);
        p2.position.set(2.6, 1.6, 0);

        // Heavy steel gate leaves partially blocking 1 lane, leaving 1 open lane
        const leafGeom = new THREE.BoxGeometry(2.2, 2.4, 0.2);
        const leaf = new THREE.Mesh(leafGeom, hazardOrangeMat);
        leaf.position.set(-1.2, 1.5, 0);
        leaf.castShadow = true;

        this.mesh.add(p1, p2, leaf);
        break;
      }

      // 13. CONSTRUCTION WORK ZONE
      case 'construction_zone': {
        const glbRoadblock = ObstacleModelCache.getInstance().getModel('roadblock');
        const glbBarrel = ObstacleModelCache.getInstance().getModel('barrel');
        if (glbRoadblock || glbBarrel) {
          const czGrp = new THREE.Group();
          czGrp.name = 'glb_construction_zone';
          if (glbRoadblock) {
            czGrp.add(glbRoadblock);
          }
          if (glbBarrel) {
            const b1 = glbBarrel.clone(true);
            b1.position.set(-1.8, 0, 0.4);
            const b2 = glbBarrel.clone(true);
            b2.position.set(1.8, 0, -0.4);
            czGrp.add(b1, b2);
          }
          this.mesh.add(czGrp);
          break;
        }

        const constrGrp = new THREE.Group();
        const barricadeGeom = new THREE.BoxGeometry(3.6, 1.1, 0.35);
        const barricade = new THREE.Mesh(barricadeGeom, hazardOrangeMat);
        barricade.position.y = 0.55;
        barricade.castShadow = true;

        // Flashing amber arrow warning board
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.2), metalMat);
        board.position.set(0, 1.7, 0);
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 3), beaconMat);
        arrow.position.set(0, 1.7, 0.12);
        arrow.rotateZ(Math.PI / 2); // Points right detour
        this.flashingLights.push(arrow);

        constrGrp.add(barricade, board, arrow);
        this.mesh.add(constrGrp);
        break;
      }
    }
  }

  public update(dt: number): void {
    this.animTimer += dt;

    // Pulse flashing hazard lights
    const flash = Math.sin(this.animTimer * 8.0) > 0;
    for (const light of this.flashingLights) {
      light.visible = flash;
    }

    if (this.type === 'spinner' && this.animatedMesh) {
      const rotSpeed = this.def.speed || 3.0;
      this.animatedMesh.rotation.y += rotSpeed * dt;
    } else if (this.type === 'crusher' && this.animatedMesh) {
      const speed = this.def.speed || 2.5;
      const cycle = (Math.sin(this.animTimer * speed) + 1) / 2; // 0 to 1
      this.animatedMesh.position.y = 0.6 + cycle * 2.2;
      if (this.secondaryAnimatedMesh) {
        (this.secondaryAnimatedMesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + (1 - cycle) * 0.8;
      }
    } else if (this.type === 'swinging_barrier' && this.animatedMesh) {
      const speed = this.def.speed || 2.0;
      // Pendulum swing angle between 0 and 65 degrees
      this.animatedMesh.rotation.y = Math.sin(this.animTimer * speed) * 0.65;
    } else if (this.type === 'oil_slick' && this.animatedMesh) {
      this.animatedMesh.rotation.z += dt * 0.5;
    } else if (this.type === 'traffic' || this.type === 'delivery_van' || this.type === 'heavy_truck') {
      // Traffic vehicles drive along their lane with slight forward movement
      const speed = this.def.speed || (this.type === 'heavy_truck' ? 5 : 8);
      this.mesh.position.z += speed * dt * 0.45;

      // Optional lane weave / drift if range is set
      if (this.def.range) {
        this.mesh.position.x = this.initialX + Math.sin(this.animTimer * 1.4) * this.def.range;
      }
    }

    this.updateBounds();
  }

  public updateBounds(): void {
    this.bounds.setFromObject(this.mesh);
  }
}
