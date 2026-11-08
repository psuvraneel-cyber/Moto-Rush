import * as THREE from 'three';
import { GameState, StateMachine } from './GameState';
import { EventBus, GlobalEvents } from './EventBus';
import { GameLoop } from './GameLoop';
import { GAME_CONFIG } from './GameConfig';
import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager } from '../progression/EconomyManager';
import { GarageManager, MOTORCYCLES } from '../progression/GarageManager';
import { UpgradeManager } from '../progression/UpgradeManager';
import { DailyChallengeManager } from '../progression/DailyChallengeManager';
import { AchievementManager } from '../progression/AchievementManager';
import { AudioManager } from '../audio/AudioManager';
import { SceneManager } from '../rendering/SceneManager';
import { Motorcycle } from '../player/Motorcycle';
import { PlayerController } from '../player/PlayerController';
import { FleetManager } from '../convoy/FleetManager';
import { GateManager } from '../gameplay/GateManager';
import { ObstacleManager } from '../gameplay/ObstacleManager';
import { CoinManager } from '../gameplay/CoinManager';
import { PowerUpManager } from '../gameplay/PowerUpManager';
import { CampaignMode } from '../modes/CampaignMode';
import { EndlessMode } from '../modes/EndlessMode';
import { UIManager } from '../ui/UIManager';
import { LocalPlatformAdapter } from '../platform/LocalPlatformAdapter';
import { MathUtils } from '../utilities/MathUtils';

export class Game {
  public stateMachine: StateMachine;
  public eventBus: EventBus;
  public saveManager: SaveManager;
  public economyManager: EconomyManager;
  public garageManager: GarageManager;
  public upgradeManager: UpgradeManager;
  public dailyChallengeManager: DailyChallengeManager;
  public achievementManager: AchievementManager;
  public audioManager: AudioManager;
  public platformAdapter: LocalPlatformAdapter;

  public sceneManager: SceneManager;
  public motorcycle: Motorcycle;
  public playerController: PlayerController;
  public fleetManager: FleetManager;
  public gateManager: GateManager;
  public obstacleManager: ObstacleManager;
  public coinManager: CoinManager;
  public powerUpManager: PowerUpManager;

  public campaignMode: CampaignMode;
  public endlessMode: EndlessMode;
  public uiManager: UIManager;
  public gameLoop: GameLoop;

  private isEndless: boolean = false;
  private currentTrackLength: number = 400;
  private finishSequenceTimer: number = 0;
  private menuTurntableAngle: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.eventBus = new EventBus();
    this.stateMachine = new StateMachine(GameState.BOOT);

    this.saveManager = new SaveManager();
    this.economyManager = new EconomyManager(this.saveManager);
    this.garageManager = new GarageManager(this.saveManager, this.economyManager);
    this.upgradeManager = new UpgradeManager(this.saveManager, this.economyManager);
    this.dailyChallengeManager = new DailyChallengeManager(this.saveManager, this.economyManager, this.eventBus);
    this.achievementManager = new AchievementManager(this.saveManager, this.economyManager, this.eventBus);
    this.audioManager = new AudioManager();
    this.platformAdapter = new LocalPlatformAdapter();

    // Scene & Rendering
    this.sceneManager = new SceneManager(canvas);

    // Hero motorcycle
    const initialBike = this.garageManager.selectedBike;
    this.motorcycle = new Motorcycle(initialBike);
    this.sceneManager.scene.add(this.motorcycle.mesh);

    // Player Controller
    this.playerController = new PlayerController(this.motorcycle);

    // Convoy Fleet
    this.fleetManager = new FleetManager(this.eventBus);
    this.fleetManager.setMotorcycleColor(initialBike.primaryColor);
    this.sceneManager.scene.add(this.fleetManager.rendererGroup);

    // Gameplay managers
    this.gateManager = new GateManager(this.fleetManager, this.eventBus);
    this.obstacleManager = new ObstacleManager(this.fleetManager, this.playerController, this.eventBus);
    this.coinManager = new CoinManager(this.eventBus);
    this.powerUpManager = new PowerUpManager(
      this.upgradeManager,
      this.playerController,
      this.fleetManager,
      this.eventBus
    );

