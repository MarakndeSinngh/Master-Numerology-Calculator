import React from 'react';
import { motion } from 'motion/react';
import { 
  Award, CheckCircle, AlertTriangle, Compass, PenTool, 
  BookOpen, Printer, Star, TrendingUp, HelpCircle 
} from 'lucide-react';
import { SignatureDossier } from './signatureReportGenerator';
import { getTranslatedKey } from './signatureInterpretationKeys';

interface SignatureResultDashboardProps {
  dossier: SignatureDossier;
  language: string;
}

export const SignatureResultDashboard: React.FC<SignatureResultDashboardProps> = ({
  dossier,
  language
}) => {
  const isHi = language === 'hi';
  const { personalDetails, metrics, numerology, executiveSummary, intentBreakdowns, corrections, formula } = dossier;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 mt-8 print:mt-0 print:space-y-6"
      id="signature-audit-dossier"
    >
      {/* DOSSIER HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 print:pb-3">
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
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 print:hidden cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-300" />
          {getTranslatedKey(language, "signature.print.button")}
        </button>
      </div>

      {/* SECTION 1: EXECUTIVE SUMMARY */}
      <div className="bg-gradient-to-br from-[#1E3A8A]/5 to-[#1E3A8A]/0 border border-[#F2E8DC] rounded-3xl p-6 shadow-sm space-y-6">
        <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          {getTranslatedKey(language, "signature.report.executiveSummary")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center flex flex-col justify-center items-center relative overflow-hidden shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
              {getTranslatedKey(language, "signature.report.overallScore")}
            </span>
            <div className="flex items-baseline mt-2">
              <span className="text-5xl font-playfair font-extrabold text-[#1E3A8A]">{executiveSummary.score}</span>
              <span className="text-slate-400 font-mono text-sm ml-1">/10</span>
            </div>
            
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mt-3 block">
              {getTranslatedKey(language, executiveSummary.overallVibeKey)}
            </span>
          </div>

          {/* Key Positives & Critical corrections */}
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

        {/* Executive summary paragraph */}
        <p className="text-xs text-slate-600 leading-relaxed font-sans border-t pt-4">
          {executiveSummary.summaryText}
        </p>
      </div>

      {/* SECTION 2: VISUAL SIGNATURE READING */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-500" />
          {getTranslatedKey(language, "signature.metrics.title")}
        </h4>

        {/* Grid display to avoid confusion */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <th className="pb-3 pr-4 font-bold">{isHi ? "हस्ताक्षर लक्षण" : "Signature Attribute"}</th>
                <th className="pb-3 px-4 font-bold">{isHi ? "पाया गया मान" : "Detected Value"}</th>
                <th className="pb-3 pl-4 font-bold">{isHi ? "वास्तु प्रभाव और अर्थ" : "Vastu Meaning & Impact"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.slant")}</td>
                <td className="py-3.5 px-4">
                  <span className="font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {getTranslatedKey(language, metrics.slantLabel)}
                  </span>
                </td>
                <td className="py-3.5 pl-4 text-slate-500 text-[11px] leading-relaxed">
                  {getTranslatedKey(language, executiveSummary.mainPositiveKey === "signature.obs.slant.upward.title" ? "signature.obs.slant.upward.desc" : (executiveSummary.criticalCorrectionKey === "signature.obs.slant.downward.title" ? "signature.obs.slant.downward.desc" : "signature.obs.slant.straight.desc"))}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.underline")}</td>
                <td className="py-3.5 px-4">
                  <span className={`font-medium px-2.5 py-1 rounded-lg ${metrics.underlineLabel === "signature.metrics.underline.cutting" ? "text-red-700 bg-red-50" : "text-emerald-700 bg-emerald-50"}`}>
                    {getTranslatedKey(language, metrics.underlineLabel)}
                  </span>
                </td>
                <td className="py-3.5 pl-4 text-slate-500 text-[11px] leading-relaxed">
                  {getTranslatedKey(language, metrics.underlineLabel === "signature.metrics.underline.cutting" ? "signature.obs.underline.cuts.desc" : (metrics.underlineLabel === "signature.metrics.underline.present" ? "signature.obs.underline.present.desc" : "signature.obs.underline.none.desc"))}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.finalDot")}</td>
                <td className="py-3.5 px-4">
                  <span className={`font-medium px-2.5 py-1 rounded-lg ${metrics.finalDotLabel === "signature.metrics.finalDot.present" ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"}`}>
                    {getTranslatedKey(language, metrics.finalDotLabel)}
                  </span>
                </td>
                <td className="py-3.5 pl-4 text-slate-500 text-[11px] leading-relaxed">
                  {getTranslatedKey(language, metrics.finalDotLabel === "signature.metrics.finalDot.present" ? "signature.obs.dot.present.desc" : "signature.obs.dot.none.desc")}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.starting")}</td>
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {getTranslatedKey(language, metrics.startingLabel)}
                  </span>
                </td>
                <td className="py-3.5 pl-4 text-slate-500 text-[11px] leading-relaxed">
                  {getTranslatedKey(language, metrics.startingLabel === "signature.metrics.starting.clean" ? "signature.obs.starting.clean.desc" : "signature.obs.starting.complex.desc")}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.readability")}</td>
                <td className="py-3.5 px-4">
                  <span className="font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                    {getTranslatedKey(language, metrics.readabilityLabel)}
                  </span>
                </td>
                <td className="py-3.5 pl-4 text-slate-500 text-[11px] leading-relaxed">
                  {getTranslatedKey(language, metrics.readabilityLabel === "signature.metrics.readability.clear" ? "signature.obs.readability.clear.desc" : "signature.obs.readability.unclear.desc")}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">{getTranslatedKey(language, "signature.metrics.pressure")}</td>
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {getTranslatedKey(language, metrics.pressureLabel)}
                  </span>
                </td>
                <td className="py-3.5 pl-4 text-slate-500 text-[11px] leading-relaxed">
                  {getTranslatedKey(language, metrics.pressureLabel === "signature.metrics.pressure.heavy" ? "signature.obs.pressure.heavy.desc" : "signature.obs.pressure.light.desc")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: NUMEROLOGICAL COORDINATE ALIGNMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coordinate Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-500" />
            {getTranslatedKey(language, "signature.num.title")}
          </h4>

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

          <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 rounded-2xl p-4">
            <span className="text-[10px] font-mono text-[#1E3A8A] font-bold block uppercase tracking-wider">{getTranslatedKey(language, "signature.num.style")}</span>
            <p className="text-xs font-medium text-slate-700 mt-1">{numerology.compatibleStyle}</p>
          </div>
        </div>

        {/* Ink Colors & Planetary logic */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
            <PenTool className="w-5 h-5 text-indigo-500" />
            {getTranslatedKey(language, "signature.num.color")}
          </h4>

          <div className="space-y-3">
            {numerology.colors.map((c, idx) => (
              <div key={idx} className="border-b border-slate-100 last:border-0 pb-2.5 last:pb-0 flex gap-3 items-start">
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

      {/* SECTION 4: ASTRO-FUNCTIONAL INTENT SCORECARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
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
                <span className="text-[8px] font-mono text-slate-400">/10</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: SIGNATURE CORRECTIONS */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
          <Compass className="w-5 h-5 text-red-500" />
          {getTranslatedKey(language, "signature.corrections.title")}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KEEP */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
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
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
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
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
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
      </div>

      {/* SECTION 6: CORRECTED FORMULA BLUEPRINT */}
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

      {/* SECTION 7: DAILY PRACTICE PLAN */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h4 className="font-playfair text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          {getTranslatedKey(language, "signature.practice.title")}
        </h4>

        <p className="text-xs text-slate-500 font-sans">
          {getTranslatedKey(language, "signature.practice.desc")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-700 font-sans">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
            <div className="bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {getTranslatedKey(language, "signature.practice.rule1")}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
            <div className="bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {getTranslatedKey(language, "signature.practice.rule2")}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
            <div className="bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {getTranslatedKey(language, "signature.practice.rule3")}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
            <div className="bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {getTranslatedKey(language, "signature.practice.rule4")}
            </p>
          </div>
        </div>
      </div>

      {/* DISCLAIMER BOTTOM FOOTER */}
      <div className="border-t border-slate-200 pt-5 text-center">
        <p className="text-[10px] text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto">
          <strong>{isHi ? "वास्तु अस्वीकरण:" : "Acoustic Vastu Disclaimer:"}</strong> {getTranslatedKey(language, "signature.disclaimer")}
        </p>
      </div>
    </motion.div>
  );
};
