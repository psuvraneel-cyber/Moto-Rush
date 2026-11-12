/**
 * Centralized Physics Configuration for MOTO RUSH 3D
 * Milestone 2: Motorcycle Handling & Input Physics
 */

export interface PhysicsConfigType {
  // Input & Dead Zone
  STEER_DEAD_ZONE: number;
  MOUSE_DRAG_MAX_PIXELS: number;
  MOUSE_RETURN_SPRING_STIFFNESS: number;

  // Lateral Velocity & Acceleration
  LATERAL_ACCELERATION: number;
  LATERAL_DAMPING: number;
  MAX_STEADY_LATERAL_SPEED: number;

  // Speed-Dependent Steering Scale S(v)
  STEER_SPEED_MIN: number;
  STEER_SPEED_MAX: number;
  STEER_SPEED_SCALE_MIN: number;
  STEER_SPEED_SCALE_MAX: number;

  // Track Boundaries
  ROAD_BOUNDARY_SOFT: number;
  ROAD_BOUNDARY_HARD: number;
  BOUNDARY_SPRING_K: number;
  BOUNDARY_SPRING_DAMPING: number;

  // Speed Model Boundaries (m/s)
  MIN_SPEED: number;
  CRUISING_SPEED: number;
  MAX_SPEED: number;
  NITRO_SPEED: number;
  ACCELERATION_RATE: number;
  BRAKING_RATE: number;
  AERODYNAMIC_DRAG_CD: number;

  // Chassis Roll & Pitch
  ROLL_ACCEL_FACTOR: number;
  MAX_ROLL_ANGLE: number;
  ROLL_SPRING_OMEGA: number;
  PITCH_DIVE_MAX: number;
  PITCH_SQUAT_MAX: number;

  // Third-Person Camera Follow
  CAMERA_FOLLOW_LAG_X: number;
  CAMERA_FOLLOW_LAG_Y: number;
  CAMERA_YAW_CLAMP: number;
  CAMERA_LATERAL_CLAMP: number;
}

export const PHYSICS_CONFIG: PhysicsConfigType & {
  speed: {
    minSpeed: number;
    cruisingSpeed: number;
    maxSpeed: number;
    nitroSpeed: number;
    accelerationRate: number;
    brakingRate: number;
    dragCoefficient: number;
    rollingResistance: number;
    idleRecoveryRate: number;
  };
  chassis: {
    maxRollAngle: number;
    rollNaturalFreq: number;
    lateralAccelRollWeight: number;
    steerInputRollWeight: number;
    chassisYawFactor: number;
    steeringForkFactor: number;
    maxDivePitch: number;
    maxSquatPitch: number;
    pitchDamping: number;
    suspensionBobAmp: number;
  };
  camera: {
    defaultOffset: { x: number; y: number; z: number };
    lateralDamping: number;
    verticalDamping: number;
    maxLateralOffset: number;
    lookAheadDistance: number;
    lookAheadHeight: number;
    lookAheadDamping: number;
    leanAnticipationFactor: number;
    maxYawAngle: number;
    baseFov: number;
    nitroFov: number;
    fovDamping: number;
    shakeDecay: number;
  };
  lateral: {
    lateralAcceleration: number;
    lateralDamping: number;
    maxLateralVelocity: number;
    steerDeadZone: number;
  };
} = {
  // Input & Dead Zone
  STEER_DEAD_ZONE: 0.04,
  MOUSE_DRAG_MAX_PIXELS: 180,
  MOUSE_RETURN_SPRING_STIFFNESS: 14.0, // s^-1 exponential return

  // Lateral Velocity & Acceleration
  LATERAL_ACCELERATION: 96.0,  // m/s^2 peak lateral acceleration
  LATERAL_DAMPING: 6.0,        // s^-1 exponential velocity damping
  MAX_STEADY_LATERAL_SPEED: 16.0, // m/s (96 / 6)

  // Speed-Dependent Steering Scale S(v)
  STEER_SPEED_MIN: 13.89, // m/s (50 km/h) -> S(v) = 1.0 (100%)
  STEER_SPEED_MAX: 44.44, // m/s (160 km/h) -> S(v) = 0.72 (72%)
  STEER_SPEED_SCALE_MIN: 1.00,
  STEER_SPEED_SCALE_MAX: 0.72,

  // Track Boundaries
  ROAD_BOUNDARY_SOFT: 4.6,     // m (soft spring boundary starts)
  ROAD_BOUNDARY_HARD: 5.2,     // m (hard limit)
  BOUNDARY_SPRING_K: 180.0,    // s^-2 soft restoring spring
  BOUNDARY_SPRING_DAMPING: 14.0, // s^-1

  // Speed Model Boundaries (m/s)
  MIN_SPEED: 13.89,        // 50.0 km/h
  CRUISING_SPEED: 15.00,   // 54.0 km/h
  MAX_SPEED: 44.44,        // 160.0 km/h
  NITRO_SPEED: 51.39,      // 185.0 km/h
  ACCELERATION_RATE: 16.0, // m/s^2 base
  BRAKING_RATE: 28.0,      // m/s^2 base
  AERODYNAMIC_DRAG_CD: 0.0020, // a_drag = -Cd * v^2

  // Chassis Roll & Pitch
  ROLL_ACCEL_FACTOR: 1.0,
  MAX_ROLL_ANGLE: 0.55,    // ~31.5 deg
  ROLL_SPRING_OMEGA: 14.0, // rad/s critically damped
  PITCH_DIVE_MAX: 0.08,    // rad
  PITCH_SQUAT_MAX: 0.06,   // rad

  // Third-Person Camera Follow
  CAMERA_FOLLOW_LAG_X: 8.5,
  CAMERA_FOLLOW_LAG_Y: 12.0,
  CAMERA_YAW_CLAMP: 0.12,  // rad (guarantees ScreenRight_x <= -0.99, no steering inversion)
  CAMERA_LATERAL_CLAMP: 4.8, // m

  // Subsystem convenience configurations
  speed: {
    minSpeed: 13.89,
    cruisingSpeed: 15.00,
    maxSpeed: 44.44,
    nitroSpeed: 51.39,
    accelerationRate: 16.0,
    brakingRate: 28.0,
    dragCoefficient: 0.0020,
    rollingResistance: 1.2,
    idleRecoveryRate: 2.5,
  },

  chassis: {
    maxRollAngle: 0.55,
    rollNaturalFreq: 14.0,
    lateralAccelRollWeight: 0.65,
    steerInputRollWeight: 0.35,
    chassisYawFactor: 0.25,
    steeringForkFactor: 0.35,
    maxDivePitch: 0.08,
    maxSquatPitch: 0.06,
    pitchDamping: 10.0,
    suspensionBobAmp: 0.015,
  },

  camera: {
    defaultOffset: { x: 0, y: 4.8, z: 9.5 },
    lateralDamping: 8.5,
    verticalDamping: 12.0,
    maxLateralOffset: 4.8,
    lookAheadDistance: 16.0,
    lookAheadHeight: 1.2,
    lookAheadDamping: 7.0,
    leanAnticipationFactor: 4.5,
    maxYawAngle: 0.12,
    baseFov: 60.0,
    nitroFov: 70.0,
    fovDamping: 6.0,
    shakeDecay: 5.0,
  },

  lateral: {
    lateralAcceleration: 96.0,
    lateralDamping: 6.0,
    maxLateralVelocity: 16.0,
    steerDeadZone: 0.04,
  },
};
