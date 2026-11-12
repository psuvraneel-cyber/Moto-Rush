import { EventBus, GlobalEvents } from '../core/EventBus';

export interface NitroConfig {
  maxFuel: number;        // Maximum fuel (default 100)
  depletionRate: number;  // Fuel units per second while boosting (default 25)
  nearMissGain: number;   // Fuel gained per near-miss (default 15)
  overtakeGain: number;   // Fuel gained per overtake (default 8)
  pickupGain: number;     // Fuel gained from nitro pickup (default 35)
  boostMultiplier: number;// Speed boost multiplier (default 1.35)
}

export const DEFAULT_NITRO_CONFIG: NitroConfig = {
  maxFuel: 100,
  depletionRate: 25,
  nearMissGain: 15,
  overtakeGain: 8,
  pickupGain: 35,
  boostMultiplier: 1.35,
};

export class NitroManager {
  private config: NitroConfig;
  private currentFuel: number = 40; // Start with partial tank
  private boosting: boolean = false;
  private eventBus?: EventBus;

  constructor(config?: Partial<NitroConfig>, eventBus?: EventBus) {
    this.config = { ...DEFAULT_NITRO_CONFIG, ...config };
    this.eventBus = eventBus;
  }

  public get fuel(): number {
    return this.currentFuel;
  }

  public get fuelRatio(): number {
    return this.currentFuel / this.config.maxFuel;
  }

  public get isBoosting(): boolean {
    return this.boosting;
  }

  public get boostMultiplier(): number {
    return this.boosting ? this.config.boostMultiplier : 1.0;
  }

  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  public setConfig(config: Partial<NitroConfig>): void {
    this.config = { ...this.config, ...config };
    this.currentFuel = Math.min(this.currentFuel, this.config.maxFuel);
  }

  public setMaxFuel(maxFuel: number): void {
    this.config.maxFuel = maxFuel;
    this.currentFuel = Math.min(this.currentFuel, this.config.maxFuel);
  }

  public addFuel(amount: number): void {
    const prev = this.currentFuel;
    this.currentFuel = Math.min(this.config.maxFuel, this.currentFuel + amount);
    if (this.currentFuel !== prev && this.eventBus) {
      this.eventBus.emit(GlobalEvents.NITRO_CHANGED, {
        fuel: this.currentFuel,
        fuelRatio: this.fuelRatio,
        isBoosting: this.boosting,
      });
    }
  }

  public onNearMiss(): void {
    this.addFuel(this.config.nearMissGain);
  }

  public addNearMissBonus(): void {
    this.onNearMiss();
  }

  public onOvertake(): void {
    this.addFuel(this.config.overtakeGain);
  }

  public addOvertakeBonus(): void {
    this.onOvertake();
  }

  public onPickup(): void {
    this.addFuel(this.config.pickupGain);
  }

  public refillFull(): void {
    this.currentFuel = this.config.maxFuel;
  }

  /**
   * Updates nitro fuel state.
   * @param dt Delta time in seconds
   * @param wantsBoost True if user is pressing nitro key or mobile button
   * @returns boolean indicating if nitro boost is actively firing
   */
  public update(dt: number, wantsBoost: boolean): boolean {
    const clampedDt = Math.min(dt, 0.1);
    const wasBoosting = this.boosting;

    if (wantsBoost && this.currentFuel > 0.5) {
      this.boosting = true;
      this.currentFuel = Math.max(0, this.currentFuel - this.config.depletionRate * clampedDt);
      if (!wasBoosting && this.eventBus) {
        this.eventBus.emit(GlobalEvents.NITRO_ENGAGED);
      }
    } else {
      this.boosting = false;
    }

    if (this.eventBus) {
      this.eventBus.emit(GlobalEvents.NITRO_CHANGED, {
        fuel: this.currentFuel,
        fuelRatio: this.fuelRatio,
        isBoosting: this.boosting,
      });
    }

    return this.boosting;
  }

  public reset(startingFuel: number = 40): void {
    this.currentFuel = Math.min(this.config.maxFuel, startingFuel);
    this.boosting = false;
  }
}
