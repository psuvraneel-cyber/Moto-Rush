import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Game } from '../core/Game';
import { GameState } from '../core/GameState';
import { GlobalEvents } from '../core/EventBus';

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

describe('Game Full Integration Suite', () => {
  let canvas: HTMLCanvasElement;
  let uiLayer: HTMLElement;

  beforeEach(() => {
    // Setup clean DOM
    document.body.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <div id="ui-layer"></div>
    `;

    canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    uiLayer = document.getElementById('ui-layer') as HTMLElement;

    // Mock audio context
    vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => ({
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createGain: () => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createOscillator: () => ({
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        type: 'sine',
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createBiquadFilter: () => ({
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        Q: { setValueAtTime: vi.fn() },
        type: 'lowpass',
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createBuffer: () => ({
        getChannelData: () => new Float32Array(100),
      }),
      createBufferSource: () => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      resume: vi.fn().mockResolvedValue(undefined),
      suspend: vi.fn().mockResolvedValue(undefined),
    })));

    // Mock storage
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
  });

  it('boots game and lands in MAIN_MENU state', () => {
    const game = new Game(canvas);
    expect(game.stateMachine.current).toBe(GameState.MAIN_MENU);
    expect(uiLayer.querySelector('.game-title')?.textContent).toContain('MOTO RUSH 3D');
  });

  it('starts campaign level 1 with strictly ONE motorcycle and ONE rider in scene graph', () => {
    const game = new Game(canvas);
    game.startCampaignLevel(1);

    expect(game.stateMachine.current).toBe(GameState.RUNNING);
    expect(game.campaignMode.levelNumber).toBe(1);
    expect(game.motorcycle.mesh).toBeDefined();

    // Verify scene graph contains exactly one motorcycle mesh
    const bikeMeshes = game.sceneManager.scene.children.filter(
      (c) => c.name === 'motorcycle_root'
    );
    expect(bikeMeshes.length).toBe(1);

    // Verify no gate manager or fleet manager exists on game
    expect((game as any).fleetManager).toBeUndefined();
    expect((game as any).gateManager).toBeUndefined();
  });

  it('executes near-miss overtakes and awards bonus combo score', () => {
    const game = new Game(canvas);
    game.startCampaignLevel(1);

    const coinsBefore = game.coinManager.collected;
    game.eventBus.emit(GlobalEvents.NEAR_MISS);

    // Near miss awards bonus coins and increments streak
    expect(game.coinManager.collected).toBeGreaterThanOrEqual(coinsBefore + 5);
  });

  it('absorbs damage when shielded', () => {
    const game = new Game(canvas);
    game.startCampaignLevel(2);

    game.powerUpManager.activatePowerUp('shield');
    expect(game.powerUpManager.isActive('shield')).toBe(true);

    let hitData: any = null;
    game.eventBus.on(GlobalEvents.OBSTACLE_HIT, (data) => {
      hitData = data;
    });

    // Obstacle hit while shielded
    game.obstacleManager.update(0.016, new THREE.Vector3(2.5, 0, 270), true);
    expect(hitData).not.toBeNull();
    expect(hitData.wasShielded).toBe(true);
  });

  it('completes level and awards coins upon crossing finish line', () => {
    const game = new Game(canvas);
    game.startCampaignLevel(1);

    const def = game.campaignMode.currentLevel;
    const coinsBefore = game.economyManager.coins;

    // Move player across finish line
    game.playerController.reset(0, def.trackLength + 1);

    // Call update to trigger finish sequence
    (game as any).update(0.016, 0.016);
    expect(game.stateMachine.current).toBe(GameState.FINISHING);

    // Fast-forward finish timer (2.3s)
    (game as any).update(2.3, 2.316);
    expect(game.stateMachine.current).toBe(GameState.RESULTS);
    expect(game.economyManager.coins).toBeGreaterThan(coinsBefore);
    expect(game.saveManager.data.unlockedLevel).toBe(2);
  });

  it('allows unlocking vehicles and purchasing permanent racing upgrades', () => {
    const game = new Game(canvas);
    game.economyManager.addCoins(1000);

    // Purchase Urban Comet (300 coins)
    const bought = game.garageManager.purchaseBike('urban_comet');
    expect(bought).toBe(true);
    expect(game.garageManager.isUnlocked('urban_comet')).toBe(true);
    expect(game.saveManager.data.selectedBikeId).toBe('urban_comet');

    // Upgrade engine acceleration (100 coins)
    const upgraded = game.upgradeManager.purchaseUpgrade('acceleration');
    expect(upgraded).toBe(true);
    expect(game.upgradeManager.getLevel('acceleration')).toBe(1);
    expect(game.upgradeManager.getAccelerationBonus()).toBeCloseTo(0.12);
    expect(game.economyManager.coins).toBe(600); // 1000 - 300 - 100
  });
});
