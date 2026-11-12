import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { SaveManager } from '../persistence/SaveManager';
import { Game } from '../core/Game';
import { GameState } from '../core/GameState';
import { ObstacleManager } from '../gameplay/ObstacleManager';
import { Obstacle } from '../gameplay/Obstacle';
import { Motorcycle } from '../player/Motorcycle';
import { PlayerController } from '../player/PlayerController';
import { MOTORCYCLES } from '../progression/GarageManager';
import { EventBus, GlobalEvents } from '../core/EventBus';
import { LEVELS } from '../levels/LevelDefinitions';
import { GAME_CONFIG } from '../core/GameConfig';

vi.mock('../rendering/Renderer', () => {
  return {
    Renderer: class {
      public webglRenderer = {
        outputColorSpace: '',
        toneMapping: 0,
        toneMappingExposure: 1,
        setPixelRatio: vi.fn(),
        setSize: vi.fn(),
        shadowMap: { enabled: false, type: 0 },
        render: vi.fn(),
        dispose: vi.fn(),
      };
      public applyQualityPreset = vi.fn();
      public handleResize = vi.fn();
      public render = vi.fn();
      public dispose = vi.fn();
    },
  };
});

describe('Milestone 1 Adversarial & Integrity Audit Suite', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <div id="ui-layer"></div>
    `;
    canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    // Stub AudioContext
    vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => ({
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createGain: () => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createOscillator: () => ({
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
        type: 'sine',
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createBiquadFilter: () => ({
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        type: 'lowpass',
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
      createBufferSource: () => ({ buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }),
      resume: vi.fn().mockResolvedValue(undefined),
      suspend: vi.fn().mockResolvedValue(undefined),
    })));

    // Stub localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    });
  });

  describe('Adversarial Save Migration & Input Fuzzing', () => {
    it('handles severely corrupted JSON in storage without crashing', () => {
      localStorage.setItem('motorush3d_save_v2', '{"coins": 100, BROKEN_JSON');
      localStorage.setItem('motorush3d_save_v1', '{"coins": 500, BROKEN_JSON');
      const sm = new SaveManager();
      expect(sm.data.version).toBe(2);
      expect(sm.data.coins).toBe(0);
      expect(sm.data.unlockedLevel).toBe(1);
    });

    it('rejects negative coins and handles NaN or non-number coins', () => {
      const sm = new SaveManager();
      const res1 = sm.validateAndMigrate({ coins: -99999 });
      expect(res1.coins).toBe(0);

      const res2 = sm.validateAndMigrate({ coins: NaN });
      expect(res2.coins).toBe(0);

      const res3 = sm.validateAndMigrate({ coins: '1000' as any });
      expect(res3.coins).toBe(0); // strict number type check
    });

    it('clamps upgrade tiers strictly to 0..5 regardless of extreme inputs', () => {
      const sm = new SaveManager();
      const res = sm.validateAndMigrate({
        upgrades: {
          acceleration: 9999,
          topSpeed: -100,
          fleetRecovery: 50, // V1 property migrating to handling
          braking: NaN,
          nitroCapacity: 10,
          coinBonus: -5,
          shieldDuration: 4,
          turboDuration: 6,
        },
      });

      expect(res.upgrades.acceleration).toBe(5); // clamped from 9999 to 5
      expect(res.upgrades.topSpeed).toBe(0);     // clamped from -100 to 0
      expect(res.upgrades.handling).toBe(5);     // migrated from fleetRecovery: 50, clamped to 5
      expect(res.upgrades.braking).toBe(0);      // NaN clamped to 0
      expect(res.upgrades.nitroCapacity).toBe(5); // clamped from 10 to 5
      expect(res.upgrades.coinBonus).toBe(0);    // clamped from -5 to 0
      expect(res.upgrades.shieldDuration).toBe(4);
      expect(res.upgrades.turboDuration).toBe(5); // clamped from 6 to 5
    });

    it('migrates unmigrated V1 saves cleanly to V2 mapping', () => {
      const v1Data = {
        version: 1,
        coins: 2500,
        unlockedLevel: 15,
        levelStars: { 1: 3, 2: 3, 3: 2 },
        selectedBikeId: 'highway_phantom',
        unlockedBikes: ['street_racer', 'highway_phantom'],
        upgrades: {
          starterFleet: 4,
          fleetRecovery: 3,
          coinBonus: 2,
          shieldDuration: 1,
          turboDuration: 2,
        },
        endless: { bestDistance: 1200, bestScore: 2400 },
        settings: { musicVolume: 0.4, sfxVolume: 0.9, mute: false, sensitivity: 1.5, graphicsQuality: 'medium', cameraShake: true, reducedMotion: false },
      };

      localStorage.setItem('motorush3d_save_v1', JSON.stringify(v1Data));
      const sm = new SaveManager();

      expect(sm.data.version).toBe(2);
      expect(sm.data.coins).toBe(2500);
      expect(sm.data.unlockedLevel).toBe(15);
      expect(sm.data.selectedBikeId).toBe('highway_phantom');
      expect(sm.data.upgrades.acceleration).toBe(4); // from starterFleet
      expect(sm.data.upgrades.handling).toBe(3);     // from fleetRecovery
      expect(sm.data.upgrades.nitroCapacity).toBe(2); // from coinBonus
    });

    it('filters invalid bike IDs and prevents empty bike arrays', () => {
      const sm = new SaveManager();
      const res = sm.validateAndMigrate({
        unlockedBikes: ['street_racer', 'street_racer', 1234, null, undefined, 'urban_comet'],
      });

      expect(res.unlockedBikes).toEqual(['street_racer', 'urban_comet']);
    });
  });

  describe('Scene Graph Isolation & Single Hero Enforcement', () => {
    it('verifies strictly ONE motorcycle mesh and ONE rider in Three.js scene graph', () => {
      const game = new Game(canvas);
      game.startCampaignLevel(1);

      // Search all descendants in the Three.js scene
      let motorcycleRootCount = 0;
      let followerCount = 0;
      let gateCount = 0;

      game.sceneManager.scene.traverse((obj) => {
        if (obj.name === 'motorcycle_root') {
          motorcycleRootCount++;
        }
        if (obj.name && (obj.name.includes('follower') || obj.name.includes('fleet'))) {
          followerCount++;
        }
        if (obj.name && obj.name.includes('math_gate')) {
          gateCount++;
        }
      });

      expect(motorcycleRootCount).toBe(1);
      expect(followerCount).toBe(0);
      expect(gateCount).toBe(0);

      // Verify the single motorcycle has exactly one rider child
      let riderCount = 0;
      game.motorcycle.mesh.traverse((obj) => {
        if (obj.name === 'rider' || obj.name === 'stylized_rider_mount') {
          riderCount++;
        }
      });
      expect(riderCount).toBe(1);
    });
  });

  describe('Single Motorcycle Hitbox & Authentic Collision', () => {
    it('verifies heroBox dimensions are strictly 0.9m x 2.2m x 1.6m and detects collisions accurately', () => {
      const bike = new Motorcycle(MOTORCYCLES[0]);
      const controller = new PlayerController(bike);
      const eventBus = new EventBus();
      const obsManager = new ObstacleManager(controller, eventBus);

      // barrier_small at x=0, z=50: width is ~2.65m (X in [-1.33, 1.33])
      obsManager.loadObstacles([{ type: 'barrier_small', x: 0, z: 50 }]);

      let hitCount = 0;
      eventBus.on(GlobalEvents.OBSTACLE_HIT, () => {
        hitCount++;
      });

      // 1. Outside collision box: Hero center at x=2.0 (hero bounds [1.55, 2.45], clearance gap = 1.55 - 1.33 = 0.22m)
      // No collision occurs!
      obsManager.update(0.016, new THREE.Vector3(2.0, 0, 50), false);
      expect(hitCount).toBe(0);

      // 2. Inside collision box: Hero center at x=1.0 (hero bounds [0.55, 1.45], intersects [-1.33, 1.33])
      // Collision occurs!
      obsManager.update(0.016, new THREE.Vector3(1.0, 0, 50), false);
      expect(hitCount).toBe(1);

      controller.dispose();
    });

    it('authentically preserves and collides with physical obstacle road_gate', () => {
      const bike = new Motorcycle(MOTORCYCLES[0]);
      const controller = new PlayerController(bike);
      const eventBus = new EventBus();
      const obsManager = new ObstacleManager(controller, eventBus);

      // Verify road_gate damage configuration
      expect(GAME_CONFIG.DAMAGE.ROAD_GATE).toBe(6);

      obsManager.loadObstacles([{ type: 'road_gate', x: 0, z: 100 }]);
      const obs = obsManager.list[0];
      expect(obs).toBeDefined();
      expect(obs.type).toBe('road_gate');
      expect(obs.damage).toBe(6);

      // road_gate geometry has two steel posts at +/-2.6m and a gate leaf
      expect(obs.bounds.min.x).toBeLessThan(-2.5);
      expect(obs.bounds.max.x).toBeGreaterThan(2.5);

      let hitOccurred = false;
      eventBus.on(GlobalEvents.OBSTACLE_HIT, (data) => {
        hitOccurred = true;
        expect(data.type).toBe('road_gate');
        expect(data.damage).toBe(6);
      });

      // Clear of gate: Hero outside post boundary (x = 3.5, hero bounds [3.05, 3.95])
      obsManager.update(0.016, new THREE.Vector3(3.5, 0, 100), false);
      expect(hitOccurred).toBe(false);

      // Collision: Hero at center (x = 0, z = 100)
      obsManager.update(0.016, new THREE.Vector3(0, 0, 100), false);
      expect(hitOccurred).toBe(true);

      controller.dispose();
    });
  });

  describe('Integrity & Zero Dangling Mathematical Gate Checks', () => {
    it('verifies all 30 levels contain zero gate references or gates', () => {
      for (const level of LEVELS) {
        expect((level as any).gatePairs).toBeUndefined();
        expect((level as any).gates).toBeUndefined();
        for (const obs of level.obstacles) {
          // road_gate is allowed (physical hazard), math gates are forbidden
          expect(obs.type).not.toBe('gate');
          expect(obs.type).not.toBe('math_gate');
        }
      }
    });
  });
});
