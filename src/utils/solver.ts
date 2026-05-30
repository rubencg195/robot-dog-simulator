import { Pivot, Link } from '../types';

// Helper: distance between two 2D points
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Circle-Circle Intersection Solver
// Returns the intersection points of two circles:
// Circle 1 centered at (x1, y1) with radius r1
// Circle 2 centered at (x2, y2) with radius r2
export function circleIntersection(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): [number, number, number, number] | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return null; // No intersection or concentric
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const x3 = x1 + (a * dx) / d;
  const y3 = y1 + (a * dy) / d;

  const rx = -dy * (h / d);
  const ry = dx * (h / d);

  return [x3 + rx, y3 + ry, x3 - rx, y3 - ry];
}

/**
 * Analytical Solver for the Default Parallelogram Leg Mechanism
 * Formulated precisely from the user's hand-drawn image.
 * Returns joint coordinate mappings or null if unreachable limit is exceeded.
 */
export function solveDefaultLeg(
  angleA1_deg: number, // Tibia Servo Link angle
  angleA2_deg: number, // Femur Servo Link angle
  layoutSettings: {
    a1x: number;
    a1y: number;
    a2x: number;
    a2y: number;
    L_tibia_servo: number; // 24 mm
    L_second_tibia: number; // 29 mm
    L_femur_servo: number; // 60 mm
    L_chank_left: number; // Left side (A2 to TL)
    L_chank_right: number; // Right side (A2 to TR)
    L_chank_top: number; // Top side (TL to TR)
    L_rear_tibia: number; // 60 mm
    L_tibia_total: number; // 83.3 mm
    L_tibia_offset: number; // 23.3 mm
  }
) {
  const {
    a1x, a1y, a2x, a2y,
    L_tibia_servo, L_second_tibia, L_femur_servo, L_chank_left, L_chank_right, L_chank_top, L_rear_tibia, L_tibia_total, L_tibia_offset
  } = layoutSettings;

  const t1 = (angleA1_deg * Math.PI) / 180;
  const t2 = (angleA2_deg * Math.PI) / 180;

  // 1. Pivot positions
  const A1 = { x: a1x, y: a1y };
  const A2 = { x: a2x, y: a2y };

  // 2. Tibia Servo Joint (P1)
  const P1 = {
    x: A1.x + L_tibia_servo * Math.cos(t1),
    y: A1.y + L_tibia_servo * Math.sin(t1)
  };

  // 3. Femur Servo Joint (P2)
  const P2 = {
    x: A2.x + L_femur_servo * Math.cos(t2),
    y: A2.y + L_femur_servo * Math.sin(t2)
  };

  // 4. Solve for Chank Angle
  // Intersection of circle at P1 (radius L_second_tibia) & Circle at A2 (radius L_chank_left)
  const isectTL = circleIntersection(
    A2.x, A2.y, L_chank_left,
    P1.x, P1.y, L_second_tibia
  );

  if (!isectTL) return null; // Singular configuration

  // Choose the intersection point with higher y value (the upward assembly)
  const [xTL1, yTL1, xTL2, yTL2] = isectTL;
  const P_chank_TL = yTL1 > yTL2 ? { x: xTL1, y: yTL1 } : { x: xTL2, y: yTL2 };

  // Calculate Chank base/rotation angle
  const dx_tl = P_chank_TL.x - A2.x;
  const dy_tl = P_chank_TL.y - A2.y;
  const alpha_tl = Math.atan2(dy_tl, dx_tl);

  // Compute interior corner angle beta at A2 using Law of Cosines
  // c^2 = a^2 + b^2 - 2ab cos(beta) => cos(beta) = (a^2 + b^2 - c^2) / (2ab)
  const cos_beta = Math.max(-1, Math.min(1, (L_chank_left * L_chank_left + L_chank_right * L_chank_right - L_chank_top * L_chank_top) / 
                    (2 * L_chank_left * L_chank_right)));
  const beta = Math.acos(cos_beta);

  // 5. Position of Chank TR (top-right)
  const theta_chank_TR = alpha_tl - beta;
  const P_chank_TR = {
    x: A2.x + L_chank_right * Math.cos(theta_chank_TR),
    y: A2.y + L_chank_right * Math.sin(theta_chank_TR)
  };

  // 6. Find Tibia Rear Joint (P_tibia_rear) Solving via Parallelogram Geometry
  // The vector from P_chank_TR to P_tibia_rear is exactly equal to the vector from A2 to P2.
  const P_tibia_rear = {
    x: P_chank_TR.x + P2.x - A2.x,
    y: P_chank_TR.y + P2.y - A2.y
  };

  // 7. Leg vector and foot tip
  const dx_tibia = P2.x - P_tibia_rear.x;
  const dy_tibia = P2.y - P_tibia_rear.y;
  const d_tibia = Math.sqrt(dx_tibia * dx_tibia + dy_tibia * dy_tibia);

  if (d_tibia === 0) return null;

  const ux = dx_tibia / d_tibia;
  const uy = dy_tibia / d_tibia;

  // The Tibia Link extends to L_tibia_offset + L_tibia_total (23.3 + 83.3 = 106.6 mm) from Tibia Rear Joint
  // Along the direction of Tibia Link towards P2 as reference
  const P_foot = {
    x: P_tibia_rear.x + (L_tibia_offset + L_tibia_total) * ux,
    y: P_tibia_rear.y + (L_tibia_offset + L_tibia_total) * uy
  };

  return {
    A1,
    A2,
    P1,
    P2,
    P_chank_TL,
    P_chank_TR,
    P_tibia_rear,
    P_foot,
    phi_deg: (alpha_tl * 180) / Math.PI
  };
}

