export type UpdateCallback = (dt: number, totalTime: number) => void;
export type RenderCallback = () => void;

export class GameLoop {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private totalTime: number = 0;
  private animFrameId: number | null = null;
  private readonly maxDelta: number = 0.1; // Cap at 100ms to avoid tunneling on stutter

  constructor(
    private updateFn: UpdateCallback,
    private renderFn: RenderCallback
  ) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (!paused) {
      this.lastTime = performance.now();
    }
  }

  public get paused(): boolean {
    return this.isPaused;
  }

  private tick = (currentTime: number): void => {
    if (!this.isRunning) return;

    this.animFrameId = requestAnimationFrame(this.tick);

    const rawDelta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    const dt = Math.min(rawDelta, this.maxDelta);

    if (!this.isPaused) {
      this.totalTime += dt;
      this.updateFn(dt, this.totalTime);
    }

    this.renderFn();
  };
}
