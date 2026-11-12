import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MotorcycleMeshResult, MotorcycleModels } from '../player/MotorcycleModels';
import { MotorcycleInfo } from '../progression/GarageManager';

export class AssetLoader {
  private static instance: AssetLoader;
  private gltfLoader: GLTFLoader;
  private modelCache: Map<string, THREE.Group> = new Map();

  public static readonly ASSET_PACK_V1_PATH = '/assets/generated/moto-rush-v1/models/';

  private constructor() {
    this.gltfLoader = new GLTFLoader();
  }

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * Helper to load starter pack rider model
   */
  public async loadRiderModel(): Promise<THREE.Group | null> {
    return this.loadGLTF(`${AssetLoader.ASSET_PACK_V1_PATH}rider/racing_rider.glb`);
  }

  /**
   * Helper to load starter pack traffic vehicles
   */
  public async loadTrafficModel(
    type: 'sedan' | 'sports_car' | 'suv' | 'van' | 'bus' | 'truck'
  ): Promise<THREE.Group | null> {
    return this.loadGLTF(`${AssetLoader.ASSET_PACK_V1_PATH}traffic/${type}.glb`);
  }

  /**
   * Helper to load starter pack obstacle models
   */
  public async loadObstacleModel(
    type: 'traffic_cone' | 'road_barrier' | 'traffic_barrel' | 'construction_roadblock' | 'road_debris'
  ): Promise<THREE.Group | null> {
    return this.loadGLTF(`${AssetLoader.ASSET_PACK_V1_PATH}obstacles/${type}.glb`);
  }

  /**
   * Helper to load starter pack environment models
   */
  public async loadEnvironmentModel(
    type: 'streetlight' | 'city_tree' | 'highway_sign' | 'city_office_tower'
  ): Promise<THREE.Group | null> {
    return this.loadGLTF(`${AssetLoader.ASSET_PACK_V1_PATH}environment/${type}.glb`);
  }

