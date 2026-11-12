import * as THREE from 'three';
import { AssetLoader } from '../assets/AssetLoader';

export type TrafficVehicleType =
  | 'compact'
  | 'sedan'
  | 'sports_car'
  | 'suv'
  | 'taxi'
  | 'delivery_van'
  | 'bus'
  | 'heavy_truck'
  | 'police'
  | 'motorcycle';

export interface TrafficArchetype {
  type: TrafficVehicleType;
  width: number;
  length: number;
  height: number;
  minSpeed: number;
  maxSpeed: number;
  defaultColors: number[];
}

export const TRAFFIC_ARCHETYPES: Record<TrafficVehicleType, TrafficArchetype> = {
  compact: {
    type: 'compact',
    width: 1.95,
    length: 4.2,
    height: 1.55,
    minSpeed: 15,
    maxSpeed: 21,
    defaultColors: [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6],
  },
  sedan: {
    type: 'sedan',
    width: 1.9,
    length: 4.5,
    height: 1.67,
    minSpeed: 17,
    maxSpeed: 23,
    defaultColors: [0x334155, 0x64748b, 0x1e293b, 0x0284c7, 0xd97706],
  },
  sports_car: {
    type: 'sports_car',
    width: 2.14,
    length: 4.6,
    height: 1.45,
    minSpeed: 22,
    maxSpeed: 30,
    defaultColors: [0xd90429, 0xffd166, 0x06d6a0, 0x118ab2, 0x7209b7],
  },
  suv: {
    type: 'suv',
    width: 2.18,
    length: 4.8,
    height: 1.97,
    minSpeed: 16,
    maxSpeed: 22,
    defaultColors: [0x1f2937, 0x374151, 0x047857, 0x1d4ed8, 0x9a3412],
  },
  taxi: {
    type: 'taxi',
    width: 2.03,
    length: 4.5,
    height: 1.67,
    minSpeed: 18,
    maxSpeed: 24,
    defaultColors: [0xfbbf24],
  },
  delivery_van: {
    type: 'delivery_van',
    width: 2.18,
    length: 6.08,
    height: 2.35,
    minSpeed: 14,
    maxSpeed: 19,
    defaultColors: [0xf8fafc, 0x94a3b8, 0x64748b, 0x0369a1],
  },
  bus: {
    type: 'bus',
    width: 2.69,
    length: 8.29,
    height: 3.0,
    minSpeed: 12,
    maxSpeed: 17,
    defaultColors: [0x2563eb, 0x059669, 0xd97706],
  },
  heavy_truck: {
    type: 'heavy_truck',
    width: 2.76,
    length: 9.05,
    height: 3.05,
    minSpeed: 11,
    maxSpeed: 15,
    defaultColors: [0x991b1b, 0x1e3a8a, 0x374151],
  },
  police: {
    type: 'police',
    width: 2.14,
    length: 4.6,
    height: 1.45,
    minSpeed: 20,
    maxSpeed: 28,
    defaultColors: [0x0f172a],
  },
  motorcycle: {
    type: 'motorcycle',
    width: 0.9,
    length: 2.2,
    height: 1.4,
    minSpeed: 18,
    maxSpeed: 26,
    defaultColors: [0xec4899, 0x8b5cf6, 0x06b6d4, 0xeab308],
  },
};

/**
 * TrafficVehicleFactory caches and instantiates starter pack GLBs
 */
export class TrafficVehicleFactory {
  private static instance: TrafficVehicleFactory;
  private templates: Map<string, THREE.Group> = new Map();
  private isPreloading: boolean = false;
  private isPreloaded: boolean = false;

