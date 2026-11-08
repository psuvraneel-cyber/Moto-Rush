import { GAME_CONFIG } from '../core/GameConfig';
import { MathUtils } from '../utilities/MathUtils';
import { Motorcycle } from './Motorcycle';

export class PlayerController {
  private motorcycle: Motorcycle;
  private currentX: number = 0;
  private currentZ: number = 0;
  private targetX: number = 0;
  private lateralVelocity: number = 0;
  private forwardSpeed: number = GAME_CONFIG.BASE_SPEED;
  private turboMultiplier: number = 1.0;
  private isTurboActive: boolean = false;
  private isOilSlicked: boolean = false;
  private oilSlickTimer: number = 0;
  private oilSlickDriftDir: number = 1;

  // Input states
  private keyLeft: boolean = false;
  private keyRight: boolean = false;
  private isPointerDown: boolean = false;
  private pointerStartX: number = 0;
  private pointerCurrentX: number = 0;
  private sensitivity: number = 1.0;

  constructor(motorcycle: Motorcycle) {
    this.motorcycle = motorcycle;
    this.setupInputs();
  }

  public setSensitivity(val: number): void {
    this.sensitivity = MathUtils.clamp(val, 0.5, 2.5);
  }

  public get x(): number {
    return this.currentX;
  }

  public get z(): number {
    return this.currentZ;
  }

  public get speed(): number {
    return this.forwardSpeed * this.turboMultiplier;
  }

  public get lean(): number {
    return this.motorcycle.lean;
  }

  public setTurbo(active: boolean): void {
    this.isTurboActive = active;
    this.turboMultiplier = active ? GAME_CONFIG.TURBO_SPEED_MULTIPLIER : 1.0;
  }

  public applyOilSlick(duration: number = GAME_CONFIG.DAMAGE.OIL_SLICK_TIME): void {
    this.isOilSlicked = true;
    this.oilSlickTimer = duration;
    this.oilSlickDriftDir = Math.random() > 0.5 ? 1 : -1;
  }

  public reset(startX: number = 0, startZ: number = 0): void {
    this.currentX = startX;
    this.currentZ = startZ;
    this.targetX = startX;
    this.lateralVelocity = 0;
    this.isTurboActive = false;
    this.turboMultiplier = 1.0;
    this.isOilSlicked = false;
    this.oilSlickTimer = 0;
    this.keyLeft = false;
    this.keyRight = false;
    this.isPointerDown = false;
    this.motorcycle.reset(startX, startZ);
  }

  public update(dt: number): void {
    // 1. Process directional steering input
    let steerDir = 0;
    if (this.keyLeft) steerDir -= 1;
    if (this.keyRight) steerDir += 1;

    // Pointer / touch drag steering delta
    if (this.isPointerDown) {
      const deltaScreenX = (this.pointerCurrentX - this.pointerStartX) / (window.innerWidth * 0.25);
      steerDir += MathUtils.clamp(deltaScreenX, -1.5, 1.5);
    }

    // Handle oil slick reduced handling & wobble
    let effectiveSteerSpeed = GAME_CONFIG.LATERAL_SPEED * this.sensitivity;
    if (this.isOilSlicked) {
      this.oilSlickTimer -= dt;
      if (this.oilSlickTimer <= 0) {
        this.isOilSlicked = false;
      } else {
        effectiveSteerSpeed *= 0.4;
        steerDir += this.oilSlickDriftDir * 0.45;
      }
    }

    // Update target lateral position
    this.targetX += steerDir * effectiveSteerSpeed * dt;
    this.targetX = MathUtils.clamp(
      this.targetX,
      -GAME_CONFIG.MAX_LATERAL_OFFSET,
      GAME_CONFIG.MAX_LATERAL_OFFSET
    );

    // Damped interpolation to currentX
    const prevX = this.currentX;
    this.currentX = MathUtils.damp(this.currentX, this.targetX, 18, dt);
    this.lateralVelocity = (this.currentX - prevX) / Math.max(dt, 0.001);

    // Forward movement
    this.currentZ += this.speed * dt;

    // Lean calculation: normalized lateral velocity -> lean angle
    const normalizedLateral = MathUtils.clamp(
      this.lateralVelocity / GAME_CONFIG.LATERAL_SPEED,
      -1,
      1
    );
    const targetLean = normalizedLateral * GAME_CONFIG.LEAN_ANGLE;

    // Update motorcycle mesh
    this.motorcycle.mesh.position.set(this.currentX, 0, this.currentZ);
    this.motorcycle.update(dt, this.speed, targetLean);
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.keyLeft = true;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.keyRight = true;
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.keyLeft = false;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.keyRight = false;
      }
    });

    // Pointer / mouse drag events
    window.addEventListener('pointerdown', (e: PointerEvent) => {
      // Don't capture pointer if clicking on interactive UI buttons
      const target = e.target as HTMLElement;
      if (target && target.closest('.ui-interactive')) return;

      this.isPointerDown = true;
      this.pointerStartX = e.clientX;
      this.pointerCurrentX = e.clientX;
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      this.pointerCurrentX = e.clientX;
    });

    const endPointer = () => {
      this.isPointerDown = false;
    };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
  }
}
