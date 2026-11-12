import * as THREE from 'three';
import { MathUtils } from '../utilities/MathUtils';
import { AssetLoader } from '../assets/AssetLoader';
import { RiderMeshBuilder } from './RiderMeshBuilder';

export enum RiderKinematicState {
  IDLE = 'IDLE',
  ACCELERATING = 'ACCELERATING',
  CRUISING = 'CRUISING',
  BRAKING = 'BRAKING',
  CORNERING = 'CORNERING',
  HIGH_SPEED_TUCK = 'HIGH_SPEED_TUCK',
  CRASHING = 'CRASHING',
}

export interface TwoBoneIKOutput {
  midPoint: THREE.Vector3;
  upperQuat: THREE.Quaternion;
  lowerQuat: THREE.Quaternion;
  hingeAngle: number;
}

// Preallocated scratch objects for zero garbage collection during game loop
const _vTarget = new THREE.Vector3();
const _vPole = new THREE.Vector3();
const _uTarget = new THREE.Vector3();
const _uBend = new THREE.Vector3();
const _nPlane = new THREE.Vector3();
const _u1 = new THREE.Vector3();
const _u2 = new THREE.Vector3();
const _mat1 = new THREE.Matrix4();
const _mat2 = new THREE.Matrix4();
const _xAxis = new THREE.Vector3();
const _vGripLocal = new THREE.Vector3();
const _vPegLocal = new THREE.Vector3();
const _vWorldTemp = new THREE.Vector3();
const _vLocalTemp = new THREE.Vector3();
const _shoulderPos = new THREE.Vector3();
const _hipPos = new THREE.Vector3();
const _poleTemp = new THREE.Vector3();

// Static unit vector constants to eliminate heap allocation during collinear fallback
const _V_UP = new THREE.Vector3(0, 1, 0);
const _V_RIGHT = new THREE.Vector3(1, 0, 0);

const _defaultIKOutput: TwoBoneIKOutput = {
  midPoint: new THREE.Vector3(),
  upperQuat: new THREE.Quaternion(),
  lowerQuat: new THREE.Quaternion(),
  hingeAngle: 0,
};

/**
 * Closed-form Law of Cosines 2-Bone Analytical IK Solver.
 * Solves in O(1) time (15 arithmetic ops) without iteration or convergence lag.
 * Accepts optional targetOutput buffer to eliminate runtime heap allocations.
 */
export function solve2BoneIK(
  p0: THREE.Vector3,
  target: THREE.Vector3,
  pole: THREE.Vector3,
  l1: number,
  l2: number,
  targetOutput?: TwoBoneIKOutput
): TwoBoneIKOutput {
  const out = targetOutput || _defaultIKOutput;

  // Defensive guard against degenerate or zero bone lengths
  if (l1 <= 0.0001 || l2 <= 0.0001) {
    out.midPoint.copy(p0);
    out.upperQuat.identity();
    out.lowerQuat.identity();
    out.hingeAngle = 0;
    return out;
  }

  _vTarget.subVectors(target, p0);
  let dist = _vTarget.length();
  if (dist < 0.0001) {
    _vTarget.set(0, -0.001, 0.001);
    dist = _vTarget.length();
  }

  // Reach clamping: prevent NaNs when target is outside or inside limits
  const maxReach = l1 + l2 - 0.001;
  const minReach = Math.abs(l1 - l2) + 0.001;
  const effDist = Math.max(minReach, Math.min(maxReach, dist));

  _uTarget.copy(_vTarget).multiplyScalar(1 / dist);

  // Law of Cosines
  const cosAlpha = Math.max(
    -1,
    Math.min(1, (l1 * l1 + effDist * effDist - l2 * l2) / (2 * l1 * effDist))
  );
  const alpha = Math.acos(cosAlpha);
  const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha));

  const cosBeta = Math.max(
    -1,
    Math.min(1, (l1 * l1 + l2 * l2 - effDist * effDist) / (2 * l1 * l2))
  );
  const hingeAngle = Math.PI - Math.acos(cosBeta);

  // Bend plane derived from pole vector
  _vPole.subVectors(pole, p0);
  const dotPole = _vPole.dot(_uTarget);
  _uBend.copy(_vPole).addScaledVector(_uTarget, -dotPole);

  if (_uBend.lengthSq() < 0.00001) {
    if (Math.abs(_uTarget.y) < 0.9) {
      _uBend.crossVectors(_uTarget, _V_UP);
    } else {
      _uBend.crossVectors(_uTarget, _V_RIGHT);
    }
  }
  _uBend.normalize();
  _nPlane.crossVectors(_uTarget, _uBend).normalize();

  // Analytical mid-joint position (elbow or knee)
  out.midPoint
    .copy(p0)
    .addScaledVector(_uTarget, l1 * cosAlpha)
    .addScaledVector(_uBend, l1 * sinAlpha);

  _u1.subVectors(out.midPoint, p0);
  if (_u1.lengthSq() < 0.00001) {
    out.upperQuat.identity();
  } else {
    _u1.normalize();
    _xAxis.crossVectors(_u1, _nPlane).normalize();
    _mat1.makeBasis(_xAxis, _u1, _nPlane);
    out.upperQuat.setFromRotationMatrix(_mat1);
  }

  _u2.subVectors(target, out.midPoint);
  if (_u2.lengthSq() < 0.00001) {
    out.lowerQuat.identity();
  } else {
    _u2.normalize();
    _xAxis.crossVectors(_u2, _nPlane).normalize();
    _mat2.makeBasis(_xAxis, _u2, _nPlane);
    out.lowerQuat.setFromRotationMatrix(_mat2);
  }

  out.upperQuat.normalize();
  out.lowerQuat.normalize();
  out.hingeAngle = hingeAngle;

  return out;
}

