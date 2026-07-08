import React from 'react';
import { remediesAdvice } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { localizedList } from '../services/i18n';

interface RemediesTabProps {
  remedies: remediesAdvice;
}

const RemediesTab: React.FC<RemediesTabProps> = ({ remedies }) => {
  const { lang, t } = useLanguage();

  const translatedColors = localizedList(lang, remedies.colors, remedies.colorsKeys || []);
  const translatedGemstones = localizedList(lang, remedies.gemstones, remedies.gemstonesKeys || []);
  const translatedNameCorrection = t(remedies.nameCorrectionKey || '', remedies.nameCorrection);
  const translatedSignatureAdvice = t(remedies.signatureAdviceKey || '', remedies.signatureAdvice);

  return (
    <div id="remedies-tab-panel" className="space-y-8 animate-in fade-in duration-500 text-left">
      
      {/* Gemstones & Color Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Gemstones */}
        <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex gap-4 items-center">
            <span className="text-3xl">💎</span>
            <div className="space-y-1">
              <h3 className="font-playfair text-xl font-bold text-[#1F2937] tracking-wider">
                {t('remedies.gemstones.title', 'Planetary Gemstone Rituals')}
              </h3>
              <p className="text-[#6B7280] text-xs">
                {t('remedies.gemstones.desc', 'Wear to balance planetary transits effects and stimulate luck.')}
              </p>
            </div>
          </div>
          <div className="space-y-4 pt-2">
            {translatedGemstones.map((gem, idx) => (
              <div key={idx} className="p-4 bg-[#F8F4EF] border border-[#E5E7EB] rounded-2xl flex justify-between items-center text-left">
                <span className="text-sm font-semibold text-[#1F2937]">{gem}</span>
                <span className="text-[10px] font-mono bg-[#D97706]/10 text-[#D97706] px-3 py-1 rounded-full uppercase tracking-wider font-bold border border-[#D97706]/20">
                  {t('remedies.auspicious', 'Auspicious')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex gap-4 items-center">
            <span className="text-3xl">🎨</span>
            <div className="space-y-1">
              <h3 className="font-playfair text-xl font-bold text-[#1F2937] tracking-wider">
                {t('remedies.colors.title', 'Aura Balance Colors')}
              </h3>
              <p className="text-[#6B7280] text-xs">
                {t('remedies.colors.desc', 'Incorporate in wardrobe to stabilize personal year vibrations.')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {translatedColors.map((color, idx) => (
              <div key={idx} className="p-4 bg-[#F8F4EF] border border-[#E5E7EB] rounded-2xl text-center">
                <span className="text-xs text-[#1F2937] font-semibold block">{color}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Signature & Name Guidelines */}
      <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm space-y-6">
        <h3 className="font-playfair text-xl font-bold text-[#1F2937] tracking-wider">
          {t('remedies.audit.title', 'Vedic Name Correction & Signature Audit')}
        </h3>
        <p className="text-[#6B7280] text-xs">
          {t('remedies.audit.desc', 'Subtle changes in name spelling and daily handwriting signups change how you reflect energy to external portals.')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-[#D97706] tracking-widest block font-bold">
              {t('remedies.signature.label', 'Signature Suggestion')}
            </span>
            <p className="text-slate-700 text-sm leading-relaxed italic">"{translatedSignatureAdvice}"</p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-[#D97706] tracking-widest block font-bold">
              {t('remedies.nameCorrection.label', 'Auspicious Name Direction')}
            </span>
            <p className="text-slate-700 text-sm leading-relaxed italic">"{translatedNameCorrection}"</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RemediesTab;
