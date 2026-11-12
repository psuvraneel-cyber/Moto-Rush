import { MathUtils } from '../utilities/MathUtils';
import { PHYSICS_CONFIG } from './PhysicsConfig';

export interface PlayerInputState {
  /** Normalized steering in [-1.0, +1.0]. -1.0 = full left (screen-left), 0 = neutral, +1.0 = full right (screen-right) */
  steering: number;
  /** Normalized throttle in [0.0, 1.0]. 0 = idle, 1 = full acceleration */
  throttle: number;
  /** Normalized brake in [0.0, 1.0]. 0 = released, 1 = full braking */
  brake: number;
  /** Nitro boost engagement state */
  nitro: boolean;
}

export interface InputConfig {
  /** Maximum pixel drag displacement to reach full steering deflection [-1, +1]. Default: 180 */
  dragMaxPixels: number;
  /** Exponential return-to-neutral spring rate in s^-1 when pointer is released. Default: 14.0 */
  returnSpringRate: number;
  /** Steering dead zone around neutral [0, 1]. Below this threshold, deflection is 0. Default: 0.04 */
  deadZone: number;
  /** Whether to dynamically clamp anchor on overshoot to prevent dead drag on direction reversal. Default: true */
  clampedAnchor: boolean;
}

export const DEFAULT_INPUT_CONFIG: InputConfig = {
  dragMaxPixels: PHYSICS_CONFIG.MOUSE_DRAG_MAX_PIXELS,
  returnSpringRate: PHYSICS_CONFIG.MOUSE_RETURN_SPRING_STIFFNESS,
  deadZone: PHYSICS_CONFIG.STEER_DEAD_ZONE,
  clampedAnchor: true,
};

export class InputManager {
  private config: InputConfig;

  // Discrete / Keyboard states
  private keyLeft: boolean = false;
  private keyRight: boolean = false;
  private keyAccelerate: boolean = false;
  private keyBrake: boolean = false;
  private keyNitro: boolean = false;

  // Mobile virtual button states
  private mobileThrottle: boolean = false;
  private mobileBrake: boolean = false;
  private mobileNitro: boolean = false;

  // Pointer / Mouse / Touch drag states
  private isPointerDown: boolean = false;
  private activePointerId: number | null = null;
  private pointerAnchorX: number = 0;
  private pointerCurrentX: number = 0;
  private mouseSteerDeflection: number = 0; // Clamped [-1, 1], smoothly returns to 0 on release
  private sensitivity: number = 1.0;

  // Callbacks
  private onPauseCallback?: () => void;
  private onSpaceCallback?: () => void;

  // Bound DOM event handlers
  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;
  private boundOnPointerDown: (e: PointerEvent) => void;
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: (e?: PointerEvent) => void;
  private boundOnBlur: () => void;
  private boundOnVisibilityChange: () => void;

  constructor(config?: Partial<InputConfig>) {
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };

    this.boundOnKeyDown = this.handleKeyDown.bind(this);
    this.boundOnKeyUp = this.handleKeyUp.bind(this);
    this.boundOnPointerDown = this.handlePointerDown.bind(this);
    this.boundOnPointerMove = this.handlePointerMove.bind(this);
    this.boundOnPointerUp = this.handlePointerUp.bind(this);
    this.boundOnBlur = this.handleBlur.bind(this);
    this.boundOnVisibilityChange = this.handleVisibilityChange.bind(this);

