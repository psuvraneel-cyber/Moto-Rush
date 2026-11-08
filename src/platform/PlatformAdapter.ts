export interface AdRewardResult {
  rewarded: boolean;
  type: string;
}

export interface PlatformAdapter {
  initialize(): Promise<boolean>;
  isReady(): boolean;
  requestRewardedAd(placement: string): Promise<AdRewardResult>;
  requestInterstitialAd(placement: string): Promise<boolean>;
  submitScore(leaderboardId: string, score: number): Promise<boolean>;
  getPlatformSaveData(): Promise<any | null>;
}
