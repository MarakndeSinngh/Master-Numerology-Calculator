import React from 'react';
import { motion } from 'motion/react';
import { 
  Award, CheckCircle, AlertTriangle, Compass, PenTool, 
  BookOpen, Printer, Star, TrendingUp 
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

  // Print trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 mt-8 print:mt-0 print:space-y-0"
      id="signature-audit-dossier"
    >
      {/* 5-Page Print Control Stylesheet */}
      <style>{`
        @media print {
          /* Enforce exact paper boundaries and margins */
          @page {
            size: A4 portrait;
            margin: 1.6cm 1.4cm 1.6cm 1.4cm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-size: 11px !important;
          }
          /* 5-Page Container wrappers */
          .print-page {
            page-break-after: always;
            break-after: page;
            min-height: 25.5cm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            padding-top: 0.5cm;
            padding-bottom: 0.5cm;
          }
          .print-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
            min-height: auto;
          }
          /* Keep cards together, prevent clipping */
          .no-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Hide non-printable elements */
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      {/* GLOBAL AUDIT CONTROLS - HIDDEN IN PRINT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5 print-hide">
        <div>
          <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
            {isHi ? "वास्तु हस्तलेखन ऑडिट पूर्ण" : "Handwriting Vastu Audit Complete"}
          </span>
          <h3 className="font-playfair text-2xl font-bold text-[#1E3A8A] mt-2">
            {isHi ? "हस्ताक्षर वास्तु एवं ग्रहीय डोजियर" : "Signature Vastu & Planetary Dossier"}
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
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-300" />
          {getTranslatedKey(language, "signature.print.button")}
        </button>
      </div>

      {/* ========================================================
          PAGE 1: Subject Credentials & Executive Vastu Summary
          ======================================================== */}
      <div className="print-page space-y-6">
        <div className="space-y-6">
          {/* Header block for Print Mode */}
          <div className="hidden print:block border-b-2 border-[#1E3A8A] pb-3">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-playfair text-2xl font-bold text-[#1E3A8A]">
                  {isHi ? "हस्ताक्षर वास्तु एवं ग्रहीय ऑडिट रिपोर्ट" : "Signature Vastu & Planetary Audit"}
                </h2>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                  {isHi ? "सटीक कंपन हस्तलेखन निदान" : "Acoustic Handwriting Style Diagnostics"}
                </p>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-500">
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Target Profile Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{isHi ? "नाम (Subject Name)" : "Subject Name"}</span>
              <span className="text-xs font-bold text-slate-800 block mt-1">{personalDetails.name}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{isHi ? "जन्मतिथि (Date of Birth)" : "Date of Birth"}</span>
              <span className="text-xs font-bold text-slate-800 block mt-1">{personalDetails.dob}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{isHi ? "हाथ (Dominant Hand)" : "Dominant Hand"}</span>
              <span className="text-xs font-bold text-slate-800 block mt-1 uppercase">{personalDetails.hand === 'LEFT' ? (isHi ? 'बायां हाथ' : 'Left') : (isHi ? 'दायां हाथ' : 'Right')}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{isHi ? "लक्ष्य (Professional Intent)" : "Professional Intent"}</span>
              <span className="text-xs font-bold text-slate-800 block mt-1 truncate">{personalDetails.intent || "Growth & Alignment"}</span>
            </div>
          </div>

          {/* EXECUTIVE SUMMARY */}
          <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#1E3A8A]/0 border border-[#F2E8DC] rounded-3xl p-6 shadow-xs space-y-5">
            <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              {getTranslatedKey(language, "signature.report.executiveSummary")}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Compatibility Score */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center flex flex-col justify-center items-center relative overflow-hidden shadow-xs">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                  {getTranslatedKey(language, "signature.report.overallScore")}
                </span>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-playfair font-extrabold text-[#1E3A8A]">{executiveSummary.score}</span>
                  <span className="text-slate-400 font-mono text-sm ml-1">/100</span>
                </div>
                
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mt-3 block">
                  {getTranslatedKey(language, executiveSummary.overallVibeKey)}
                </span>
              </div>

              {/* Major Positives & Corrections */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-900">
                      {getTranslatedKey(language, "signature.report.positiveSign")}: {getTranslatedKey(language, executiveSummary.mainPositiveKey)}
                    </h5>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      {getTranslatedKey(language, executiveSummary.mainPositiveDescKey)}
                    </p>
                  </div>
                </div>

                <div className="bg-red-50/50 border border-red-100/50 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-red-900">
                      {getTranslatedKey(language, "signature.report.correctionNeeded")}: {getTranslatedKey(language, executiveSummary.criticalCorrectionKey)}
                    </h5>
                    <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                      {getTranslatedKey(language, executiveSummary.criticalCorrectionDescKey)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Synthesized Narrative */}
            <p className="text-xs text-slate-600 leading-relaxed font-sans border-t pt-4">
              {executiveSummary.summaryText}
            </p>
          </div>
        </div>

        {/* Footer for Page 1 */}
        <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-t pt-3 font-mono">
          <span>Page 1: Executive Summary Dossier</span>
          <span>Subject: {personalDetails.name}</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 2: Detailed Handwriting-Vastu Metrics Analysis Table
          ======================================================== */}
      <div className="print-page space-y-6">
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500" />
              {getTranslatedKey(language, "signature.metrics.title")}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isHi 
                ? "हमारे प्रोपराइटी हीुरिस्टिक स्कैनिंग इंजन द्वारा प्राप्त की गई हस्तरेखा रीडिंग का विवरण:"
                : "Granular handwriting-vastu parameters mapped from physical signature image attributes:"
              }
            </p>
          </div>

          {/* Actual Uploaded Signature Reference - Elite print touch */}
          {uploadedImage && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-xs mx-auto flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold mb-2">
                {isHi ? "स्कैन की गई मूल छवि" : "SCANNED SIGNATURE REFERENCE"}
              </span>
              <img 
                src={uploadedImage} 
                alt="Signature Reference" 
                className="max-h-24 object-contain filter invert contrast-125"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Parameters Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[9px] tracking-wider">
                  <th className="pb-3 pr-4 font-bold">{isHi ? "हस्ताक्षर लक्षण" : "Signature Attribute"}</th>
                  <th className="pb-3 px-4 font-bold">{isHi ? "पाया गया मान" : "Detected Value"}</th>
                  <th className="pb-3 pl-4 font-bold">{isHi ? "वास्तु प्रभाव और अर्थ" : "Vastu Meaning & Impact"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.slant")}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg text-[10px]">
                      {getTranslatedKey(language, metrics.slantLabel)}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 text-[11px] leading-relaxed">
                    {getTranslatedKey(
                      language, 
                      executiveSummary.mainPositiveKey === "signature.obs.slant.upward.title" 
                        ? "signature.obs.slant.upward.desc" 
                        : (executiveSummary.mainPositiveKey === "signature.obs.slant.neutralRising.title"
                          ? "signature.obs.slant.neutralRising.desc"
                          : (executiveSummary.criticalCorrectionKey === "signature.obs.slant.downward.title" 
                            ? "signature.obs.slant.downward.desc" 
                            : "signature.obs.slant.straight.desc"))
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.underline")}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium px-2.5 py-0.5 rounded-lg text-[10px] ${metrics.underlineLabel === "signature.metrics.underline.cutting" ? "text-red-700 bg-red-50" : "text-emerald-700 bg-emerald-50"}`}>
                      {getTranslatedKey(language, metrics.underlineLabel)}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 text-[11px] leading-relaxed">
                    {getTranslatedKey(language, metrics.underlineLabel === "signature.metrics.underline.cutting" ? "signature.obs.underline.cuts.desc" : (metrics.underlineLabel === "signature.metrics.underline.present" ? "signature.obs.underline.present.desc" : "signature.obs.underline.none.desc"))}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.finalDot")}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium px-2.5 py-0.5 rounded-lg text-[10px] ${metrics.finalDotLabel === "signature.metrics.finalDot.present" ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"}`}>
                      {getTranslatedKey(language, metrics.finalDotLabel)}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 text-[11px] leading-relaxed">
                    {getTranslatedKey(language, metrics.finalDotLabel === "signature.metrics.finalDot.present" ? "signature.obs.dot.present.desc" : "signature.obs.dot.none.desc")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.starting")}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-[10px]">
                      {getTranslatedKey(language, metrics.startingLabel)}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 text-[11px] leading-relaxed">
                    {getTranslatedKey(language, metrics.startingLabel === "signature.metrics.starting.clean" ? "signature.obs.starting.clean.desc" : "signature.obs.starting.complex.desc")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.readability")}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg text-[10px]">
                      {getTranslatedKey(language, metrics.readabilityLabel)}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 text-[11px] leading-relaxed">
                    {getTranslatedKey(
                      language, 
                      metrics.readabilityLabel === "signature.metrics.readability.clear" 
                        ? "signature.obs.readability.clear.desc" 
                        : (metrics.readabilityLabel === "signature.metrics.readability.moderate"
                          ? "signature.obs.readability.moderate.desc"
                          : "signature.obs.readability.unclear.desc")
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.pressure")}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-[10px]">
                      {getTranslatedKey(language, metrics.pressureLabel)}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 text-[11px] leading-relaxed">
                    {getTranslatedKey(
                      language, 
                      metrics.pressureLabel === "signature.metrics.pressure.heavy" 
                        ? "signature.obs.pressure.heavy.desc" 
                        : (metrics.pressureLabel === "signature.metrics.pressure.medium"
                          ? "signature.obs.pressure.medium.desc"
                          : "signature.obs.pressure.light.desc")
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer for Page 2 */}
        <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-t pt-3 font-mono">
          <span>Page 2: Handwriting Visual Metrics</span>
          <span>Subject: {personalDetails.name}</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 3: Numerological Alignment (Chaldean Grid + Color Astrology)
          ======================================================== */}
      <div className="print-page space-y-6">
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" />
              {getTranslatedKey(language, "signature.num.title")}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isHi 
                ? "आपके अंकज्योतिषीय विवरण के साथ संरेखित ग्रहीय कंपन रेखाएं:"
                : "Astrological and acoustic vibrational numbers mapped onto signature parameters:"
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Numerology Core Credentials */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <span className="text-xs font-mono text-indigo-700 font-extrabold uppercase tracking-widest block">
                {isHi ? "जन्म अंक क्रेडेंशियल्स" : "Cosmic Digit Blueprint"}
              </span>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">{getTranslatedKey(language, "signature.num.driver")}</span>
                  <span className="text-xl font-playfair font-extrabold text-[#1E3A8A] mt-1 block">{numerology.driver}</span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">{getTranslatedKey(language, "signature.num.conductor")}</span>
                  <span className="text-xl font-playfair font-extrabold text-[#1E3A8A] mt-1 block">{numerology.conductor}</span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">{getTranslatedKey(language, "signature.num.chaldean")}</span>
                  <span className="text-xl font-playfair font-extrabold text-[#1E3A8A] mt-1 block">{numerology.chaldeanValue}</span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-wider">{getTranslatedKey(language, "signature.num.angle")}</span>
                  <span className="text-xs font-bold text-slate-700 mt-2 block">{numerology.luckyAngle}</span>
                </div>
              </div>

              <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 rounded-2xl p-4 mt-2">
                <span className="text-[10px] font-mono text-[#1E3A8A] font-bold block uppercase tracking-wider">{getTranslatedKey(language, "signature.num.style")}</span>
                <p className="text-xs font-medium text-slate-700 mt-1">{numerology.compatibleStyle}</p>
              </div>
            </div>

            {/* Color Astrology & Ink Choices */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h5 className="font-playfair text-base font-bold text-[#1E3A8A] flex items-center gap-2 border-b pb-2">
                <PenTool className="w-4.5 h-4.5 text-indigo-500" />
                {getTranslatedKey(language, "signature.num.color")}
              </h5>

              <div className="space-y-4">
                {numerology.colors.map((c, idx) => (
                  <div key={idx} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0 flex gap-3 items-start">
                    <Star className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 fill-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{c.color}</span>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{c.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Astro-Functional Intent scorecard */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-500" />
              {getTranslatedKey(language, "signature.scores.title")}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {intentBreakdowns.map((b, idx) => (
                <div key={idx} className="border border-slate-100 rounded-2xl p-4 flex gap-4 items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">{getTranslatedKey(language, b.labelKey)}</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{b.description}</p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 w-12 h-12 rounded-xl flex-shrink-0">
                    <span className="text-sm font-playfair font-extrabold text-[#1E3A8A]">{b.score}</span>
                    <span className="text-[8px] font-mono text-slate-400">/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer for Page 3 */}
        <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-t pt-3 font-mono">
          <span>Page 3: Numerology & Colors Astro-Alignment</span>
          <span>Subject: {personalDetails.name}</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 4: Strategic Corrections & Formula Blueprint
          ======================================================== */}
      <div className="print-page space-y-6">
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
              <Compass className="w-5 h-5 text-red-500" />
              {getTranslatedKey(language, "signature.corrections.title")}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isHi 
                ? "ग्रहों के नकारात्मक प्रभाव को मिटाने और शुभ आवृत्तियों को संरेखित करने के त्वरित सुधार:"
                : "Handwriting Astro-Vastu strategic erasures and keepers to unblock positive energy:"
              }
            </p>
          </div>

          {/* Strategic Keep/Remove/Improve columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KEEP */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">
                {getTranslatedKey(language, "signature.corrections.keep")}
              </span>
              <ul className="space-y-2 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed">
                {corrections.keep.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* REMOVE */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <span className="text-[10px] font-mono bg-red-50 text-red-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">
                {getTranslatedKey(language, "signature.corrections.remove")}
              </span>
              <ul className="space-y-2 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed">
                {corrections.remove.map((item, idx) => (
                  <li key={idx} className="text-red-700 font-medium">{item}</li>
                ))}
              </ul>
            </div>

            {/* IMPROVE */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">
                {getTranslatedKey(language, "signature.corrections.improve")}
              </span>
              <ul className="space-y-2 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed">
                {corrections.improve.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Corrected Formula Blueprint */}
          <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
              <PenTool className="w-5 h-5 text-[#1E3A8A]" />
              {getTranslatedKey(language, "signature.formula.title")}
            </h4>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                {formula.blueprint}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 items-center shadow-xs">
                <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider font-bold">Recommended Pen & Pressure</span>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{formula.penType}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 items-center shadow-xs">
                <Compass className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider font-bold">Signing Direction & Axis</span>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{formula.direction}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer for Page 4 */}
        <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-t pt-3 font-mono">
          <span>Page 4: Strategic Vastu Remedies & Blueprint</span>
          <span>Subject: {personalDetails.name}</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 5: 21-Day Remedial Practice Plan & Symbolic Disclaimer
          ======================================================== */}
      <div className="print-page space-y-6">
        <div className="space-y-6">
          <div className="border-b pb-3">
            <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              {getTranslatedKey(language, "signature.practice.title")}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {getTranslatedKey(language, "signature.practice.desc")}
            </p>
          </div>

          {/* 21-Day Grid Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 font-sans">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex gap-4 items-start">
              <div className="bg-emerald-100 text-emerald-800 font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <div>
                <h5 className="font-bold text-slate-900 mb-1">{isHi ? "नियम १: खाली अनरुल्ड कागज" : "Rule 1: Clean Unruled Paper"}</h5>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {getTranslatedKey(language, "signature.practice.rule1")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex gap-4 items-start">
              <div className="bg-emerald-100 text-emerald-800 font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <div>
                <h5 className="font-bold text-slate-900 mb-1">{isHi ? "नियम २: २१ बार सचेत अभ्यास" : "Rule 2: 21 Times Conscious Practise"}</h5>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {getTranslatedKey(language, "signature.practice.rule2")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex gap-4 items-start">
              <div className="bg-emerald-100 text-emerald-800 font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <div>
                <h5 className="font-bold text-slate-900 mb-1">{isHi ? "नियम ३: ऊर्जा का प्रवाह बनाए रखें" : "Rule 3: Keep the Energy Flowing"}</h5>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {getTranslatedKey(language, "signature.practice.rule3")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex gap-4 items-start">
              <div className="bg-emerald-100 text-emerald-800 font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
              <div>
                <h5 className="font-bold text-slate-900 mb-1">{isHi ? "नियम ४: मन की स्थिरता और विश्वास" : "Rule 4: Mental Focus & Intention"}</h5>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {getTranslatedKey(language, "signature.practice.rule4")}
                </p>
              </div>
            </div>
          </div>

          {/* Practice tracker timeline box */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white text-center">
            <span className="text-[10px] font-mono text-indigo-700 font-extrabold uppercase tracking-widest block mb-3">
              {isHi ? "२१-दिन का अभ्यास ट्रैकर ग्रीड" : "21-DAY PRACTICE GRID"}
            </span>
            <div className="grid grid-cols-7 gap-2 max-w-sm mx-auto">
              {Array.from({ length: 21 }).map((_, i) => (
                <div key={i} className="aspect-square border border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-mono text-slate-400 font-bold hover:bg-slate-50 transition-colors">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DISCLAIMER BOTTOM FOOTER */}
        <div className="border-t border-slate-200 pt-5 text-center">
          <p className="text-[10px] text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto">
            <strong>{isHi ? "वास्तु अस्वीकरण:" : "Acoustic Vastu Disclaimer:"}</strong> {getTranslatedKey(language, "signature.disclaimer")}
          </p>
          
          <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-t pt-3 font-mono mt-4">
            <span>Page 5: Practice Tracker & Disclaimer</span>
            <span>Subject: {personalDetails.name}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