  private constructor() {
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      this.preloadModels();
    }
  }

  public static getInstance(): TrafficVehicleFactory {
    if (!TrafficVehicleFactory.instance) {
      TrafficVehicleFactory.instance = new TrafficVehicleFactory();
    }
    return TrafficVehicleFactory.instance;
  }

  public async preloadModels(): Promise<void> {
    if (this.isPreloaded || this.isPreloading) return;
    this.isPreloading = true;

    const loader = AssetLoader.getInstance();
    const models: Array<{ key: string; glb: 'sedan' | 'sports_car' | 'suv' | 'van' | 'bus' | 'truck' }> = [
      { key: 'sedan', glb: 'sedan' },
      { key: 'sports_car', glb: 'sports_car' },
      { key: 'suv', glb: 'suv' },
      { key: 'van', glb: 'van' },
      { key: 'bus', glb: 'bus' },
      { key: 'truck', glb: 'truck' },
    ];

    await Promise.all(
      models.map(async ({ key, glb }) => {
        try {
          const group = await loader.loadTrafficModel(glb);
          if (group) {
            group.traverse((c) => {
              if ((c as THREE.Mesh).isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
              }
            });
            this.templates.set(key, group);
          }
        } catch (_) {}
      })
    );

    this.isPreloaded = true;
    this.isPreloading = false;
  }

  public createVehicleMesh(type: TrafficVehicleType, color: number): THREE.Group | null {
    let templateKey: string | null = null;
    switch (type) {
      case 'sedan':
      case 'compact':
      case 'taxi':
        templateKey = 'sedan';
        break;
      case 'sports_car':
      case 'police':
        templateKey = 'sports_car';
        break;
      case 'suv':
        templateKey = 'suv';
        break;
      case 'delivery_van':
        templateKey = 'van';
        break;
      case 'bus':
        templateKey = 'bus';
        break;
      case 'heavy_truck':
        templateKey = 'truck';
        break;
    }

    if (!templateKey || !this.templates.has(templateKey)) {
      return null;
    }

    const template = this.templates.get(templateKey)!;
    const clone = template.clone(true);
    clone.name = `traffic_glb_${type}`;

    // Apply color tinting to body meshes
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        if (name.includes('body') || name.includes('roof') || name.includes('shell')) {
          if (mesh.material) {
            const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const newMat = origMat.clone() as THREE.MeshStandardMaterial;
            if (type === 'taxi') {
              newMat.color = new THREE.Color(0xf59e0b);
            } else if (type === 'police') {
              newMat.color = new THREE.Color(0x0f172a);
            } else {
              newMat.color = new THREE.Color(color);
            }
            mesh.material = newMat;
          }
        }
      }
    });

    return clone;
  }
}

export class TrafficVehicle {
  public id: number;
  public type: TrafficVehicleType;
  public mesh: THREE.Group;
  public bounds: THREE.Box3;
  public width: number;
  public length: number;
  public height: number;
  public speed: number;
  public baseSpeed: number;

  public currentLane: number;
  public targetLane: number;
  public isChangingLane: boolean = false;
  public laneChangeProgress: number = 0;
  public laneChangeDuration: number = 1.4;
  public startLaneX: number = 0;
  public targetLaneX: number = 0;

  public overtaken: boolean = false;
  public nearMissed: boolean = false;

  private wheels: THREE.Mesh[] = [];
  private emergencyLightTime: number = 0;
  private redStrobe?: THREE.MeshStandardMaterial;
  private blueStrobe?: THREE.MeshStandardMaterial;
  private blinkerLight?: THREE.Mesh;

  constructor(id: number, type: TrafficVehicleType, color?: number) {
    this.id = id;
    this.type = type;
    const arch = TRAFFIC_ARCHETYPES[type];
    this.width = arch.width;
    this.length = arch.length;
    this.height = arch.height;
    this.baseSpeed = arch.minSpeed + Math.random() * (arch.maxSpeed - arch.minSpeed);
    this.speed = this.baseSpeed;
    this.currentLane = 0;
    this.targetLane = 0;

    const chosenColor = color !== undefined
      ? color
      : arch.defaultColors[Math.floor(Math.random() * arch.defaultColors.length)];

    const glbMesh = TrafficVehicleFactory.getInstance().createVehicleMesh(type, chosenColor);
    if (glbMesh) {
      this.mesh = glbMesh;
    } else {
      this.mesh = this.buildVehicleMesh(type, chosenColor);
    }
    this.bounds = new THREE.Box3();
    this.updateBounds();
  }

  public updateBounds(): void {
    const halfW = this.width * 0.46;
    const halfL = this.length * 0.48;
    const p = this.mesh.position;
    this.bounds.min.set(p.x - halfW, p.y, p.z - halfL);
    this.bounds.max.set(p.x + halfW, p.y + this.height, p.z + halfL);
  }

