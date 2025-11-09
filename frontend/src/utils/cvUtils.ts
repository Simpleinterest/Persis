/**
 * A 2D landmark type (all we need from MediaPipe).
 */
export interface Landmark {
  x: number;
  y: number;
  z?: number; // Optional z, we don't use it
}

/**
 * Calculates the stable 2D angle between three landmarks.
 * 
 * @param a The first point (e.g., shoulder)
 * @param b The vertex (e.g., hip)
 * @param c The third point (e.g., knee)
 * @returns The angle in degrees
 */
export function calculate_angle_2d(a: Landmark, b: Landmark, c: Landmark): number {
  // 1. Get 2D vectors
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };

  // 2. Calculate dot product and magnitudes
  const dotProduct = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

  // 3. Calculate cosine and angle
  // Add a small epsilon to avoid division by zero
  const epsilon = 1e-6;
  let cosTheta = dotProduct / (magBA * magBC + epsilon);

  // 4. Clamp value to avoid Math.acos domain errors
  if (cosTheta > 1.0) {
    cosTheta = 1.0;
  }
  if (cosTheta < -1.0) {
    cosTheta = -1.0;
  }

  // 5. Get the angle and convert to degrees
  const angle = Math.acos(cosTheta) * (180 / Math.PI);
  return angle;
}

/**
 * Calculates the angle of a line (p1-p2) relative to a perfect vertical line.
 * @param p1 The first point (e.g., shoulder)
 * @param p2 The second point (e.g., hip)
 * @returns The angle in degrees (0 = vertical, 90 = horizontal)
 */
export function calculate_vertical_angle(p1: Landmark, p2: Landmark): number {
  const p3 = { x: p2.x, y: p2.y - 1 }; // A point vertically "up" from p2
  
  // We use p2 as the vertex
  return calculate_angle_2d(p1, p2, p3);
}

