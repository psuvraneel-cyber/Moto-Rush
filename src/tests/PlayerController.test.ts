import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { PlayerController } from '../player/PlayerController';
import { Motorcycle } from '../player/Motorcycle';
import { MOTORCYCLES } from '../progression/GarageManager';
import { GAME_CONFIG } from '../core/GameConfig';

describe('PlayerController Directional & Input Verification', () => {
  let motorcycle: Motorcycle;
  let controller: PlayerController;

  beforeEach(() => {
    motorcycle = new Motorcycle(MOTORCYCLES[0]);
    // Standard camera looking along +Z has screen-right = (-1, 0, 0)
    controller = new PlayerController(motorcycle, () => new THREE.Vector3(-1, 0, 0));
  });

  it('converts Screen Left (-1) to positive world X (Screen Left in +Z view)', () => {
    const worldDir = controller.convertScreenDirectionToWorld(-1);
    expect(worldDir).toBe(1); // (-1) * (-1) = +1
  });

  it('converts Screen Right (+1) to negative world X (Screen Right in +Z view)', () => {
    const worldDir = controller.convertScreenDirectionToWorld(1);
    expect(worldDir).toBe(-1); // (+1) * (-1) = -1
  });

  it('moves motorcycle toward Screen Left on KeyA or ArrowLeft input', () => {
    controller.reset(0, 0);

    // Press KeyA
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    controller.update(0.1);

    // In +Z camera view, World +X projects to Screen Left.
    // Moving Screen Left must increase X!
    expect(controller.x).toBeGreaterThan(0);

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
  });

  it('moves motorcycle toward Screen Right on KeyD or ArrowRight input', () => {
    controller.reset(0, 0);

    // Press KeyD
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    controller.update(0.1);

    // In +Z camera view, World -X projects to Screen Right.
    // Moving Screen Right must decrease X!
    expect(controller.x).toBeLessThan(0);

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
  });

  it('moves motorcycle toward Screen Right when dragging pointer to the right', () => {
    controller.reset(0, 0);

    // Simulate pointerdown on body
    const div = document.createElement('div');
    document.body.appendChild(div);

    window.dispatchEvent(new PointerEvent('pointerdown', { clientX: 400, clientY: 300, bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 450, clientY: 300, bubbles: true })); // +50px right
    controller.update(0.016);

    // Drag right -> motorcycle moves to Screen Right (World -X)
    expect(controller.x).toBeLessThan(0);

    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 450, clientY: 300, bubbles: true }));
    document.body.removeChild(div);
  });

  it('moves motorcycle toward Screen Left when dragging pointer to the left', () => {
    controller.reset(0, 0);

    window.dispatchEvent(new PointerEvent('pointerdown', { clientX: 400, clientY: 300, bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 350, clientY: 300, bubbles: true })); // -50px left
    controller.update(0.016);

    // Drag left -> motorcycle moves to Screen Left (World +X)
    expect(controller.x).toBeGreaterThan(0);

    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 350, clientY: 300, bubbles: true }));
  });

  it('adapts when camera orientation changes (e.g. reverse angle)', () => {
    // If camera looked along -Z, screen-right would be (+1, 0, 0)
    controller.setCameraOrientationProvider(() => new THREE.Vector3(1, 0, 0));

    expect(controller.convertScreenDirectionToWorld(1)).toBe(1);
    expect(controller.convertScreenDirectionToWorld(-1)).toBe(-1);
  });

  it('does not trigger drag steering when clicking an interactive UI element', () => {
    controller.reset(0, 0);

    const btn = document.createElement('button');
    btn.className = 'btn ui-interactive';
    document.body.appendChild(btn);

    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 400, clientY: 300, bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 500, clientY: 300, bubbles: true }));
    controller.update(0.016);

    // Bike should NOT have moved because pointerdown was on an interactive UI button
    expect(controller.x).toBe(0);

    document.body.removeChild(btn);
  });

  it('clamps lateral offset within road bounds', () => {
    controller.reset(0, 0);

    // Continuously steer right for 5 seconds
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    for (let i = 0; i < 50; i++) {
      controller.update(0.1);
    }
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));

    expect(controller.x).toBeGreaterThanOrEqual(-GAME_CONFIG.MAX_LATERAL_OFFSET);
    expect(controller.x).toBeLessThanOrEqual(GAME_CONFIG.MAX_LATERAL_OFFSET);
  });

  describe('Feature 5 & 6: Unified Input System & Mouse Return-to-Neutral', () => {
    it('normalizes keyboard inputs into PlayerInputState (throttle, brake, steer, nitro)', () => {
      controller.reset(0, 0);

      // Accelerate
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      expect(controller.isAccelerating).toBe(true);
      expect(controller.inputManager.getInputState().throttle).toBe(1.0);

      // Brake overrides throttle
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
      expect(controller.isBraking).toBe(true);
      expect(controller.inputManager.getInputState().throttle).toBe(0.0);
      expect(controller.inputManager.getInputState().brake).toBe(1.0);

      // Release brake
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }));
      expect(controller.isBraking).toBe(false);
      expect(controller.inputManager.getInputState().throttle).toBe(1.0);

      // Nitro
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
      expect(controller.inputManager.getInputState().nitro).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }));
    });

    it('returns steering deflection exponentially to neutral (0) upon pointer release', () => {
      controller.reset(0, 0);

      // Drag right by 100px
      window.dispatchEvent(new PointerEvent('pointerdown', { clientX: 300, clientY: 200, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 200, bubbles: true }));
      controller.update(0.016);

      const deflectionWhileDragging = controller.inputManager.currentMouseDeflection;
      expect(deflectionWhileDragging).toBeGreaterThan(0.4);

      // Release pointer: pointerup
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 400, clientY: 200, bubbles: true }));

      // After 0.05s, deflection should have decayed significantly
      controller.update(0.05);
      const deflectionAfterRelease = controller.inputManager.currentMouseDeflection;
      expect(deflectionAfterRelease).toBeLessThan(deflectionWhileDragging);
      expect(deflectionAfterRelease).toBeGreaterThan(0);

      // After 0.3s of release, it should have decayed to 0
      for (let i = 0; i < 6; i++) {
        controller.update(0.05);
      }
      expect(controller.inputManager.currentMouseDeflection).toBe(0);
      expect(controller.inputManager.getInputState().steering).toBe(0);
    });

    it('clamps drag anchor on overshoot so reversing mouse immediately responds with zero dead displacement', () => {
      controller.reset(0, 0);

      // Drag right by 300px (far beyond dragMaxPixels = 180px)
      window.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 200, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 200, bubbles: true }));
      controller.update(0.016);

      expect(controller.inputManager.currentMouseDeflection).toBeCloseTo(1.0, 2);

      // Now reverse by just 30px to the left (from 400 to 370)
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 370, clientY: 200, bubbles: true }));
      controller.update(0.016);

      // Because anchor was dynamically clamped to 400 - 180 = 220, moving to 370 means delta is 150 < 180!
      // Deflection must immediately decrease below 1.0!
      expect(controller.inputManager.currentMouseDeflection).toBeLessThan(1.0);

      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 370, clientY: 200, bubbles: true }));
    });

    it('filters micro-movements within steering dead zone (|deflection| < 0.04)', () => {
      controller.reset(0, 0);

      // Jitter by only 3px out of 180px (3 / 180 = 0.0167 < 0.04 dead zone)
      window.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 203, clientY: 200, bubbles: true }));
      controller.update(0.016);

      expect(controller.inputManager.currentMouseDeflection).toBe(0);
      expect(controller.inputManager.getInputState().steering).toBe(0);

      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 203, clientY: 200, bubbles: true }));
    });

    it('resets inputs on window blur and document visibilitychange', () => {
      controller.reset(0, 0);

      // Press keys
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      expect(controller.isAccelerating).toBe(true);

      // Window blur resets
      window.dispatchEvent(new Event('blur'));
      expect(controller.isAccelerating).toBe(false);
      expect(controller.inputManager.getInputState().steering).toBe(0);

      // Press key again and test document visibilitychange
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      expect(controller.isAccelerating).toBe(true);

      // Simulate tab switch (document.hidden = true)
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(controller.isAccelerating).toBe(false);
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    });
  });

  describe('Feature 7 & 8: Velocity-Based Lateral Dynamics & Speed-Dependent Steering', () => {
    it('scales steering authority down with forward speed S(v) (1.0 at 50 km/h to 0.72 at 160 km/h)', () => {
      const scaleLowSpeed = controller.getSpeedDependentSteeringScale(13.89);
      const scaleHighSpeed = controller.getSpeedDependentSteeringScale(44.44);
      const scaleNitroSpeed = controller.getSpeedDependentSteeringScale(51.39);

      expect(scaleLowSpeed).toBeCloseTo(1.00, 2);
      expect(scaleHighSpeed).toBeCloseTo(0.72, 2);
      expect(scaleNitroSpeed).toBeCloseTo(0.72, 2); // Clamped at 0.72 for safety
    });

    it('integrates lateral velocity exponentially dv_x/dt = a_x - gamma * v_x', () => {
      controller.reset(0, 0);

      // Hold steer left for 0.2s
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      controller.update(0.1);
      const vx1 = controller.currentLateralVelocity;
      controller.update(0.1);
      const vx2 = controller.currentLateralVelocity;
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));

      // Under constant input, lateral velocity increases smoothly toward terminal velocity
      expect(vx1).toBeGreaterThan(0);
      expect(vx2).toBeGreaterThan(vx1);

      // Release input: lateral velocity damps exponentially toward 0
      controller.update(0.1);
      const vx3 = controller.currentLateralVelocity;
      expect(vx3).toBeLessThan(vx2);

      for (let i = 0; i < 15; i++) {
        controller.update(0.1);
      }
      expect(controller.currentLateralVelocity).toBeCloseTo(0, 1);
    });

    it('pushes motorcycle inward with soft boundary restoring spring when |x| > 4.6m', () => {
      controller.reset(0, 0);

      // Drive bike past soft boundary (e.g. steer right until x reaches -4.8m)
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
      for (let i = 0; i < 25; i++) {
        controller.update(0.05);
      }
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));

      expect(Math.abs(controller.x)).toBeGreaterThan(4.6);
      const initialOverhangX = controller.x;

      // Now release steering: soft boundary spring must push bike inward toward road center
      for (let i = 0; i < 30; i++) {
        controller.update(0.05);
      }

      // X should have moved inward (closer to 0)
      expect(Math.abs(controller.x)).toBeLessThan(Math.abs(initialOverhangX));
    });

    it('strictly stops outward lateral velocity at hard boundary limit 5.2m', () => {
      controller.reset(0, 0);

      // Apply extreme lateral steering for 4 seconds
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
      for (let i = 0; i < 80; i++) {
        controller.update(0.05);
      }
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));

      // Must be strictly clamped within [-5.2, 5.2]
      expect(controller.x).toBeGreaterThanOrEqual(-5.2);
      expect(controller.x).toBeLessThanOrEqual(5.2);
      // Outward velocity must be 0
      expect(controller.currentLateralVelocity).toBeGreaterThanOrEqual(0); // If at -5.2, cannot be negative
    });
  });
});