  public startLaneChange(newLane: number, targetX: number): void {
    if (this.isChangingLane) return;
    this.isChangingLane = true;
    this.targetLane = newLane;
    this.startLaneX = this.mesh.position.x;
    this.targetLaneX = targetX;
    this.laneChangeProgress = 0;
    this.laneChangeDuration = 1.2 + Math.random() * 0.6;
    if (this.blinkerLight) {
      this.blinkerLight.visible = true;
    }
  }

  public update(dt: number): void {
    const clampedDt = Math.min(dt, 0.1);

    // Forward translation
    this.mesh.position.z += this.speed * clampedDt;

    // Wheel spinning
    const wheelRadius = this.type === 'heavy_truck' || this.type === 'bus' ? 0.48 : 0.32;
    const rotDelta = (this.speed / wheelRadius) * clampedDt;
    for (const w of this.wheels) {
      w.rotation.x -= rotDelta;
    }

    // Lane change smooth S-curve interpolation
    if (this.isChangingLane) {
      this.laneChangeProgress += clampedDt / this.laneChangeDuration;
      if (this.laneChangeProgress >= 1.0) {
        this.laneChangeProgress = 1.0;
        this.isChangingLane = false;
        this.currentLane = this.targetLane;
        this.mesh.position.x = this.targetLaneX;
        this.mesh.rotation.y = 0;
        if (this.blinkerLight) this.blinkerLight.visible = false;
      } else {
        // Smooth step S-curve: 3t^2 - 2t^3
        const t = this.laneChangeProgress;
        const smoothT = t * t * (3 - 2 * t);
        this.mesh.position.x = this.startLaneX + (this.targetLaneX - this.startLaneX) * smoothT;

        // Subtle yaw lean into lane change direction
        const dir = Math.sign(this.targetLaneX - this.startLaneX);
        const yawAngle = Math.sin(t * Math.PI) * 0.08 * -dir;
        this.mesh.rotation.y = yawAngle;

        // Blinker flash
        if (this.blinkerLight) {
          this.blinkerLight.visible = Math.floor(t * 8) % 2 === 0;
        }
      }
    } else {
      this.mesh.rotation.y = 0;
    }

    // Police flashing lightbar
    if (this.type === 'police' && this.redStrobe && this.blueStrobe) {
      this.emergencyLightTime += clampedDt * 8;
      const phase = Math.floor(this.emergencyLightTime) % 2;
      this.redStrobe.emissiveIntensity = phase === 0 ? 4.0 : 0.3;
      this.blueStrobe.emissiveIntensity = phase === 1 ? 4.0 : 0.3;
    }

    this.updateBounds();
  }

