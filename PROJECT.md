# Project: MOTO RUSH 3D: TRAFFIC RUSH

## Architecture
Transformation of MOTO RUSH 3D from a multiplier convoy runner into a high-octane 3D arcade motorcycle traffic racer.
- **Core Engine & Lifecycle**: `src/core/Game.ts`, `src/core/GameState.ts`, `src/core/GameConfig.ts`, `src/core/EventBus.ts`.
- **Player & Rider Subsystem**: `src/player/Motorcycle.ts`, `src/player/PlayerController.ts`, `src/player/RiderController.ts`, `src/assets/AssetLoader.ts`. Hero vehicle `street_racer.glb` with concentric wheel pivots mounted at `FrontWheelPivot` ($Z=0.7158$), `RearWheelPivot` ($Z=-0.7379$), and 3D humanoid rider mounted to `RiderRoot` ($[0, 0.65, -0.05]$).
- **Racing & Traffic Subsystem**: `src/racing/TrafficManager.ts`, `src/racing/TrafficVehicle.ts`, `src/racing/SpeedController.ts`, `src/racing/OvertakeDetector.ts`, `src/racing/NearMissManager.ts`, `src/racing/NitroManager.ts`, `src/racing/ScoreManager.ts`, `src/gameplay/ObstacleManager.ts`.
- **Rival AI Subsystem**: `src/ai/RivalRaceManager.ts`, `src/ai/RivalRacer.ts`.
- **Game Modes**: `src/modes/CareerMode.ts` (30 events), `src/modes/TrafficRushMode.ts` (endless), `src/modes/TimeTrialMode.ts` (checkpoints).
- **UI & Presentation**: `src/ui/MainMenu.ts`, `src/ui/RacingHUD.ts`, `src/ui/Speedometer.ts`, `src/ui/ResultsScreen.ts`, `src/ui/UIManager.ts`.
- **Audio & Environments**: `src/audio/AudioManager.ts` (synthesizing engine RPM, gear changes, wind noise, passing whoosh, horns), `src/rendering/EnvironmentManager.ts` (multi-lane roads, tunnels, overpasses).
- **Persistence & Progression**: `src/persistence/SaveManager.ts` (V2 schema migration), `src/progression/UpgradeManager.ts`, `src/progression/GarageManager.ts`.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Mathematical Gates Removal | Delete `Gate.ts`, `GateManager.ts`, `GateCalculator.ts`; remove gate pairs from all 30 levels and endless chunk generation | M1 | Phase 1 |
| 2 | Gate Collision & Events Deletion | Remove gate collision triggers, plane crossing checks, and unbind `GlobalEvents.GATE_PASSED` | M1 | Phase 1 |
| 3 | Gate HUD & Audio Cleanup | Remove multiplier labels, gate chimes (`playPositiveGate`, `playNegativeGate`), and gate daily/achievement tasks | M1 | Phase 1 |
| 4 | Gate Level Validation Removal | Remove gate spacing, bounds, and gate-obstacle clearance checks from `LevelValidator.ts` | M1 | Phase 1 |
| 5 | Motorcycle Convoy Removal | Delete `FleetRenderer.ts`, `FormationController.ts`, `FleetManager.ts`; do not instance follower bikes or load `street_racer_lod.glb` | M1 | Phase 1 |
| 6 | Single Bike Scene Enforcement | Ensure exactly ONE motorcycle mesh and ONE rider exist in Three.js scene graph | M1 | Phase 1 |
| 7 | Hitbox & Camera Restoration | Restore `heroBox` in `ObstacleManager.ts` to single motorcycle bounds ($0.9\text{m} \times 2.2\text{m}$); lock camera to rear sportbike offset without fleet inflation | M1 | Phase 1 |
| 8 | Convoy HUD & Rewards Removal | Remove "CONVOY FLEET", `#hud-fleet-number`, fleet multipliers, and fleet-size star thresholds from HUD and `EconomyManager.ts` | M1 | Phase 1 |
| 9 | Safe Save Migration (V1 -> V2) | Safe schema upgrade in `SaveManager.ts`: map `starterFleet` -> `acceleration`, `fleetRecovery` -> `handling`, `coinBonus` -> `nitroCapacity`, preserving all player coins and unlocked bikes | M1 | Phase 1 & 12 |
| 10 | Test Suite Decoupling | Retire obsolete gate/fleet tests (`GateCalculator.test.ts`, `FleetManager.test.ts`, `FormationController.test.ts`) and update integration tests to 100% pass | M1 | Phase 1 & 16 |
| 11 | Stylised 3D Character Rider Mesh | Model/assemble cohesive 3D humanoid rider (full racing helmet, visor, suit, aero speed hump, shoulder pads, gauntlets, knee sliders, boots) | M2 | Phase 2 |
| 12 | Saddle Mounting to RiderRoot | Attach character root to `RiderRoot` ($[0, 0.65, -0.05]$) at hip pivot, resolving the $23.5\text{cm}$ tuck displacement defect | M2 | Phase 2 |
| 13 | Rider Kinematic Posture Suite | Implement natural idle breathing, aerodynamic forward speed tuck, cornering hang-off, and braking pitch dive | M2 | Phase 2 |
| 14 | Hero Motorcycle Integration | Retain `street_racer.glb`, calibrate wheel spin to actual radii ($r=0.349\text{m}$ front, $r=0.317\text{m}$ rear), independent wheel pivots, chassis lean | M2 | Phase 2 & 4 |
| 15 | Home Screen Hero 2-Column Layout | Rebuild main menu: Left 40% navigation stack (Title, Tagline, Career, Rush, Time Trial, Garage, Settings); Right 60% hero 3/4 view of bike + rider | M3 | Phase 3 |
| 16 | New Identity & Branding | Update title to "MOTO RUSH 3D", subtitle "TRAFFIC RUSH", tagline "RIDE. WEAVE. OVERTAKE."; remove CONVOY MAYHEM | M3 | Phase 3 |
| 17 | Responsive Home Screen Adaptation | Ergonomic mobile portrait adaptation (top 48% 3D view, bottom 52% glass action drawer) and desktop widescreen layout | M3 | Phase 3 |
| 18 | Menu Environment & Backdrop | Remove legacy black cylinder plinth and cyan neon ring; compose showroom / highway road backdrop with atmospheric depth | M3 | Phase 3 |
| 19 | Configurable Progressive Speed Model | Implement `SpeedController.ts`: base cruising speed $20.0\text{ m/s}$ (~71.4% of previous), min $10\text{ m/s}$, top $34\text{ m/s}$, nitro $45\text{ m/s}$, progressive acceleration, braking, momentum coasting | M3 | Phase 4 |
| 20 | Desktop Racing Controls | KeyA/Left & KeyD/Right (steer), KeyW/Up (throttle), KeyS/Down (brake), Shift/Space (nitro), Esc/P (pause), pointer drag | M3 | Phase 4 |
| 21 | Mobile Touch Racing Controls | Horizontal drag steer, dedicated on-screen throttle, brake, nitro, and pause buttons | M3 | Phase 4 |
| 22 | Single Motorcycle Arcade Handling | Speed-dependent steering, progressive lean angle, suspension pitch dive/squat, road boundary detection | M3 | Phase 4 |
| 23 | Dedicated TrafficManager System | Multi-lane highway traffic simulation (3-4 lanes) with pooling, lifecycle management, and coordinate recycling | M4 | Phase 5 |
| 24 | 10 Distinct Traffic Vehicle Archetypes | Compact, Sedan, Sports Car, SUV, Taxi, Delivery Van, Passenger Bus, Heavy Truck, Police Car, Motorcycle with unique geometry, speed, and dimensions | M4 | Phase 5 |
| 25 | Moving Traffic AI & Lane Discipline | Lane following, variable lane speeds, safe following distance, smooth lane changing transitions | M4 | Phase 5 |
| 26 | Traffic Anti-Block Route Guarantee | Algorithmic guarantee that at least one viable overtaking trajectory remains open across lanes at all times | M4 | Phase 5 |
| 27 | Road Hazards & Obstacle Patterns | Construction barriers, cones, debris, potholes, oil slicks, broken-down vehicles, security gates with collision response | M4 | Phase 6 |
| 28 | Fair Hazard Visibility & Precise Hitbox | Ensure camera lookahead affords ample reaction time; accurate single-bike collision detection | M4 | Phase 6 |
| 29 | Longitudinal Overtake Detection | Detect when motorcycle passes traffic vehicles in adjacent lanes; award score and combo credit | M5 | Phase 7 |
| 30 | Sub-Meter Near-Miss Detection | Detect close passes ($0.15\text{m} < \text{clearance} \le 1.1\text{m}$) without collision; trigger "NEAR MISS" visual/audio callout | M5 | Phase 7 |
| 31 | Dynamic Combo Streak System | Consecutive clean overtakes and near misses build combo multiplier with decaying timeout; broken on collision | M5 | Phase 7 |
| 32 | Player-Controlled Nitro System | 0–100% nitro fuel meter; earned via near misses, clean overtakes, and track pickups; activated via Shift/Space or button | M5 | Phase 8 |
| 33 | Nitro Audio-Visual Effects | Dynamic camera FOV kick ($60^\circ \to 72^\circ$), exhaust particle trail, screen speed-lines, and engine pitch boost | M5 | Phase 8 |
| 34 | Dynamic Racing Audio Synthesizer | Web Audio synthesis: 6-speed gear RPM shifts, wind noise, passing vehicle whoosh, horns, collision crunch, near-miss chime, nitro roar | M5 | Phase 13 |
| 35 | 30-Event Career Mode | 30 structured racing stages with distinct objectives (overtake targets, time limits, zero crash runs, near misses, rival duels, coin targets) | M6 | Phase 9 |
| 36 | Endless Traffic Rush Mode | Infinite highway traffic racing with progressively increasing density, speed, and high-score recording | M6 | Phase 9 |
| 37 | Time Trial Mode | Checkpoint countdown racing mode rewarding fast route choices and tight overtakes with time bonuses | M6 | Phase 9 |
| 38 | AI Rival Racers | 2-4 AI opponents ahead/alongside player with distinct motorcycle liveries, lane weaving, overtakes, and position leaderboard | M6 | Phase 10 |
| 39 | Racing Dashboard HUD | Digital/dial speedometer, distance meter, route timer, nitro fuel gauge, combo multiplier badge, coin counter | M6 | Phase 11 |
| 40 | Comprehensive Racing Results Screen | Final position, distance traveled, top speed, overtakes, near misses, clean streak, coins earned, star rewards | M6 | Phase 11 |
| 41 | Racing Garage & Vehicle Upgrades | Vehicle stats: Acceleration, Top Speed, Handling, Braking, Nitro Capacity, Nitro Recovery; cosmetic skins and persistent tuning | M6 | Phase 12 |
| 42 | Highway Track Geometry & Environments | Multi-lane expressway sections across all 5 themes with road bends, highway tunnels, bridges, and flyover overpasses | M6 | Phase 14 |
| 43 | Modular Technical Architecture | Refactor into `src/racing/`, `src/ai/`, `src/player/`, `src/modes/`, `src/ui/` with clean interface contracts | M6 | Phase 15 |
| 44 | Automated Vitest Unit & Integration Suite | Comprehensive automated tests for physics, traffic, overtakes, near misses, nitro, modes, and persistence | M7 | Phase 16 |
| 45 | Visual Browser E2E Testing & Proof | Playwright browser testing capturing all 10 required screenshots: Menu, Rider, Normal Traffic, Dense Traffic, Overtake, Passing Truck, Near Miss, Nitro, Rivals, Results | M7 | Phase 16 & 17 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Convoy & Gate Deconstruction | Features 1–10: Remove gates, follower fleet, FleetRenderer, gate HUD/audio; migrate Save Schema to V2; fix tests | none | DONE |
| 2 | Rider Character & Kinematics | Features 11–14: Cohesive 3D humanoid rider mesh, saddle mounting to `RiderRoot`, idle/tuck/lean/pitch kinematics, wheel spin calibration | M1 | DONE |
| 3 | Controls, Speed Model & Home Screen | Features 15–22: Home screen 2-column hero redesign, new branding, responsive layout, configurable speed model (cruising 20 m/s, top 34 m/s), desktop & touch controls | M1 | DONE |
| 4 | Traffic Simulation & Road Hazards | Features 23–28: `TrafficManager`, 10 vehicle archetypes, moving traffic AI, anti-block line guarantee, road hazards, single-bike collision bounds | M3 | DONE |
| 5 | Racing Mechanics: Overtakes, Nitro & Audio | Features 29–34: `OvertakeDetector`, sub-meter `NearMissManager`, combo multiplier, `NitroManager`, dynamic 6-speed engine audio & whoosh effects | M4 | DONE |
| 6 | Game Modes, AI Rivals, HUD & Garage | Features 35–43: 30-event Career, Traffic Rush, Time Trial, 2–4 AI Rival Racers, Racing HUD, Results screen, Garage upgrades, track environments | M5 | DONE |
| 7 | Acceptance Testing & Visual Verification | Features 44–45: 100% automated Vitest suite pass (11 test files, 101 tests), Playwright browser test suite, capture & audit 10 required screenshots | M6 | DONE |

