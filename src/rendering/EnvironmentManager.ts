import * as THREE from 'three';
import { EnvironmentConfig, ENVIRONMENTS, GAME_CONFIG } from '../core/GameConfig';
import { AssetLoader } from '../assets/AssetLoader';

export class EnvironmentModelCache {
  private static instance: EnvironmentModelCache;
  private templates: Map<string, THREE.Group> = new Map();
  private isPreloading: boolean = false;
  private isPreloaded: boolean = false;

  private constructor() {
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      this.preload();
    }
  }

  public static getInstance(): EnvironmentModelCache {
    if (!EnvironmentModelCache.instance) {
      EnvironmentModelCache.instance = new EnvironmentModelCache();
    }
    return EnvironmentModelCache.instance;
  }

  public async preload(): Promise<void> {
    if (this.isPreloaded || this.isPreloading) return;
    this.isPreloading = true;

    const loader = AssetLoader.getInstance();
    const items: Array<{ key: string; file: 'streetlight' | 'city_tree' | 'highway_sign' | 'city_office_tower' }> = [
      { key: 'streetlight', file: 'streetlight' },
      { key: 'city_tree', file: 'city_tree' },
      { key: 'highway_sign', file: 'highway_sign' },
      { key: 'city_office_tower', file: 'city_office_tower' },
    ];

    await Promise.all(
      items.map(async ({ key, file }) => {
        try {
          const grp = await loader.loadEnvironmentModel(file);
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
    if (!t) return null;
    return t.clone(true);
  }
}

export class EnvironmentManager {
  public group: THREE.Group;
  private currentEnv: EnvironmentConfig;
  private roadGroup: THREE.Group;
  private foregroundGroup: THREE.Group;
  private midgroundGroup: THREE.Group;
  private backgroundGroup: THREE.Group;
  private finishLineGroup: THREE.Group;
  private cloudsGroup: THREE.Group;
  private animatedProps: Array<{ mesh: THREE.Object3D; update: (dt: number, time: number) => void }> = [];

  private finishLineZ: number = 500;
  public isEndless: boolean = false;
  private endlessMaxZ: number = 0;
  private animTime: number = 0;
  private oceanMesh?: THREE.Mesh;

  // Material and texture caching for peak performance
  private materialCache: Map<string, THREE.Material> = new Map();
  private signTextureCache: Map<string, THREE.CanvasTexture> = new Map();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'environment_manager';

    this.roadGroup = new THREE.Group();
    this.roadGroup.name = 'road_group';

    this.foregroundGroup = new THREE.Group();
    this.foregroundGroup.name = 'foreground_group';

    this.midgroundGroup = new THREE.Group();
    this.midgroundGroup.name = 'midground_group';

    this.backgroundGroup = new THREE.Group();
    this.backgroundGroup.name = 'background_group';

    this.cloudsGroup = new THREE.Group();
    this.cloudsGroup.name = 'clouds_group';

    this.finishLineGroup = new THREE.Group();
    this.finishLineGroup.name = 'finish_line_group';

    this.group.add(
      this.backgroundGroup,
      this.cloudsGroup,
      this.midgroundGroup,
      this.roadGroup,
      this.foregroundGroup,
      this.finishLineGroup
    );

    this.currentEnv = ENVIRONMENTS.sunny_city;
  }

  private getMaterial(
    color: number,
    roughness: number = 0.5,
    metalness: number = 0.3,
    emissive: number = 0,
    emissiveIntensity: number = 0
  ): THREE.MeshStandardMaterial {
    const key = `mat_${color}_${roughness}_${metalness}_${emissive}_${emissiveIntensity}`;
    if (!this.materialCache.has(key)) {
      this.materialCache.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness,
          emissive: emissive !== 0 ? emissive : 0x000000,
          emissiveIntensity: emissive !== 0 ? emissiveIntensity : 0,
        })
      );
    }
    return this.materialCache.get(key) as THREE.MeshStandardMaterial;
  }

  public setEnvironment(envId: string, trackLength: number, isEndless: boolean = false): void {
    const env = ENVIRONMENTS[envId] || ENVIRONMENTS.sunny_city;
    this.currentEnv = env;
    this.finishLineZ = trackLength;
    this.isEndless = isEndless;
    this.animatedProps = [];
    this.oceanMesh = undefined;

    // Clear all child groups
    this.clearGroup(this.roadGroup);
    this.clearGroup(this.foregroundGroup);
    this.clearGroup(this.midgroundGroup);
    this.clearGroup(this.backgroundGroup);
    this.clearGroup(this.cloudsGroup);
    this.clearGroup(this.finishLineGroup);

    if (isEndless) {
      this.endlessMaxZ = 0;
      this.extendEndlessRoad(700);
      this.buildClouds(1200);
    } else {
      this.buildGroundTerrain(trackLength);
      this.buildRoad(trackLength);
      this.buildForeground(trackLength);
      this.buildMidground(trackLength);
      this.buildBackground(trackLength);
      this.buildClouds(trackLength);
      this.buildFinishLine(trackLength);
    }
  }

  public update(dt: number, playerZ: number): void {
    this.animTime += dt;

    // Animate environment-specific dynamic props
    for (const prop of this.animatedProps) {
      prop.update(dt, this.animTime);
    }

    // Animate moving clouds gently along Z and X
    for (let i = 0; i < this.cloudsGroup.children.length; i++) {
      const cloud = this.cloudsGroup.children[i];
      cloud.position.x += Math.sin(this.animTime * 0.2 + i) * dt * 0.8;
      if (cloud.position.z < playerZ - 100) {
        cloud.position.z += 600;
      }
    }

    // Ocean water wave animation
    if (this.oceanMesh && this.oceanMesh.geometry) {
      const pos = this.oceanMesh.geometry.attributes.position;
      if (pos) {
        const time = this.animTime * 2.2;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const v = pos.getY(i);
          pos.setZ(i, Math.sin(u * 0.12 + time) * 0.35 + Math.cos(v * 0.1 + time * 1.2) * 0.28);
        }
        pos.needsUpdate = true;
      }
    }

    // Endless mode streaming
    if (this.isEndless && playerZ + 400 > this.endlessMaxZ) {
      this.extendEndlessRoad(350);
      this.pruneOldObjects(playerZ - 250);
    }
  }

  private extendEndlessRoad(additionalLength: number): void {
    const startZ = this.endlessMaxZ;
    const endZ = startZ + additionalLength;
    this.endlessMaxZ = endZ;

    this.buildGroundSegment(startZ, additionalLength);
    this.buildRoadSegment(startZ, additionalLength);
    this.buildScenerySegment(startZ, additionalLength);
  }

  private pruneOldObjects(minZ: number): void {
    const prune = (grp: THREE.Group) => {
      for (let i = grp.children.length - 1; i >= 0; i--) {
        const child = grp.children[i] as any;
        const z = child.maxZ !== undefined ? child.maxZ : child.position.z;
        if (z < minZ) {
          grp.remove(child);
          if (child.geometry) child.geometry.dispose();
        }
      }
    };
    prune(this.roadGroup);
    prune(this.foregroundGroup);
    prune(this.midgroundGroup);
  }

  private clearGroup(grp: THREE.Group): void {
    while (grp.children.length > 0) {
      const child = grp.children[0];
      grp.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }
  }

  // =========================================================================
  // 1. GROUND TERRAIN & SURROUNDINGS
  // =========================================================================
  private buildGroundTerrain(trackLength: number): void {
    const totalZ = trackLength + 300;

    if (this.currentEnv.id === 'coastal_highway') {
      // 1. Left coastal hillside terrain
      const leftHillWidth = 140;
      const leftGeom = new THREE.PlaneGeometry(leftHillWidth, totalZ, 1, 16);
      leftGeom.rotateX(-Math.PI / 2);
      const leftMat = this.getMaterial(0x2d6a4f, 0.85, 0.1);
      const leftMesh = new THREE.Mesh(leftGeom, leftMat);
      leftMesh.position.set(-leftHillWidth / 2 - 6, -0.06, totalZ / 2 - 50);
      leftMesh.receiveShadow = true;
      this.backgroundGroup.add(leftMesh);

      // 2. Right beach strip
      const beachWidth = 12;
      const beachGeom = new THREE.PlaneGeometry(beachWidth, totalZ, 1, 16);
      beachGeom.rotateX(-Math.PI / 2);
      const beachMat = this.getMaterial(0xf4a261, 0.9, 0.05);
      const beachMesh = new THREE.Mesh(beachGeom, beachMat);
      beachMesh.position.set(6 + beachWidth / 2, -0.06, totalZ / 2 - 50);
      beachMesh.receiveShadow = true;
      this.backgroundGroup.add(beachMesh);

      // 3. Wide sparkling ocean beyond the beach (y = 0, fully visible!)
      const oceanWidth = 200;
      const oceanGeom = new THREE.PlaneGeometry(oceanWidth, totalZ + 200, 32, 64);
      oceanGeom.rotateX(-Math.PI / 2);
      const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x0077b6,
        roughness: 0.12,
        metalness: 0.88,
      });
      this.oceanMesh = new THREE.Mesh(oceanGeom, oceanMat);
      this.oceanMesh.position.set(18 + oceanWidth / 2, 0.0, totalZ / 2 - 50);
      this.backgroundGroup.add(this.oceanMesh);

      // Surf foam line
      const foamGeom = new THREE.PlaneGeometry(0.8, totalZ);
      foamGeom.rotateX(-Math.PI / 2);
      const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
      const foam = new THREE.Mesh(foamGeom, foamMat);
      foam.position.set(18, 0.02, totalZ / 2 - 50);
      this.backgroundGroup.add(foam);
      return;
    }

    let terrainColor = 0x225533; // Rich deep grass
    let roughness = 0.92;

    switch (this.currentEnv.id) {
      case 'desert_expressway':
        terrainColor = 0xd48c66; // Desert sandstone
        break;
      case 'mountain_road':
        terrainColor = 0x2b3a42; // Alpine slate & dark earth
        break;
      case 'neon_future':
        terrainColor = 0x0f0b1e; // Dark cybernetic substrate
        break;
      case 'sunny_city':
      default:
        terrainColor = 0x274a2b; // Stylized rich city grass
        break;
    }

    const terrainWidth = 360;
    const groundGeom = new THREE.PlaneGeometry(terrainWidth, totalZ, 1, 16);
    groundGeom.rotateX(-Math.PI / 2);
    const groundMat = this.getMaterial(terrainColor, roughness, 0.1);
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.position.set(0, -0.08, totalZ / 2 - 50);
    groundMesh.receiveShadow = true;
    this.backgroundGroup.add(groundMesh);

    // City sidewalks along the road
    if (this.currentEnv.id === 'sunny_city') {
      const swWidth = 6.0;
      const swGeom = new THREE.PlaneGeometry(swWidth, totalZ, 1, 16);
      swGeom.rotateX(-Math.PI / 2);
      const swMat = this.getMaterial(0x94a3b8, 0.75, 0.2); // Concrete pavers

      const swL = new THREE.Mesh(swGeom, swMat);
      swL.position.set(-6 - swWidth / 2, -0.02, totalZ / 2 - 50);
      swL.receiveShadow = true;

      const swR = swL.clone();
      swR.position.x = 6 + swWidth / 2;

      this.backgroundGroup.add(swL, swR);
    }
  }

  private buildGroundSegment(startZ: number, length: number): void {
    const terrainWidth = 360;
    let terrainColor = 0x0f0b1e;
    const groundGeom = new THREE.PlaneGeometry(terrainWidth, length, 1, 4);
    groundGeom.rotateX(-Math.PI / 2);
    const groundMat = this.getMaterial(terrainColor, 0.9, 0.1);
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.position.set(0, -0.08, startZ + length / 2);
    groundMesh.receiveShadow = true;
    (groundMesh as any).maxZ = startZ + length;
    this.backgroundGroup.add(groundMesh);
  }

  // =========================================================================
  // 2. ROAD RECONSTRUCTION (Asphalt, Shoulders, Markings, Barriers)
  // =========================================================================
  private buildRoad(trackLength: number): void {
    const roadLength = trackLength + 200;
    this.buildRoadMesh(0, roadLength);
  }

  private buildRoadSegment(startZ: number, length: number): void {
    this.buildRoadMesh(startZ, length);
  }

  private buildRoadMesh(startZ: number, length: number): void {
    const trackWidth = GAME_CONFIG.TRACK_WIDTH;

    // 1. High-Quality Asphalt Road Surface
    const roadGeom = new THREE.PlaneGeometry(trackWidth, length, 1, 16);
    roadGeom.rotateX(-Math.PI / 2);
    const roadMat = this.getMaterial(this.currentEnv.roadColor, 0.82, 0.18);
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.position.set(0, 0, startZ + length / 2);
    roadMesh.receiveShadow = true;
    (roadMesh as any).maxZ = startZ + length;
    this.roadGroup.add(roadMesh);

    // 2. Beveled Road Curbs with Hazard Striping
    const curbWidth = 0.9;
    const curbHeight = 0.22;
    const curbGeom = new THREE.BoxGeometry(curbWidth, curbHeight, length);
    const curbMat = this.getMaterial(this.currentEnv.shoulderColor, 0.65, 0.2);

    const leftCurb = new THREE.Mesh(curbGeom, curbMat);
    leftCurb.position.set(-trackWidth / 2 - curbWidth / 2, curbHeight / 2, startZ + length / 2);
    leftCurb.receiveShadow = true;

    const rightCurb = leftCurb.clone();
    rightCurb.position.x = trackWidth / 2 + curbWidth / 2;

    (leftCurb as any).maxZ = startZ + length;
    (rightCurb as any).maxZ = startZ + length;
    this.roadGroup.add(leftCurb, rightCurb);

    // 3. Continuous Outer Boundary Lines
    const edgeLineWidth = 0.22;
    const edgeLineGeom = new THREE.PlaneGeometry(edgeLineWidth, length);
    edgeLineGeom.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({ color: this.currentEnv.roadStripeColor });

    const leftEdgeLine = new THREE.Mesh(edgeLineGeom, lineMat);
    leftEdgeLine.position.set(-trackWidth / 2 + edgeLineWidth / 2 + 0.1, 0.015, startZ + length / 2);
    const rightEdgeLine = leftEdgeLine.clone();
    rightEdgeLine.position.x = trackWidth / 2 - edgeLineWidth / 2 - 0.1;

    (leftEdgeLine as any).maxZ = startZ + length;
    (rightEdgeLine as any).maxZ = startZ + length;
    this.roadGroup.add(leftEdgeLine, rightEdgeLine);

    // 4. Inner Dashed Lane Markings (4-lane highway dividers at X = -3.0, 0.0, +3.0)
    const dashLength = 4.2;
    const dashGap = 5.8;
    const dashStep = dashLength + dashGap;
    const dashCount = Math.floor(length / dashStep);
    const dashGeom = new THREE.PlaneGeometry(0.20, dashLength);
    dashGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < dashCount; i++) {
      const z = startZ + i * dashStep + dashLength / 2;

      // Divider 1 (between Lane 0 and 1 at X = -3.0)
      const d1 = new THREE.Mesh(dashGeom, lineMat);
      d1.position.set(-3.0, 0.018, z);
      (d1 as any).maxZ = z;

      // Center divider 2 (between Lane 1 and 2 at X = 0.0)
      const d2 = new THREE.Mesh(dashGeom, lineMat);
      d2.position.set(0.0, 0.018, z);
      (d2 as any).maxZ = z;

      // Divider 3 (between Lane 2 and 3 at X = +3.0)
      const d3 = new THREE.Mesh(dashGeom, lineMat);
      d3.position.set(3.0, 0.018, z);
      (d3 as any).maxZ = z;

      this.roadGroup.add(d1, d2, d3);
    }
  }

  // =========================================================================
  // 3. FOREGROUND: Roadside Safety Barriers, Streetlights, Signage
  // =========================================================================
  private buildForeground(trackLength: number): void {
    const totalZ = trackLength + 150;
    const trackWidth = GAME_CONFIG.TRACK_WIDTH;
    const barrierOffset = trackWidth / 2 + 1.2;

    const barrierInterval = 12;
    const count = Math.floor(totalZ / barrierInterval);

    for (let i = 0; i < count; i++) {
      const z = i * barrierInterval + 6;

      // Streetlights every 36m
      if (i % 3 === 0) {
        const lightL = this.createStreetlight(true);
        lightL.position.set(-barrierOffset - 1.8, 0, z);
        const lightR = this.createStreetlight(false);
        lightR.position.set(barrierOffset + 1.8, 0, z);
        this.foregroundGroup.add(lightL, lightR);
      }

      // Guardrail section
      const railL = this.createGuardrailSection(barrierInterval);
      railL.position.set(-barrierOffset, 0, z);
      const railR = railL.clone();
      railR.position.x = barrierOffset;
      this.foregroundGroup.add(railL, railR);
    }

    // Overhead highway gantries every 85m
    const gantryInterval = 85;
    const numGantries = Math.floor(totalZ / gantryInterval);
    for (let i = 1; i < numGantries; i++) {
      const z = i * gantryInterval;
      const gantry = this.createHighwayGantry(`ZONE ${i} • SPEED 120`, this.currentEnv.name.toUpperCase());
      gantry.position.set(0, 0, z);
      this.foregroundGroup.add(gantry);
    }

    // Roadside highway sign props every 60m
    const signInterval = 60;
    const numSigns = Math.floor(totalZ / signInterval);
    for (let i = 1; i < numSigns; i++) {
      const signGLB = EnvironmentModelCache.getInstance().getModel('highway_sign');
      if (signGLB) {
        signGLB.scale.set(1.2, 1.2, 1.2);
        const z = i * signInterval + 25;
        const side = i % 2 === 0 ? 1 : -1;
        signGLB.position.set(side * (barrierOffset + 2.4), 0, z);
        signGLB.rotation.y = side > 0 ? -Math.PI / 6 : Math.PI / 6;
        this.foregroundGroup.add(signGLB);
      }
    }
  }

  private createGuardrailSection(length: number): THREE.Group {
    const grp = new THREE.Group();
    const metalMat = this.getMaterial(0xb0bec5, 0.35, 0.85);

    // Horizontal W-beam rail
    const railGeom = new THREE.BoxGeometry(0.12, 0.38, length);
    const rail = new THREE.Mesh(railGeom, metalMat);
    rail.position.y = 0.55;
    grp.add(rail);

    // Vertical support posts
    const postGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
    const post1 = new THREE.Mesh(postGeom, metalMat);
    post1.position.set(0, 0.35, -length * 0.35);
    const post2 = post1.clone();
    post2.position.z = length * 0.35;
    grp.add(post1, post2);

    // Reflective amber hazard markers
    const refGeom = new THREE.BoxGeometry(0.14, 0.12, 0.18);
    const refMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const reflector = new THREE.Mesh(refGeom, refMat);
    reflector.position.set(0, 0.55, 0);
    grp.add(reflector);

    return grp;
  }

  private createStreetlight(facingRight: boolean): THREE.Group {
    const glb = EnvironmentModelCache.getInstance().getModel('streetlight');
    if (glb) {
      glb.scale.set(1.35, 1.35, 1.35);
      if (!facingRight) {
        glb.rotation.y = Math.PI;
      }
      return glb;
    }

    const grp = new THREE.Group();
    const poleMat = this.getMaterial(0x455a64, 0.4, 0.7);
    const lampGlowMat = new THREE.MeshBasicMaterial({
      color: this.currentEnv.id === 'neon_future' ? 0x00f0ff : 0xfffae0,
    });

    // Vertical pole
    const height = 7.5;
    const poleGeom = new THREE.CylinderGeometry(0.08, 0.14, height, 8);
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = height / 2;
    grp.add(pole);

    // Overhanging arm
    const armGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
    armGeom.rotateZ(facingRight ? -Math.PI / 4 : Math.PI / 4);
    const arm = new THREE.Mesh(armGeom, poleMat);
    arm.position.set(facingRight ? 0.8 : -0.8, height - 0.4, 0);
    grp.add(arm);

    // Lantern head
    const lanternGeom = new THREE.BoxGeometry(0.65, 0.2, 0.35);
    const lantern = new THREE.Mesh(lanternGeom, poleMat);
    lantern.position.set(facingRight ? 1.6 : -1.6, height + 0.2, 0);

    // Glowing bulb lens
    const bulbGeom = new THREE.PlaneGeometry(0.55, 0.28);
    bulbGeom.rotateX(Math.PI / 2);
    const bulb = new THREE.Mesh(bulbGeom, lampGlowMat);
    bulb.position.set(facingRight ? 1.6 : -1.6, height + 0.08, 0);

    grp.add(lantern, bulb);
    return grp;
  }

  private createHighwayGantry(leftText: string, rightText: string): THREE.Group {
    const grp = new THREE.Group();
    const spanWidth = GAME_CONFIG.TRACK_WIDTH + 6.0;
    const gantryHeight = 7.6;
    const frameMat = this.getMaterial(0x37474f, 0.45, 0.75);

    // Pillars
    const pillarGeom = new THREE.BoxGeometry(0.5, gantryHeight, 0.5);
    const pillarL = new THREE.Mesh(pillarGeom, frameMat);
    pillarL.position.set(-spanWidth / 2, gantryHeight / 2, 0);
    const pillarR = pillarL.clone();
    pillarR.position.x = spanWidth / 2;

    // Cross Truss
    const trussGeom = new THREE.BoxGeometry(spanWidth, 0.5, 0.5);
    const truss = new THREE.Mesh(trussGeom, frameMat);
    truss.position.set(0, gantryHeight, 0);

    // Canvas-textured highway sign generator with texture reuse
    const makeSign = (text: string, subtext: string) => {
      const key = `${text}__${subtext}`;
      let tex = this.signTextureCache.get(key);
      if (!tex) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Highway green background
          ctx.fillStyle = '#15803d';
          ctx.fillRect(0, 0, 512, 160);
          // White border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 8;
          ctx.strokeRect(8, 8, 496, 144);
          // Main text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 44px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 256, 60);
          // Subtext / route info
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 28px sans-serif';
          ctx.fillText(subtext, 256, 115);
        }
        tex = new THREE.CanvasTexture(canvas);
        this.signTextureCache.set(key, tex);
      }
      const signMat = new THREE.MeshBasicMaterial({ map: tex });
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.4), signMat);
      return signMesh;
    };

    const signL = makeSign('NORTH EXPRESS', leftText);
    signL.rotation.y = Math.PI;
    signL.position.set(-spanWidth * 0.24, gantryHeight - 0.75, -0.28);
    const signR = makeSign('CITY CENTER', rightText);
    signR.rotation.y = Math.PI;
    signR.position.set(spanWidth * 0.24, gantryHeight - 0.75, -0.28);

    // Steel backing plate for the signs
    const backingMat = this.getMaterial(0x1e293b, 0.5, 0.5);
    const backingGeom = new THREE.BoxGeometry(5.3, 1.5, 0.1);
    const backL = new THREE.Mesh(backingGeom, backingMat);
    backL.position.set(-spanWidth * 0.24, gantryHeight - 0.75, -0.22);
    const backR = new THREE.Mesh(backingGeom, backingMat);
    backR.position.set(spanWidth * 0.24, gantryHeight - 0.75, -0.22);

    grp.add(pillarL, pillarR, truss, signL, signR, backL, backR);
    return grp;
  }

  // =========================================================================
  // 4. MIDGROUND: Environment-Specific Scenery Architecture
  // =========================================================================
  private buildMidground(trackLength: number): void {
    const totalZ = trackLength + 150;
    const stepZ = 30;
    const numProps = Math.floor(totalZ / stepZ);

    switch (this.currentEnv.id) {
      case 'sunny_city':
        this.buildSunnyCityMidground(numProps, stepZ);
        break;
      case 'coastal_highway':
        this.buildCoastalMidground(totalZ, numProps, stepZ);
        break;
      case 'desert_expressway':
        this.buildDesertMidground(numProps, stepZ);
        break;
      case 'mountain_road':
        this.buildMountainMidground(numProps, stepZ);
        break;
      case 'neon_future':
        this.buildNeonFutureMidground(numProps, stepZ);
        break;
      default:
        this.buildSunnyCityMidground(numProps, stepZ);
    }
  }

  private buildScenerySegment(startZ: number, length: number): void {
    const stepZ = 30;
    const numProps = Math.floor(length / stepZ);
    this.buildNeonFutureMidground(numProps, stepZ, startZ);
  }

  // --- ENVIRONMENT 1: SUNNY CITY ---
  private buildSunnyCityMidground(count: number, stepZ: number): void {
    const colors = [0x3b82f6, 0x0ea5e9, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];

    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 15;
      const heightL = 32 + ((i * 7) % 35);
      const heightR = 28 + (((i + 3) * 9) % 35);
      const colorL = colors[i % colors.length];
      const colorR = colors[(i + 2) % colors.length];

      // Left Skyscraper with window arrays & rooftop architecture (or stylized office tower)
      if (i % 3 === 2) {
        const towerGLB = EnvironmentModelCache.getInstance().getModel('city_office_tower');
        if (towerGLB) {
          const s = 1.9 + ((i % 4) * 0.2);
          towerGLB.scale.set(s, s, s);
          towerGLB.position.set(-28 - ((i * 3) % 8), 0, z);
          this.midgroundGroup.add(towerGLB);
        } else {
          const buildingL = this.createDetailedBuilding(16, heightL, 20, colorL);
          buildingL.position.set(-28 - ((i * 3) % 8), 0, z);
          this.midgroundGroup.add(buildingL);
        }
      } else {
        const buildingL = this.createDetailedBuilding(16, heightL, 20, colorL);
        buildingL.position.set(-28 - ((i * 3) % 8), 0, z);
        this.midgroundGroup.add(buildingL);
      }

      // Right Skyscraper (or stylized office tower)
      if (i % 3 === 1) {
        const towerGLB = EnvironmentModelCache.getInstance().getModel('city_office_tower');
        if (towerGLB) {
          const s = 1.8 + (((i + 2) % 4) * 0.25);
          towerGLB.scale.set(s, s, s);
          towerGLB.position.set(28 + ((i * 4) % 8), 0, z);
          this.midgroundGroup.add(towerGLB);
        } else {
          const buildingR = this.createDetailedBuilding(16, heightR, 20, colorR);
          buildingR.position.set(28 + ((i * 4) % 8), 0, z);
          this.midgroundGroup.add(buildingR);
        }
      } else {
        const buildingR = this.createDetailedBuilding(16, heightR, 20, colorR);
        buildingR.position.set(28 + ((i * 4) % 8), 0, z);
        this.midgroundGroup.add(buildingR);
      }

      // Roadside landscaped trees & street furniture along sidewalk
      if (i % 2 === 0) {
        const treeL = this.createCityTree();
        treeL.position.set(-9.5, 0, z + 8);
        const treeR = this.createCityTree();
        treeR.position.set(9.5, 0, z + 8);
        this.midgroundGroup.add(treeL, treeR);
      }

      // Illuminated Billboard every 60m
      if (i % 3 === 1) {
        const billboard = this.createBillboard(i % 2 === 0 ? 'MOTO RUSH' : 'TURBO BOOST');
        billboard.position.set(i % 2 === 0 ? -16 : 16, 0, z + 15);
        this.midgroundGroup.add(billboard);
      }
    }
  }

  private createDetailedBuilding(w: number, h: number, d: number, color: number): THREE.Group {
    const grp = new THREE.Group();
    const bodyMat = this.getMaterial(color, 0.45, 0.35);
    const trimMat = this.getMaterial(0x1e293b, 0.5, 0.4);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // Illuminated warm yellow windows
    const windowCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Cyan tinted commercial glass

    // Main structural tower
    const bodyGeom = new THREE.BoxGeometry(w, h, d);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    grp.add(body);

    // Architectural Base / Commercial Entrance
    const baseGeom = new THREE.BoxGeometry(w * 1.05, 4.5, d * 1.05);
    const baseMesh = new THREE.Mesh(baseGeom, trimMat);
    baseMesh.position.y = 2.25;
    grp.add(baseMesh);

    // Multi-tier setback top & Spire
    if (h > 35) {
      const topGeom = new THREE.BoxGeometry(w * 0.75, 7.0, d * 0.75);
      const topMesh = new THREE.Mesh(topGeom, bodyMat);
      topMesh.position.y = h + 3.5;
      grp.add(topMesh);

      // Rooftop communications antenna / spire
      const spireGeom = new THREE.CylinderGeometry(0.12, 0.35, 12, 8);
      const spire = new THREE.Mesh(spireGeom, trimMat);
      spire.position.y = h + 13;
      grp.add(spire);
    }

    // Rich Window Arrays across building facades
    const winWidth = 1.4;
    const winHeight = 2.0;
    const winGeom = new THREE.PlaneGeometry(winWidth, winHeight);
    const rows = Math.floor((h - 8) / 4.5);
    const cols = Math.floor((d - 4) / 4.0);

    for (let r = 1; r < rows; r++) {
      const y = 4.5 + r * 4.5;
      const mat = (r % 2 === 0) ? windowMat : windowCyanMat;

      // Windows along the road-facing side
      for (let c = 0; c < cols; c++) {
        const offsetZ = -(d / 2) + 2.5 + c * 4.0;
        const winStreet = new THREE.Mesh(winGeom, mat);
        // Face toward center of road
        winStreet.rotateY(Math.PI / 2);
        winStreet.position.set(w / 2 + 0.05, y, offsetZ);
        grp.add(winStreet);
      }

      // Windows along the front face
      const frontWin = new THREE.Mesh(winGeom, mat);
      frontWin.position.set(0, y, d / 2 + 0.05);
      grp.add(frontWin);
    }

    return grp;
  }

  private createCityTree(): THREE.Group {
    const glb = EnvironmentModelCache.getInstance().getModel('city_tree');
    if (glb) {
      const s = 1.25 + Math.random() * 0.35;
      glb.scale.set(s, s, s);
      glb.rotation.y = Math.random() * Math.PI * 2;
      return glb;
    }

    const grp = new THREE.Group();
    const trunkMat = this.getMaterial(0x5c4033, 0.85, 0.1);
    const foliageMat = this.getMaterial(0x16a34a, 0.65, 0.15);
    const foliageLightMat = this.getMaterial(0x22c55e, 0.65, 0.15);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 3.4, 8), trunkMat);
    trunk.position.y = 1.7;
    trunk.castShadow = true;

    // Organic lush multi-sphere canopy
    const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), foliageMat);
    f1.position.y = 3.8;
    f1.castShadow = true;

    const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), foliageLightMat);
    f2.position.set(0.4, 4.6, 0.2);
    f2.castShadow = true;

    const f3 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), foliageMat);
    f3.position.set(-0.35, 4.4, -0.3);
    f3.castShadow = true;

    grp.add(trunk, f1, f2, f3);
    return grp;
  }

  private createBillboard(text: string): THREE.Group {
    const grp = new THREE.Group();
    const metalMat = this.getMaterial(0x34495e, 0.4, 0.7);

    // Support pylon
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 9.0, 8), metalMat);
    pylon.position.y = 4.5;
    grp.add(pylon);

    // Signboard
    const boardGeom = new THREE.BoxGeometry(7.2, 3.4, 0.4);
    const board = new THREE.Mesh(boardGeom, metalMat);
    board.position.y = 10.5;

    // Canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(16, 16, 480, 224);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 60px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const faceGeom = new THREE.PlaneGeometry(6.8, 3.0);
    const faceMat = new THREE.MeshBasicMaterial({ map: tex });
    const face = new THREE.Mesh(faceGeom, faceMat);
    face.position.set(0, 10.5, 0.22);

    grp.add(board, face);
    return grp;
  }

  // --- ENVIRONMENT 2: COASTAL HIGHWAY ---
  private buildCoastalMidground(totalZ: number, count: number, stepZ: number): void {
    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 12;

      // Left coastal resort villas on hillside
      if (i % 2 === 0) {
        const villa = this.createResortVilla();
        villa.position.set(-26, 0, z);
        this.midgroundGroup.add(villa);
      }

      // Palm trees along both sides
      const palmL = this.createDetailedPalmTree();
      palmL.position.set(-9.8, 0, z);
      this.midgroundGroup.add(palmL);

      const palmR = this.createDetailedPalmTree();
      palmR.position.set(11.5, 0, z + 15);
      this.midgroundGroup.add(palmR);

      // Beach umbrellas on the sandy beach strip
      if (i % 3 === 0) {
        const umbrella = this.createBeachUmbrella(i % 2 === 0 ? 0xef4444 : 0x0284c7);
        umbrella.position.set(13.5, 0, z + 8);
        this.midgroundGroup.add(umbrella);
      }
    }
  }

  private createBeachUmbrella(color: number): THREE.Group {
    const grp = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8),
      this.getMaterial(0xeeeeee, 0.3, 0.8)
    );
    pole.position.y = 1.4;

    const canopyGeom = new THREE.ConeGeometry(1.6, 0.6, 8);
    const canopyMat = this.getMaterial(color, 0.6, 0.1);
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.y = 2.6;
    canopy.castShadow = true;

    grp.add(pole, canopy);
    return grp;
  }

  private createDetailedPalmTree(): THREE.Group {
    const grp = new THREE.Group();
    const trunkMat = this.getMaterial(0x8b5a2b, 0.9, 0.1);
    const leafMat = this.getMaterial(0x15803d, 0.6, 0.2);

    // Curved Trunk with ring segments
    const trunkHeight = 6.8;
    const trunkGeom = new THREE.CylinderGeometry(0.22, 0.38, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.rotation.z = 0.12;
    trunk.castShadow = true;
    grp.add(trunk);

    // 6 Sculpted Fan Palm Fronds
    const frondCount = 6;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frondGeom = new THREE.BoxGeometry(0.7, 0.12, 2.8);
      const frond = new THREE.Mesh(frondGeom, leafMat);
      frond.position.set(
        Math.sin(angle) * 1.2 + 0.4,
        trunkHeight + 0.2,
        Math.cos(angle) * 1.2
      );
      frond.rotation.set(-0.4 * Math.cos(angle), angle, 0.4 * Math.sin(angle));
      frond.castShadow = true;
      grp.add(frond);
    }

    return grp;
  }

  private createResortVilla(): THREE.Group {
    const grp = new THREE.Group();
    const wallMat = this.getMaterial(0xfffdfa, 0.5, 0.2);
    const roofMat = this.getMaterial(0xc2410c, 0.7, 0.2); // Terracotta Spanish tile roof
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // White stucco villa body
    const body = new THREE.Mesh(new THREE.BoxGeometry(14, 7.0, 16), wallMat);
    body.position.y = 3.5;
    body.castShadow = true;

    // Pitched terracotta roof
    const roofGeom = new THREE.ConeGeometry(11.0, 3.8, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 8.9;
    roof.castShadow = true;

    // Balcony window
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), windowMat);
    win.position.set(7.05, 3.5, 0);
    win.rotateY(Math.PI / 2);

    grp.add(body, roof, win);
    return grp;
  }

  // --- ENVIRONMENT 3: DESERT EXPRESSWAY ---
  private buildDesertMidground(count: number, stepZ: number): void {
    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 15;

      // Tiered Canyon Mesas placed at SAFE distance (|x| = 34..50) so road is completely clear!
      const mesaL = this.createCanyonMesa(14 + ((i * 3) % 4), 22 + ((i * 4) % 12));
      mesaL.position.set(-36 - ((i * 4) % 10), 0, z);

      const mesaR = this.createCanyonMesa(15 + (((i + 2) * 3) % 4), 24 + (((i + 1) * 5) % 12));
      mesaR.position.set(36 + ((i * 5) % 10), 0, z);
      this.midgroundGroup.add(mesaL, mesaR);

      // Multi-arm Saguaro Cacti on shoulders
      if (i % 2 === 0) {
        const cactusL = this.createSaguaroCactus();
        cactusL.position.set(-9.8, 0, z + 12);
        this.midgroundGroup.add(cactusL);
      } else {
        const cactusR = this.createSaguaroCactus();
        cactusR.position.set(10.2, 0, z + 8);
        this.midgroundGroup.add(cactusR);
      }

      // Desert Boulders along road shoulder
      const rock = this.createDesertBoulder();
      rock.position.set(i % 2 === 0 ? -9.2 : 9.2, 0, z + 20);
      this.midgroundGroup.add(rock);
    }
  }

  private createCanyonMesa(radius: number, height: number): THREE.Group {
    const grp = new THREE.Group();
    const rockMat = this.getMaterial(0xb85d19, 0.85, 0.15);
    const strataMat = this.getMaterial(0x8b3a0e, 0.9, 0.1);

    // Stepped conical canyon formation (radiusTop, radiusBottom)
    const baseGeom = new THREE.CylinderGeometry(radius * 0.75, radius, height * 0.65, 8);
    const baseMesh = new THREE.Mesh(baseGeom, rockMat);
    baseMesh.position.y = height * 0.325;
    baseMesh.castShadow = true;

    // Upper plateau shelf
    const topGeom = new THREE.CylinderGeometry(radius * 0.5, radius * 0.75, height * 0.35, 8);
    const topMesh = new THREE.Mesh(topGeom, strataMat);
    topMesh.position.y = height * 0.825;
    topMesh.castShadow = true;

    grp.add(baseMesh, topMesh);
    return grp;
  }

  private createSaguaroCactus(): THREE.Group {
    const grp = new THREE.Group();
    const cactusMat = this.getMaterial(0x2d6a4f, 0.75, 0.2);

    // Main Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.24, 0.28, 4.8, 10);
    const trunk = new THREE.Mesh(trunkGeom, cactusMat);
    trunk.position.y = 2.4;
    trunk.castShadow = true;
    grp.add(trunk);

    // Left Arm
    const armLHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.2), cactusMat);
    armLHoriz.position.set(-0.45, 2.5, 0);
    const armLVert = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 8), cactusMat);
    armLVert.position.set(-0.75, 3.1, 0);
    grp.add(armLHoriz, armLVert);

    // Right Arm
    const armRHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.2), cactusMat);
    armRHoriz.position.set(0.45, 1.9, 0);
    const armRVert = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.5, 8), cactusMat);
    armRVert.position.set(0.75, 2.55, 0);
    grp.add(armRHoriz, armRVert);

    return grp;
  }

  private createDesertBoulder(): THREE.Mesh {
    const geom = new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.6, 1);
    const mat = this.getMaterial(0x9a4a15, 0.9, 0.1);
    const rock = new THREE.Mesh(geom, mat);
    rock.position.y = 0.8;
    rock.scale.set(1.4, 0.8, 1.1);
    rock.castShadow = true;
    return rock;
  }

  // --- ENVIRONMENT 4: MOUNTAIN ROAD ---
  private buildMountainMidground(count: number, stepZ: number): void {
    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 15;

      // Layered Alpine Mountain Cliffs placed at SAFE distance (|x| = 38..55)
      const cliffL = this.createMountainPeak(16 + ((i * 3) % 4), 36 + ((i * 5) % 18));
      cliffL.position.set(-38 - ((i * 3) % 10), 0, z);

      const cliffR = this.createMountainPeak(17 + (((i + 2) * 3) % 4), 40 + (((i + 1) * 6) % 18));
      cliffR.position.set(38 + ((i * 4) % 10), 0, z);
      this.midgroundGroup.add(cliffL, cliffR);

      // Dense Pine Trees along the mountain road shoulders
      const pine1 = this.createPineTree(6.5);
      pine1.position.set(-9.8, 0, z + 5);
      const pine2 = this.createPineTree(8.2);
      pine2.position.set(-11.5, 0, z + 12);
      const pine3 = this.createPineTree(7.0);
      pine3.position.set(10.2, 0, z + 8);
      const pine4 = this.createPineTree(8.8);
      pine4.position.set(12.0, 0, z + 18);
      this.midgroundGroup.add(pine1, pine2, pine3, pine4);
    }
  }

  private createMountainPeak(radius: number, height: number): THREE.Group {
    const grp = new THREE.Group();
    const rockMat = this.getMaterial(0x475569, 0.85, 0.2);
    const snowMat = this.getMaterial(0xf8fafc, 0.6, 0.1); // Snowy cap

    // Rocky mountain base
    const baseGeom = new THREE.ConeGeometry(radius, height * 0.8, 6);
    const baseMesh = new THREE.Mesh(baseGeom, rockMat);
    baseMesh.position.y = height * 0.4;
    baseMesh.castShadow = true;

    // Snow-capped summit
    const capGeom = new THREE.ConeGeometry(radius * 0.4, height * 0.35, 6);
    const capMesh = new THREE.Mesh(capGeom, snowMat);
    capMesh.position.y = height * 0.825;

    grp.add(baseMesh, capMesh);
    return grp;
  }

  private createPineTree(height: number): THREE.Group {
    const grp = new THREE.Group();
    const trunkMat = this.getMaterial(0x3e2723, 0.9, 0.1);
    const foliageMat = this.getMaterial(0x14532d, 0.75, 0.15);

    // Pine Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, height * 0.35, 8), trunkMat);
    trunk.position.y = height * 0.175;
    trunk.castShadow = true;
    grp.add(trunk);

    // 3 Layered Cone Foliage tiers
    for (let t = 0; t < 3; t++) {
      const coneR = (3 - t) * 0.85;
      const coneH = height * 0.38;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(coneR, coneH, 7), foliageMat);
      cone.position.y = height * 0.3 + t * height * 0.24;
      cone.castShadow = true;
      grp.add(cone);
    }

    return grp;
  }

  // --- ENVIRONMENT 5: NEON FUTURE CITY ---
  private buildNeonFutureMidground(count: number, stepZ: number, offsetZ: number = 0): void {
    const neonColors = [0x00f0ff, 0xff007f, 0xa855f7, 0x10b981, 0xffd600];

    for (let i = 0; i < count; i++) {
      const z = offsetZ + i * stepZ + 15;
      const height = 38 + ((i * 11) % 36);
      const colorL = neonColors[i % neonColors.length];
      const colorR = neonColors[(i + 2) % neonColors.length];

      // Cyber Monoliths with pulsating neon edges & illuminated window grids
      const monolithL = this.createCyberMonolith(14, height, 18, colorL);
      monolithL.position.set(-26 - ((i * 3) % 8), 0, z);
      (monolithL as any).maxZ = z;

      const monolithR = this.createCyberMonolith(14, height + 6, 18, colorR);
      monolithR.position.set(26 + ((i * 4) % 8), 0, z);
      (monolithR as any).maxZ = z;

      this.midgroundGroup.add(monolithL, monolithR);

      // Overhead holographic cyber bridge every 75m
      if (i % 3 === 0) {
        const bridge = this.createCyberBridge(colorL);
        bridge.position.set(0, 0, z + 12);
        (bridge as any).maxZ = z + 12;
        this.midgroundGroup.add(bridge);
      }
    }
  }

  private createCyberMonolith(w: number, h: number, d: number, neonColor: number): THREE.Group {
    const grp = new THREE.Group();
    const darkMat = this.getMaterial(0x18122b, 0.35, 0.8);
    const glowMat = this.getMaterial(0x222222, 0.2, 0.8, neonColor, 3.5);

    // Tower Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkMat);
    body.position.y = h / 2;
    body.castShadow = true;
    grp.add(body);

    // Vertical neon light strips along the building edges
    const stripGeom = new THREE.BoxGeometry(0.24, h, 0.24);
    const stripL = new THREE.Mesh(stripGeom, glowMat);
    stripL.position.set(-w / 2 + 0.12, h / 2, d / 2 - 0.12);
    const stripR = new THREE.Mesh(stripGeom, glowMat);
    stripR.position.set(w / 2 - 0.12, h / 2, d / 2 - 0.12);
    grp.add(stripL, stripR);

    // Horizontal illuminated neon window strips
    const winStripGeom = new THREE.PlaneGeometry(w * 0.85, 0.6);
    const numStrips = Math.floor(h / 6);
    for (let s = 1; s < numStrips; s++) {
      const winStrip = new THREE.Mesh(winStripGeom, glowMat);
      winStrip.position.set(0, s * 6, d / 2 + 0.05);
      grp.add(winStrip);
    }

    // Animated pulsating holographic advertisement sign
    const signGeom = new THREE.PlaneGeometry(w * 0.75, 4.8);
    const signMat = new THREE.MeshBasicMaterial({
      color: neonColor,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const sign = new THREE.Mesh(signGeom, signMat);
    sign.position.set(0, h * 0.65, d / 2 + 0.15);
    grp.add(sign);

    this.animatedProps.push({
      mesh: sign,
      update: (dt, time) => {
        (sign.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(time * 4.0 + h) * 0.35;
      },
    });

    return grp;
  }

  private createCyberBridge(neonColor: number): THREE.Group {
    const grp = new THREE.Group();
    const width = GAME_CONFIG.TRACK_WIDTH + 8;
    const height = 8.5;
    const frameMat = this.getMaterial(0x18122b, 0.35, 0.85);
    const glowMat = this.getMaterial(0x222222, 0.2, 0.8, neonColor, 3.8);

    // Archway bridge spanning over the highway
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 1.2, 2.5), frameMat);
    beam.position.set(0, height, 0);

    const glowTrim = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 0.22, 2.55), glowMat);
    glowTrim.position.set(0, height - 0.6, 0);

    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1.2, height, 2.5), frameMat);
    pillarL.position.set(-width / 2, height / 2, 0);
    const pillarR = pillarL.clone();
    pillarR.position.x = width / 2;

    grp.add(beam, glowTrim, pillarL, pillarR);
    return grp;
  }

  // =========================================================================
  // 5. BACKGROUND: Distant Mountains, Skylines, Horizon & Clouds
  // =========================================================================
  private buildBackground(trackLength: number): void {
    const totalZ = trackLength + 200;
    const bgDistance = 300;

    // Distant mountain / skyline panoramic backdrop
    const backdropGeom = new THREE.PlaneGeometry(700, 160);
    const backdropColor = this.currentEnv.horizonColor;
    const backdropMat = new THREE.MeshBasicMaterial({
      color: backdropColor,
      fog: true,
    });
    const backdrop = new THREE.Mesh(backdropGeom, backdropMat);
    backdrop.position.set(0, 55, totalZ + bgDistance);
    this.backgroundGroup.add(backdrop);
  }

  private buildClouds(trackLength: number): void {
    if (this.currentEnv.id === 'neon_future') return; // Neon city has night cyber-sky

    const cloudCount = 18;
    const spanZ = trackLength + 400;

    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.82,
    });

    for (let i = 0; i < cloudCount; i++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 3);

      for (let p = 0; p < numPuffs; p++) {
        const puffGeom = new THREE.SphereGeometry(6 + Math.random() * 5, 8, 8);
        const puff = new THREE.Mesh(puffGeom, cloudMat);
        puff.position.set(p * 6 - 9, Math.sin(p) * 2, (Math.random() - 0.5) * 6);
        cloud.add(puff);
      }

      cloud.position.set(
        (Math.random() - 0.5) * 260,
        45 + Math.random() * 25,
        Math.random() * spanZ
      );
      this.cloudsGroup.add(cloud);
    }
  }

  // =========================================================================
  // 6. FINISH LINE SPECTACLE
  // =========================================================================
  private buildFinishLine(trackLength: number): void {
    const width = GAME_CONFIG.TRACK_WIDTH + 3.2;
    const height = 7.2;

    // Gold / Chrome Grand Archway
    const archMat = this.getMaterial(0xffd700, 0.18, 0.95); // Polished gold

    const pillarGeom = new THREE.BoxGeometry(0.8, height, 0.8);
    const leftPillar = new THREE.Mesh(pillarGeom, archMat);
    leftPillar.position.set(-width / 2, height / 2, trackLength);
    leftPillar.castShadow = true;

    const rightPillar = leftPillar.clone();
    rightPillar.position.x = width / 2;

    const beamGeom = new THREE.BoxGeometry(width, 1.0, 1.0);
    const beam = new THREE.Mesh(beamGeom, archMat);
    beam.position.set(0, height, trackLength);
    beam.castShadow = true;

    // Dual Checkered Racing Flags atop the pillars
    const flagL = this.createCheckeredFlag();
    flagL.position.set(-width / 2, height + 1.2, trackLength);
    const flagR = flagL.clone();
    flagR.position.x = width / 2;

    // Checkered Finish Banner
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 256;
    const ctx = bannerCanvas.getContext('2d');

    if (ctx) {
      const checkSize = 32;
      for (let y = 0; y < 256; y += checkSize) {
        for (let x = 0; x < 1024; x += checkSize) {
          ctx.fillStyle = (x / checkSize + y / checkSize) % 2 === 0 ? '#ffffff' : '#111111';
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(60, 40, 1024 - 120, 256 - 80);
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 84px Impact, "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FINISH LINE', 512, 128);
    }

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerGeom = new THREE.PlaneGeometry(width * 0.92, 2.2);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(bannerGeom, bannerMat);
    banner.position.set(0, height - 1.2, trackLength);

    this.finishLineGroup.add(leftPillar, rightPillar, beam, banner, flagL, flagR);
  }

  private createCheckeredFlag(): THREE.Group {
    const grp = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8),
      this.getMaterial(0xeeeeee, 0.2, 0.9)
    );
    pole.position.y = 1.2;

    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 128;
    flagCanvas.height = 128;
    const ctx = flagCanvas.getContext('2d');
    if (ctx) {
      for (let y = 0; y < 128; y += 32) {
        for (let x = 0; x < 128; x += 32) {
          ctx.fillStyle = (x / 32 + y / 32) % 2 === 0 ? '#ffffff' : '#000000';
          ctx.fillRect(x, y, 32, 32);
        }
      }
    }
    const tex = new THREE.CanvasTexture(flagCanvas);
    const flagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.9),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    flagMesh.position.set(0.7, 1.8, 0);

    grp.add(pole, flagMesh);
    return grp;
  }
}
