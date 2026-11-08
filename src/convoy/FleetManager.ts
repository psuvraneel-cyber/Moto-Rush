import * as THREE from 'three';
import { GAME_CONFIG } from '../core/GameConfig';
import { FormationController } from './FormationController';
import { FleetRenderer } from './FleetRenderer';
import { EventBus, GlobalEvents } from '../core/EventBus';

export class FleetManager {
  private logicalFleet: number = 1;
  private maxFleetReached: number = 1;
  private totalLostBikes: number = 0;
  private formationController: FormationController;
  private fleetRenderer: FleetRenderer;
  private eventBus: EventBus;
  private isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;

  constructor(eventBus: EventBus, maxInstances?: number) {
    this.eventBus = eventBus;
    this.formationController = new FormationController();
    this.fleetRenderer = new FleetRenderer(maxInstances);
  }

  public get rendererGroup(): THREE.Group {
    return this.fleetRenderer.group;
  }

  public get count(): number {
    return this.logicalFleet;
  }

  public get maxCount(): number {
    return this.maxFleetReached;
  }

  public get lostBikes(): number {
    return this.totalLostBikes;
  }

  public get invulnerable(): boolean {
    return this.isInvulnerable;
  }

  public setGraphicsPreset(quality: 'low' | 'medium' | 'high'): void {
    const preset = GAME_CONFIG.GRAPHICS_PRESETS[quality];
    this.fleetRenderer.setMaxInstances(preset.maxFollowers);
  }

  public setMotorcycleColor(color: number): void {
    this.fleetRenderer.setColor(color);
  }

  public reset(startingFleet: number = 1): void {
    this.logicalFleet = Math.max(GAME_CONFIG.MIN_FLEET, startingFleet);
    this.maxFleetReached = this.logicalFleet;
    this.totalLostBikes = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.fleetRenderer.clear();
    this.emitChange(0);
  }

  public setFleet(newCount: number): void {
    const prev = this.logicalFleet;
    this.logicalFleet = Math.max(
      GAME_CONFIG.MIN_FLEET,
      Math.min(GAME_CONFIG.MAX_FLEET, Math.floor(newCount))
    );
    if (this.logicalFleet > this.maxFleetReached) {
      this.maxFleetReached = this.logicalFleet;
    }
    const delta = this.logicalFleet - prev;
    if (delta < 0) {
      this.totalLostBikes += Math.abs(delta);
    }
    this.emitChange(delta);
  }

  public addBikes(count: number): void {
    if (count <= 0) return;
    this.setFleet(this.logicalFleet + count);
  }

  public takeDamage(damage: number): number {
    if (this.isInvulnerable) return 0;

    const previous = this.logicalFleet;
    const newFleet = Math.max(GAME_CONFIG.MIN_FLEET, this.logicalFleet - damage);
    const lost = previous - newFleet;

    this.logicalFleet = newFleet;
    this.totalLostBikes += lost;

    // Trigger brief invulnerability window
    this.isInvulnerable = true;
    this.invulnerableTimer = GAME_CONFIG.INVULNERABILITY_AFTER_HIT_DURATION;

    this.emitChange(-lost);
    return lost;
  }

  public repair(ratio: number): number {
    if (this.totalLostBikes <= 0) return 0;
    const toRestore = Math.max(1, Math.floor(this.totalLostBikes * ratio));
    this.totalLostBikes = Math.max(0, this.totalLostBikes - toRestore);
    this.addBikes(toRestore);
    return toRestore;
  }

  public update(dt: number, heroPosition: THREE.Vector3, lean: number): void {
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    const followersCount = this.logicalFleet - 1;
    if (followersCount > 0) {
      const slots = this.formationController.calculateFollowerSlots(followersCount, lean);
      this.fleetRenderer.update(heroPosition, slots, lean);
    } else {
      this.fleetRenderer.clear();
    }
  }

  private emitChange(delta: number): void {
    this.eventBus.emit(GlobalEvents.FLEET_UPDATED, {
      count: this.logicalFleet,
      delta,
      maxReached: this.maxFleetReached,
    });
  }
}