  /**
   * Asynchronously load a GLTF/GLB model from URL
   */
  public async loadGLTF(url: string): Promise<THREE.Group | null> {
    if (this.modelCache.has(url)) {
      return this.modelCache.get(url)!.clone();
    }

    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.modelCache.set(url, gltf.scene);
          resolve(gltf.scene.clone());
        },
        undefined,
        (error) => {
          if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
            console.warn(`[AssetLoader] Model could not be loaded from ${url}:`, error);
          }
          resolve(null);
        }
      );
    });
  }

  /**
   * Adapt a loaded GLB model into a MotorcycleMeshResult with frontWheel, rearWheel, chassis, and rider
   */
  public adaptMotorcycleModel(
    loadedGroup: THREE.Group,
    info: MotorcycleInfo,
    riderMeshOverride?: THREE.Object3D
  ): MotorcycleMeshResult {
    const root = new THREE.Group();
    root.name = `motorcycle_glb_${info.id}`;

    const chassis = new THREE.Group();
    chassis.name = 'chassis';
    root.add(chassis);

    let frontWheel: THREE.Object3D | null = null;
    let rearWheel: THREE.Object3D | null = null;
    let chassisGroup: THREE.Object3D | null = null;
    let riderRoot: THREE.Object3D | null = null;
    let lightingGroup: THREE.Object3D | null = null;
    let steering: THREE.Object3D | null = null;
    const emissives: THREE.Material[] = [];

    // Traverse and categorize components
    loadedGroup.traverse((child) => {
      const name = child.name.toLowerCase();

      // Configure shadows and PBR properties
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material;
        if (mat) {
          if (Array.isArray(mat)) {
            for (const m of mat) {
              const std = m as THREE.MeshStandardMaterial;
              if (std.emissive && (std.emissive.getHex() > 0 || std.emissiveIntensity > 0)) {
                emissives.push(m);
              }
            }
          } else {
            const std = mat as THREE.MeshStandardMaterial;
            if (std.emissive && (std.emissive.getHex() > 0 || std.emissiveIntensity > 0)) {
              emissives.push(mat);
            }
          }
        }
      }

      // Categorize glTF child nodes
      if (
        !frontWheel &&
        (name === 'frontwheelpivot' ||
          name.includes('frontwheel') ||
          name.includes('front_wheel') ||
          name.includes('wheel_front') ||
          name === 'wheel_f' ||
          name === 'wheel.f')
      ) {
        frontWheel = child;
      } else if (
        !rearWheel &&
        (name === 'rearwheelpivot' ||
          name.includes('rearwheel') ||
          name.includes('rear_wheel') ||
          name.includes('wheel_rear') ||
          name.includes('backwheel') ||
          name === 'wheel_r' ||
          name === 'wheel.r')
      ) {
        rearWheel = child;
      } else if (
        !chassisGroup &&
        (name === 'chassisgroup' ||
          name === 'chassis' ||
          name.includes('mainbody'))
      ) {
        chassisGroup = child;
      } else if (
        !riderRoot &&
        (name === 'riderroot' ||
          name.includes('rider') ||
          name.includes('biker') ||
          name.includes('driver'))
      ) {
        riderRoot = child;
      } else if (
        !lightingGroup &&
        (name === 'lightingcomponents' ||
          name.includes('lighting'))
      ) {
        lightingGroup = child;
      } else if (
        !steering &&
        (name.includes('steering') ||
          name.includes('front_fork') ||
          name.includes('fork') ||
          name.includes('handlebar'))
      ) {
        steering = child;
      }
    });

    // Enforce road ground contact at Y = 0.0m
    loadedGroup.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(loadedGroup);
    if (isFinite(bbox.min.y) && Math.abs(bbox.min.y) > 0.0001) {
      loadedGroup.position.y -= bbox.min.y;
    }

    // Attach loaded GLB group into chassis
    chassis.add(loadedGroup);

    // If wheels were not detected, create defensive anchors
    const wheelRadius = 0.42;
    const wheelbase = 1.48;
    if (!frontWheel) {
      frontWheel = new THREE.Object3D();
      frontWheel.name = 'frontWheel_anchor';
      frontWheel.position.set(0, wheelRadius, wheelbase * 0.55);
      chassis.add(frontWheel);
    }
    if (!rearWheel) {
      rearWheel = new THREE.Object3D();
      rearWheel.name = 'rearWheel_anchor';
      rearWheel.position.set(0, wheelRadius, -wheelbase * 0.55);
      chassis.add(rearWheel);
    }

    // Ensure riderRoot exists (either parsed from GLB or defensive anchor)
    if (!riderRoot) {
      riderRoot = new THREE.Group();
      riderRoot.name = 'RiderRoot';
      riderRoot.position.set(0, 0.65, -0.05);
      chassis.add(riderRoot);
    }

    // Mount stylized rider if GLB does not include a pilot mesh
    let hasRiderMesh = false;
    riderRoot.traverse((c: THREE.Object3D) => {
      if ((c as THREE.Mesh).isMesh) {
        hasRiderMesh = true;
      }
    });

    let rider: THREE.Object3D;
    if (hasRiderMesh) {
      rider = riderRoot;
    } else if (riderMeshOverride) {
      riderMeshOverride.name = 'stylized_rider_mount';
      riderMeshOverride.position.set(0, 0, 0);
      riderMeshOverride.rotation.set(0, 0, 0);
      riderMeshOverride.scale.set(1, 1, 1);
      riderRoot.add(riderMeshOverride);
      rider = riderMeshOverride;
    } else {
      const stylizedRider = MotorcycleModels.createStylizedRider(
        info.primaryColor,
        info.secondaryColor,
        wheelRadius,
        wheelbase,
        false
      );
      stylizedRider.name = 'stylized_rider_mount';
      stylizedRider.position.set(0, 0, 0);
      stylizedRider.rotation.set(0, 0, 0);
      stylizedRider.scale.set(1, 1, 1);
      riderRoot.add(stylizedRider);
      rider = stylizedRider;
    }

    return {
      group: root,
      frontWheel,
      rearWheel,
      chassis,
      rider,
      riderRoot,
      steering: steering || undefined,
      emissives,
    };
  }
}
