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

    this.fillLight = new THREE.DirectionalLight(0xddeeff, 0.65);
    this.fillLight.position.set(-25, 30, 20);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    this.group.add(this.dirLight, this.dirLight.target, this.fillLight, this.hemiLight, this.ambientLight);
  }

  public fillLight: THREE.DirectionalLight;

  public updateForEnvironment(env: EnvironmentConfig): void {
    this.dirLight.color.setHex(env.sunColor);
    this.hemiLight.color.setHex(env.skyColor);
    this.hemiLight.groundColor.setHex(env.ambientColor);
    this.ambientLight.color.setHex(env.ambientColor);

    if (env.id === 'neon_future') {
      this.dirLight.intensity = 1.8;
      this.dirLight.color.setHex(0x00f0ff);
      this.fillLight.intensity = 2.0;
      this.fillLight.color.setHex(0xff007f); // Magenta cyber rim
      this.ambientLight.intensity = 0.85;
      this.ambientLight.color.setHex(0x581c87);
    } else if (env.id === 'coastal_highway') {
      this.dirLight.intensity = 2.6;
      this.fillLight.intensity = 1.0;
      this.fillLight.color.setHex(0xffedd5); // Golden coastal fill
      this.ambientLight.intensity = 0.55;
    } else if (env.id === 'desert_expressway') {
      this.dirLight.intensity = 2.7;
      this.fillLight.intensity = 0.95;
      this.fillLight.color.setHex(0xfed7aa);
      this.ambientLight.intensity = 0.5;
    } else if (env.id === 'mountain_road') {
      this.dirLight.intensity = 2.4;
      this.fillLight.intensity = 0.85;
      this.fillLight.color.setHex(0xc7d2fe);
      this.ambientLight.intensity = 0.45;
    } else {
      this.dirLight.intensity = 2.5;
      this.fillLight.intensity = 0.85;
      this.fillLight.color.setHex(0xe0f2fe);
      this.ambientLight.intensity = 0.5;
    }
  }

  public update(playerZ: number): void {
    // Keep directional lights centered near the player along Z
    this.dirLight.position.z = playerZ - 20;
    this.dirLight.target.position.set(0, 0, playerZ + 15);
    this.dirLight.target.updateMatrixWorld();

    this.fillLight.position.z = playerZ + 25;
  }
}
