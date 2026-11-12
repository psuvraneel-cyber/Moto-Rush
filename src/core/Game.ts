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
import { ObstacleManager } from '../gameplay/ObstacleManager';
import { CoinManager } from '../gameplay/CoinManager';
import { PowerUpManager } from '../gameplay/PowerUpManager';
import { CareerMode } from '../modes/CareerMode';
import { TrafficRushMode } from '../modes/TrafficRushMode';
import { TimeTrialMode } from '../modes/TimeTrialMode';
import { TrafficManager } from '../racing/TrafficManager';
import { OvertakeDetector } from '../racing/OvertakeDetector';
import { NearMissManager } from '../racing/NearMissManager';
import { ScoreManager } from '../racing/ScoreManager';
import { DEFAULT_SPEED_CONFIG } from '../racing/SpeedController';
import { DEFAULT_NITRO_CONFIG } from '../racing/NitroManager';
import { RivalRaceManager } from '../ai/RivalRaceManager';
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
  public obstacleManager: ObstacleManager;
  public coinManager: CoinManager;
  public powerUpManager: PowerUpManager;

  // Racing Systems
  public trafficManager: TrafficManager;
  public overtakeDetector: OvertakeDetector;
  public nearMissManager: NearMissManager;
  public scoreManager: ScoreManager;
  public rivalRaceManager: RivalRaceManager;

  // Game Modes
  public careerMode: CareerMode;
  public trafficRushMode: TrafficRushMode;
  public timeTrialMode: TimeTrialMode;

  // Backwards compatibility aliases
  public get campaignMode(): CareerMode {
    return this.careerMode;
  }
  public get endlessMode(): TrafficRushMode {
    return this.trafficRushMode;
  }

  public uiManager: UIManager;
  public gameLoop: GameLoop;

  public activeMode: 'career' | 'traffic_rush' | 'time_trial' = 'career';
  public get isEndless(): boolean {
    return this.activeMode === 'traffic_rush';
  }

  private currentTrackLength: number = 400;
  private finishSequenceTimer: number = 0;
  private menuTurntableAngle: number = 0;
  private tookDamageInLevel: boolean = false;
  private raceStartTime: number = 0;
  private prevHeroZ: number = 0;
  private lastTireSquealTime: number = 0;
  private isCrashing: boolean = false;

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

    // Hero motorcycle — strictly ONE motorcycle and ONE rider in Three.js scene graph
    const initialBike = this.garageManager.selectedBike;
    this.motorcycle = new Motorcycle(initialBike);
    this.sceneManager.scene.add(this.motorcycle.mesh);

    // Player Controller
    this.playerController = new PlayerController(this.motorcycle, undefined, this.eventBus);

    // Gameplay managers
    this.obstacleManager = new ObstacleManager(this.playerController, this.eventBus);
    this.coinManager = new CoinManager(this.eventBus);
    this.powerUpManager = new PowerUpManager(
      this.upgradeManager,
      this.playerController,
      this.eventBus
    );

    // Racing systems
    this.trafficManager = new TrafficManager();
    this.overtakeDetector = new OvertakeDetector(this.eventBus);
    this.nearMissManager = new NearMissManager(this.eventBus);
    this.scoreManager = new ScoreManager(this.eventBus);
    this.rivalRaceManager = new RivalRaceManager(this.eventBus);

    this.sceneManager.scene.add(
      this.obstacleManager.group,
      this.coinManager.group,
      this.powerUpManager.group,
      this.trafficManager.group,
      this.rivalRaceManager.group
    );

    // Game modes
    this.careerMode = new CareerMode(this.saveManager, this.economyManager, this.eventBus);
    this.trafficRushMode = new TrafficRushMode(this.saveManager);
    this.timeTrialMode = new TimeTrialMode(this.saveManager);

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
      onPlayCampaign: (lvl) => this.startCareerEvent(lvl),
      onPlayEndless: () => this.startTrafficRushRun(),
      onPlayTimeTrial: () => this.startTimeTrialRun(),
      onResume: () => this.resumeGame(),
      onRestart: () => this.restartCurrentRun(),
      onQuitToMenu: () => this.returnToMainMenu(),
      onSelectBike: (id) => this.switchBike(id),
      onSettingsChanged: () => this.applySettings(),
      onTouchThrottle: (active) => this.playerController.setThrottle(active),
      onTouchBrake: (active) => this.playerController.setBrake(active),
      onTouchNitro: (active) => this.playerController.setNitro(active),
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
  }

  private setupEventSubscriptions(): void {
    // Road hazard collision
    this.eventBus.on(GlobalEvents.OBSTACLE_HIT, (data) => {
      if (data.wasShielded) {
        this.powerUpManager.consumeShield();
        this.audioManager.playShield();
      } else {
        this.tookDamageInLevel = true;
        this.scoreManager.onCollision();
        this.uiManager.updateCombo(1);
        this.audioManager.playCrash();
        this.motorcycle.setInvulnerable(GAME_CONFIG.INVULNERABILITY_AFTER_HIT_DURATION);

        if (this.activeMode === 'traffic_rush' && data.type !== 'oil_slick') {
          this.triggerTrafficRushGameOver();
        } else if (this.activeMode === 'time_trial' && data.type !== 'oil_slick') {
          this.triggerTimeTrialGameOver(false);
        } else if (this.activeMode === 'career' && data.type !== 'oil_slick') {
          this.triggerCareerCrashGameOver();
        }
      }
    });

    // Sub-meter near-miss event
    this.eventBus.on(GlobalEvents.NEAR_MISS, () => {
      this.scoreManager.addNearMiss();
      this.audioManager.playNearMiss();
      this.sceneManager.cameraController.addShake(0.15);
      this.playerController.nitroManager.addNearMissBonus();

      if (this.activeMode === 'time_trial') {
        this.timeTrialMode.onNearMiss();
      }

      this.coinManager.addBonusCoins(5 * this.scoreManager.combo);
      this.uiManager.showNearMissToast(this.scoreManager.comboStreak);
      this.uiManager.updateCombo(this.scoreManager.combo);
      this.dailyChallengeManager.addProgress('near_miss_master', 1);
      this.achievementManager.unlock('first_overtake');
    });

    // Longitudinal traffic vehicle overtake
    this.eventBus.on(GlobalEvents.OVERTAKE, () => {
      this.scoreManager.addOvertake();
      this.audioManager.playOvertakeWhoosh();
      this.playerController.nitroManager.addOvertakeBonus();

      if (this.activeMode === 'time_trial') {
        this.timeTrialMode.onOvertake();
      }

      this.uiManager.updateCombo(this.scoreManager.combo);
      this.dailyChallengeManager.addProgress('near_miss_master', 1);
    });

    // AI Rival overtaken
    this.eventBus.on(GlobalEvents.RIVAL_OVERTAKEN, () => {
      this.scoreManager.addOvertake();
      this.audioManager.playOvertakeWhoosh();
      this.playerController.nitroManager.addOvertakeBonus();
      this.uiManager.updateCombo(this.scoreManager.combo);
    });

    // Nitro engaged
    this.eventBus.on(GlobalEvents.NITRO_ENGAGED, () => {
      this.audioManager.playNitroRoar();
      this.sceneManager.cameraController.addShake(0.18);
    });

    // Coin collected
    this.eventBus.on(GlobalEvents.COIN_COLLECTED, () => {
      this.audioManager.playCoin();
      this.dailyChallengeManager.addProgress('collect_coins', 1);
    });

    // Powerup collected
    this.eventBus.on(GlobalEvents.POWERUP_COLLECTED, (data) => {
      if (data.type === 'turbo') {
        this.audioManager.playTurbo();
        this.playerController.nitroManager.refillFull();
        this.sceneManager.cameraController.addShake(0.3);
      }
    });

    this.eventBus.on(GlobalEvents.SETTINGS_CHANGED, () => {
      this.applySettings();
    });

    this.eventBus.on(GlobalEvents.CAMERA_SHAKE, (data) => {
      this.sceneManager.cameraController.addShake(data.intensity || 0.3);
    });
  }

  private setupMainMenuShowroom(): void {
    const bike = this.garageManager.selectedBike;
    this.motorcycle.changeMotorcycle(bike);
    this.motorcycle.reset(0, 0);
    this.sceneManager.applyEnvironment('sunny_city', 200);

    const isPortrait = window.innerHeight > window.innerWidth;
    this.sceneManager.cameraController.setHeroMenuMode(isPortrait);
    this.applyUpgradesAndBikeStats();
  }

  public applyUpgradesAndBikeStats(): void {
    const bike = this.garageManager.selectedBike;
    const bikeAccelBonus = bike.accelerationBonus || (bike.accelerationRating ? (bike.accelerationRating - 75) * 0.005 : 0);
    const accelBonus = this.upgradeManager.getAccelerationBonus() + bikeAccelBonus;

    const bikeSpeedBonus = (bike.speedRating ? bike.speedRating - 75 : 0) * 0.1;
    const topSpeedBonus = this.upgradeManager.getTopSpeedBonus() + bikeSpeedBonus;

    const brakeBonus = this.upgradeManager.getBrakingBonus();
    const handlingBonus = this.upgradeManager.getHandlingBonus();
    const handlingMult = bike.handlingMultiplier || (bike.handlingRating ? bike.handlingRating / 85.0 : 1.0);

    this.playerController.speedController.updateConfig({
      accelerationRate: DEFAULT_SPEED_CONFIG.accelerationRate * (1 + accelBonus),
      maxSpeed: DEFAULT_SPEED_CONFIG.maxSpeed + topSpeedBonus,
      brakingRate: DEFAULT_SPEED_CONFIG.brakingRate * (1 + brakeBonus),
    });

    this.playerController.setHandlingModifiers(handlingMult, handlingBonus);

    const nitroCapacityBonus = this.upgradeManager.getNitroCapacityBonus() + (bike.nitroRating ? (bike.nitroRating - 70) * 0.004 : 0);
    const nitroRecoveryBonus = this.upgradeManager.getNitroRecoveryBonus();
    this.playerController.nitroManager.setConfig({
      maxFuel: DEFAULT_NITRO_CONFIG.maxFuel * (1 + nitroCapacityBonus),
      nearMissGain: DEFAULT_NITRO_CONFIG.nearMissGain * (1 + nitroRecoveryBonus),
      overtakeGain: DEFAULT_NITRO_CONFIG.overtakeGain * (1 + nitroRecoveryBonus),
    });
  }

  public switchBike(bikeId: string): void {
    const bike = MOTORCYCLES.find(b => b.id === bikeId);
    if (!bike) return;
    this.motorcycle.changeMotorcycle(bike);
    this.applyUpgradesAndBikeStats();
  }

  public startCampaignLevel(levelNum: number): void {
    this.startCareerEvent(levelNum);
  }

  public startEndlessRun(): void {
    this.startTrafficRushRun();
  }

  public startCareerEvent(levelNum: number): void {
    this.applyUpgradesAndBikeStats();
    this.audioManager.ensureContext();
    this.audioManager.startMusic();
    this.audioManager.startEngine();

    this.activeMode = 'career';
    this.tookDamageInLevel = false;
    this.isCrashing = false;
    this.raceStartTime = performance.now();
    this.prevHeroZ = 0;

    this.scoreManager.reset();
    this.overtakeDetector.reset();
    this.nearMissManager.reset();
    this.uiManager.updateCombo(1);

    this.playerController.setEndlessSpeedMultiplier(1.0);
    this.careerMode.setLevel(levelNum);
    const def = this.careerMode.currentLevel;

    this.currentTrackLength = def.trackLength;
    this.sceneManager.applyEnvironment(def.environmentId, def.trackLength);

    this.playerController.reset(0, 0);
    this.obstacleManager.loadObstacles(def.obstacles);
    this.coinManager.loadCoins(def.coinGroups);
    this.powerUpManager.loadPowerUps(def.powerUps);

    // Setup Traffic for this career event
    this.trafficManager.clear();
    const trafficDensity = Math.min(16, 7 + Math.floor(levelNum / 2.5));
    this.trafficManager.setDensity(trafficDensity);

    // Initial pre-populated traffic ahead of player (40m to 180m)
    for (let z = 45; z < Math.min(def.trackLength - 30, 240); z += 32) {
      const lane = Math.floor(Math.random() * 4);
      this.trafficManager.spawnVehicle('sedan', lane, z);
    }

    // Spawn AI Rival Racers on rival duel events (every 6 levels, e.g. 6, 12, 18, 24, 30)
    this.rivalRaceManager.clear();
    if (levelNum % 6 === 0) {
      this.rivalRaceManager.spawnRivals(3, 35);
    }

    this.sceneManager.cameraController.reset(this.motorcycle.position);
    this.careerMode.startLevel();
    this.stateMachine.transitionTo(GameState.RUNNING);
    this.uiManager.showScreen('screen-hud');
  }

  public startTrafficRushRun(): void {
    this.applyUpgradesAndBikeStats();
    this.audioManager.ensureContext();
    this.audioManager.startMusic();
    this.audioManager.startEngine();

    this.activeMode = 'traffic_rush';
    this.tookDamageInLevel = false;
    this.isCrashing = false;
    this.raceStartTime = performance.now();
    this.prevHeroZ = 0;

    this.scoreManager.reset();
    this.overtakeDetector.reset();
    this.nearMissManager.reset();
    this.uiManager.updateCombo(1);

    this.trafficRushMode.reset(Date.now());
    this.playerController.setEndlessSpeedMultiplier(1.0);

    this.currentTrackLength = 99999;
    this.sceneManager.applyEnvironment('neon_future', 1000);

    this.playerController.reset(0, 0);
    this.obstacleManager.clear();
    this.coinManager.clear();
    this.powerUpManager.clear();
    this.rivalRaceManager.clear();

    // Traffic setup
    this.trafficManager.clear();
    this.trafficManager.setDensity(this.trafficRushMode.getTrafficDensity());
    for (let z = 50; z < 250; z += 35) {
      const lane = Math.floor(Math.random() * 4);
      this.trafficManager.spawnVehicle('compact', lane, z);
    }

    // Generate initial chunks for hazards & pickups
    for (let i = 0; i < 3; i++) {
      this.spawnTrafficRushChunk();
    }

    this.sceneManager.cameraController.reset(this.motorcycle.position);
    this.stateMachine.transitionTo(GameState.RUNNING);
    this.uiManager.showScreen('screen-hud');
  }

  public startTimeTrialRun(): void {
    this.applyUpgradesAndBikeStats();
    this.audioManager.ensureContext();
    this.audioManager.startMusic();
    this.audioManager.startEngine();

    this.activeMode = 'time_trial';
    this.tookDamageInLevel = false;
    this.isCrashing = false;
    this.raceStartTime = performance.now();
    this.prevHeroZ = 0;

    this.scoreManager.reset();
    this.overtakeDetector.reset();
    this.nearMissManager.reset();
    this.timeTrialMode.reset(35.0);
    this.uiManager.updateCombo(1);

    this.playerController.setEndlessSpeedMultiplier(1.0);
    this.currentTrackLength = 99999;
    this.sceneManager.applyEnvironment('desert_expressway', 1000);

    this.playerController.reset(0, 0);
    this.obstacleManager.clear();
    this.coinManager.clear();
    this.powerUpManager.clear();
    this.rivalRaceManager.clear();

    // Time Trial Traffic
    this.trafficManager.clear();
    this.trafficManager.setDensity(12);
    for (let z = 45; z < 260; z += 30) {
      const lane = Math.floor(Math.random() * 4);
      this.trafficManager.spawnVehicle('sports_car', lane, z);
    }

    // Generate initial chunks
    for (let i = 0; i < 3; i++) {
      this.spawnTrafficRushChunk();
    }

    this.sceneManager.cameraController.reset(this.motorcycle.position);
    this.stateMachine.transitionTo(GameState.RUNNING);
    this.uiManager.showScreen('screen-hud');
  }

  private spawnTrafficRushChunk(): void {
    const chunk = this.trafficRushMode.generateNextChunk();
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
    if (this.activeMode === 'career') {
      this.startCareerEvent(this.careerMode.levelNumber);
    } else if (this.activeMode === 'traffic_rush') {
      this.startTrafficRushRun();
    } else {
      this.startTimeTrialRun();
    }
  }

  public returnToMainMenu(): void {
    this.gameLoop.setPaused(false);
    this.audioManager.stopEngine();
    this.audioManager.stopMusic();

    this.tookDamageInLevel = false;
    this.isCrashing = false;
    this.obstacleManager.clear();
    this.coinManager.clear();
    this.powerUpManager.clear();
    this.trafficManager.clear();
    this.rivalRaceManager.clear();

    this.setupMainMenuShowroom();
    this.stateMachine.transitionTo(GameState.MAIN_MENU);
    this.uiManager.showScreen('screen-main-menu');
  }

  private triggerTrafficRushGameOver(): void {
    this.stateMachine.transitionTo(GameState.RESULTS);
    this.audioManager.stopEngine();
    this.audioManager.playCrash();

    this.trafficRushMode.saveRecord();
    const dist = Math.floor(this.trafficRushMode.distance);
    const bestDist = Math.floor(this.trafficRushMode.bestDistance);
    const collected = this.coinManager.collected;

    this.economyManager.addCoins(collected);

    const finalStats = this.scoreManager.getFinalStats(collected);

    const rewards = {
      baseReward: dist,
      cleanBonus: 0,
      collectedCoins: collected,
      upgradeBonus: 0,
      totalCoins: collected,
      stars: 0,
    };

    this.uiManager.showResults(rewards, 0, true, dist, bestDist, {
      ...finalStats,
      mode: 'traffic_rush',
      isVictory: false,
    });
  }

  private triggerTimeTrialGameOver(isVictory: boolean): void {
    this.stateMachine.transitionTo(GameState.RESULTS);
    this.audioManager.stopEngine();
    if (isVictory) {
      this.audioManager.playVictory();
    } else {
      this.audioManager.playCrash();
    }

    const dist = Math.floor(this.timeTrialMode.distance);
    const collected = this.coinManager.collected;
    this.economyManager.addCoins(collected);

    const finalStats = this.scoreManager.getFinalStats(collected);

    const rewards = {
      baseReward: Math.floor(dist / 2),
      cleanBonus: isVictory ? 150 : 0,
      collectedCoins: collected,
      upgradeBonus: 0,
      totalCoins: collected + (isVictory ? 150 : 0),
      stars: 0,
    };

    this.uiManager.showResults(rewards, 0, false, dist, dist, {
      ...finalStats,
      mode: 'time_trial',
      isVictory,
    });
  }

  private triggerCareerCrashGameOver(): void {
    if (this.isCrashing || this.stateMachine.current !== GameState.RUNNING) return;
    this.isCrashing = true;

    this.stateMachine.transitionTo(GameState.RESULTS);
    this.audioManager.stopEngine();
    this.audioManager.playCrash();
    this.sceneManager.cameraController.addShake(0.65);

    const dist = Math.floor(this.motorcycle.position.z);
    const collected = this.coinManager.collected;
    this.economyManager.addCoins(collected);

    const finalStats = this.scoreManager.getFinalStats(collected);

    const rewards = {
      baseReward: Math.floor(dist / 2),
      cleanBonus: 0,
      collectedCoins: collected,
      upgradeBonus: 0,
      totalCoins: collected,
      stars: 0,
    };

    this.uiManager.showResults(rewards, 0, false, dist, this.currentTrackLength, {
      ...finalStats,
      distance: dist,
      mode: 'career',
      isVictory: false,
    });
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
      const deltaZ = Math.max(0, heroPos.z - this.prevHeroZ);
      this.prevHeroZ = heroPos.z;

      const isBoosting = this.playerController.nitroManager.isBoosting;
      const isShielded = this.powerUpManager.isActive('shield');
      const isMagnet = this.powerUpManager.isActive('magnet');

      // 2. Audio engine pitch (with 6-speed gear RPM curves)
      const speedRatio = speed / 20.0;
      this.audioManager.updateEnginePitch(speedRatio, isBoosting);

      // Tire squeal on aggressive braking at speed
      if (this.playerController.isBraking && speed > 16.0) {
        if (totalTime - this.lastTireSquealTime > 1.2) {
          this.audioManager.playTireSqueal();
          this.lastTireSquealTime = totalTime;
        }
      }

      // 3. Traffic System update
      this.trafficManager.update(dt, heroPos.x, heroPos.z);

      // 4. Traffic & Rival Collision detection
      const collidedVehicle = this.trafficManager.checkCollisions(this.motorcycle.bounds);
      const collidedRival = this.rivalRaceManager.checkCollisions(this.motorcycle.bounds);
      const isCollision = (collidedVehicle || collidedRival) && !this.motorcycle.isInvulnerable && !this.isCrashing;

      if (isCollision) {
        if (isShielded) {
          this.powerUpManager.consumeShield();
          this.audioManager.playShield();
          this.motorcycle.setInvulnerable(1.0);
        } else {
          this.tookDamageInLevel = true;
          this.scoreManager.onCollision();
          this.uiManager.updateCombo(1);
          this.audioManager.playCrash();
          if (collidedVehicle) {
            this.audioManager.playTrafficHorn();
          } else {
            this.audioManager.playTireSqueal();
          }
          this.sceneManager.cameraController.addShake(0.65);
          this.motorcycle.setInvulnerable(GAME_CONFIG.INVULNERABILITY_AFTER_HIT_DURATION);

          if (this.activeMode === 'traffic_rush') {
            this.triggerTrafficRushGameOver();
            return;
          } else if (this.activeMode === 'time_trial') {
            this.triggerTimeTrialGameOver(false);
            return;
          } else if (this.activeMode === 'career') {
            this.triggerCareerCrashGameOver();
            return;
          }
        }
      }

      // 5. Overtake and Near-miss detection
      const activeTraffic = this.trafficManager.activeVehicles;
      this.overtakeDetector.update(this.motorcycle.bounds, speed, activeTraffic, this.scoreManager.combo);
      this.nearMissManager.update(this.motorcycle.bounds, speed, activeTraffic, this.scoreManager.combo);

      // 6. AI Rivals update
      if (this.rivalRaceManager.count > 0) {
        this.rivalRaceManager.update(dt, this.trafficManager, heroPos.z);
      }

      // 7. Score manager update
      this.scoreManager.update(dt, speed, deltaZ);

      // 8. Gameplay entities (Hazards & Pickups)
      this.obstacleManager.update(dt, heroPos, isShielded);
      this.coinManager.update(dt, heroPos, isMagnet);
      this.powerUpManager.update(dt, heroPos);

      // 9. Lighting & Camera follow
      this.sceneManager.lighting.update(heroPos.z);
      this.sceneManager.cameraController.update(dt, heroPos, isBoosting);

      // 10. Leaderboard standing
      const leaderboard = this.rivalRaceManager.getLeaderboard(heroPos.z);

      // 11. Mode logic
      if (this.activeMode === 'traffic_rush') {
        this.trafficManager.setDensity(this.trafficRushMode.getTrafficDensity());
        this.playerController.setEndlessSpeedMultiplier(this.trafficRushMode.getTrafficSpeedFactor());
        this.trafficRushMode.updateDistance(heroPos.z);
        if (this.trafficRushMode.shouldGenerateNextChunk(heroPos.z)) {
          this.spawnTrafficRushChunk();
        }
        if (this.trafficRushMode.distance >= 500) {
          this.achievementManager.unlock('endless_explorer');
        }

        this.uiManager.updateHUD(
          Math.floor(speed * 3.6),
          0,
          0,
          this.trafficRushMode.distance,
          this.coinManager.collected,
          true,
          {
            nitroRatio: this.playerController.nitroRatio,
            score: this.scoreManager.score,
            mode: 'traffic_rush',
          }
        );
      } else if (this.activeMode === 'time_trial') {
        const ttStatus = this.timeTrialMode.update(dt, heroPos.z);
        if (ttStatus.checkpointTriggered) {
          this.audioManager.playVictory();
          this.uiManager.showToast('⏱ CHECKPOINT! +15s BONUS');
        }
        if (ttStatus.timeExpired) {
          this.triggerTimeTrialGameOver(false);
          return;
        }

        this.uiManager.updateHUD(
          Math.floor(speed * 3.6),
          0,
          0,
          this.timeTrialMode.distance,
          this.coinManager.collected,
          false,
          {
            nitroRatio: this.playerController.nitroRatio,
            score: this.scoreManager.score,
            timeRemaining: this.timeTrialMode.timeRemaining,
            mode: 'time_trial',
          }
        );
      } else {
        // Career Mode
        const progress = MathUtils.clamp(heroPos.z / this.currentTrackLength, 0, 1);
        this.uiManager.updateHUD(
          Math.floor(speed * 3.6),
          0,
          this.careerMode.levelNumber,
          progress,
          this.coinManager.collected,
          false,
          {
            nitroRatio: this.playerController.nitroRatio,
            score: this.scoreManager.score,
            rank: leaderboard.playerRank,
            totalRacers: leaderboard.totalRacers,
            mode: 'career',
          }
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

      this.sceneManager.cameraController.update(
        dt,
        this.motorcycle.position
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
    const collected = this.coinManager.collected;
    const zeroDamage = !this.tookDamageInLevel;
    const timeElapsedSeconds = (performance.now() - this.raceStartTime) / 1000;
    const heroPos = this.motorcycle.position;
    const leaderboard = this.rivalRaceManager.getLeaderboard(heroPos.z);

    // Evaluate career racing stars
    const calculatedStars = this.careerMode.evaluateStars(this.careerMode.levelNumber, {
      zeroDamage,
      overtakes: this.scoreManager.overtakes,
      nearMisses: this.scoreManager.nearMisses,
      timeElapsedSeconds,
      rank: leaderboard.playerRank,
    });

    const rewards = this.careerMode.finishCareerLevel(collected, zeroDamage, calculatedStars);

    this.dailyChallengeManager.addProgress('complete_levels', 1);

    if (this.careerMode.levelNumber === 1) {
      this.achievementManager.unlock('first_ride');
    }
    if (rewards.stars === 3) {
      this.achievementManager.unlock('perfect_run');
    }
    if (zeroDamage) {
      this.achievementManager.unlock('no_damage_run');
    }

    const finalStats = this.scoreManager.getFinalStats(collected);

    this.stateMachine.transitionTo(GameState.RESULTS);
    this.uiManager.showResults(rewards, 0, false, Math.floor(heroPos.z), 0, {
      ...finalStats,
      rank: leaderboard.playerRank,
      totalRacers: leaderboard.totalRacers,
      mode: 'career',
      isVictory: true,
    });
  }

  private render = (): void => {
    this.sceneManager.render();
  };
}
