export class MathUtils {
  public static clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * MathUtils.clamp(t, 0, 1);
  }

  /**
   * Frame-rate independent exponential damping.
   * lambda controls speed of convergence.
   */
  public static damp(current: number, target: number, lambda: number, dt: number): number {
    return MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
  }

  public static randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  public static randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  public static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return Math.floor(num).toLocaleString();
  }

  public static easeOutQuad(x: number): number {
    return 1 - (1 - x) * (1 - x);
  }

  public static easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  public static createSeededRandom(seed: number): () => number {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
}
