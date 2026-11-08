import { PlatformAdapter, AdRewardResult } from './PlatformAdapter';

export class LocalPlatformAdapter implements PlatformAdapter {
  private ready: boolean = false;

  public async initialize(): Promise<boolean> {
    this.ready = true;
    return true;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async requestRewardedAd(placement: string): Promise<AdRewardResult> {
    // In local standalone environment, rewarded ads are not available
    console.log(`[LocalPlatformAdapter] Rewarded ad requested for: ${placement} (unavailable locally)`);
    return { rewarded: false, type: placement };
  }

  public async requestInterstitialAd(placement: string): Promise<boolean> {
    console.log(`[LocalPlatformAdapter] Interstitial ad requested for: ${placement} (skipped locally)`);
    return false;
  }

  public async submitScore(leaderboardId: string, score: number): Promise<boolean> {
    console.log(`[LocalPlatformAdapter] Score submitted to ${leaderboardId}: ${score}`);
    return true;
  }

  public async getPlatformSaveData(): Promise<any | null> {
    return null;
  }
}
