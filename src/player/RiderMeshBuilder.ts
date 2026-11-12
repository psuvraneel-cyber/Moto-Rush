import * as THREE from 'three';

export interface RiderMaterialPalette {
  leatherBlack: THREE.MeshStandardMaterial;
  leatherAccent: THREE.MeshStandardMaterial;
  armorTPU: THREE.MeshStandardMaterial;
  armorSliderAlloy: THREE.MeshStandardMaterial;
  helmetGloss: THREE.MeshStandardMaterial;
  visorMirror: THREE.MeshStandardMaterial;
  kneeSliderPU: THREE.MeshStandardMaterial;
  bootMicrofiber: THREE.MeshStandardMaterial;
  rubberGrip: THREE.MeshStandardMaterial;
}

export class RiderMeshBuilder {
  /**
   * Creates calibrated PBR materials matching 2K PBR street_racer.glb aesthetic.
   */
  public static createMaterials(
    primaryColor: number = 0xd63031,
    secondaryColor: number = 0x16171b
  ): RiderMaterialPalette {
    return {
      leatherBlack: new THREE.MeshStandardMaterial({
        color: secondaryColor === 0x16171b ? 0x16171b : secondaryColor,
        roughness: 0.65,
        metalness: 0.15,
      }),
      leatherAccent: new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.45,
        metalness: 0.25,
      }),
      armorTPU: new THREE.MeshStandardMaterial({
        color: 0x1a1b20,
        roughness: 0.40,
        metalness: 0.65,
      }),
      armorSliderAlloy: new THREE.MeshStandardMaterial({
        color: 0xdcdde1,
        roughness: 0.20,
        metalness: 0.90,
      }),
      helmetGloss: new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.12,
        metalness: 0.35,
      }),
      visorMirror: new THREE.MeshStandardMaterial({
        color: 0x050608,
        roughness: 0.03,
        metalness: 0.96,
      }),
      kneeSliderPU: new THREE.MeshStandardMaterial({
        color: 0xf5f6fa,
        roughness: 0.35,
        metalness: 0.05,
      }),
      bootMicrofiber: new THREE.MeshStandardMaterial({
        color: 0x121316,
        roughness: 0.55,
        metalness: 0.25,
      }),
      rubberGrip: new THREE.MeshStandardMaterial({
        color: 0x0a0b0d,
        roughness: 0.85,
        metalness: 0.05,
      }),
    };
  }

  /**
   * Constructs a continuous, stylised, anatomically proportioned adult motorcycle racer (1:7.2 head ratio).
   * Exact motorcycle contact datums:
   * - Saddle origin at [0, 0.07, 0] (local to RiderRoot [0, 0.65, -0.05])
   * - Handlebar grips at [±0.24, +0.20, +0.43] (local to RiderRoot) / [±0.24, 0.85, 0.38] (chassis world)
   * - Footpegs at [±0.21, -0.25, -0.07] (local to RiderRoot) / [±0.21, 0.40, -0.12] (chassis world)
   * - Fuel tank waist at X = ±0.18m
   *
   * Node naming contracts preserved:
   * - rider_torso
   * - rider_head
   * - rider_pelvis
   * - rider_legs
   */
  public static buildRider(
    primaryColor: number = 0xd63031,
    secondaryColor: number = 0x16171b,
    isCruiser: boolean = false
  ): THREE.Group {
    const root = new THREE.Group();
    root.name = 'rider';

    const mats = this.createMaterials(primaryColor, secondaryColor);

    // 1. PELVIS / SADDLE CONTACT MESH ('rider_pelvis')
    const pelvisGeom = new THREE.CapsuleGeometry(0.12, 0.14, 12, 16);
    pelvisGeom.scale(1.15, 0.90, 1.20);
    pelvisGeom.computeVertexNormals();
    const pelvis = new THREE.Mesh(pelvisGeom, mats.leatherBlack);
    pelvis.name = 'rider_pelvis';
    pelvis.position.set(0, 0.05, 0);
    pelvis.castShadow = true;
    pelvis.receiveShadow = true;
    root.add(pelvis);

    // 2. ARTICULATED TORSO ('rider_torso')
    const torsoGroup = new THREE.Group();
    torsoGroup.name = 'rider_torso';
    torsoGroup.position.set(0, 0.12, 0);
    torsoGroup.rotation.x = isCruiser ? 0.08 : 0.38; // Initial forward incline

    // Abdomen / Lumbar core
    const lumbarGeom = new THREE.CylinderGeometry(0.13, 0.14, 0.16, 16);
    lumbarGeom.scale(1.10, 1.0, 0.85);
    lumbarGeom.computeVertexNormals();
    const lumbar = new THREE.Mesh(lumbarGeom, mats.leatherBlack);
    lumbar.position.set(0, 0.08, 0.01);
    lumbar.castShadow = true;
    lumbar.receiveShadow = true;
    torsoGroup.add(lumbar);

    // Thoracic Ribcage & Athletic Pectoral V-Taper
    const chestGeom = new THREE.CapsuleGeometry(0.14, 0.18, 12, 16);
    chestGeom.scale(1.25, 1.0, 0.90);
    chestGeom.computeVertexNormals();
    const chest = new THREE.Mesh(chestGeom, mats.leatherBlack);
    chest.position.set(0, 0.22, 0.03);
    chest.castShadow = true;
    chest.receiveShadow = true;
    torsoGroup.add(chest);

    // Racing suit chest accent plate / livery chevron
    const chestPlateGeom = new THREE.CylinderGeometry(0.13, 0.11, 0.20, 12);
    chestPlateGeom.scale(1.10, 1.0, 0.30);
    chestPlateGeom.computeVertexNormals();
    const chestPlate = new THREE.Mesh(chestPlateGeom, mats.leatherAccent);
    chestPlate.position.set(0, 0.22, 0.10);
    chestPlate.castShadow = true;
    torsoGroup.add(chestPlate);

    // Aerodynamic Dorsal Speed Hump along upper thoracic spine
    const humpGeom = new THREE.ConeGeometry(0.10, 0.32, 16);
    humpGeom.rotateX(Math.PI * 0.92); // Taper pointing down along dorsal spine
    humpGeom.scale(0.85, 1.0, 1.35);
    humpGeom.computeVertexNormals();
    const hump = new THREE.Mesh(humpGeom, mats.armorTPU);
    hump.position.set(0, 0.24, -0.11);
    hump.castShadow = true;
    torsoGroup.add(hump);

    // Low-profile molded TPU shoulder armor with embedded titanium slider inserts (Zero floating balls!)
    for (const side of [-1, 1]) {
      const shoulderCap = new THREE.Group();
      shoulderCap.name = side === -1 ? 'shoulder_armor_l' : 'shoulder_armor_r';
      shoulderCap.position.set(side * 0.21, 0.28, 0.02);

      // Molded TPU cap conforming to deltoid
      const tpuCapGeom = new THREE.SphereGeometry(0.08, 16, 12, 0, Math.PI, 0, Math.PI * 0.75);
      tpuCapGeom.scale(side * 0.9, 1.1, 1.3);
      tpuCapGeom.rotateZ(side * 0.35);
      tpuCapGeom.computeVertexNormals();
      const tpuMesh = new THREE.Mesh(tpuCapGeom, mats.armorTPU);
      tpuMesh.castShadow = true;

      // Flush titanium slider insert
      const sliderGeom = new THREE.CylinderGeometry(0.032, 0.035, 0.015, 12);
      sliderGeom.rotateZ(side * Math.PI / 2.2);
      sliderGeom.computeVertexNormals();
      const sliderMesh = new THREE.Mesh(sliderGeom, mats.armorSliderAlloy);
      sliderMesh.position.set(side * 0.065, 0.01, 0.02);
      sliderMesh.castShadow = true;

      shoulderCap.add(tpuMesh, sliderMesh);
      torsoGroup.add(shoulderCap);
    }

    // 3. FULL RACING HELMET & HEAD ('rider_head')
    const headGroup = new THREE.Group();
    headGroup.name = 'rider_head';
    headGroup.position.set(0, 0.38, 0.06);

    // Leather accordion collar / neck
    const neckGeom = new THREE.CylinderGeometry(0.065, 0.075, 0.08, 14);
    neckGeom.computeVertexNormals();
    const neck = new THREE.Mesh(neckGeom, mats.leatherBlack);
    neck.position.set(0, -0.01, 0.01);
    neck.castShadow = true;
    headGroup.add(neck);

    // Aerodynamic Teardrop Helmet Shell
    const helmetShellGeom = new THREE.SphereGeometry(0.135, 24, 20);
    helmetShellGeom.scale(0.88, 1.02, 1.16);
    helmetShellGeom.computeVertexNormals();
    const helmetShell = new THREE.Mesh(helmetShellGeom, mats.helmetGloss);
    helmetShell.position.set(0, 0.10, 0.03);
    helmetShell.castShadow = true;
    headGroup.add(helmetShell);

    // Integrated Chin Bar with Ram-Air Triangular Intake Scoop
    const chinGeom = new THREE.CylinderGeometry(0.12, 0.13, 0.10, 16, 1, false, 0, Math.PI);
    chinGeom.scale(0.85, 1.0, 1.20);
    chinGeom.rotateY(-Math.PI / 2);
    chinGeom.computeVertexNormals();
    const chin = new THREE.Mesh(chinGeom, mats.helmetGloss);
    chin.position.set(0, 0.03, 0.10);
    chin.castShadow = true;

    // Triangular intake scoop aperture
    const ventGeom = new THREE.ConeGeometry(0.025, 0.04, 3);
    ventGeom.rotateX(-Math.PI / 2);
    ventGeom.computeVertexNormals();
    const vent = new THREE.Mesh(ventGeom, mats.rubberGrip);
    vent.position.set(0, 0.02, 0.165);
    chin.add(vent);
    headGroup.add(chin);

    // Single Continuous Tinted Dark-Smoke Mirror Visor
    const visorGeom = new THREE.CylinderGeometry(
      0.138,
      0.138,
      0.075,
      24,
      1,
      true,
      -Math.PI * 0.36,
      Math.PI * 0.72
    );
    visorGeom.rotateY(-Math.PI / 2);
    visorGeom.computeVertexNormals();
    const visor = new THREE.Mesh(visorGeom, mats.visorMirror);
    visor.position.set(0, 0.10, 0.04);
    visor.castShadow = true;
    headGroup.add(visor);

    // Rear Aerodynamic Diffuser / Spoiler Lip
    const spoilerGeom = new THREE.BoxGeometry(0.16, 0.025, 0.06);
    spoilerGeom.rotateX(-0.35);
    spoilerGeom.computeVertexNormals();
    const spoiler = new THREE.Mesh(spoilerGeom, mats.armorTPU);
    spoiler.position.set(0, 0.08, -0.13);
    spoiler.castShadow = true;
    headGroup.add(spoiler);

    torsoGroup.add(headGroup);

    // 4. ARTICULATED ARMS, ELBOW ARMOR & GAUNTLETS (Analytical IK Mounts)
    // Shoulder sockets at [±0.19, 0.28, 0.04] in torso space
    for (const side of [-1, 1]) {
      const armUpperName = side === -1 ? 'arm_upper_l' : 'arm_upper_r';
      const armForeName = side === -1 ? 'arm_fore_l' : 'arm_fore_r';
      const handName = side === -1 ? 'hand_l' : 'hand_r';

      // Upper Arm segment
      const upperArm = new THREE.Group();
      upperArm.name = armUpperName;
      upperArm.position.set(side * 0.19, 0.28, 0.04);

      const upperArmMeshGeom = new THREE.CapsuleGeometry(0.046, 0.16, 12, 16);
      upperArmMeshGeom.translate(0, 0.08, 0); // Origin at shoulder joint
      upperArmMeshGeom.computeVertexNormals();
      const upperArmMesh = new THREE.Mesh(upperArmMeshGeom, mats.leatherBlack);
      upperArmMesh.castShadow = true;
      upperArm.add(upperArmMesh);

      // Accent racing stripe along outer deltoid
      const upperStripeGeom = new THREE.CylinderGeometry(0.047, 0.045, 0.14, 8, 1, false, 0, Math.PI * 0.5);
      upperStripeGeom.translate(side * 0.01, 0.08, 0);
      upperStripeGeom.computeVertexNormals();
      const upperStripe = new THREE.Mesh(upperStripeGeom, mats.leatherAccent);
      upperArm.add(upperStripe);

      // Elbow Armor Cap & Slider (placed at tip of upper arm: Y = 0.25m)
      const elbowArmorGeom = new THREE.SphereGeometry(0.052, 12, 10, 0, Math.PI, 0, Math.PI * 0.75);
      elbowArmorGeom.translate(0, 0.24, -0.01);
      elbowArmorGeom.computeVertexNormals();
      const elbowArmor = new THREE.Mesh(elbowArmorGeom, mats.armorTPU);
      upperArm.add(elbowArmor);

      // Forearm segment
      const forearm = new THREE.Group();
      forearm.name = armForeName;
      // Default resting elbow waypoint in torso space
      forearm.position.set(side * 0.25, 0.12, 0.22);

      const forearmMeshGeom = new THREE.CapsuleGeometry(0.042, 0.18, 12, 16);
      forearmMeshGeom.translate(0, 0.09, 0); // Origin at elbow joint
      forearmMeshGeom.computeVertexNormals();
      const forearmMesh = new THREE.Mesh(forearmMeshGeom, mats.leatherBlack);
      forearmMesh.castShadow = true;
      forearm.add(forearmMesh);

      // Gauntlet Racing Glove
      const hand = new THREE.Group();
      hand.name = handName;
      // Grip target in torso local space (matches [±0.24, 0.20, 0.43] in RiderRoot local)
      hand.position.set(side * 0.24, 0.02, 0.38);

      // Gauntlet flared wrist cuff
      const cuffGeom = new THREE.CylinderGeometry(0.055, 0.045, 0.08, 12);
      cuffGeom.computeVertexNormals();
      const cuff = new THREE.Mesh(cuffGeom, mats.armorTPU);
      cuff.position.set(0, 0.02, 0);
      cuff.castShadow = true;
      hand.add(cuff);

      // Glove palm / curled fingers gripping handlebar
      const palmGeom = new THREE.BoxGeometry(0.075, 0.065, 0.095);
      palmGeom.computeVertexNormals();
      const palm = new THREE.Mesh(palmGeom, mats.rubberGrip);
      palm.position.set(0, -0.02, 0.03);
      palm.rotation.x = -0.35;
      palm.castShadow = true;
      hand.add(palm);

      // Titanium knuckle guard plate
      const knuckleGeom = new THREE.BoxGeometry(0.072, 0.020, 0.045);
      knuckleGeom.computeVertexNormals();
      const knuckle = new THREE.Mesh(knuckleGeom, mats.armorSliderAlloy);
      knuckle.position.set(0, 0.015, 0.03);
      knuckle.castShadow = true;
      hand.add(knuckle);

      torsoGroup.add(upperArm, forearm, hand);
    }

    root.add(torsoGroup);

    // 5. ARTICULATED LEGS, KNEE SLIDERS & RACING BOOTS ('rider_legs')
    const legGroup = new THREE.Group();
    legGroup.name = 'rider_legs';
    legGroup.position.set(0, 0, 0);

    for (const side of [-1, 1]) {
      const thighName = side === -1 ? 'leg_thigh_l' : 'leg_thigh_r';
      const shinName = side === -1 ? 'leg_shin_l' : 'leg_shin_r';
      const bootName = side === -1 ? 'boot_l' : 'boot_r';
      const puckName = side === -1 ? 'knee_slider_l' : 'knee_slider_r';

      // Thigh segment (origin at hip: [±0.11, 0.07, 0.00])
      const thigh = new THREE.Group();
      thigh.name = thighName;
      thigh.position.set(side * 0.11, 0.07, 0.00);

      const thighMeshGeom = new THREE.CapsuleGeometry(0.072, 0.22, 12, 16);
      thighMeshGeom.translate(0, 0.11, 0);
      thighMeshGeom.computeVertexNormals();
      const thighMesh = new THREE.Mesh(thighMeshGeom, mats.leatherBlack);
      thighMesh.castShadow = true;
      thigh.add(thighMesh);

      // Outer thigh livery panel
      const thighPanelGeom = new THREE.CylinderGeometry(0.074, 0.070, 0.18, 10, 1, false, 0, Math.PI * 0.6);
      thighPanelGeom.translate(side * 0.01, 0.11, 0);
      thighPanelGeom.computeVertexNormals();
      const thighPanel = new THREE.Mesh(thighPanelGeom, mats.leatherAccent);
      thigh.add(thighPanel);

      // White Beveled PU Knee Slider Puck
      const puckGeom = new THREE.CylinderGeometry(0.042, 0.042, 0.028, 16);
      puckGeom.rotateZ(Math.PI / 2);
      puckGeom.computeVertexNormals();
      const puck = new THREE.Mesh(puckGeom, mats.kneeSliderPU);
      puck.name = puckName;
      // Positioned at lateral knee apex
      puck.position.set(side * 0.25, -0.08, 0.22);
      puck.castShadow = true;
      legGroup.add(puck);

      // Shin / Calf segment (origin at knee)
      const shin = new THREE.Group();
      shin.name = shinName;
      shin.position.set(side * 0.18, -0.08, 0.18);

      const shinMeshGeom = new THREE.CapsuleGeometry(0.058, 0.22, 12, 16);
      shinMeshGeom.translate(0, 0.11, 0);
      shinMeshGeom.computeVertexNormals();
      const shinMesh = new THREE.Mesh(shinMeshGeom, mats.leatherBlack);
      shinMesh.castShadow = true;
      shin.add(shinMesh);

      // Armored Track Boot (placed at footpeg: [±0.21, -0.25, -0.07])
      const boot = new THREE.Group();
      boot.name = bootName;
      boot.position.set(side * 0.21, -0.25, -0.07);

      // High-top microfiber boot shaft & ankle counter
      const bootShaftGeom = new THREE.CapsuleGeometry(0.062, 0.16, 12, 14);
      bootShaftGeom.computeVertexNormals();
      const bootShaft = new THREE.Mesh(bootShaftGeom, mats.bootMicrofiber);
      bootShaft.position.set(0, 0.08, 0);
      bootShaft.castShadow = true;

      // Boot foot box / sole resting on knurled footpeg
      const bootFootGeom = new THREE.BoxGeometry(0.085, 0.080, 0.22);
      bootFootGeom.computeVertexNormals();
      const bootFoot = new THREE.Mesh(bootFootGeom, mats.bootMicrofiber);
      bootFoot.position.set(0, 0.02, 0.05);
      bootFoot.rotation.x = 0.18; // Pitch forward along peg
      bootFoot.castShadow = true;

      // Alloy toe slider on outer toe box
      const toeSliderGeom = new THREE.BoxGeometry(0.025, 0.025, 0.08);
      toeSliderGeom.computeVertexNormals();
      const toeSlider = new THREE.Mesh(toeSliderGeom, mats.armorSliderAlloy);
      toeSlider.position.set(side * 0.046, 0.015, 0.10);
      toeSlider.castShadow = true;

      boot.add(bootShaft, bootFoot, toeSlider);

      legGroup.add(thigh, shin, boot);
    }

    root.add(legGroup);

    return root;
  }

  /**
   * Recursively traverses an Object3D hierarchy and disposes all geometries,
   * materials, and textures to prevent WebGL memory leaks.
   */
  public static disposeHierarchy(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            for (const mat of mesh.material) {
              if ((mat as any).map) (mat as any).map.dispose();
              mat.dispose();
            }
          } else {
            if ((mesh.material as any).map) (mesh.material as any).map.dispose();
            mesh.material.dispose();
          }
        }
      }
    });
    obj.clear();
  }
}

