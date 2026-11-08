import * as THREE from 'three';
import { FormationSlot } from './FormationController';
import { GAME_CONFIG } from '../core/GameConfig';

export class FleetRenderer {
  public group: THREE.Group;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private maxInstances: number;
  private currentPrimaryColor: number = 0xef233c;

  constructor(maxInstances: number = GAME_CONFIG.MAX_RENDERED_FOLLOWERS) {
    this.maxInstances = maxInstances;
    this.group = new THREE.Group();
    this.group.name = 'fleet_convoy';
    this.buildInstancedMesh();
  }

  public setMaxInstances(count: number): void {
    if (count === this.maxInstances) return;
    this.maxInstances = count;
    this.buildInstancedMesh();
  }

  public setColor(primaryColor: number): void {
    this.currentPrimaryColor = primaryColor;
    if (this.instancedMesh) {
      const mat = this.instancedMesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(primaryColor);
    }
  }

  private buildInstancedMesh(): void {
    if (this.instancedMesh) {
      this.group.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
      this.instancedMesh = null;
    }

    // Stylized low-poly motorcycle follower geometry
    // Merge body box, wheels, fork into a single lightweight geometry
    const geometries: THREE.BufferGeometry[] = [];

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.34, 0.44, 1.1);
    bodyGeom.translate(0, 0.52, 0);
    geometries.push(bodyGeom);

    // Front Wheel
    const wheelRadius = 0.38;
    const fwGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.16, 10);
    fwGeom.rotateZ(Math.PI / 2);
    fwGeom.translate(0, wheelRadius, 0.65);
    geometries.push(fwGeom);

    // Rear Wheel
    const rwGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.16, 10);
    rwGeom.rotateZ(Math.PI / 2);
    rwGeom.translate(0, wheelRadius, -0.65);
    geometries.push(rwGeom);

    // Rider Torso + Helmet
    const riderGeom = new THREE.BoxGeometry(0.28, 0.42, 0.26);
    riderGeom.translate(0, 0.88, -0.05);
    geometries.push(riderGeom);

    const helmetGeom = new THREE.SphereGeometry(0.16, 8, 8);
    helmetGeom.translate(0, 1.15, 0.05);
    geometries.push(helmetGeom);

    // Combine into single geometry
    // Custom merge without requiring full BufferGeometryUtils
    const combinedGeom = this.mergeGeometries(geometries);

    const material = new THREE.MeshStandardMaterial({
      color: this.currentPrimaryColor,
      roughness: 0.4,
      metalness: 0.5,
    });

    this.instancedMesh = new THREE.InstancedMesh(combinedGeom, material, this.maxInstances);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.count = 0;

    this.group.add(this.instancedMesh);
  }

  private mergeGeometries(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
    let totalVertices = 0;
    let totalIndices = 0;

    for (const g of geoms) {
      totalVertices += g.attributes.position.count;
      if (g.index) totalIndices += g.index.count;
    }

    const posArray = new Float32Array(totalVertices * 3);
    const normArray = new Float32Array(totalVertices * 3);
    const indexArray = totalIndices > 0 ? new Uint32Array(totalIndices) : null;

    let vOffset = 0;
    let iOffset = 0;
    let vertexCountAccum = 0;

    for (const g of geoms) {
      const pos = g.attributes.position;
      const norm = g.attributes.normal || pos; // fallback

      for (let i = 0; i < pos.count * 3; i++) {
        posArray[vOffset + i] = pos.array[i];
        normArray[vOffset + i] = norm.array[i];
      }

      if (g.index && indexArray) {
        for (let i = 0; i < g.index.count; i++) {
          indexArray[iOffset + i] = g.index.array[i] + vertexCountAccum;
        }
        iOffset += g.index.count;
      }

      vOffset += pos.count * 3;
      vertexCountAccum += pos.count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
    if (indexArray) {
      merged.setIndex(new THREE.BufferAttribute(indexArray, 1));
    }
    return merged;
  }

  public update(heroPos: THREE.Vector3, slots: FormationSlot[], lean: number): void {
    if (!this.instancedMesh) return;

    const visibleCount = Math.min(slots.length, this.maxInstances);
    this.instancedMesh.count = visibleCount;

    for (let i = 0; i < visibleCount; i++) {
      const slot = slots[i];
      const worldX = heroPos.x + slot.targetOffsetX;
      const worldY = heroPos.y + slot.targetOffsetY;
      const worldZ = heroPos.z + slot.targetOffsetZ;

      this.dummy.position.set(worldX, worldY, worldZ);
      this.dummy.rotation.set(0, lean * 0.2, -lean * 0.8);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public clear(): void {
    if (this.instancedMesh) {
      this.instancedMesh.count = 0;
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }
}