export class RiderController {
  public root: THREE.Group;
  public riderMesh: THREE.Object3D;
  private headNode: THREE.Object3D | null = null;
  private torsoNode: THREE.Object3D | null = null;
  private pelvisNode: THREE.Object3D | null = null;
  private legsNode: THREE.Object3D | null = null;

  // Limb nodes for 2-bone IK
  private upperArmL: THREE.Object3D | null = null;
  private forearmL: THREE.Object3D | null = null;
  private handL: THREE.Object3D | null = null;
  private upperArmR: THREE.Object3D | null = null;
  private forearmR: THREE.Object3D | null = null;
  private handR: THREE.Object3D | null = null;

  private thighL: THREE.Object3D | null = null;
  private shinL: THREE.Object3D | null = null;
  private bootL: THREE.Object3D | null = null;
  private puckL: THREE.Object3D | null = null;
  private thighR: THREE.Object3D | null = null;
  private shinR: THREE.Object3D | null = null;
  private bootR: THREE.Object3D | null = null;
  private puckR: THREE.Object3D | null = null;

  // Zero-GC preallocated IK output buffers per limb
  private ikOutputArmL: TwoBoneIKOutput = {
    midPoint: new THREE.Vector3(),
    upperQuat: new THREE.Quaternion(),
    lowerQuat: new THREE.Quaternion(),
    hingeAngle: 0,
  };
  private ikOutputArmR: TwoBoneIKOutput = {
    midPoint: new THREE.Vector3(),
    upperQuat: new THREE.Quaternion(),
    lowerQuat: new THREE.Quaternion(),
    hingeAngle: 0,
  };
  private ikOutputLegL: TwoBoneIKOutput = {
    midPoint: new THREE.Vector3(),
    upperQuat: new THREE.Quaternion(),
    lowerQuat: new THREE.Quaternion(),
    hingeAngle: 0,
  };
  private ikOutputLegR: TwoBoneIKOutput = {
    midPoint: new THREE.Vector3(),
    upperQuat: new THREE.Quaternion(),
    lowerQuat: new THREE.Quaternion(),
    hingeAngle: 0,
  };

  private isGLBLoaded: boolean = false;
  private isCrashing: boolean = false;
  private state: RiderKinematicState = RiderKinematicState.IDLE;

  // Kinematic parameters
  private currentTuck: number = 0.08;
  private currentHangOff: number = 0;
  private currentBrakeBrace: number = 0;
  private currentAccelHunch: number = 0;
  private _breathPhase: number = 0;
  private microShiftPhase: number = 0;
  private vibTime: number = 0;
  private prevSpeed: number = 20;
  private filteredAccel: number = 0;