---

## Interface Contracts

### `src/player/PlayerController.ts` ↔ `src/racing/SpeedController.ts`
```typescript
export interface SpeedConfig {
  minSpeed: number;        // e.g. 10.0 m/s
  cruisingSpeed: number;   // e.g. 20.0 m/s (~71.4% of 28 m/s)
  maxSpeed: number;        // e.g. 34.0 m/s
  nitroSpeed: number;      // e.g. 45.0 m/s
  accelerationRate: number;// e.g. 14.0 m/s^2
  brakingRate: number;     // e.g. 24.0 m/s^2
  coastingDecel: number;   // e.g. 4.0 m/s^2
}

export class SpeedController {
  constructor(config?: Partial<SpeedConfig>);
  public update(dt: number, throttle: number, brake: number, isNitro: boolean): number;
  public get currentSpeed(): number;
  public get speedRatio(): number; // currentSpeed / cruisingSpeed
  public reset(initialSpeed?: number): void;
}
```

### `src/racing/TrafficManager.ts` ↔ `src/core/Game.ts`
```typescript
export interface TrafficVehicleDef {
  type: 'compact' | 'sedan' | 'sports_car' | 'suv' | 'taxi' | 'delivery_van' | 'bus' | 'heavy_truck' | 'police' | 'motorcycle';
  width: number;
  length: number;
  height: number;
  speed: number;
  color: number;
}

export class TrafficManager {
  public group: THREE.Group;
  public get activeVehicles(): TrafficVehicle[];
  public update(dt: number, playerX: number, playerZ: number): void;
  public checkCollisions(heroBox: THREE.Box3): TrafficVehicle | null;
  public clear(): void;
}
```

