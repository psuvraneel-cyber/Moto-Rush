import { describe, it, expect } from 'vitest';
import { FleetManager } from '../convoy/FleetManager';
import { EventBus } from '../core/EventBus';
import * as THREE from 'three';

describe('FleetManager', () => {
  it('initializes with starting fleet count', () => {
    const bus = new EventBus();
    const fm = new FleetManager(bus);
    fm.reset(5);

    expect(fm.count).toBe(5);
    expect(fm.maxCount).toBe(5);
  });

  it('clamps fleet damage and never drops below 1', () => {
    const bus = new EventBus();
    const fm = new FleetManager(bus);
    fm.reset(4);

    const lost = fm.takeDamage(10);
    expect(lost).toBe(3);
    expect(fm.count).toBe(1);
  });

  it('honors invulnerability window to prevent repeat damage', () => {
    const bus = new EventBus();
    const fm = new FleetManager(bus);
    fm.reset(10);

    const firstLoss = fm.takeDamage(3);
    expect(firstLoss).toBe(3);
    expect(fm.count).toBe(7);
    expect(fm.invulnerable).toBe(true);

    // Second hit while invulnerable does 0 damage
    const secondLoss = fm.takeDamage(3);
    expect(secondLoss).toBe(0);
    expect(fm.count).toBe(7);

    // After timer expires, damage can be taken again
    fm.update(1.0, new THREE.Vector3(0, 0, 0), 0);
    expect(fm.invulnerable).toBe(false);

    const thirdLoss = fm.takeDamage(2);
    expect(thirdLoss).toBe(2);
    expect(fm.count).toBe(5);
  });

  it('repairs fleet properly', () => {
    const bus = new EventBus();
    const fm = new FleetManager(bus);
    fm.reset(10);
    fm.takeDamage(6);
    expect(fm.count).toBe(4);
    expect(fm.lostBikes).toBe(6);

    const restored = fm.repair(0.5);
    expect(restored).toBe(3);
    expect(fm.count).toBe(7);
  });
});
