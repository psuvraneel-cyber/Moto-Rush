import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { PowerUpManager } from '../gameplay/PowerUpManager';
import { CoinManager } from '../gameplay/CoinManager';
import { EndlessMode } from '../modes/EndlessMode';
import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from '../progression/EconomyManager';
import { UpgradeManager } from '../progression/UpgradeManager';
import { Motorcycle } from '../player/Motorcycle';
import { MOTORCYCLES } from '../progression/GarageManager';
import { PlayerController } from '../player/PlayerController';
import { Obstacle } from '../gameplay/Obstacle';
import { ObstacleManager } from '../gameplay/ObstacleManager';
import { ObstacleType } from '../levels/LevelDefinitions';
import { EventBus, GlobalEvents } from '../core/EventBus';
import { RivalRaceManager } from '../ai/RivalRaceManager';
import { ScoreManager } from '../racing/ScoreManager';
import { CareerMode } from '../modes/CareerMode';
import { DEFAULT_SPEED_CONFIG } from '../racing/SpeedController';
import { DEFAULT_NITRO_CONFIG, NitroManager } from '../racing/NitroManager';

describe('Adversarial Review: Bug Fixes and Regression Tests', () => {
  let eventBus: EventBus;
  let saveManager: SaveManager;
  let economyManager: EconomyManager;
  let upgradeManager: UpgradeManager;

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    });

    eventBus = new EventBus();
    saveManager = new SaveManager();
    economyManager = new EconomyManager(saveManager);
    upgradeManager = new UpgradeManager(saveManager, economyManager);
  });

  describe('Bug 1: Shield Single-Hit Consumption', () => {
    it('consumes shield on obstacle hit and does not absorb subsequent hits indefinitely', () => {
      const bike = new Motorcycle(MOTORCYCLES[0]);
      const playerController = new PlayerController(bike);
      const powerUpManager = new PowerUpManager(upgradeManager, playerController, eventBus);

      powerUpManager.activatePowerUp('shield');
      expect(powerUpManager.isActive('shield')).toBe(true);

      // First hit absorbs damage and consumes shield
      const absorbedFirst = powerUpManager.consumeShield();
      expect(absorbedFirst).toBe(true);
      expect(powerUpManager.isActive('shield')).toBe(false);

      // Second hit has no shield protection
      const absorbedSecond = powerUpManager.consumeShield();
      expect(absorbedSecond).toBe(false);

      playerController.dispose();
    });
  });

  describe('Bug 2: Double Coins PowerUp Multiplier', () => {
    it('awards 2x coins per pickup when isDoubleCoins is active', () => {
      const coinManager = new CoinManager(eventBus);
      coinManager.loadCoins([{ pattern: 'line', startX: 0, startZ: 50, count: 1 }]);

      let collectedCoins = 0;
      eventBus.on(GlobalEvents.COIN_COLLECTED, (data: any) => {
        collectedCoins += data.gain;
      });

      // Update with player at z=50, isMagnet=false, isDoubleCoins=true
      coinManager.update(0.016, new THREE.Vector3(0, 0, 50), false, true);

      // Base coin value is 1, doubled should be 2 collected
      expect(coinManager.collected).toBe(2);
      expect(collectedCoins).toBe(2);
    });

    it('awards 1x coins when double coins is inactive', () => {
      const coinManager = new CoinManager(eventBus);
      coinManager.loadCoins([{ pattern: 'line', startX: 0, startZ: 50, count: 1 }]);

      let collectedCoins = 0;
      eventBus.on(GlobalEvents.COIN_COLLECTED, (data: any) => {
        collectedCoins += data.gain;
      });

      // Update with player at z=50, isMagnet=false, isDoubleCoins=false
      coinManager.update(0.016, new THREE.Vector3(0, 0, 50), false, false);

      expect(coinManager.collected).toBe(1);
      expect(collectedCoins).toBe(1);
    });
  });

  describe('Bug 4: Endless Mode Throttling & Speed Scaling', () => {
    it('does not write to localStorage every frame in updateDistance', () => {
      const saveSpy = vi.spyOn(saveManager, 'saveData');
      const endless = new EndlessMode(saveManager);

      // Simulate 60 frames of distance updates
      for (let i = 1; i <= 60; i++) {
        endless.updateDistance(i * 0.5);
      }

      // Should NOT have called saveData 60 times
      expect(saveSpy).not.toHaveBeenCalled();
      expect(endless.distance).toBe(30);

      // Only on explicit saveRecord does it persist
      endless.saveRecord();
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('scales speed multiplier smoothly with distance', () => {
      const endless = new EndlessMode(saveManager);
      expect(endless.getSpeedMultiplier()).toBe(1.0);

      endless.updateDistance(500);
      expect(endless.getSpeedMultiplier()).toBe(1.125);

      endless.updateDistance(2000);
      expect(endless.getSpeedMultiplier()).toBe(1.5);

      // Speed multiplier is capped at 1.5 (+50%)
      endless.updateDistance(5000);
      expect(endless.getSpeedMultiplier()).toBe(1.5);
    });
  });

  describe('Bug 6: PlayerController Pause and Boost Callbacks', () => {
    it('fires onPauseToggle on Escape and KeyP, and onBoost on Space', () => {
      const bike = new Motorcycle(MOTORCYCLES[0]);
      const controller = new PlayerController(bike);

      let pauseToggled = 0;
      let boostTriggered = 0;

      controller.setInputCallbacks(
        () => {
          pauseToggled++;
        },
        () => {
          boostTriggered++;
        }
      );

      // Dispatch Escape
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
      expect(pauseToggled).toBe(1);

      // Dispatch KeyP
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' }));
      expect(pauseToggled).toBe(2);

      // Dispatch Space
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(boostTriggered).toBe(1);

      controller.dispose();
    });
  });

  describe('Obstacle Expansion & Near-Miss Mechanics', () => {
    const all13Types: ObstacleType[] = [
      'barrier_small',
      'barrier_large',
      'traffic',
      'delivery_van',
      'heavy_truck',
      'traffic_cones',
      'oil_slick',
      'pothole',
      'spinner',
      'crusher',
      'swinging_barrier',
      'road_gate',
      'construction_zone',
    ];

    it('instantiates all 13 obstacle types with valid meshes, bounds, and damage', () => {
      for (const type of all13Types) {
        const obs = new Obstacle({ type, x: 0, z: 50, speed: 2 });
        expect(obs.mesh).toBeDefined();
        expect(obs.mesh.children.length).toBeGreaterThan(0);
        if (type === 'oil_slick') {
          expect(obs.damage).toBe(0); // Slippery hazard, causes spinout without direct damage
        } else {
          expect(obs.damage).toBeGreaterThan(0);
        }
        expect(obs.bounds.max.z).toBeGreaterThan(obs.bounds.min.z);
        expect(obs.bounds.max.x).toBeGreaterThan(obs.bounds.min.x);
      }
    });

    it('detects near-misses when single motorcycle passes close without colliding', () => {
      const bike = new Motorcycle(MOTORCYCLES[0]);
      const playerController = new PlayerController(bike);
      const obstacleManager = new ObstacleManager(playerController, eventBus);

      let nearMissCount = 0;
      eventBus.on(GlobalEvents.NEAR_MISS, () => {
        nearMissCount++;
      });

      // Load an obstacle at x=2.0, z=50 (bounds: x in [0.7, 3.3])
      obstacleManager.loadObstacles([{ type: 'barrier_small', x: 2.0, z: 50 }]);

      // Hero motorcycle at x=0.0 (hero bounds [0.0 - 0.45, 0.0 + 0.45] = [-0.45, 0.45])
      // Clearance gap between hero Right (0.45) and obstacle Left (0.7) is ~0.25m
      const heroPos = new THREE.Vector3(0.0, 0, 50.5);
      obstacleManager.update(0.016, heroPos, false);

      expect(nearMissCount).toBe(1);

      // Subsequent update at same Z should not trigger multiple times
      obstacleManager.update(0.016, heroPos, false);
      expect(nearMissCount).toBe(1);

      playerController.dispose();
    });
  });

  describe('Review Bug Fixes: Progression, Nitro, Rival Collisions & Clean Streak', () => {
    it('calculates upgrade bonuses for topSpeed, braking, and nitroRecovery correctly', () => {
      saveManager.data.upgrades.acceleration = 2; // +24%
      saveManager.data.upgrades.topSpeed = 3;     // +2.5 m/s (~9 km/h)
      saveManager.data.upgrades.braking = 2;      // +30%
      saveManager.data.upgrades.nitroRecovery = 2;// +30%
      saveManager.data.upgrades.handling = 3;     // +30%

      expect(upgradeManager.getAccelerationBonus()).toBeCloseTo(0.24, 2);
      expect(upgradeManager.getTopSpeedBonus()).toBeCloseTo(2.5, 1);
      expect(upgradeManager.getBrakingBonus()).toBeCloseTo(0.30, 2);
      expect(upgradeManager.getNitroRecoveryBonus()).toBeCloseTo(0.30, 2);
      expect(upgradeManager.getHandlingBonus()).toBeCloseTo(0.30, 2);
    });

    it('emits NITRO_ENGAGED event on transition to active nitro boost', () => {
      const nitroManager = new NitroManager(undefined, eventBus);
      let engagedFired = 0;
      eventBus.on(GlobalEvents.NITRO_ENGAGED, () => {
        engagedFired++;
      });

      // Initially not boosting
      expect(nitroManager.isBoosting).toBe(false);

      // Engaging boost with fuel available
      nitroManager.update(0.1, true);
      expect(nitroManager.isBoosting).toBe(true);
      expect(engagedFired).toBe(1);

      // Updating while continuously boosting does not re-fire NITRO_ENGAGED
      nitroManager.update(0.1, true);
      expect(engagedFired).toBe(1);

      // Disengage then re-engage fires again
      nitroManager.update(0.1, false);
      expect(nitroManager.isBoosting).toBe(false);
      nitroManager.update(0.1, true);
      expect(engagedFired).toBe(2);
    });

    it('detects collisions between hero motorcycle and AI rival racers', () => {
      const rivalManager = new RivalRaceManager(eventBus);
      rivalManager.spawnRivals(3, 30);

      // Target the first rival racer
      const firstRival = rivalManager.activeRivals[0];
      const rivalPos = firstRival.mesh.position;

      // Construct a hero box overlapping directly with the rival
      const heroBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(rivalPos.x, rivalPos.y, rivalPos.z),
        new THREE.Vector3(0.9, 1.2, 2.2)
      );

      const hitRival = rivalManager.checkCollisions(heroBox);
      expect(hitRival).not.toBeNull();
      expect(hitRival?.profile.name).toBe(firstRival.profile.name);

      // Construct a hero box far away
      const clearHeroBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(rivalPos.x + 10, rivalPos.y, rivalPos.z),
        new THREE.Vector3(0.9, 1.2, 2.2)
      );
      expect(rivalManager.checkCollisions(clearHeroBox)).toBeNull();
    });

    it('preserves maximum clean driving streak across collision resets', () => {
      const scoreManager = new ScoreManager(eventBus);

      // Drive cleanly for 120m
      scoreManager.update(0.1, 20, 120);
      expect(scoreManager.cleanDistance).toBe(120);

      // Collide: cleanDistance resets to 0, but maxCleanDistance is preserved
      scoreManager.onCollision();
      expect(scoreManager.cleanDistance).toBe(0);

      // Drive cleanly for another 40m
      scoreManager.update(0.1, 20, 40);
      expect(scoreManager.cleanDistance).toBe(40);

      // Final stats should report best streak (120m)
      const stats = scoreManager.getFinalStats(0);
      expect(stats.cleanDistance).toBe(120);
    });

    it('finishCareerLevel properly awards stars, unlocks next level, and emits LEVEL_FINISHED', () => {
      const career = new CareerMode(saveManager, economyManager, eventBus);
      career.setLevel(1);

      let eventPayload: any = null;
      eventBus.on(GlobalEvents.LEVEL_FINISHED, (payload: any) => {
        eventPayload = payload;
      });

      const rewards = career.finishCareerLevel(50, true, 3);
      expect(rewards.stars).toBe(3);
      expect(saveManager.data.levelStars[1]).toBe(3);
      expect(saveManager.data.unlockedLevel).toBe(2);
      expect(economyManager.coins).toBe(rewards.totalCoins);
      expect(eventPayload).not.toBeNull();
      expect(eventPayload.levelNumber).toBe(1);
    });
  });
});
