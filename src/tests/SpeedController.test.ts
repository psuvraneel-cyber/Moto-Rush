import { describe, it, expect, beforeEach } from 'vitest';
import { SpeedController, DEFAULT_SPEED_CONFIG } from '../racing/SpeedController';
import { PHYSICS_CONFIG } from '../core/PhysicsConfig';

describe('SpeedController Progressive Speed Model & Aerodynamic Drag', () => {
  let speedController: SpeedController;

  beforeEach(() => {
    speedController = new SpeedController();
  });

  it('initializes with calibrated speed boundaries (50 km/h min, 54 km/h cruising, 160 km/h max, 185 km/h nitro)', () => {
    expect(speedController.minSpeed).toBeCloseTo(13.89, 2);
    expect(speedController.cruisingSpeed).toBeCloseTo(15.00, 2);
    expect(speedController.maxSpeed).toBeCloseTo(44.44, 2);
    expect(speedController.nitroSpeed).toBeCloseTo(51.39, 2);
    expect(speedController.currentSpeed).toBeCloseTo(15.00, 2);
  });

  it('applies quadratic aerodynamic drag deceleration proportional to v^2', () => {
    // a_drag = Cd * v^2
    const cd = DEFAULT_SPEED_CONFIG.dragCoefficient;
    expect(cd).toBe(0.0020);

    const vHigh = 44.44; // 160 km/h
    const vLow = 15.00;  // 54 km/h

    const dragHigh = cd * vHigh * vHigh;
    const dragLow = cd * vLow * vLow;

    expect(dragHigh).toBeCloseTo(3.95, 1);
    expect(dragLow).toBeCloseTo(0.45, 1);
    expect(dragHigh / dragLow).toBeGreaterThan(8.0);
  });

  it('accelerates progressively from cruise to max speed under throttle', () => {
    const sc = new SpeedController({}, 15.0);

    // 4 seconds of full throttle
    for (let i = 0; i < 40; i++) {
      sc.update(0.1, 1.0, 0, false);
    }

    // Should accelerate past 35 m/s toward 44.44 m/s
    expect(sc.currentSpeed).toBeGreaterThan(35.0);
    expect(sc.currentSpeed).toBeLessThanOrEqual(44.44);
  });

  it('brakes smoothly and overrides throttle down to minimum crawl speed', () => {
    const sc = new SpeedController({}, 40.0);

    // Apply simultaneous throttle and brake - brake must override
    for (let i = 0; i < 30; i++) {
      sc.update(0.1, 1.0, 1.0, false);
    }

    expect(sc.currentSpeed).toBeLessThan(15.0);
    expect(sc.currentSpeed).toBeGreaterThanOrEqual(13.89);
  });

  it('reaches peak nitro speed (~185 km/h = 51.39 m/s) under sustained boost', () => {
    const sc = new SpeedController({}, 30.0);

    for (let i = 0; i < 40; i++) {
      sc.update(0.1, 0, 0, true);
    }

    expect(sc.currentSpeed).toBeGreaterThan(45.0);
    expect(sc.currentSpeed).toBeLessThanOrEqual(51.39);
  });

  it('coasts smoothly with aerodynamic drag toward cruising speed when throttle is released', () => {
    const sc = new SpeedController({}, 44.44);

    // High initial speed: aerodynamic drag is high (3.95 m/s^2)
    sc.update(0.1, 0, 0, false);
    const speedAfterOneStep = sc.currentSpeed;
    const initialDecelRate = (44.44 - speedAfterOneStep) / 0.1;

    expect(initialDecelRate).toBeGreaterThan(3.5);

    // Coast for 15 seconds
    for (let i = 0; i < 150; i++) {
      sc.update(0.1, 0, 0, false);
    }

    // Should settle near cruising speed
    expect(sc.currentSpeed).toBeCloseTo(15.0, 1);
  });

  it('recovers from below cruising speed toward cruising speed to prevent stalling', () => {
    const sc = new SpeedController({}, 13.89);

    for (let i = 0; i < 20; i++) {
      sc.update(0.1, 0, 0, false);
    }

    expect(sc.currentSpeed).toBeGreaterThan(13.89);
    expect(sc.currentSpeed).toBeLessThanOrEqual(15.0);
  });

  it('verifies speedometer conversion (speed * 3.6) produces exact km/h readouts', () => {
    const minKmh = Math.floor(speedController.minSpeed * 3.6);
    const cruiseKmh = Math.floor(speedController.cruisingSpeed * 3.6);
    const maxKmh = Math.floor(speedController.maxSpeed * 3.6);
    const nitroKmh = Math.floor(speedController.nitroSpeed * 3.6);

    expect(minKmh).toBe(50);
    expect(cruiseKmh).toBe(54);
    expect(maxKmh).toBe(159); // 44.44 * 3.6 = 159.984 -> floor = 159
    expect(nitroKmh).toBe(185); // 51.39 * 3.6 = 185.004 -> floor = 185
  });
});
