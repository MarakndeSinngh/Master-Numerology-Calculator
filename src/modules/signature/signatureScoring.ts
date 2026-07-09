import { VisualMetrics } from './signatureImageAnalysis';

export interface ScoreBreakdown {
  score: number; // Clamped score 0 to 100
  vibeText: string; // Dynamic qualitative vibe label
  positives: { titleKey: string; descKey: string }[];
  negatives: { titleKey: string; descKey: string }[];
  remedies: string[];

  // Detailed scores (clamped 0 - 100)
  overallScore: number;
  careerGrowthScore: number;
  confidenceScore: number;
  financialStabilityScore: number;
  authorityScore: number;
  clarityScore: number;
  obstacleRiskScore: number;
  vastuAlignmentScore: number;
}

export function calculateSignatureScore(
  metrics: VisualMetrics,
  intent: string,
  driver: number,
  conductor: number
): ScoreBreakdown {
  let scoreSum = 60; // Starting baseline score
  const positives: { titleKey: string; descKey: string }[] = [];
  const negatives: { titleKey: string; descKey: string }[] = [];
  const remedies: string[] = [];

  // ==========================================
  // Apply Positive Weights (Adhering to Rule)
  // ==========================================
  
  // +10 upward baseline 5-15 degrees
  if (metrics.mainBodySlant === 'upward' && metrics.baselineAngle >= 5 && metrics.baselineAngle <= 18) {
    scoreSum += 10;
    positives.push({
      titleKey: 'signature.obs.slant.upward.title',
      descKey: 'signature.obs.slant.upward.desc'
    });
  } else if (metrics.mainBodySlant === 'straight') {
    if (metrics.hasUnderline && metrics.underlineAngle >= 4) {
      positives.push({
        titleKey: 'signature.obs.slant.neutralRising.title',
        descKey: 'signature.obs.slant.neutralRising.desc'
      });
    } else {
      positives.push({
        titleKey: 'signature.obs.slant.straight.title',
        descKey: 'signature.obs.slant.straight.desc'
      });
    }
  }

  // +8 clean underline below name
  if (metrics.hasUnderline && metrics.underlinePosition === 'belowName') {
    scoreSum += 8;
    positives.push({
      titleKey: 'signature.obs.underline.present.title',
      descKey: 'signature.obs.underline.present.desc'
    });
  }

  // +7 open upward ending
  if (!metrics.hasFinalDot) {
    scoreSum += 7;
    positives.push({
      titleKey: 'signature.obs.dot.none.title',
      descKey: 'signature.obs.dot.none.desc'
    });
  }

  // +6 moderate readability
  if (metrics.readability === 'MODERATE') {
    scoreSum += 6;
  } else if (metrics.readability === 'CLEAR') {
    scoreSum += 10; // Extra bonus for highly clear projection
    positives.push({
      titleKey: 'signature.obs.readability.clear.title',
      descKey: 'signature.obs.readability.clear.desc'
    });
  }

  // +5 balanced loop
  if (metrics.loopBalance === 'balanced') {
    scoreSum += 5;
  }

  // +5 clear first letter
  if (metrics.startingStrokeComplexity === 'clean') {
    scoreSum += 5;
    positives.push({
      titleKey: 'signature.obs.starting.clean.title',
      descKey: 'signature.obs.starting.clean.desc'
    });
  }

  // +4 smooth rightward flow (upward slant baseline)
  if (metrics.baselineAngle > 0) {
    scoreSum += 4;
  }

  // ==========================================
  // Apply Negative Weights (Adhering to Rule)
  // ==========================================

  // -12 final dot
  if (metrics.hasFinalDot) {
    scoreSum -= 12;
    negatives.push({
      titleKey: 'signature.obs.dot.present.title',
      descKey: 'signature.obs.dot.present.desc'
    });
    remedies.push('Erase the terminal full-stop dot completely from the end of your signature. Leave the end of the stroke open to allow progress.');
  }

  // -10 underline cutting through name
  if (metrics.underlinePosition === 'cutsName' || metrics.underlineCutsSignature) {
    scoreSum -= 10;
    negatives.push({
      titleKey: 'signature.obs.underline.cuts.title',
      descKey: 'signature.obs.underline.cuts.desc'
    });
    remedies.push('Redraw the underline support slightly lower so that it never cuts through any letters with descending loops (like g, j, p, q, y).');
  } else if (!metrics.hasUnderline) {
    negatives.push({
      titleKey: 'signature.obs.underline.none.title',
      descKey: 'signature.obs.underline.none.desc'
    });
    remedies.push('Draw a clean, single, unbroken horizontal line directly underneath your name to act as a supportive Astro-Vastu foundation.');
  }

  // -10 downward ending
  if (metrics.mainBodySlant === 'downward') {
    scoreSum -= 10;
    negatives.push({
      titleKey: 'signature.obs.slant.downward.title',
      descKey: 'signature.obs.slant.downward.desc'
    });
    remedies.push('Force your signature baseline to angle upward at exactly 15 degrees from left to right.');
  }

  // -8 heavy starting clutter
  if (metrics.startingStrokeComplexity === 'cluttered') {
    scoreSum -= 8;
    negatives.push({
      titleKey: 'signature.obs.starting.complex.title',
      descKey: 'signature.obs.starting.complex.desc'
    });
    remedies.push('Begin your signature with a large, clean, bold capital letter. Remove any swirling decorative loops around the initial.');
  }

  // -8 too many crossing strokes
  if (metrics.hasStartCuts) {
    scoreSum -= 8;
    if (!negatives.some(n => n.titleKey === 'signature.obs.starting.complex.title')) {
      negatives.push({
        titleKey: 'signature.obs.starting.complex.title',
        descKey: 'signature.obs.starting.complex.desc'
      });
    }
  }

  // -7 closed/boxed start
  if (metrics.startingStrokeComplexity === 'cluttered' && metrics.hasStartCuts) {
    scoreSum -= 7;
  }

  // -6 very low readability
  if (metrics.readability === 'UNCLEAR') {
    scoreSum -= 6;
    negatives.push({
      titleKey: 'signature.obs.readability.unclear.title',
      descKey: 'signature.obs.readability.unclear.desc'
    });
    remedies.push('Increase spelling clarity. Make sure your name is readable to others to improve your professional transparency and trust.');
  }

  // -5 excessive loop crossing
  if (metrics.loopBalance === 'excessive' || metrics.loopCrossed) {
    scoreSum -= 5;
    remedies.push('Simplify excessive backward loops or decorative circles wrapping around your name, as they indicate emotional defensive walls.');
  }

  // -5 very heavy pressure
  if (metrics.pressure === 'HEAVY') {
    scoreSum -= 5;
    negatives.push({
      titleKey: 'signature.obs.pressure.heavy.title',
      descKey: 'signature.obs.pressure.heavy.desc'
    });
    remedies.push('Write with normal, relaxed speed and moderate hand pressure to smooth out internal anxiety or stressful friction.');
  }

  // Clamp overall score to 0 - 100
  const overallScore = Math.max(10, Math.min(100, scoreSum));

  // ==========================================
  // Compute Dimensional Astro-Functional Scores
  // ==========================================

  // 1. Career Growth Score
  let careerGrowth = 60;
  if (metrics.mainBodySlant === 'upward') {
    careerGrowth += 25;
  } else if (metrics.mainBodySlant === 'downward') {
    careerGrowth -= 30;
  }
  if (metrics.hasUnderline && metrics.underlinePosition === 'belowName') {
    careerGrowth += 10;
  }
  if (metrics.hasFinalDot) {
    careerGrowth -= 15;
  }
  const careerGrowthScore = Math.max(15, Math.min(100, careerGrowth));

  // 2. Confidence Score
  let confidence = 60;
  if (metrics.pressure === 'HEAVY' || metrics.pressure === 'MEDIUM') {
    confidence += 15;
  } else {
    confidence -= 10; // Light pressure gets slightly lower confidence rating
  }
  if (metrics.startingStrokeComplexity === 'clean') {
    confidence += 15;
  } else {
    confidence -= 15;
  }
  if (metrics.tallLoopPresent) {
    confidence += 10;
  }
  const confidenceScore = Math.max(15, Math.min(100, confidence));

  // 3. Financial Stability Score
  let financial = 60;
  if (metrics.hasUnderline) {
    if (metrics.underlinePosition === 'belowName') {
      financial += 20;
    } else {
      financial -= 15; // Cutting siphons wealth
    }
  } else {
    financial -= 10;
  }
  if (metrics.hasFinalDot) {
    financial -= 20;
  } else {
    financial += 10;
  }
  const financialStabilityScore = Math.max(15, Math.min(100, financial));

  // 4. Authority Score
  let authority = 60;
  if (metrics.startingStrokeComplexity === 'clean') {
    authority += 20;
  } else {
    authority -= 15;
  }
  if (metrics.hasUnderline && metrics.underlinePosition === 'belowName') {
    authority += 15;
  }
  if (metrics.pressure === 'HEAVY') {
    authority += 10;
  }
  const authorityScore = Math.max(15, Math.min(100, authority));

  // 5. Clarity Score
  let clarity = 60;
  if (metrics.readability === 'CLEAR') {
    clarity += 30;
  } else if (metrics.readability === 'MODERATE') {
    clarity += 10;
  } else {
    clarity -= 25;
  }
  if (metrics.startingStrokeComplexity === 'cluttered') {
    clarity -= 15;
  }
  const clarityScore = Math.max(15, Math.min(100, clarity));

  // 6. Obstacle Risk Score
  let obstacleRisk = 15;
  if (metrics.hasFinalDot) {
    obstacleRisk += 35;
  }
  if (metrics.underlinePosition === 'cutsName' || metrics.underlineCutsSignature) {
    obstacleRisk += 30;
  }
  if (metrics.hasStartCuts) {
    obstacleRisk += 15;
  }
  if (metrics.loopCrossed) {
    obstacleRisk += 10;
  }
  const obstacleRiskScore = Math.max(5, Math.min(100, obstacleRisk));

  // 7. Vastu Alignment Score
  let vastuAlignment = 50;
  if (metrics.mainBodySlant === 'upward' && metrics.hasUnderline && metrics.underlinePosition === 'belowName') {
    vastuAlignment += 35;
  } else if (metrics.mainBodySlant === 'straight' && metrics.hasUnderline && metrics.underlinePosition === 'belowName') {
    vastuAlignment += 15;
  }
  if (metrics.hasFinalDot) {
    vastuAlignment -= 20;
  }
  if (metrics.underlineCutsSignature) {
    vastuAlignment -= 20;
  }
  const vastuAlignmentScore = Math.max(10, Math.min(100, vastuAlignment));

  // Default dynamic qualitative vibe label
  let vibeText = 'signature.report.correctionRecommended';
  if (overallScore >= 85) {
    vibeText = 'signature.report.excellent';
  } else if (overallScore >= 68) {
    vibeText = 'signature.report.good';
  } else if (overallScore >= 45) {
    vibeText = 'signature.report.mixed';
  }

  if (remedies.length === 0) {
    remedies.push('Ensure your signature is practiced on clean, unruled paper with royal blue ink 21 times daily.');
  }

  return {
    score: overallScore, // Clamped 0-100
    vibeText,
    positives,
    negatives,
    remedies,

    overallScore,
    careerGrowthScore,
    confidenceScore,
    financialStabilityScore,
    authorityScore,
    clarityScore,
    obstacleRiskScore,
    vastuAlignmentScore
  };
}