  // Contact Datums in RiderRoot local coordinates:
  // RiderRoot is anchored at [0, 0.65, -0.05] relative to motorcycle chassis.
  // Handlebars at [±0.24, 0.85, 0.38] world -> [±0.24, +0.20, +0.43] local
  // Footpegs at [±0.21, 0.40, -0.12] world -> [±0.21, -0.25, -0.07] local
  private static readonly GRIP_LEFT_LOCAL = new THREE.Vector3(-0.24, 0.20, 0.43);
  private static readonly GRIP_RIGHT_LOCAL = new THREE.Vector3(0.24, 0.20, 0.43);
  private static readonly PEG_LEFT_LOCAL = new THREE.Vector3(-0.21, -0.25, -0.07);
  private static readonly PEG_RIGHT_LOCAL = new THREE.Vector3(0.21, -0.25, -0.07);

  // Segment lengths (adult racer sportbike calibration)
  private static readonly ARM_UPPER_LEN = 0.25;
  private static readonly ARM_LOWER_LEN = 0.25;
  private static readonly LEG_UPPER_LEN = 0.29;
  private static readonly LEG_LOWER_LEN = 0.27;

  constructor(
    primaryColor: number = 0xd63031,
    secondaryColor: number = 0x16171b,
    isCruiser: boolean = false
  ) {
    this.root = new THREE.Group();
    this.root.name = 'RiderControllerRoot';
    // Position at RiderRoot anchor relative to motorcycle chassis: [0, 0.65, -0.05]
    this.root.position.set(0, 0.65, -0.05);

    // Initial continuous procedural humanoid racer
    this.riderMesh = RiderMeshBuilder.buildRider(primaryColor, secondaryColor, isCruiser);
    this.root.add(this.riderMesh);
    this.bindRiderMesh(this.riderMesh);
  }

  /**
   * Binds an active rider mesh to this controller, discovering all structural and limb nodes.
   */
  public bindRiderMesh(mesh: THREE.Object3D): void {
    this.riderMesh = mesh;
    this.torsoNode = mesh.getObjectByName('rider_torso') || null;
    this.headNode = mesh.getObjectByName('rider_head') || null;
    this.pelvisNode = mesh.getObjectByName('rider_pelvis') || null;
    this.legsNode = mesh.getObjectByName('rider_legs') || null;

    // Arm nodes
    this.upperArmL = mesh.getObjectByName('arm_upper_l') || null;
    this.forearmL = mesh.getObjectByName('arm_fore_l') || null;
    this.handL = mesh.getObjectByName('hand_l') || null;
    this.upperArmR = mesh.getObjectByName('arm_upper_r') || null;
    this.forearmR = mesh.getObjectByName('arm_fore_r') || null;
    this.handR = mesh.getObjectByName('hand_r') || null;

    // Leg nodes
    this.thighL = mesh.getObjectByName('leg_thigh_l') || null;
    this.shinL = mesh.getObjectByName('leg_shin_l') || null;
    this.bootL = mesh.getObjectByName('boot_l') || null;
    this.puckL = mesh.getObjectByName('knee_slider_l') || null;
    this.thighR = mesh.getObjectByName('leg_thigh_r') || null;
    this.shinR = mesh.getObjectByName('leg_shin_r') || null;
    this.bootR = mesh.getObjectByName('boot_r') || null;
    this.puckR = mesh.getObjectByName('knee_slider_r') || null;
  }

  private async loadRiderGLB(): Promise<void> {
    try {
      const glb = await AssetLoader.getInstance().loadRiderModel();
      if (glb) {
        this.root.remove(this.riderMesh);
        this.riderMesh = this.prepareRiderGLB(glb);
        this.root.add(this.riderMesh);
        this.bindRiderMesh(this.riderMesh);
        this.isGLBLoaded = true;
      }
    } catch (_) {
      // Procedural fallback remains active
    }
  }

