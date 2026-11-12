import { SaveManager } from '../persistence/SaveManager';
import { EconomyManager, RewardBreakdown } from '../progression/EconomyManager';
import { GarageManager, MOTORCYCLES } from '../progression/GarageManager';
import { UpgradeManager, UPGRADES, UpgradeType } from '../progression/UpgradeManager';
import { DailyChallengeManager } from '../progression/DailyChallengeManager';
import { AchievementManager } from '../progression/AchievementManager';
import { AudioManager } from '../audio/AudioManager';
import { EventBus, GlobalEvents } from '../core/EventBus';
import { LEVELS } from '../levels/LevelDefinitions';
import { MathUtils } from '../utilities/MathUtils';

export interface UICallbacks {
  onPlayCampaign: (levelNum: number) => void;
  onPlayEndless: () => void;
  onPlayTimeTrial?: () => void;
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  onSelectBike: (bikeId: string) => void;
  onSettingsChanged: () => void;
  onTouchThrottle?: (active: boolean) => void;
  onTouchBrake?: (active: boolean) => void;
  onTouchNitro?: (active: boolean) => void;
}

export class UIManager {
  private container: HTMLElement;
  private callbacks!: UICallbacks;
  private currentScreenId: string = 'screen-main-menu';
  private garageSelectedBikeIndex: number = 0;
  private lastPlayedCampaignLevel: number = 1;
  private lastWasEndless: boolean = false;

  constructor(
    private saveManager: SaveManager,
    private economyManager: EconomyManager,
    private garageManager: GarageManager,
    private upgradeManager: UpgradeManager,
    private dailyChallengeManager: DailyChallengeManager,
    private achievementManager: AchievementManager,
    private audioManager: AudioManager,
    private eventBus: EventBus
  ) {
    const el = document.getElementById('ui-layer');
    if (!el) {
      throw new Error('Missing #ui-layer in DOM');
    }
    this.container = el;
    this.buildHTML();
    this.setupEventListeners();
  }

  public init(callbacks: UICallbacks): void {
    this.callbacks = callbacks;
    this.updateCoinDisplays();
    this.updateMainMenuState();
    this.showScreen('screen-main-menu');
  }

