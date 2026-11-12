import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from './EconomyManager';

export interface MotorcycleInfo {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  speedRating?: number; // 0-100
  handlingRating?: number; // 0-100
  accelerationRating?: number; // 0-100
  nitroRating?: number; // 0-100
  primaryColor: number;
  secondaryColor: number;
  glowColor: number;
  modelStyle?:
    | 'sport'
    | 'cafe'
    | 'adventure'
    | 'thunder'
    | 'cyber'
    | 'streamliner'
    | 'cruiser'
    | 'hyper';
  modelUrl?: string;
  unlocked?: boolean;
  handlingMultiplier?: number;
  accelerationBonus?: number;
  [key: string]: any;
}

export const MOTORCYCLES: MotorcycleInfo[] = [
  {
    id: 'street_racer',
    name: 'Street Racer',
    subtitle: 'Classic Sport Aerodynamics',
    price: 0,
    speedRating: 75,
    handlingRating: 85,
    accelerationRating: 75,
    nitroRating: 70,
    primaryColor: 0xef233c,
    secondaryColor: 0x2b2d42,
    glowColor: 0xff3366,
    modelStyle: 'sport',
    modelUrl: 'assets/models/motorcycles/street_racer.glb',
  },
  {
    id: 'urban_comet',
    name: 'Urban Comet',
    subtitle: 'Agile Lightweight Cafe Racer',
    price: 300,
    speedRating: 80,
    handlingRating: 90,
    accelerationRating: 85,
    nitroRating: 75,
    primaryColor: 0x06d6a0,
    secondaryColor: 0x118ab2,
    glowColor: 0x06d6a0,
    modelStyle: 'cafe',
  },
  {
    id: 'desert_rider',
    name: 'Desert Rider',
    subtitle: 'Rugged Off-Road Endurance',
    price: 750,
    speedRating: 78,
    handlingRating: 88,
    accelerationRating: 80,
    nitroRating: 80,
    primaryColor: 0xf77f00,
    secondaryColor: 0x3d348b,
    glowColor: 0xfcbf49,
    modelStyle: 'adventure',
  },
  {
    id: 'thunderbolt',
    name: 'Thunderbolt',
    subtitle: 'High-Voltage Electric Superbike',
    price: 1400,
    speedRating: 90,
    handlingRating: 84,
    accelerationRating: 92,
    nitroRating: 85,
    primaryColor: 0xffd166,
    secondaryColor: 0x073b4c,
    glowColor: 0xffd166,
    modelStyle: 'thunder',
  },
  {
    id: 'neon_phantom',
    name: 'Neon Phantom',
    subtitle: 'Cyberpunk Stealth Machine',
    price: 2400,
    speedRating: 94,
    handlingRating: 92,
    accelerationRating: 95,
    nitroRating: 90,
    primaryColor: 0x8338ec,
    secondaryColor: 0x3a86ff,
    glowColor: 0xff006e,
    modelStyle: 'cyber',
  },
  {
    id: 'velocity_x',
    name: 'Velocity X',
    subtitle: 'Low-Drag Streamliner Demon',
    price: 3800,
    speedRating: 97,
    handlingRating: 89,
    accelerationRating: 90,
    nitroRating: 95,
    primaryColor: 0x00f5d4,
    secondaryColor: 0x1a1a2e,
    glowColor: 0x00f5d4,
    modelStyle: 'streamliner',
  },
  {
    id: 'road_king',
    name: 'Road King',
    subtitle: 'Muscular Heavyweight Cruiser',
    price: 5500,
    speedRating: 86,
    handlingRating: 96,
    accelerationRating: 88,
    nitroRating: 85,
    primaryColor: 0x3a86ff,
    secondaryColor: 0x03071e,
    glowColor: 0x48cae4,
    modelStyle: 'cruiser',
  },
  {
    id: 'hyper_beast',
    name: 'Hyper Beast',
    subtitle: 'Predator Class Hyper-Naked',
    price: 8000,
    speedRating: 100,
    handlingRating: 95,
    accelerationRating: 98,
    nitroRating: 98,
    primaryColor: 0xd90429,
    secondaryColor: 0x14213d,
    glowColor: 0xff0054,
    modelStyle: 'hyper',
  },
];

export class GarageManager {
  constructor(
    private saveManager: SaveManager,
    private economyManager: EconomyManager
  ) {}

  public get allBikes(): MotorcycleInfo[] {
    return MOTORCYCLES;
  }

  public get selectedBike(): MotorcycleInfo {
    const id = this.saveManager.data.selectedBikeId;
    return MOTORCYCLES.find(b => b.id === id) || MOTORCYCLES[0];
  }

  public isUnlocked(bikeId: string): boolean {
    return this.saveManager.data.unlockedBikes.includes(bikeId);
  }

  public selectBike(bikeId: string): boolean {
    if (!this.isUnlocked(bikeId)) return false;
    this.saveManager.data.selectedBikeId = bikeId;
    this.saveManager.saveData();
    return true;
  }

  public purchaseBike(bikeId: string): boolean {
    if (this.isUnlocked(bikeId)) return true;
    const bike = MOTORCYCLES.find(b => b.id === bikeId);
    if (!bike) return false;

    if (this.economyManager.spendCoins(bike.price)) {
      this.saveManager.data.unlockedBikes.push(bikeId);
      this.saveManager.data.selectedBikeId = bikeId;
      this.saveManager.saveData();
      return true;
    }
    return false;
  }
}