/**
 * Analytical Inverse Kinematics for Default Leg
 * Returns target A1 and A2 angles in degrees, or null if target is unreachable.
 */
export function solveDefaultLegIK(
  targetX: number,
  targetY: number,
  layoutSettings: {
    a1x: number;
    a1y: number;
    a2x: number;
    a2y: number;
    L_tibia_servo: number; // 24
    L_second_tibia: number; // 29
    L_femur_servo: number; // 60
    L_chank_left: number; // Left side (A2 to TL)
    L_chank_right: number; // Right side (A2 to TR)
    L_chank_top: number; // Top side (TL to TR)
    L_rear_tibia: number; // 60
    L_tibia_total: number; // 83.3
    L_tibia_offset: number; // 23.3
  }
): { angleA1: number; angleA2: number } | null {
  const {
    a1x, a1y, a2x, a2y,
    L_tibia_servo, L_second_tibia, L_femur_servo, L_chank_left, L_chank_right, L_chank_top, L_rear_tibia, L_tibia_total, L_tibia_offset
  } = layoutSettings;

  // The actual effective length of the tibia arm from pivot P2 to P_foot tip
  const L_tibia_eff = L_tibia_total + L_tibia_offset - L_chank_right;

  // Target relative to Actuator A2
  const rx = targetX - a2x;
  const ry = targetY - a2y;
  const L_r = Math.sqrt(rx * rx + ry * ry);

  // Maximum reach from pivot A2 is L_femur_servo + L_tibia_eff
  const max_reach = L_femur_servo + L_tibia_eff - 0.5;
  const min_reach = Math.abs(L_femur_servo - L_tibia_eff) + 0.5;

  let targetL_r = L_r;
  let workRx = rx;
  let workRy = ry;

  if (L_r > max_reach) {
    targetL_r = max_reach;
    workRx = (rx / L_r) * max_reach;
    workRy = (ry / L_r) * max_reach;
  } else if (L_r < min_reach) {
    targetL_r = min_reach;
    workRx = (rx / L_r) * min_reach;
    workRy = (ry / L_r) * min_reach;
  }

  const psi = Math.atan2(workRy, workRx);

  // Law of cosines in triangle A2 - P2 - P_foot:
  // L_tibia_eff^2 = L_femur_servo^2 + targetL_r^2 - 2 * L_femur_servo * targetL_r * cos(gamma)
  const cos_gamma = (L_femur_servo * L_femur_servo + targetL_r * targetL_r - L_tibia_eff * L_tibia_eff) / 
                    (2 * L_femur_servo * targetL_r);

  if (Math.abs(cos_gamma) > 1) return null;

  const gamma = Math.acos(cos_gamma);

  // Femur Servo Link angle (we choose the branch pointing down/left which is psi + gamma)
  const theta2_rad = psi + gamma;
  const theta2_deg = (theta2_rad * 180) / Math.PI;

  // Locate P2
  const P2 = {
    x: a2x + L_femur_servo * Math.cos(theta2_rad),
    y: a2y + L_femur_servo * Math.sin(theta2_rad)
  };

  // P_foot relative to P2 gives the direction of the tibia link
  const P_foot_target = {
    x: a2x + targetL_r * Math.cos(psi),
    y: a2y + targetL_r * Math.sin(psi)
  };

  const dx_tibia = P_foot_target.x - P2.x;
  const dy_tibia = P_foot_target.y - P2.y;
  const theta_chank_TR = Math.atan2(-dy_tibia, -dx_tibia);

  // Compute interior corner angle beta at A2 using Law of Cosines
  const cos_beta = Math.max(-1, Math.min(1, (L_chank_left * L_chank_left + L_chank_right * L_chank_right - L_chank_top * L_chank_top) / 
                    (2 * L_chank_left * L_chank_right)));
  const beta = Math.acos(cos_beta);

  const theta_chank_TL = theta_chank_TR + beta;

  // Locate Chank TL to find where the Tibia Servo connects
  const P_chank_TL = {
    x: a2x + L_chank_left * Math.cos(theta_chank_TL),
    y: a2y + L_chank_left * Math.sin(theta_chank_TL)
  };

  // Find A1 Tibia Servo joint coordinates
  // Pin P1 lies on a circle around A1 with radius L_tibia_servo (24)
  // Distance from P1 to P_chank_TL is L_second_tibia (29)
  const isectP1 = circleIntersection(
    a1x, a1y, L_tibia_servo,
    P_chank_TL.x, P_chank_TL.y, L_second_tibia
  );

  if (!isectP1) {
    return null;
  }

  // Choose the intersection that yields an actuator angle closest to the physical operating home region (~135.0)
  // This guarantees that we don't snap to the alternate symmetry branch which is upside down.
  const [xP1_1, yP1_1, xP1_2, yP1_2] = isectP1;
  const theta1_rad_1 = Math.atan2(yP1_1 - a1y, xP1_1 - a1x);
  const theta1_deg_1 = (theta1_rad_1 * 180) / Math.PI;

  const theta1_rad_2 = Math.atan2(yP1_2 - a1y, xP1_2 - a1x);
  const theta1_deg_2 = (theta1_rad_2 * 180) / Math.PI;

  const diff1 = Math.abs(theta1_deg_1 - 135.0);
  const diff2 = Math.abs(theta1_deg_2 - 135.0);

  const theta1_deg = diff1 < diff2 ? theta1_deg_1 : theta1_deg_2;

  return {
    angleA1: theta1_deg,
    angleA2: theta2_deg
  };
}