  private buildHTML(): void {
    this.container.innerHTML = `
      <!-- TOP BAR -->
      <div id="main-top-bar" class="top-bar ui-interactive">
        <div class="coin-pill">
          <span class="coin-icon">🪙</span>
          <span id="ui-coin-count">0</span>
        </div>
        <div style="display:flex; gap:10px;">
          <button id="btn-settings-open" class="btn btn-secondary btn-icon" title="Settings">⚙️</button>
        </div>
      </div>

      <!-- MAIN MENU (HERO 2-COLUMN COMPOSITION) -->
      <div id="screen-main-menu" class="screen ui-interactive">
        <div class="main-menu-hero-column">
          <div class="title-container">
            <h1 class="game-title">MOTO RUSH 3D</h1>
            <p class="game-subtitle">TRAFFIC RUSH</p>
            <p class="game-tagline">RIDE. WEAVE. OVERTAKE.</p>
          </div>

          <div class="menu-actions">
            <button id="btn-play-campaign" class="btn btn-primary btn-play-large">
              ▶ CAREER MODE
            </button>
            <button id="btn-play-endless" class="btn btn-accent" style="width:100%; padding:15px;">
              ⚡ TRAFFIC RUSH
            </button>
            <button id="btn-play-timetrial" class="btn btn-green" style="width:100%; padding:14px; background:linear-gradient(135deg, #059669, #10b981); color:#ffffff; font-weight:800; border-radius:14px; border:none; cursor:pointer;">
              ⏱ TIME TRIAL
            </button>

            <div class="menu-grid-buttons">
              <button id="btn-open-garage" class="btn btn-secondary">🏍️ GARAGE</button>
              <button id="btn-open-levels" class="btn btn-secondary">🗺️ LEVELS</button>
              <button id="btn-open-challenges" class="btn btn-secondary">📅 DAILY</button>
              <button id="btn-open-achievements" class="btn btn-secondary">🏆 AWARDS</button>
            </div>
          </div>

          <p class="footer-hint">Desktop: W/S Gas/Brake &bull; A/D Steer &bull; Shift/Space Nitro</p>
        </div>
      </div>

      <!-- RACING HUD -->
      <div id="screen-hud" class="screen">
        <div class="top-bar ui-interactive" style="position:static; display:flex; justify-content:space-between; align-items:center;">
          <div class="hud-top-left" style="display:flex; align-items:center; gap:12px;">
            <div id="hud-level-tag" class="hud-level-badge">CAREER #1</div>
            <div class="hud-speed-pod">
              <span id="hud-speed-number" class="speed-count-compact">0</span>
              <span class="speed-unit-compact">KM/H</span>
            </div>
            <div id="hud-rank-pill" class="hud-rank-badge" style="display:none;">1st / 4</div>
            <div class="coin-pill">
              <span class="coin-icon">🪙</span>
              <span id="hud-coin-count">0</span>
            </div>
          </div>

          <div class="hud-center-top" style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div class="progress-container" style="margin-top:0;">
              <div id="hud-progress-fill" class="progress-fill"></div>
            </div>
            <div id="hud-score-display" class="hud-score-display" style="font-size:0.95rem; margin:0;">
              <span id="hud-score-number">0</span> PTS
            </div>
            <div id="hud-timetrial-clock" class="hud-timetrial-clock" style="display:none; font-weight:800; font-size:1.0rem; color:#ef4444; text-shadow:0 0 10px rgba(239,68,68,0.8);">
              ⏱ <span id="hud-timetrial-val">35.0</span>s
            </div>
          </div>

          <div class="hud-top-right" style="display:flex; align-items:center; gap:12px;">
            <div class="hud-nitro-container">
              <span class="hud-nitro-label">NITRO BOOST</span>
              <div class="hud-nitro-bar-bg">
                <div id="hud-nitro-fill" class="hud-nitro-bar-fill"></div>
              </div>
            </div>
            <button id="btn-pause-open" class="btn btn-secondary btn-icon">⏸</button>
          </div>
        </div>

        <!-- NON-BLOCKING FLOATING ALERTS (Outside central vehicle corridor) -->
        <div class="hud-alerts-layer" style="position:absolute; top:70px; right:24px; display:flex; flex-direction:column; align-items:flex-end; gap:8px; pointer-events:none;">
          <div id="hud-combo-container" class="hud-combo-badge" style="opacity: 0; transform: scale(0.8); transition: all 0.2s ease;">
            <span id="hud-combo-label">COMBO x1</span>
            <span id="hud-near-miss-tag" class="hud-near-miss-tag" style="display:none;">NEAR MISS!</span>
          </div>
          <div id="hud-near-miss-toast" class="hud-near-miss-toast" style="opacity: 0; transform: translateY(10px) scale(0.85); transition: all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none;">
            <span id="hud-near-miss-text">⚡ NEAR MISS!</span>
          </div>
          <div id="hud-powerups-list" class="hud-powerups-list"></div>
        </div>

        <!-- TOUCH CONTROLS (FOR MOBILE/POINTER) -->
        <div class="hud-touch-controls ui-interactive">
          <div style="display:flex; gap:10px;">
            <button id="btn-touch-brake" class="touch-btn touch-btn-brake" title="Brake">▼<br><span style="font-size:0.7rem;">BRAKE</span></button>
          </div>
          <div style="display:flex; gap:10px;">
            <button id="btn-touch-nitro" class="touch-btn touch-btn-nitro" title="Nitro">⚡<br><span style="font-size:0.7rem;">NITRO</span></button>
            <button id="btn-touch-throttle" class="touch-btn touch-btn-gas" title="Accelerate">▲<br><span style="font-size:0.7rem;">GAS</span></button>
          </div>
        </div>
      </div>

      <!-- PAUSE OVERLAY -->
      <div id="screen-pause" class="screen ui-interactive">
        <div class="glass-panel results-modal">
          <h2 class="results-title">PAUSED</h2>
          <div style="display:flex; flex-direction:column; gap:14px; width:100%;">
            <button id="btn-pause-resume" class="btn btn-primary">RESUME</button>
            <button id="btn-pause-restart" class="btn btn-secondary">RESTART LEVEL</button>
            <button id="btn-pause-settings" class="btn btn-secondary">SETTINGS</button>
            <button id="btn-pause-menu" class="btn btn-red">EXIT TO MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- RESULTS SCREEN -->
      <div id="screen-results" class="screen ui-interactive">
        <div class="glass-panel results-modal" style="max-width:520px; width:100%;">
          <h2 id="results-heading" class="results-title">VICTORY!</h2>
          <div id="res-rank-banner" class="results-rank-banner" style="display:none; font-size:1.3rem; font-weight:900; color:#00f0ff; margin-bottom:8px;">
            POSITION: <span id="res-rank-val">1st</span> / <span id="res-rank-total">4</span>
          </div>
          <div id="res-stars-row" class="stars-row">
            <span id="star-1" class="star-icon">★</span>
            <span id="star-2" class="star-icon">★</span>
            <span id="star-3" class="star-icon">★</span>
          </div>

          <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0;">
            <div class="stat-item">
              <span id="res-status-label" class="stat-title">Distance</span>
              <span id="res-status-val" class="stat-value">0m</span>
            </div>
            <div class="stat-item">
              <span class="stat-title">Top Speed</span>
              <span id="res-speed-val" class="stat-value">0 km/h</span>
            </div>
            <div class="stat-item">
              <span class="stat-title">Overtakes</span>
              <span id="res-overtakes-val" class="stat-value" style="color:#00f0ff;">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-title">Near Misses</span>
              <span id="res-nearmiss-val" class="stat-value" style="color:#f59e0b;">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-title">Clean Streak</span>
              <span id="res-clean-val" class="stat-value" style="color:#10b981;">0m</span>
            </div>
            <div class="stat-item">
              <span class="stat-title">Max Combo</span>
              <span id="res-combo-val" class="stat-value" style="color:#a855f7;">x1</span>
            </div>
            <div class="stat-item">
              <span class="stat-title">Final Score</span>
              <span id="res-score-val" class="stat-value" style="color:var(--accent-gold);">0 PTS</span>
            </div>
            <div class="stat-item">
              <span id="res-coins-label" class="stat-title">Coins Earned</span>
              <span id="res-coins-val" class="stat-value" style="color:var(--accent-gold);">+0🪙</span>
            </div>
          </div>

          <div class="results-actions">
            <button id="btn-res-replay" class="btn btn-secondary">↺ RETRY</button>
            <button id="btn-res-garage" class="btn btn-secondary">🏍️ GARAGE</button>
            <button id="btn-res-menu" class="btn btn-secondary">🏠 MENU</button>
            <button id="btn-res-next" class="btn btn-primary">NEXT ▶</button>
          </div>
        </div>
      </div>

      <!-- GARAGE SCREEN -->
      <div id="screen-garage" class="screen ui-interactive">
        <div class="top-bar">
          <button id="btn-garage-back" class="btn btn-secondary">← BACK</button>
          <div class="coin-pill">
            <span class="coin-icon">🪙</span>
            <span id="garage-coin-count">0</span>
          </div>
        </div>

        <div class="garage-layout">
          <div class="glass-panel garage-viewer-box">
            <div class="bike-carousel-nav">
              <button id="btn-bike-prev" class="btn btn-secondary btn-icon">◀</button>
              <div class="bike-info-card">
                <h2 id="garage-bike-name" class="bike-name">Street Racer</h2>
                <p id="garage-bike-subtitle" class="bike-subtitle">Classic Sport Aerodynamics</p>
              </div>
              <button id="btn-bike-next" class="btn btn-secondary btn-icon">▶</button>
            </div>

            <div class="bike-stats-container">
              <div class="stat-bar-row">
                <span class="stat-bar-label">SPEED</span>
                <div class="stat-bar-bg"><div id="stat-bar-speed" class="stat-bar-val" style="width:75%;"></div></div>
              </div>
              <div class="stat-bar-row">
                <span class="stat-bar-label">HANDLING</span>
                <div class="stat-bar-bg"><div id="stat-bar-handling" class="stat-bar-val" style="width:85%;"></div></div>
              </div>
              <div class="stat-bar-row">
                <span class="stat-bar-label">ACCELERATION</span>
                <div class="stat-bar-bg"><div id="stat-bar-accel" class="stat-bar-val" style="width:75%;"></div></div>
              </div>
              <div class="stat-bar-row">
                <span class="stat-bar-label">NITRO</span>
                <div class="stat-bar-bg"><div id="stat-bar-nitro" class="stat-bar-val" style="width:70%;"></div></div>
              </div>
            </div>

            <button id="btn-garage-action" class="btn btn-primary" style="width:100%; padding:16px;">
              SELECT
            </button>
          </div>

          <div class="glass-panel garage-upgrades-box" id="garage-upgrades-list">
            <!-- Dynamically injected upgrades -->
          </div>
        </div>
      </div>

      <!-- LEVEL SELECT SCREEN -->
      <div id="screen-level-select" class="screen ui-interactive">
        <div class="top-bar">
          <button id="btn-level-back" class="btn btn-secondary">← BACK</button>
          <h2 style="font-family:var(--title-font); font-size:1.8rem; color:var(--primary-glow);">CAREER MAP</h2>
          <div style="width:80px;"></div>
        </div>

        <div class="glass-panel level-select-container" id="level-select-container">
          <!-- Dynamically populated environments and levels -->
        </div>
      </div>

      <!-- DAILY CHALLENGES MODAL -->
      <div id="modal-challenges" class="modal-overlay ui-interactive" style="display:none;">
        <div class="glass-panel modal-content">
          <h2 class="modal-title">DAILY CHALLENGES</h2>
          <p style="color:#94a3b8; font-size:0.9rem; margin-bottom:16px;" id="daily-date-label">Today's Missions</p>
          <div id="daily-challenges-list" style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;"></div>
          <button id="btn-close-challenges" class="btn btn-secondary" style="width:100%;">CLOSE</button>
        </div>
      </div>

      <!-- ACHIEVEMENTS MODAL -->
      <div id="modal-achievements" class="modal-overlay ui-interactive" style="display:none;">
        <div class="glass-panel modal-content">
          <h2 class="modal-title">ACHIEVEMENTS</h2>
          <div id="achievements-list" style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;"></div>
          <button id="btn-close-achievements" class="btn btn-secondary" style="width:100%;">CLOSE</button>
        </div>
      </div>

      <!-- SETTINGS MODAL -->
      <div id="modal-settings" class="modal-overlay ui-interactive" style="display:none;">
        <div class="glass-panel modal-content">
          <h2 class="modal-title">SETTINGS</h2>

          <div class="setting-row">
            <span class="setting-label">Sound Effects</span>
            <input type="range" id="setting-sfx" min="0" max="1" step="0.05" class="setting-input" />
          </div>

          <div class="setting-row">
            <span class="setting-label">Music</span>
            <input type="range" id="setting-music" min="0" max="1" step="0.05" class="setting-input" />
          </div>

          <div class="setting-row">
            <span class="setting-label">Mute All</span>
            <input type="checkbox" id="setting-mute" class="setting-input" />
          </div>

          <div class="setting-row">
            <span class="setting-label">Steering Sensitivity</span>
            <input type="range" id="setting-sens" min="0.5" max="2.0" step="0.1" class="setting-input" />
          </div>

          <div class="setting-row">
            <span class="setting-label">Graphics Quality</span>
            <select id="setting-graphics" style="background:#0f172a; color:#fff; border:1px solid #334155; padding:6px 12px; border-radius:8px;">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div class="setting-row">
            <span class="setting-label">Camera Shake</span>
            <input type="checkbox" id="setting-shake" class="setting-input" />
          </div>

          <div class="setting-row">
            <span class="setting-label">Reduced Motion</span>
            <input type="checkbox" id="setting-motion" class="setting-input" />
          </div>

          <div style="margin-top:20px; display:flex; flex-direction:column; gap:10px;">
            <button id="btn-reset-save" class="btn btn-red" style="font-size:0.9rem; padding:10px;">RESET ALL PROGRESS</button>
            <button id="btn-close-settings" class="btn btn-secondary" style="width:100%;">CLOSE</button>
          </div>
        </div>
      </div>
    `;
  }

