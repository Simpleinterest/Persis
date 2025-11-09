/**
 * Sport-specific metric definitions
 */

export interface SportMetric {
  name: string;
  value: number;
  unit?: string;
  target?: number;
  min?: number;
  max?: number;
}

export interface SportMetrics {
  [sport: string]: {
    metrics: SportMetric[];
    feedback: TimestampedFeedback[];
    commonMistakes?: string[];
  };
}

export interface TimestampedFeedback {
  timestamp: Date;
  feedback: string;
  category: 'form' | 'safety' | 'technique' | 'encouragement';
  severity: 'low' | 'medium' | 'high';
}

/**
 * Sport-specific metric templates
 */
export const SPORT_METRICS: { [sport: string]: string[] } = {
  squats: ['knee_angle', 'hip_depth', 'back_posture', 'knee_alignment', 'core_engagement'],
  pushups: ['shoulder_alignment', 'elbow_angle', 'body_alignment', 'core_stability', 'range_of_motion'],
  planks: ['spine_alignment', 'hip_position', 'shoulder_position', 'core_engagement', 'duration'],
  lunges: ['knee_alignment', 'hip_depth', 'torso_angle', 'front_knee_position', 'balance'],
  deadlifts: ['back_posture', 'hip_hinge', 'bar_path', 'knee_position', 'core_engagement'],
  overhead_press: ['shoulder_alignment', 'elbow_position', 'core_stability', 'bar_path', 'wrist_position'],
  bench_press: ['shoulder_position', 'elbow_angle', 'bar_path', 'arch', 'feet_position'],
  pullups: ['grip_width', 'shoulder_position', 'range_of_motion', 'body_swing', 'core_engagement'],
  running: ['cadence', 'stride_length', 'posture', 'foot_strike', 'arm_swing'],
  yoga: ['alignment', 'breathing', 'flexibility', 'balance', 'focus'],
  stretching: ['range_of_motion', 'posture', 'breathing', 'duration', 'tension'],
  cardio: ['intensity', 'duration', 'posture', 'breathing', 'recovery'],
  strength: ['form_score', 'range_of_motion', 'tempo', 'rest_period', 'volume'],
  golf: ['swing_speed', 'club_path', 'hip_rotation', 'shoulder_turn', 'balance', 'posture'],
  general: ['form_score', 'posture', 'alignment', 'technique', 'safety'],
};

/**
 * Get metrics for a specific sport
 */
export function getSportMetrics(sport: string): string[] {
  return SPORT_METRICS[sport.toLowerCase()] || SPORT_METRICS.general;
}

/**
 * Parse structured metrics from AI response
 */
export function parseSportMetrics(sport: string, aiResponse: string, landmarks: any[]): { metrics: SportMetric[]; feedback: string } {
  const sportMetricNames = getSportMetrics(sport);
  const metrics: SportMetric[] = [];
  
  // Try to extract structured data from AI response
  try {
    // Look for JSON in the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.metrics && Array.isArray(parsed.metrics)) {
        parsed.metrics.forEach((m: any) => {
          metrics.push({
            name: m.name || m.metric,
            value: m.value || 0,
            unit: m.unit,
            target: m.target,
            min: m.min,
            max: m.max,
          });
        });
      }
    }
  } catch (e) {
    // If JSON parsing fails, extract metrics from text
    sportMetricNames.forEach(metricName => {
      const regex = new RegExp(`${metricName}[:\\s]+([\\d.]+)`, 'i');
      const match = aiResponse.match(regex);
      if (match) {
        metrics.push({
          name: metricName,
          value: parseFloat(match[1]),
        });
      }
    });
  }
  
  // Calculate metrics from landmarks if available
  if (landmarks && landmarks.length > 0 && metrics.length === 0) {
    metrics.push(...calculateMetricsFromLandmarks(sport, landmarks));
  }
  
  return {
    metrics,
    feedback: aiResponse,
  };
}

/**
 * Calculate metrics from pose landmarks
 */