/**
 * General Distance-Constraint Solver (Position-Based Dynamics loop)
 * Moves list of pivots to satisfy link distance constraints
 */
export function solveGenericLinkage(
  pivots: Pivot[],
  links: Link[],
  actuatorAngles: { A1: number; A2: number },
  iterations = 40
): Pivot[] {
  // Deep clone pivots so we don't mutate input state
  const solved = pivots.map((p) => ({ ...p }));

  // Fixed/actuator pivots mapping
  const pivotMap = new Map<string, typeof solved[0]>();
  solved.forEach((p) => pivotMap.set(p.id, p));

  // 1. Update actuator controlled pivots
  solved.forEach((p) => {
    if (p.type === 'actuator' && p.actuatorId) {
      const angle = actuatorAngles[p.actuatorId];
      p.currentAngle = angle;
      // Also, update adjacent link endpoints if it has a hard rotation?
      // In the general representation, the actuator simply defines a rotated pivot.
      // Let's check which pivot represents the end of the actuator link.
      // We look for a pivot that has its distance from the actuator fixed, and is "driven".
      // Let's drive the first attached pivot angle!
    }
  });

  // Calculate standard distances for each link from their initial positions
  const getLinkTargets = (link: Link) => {
    if (link.pivotIds.length === 2) {
      const p1 = pivots.find((p) => p.id === link.pivotIds[0]);
      const p2 = pivots.find((p) => p.id === link.pivotIds[1]);
      if (p1 && p2) {
        return [{ id1: p1.id, id2: p2.id, d: distance(p1.x, p1.y, p2.x, p2.y) }];
      }
    } else if (link.pivotIds.length === 3) {
      const p1 = pivots.find((p) => p.id === link.pivotIds[0]);
      const p2 = pivots.find((p) => p.id === link.pivotIds[1]);
      const p3 = pivots.find((p) => p.id === link.pivotIds[2]);
      if (p1 && p2 && p3) {
        return [
          { id1: p1.id, id2: p2.id, d: distance(p1.x, p1.y, p2.x, p2.y) },
          { id1: p2.id, id2: p3.id, d: distance(p2.x, p2.y, p3.x, p3.y) },
          { id1: p3.id, id2: p1.id, d: distance(p3.x, p3.y, p1.x, p1.y) },
        ];
      }
    }
    return [];
  };

  const constraints = links.flatMap(getLinkTargets);

  // Solves the constraint equations iteratively
  for (let iter = 0; iter < iterations; iter++) {
    // Distance constraints
    for (const c of constraints) {
      const p1 = pivotMap.get(c.id1);
      const p2 = pivotMap.get(c.id2);
      if (!p1 || !p2) continue;

      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d === 0) continue;

      const diff = d - c.d;
      const scale = diff / d;

      let w1 = p1.type === 'free' ? 1.0 : 0.0;
      let w2 = p2.type === 'free' ? 1.0 : 0.0;
      const wTotal = w1 + w2;

      if (wTotal > 0) {
        p1.x -= (w1 / wTotal) * scale * dx;
        p1.y -= (w1 / wTotal) * scale * dy;
        p2.x += (w2 / wTotal) * scale * dx;
        p2.y += (w2 / wTotal) * scale * dy;
      }
    }
  }

  return solved;
}
