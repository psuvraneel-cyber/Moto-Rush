import * as THREE from 'three';
import { MotorcycleInfo } from '../progression/GarageManager';
import { RiderMeshBuilder } from './RiderMeshBuilder';

export interface MotorcycleMeshResult {
  group: THREE.Group;
  frontWheel: THREE.Object3D;
  rearWheel: THREE.Object3D;
  chassis: THREE.Object3D;
  rider: THREE.Object3D;
  riderRoot: THREE.Object3D;
  steering?: THREE.Object3D;
  emissives: THREE.Material[];
}

export class MotorcycleModels {
  private static sharedMaterials: Map<string, THREE.Material> = new Map();

  private static getMaterial(
    color: number,
    roughness: number = 0.4,
    metalness: number = 0.6
  ): THREE.MeshStandardMaterial {
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

  private static getEmissiveMaterial(
    color: number,
    intensity: number = 2.0
  ): THREE.MeshStandardMaterial {
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

  /**
   * Helper to build a detailed motorcycle wheel with tyre tread, alloy rim,
   * central hub, brake disc, and brake caliper.
   */
  private static createDetailedWheel(
    radius: number,
    thickness: number,
    rimColor: number,
    isWireSpoke: boolean = false
  ): THREE.Group {
    const wheelGroup = new THREE.Group();

    const tireMat = this.getMaterial(0x1a1a1c, 0.88, 0.08); // Matte vulcanized rubber
    const rimMat = this.getMaterial(rimColor, 0.25, 0.85); // High metallic rim
    const hubMat = this.getMaterial(0x333333, 0.35, 0.7);
    const discMat = this.getMaterial(0xdcdde1, 0.2, 0.9); // Drilled steel brake rotor
    const caliperMat = this.getMaterial(0xd63031, 0.4, 0.4); // Red racing caliper

    // 1. Rubber Tyre with rounded torus-like profile
    const tireOuterGeom = new THREE.CylinderGeometry(radius, radius, thickness * 0.85, 20);
    tireOuterGeom.rotateZ(Math.PI / 2);
    const tireOuter = new THREE.Mesh(tireOuterGeom, tireMat);
    tireOuter.castShadow = true;
    wheelGroup.add(tireOuter);

    // Tread shoulder bevels
    const bevelGeom = new THREE.CylinderGeometry(radius * 0.94, radius, thickness * 0.15, 20);
    bevelGeom.rotateZ(Math.PI / 2);
    const leftBevel = new THREE.Mesh(bevelGeom, tireMat);
    leftBevel.position.x = -thickness * 0.42;
    const rightBevel = leftBevel.clone();
    rightBevel.position.x = thickness * 0.42;
    wheelGroup.add(leftBevel, rightBevel);

    // 2. Wheel Rim Outer Lip
    const rimLipGeom = new THREE.CylinderGeometry(radius * 0.76, radius * 0.76, thickness * 0.9, 16);
    rimLipGeom.rotateZ(Math.PI / 2);
    const rimLip = new THREE.Mesh(rimLipGeom, rimMat);
    wheelGroup.add(rimLip);

    // 3. Central Hub & Axle
    const hubGeom = new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, thickness * 1.05, 12);
    hubGeom.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeom, hubMat);
    wheelGroup.add(hub);

    // 4. Spokes: Wire spokes or Star alloy spokes
    const spokeCount = isWireSpoke ? 12 : 5;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spokeLen = radius * 0.52;
      const spokeGeom = isWireSpoke
        ? new THREE.CylinderGeometry(0.012, 0.012, spokeLen, 6)
        : new THREE.BoxGeometry(thickness * 0.35, spokeLen, 0.04);

      const spoke = new THREE.Mesh(spokeGeom, rimMat);
      spoke.position.set(0, Math.cos(angle) * spokeLen * 0.5, Math.sin(angle) * spokeLen * 0.5);
      spoke.rotation.x = -angle;
      wheelGroup.add(spoke);
    }