function calculateMetricsFromLandmarks(sport: string, landmarks: any[]): SportMetric[] {
  const metrics: SportMetric[] = [];
  const landmarkMap: { [key: number]: { x: number; y: number; z?: number } } = {};
  
  landmarks.forEach((lm: any, index: number) => {
    if (typeof lm === 'object' && lm.x !== undefined && lm.y !== undefined) {
      landmarkMap[index] = {
        x: lm.x,
        y: lm.y,
        z: lm.z,
      };
    }
  });
  
  const sportLower = sport.toLowerCase();
  
  if (sportLower === 'squats' || sportLower === 'lunges') {
    // Calculate knee angle
    if (landmarkMap[23] && landmarkMap[25] && landmarkMap[27]) {
      const hip = landmarkMap[23];
      const knee = landmarkMap[25];
      const ankle = landmarkMap[27];
      const angle = calculateAngle(hip, knee, ankle);
      metrics.push({ name: 'knee_angle', value: angle, unit: 'degrees', target: 90 });
    }
    
    // Calculate hip depth
    if (landmarkMap[23] && landmarkMap[25]) {
      const depth = Math.abs(landmarkMap[23].y - landmarkMap[25].y);
      metrics.push({ name: 'hip_depth', value: depth, unit: 'normalized', target: 0.2 });
    }
    
    // Calculate back posture
    if (landmarkMap[11] && landmarkMap[23]) {
      const alignment = Math.abs(landmarkMap[11].x - landmarkMap[23].x);
      metrics.push({ name: 'back_posture', value: 1 - alignment, unit: 'score', target: 0.95 });
    }
  } else if (sportLower === 'pushups' || sportLower === 'planks') {
    // Calculate shoulder alignment
    if (landmarkMap[11] && landmarkMap[12]) {
      const alignment = Math.abs(landmarkMap[11].y - landmarkMap[12].y);
      metrics.push({ name: 'shoulder_alignment', value: 1 - alignment, unit: 'score', target: 0.95 });
    }
    
    // Calculate core engagement
    if (landmarkMap[11] && landmarkMap[23] && landmarkMap[24]) {
      const coreAlignment = calculateCoreAlignment(landmarkMap[11], landmarkMap[23], landmarkMap[24]);
      metrics.push({ name: 'core_engagement', value: coreAlignment, unit: 'score', target: 0.9 });
    }
  } else if (sportLower === 'golf') {
    // Calculate hip rotation
    if (landmarkMap[23] && landmarkMap[24]) {
      const rotation = Math.abs(landmarkMap[23].x - landmarkMap[24].x);
      metrics.push({ name: 'hip_rotation', value: rotation, unit: 'normalized', target: 0.3 });
    }
    
    // Calculate shoulder turn
    if (landmarkMap[11] && landmarkMap[12]) {
      const turn = Math.abs(landmarkMap[11].x - landmarkMap[12].x);
      metrics.push({ name: 'shoulder_turn', value: turn, unit: 'normalized', target: 0.4 });
    }
  }
  
  // Add general form score
  if (metrics.length > 0) {
    const avgScore = metrics.reduce((sum, m) => sum + (m.value || 0), 0) / metrics.length;
    metrics.push({ name: 'form_score', value: avgScore, unit: 'score', target: 0.8 });
  }
  
  return metrics;
}

/**
 * Calculate angle between three points
 */
function calculateAngle(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  const angle = Math.acos(dot / (mag1 * mag2));
  return (angle * 180) / Math.PI;
}

/**
 * Calculate core alignment score
 */
function calculateCoreAlignment(shoulder: { x: number; y: number }, hip1: { x: number; y: number }, hip2: { x: number; y: number }): number {
  const shoulderMidX = shoulder.x;
  const hipMidX = (hip1.x + hip2.x) / 2;
  const alignment = 1 - Math.abs(shoulderMidX - hipMidX);
  return Math.max(0, Math.min(1, alignment));
}

