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
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  onSelectBike: (bikeId: string) => void;
  onSettingsChanged: () => void;
}

export class UIManager {
  private container: HTMLElement;
  private callbacks!: UICallbacks;
  private currentScreenId: string = 'screen-main-menu';
  private garageSelectedBikeIndex: number = 0;

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
    this.showScreen('screen-main-menu');
  }

  private buildHTML(): void {
    this.container.innerHTML = `
      <!-- TOP BAR -->
      <div class="top-bar ui-interactive">
        <div class="coin-pill">
          <span class="coin-icon">🪙</span>
          <span id="ui-coin-count">0</span>
        </div>
        <div style="display:flex; gap:10px;">
          <button id="btn-settings-open" class="btn btn-secondary btn-icon" title="Settings">⚙️</button>
        </div>
      </div>

      <!-- MAIN MENU -->
      <div id="screen-main-menu" class="screen ui-interactive">
        <div class="title-container">
          <h1 class="game-title">MOTO RUSH 3D</h1>
          <p class="game-subtitle">CONVOY MAYHEM</p>
        </div>

        <div class="menu-actions">
          <button id="btn-play-campaign" class="btn btn-primary btn-play-large">
            ▶ PLAY CAMPAIGN
          </button>
          <button id="btn-play-endless" class="btn btn-accent" style="width:100%; padding:16px;">
            ⚡ ENDLESS SURVIVAL
          </button>

          <div class="menu-grid-buttons">
            <button id="btn-open-garage" class="btn btn-secondary">🏍️ GARAGE</button>
            <button id="btn-open-levels" class="btn btn-secondary">🗺️ LEVELS</button>
            <button id="btn-open-challenges" class="btn btn-secondary">📅 DAILY</button>
            <button id="btn-open-achievements" class="btn btn-secondary">🏆 AWARDS</button>
          </div>
        </div>

        <p class="footer-hint">Desktop: A/D or Drag to Steer &bull; Mobile: Drag Screen</p>
      </div>

      <!-- HUD -->
      <div id="screen-hud" class="screen">
        <div class="top-bar ui-interactive" style="position:static;">
          <div class="hud-top-left">
            <div id="hud-level-tag" class="hud-level-badge">LEVEL 1</div>
            <div class="coin-pill">
              <span class="coin-icon">🪙</span>
              <span id="hud-coin-count">0</span>
            </div>
          </div>
          <button id="btn-pause-open" class="btn btn-secondary btn-icon">⏸</button>
        </div>

        <div class="hud-center">
          <div class="fleet-counter-container">
            <div id="hud-fleet-number" class="fleet-count-display">1</div>
            <div class="fleet-label">CONVOY FLEET</div>
            <div id="hud-fleet-popup" class="fleet-popup-tag">+5</div>
          </div>
          <div class="progress-container">
            <div id="hud-progress-fill" class="progress-fill"></div>
          </div>
          <div id="hud-powerups-list" class="hud-powerups-list"></div>
        </div>

        <div></div>
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
        <div class="glass-panel results-modal">
          <h2 id="results-heading" class="results-title">VICTORY!</h2>
          <div class="stars-row">
            <span id="star-1" class="star-icon">★</span>
            <span id="star-2" class="star-icon">★</span>
            <span id="star-3" class="star-icon">★</span>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-title">Surviving Convoy</span>
              <span id="res-fleet-val" class="stat-value">12</span>
            </div>
            <div class="stat-item">
              <span class="stat-title">Coins Earned</span>
              <span id="res-coins-val" class="stat-value" style="color:var(--accent-gold);">+140</span>
            </div>
          </div>

          <div class="results-actions">
            <button id="btn-res-replay" class="btn btn-secondary">↺ REPLAY</button>
            <button id="btn-res-garage" class="btn btn-secondary">🏍️ GARAGE</button>
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
                <span class="stat-bar-label">BONUS FLEET</span>
                <div class="stat-bar-bg"><div id="stat-bar-fleet" class="stat-bar-val" style="width:10%;"></div></div>
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
          <h2 style="font-family:var(--title-font); font-size:1.8rem; color:var(--primary-glow);">CAMPAIGN MAP</h2>
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
    fleetCount: number,
    delta: number,
    levelNum: number,
    progressRatio: number,
    coins: number,
    isEndless: boolean = false
  ): void {
    const fleetEl = document.getElementById('hud-fleet-number');
    if (fleetEl) {
      fleetEl.innerText = MathUtils.formatNumber(fleetCount);
      fleetEl.style.transform = 'scale(1.22)';
      setTimeout(() => {
        fleetEl.style.transform = 'scale(1)';
      }, 120);
    }

    // Delta popup tag
    if (delta !== 0) {
      const popEl = document.getElementById('hud-fleet-popup');
      if (popEl) {
        popEl.innerText = delta > 0 ? `+${delta}` : `${delta}`;
        popEl.className = `fleet-popup-tag ${delta > 0 ? 'positive' : 'negative'}`;
        popEl.style.opacity = '1';
        popEl.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          popEl.style.opacity = '0';
          popEl.style.transform = 'translateY(0)';
        }, 600);
      }
    }

    const levelTag = document.getElementById('hud-level-tag');
    if (levelTag) {
      levelTag.innerText = isEndless ? `ENDLESS: ${Math.floor(progressRatio)}m` : `LEVEL ${levelNum}`;
    }

    const fill = document.getElementById('hud-progress-fill');
    if (fill) {
      const pct = isEndless ? 100 : Math.min(100, Math.max(0, progressRatio * 100));
      fill.style.width = `${pct}%`;
    }

    const coinEl = document.getElementById('hud-coin-count');
    if (coinEl) {
      coinEl.innerText = MathUtils.formatNumber(coins);
    }
  }

  public showResults(rewards: RewardBreakdown, survivingFleet: number, isEndless: boolean = false): void {
    this.updateCoinDisplays();

    const heading = document.getElementById('results-heading');
    if (heading) {
      heading.innerText = isEndless ? 'RUN FINISHED' : 'LEVEL COMPLETE';
    }

    const fleetVal = document.getElementById('res-fleet-val');
    if (fleetVal) fleetVal.innerText = `${survivingFleet}`;

    const coinsVal = document.getElementById('res-coins-val');
    if (coinsVal) coinsVal.innerText = `+${rewards.totalCoins}`;

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

    this.showScreen('screen-results');
  }

  public populateGarage(): void {
    this.updateCoinDisplays();
    const bike = MOTORCYCLES[this.garageSelectedBikeIndex];

    const nameEl = document.getElementById('garage-bike-name');
    if (nameEl) nameEl.innerText = bike.name;

    const subEl = document.getElementById('garage-bike-subtitle');
    if (subEl) subEl.innerText = bike.subtitle;

    const speedBar = document.getElementById('stat-bar-speed');
    if (speedBar) speedBar.style.width = `${bike.speedRating}%`;

    const handleBar = document.getElementById('stat-bar-handling');
    if (handleBar) handleBar.style.width = `${bike.handlingRating}%`;

    const fleetBar = document.getElementById('stat-bar-fleet');
    if (fleetBar) fleetBar.style.width = `${(bike.bonusFleet / 6) * 100}%`;

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
      'starterFleet',
      'coinBonus',
      'shieldDuration',
      'turboDuration',
      'fleetRecovery',
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
      this.callbacks.onPlayEndless();
    });

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
      this.garageSelectedBikeIndex = MOTORCYCLES.findIndex(
        b => b.id === this.saveManager.data.selectedBikeId
      );
      if (this.garageSelectedBikeIndex === -1) this.garageSelectedBikeIndex = 0;
      this.populateGarage();
      this.showScreen('screen-garage');
    });
    document.getElementById('btn-res-next')?.addEventListener('click', () => {
      this.audioManager.playClick();
      this.callbacks.onPlayCampaign(this.saveManager.data.unlockedLevel);
    });
  }
}
