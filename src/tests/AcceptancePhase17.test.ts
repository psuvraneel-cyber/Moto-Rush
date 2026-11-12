import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SpeedController, DEFAULT_SPEED_CONFIG } from '../racing/SpeedController';
import { TrafficManager, DEFAULT_TRAFFIC_CONFIG } from '../racing/TrafficManager';
import { TrafficVehicle, TRAFFIC_ARCHETYPES, TrafficVehicleType } from '../racing/TrafficVehicle';
import { OvertakeDetector } from '../racing/OvertakeDetector';
import { NearMissManager } from '../racing/NearMissManager';
import { NitroManager } from '../racing/NitroManager';
import { ScoreManager } from '../racing/ScoreManager';
import { RivalRaceManager } from '../ai/RivalRaceManager';
import { CareerMode } from '../modes/CareerMode';
import { TrafficRushMode } from '../modes/TrafficRushMode';
import { TimeTrialMode } from '../modes/TimeTrialMode';
import { RiderController } from '../player/RiderController';
import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from '../progression/EconomyManager';
import { GarageManager, MOTORCYCLES } from '../progression/GarageManager';
import { UpgradeManager, UPGRADES, UpgradeType } from '../progression/UpgradeManager';
import { EventBus, GlobalEvents } from '../core/EventBus';
import { LEVELS } from '../levels/LevelDefinitions';
import { GAME_CONFIG, ENVIRONMENTS } from '../core/GameConfig';

