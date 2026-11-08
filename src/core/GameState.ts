export enum GameState {
  BOOT = 'BOOT',
  LOADING = 'LOADING',
  MAIN_MENU = 'MAIN_MENU',
  LEVEL_SELECT = 'LEVEL_SELECT',
  GARAGE = 'GARAGE',
  DAILY_CHALLENGES = 'DAILY_CHALLENGES',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  SETTINGS = 'SETTINGS',
  COUNTDOWN = 'COUNTDOWN',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FINISHING = 'FINISHING',
  RESULTS = 'RESULTS',
  ENDLESS_MODE = 'ENDLESS_MODE',
}

export type StateChangeHandler = (newState: GameState, prevState: GameState) => void;

export class StateMachine {
  private currentState: GameState = GameState.BOOT;
  private listeners: StateChangeHandler[] = [];

  constructor(initialState: GameState = GameState.BOOT) {
    this.currentState = initialState;
  }

  public get current(): GameState {
    return this.currentState;
  }

  public subscribe(handler: StateChangeHandler): () => void {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter(l => l !== handler);
    };
  }

  public transitionTo(newState: GameState): boolean {
    if (this.currentState === newState) return false;
    const prev = this.currentState;
    this.currentState = newState;
    for (const listener of this.listeners) {
      listener(newState, prev);
    }
    return true;
  }
}
