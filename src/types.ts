export interface Pivot {
  id: string;
  name: string;
  type: 'fixed' | 'free' | 'actuator';
  x: number;
  y: number;
  z: number; // For overlapping layers in 3D
  actuatorId?: 'A1' | 'A2';
  currentAngle?: number; // In degrees
  homeAngle?: number; // In degrees
  minAngle?: number; // In degrees
  maxAngle?: number; // In degrees
  color?: string;
}

export interface Link {
  id: string;
  name: string;
  pivotIds: string[]; // 2 for straight, 3 for triangle link
  color?: string;
  thickness?: number; // in mm
  isTriangle?: boolean;
  triangleSides?: [number, number, number]; // length of sides if triangle: [side1, side2, side3]
  triangleAngles?: [number, number, number]; // angles in degrees if triangle: [angle1, angle2, angle3]
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  angleA1?: number;
  angleA2?: number;
}

export type MechanismPresetType = 'parallelogram_leg' | 'five_bar' | 'four_bar_crank' | 'simple_r_theta';

export interface CustomDimension {
  id: string;
  p1: string;
  p2: string;
  dx: number;
  dy: number;
  name?: string;
}

export interface ConstructionLine {
  id: string;
  p1: string;
  p2: string;
  constraint?: 'horizontal' | 'vertical';
}

export interface AngleDimension {
  id: string;
  seg1: [string, string]; // e.g., ['A1', 'P1']
  seg2: [string, string]; // e.g., ['A1', 'A2']
  vertexId: string;       // e.g., 'A1'
  radius: number;         // distance from the vertex for the dimension arc
  sectorRays?: [string, string]; // e.g., ['A', 'OB']
}