  /**
   * Adapts loaded GLB model into a properly centered and articulated rider mount.
   */
  public prepareRiderGLB(glb: THREE.Group): THREE.Group {
    const riderMount = new THREE.Group();
    riderMount.name = 'stylized_rider_mount';

    // Align GLB pelvis center with RiderRoot (0, 0, 0)
    // Legacy models required a downward offset (-0.98m), while modern racing_rider.glb is saddle-centered.
    if (glb.getObjectByName('rider_pelvis')) {
      glb.position.set(0, 0, 0);
    } else {
      glb.position.set(0, -0.98, 0.08);
    }

    // Group helmet / head parts under rider_head for dynamic apex tracking
    let headGroup = glb.getObjectByName('rider_head') as THREE.Group;
    if (!headGroup) {
      headGroup = new THREE.Group();
      headGroup.name = 'rider_head';
      headGroup.position.set(0, 1.45, 0.28);

      const headPartNames = new Set([
        'neck', 'helmet_shell', 'helmet_chin_guard', 'helmet_lower_rim',
        'helmet_visor', 'helmet_visor_glint', 'helmet_top_stripe',
        'helmet_vent_-1', 'helmet_vent_1', 'collar'
      ]);

      const partsToReparent: THREE.Object3D[] = [];
      glb.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (headPartNames.has(child.name)) {
            partsToReparent.push(child);
          }
        }
      });

      for (const part of partsToReparent) {
        part.position.y -= 1.45;
        part.position.z -= 0.28;
        headGroup.add(part);
      }
      glb.add(headGroup);
    }

    riderMount.add(glb);
    this.torsoNode = glb.getObjectByName('rider_torso') || glb;
    this.headNode = headGroup;

    return riderMount;
  }

  /**
   * Legacy method preserved for backwards compatibility with tests.
   */
  public buildArticulatedRider(primaryColor: number, secondaryColor: number): THREE.Group {
    return RiderMeshBuilder.buildRider(primaryColor, secondaryColor, false);
  }

  /**
   * Updates rider kinematics, state machine transitions, breathing, and analytical 2-bone IK.
   * @param dt Delta time in seconds
   * @param speed Current forward speed (m/s)
   * @param lateralLean Motorcycle lean angle in radians
   * @param isNitro True if nitro boost is firing
   * @param brake Normalised braking input [0, 1]
   */
  public update(
    dt: number,
    speed: number,
    lateralLean: number,
    isNitro: boolean,
    brake: number = 0
  ): void {
    const clampedDt = Math.min(dt, 0.1);

    // 1. FILTERED LONGITUDINAL ACCELERATION (Lambda = 10.0)
    const rawAccel = (speed - this.prevSpeed) / Math.max(clampedDt, 0.001);
    this.prevSpeed = speed;
    this.filteredAccel = MathUtils.damp(this.filteredAccel, rawAccel, 10.0, clampedDt);

    // 2. KINEMATIC STATE MACHINE EVALUATION
    if (this.isCrashing) {
      this.state = RiderKinematicState.CRASHING;
    } else if (brake > 0.05 || this.filteredAccel < -2.5) {
      this.state = RiderKinematicState.BRAKING;
    } else if (speed > 33.33 || isNitro) {
      // 33.33 m/s = 120 km/h threshold or Nitro
      this.state = RiderKinematicState.HIGH_SPEED_TUCK;
    } else if (Math.abs(lateralLean) > 0.15) {
      this.state = RiderKinematicState.CORNERING;
    } else if (speed >= 3.0 && this.filteredAccel > 0.5) {
      this.state = RiderKinematicState.ACCELERATING;
    } else if (speed >= 3.0) {
      this.state = RiderKinematicState.CRUISING;
    } else {
      this.state = RiderKinematicState.IDLE;
    }

    // 3. ORGANIC BREATHING & MICRO-DYNAMICS (0.3 Hz exact breathing cycle)
    // Angular frequency: omega = 2 * PI * 0.3 rad/s
    this._breathPhase += dt * (2 * Math.PI * 0.3);
    const isAtRest = speed < 3.0;
    const breathAtten = MathUtils.clamp(1.0 - (speed - 15) / 20, 0, 1);
    const breathY = Math.sin(this._breathPhase) * 0.008 * breathAtten;
    const breathPitch = Math.sin(this._breathPhase) * 0.012 * breathAtten;

    // Low-frequency micro-weight shift at idle (0.12 Hz)
    this.microShiftPhase += dt * (2 * Math.PI * 0.12);
    const microShiftX = isAtRest ? Math.sin(this.microShiftPhase) * 0.003 : 0;

    // 4. PROGRESSIVE AERODYNAMIC TUCK (Asymmetric Damping: Attack 8.0, Decay 5.0)
    const speedNorm = MathUtils.clamp((speed - 10) / (34 - 10), 0, 1);
    let targetTuck = 0.08 + speedNorm * 0.16;
    if (this.state === RiderKinematicState.HIGH_SPEED_TUCK) {
      targetTuck = Math.max(targetTuck, 0.36);
    }
    const lambdaTuck = targetTuck > this.currentTuck ? 8.0 : 5.0;
    this.currentTuck = MathUtils.damp(this.currentTuck, targetTuck, lambdaTuck, clampedDt);

    // 5. CORNERING HANG-OFF (Directly synchronized with chassis lean)
    this.currentHangOff = lateralLean * 0.50;

    // 6. BRAKING BRACE & ACCELERATION HUNCH (Asymmetric Damping: Attack 14.0, Decay 6.0)
    const targetBrakeBrace =
      brake > 0.05 || this.filteredAccel < -2.5
        ? Math.min(0.18, Math.max(0, -this.filteredAccel * 0.012 + brake * 0.14))
        : 0;
    const lambdaBrake = targetBrakeBrace > this.currentBrakeBrace ? 14.0 : 6.0;
    this.currentBrakeBrace = MathUtils.damp(this.currentBrakeBrace, targetBrakeBrace, lambdaBrake, clampedDt);

    const targetAccelHunch = this.filteredAccel > 1.5 ? Math.min(0.09, this.filteredAccel * 0.006) : 0;
    const lambdaHunch = targetAccelHunch > this.currentAccelHunch ? 8.0 : 6.0;
    this.currentAccelHunch = MathUtils.damp(this.currentAccelHunch, targetAccelHunch, lambdaHunch, clampedDt);

    // 7. DETERMINISTIC MULTI-OCTAVE ROAD & ENGINE VIBRATION (No white noise)
    this.vibTime += clampedDt;
    const speedNormVib = MathUtils.clamp(speed / 28.0, 0, 1.4);
    const roadVibY =
      (0.0012 * Math.sin(this.vibTime * 26.0) + 0.0006 * Math.sin(this.vibTime * 47.0)) *
      speedNormVib;
    const roadVibPitch =
      (0.0020 * Math.sin(this.vibTime * 31.0) + 0.0008 * Math.sin(this.vibTime * 59.0)) *
      speedNormVib;

    // 8. APPLY TRANSFORMS TO RIDER MESH
    if (this.state === RiderKinematicState.CRASHING) {
      // Arcade tumble flail on crash
      this.riderMesh.rotation.x += clampedDt * 7.5;
      this.riderMesh.rotation.z += clampedDt * 3.5;
      this.riderMesh.position.y += clampedDt * 3.0;
      this.riderMesh.position.z += clampedDt * 5.0;
      return;
    }

    const netPitch =
      this.currentTuck + this.currentAccelHunch - this.currentBrakeBrace + breathPitch + roadVibPitch;

    this.riderMesh.rotation.x = netPitch;
    this.riderMesh.rotation.z = -this.currentHangOff;
    this.riderMesh.position.x = -lateralLean * 0.14 + microShiftX;
    this.riderMesh.position.y =
      breathY - Math.abs(lateralLean) * 0.03 - this.currentTuck * 0.04 + roadVibY;
    // Saddle lock invariant: hip pivot stays pinned to saddle (Delta Z = 0)
    this.riderMesh.position.z = 0;

    // 9. HEAD HORIZON & APEX TRACKING
    if (this.headNode) {
      this.headNode.rotation.y = -lateralLean * 0.35;
      this.headNode.rotation.x = -netPitch * 0.4;
    }

    // 10. ANALYTICAL 2-BONE IK FOR ARMS & LEGS
    this.applyArmIK();
    this.applyLegIK(lateralLean);
  }

  /**
   * Applies closed-form analytical 2-bone IK to both arms, locking gauntlets to handlebar grips.
   */
  private applyArmIK(): void {
    if (!this.torsoNode) return;

    // Use active parent mount socket (chassis.riderRoot inside motorcycle, or this.root if unparented)
    const socket = (this.riderMesh && this.riderMesh.parent) ? this.riderMesh.parent : this.root;
    socket.updateWorldMatrix(true, true);

    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1;
      const upperArm = side === -1 ? this.upperArmL : this.upperArmR;
      const forearm = side === -1 ? this.forearmL : this.forearmR;
      const hand = side === -1 ? this.handL : this.handR;
      if (!upperArm || !forearm || !hand) continue;

      // Target grip position in local RiderRoot space: [±0.24, 0.20, 0.43]
      const gripLocal = side === -1 ? RiderController.GRIP_LEFT_LOCAL : RiderController.GRIP_RIGHT_LOCAL;

      // Transform target grip from RiderRoot space into torsoNode space
      _vWorldTemp.copy(gripLocal);
      socket.localToWorld(_vWorldTemp);
      this.torsoNode.worldToLocal(_vWorldTemp);
      const targetInTorso = _vLocalTemp.copy(_vWorldTemp);

      // Shoulder origin in torsoNode local space
      _shoulderPos.set(side * 0.19, 0.28, 0.04);

      // Elbow pole vector flaring outward and downward (zero-allocation direct arithmetic)
      _poleTemp.set(_shoulderPos.x + side * 0.35, _shoulderPos.y - 0.15, _shoulderPos.z - 0.10);

      // Solve 2-bone IK using preallocated buffer (zero GC)
      const ikOutput = side === -1 ? this.ikOutputArmL : this.ikOutputArmR;
      const ik = solve2BoneIK(
        _shoulderPos,
        targetInTorso,
        _poleTemp,
        RiderController.ARM_UPPER_LEN,
        RiderController.ARM_LOWER_LEN,
        ikOutput
      );

      // Apply orientations and positions
      upperArm.position.copy(_shoulderPos);
      upperArm.quaternion.copy(ik.upperQuat);

      forearm.position.copy(ik.midPoint);
      forearm.quaternion.copy(ik.lowerQuat);

      hand.position.copy(targetInTorso);
      hand.rotation.set(-0.35, 0, 0);
    }
  }

  /**
   * Applies closed-form analytical 2-bone IK to both legs, locking boots to footpegs.
   */
  private applyLegIK(lateralLean: number): void {
    if (!this.legsNode) return;

    // Use active parent mount socket (chassis.riderRoot inside motorcycle, or this.root if unparented)
    const socket = (this.riderMesh && this.riderMesh.parent) ? this.riderMesh.parent : this.root;
    socket.updateWorldMatrix(true, true);

    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1;
      const thigh = side === -1 ? this.thighL : this.thighR;
      const shin = side === -1 ? this.shinL : this.shinR;
      const boot = side === -1 ? this.bootL : this.bootR;
      const puck = side === -1 ? this.puckL : this.puckR;
      if (!thigh || !shin || !boot) continue;

      // Target footpeg position in local RiderRoot space: [±0.21, -0.25, -0.07]
      const pegLocal = side === -1 ? RiderController.PEG_LEFT_LOCAL : RiderController.PEG_RIGHT_LOCAL;

      // Transform target footpeg from RiderRoot space into legsNode space
      _vWorldTemp.copy(pegLocal);
      socket.localToWorld(_vWorldTemp);
      this.legsNode.worldToLocal(_vWorldTemp);
      const targetInLegs = _vLocalTemp.copy(_vWorldTemp);

      // Hip origin in legsNode local space
      _hipPos.set(side * 0.11, 0.07, 0.00);

      // Knee pole vector: forward along tank, inside knee abducts in turns
      const leanAbduction = side === -1 && lateralLean < 0 ? -lateralLean * 0.25 : side === 1 && lateralLean > 0 ? lateralLean * 0.25 : 0;
      _poleTemp.set(side * (0.18 + leanAbduction), -0.05, 0.32);

      // Solve 2-bone IK using preallocated buffer (zero GC)
      const ikOutput = side === -1 ? this.ikOutputLegL : this.ikOutputLegR;
      const ik = solve2BoneIK(
        _hipPos,
        targetInLegs,
        _poleTemp,
        RiderController.LEG_UPPER_LEN,
        RiderController.LEG_LOWER_LEN,
        ikOutput
      );

      thigh.position.copy(_hipPos);
      thigh.quaternion.copy(ik.upperQuat);

      if (puck) {
        puck.position.set(ik.midPoint.x + side * 0.05, ik.midPoint.y, ik.midPoint.z + 0.02);
      }

      shin.position.copy(ik.midPoint);
      shin.quaternion.copy(ik.lowerQuat);

      boot.position.copy(targetInLegs);
    }
  }

  /**
   * Retrieves world/chassis position of the specified hand.
   * Accepts optional preallocated target Vector3 to avoid allocations.
   */
  public getHandPosition(side: 'left' | 'right', target?: THREE.Vector3): THREE.Vector3 {
    const socket = (this.riderMesh && this.riderMesh.parent) ? this.riderMesh.parent : this.root;
    socket.updateWorldMatrix(true, true);
    const hand = side === 'left' ? this.handL : this.handR;
    const out = target || new THREE.Vector3();
    if (hand) {
      hand.updateWorldMatrix(true, false);
      hand.getWorldPosition(out);
    } else {
      const local = side === 'left' ? RiderController.GRIP_LEFT_LOCAL : RiderController.GRIP_RIGHT_LOCAL;
      socket.localToWorld(out.copy(local));
    }
    return out;
  }

  /**
   * Retrieves world/chassis position of the specified boot.
   * Accepts optional preallocated target Vector3 to avoid allocations.
   */
  public getFootPosition(side: 'left' | 'right', target?: THREE.Vector3): THREE.Vector3 {
    const socket = (this.riderMesh && this.riderMesh.parent) ? this.riderMesh.parent : this.root;
    socket.updateWorldMatrix(true, true);
    const boot = side === 'left' ? this.bootL : this.bootR;
    const out = target || new THREE.Vector3();
    if (boot) {
      boot.updateWorldMatrix(true, false);
      boot.getWorldPosition(out);
    } else {
      const local = side === 'left' ? RiderController.PEG_LEFT_LOCAL : RiderController.PEG_RIGHT_LOCAL;
      socket.localToWorld(out.copy(local));
    }
    return out;
  }

  public get currentState(): RiderKinematicState {
    return this.state;
  }

  public get tuck(): number {
    return this.currentTuck;
  }

  public get hangOff(): number {
    return this.currentHangOff;
  }

  public get brakeBrace(): number {
    return this.currentBrakeBrace;
  }

  public get accelHunch(): number {
    return this.currentAccelHunch;
  }

  public get breathPhase(): number {
    return this._breathPhase;
  }

  public setCrashing(crashing: boolean): void {
    this.isCrashing = crashing;
  }

  public reset(): void {
    this.currentTuck = 0.08;
    this.currentHangOff = 0;
    this.currentBrakeBrace = 0;
    this.currentAccelHunch = 0;
    this._breathPhase = 0;
    this.microShiftPhase = 0;
    this.vibTime = 0;
    this.prevSpeed = 20;
    this.filteredAccel = 0;
    this.isCrashing = false;
    this.state = RiderKinematicState.IDLE;
    this.riderMesh.position.set(0, 0, 0);
    this.riderMesh.rotation.set(0, 0, 0);
    if (this.headNode) {
      this.headNode.rotation.set(0, 0, 0);
    }
    this.applyArmIK();
    this.applyLegIK(0);
  }

  /**
   * Disposes all Three.js resources and clears references.
   */
  public dispose(): void {
    if (this.riderMesh) {
      RiderMeshBuilder.disposeHierarchy(this.riderMesh);
    }
    if (this.root) {
      RiderMeshBuilder.disposeHierarchy(this.root);
    }

    this.headNode = null;
    this.torsoNode = null;
    this.pelvisNode = null;
    this.legsNode = null;

    this.upperArmL = null;
    this.forearmL = null;
    this.handL = null;
    this.upperArmR = null;
    this.forearmR = null;
    this.handR = null;

    this.thighL = null;
    this.shinL = null;
    this.bootL = null;
    this.puckL = null;
    this.thighR = null;
    this.shinR = null;
    this.bootR = null;
    this.puckR = null;
  }
}

