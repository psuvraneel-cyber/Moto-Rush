import * as THREE from 'three';
import { GAME_CONFIG } from '../core/GameConfig';

export class Renderer {
  public webglRenderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.webglRenderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.webglRenderer.outputColorSpace = THREE.SRGBColorSpace;
    this.webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.webglRenderer.toneMappingExposure = 1.05;

    this.applyQualityPreset('high');
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  public applyQualityPreset(presetKey: 'low' | 'medium' | 'high'): void {
    const preset = GAME_CONFIG.GRAPHICS_PRESETS[presetKey];
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));

    if (preset.shadows) {
      this.webglRenderer.shadowMap.enabled = true;
      this.webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      this.webglRenderer.shadowMap.enabled = false;
    }
  }

  public handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.webglRenderer.setSize(width, height, false);
  };

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.webglRenderer.render(scene, camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.webglRenderer.dispose();
  }
}