### `src/racing/OvertakeDetector.ts` & `src/racing/NearMissManager.ts`
```typescript
export interface OvertakeEvent {
  vehicleId: number;
  vehicleType: string;
  speed: number;
  timestamp: number;
}

export interface NearMissEvent {
  vehicleId: number;
  clearance: number; // between 0.15m and 1.1m
  playerSpeed: number;
  comboCount: number;
}
```

### `src/racing/NitroManager.ts`
```typescript
export class NitroManager {
  public fuel: number; // 0.0 to 100.0
  public isBoosting: boolean;
  public update(dt: number, wantsBoost: boolean): void;
  public addFuel(amount: number): void;
  public get boostMultiplier(): number; // 1.0 or 1.35
}
```

---

## Code Layout
- `src/racing/`: `TrafficManager.ts`, `TrafficVehicle.ts`, `SpeedController.ts`, `OvertakeDetector.ts`, `NearMissManager.ts`, `NitroManager.ts`, `ScoreManager.ts`
- `src/ai/`: `RivalRaceManager.ts`, `RivalRacer.ts`
- `src/player/`: `Motorcycle.ts`, `PlayerController.ts`, `RiderController.ts`, `MotorcycleModels.ts`
- `src/modes/`: `CareerMode.ts`, `TrafficRushMode.ts`, `TimeTrialMode.ts`
- `src/ui/`: `MainMenu.ts`, `RacingHUD.ts`, `Speedometer.ts`, `ResultsScreen.ts`, `UIManager.ts`
- `src/persistence/`: `SaveSchema.ts`, `SaveManager.ts`
- `src/progression/`: `EconomyManager.ts`, `GarageManager.ts`, `UpgradeManager.ts`
- `src/audio/`: `AudioManager.ts`
- `src/rendering/`: `SceneManager.ts`, `CameraController.ts`, `EnvironmentManager.ts`
- `src/tests/`: Unit and integration test suites
- `qa/`: Screenshot capture scripts and browser test harness
