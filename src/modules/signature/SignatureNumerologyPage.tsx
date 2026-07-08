import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { SignatureUploadForm } from './SignatureUploadForm';
import { SignatureImagePreview } from './SignatureImagePreview';
import { SignatureResultDashboard } from './SignatureResultDashboard';
import { analyzeSignatureImage, VisualMetrics } from './signatureImageAnalysis';
import { calculateSignatureScore } from './signatureScoring';
import { generateLocalSignatureReport, SignatureDossier } from './signatureReportGenerator';
import { getTranslatedKey } from './signatureInterpretationKeys';

interface SignatureNumerologyPageProps {
  language: string;
}

// Chaldean Acoustic Map
const CH_MAP: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8
};

// Chaldean Name Number calculator
function getChaldeanNameNumber(name: string): number {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  let sum = 0;
  for (const char of clean) {
    sum += CH_MAP[char] || 0;
  }
  return sum || 1;
}

// Reduce numbers to single cosmic digit 1-9
function reduceToSingleDigit(num: number): number {
  let sum = num;
  while (sum > 9) {
    sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return sum || 1;
}

// Get Driver/Mulank (Day of birth)
function getDriverNumber(dob: string): number {
  if (!dob) return 1;
  const parts = dob.split('-');
  const day = parseInt(parts[2], 10);
  if (isNaN(day)) return 1;
  return reduceToSingleDigit(day);
}

// Get Conductor/Bhagyank (Sum of all birth digits)
function getConductorNumber(dob: string): number {
  if (!dob) return 1;
  const clean = dob.replace(/[^0-9]/g, '');
  const sum = clean.split('').reduce((acc, char) => acc + parseInt(char, 10), 0);
  return reduceToSingleDigit(sum);
}

export const SignatureNumerologyPage: React.FC<SignatureNumerologyPageProps> = ({
  language
}) => {
  const isHi = language === 'hi';
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [dossier, setDossier] = useState<SignatureDossier | null>(null);

  const handleAuditStart = async (data: {
    name: string;
    dob: string;
    gender: string;
    mobile: string;
    intent: string;
    hand: string;
    image: string;
  }) => {
    setIsScanning(true);
    setUploadedImage(data.image);
    setDossier(null);

    // Astro Coordinates
    const driver = getDriverNumber(data.dob);
    const conductor = getConductorNumber(data.dob);
    const chaldeanValue = getChaldeanNameNumber(data.name);

    try {
      // Step 1: Run local heuristic canvas scanning to parse visual attributes
      const localMetrics = await analyzeSignatureImage(data.image);

      // Step 2: Try calling the backend endpoint for Gemini-powered structural analysis
      let apiResult: any = null;
      try {
        const response = await fetch('/api/signature-audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: data.image,
            personalDetails: { name: data.name, dob: data.dob, profession: data.intent },
            manualSelection: { styleId: 'RISING_UNDERLINE' },
            driver,
            conductor,
            nameNumber: chaldeanValue,
            description: {
              nameSigned: data.name,
              size: localMetrics.pressure === 'HEAVY' ? 'Large' : 'Medium',
              slant: localMetrics.slant === 'UPWARD' ? 'Forward' : (localMetrics.slant === 'DOWNWARD' ? 'Backward' : 'Straight'),
              legibility: localMetrics.readability === 'CLEAR' ? 'Very Clear' : 'Moderately Clear',
              underline: localMetrics.underline === 'PRESENT' ? 'Yes' : 'No',
              underlineDesc: localMetrics.underline === 'PRESENT' ? 'Single horizontal line' : '',
              flourishes: localMetrics.loops === 'EXCESSIVE' ? 'Yes' : 'No',
              pressure: localMetrics.pressure,
              speed: 'Quick and flowing',
              firstVsLast: 'Equally balanced'
            },
            language
          })
        });

        if (response.ok) {
          const json = await response.json();
          if (json && json.psychologicalInterpretation) {
            apiResult = json;
          }
        }
      } catch (apiErr) {
        console.warn("Signature Audit API failed or timed out. Falling back to local synthesizer:", apiErr);
      }

      // Step 3: Parse results and generate visual report dossier
      if (apiResult) {
        // Map backend report structure back into our dossier schema
        const mappedDossier: SignatureDossier = {
          personalDetails: {
            name: data.name,
            dob: data.dob,
            gender: data.gender,
            intent: data.intent,
            hand: data.hand
          },
          metrics: {
            slantLabel: localMetrics.slant === 'UPWARD' ? "signature.metrics.slant.upward" : (localMetrics.slant === 'DOWNWARD' ? "signature.metrics.slant.downward" : "signature.metrics.slant.straight"),
            underlineLabel: localMetrics.underline === 'PRESENT' ? "signature.metrics.underline.present" : (localMetrics.underline === 'CUTTING' ? "signature.metrics.underline.cutting" : "signature.metrics.underline.none"),
            finalDotLabel: localMetrics.finalDot === 'PRESENT' ? "signature.metrics.finalDot.present" : "signature.metrics.finalDot.none",
            readabilityLabel: localMetrics.readability === 'CLEAR' ? "signature.metrics.readability.clear" : (localMetrics.readability === 'UNCLEAR' ? "signature.metrics.readability.unclear" : "signature.metrics.readability.moderate"),
            pressureLabel: localMetrics.pressure === 'HEAVY' ? "signature.metrics.pressure.heavy" : (localMetrics.pressure === 'LIGHT' ? "signature.metrics.pressure.light" : "signature.metrics.pressure.medium"),
            startingLabel: localMetrics.starting === 'CLEAN' ? "signature.metrics.starting.clean" : "signature.metrics.starting.complex",
            loopsLabel: localMetrics.loops === 'BALANCED' ? "signature.metrics.loops.balanced" : (localMetrics.loops === 'TALL' ? "signature.metrics.loops.tall" : "signature.metrics.loops.excessive"),
            spacing: localMetrics.spacing
          },
          numerology: {
            chaldeanValue,
            driver,
            conductor,
            compatibleStyle: isHi ? '15-डिग्री ऊपर की ओर उठने वाली शैली' : '15-Degree Ascending Script with Underline',
            luckyAngle: '15° - 20° Upward Ascent',
            colors: [
              { color: isHi ? "रॉयल ब्लू स्याही (Royal Blue Ink)" : "Royal Blue Ink", reason: apiResult.recommendations?.colors?.[0]?.reason || "Jupiter/Mercury vibration" },
              { color: isHi ? "गहरी काली स्याही (Deep Black Ink)" : "Deep Black Ink", reason: apiResult.recommendations?.colors?.[1]?.reason || "Saturn asset shield" },
              { color: isHi ? "पन्ना हरी स्याही (Emerald Green)" : "Emerald Green Ink", reason: apiResult.recommendations?.colors?.[2]?.reason || "Mercury trade intelligence" }
            ]
          },
          executiveSummary: {
            overallVibeKey: apiResult.compatibilityScore?.score >= 9 ? 'signature.report.excellent' : (apiResult.compatibilityScore?.score >= 7 ? 'signature.report.good' : 'signature.report.mixed'),
            score: apiResult.compatibilityScore?.score || 8,
            mainPositiveKey: localMetrics.slant === 'UPWARD' ? 'signature.obs.slant.upward.title' : 'signature.obs.slant.straight.title',
            mainPositiveDescKey: localMetrics.slant === 'UPWARD' ? 'signature.obs.slant.upward.desc' : 'signature.obs.slant.straight.desc',
            criticalCorrectionKey: localMetrics.underline === 'NONE' ? 'signature.obs.underline.none.title' : (localMetrics.underline === 'CUTTING' ? 'signature.obs.underline.cuts.title' : 'signature.obs.dot.present.title'),
            criticalCorrectionDescKey: localMetrics.underline === 'NONE' ? 'signature.obs.underline.none.desc' : (localMetrics.underline === 'CUTTING' ? 'signature.obs.underline.cuts.desc' : 'signature.obs.dot.present.desc'),
            summaryText: apiResult.compatibilityScore?.detailedExplanation || apiResult.psychologicalInterpretation?.confidenceLevel || ""
          },
          intentBreakdowns: [
            {
              labelKey: "signature.scores.career",
              score: apiResult.compatibilityScore?.score || 8,
              description: apiResult.professionalImpact?.firstImpression || ""
            },
            {
              labelKey: "signature.scores.prosperity",
              score: apiResult.compatibilityScore?.score || 8,
              description: apiResult.professionalImpact?.industrySuitability || ""
            },
            {
              labelKey: "signature.scores.finance",
              score: apiResult.compatibilityScore?.score || 8,
              description: apiResult.professionalImpact?.authorityCredibility || ""
            },
            {
              labelKey: "signature.scores.authority",
              score: apiResult.compatibilityScore?.score || 8,
              description: apiResult.psychologicalInterpretation?.ambitionDrive || ""
            }
          ],
          corrections: {
            keep: apiResult.recommendations?.variants || [isHi ? 'बाएं से दाएं ऊपर की ओर उठने वाला झुकाव।' : 'The upward baseline slope climbing from left to right.'],
            remove: [isHi ? 'कोई भी बंद घेरा या कटने वाली अंडरलाइन' : 'Any intersecting line cuts or trailing full stops.'],
            improve: [apiResult.recommendations?.signingDirection || (isHi ? 'कोमल और आराम से लिखें।' : 'Sign with smooth flowing continuous lines.')]
          },
          formula: {
            blueprint: apiResult.recommendations?.shouldModify || "",
            penType: apiResult.recommendations?.penType || "Rollerball or Fountain Pen",
            direction: apiResult.recommendations?.signingDirection || "Ascending left-to-right"
          }
        };

        setDossier(mappedDossier);
      } else {
        // Fallback: Use fully deterministic local scoring and report generation
        const scoreBreakdown = calculateSignatureScore(localMetrics, data.intent, driver, conductor);
        const localDossier = generateLocalSignatureReport(
          data.name,
          data.dob,
          data.gender,
          data.intent,
          data.hand,
          localMetrics,
          scoreBreakdown,
          chaldeanValue,
          driver,
          conductor,
          language
        );
        setDossier(localDossier);
      }
    } catch (err) {
      console.error("Local signature report construction failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b border-[#F2E8DC] pb-4">
        <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">
          {getTranslatedKey(language, "signature.title")}
        </h3>
        <p className="text-xs text-slate-500 font-sans mt-1">
          {getTranslatedKey(language, "signature.subtitle")}
        </p>
      </div>

      {/* Main scanning grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Form and Image Preview */}
        <div className="lg:col-span-5 space-y-6">
          {uploadedImage && (
            <SignatureImagePreview
              imageSrc={uploadedImage}
              isScanning={isScanning}
              onRemove={() => {
                setUploadedImage('');
                setDossier(null);
              }}
              language={language}
            />
          )}

          {!dossier && !isScanning && (
            <SignatureUploadForm
              onSubmit={handleAuditStart}
              isLoading={isScanning}
              language={language}
            />
          )}
          
          {isScanning && (
            <div className="flex flex-col items-center justify-center p-12 bg-white/80 border rounded-3xl space-y-4">
              <div className="w-10 h-10 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest text-[#1E3A8A] font-bold animate-pulse">
                {isHi ? "वास्तु आवृत्तियों का मिलान किया जा रहा है..." : "Aligning Planetary Frequencies..."}
              </p>
            </div>
          )}
        </div>

        {/* Audit results dashboard */}
        <div className="lg:col-span-7">
          {dossier ? (
            <SignatureResultDashboard
              dossier={dossier}
              language={language}
            />
          ) : (
            !isScanning && (
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[350px]">
                <Sparkles className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                <h4 className="font-playfair text-base font-bold text-slate-700">
                  {isHi ? "हस्ताक्षर वास्तु ऑडिट प्रतीक्षित है" : "Acoustic Vastu Audit Pending"}
                </h4>
                <p className="text-xs text-slate-400 font-sans max-w-sm mt-2">
                  {isHi 
                    ? "कृप्या बाईं ओर फ़ॉर्म भरें और अपनी वर्तमान हस्ताक्षर छवि अपलोड करें ताकि ग्रहीय संरेखण रिपोर्ट जनरेट की जा सके।" 
                    : "Please fill out the birth credentials and upload your signature to generate the specialized Handwriting Vastu Dossier."
                  }
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
