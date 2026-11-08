import * as THREE from 'three';
import { MotorcycleInfo } from '../progression/GarageManager';

export interface MotorcycleMeshResult {
  group: THREE.Group;
  frontWheel: THREE.Object3D;
  rearWheel: THREE.Object3D;
  chassis: THREE.Object3D;
  rider: THREE.Object3D;
  emissives: THREE.Material[];
}

export class MotorcycleModels {
  private static sharedMaterials: Map<string, THREE.Material> = new Map();

  private static getMaterial(color: number, roughness: number = 0.4, metalness: number = 0.6): THREE.MeshStandardMaterial {
    const key = `std_${color}_${roughness}_${metalness}`;
    if (!this.sharedMaterials.has(key)) {
      this.sharedMaterials.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness,
        })
      );
    }
    return this.sharedMaterials.get(key) as THREE.MeshStandardMaterial;
  }

  private static getEmissiveMaterial(color: number, intensity: number = 2.0): THREE.MeshStandardMaterial {
    const key = `em_${color}_${intensity}`;
    if (!this.sharedMaterials.has(key)) {
      this.sharedMaterials.set(
        key,
        new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: color,
          emissiveIntensity: intensity,
          roughness: 0.2,
          metalness: 0.8,
        })
      );
    }
    return this.sharedMaterials.get(key) as THREE.MeshStandardMaterial;
  }

  public static createMotorcycle(info: MotorcycleInfo): MotorcycleMeshResult {
    const root = new THREE.Group();
    root.name = `motorcycle_${info.id}`;

    const chassis = new THREE.Group();
    chassis.name = 'chassis';
    root.add(chassis);

    const primaryMat = this.getMaterial(info.primaryColor, 0.35, 0.65);
    const secondaryMat = this.getMaterial(info.secondaryColor, 0.5, 0.4);
    const chromeMat = this.getMaterial(0xcccccc, 0.2, 0.9);
    const darkMetalMat = this.getMaterial(0x1a1a1a, 0.6, 0.5);
    const tireMat = this.getMaterial(0x222222, 0.8, 0.1);
    const headlampMat = this.getEmissiveMaterial(0xffffff, 2.5);
    const taillightMat = this.getEmissiveMaterial(0xff0044, 2.0);
    const accentGlowMat = this.getEmissiveMaterial(info.glowColor, 2.2);

    const emissiveList: THREE.Material[] = [headlampMat, taillightMat, accentGlowMat];

    // --- WHEELS ---
    const wheelRadius = info.modelStyle === 'adventure' ? 0.46 : 0.42;
    const wheelThickness = info.modelStyle === 'cruiser' ? 0.24 : 0.18;
    const tireGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
    tireGeom.rotateZ(Math.PI / 2);

    const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelThickness * 1.05, 12);
    rimGeom.rotateZ(Math.PI / 2);

    // Front Wheel
    const frontWheel = new THREE.Group();
    frontWheel.name = 'frontWheel';
    const fwTire = new THREE.Mesh(tireGeom, tireMat);
    fwTire.castShadow = true;
    const fwRim = new THREE.Mesh(rimGeom, chromeMat);
    frontWheel.add(fwTire, fwRim);

    // Rear Wheel
    const rearWheel = new THREE.Group();
    rearWheel.name = 'rearWheel';
    const rwTire = new THREE.Mesh(tireGeom, tireMat);
    rwTire.castShadow = true;
    const rwRim = new THREE.Mesh(rimGeom, chromeMat);
    rearWheel.add(rwTire, rwRim);

    // Wheel positions
    const wheelbase = info.modelStyle === 'cruiser' ? 1.7 : 1.45;
    frontWheel.position.set(0, wheelRadius, wheelbase * 0.55);
    rearWheel.position.set(0, wheelRadius, -wheelbase * 0.55);
    chassis.add(frontWheel, rearWheel);

    // --- FRAME / ENGINE BLOCK ---
    const frameGeom = new THREE.BoxGeometry(0.32, 0.45, wheelbase * 0.7);
    const frameMesh = new THREE.Mesh(frameGeom, darkMetalMat);
    frameMesh.position.set(0, wheelRadius + 0.25, 0);
    frameMesh.castShadow = true;
    chassis.add(frameMesh);

    // Engine block details
    const engineGeom = new THREE.BoxGeometry(0.4, 0.35, 0.45);
    const engineMesh = new THREE.Mesh(engineGeom, chromeMat);
    engineMesh.position.set(0, wheelRadius + 0.18, 0.05);
    chassis.add(engineMesh);

    // --- FRONT FORK ---
    const forkGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8);
    const leftFork = new THREE.Mesh(forkGeom, chromeMat);
    const rightFork = new THREE.Mesh(forkGeom, chromeMat);
    leftFork.position.set(-0.16, wheelRadius + 0.28, wheelbase * 0.48);
    rightFork.position.set(0.16, wheelRadius + 0.28, wheelbase * 0.48);
    leftFork.rotation.x = -0.25;
    rightFork.rotation.x = -0.25;
    chassis.add(leftFork, rightFork);

    // Handlebars
    const barGeom = new THREE.CylinderGeometry(0.03, 0.03, info.modelStyle === 'cruiser' ? 0.95 : 0.7, 8);
    barGeom.rotateZ(Math.PI / 2);
    const handleBar = new THREE.Mesh(barGeom, chromeMat);
    handleBar.position.set(0, wheelRadius + 0.65, wheelbase * 0.4);
    chassis.add(handleBar);

    // --- BODY PANELS BASED ON MOTORCYCLE STYLE ---
    let tankMesh: THREE.Mesh;
    let tailMesh: THREE.Mesh;
    let headlampMesh: THREE.Mesh;

    switch (info.modelStyle) {
      case 'sport': {
        // Aerodynamic angular fairing
        const fairingGeom = new THREE.BoxGeometry(0.44, 0.45, 0.85);
        tankMesh = new THREE.Mesh(fairingGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.45, 0.2);

        const tailGeom = new THREE.ConeGeometry(0.24, 0.65, 4);
        tailGeom.rotateX(-Math.PI / 2);
        tailMesh = new THREE.Mesh(tailGeom, primaryMat);
        tailMesh.position.set(0, wheelRadius + 0.48, -0.45);

        const lampGeom = new THREE.BoxGeometry(0.25, 0.12, 0.1);
        headlampMesh = new THREE.Mesh(lampGeom, headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.46, wheelbase * 0.62);
        break;
      }

      case 'cafe': {
        // Teardrop curved tank and rounded cafe cowl
        const tankGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.7, 12);
        tankGeom.rotateX(Math.PI / 2);
        tankMesh = new THREE.Mesh(tankGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.42, 0.15);

        const tailGeom = new THREE.SphereGeometry(0.22, 10, 10);
        tailMesh = new THREE.Mesh(tailGeom, secondaryMat);
        tailMesh.position.set(0, wheelRadius + 0.45, -0.4);

        const lampGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16);
        lampGeom.rotateX(Math.PI / 2);
        headlampMesh = new THREE.Mesh(lampGeom, headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.48, wheelbase * 0.58);
        break;
      }

      case 'adventure': {
        // High clearance, tall windshield, side paniers
        const tankGeom = new THREE.BoxGeometry(0.46, 0.55, 0.75);
        tankMesh = new THREE.Mesh(tankGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.52, 0.15);

        const tailGeom = new THREE.BoxGeometry(0.55, 0.3, 0.5);
        tailMesh = new THREE.Mesh(tailGeom, secondaryMat);
        tailMesh.position.set(0, wheelRadius + 0.5, -0.5);

        const lampGeom = new THREE.BoxGeometry(0.3, 0.2, 0.1);
        headlampMesh = new THREE.Mesh(lampGeom, headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.65, wheelbase * 0.55);
        break;
      }

      case 'thunder': {
        // Angular lightning battery core & sharp cowl
        const tankGeom = new THREE.BoxGeometry(0.42, 0.48, 0.8);
        tankMesh = new THREE.Mesh(tankGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.46, 0.18);

        // Core glow strip
        const coreGlow = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.15, 0.6), accentGlowMat);
        coreGlow.position.set(0, wheelRadius + 0.3, 0.1);
        chassis.add(coreGlow);

        const tailGeom = new THREE.ConeGeometry(0.2, 0.7, 4);
        tailGeom.rotateX(-Math.PI / 2);
        tailMesh = new THREE.Mesh(tailGeom, secondaryMat);
        tailMesh.position.set(0, wheelRadius + 0.5, -0.45);

        const lampGeom = new THREE.BoxGeometry(0.28, 0.08, 0.1);
        headlampMesh = new THREE.Mesh(lampGeom, headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.48, wheelbase * 0.6);
        break;
      }

      case 'cyber': {
        // Cyberpunk blade silhouette with glowing side wings
        const tankGeom = new THREE.BoxGeometry(0.48, 0.4, 0.9);
        tankMesh = new THREE.Mesh(tankGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.44, 0.2);

        // Cyber wings
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.7), accentGlowMat);
        wingL.position.set(-0.28, wheelRadius + 0.45, 0.15);
        const wingR = wingL.clone();
        wingR.position.x = 0.28;
        chassis.add(wingL, wingR);

        const tailGeom = new THREE.BoxGeometry(0.3, 0.15, 0.6);
        tailMesh = new THREE.Mesh(tailGeom, secondaryMat);
        tailMesh.position.set(0, wheelRadius + 0.48, -0.5);

        const lampGeom = new THREE.BoxGeometry(0.35, 0.06, 0.1);
        headlampMesh = new THREE.Mesh(lampGeom, accentGlowMat);
        headlampMesh.position.set(0, wheelRadius + 0.46, wheelbase * 0.62);
        break;
      }

      case 'streamliner': {
        // Sleek bullet shell covering most of the frame
        const streamGeom = new THREE.CylinderGeometry(0.26, 0.28, 1.3, 12);
        streamGeom.rotateX(Math.PI / 2);
        tankMesh = new THREE.Mesh(streamGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.42, 0.05);

        const tailGeom = new THREE.ConeGeometry(0.24, 0.8, 8);
        tailGeom.rotateX(-Math.PI / 2);
        tailMesh = new THREE.Mesh(tailGeom, primaryMat);
        tailMesh.position.set(0, wheelRadius + 0.42, -0.6);

        const lampGeom = new THREE.SphereGeometry(0.12, 10, 10);
        headlampMesh = new THREE.Mesh(lampGeom, headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.42, wheelbase * 0.65);
        break;
      }

      case 'cruiser': {
        // Chopper teardrop tank, high raked bars, big engine
        const tankGeom = new THREE.CylinderGeometry(0.18, 0.26, 0.65, 10);
        tankGeom.rotateX(Math.PI / 2);
        tankMesh = new THREE.Mesh(tankGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.5, 0.1);

        const tailGeom = new THREE.BoxGeometry(0.35, 0.25, 0.5);
        tailMesh = new THREE.Mesh(tailGeom, secondaryMat);
        tailMesh.position.set(0, wheelRadius + 0.4, -0.5);

        const lampGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16);
        lampGeom.rotateX(Math.PI / 2);
        headlampMesh = new THREE.Mesh(lampGeom, headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.6, wheelbase * 0.62);
        break;
      }

      case 'hyper':
      default: {
        // Hyper-naked aggressive predator cowl with quad exhausts
        const tankGeom = new THREE.BoxGeometry(0.5, 0.46, 0.85);
        tankMesh = new THREE.Mesh(tankGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.46, 0.18);

        const tailGeom = new THREE.ConeGeometry(0.26, 0.7, 4);
        tailGeom.rotateX(-Math.PI / 2);
        tailMesh = new THREE.Mesh(tailGeom, secondaryMat);
        tailMesh.position.set(0, wheelRadius + 0.52, -0.48);

        const lampGeom = new THREE.BoxGeometry(0.3, 0.14, 0.12);
        headlampMesh = new THREE.Mesh(lampGeom, accentGlowMat);
        headlampMesh.position.set(0, wheelRadius + 0.48, wheelbase * 0.62);
        break;
      }
    }

    tankMesh.castShadow = true;
    tailMesh.castShadow = true;
    chassis.add(tankMesh, tailMesh, headlampMesh);

    // Taillight
    const tailLamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.08), taillightMat);
    tailLamp.position.set(0, wheelRadius + 0.48, -wheelbase * 0.55);
    chassis.add(tailLamp);

    // Exhaust pipe
    const exhaustGeom = new THREE.CylinderGeometry(0.06, 0.07, 0.75, 8);
    exhaustGeom.rotateX(Math.PI / 2);
    const exhaustMesh = new THREE.Mesh(exhaustGeom, chromeMat);
    exhaustMesh.position.set(0.22, wheelRadius + 0.16, -wheelbase * 0.25);
    chassis.add(exhaustMesh);

    // --- RIDER SILHOUETTE (Low-poly) ---
    const rider = new THREE.Group();
    rider.name = 'rider';

    // Rider torso
    const torsoMat = this.getMaterial(0x1a1a24, 0.7, 0.2);
    const torsoGeom = new THREE.BoxGeometry(0.36, 0.48, 0.28);
    const torsoMesh = new THREE.Mesh(torsoGeom, torsoMat);
    torsoMesh.position.set(0, wheelRadius + 0.72, -0.05);
    torsoMesh.rotation.x = 0.35; // Leaning forward towards handlebars
    torsoMesh.castShadow = true;
    rider.add(torsoMesh);

    // Helmet
    const helmetMat = this.getMaterial(info.primaryColor, 0.3, 0.7);
    const helmetGeom = new THREE.SphereGeometry(0.18, 12, 10);
    const helmetMesh = new THREE.Mesh(helmetGeom, helmetMat);
    helmetMesh.position.set(0, wheelRadius + 1.02, 0.08);
    helmetMesh.castShadow = true;

    // Helmet visor
    const visorGeom = new THREE.BoxGeometry(0.22, 0.1, 0.14);
    const visorMesh = new THREE.Mesh(visorGeom, this.getMaterial(0x050505, 0.1, 0.9));
    visorMesh.position.set(0, wheelRadius + 1.02, 0.18);
    rider.add(helmetMesh, visorMesh);

    chassis.add(rider);

    return {
      group: root,
      frontWheel,
      rearWheel,
      chassis,
      rider,
      emissives: emissiveList,
    };
  }
}