    // 5. Brake Disc (Rotor)
    const discRadius = radius * 0.62;
    const discGeom = new THREE.CylinderGeometry(discRadius, discRadius, 0.02, 16);
    discGeom.rotateZ(Math.PI / 2);
    const disc = new THREE.Mesh(discGeom, discMat);
    disc.position.x = thickness * 0.48;
    wheelGroup.add(disc);

    // 6. Brake Caliper
    const caliperGeom = new THREE.BoxGeometry(0.06, radius * 0.24, radius * 0.18);
    const caliper = new THREE.Mesh(caliperGeom, caliperMat);
    caliper.position.set(thickness * 0.5, radius * 0.42, 0.02);
    wheelGroup.add(caliper);

    return wheelGroup;
  }

  /**
   * Builds an anatomically cohesive 3D humanoid rider in full racing gear:
   * Delegated to RiderMeshBuilder.buildRider for unified continuous mesh anatomy.
   */
  public static createStylizedRider(
    primaryColor: number,
    secondaryColor: number,
    wheelRadius: number,
    wheelbase: number,
    isCruiser: boolean = false
  ): THREE.Group {
    return RiderMeshBuilder.buildRider(primaryColor, secondaryColor, isCruiser);
  }

  public static createMotorcycle(info: MotorcycleInfo): MotorcycleMeshResult {
    const root = new THREE.Group();
    root.name = `motorcycle_${info.id}`;

    const chassis = new THREE.Group();
    chassis.name = 'chassis';
    root.add(chassis);

    // Common High-Quality Materials
    const primaryMat = this.getMaterial(info.primaryColor, 0.32, 0.72);
    const secondaryMat = this.getMaterial(info.secondaryColor, 0.45, 0.55);
    const chromeMat = this.getMaterial(0xeeeeee, 0.18, 0.95);
    const darkMetalMat = this.getMaterial(0x242426, 0.55, 0.6);
    const goldMat = this.getMaterial(0xf1c40f, 0.25, 0.85); // Inverted fork gold stanchions
    const carbonMat = this.getMaterial(0x161618, 0.7, 0.3); // Carbon fiber texture look
    const seatLeatherMat = this.getMaterial(0x121214, 0.85, 0.1);

    const headlampMat = this.getEmissiveMaterial(0xffffff, 3.0);
    const taillightMat = this.getEmissiveMaterial(0xff0033, 2.8);
    const accentGlowMat = this.getEmissiveMaterial(info.glowColor, 2.5);

    const emissiveList: THREE.Material[] = [headlampMat, taillightMat, accentGlowMat];

    // Model specific dimensional personality
    let wheelbase = 1.5;
    let wheelRadius = 0.42;
    let wheelThickness = 0.18;
    let forkRakeAngle = 0.26;
    let isWireSpoke = false;
    let isCruiser = false;

    switch (info.modelStyle) {
      case 'sport':
        wheelbase = 1.48;
        wheelRadius = 0.42;
        wheelThickness = 0.19;
        forkRakeAngle = 0.24;
        break;
      case 'cafe':
        wheelbase = 1.42;
        wheelRadius = 0.41;
        wheelThickness = 0.17;
        forkRakeAngle = 0.25;
        isWireSpoke = true;
        break;
      case 'adventure':
        wheelbase = 1.62;
        wheelRadius = 0.47;
        wheelThickness = 0.21;
        forkRakeAngle = 0.32;
        isWireSpoke = true;
        break;
      case 'thunder':
        wheelbase = 1.52;
        wheelRadius = 0.43;
        wheelThickness = 0.2;
        forkRakeAngle = 0.25;
        break;
      case 'cyber':
        wheelbase = 1.68;
        wheelRadius = 0.44;
        wheelThickness = 0.24;
        forkRakeAngle = 0.28;
        break;
      case 'streamliner':
        wheelbase = 1.76;
        wheelRadius = 0.42;
        wheelThickness = 0.18;
        forkRakeAngle = 0.22;
        break;
      case 'cruiser':
        wheelbase = 1.82;
        wheelRadius = 0.44;
        wheelThickness = 0.25;
        forkRakeAngle = 0.44; // High raked chopper forks
        isCruiser = true;
        break;
      case 'hyper':
      default:
        wheelbase = 1.5;
        wheelRadius = 0.43;
        wheelThickness = 0.26; // Fat rear tyre
        forkRakeAngle = 0.25;
        break;
    }

    // --- 1. WHEELS (Detailed with Tyres, Spokes, Rotors, Calipers) ---
    const frontWheel = this.createDetailedWheel(
      wheelRadius,
      wheelThickness,
      info.modelStyle === 'thunder' ? info.glowColor : 0xcccccc,
      isWireSpoke
    );
    frontWheel.name = 'frontWheel';
    frontWheel.position.set(0, wheelRadius, wheelbase * 0.55);

    const rearWheel = this.createDetailedWheel(
      wheelRadius,
      wheelThickness * 1.15,
      info.modelStyle === 'thunder' ? info.glowColor : 0xcccccc,
      isWireSpoke
    );
    rearWheel.name = 'rearWheel';
    rearWheel.position.set(0, wheelRadius, -wheelbase * 0.55);

    chassis.add(frontWheel, rearWheel);

    // --- 2. SUSPENSION: Front Telescopic Forks & Rear Swingarm ---
    const forkLen = 0.85;
    const forkGeom = new THREE.CylinderGeometry(0.04, 0.04, forkLen, 10);
    const forkUpperGeom = new THREE.CylinderGeometry(0.052, 0.052, forkLen * 0.55, 10);

    const leftFork = new THREE.Group();
    const lForkStanchion = new THREE.Mesh(forkGeom, chromeMat);
    const lForkUpper = new THREE.Mesh(forkUpperGeom, goldMat); // Inverted golden USD fork
    lForkUpper.position.y = forkLen * 0.24;
    leftFork.add(lForkStanchion, lForkUpper);
    leftFork.position.set(-0.16, wheelRadius + 0.32, wheelbase * 0.52);
    leftFork.rotation.x = -forkRakeAngle;

    const rightFork = leftFork.clone();
    rightFork.position.x = 0.16;
    chassis.add(leftFork, rightFork);

    // Triple Tree Clamps
    const clampGeom = new THREE.BoxGeometry(0.38, 0.06, 0.12);
    const topClamp = new THREE.Mesh(clampGeom, darkMetalMat);
    topClamp.position.set(0, wheelRadius + forkLen * 0.65, wheelbase * 0.44);
    chassis.add(topClamp);

    // Handlebars with grips & mirrors
    const barWidth = isCruiser ? 0.98 : 0.72;
    const barGeom = new THREE.CylinderGeometry(0.025, 0.025, barWidth, 10);
    barGeom.rotateZ(Math.PI / 2);
    const handleBar = new THREE.Mesh(barGeom, isCruiser ? chromeMat : darkMetalMat);
    handleBar.position.set(0, wheelRadius + (isCruiser ? 0.88 : 0.68), wheelbase * (isCruiser ? 0.36 : 0.42));
    chassis.add(handleBar);

    // Bar Grips
    const gripGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.14, 8);
    gripGeom.rotateZ(Math.PI / 2);
    const gripL = new THREE.Mesh(gripGeom, darkMetalMat);
    gripL.position.set(-barWidth * 0.42, handleBar.position.y, handleBar.position.z);
    const gripR = gripL.clone();
    gripR.position.x = barWidth * 0.42;
    chassis.add(gripL, gripR);

    // Rear Swingarm & Monoshock
    const swingarmGeom = new THREE.BoxGeometry(0.38, 0.08, wheelbase * 0.52);
    const swingarm = new THREE.Mesh(swingarmGeom, darkMetalMat);
    swingarm.position.set(0, wheelRadius + 0.08, -wheelbase * 0.26);
    swingarm.rotation.x = 0.08;
    chassis.add(swingarm);

    // Monoshock Spring (Yellow/Red racing spring)
    const springGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.26, 8);
    const spring = new THREE.Mesh(springGeom, goldMat);
    spring.position.set(0, wheelRadius + 0.24, -wheelbase * 0.14);
    spring.rotation.x = -0.55;
    chassis.add(spring);

    // Mudguards / Fenders (Curved arch hugging the top of front tire)
    const fenderGeom = new THREE.CylinderGeometry(
      wheelRadius * 1.06,
      wheelRadius * 1.06,
      wheelThickness * 1.05,
      16,
      1,
      false,
      -Math.PI * 0.25,
      Math.PI * 0.5
    );
    fenderGeom.rotateZ(Math.PI / 2);
    const frontFender = new THREE.Mesh(fenderGeom, primaryMat);
    frontFender.position.set(0, wheelRadius + 0.02, wheelbase * 0.55);
    chassis.add(frontFender);

    // --- 3. ENGINE HOUSING & EXHAUST SYSTEM ---
    const engineGroup = new THREE.Group();
    engineGroup.position.set(0, wheelRadius + 0.2, 0.02);

    if (info.modelStyle === 'thunder') {
      // Electric battery inverter pack with glowing flux core
      const batteryGeom = new THREE.BoxGeometry(0.44, 0.42, 0.68);
      const battery = new THREE.Mesh(batteryGeom, carbonMat);
      const coreLightGeom = new THREE.BoxGeometry(0.46, 0.12, 0.5);
      const coreLight = new THREE.Mesh(coreLightGeom, accentGlowMat);
      engineGroup.add(battery, coreLight);
    } else {
      // Multi-cylinder internal combustion engine block
      const crankcase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.44, 12), darkMetalMat);
      crankcase.rotation.z = Math.PI / 2;
      const cylinders = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.46), chromeMat);
      cylinders.position.set(0, 0.14, 0.04);
      cylinders.rotation.x = 0.18;
      engineGroup.add(crankcase, cylinders);

      // Exhaust Pipes & Muffler
      const headerGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
      headerGeom.rotateX(Math.PI / 3);
      const headerPipe = new THREE.Mesh(headerGeom, chromeMat);
      headerPipe.position.set(0.18, 0.02, 0.2);

      const mufflerGeom = new THREE.CylinderGeometry(0.07, 0.09, 0.7, 10);
      mufflerGeom.rotateX(Math.PI / 2);
      const muffler = new THREE.Mesh(mufflerGeom, info.modelStyle === 'sport' ? carbonMat : chromeMat);
      muffler.position.set(0.24, 0.08, -wheelbase * 0.34);
      muffler.rotation.x = 0.15; // Upswept sport exhaust angle

      engineGroup.add(headerPipe, muffler);
    }
    chassis.add(engineGroup);

    // --- 4. BODY FAIRINGS & DISTINCT MODEL SILHOUETTES ---
    let tankMesh: THREE.Object3D;
    let tailMesh: THREE.Object3D;
    let headlampMesh: THREE.Object3D;

    switch (info.modelStyle) {
      case 'sport': {
        // Sculpted aerodynamic supersport fairing with ram-air intake nose and sharp tail
        const fairingGroup = new THREE.Group();

        // Contoured fuel tank with ergonomic knee recesses
        const tankGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.58, 12);
        tankGeom.rotateX(Math.PI / 2 + 0.12);
        const tank = new THREE.Mesh(tankGeom, primaryMat);
        tank.position.set(0, wheelRadius + 0.5, 0.12);

        // Aerodynamic nose fairing tapering to front headlamps
        const noseGeom = new THREE.ConeGeometry(0.26, 0.45, 4);
        noseGeom.rotateX(-Math.PI / 2);
        const nose = new THREE.Mesh(noseGeom, primaryMat);
        nose.position.set(0, wheelRadius + 0.52, wheelbase * 0.44);

        // Aerodynamic bubble windscreen
        const screen = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.38, 4), this.getMaterial(0x111827, 0.1, 0.95));
        screen.rotation.set(-1.15, 0, 0);
        screen.position.set(0, wheelRadius + 0.66, wheelbase * 0.36);

        // Dual side aerodynamic fairings
        const sideFairingL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.65), primaryMat);
        sideFairingL.position.set(-0.21, wheelRadius + 0.34, 0.16);
        const sideFairingR = sideFairingL.clone();
        sideFairingR.position.x = 0.21;

        // Lower engine belly pan chin
        const bellyPan = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.15, 0.72), secondaryMat);
        bellyPan.position.set(0, wheelRadius + 0.12, 0.05);

        fairingGroup.add(tank, nose, screen, sideFairingL, sideFairingR, bellyPan);
        tankMesh = fairingGroup;

        // Sharp supersport tail cowl
        const tailGroup = new THREE.Group();
        const tailCowl = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.68, 4), primaryMat);
        tailCowl.rotation.x = -Math.PI / 2;
        tailCowl.position.set(0, wheelRadius + 0.52, -0.42);
        tailGroup.add(tailCowl);
        tailMesh = tailGroup;

        // Twin aggressive slit headlights
        const lampL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.08), headlampMat);
        lampL.position.set(-0.12, wheelRadius + 0.48, wheelbase * 0.53);
        const lampR = lampL.clone();
        lampR.position.x = 0.12;
        const lampGrp = new THREE.Group();
        lampGrp.add(lampL, lampR);
        headlampMesh = lampGrp;
        break;
      }

      case 'cafe': {
        // Classic retro teardrop tank, round headlight, ribbed leather bench seat
        const tankGeom = new THREE.CylinderGeometry(0.24, 0.26, 0.75, 14);
        tankGeom.rotateX(Math.PI / 2);
        tankMesh = new THREE.Mesh(tankGeom, primaryMat);
        tankMesh.position.set(0, wheelRadius + 0.44, 0.14);

        // Classic rounded cafe cowl
        const cowlGeom = new THREE.SphereGeometry(0.22, 12, 10);
        cowlGeom.scale(1.0, 0.85, 1.4);
        tailMesh = new THREE.Mesh(cowlGeom, secondaryMat);
        tailMesh.position.set(0, wheelRadius + 0.46, -0.42);

        // Big round chrome headlight
        const lampGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.14, 16);
        lampGeom.rotateX(Math.PI / 2);
        headlampMesh = new THREE.Mesh(lampGeom, headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.52, wheelbase * 0.5);
        break;
      }

      case 'adventure': {
        // Rugged Dakar rally fairing, tall windscreen, heavy side pannier boxes
        const advGroup = new THREE.Group();
        const tankBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.58, 0.82), primaryMat);
        tankBox.position.set(0, wheelRadius + 0.52, 0.12);

        // Tall rally windscreen
        const tallScreen = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.05), this.getMaterial(0xdfe6e9, 0.1, 0.9));
        tallScreen.position.set(0, wheelRadius + 0.82, wheelbase * 0.38);
        tallScreen.rotation.x = -0.35;

        // Crash bars
        const barFrame = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.35, 0.6), chromeMat);
        barFrame.position.set(0, wheelRadius + 0.32, 0.14);

        advGroup.add(tankBox, tallScreen, barFrame);
        tankMesh = advGroup;

        // Dual Aluminum Expedition Panniers on rear
        const tailGroup = new THREE.Group();
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.48), darkMetalMat);
        rack.position.set(0, wheelRadius + 0.54, -0.48);
        const pannierL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.44), secondaryMat);
        pannierL.position.set(-0.35, wheelRadius + 0.46, -0.46);
        const pannierR = pannierL.clone();
        pannierR.position.x = 0.35;
        tailGroup.add(rack, pannierL, pannierR);
        tailMesh = tailGroup;

        headlampMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.1), headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.62, wheelbase * 0.48);
        break;
      }

      case 'thunder': {
        // Futuristic electric superbike with aerodynamic side ducts and neon glow
        const thunderGroup = new THREE.Group();
        const shell = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.88), primaryMat);
        shell.position.set(0, wheelRadius + 0.48, 0.16);

        // Side neon glowing cooling fins
        const finL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.7), accentGlowMat);
        finL.position.set(-0.26, wheelRadius + 0.42, 0.12);
        const finR = finL.clone();
        finR.position.x = 0.26;

        thunderGroup.add(shell, finL, finR);
        tankMesh = thunderGroup;

        // Angular fighter-jet tail with vertical stabilizers
        const tailGroup = new THREE.Group();
        const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 4), secondaryMat);
        tailCone.rotation.x = -Math.PI / 2;
        tailCone.position.set(0, wheelRadius + 0.5, -0.46);
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.3), accentGlowMat);
        wingL.position.set(-0.2, wheelRadius + 0.58, -0.48);
        wingL.rotation.z = 0.4;
        const wingR = wingL.clone();
        wingR.position.x = 0.2;
        wingR.rotation.z = -0.4;
        tailGroup.add(tailCone, wingL, wingR);
        tailMesh = tailGroup;

        headlampMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.12), headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.5, wheelbase * 0.52);
        break;
      }

      case 'cyber': {
        // Cyberpunk blade silhouette with wide glowing light panels
        const cyberGroup = new THREE.Group();
        const bladeTank = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.96), primaryMat);
        bladeTank.position.set(0, wheelRadius + 0.44, 0.18);

        // Futuristic neon light panels along chassis
        const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.8), accentGlowMat);
        panelL.position.set(-0.3, wheelRadius + 0.44, 0.14);
        const panelR = panelL.clone();
        panelR.position.x = 0.3;

        cyberGroup.add(bladeTank, panelL, panelR);
        tankMesh = cyberGroup;

        const tailGroup = new THREE.Group();
        const cyberTail = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.65), secondaryMat);
        cyberTail.position.set(0, wheelRadius + 0.46, -0.52);
        const neonSpine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.68), accentGlowMat);
        neonSpine.position.set(0, wheelRadius + 0.48, -0.52);
        tailGroup.add(cyberTail, neonSpine);
        tailMesh = tailGroup;

        headlampMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.12), accentGlowMat);
        headlampMesh.position.set(0, wheelRadius + 0.46, wheelbase * 0.54);
        break;
      }

      case 'streamliner': {
        // Bonneville land speed bullet streamliner encasing the motorcycle
        const streamGroup = new THREE.Group();
        const bulletGeom = new THREE.CylinderGeometry(0.28, 0.3, 1.4, 16);
        bulletGeom.rotateX(Math.PI / 2);
        const bulletShell = new THREE.Mesh(bulletGeom, primaryMat);
        bulletShell.position.set(0, wheelRadius + 0.42, 0.06);

        // Aerodynamic canopy
        const canopyGeom = new THREE.SphereGeometry(0.26, 12, 10);
        canopyGeom.scale(0.85, 1.0, 2.2);
        const canopy = new THREE.Mesh(canopyGeom, this.getMaterial(0x1a252f, 0.1, 0.9));
        canopy.position.set(0, wheelRadius + 0.56, 0.1);

        streamGroup.add(bulletShell, canopy);
        tankMesh = streamGroup;

        // Teardrop needle tail
        const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.95, 12), primaryMat);
        tailCone.rotation.x = -Math.PI / 2;
        tailCone.position.set(0, wheelRadius + 0.42, -0.68);
        tailMesh = tailCone;

        headlampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.42, wheelbase * 0.58);
        break;
      }

      case 'cruiser': {
        // Chopper teardrop tank, high raked handlebars, chrome console, leather saddle
        const chopperTank = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.72, 12), primaryMat);
        chopperTank.rotation.set(Math.PI / 2 + 0.25, 0, 0);
        chopperTank.position.set(0, wheelRadius + 0.54, 0.08);
        tankMesh = chopperTank;

        // Wide deep cruiser seat with passenger sissy bar
        const tailGroup = new THREE.Group();
        const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.55), seatLeatherMat);
        seatBase.position.set(0, wheelRadius + 0.42, -0.46);
        const sissyBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), chromeMat);
        sissyBar.position.set(0, wheelRadius + 0.65, -0.72);
        tailGroup.add(seatBase, sissyBar);
        tailMesh = tailGroup;

        // Chrome bullet headlight
        const headlampGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 16);
        headlampGeom.rotateX(Math.PI / 2);
        headlampMesh = new THREE.Mesh(headlampGeom, headlampMat);
        headlampMesh.position.set(0, wheelRadius + 0.68, wheelbase * 0.52);
        break;
      }

      case 'hyper':
      default: {
        // Hyper-naked streetfighter with massive exposed trellis frame and quad exhaust
        const hyperGroup = new THREE.Group();
        const muscularTank = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.48, 0.88), primaryMat);
        muscularTank.position.set(0, wheelRadius + 0.48, 0.16);

        // Trellis frame tubes
        const trellisMat = this.getMaterial(0xd63031, 0.3, 0.6); // Red tubular steel frame
        const frameTubeL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), trellisMat);
        frameTubeL.position.set(-0.25, wheelRadius + 0.35, 0.12);
        frameTubeL.rotation.z = 0.5;
        const frameTubeR = frameTubeL.clone();
        frameTubeR.position.x = 0.25;
        frameTubeR.rotation.z = -0.5;

        hyperGroup.add(muscularTank, frameTubeL, frameTubeR);
        tankMesh = hyperGroup;

        // Minimalist high-cut stunt tail
        const tailGroup = new THREE.Group();
        const shortTail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 4), secondaryMat);
        shortTail.rotation.x = -Math.PI / 2;
        shortTail.position.set(0, wheelRadius + 0.56, -0.42);
        tailGroup.add(shortTail);
        tailMesh = tailGroup;

        // Predator dual stacked insectoid LED headlamps
        const lampTop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.1), headlampMat);
        lampTop.position.set(0, wheelRadius + 0.54, wheelbase * 0.5);
        const lampBottom = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.1), accentGlowMat);
        lampBottom.position.set(0, wheelRadius + 0.44, wheelbase * 0.51);
        const hyperLamp = new THREE.Group();
        hyperLamp.add(lampTop, lampBottom);
        headlampMesh = hyperLamp;
        break;
      }
    }

    tankMesh.castShadow = true;
    tailMesh.castShadow = true;
    chassis.add(tankMesh, tailMesh, headlampMesh);

    // Leather Saddle / Cushion
    const saddleGeom = new THREE.BoxGeometry(0.32, 0.08, 0.42);
    const saddle = new THREE.Mesh(saddleGeom, seatLeatherMat);
    saddle.position.set(0, wheelRadius + 0.46, -0.12);
    chassis.add(saddle);

    // Taillight bar
    const tailLamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), taillightMat);
    tailLamp.position.set(0, wheelRadius + 0.5, -wheelbase * 0.54);
    chassis.add(tailLamp);

    // --- 5. DETAILED STYLIZED RIDER & RIDER ROOT ANCHOR ---
    const riderRoot = new THREE.Group();
    riderRoot.name = 'RiderRoot';
    const riderY = wheelRadius + 0.23; // e.g. 0.42 + 0.23 = 0.65m above ground
    const riderZ = isCruiser ? -wheelbase * 0.18 : -0.05;
    riderRoot.position.set(0, riderY, riderZ);
    chassis.add(riderRoot);

    const rider = this.createStylizedRider(
      info.primaryColor,
      info.secondaryColor,
      wheelRadius,
      wheelbase,
      isCruiser
    );
    rider.name = 'rider';
    rider.position.set(0, 0, 0);
    rider.rotation.set(0, 0, 0);
    rider.scale.set(1, 1, 1);
    riderRoot.add(rider);

    return {
      group: root,
      frontWheel,
      rearWheel,
      chassis,
      rider,
      riderRoot,
      emissives: emissiveList,
    };
  }
}
