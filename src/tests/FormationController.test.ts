import { describe, it, expect } from 'vitest';
import { FormationController } from '../convoy/FormationController';

describe('FormationController', () => {
  const controller = new FormationController();

  it('returns empty array when follower count is 0', () => {
    const slots = controller.calculateFollowerSlots(0);
    expect(slots.length).toBe(0);
  });

  it('places followers behind the hero (negative Z)', () => {
    const slots = controller.calculateFollowerSlots(5);
    expect(slots.length).toBe(5);
    for (const slot of slots) {
      expect(slot.targetOffsetZ).toBeLessThan(0);
    }
  });

  it('caps slots at maxRendered', () => {
    const slots = controller.calculateFollowerSlots(500, 0, 50);
    expect(slots.length).toBe(50);
  });

  it('compresses column spacing under high steering lean', () => {
    const normalSlots = controller.calculateFollowerSlots(4, 0);
    const leanSlots = controller.calculateFollowerSlots(4, 1.0);

    const normalRow1Width = Math.abs(normalSlots[1].targetOffsetX - normalSlots[0].targetOffsetX);
    const leanRow1Width = Math.abs(leanSlots[1].targetOffsetX - leanSlots[0].targetOffsetX);

    expect(leanRow1Width).toBeLessThan(normalRow1Width);
  });

  it('clamps positions within track boundaries', () => {
    const clamped = controller.clampToTrack(10, 2, 12);
    expect(clamped).toBeLessThanOrEqual(6 - 0.6);

    const clampedMin = controller.clampToTrack(-10, -2, 12);
    expect(clampedMin).toBeGreaterThanOrEqual(-6 + 0.6);
  });
});
