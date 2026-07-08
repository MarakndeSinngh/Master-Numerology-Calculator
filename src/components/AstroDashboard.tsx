import React from 'react';
import { DOBAnalysis, NameAnalysis, MobileAnalysis, remediesAdvice } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface AstroDashboardProps {
  dobData: DOBAnalysis | null;
  nameData: NameAnalysis;
  mobileData: MobileAnalysis;
  remedies: remediesAdvice;
  name: string;
  savedReports?: any[];
  onLoadReport?: (details: any) => void;
  onDeleteReport?: (id: string) => void;
}

const AstroDashboard: React.FC<AstroDashboardProps> = ({
  dobData,
  nameData,
  mobileData,
  remedies,
  name,
  savedReports = [],
  onLoadReport,
  onDeleteReport
}) => {
  const { t } = useLanguage();

  // Check presence for Vedic grid
  const presentNumbers = new Set(
    dobData
      ? (dobData.birthNumber.toString() + dobData.lifePathNumber.toString() + dobData.destinyNumber.toString())
          .split('')
          .map(Number)
      : []
  );

  const vedicTemplate = [
    [3, 1, 9],
    [6, 7, 5],
    [2, 8, 4]
  ];

  const loshoTemplate = [
    [4, 9, 2],
    [3, 5, 7],
    [8, 1, 6]
  ];

  return (
    <div id="dashboard-tab-panel" className="space-y-8 animate-in fade-in duration-500 text-left">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden bg-white hover:border-[#D97706]/30 border-[#E5E7EB] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-[#D97706]/80 block tracking-wider font-bold">
            {t('meta.mulank', 'Driver Number (Mulank)')}
          </span>
          <span className="text-4xl font-playfair font-bold text-[#D97706] mt-2 block">{dobData ? dobData.birthNumber : "Not Computed"}</span>
          <p className="text-[#6B7280] text-[10px] mt-2 leading-relaxed">
            {t('dashboard.driverDesc', 'Your conscious character, talent, and physical disposition.')}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden bg-white hover:border-[#D97706]/30 border-[#E5E7EB] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-[#D97706]/80 block tracking-wider font-bold">
            {t('meta.bhagyank', 'Conductor Number (Bhagyank)')}
          </span>
          <span className="text-4xl font-playfair font-bold text-[#D97706] mt-2 block">{dobData ? dobData.lifePathNumber : "Not Computed"}</span>
          <p className="text-[#6B7280] text-[10px] mt-2 leading-relaxed">
            {t('dashboard.conductorDesc', 'Your divine purpose, karmic trajectory, and path in life.')}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden bg-white hover:border-[#D97706]/30 border-[#E5E7EB] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-[#D97706]/80 block tracking-wider font-bold">
            {t('cards.birthCompoundNumber', 'Birth Compound Number')}
          </span>
          <span className="text-4xl font-playfair font-bold text-[#D97706] mt-2 block">{dobData ? dobData.birthNumberCompound : "Not Computed"}</span>
          <p className="text-[#6B7280] text-[10px] mt-2 leading-relaxed">
            {t('cards.birthCompoundDesc', 'The unreduced daily birth vibration representing core heritage.')}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden bg-white hover:border-[#D97706]/30 border-[#E5E7EB] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-[#D97706]/80 block tracking-wider font-bold">
            {t('cards.mobileCompoundNumber', 'Mobile Compound Number')}
          </span>
          <span className="text-4xl font-playfair font-bold text-[#D97706] mt-2 block">{mobileData.compoundTotal}</span>
          <p className="text-[#6B7280] text-[10px] mt-2 leading-relaxed">
            {t('cards.mobileCompoundDesc', 'The collective total of your 10-digit mobile number.')}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden bg-white hover:border-[#D97706]/30 border-[#E5E7EB] shadow-sm">
          <span className="text-[10px] font-mono uppercase text-[#D97706]/80 block tracking-wider font-bold">
            {t('cards.mobileRootNumber', 'Mobile Root Number')}
          </span>
          <span className="text-4xl font-playfair font-bold text-[#D97706] mt-2 block">{mobileData.reducedTotal}</span>
          <p className="text-[#6B7280] text-[10px] mt-2 leading-relaxed">
            {t('cards.mobileRootDesc', 'The single-digit primary mobile vibration influencing success.')}
          </p>
        </div>
      </div>

      {/* Astro Grids Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Vedic Grid Card */}
        <div className="glass-panel p-8 rounded-[40px] space-y-6 bg-white border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-playfair text-xl font-bold text-[#1F2937] tracking-wider">
              {t('dashboard.vedicGrid', 'Vedic Grid (Sepharial)')}
            </h3>
            <span className="text-[10px] font-mono bg-[#D97706]/10 text-[#D97706] px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold border border-[#D97706]/20">
              {t('dashboard.planetaryHouses', 'Planetary Houses')}
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">
            {t('dashboard.vedicDesc', 'Highlights active numeric portals influencing your subtle body energy aligned with celestial forces.')}
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-4">
            {vedicTemplate.map((row, rIdx) =>
              row.map((num) => {
                const isActive = presentNumbers.has(num);
                return (
                  <div
                    key={`vedic-${rIdx}-${num}`}
                    className={`aspect-square flex flex-col justify-center items-center rounded-2xl border transition-all duration-700 ${
                      isActive
                        ? 'bg-[#D97706]/10 border-[#D97706]/40 text-[#D97706] shadow-[0_4px_12px_rgba(217,119,6,0.12)]'
                        : 'bg-[#F8F4EF] border-[#E5E7EB] text-slate-300'
                    }`}
                  >
                    <span className="text-2xl font-playfair font-black">{num}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Losho Grid Card */}
        <div className="glass-panel p-8 rounded-[40px] space-y-6 bg-white border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-playfair text-xl font-bold text-[#1F2937] tracking-wider">
              {t('dashboard.loshoGrid', 'Losho Magic Square Grid')}
            </h3>
            <span className="text-[10px] font-mono bg-[#D97706]/10 text-[#D97706] px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold border border-[#D97706]/20">
              {t('dashboard.vibrationalPlanes', 'Vibrational Planes')}
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">
            {t('dashboard.loshoDesc', 'Shows the material, social, and emotional alignments acting in your planetary cosmic charts.')}
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-4">
            {loshoTemplate.map((row, rIdx) =>
              row.map((num) => {
                const isActive = presentNumbers.has(num);
                return (
                  <div
                    key={`losho-${rIdx}-${num}`}
                    className={`aspect-square flex flex-col justify-center items-center rounded-2xl border transition-all duration-700 ${
                      isActive
                        ? 'bg-[#D97706]/10 border-[#D97706]/40 text-[#D97706] shadow-[0_4px_12px_rgba(217,119,6,0.12)]'
                        : 'bg-[#F8F4EF] border-[#E5E7EB] text-slate-300'
                    }`}
                  >
                    <span className="text-2xl font-playfair font-black">{num}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Traits Section */}
      <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm">
        <h3 className="font-playfair text-xl font-bold text-[#1F2937] mb-6 tracking-wide border-b border-[#E5E7EB] pb-3">Planetary Traits Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-sm font-bold text-[#10B981] mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Positive Strengths
            </h4>
            <ul className="space-y-3 text-xs text-[#1F2937] leading-relaxed">
              {nameData.traits.positive.map((t, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-[#10B981] font-mono font-bold">✓</span> <span className="text-slate-700">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#EF4444] mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Frictional Blockages
            </h4>
            <ul className="space-y-3 text-xs text-[#1F2937] leading-relaxed">
              {nameData.traits.negative.map((t, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-[#EF4444] font-mono font-bold">✗</span> <span className="text-slate-700">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#D97706] mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> Top Career Suitability
            </h4>
            <ul className="space-y-3 text-xs text-[#1F2937] leading-relaxed">
              {nameData.traits.careers.map((t, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-[#F59E0B] font-mono font-bold">★</span> <span className="text-slate-700">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Saved Diagnostic Reports Section */}
      <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm">
        <h3 className="font-playfair text-xl font-bold text-[#1F2937] mb-4 tracking-wide border-b border-[#E5E7EB] pb-3">
          Saved Diagnostic Reports
        </h3>
        {savedReports.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No saved reports found. You can save your active session analysis to local storage from the Mobile Diagnostics tab.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedReports.map((report) => (
              <div
                key={report.id}
                className="p-5 border border-slate-200 hover:border-amber-500/30 rounded-3xl bg-slate-50/50 flex flex-col justify-between gap-4 transition duration-300"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-semibold text-slate-900">{report.details.name}</span>
                    <span className="text-[9px] font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600 uppercase">
                      {report.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Mobile: {report.details.mobile}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    DOB: {report.details.dob || "Not Provided"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">
                    Saved: {report.timestamp}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onLoadReport && onLoadReport(report.details)}
                    className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition cursor-pointer text-center"
                  >
                    Load Report
                  </button>
                  <button
                    onClick={() => onDeleteReport && onDeleteReport(report.id)}
                    className="py-2 px-3 text-xs font-bold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer text-center"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AstroDashboard;
