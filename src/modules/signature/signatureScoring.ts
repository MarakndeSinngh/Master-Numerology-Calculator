import { VisualMetrics } from './signatureImageAnalysis';

export interface ScoreBreakdown {
  score: number; // Compatibility out of 10
  vibeText: string; // Dynamic qualitative vibe label
  positives: { titleKey: string; descKey: string }[];
  negatives: { titleKey: string; descKey: string }[];
  remedies: string[];
}

export function calculateSignatureScore(
  metrics: VisualMetrics,
  intent: string,
  driver: number,
  conductor: number
): ScoreBreakdown {
  let baseScore = 50;
  const positives: { titleKey: string; descKey: string }[] = [];
  const negatives: { titleKey: string; descKey: string }[] = [];
  const remedies: string[] = [];

  // 1. Baseline Slant
  if (metrics.slant === 'UPWARD') {
    baseScore += 10;
    positives.push({
      titleKey: 'signature.obs.slant.upward.title',
      descKey: 'signature.obs.slant.upward.desc'
    });
  } else if (metrics.slant === 'DOWNWARD') {
    baseScore -= 15;
    negatives.push({
      titleKey: 'signature.obs.slant.downward.title',
      descKey: 'signature.obs.slant.downward.desc'
    });
    remedies.push('Force your signature baseline to angle upward at exactly 15 degrees from left to right.');
  } else {
    baseScore += 5;
    positives.push({
      titleKey: 'signature.obs.slant.straight.title',
      descKey: 'signature.obs.slant.straight.desc'
    });
  }

  // 2. Underline
  if (metrics.underline === 'PRESENT') {
    baseScore += 10;
    positives.push({
      titleKey: 'signature.obs.underline.present.title',
      descKey: 'signature.obs.underline.present.desc'
    });
  } else if (metrics.underline === 'CUTTING') {
    baseScore -= 12;
    negatives.push({
      titleKey: 'signature.obs.underline.cuts.title',
      descKey: 'signature.obs.underline.cuts.desc'
    });
    remedies.push('Redraw the underline support slightly lower so that it never cuts through any letters with descending loops (like g, j, p, q, y).');
  } else {
    baseScore -= 2;
    negatives.push({
      titleKey: 'signature.obs.underline.none.title',
      descKey: 'signature.obs.underline.none.desc'
    });
    remedies.push('Draw a clean, single, unbroken horizontal line directly underneath your name to act as a supportive Astro-Vastu foundation.');
  }

  // 3. Final Dot
  if (metrics.finalDot === 'PRESENT') {
    baseScore -= 12;
    negatives.push({
      titleKey: 'signature.obs.dot.present.title',
      descKey: 'signature.obs.dot.present.desc'
    });
    remedies.push('Erase the terminal full-stop dot completely from the end of your signature. Leave the end of the stroke open to allow progress.');
  } else {
    baseScore += 8;
    positives.push({
      titleKey: 'signature.obs.dot.none.title',
      descKey: 'signature.obs.dot.none.desc'
    });
  }

  // 4. Starting Stroke
  if (metrics.starting === 'CLEAN') {
    baseScore += 8;
    positives.push({
      titleKey: 'signature.obs.starting.clean.title',
      descKey: 'signature.obs.starting.clean.desc'
    });
  } else {
    baseScore -= 6;
    negatives.push({
      titleKey: 'signature.obs.starting.complex.title',
      descKey: 'signature.obs.starting.complex.desc'
    });
    remedies.push('Begin your signature with a large, clean, bold capital letter. Remove any swirling decorative loops around the initial.');
  }

  // 5. Loops and flourishes
  if (metrics.loops === 'BALANCED' || metrics.loops === 'TALL') {
    baseScore += 6;
  } else if (metrics.loops === 'EXCESSIVE') {
    baseScore -= 8;
    remedies.push('Simplify excessive backward loops or decorative circles wrapping around your name, as they indicate emotional defensive walls.');
  }

  // 6. Readability
  if (metrics.readability === 'CLEAR') {
    baseScore += 10;
    positives.push({
      titleKey: 'signature.obs.readability.clear.title',
      descKey: 'signature.obs.readability.clear.desc'
    });
  } else if (metrics.readability === 'MODERATE') {
    baseScore += 5;
  } else {
    baseScore -= 8;
    negatives.push({
      titleKey: 'signature.obs.readability.unclear.title',
      descKey: 'signature.obs.readability.unclear.desc'
    });
    remedies.push('Increase spelling clarity. Make sure your name is readable to others to improve your professional transparency and trust.');
  }

  // 7. Pen Pressure
  if (metrics.pressure === 'MEDIUM') {
    baseScore += 8;
  } else if (metrics.pressure === 'LIGHT') {
    baseScore += 4;
    positives.push({
      titleKey: 'signature.obs.pressure.light.title',
      descKey: 'signature.obs.pressure.light.desc'
    });
  } else {
    baseScore -= 5;
    negatives.push({
      titleKey: 'signature.obs.pressure.heavy.title',
      descKey: 'signature.obs.pressure.heavy.desc'
    });
    remedies.push('Write with normal, relaxed speed and moderate hand pressure to smooth out internal anxiety or stressful friction.');
  }

  // Calculate scaled score (1 to 10 range)
  let finalScoreVal = Math.round(baseScore / 10);
  finalScoreVal = Math.max(1, Math.min(10, finalScoreVal));

  // Determine dynamic qualitative label
  let vibeText = 'signature.report.correctionRecommended';
  if (finalScoreVal >= 9) {
    vibeText = 'signature.report.excellent';
  } else if (finalScoreVal >= 7) {
    vibeText = 'signature.report.good';
  } else if (finalScoreVal >= 5) {
    vibeText = 'signature.report.mixed';
  }

  // Ensure there is at least one fallback remedy if score is perfect
  if (remedies.length === 0) {
    remedies.push('Ensure your signature is practiced on clean, unruled paper with royal blue ink 21 times daily.');
  }

  return {
    score: finalScoreVal,
    vibeText,
    positives,
    negatives,
    remedies
  };
}