  private buildVehicleMesh(type: TrafficVehicleType, color: number): THREE.Group {
    const root = new THREE.Group();
    root.name = `traffic_${type}_${this.id}`;

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.55,
    });
    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x18191e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.15,
      metalness: 0.95,
    });
    const headlampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffaed,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const tailLampMat = new THREE.MeshStandardMaterial({
      color: 0x880000,
      emissive: 0xff0022,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });

    const addWheel = (x: number, y: number, z: number, r: number, w: number) => {
      const tireGeom = new THREE.CylinderGeometry(r, r, w, 14);
      tireGeom.rotateZ(Math.PI / 2);
      const wheelMesh = new THREE.Mesh(tireGeom, darkTrimMat);
      wheelMesh.position.set(x, y, z);
      wheelMesh.castShadow = true;

      // Rim cap
      const rimGeom = new THREE.CylinderGeometry(r * 0.65, r * 0.65, w * 1.05, 8);
      rimGeom.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeom, chromeMat);
      wheelMesh.add(rim);

      root.add(wheelMesh);
      this.wheels.push(wheelMesh);
    };

    switch (type) {
      // 1. COMPACT HATCHBACK
      case 'compact': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.72, 3.4), bodyMat);
        body.position.set(0, 0.55, 0);
        body.castShadow = true;
        root.add(body);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.58, 1.8), glassMat);
        cabin.position.set(0, 1.05, -0.2);
        cabin.castShadow = true;
        root.add(cabin);

        // Lights
        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.05), headlampMat);
        hl1.position.set(0.6, 0.56, 1.7);
        const hl2 = hl1.clone();
        hl2.position.x = -0.6;
        const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.05), tailLampMat);
        tl1.position.set(0.6, 0.62, -1.7);
        const tl2 = tl1.clone();
        tl2.position.x = -0.6;
        root.add(hl1, hl2, tl1, tl2);

        // Wheels
        addWheel(0.85, 0.32, 1.1, 0.32, 0.22);
        addWheel(-0.85, 0.32, 1.1, 0.32, 0.22);
        addWheel(0.85, 0.32, -1.1, 0.32, 0.22);
        addWheel(-0.85, 0.32, -1.1, 0.32, 0.22);
        break;
      }

      // 2. SEDAN
      case 'sedan': {
        const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 4.3), bodyMat);
        lowerBody.position.set(0, 0.55, 0);
        lowerBody.castShadow = true;
        root.add(lowerBody);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.58, 2.3), glassMat);
        cabin.position.set(0, 1.06, -0.15);
        cabin.castShadow = true;
        root.add(cabin);

        // Headlights & Tail light strip
        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.05), headlampMat);
        hl1.position.set(0.68, 0.58, 2.15);
        const hl2 = hl1.clone();
        hl2.position.x = -0.68;
        const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.05), tailLampMat);
        tailBar.position.set(0, 0.65, -2.15);
        root.add(hl1, hl2, tailBar);

        addWheel(0.92, 0.33, 1.35, 0.33, 0.24);
        addWheel(-0.92, 0.33, 1.35, 0.33, 0.24);
        addWheel(0.92, 0.33, -1.35, 0.33, 0.24);
        addWheel(-0.92, 0.33, -1.35, 0.33, 0.24);
        break;
      }

      // 3. SPORTS CAR
      case 'sports_car': {
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.52, 4.4), bodyMat);
        chassis.position.set(0, 0.44, 0);
        chassis.castShadow = true;
        root.add(chassis);

        const aeroCabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.48, 1.9), glassMat);
        aeroCabin.position.set(0, 0.86, -0.3);
        aeroCabin.castShadow = true;
        root.add(aeroCabin);

        // Rear Wing
        const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.3), darkTrimMat);
        spoilerWing.position.set(0, 0.95, -2.05);
        const strut1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), darkTrimMat);
        strut1.position.set(0.5, 0.8, -2.05);
        const strut2 = strut1.clone();
        strut2.position.x = -0.5;
        root.add(spoilerWing, strut1, strut2);

        // Slim aerodynamic headlights
        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.05), headlampMat);
        hl1.position.set(0.72, 0.46, 2.2);
        const hl2 = hl1.clone();
        hl2.position.x = -0.72;
        const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.05), tailLampMat);
        tl1.position.set(0.72, 0.52, -2.2);
        const tl2 = tl1.clone();
        tl2.position.x = -0.72;
        root.add(hl1, hl2, tl1, tl2);

        addWheel(0.96, 0.32, 1.4, 0.32, 0.26);
        addWheel(-0.96, 0.32, 1.4, 0.32, 0.26);
        addWheel(0.98, 0.34, -1.35, 0.34, 0.28);
        addWheel(-0.98, 0.34, -1.35, 0.34, 0.28);
        break;
      }

      // 4. SUV
      case 'suv': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 4.6), bodyMat);
        body.position.set(0, 0.75, 0);
        body.castShadow = true;
        root.add(body);

        const upperCabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.72, 2.8), glassMat);
        upperCabin.position.set(0, 1.45, -0.3);
        upperCabin.castShadow = true;
        root.add(upperCabin);

        // Roof rails
        const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.5), chromeMat);
        rail1.position.set(0.75, 1.84, -0.3);
        const rail2 = rail1.clone();
        rail2.position.x = -0.75;
        root.add(rail1, rail2);

        // Spare wheel on tailgate
        const spareTire = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12), darkTrimMat);
        spareTire.position.set(0, 1.0, -2.4);
        root.add(spareTire);

        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.05), headlampMat);
        hl1.position.set(0.75, 0.82, 2.31);
        const hl2 = hl1.clone();
        hl2.position.x = -0.75;
        root.add(hl1, hl2);

        addWheel(1.02, 0.42, 1.4, 0.42, 0.28);
        addWheel(-1.02, 0.42, 1.4, 0.42, 0.28);
        addWheel(1.02, 0.42, -1.4, 0.42, 0.28);
        addWheel(-1.02, 0.42, -1.4, 0.42, 0.28);
        break;
      }

      // 5. TAXI
      case 'taxi': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 4.3), bodyMat);
        body.position.set(0, 0.55, 0);
        body.castShadow = true;
        root.add(body);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.58, 2.3), glassMat);
        cabin.position.set(0, 1.06, -0.15);
        cabin.castShadow = true;
        root.add(cabin);

        // Glowing "TAXI" Roof Sign
        const taxiSignMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xf59e0b,
          emissiveIntensity: 2.5,
          roughness: 0.2,
        });
        const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 0.24), taxiSignMat);
        taxiSign.position.set(0, 1.44, -0.15);
        root.add(taxiSign);

        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.05), headlampMat);
        hl1.position.set(0.68, 0.58, 2.15);
        const hl2 = hl1.clone();
        hl2.position.x = -0.68;
        root.add(hl1, hl2);

        addWheel(0.92, 0.33, 1.35, 0.33, 0.24);
        addWheel(-0.92, 0.33, 1.35, 0.33, 0.24);
        addWheel(0.92, 0.33, -1.35, 0.33, 0.24);
        addWheel(-0.92, 0.33, -1.35, 0.33, 0.24);
        break;
      }

      // 6. DELIVERY VAN
      case 'delivery_van': {
        const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.55, 5.2), bodyMat);
        cargoBox.position.set(0, 1.15, -0.3);
        cargoBox.castShadow = true;
        root.add(cargoBox);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.25, 1.4), glassMat);
        cabin.position.set(0, 1.05, 1.9);
        cabin.castShadow = true;
        root.add(cabin);

        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.05), headlampMat);
        hl1.position.set(0.82, 0.85, 2.62);
        const hl2 = hl1.clone();
        hl2.position.x = -0.82;
        root.add(hl1, hl2);

        addWheel(1.05, 0.4, 1.7, 0.4, 0.26);
        addWheel(-1.05, 0.4, 1.7, 0.4, 0.26);
        addWheel(1.05, 0.4, -1.5, 0.4, 0.26);
        addWheel(-1.05, 0.4, -1.5, 0.4, 0.26);
        break;
      }

      // 7. PASSENGER BUS
      case 'bus': {
        const busBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 9.6), bodyMat);
        busBody.position.set(0, 1.6, 0);
        busBody.castShadow = true;
        root.add(busBody);

        const windows = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.8, 8.8), glassMat);
        windows.position.set(0, 1.85, 0.2);
        root.add(windows);

        // Roof Air Conditioners
        const ac1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 1.8), darkTrimMat);
        ac1.position.set(0, 2.82, 1.5);
        const ac2 = ac1.clone();
        ac2.position.z = -1.5;
        root.add(ac1, ac2);

        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.05), headlampMat);
        hl1.position.set(0.95, 0.9, 4.82);
        const hl2 = hl1.clone();
        hl2.position.x = -0.95;
        root.add(hl1, hl2);

        // 6 large wheels
        addWheel(1.22, 0.48, 3.2, 0.48, 0.32);
        addWheel(-1.22, 0.48, 3.2, 0.48, 0.32);
        addWheel(1.22, 0.48, -2.6, 0.48, 0.32);
        addWheel(-1.22, 0.48, -2.6, 0.48, 0.32);
        addWheel(1.22, 0.48, -3.8, 0.48, 0.32);
        addWheel(-1.22, 0.48, -3.8, 0.48, 0.32);
        break;
      }

      // 8. HEAVY TRUCK (Tractor Unit + Semi Trailer)
      case 'heavy_truck': {
        // Cab
        const cab = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.4, 3.2), bodyMat);
        cab.position.set(0, 1.6, 4.2);
        cab.castShadow = true;
        root.add(cab);

        const cabWindshield = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.8), glassMat);
        cabWindshield.position.set(0, 2.05, 5.1);
        root.add(cabWindshield);

        // Semi-Trailer Box
        const trailerMat = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0.4,
          metalness: 0.3,
        });
        const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.65, 2.7, 8.6), trailerMat);
        trailer.position.set(0, 2.1, -1.8);
        trailer.castShadow = true;
        root.add(trailer);

        // Chrome smokestacks
        const exhaust1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), chromeMat);
        exhaust1.position.set(1.2, 2.5, 2.8);
        const exhaust2 = exhaust1.clone();
        exhaust2.position.x = -1.2;
        root.add(exhaust1, exhaust2);

        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.05), headlampMat);
        hl1.position.set(1.0, 0.9, 5.82);
        const hl2 = hl1.clone();
        hl2.position.x = -1.0;
        root.add(hl1, hl2);

        // Front cab steer axle
        addWheel(1.25, 0.52, 4.6, 0.52, 0.32);
        addWheel(-1.25, 0.52, 4.6, 0.52, 0.32);
        // Tandem drive axles
        addWheel(1.25, 0.52, 2.6, 0.52, 0.34);
        addWheel(-1.25, 0.52, 2.6, 0.52, 0.34);
        // Trailer dual rear axles
        addWheel(1.28, 0.52, -4.5, 0.52, 0.35);
        addWheel(-1.28, 0.52, -4.5, 0.52, 0.35);
        addWheel(1.28, 0.52, -5.7, 0.52, 0.35);
        addWheel(-1.28, 0.52, -5.7, 0.52, 0.35);
        break;
      }

      // 9. POLICE CAR
      case 'police': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.68, 4.5), bodyMat);
        body.position.set(0, 0.56, 0);
        body.castShadow = true;
        root.add(body);

        // White door wrap panels
        const doorPanelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const door1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 1.8), doorPanelMat);
        door1.position.set(0.96, 0.56, 0);
        const door2 = door1.clone();
        door2.position.x = -0.96;
        root.add(door1, door2);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.58, 2.4), glassMat);
        cabin.position.set(0, 1.08, -0.15);
        cabin.castShadow = true;
        root.add(cabin);

        // Flashing Emergency Lightbar (Red + Blue)
        this.redStrobe = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 3.5,
        });
        this.blueStrobe = new THREE.MeshStandardMaterial({
          color: 0x0066ff,
          emissive: 0x0066ff,
          emissiveIntensity: 3.5,
        });
        const lightbarFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.16), darkTrimMat);
        lightbarFrame.position.set(0, 1.44, -0.15);
        const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.18), this.redStrobe);
        redLight.position.set(0.3, 1.45, -0.15);
        const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.18), this.blueStrobe);
        blueLight.position.set(-0.3, 1.45, -0.15);
        root.add(lightbarFrame, redLight, blueLight);

        // Push bumper on front
        const bullBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 0.15), darkTrimMat);
        bullBar.position.set(0, 0.5, 2.3);
        root.add(bullBar);

        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.05), headlampMat);
        hl1.position.set(0.7, 0.6, 2.26);
        const hl2 = hl1.clone();
        hl2.position.x = -0.7;
        root.add(hl1, hl2);

        addWheel(0.94, 0.33, 1.4, 0.33, 0.25);
        addWheel(-0.94, 0.33, 1.4, 0.33, 0.25);
        addWheel(0.94, 0.33, -1.4, 0.33, 0.25);
        addWheel(-0.94, 0.33, -1.4, 0.33, 0.25);
        break;
      }

      // 10. COMMUTER MOTORCYCLE
      case 'motorcycle': {
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.6), bodyMat);
        chassis.position.set(0, 0.55, 0);
        chassis.castShadow = true;
        root.add(chassis);

        // Rider silhouette
        const trafficRider = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.5, 4, 8), darkTrimMat);
        trafficRider.position.set(0, 0.95, -0.1);
        trafficRider.rotation.x = 0.3;
        root.add(trafficRider);

        const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), headlampMat);
        hl.position.set(0, 0.65, 0.9);
        hl.rotateX(Math.PI / 2);
        root.add(hl);

        addWheel(0, 0.35, 0.75, 0.35, 0.14);
        addWheel(0, 0.35, -0.75, 0.35, 0.16);
        break;
      }
    }

    // Lane change blinker amber light (mounted near rear)
    const blinkerMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xffa500,
      emissiveIntensity: 3.0,
    });
    this.blinkerLight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), blinkerMat);
    this.blinkerLight.position.set(0, 0.7, -this.length * 0.48);
    this.blinkerLight.visible = false;
    root.add(this.blinkerLight);

    return root;
  }
}
