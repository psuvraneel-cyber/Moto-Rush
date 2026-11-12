import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SpeedController } from '../racing/SpeedController';
import { TrafficManager } from '../racing/TrafficManager';
import { TrafficVehicle } from '../racing/TrafficVehicle';
import { OvertakeDetector } from '../racing/OvertakeDetector';
import { NearMissManager } from '../racing/NearMissManager';
import { NitroManager } from '../racing/NitroManager';
import { ScoreManager } from '../racing/ScoreManager';
import { RivalRaceManager } from '../ai/RivalRaceManager';
import { TimeTrialMode } from '../modes/TimeTrialMode';
import { EventBus } from '../core/EventBus';

describe('Arcade Racing Systems Suite', () => {
  describe('SpeedController', () => {
    it('cruises at base speed when neither throttle nor brake is pressed', () => {
      const sc = new SpeedController({
        cruisingSpeed: 20,
        minSpeed: 10,
        maxSpeed: 34,
      });

      expect(sc.currentSpeed).toBe(20);
      sc.update(1.0, 0, 0, false);
      expect(sc.currentSpeed).toBeCloseTo(20, 1);
    });

    it('accelerates progressively up to maxSpeed when throttle is active', () => {
      const sc = new SpeedController({
        cruisingSpeed: 20,
        maxSpeed: 34,
        accelerationRate: 14,
      });

      // Update 2 seconds of full throttle
      for (let i = 0; i < 20; i++) {
        sc.update(0.1, 1.0, 0, false);
      }

      expect(sc.currentSpeed).toBeGreaterThan(25);
      expect(sc.currentSpeed).toBeLessThanOrEqual(34);
    });

    it('brakes smoothly down towards minSpeed when brake is active', () => {
      const sc = new SpeedController({
        cruisingSpeed: 20,
        minSpeed: 10,
        brakingRate: 20,
      });

      for (let i = 0; i < 15; i++) {
        sc.update(0.1, 0, 1.0, false);
      }

      expect(sc.currentSpeed).toBeLessThan(15);
      expect(sc.currentSpeed).toBeGreaterThanOrEqual(10);
    });

    it('boosts up to nitro speed when nitro boost is engaged', () => {
      const sc = new SpeedController({
        cruisingSpeed: 20,
        nitroSpeed: 45,
        accelerationRate: 28,
      });

      for (let i = 0; i < 20; i++) {
        sc.update(0.1, 0, 0, true);
      }

      expect(sc.currentSpeed).toBeGreaterThan(35);
      expect(sc.currentSpeed).toBeLessThanOrEqual(45);
    });
  });

  describe('TrafficManager', () => {
    let tm: TrafficManager;

    beforeEach(() => {
      tm = new TrafficManager();
    });

    it('maintains 4 highway lanes with standard lateral coordinates [-4.5, -1.5, 1.5, 4.5]', () => {
      expect(TrafficManager.LANE_X).toEqual([-4.5, -1.5, 1.5, 4.5]);
    });

    it('spawns traffic vehicles with correct initial positions and bounds', () => {
      const v = tm.spawnVehicle('sedan', 2, 100);
      expect(v).not.toBeNull();
      expect(v!.currentLane).toBe(2);
      expect(v!.mesh.position.x).toBe(1.5);
      expect(v!.mesh.position.z).toBe(100);
      expect(v!.bounds.min.x).toBeLessThan(1.5);
      expect(v!.bounds.max.x).toBeGreaterThan(1.5);
    });

    it('enforces anti-block route guarantee so traffic never walls off all 4 lanes', () => {
      // Place vehicles across lanes 0, 1, and 2 around Z = 150
      tm.spawnVehicle('compact', 0, 150);
      tm.spawnVehicle('sedan', 1, 150);
      tm.spawnVehicle('suv', 2, 150);

      // Lane 3 remains open -> isRoutePreserved returns true
      expect(tm.isRoutePreserved(3, 150, 18)).toBe(false); // Spawning in lane 3 would block all 4 lanes!
      expect(tm.isRoutePreserved(1, 150, 18)).toBe(true);  // Spawning in lane 1 preserves lane 3 open
    });

    it('checks lane clearance to prevent vehicles spawning on top of each other', () => {
      tm.spawnVehicle('delivery_van', 1, 100);

      // 5m away in same lane -> clearance is false
      expect(tm.hasLaneClearance(1, 105, 20)).toBe(false);

      // 50m away in same lane -> clearance is true
      expect(tm.hasLaneClearance(1, 150, 20)).toBe(true);

      // In a different lane at same Z -> clearance is true
      expect(tm.hasLaneClearance(2, 100, 20)).toBe(true);
    });

    it('detects collisions accurately when player bounding box intersects a traffic vehicle', () => {
      tm.spawnVehicle('sedan', 1, 50); // Lane 1: x = -1.5, z = 50

      const directHitBox = new THREE.Box3(
        new THREE.Vector3(-1.8, 0, 48),
        new THREE.Vector3(-1.2, 1.5, 52)
      );
      expect(tm.checkCollisions(directHitBox)).not.toBeNull();

      const clearLaneBox = new THREE.Box3(
        new THREE.Vector3(1.2, 0, 48),
        new THREE.Vector3(1.8, 1.5, 52)
      );
      expect(tm.checkCollisions(clearLaneBox)).toBeNull();
    });
  });

  describe('NearMissManager', () => {
    it('detects sub-meter near misses strictly between 0.15m and 1.10m lateral clearance', () => {
      const eventBus = new EventBus();
      const nmm = new NearMissManager(eventBus);

      let eventFired = false;
      eventBus.on('game:near_miss', () => {
        eventFired = true;
      });

      const vehicle = new TrafficVehicle(1, 'compact');
      vehicle.mesh.position.set(-1.5, 0, 60);
      vehicle.updateBounds();

      // Player alongside vehicle longitudinally
      const playerBox = new THREE.Box3(
        new THREE.Vector3(-0.2, 0, 59.0),
        new THREE.Vector3(0.4, 1.5, 61.0)
      );

      const events = nmm.update(playerBox, 28, [vehicle], 1);
      expect(events.length).toBe(1);
      expect(events[0].clearance).toBeGreaterThanOrEqual(NearMissManager.MIN_CLEARANCE);
      expect(events[0].clearance).toBeLessThanOrEqual(NearMissManager.MAX_CLEARANCE);
      expect(eventFired).toBe(true);
      expect(nmm.nearMisses).toBe(1);
    });

    it('does NOT count actual collisions as near misses', () => {
      const nmm = new NearMissManager();
      const vehicle = new TrafficVehicle(2, 'sedan');
      vehicle.mesh.position.set(1.5, 0, 80);
      vehicle.updateBounds();

      // Directly overlapping bounding box in both X and Z (Collision)
      const collisionBox = new THREE.Box3(
        new THREE.Vector3(1.2, 0, 79),
        new THREE.Vector3(1.8, 1.5, 81)
      );

      const events = nmm.update(collisionBox, 28, [vehicle], 1);
      expect(events.length).toBe(0);
      expect(nmm.nearMisses).toBe(0);
    });
  });

  describe('OvertakeDetector', () => {
    it('detects completed longitudinal overtakes and marks vehicle overtaken once', () => {
      const eventBus = new EventBus();
      const od = new OvertakeDetector(eventBus);

      let overtakeEventsCount = 0;
      eventBus.on('game:overtake', () => {
        overtakeEventsCount++;
      });

      const vehicle = new TrafficVehicle(10, 'delivery_van');
      vehicle.mesh.position.set(-1.5, 0, 100);
      vehicle.updateBounds();

      // Case 1: Player is behind the delivery van (Z in [80, 82])
      const playerBehindBox = new THREE.Box3(
        new THREE.Vector3(1.2, 0, 80),
        new THREE.Vector3(1.8, 1.5, 82)
      );
      const ev1 = od.update(playerBehindBox, 25, [vehicle], 1);
      expect(ev1.length).toBe(0);
      expect(vehicle.overtaken).toBe(false);

      // Case 2: Player has pulled ahead past front bumper (Z in [106, 108])
      const playerAheadBox = new THREE.Box3(
        new THREE.Vector3(1.2, 0, 106),
        new THREE.Vector3(1.8, 1.5, 108)
      );
      const ev2 = od.update(playerAheadBox, 25, [vehicle], 1);
      expect(ev2.length).toBe(1);
      expect(vehicle.overtaken).toBe(true);
      expect(overtakeEventsCount).toBe(1);

      // Case 3: Re-updating does not trigger duplicate overtake events
      const ev3 = od.update(playerAheadBox, 25, [vehicle], 1);
      expect(ev3.length).toBe(0);
      expect(overtakeEventsCount).toBe(1);
    });
  });

  describe('NitroManager', () => {
    it('consumes nitro fuel when boosting and shuts off when empty', () => {
      const nm = new NitroManager({
        maxFuel: 100,
        depletionRate: 50,
      });

      nm.addFuel(50); // Fuel is now 90
      expect(nm.fuel).toBe(90);

      // Boost for 1.0 second (10 steps of 0.1s) -> consumes 50 units
      for (let i = 0; i < 10; i++) {
        nm.update(0.1, true);
      }
      expect(nm.fuel).toBeCloseTo(40, 1);

      // Boost for another 1.0 second -> empties tank
      for (let i = 0; i < 10; i++) {
        nm.update(0.1, true);
      }
      expect(nm.fuel).toBe(0);

      // Trying to boost with empty tank returns false
      const boostingEmpty = nm.update(0.1, true);
      expect(boostingEmpty).toBe(false);
    });

    it('recovers nitro fuel from near misses and overtakes', () => {
      const nm = new NitroManager({
        maxFuel: 100,
        nearMissGain: 15,
        overtakeGain: 8,
      });
      nm.reset(20);

      nm.onNearMiss();
      expect(nm.fuel).toBe(35);

      nm.onOvertake();
      expect(nm.fuel).toBe(43);
    });
  });

  describe('ScoreManager', () => {
    it('increments streak, builds combo multiplier up to 10x, and resets on collision', () => {
      const sm = new ScoreManager();

      expect(sm.combo).toBe(1);

      sm.addOvertake();
      expect(sm.comboStreak).toBe(1);
      expect(sm.score).toBe(250);

      sm.addNearMiss();
      expect(sm.comboStreak).toBe(3);
      expect(sm.combo).toBe(2);

      // Add multiple overtakes to ramp combo
      for (let i = 0; i < 20; i++) {
        sm.addOvertake();
      }
      expect(sm.combo).toBe(10); // Max clamped at 10x

      // Collision drops combo to 1x and clears streak
      sm.onCollision();
      expect(sm.combo).toBe(1);
      expect(sm.comboStreak).toBe(0);
    });

    it('decays combo smoothly after combo timeout', () => {
      const sm = new ScoreManager();
      sm.addOvertake();
      sm.addOvertake();
      expect(sm.combo).toBe(2);

      // Step past timeout (45 steps of 0.1s = 4.5s)
      for (let i = 0; i < 45; i++) {
        sm.update(0.1, 20, 1);
      }
      expect(sm.combo).toBe(1);
    });
  });

  describe('RivalRaceManager', () => {
    it('spawns rival racers with custom liveries and tracks live standings', () => {
      const rrm = new RivalRaceManager();
      rrm.spawnRivals(3, 40);

      expect(rrm.count).toBe(3);

      // Player at Z = 20 (behind all rivals starting at 40, 62, 84)
      const lb1 = rrm.getLeaderboard(20);
      expect(lb1.totalRacers).toBe(4);
      expect(lb1.playerRank).toBe(4); // 4th place

      // Player surges ahead to Z = 70 (ahead of rivals 1 & 2, behind rival 3 at 84)
      const lb2 = rrm.getLeaderboard(70);
      expect(lb2.playerRank).toBe(2); // 2nd place

      // Player takes the lead at Z = 120
      const lb3 = rrm.getLeaderboard(120);
      expect(lb3.playerRank).toBe(1); // 1st place
    });
  });

  describe('TimeTrialMode', () => {
    it('counts down remaining time and extends clock when crossing checkpoints', () => {
      const ttm = new TimeTrialMode({} as any);
      ttm.reset(30.0);

      expect(ttm.timeRemaining).toBe(30.0);

      // 5 seconds tick (50 steps of 0.1s)
      for (let i = 0; i < 50; i++) {
        ttm.update(0.1, 100);
      }
      expect(ttm.timeRemaining).toBeCloseTo(25.0, 1);

      // Cross 250m checkpoint
      const res2 = ttm.update(0.1, 260);
      expect(res2.checkpointTriggered).toBe(true);
      expect(ttm.checkpointsPassed).toBe(1);
      // Gained +15s bonus: ~25s + 15s = ~40s
      expect(ttm.timeRemaining).toBeGreaterThan(35.0);
    });

    it('expires when time hits zero', () => {
      const ttm = new TimeTrialMode({} as any);
      ttm.reset(1.0);

      let expired = false;
      for (let i = 0; i < 15; i++) {
        const res = ttm.update(0.1, 50);
        if (res.timeExpired) {
          expired = true;
          break;
        }
      }
      expect(expired).toBe(true);
      expect(ttm.isExpired).toBe(true);
      expect(ttm.timeRemaining).toBe(0);
    });
  });
});
