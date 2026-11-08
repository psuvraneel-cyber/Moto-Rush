import * as THREE from 'three';
import { EnvironmentConfig } from '../core/GameConfig';

export class Lighting {
  public group: THREE.Group;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public ambientLight: THREE.AmbientLight;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'scene_lighting';

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.dirLight.position.set(25, 45, -20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 120;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -20;
    this.dirLight.shadow.bias = -0.0005;

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.9);
    this.hemiLight.position.set(0, 50, 0);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    this.group.add(this.dirLight, this.hemiLight, this.ambientLight);
  }

  public updateForEnvironment(env: EnvironmentConfig): void {
    this.dirLight.color.setHex(env.sunColor);
    this.hemiLight.color.setHex(env.skyColor);
    this.hemiLight.groundColor.setHex(env.ambientColor);
    this.ambientLight.color.setHex(env.ambientColor);
  }

  public update(playerZ: number): void {
    // Keep directional light centered near the player along Z
    this.dirLight.position.z = playerZ - 20;
    this.dirLight.target.position.set(0, 0, playerZ + 15);
    this.dirLight.target.updateMatrixWorld();
  }
}