describe('Phase 1 through Phase 17 Acceptance & Verification Suite', () => {
  // Phase 1: Convoy and Gate Deconstruction
  describe('Phase 1: Zero Convoy & Zero Mathematical Gates', () => {
    it('confirms all 30 levels contain zero mathematical gates', () => {
      expect(LEVELS.length).toBe(30);
      for (const level of LEVELS) {
        expect((level as any).gatePairs).toBeUndefined();
        expect((level as any).gates).toBeUndefined();
        for (const obs of level.obstacles) {
          expect(obs.type).not.toBe('gate');
          expect(obs.type).not.toBe('math_gate');
          expect(obs.type).not.toBe('multiplier_gate');
        }
      }
    });

    it('safely migrates V1 save schema (starterFleet/fleetRecovery) to V2 (acceleration/handling)', () => {
      const store: Record<string, string> = {
        motorush3d_save_v1: JSON.stringify({
          coins: 1500,
          unlockedLevel: 8,
          selectedBikeId: 'street_racer',
          unlockedBikes: ['street_racer'],
          upgrades: {
            starterFleet: 4,
            fleetRecovery: 3,
            coinBonus: 2,
          },
        }),
      };

      const mockStorage = {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => {},
      };

      const originalStorage = globalThis.localStorage;
      globalThis.localStorage = mockStorage as any;

      const sm = new SaveManager();
      expect(sm.data.coins).toBe(1500);
      expect(sm.data.upgrades.acceleration).toBe(4);
      expect(sm.data.upgrades.handling).toBe(3);
      expect(sm.data.upgrades.nitroCapacity).toBe(2);

      globalThis.localStorage = originalStorage;
    });
  });

  // Phase 2: Rider Character & Kinematics
  describe('Phase 2: Rider Character & Kinematics', () => {
    it('initializes articulated humanoid rider attached to RiderRoot [0, 0.65, -0.05]', () => {
      const rider = new RiderController();
      expect(rider.root.position.x).toBe(0);
      expect(rider.root.position.y).toBe(0.65);
      expect(rider.root.position.z).toBe(-0.05);
      expect(rider.riderMesh).toBeDefined();
    });

    it('updates kinematic posture: tuck increases with speed, hang-off reflects lean, braking braces posture', () => {
      const rider = new RiderController();

      // Cruising speed (20 m/s) with zero lean
      rider.update(0.1, 20, 0, false, 0);
      const cruiseTuck = rider.tuck;
      expect(cruiseTuck).toBeGreaterThan(0.05);

      // High speed (34 m/s) with active nitro boost -> deep tuck
      for (let i = 0; i < 15; i++) {
        rider.update(0.1, 34, 0, true, 0);
      }
      expect(rider.tuck).toBeGreaterThan(cruiseTuck);

      // Heavy braking -> posture brace
      for (let i = 0; i < 10; i++) {
        rider.update(0.1, 15, 0, false, 1.0);
      }
      expect(rider.brakeBrace).toBeGreaterThan(0.05);

      // Hard cornering lean
      rider.update(0.1, 20, 0.45, false, 0);
      expect(rider.hangOff).toBeGreaterThan(0.1);
    });
  });

  // Phase 4: Configurable Progressive Speed Model
  describe('Phase 4: Arcade Speed Model & Handling', () => {
    it('maintains configurable speed boundaries [13.89 m/s min, 15.0 m/s cruising, 44.44 m/s max, 51.39 m/s nitro]', () => {
      const sc = new SpeedController();
      expect(sc.minSpeed).toBe(13.89);
      expect(sc.cruisingSpeed).toBe(15.0);
      expect(sc.maxSpeed).toBe(44.44);
      expect(sc.nitroSpeed).toBe(51.39);
    });

    it('smoothly coasts towards base cruising speed from either lower or higher speeds', () => {
      const scHigh = new SpeedController({}, 32.0);
      for (let i = 0; i < 20; i++) {
        scHigh.update(0.1, 0, 0, false);
      }
      expect(scHigh.currentSpeed).toBeLessThan(32.0);
      expect(scHigh.currentSpeed).toBeGreaterThanOrEqual(15.0);

      const scLow = new SpeedController({}, 12.0);
      for (let i = 0; i < 20; i++) {
        scLow.update(0.1, 0, 0, false);
      }
      expect(scLow.currentSpeed).toBeGreaterThan(12.0);
      expect(scLow.currentSpeed).toBeLessThanOrEqual(15.0);
    });
  });

  // Phase 5: Traffic Simulation & Archetypes
  describe('Phase 5: Real Traffic Simulation & 10 Archetypes', () => {
    it('verifies all 10 traffic vehicle archetypes have distinct dimensions and speed profiles', () => {
      const expectedTypes: TrafficVehicleType[] = [
        'compact', 'sedan', 'sports_car', 'suv', 'taxi',
        'delivery_van', 'bus', 'heavy_truck', 'police', 'motorcycle'
      ];

      for (const type of expectedTypes) {
        const arch = TRAFFIC_ARCHETYPES[type];
        expect(arch).toBeDefined();
        expect(arch.width).toBeGreaterThan(0.5);
        expect(arch.length).toBeGreaterThan(1.5);
        expect(arch.height).toBeGreaterThan(1.0);
        expect(arch.maxSpeed).toBeGreaterThan(arch.minSpeed);

        const v = new TrafficVehicle(1, type);
        expect(v.bounds).toBeDefined();
      }
    });

    it('recycles traffic vehicles that drop behind the player beyond recycle distance', () => {
      const tm = new TrafficManager();
      const v = tm.spawnVehicle('compact', 1, 50);
      expect(v).not.toBeNull();
      expect(tm.count).toBe(1);

      // Player surges forward to Z = 120 (v is 70m behind player, exceeding recycle distance 35m)
      tm.update(0.1, 0, 120);
      // Vehicle v should be recycled (not in active vehicles, and any new vehicles are spawned ahead at Z > 120)
      expect(tm.activeVehicles.includes(v!)).toBe(false);
      expect(tm.activeVehicles.find(veh => veh.mesh.position.z < 85)).toBeUndefined();
    });

    it('enforces anti-block guarantee: at least one viable lane remains unobstructed', () => {
      const tm = new TrafficManager();
      // Block lanes 0, 1, and 3
      tm.spawnVehicle('heavy_truck', 0, 100);
      tm.spawnVehicle('bus', 1, 100);
      tm.spawnVehicle('delivery_van', 3, 100);

      // Lane 2 is open: isRoutePreserved should be true if someone attempts to enter lane 1
      expect(tm.isRoutePreserved(1, 100)).toBe(true);

      // Attempting to place a vehicle in the ONLY remaining open lane (lane 2) is blocked
      expect(tm.isRoutePreserved(2, 100)).toBe(false);
    });
  });

  // Phase 7: Overtakes, Sub-Meter Near-Misses, and Combos
  describe('Phase 7: Overtake, Near-Miss & Combo Scoring', () => {
    it('accurately detects sub-meter near miss only within [0.15m, 1.10m] clearance', () => {
      const nmm = new NearMissManager();
      const v = new TrafficVehicle(1, 'sedan');
      v.mesh.position.set(-1.5, 0, 50);
      v.updateBounds();

      // Case A: 0.50m lateral clearance -> Near miss detected!
      // Sedan width is 1.9m, halfWidth = 0.95m. Bounds: [-2.45, -0.55].
      // Player bounds min.x = -0.55 + 0.50 = -0.05, max.x = 0.85
      const nearMissBox = new THREE.Box3(
        new THREE.Vector3(-0.05, 0, 49),
        new THREE.Vector3(0.85, 1.5, 51)
      );
      const evNear = nmm.update(nearMissBox, 28, [v], 1);
      expect(evNear.length).toBe(1);
      expect(evNear[0].clearance).toBeGreaterThanOrEqual(NearMissManager.MIN_CLEARANCE);
      expect(evNear[0].clearance).toBeLessThanOrEqual(NearMissManager.MAX_CLEARANCE);
      expect(evNear[0].clearance).toBeCloseTo(0.576, 2);

      // Reset vehicle nearMissed flag
      v.nearMissed = false;

      // Case B: 1.50m lateral clearance -> Too far, no near miss
      const farBox = new THREE.Box3(
        new THREE.Vector3(0.95, 0, 49),
        new THREE.Vector3(1.85, 1.5, 51)
      );
      const evFar = nmm.update(farBox, 28, [v], 1);
      expect(evFar.length).toBe(0);
    });

    it('accumulates combo streak and decays after inactivity timeout', () => {
      const sm = new ScoreManager();
      sm.addOvertake(); // combo 1
      sm.addNearMiss(); // combo 2 (+2 streak)
      expect(sm.combo).toBe(2);

      // Wait 5 seconds without overtakes -> combo decays to 1
      for (let i = 0; i < 50; i++) {
        sm.update(0.1, 20, 1.0);
      }
      expect(sm.combo).toBe(1);
    });
  });

  // Phase 8: Nitro System
  describe('Phase 8: Player-Controlled Nitro System', () => {
    it('depletes fuel only while actively boosting, boosts multiplier, and stops when depleted', () => {
      const nm = new NitroManager({ maxFuel: 100, depletionRate: 40 });
      nm.reset(30);

      expect(nm.isBoosting).toBe(false);
      expect(nm.boostMultiplier).toBe(1.0);

      // Boost for 0.5s in 0.1s steps -> consumes 20 units (40/s * 0.5s)
      for (let i = 0; i < 5; i++) {
        nm.update(0.1, true);
      }
      expect(nm.isBoosting).toBe(true);
      expect(nm.boostMultiplier).toBe(1.35);
      expect(nm.fuel).toBeCloseTo(10, 1);

      // Boost for another 0.5s in 0.1s steps -> empties fuel
      for (let i = 0; i < 5; i++) {
        nm.update(0.1, true);
      }
      expect(nm.fuel).toBe(0);

      // Next update cannot boost
      const active = nm.update(0.1, true);
      expect(active).toBe(false);
      expect(nm.isBoosting).toBe(false);
    });
  });

  // Phase 9: Game Modes
  describe('Phase 9: Racing Game Modes', () => {
    it('CareerMode features 30 distinct levels with structured racing objectives', () => {
      const cm = new CareerMode({} as any, {} as any, new EventBus());

      // Level 6 is a rival duel
      expect(cm.getLevelObjective(6).type).toBe('defeat_rivals');

      // Level 5 is a near miss test
      expect(cm.getLevelObjective(5).type).toBe('near_miss_count');

      // Level 3 is an overtake target
      expect(cm.getLevelObjective(3).type).toBe('overtake_count');

      // Level 2 is a time limit challenge
      expect(cm.getLevelObjective(2).type).toBe('time_limit');

      // Level 1 is a clean run
      expect(cm.getLevelObjective(1).type).toBe('clean_run');
    });

    it('TrafficRushMode progressively scales traffic density and traffic speed over distance', () => {
      const mockSave = {
        data: {
          endless: {
            bestDistance: 0,
            bestCoins: 0,
            bestScore: 0,
            totalRuns: 0,
          },
        },
        saveData: () => {},
      } as unknown as SaveManager;
      const tr = new TrafficRushMode(mockSave);
      tr.reset(12345);

      expect(tr.getTrafficDensity()).toBe(8);
      expect(tr.getTrafficSpeedFactor()).toBe(1.0);

      // Advance to 1000m
      tr.updateDistance(1000);
      expect(tr.getTrafficDensity()).toBeGreaterThan(8);
      expect(tr.getTrafficSpeedFactor()).toBeGreaterThan(1.0);
    });

    it('TimeTrialMode adds bonus time for clean driving/overtakes and awards checkpoints', () => {
      const tt = new TimeTrialMode({} as any);
      tt.reset(30.0);

      tt.onNearMiss();
      expect(tt.timeRemaining).toBeCloseTo(31.5, 1);

      tt.onOvertake();
      expect(tt.timeRemaining).toBeCloseTo(32.0, 1);

      // Crossing 250m checkpoint awards +15s
      const status = tt.update(0.1, 255);
      expect(status.checkpointTriggered).toBe(true);
      expect(tt.checkpointsPassed).toBe(1);
      expect(tt.timeRemaining).toBeGreaterThan(40.0);
    });
  });

  // Phase 10: AI Rival Racers
  describe('Phase 10: AI Rival Racers & Leaderboard', () => {
    it('spawns 3 rival racers ahead of player and calculates live rankings', () => {
      const rrm = new RivalRaceManager();
      rrm.spawnRivals(3, 40);

      expect(rrm.count).toBe(3);

      // Player at starting line (Z = 0) -> Rank 4th out of 4
      const lbStart = rrm.getLeaderboard(0);
      expect(lbStart.totalRacers).toBe(4);
      expect(lbStart.playerRank).toBe(4);

      // Player overtakes all rivals to Z = 150 -> Rank 1st
      const lbWin = rrm.getLeaderboard(150);
      expect(lbWin.playerRank).toBe(1);
    });
  });

  // Phase 12: Garage & Vehicle Upgrades
  describe('Phase 12: Garage & Vehicle Upgrades', () => {
    it('provides 8 distinct motorcycles and 6 core racing upgrades', () => {
      expect(MOTORCYCLES.length).toBe(8);
      expect(MOTORCYCLES[0].id).toBe('street_racer');

      const coreUpgrades: UpgradeType[] = ['acceleration', 'topSpeed', 'handling', 'braking', 'nitroCapacity', 'nitroRecovery'];
      for (const u of coreUpgrades) {
        expect(UPGRADES[u]).toBeDefined();
        expect(UPGRADES[u].maxLevel).toBe(5);
        expect(UPGRADES[u].costs.length).toBe(5);
      }
    });
  });
});
