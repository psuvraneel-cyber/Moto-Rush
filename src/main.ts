import { Game } from './core/Game';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Fatal: Failed to find #game-canvas element.');
    return;
  }

  try {
    const game = new Game(canvas);
    (window as any).__MOTO_RUSH_GAME__ = game;
    console.log('MOTO RUSH 3D: CONVOY MAYHEM initialized successfully.');
  } catch (err) {
    console.error('Fatal initialization error in Game:', err);
  }
});