    this.setupListeners();
  }

  public setSensitivity(val: number): void {
    this.sensitivity = MathUtils.clamp(val, 0.5, 2.5);
  }

  public setCallbacks(onPause?: () => void, onSpace?: () => void): void {
    this.onPauseCallback = onPause;
    this.onSpaceCallback = onSpace;
  }

  public setThrottle(active: boolean): void {
    this.mobileThrottle = active;
  }

  public setBrake(active: boolean): void {
    this.mobileBrake = active;
  }

  public setNitro(active: boolean): void {
    this.mobileNitro = active;
  }

  public updateConfig(config: Partial<InputConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Resets all inputs immediately (e.g. on window blur, visibility change, or level reset).
   * Prevents sticky steering, stuck throttle, or runaway inputs.
   */
  public reset(): void {
    this.keyLeft = false;
    this.keyRight = false;
    this.keyAccelerate = false;
    this.keyBrake = false;
    this.keyNitro = false;
    this.mobileThrottle = false;
    this.mobileBrake = false;
    this.mobileNitro = false;
    this.isPointerDown = false;
    this.activePointerId = null;
    this.pointerAnchorX = 0;
    this.pointerCurrentX = 0;
    this.mouseSteerDeflection = 0;
  }

  /**
   * Evaluates and updates input state for current frame.
   * Exponentially dampens mouse steering toward neutral (0) if pointer is released.
   */
  public update(dt: number): PlayerInputState {
    const clampedDt = Math.min(dt, 0.1);

    // 1. Keyboard discrete steering (-1 = Left, +1 = Right, 0 = Neutral)
    let keyboardSteer = 0;
    if (this.keyLeft) keyboardSteer -= 1.0;
    if (this.keyRight) keyboardSteer += 1.0;

    // 2. Mouse / Touch drag return-to-neutral spring logic
    if (this.isPointerDown) {
      const deltaX = (this.pointerCurrentX - this.pointerAnchorX) * this.sensitivity;
      const rawDeflection = MathUtils.clamp(deltaX / this.config.dragMaxPixels, -1.0, 1.0);

      // Dead zone filtering: ignore micro-jitters
      if (Math.abs(rawDeflection) <= this.config.deadZone) {
        this.mouseSteerDeflection = 0.0;
      } else {
        const sign = Math.sign(rawDeflection);
        this.mouseSteerDeflection =
          sign * ((Math.abs(rawDeflection) - this.config.deadZone) / (1.0 - this.config.deadZone));
      }
    } else {
      // Pointer is released: apply exponential spring return to neutral (0)
      // s(t+dt) = s(t) * e^(-returnSpringRate * dt)
      if (Math.abs(this.mouseSteerDeflection) > 0.005) {
        this.mouseSteerDeflection = MathUtils.damp(
          this.mouseSteerDeflection,
          0.0,
          this.config.returnSpringRate,
          clampedDt
        );
        if (Math.abs(this.mouseSteerDeflection) <= 0.005) {
          this.mouseSteerDeflection = 0.0;
        }
      } else {
        this.mouseSteerDeflection = 0.0;
      }
    }

    // 3. Unified steering arbitration
    // If keyboard is actively steering, keyboard takes priority and cancels mouse deflection;
    // otherwise mouse drag steering (including spring return) governs.
    let effectiveSteering: number;
    if (keyboardSteer !== 0) {
      effectiveSteering = keyboardSteer;
      this.mouseSteerDeflection = 0.0;
    } else {
      effectiveSteering = this.mouseSteerDeflection;
    }

    // 4. Throttle, Brake, Nitro arbitration
    const isAccelerating = this.keyAccelerate || this.mobileThrottle;
    const isBraking = this.keyBrake || this.mobileBrake;
    // Braking cancels nitro and acceleration for responsive arcade control
    const wantsNitro = (this.keyNitro || this.mobileNitro) && !isBraking;

    const effectiveThrottle = isAccelerating && !isBraking ? 1.0 : 0.0;
    const effectiveBrake = isBraking ? 1.0 : 0.0;

    return {
      steering: MathUtils.clamp(effectiveSteering, -1.0, 1.0),
      throttle: effectiveThrottle,
      brake: effectiveBrake,
      nitro: wantsNitro,
    };
  }

  /**
   * Retrieves current instantaneous input state without ticking delta-time decay.
   */
  public getInputState(): PlayerInputState {
    return this.update(0);
  }

  public get isDragging(): boolean {
    return this.isPointerDown;
  }

  public get currentMouseDeflection(): number {
    return this.mouseSteerDeflection;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.keyLeft = true;
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.keyRight = true;
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.keyAccelerate = true;
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      this.keyBrake = true;
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.keyNitro = true;
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      this.onPauseCallback?.();
    } else if (e.code === 'Space') {
      this.keyNitro = true;
      this.onSpaceCallback?.();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.keyLeft = false;
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.keyRight = false;
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.keyAccelerate = false;
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      this.keyBrake = false;
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') {
      this.keyNitro = false;
    }
  }

  private handlePointerDown(e: PointerEvent): void {
    // Filter interactive UI elements
    const target = e.target as HTMLElement;
    if (
      target &&
      typeof target.closest === 'function' &&
      (target.closest('.ui-interactive') ||
        target.closest('button') ||
        target.closest('.btn') ||
        target.tagName === 'BUTTON')
    ) {
      return;
    }

    // Multi-touch arbitration: accept only the first active drag pointer
    if (this.activePointerId !== null && this.activePointerId !== e.pointerId) {
      return;
    }

    this.isPointerDown = true;
    this.activePointerId = e.pointerId !== undefined ? e.pointerId : 0;
    this.pointerAnchorX = e.clientX;
    this.pointerCurrentX = e.clientX;

    // Optional pointer capture
    if (e.target && (e.target as any).setPointerCapture && e.pointerId !== undefined) {
      try {
        (e.target as any).setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isPointerDown || (this.activePointerId !== null && e.pointerId !== undefined && e.pointerId !== this.activePointerId)) {
      return;
    }

    this.pointerCurrentX = e.clientX;

    // Dynamic clamped anchor: prevents dead drag on direction reversal
    if (this.config.clampedAnchor) {
      const maxPixels = this.config.dragMaxPixels / this.sensitivity;
      if (this.pointerCurrentX - this.pointerAnchorX > maxPixels) {
        this.pointerAnchorX = this.pointerCurrentX - maxPixels;
      } else if (this.pointerCurrentX - this.pointerAnchorX < -maxPixels) {
        this.pointerAnchorX = this.pointerCurrentX + maxPixels;
      }
    }
  }

  private handlePointerUp(e?: PointerEvent): void {
    if (e && this.activePointerId !== null && e.pointerId !== undefined && e.pointerId !== this.activePointerId) {
      return;
    }

    this.isPointerDown = false;
    this.activePointerId = null;

    if (e && e.target && (e.target as any).releasePointerCapture && e.pointerId !== undefined) {
      try {
        (e.target as any).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  private handleBlur(): void {
    this.reset();
  }

  private handleVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.hidden) {
      this.reset();
    }
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
    window.addEventListener('pointerdown', this.boundOnPointerDown);
    window.addEventListener('pointermove', this.boundOnPointerMove);
    window.addEventListener('pointerup', this.boundOnPointerUp);
    window.addEventListener('pointercancel', this.boundOnPointerUp);
    window.addEventListener('blur', this.boundOnBlur);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.boundOnVisibilityChange);
    }
  }

  public dispose(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
    window.removeEventListener('pointerdown', this.boundOnPointerDown);
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
    window.removeEventListener('pointercancel', this.boundOnPointerUp);
    window.removeEventListener('blur', this.boundOnBlur);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.boundOnVisibilityChange);
    }
  }
}
