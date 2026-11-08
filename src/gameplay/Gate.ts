import * as THREE from 'three';
import { GateEffect, GateCalculator } from './GateCalculator';

export class Gate {
  public mesh: THREE.Group;
  public effect: GateEffect;
  public bounds: THREE.Box3 = new THREE.Box3();
  public isTriggered: boolean = false;
  private curtainMesh: THREE.Mesh;
  private signMesh: THREE.Mesh;
  private canvasTexture: THREE.CanvasTexture;
  private pulsePhase: number = Math.random() * Math.PI;

  constructor(effect: GateEffect, width: number = 5.2, height: number = 4.2) {
    this.effect = effect;
    this.mesh = new THREE.Group();
    this.mesh.name = `gate_${effect.operation}_${effect.value}`;

    const isPos = GateCalculator.isPositive(effect);
    const mainColor = isPos ? 0x22c55e : 0xef4444; // Green vs Red
    const frameColor = isPos ? 0x15803d : 0xb91c1c;

    // --- ARCHWAY FRAME ---
    const pillarGeom = new THREE.CylinderGeometry(0.2, 0.2, height, 10);
    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.3,
      metalness: 0.7,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: mainColor,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.8,
    });

    const leftPillar = new THREE.Mesh(pillarGeom, frameMat);
    leftPillar.position.set(-width / 2, height / 2, 0);
    const rightPillar = new THREE.Mesh(pillarGeom, frameMat);
    rightPillar.position.set(width / 2, height / 2, 0);

    const crossbarGeom = new THREE.CylinderGeometry(0.2, 0.2, width, 10);
    crossbarGeom.rotateZ(Math.PI / 2);
    const crossbar = new THREE.Mesh(crossbarGeom, frameMat);
    crossbar.position.set(0, height, 0);

    // Glowing neon trims
    const neonLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, height, 8), glowMat);
    neonLeft.position.set(-width / 2, height / 2, 0.1);
    const neonRight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, height, 8), glowMat);
    neonRight.position.set(width / 2, height / 2, 0.1);
    const neonTop = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, width, 8), glowMat);
    neonTop.rotateZ(Math.PI / 2);
    neonTop.position.set(0, height, 0.1);

    this.mesh.add(leftPillar, rightPillar, crossbar, neonLeft, neonRight, neonTop);

    // --- TRANSLUCENT ENERGY CURTAIN ---
    const curtainGeom = new THREE.PlaneGeometry(width * 0.92, height * 0.88);
    const curtainMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    this.curtainMesh = new THREE.Mesh(curtainGeom, curtainMat);
    this.curtainMesh.position.set(0, height * 0.46, 0);
    this.mesh.add(this.curtainMesh);

    // --- MATH LABEL SIGN WITH HIGH-RES CANVAS TEXTURE ---
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    this.canvasTexture = new THREE.CanvasTexture(canvas);
    this.drawSignCanvas(canvas, isPos);

    const signMat = new THREE.MeshBasicMaterial({
      map: this.canvasTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const signGeom = new THREE.PlaneGeometry(width * 0.75, height * 0.38);
    this.signMesh = new THREE.Mesh(signGeom, signMat);
    this.signMesh.position.set(0, height * 0.58, 0.05);
    this.mesh.add(this.signMesh);

    this.updateBounds();
  }

  private drawSignCanvas(canvas: HTMLCanvasElement, isPositive: boolean): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rounded glowing badge
    ctx.fillStyle = isPositive ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;

    const x = 20;
    const y = 20;
    const w = canvas.width - 40;
    const h = canvas.height - 40;
    const r = 36;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Large high-contrast text
    const text = GateCalculator.formatGateLabel(this.effect);
    ctx.font = '900 110px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(text, canvas.width / 2 + 4, canvas.height / 2 + 6);

    // Foreground
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    this.canvasTexture.needsUpdate = true;
  }

  public update(dt: number): void {
    this.pulsePhase += dt * 3.5;
    const pulse = 0.3 + Math.sin(this.pulsePhase) * 0.12;
    (this.curtainMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
  }

  public updateBounds(): void {
    this.bounds.setFromObject(this.mesh);
  }

  public trigger(): void {
    this.isTriggered = true;
    (this.curtainMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
  }

  public dispose(): void {
    this.canvasTexture.dispose();
  }
}
