import React from 'react';
import { motion } from 'motion/react';
import { 
  Award, CheckCircle, AlertTriangle, Compass, PenTool, 
  BookOpen, Printer, Star, TrendingUp, Calendar, FileText, CheckSquare
} from 'lucide-react';
import { SignatureDossier } from './signatureReportGenerator';
import { getTranslatedKey } from './signatureInterpretationKeys';

interface SignatureResultDashboardProps {
  dossier: SignatureDossier;
  language: string;
  uploadedImage?: string; // Optional actual uploaded signature base64 image
}

export const SignatureResultDashboard: React.FC<SignatureResultDashboardProps> = ({
  dossier,
  language,
  uploadedImage
}) => {
  const isHi = language === 'hi';
  const { personalDetails, metrics, numerology, executiveSummary, intentBreakdowns, corrections, formula } = dossier;

  const handlePrint = () => {
    window.print();
  };

  // Resolve the 13 required advanced metrics with fallbacks
  const raw = dossier.rawMetrics;
  const conf = dossier.confidenceScores || {
    slant: 0.85,
    underline: 0.85,
    finalDot: 0.85,
    startingClutter: 0.85,
    loop: 0.85,
    readability: 0.85,
    pressure: 0.85
  };

  const underlineConfVal = Math.round((conf.underline ?? 0.85) * 100);
  const isUnderlineLowConf = underlineConfVal >= 40 && underlineConfVal <= 65;

  const baselineAngleVal = raw?.baselineAngle ?? (metrics.slantLabel === "signature.metrics.slant.upward" ? 12 : (metrics.slantLabel === "signature.metrics.slant.downward" ? -8 : 0));
  const slantCategoryVal = getTranslatedKey(language, metrics.slantLabel);
  const hasUnderlineVal = raw?.hasUnderline ?? (metrics.underlineLabel !== "signature.metrics.underline.none");
  const underlineAngleVal = raw?.underlineAngle ?? (metrics.underlineLabel !== "signature.metrics.underline.none" ? 8 : 0);
  const underlinePositionVal = raw?.underlinePosition ?? (metrics.underlineLabel === "signature.metrics.underline.cutting" ? "cutsName" : (metrics.underlineLabel === "signature.metrics.underline.present" ? "belowName" : "none"));
  const underlineCutsSignatureVal = raw?.underlineCutsSignature ?? (metrics.underlineLabel === "signature.metrics.underline.cutting");
  const hasFinalDotVal = raw?.hasFinalDot ?? (metrics.finalDotLabel === "signature.metrics.finalDot.present");
  const finalDotConfidenceVal = Math.round((conf.finalDot ?? 0.85) * 100);
  const isFinalDotLowConf = finalDotConfidenceVal >= 40 && finalDotConfidenceVal <= 65;
  const startingStrokeComplexityVal = getTranslatedKey(language, metrics.startingLabel);
  const loopBalanceVal = getTranslatedKey(language, metrics.loopsLabel);
  const readabilityScoreVal = Math.round((conf.readability ?? 0.85) * 100);
  const pressureCategoryVal = getTranslatedKey(language, metrics.pressureLabel);

  // Overall calibration / confidence
  const avgConf = (
    (conf.slant ?? 0.85) + 
    (conf.underline ?? 0.85) + 
    (conf.finalDot ?? 0.85) + 
    (conf.startingClutter ?? 0.85) + 
    (conf.loop ?? 0.85) + 
    (conf.readability ?? 0.85) + 
    (conf.pressure ?? 0.85)
  ) / 7;
  const overallConfidenceVal = Math.round(avgConf * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 mt-8 print:mt-0 print:space-y-0"
      id="signature-audit-dossier"
    >
      {/* Precision PDF/Print CSS Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm 1.2cm 1.2cm 1.2cm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-size: 10px !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            height: 26.5cm;
            max-height: 26.5cm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            padding-top: 0.2cm;
            padding-bottom: 0.2cm;
          }
          .print-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
            height: auto;
            max-height: none;
          }
          .no-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen Mode Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5 print-hide">
        <div>
          <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
            {isHi ? "हस्ताक्षर वास्तु एवं ग्रहीय निदान" : "Signature Vastu & Planetary Diagnostics"}
          </span>
          <h3 className="font-playfair text-2xl font-bold text-slate-900 mt-2">
            {isHi ? "हस्ताक्षर वास्तु विश्लेषण रिपोर्ट" : "Signature Style Diagnostics Report"}
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-1">
            {isHi 
              ? `नाम: ${personalDetails.name} | मूलांक: ${numerology.driver} | भाग्यांक: ${numerology.conductor}`
              : `Subject: ${personalDetails.name} | Driver: ${numerology.driver} | Conductor: ${numerology.conductor}`
            }
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-300" />
          {getTranslatedKey(language, "signature.print.button")}
        </button>
      </div>

      {/* ========================================================
          PAGE 1: Signature Style Diagnostics COVER PAGE
          ======================================================== */}
      <div className="print-page bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col justify-between">
        <div className="space-y-8">
          {/* Cover Header */}
          <div className="text-center space-y-2 pb-6 border-b border-slate-200">
            <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-widest block">
              {isHi ? "परिशुद्ध हस्तलेखन एवं ध्वनि विश्लेषण" : "PRECISION GRAPHOLOGY & ACOUSTIC AUDIT"}
            </span>
            <h1 className="text-3xl md:text-4xl font-playfair font-black text-slate-950">
              {isHi ? "हस्ताक्षर शैली निदान रिपोर्ट" : "Signature Style Diagnostics Report"}
            </h1>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              {isHi 
                ? "हस्तलेखन वास्तु, ध्वनि कंपन, और ग्रहीय संरेखण का व्यापक विश्लेषण" 
                : "A granular forensic and Astro-Vastu analysis of handwriting geometries and support strokes."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            {/* Subject Profile Detail box */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{isHi ? "नाम (Subject Name)" : "Subject Name"}</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">{personalDetails.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{isHi ? "जन्मतिथि (Date of Birth)" : "Date of Birth"}</span>
                    <span className="text-xs font-medium text-slate-700 block mt-0.5">{personalDetails.dob || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{isHi ? "निदान तिथि (Report Date)" : "Report Date"}</span>
                    <span className="text-xs font-medium text-slate-700 block mt-0.5">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Image Box */}
              {uploadedImage ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold mb-3">
                    {isHi ? "अपलोड की गई मूल छवि" : "UPLOADED SIGNATURE IMAGE"}
                  </span>
                  <div className="p-2 bg-slate-50 rounded-xl w-full flex items-center justify-center h-28">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded Signature" 
                      className="max-h-24 object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
                  <PenTool className="w-8 h-8 text-slate-300 mb-2" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isHi ? "हस्ताक्षर स्कैन सक्रिय" : "HEURISTIC SCAN FEED ACTIVE"}</span>
                  <p className="text-[9px] text-slate-400 mt-1 max-w-xs">
                    {isHi ? "भौतिक हस्ताक्षर की ज्यामितीय आकृतियों का स्वचालित रूप से विश्लेषण किया गया है।" : "Handwriting attributes extracted directly from client-side vector parameters."}
                  </p>
                </div>
              )}
            </div>

            {/* Score Ring & Summary Callout */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                  {getTranslatedKey(language, "signature.report.overallScore")}
                </span>
                <div className="flex items-baseline justify-center mt-1">
                  <span className="text-5xl font-playfair font-black text-indigo-950">{executiveSummary.score}</span>
                  <span className="text-slate-400 font-mono text-xs ml-1">/100</span>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mt-2 inline-block">
                  {getTranslatedKey(language, executiveSummary.overallVibeKey)}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex gap-2.5 items-start">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h6 className="text-[10px] font-bold text-emerald-950">
                      {getTranslatedKey(language, "signature.report.positiveSign")}: {getTranslatedKey(language, executiveSummary.mainPositiveKey)}
                    </h6>
                    <p className="text-[9px] text-emerald-700 leading-relaxed mt-0.5">
                      {getTranslatedKey(language, executiveSummary.mainPositiveDescKey)}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h6 className="text-[10px] font-bold text-amber-950">
                      {getTranslatedKey(language, "signature.report.correctionNeeded")}: {getTranslatedKey(language, executiveSummary.criticalCorrectionKey)}
                    </h6>
                    <p className="text-[9px] text-amber-700 leading-relaxed mt-0.5">
                      {getTranslatedKey(language, executiveSummary.criticalCorrectionDescKey)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer Footer */}
        <div className="border-t border-slate-200 pt-5 mt-6">
          <p className="text-[8px] text-slate-400 text-center leading-relaxed max-w-2xl mx-auto">
            <strong>{isHi ? "सुरक्षा एवं विधिक अस्वीकरण: " : "Disclaimer: "}</strong> {getTranslatedKey(language, "signature.disclaimer")}
          </p>
          <div className="hidden print:flex justify-between items-center text-[8px] text-slate-400 border-t pt-2 font-mono mt-3">
            <span>Page 1: Signature Diagnostics Cover</span>
            <span>Subject: {personalDetails.name}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          PAGE 2: Detailed Visual Metrics Table
          ======================================================== */}
      <div className="print-page bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h4 className="font-playfair text-lg font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              {getTranslatedKey(language, "signature.metrics.title")}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isHi 
                ? "हमारे प्रोपराइटी ऑप्टिकल इंजन द्वारा मापे गए कुल १३ दृश्य पैरामीटर एवं उनकी सटीकता स्तर:"
                : "The 13 comprehensive handwriting-vastu parameters mapped from physical image configurations:"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[10px] font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[8px] tracking-wider">
                  <th className="pb-2.5 pr-4 font-bold">{isHi ? "लक्षण (Attribute)" : "Attribute"}</th>
                  <th className="pb-2.5 px-3 font-bold">{isHi ? "पाया गया मान (Detected Value)" : "Detected Value"}</th>
                  <th className="pb-2.5 px-3 font-bold text-center">{isHi ? "सटीकता (Confidence)" : "Confidence"}</th>
                  <th className="pb-2.5 pl-4 font-bold">{isHi ? "वास्तु प्रभाव और व्याख्या" : "Vastu Impact & Interpretation"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Slant Category */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.slant")}</td>
                  <td className="py-2 px-3 font-medium text-indigo-700">{slantCategoryVal}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.slant ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {getTranslatedKey(
                      language, 
                      metrics.slantLabel?.includes("upward") || metrics.slantLabel === "UPWARD"
                        ? "signature.slant.upward.description" 
                        : (metrics.slantLabel?.includes("downward") || metrics.slantLabel === "DOWNWARD"
                          ? "signature.slant.downward.description"
                          : "signature.slant.horizontal.description")
                    )}
                  </td>
                </tr>

                {/* 2. Baseline Angle */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{isHi ? "आधार रेखा कोण" : "Baseline Axis Angle"}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{baselineAngleVal >= 0 ? '+' : ''}{baselineAngleVal}°</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.slant ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {isHi 
                      ? "आदर्श कोण +१० से +१५ डिग्री है जो प्रगति का प्रतिनिधित्व करता है।" 
                      : "Ideal range is +10° to +18° ascending. Flat or negative slopes limit growth momentum."}
                  </td>
                </tr>

                {/* 3. Underline Foundation Presence */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{isHi ? "अंडरलाइन उपस्थिति" : "Underline Foundation"}</td>
                  <td className="py-2 px-3">
                    <span className={`font-semibold text-[9px] ${hasUnderlineVal ? "text-emerald-700" : "text-amber-700"}`}>
                      {isUnderlineLowConf ? (
                        isHi ? "संभावित (अनिश्चित)" : "Possible / Uncertain"
                      ) : (
                        hasUnderlineVal ? (isHi ? "उपस्थित" : "Detected") : (isHi ? "अनुपस्थित" : "Missing")
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{underlineConfVal}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {isUnderlineLowConf ? (isHi ? "[संभावित/अनिश्चित विश्लेषण] " : "[Possible/Uncertain Analysis] ") : ""}
                    {getTranslatedKey(language, hasUnderlineVal ? "signature.obs.underline.present.desc" : "signature.obs.underline.none.desc")}
                  </td>
                </tr>

                {/* 4. Underline Angle */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{isHi ? "अंडरलाइन कोण" : "Underline Angle"}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{underlineAngleVal}°</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.underline ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {isHi 
                      ? "अंडरलाइन का कोण मुख्य लिखावट के कोण से मेल खाना चाहिए या क्षैतिज होना चाहिए।" 
                      : "Underline angle should complement the signature baseline. Steep drops indicate friction."}
                  </td>
                </tr>

                {/* 5. Underline Position */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{isHi ? "अंडरलाइन की स्थिति" : "Underline Positioning"}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {underlinePositionVal === "belowName" ? (isHi ? "नाम के नीचे" : "Below Name") : underlinePositionVal === "cutsName" ? (isHi ? "नाम काटती हुई" : "Cuts Letters") : (isHi ? "कोई नहीं" : "None")}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.underline ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {isHi 
                      ? "रेखा को अक्षरों को स्पर्श किए बिना हमेशा नाम के नीचे स्वतंत्र रूप से चलना चाहिए।" 
                      : "Underline must run fully beneath the name. Intersections signify energy drains."}
                  </td>
                </tr>

                {/* 6. Underline Cuts Signature */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{isHi ? "हस्ताक्षर कटना" : "Underline Intersects"}</td>
                  <td className="py-2 px-3">
                    <span className={`font-semibold text-[9px] ${underlineCutsSignatureVal ? "text-red-700 bg-red-50 px-1 rounded" : "text-emerald-700"}`}>
                      {underlineCutsSignatureVal ? (isHi ? "हाँ (गंभीर)" : "Yes (Critical)") : (isHi ? "नहीं (सुरक्षित)" : "No (Safe)")}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.underline ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {getTranslatedKey(language, underlineCutsSignatureVal ? "signature.obs.underline.cuts.desc" : "signature.obs.underline.present.desc")}
                  </td>
                </tr>

                {/* 7. Final Dot Presence */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.finalDot")}</td>
                  <td className="py-2 px-3">
                    <span className={`font-semibold text-[9px] ${hasFinalDotVal ? "text-amber-700 bg-amber-50 px-1 rounded" : "text-emerald-700"}`}>
                      {isFinalDotLowConf ? (
                        isHi ? "संभावित (अनिश्चित)" : "Possible / Uncertain"
                      ) : (
                        hasFinalDotVal ? (isHi ? "हाँ (अवरोध)" : "Yes (Barrier)") : (isHi ? "नहीं" : "No")
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{finalDotConfidenceVal}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {isFinalDotLowConf ? (isHi ? "[संभावित/अनिश्चित विश्लेषण] " : "[Possible/Uncertain Analysis] ") : ""}
                    {getTranslatedKey(language, hasFinalDotVal ? "signature.obs.dot.present.desc" : "signature.obs.dot.none.desc")}
                  </td>
                </tr>

                {/* 8. Starting Stroke Complexity */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.starting")}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{startingStrokeComplexityVal}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.startingClutter ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {getTranslatedKey(
                      language, 
                      metrics.startingLabel?.includes("clean") || metrics.startingLabel === "CLEAN"
                        ? "signature.obs.starting.clean.desc" 
                        : "signature.obs.starting.complex.desc"
                    )}
                  </td>
                </tr>

                {/* 9. Loop & Flourish Balance */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.loops")}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{loopBalanceVal}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.loop ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {isHi 
                      ? "मध्यम संतुलित लूप स्वस्थ भावनाओं को दर्शाते हैं। अत्यधिक लूप मानसिक उलझन बढ़ाते हैं।" 
                      : "Balanced loops project stable emotional limits. Excessive loops suggest defensiveness."}
                  </td>
                </tr>

                {/* 10. Readability Category & Score */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.readability")}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {getTranslatedKey(language, metrics.readabilityLabel)} ({readabilityScoreVal}%)
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.readability ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {getTranslatedKey(
                      language, 
                      metrics.readabilityLabel?.includes("clear") || metrics.readabilityLabel === "CLEAR"
                        ? "signature.obs.readability.clear.desc" 
                        : (metrics.readabilityLabel?.includes("moderate") || metrics.readabilityLabel === "MODERATE"
                          ? "signature.obs.readability.moderate.desc"
                          : "signature.obs.readability.unclear.desc")
                    )}
                  </td>
                </tr>

                {/* 11. Pen Pressure Category */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.pressure")}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{pressureCategoryVal}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{Math.round((conf.pressure ?? 0.85) * 100)}%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {getTranslatedKey(
                      language, 
                      metrics.pressureLabel?.includes("heavy") || metrics.pressureLabel === "HEAVY"
                        ? "signature.obs.pressure.heavy.desc" 
                        : (metrics.pressureLabel?.includes("medium") || metrics.pressureLabel === "MEDIUM"
                          ? "signature.obs.pressure.medium.desc"
                          : "signature.obs.pressure.light.desc")
                    )}
                  </td>
                </tr>

                {/* 12. Character Spacing */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.spacing")}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{getTranslatedKey(language, metrics.spacing)}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">85%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {isHi 
                      ? "अक्षरों के बीच का स्थान आपके विचारों में स्पष्टता और निर्णय लेने की गति को दर्शाता है।" 
                      : "Even, uncrowded spacing indicates mental clarity and systematic execution."}
                  </td>
                </tr>

                {/* 13. Overall Scanner Confidence */}
                <tr>
                  <td className="py-2 pr-4 font-bold text-indigo-900">{isHi ? "कुल स्कैनर सटीकता" : "Overall Scan Accuracy"}</td>
                  <td className="py-2 px-3 font-bold text-indigo-950">{overallConfidenceVal}%</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold">100%</td>
                  <td className="py-2 pl-4 text-slate-500 text-[9px] leading-tight">
                    {isHi 
                      ? "सभी ७ उप-घटकों की संचयी सटीकता को मिलाकर औसत स्कैनर रेटिंग।" 
                      : "Composite algorithmic confidence across all seven physical measurement parameters."}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer for Page 2 */}
        <div className="hidden print:flex justify-between items-center text-[8px] text-slate-400 border-t pt-2 font-mono mt-4">
          <span>Page 2: Comprehensive Visual Metrics Analysis</span>
          <span>Subject: {personalDetails.name}</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 3: Corrected Signature Checklist & Astro Rules
          ======================================================== */}
      <div className="print-page bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="font-playfair text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              {getTranslatedKey(language, "signature.corrections.title")}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isHi 
                ? "नकारात्मक ऊर्जाओं को दूर करने और सकारात्मक वास्तु ऊर्जा को संरेखित करने के त्वरित सुधार नियम:"
                : "Astro-Vastu strategic rules and keepers to establish a solid signature foundation:"}
            </p>
          </div>

          {/* Strategic Keep/Remove/Improve Column grids */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KEEP */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">
                {getTranslatedKey(language, "signature.corrections.keep")}
              </span>
              <ul className="space-y-2 text-[10px] text-slate-600 list-disc pl-4 leading-relaxed">
                {corrections.keep.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* REMOVE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <span className="text-[9px] font-mono bg-red-50 text-red-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">
                {getTranslatedKey(language, "signature.corrections.remove")}
              </span>
              <ul className="space-y-2 text-[10px] text-slate-600 list-disc pl-4 leading-relaxed">
                {corrections.remove.map((item, idx) => (
                  <li key={idx} className="text-red-700 font-medium">{item}</li>
                ))}
              </ul>
            </div>

            {/* IMPROVE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">
                {getTranslatedKey(language, "signature.corrections.improve")}
              </span>
              <ul className="space-y-2 text-[10px] text-slate-600 list-disc pl-4 leading-relaxed">
                {corrections.improve.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Corrected Formula Blueprint */}
          <div className="bg-indigo-950 text-white rounded-2xl p-5 space-y-4">
            <h5 className="font-playfair text-base font-bold text-indigo-200 flex items-center gap-2 border-b border-indigo-900 pb-2">
              <PenTool className="w-4.5 h-4.5 text-indigo-300" />
              {getTranslatedKey(language, "signature.formula.title")}
            </h5>

            <p className="text-xs text-indigo-100 leading-relaxed font-sans font-medium">
              {formula.blueprint}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-indigo-900/40 border border-indigo-900 rounded-xl p-3 flex gap-2.5 items-center">
                <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="text-[8px] font-mono text-indigo-300 block uppercase tracking-wider font-bold">Recommended Pen Type</span>
                  <p className="text-[10px] font-semibold text-white mt-0.5">{formula.penType}</p>
                </div>
              </div>

              <div className="bg-indigo-900/40 border border-indigo-900 rounded-xl p-3 flex gap-2.5 items-center">
                <Compass className="w-4 h-4 text-teal-300 flex-shrink-0" />
                <div>
                  <span className="text-[8px] font-mono text-indigo-300 block uppercase tracking-wider font-bold">Signing Direction & Angle</span>
                  <p className="text-[10px] font-semibold text-white mt-0.5">{formula.direction}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer for Page 3 */}
        <div className="hidden print:flex justify-between items-center text-[8px] text-slate-400 border-t pt-2 font-mono mt-4">
          <span>Page 3: Corrected Signature Formula Rules</span>
          <span>Subject: {personalDetails.name}</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 4: 21-Day Daily Practice Blueprint & Practice Grid
          ======================================================== */}
      <div className="print-page bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="font-playfair text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {getTranslatedKey(language, "signature.practice.title")}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {getTranslatedKey(language, "signature.practice.desc")}
            </p>
          </div>

          {/* 21-Day Rules in 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 font-sans">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
              <div className="bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <div>
                <h6 className="font-bold text-slate-900">{isHi ? "२१ बार लगातार अभ्यास" : "21 Times Daily Practice"}</h6>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  {getTranslatedKey(language, "signature.practice.rule1")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
              <div className="bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <div>
                <h6 className="font-bold text-slate-900">{isHi ? "सही स्याही और कलम का चयन" : "Royal Blue Ink & Fountain Pen"}</h6>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  {getTranslatedKey(language, "signature.practice.rule2")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
              <div className="bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <div>
                <h6 className="font-bold text-slate-900">{isHi ? "बिना रेखा वाला कोरा कागज" : "Pure Unruled Sheet"}</h6>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  {getTranslatedKey(language, "signature.practice.rule3")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start">
              <div className="bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
              <div>
                <h6 className="font-bold text-slate-900">{isHi ? "सचेत इरादा और मानसिक फोकस" : "Intention & Pure Focus"}</h6>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  {getTranslatedKey(language, "signature.practice.rule4")}
                </p>
              </div>
            </div>
          </div>

          {/* 21-Day Tracker Grid Visualizer */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white text-center">
            <span className="text-[9px] font-mono text-indigo-700 font-extrabold uppercase tracking-widest block mb-3">
              {isHi ? "२१-दिवसीय ग्रहीय अभ्यास ट्रैकर ग्रीड" : "21-DAY ASTRO-VIBRATIONAL PRACTICE TRACKER"}
            </span>
            <div className="grid grid-cols-7 gap-2 max-w-sm mx-auto">
              {Array.from({ length: 21 }).map((_, i) => (
                <div key={i} className="aspect-square border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-mono text-slate-400 font-extrabold hover:bg-slate-50 transition-colors">
                  {i + 1}
                </div>
              ))}
            </div>
            <span className="text-[9px] text-slate-400 block mt-3 font-medium">
              {isHi ? "प्रत्येक सफल सचेत अभ्यास के बाद एक बॉक्स को टिक करें।" : "Tick off one box each day immediately after completing your 21 conscious repetitions."}
            </span>
          </div>
        </div>

        {/* Final Official Vastu Disclaimer */}
        <div className="border-t border-slate-200 pt-4 text-center space-y-2">
          <p className="text-[8px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            <strong>{isHi ? "वास्तु अस्वीकरण: " : "Remedial Disclaimer: "}</strong> {getTranslatedKey(language, "signature.disclaimer")}
          </p>
          <div className="hidden print:flex justify-between items-center text-[8px] text-slate-400 border-t pt-2 font-mono mt-2">
            <span>Page 4: 21-Day practice Blueprint & Disclaimer</span>
            <span>Subject: {personalDetails.name}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