    this.sceneManager.scene.add(
      this.gateManager.group,
      this.obstacleManager.group,
      this.coinManager.group,
      this.powerUpManager.group
    );

    // Game modes
    this.campaignMode = new CampaignMode(this.saveManager, this.economyManager, this.eventBus);
    this.endlessMode = new EndlessMode(this.saveManager);

    // UI Manager
    this.uiManager = new UIManager(
      this.saveManager,
      this.economyManager,
      this.garageManager,
      this.upgradeManager,
      this.dailyChallengeManager,
      this.achievementManager,
      this.audioManager,
      this.eventBus
    );

    // Game loop
    this.gameLoop = new GameLoop(this.update, this.render);

    this.initSystem();
  }

  private initSystem(): void {
    this.applySettings();
    this.setupEventSubscriptions();

    this.uiManager.init({
      onPlayCampaign: (lvl) => this.startCampaignLevel(lvl),
      onPlayEndless: () => this.startEndlessRun(),
      onResume: () => this.resumeGame(),
      onRestart: () => this.restartCurrentRun(),
      onQuitToMenu: () => this.returnToMainMenu(),
      onSelectBike: (id) => this.switchBike(id),
      onSettingsChanged: () => this.applySettings(),
    });

    this.stateMachine.transitionTo(GameState.MAIN_MENU);
    this.setupMainMenuShowroom();

    this.gameLoop.start();
  }

  public applySettings(): void {
    const s = this.saveManager.data.settings;
    this.audioManager.setSettings(s.sfxVolume, s.musicVolume, s.mute);
    this.playerController.setSensitivity(s.sensitivity);
    this.sceneManager.renderer.applyQualityPreset(s.graphicsQuality);
    this.sceneManager.cameraController.setSettings(s.cameraShake, s.reducedMotion);
    this.fleetManager.setGraphicsPreset(s.graphicsQuality);
  }

  private setupEventSubscriptions(): void {
    this.eventBus.on(GlobalEvents.GATE_PASSED, (data) => {
      if (data.isPositive) {
        if (data.effect.operation === 'MULTIPLY') {
          this.audioManager.playMultiplierChime();
          this.achievementManager.unlock('first_multiplier');
          this.dailyChallengeManager.addProgress('pass_multipliers', 1);
        } else {
          this.audioManager.playPositiveGate();
        }
      } else {
        this.audioManager.playNegativeGate();
      }

      if (this.fleetManager.count >= 25) {
        this.achievementManager.unlock('convoy_builder');
      }
      if (this.fleetManager.count >= 100) {
        this.achievementManager.unlock('fleet_master');
      }
    });

    this.eventBus.on(GlobalEvents.OBSTACLE_HIT, (data) => {
      this.audioManager.playCrash();
      this.motorcycle.setInvulnerable(GAME_CONFIG.INVULNERABILITY_AFTER_HIT_DURATION);
    });

    this.eventBus.on(GlobalEvents.COIN_COLLECTED, () => {
      this.audioManager.playCoin();
      this.dailyChallengeManager.addProgress('collect_coins', 1);
      if (this.coinManager.collected >= 150) {
        this.achievementManager.unlock('coin_collector');
      }
    });

    this.eventBus.on(GlobalEvents.POWERUP_COLLECTED, (data) => {
      if (data.type === 'turbo') {
        this.audioManager.playTurbo();
        this.sceneManager.cameraController.addShake(0.3);
      } else if (data.type === 'shield') {
        this.audioManager.playShield();
      } else if (data.type === 'repair') {
        this.audioManager.playPositiveGate();
      } else {
        this.audioManager.playCoin();
      }
    });

    this.eventBus.on(GlobalEvents.CAMERA_SHAKE, (data) => {
      this.sceneManager.cameraController.addShake(data.intensity);
    });
  }

  private setupMainMenuShowroom(): void {
    const bike = this.garageManager.selectedBike;
    this.motorcycle.changeMotorcycle(bike);
    this.motorcycle.reset(0, 0);
    this.fleetManager.reset(1);
    this.sceneManager.cameraController.reset(this.motorcycle.position);
    this.sceneManager.applyEnvironment('sunny_city', 200);
  }

  public switchBike(bikeId: string): void {
    const bike = MOTORCYCLES.find(b => b.id === bikeId);
    if (!bike) return;
    this.motorcycle.changeMotorcycle(bike);
    this.fleetManager.setMotorcycleColor(bike.primaryColor);
  }

  public startCampaignLevel(levelNum: number): void {
    this.audioManager.ensureContext();
    this.audioManager.startMusic();
    this.audioManager.startEngine();

    this.isEndless = false;
    this.campaignMode.setLevel(levelNum);
    const def = this.campaignMode.currentLevel;

    this.currentTrackLength = def.trackLength;
    this.sceneManager.applyEnvironment(def.environmentId, def.trackLength);

    // Add upgrade starter fleet bonus + bike bonus
    const upgradeBonus = this.upgradeManager.getStarterFleetBonus();
    const bikeBonus = this.garageManager.selectedBike.bonusFleet;
    const totalStartFleet = def.startingFleet + upgradeBonus + bikeBonus;

    this.playerController.reset(0, 0);
    this.fleetManager.reset(totalStartFleet);
    this.gateManager.loadGatePairs(def.gatePairs);
    this.obstacleManager.loadObstacles(def.obstacles);
    this.coinManager.loadCoins(def.coinGroups);
    this.powerUpManager.loadPowerUps(def.powerUps);

    this.sceneManager.cameraController.reset(this.motorcycle.position);

    this.campaignMode.startLevel();
    this.stateMachine.transitionTo(GameState.RUNNING);
    this.uiManager.showScreen('screen-hud');
  }

  public startEndlessRun(): void {
    this.audioManager.ensureContext();
    this.audioManager.startMusic();
    this.audioManager.startEngine();

    this.isEndless = true;
    this.endlessMode.reset(Date.now());

    this.currentTrackLength = 99999;
    this.sceneManager.applyEnvironment('neon_future', 1000);

    const upgradeBonus = this.upgradeManager.getStarterFleetBonus();
    const bikeBonus = this.garageManager.selectedBike.bonusFleet;
    const totalStartFleet = 2 + upgradeBonus + bikeBonus;

    this.playerController.reset(0, 0);
    this.fleetManager.reset(totalStartFleet);
    this.gateManager.clear();
    this.obstacleManager.clear();
    this.coinManager.clear();
    this.powerUpManager.clear();

    // Generate initial chunks
    for (let i = 0; i < 3; i++) {
      this.spawnEndlessChunk();
    }

    this.sceneManager.cameraController.reset(this.motorcycle.position);
    this.stateMachine.transitionTo(GameState.RUNNING);
    this.uiManager.showScreen('screen-hud');
  }

  private spawnEndlessChunk(): void {
    const chunk = this.endlessMode.generateNextChunk();
    for (const gp of chunk.gatePairs) {
      this.gateManager.loadGatePairs([...this.gateManager.pairs.map(p => ({ z: p.z, left: p.leftGate.effect, right: p.rightGate.effect })), gp]);
    }
    for (const obs of chunk.obstacles) {
      this.obstacleManager.loadObstacles([...this.obstacleManager.list.map(o => (o as any).def), obs]);
    }
    for (const cg of chunk.coinGroups) {
      this.coinManager.loadCoins([cg]);
    }
    for (const pu of chunk.powerUps) {
      this.powerUpManager.loadPowerUps([pu]);
    }
  }

  public resumeGame(): void {
    this.gameLoop.setPaused(false);
    this.audioManager.startEngine();
    this.stateMachine.transitionTo(GameState.RUNNING);
  }

  public pauseGame(): void {
    this.gameLoop.setPaused(true);
    this.audioManager.stopEngine();
    this.stateMachine.transitionTo(GameState.PAUSED);
    this.uiManager.showScreen('screen-pause');
  }

  public restartCurrentRun(): void {
    this.gameLoop.setPaused(false);
    if (this.isEndless) {
      this.startEndlessRun();
    } else {
      this.startCampaignLevel(this.campaignMode.levelNumber);
    }
  }

  public returnToMainMenu(): void {
    this.gameLoop.setPaused(false);
    this.audioManager.stopEngine();
    this.audioManager.stopMusic();

    this.gateManager.clear();
    this.obstacleManager.clear();
    this.coinManager.clear();
    this.powerUpManager.clear();

    this.setupMainMenuShowroom();
    this.stateMachine.transitionTo(GameState.MAIN_MENU);
    this.uiManager.showScreen('screen-main-menu');
  }

  private update = (dt: number, totalTime: number): void => {
    const state = this.stateMachine.current;

    if (state === GameState.MAIN_MENU || state === GameState.GARAGE) {
      // Gentle rotating showroom inspection
      this.menuTurntableAngle += dt * 0.7;
      this.motorcycle.mesh.rotation.y = this.menuTurntableAngle;
      return;
    }

    if (state === GameState.RUNNING) {
      // 1. Player updates
      this.playerController.update(dt);
      const heroPos = this.motorcycle.position;
      const speed = this.playerController.speed;
      const lean = this.playerController.lean;
      const isTurbo = this.powerUpManager.isActive('turbo');
      const isShielded = this.powerUpManager.isActive('shield');
      const isMagnet = this.powerUpManager.isActive('magnet');

      // 2. Audio engine pitch
      const speedRatio = speed / GAME_CONFIG.BASE_SPEED;
      this.audioManager.updateEnginePitch(speedRatio, isTurbo);

      // 3. Convoy fleet updates
      this.fleetManager.update(dt, heroPos, lean);

      // 4. Gameplay entities
      this.gateManager.update(dt, heroPos.x, heroPos.z);
      this.obstacleManager.update(dt, heroPos, isShielded);
      this.coinManager.update(dt, heroPos, isMagnet);
      this.powerUpManager.update(dt, heroPos);

      // 5. Lighting & Camera follow
      this.sceneManager.lighting.update(heroPos.z);
      this.sceneManager.cameraController.update(dt, heroPos, this.fleetManager.count, isTurbo);

      // 6. Mode logic
      if (this.isEndless) {
        this.endlessMode.updateDistance(heroPos.z, this.fleetManager.count);
        if (this.endlessMode.shouldGenerateNextChunk(heroPos.z)) {
          this.spawnEndlessChunk();
        }
        if (this.endlessMode.distance >= 500) {
          this.achievementManager.unlock('endless_explorer');
        }

        this.uiManager.updateHUD(
          this.fleetManager.count,
          0,
          0,
          this.endlessMode.distance,
          this.coinManager.collected,
          true
        );
      } else {
        const progress = MathUtils.clamp(heroPos.z / this.currentTrackLength, 0, 1);
        this.uiManager.updateHUD(
          this.fleetManager.count,
          0,
          this.campaignMode.levelNumber,
          progress,
          this.coinManager.collected,
          false
        );

        // Check Finish Line
        if (heroPos.z >= this.currentTrackLength) {
          this.triggerFinishSequence();
        }
      }
    } else if (state === GameState.FINISHING) {
      // Decelerate smoothly
      this.finishSequenceTimer += dt;
      this.playerController.update(dt * Math.max(0, 1 - this.finishSequenceTimer * 0.7));
      this.fleetManager.update(dt, this.motorcycle.position, 0);

      this.sceneManager.cameraController.update(
        dt,
        this.motorcycle.position,
        this.fleetManager.count
      );

      if (this.finishSequenceTimer >= 2.2) {
        this.completeLevel();
      }
    }
  };

  private triggerFinishSequence(): void {
    this.stateMachine.transitionTo(GameState.FINISHING);
    this.finishSequenceTimer = 0;
    this.audioManager.stopEngine();
    this.audioManager.playVictory();
    this.sceneManager.cameraController.setCelebrating(true);
  }

  private completeLevel(): void {
    const surviving = this.fleetManager.count;
    const collected = this.coinManager.collected;
    const zeroDamage = this.fleetManager.lostBikes === 0;

    const rewards = this.campaignMode.finishLevel(surviving, collected, zeroDamage);

    this.dailyChallengeManager.addProgress('complete_levels', 1);

    if (this.campaignMode.levelNumber === 1) {
      this.achievementManager.unlock('first_ride');
    }
    if (rewards.stars === 3) {
      this.achievementManager.unlock('perfect_run');
    }
    if (zeroDamage) {
      this.achievementManager.unlock('no_damage_run');
    }

    this.stateMachine.transitionTo(GameState.RESULTS);
    this.uiManager.showResults(rewards, surviving, false);
  }

  private render = (): void => {
    this.sceneManager.render();
  };
}