  public showScreen(screenId: string): void {
    const screens = this.container.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.currentScreenId = screenId;
    }

    // Hide main top bar during gameplay HUD, pause, results, garage, or level select to prevent UI overlap
    const mainTopBar = document.getElementById('main-top-bar');
    if (mainTopBar) {
      mainTopBar.style.display = screenId === 'screen-main-menu' ? 'flex' : 'none';
    }

    if (screenId === 'screen-main-menu') {
      this.updateMainMenuState();
    } else if (screenId === 'screen-garage') {
      this.populateGarage();
    }
  }

  public updateMainMenuState(): void {
    const isUnlocked = this.saveManager.data.unlockedLevel > 5;
    const endlessBtn = document.getElementById('btn-play-endless') as HTMLButtonElement;
    if (endlessBtn) {
      if (isUnlocked) {
        endlessBtn.classList.remove('btn-locked');
        endlessBtn.innerHTML = '⚡ TRAFFIC RUSH';
      } else {
        endlessBtn.classList.add('btn-locked');
        endlessBtn.innerHTML = '🔒 TRAFFIC RUSH <span style="font-size:0.8rem; opacity:0.85; margin-left:6px;">(UNLOCKS LEVEL 6)</span>';
      }
    }
  }

  public showToast(message: string): void {
    let toast = document.getElementById('ui-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ui-toast';
      toast.className = 'toast-notification';
      this.container.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add('active');
    setTimeout(() => {
      toast?.classList.remove('active');
    }, 2400);
  }

  public updateCoinDisplays(): void {
    const coinsStr = MathUtils.formatNumber(this.economyManager.coins);
    const ids = ['ui-coin-count', 'hud-coin-count', 'garage-coin-count'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.innerText = coinsStr;
    }
  }

  public updateHUD(
    speedKmh: number,
    delta: number,
    levelNum: number,
    progressRatio: number,
    coins: number,
    isEndless: boolean = false,
    racingStats?: {
      nitroRatio?: number;
      score?: number;
      rank?: number;
      totalRacers?: number;
      timeRemaining?: number;
      mode?: 'career' | 'traffic_rush' | 'time_trial';
    }
  ): void {
    const speedEl = document.getElementById('hud-speed-number');
    if (speedEl) {
      speedEl.innerText = String(Math.max(0, Math.floor(speedKmh)));
    }

    const levelTag = document.getElementById('hud-level-tag');
    if (levelTag) {
      if (racingStats?.mode === 'time_trial') {
        levelTag.innerText = 'TIME TRIAL';
      } else if (racingStats?.mode === 'traffic_rush' || isEndless) {
        levelTag.innerText = `TRAFFIC RUSH: ${Math.floor(progressRatio)}m`;
      } else {
        levelTag.innerText = `CAREER #${levelNum}`;
      }
    }

    const fill = document.getElementById('hud-progress-fill');
    if (fill) {
      const pct = (isEndless || racingStats?.mode === 'traffic_rush' || racingStats?.mode === 'time_trial')
        ? 100
        : Math.min(100, Math.max(0, progressRatio * 100));
      fill.style.width = `${pct}%`;
    }

    const coinEl = document.getElementById('hud-coin-count');
    if (coinEl) {
      coinEl.innerText = MathUtils.formatNumber(coins);
    }

    // Racing enhancements:
    if (racingStats?.nitroRatio !== undefined) {
      const nitroFill = document.getElementById('hud-nitro-fill');
      if (nitroFill) {
        nitroFill.style.width = `${Math.min(100, Math.max(0, Math.round(racingStats.nitroRatio * 100)))}%`;
      }
    }

    if (racingStats?.score !== undefined) {
      const scoreEl = document.getElementById('hud-score-number');
      if (scoreEl) {
        scoreEl.innerText = MathUtils.formatNumber(Math.floor(racingStats.score));
      }
    }

    const rankPill = document.getElementById('hud-rank-pill');
    if (rankPill) {
      if (racingStats?.rank !== undefined && racingStats?.totalRacers !== undefined && racingStats.totalRacers > 1) {
        rankPill.style.display = 'inline-block';
        const sfx = this.getRankSuffix(racingStats.rank);
        rankPill.innerText = `${sfx} / ${racingStats.totalRacers}`;
      } else {
        rankPill.style.display = 'none';
      }
    }

    const ttClock = document.getElementById('hud-timetrial-clock');
    const ttVal = document.getElementById('hud-timetrial-val');
    if (ttClock && ttVal) {
      if (racingStats?.mode === 'time_trial' && racingStats.timeRemaining !== undefined) {
        ttClock.style.display = 'block';
        ttVal.innerText = `${Math.max(0, racingStats.timeRemaining).toFixed(1)}`;
      } else {
        ttClock.style.display = 'none';
      }
    }
  }

  private getRankSuffix(rank: number): string {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  }

  public updatePowerUps(powerups: { type: string; name: string; icon: string; remaining: number }[]): void {
    const list = document.getElementById('hud-powerups-list');
    if (!list) return;

    if (powerups.length === 0) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML = powerups
      .map(
        p => `
        <div class="powerup-hud-pill">
          <span>${p.icon}</span>
          <span>${p.name}</span>
          <span style="opacity:0.8; font-size:0.75rem; margin-left:3px;">${p.remaining}s</span>
        </div>
      `
      )
      .join('');
  }

  public updateCombo(combo: number): void {
    const comboEl = document.getElementById('hud-combo-container');
    const labelEl = document.getElementById('hud-combo-label');
    if (!comboEl || !labelEl) return;
    if (combo > 1) {
      labelEl.innerText = `COMBO x${combo}`;
      comboEl.style.opacity = '1';
      comboEl.style.transform = 'scale(1.15)';
      setTimeout(() => {
        comboEl.style.transform = 'scale(1)';
      }, 150);
    } else {
      comboEl.style.opacity = '0';
      comboEl.style.transform = 'scale(0.8)';
    }
  }

  public showNearMissToast(streak: number): void {
    const toast = document.getElementById('hud-near-miss-toast');
    const text = document.getElementById('hud-near-miss-text');
    if (toast && text) {
      text.innerText = streak > 1 ? `⚡ NEAR MISS x${streak}!` : '⚡ NEAR MISS!';
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1.05)';
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px) scale(0.9)';
      }, 750);
    }

    const nearMissTag = document.getElementById('hud-near-miss-tag');
    if (nearMissTag) {
      nearMissTag.innerText = streak > 1 ? `NEAR MISS x${streak}!` : 'NEAR MISS!';
    }
  }

  public setLastPlayedCampaignLevel(lvl: number): void {
    this.lastPlayedCampaignLevel = lvl;
    this.lastWasEndless = false;
  }

  public showResults(
    rewards: RewardBreakdown,
    survivingFleet: number,
    isEndless: boolean = false,
    endlessDistance: number = 0,
    endlessBestDistance: number = 0,
    racingStats?: {
      distance?: number;
      topSpeedKmH?: number;
      overtakes?: number;
      nearMisses?: number;
      score?: number;
      rank?: number;
      totalRacers?: number;
      cleanDistance?: number;
      maxCombo?: number;
      mode?: 'career' | 'traffic_rush' | 'time_trial';
      isVictory?: boolean;
    }
  ): void {
    this.lastWasEndless = isEndless || racingStats?.mode === 'traffic_rush';
    this.updateCoinDisplays();

    const heading = document.getElementById('results-heading');
    const starsRow = document.getElementById('res-stars-row');
    const statusLabel = document.getElementById('res-status-label');
    const statusVal = document.getElementById('res-status-val');
    const coinsLabel = document.getElementById('res-coins-label');
    const coinsVal = document.getElementById('res-coins-val');
    const nextBtn = document.getElementById('btn-res-next') as HTMLButtonElement;
    const rankBanner = document.getElementById('res-rank-banner');
    const rankVal = document.getElementById('res-rank-val');
    const rankTotal = document.getElementById('res-rank-total');

    // Rival race ranking banner
    if (rankBanner && rankVal && rankTotal) {
      if (racingStats?.rank !== undefined && racingStats?.totalRacers !== undefined && racingStats.totalRacers > 1) {
        rankBanner.style.display = 'block';
        rankVal.innerText = this.getRankSuffix(racingStats.rank);
        rankTotal.innerText = String(racingStats.totalRacers);
      } else {
        rankBanner.style.display = 'none';
      }
    }

    // Populate grid stats
    const speedVal = document.getElementById('res-speed-val');
    if (speedVal) speedVal.innerText = `${Math.floor(racingStats?.topSpeedKmH ?? 0)} km/h`;

    const overtakesVal = document.getElementById('res-overtakes-val');
    if (overtakesVal) overtakesVal.innerText = String(racingStats?.overtakes ?? 0);

    const nearMissVal = document.getElementById('res-nearmiss-val');
    if (nearMissVal) nearMissVal.innerText = String(racingStats?.nearMisses ?? 0);

    const cleanVal = document.getElementById('res-clean-val');
    if (cleanVal) cleanVal.innerText = `${Math.floor(racingStats?.cleanDistance ?? 0)}m`;

    const comboVal = document.getElementById('res-combo-val');
    if (comboVal) comboVal.innerText = `x${racingStats?.maxCombo ?? 1}`;

    const scoreVal = document.getElementById('res-score-val');
    if (scoreVal) scoreVal.innerText = `${MathUtils.formatNumber(Math.floor(racingStats?.score ?? 0))} PTS`;

    const distToShow = racingStats?.distance ?? (isEndless ? endlessDistance : 0);

    if (racingStats?.mode === 'time_trial') {
      if (heading) heading.innerText = racingStats.isVictory ? 'TIME TRIAL COMPLETE! ⏱' : "TIME'S UP! ⏱";
      if (starsRow) starsRow.style.display = 'none';
      if (statusLabel) statusLabel.innerText = 'Distance Covered';
      if (statusVal) statusVal.innerText = `${distToShow}m`;
      if (coinsLabel) coinsLabel.innerText = 'Bonus Coins';
      if (coinsVal) coinsVal.innerText = `+${rewards.totalCoins}🪙`;
      if (nextBtn) {
        nextBtn.style.display = 'inline-flex';
        nextBtn.innerText = 'RETRY ⏱';
      }
    } else if (isEndless || racingStats?.mode === 'traffic_rush') {
      if (heading) heading.innerText = 'RUN FINISHED ⚡';
      if (starsRow) starsRow.style.display = 'none';
      if (statusLabel) statusLabel.innerText = 'Distance Reached';
      if (statusVal) statusVal.innerText = `${distToShow}m (Best: ${endlessBestDistance}m)`;
      if (coinsLabel) coinsLabel.innerText = 'Run Coins';
      if (coinsVal) coinsVal.innerText = `+${rewards.totalCoins}🪙`;
      if (nextBtn) {
        nextBtn.style.display = 'inline-flex';
        nextBtn.innerText = 'RETRY ⚡';
      }
    } else {
      if (starsRow) starsRow.style.display = 'flex';
      if (statusLabel) statusLabel.innerText = 'Distance';
      if (statusVal) statusVal.innerText = `${distToShow}m`;
      if (coinsLabel) coinsLabel.innerText = 'Coins Earned';
      if (coinsVal) coinsVal.innerText = `+${rewards.totalCoins}🪙`;

      if (racingStats && racingStats.isVictory === false) {
        if (heading) {
          heading.innerText = 'CRASHED! 💥';
          heading.style.color = '#ef4444';
          heading.style.textShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
        }
        if (starsRow) starsRow.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
      } else {
        if (heading) {
          heading.style.color = '';
          heading.style.textShadow = '';
        }
        if (this.lastPlayedCampaignLevel >= 30) {
          if (heading) heading.innerText = 'CAREER COMPLETE! 🏆';
          if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.innerText = 'MAP 🗺️';
          }
        } else {
          if (heading) heading.innerText = rewards.stars > 0 ? 'VICTORY! 🏁' : 'RACE FAILED';
          if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.innerText = 'NEXT ▶';
          }
        }
      }

      // Stars
      for (let i = 1; i <= 3; i++) {
        const s = document.getElementById(`star-${i}`);
        if (s) {
          if (i <= rewards.stars) {
            s.classList.add('filled');
          } else {
            s.classList.remove('filled');
          }
        }
      }
    }

    this.showScreen('screen-results');
  }

  public populateGarage(): void {
    this.updateCoinDisplays();
    const bike = MOTORCYCLES[this.garageSelectedBikeIndex];

    const nameEl = document.getElementById('garage-bike-name');
    if (nameEl) nameEl.innerText = bike.name;

    const subEl = document.getElementById('garage-bike-subtitle');
    if (subEl) subEl.innerText = bike.subtitle ?? '';

    const speedBar = document.getElementById('stat-bar-speed');
    if (speedBar) speedBar.style.width = `${bike.speedRating}%`;

    const handleBar = document.getElementById('stat-bar-handling');
    if (handleBar) handleBar.style.width = `${bike.handlingRating}%`;

    const accelBar = document.getElementById('stat-bar-accel');
    if (accelBar) accelBar.style.width = `${bike.accelerationRating}%`;

    const nitroBar = document.getElementById('stat-bar-nitro');
    if (nitroBar) nitroBar.style.width = `${bike.nitroRating}%`;

    const actionBtn = document.getElementById('btn-garage-action') as HTMLButtonElement;
    if (actionBtn) {
      const isUnlocked = this.garageManager.isUnlocked(bike.id);
      const isSelected = this.saveManager.data.selectedBikeId === bike.id;

      if (isSelected) {
        actionBtn.innerText = 'SELECTED';
        actionBtn.className = 'btn btn-secondary';
        actionBtn.disabled = true;
      } else if (isUnlocked) {
        actionBtn.innerText = 'SELECT';
        actionBtn.className = 'btn btn-primary';
        actionBtn.disabled = false;
      } else {
        actionBtn.innerText = `UNLOCK (${bike.price} COINS)`;
        actionBtn.className = 'btn btn-accent';
        actionBtn.disabled = this.economyManager.coins < bike.price;
      }
    }

    this.renderUpgradeCards();
  }

  private renderUpgradeCards(): void {
    const list = document.getElementById('garage-upgrades-list');
    if (!list) return;

    list.innerHTML = '';
    const types: UpgradeType[] = [
      'acceleration',
      'topSpeed',
      'handling',
      'braking',
      'nitroCapacity',
      'shieldDuration',
      'turboDuration',
      'coinBonus',
    ];

    for (const t of types) {
      const config = UPGRADES[t];
      const lvl = this.upgradeManager.getLevel(t);
      const cost = this.upgradeManager.getCost(t);
      const isMax = lvl >= config.maxLevel;

      const card = document.createElement('div');
      card.className = 'upgrade-card';

      let pipsHtml = '';
      for (let p = 0; p < config.maxLevel; p++) {
        pipsHtml += `<div class="upgrade-pip ${p < lvl ? 'active' : ''}"></div>`;
      }

      card.innerHTML = `
        <span class="upgrade-icon">${config.icon}</span>
        <div class="upgrade-details">
          <div class="upgrade-name">${config.name}</div>
          <div class="upgrade-desc">${config.description} (${config.getFormattedBonus(lvl)})</div>
          <div class="upgrade-pips">${pipsHtml}</div>
        </div>
        <button class="btn ${isMax ? 'btn-secondary' : 'btn-accent'}" style="padding:8px 16px; font-size:0.9rem;" ${isMax ? 'disabled' : ''}>
          ${isMax ? 'MAX' : `${cost} 🪙`}
        </button>
      `;

      const btn = card.querySelector('button');
      if (btn && !isMax) {
        btn.addEventListener('click', () => {
          this.audioManager.playClick();
          if (this.upgradeManager.purchaseUpgrade(t)) {
            this.updateCoinDisplays();
            this.populateGarage();
          }
        });
      }

      list.appendChild(card);
    }
  }

  public populateLevelSelect(): void {
    const container = document.getElementById('level-select-container');
    if (!container) return;

    container.innerHTML = '';

    const envGroups: Record<string, typeof LEVELS> = {};
    for (const lvl of LEVELS) {
      if (!envGroups[lvl.environmentId]) envGroups[lvl.environmentId] = [];
      envGroups[lvl.environmentId].push(lvl);
    }

    const envNames: Record<string, string> = {
      sunny_city: '1. Sunny City (Levels 1 - 6)',
      coastal_highway: '2. Coastal Highway (Levels 7 - 12)',
      desert_expressway: '3. Desert Expressway (Levels 13 - 18)',
      mountain_road: '4. Mountain Road (Levels 19 - 24)',
      neon_future: '5. Neon Future City (Levels 25 - 30)',
    };

    const unlockedLevel = this.saveManager.data.unlockedLevel;

    for (const [envId, lvls] of Object.entries(envGroups)) {
      const section = document.createElement('div');
      section.className = 'env-levels-section';

      const title = document.createElement('h3');
      title.className = 'env-title';
      title.innerText = envNames[envId] || envId;
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'levels-grid';

      for (const l of lvls) {
        const isUnlocked = l.levelNumber <= unlockedLevel;
        const stars = this.saveManager.data.levelStars[l.levelNumber] || 0;

        const tile = document.createElement('div');
        tile.className = `level-tile ${isUnlocked ? '' : 'locked'}`;

        let starsHtml = '';
        for (let s = 1; s <= 3; s++) {
          starsHtml += s <= stars ? '★' : '☆';
        }

        tile.innerHTML = `
          <div class="tile-number">${isUnlocked ? l.levelNumber : '🔒'}</div>
          <div class="tile-stars">${isUnlocked ? starsHtml : ''}</div>
        `;

        if (isUnlocked) {
          tile.addEventListener('click', () => {
            this.audioManager.playClick();
            this.callbacks.onPlayCampaign(l.levelNumber);
          });
        }

        grid.appendChild(tile);
      }

      section.appendChild(grid);
      container.appendChild(section);
    }
  }

  public populateDailyChallenges(): void {
    const list = document.getElementById('daily-challenges-list');
    const dateLabel = document.getElementById('daily-date-label');
    if (!list) return;

    if (dateLabel) {
      dateLabel.innerText = `Date: ${new Date().toLocaleDateString()}`;
    }

    list.innerHTML = '';
    const challenges = this.dailyChallengeManager.challenges;

    for (const ch of challenges) {
      const prog = this.dailyChallengeManager.getProgress(ch.id);
      const isComp = this.dailyChallengeManager.isCompleted(ch.id);
      const isClaimed = this.dailyChallengeManager.isClaimed(ch.id);

      const item = document.createElement('div');
      item.className = 'upgrade-card';
      item.innerHTML = `
        <span style="font-size:2rem;">${ch.icon}</span>
        <div class="upgrade-details">
          <div class="upgrade-name">${ch.title}</div>
          <div class="upgrade-desc">${ch.description} (${prog}/${ch.target})</div>
          <div class="stat-bar-bg" style="height:6px; margin-top:4px;">
            <div class="stat-bar-val" style="width:${Math.min(100, (prog / ch.target) * 100)}%;"></div>
          </div>
        </div>
        <button class="btn ${isClaimed ? 'btn-secondary' : isComp ? 'btn-green' : 'btn-secondary'}" style="padding:8px 16px; font-size:0.85rem;" ${isClaimed || !isComp ? 'disabled' : ''}>
          ${isClaimed ? 'CLAIMED' : isComp ? `CLAIM +${ch.reward}🪙` : `${ch.reward} 🪙`}
        </button>
      `;

      const btn = item.querySelector('button');
      if (btn && isComp && !isClaimed) {
        btn.addEventListener('click', () => {
          this.audioManager.playVictory();
          if (this.dailyChallengeManager.claimReward(ch.id)) {
            this.updateCoinDisplays();
            this.populateDailyChallenges();
          }
        });
      }

      list.appendChild(item);
    }
  }

  public populateAchievements(): void {
    const list = document.getElementById('achievements-list');
    if (!list) return;

    list.innerHTML = '';
    const achs = this.achievementManager.list;

    for (const a of achs) {
      const isUnlocked = this.achievementManager.isUnlocked(a.id);
      const isClaimed = this.achievementManager.isClaimed(a.id);

      const item = document.createElement('div');
      item.className = 'upgrade-card';
      item.innerHTML = `
        <span style="font-size:2rem;">${a.icon}</span>
        <div class="upgrade-details">
          <div class="upgrade-name">${a.title}</div>
          <div class="upgrade-desc">${a.description}</div>
        </div>
        <button class="btn ${isClaimed ? 'btn-secondary' : isUnlocked ? 'btn-green' : 'btn-secondary'}" style="padding:8px 16px; font-size:0.85rem;" ${isClaimed || !isUnlocked ? 'disabled' : ''}>
          ${isClaimed ? 'CLAIMED' : isUnlocked ? `CLAIM +${a.coinReward}🪙` : 'LOCKED'}
        </button>
      `;

      const btn = item.querySelector('button');
      if (btn && isUnlocked && !isClaimed) {
        btn.addEventListener('click', () => {
          this.audioManager.playVictory();
          if (this.achievementManager.claim(a.id)) {
            this.updateCoinDisplays();
            this.populateAchievements();
          }
        });
      }

      list.appendChild(item);
    }
  }

  public syncSettingsInputs(): void {
    const s = this.saveManager.data.settings;
    (document.getElementById('setting-sfx') as HTMLInputElement).value = String(s.sfxVolume);
    (document.getElementById('setting-music') as HTMLInputElement).value = String(s.musicVolume);
    (document.getElementById('setting-mute') as HTMLInputElement).checked = s.mute;
    (document.getElementById('setting-sens') as HTMLInputElement).value = String(s.sensitivity);
    (document.getElementById('setting-graphics') as HTMLSelectElement).value = s.graphicsQuality;
    (document.getElementById('setting-shake') as HTMLInputElement).checked = s.cameraShake;
    (document.getElementById('setting-motion') as HTMLInputElement).checked = s.reducedMotion;
  }

  private setupEventListeners(): void {
    // Play buttons
    document.getElementById('btn-play-campaign')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onPlayCampaign(this.saveManager.data.unlockedLevel);
    });

    document.getElementById('btn-play-endless')?.addEventListener('click', () => {
      this.audioManager.playClick();
      if (this.saveManager.data.unlockedLevel <= 5) {
        this.showToast('Complete Career Level 5 to unlock Traffic Rush!');
        return;
      }
      this.callbacks.onPlayEndless();
    });

    document.getElementById('btn-play-timetrial')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onPlayTimeTrial?.();
    });

    // Touch controls (Mobile & pointer dragging)
    const bindTouch = (id: string, action: 'throttle' | 'brake' | 'nitro') => {
      const el = document.getElementById(id);
      if (!el) return;
      const getCb = () => {
        if (!this.callbacks) return undefined;
        if (action === 'throttle') return this.callbacks.onTouchThrottle;
        if (action === 'brake') return this.callbacks.onTouchBrake;
        return this.callbacks.onTouchNitro;
      };
      const start = (e: Event) => {
        e.preventDefault();
        getCb()?.(true);
      };
      const end = (e: Event) => {
        e.preventDefault();
        getCb()?.(false);
      };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointerleave', end);
      el.addEventListener('pointercancel', end);
    };
    bindTouch('btn-touch-throttle', 'throttle');
    bindTouch('btn-touch-brake', 'brake');
    bindTouch('btn-touch-nitro', 'nitro');

    // Navigation buttons
    document.getElementById('btn-open-garage')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.garageSelectedBikeIndex = MOTORCYCLES.findIndex(
        b => b.id === this.saveManager.data.selectedBikeId
      );
      if (this.garageSelectedBikeIndex === -1) this.garageSelectedBikeIndex = 0;
      this.populateGarage();
      this.showScreen('screen-garage');
    });

    document.getElementById('btn-garage-back')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.showScreen('screen-main-menu');
    });

    document.getElementById('btn-open-levels')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.populateLevelSelect();
      this.showScreen('screen-level-select');
    });

    document.getElementById('btn-level-back')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.showScreen('screen-main-menu');
    });

    // Bike carousel
    document.getElementById('btn-bike-prev')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.garageSelectedBikeIndex =
        (this.garageSelectedBikeIndex - 1 + MOTORCYCLES.length) % MOTORCYCLES.length;
      this.populateGarage();
      this.callbacks.onSelectBike(MOTORCYCLES[this.garageSelectedBikeIndex].id);
    });

    document.getElementById('btn-bike-next')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.garageSelectedBikeIndex =
        (this.garageSelectedBikeIndex + 1) % MOTORCYCLES.length;
      this.populateGarage();
      this.callbacks.onSelectBike(MOTORCYCLES[this.garageSelectedBikeIndex].id);
    });

    document.getElementById('btn-garage-action')?.addEventListener('click', () => {
      this.audioManager.playClick();
      const bike = MOTORCYCLES[this.garageSelectedBikeIndex];
      if (this.garageManager.isUnlocked(bike.id)) {
        this.garageManager.selectBike(bike.id);
      } else {
        if (this.garageManager.purchaseBike(bike.id)) {
          this.audioManager.playVictory();
        }
      }
      this.populateGarage();
      this.callbacks.onSelectBike(bike.id);
    });

    // Modals
    document.getElementById('btn-open-challenges')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.populateDailyChallenges();
      document.getElementById('modal-challenges')!.style.display = 'flex';
    });
    document.getElementById('btn-close-challenges')?.addEventListener('click', () => {
      this.audioManager.playClick();
      document.getElementById('modal-challenges')!.style.display = 'none';
    });

    document.getElementById('btn-open-achievements')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.populateAchievements();
      document.getElementById('modal-achievements')!.style.display = 'flex';
    });
    document.getElementById('btn-close-achievements')?.addEventListener('click', () => {
      this.audioManager.playClick();
      document.getElementById('modal-achievements')!.style.display = 'none';
    });

    document.getElementById('btn-settings-open')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.syncSettingsInputs();
      document.getElementById('modal-settings')!.style.display = 'flex';
    });
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.audioManager.playClick();
      document.getElementById('modal-settings')!.style.display = 'none';
    });

    // Settings changes
    const onSettingChange = () => {
      const s = this.saveManager.data.settings;
      s.sfxVolume = parseFloat((document.getElementById('setting-sfx') as HTMLInputElement).value);
      s.musicVolume = parseFloat((document.getElementById('setting-music') as HTMLInputElement).value);
      s.mute = (document.getElementById('setting-mute') as HTMLInputElement).checked;
      s.sensitivity = parseFloat((document.getElementById('setting-sens') as HTMLInputElement).value);
      s.graphicsQuality = (document.getElementById('setting-graphics') as HTMLSelectElement).value as any;
      s.cameraShake = (document.getElementById('setting-shake') as HTMLInputElement).checked;
      s.reducedMotion = (document.getElementById('setting-motion') as HTMLInputElement).checked;

      this.saveManager.saveData();
      this.callbacks.onSettingsChanged();
    };

    ['setting-sfx', 'setting-music', 'setting-mute', 'setting-sens', 'setting-graphics', 'setting-shake', 'setting-motion'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', onSettingChange);
    });

    // Reset progress button
    document.getElementById('btn-reset-save')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all game progress? This cannot be undone.')) {
        this.saveManager.resetProgress();
        this.updateCoinDisplays();
        this.syncSettingsInputs();
        this.callbacks.onSettingsChanged();
        alert('Progress reset to defaults.');
      }
    });

    // Pause menu buttons
    document.getElementById('btn-pause-open')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.showScreen('screen-pause');
    });
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onResume();
      this.showScreen('screen-hud');
    });
    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onRestart();
    });
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.syncSettingsInputs();
      document.getElementById('modal-settings')!.style.display = 'flex';
    });
    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onQuitToMenu();
      this.showScreen('screen-main-menu');
    });

    // Results screen buttons
    document.getElementById('btn-res-replay')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onRestart();
    });
    document.getElementById('btn-res-garage')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onQuitToMenu();
      this.garageSelectedBikeIndex = MOTORCYCLES.findIndex(
        b => b.id === this.saveManager.data.selectedBikeId
      );
      if (this.garageSelectedBikeIndex === -1) this.garageSelectedBikeIndex = 0;
      this.populateGarage();
      this.showScreen('screen-garage');
    });
    document.getElementById('btn-res-menu')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onQuitToMenu();
      this.showScreen('screen-main-menu');
    });
    document.getElementById('btn-res-next')?.addEventListener('click', () => {
      this.audioManager.playClick();
      if (this.lastWasEndless) {
        this.callbacks.onPlayEndless();
        return;
      }
      if (this.lastPlayedCampaignLevel >= 30) {
        this.populateLevelSelect();
        this.showScreen('screen-level-select');
        return;
      }
      const nextLvl = this.lastPlayedCampaignLevel + 1;
      this.callbacks.onPlayCampaign(Math.min(nextLvl, this.saveManager.data.unlockedLevel));
    });
  }
}
