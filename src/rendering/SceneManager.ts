import * as THREE from 'three';
import { Lighting } from './Lighting';
import { EnvironmentManager } from './EnvironmentManager';
import { CameraController } from './CameraController';
import { Renderer } from './Renderer';
import { EnvironmentConfig, ENVIRONMENTS } from '../core/GameConfig';

export class SceneManager {
  public scene: THREE.Scene;
  public renderer: Renderer;
  public cameraController: CameraController;
  public lighting: Lighting;
  public environmentManager: EnvironmentManager;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.renderer = new Renderer(canvas);
    this.cameraController = new CameraController();
    this.lighting = new Lighting();
    this.environmentManager = new EnvironmentManager();

    this.scene.add(this.lighting.group);
    this.scene.add(this.environmentManager.group);

    this.applyEnvironment(ENVIRONMENTS.sunny_city.id, 500);
  }

  public applyEnvironment(envId: string, trackLength: number, isEndless: boolean = false): void {
    const env: EnvironmentConfig = ENVIRONMENTS[envId] || ENVIRONMENTS.sunny_city;
    this.scene.background = new THREE.Color(env.skyColor);
    this.scene.fog = new THREE.Fog(env.fogColor, env.fogNear, env.fogFar);

    this.lighting.updateForEnvironment(env);
    this.environmentManager.setEnvironment(env.id, trackLength, isEndless);
  }

  public update(dt: number, playerZ: number): void {
    this.environmentManager.update(dt, playerZ);
  }

  public render(): void {
    this.renderer.render(this.scene, this.cameraController.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
    this.cameraController.dispose();
  }
}
