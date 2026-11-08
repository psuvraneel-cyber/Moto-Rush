import * as THREE from 'three';
import { EnvironmentConfig, ENVIRONMENTS, GAME_CONFIG } from '../core/GameConfig';

export class EnvironmentManager {
  public group: THREE.Group;
  private currentEnv: EnvironmentConfig;
  private roadGroup: THREE.Group;
  private sceneryGroup: THREE.Group;
  private finishLineGroup: THREE.Group;
  private finishLineZ: number = 500;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'environment_manager';

    this.roadGroup = new THREE.Group();
    this.roadGroup.name = 'road_group';

    this.sceneryGroup = new THREE.Group();
    this.sceneryGroup.name = 'scenery_group';

    this.finishLineGroup = new THREE.Group();
    this.finishLineGroup.name = 'finish_line_group';

    this.group.add(this.roadGroup, this.sceneryGroup, this.finishLineGroup);
    this.currentEnv = ENVIRONMENTS.sunny_city;
  }

  public setEnvironment(envId: string, trackLength: number): void {
    const env = ENVIRONMENTS[envId] || ENVIRONMENTS.sunny_city;
    this.currentEnv = env;
    this.finishLineZ = trackLength;

    this.rebuildEnvironment(trackLength);
  }

  private rebuildEnvironment(trackLength: number): void {
    // Clear previous
    this.clearGroup(this.roadGroup);
    this.clearGroup(this.sceneryGroup);
    this.clearGroup(this.finishLineGroup);

    this.buildRoad(trackLength);
    this.buildScenery(trackLength);
    this.buildFinishLine(trackLength);
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

  private buildRoad(trackLength: number): void {
    const trackWidth = GAME_CONFIG.TRACK_WIDTH;
    const roadLength = trackLength + 150; // Extend past finish line

    // 1. Asphalt Road Plane
    const roadGeom = new THREE.PlaneGeometry(trackWidth, roadLength, 1, 32);
    roadGeom.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: this.currentEnv.roadColor,
      roughness: 0.85,
      metalness: 0.1,
    });
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.position.set(0, 0, roadLength / 2);
    roadMesh.receiveShadow = true;
    this.roadGroup.add(roadMesh);

    // 2. Road Shoulders / Curbs
    const curbWidth = 1.2;
    const curbHeight = 0.25;
    const curbGeom = new THREE.BoxGeometry(curbWidth, curbHeight, roadLength);
    const curbMat = new THREE.MeshStandardMaterial({
      color: this.currentEnv.shoulderColor,
      roughness: 0.7,
    });

    const leftCurb = new THREE.Mesh(curbGeom, curbMat);
    leftCurb.position.set(-trackWidth / 2 - curbWidth / 2, curbHeight / 2, roadLength / 2);
    leftCurb.receiveShadow = true;

    const rightCurb = leftCurb.clone();
    rightCurb.position.x = trackWidth / 2 + curbWidth / 2;

    this.roadGroup.add(leftCurb, rightCurb);

    // 3. Dashed Lane Markings
    const dashLength = 4.0;
    const dashGap = 6.0;
    const dashStep = dashLength + dashGap;
    const dashCount = Math.floor(roadLength / dashStep);

    const stripeMat = new THREE.MeshBasicMaterial({ color: this.currentEnv.roadStripeColor });
    const dashGeom = new THREE.PlaneGeometry(0.24, dashLength);
    dashGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < dashCount; i++) {
      const z = i * dashStep + dashLength / 2;

      // Center dash
      const dashCenter = new THREE.Mesh(dashGeom, stripeMat);
      dashCenter.position.set(0, 0.02, z);
      this.roadGroup.add(dashCenter);

      // Left lane divider
      const dashLeft = new THREE.Mesh(dashGeom, stripeMat);
      dashLeft.position.set(-trackWidth / 4, 0.02, z);
      this.roadGroup.add(dashLeft);

      // Right lane divider
      const dashRight = new THREE.Mesh(dashGeom, stripeMat);
      dashRight.position.set(trackWidth / 4, 0.02, z);
      this.roadGroup.add(dashRight);
    }
  }

  private buildScenery(trackLength: number): void {
    const totalZ = trackLength + 100;
    const stepZ = 35;
    const numProps = Math.floor(totalZ / stepZ);

    switch (this.currentEnv.id) {
      case 'sunny_city':
        this.buildCityProps(numProps, stepZ);
        break;
      case 'coastal_highway':
        this.buildCoastalProps(totalZ, numProps, stepZ);
        break;
      case 'desert_expressway':
        this.buildDesertProps(numProps, stepZ);
        break;
      case 'mountain_road':
        this.buildMountainProps(numProps, stepZ);
        break;
      case 'neon_future':
        this.buildNeonProps(numProps, stepZ);
        break;
      default:
        this.buildCityProps(numProps, stepZ);
    }
  }

  private buildCityProps(count: number, stepZ: number): void {
    const buildingGeom = new THREE.BoxGeometry(14, 30, 20);

    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 15;
      const heightL = 20 + Math.random() * 35;
      const heightR = 20 + Math.random() * 35;

      const colorL = this.currentEnv.propColors[i % this.currentEnv.propColors.length];
      const colorR = this.currentEnv.propColors[(i + 2) % this.currentEnv.propColors.length];

      // Left skyscraper
      const meshL = new THREE.Mesh(
        buildingGeom,
        new THREE.MeshStandardMaterial({ color: colorL, roughness: 0.4 })
      );
      meshL.scale.set(1, heightL / 30, 1);
      meshL.position.set(-20 - Math.random() * 6, heightL / 2, z);
      meshL.castShadow = true;
      this.sceneryGroup.add(meshL);

      // Right skyscraper
      const meshR = new THREE.Mesh(
        buildingGeom,
        new THREE.MeshStandardMaterial({ color: colorR, roughness: 0.4 })
      );
      meshR.scale.set(1, heightR / 30, 1);
      meshR.position.set(20 + Math.random() * 6, heightR / 2, z);
      meshR.castShadow = true;
      this.sceneryGroup.add(meshR);
    }
  }

  private buildCoastalProps(totalZ: number, count: number, stepZ: number): void {
    // Ocean plane on the right
    const oceanGeom = new THREE.PlaneGeometry(80, totalZ);
    oceanGeom.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0077b6,
      roughness: 0.1,
      metalness: 0.8,
    });
    const ocean = new THREE.Mesh(oceanGeom, oceanMat);
    ocean.position.set(50, -0.2, totalZ / 2);
    this.sceneryGroup.add(ocean);

    // Palm trees
    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 10;
      const palm = this.createPalmTree();
      palm.position.set(-10, 0, z);
      this.sceneryGroup.add(palm);

      if (i % 2 === 0) {
        const palmR = this.createPalmTree();
        palmR.position.set(9, 0, z + 15);
        this.sceneryGroup.add(palmR);
      }
    }
  }

  private createPalmTree(): THREE.Group {
    const grp = new THREE.Group();
    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.25, 0.4, 7, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 3.5;
    trunk.rotation.z = 0.1;
    grp.add(trunk);

    // Leaves
    const leafGeom = new THREE.ConeGeometry(2.5, 1.2, 5);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.6 });
    const leaf = new THREE.Mesh(leafGeom, leafMat);
    leaf.position.set(0.3, 7.0, 0);
    grp.add(leaf);
    return grp;
  }

  private buildDesertProps(count: number, stepZ: number): void {
    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 15;
      // Red rock canyon mesa
      const mesaGeom = new THREE.ConeGeometry(10 + Math.random() * 6, 18, 5);
      const mesaMat = new THREE.MeshStandardMaterial({ color: 0xb85d19, roughness: 0.9 });
      const mesaL = new THREE.Mesh(mesaGeom, mesaMat);
      mesaL.position.set(-20 - Math.random() * 8, 9, z);
      const mesaR = new THREE.Mesh(mesaGeom, mesaMat);
      mesaR.position.set(20 + Math.random() * 8, 9, z);
      this.sceneryGroup.add(mesaL, mesaR);

      // Saguaro cactus
      if (i % 2 === 0) {
        const cactus = this.createCactus();
        cactus.position.set(-9, 0, z + 10);
        this.sceneryGroup.add(cactus);
      }
    }
  }

  private createCactus(): THREE.Group {
    const grp = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x386641, roughness: 0.7 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4.5, 8), mat);
    trunk.position.y = 2.25;
    grp.add(trunk);
    return grp;
  }

  private buildMountainProps(count: number, stepZ: number): void {
    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 20;
      // Pine tree
      const pineGeom = new THREE.ConeGeometry(2.8, 8, 6);
      const pineMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 });
      const pineL = new THREE.Mesh(pineGeom, pineMat);
      pineL.position.set(-11 - Math.random() * 4, 4, z);
      const pineR = new THREE.Mesh(pineGeom, pineMat);
      pineR.position.set(11 + Math.random() * 4, 4, z);
      this.sceneryGroup.add(pineL, pineR);
    }
  }

  private buildNeonProps(count: number, stepZ: number): void {
    for (let i = 0; i < count; i++) {
      const z = i * stepZ + 15;
      // Cyber monolith with neon strips
      const height = 30 + Math.random() * 25;
      const bGeom = new THREE.BoxGeometry(8, height, 8);
      const bMat = new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.3 });
      const bL = new THREE.Mesh(bGeom, bMat);
      bL.position.set(-18, height / 2, z);

      // Neon glowing line
      const neonStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, height, 0.2),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      neonStrip.position.set(-13.8, height / 2, z);

      const bR = new THREE.Mesh(bGeom, bMat);
      bR.position.set(18, height / 2, z);
      const neonStripR = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, height, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xff007f })
      );
      neonStripR.position.set(13.8, height / 2, z);

      this.sceneryGroup.add(bL, neonStrip, bR, neonStripR);
    }
  }

  private buildFinishLine(trackLength: number): void {
    const width = GAME_CONFIG.TRACK_WIDTH + 2;
    const height = 6.0;

    // Archway Pillars
    const pillarGeom = new THREE.BoxGeometry(0.6, height, 0.6);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
    });
    const leftPillar = new THREE.Mesh(pillarGeom, goldMat);
    leftPillar.position.set(-width / 2, height / 2, trackLength);
    const rightPillar = leftPillar.clone();
    rightPillar.position.x = width / 2;

    // Crossbeam
    const beamGeom = new THREE.BoxGeometry(width, 0.8, 0.8);
    const beam = new THREE.Mesh(beamGeom, goldMat);
    beam.position.set(0, height, trackLength);

    // Checkered Finish Banner
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const ctx = bannerCanvas.getContext('2d');

    if (ctx) {
      // Checkered pattern
      const checkSize = 32;
      for (let y = 0; y < bannerCanvas.height; y += checkSize) {
        for (let x = 0; x < bannerCanvas.width; x += checkSize) {
          ctx.fillStyle = ((x / checkSize + y / checkSize) % 2 === 0) ? '#ffffff' : '#000000';
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }

      // Bold text banner
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(40, 20, bannerCanvas.width - 80, bannerCanvas.height - 40);
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 48px Impact, Arial Black, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FINISH LINE', bannerCanvas.width / 2, bannerCanvas.height / 2);
    }

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerGeom = new THREE.PlaneGeometry(width * 0.9, 1.8);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(bannerGeom, bannerMat);
    banner.position.set(0, height - 1.0, trackLength);

    this.finishLineGroup.add(leftPillar, rightPillar, beam, banner);
  }
}
