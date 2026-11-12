import { PHYSICS_CONFIG } from '../core/PhysicsConfig';

export interface SpeedConfig {
  minSpeed: number; // Minimum crawl speed (m/s) -> 13.89 m/s (50.0 km/h)
  cruisingSpeed: number; // Base cruising speed (m/s) -> 15.00 m/s (54.0 km/h)
  maxSpeed: number; // Maximum standard throttle speed (m/s) -> 44.44 m/s (160.0 km/h)
  nitroSpeed: number; // Peak speed with active nitro boost (m/s) -> 51.39 m/s (185.0 km/h)
  accelerationRate: number; // m/s^2 forward acceleration under throttle -> 16.0
  nitroAcceleration: number; // m/s^2 forward acceleration under nitro -> 28.0
  brakingRate: number; // m/s^2 deceleration under braking -> 28.0
  coastingDecel: number; // Fallback linear coasting decel (m/s^2) for compatibility
  dragCoefficient: number; // Aerodynamic drag coefficient Cd in a_drag = -Cd * v^2 -> 0.0020
  rollingResistance: number; // Rolling resistance deceleration (m/s^2) -> 1.2
  idleRecoveryRate: number; // Idle recovery pull toward cruisingSpeed (m/s^2) -> 2.5
}

export const DEFAULT_SPEED_CONFIG: SpeedConfig = {
  minSpeed: PHYSICS_CONFIG.MIN_SPEED,
  cruisingSpeed: PHYSICS_CONFIG.CRUISING_SPEED,
  maxSpeed: PHYSICS_CONFIG.MAX_SPEED,
  nitroSpeed: PHYSICS_CONFIG.NITRO_SPEED,
  accelerationRate: PHYSICS_CONFIG.ACCELERATION_RATE,
  nitroAcceleration: 28.0,
  brakingRate: PHYSICS_CONFIG.BRAKING_RATE,
  coastingDecel: 5.0,
  dragCoefficient: PHYSICS_CONFIG.AERODYNAMIC_DRAG_CD,
  rollingResistance: 1.2,
  idleRecoveryRate: 2.5,
};

export class SpeedController {
  private config: SpeedConfig;
  private speed: number;

  constructor(config?: Partial<SpeedConfig>, initialSpeed?: number) {
    this.config = { ...DEFAULT_SPEED_CONFIG, ...config };
    this.speed = initialSpeed !== undefined ? initialSpeed : this.config.cruisingSpeed;
  }

  public get currentSpeed(): number {
    return this.speed;
  }

  public get speedRatio(): number {
    return this.config.cruisingSpeed > 0 ? this.speed / this.config.cruisingSpeed : 1.0;
  }

  public get maxSpeed(): number {
    return this.config.maxSpeed;
  }

  public get nitroSpeed(): number {
    return this.config.nitroSpeed;
  }

  public get cruisingSpeed(): number {
    return this.config.cruisingSpeed;
  }

  public get minSpeed(): number {
    return this.config.minSpeed;
  }

  public updateConfig(config: Partial<SpeedConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Updates current speed based on delta time and inputs.
   * Employs progressive engine acceleration and quadratic aerodynamic drag:
   * a_drag = -c_d * v^2
   * @param dt Delta time in seconds
   * @param throttle Normalized throttle [0, 1] (e.g. W or Up key)
   * @param brake Normalized brake [0, 1] (e.g. S or Down key)
   * @param isNitro True if nitro boost is engaged
   */
  public update(dt: number, throttle: number, brake: number, isNitro: boolean): number {
    const clampedDt = Math.min(dt, 0.1);
    const targetTop = isNitro ? this.config.nitroSpeed : this.config.maxSpeed;

    // 1. Quadratic aerodynamic drag acting at all speeds: a_drag = Cd * v^2
    const dragDecel = this.config.dragCoefficient * (this.speed * this.speed);

    if (brake > 0) {
      // 2. Heavy braking toward minSpeed (overrides nitro and throttle for safe, responsive control)
      const effectiveBraking = this.config.brakingRate * Math.min(1, Math.max(0, brake));
      this.speed = Math.max(
        this.config.minSpeed,
        this.speed - (effectiveBraking + dragDecel) * clampedDt
      );
    } else if (isNitro) {
      // 3. Powerful nitro boost acceleration with aerodynamic resistance
      const nitroTraction = this.config.nitroAcceleration || (this.config.accelerationRate * 1.8);
      const netNitroAccel = nitroTraction - dragDecel;
      this.speed = Math.min(targetTop, this.speed + netNitroAccel * clampedDt);
    } else if (throttle > 0) {
      // 4. Progressive engine acceleration (diminishing with speed to simulate engine power curve)
      const speedSpan = Math.max(0.01, this.config.maxSpeed - this.config.minSpeed);
      const speedRatio = Math.max(0, Math.min(1, (this.speed - this.config.minSpeed) / speedSpan));
      const engineTraction = this.config.accelerationRate * (1.0 - 0.40 * Math.pow(speedRatio, 1.2));
      const netAccel = (engineTraction * Math.min(1, Math.max(0, throttle))) - dragDecel;
      this.speed = Math.min(targetTop, this.speed + netAccel * clampedDt);
    } else {
      // 5. Coasting with quadratic drag and rolling resistance toward cruisingSpeed
      if (this.speed > this.config.cruisingSpeed) {
        const netCoastingDecel = dragDecel + (this.config.rollingResistance || 1.2);
        this.speed = Math.max(
          this.config.cruisingSpeed,
          this.speed - netCoastingDecel * clampedDt
        );
      } else if (this.speed < this.config.cruisingSpeed) {
        // Idle recovery pull to prevent stalling below cruisingSpeed
        const recoveryRate = this.config.idleRecoveryRate || 2.5;
        this.speed = Math.min(
          this.config.cruisingSpeed,
          this.speed + recoveryRate * clampedDt
        );
      }
    }

    return this.speed;
  }

  public reset(initialSpeed?: number): void {
    this.speed = initialSpeed !== undefined ? initialSpeed : this.config.cruisingSpeed;
  }
}
