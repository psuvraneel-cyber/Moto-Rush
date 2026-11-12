import { EndlessMode } from './EndlessMode';
import { SaveManager } from '../persistence/SaveManager';

export class TrafficRushMode extends EndlessMode {
  constructor(saveManager: SaveManager, seed: number = Date.now()) {
    super(saveManager, seed);
  }

  /**
   * Calculates target active traffic vehicle density based on distance.
   * Starts at 8 vehicles, climbs up to 18 vehicles at 2000m+.
   */
  public getTrafficDensity(): number {
    return Math.min(18, 8 + Math.floor(this.distance / 180));
  }

  /**
   * Calculates progressive traffic speed scaling factor.
   */
  public getTrafficSpeedFactor(): number {
    return 1.0 + Math.min(0.4, (this.distance / 1500) * 0.4);
  }
}
