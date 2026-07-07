import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { motion } from 'motion/react';
import { 
  computeLoshuAnalysis, 
  performLoshuCompatibility, 
  LoshuAnalysisResult, 
  LoshuGridBox, 
  CompatibilityAnalysisResult,
  calculateLoShuGrid
} from '../services/loshuEngine';
import {
  computeLoshuMasterReport,
  LoshuMasterReport,
  CombinationResult,
  ArrowMasterResult
} from '../services/loshuMasterEngine';
import { generateCompleteNumerologyProfile } from '../core';
import { 
  Calendar, User, Compass, HelpCircle, Sparkles, RefreshCw, Star, 
  Trash2, Heart, Shield, BookOpen, Layers, Award, FileText, Download, 
  Check, AlertCircle, Eye, Info, ShieldCheck, ArrowRight, CheckCircle, Flame, Droplet, Trees, Hammer, Landmark, Printer, Phone, TrendingUp, Activity
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const PLANETARY_REPETITION_MEANINGS: Record<number, Record<number, string>> = {
  1: {
    2: "Double 1s (Sun) signify a highly balanced communicator, diplomatic, possessing outstanding self-expression and a confident speaking style.",
    3: "Triple 1s (Sun) indicate a highly talkative, vocal nature but prone to emotional outbursts, speaking secrets or struggling to express depth.",
    4: "Quadruple 1s (Sun) indicate extreme ego congestion, high stubbornness, and major difficulties aligning in public compromise."
  },
  2: {
    2: "Double 2s (Moon) indicate heightened intuition, but can trigger sudden emotional sensitivity, mood escalations, and deep anxiety.",
    3: "Triple 2s (Moon) indicate hyper-sensitivity and fragile boundaries, taking feedback too personally and experiencing emotional volatility.",
    4: "Quadruple 2s (Moon) indicate major mood slides, anxiety loops, unstable relationships, and high psychic overload."
  },
  3: {
    2: "Double 3s (Jupiter) indicate superlative intelligence, excellent creative planning skills, and a sharp researching mind.",
    3: "Triple 3s (Jupiter) indicate an overly academic or theoretical focus, disconnected from practical reality, and a tendency to over-talk.",
    4: "Quadruple 3s (Jupiter) indicate high intellectual vanity, rejecting established advice, and facing frequent project restarts."
  },
  4: {
    2: "Double 4s (Rahu) indicate an obsessively meticulous planner who gets lost in micro-details, making them difficult to satisfy.",
    3: "Triple 4s (Rahu) indicate an extreme workaholic nature with high physical stamina, but a severe lack of personal leisure or social joy.",
    4: "Quadruple 4s (Rahu) indicate OCD-like traits, intense stubbornness, and frequent friction with legal or administrative authorities."
  },
  5: {
    2: "Double 5s (Mercury) indicate massive commercial confidence, swift mathematical decision-making, and high success in trade structures.",
    3: "Triple 5s (Mercury) indicate extravagant risk-taking behavior, erratic spending, and an unstable, restless domestic routine.",
    4: "Quadruple 5s (Mercury) indicate extreme nervous fatigue, losing money in rapid speculative bubbles, and high verbal volatility."
  },
  6: {
    2: "Double 6s (Venus) indicate superlative design skills, highly protective family values, and a strong pursuit of luxury comforts.",
    3: "Triple 6s (Venus) indicate getting entangled in domestic responsibilities or heavy luxury debts, causing emotional stress.",
    4: "Quadruple 6s (Venus) indicate excess indulgence, severe delays in marital/partnership alignments, and family separations."
  },
  7: {
    2: "Double 7s (Ketu) indicate a highly analytical mind, but one prone to frequent betrayals from close associates or partners.",
    3: "Triple 7s (Ketu) indicate undergoing major emotional setbacks or losses in career or relationships, often prompting deep spiritual transformations.",
    4: "Quadruple 7s (Ketu) indicate severe self-isolation, absolute solitary thinking, and a complete distrust of the external world."
  },
  8: {
    2: "Double 8s (Saturn) indicate strong planning abilities but slow material realization, bringing heavy burdens and responsibilities.",
    3: "Triple 8s (Saturn) indicate massive volatility in fortunes, alternating between high wealth and sudden material blockages.",
    4: "Quadruple 8s (Saturn) indicate a severely laborious path, legal delays, and immense struggles before final, profound wisdom is earned."
  },
  9: {
    2: "Double 9s (Mars) indicate an aggressive competitor, highly energetic, with extremely quick verbal and physical reflexes.",
    3: "Triple 9s (Mars) indicate intense temper outbreaks, high impatience, and risks of physical injuries or sudden burnout.",
    4: "Quadruple 9s (Mars) indicate extreme inner volatility, impulsive actions, and direct clashes with authority figures."
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
};

interface CompleteLoshuGridAnalysisProps {
  initialProfile?: { name: string; dob: string; gender?: string } | null;
}

export const CompleteLoshuGridAnalysis: React.FC<CompleteLoshuGridAnalysisProps> = ({ initialProfile }) => {
  const { lang } = useLanguage();
  // Main states
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [analysisResult, setAnalysisResult] = useState<LoshuAnalysisResult | null>(null);
  const [masterReport, setMasterReport] = useState<LoshuMasterReport | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [calcDob, setCalcDob] = useState('05-08-1983');
  
  // Tab control inside Loshu Analysis
  const [activeSubTab, setActiveSubTab] = useState<'MASTER_CONSULTATION' | 'IN_DEPTH_REPORT' | 'GRID' | 'PLANES' | 'REMEDIES' | 'PERIODS' | 'COMPATIBILITY' | 'AI_REPORT' | 'HISTORY'>('MASTER_CONSULTATION');
  
  // History list
  const [history, setHistory] = useState<{ id: string; name: string; dob: string; date: string }[]>([]);
  
  // Compatibility subform
  const [partnerName, setPartnerName] = useState('');
  const [partnerDob, setPartnerDob] = useState('');
  const [partnerResult, setPartnerResult] = useState<CompatibilityAnalysisResult | null>(null);
  
  // AI report states
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [showRawJSON, setShowRawJSON] = useState(false);

  // Selected Grid box for interactive detail drawer
  const [selectedBoxDigit, setSelectedBoxDigit] = useState<number | null>(5);

  // Load history & initial profile values on mount
  useEffect(() => {
    const saved = localStorage.getItem('leo_loshu_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    if (initialProfile?.dob) {
      setName(initialProfile.name);
      setDob(initialProfile.dob);
      const incomingGender = (initialProfile.gender === 'FEMALE' || initialProfile.gender === 'OTHER') ? initialProfile.gender : 'MALE';
      setGender(incomingGender);
      
      const analysis = computeLoshuAnalysis(initialProfile.dob, initialProfile.name, incomingGender);
      setAnalysisResult(analysis);

      // Consume from the unified Core Engine
      const profile = generateCompleteNumerologyProfile({
        dob: initialProfile.dob,
        name: initialProfile.name,
        mobile: mobileNumber,
        gender: incomingGender
      });
      const master = computeLoshuMasterReport(initialProfile.dob, initialProfile.name, incomingGender, mobileNumber);
      setMasterReport(master);
    }
  }, [initialProfile]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) return;
    
    const finalName = name.trim() || 'Fate seeker';
    const analysis = computeLoshuAnalysis(dob, finalName, gender);
    setAnalysisResult(analysis);

    // Consume from the unified Core Engine
    const profile = generateCompleteNumerologyProfile({
      dob,
      name: finalName,
      mobile: mobileNumber,
      gender
    });
    const master = computeLoshuMasterReport(dob, finalName, gender, mobileNumber);
    setMasterReport(master);
    
    // Save to history list
    const newHistoryItem = {
      id: Date.now().toString(),
      name: finalName,
      dob,
      date: new Date().toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedHistory = [newHistoryItem, ...history.filter(h => h.dob !== dob)].slice(0, 8);
    setHistory(updatedHistory);
    localStorage.setItem('leo_loshu_history', JSON.stringify(updatedHistory));
    
    // Reset secondary operations
    setPartnerResult(null);
    setPartnerName('');
    setPartnerDob('');
    setAiReport('');
    setSelectedBoxDigit(5); // default center
  };

  const handleLoadHistoryItem = (item: { name: string; dob: string }) => {
    setName(item.name);
    setDob(item.dob);
    const analysis = computeLoshuAnalysis(item.dob, item.name, gender);
    setAnalysisResult(analysis);
    
    // Consume from the unified Core Engine
    const profile = generateCompleteNumerologyProfile({
      dob: item.dob,
      name: item.name,
      mobile: mobileNumber,
      gender
    });
    const master = computeLoshuMasterReport(item.dob, item.name, gender, mobileNumber);
    setMasterReport(master);

    setPartnerResult(null);
    setAiReport('');
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('leo_loshu_history', JSON.stringify(updated));
  };

  const handleCalculateCompatibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisResult || !partnerDob) return;
    
    const pResult = performLoshuCompatibility(
      analysisResult.personalDetails.dob,
      analysisResult.personalDetails.name,
      partnerDob,
      partnerName || 'Partner'
    );
    setPartnerResult(pResult);
  };

  const handleGenerateAIReport = async () => {
    if (!analysisResult) return;
    setLoadingReport(true);
    setReportError('');
    setAiReport('');
    
    try {
      const response = await fetch('/api/loshu-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalDetails: analysisResult.personalDetails,
          mulank: analysisResult.mulank,
          bhagyank: analysisResult.bhagyank,
          loshuGrid: analysisResult.loshuGrid,
          missingNumbers: analysisResult.missingNumbers,
          strengthArrows: analysisResult.strengthArrows,
          weaknessArrows: analysisResult.weaknessArrows,
          personalYear: analysisResult.personalYear,
          currentMahadasha: analysisResult.currentMahadasha,
          currentAntardasha: analysisResult.currentAntardasha,
          language: lang
        })
      });
      
      const data = await response.json();
      if (data.report) {
        setAiReport(data.report);
      } else {
        setReportError(data.error || 'आकाशीय विसंगति: रिपोर्ट जनरेट नहीं हो सकी।');
      }
    } catch (e) {
      console.error(e);
      setReportError('सर्वर से संपर्क विफल रहा। कृपया आवश्यक सेटिंग्स में अपनी GEMINI_API_KEY जांचें।');
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  // Grid background colors by element
  const getBoxElementStyle = (element: string, count: number) => {
    if (count === 0) return 'bg-[#FDFCF7]/40 text-[#CBD5E1] border-slate-200 border-dashed';
    
    switch (element.toLowerCase()) {
      case 'water':
        return 'bg-blue-50/90 text-blue-800 border-blue-200 shadow-md shadow-blue-50';
      case 'wood':
        return 'bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-md shadow-emerald-50';
      case 'earth':
        return 'bg-amber-50/90 text-amber-800 border-amber-200 shadow-md shadow-amber-50';
      case 'metal':
        return 'bg-slate-100/90 text-slate-800 border-slate-300 shadow-md shadow-slate-100';
      case 'fire':
        return 'bg-red-50/90 text-red-800 border-red-200 shadow-md shadow-red-50';
      default:
        return 'bg-white text-slate-800 border-[#E5E7EB]';
    }
  };

  const getElementBadge = (element: string) => {
    switch (element.toLowerCase()) {
      case 'water': return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold"><Droplet className="w-2.5 h-2.5" /> Water (जल)</span>;
      case 'wood': return <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold"><Trees className="w-2.5 h-2.5" /> Wood (काष्ठ)</span>;
      case 'earth': return <span className="flex items-center gap-1 bg-amber-100 text-[#B45309] px-2 py-0.5 rounded text-[10px] font-bold"><Landmark className="w-2.5 h-2.5" /> Earth (भूमि)</span>;
      case 'metal': return <span className="flex items-center gap-1 bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold"><Hammer className="w-2.5 h-2.5" /> Metal (धातु)</span>;
      case 'fire': return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold"><Flame className="w-2.5 h-2.5" /> Fire (अग्नि)</span>;
      default: return null;
    }
  };

  // Order of standard Loshu representation: Row 1 (4,9,2), Row 2 (3,5,7), Row 3 (8,1,6)
  const loshuGridOrder = [4, 9, 2, 3, 5, 7, 8, 1, 6];

  return (
    <div id="complete-loshu-portal" className="space-y-10 text-left print:p-0">
      
      {/* SECTION 1: HEADER SECTION */}
      <div className="bg-white p-8 rounded-[40px] border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-gradient-to-r from-white via-[#FDFCF7] to-[#FDFCF7] print:border-none print:shadow-none print:bg-none">
        <div className="absolute top-0 right-0 w-[180px] h-[180px] opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#D97706] rotate-12">
            <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1" />
            <line x1="10" y1="36.6" x2="90" y2="36.6" stroke="currentColor" strokeWidth="1" />
            <line x1="10" y1="63.3" x2="90" y2="63.3" stroke="currentColor" strokeWidth="1" />
            <line x1="36.6" y1="10" x2="36.6" y2="90" stroke="currentColor" strokeWidth="1" />
            <line x1="63.3" y1="10" x2="63.3" y2="90" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-[#D97706]/10 text-[#D97706] px-3.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold border border-[#D97706]/20">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" /> Complete Vedic Magic Matrix
          </div>
          <h2 className="font-cinzel text-3xl md:text-4xl font-extrabold text-[#1F2937] tracking-wider uppercase leading-tight">
            Complete Loshu Grid Analysis & Remedial Altar
          </h2>
          <p className="text-[#6B7280] text-xs md:text-sm leading-relaxed font-lora italic pt-1">
            Map your Date of Birth onto the ancient 3x3 magic square. Decode psychic (Mulank) and conductor (Bhagyank) numbers, strength and weakness planes, active dasha cycles, and customized Lal Kitab remedies.
          </p>
        </div>

        <button 
          onClick={handlePrint}
          className="bg-[#1F2937] hover:bg-[#111827] text-white px-5 py-3 rounded-2xl text-xs font-bold tracking-wider uppercase transition shadow-md flex items-center gap-2 cursor-pointer border border-[#E5E7EB]/10 border-t-white/10"
        >
          <Printer className="w-4 h-4" /> Print / Export PDF
        </button>
      </div>

      {/* SECTION 2: STANDALONE DATE OF BIRTH LOGIC PANEL */}
      <div className="glass-panel p-8 md:p-10 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm relative overflow-hidden border-l-4 border-l-[#D97706] print:hidden">
        <div className="absolute top-1/2 right-12 text-5xl opacity-5 pointer-events-none select-none font-serif">☯️</div>
        
        <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-10">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-[10px] font-mono uppercase text-slate-500 tracking-widest font-bold">Subject's Full Name (for sound vibrations)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Raajeev Singh Chauhann"
                className="w-full bg-[#F8F4EF] border border-[#E5E7EB] focus:border-[#D97706] focus:bg-white transition-all rounded-2xl pl-12 pr-5 py-4 outline-none text-sm text-[#1F2937] font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-mono uppercase text-[#D97706] tracking-widest font-bold">Select Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D97706]/70" />
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full bg-[#F8F4EF] border border-[#E5E7EB] focus:border-[#D97706] focus:bg-white transition-all rounded-2xl pl-12 pr-4 py-4 outline-none text-sm text-[#1F2937] font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold py-4 rounded-2xl transition duration-300 text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-white hover:rotate-12 transition-transform" /> Cast Loshu Blueprint
          </button>
        </form>

        {/* Quick history selector */}
        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-[#E5E7EB]">
            <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider font-bold">Recent Blueprints: </span>
            {history.map((h) => (
              <div
                key={h.id}
                onClick={() => handleLoadHistoryItem(h)}
                className="inline-flex items-center gap-1.5 bg-[#F8F4EF] hover:bg-[#F2E8DC] text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer border border-[#E5E7EB]/60 group text-[#1F2937]"
              >
                <span>{h.name} ({h.dob})</span>
                <button
                  onClick={(e) => handleDeleteHistoryItem(h.id, e)}
                  className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                  title="Remove from logs"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {analysisResult ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          
          {/* SECTION 3: KEY METRICS ROW (MULANK & BHAGYANK CARDS) */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            
            {/* Mulank (Driver) Card */}
            <motion.div 
              variants={itemVariants}
              className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm flex flex-col justify-between gap-4 border-t-4 border-t-[#D97706]"
            >
              <div className="flex items-start justify-between w-full gap-4">
                <div className="space-y-2 text-left">
                  <span className="text-[9px] font-mono uppercase bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20 px-2.5 py-0.5 rounded-full font-bold">Psychic / Driver Number</span>
                  <h3 className="font-playfair text-2xl font-black text-[#1F2937]">मूलांक #{analysisResult.mulank}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                    Governs raw talent, personality traits, and default mental attributes. Triggers how you approach immediate decisions.
                  </p>
                </div>
                <div className="w-16 h-16 shrink-0 rounded-full bg-[#FDFCF7] border-2 border-[#D97706]/20 text-[#D97706] font-playfair font-black text-3xl flex items-center justify-center shadow-inner">
                  {analysisResult.mulank}
                </div>
              </div>
              {analysisResult.chaldeanMulank && (
                <div className="pt-3 border-t border-slate-100 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#D97706] font-bold">
                    <span>Chaldean Rank #{analysisResult.chaldeanMulank.compound}</span>
                    <span>•</span>
                    <span>{analysisResult.chaldeanMulank.ruler}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-800">{analysisResult.chaldeanMulank.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    {analysisResult.chaldeanMulank.description}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Bhagyank (Conductor) Card */}
            <motion.div 
              variants={itemVariants}
              className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm flex flex-col justify-between gap-4 border-t-4 border-t-[#1E3A8A]"
            >
              <div className="flex items-start justify-between w-full gap-4">
                <div className="space-y-2 text-left">
                  <span className="text-[9px] font-mono uppercase bg-blue-50 text-[#1E3A8A] border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">Conductor Number (Bhagyank)</span>
                  <h3 className="font-playfair text-2xl font-black text-[#1F2937]">भाग्यांक #{analysisResult.bhagyank}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                    Governs life purpose, core destiny, career achievements, and major planetary direction changes.
                  </p>
                </div>
                <div className="w-16 h-16 shrink-0 rounded-full bg-blue-50/50 border-2 border-blue-200 text-[#1E3A8A] font-playfair font-black text-3xl flex items-center justify-center shadow-inner">
                  {analysisResult.bhagyank}
                </div>
              </div>
              {analysisResult.chaldeanBhagyank && (
                <div className="pt-3 border-t border-slate-100 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#1E3A8A] font-bold">
                    <span>Chaldean Rank #{analysisResult.chaldeanBhagyank.compound}</span>
                    <span>•</span>
                    <span>{analysisResult.chaldeanBhagyank.ruler}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-800">{analysisResult.chaldeanBhagyank.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    {analysisResult.chaldeanBhagyank.description}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Personal Year Card */}
            <motion.div 
              variants={itemVariants}
              className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm flex items-center justify-between gap-6 border-t-4 border-t-emerald-600"
            >
              <div className="space-y-2 text-left">
                <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">Active Year Influence</span>
                <h3 className="font-playfair text-2xl font-black text-[#1F2937]">व्यक्तिगत वर्ष #{analysisResult.personalYear.number}</h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                  Current personal year vibration. Focus: {analysisResult.personalYear.title.split(':')[0]}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-playfair font-black text-3xl flex items-center justify-center shadow-inner">
                {analysisResult.personalYear.number}
              </div>
            </motion.div>

          </motion.div>

          {/* SECTION 4: SUBTAB MENU */}
          <div className="border-b border-[#E5E7EB] pt-2 flex flex-wrap gap-2 print:hidden">
            {[
              { id: 'MASTER_CONSULTATION', label: 'Master Consultation 5.0 🏆' },
              { id: 'IN_DEPTH_REPORT', label: 'In-Depth Loshu Report 📑' },
              { id: 'GRID', label: 'Loshu Magic Grid' },
              { id: 'PLANES', label: 'Planes & Arrows' },
              { id: 'REMEDIES', label: 'Lal Kitab remedies' },
              { id: 'PERIODS', label: 'Mahadasha Lifespan' },
              { id: 'COMPATIBILITY', label: 'Grid Compatibility' },
              { id: 'AI_REPORT', label: 'Astro-Guru AI Report' },
              { id: 'HISTORY', label: 'Developer JSON Integration' }
            ].map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => {
                  setActiveSubTab(subTab.id as any);
                  setPartnerResult(null); // Clear compatibility result on tab switch
                }}
                className={`px-5 py-3.5 rounded-t-2xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === subTab.id
                    ? 'bg-white border-x border-t border-[#E5E7EB] text-[#D97706] shadow-sm -mb-px z-10'
                    : 'text-[#6B7280] hover:text-[#1F2937] bg-transparent'
                }`}
              >
                {subTab.id === 'MASTER_CONSULTATION' && <Award className="w-4 h-4 text-[#D97706] animate-pulse" />}
                {subTab.id === 'IN_DEPTH_REPORT' && <FileText className="w-4 h-4 text-emerald-600 animate-pulse" />}
                {subTab.id === 'GRID' && <Compass className="w-4 h-4" />}
                {subTab.id === 'PLANES' && <Layers className="w-4 h-4" />}
                {subTab.id === 'REMEDIES' && <Shield className="w-4 h-4" />}
                {subTab.id === 'PERIODS' && <Star className="w-4 h-4 animate-pulse text-[#D97706]" />}
                {subTab.id === 'COMPATIBILITY' && <Heart className="w-4 h-4" />}
                {subTab.id === 'AI_REPORT' && <Sparkles className="w-4 h-4 text-amber-500" />}
                {subTab.id === 'HISTORY' && <FileText className="w-4 h-4" />}
                <span>{subTab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB AREA STAGE */}

          {/* TAB 0: MASTER CONSULTATION SYSTEM 5.0 */}
          {activeSubTab === 'MASTER_CONSULTATION' && masterReport && (
            <div className="space-y-12 animate-in fade-in duration-500 text-left print:p-0">
              
              {/* Premium Consultation Overview Banner */}
              <div className="bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#030712] text-white p-8 md:p-10 rounded-[40px] border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/30 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
                      ★ GRAND MASTER CONSULTATION ARCHITECTURE v5.0
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
                      ● EXPERT DIAGNOSTICS ACTIVE
                    </span>
                  </div>
                  <h3 className="font-cinzel text-3xl md:text-5xl font-black tracking-widest text-[#FDFCF7] uppercase leading-tight">
                    Professional Numerology Consultation Map
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm font-lora italic leading-relaxed max-w-3xl pt-1">
                    Welcome to your ultimate 19-Dimensional Astrological blueprint. Built upon ancient Lo Shu grids, Chaldean vibration mathematics, and traditional Ayurvedic Dosha wellness parameters. Complete with Lal Kitab action guides.
                  </p>
                  
                  {/* Dynamic Subject Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Consultation Subject</span>
                      <p className="text-sm font-bold text-white font-sans">{masterReport.personal.name}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Cosmic Driver</span>
                      <p className="text-sm font-bold text-[#F59E0B] font-sans"># {masterReport.personal.driver} (मूलांक)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Cosmic Conductor</span>
                      <p className="text-sm font-bold text-blue-400 font-sans"># {masterReport.personal.conductor} (भाग्यांक)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Aura Archetype</span>
                      <p className="text-sm font-bold text-emerald-400 font-sans">{masterReport.archetype.title}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK NAV BAR */}
              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-3xl flex flex-wrap gap-2 text-xs font-semibold text-slate-700 print:hidden items-center">
                <span className="font-mono text-[10px] uppercase text-[#D97706] px-2 font-bold select-none">Quick Jump:</span>
                <a href="#master-sec-scores" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition">1. Scores</a>
                <a href="#master-sec-grid" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition">2. Complete Grid</a>
                <a href="#master-sec-combs" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition">3. Pairs</a>
                <a href="#master-sec-profile" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition">4. Profile</a>
                <a href="#master-[#master-sec-relations]" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition" onClick={(e) => { e.preventDefault(); document.getElementById('master-sec-relations')?.scrollIntoView({ behavior: 'smooth' }); }}>5. Love & Karma</a>
                <a href="#master-[#master-sec-wealth]" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition" onClick={(e) => { e.preventDefault(); document.getElementById('master-sec-wealth')?.scrollIntoView({ behavior: 'smooth' }); }}>6. Money & Careers</a>
                <a href="#master-[#master-sec-karmic]" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition" onClick={(e) => { e.preventDefault(); document.getElementById('master-sec-karmic')?.scrollIntoView({ behavior: 'smooth' }); }}>7. Karmic Lessons</a>
                <a href="#master-[#master-sec-fusions]" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition" onClick={(e) => { e.preventDefault(); document.getElementById('master-sec-fusions')?.scrollIntoView({ behavior: 'smooth' }); }}>8. Mobile & Vastu</a>
                <a href="#master-[#master-sec-health]" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition" onClick={(e) => { e.preventDefault(); document.getElementById('master-sec-health')?.scrollIntoView({ behavior: 'smooth' }); }}>9. Health & Year</a>
                <a href="#master-[#master-sec-remedies]" className="hover:text-[#D97706] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl transition" onClick={(e) => { e.preventDefault(); document.getElementById('master-sec-remedies')?.scrollIntoView({ behavior: 'smooth' }); }}>10. Remedies</a>
              </div>

              {/* SECTION 1: LOSHU SUMMARY DASHBOARD */}
              <div id="master-sec-scores" className="space-y-6 scroll-mt-6">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-mono font-bold text-xs">01</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-800 uppercase tracking-widest">Lo Shu Summary Dashboard</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries({
                    "Mental Strength Score": { val: masterReport.scores.mentalStrength, field: 'mentalStrength', c: 'border-t-purple-600 bg-purple-50/10' },
                    "Emotional Strength Score": { val: masterReport.scores.emotionalStrength, field: 'emotionalStrength', c: 'border-t-rose-600 bg-rose-50/10' },
                    "Practical Strength Score": { val: masterReport.scores.practicalStrength, field: 'practicalStrength', c: 'border-t-indigo-600 bg-indigo-50/10' },
                    "Leadership Score": { val: masterReport.scores.leadershipScore, field: 'leadershipScore', c: 'border-t-amber-600 bg-amber-50/10' },
                    "Communication Score": { val: masterReport.scores.communicationScore, field: 'communicationScore', c: 'border-t-teal-600 bg-teal-50/10' },
                    "Spiritual Score": { val: masterReport.scores.spiritualScore, field: 'spiritualScore', c: 'border-t-violet-600 bg-violet-50/10' },
                    "Relationship Score": { val: masterReport.scores.relationshipScore, field: 'relationshipScore', c: 'border-t-pink-600 bg-pink-50/10' },
                    "Career Potential Score": { val: masterReport.scores.careerPotentialScore, field: 'careerPotentialScore', c: 'border-t-blue-600 bg-blue-50/10' },
                    "Overall Lo Shu Score": { val: masterReport.scores.overallLoshuScore, field: 'overallLoshuScore', c: 'border-t-[#D97706] bg-amber-50/20' }
                  }).map(([title, item]) => (
                    <div key={title} className={`p-6 rounded-[30px] border border-slate-200 shadow-sm border-t-4 flex flex-col justify-between gap-4 ${item.c}`}>
                      <div className="space-y-1.5 text-left">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{title}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-playfair font-black text-slate-800">{item.val}</span>
                          <span className="text-[10px] font-mono text-slate-400">/ 100</span>
                        </div>
                      </div>
                      
                      {/* Visual score bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-current h-2 rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${item.val}%`, 
                            color: item.field === 'overallLoshuScore' ? '#D97706' : '#4B5563' 
                          }} 
                        />
                      </div>
                      
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans mt-1">
                        {masterReport.scores.reasons[item.field]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: COMPLETE GRID ANALYSIS */}
              <div id="master-sec-grid" className="glass-panel p-8 md:p-10 rounded-[40px] bg-white border border-[#E5E7EB] shadow-sm space-y-8 scroll-mt-6">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-mono font-bold text-xs">02</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-800 uppercase tracking-widest">Complete Grid Parameters</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Specs List */}
                  <div className="space-y-6 text-left text-xs leading-relaxed text-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-wider block font-bold">Present Numbers</span>
                        <p className="text-lg font-black text-slate-800 mt-1">{masterReport.gridAnalysis.present.join(', ') || 'None'}</p>
                        <p className="text-[10px] text-slate-400">Your core elemental configurations.</p>
                      </div>
                      <div className="p-4 bg-red-50/30 border border-red-200/50 rounded-2xl">
                        <span className="text-[10px] font-mono text-red-600 uppercase tracking-wider block font-bold">Missing Numbers</span>
                        <p className="text-lg font-black text-red-800 mt-1">{masterReport.gridAnalysis.missing.join(', ') || 'None'}</p>
                        <p className="text-[10px] text-slate-400">Nodes needing active remediation.</p>
                      </div>
                    </div>

                    <div className="p-5 bg-[#FBD784]/10 border border-[#D97706]/10 rounded-3xl space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-widest text-[#D97706]">Ruler Influence Audits</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Most Influential Number:</span>
                          <span className="font-bold text-slate-800 ml-2">Digit #{masterReport.gridAnalysis.mostInfluential.digit}</span>
                          <p className="text-[10px] text-slate-500">{masterReport.gridAnalysis.mostInfluential.reason}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-200/50">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Least Influential Number:</span>
                          <span className="font-bold text-slate-800 ml-2">Digit #{masterReport.gridAnalysis.leastInfluential.digit}</span>
                          <p className="text-[10px] text-slate-500">{masterReport.gridAnalysis.leastInfluential.reason}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Life Theme Number (Conductor Root):</span>
                        <p className="text-sm font-black text-slate-800 mt-1"># {masterReport.gridAnalysis.lifeThemeNum}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">"{masterReport.gridAnalysis.lifeThemeText}"</p>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Core Personality Orientation:</span>
                        <p className="text-sm font-black text-slate-800 mt-1"># {masterReport.gridAnalysis.corePersonalityNum}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">"{masterReport.gridAnalysis.corePersonalityText}"</p>
                      </div>
                    </div>

                  </div>

                  {/* Right: Grid Representation & Repeated Values meanings */}
                  <div className="space-y-6">
                    <div className="p-6 bg-[#FDFCF7] border border-amber-200/80 rounded-[35px] space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-widest text-center text-[#D97706]">Repetitive Vibration Intensity</h4>
                      
                      {masterReport.gridAnalysis.repeated.length > 0 ? (
                        <div className="space-y-4 text-left">
                          {masterReport.gridAnalysis.repeated.map(rep => (
                            <div key={rep.digit} className="p-3 bg-white border border-slate-200 rounded-2xl flex gap-3.5 items-start">
                              <div className="w-9 h-9 shrink-0 rounded-full bg-amber-500/10 text-[#D97706] font-mono font-black text-sm flex items-center justify-center border border-amber-500/20">
                                {rep.digit}
                              </div>
                              <div className="space-y-0.5 text-xs">
                                <span className="font-bold text-slate-800">Digit {rep.digit} active x{rep.count} times</span>
                                <p className="text-slate-500 leading-relaxed text-[11px]">
                                  {PLANETARY_REPETITION_MEANINGS[rep.digit]?.[Math.min(rep.count, 4)] || "Generates intense element accumulation inside the specific grid sector."}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">No repetitive digits present. Your elements align harmoniously without congestion.</p>
                      )}
                    </div>
                  </div>

                  {/* Dedicated calculateLoShuGrid Section */}
                  <div className="col-span-1 md:col-span-2 pt-8 border-t border-[#E5E7EB] mt-4 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="text-left space-y-1">
                        <h5 className="font-cinzel text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 fill-[#D97706]/20 text-[#D97706]" />
                          Standard Lo Shu Grid Calculator Engine (`calculateLoShuGrid`)
                        </h5>
                        <p className="text-[11px] text-slate-500 max-w-2xl leading-relaxed">
                          A pristine mathematical implementation that extracts digits from birth dates, filters out zeros and derived numbers, but ensures the <strong>Conductor (Bhagyank)</strong> number is fully included inside the birth grid.
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCalcDob('05-08-1983')}
                          className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-[#D97706] font-mono text-[10px] font-bold rounded-xl transition cursor-pointer"
                        >
                          Reset to 05-08-1983
                        </button>
                        <button
                          type="button"
                          disabled={!dob}
                          onClick={() => {
                            if (dob) {
                              setCalcDob(dob);
                            }
                          }}
                          className={`px-3 py-1.5 border font-mono text-[10px] font-bold rounded-xl transition ${
                            dob 
                              ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700 cursor-pointer' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Use Main DOB
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 border border-slate-100 p-6 rounded-3xl items-stretch">
                      
                      {/* Left calculation parameters */}
                      <div className="lg:col-span-4 space-y-4 text-left flex flex-col justify-center">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Query DOB String</span>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={calcDob}
                              onChange={(e) => setCalcDob(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D97706] focus:border-[#D97706]"
                              placeholder="DD-MM-YYYY or YYYY-MM-DD"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                          <div className="flex justify-between">
                            <span>Extracted ISO Format:</span>
                            <span className="font-bold text-slate-800">{calculateLoShuGrid(calcDob).yyyymmdd}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Conductor (Bhagyank):</span>
                            <span className="font-bold text-[#D97706] bg-[#D97706]/10 px-1.5 py-0.5 rounded">
                              #{calculateLoShuGrid(calcDob).conductor}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right calculation display */}
                      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Present Numbers */}
                        <div className="p-4 bg-white border border-slate-200/60 rounded-2xl flex flex-col justify-between text-left">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider block font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              Present Digits Array (Present)
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                              Unique DOB digits and Conductor (excluding zeros and intermediate derived numbers).
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {calculateLoShuGrid(calcDob).present.map((num) => (
                              <div
                                key={num}
                                className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 font-mono font-black text-xs flex items-center gap-1"
                              >
                                {num}
                                <span className="text-[9px] font-normal text-emerald-500">
                                  ({num === 1 ? 'Sun' : num === 2 ? 'Moon' : num === 3 ? 'Jup' : num === 4 ? 'Rah' : num === 5 ? 'Mer' : num === 6 ? 'Ven' : num === 7 ? 'Ket' : num === 8 ? 'Sat' : 'Mar'})
                                </span>
                              </div>
                            ))}
                            {calculateLoShuGrid(calcDob).present.length === 0 && (
                              <span className="text-xs text-slate-400 italic">None</span>
                            )}
                          </div>
                        </div>

                        {/* Missing Numbers */}
                        <div className="p-4 bg-white border border-slate-200/60 rounded-2xl flex flex-col justify-between text-left">
                          <div>
                            <span className="text-[10px] font-mono text-red-500 uppercase tracking-wider block font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                              Missing Digits Array (Missing)
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                              Excluded cosmic nodes. Needs active remedial elements in respective vaastu zones.
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {calculateLoShuGrid(calcDob).missing.map((num) => (
                              <div
                                key={num}
                                className="px-2.5 py-1 bg-red-50/50 border border-red-100/50 rounded-lg text-red-700 font-mono font-black text-xs flex items-center gap-1"
                              >
                                {num}
                                <span className="text-[9px] font-normal text-red-400">
                                  ({num === 1 ? 'Sun' : num === 2 ? 'Moon' : num === 3 ? 'Jup' : num === 4 ? 'Rah' : num === 5 ? 'Mer' : num === 6 ? 'Ven' : num === 7 ? 'Ket' : num === 8 ? 'Sat' : 'Mar'})
                                </span>
                              </div>
                            ))}
                            {calculateLoShuGrid(calcDob).missing.length === 0 && (
                              <span className="text-xs text-slate-400 italic">None</span>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 3: 81 COMBINATION ANALYSIS */}
              <div id="master-sec-combs" className="space-y-6 scroll-mt-6">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-mono font-bold text-xs">03</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-800 uppercase tracking-widest">81 Combinations Master Matrix</h4>
                </div>

                <div className="p-5 bg-amber-50/40 border border-amber-200/50 rounded-3xl text-left">
                  <p className="text-xs text-slate-700 leading-relaxed italic font-lora">
                    "Every cosmic blueprint maps complex energy pathways. Below are the key double-digit combinations active inside your specific birth grid, describing the direct impact behind planetary intersections."
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {masterReport.activeCombinations.map((comb, index) => (
                    <div key={comb.code + index} className="p-6 bg-white border border-slate-200 rounded-[35px] shadow-sm space-y-4 text-left border-l-4 border-l-[#D97706]">
                      <div className="flex justify-between items-center gap-4 pb-2 border-b border-slate-100">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Combination Node #{comb.code}</span>
                          <h4 className="text-sm font-black text-slate-800">{comb.name}</h4>
                        </div>
                        <div className="bg-[#D97706]/10 text-[#D97706] font-mono font-black text-lg px-4 py-2 rounded-2xl border border-[#D97706]/20">
                          {comb.code}
                        </div>
                      </div>
                      
                      <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                        <p className="font-medium text-slate-800">{comb.meaning}</p>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <span className="text-[9px] font-mono text-[#D97706] uppercase tracking-wider block font-bold">Strengths</span>
                            <p className="text-[11px] text-slate-600 font-sans mt-0.5">{comb.strength}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-red-600 uppercase tracking-wider block font-bold">Weaknesses</span>
                            <p className="text-[11px] text-slate-600 font-sans mt-0.5">{comb.weakness}</p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-50">
                          <div className="flex justify-between gap-4 text-[11px]">
                            <span className="font-semibold text-slate-700 font-sans">Career Impact:</span>
                            <span className="text-slate-500 font-sans">{comb.careerImpact}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[11px]">
                            <span className="font-semibold text-slate-700 font-sans">Relationships:</span>
                            <span className="text-slate-500 font-sans">{comb.relationshipImpact}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[11px]">
                            <span className="font-semibold text-slate-700 font-sans">Financial Flow:</span>
                            <span className="text-slate-500 font-sans">{comb.financialImpact}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[11px]">
                            <span className="font-semibold text-slate-700 font-sans">Spiritual Influence:</span>
                            <span className="text-slate-500 font-sans">{comb.spiritualImpact}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-[#FDFCF7] border border-[#D97706]/20 rounded-xl mt-2">
                          <span className="text-[9px] font-mono text-[#D97706] uppercase tracking-wider block font-bold mb-0.5">Siddha Remedy</span>
                          <p className="italic text-[#B45309] font-medium leading-relaxed font-sans text-[11px]">"{comb.remedy}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4 & 5: ARCHETYPE & CHARACTER PROFILING */}
              <div id="master-sec-profile" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start scroll-mt-6">
                
                {/* SECTION 4: ARCHETYPE CARD (Left 1 Span) */}
                <div className="bg-gradient-to-b from-[#FFFDF5] to-[#FFF7E3] p-8 rounded-[40px] border border-amber-200/70 shadow-md text-center space-y-6 flex flex-col justify-between h-full border-t-8 border-t-[#D97706]">
                  <div className="space-y-2 relative">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-widest block font-black">YOUR DOMINANT ARCHETYPE</span>
                    <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-4xl shadow-md border-2 border-amber-200">
                      🔮
                    </div>
                    <h3 className="font-cinzel text-2xl font-black text-slate-900 uppercase tracking-widest">{masterReport.archetype.title}</h3>
                    <p className="text-xs text-slate-500 font-lora italic">"{masterReport.archetype.description}"</p>
                  </div>

                  <div className="p-4 bg-white/80 border border-[#D97706]/20 rounded-2xl text-left space-y-2">
                    <span className="text-[9px] font-mono text-[#D97706] uppercase font-bold tracking-widest block">Celestial Logic Mapping</span>
                    <p className="text-xs leading-relaxed text-slate-700 font-sans">{masterReport.archetype.reasoning}</p>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl space-y-2 text-center">
                    <span className="text-[9px] font-mono text-amber-400 uppercase font-bold tracking-widest block">Active Siddha Mantra</span>
                    <p className="text-[11px] font-black tracking-widest text-[#FDFCF7] font-mono">{masterReport.archetype.mantra}</p>
                    <span className="text-[8px] font-mono text-slate-400 block tracking-wider">Chant 27 times face East in the silent hours.</span>
                  </div>
                </div>

                {/* SECTION 5: CHARACTER PROFILING GRID (Right 2 Spans) */}
                <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 text-left">
                  <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100">Subject Psychological Profiling</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                    {[
                      { l: "Thinking Style", d: masterReport.profiling.thinkingStyle },
                      { l: "Decision Making Style", d: masterReport.profiling.decisionMakingStyle },
                      { l: "Communication Style", d: masterReport.profiling.communicationStyle },
                      { l: "Learning Style", d: masterReport.profiling.learningStyle },
                      { l: "Leadership Style", d: masterReport.profiling.leadershipStyle },
                      { l: "Work Style", d: masterReport.profiling.workStyle },
                      { l: "Problem Solving Style", d: masterReport.profiling.problemSolvingStyle },
                      { l: "Stress Response Pattern", d: masterReport.profiling.stressResponsePattern },
                      { l: "Motivation Pattern", d: masterReport.profiling.motivationPattern },
                      { l: "Self Discipline Level", d: masterReport.profiling.selfDisciplineLevel },
                      { l: "Confidence Level", d: masterReport.profiling.confidenceLevel },
                      { l: "Public Image Status", d: masterReport.profiling.publicImage },
                    ].map(prof => (
                      <div key={prof.l} className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl hover:border-amber-200 transition">
                        <span className="text-[10px] font-mono text-[#D97706] uppercase block font-bold mb-1">{prof.l}</span>
                        <p className="text-slate-600 font-sans leading-relaxed text-[11px]">{prof.d}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl block">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase block font-bold mb-1">Recommended Personal Growth Areas</span>
                    <p className="text-xs leading-relaxed text-slate-700 italic font-medium font-sans">"{masterReport.profiling.personalGrowthAreas}"</p>
                  </div>
                </div>

              </div>

              {/* SECTION 6 & 7: RELATIONSHIP BEHAVIOUR & FAMILY KARMA */}
              <div id="master-sec-relations" className="grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-mt-6">
                
                {/* SECTION 6: RELATIONSHIP BEHAVIOUR */}
                <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 text-left border-t-8 border-t-pink-500">
                  <div className="flex gap-2 items-center">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Love & Relationship Psychology</h4>
                  </div>
                  
                  <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-pink-50/20 border border-pink-100 rounded-xl">
                        <span className="text-[10px] font-mono text-pink-600 block uppercase font-bold">Love Language</span>
                        <p className="font-sans leading-relaxed text-[11px] mt-0.5">{masterReport.relationshipBehaviour.loveLanguage}</p>
                      </div>
                      <div className="p-3 bg-pink-50/20 border border-pink-100 rounded-xl">
                        <span className="text-[10px] font-mono text-pink-600 block uppercase font-bold">Emotional Needs</span>
                        <p className="font-sans leading-relaxed text-[11px] mt-0.5">{masterReport.relationshipBehaviour.emotionalNeeds}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <p><strong className="text-slate-800 font-sans">Commitment Style:</strong> {masterReport.relationshipBehaviour.commitmentStyle}</p>
                      <p><strong className="text-slate-800 font-sans">Trust Pattern:</strong> {masterReport.relationshipBehaviour.trustPattern}</p>
                      <p><strong className="text-slate-800 font-sans">Conflict Behaviour:</strong> {masterReport.relationshipBehaviour.conflictBehaviour}</p>
                      <p><strong className="text-slate-800 font-sans">Marriage Expectations:</strong> {masterReport.relationshipBehaviour.marriageExpectations}</p>
                      <p><strong className="text-slate-800 font-sans">Partner Expectations:</strong> {masterReport.relationshipBehaviour.partnerExpectations}</p>
                      <p><strong className="text-slate-800 font-sans">Emotional Compatibility Style:</strong> {masterReport.relationshipBehaviour.emotionalCompatibilityStyle}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <p className="text-slate-800 text-[11px] font-semibold font-sans">Relation Strengths & Challenges</p>
                      <p className="text-[11px] font-sans text-slate-600 leading-relaxed"><strong className="text-emerald-600 font-sans">Strengths:</strong> {masterReport.relationshipBehaviour.strengths}</p>
                      <p className="text-[11px] font-sans text-slate-600 leading-relaxed"><strong className="text-red-500 font-sans">Challenges:</strong> {masterReport.relationshipBehaviour.challenges}</p>
                    </div>

                    <p className="p-3 bg-pink-50/20 border border-pink-200/50 rounded-xl text-pink-700 italic font-medium font-sans text-[11px]">
                      💡 Growth Suggestion: "{masterReport.relationshipBehaviour.growthSuggestions}"
                    </p>
                  </div>
                </div>

                {/* SECTION 7: FAMILY KARMA ANALYSIS */}
                <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 text-left border-t-8 border-t-purple-600">
                  <div className="flex gap-2 items-center">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Generational Family Karma</h4>
                  </div>
                  
                  <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <p><strong className="text-slate-800 font-sans">Father Figure Influence:</strong> {masterReport.familyKarma.fatherInfluence}</p>
                      <p className="pt-2 border-t border-slate-200/60"><strong className="text-slate-800 font-sans">Mother Figure Influence:</strong> {masterReport.familyKarma.motherInfluence}</p>
                    </div>

                    <div className="space-y-2.5">
                      <p><strong className="text-slate-800 font-sans">Ancestral Influence:</strong> {masterReport.familyKarma.ancestralInfluence}</p>
                      <p><strong className="text-slate-800 font-sans">Family Responsibilities:</strong> {masterReport.familyKarma.familyResponsibilities}</p>
                      <p><strong className="text-slate-800 font-sans">Inherited Strengths:</strong> {masterReport.familyKarma.inheritedStrengths}</p>
                      <p><strong className="text-slate-800 font-sans">Inherited Challenges:</strong> {masterReport.familyKarma.inheritedChallenges}</p>
                    </div>

                    <div className="p-4 bg-purple-50/20 border border-purple-200/50 rounded-2xl">
                      <span className="text-[10px] font-mono text-purple-600 uppercase block font-bold mb-1">Family Karma Lessons</span>
                      <p className="italic text-purple-900 leading-relaxed font-sans font-medium text-[11px]">"{masterReport.familyKarma.familyKarmaLessons}"</p>
                    </div>

                    <p className="text-[11px] font-sans text-slate-500 leading-relaxed">
                      <strong>Generational Growth Areas:</strong> {masterReport.familyKarma.generationalGrowthAreas}
                    </p>
                  </div>
                </div>

              </div>

              {/* SECTION 8, 9 & 10: WEALTH PSYCHOLOGY, CAREER BLUEPRINT, HIDDEN TALENTS */}
              <div id="master-sec-wealth" className="space-y-12 scroll-mt-6">
                
                {/* SECTION 8: WEALTH PSYCHOLOGY CARD */}
                <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 text-left border-t-8 border-t-emerald-600">
                  <div className="flex justify-between items-center flex-wrap gap-4 pb-2 border-b border-slate-100">
                    <div className="flex gap-2 items-center">
                      <Landmark className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Wealth Psychology & Mindset Dashboard</h4>
                    </div>
                    <div className="flex gap-3 text-xs font-mono font-bold uppercase">
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                        Wealth Potential: {masterReport.wealthPsychology.wealthPotentialScore}/100
                      </span>
                      <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                        Discipline: {masterReport.wealthPsychology.financialDisciplineScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-600">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-mono text-emerald-600 uppercase font-black tracking-wider block">Money Mindset</span>
                      <p className="font-sans leading-relaxed text-[11px]">{masterReport.wealthPsychology.moneyMindset}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-mono text-emerald-600 uppercase font-black tracking-wider block">Business Mindset Suitability</span>
                      <p className="font-sans leading-relaxed text-[11px]">{masterReport.wealthPsychology.businessMindset}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-mono text-emerald-600 uppercase font-black tracking-wider block">Wealth Creation Style</span>
                      <p className="font-sans leading-relaxed text-[11px]">{masterReport.wealthPsychology.wealthCreationStyle}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                    <p><strong className="text-slate-800 font-sans">Risk Taking Behaviour:</strong> {masterReport.wealthPsychology.riskTakingBehaviour}</p>
                    <p><strong className="text-slate-800 font-sans">Spending Behaviour Patterns:</strong> {masterReport.wealthPsychology.spendingBehaviour}</p>
                    <p><strong className="text-slate-800 font-sans">Saving Behaviour Guidelines:</strong> {masterReport.wealthPsychology.savingBehaviour}</p>
                    <p><strong className="text-slate-800 font-sans">Investment Placements:</strong> {masterReport.wealthPsychology.investmentBehaviour}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-red-50/20 border border-red-200/50 rounded-2xl">
                      <span className="text-[10px] font-mono text-red-600 uppercase block font-bold mb-1">Money Energy Blockages</span>
                      <p className="font-sans leading-relaxed text-[11px] text-slate-700">{masterReport.wealthPsychology.moneyBlockages}</p>
                    </div>
                    <div className="p-4 bg-emerald-50/20 border border-emerald-200/50 rounded-2xl">
                      <span className="text-[10px] font-mono text-emerald-600 uppercase block font-bold mb-1">Financial Energy Remedies</span>
                      <p className="font-sans leading-relaxed text-[11px] text-slate-700">{masterReport.wealthPsychology.financialRemedies}</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 9: CAREER BLUEPRINT CARD */}
                <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8 text-left border-t-8 border-t-blue-600">
                  <div className="flex gap-2 items-center pb-2 border-b border-slate-100">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Cosmic Career Blueprint</h4>
                  </div>

                  {/* Career Suitability Metrics Wheel */}
                  <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 text-center">
                    {Object.entries({
                      "Teaching": masterReport.careerBlueprint.suitabilityScores.teaching,
                      "Technology": masterReport.careerBlueprint.suitabilityScores.technology,
                      "Management": masterReport.careerBlueprint.suitabilityScores.management,
                      "Sales": masterReport.careerBlueprint.suitabilityScores.sales,
                      "Creative": masterReport.careerBlueprint.suitabilityScores.creative,
                      "Spiritual": masterReport.careerBlueprint.suitabilityScores.spiritual,
                      "Leadership": masterReport.careerBlueprint.suitabilityScores.leadership
                    }).map(([label, score]) => (
                      <div key={label} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 hover:border-blue-200 transition">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">{label}</span>
                        <p className="text-lg font-black text-[#1E3A8A] font-playfair">{score}%</p>
                      </div>
                    ))}
                  </div>

                  {/* Suitability guidelines */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
                    <p><strong className="text-slate-800 font-sans block mb-0.5">Primary Best Sectors:</strong> {masterReport.careerBlueprint.bestCareers.join(', ')}</p>
                    <p><strong className="text-slate-800 font-sans block mb-0.5">Government Job Alignment:</strong> {masterReport.careerBlueprint.governmentJobs}</p>
                    <p><strong className="text-slate-800 font-sans block mb-0.5">Private Sector suitability:</strong> {masterReport.careerBlueprint.privateJobs}</p>
                  </div>

                  {/* Top 10 recommended Careers lists */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-mono text-blue-600 uppercase tracking-widest block font-black">TOP 10 RECOMMENDED CAREER ASSIGNMENTS SUMMARY</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {masterReport.careerBlueprint.recommendedCareers.map((rec, idx) => (
                        <div key={rec.title} className="p-4 bg-blue-50/10 border border-blue-100 rounded-2xl flex gap-3.5 items-start text-xs text-left">
                          <span className="w-6 h-6 shrink-0 rounded-full bg-blue-600/10 text-[#1E3A8A] font-mono font-black text-[11px] flex items-center justify-center border border-blue-600/10">
                            {idx+1}
                          </span>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 leading-relaxed">{rec.title}</span>
                            <p className="text-slate-500 leading-relaxed font-sans text-[11px]">{rec.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 10: HIDDEN TALENTS ENGINE */}
                <div className="bg-[#FFFDF5] p-8 md:p-10 rounded-[40px] border border-amber-200/60 shadow-sm space-y-6 text-left border-l-4 border-l-amber-600">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-mono text-[#D97706] uppercase tracking-wider block font-bold">SECTION 10: HIDDEN TALENT DETECTOR</span>
                    <h4 className="font-cinzel text-lg font-black text-slate-900 uppercase tracking-widest">NATURAL GIFTS & COGNITIVE TALENTS</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs leading-relaxed text-slate-600">
                    {Object.entries({
                      "Creative": masterReport.hiddenTalents.talents.creative,
                      "Communication": masterReport.hiddenTalents.talents.communication,
                      "Business": masterReport.hiddenTalents.talents.business,
                      "Teaching": masterReport.hiddenTalents.talents.teaching,
                      "Leadership": masterReport.hiddenTalents.talents.leadership,
                      "Spiritual": masterReport.hiddenTalents.talents.spiritual,
                      "Artistic": masterReport.hiddenTalents.talents.artistic,
                      "Entrepreneurial": masterReport.hiddenTalents.talents.entrepreneurial
                    }).map(([tName, desc]) => (
                      <div key={tName} className="p-4 bg-white border border-slate-200 rounded-2xl">
                        <span className="font-bold text-slate-800 font-sans block mb-1">{tName} Talent</span>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 bg-white border-2 border-dashed border-[#D97706]/40 rounded-3xl space-y-1.5">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase font-bold tracking-widest block">MOST POWERFUL HIDDEN COGNITIVE TALENT</span>
                    <p className="text-sm font-bold text-slate-800 font-sans">"{masterReport.hiddenTalents.mostPowerfulTalent}"</p>
                    <p className="text-slate-500 leading-relaxed text-[11px] font-sans">Always focus your primary career tasks around this talent vector to experience fluid, stress-free money accumulations.</p>
                  </div>
                </div>

              </div>

              {/* SECTION 11 & 12: KARMIC LESSON ANALYSIS & SOUL MISSION */}
              <div id="master-sec-karmic" className="space-y-12 scroll-mt-6">
                
                {/* SECTION 11: KARMIC LESSONS */}
                <div className="space-y-6">
                  <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                    <span className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-mono font-bold text-xs">07</span>
                    <h4 className="font-cinzel text-xl font-bold text-slate-800 uppercase tracking-widest">Karmic Lesson Engine (Missing Grids Audits)</h4>
                  </div>

                  {masterReport.karmicLessons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      {masterReport.karmicLessons.map(lesson => (
                        <div key={lesson.digit} className="p-6 bg-white border border-slate-200 rounded-[35px] shadow-sm space-y-4 border-t-4 border-t-red-500 hover:border-red-500/35 transition">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-mono text-red-500 uppercase tracking-wider block font-bold">MISSING ELEMENT ROADWAY</span>
                              <h4 className="text-sm font-black text-slate-800">Karmic Lesson for Digit #{lesson.digit}</h4>
                            </div>
                            <div className="w-10 h-10 shrink-0 rounded-full bg-red-100/50 text-red-700 font-mono font-black text-base flex items-center justify-center border border-red-500/20 shadow-inner">
                              {lesson.digit}
                            </div>
                          </div>

                          <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-sans">
                            <p><strong className="text-slate-800 font-sans block mb-0.5">Core Karmic Challenge:</strong> {lesson.lifeChallenge}</p>
                            <p><strong className="text-slate-800 font-sans block mb-0.5">Life Growth Opportunity:</strong> {lesson.growthOpportunity}</p>
                            <p><strong className="text-slate-800 font-sans block mb-0.5">Practical Life Advice:</strong> {lesson.practicalAdvice}</p>
                            <p><strong className="text-slate-800 font-sans block mb-0.5">Development Daily Strategy:</strong> {lesson.developmentStrategy}</p>
                            
                            <div className="p-3.5 bg-red-50/20 border border-red-200/50 rounded-xl mt-2 block">
                              <span className="text-[10px] font-mono text-red-600 uppercase font-black tracking-widest block mb-0.5">Personalised Siddha Remedy</span>
                              <p className="italic text-red-900 leading-relaxed font-sans font-medium text-[11px]">{lesson.personalizedRemedy}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 italic text-center">Incredible! You have zero missing numbers. All earthly configuration planes are fully active inside your birth blueprint.</p>
                  )}
                </div>

                {/* SECTION 12: SOUL MISSION ANALYSIS */}
                <div className="bg-[#FFFDF5] p-8 md:p-10 rounded-[40px] border border-amber-200/70 shadow-sm space-y-6 text-left">
                  <div className="flex gap-2 items-center">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-spin-slow" />
                    <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Soul Mission & Purpose Space</h4>
                  </div>

                  <div className="p-6 bg-white border border-amber-200/40 rounded-3xl space-y-1 text-center">
                    <span className="text-[9px] font-mono text-[#D97706] uppercase tracking-widest font-black block">HIGHER CALLING STATEMENTS</span>
                    <p className="font-serif italic font-semibold text-lg text-slate-800 leading-relaxed">
                      " {masterReport.soulMission.purposeStatement} "
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed font-sans mt-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                      <span className="font-bold text-slate-800 font-sans block mb-1">Life Purpose Roadways</span>
                      <p className="text-slate-500 leading-relaxed font-sans text-[11px]">{masterReport.soulMission.lifePurpose}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                      <span className="font-bold text-slate-800 font-sans block mb-1">Soul Mission Target</span>
                      <p className="text-slate-500 leading-relaxed font-sans text-[11px]">{masterReport.soulMission.soulMissionText}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                      <span className="font-bold text-slate-800 font-sans block mb-1">Higher Calling Framework</span>
                      <p className="text-slate-500 leading-relaxed font-sans text-[11px]">{masterReport.soulMission.higherCalling}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                      <span className="font-bold text-slate-800 font-sans block mb-1">Legacy Potential Index</span>
                      <p className="text-slate-500 leading-relaxed font-sans text-[11px]">{masterReport.soulMission.legacyPotential}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION 13: ARROW MASTER ANALYSIS */}
              <div id="master-sec-arrows" className="space-y-6">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-mono font-bold text-xs">13</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-800 uppercase tracking-widest">12 Arrow Master Analysis</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-xs leading-relaxed">
                  {masterReport.arrowsAnalysis.map(arrow => (
                    <div key={arrow.name} className={`p-6 bg-white border rounded-[35px] shadow-sm space-y-3 border-l-4 ${arrow.isActive ? 'border-l-emerald-600' : 'border-l-slate-300'}`}>
                      <div className="flex justify-between items-center gap-4 border-b border-slate-100 pb-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">PLANE ALIGNMENT</span>
                          <h4 className="text-sm font-black text-slate-800 leading-relaxed">{arrow.name}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-mono tracking-widest font-black ${
                          arrow.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {arrow.status}
                        </span>
                      </div>

                      <p className="italic text-slate-600 font-lora leading-relaxed text-[11px]">"{arrow.meaning}"</p>
                      
                      <div className="grid grid-cols-2 gap-3 pt-1.5">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Strengths</span>
                          <p className="text-slate-600 text-[11px] leading-relaxed font-sans">{arrow.strength}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-red-500 uppercase tracking-wider block">Risk Points</span>
                          <p className="text-slate-600 text-[11px] leading-relaxed font-sans">{arrow.risk}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-50">
                        <p className="text-[11px] font-sans text-slate-600"><strong className="text-slate-700 font-sans">Career Impact:</strong> {arrow.careerImpact}</p>
                        <p className="text-[11px] font-sans text-slate-600"><strong className="text-slate-700 font-sans">Relations Impact:</strong> {arrow.relationshipImpact}</p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <span className="text-[9px] font-mono uppercase text-[#D97706] tracking-wider block font-bold mb-0.5">Remedial Direction</span>
                        <p className="text-slate-800 leading-relaxed font-medium font-sans text-[11px]">"{arrow.remedy}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 14 & 15: INTERACTIVE FUSION STATION (MOBILE & VAASTU) */}
              <div id="master-sec-fusions" className="grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-mt-6">
                
                {/* SECTION 14: INTERACTIVE MOBILE FUSION */}
                <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 text-left border-t-8 border-t-amber-600">
                  <div className="flex gap-2 items-center">
                    <Phone className="w-5 h-5 text-amber-600" />
                    <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Lo Shu + Mobile Fusion (Live)</h4>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Vibrational compensation mapping. Interlocking your 10-digit primary mobile number with the empty coordinates of your birth chart to clear communicative gridlocks.
                  </p>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Input Subject Mobile Nom.:</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          setMobileNumber(val);
                          const master = computeLoshuMasterReport(masterReport.personal.dob, masterReport.personal.name, masterReport.personal.gender, val);
                          setMasterReport(master);
                        }}
                        placeholder="e.g. 9810574362"
                        className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-2xl text-xs outline-none focus:ring-4 focus:ring-amber-500/15 font-mono"
                      />
                    </div>
                  </div>

                  {mobileNumber.length >= 8 ? (
                    <div className="space-y-4 text-xs leading-relaxed text-slate-600 border-t border-slate-100 pt-4">
                      <p><strong className="text-slate-800 font-sans">Mobile Strengths:</strong> {masterReport.mobileFusion.strengths}</p>
                      <p><strong className="text-slate-800 font-sans">Mobile Weaknesses:</strong> {masterReport.mobileFusion.weaknesses}</p>
                      <p><strong className="text-slate-800 font-sans">Compensation Analysis:</strong> {masterReport.mobileFusion.compensationAnalysis}</p>
                      <p><strong className="text-slate-800 font-sans">Planetary Support:</strong> {masterReport.mobileFusion.supportAnalysis}</p>
                      
                      <div className="p-3.5 bg-amber-50/20 border border-amber-200/50 rounded-xl space-y-1 font-sans">
                        <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-widest block font-black">RECOMMENDED MOBILE IMPROVEMENTS</span>
                        <p className="text-slate-800 leading-relaxed font-sans text-[11px]">{masterReport.mobileFusion.improvements}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 border border-dashed rounded-3xl text-xs font-sans">
                      Type your 10-digit mobile phone number above to activate the real-time Compensating Fusion Engine.
                    </div>
                  )}
                </div>

                {/* SECTION 15: NUMERO VAASTU FUSION */}
                <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 text-left border-t-8 border-t-indigo-600">
                  <div className="flex gap-2 items-center">
                    <Compass className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Lo Shu + Numero Vaastu Fusion</h4>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed">
                    <span className="text-[10px] font-mono text-indigo-600 uppercase block font-bold mb-1">Mansion Directional Analysis</span>
                    <p className="font-sans text-slate-800 font-semibold">{masterReport.vaastuFusion.directionAnalysis}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed font-sans">
                    <div className="p-4 bg-emerald-50/10 border border-emerald-100 rounded-xl">
                      <span className="text-[10px] font-mono text-emerald-600 block uppercase font-bold">Best Directions (फायदेमंद दिशाएं)</span>
                      <ul className="list-disc list-inside mt-1 space-y-1 font-sans text-[11px] text-slate-600">
                        {masterReport.vaastuFusion.bestDirections.map(d => <li key={d}>{d}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 bg-red-50/10 border border-red-100 rounded-xl">
                      <span className="text-[10px] font-mono text-red-600 block uppercase font-bold">Avoid Directions (अशुभ दिशाएं)</span>
                      <ul className="list-disc list-inside mt-1 space-y-1 font-sans text-[11px] text-slate-600">
                        {masterReport.vaastuFusion.avoidDirections.map(d => <li key={d}>{d}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-sans">
                    <p><strong className="text-slate-800 block mb-0.5">Career Zone mapping:</strong> {masterReport.vaastuFusion.zones.career}</p>
                    <p><strong className="text-slate-800 block mb-0.5">Money/Wealth Zone mapping:</strong> {masterReport.vaastuFusion.zones.money}</p>
                    <p><strong className="text-slate-800 block mb-0.5">Health Zone mapping:</strong> {masterReport.vaastuFusion.zones.health}</p>
                    <p><strong className="text-slate-800 block mb-0.5">Relationship Zone mapping:</strong> {masterReport.vaastuFusion.zones.relationship}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed font-sans pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 uppercase block font-bold mb-0.5">Home Energy Remedies</span>
                      <p className="font-sans leading-relaxed text-[11px] text-slate-500">{masterReport.vaastuFusion.homeRemedies}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 uppercase block font-bold mb-0.5">Office Work-space Remedies</span>
                      <p className="font-sans leading-relaxed text-[11px] text-slate-500">{masterReport.vaastuFusion.officeRemedies}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION 16 & 17: HEALTH & DOSH ANALYSIS + ANNUAL FORECAST */}
              <div id="master-sec-health" className="grid grid-cols-1 lg:grid-cols-3 gap-8 scroll-mt-6">
                
                {/* SECTION 16: HEALTH & ayurveda DOSHA */}
                <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 text-left border-t-8 border-t-teal-600">
                  <div className="flex gap-2 items-center pb-2 border-b border-slate-150">
                    <Activity className="w-5 h-5 text-teal-600" />
                    <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Ayurveda Dosha & Wellness Profile</h4>
                  </div>

                  {/* Health indexes */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-teal-50/10 border border-teal-150 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Health Score</span>
                      <p className="text-xl font-black text-teal-800 font-sans">{masterReport.healthAnalysis.healthScore}/100</p>
                    </div>
                    <div className="p-3 bg-rose-50/10 border border-rose-150 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Stress Index</span>
                      <p className="text-xl font-black text-rose-800 font-sans">{masterReport.healthAnalysis.stressScore}/100</p>
                    </div>
                    <div className="p-3 bg-amber-50/10 border border-amber-150 rounded-2xl">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Vitality Energy</span>
                      <p className="text-xl font-black text-amber-800 font-sans">{masterReport.healthAnalysis.energyScore}/100</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600 font-sans">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] font-mono text-teal-600 uppercase block font-bold mb-1">Primary Dosha Configuration</span>
                      <p className="text-slate-800 font-semibold font-sans">Saraswati Rulers: {masterReport.healthAnalysis.primaryDosha} (प्रधान दोष)</p>
                      <p className="text-[11px] font-sans text-slate-500 leading-relaxed mt-1">
                        {masterReport.healthAnalysis.primaryDosha === 'PITTA' && "Pitta dosha relates to digestion fire codes. Congestion inside South grid coordinates can elevate acidity."}
                        {masterReport.healthAnalysis.primaryDosha === 'VATA' && "Vata dosha represents wind and dry elements. Ignites neural hyper activity and sleepless nights."}
                        {masterReport.healthAnalysis.primaryDosha === 'KAPHA' && "Kapha dosha is water and earth elements, inducing slower metabolic rates and delayed cycles."}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] font-mono text-teal-600 uppercase block font-bold mb-1">Health Tendencies</span>
                      <p className="text-[11px] font-sans text-slate-500 leading-relaxed">{masterReport.healthAnalysis.healthTendencies}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <span className="text-[10px] font-mono text-teal-600 uppercase tracking-widest block font-black">PREVENTATIVE LIFESTYLE RECOMMENDATIONS</span>
                    
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 leading-relaxed font-sans">
                      {masterReport.healthAnalysis.lifestyleRecommendations.map((rec, idx) => (
                        <li key={idx} className="font-sans text-slate-600 text-[11px]">{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="p-3.5 bg-teal-50/20 border border-teal-200/50 rounded-xl text-teal-800 italic font-medium font-sans text-[11px]">
                    🛡️ Wellness Guidance Only: "{masterReport.healthAnalysis.preventiveWellness}" (No medical diagnosis provided).
                  </p>
                </div>

                {/* SECTION 17: TRANSIT/ANNUAL FORECAST */}
                <div className="bg-[#FFFDF5] p-8 md:p-10 rounded-[40px] border border-amber-200/70 shadow-sm space-y-6 text-left border-t-8 border-t-amber-600">
                  <div className="space-y-1 pb-2 border-b border-amber-200/40 text-left">
                    <span className="text-[9px] font-mono text-[#D97706] uppercase block font-bold">SECTION 17: TRANSIT CODES</span>
                    <h4 className="font-cinzel text-lg font-black text-slate-900 uppercase tracking-widest">PERSONAL YEAR FORECAST</h4>
                  </div>

                  <div className="space-y-3 font-mono text-xs text-slate-700">
                    <div className="flex justify-between border-b border-amber-200/20 pb-1.5">
                      <span>Personal Year:</span>
                      <span className="font-bold text-[#D97706]"># {masterReport.forecasts.personalYear}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-300/25 pb-1.5">
                      <span>Current Month:</span>
                      <span className="font-bold text-slate-800"># {masterReport.forecasts.personalMonth}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-300/25 pb-1.5">
                      <span>Current Day:</span>
                      <span className="font-bold text-slate-800"># {masterReport.forecasts.personalDay}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-[11px] leading-relaxed text-slate-600 font-sans">
                    <p><strong className="text-slate-800 font-sans block">Career Transit:</strong> {masterReport.forecasts.career}</p>
                    <p><strong className="text-slate-800 font-sans block animate-pulse">Financial Space:</strong> {masterReport.forecasts.money}</p>
                    <p><strong className="text-slate-800 font-sans block">Marriage & Love:</strong> {masterReport.forecasts.relationships}</p>
                    <p><strong className="text-slate-800 font-sans block">Business & Trade:</strong> {masterReport.forecasts.business}</p>
                  </div>

                  <div className="pt-2 border-t border-amber-200/30 text-[11px] font-sans">
                    <span className="text-[#D97706] uppercase tracking-wider block font-bold mb-1 font-mono text-[9px]">Celestial Opportunities</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-500 font-sans">
                      {masterReport.forecasts.opportunities.map(o => <li key={o}>{o}</li>)}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-amber-300/25 text-[11px] font-sans">
                    <span className="text-red-500 uppercase tracking-wider block font-bold mb-1 font-mono text-[9px]">Operational Warnings</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-500 font-sans">
                      {masterReport.forecasts.warnings.map(w => <li key={w}>{w}</li>)}
                    </ul>
                  </div>
                </div>

              </div>

              {/* SECTION 18: LAL KITAB & 90-DAY ACTION REMEDIES PLAN */}
              <div id="master-sec-remedies" className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8 text-left border-t-8 border-t-[#D97706] scroll-mt-6">
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-4">
                  <div className="flex gap-2 items-center">
                    <Shield className="w-5 h-5 text-[#D97706]" />
                    <h4 className="font-cinzel text-lg font-bold text-slate-800 uppercase tracking-widest">Siddha Remedies Altar</h4>
                  </div>
                  
                  <div className="flex gap-3 text-xs font-mono font-bold uppercase text-[#D97706]">
                    <span>Lucky Planet Colors: {masterReport.remedies.luckyColours.join(', ')}</span>
                  </div>
                </div>

                {/* Lucky coordinates */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold font-sans">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase block font-bold mb-0.5">Lucky Numbers</span>
                    <p className="text-slate-800 font-black">{masterReport.remedies.luckyNumbers.join(', ')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase block font-bold mb-0.5">Lucky Dates</span>
                    <p className="text-slate-800 font-black text-[11px]">{masterReport.remedies.luckyDates.join(', ')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase block font-bold mb-0.5">Lucky Weekdays</span>
                    <p className="text-slate-800 font-black text-[11px]">{masterReport.remedies.luckyDays.join(', ')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase block font-bold mb-0.5">Lucky Direction Zones</span>
                    <p className="text-slate-800 font-black text-[11px]">{masterReport.remedies.luckyDirections[0]}</p>
                  </div>
                </div>

                {/* Remedies split lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 font-sans">
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase font-black tracking-widest block">Personal & Career remedies</span>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-500 font-sans text-[11px]">
                      {masterReport.remedies.personalRemedies.map((r, i) => <li key={i}>{r}</li>)}
                      {masterReport.remedies.careerRemedies.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-mono text-[#D97706] uppercase font-black tracking-widest block">Financial & Spiritual remedies</span>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-500 font-sans text-[11px]">
                      {masterReport.remedies.financialRemedies.map((r, i) => <li key={i}>{r}</li>)}
                      {masterReport.remedies.spiritualRemedies.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Highly Structured 90-Day Plan block */}
                <div className="p-6 bg-amber-50/20 border border-amber-200/60 rounded-[35px] space-y-4 font-sans text-xs">
                  <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-widest font-black block text-center">Highly Structured 90-Day Action Execution Plan</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-white border border-[#D97706]/15 rounded-2xl space-y-1.5">
                      <span className="bg-[#D97706]/10 text-[#D97706] px-3.5 py-1 rounded-full text-[9px] font-mono uppercase font-bold block w-max">Days 1 - 30 (Preparation Zone)</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{masterReport.remedies.plan90Days.days1_30}</p>
                    </div>
                    <div className="p-4 bg-white border border-[#D97706]/15 rounded-2xl space-y-1.5">
                      <span className="bg-[#D97706]/10 text-[#D97706] px-3.5 py-1 rounded-full text-[9px] font-mono uppercase font-bold block w-max">Days 31 - 60 (Remediation Zone)</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{masterReport.remedies.plan90Days.days31_60}</p>
                    </div>
                    <div className="p-4 bg-white border border-[#D97706]/15 rounded-2xl space-y-1.5">
                      <span className="bg-[#D97706]/10 text-[#D97706] px-3.5 py-1 rounded-full text-[9px] font-mono uppercase font-bold block w-max">Days 61 - 90 (Observation Zone)</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{masterReport.remedies.plan90Days.days61_90}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 19: PREMIUM PDF BRAND PRINTABLE REPORT MODULE */}
              <div className="border-t-4 border-dashed border-slate-300 pt-12 space-y-6">
                <div className="text-center space-y-4">
                  <span className="text-4xl text-[#D97706]/20">⚜️</span>
                  <h3 className="font-cinzel text-xl md:text-2xl font-black text-slate-800 uppercase tracking-widest">Section 19: Premium Consultation Report</h3>
                  <p className="text-slate-400 text-xs max-w-lg mx-auto">This pristine printable artifact binds all computed 19 channels, formatted elegantly for professional Grand Master handovers.</p>
                </div>

                <div className="bg-[#111827] text-slate-100 p-8 md:p-12 rounded-[40px] border border-slate-800 shadow-xl max-w-4xl mx-auto space-y-10 relative select-all scroll-mt-6 print:border-none print:shadow-none print:p-0">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
                  
                  {/* Watermark sign */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-2 font-cinzel text-[160px] pointer-events-none select-none select-all uppercase">☯️</div>

                  {/* Header page */}
                  <div className="text-center space-y-4 pb-8 border-b border-slate-800/80">
                    <span className="text-amber-500 font-mono text-[9px] tracking-widest uppercase font-bold border border-amber-500/20 px-4 py-1.5 rounded-full bg-amber-500/5">
                      Official Numerology Advisory Map
                    </span>
                    <h2 className="font-cinzel text-3xl font-black tracking-widest uppercase text-[#FDFCF7]">LO SHU REPORT PRESET</h2>
                    <p className="text-slate-400 font-lora italic text-xs">"Structured advisory synthesis for sovereign candidate transitions."</p>
                  </div>

                  <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans select-all">
                    <p className="text-sm font-semibold text-[#F59E0B] pb-2 border-b border-slate-850">I. Executive Consultation Summary</p>
                    <p className="font-lora italic text-slate-400 text-center text-sm">"The subject, <strong>{masterReport.personal.name}</strong>, casted with Driver (Mulank) #{masterReport.personal.driver} and Conductor (Bhagyank) #{masterReport.personal.conductor}, manifests an aura aligning with <strong>{masterReport.archetype.title}</strong> archetype configurations. Grounded physical structures should be paired with deep meditative remediation to bridge empty grid sectors."</p>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div>
                        <p className="font-bold text-slate-100 mb-1">Grid Coordinates</p>
                        <p className="text-slate-400">Present Digits: {masterReport.gridAnalysis.present.join(', ')}</p>
                        <p className="text-slate-400">Missing Digits: {masterReport.gridAnalysis.missing.join(', ')}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-100 mb-1">Mansion Coordinates</p>
                        <p className="text-slate-400">Kua Code: #{masterReport.vaastuFusion.kuaNumber} ({masterReport.vaastuFusion.groupType === 'EAST_GROUP' ? 'East Group' : 'West Group'})</p>
                        <p className="text-slate-400">Zone Direction: {masterReport.vaastuFusion.bestDirections[0]}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-2">
                      <p className="font-semibold text-[#F59E0B]">II. Grand Advisor Counseling Notes</p>
                      <p className="italic text-slate-400">"The alignment requires focus in South-East Wealth Zones and South-West marital zones. Carry corresponding crystals daily and water a green leafy plant relative to Mercury days. Avoid speculative trading formatted inside delayed transits."</p>
                    </div>

                    {/* Counselor signature block */}
                    <div className="pt-8 flex justify-between items-end flex-wrap gap-6 text-[10px]">
                      <div>
                        <span className="text-slate-500 block uppercase font-mono tracking-wider">Date of Cast</span>
                        <span className="font-bold font-mono text-slate-305">June 2026</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block uppercase font-mono tracking-wider">Consultant Signature</span>
                        <span className="font-cinzel text-amber-500 block font-bold text-sm mt-1">LEO Grand Master Vedic System</span>
                        <span className="text-[9px] text-slate-600 block">Cast Complete • Authenticated Blueprint</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800 flex justify-center gap-4 print:hidden">
                    <button
                      onClick={handlePrint}
                      className="bg-[#D97706] hover:bg-[#B45309] text-white px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest cursor-pointer transition shadow-lg"
                    >
                      <Printer className="w-4 h-4 inline mr-1.5" /> Start Physical Printing Print
                    </button>
                    <button
                      onClick={() => {
                        const contentBlob = new Blob([JSON.stringify(masterReport, null, 2)], { type: 'application/json' });
                        const dlUrl = URL.createObjectURL(contentBlob);
                        const trigger = document.createElement('a');
                        trigger.href = dlUrl;
                        trigger.download = `Consultation_Report_${masterReport.personal.name.replace(/\s+/g,'_')}.json`;
                        trigger.click();
                      }}
                      className="bg-slate-800 text-slate-300 hover:text-white px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest cursor-pointer transition"
                    >
                      Export Data Schema
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 0.5: IN-DEPTH LO SHU REPORT (800+ WORDS) */}
          {activeSubTab === 'IN_DEPTH_REPORT' && analysisResult && masterReport && (
            <div className="space-y-12 animate-in fade-in duration-500 text-left print:p-0 select-all">
              
              {/* Premium Report Header & Print Controller */}
              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white p-8 md:p-10 rounded-[40px] border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
                      ★ ULTIMATE IN-DEPTH ADVISORY BLUEPRINT
                    </span>
                    <h3 className="font-cinzel text-2xl md:text-3xl font-black tracking-widest text-[#FDFCF7] uppercase leading-tight">
                      Comprehensive Loshu Analysis
                    </h3>
                    <p className="text-slate-300 text-xs md:text-sm font-lora italic leading-relaxed max-w-2xl">
                      An exhaustive client-side diagnostic report containing core planetary frequencies, element balances, plane and arrow formations, and targeted karmic remedies.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handlePrint}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl text-xs font-bold tracking-wider uppercase transition shadow-md flex items-center gap-2 cursor-pointer border border-emerald-500/20"
                    >
                      <Printer className="w-4 h-4 animate-pulse" /> Print / Export PDF
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify({
                          subject: masterReport.personal,
                          scores: masterReport.scores,
                          grid: analysisResult.loshuGrid,
                          missingNumbers: analysisResult.missingNumbers,
                          repeatedNumbers: analysisResult.repeatedNumbers,
                          mahadashas: analysisResult.mahadashas
                        }, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `InDepth_Loshu_Report_${masterReport.personal.name.replace(/\s+/g,'_')}.json`;
                        a.click();
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-3.5 rounded-2xl text-xs font-semibold tracking-wider uppercase transition"
                    >
                      Export JSON Schema
                    </button>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 mt-6 relative z-10 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Subject Name</span>
                    <p className="font-bold text-white text-sm">{masterReport.personal.name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Birth Coordinates</span>
                    <p className="font-bold text-white text-sm font-mono">{dob}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Psychic / Mulank</span>
                    <p className="font-bold text-amber-400 text-sm font-mono"># {masterReport.personal.driver} (Ruler: {masterReport.personal.driver === 1 ? 'Sun' : masterReport.personal.driver === 2 ? 'Moon' : masterReport.personal.driver === 3 ? 'Jupiter' : masterReport.personal.driver === 4 ? 'Rahu' : masterReport.personal.driver === 5 ? 'Mercury' : masterReport.personal.driver === 6 ? 'Venus' : masterReport.personal.driver === 7 ? 'Ketu' : masterReport.personal.driver === 8 ? 'Saturn' : 'Mars'})</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Conductor / Bhagyank</span>
                    <p className="font-bold text-blue-400 text-sm font-mono"># {masterReport.personal.conductor}</p>
                  </div>
                </div>
              </div>

              {/* SECTION 1: VISUAL GRID */}
              <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">01</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-850 uppercase tracking-widest">1. Visual Loshu Grid Magic Square</h4>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] aspect-square p-3 bg-slate-50 rounded-[35px] border border-slate-200 shadow-inner">
                      {loshuGridOrder.map((digit) => {
                        const box = analysisResult.loshuGrid[digit];
                        const count = box.count || 0;
                        const style = getBoxElementStyle(box.element, count);
                        const isDriver = analysisResult.mulank === digit;
                        const isDestiny = analysisResult.bhagyank === digit;

                        return (
                          <div
                            key={digit}
                            className={`rounded-2xl border-2 flex flex-col justify-between p-3 select-none transition-all duration-300 relative overflow-hidden group ${style}`}
                          >
                            <span className="absolute -bottom-2 -left-2 text-2xl font-mono font-black opacity-10">
                              {digit}
                            </span>
                            
                            <div className="flex flex-col gap-1 text-left">
                              <div className="flex flex-wrap gap-1">
                                {box.dobCount && box.dobCount > 0 ? (
                                  Array.from({ length: Math.min(box.dobCount, 3) }).map((_, i) => (
                                    <span key={i} className="w-4 h-4 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[9px] font-mono font-black text-slate-800 shadow-sm">
                                      {digit}
                                    </span>
                                  ))
                                ) : null}
                              </div>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                {isDriver && (
                                  <span className="px-1 py-0.2 rounded bg-amber-500 text-white text-[7px] font-mono font-bold uppercase w-max">
                                    Dr
                                  </span>
                                )}
                                {isDestiny && (
                                  <span className="px-1 py-0.2 rounded bg-blue-600 text-white text-[7px] font-mono font-bold uppercase w-max">
                                    Dest
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right mt-auto">
                              <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                                {count > 0 ? box.element : 'Empty'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4 text-xs leading-relaxed text-slate-600 text-left">
                    <p className="font-serif italic text-slate-800 text-sm">
                      "The Lo Shu Grid is an ancient 3x3 mathematical matrix where any row, column, or diagonal sums to exactly 15. Known as the Sacred Magic Square, it acts as a cosmic mirror reflecting your elemental constitution at birth."
                    </p>
                    <div className="space-y-3 pt-2">
                      <p>
                        Your DOB grid above maps the active digits present in your birth date <strong>{dob}</strong> along with cosmic support layers from your <strong>Psychic (Mulank: {analysisResult.mulank})</strong> and <strong>Conductor (Bhagyank: {analysisResult.bhagyank})</strong> vectors.
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                        <li><strong>Birth Layers (White Badges)</strong>: Innate traits naturally gifted to you at birth.</li>
                        <li><strong>Driver / Psychic Layer (Dr)</strong>: Personal actions and conscious motivations driving your daily choices.</li>
                        <li><strong>Destiny / Conductor Layer (Dest)</strong>: Opportunities and life paths naturally orchestrated by cosmic timing.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: NUMBER FREQUENCY MATRIX */}
              <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">02</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-850 uppercase tracking-widest">2. Complete Number Frequency Analysis</h4>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50 font-mono text-slate-500 uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="p-4 font-black">Digit</th>
                        <th className="p-4 font-black">Ruler & Element</th>
                        <th className="p-4 font-black">Frequency</th>
                        <th className="p-4 font-black">Strength Rating</th>
                        <th className="p-4 font-black">Core Trait Mapping</th>
                        <th className="p-4 font-black">Life Influence Zone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                        const box = analysisResult.loshuGrid[digit];
                        const count = box.count || 0;
                        const ruler = digit === 1 ? 'Sun (सूर्य)' : digit === 2 ? 'Moon (चन्द्र)' : digit === 3 ? 'Jupiter (गुरु)' : digit === 4 ? 'Rahu (राहू)' : digit === 5 ? 'Mercury (बुध)' : digit === 6 ? 'Venus (शुक्र)' : digit === 7 ? 'Ketu (केतु)' : digit === 8 ? 'Saturn (शनि)' : 'Mars (मंगल)';
                        const element = box.element;
                        const strength = count === 0 ? 'Missing / Baseline Void' : count === 1 ? 'Optimal Balanced' : count === 2 ? 'Highly Amplified' : 'Overly Congested';
                        const traits = digit === 1 ? 'Communication & Career Flow' : digit === 2 ? 'Intuition & Mutual Partnerships' : digit === 3 ? 'Knowledge, Growth & Academic Wisdom' : digit === 4 ? 'Wealth, Structure & Disciplined Focus' : digit === 5 ? 'Nervous Equilibrium & Trade Mind' : digit === 6 ? 'Luxury Comforts, Family & Friends' : digit === 7 ? 'Analytical Skill & Spiritual Deep Auditing' : digit === 8 ? 'Laborious Assets & Persistent Patience' : 'Fiery Courage, Enthusiastic Fame';

                        return (
                          <tr key={digit} className={`hover:bg-slate-50/50 transition ${count === 0 ? 'text-slate-400 bg-slate-50/20' : ''}`}>
                            <td className="p-4 font-mono font-black text-slate-800 text-sm">#{digit}</td>
                            <td className="p-4 font-medium">{ruler} — <span className="font-mono text-[10px] text-slate-500 uppercase font-black">{element}</span></td>
                            <td className="p-4 font-mono font-semibold">{count} Occurrences</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                                count === 0 ? 'bg-red-50 text-red-700 border border-red-150' : count === 1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : count === 2 ? 'bg-blue-50 text-blue-800 border border-blue-150' : 'bg-amber-50 text-amber-800 border border-amber-150'
                              }`}>
                                {strength}
                              </span>
                            </td>
                            <td className="p-4 font-lora italic text-[11px] text-slate-600">{traits}</td>
                            <td className="p-4 text-slate-500">{box.direction} — {box.lifeArea}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Missing & Repeated Deep Interpretations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-600 pt-4 leading-relaxed text-left">
                  {/* Missing Elements Impact */}
                  <div className="p-6 md:p-8 bg-red-50/20 border border-red-200/50 rounded-[35px] space-y-4">
                    <span className="text-xl">⚠️</span>
                    <h5 className="font-playfair text-base font-bold text-red-950">Baseline Voids: Missing Digits Analysis</h5>
                    <div className="space-y-4 text-slate-700">
                      {analysisResult.missingNumbers.length > 0 ? (
                        analysisResult.missingNumbers.map(m => (
                          <div key={m.digit} className="space-y-1">
                            <strong className="text-slate-900 font-sans block text-[11px] uppercase tracking-wider font-black">Missing Digit #{m.digit} ({m.element} Element)</strong>
                            <p className="font-lora italic text-[11px] text-slate-600">"{m.meaning}"</p>
                            <p className="text-slate-500 text-[11px] leading-relaxed">
                              {m.digit === 1 && "This baseline void makes it difficult to anchor career targets, leading to frequent changes in professional focus. You may find it difficult to voice unique thoughts in crowded rooms."}
                              {m.digit === 2 && "A lack of digit 2 disrupts the balance of the Southwest marital sector, introducing emotional vulnerability, mutual misunderstandings in partnerships, and sensitivity to criticism."}
                              {m.digit === 3 && "Without Jupiter's code, academic goals may experience delays. You struggle to visualize structured plans, often relying on impromptu actions rather than seasoned wisdom."}
                              {m.digit === 4 && "Missing 4 impacts raw wealth preservation. Money flows in, but saving or anchoring long-term physical assets requires immense deliberate discipline."}
                              {m.digit === 5 && "No digit 5 removes the stabilizing central earth grid. This can cause erratic shifts in career, restlessness, and difficulty staying focused on one specific project."}
                              {m.digit === 6 && "A void in 6 delays luxury comforts, causing feelings of isolation or lack of supportive patrons, making self-reliance a compulsory pathway."}
                              {m.digit === 7 && "Missing 7 reduces analytical introspection. You may repeat past mistakes because of a lack of retrospective auditing, making research and deep logic a learned skill."}
                              {m.digit === 8 && "Without 8, patience runs thin under delayed circumstances. Creating material real estate assets or scaling steady corporations requires extra labor and effort."}
                              {m.digit === 9 && "Missing 9 drains enthusiasm, courage, and fame. You might struggle to take ownership of projects, preferring to work quietly behind the scenes."}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="italic text-slate-400">Divine alignment! No missing digits. All elemental nodes are active in your birth matrix.</p>
                      )}
                    </div>
                  </div>

                  {/* Repeated Elements Impact */}
                  <div className="p-6 md:p-8 bg-emerald-50/20 border border-emerald-200/40 rounded-[35px] space-y-4">
                    <span className="text-xl">✨</span>
                    <h5 className="font-playfair text-base font-bold text-emerald-950">Energy Congestions: Repeated Digits Interpretation</h5>
                    <div className="space-y-4 text-slate-700">
                      {analysisResult.repeatedNumbers.length > 0 ? (
                        analysisResult.repeatedNumbers.map(r => {
                          const customMeaning = PLANETARY_REPETITION_MEANINGS[r.digit]?.[r.count] || r.meaning;
                          return (
                            <div key={r.digit} className="space-y-1">
                              <strong className="text-slate-900 font-sans block text-[11px] uppercase tracking-wider font-black">Repeated Digit #{r.digit} ({r.count}x Occurrences)</strong>
                              <p className="font-lora italic text-[11px] text-slate-600">"{customMeaning}"</p>
                              <p className="text-slate-500 text-[11px] leading-relaxed">
                                {r.digit === 1 && "The excess Sun energy creates a highly communicative but sometimes highly opinionated mindset. Daily meditation on active listening is required."}
                                {r.digit === 2 && "Ample Lunar force heightens creative intuition, but makes you prone to mental anxiety, sudden mood shifts, and taking general feedback too personally."}
                                {r.digit === 3 && "Superb creative planning, but a risk of over-analyzing and not taking physical action. Academic vanity can block learning from simple people."}
                                {r.digit === 4 && "Extreme focus on minute details. This perfectionist work ethic can lead to workaholism, structural obsession, and administrative stress."}
                                {r.digit === 5 && "Powerful trading instincts, but errant swings in risk-taking and erratic spending. Grounding techniques are highly recommended."}
                                {r.digit === 6 && "Deep creative and aesthetic talents. However, you can become easily burdened by family responsibilities or luxury debts."}
                                {r.digit === 7 && "Highly intellectual, but prone to over-thinking, feeling betrayed by close associates, and experiencing emotional roller-coasters."}
                                {r.digit === 8 && "Exceptional patience but slow material realizations, requiring laborious effort and persistent devotion before final triumphs."}
                                {r.digit === 9 && "Intense physical competitive drive, but high risks of verbal outbursts, quick impatience, and burning out your batteries too fast."}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="italic text-slate-400">Balanced matrix! No repeated digits. Every active node holds single, highly balanced planetary frequencies.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PLANE ANALYSIS */}
              <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8 text-left">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">03</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-850 uppercase tracking-widest">3. Core Plane Dynamic Analysis</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2 text-xs">
                  {/* Mental Plane */}
                  {(() => {
                    const present = [4, 9, 2].filter(d => (analysisResult.loshuGrid[d]?.count || 0) > 0);
                    const lvl = present.length === 3 ? 'HIGH' : present.length === 2 ? 'MEDIUM' : present.length === 1 ? 'LOW-MEDIUM' : 'INACTIVE';
                    return (
                      <div className="p-6 bg-purple-50/10 border border-purple-100 rounded-3xl space-y-4">
                        <span className="text-xl">🧠</span>
                        <h5 className="font-playfair text-base font-bold text-purple-950">Mental Plane (4-9-2)</h5>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-purple-600 font-bold">Development: {lvl}</span>
                          <span className="text-slate-400">{present.length}/3 Present</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${(present.length / 3) * 100}%` }} />
                        </div>
                        <p className="text-slate-600 font-sans leading-relaxed">
                          The Mental Plane represents memory, analytical power, intelligence, and active thought processes. 
                          {lvl === 'HIGH' && " All coordinates (4, 9, 2) are present, reflecting a highly analytical, sharp, and structured memory structure capable of handling intense mental labor and deep research tasks."}
                          {lvl === 'MEDIUM' && " With 2 coordinates present, your mental capacity is highly capable but fluctuates. You perform exceptionally when motivated but can experience moments of brain fatigue."}
                          {lvl === 'LOW-MEDIUM' && " Holding 1 coordinate, your mental expression is highly intuitive rather than heavily analytical. You rely on sudden flashes of realization and gut-feeling."}
                          {lvl === 'INACTIVE' && " Lacking 4, 9, and 2, your cognitive flow works on abstract, unconventional levels, requiring structured planners, checklists, and daily brain exercises to anchor focus."}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Emotional Plane */}
                  {(() => {
                    const present = [3, 5, 7].filter(d => (analysisResult.loshuGrid[d]?.count || 0) > 0);
                    const lvl = present.length === 3 ? 'HIGH' : present.length === 2 ? 'MEDIUM' : present.length === 1 ? 'LOW-MEDIUM' : 'INACTIVE';
                    return (
                      <div className="p-6 bg-rose-50/10 border border-rose-100 rounded-3xl space-y-4">
                        <span className="text-xl">💖</span>
                        <h5 className="font-playfair text-base font-bold text-rose-950">Emotional Plane (3-5-7)</h5>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-rose-600 font-bold">Development: {lvl}</span>
                          <span className="text-slate-400">{present.length}/3 Present</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${(present.length / 3) * 100}%` }} />
                        </div>
                        <p className="text-slate-600 font-sans leading-relaxed">
                          The Emotional or Intuitive Plane governs empathy, artistic expression, mutual trust, and heart connections.
                          {lvl === 'HIGH' && " Full activation (3, 5, 7) creates an outstanding healer archetype—highly intuitive, deeply empathetic, with rich artistic inclinations, but prone to taking other people's problems onto themselves."}
                          {lvl === 'MEDIUM' && " With 2 active numbers, you balance heart and head well. You are deeply supportive of loved ones, maintaining healthy personal boundaries."}
                          {lvl === 'LOW-MEDIUM' && " Holding 1 active number, you express emotions selectively. You prefer logical processing over emotional exposure, keeping feelings safe behind mental walls."}
                          {lvl === 'INACTIVE' && " With no active numbers in the center row, emotional expression is highly detached, and trusting others takes time. This represents a core lessons field in self-validation."}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Practical Plane */}
                  {(() => {
                    const present = [8, 1, 6].filter(d => (analysisResult.loshuGrid[d]?.count || 0) > 0);
                    const lvl = present.length === 3 ? 'HIGH' : present.length === 2 ? 'MEDIUM' : present.length === 1 ? 'LOW-MEDIUM' : 'INACTIVE';
                    return (
                      <div className="p-6 bg-indigo-50/10 border border-indigo-100 rounded-3xl space-y-4">
                        <span className="text-xl">🛠️</span>
                        <h5 className="font-playfair text-base font-bold text-indigo-950">Practical Plane (8-1-6)</h5>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-indigo-600 font-bold">Development: {lvl}</span>
                          <span className="text-slate-400">{present.length}/3 Present</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${(present.length / 3) * 100}%` }} />
                        </div>
                        <p className="text-slate-600 font-sans leading-relaxed">
                          The Practical Plane represents execute capacity, structural work ethic, cash management, and real-world results.
                          {lvl === 'HIGH' && " Fully active (8, 1, 6) reflects superb executive capability—highly organized, extremely industrious, with solid money sense, transforming thoughts into material successes."}
                          {lvl === 'MEDIUM' && " With 2 active digits, you are highly capable in execution, but need a quiet, supportive workspace to perform at peak material capacity."}
                          {lvl === 'LOW-MEDIUM' && " Holding 1 active coordinate, physical execution is irregular. You are highly creative but struggle with routine manual work, needing partners to handle micro-tasks."}
                          {lvl === 'INACTIVE' && " Lacking 8, 1, and 6, anchoring focus on manual work and routine tasks is a primary block. You work best in pure advisory, abstract, or highly creative positions."}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* SECTION 4: ARROWS FORMATION */}
              <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8 text-left">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">04</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-850 uppercase tracking-widest">4. Arrows of Strength and Weakness</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                  {/* Strength Arrows */}
                  <div className="space-y-4">
                    <h5 className="font-playfair text-base font-bold text-[#1E3A8A] flex items-center gap-1.5">
                      <span>🏆</span> Present Arrows of Strength (राजयोग)
                    </h5>
                    <div className="space-y-4">
                      {analysisResult.strengthArrows.length > 0 ? (
                        analysisResult.strengthArrows.map((arrow, idx) => (
                          <div key={idx} className="p-4 bg-emerald-50/20 border border-emerald-200 rounded-2xl space-y-1">
                            <div className="flex justify-between items-center font-bold text-emerald-950">
                              <span>{arrow.name} ({arrow.title})</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-mono">Active</span>
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">{arrow.description} Coordinates: {arrow.digits.join(', ')}.</p>
                            <span className="block text-[10px] text-emerald-800 font-semibold mt-1">
                              👉 Manifestation: Holds auspicious energy representing high willpower, financial ease, or structural dominance.
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 italic text-center">
                          No full strength arrows present in the base grid. Your paths expand step-by-step through local dasha timing and remedies.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weakness Arrows */}
                  <div className="space-y-4">
                    <h5 className="font-playfair text-base font-bold text-red-900 flex items-center gap-1.5">
                      <span>⚠️</span> Active Arrows of Weakness / Voids (दुर्बलता)
                    </h5>
                    <div className="space-y-4">
                      {analysisResult.weaknessArrows.length > 0 ? (
                        analysisResult.weaknessArrows.map((arrow, idx) => (
                          <div key={idx} className="p-4 bg-red-50/20 border border-red-200 rounded-2xl space-y-1">
                            <div className="flex justify-between items-center font-bold text-red-950">
                              <span>Arrow of {arrow.name}</span>
                              <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded uppercase font-mono">Present</span>
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">Coordinates {arrow.digits.join(', ')} are totally absent. {arrow.description}</p>
                            <span className="block text-[10px] text-red-800 font-semibold mt-1">
                              👉 Remedy: "{arrow.remedy?.split('|')[0] || 'Observe element remedies'}"
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 bg-emerald-50/10 border border-emerald-100 rounded-2xl text-emerald-800 italic text-center">
                          Auspicious alignment! No complete weakness arrows (completely empty planes) present in your grid.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: ELEMENT DISTRIBUTION */}
              {(() => {
                const el9 = analysisResult.loshuGrid[9]?.count || 0;
                const el2 = analysisResult.loshuGrid[2]?.count || 0;
                const el5 = analysisResult.loshuGrid[5]?.count || 0;
                const el8 = analysisResult.loshuGrid[8]?.count || 0;
                const el3 = analysisResult.loshuGrid[3]?.count || 0;
                const el4 = analysisResult.loshuGrid[4]?.count || 0;
                const el6 = analysisResult.loshuGrid[6]?.count || 0;
                const el7 = analysisResult.loshuGrid[7]?.count || 0;
                const el1 = analysisResult.loshuGrid[1]?.count || 0;

                const totalElCount = el9 + el2 + el5 + el8 + el3 + el4 + el6 + el7 + el1;
                const fPct = totalElCount > 0 ? Math.round((el9 / totalElCount) * 100) : 25;
                const ePct = totalElCount > 0 ? Math.round(((el2 + el5 + el8) / totalElCount) * 100) : 25;
                const aPct = totalElCount > 0 ? Math.round(((el3 + el4 + el6 + el7) / totalElCount) * 100) : 25;
                const wPct = totalElCount > 0 ? Math.round((el1 / totalElCount) * 100) : 25;

                return (
                  <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8 text-left">
                    <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                      <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">05</span>
                      <h4 className="font-cinzel text-xl font-bold text-slate-850 uppercase tracking-widest">5. Element Distribution & Balance</h4>
                    </div>

                    <div className="space-y-6 pt-2">
                      {/* Percentages bar stacked visual */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block font-black">Visual Element Spectrum</span>
                        <div className="w-full h-8 rounded-2xl overflow-hidden flex shadow-sm border border-slate-200">
                          <div className="bg-red-500 text-white flex items-center justify-center text-[10px] font-mono font-bold" style={{ width: `${fPct}%` }} title="Fire Element">
                            {fPct > 8 && `Fire ${fPct}%`}
                          </div>
                          <div className="bg-amber-500 text-white flex items-center justify-center text-[10px] font-mono font-bold" style={{ width: `${ePct}%` }} title="Earth Element">
                            {ePct > 8 && `Earth ${ePct}%`}
                          </div>
                          <div className="bg-emerald-500 text-white flex items-center justify-center text-[10px] font-mono font-bold" style={{ width: `${aPct}%` }} title="Air / Wood Element">
                            {aPct > 8 && `Air/Wood ${aPct}%`}
                          </div>
                          <div className="bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono font-bold" style={{ width: `${wPct}%` }} title="Water Element">
                            {wPct > 8 && `Water ${wPct}%`}
                          </div>
                        </div>
                      </div>

                      {/* Elemental breakdown details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-600 leading-relaxed">
                        <div className="p-4 bg-red-50/10 border border-red-100 rounded-2xl">
                          <strong className="text-red-900 block font-sans uppercase font-bold text-[10px] mb-1 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-red-500" /> Fire (Fiery Courage — 9)
                          </strong>
                          <p>Presence: {fPct}%. Rulers fame, willpower, reputation, and public recognition.</p>
                          <span className="block mt-2 font-semibold text-slate-700">Balance Act:</span>
                          <span className="block text-[11px] text-slate-500">Practice candle meditation (Trataki) during Mercury hours.</span>
                        </div>

                        <div className="p-4 bg-amber-50/10 border border-amber-100 rounded-2xl">
                          <strong className="text-amber-900 block font-sans uppercase font-bold text-[10px] mb-1 flex items-center gap-1">
                            <Landmark className="w-3.5 h-3.5 text-amber-500" /> Earth (Stability — 2, 5, 8)
                          </strong>
                          <p>Presence: {ePct}%. Manages physical assets, stability, family, and steady finances.</p>
                          <span className="block mt-2 font-semibold text-slate-700">Balance Act:</span>
                          <span className="block text-[11px] text-slate-500">Walk barefoot on clean grass; carry unheated smoky quartz.</span>
                        </div>

                        <div className="p-4 bg-emerald-50/10 border border-emerald-100 rounded-2xl">
                          <strong className="text-emerald-950 block font-sans uppercase font-bold text-[10px] mb-1 flex items-center gap-1">
                            <Trees className="w-3.5 h-3.5 text-emerald-500" /> Air / Wood (Foresight — 3, 4, 6, 7)
                          </strong>
                          <p>Presence: {aPct}%. Governs intelligence, flexibility, social connections, and creativity.</p>
                          <span className="block mt-2 font-semibold text-slate-700">Balance Act:</span>
                          <span className="block text-[11px] text-slate-500">Pranayama; grow small green leafy plants in East zone.</span>
                        </div>

                        <div className="p-4 bg-blue-50/10 border border-blue-100 rounded-2xl">
                          <strong className="text-blue-900 block font-sans uppercase font-bold text-[10px] mb-1 flex items-center gap-1">
                            <Droplet className="w-3.5 h-3.5 text-blue-500" /> Water (Career — 1)
                          </strong>
                          <p>Presence: {wPct}%. Directs career paths, verbal expression, and fluid adaptability.</p>
                          <span className="block mt-2 font-semibold text-slate-700">Balance Act:</span>
                          <span className="block text-[11px] text-slate-500">Drink from silver tumblers; keep water features in North.</span>
                        </div>
                      </div>

                      {/* Element Imbalance Explanations */}
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-slate-700 space-y-2">
                        <strong className="font-sans text-[11px] uppercase tracking-wider block font-bold text-slate-900">Element Imbalance Audit</strong>
                        <p className="font-lora italic text-xs leading-relaxed text-slate-600">
                          {(() => {
                            let audits = [];
                            if (fPct > 35) audits.push("Your Fire element is highly active. This can elevate impatience and sudden temper, requiring cooling activities like moon-gazing.");
                            if (fPct < 15) audits.push("Your Fire element is low. This may lead to struggles in claiming credit or initiating large tasks; wear copper bracelets.");
                            if (ePct > 35) audits.push("High Earth configuration can anchor you too deeply, causing rigidity to lifestyle changes. Learn to let go.");
                            if (ePct < 15) audits.push("Low Earth element can trigger spatial and material restlessness. Carry a small earthy rock in your pocket.");
                            if (aPct > 35) audits.push("Excessive Air/Wood element fuels overthinking and restlessness, complicating execution. Practice slow breathing.");
                            if (aPct < 15) audits.push("Low Air element restricts creative visualization and long-term planning. Practice writing ideas down.");
                            if (wPct > 35) audits.push("High Water element triggers hypersensitivity and emotional volatility. Ground yourself with daily walks.");
                            if (wPct < 15) audits.push("Low Water element blocks fluid communications and career transition clarity. Carry a silver coin.");
                            
                            return audits.length > 0 ? audits.join(" • ") : "Congratulations! Your elemental distribution is in an exceptionally stable and harmonious equilibrium.";
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 6: KARMIC LESSONS */}
              <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8 text-left">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">06</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-850 uppercase tracking-widest">6. Karmic Lessons & Evolution Strategies</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
                  {analysisResult.missingNumbers.length > 0 ? (
                    analysisResult.missingNumbers.map((m) => (
                      <div key={m.digit} className="p-6 bg-slate-50 border border-slate-200 rounded-[30px] space-y-3 hover:border-red-500/20 transition duration-300">
                        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                          <strong className="text-slate-900 text-sm font-black">Digit #{m.digit} Lesson ({m.element})</strong>
                          <span className="bg-red-50 text-red-700 font-mono text-[9px] font-black px-2 py-0.5 rounded uppercase border border-red-200/50">Missing Coordinate</span>
                        </div>
                        
                        <div className="space-y-2.5 text-slate-700 font-sans">
                          <p>
                            <strong className="text-slate-800 block mb-0.5">Core Karmic Challenge:</strong> 
                            {m.digit === 1 && "Struggles to anchor career independence, leading to feeling lost in other people's plans."}
                            {m.digit === 2 && "Vulnerability to relationship friction and feeling overly defensive under simple feedback."}
                            {m.digit === 3 && "Difficulty organizing thoughts and family bonds, often feeling intellectually misunderstood."}
                            {m.digit === 4 && "Financial instability and poor wealth preservation guidelines, creating routine fatigue."}
                            {m.digit === 5 && "Lack of grounding and stability, leading to midway project dropouts."}
                            {m.digit === 6 && "Delayed domestic comfort or feeling isolated without helpful mentors or friends."}
                            {m.digit === 7 && "Repeating past operational errors without analyzing core causes."}
                            {m.digit === 8 && "Delayed asset realization, creating labor fatigue under Saturnian dasha timings."}
                            {m.digit === 9 && "Low enthusiasm and courage, preferring to operate passively behind the scenes."}
                          </p>

                          <p>
                            <strong className="text-slate-800 block mb-0.5">Manifestation Scenarios:</strong>
                            {m.digit === 1 && "Experiencing career roadblocks or finding it hard to secure fair recognition for work."}
                            {m.digit === 2 && "Entanglements in relationship arguments or overreacting to simple remarks from loved ones."}
                            {m.digit === 3 && "Procrastinating on educational goals or experiencing frequent miscommunications with family."}
                            {m.digit === 4 && "Unexpected expenses draining cash reserves or struggling to stick to a daily budget."}
                            {m.digit === 5 && "Constantly changing jobs or moving locations, seeking an elusive sense of peace."}
                            {m.digit === 6 && "Feeling unsupported in times of crisis, or facing delays in buying a dream property."}
                            {m.digit === 7 && "Trusting untrustworthy associates or repeating painful relationship cycles."}
                            {m.digit === 8 && "Feeling that despite immense hard work, financial progress is slow and blocked."}
                            {m.digit === 9 && "Struggling to express anger healthily or staying quiet when boundary lines are crossed."}
                          </p>

                          <p>
                            <strong className="text-slate-800 block mb-0.5">Evolution Strategy:</strong>
                            {m.digit === 1 && "Practice daily mirror confidence affirmations; journal clear professional goals each Sunday."}
                            {m.digit === 2 && "Learn emotional boundary-setting; meditate on a full moon night; practice deep empathy."}
                            {m.digit === 3 && "Read biographies of visionaries; plan projects on paper first; heal generational family disputes."}
                            {m.digit === 4 && "Use budgeting apps strictly; maintain a strict morning routine; organize your workstation."}
                            {m.digit === 5 && "Commit to a single long-term project for at least 180 days without planning changes."}
                            {m.digit === 6 && "Decorate your bedroom with pleasant colors; practice self-love; serve as a mentor to juniors."}
                            {m.digit === 7 && "Keep an active retrospective journal; write down lessons learned after every project."}
                            {m.digit === 8 && "Maintain patience through regular spiritual routines; invest in land or safe blue-chip assets."}
                            {m.digit === 9 && "Engage in physical exercises; speak up firmly but politely when boundaries are tested."}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-12 bg-emerald-50/10 border border-emerald-200 rounded-[30px] text-center text-slate-500">
                      Excellent alignment! No missing digits mean no severe karmic baseline voids exist in this lifetime. Concentrate on grid optimization remedies instead.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 7: REMEDIES & OPTIMIZATION */}
              <div className="bg-white p-8 md:p-10 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8 text-left">
                <div className="flex gap-2.5 items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs border border-emerald-200">07</span>
                  <h4 className="font-cinzel text-xl font-bold text-slate-850 uppercase tracking-widest">7. Actionable Remedies Altar</h4>
                </div>

                <div className="space-y-8 text-xs text-slate-600">
                  {/* Missing digits remedies */}
                  <div className="space-y-4">
                    <h5 className="font-playfair text-base font-bold text-slate-800">Planetary Remedies for Missing Coordinates</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysisResult.missingNumbers.map(m => (
                        <div key={m.digit} className="p-5 bg-amber-50/10 border border-amber-200/50 rounded-2xl space-y-2">
                          <strong className="text-[#B45309] block uppercase tracking-wider font-mono">Digit #{m.digit} (Ruler: {m.digit === 1 ? 'Sun' : m.digit === 2 ? 'Moon' : m.digit === 3 ? 'Jupiter' : m.digit === 4 ? 'Rahu' : m.digit === 5 ? 'Mercury' : m.digit === 6 ? 'Venus' : m.digit === 7 ? 'Ketu' : m.digit === 8 ? 'Saturn' : 'Mars'})</strong>
                          <p className="italic text-slate-800 font-medium">"{m.remedy}"</p>
                          <ul className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 pt-1">
                            {m.digit === 1 && (
                              <>
                                <li>Offer fresh copper-pot water to the morning Sun daily at sunrise.</li>
                                <li>Wear a simple, unadorned copper ring on your right ring finger.</li>
                                <li>Use bright royal blue signature inks to write important files.</li>
                              </>
                            )}
                            {m.digit === 2 && (
                              <>
                                <li>Keep a clean white crystal sphere in the Southwest corner of your room.</li>
                                <li>Fast on Mondays, or consume milk/water from silver cups exclusively.</li>
                                <li>Carry a pure silver square coin in your wallet at all times.</li>
                              </>
                            )}
                            {m.digit === 3 && (
                              <>
                                <li>Wear a yellow sapphire gemstone or a small gold ring on your index finger.</li>
                                <li>Chant the guru mantra (Om Brim Brihaspataye Namah) on Thursdays.</li>
                                <li>Donate fresh yellow sweets or yellow fabrics to elders or teachers.</li>
                              </>
                            )}
                            {m.digit === 4 && (
                              <>
                                <li>Feed stray dogs or birds with multi-grain seeds every Wednesday evening.</li>
                                <li>Place a small wooden money plant in the Southeast sector of your space.</li>
                                <li>Avoid speculative stock trading or gambling; wear a clear quartz bracelet.</li>
                              </>
                            )}
                            {m.digit === 5 && (
                              <>
                                <li>Place a green jade pyramid or crystal in the exact center of your home.</li>
                                <li>Feed green grass or green leafy spinach to cows on Wednesday mornings.</li>
                                <li>Use emerald green colors in your primary workstation backdrop.</li>
                              </>
                            )}
                            {m.digit === 6 && (
                              <>
                                <li>Wear white zircon or diamond jewelry on Venus days (Fridays).</li>
                                <li>Donate fresh white flowers or white rice to under-privileged girls.</li>
                                <li>Sprinkle high-quality rose water in your bedroom before sleeping.</li>
                              </>
                            )}
                            {m.digit === 7 && (
                              <>
                                <li>Keep a multi-colored thread bracelet tied on your left wrist.</li>
                                <li>Chant Ketu Mantras on Saturday evenings; feed black-and-white stray dogs.</li>
                                <li>Donate old warm blankets to elderly shelters during transit months.</li>
                              </>
                            )}
                            {m.digit === 8 && (
                              <>
                                <li>Light a sesame oil lamp under a Peepal tree on Saturday evenings.</li>
                                <li>Wear a black obsidian bracelet or an iron ring on your middle finger.</li>
                                <li>Donate black mustard seeds, black clothes, or iron utensils on Saturdays.</li>
                              </>
                            )}
                            {m.digit === 9 && (
                              <>
                                <li>Recite Hanuman Chalisa or chant Mars Mantras on Tuesdays.</li>
                                <li>Wear a copper bracelet or a red coral gemstone on your ring finger.</li>
                                <li>Donate red lentils (masoor dal) to spiritual centers on Tuesday mornings.</li>
                              </>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Repeated digits remedies */}
                  <div className="space-y-4">
                    <h5 className="font-playfair text-base font-bold text-slate-800">Planetary Soothing for Repeated Coordinates</h5>
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl text-[11px] leading-relaxed">
                      <p className="font-lora italic text-slate-600 mb-3">
                        When a single number is repeated multiple times, its planetary frequency dominates the grid, causing energy congestion. Apply these soothing methods to ground and balance this excess force:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-slate-600">
                        <li><strong>Excessive Sun Energy (1s repeated)</strong>: Balance with cooling silver wear; practice active listening and silence for at least 30 minutes daily.</li>
                        <li><strong>Excessive Moon Energy (2s repeated)</strong>: Ground with barefoot walking; avoid cold foods after sunset; carry a heavy hematite stone.</li>
                        <li><strong>Excessive Jupiter Energy (3s repeated)</strong>: Focus on practical work instead of just theory; avoid advising others unless they explicitly ask.</li>
                        <li><strong>Excessive Rahu Energy (4s repeated)</strong>: Walk on soil daily; practice slow meditation; prioritize social laughter and outdoor leisure.</li>
                        <li><strong>Excessive Mercury Energy (5s repeated)</strong>: Avoid prompt speculative financial transactions; limit screen time; maintain a stable eating routine.</li>
                        <li><strong>Excessive Venus Energy (6s repeated)</strong>: Drink warm water; restrict high luxury spending; focus on healthy, simple home cooked foods.</li>
                        <li><strong>Excessive Ketu Energy (7s repeated)</strong>: Maintain a strong retrospective journal; don't isolate yourself; consult trustworthy mentors before major moves.</li>
                        <li><strong>Excessive Saturn Energy (8s repeated)</strong>: Avoid getting stuck in routine details; take small breaks; practice relaxing breathing exercises.</li>
                        <li><strong>Excessive Mars Energy (9s repeated)</strong>: Direct excess energy into daily physical workouts; practice cooling breathing (Sheetali Pranayama).</li>
                      </ul>
                    </div>
                  </div>

                  {/* Overall grid optimization */}
                  <div className="space-y-3 p-6 bg-emerald-50/10 border border-emerald-200/50 rounded-3xl">
                    <strong className="text-emerald-950 block font-sans uppercase font-bold text-[10px]">Universal Loshu Grid Optimization Guidelines</strong>
                    <p className="text-slate-600 leading-relaxed font-sans text-[11px]">
                      To optimize your overall birth grid, focus on balancing the central coordinate (Node 5 - Earth Element). Place a natural amethyst druse or clear quartz cluster in your workspace center to ground scattered ideas. Keep your North zone (Node 1 - Water) clean and well-lit to maintain career clarity. Ensure your Southeast corner (Node 4 - Wood) is decorated with fresh green plants to secure financial growth.
                    </p>
                  </div>
                </div>
              </div>

              {/* End of Report Printable Disclaimer */}
              <div className="p-8 bg-slate-100 rounded-3xl text-center space-y-2 border border-slate-200">
                <span className="text-xl">☯️</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Authenticated Loshu Grid Alignment Cast</p>
                <p className="text-[10px] text-slate-400 max-w-lg mx-auto">
                  This report is a direct mathematical translation of the Date of Birth coordinates {dob}. Occult Sciences represent symbolic guidelines for self-realization; self-discipline and conscious effort are the ultimate anchors of human destiny.
                </p>
              </div>

            </div>
          )}

          {/* TAB 1: GRID & BOX AUDITING */}
          {activeSubTab === 'GRID' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in duration-500">
              
              {/* Box 1: Interactive Loshu Grid 3x3 (Left, span 2) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-6 md:p-8 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 text-center select-none">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]/70">
                    <span className="text-xs font-mono uppercase text-[#D97706] tracking-widest font-bold">Interactive Magic Square</span>
                    <span className="text-[10px] font-mono text-[#6B7280]">Select boxes to audit details</span>
                  </div>

                  {/* Complete Animated Magic Board */}
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-3 gap-3 max-w-[340px] mx-auto aspect-square my-4 p-2 bg-[#F8F4EF]/80 rounded-[30px] border border-[#E5E7EB]"
                  >
                    {loshuGridOrder.map((digit) => {
                      const box = analysisResult.loshuGrid[digit];
                      const style = getBoxElementStyle(box.element, box.count || 0);
                      const isSelected = selectedBoxDigit === digit;

                      return (
                        <motion.div
                          key={digit}
                          variants={itemVariants}
                          onClick={() => setSelectedBoxDigit(digit)}
                          className={`rounded-2xl border-2 flex flex-col justify-between p-3 cursor-pointer select-none transition-all duration-300 relative overflow-hidden group ${style} ${
                            isSelected ? 'ring-4 ring-[#D97706]/40 border-[#D97706] scale-102 z-20 shadow-lg' : 'hover:scale-101 hover:border-[#D97706]/20'
                          }`}
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          {/* Inner tiny background number mapping index */}
                          <span className="absolute -bottom-2 -left-2 text-[28px] font-mono font-bold opacity-5 group-hover:opacity-10 transition-opacity">
                            {digit}
                          </span>

                          {/* Digit Counts / Badges */}
                          <div className="flex flex-col gap-1.5 justify-start text-left">
                            {/* Base DOB counts (Birth Layer) */}
                            <div className="flex flex-wrap gap-1">
                              {box.dobCount && box.dobCount > 0 ? (
                                Array.from({ length: Math.min(box.dobCount, 4) }).map((_, i) => (
                                  <span key={i} title="Birth Layer (DOB) Digit" className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-mono font-black text-slate-800 shadow-sm">
                                    {digit}
                                  </span>
                                ))
                              ) : null}
                            </div>

                            {/* Reinforcement / Layer Badges */}
                            <div className="flex flex-wrap gap-1.5">
                              {box.isDriverLayer && (
                                <span title="Driver Layer Marker" className="px-1.5 h-4 rounded-md bg-amber-500 text-white border border-amber-600 flex items-center justify-center text-[8px] font-mono font-bold uppercase shadow-sm">
                                  Dr Lyr
                                </span>
                              )}
                              {box.isDriverReinforced && (
                                <span title="Driver Reinforced" className="px-1.5 h-4 rounded-md bg-amber-600 text-white border border-amber-700 flex items-center justify-center text-[8px] font-mono font-bold uppercase shadow-sm">
                                  Dr Reinf
                                </span>
                              )}
                              {box.isDestinyLayer && (
                                <span title="Destiny Layer Marker" className="px-1.5 h-4 rounded-md bg-blue-600 text-white border border-blue-700 flex items-center justify-center text-[8px] font-mono font-bold uppercase shadow-sm">
                                  Dest Lyr
                                </span>
                              )}
                              {box.isDestinyReinforced && (
                                <span title="Destiny Reinforced" className="px-1.5 h-4 rounded-md bg-indigo-500 text-white border border-indigo-600 flex items-center justify-center text-[8px] font-mono font-bold uppercase shadow-sm">
                                  Dest Reinf
                                </span>
                              )}
                              {box.count === 0 && (
                                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">MISSING</span>
                              )}
                            </div>
                          </div>

                          {/* Info overlay inside Box for details */}
                          <div className="text-right mt-auto">
                            <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-600 truncate">
                              {box.element}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  <div className="flex gap-4 items-center justify-center text-[10px] font-mono flex-wrap bg-[#F8F4EF] p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 rounded"></span><span>Wood Element</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-red-100 border border-red-300 rounded"></span><span>Fire Element</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 rounded"></span><span>Earth Element</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-slate-200 border border-slate-400 rounded"></span><span>Metal Element</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-blue-100 border border-blue-300 rounded"></span><span>Water Element</span></div>
                  </div>
                </div>
              </div>

              {/* Box 2: Box Diagnostic Drawer (Right, span 3) */}
              <div className="lg:col-span-3 space-y-4">
                {selectedBoxDigit !== null ? (
                  (() => {
                    const box = analysisResult.loshuGrid[selectedBoxDigit];
                    const isMissing = box.count === 0;
                    const hasDriver = analysisResult.mulank === selectedBoxDigit;
                    const hasBhagyank = analysisResult.bhagyank === selectedBoxDigit;

                    return (
                      <div className="bg-white p-8 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-6 flex flex-col justify-between min-h-full">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start border-b border-[#E5E7EB]/70 pb-4">
                            <div className="text-left space-y-1">
                              <span className="text-[9px] font-mono uppercase text-[#D97706] tracking-widest font-bold">Selected Element Node</span>
                              <h3 className="font-playfair text-2.5xl font-extrabold text-[#1F2937]">
                                Plate Coordinates: Node #{selectedBoxDigit}
                              </h3>
                            </div>
                            <div className="text-right">
                              {getElementBadge(box.element)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[#F8F4EF]/80 border border-[#E5E7EB] rounded-2xl">
                              <span className="block text-[8px] font-mono uppercase text-slate-500 tracking-wider">Compass Direction</span>
                              <span className="text-sm text-[#1F2937] font-bold mt-1 block">{box.direction} (दिशा)</span>
                            </div>
                            <div className="p-4 bg-[#F8F4EF]/80 border border-[#E5E7EB] rounded-2xl">
                              <span className="block text-[8px] font-mono uppercase text-slate-500 tracking-wider">Governed Life Domain</span>
                              <span className="text-sm text-[#1F2937] font-bold mt-1 block select-all">{box.lifeArea}</span>
                            </div>
                          </div>

                          <div className="space-y-4 pt-2">
                            <span className="text-[10px] font-mono uppercase text-[#D97706] tracking-widest block font-bold border-b border-slate-100 pb-1">Layered Grid Audit</span>
                            
                            {/* Layer 1: Birth Grid Analysis (Birth Layer) */}
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-left space-y-1.5">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                1. Birth Layer (DOB Grid)
                              </span>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-700">Birth Grid Status:</span>
                                <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                                  box.dobCount && box.dobCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {box.dobCount && box.dobCount > 0 ? `Present (${box.dobCount}x)` : 'Missing (0x)'}
                                </span>
                              </div>
                              <p className="text-slate-600 text-xs leading-relaxed font-sans">
                                {box.dobCount && box.dobCount > 0 
                                  ? `Number #${selectedBoxDigit} is naturally present in your Date of Birth, forming the solid Birth Layer of your grid with a count of ${box.dobCount}. This represents stable, innate traits in this zone.`
                                  : `Number #${selectedBoxDigit} does not appear in your Date of Birth. It is completely missing in the Birth Layer, representing a natural baseline void in ${box.lifeArea.toLowerCase()}.`
                                }
                              </p>
                            </div>

                            {/* Layer 2: Driver Influence (Driver Layer) */}
                            {hasDriver ? (
                              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 text-left space-y-1.5">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706] block flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  2. Driver Layer (Mulank Influence)
                                </span>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-700">Driver Status:</span>
                                  <span className="font-mono text-xs font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                    {box.isDriverReinforced ? `Reinforced (#${analysisResult.mulank})` : `Added as Layer (#${analysisResult.mulank})`}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-xs leading-relaxed font-sans">
                                  {box.isDriverReinforced 
                                    ? `Because your Driver Number is #${analysisResult.mulank} and it already exists in your DOB, it is marked as "Driver Reinforced". This doubles down on your core personality traits without cluttering your grid with a duplicate digit.`
                                    : `Since digit #${analysisResult.mulank} was missing from your DOB, it is inserted into the grid as a clean "Driver Layer" marker to activate this sector and provide necessary support.`
                                  }
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/30 text-left text-[11px] text-slate-400 italic font-mono">
                                Driver Number #{analysisResult.mulank} operates on a different node. No direct personality reinforcement or layer addition here.
                              </div>
                            )}

                            {/* Layer 3: Bhagyank Influence (Destiny Layer) */}
                            {hasBhagyank ? (
                              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 text-left space-y-1.5">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E3A8A] block flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                                  3. Destiny Layer (Bhagyank/Conductor Influence)
                                </span>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-700">Conductor Status:</span>
                                  <span className="font-mono text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    {box.isDestinyReinforced ? `Reinforced (#${analysisResult.bhagyank})` : `Added as Layer (#${analysisResult.bhagyank})`}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-xs leading-relaxed font-sans">
                                  {box.isDestinyReinforced 
                                    ? `Because your Bhagyank is #${analysisResult.bhagyank} and it already exists in your DOB or was added by your Driver, it is marked as "Destiny Reinforced". This channels destiny-level focus to reinforce this node without duplicate digits.`
                                    : `Since digit #${analysisResult.bhagyank} was not present in your grid, it is inserted as a dedicated "Destiny Layer" marker to introduce cosmic alignment and unlock this area's potentials.`
                                  }
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/30 text-left text-[11px] text-slate-400 italic font-mono">
                                Conductor Number #{analysisResult.bhagyank} operates on a different node. No direct destiny reinforcement or layer addition here.
                              </div>
                            )}

                            {/* Layer 4: Combined Energy Analysis */}
                            <div className="p-4 rounded-2xl border border-[#D97706]/20 bg-[#FDFCF7] text-left space-y-1.5">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B45309] block flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                                4. Combined Interpretation
                              </span>
                              <p className="text-slate-700 text-xs leading-relaxed font-sans font-medium">
                                {(() => {
                                  let explanation = `The combined cosmic profile of Node #${selectedBoxDigit} indicates `;
                                  if (box.dobCount && box.dobCount > 0) {
                                    explanation += `strong baseline active resources in your birth template. `;
                                    if (hasDriver && hasBhagyank) {
                                      explanation += `With additional dual reinforcement from both Driver (Mulank) and Conductor (Bhagyank) forces, this node represents an absolute powerhouse of potential, guaranteeing supreme mastery and achievements in ${box.lifeArea.toLowerCase()}.`;
                                    } else if (hasDriver) {
                                      explanation += `Because your Driver Number matches, these base talents are highly amplified by your conscious decisions, creating a natural, self-aware practitioner of these skills.`;
                                    } else if (hasBhagyank) {
                                      explanation += `Because your Conductor Number matches, this area will expand dramatically as you grow, serving as a primary pillar of your career and material achievements.`;
                                    } else {
                                      explanation += `Operating purely as your baseline birth gift, it provides steady support in your life without needing excess conscious effort.`;
                                    }
                                  } else {
                                    explanation += `a baseline void in your birth date. `;
                                    if (hasDriver && hasBhagyank) {
                                      explanation += `However, because both your Driver and Conductor focus on this exact node, you naturally generate this trait through deliberate focus and lifetime progression, fully bridging the initial void.`;
                                    } else if (hasDriver) {
                                      explanation += `However, because your Driver is #${analysisResult.mulank}, your day-to-day actions and conscious choices will actively compensate for this missing link, converting this weakness into a developed strength.`;
                                    } else if (hasBhagyank) {
                                      explanation += `However, your Conductor Number of #${analysisResult.bhagyank} acts as Destiny Energy, ensuring that life circumstances will constantly present opportunities for you to cultivate and master these traits.`;
                                    } else {
                                      explanation += `Without direct Driver or Bhagyank reinforcement, this node represents a true karmic lesson. Active remediation via the Lal Kitab altar below is highly recommended to balance your energies.`;
                                    }
                                  }
                                  return explanation;
                                })()}
                              </p>
                            </div>
                          </div>

                          {/* Specialized remediation display */}
                          {isMissing ? (
                            <div className="space-y-2 pt-2 text-left">
                              <span className="text-[10px] font-mono uppercase text-[#D97706] tracking-widest block font-bold">Actionable Lal Kitab Correction</span>
                              <p className="text-xs text-slate-700 leading-relaxed italic bg-[#F2E8DC]/40 p-4 rounded-xl border border-[#D97706]/10">
                                "{analysisResult.missingNumbers.find(m => m.digit === selectedBoxDigit)?.remedy || 'Apply appropriate color elements in daily wear.'}"
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 pt-2 text-left">
                              <span className="text-[10px] font-mono uppercase text-emerald-700 tracking-widest block font-bold">Repeating Counts Metaphysics</span>
                              <p className="text-xs text-slate-700 leading-relaxed italic bg-emerald-50/20 p-4 rounded-xl border border-emerald-500/10">
                                {analysisResult.repeatedNumbers.find(r => r.digit === selectedBoxDigit)?.meaning || 'Brings stable, predictable planetary waves.'}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-[#E5E7EB] text-center">
                          <span className="text-[10px] font-sans text-slate-400">Click other boxes on the grid to instantly view their core diagnostics.</span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-white p-8 rounded-[40px] border border-[#E5E7EB] shadow-sm flex items-center justify-center text-slate-400 h-full min-h-[300px]">
                    Select any box on the magic Loshu Grid to audit its elemental parameters.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: PLANES & ARROWS */}
          {activeSubTab === 'PLANES' && (
            <div className="space-y-8 animate-in duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Active strength planes / Rajyogas */}
                <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm space-y-6 text-left">
                  <div className="flex gap-3 items-center">
                    <span className="text-3xl text-amber-500">🏆</span>
                    <div className="space-y-0.5">
                      <h3 className="font-playfair text-lg font-bold text-[#1F2937]">Active Strength Arrows (राजयोग)</h3>
                      <p className="text-xs text-slate-500">Full rows, columns, or diagonal lines indicating highly active fortunes.</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {analysisResult.strengthArrows.length > 0 ? (
                      analysisResult.strengthArrows.map((plane, idx) => (
                        <div key={idx} className="p-5 bg-emerald-50/30 border border-emerald-200 rounded-2xl space-y-2 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-emerald-800">{plane.name} ({plane.title})</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono px-2.5 py-0.5 rounded-full font-extrabold uppercase">Present</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed select-all">
                            Contains coordinates {plane.digits.join(', ')}. {plane.description} Represents peak energetic strength.
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-slate-50 border border-[#E5E7EB] rounded-2xl text-center text-slate-500 space-y-2">
                        <Award className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs text-[#1F2937] font-semibold">No Full Strength Planes Present</p>
                        <p className="text-[10px] text-slate-400">All planes are currently in partial or balanced equilibrium states.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Empty / Weakness Arrows */}
                <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm space-y-6 text-left">
                  <div className="flex gap-3 items-center">
                    <span className="text-3xl text-red-500">⚠️</span>
                    <div className="space-y-0.5">
                      <h3 className="font-playfair text-lg font-bold text-[#1F2937]">Active Weakness Arrows (दुर्बलता)</h3>
                      <p className="text-xs text-slate-500">Completely empty lines indicating lack of certain elemental balances.</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {analysisResult.weaknessArrows.length > 0 ? (
                      analysisResult.weaknessArrows.map((plane, idx) => (
                        <div key={idx} className="p-5 bg-red-50/30 border border-red-200 rounded-2xl space-y-3 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-red-800">{plane.name}</span>
                            <span className="bg-red-100 text-red-800 text-[9px] font-mono px-2.5 py-0.5 rounded-full font-extrabold uppercase">Weak / Absent</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed select-all">
                            Coordinates {plane.digits.join(', ')} are totally absent. {plane.description}
                          </p>
                          <div className="bg-[#F2E8DC]/40 p-3 rounded-xl border border-[#D97706]/15 space-y-1">
                            <span className="block text-[8px] font-mono text-[#D97706] uppercase tracking-wider font-bold">Planetary Remedy</span>
                            <span className="text-[11px] text-slate-700 block italic leading-relaxed">"{plane.remedy?.split('|')[0] || 'Keep balancing gemstones'}"</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 bg-emerald-50/20 border border-emerald-100 rounded-2xl text-center text-emerald-800 space-y-2">
                        <CheckCircle className="w-8 h-8 mx-auto text-emerald-500" />
                        <p className="text-xs text-emerald-800 font-semibold">No Weakness Planes Present</p>
                        <p className="text-[10px] text-slate-500">Auspicious! Every plane has at least one node active, preventing full energetic holes.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Standard Planes visual key index */}
              <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm space-y-4 text-left">
                <h4 className="font-playfair text-lg font-bold text-[#1F2937]">Complete Loshu planes Reference Guide</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 bg-[#F8F4EF]/50 rounded-2xl border border-[#E5E7EB]/60">
                    <span className="block text-xs font-bold text-[#1F2937]">Mental Plane (4-9-2)</span>
                    <span className="block text-[10px] text-[#6B7280] leading-normal mt-1">Excellent for thoughts, research, deep intellectual logic, memory retention structures.</span>
                  </div>
                  <div className="p-4 bg-[#F8F4EF]/50 rounded-2xl border border-[#E5E7EB]/60">
                    <span className="block text-xs font-bold text-[#1F2937]">Emotional Plane (3-5-7)</span>
                    <span className="block text-[10px] text-[#6B7280] leading-normal mt-1">Governs active intuitive states, art, deeply artistic values, empathy capabilities.</span>
                  </div>
                  <div className="p-4 bg-[#F8F4EF]/50 rounded-2xl border border-[#E5E7EB]/60">
                    <span className="block text-xs font-bold text-[#1F2937]">Practical Plane (8-1-6)</span>
                    <span className="block text-[10px] text-[#6B7280] leading-normal mt-1">Practical trade skills, physical labor performance, handling solid liquid cash.</span>
                  </div>
                  <div className="p-4 bg-[#F8F4EF]/50 rounded-2xl border border-[#E5E7EB]/60">
                    <span className="block text-xs font-bold text-[#1F2937]">Prosperity Plane (4-5-6)</span>
                    <span className="block text-[10px] text-[#6B7280] leading-normal mt-1">Auspicous Golden Rajyoga representing high fortune, business leadership, material fame.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: REMEDIES ALTAR */}
          {activeSubTab === 'REMEDIES' && (
            <div className="space-y-8 animate-in duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Colors Altar */}
                <div className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm space-y-4">
                  <span className="text-3xl">🎨</span>
                  <h3 className="font-playfair text-lg font-bold text-[#1F2937]">Lucky Colors Altar</h3>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {analysisResult.luckyDetails.colors.map((color, idx) => (
                      <span key={idx} className="bg-[#F8F4EF] text-[#D97706] border border-[#D97706]/15 rounded-xl px-4 py-2 text-xs font-semibold">
                        {color}
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-500 text-[10px]">Wear or incorporate these in files, signature inks, or screen saver backdrops for solar alignment.</p>
                </div>

                {/* Gemstone Altar */}
                <div className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm space-y-4">
                  <span className="text-3xl">💎</span>
                  <h3 className="font-playfair text-lg font-bold text-[#1F2937]">Cosmic Gemstones</h3>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {analysisResult.luckyDetails.gemstones.map((gem, idx) => (
                      <span key={idx} className="bg-blue-50 text-[#1E3A8A] border border-blue-200 rounded-xl px-4 py-2 text-xs font-semibold">
                        {gem}
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-500 text-[10px]">Wear on specified metal rings on auspicious weekday sunrise hours. Consult with guru before mounting.</p>
                </div>

                {/* Lucky Numbers list */}
                <div className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm space-y-4">
                  <span className="text-3xl">⚜️</span>
                  <h3 className="font-playfair text-lg font-bold text-[#1F2937]">Resonating Numbers</h3>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {analysisResult.luckyDetails.numbers.map((numVal, idx) => (
                      <span key={idx} className="w-9 h-9 rounded-full bg-amber-50 text-[#D97706] border border-[#D97706]/20 flex items-center justify-center font-bold text-xs">
                        {numVal}
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-500 text-[10px]">Highly favorable digits for starting accounts, selection of plots, locker combinations, registration files.</p>
                </div>

              </div>

              {/* Personalized remedies guide list */}
              <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm space-y-6">
                <div className="flex gap-4 items-center">
                  <span className="text-3xl">🛡️</span>
                  <div>
                    <h3 className="font-playfair text-xl font-bold text-[#1F2937] tracking-wide">Personalized Lal Kitab & Vastu Altar Guidelines</h3>
                    <p className="text-[#6B7280] text-xs">Observe these spiritual rituals to clean karmic locks and stimulate latent grid channels.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {analysisResult.luckyDetails.remedies ? (
                    analysisResult.luckyDetails.remedies.map((rem, idx) => (
                      <div key={idx} className="p-4 bg-[#FDFCF7] border border-[#E5E7EB] rounded-2xl flex gap-3 text-left">
                        <Check className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 font-semibold leading-relaxed select-all">{rem}</span>
                      </div>
                    ))
                  ) : (
                    analysisResult.luckyDetails.remedies.map((rem, idx) => (
                      <div key={idx} className="p-4 bg-[#FDFCF7] border border-[#E5E7EB] rounded-2xl flex gap-3 text-left">
                        <Check className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 font-semibold leading-relaxed select-all">{rem}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: MAHADASHAS & PERIODS */}
          {activeSubTab === 'PERIODS' && (
            <div className="space-y-8 animate-in duration-500 select-all">
              
              {/* Highlight Active Dasha Box */}
              {analysisResult.currentMahadasha && (
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-8 rounded-[40px] shadow-lg relative overflow-hidden border border-[#D97706]/40">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFF_0.75px,transparent_0.75px)] [background-size:24px_24px]"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 text-left">
                      <span className="inline-flex items-center gap-1.5 bg-white/10 text-white px-3.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] font-extrabold border border-white/20">
                        ⚡ Active Planetary Phase (सक्रिय चक्र)
                      </span>
                      <h3 className="font-playfair text-2.5xl font-black">
                        Current Mahadasha: {analysisResult.currentMahadasha.planet}
                      </h3>
                      <p className="text-amber-50 text-xs font-semibold">
                        Ages: {analysisResult.currentMahadasha.startAge} - {analysisResult.currentMahadasha.endAge} ({analysisResult.currentMahadasha.startYear} to {analysisResult.currentMahadasha.endYear})
                      </p>
                      <p className="text-amber-100 text-xs max-w-2xl pt-1">
                        {analysisResult.currentMahadasha.meaning}
                      </p>
                    </div>

                    {analysisResult.currentAntardasha && (
                      <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-left space-y-1 min-w-[240px]">
                        <span className="block text-[8px] font-mono uppercase tracking-widest text-amber-200 font-bold">Sub-Period / Antardasha</span>
                        <span className="text-sm font-bold block">{analysisResult.currentAntardasha.planet} Phase</span>
                        <span className="block text-[10px] text-amber-100 italic leading-relaxed pt-1">
                          {analysisResult.currentAntardasha.meaning.split('.')[0]}.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Complete chronologial lifespan table */}
              <div className="glass-panel p-8 rounded-[40px] bg-white border-[#E5E7EB] shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]/70">
                  <h3 className="font-playfair text-xl font-bold text-[#1F2937]">Vedic Numerological Mahadasha Timeline</h3>
                  <span className="text-[10px] font-mono text-[#D97706] bg-[#D97706]/10 border border-[#D97706]/20 px-3 py-1 rounded-full uppercase font-bold">100-Year Life Grid</span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB]">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-[#F8F4EF]/75 font-mono text-slate-500 uppercase tracking-wider text-[9px] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="p-4 font-bold">Ruler Planet</th>
                        <th className="p-4 font-bold">Length</th>
                        <th className="p-4 font-bold">Age Interval</th>
                        <th className="p-4 font-bold">Years Range</th>
                        <th className="p-4 font-bold">Focal Vibrations Area</th>
                        <th className="p-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] font-sans text-[#1F2937]">
                      {analysisResult.mahadashas.map((dasha, idx) => (
                        <tr 
                          key={idx}
                          className={`hover:bg-[#F8F4EF]/20 transition-all ${
                            dasha.isCurrent ? 'bg-amber-50/50 font-semibold border-y border-amber-200' : ''
                          }`}
                        >
                          <td className="p-4 flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#D97706]/15 border border-[#D97706]/30 flex items-center justify-center font-mono text-[9px] text-[#D97706]">
                              {dasha.rulerNumber}
                            </span>
                            <span className="font-semibold">{dasha.planet}</span>
                          </td>
                          <td className="p-4 font-mono">{dasha.durationYears} Years</td>
                          <td className="p-4">Ages {dasha.startAge} - {dasha.endAge}</td>
                          <td className="p-4 font-mono text-slate-500">{dasha.startYear} to {dasha.endYear}</td>
                          <td className="p-4 text-slate-500 font-lora italic truncate max-w-xs" title={dasha.meaning}>
                            {dasha.meaning.substring(0, 70)}...
                          </td>
                          <td className="p-4">
                            {dasha.isCurrent ? (
                              <span className="bg-[#D97706] text-white text-[8px] font-mono font-bold uppercase py-1 px-3 rounded-full tracking-wider shadow-inner">
                                Active Now
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[9px]">Inactive</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pinnacles & Challenges side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 select-all">
                
                {/* Pinnacle Cycles */}
                <div className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm space-y-6 text-left border-l-4 border-l-[#D97706]">
                  <h3 className="font-playfair text-lg font-bold text-[#1F2937]">Pinnacle Cycles (शिखर काल चक्र)</h3>
                  <div className="space-y-4">
                    {analysisResult.pinnacles.map((p, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-4 bg-[#F8F4EF]/50 rounded-2xl border border-[#E5E7EB]/50">
                        <span className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-black font-mono text-xs border border-[#D97706]/20">
                          #{p.pinnacle}
                        </span>
                        <div>
                          <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">Phase {p.cycle}: {p.ageRange}</span>
                          <p className="text-[#1F2937] text-xs font-semibold leading-relaxed mt-0.5 italic">"{p.meaning}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenges */}
                <div className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm space-y-6 text-left border-l-4 border-l-[#1E3A8A]">
                  <h3 className="font-playfair text-lg font-bold text-[#1F2937]">Vedic Lifelong Challenges (चुनौतियाँ)</h3>
                  <div className="space-y-4">
                    {analysisResult.challenges.map((c, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-4 bg-blue-50/20 rounded-2xl border border-blue-200/50">
                        <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center font-black font-mono text-xs border border-blue-200">
                          #{c.challenge}
                        </span>
                        <div>
                          <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">Challenge Segment {c.cycle}</span>
                          <p className="text-[#1F2937] text-xs font-semibold leading-relaxed mt-0.5 italic">"{c.meaning}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: GRID COMPATIBILITY */}
          {activeSubTab === 'COMPATIBILITY' && (
            <div className="space-y-8 animate-in duration-500">
              
              <div className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm space-y-6">
                <div className="text-left space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#D97706] tracking-widest font-bold">Grid Synastry Diagnostic</span>
                  <h3 className="font-playfair text-xl font-bold text-[#1F2937]">Dual Loshu Grid Compatibility Analysis</h3>
                  <p className="text-slate-500 text-xs">
                    Input your partner, business associate, or family member's details to calculate overlapping planes, psychic planetary affinities, and receive a complete synastry audit.
                  </p>
                </div>

                <form onSubmit={handleCalculateCompatibility} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-end">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase text-[#6B7280]">Partner's Full Name</label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      required
                      className="w-full bg-[#F8F4EF] border border-[#E5E7EB] rounded-2xl px-5 py-3.5 outline-none text-xs text-[#1F2937]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase text-[#6B7280]">Partner's DOB</label>
                    <input
                      type="date"
                      value={partnerDob}
                      onChange={(e) => setPartnerDob(e.target.value)}
                      required
                      className="w-full bg-[#F8F4EF] border border-[#E5E7EB] rounded-2xl px-5 py-3.5 outline-none text-xs text-[#1F2937]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#D97706] hover:bg-[#B45309] text-white px-6 py-4 rounded-2xl transition text-xs font-bold uppercase tracking-widest cursor-pointer"
                  >
                    Compare Grids Bond
                  </button>
                </form>
              </div>

              {partnerResult && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left select-all"
                >
                  
                  {/* Radial Synastry Compass (Left) */}
                  <motion.div 
                    variants={itemVariants}
                    className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm flex flex-col justify-center items-center text-center space-y-6"
                  >
                    <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-wider font-bold">Synastry Resonance Rating</span>
                    
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#F8F4EF" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#D97706"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - partnerResult.score / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center select-none">
                        <span className="text-5xl font-playfair font-black text-[#1F2937]">{partnerResult.score}%</span>
                        <span className="block text-[8px] font-mono text-slate-500 uppercase mt-1 font-bold">Planetary Harmony</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Divine Verdict</span>
                      <p className="font-playfair text-lg text-[#1F2937] font-extrabold uppercase tracking-widest">{partnerResult.verdict}</p>
                    </div>
                  </motion.div>

                  {/* Detailed Forecast Breakdown (Right) */}
                  <motion.div 
                    variants={itemVariants}
                    className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm space-y-6"
                  >
                    <h4 className="font-playfair text-xl font-bold text-[#1F2937] pb-2 border-b border-[#E5E7EB]">Planetary Affinity Report</h4>
                    <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                      
                      <div>
                        <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-wider block font-bold">Affinity Matrix (grade)</span>
                        <p className="font-semibold text-[#1F2937] mt-1 select-all">Grade: {partnerResult.grade}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-wider block font-bold">Active Overlap Planes</span>
                        {partnerResult.overlapPlanes.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 mt-1 text-slate-600">
                            {partnerResult.overlapPlanes.map((o, idx) => <li key={idx}>{o}</li>)}
                          </ul>
                        ) : (
                          <p className="text-slate-400 italic mt-1">No major overlapping full strength planes present.</p>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-wider block font-bold">Planetary Affinity Notes</span>
                        <ul className="list-disc list-inside space-y-1 mt-1 text-slate-600">
                          {partnerResult.mutualStrengths.map((m, idx) => <li key={idx}>{m}</li>)}
                        </ul>
                      </div>

                      <div className="p-4 bg-[#F2E8DC]/40 border border-[#D97706]/10 rounded-xl">
                        <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-wider block font-bold mb-1">Grid Synergy Forecast</span>
                        <p className="italic text-slate-800 font-medium">"{partnerResult.partnershipForecast}"</p>
                      </div>

                    </div>
                  </motion.div>

                </motion.div>
              )}

            </div>
          )}

          {/* TAB 6: GURU AI REPORT */}
          {activeSubTab === 'AI_REPORT' && (
            <div className="space-y-6 animate-in duration-500">
              
              <div className="p-8 bg-white border border-[#E5E7EB] rounded-[40px] shadow-sm space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="bg-amber-100 p-3 rounded-full text-2xl">🔮</div>
                  <div>
                    <h3 className="font-playfair text-xl font-bold text-[#1F2937]">Generate 10-15 Page Equivalent Astro-Guru PDF Report</h3>
                    <p className="text-slate-500 text-xs">Invoke the server-side Gemini 3.5-Flash model to generate a majestic, personalized consultation report matching professional guidelines in pure respectful Hindi.</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={handleGenerateAIReport}
                    disabled={loadingReport}
                    className="bg-[#D97706] hover:bg-[#B45309] text-white px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer disabled:bg-slate-300 flex items-center gap-2 shadow-lg"
                  >
                    {loadingReport ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Gathering Cosmic Coordinates...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 animate-bounce" /> Cast Deep Gemini Hindi Report
                      </>
                    )}
                  </button>
                  
                  {aiReport && (
                    <button
                      onClick={() => setShowRawJSON(!showRawJSON)}
                      className="bg-[#F8F4EF] hover:bg-[#F2E8DC] text-[#1F2937] px-6 py-3.5 rounded-2xl text-xs font-semibold tracking-wider uppercase border border-[#E5E7EB]"
                    >
                      {showRawJSON ? 'Hide Structured JSON' : 'Show Structured JSON'}
                    </button>
                  )}
                </div>

                {reportError && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex gap-2 items-center">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{reportError}</span>
                  </div>
                )}
              </div>

              {/* Collapsed Structured Developer JSON view */}
              {showRawJSON && (
                <div className="p-6 bg-slate-900 text-slate-300 rounded-[30px] font-mono text-[11px] select-all overflow-x-auto border-t-4 border-t-[#D97706] text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                    <span className="text-amber-400 font-bold uppercase text-[9px] tracking-widest">Active Loshu API Diagnostic Schema</span>
                    <span className="text-slate-500">Ready for external systems integration</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{analysisResult.rawJSON}</pre>
                </div>
              )}

              {/* Renders generated markdown Report */}
              {aiReport ? (
                <div className="bg-white p-8 md:p-12 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-8 select-all text-left max-w-4xl mx-auto border-t-8 border-t-[#D97706] print:border-none print:shadow-none print:p-0">
                  <div className="text-center space-y-3 pb-6 border-b border-slate-200">
                    <span className="text-3xl">⚜️</span>
                    <h2 className="font-cinzel text-2.5xl font-extrabold tracking-widest text-[#1F2937] uppercase">लोशू ग्रिड आध्यात्मिक महावेध (Loshu Life Map)</h2>
                    <span className="text-[#D97706] font-mono text-[10px] tracking-widest uppercase font-bold">Personalized Advisory Report for {analysisResult.personalDetails.name}</span>
                  </div>
                  
                  <div className="markdown-body space-y-6 text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap select-all">
                    {aiReport}
                  </div>

                  <div className="pt-8 border-t border-slate-200 text-center flex flex-col items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">End of advisory report • Leo Occult sciences</span>
                    <button
                      onClick={handlePrint}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-black transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" /> Export Report copy
                    </button>
                  </div>
                </div>
              ) : (
                !loadingReport && (
                  <div className="p-16 text-center text-slate-400 bg-white border border-[#E5E7EB] rounded-[40px] space-y-3">
                    <StarsPlaceholder />
                    <p className="text-xs text-[#1F2937] font-semibold">Your AI Diagnostic report is waiting to be cast.</p>
                    <p className="text-[10px] max-w-xs mx-auto">Click "Cast Deep Gemini Hindi Report" above to initiate natural intelligence synthesis of all grid coordinates.</p>
                  </div>
                )
              )}

            </div>
          )}

          {/* TAB 7: STRUCTURED DEVELOPER JSON */}
          {activeSubTab === 'HISTORY' && (
            <div className="space-y-6 animate-in duration-500 text-left select-all">
              <div className="bg-white p-8 rounded-[40px] border border-[#E5E7EB] shadow-sm space-y-4">
                <h3 className="font-playfair text-xl font-bold text-[#1F2937]">Structured Developer JSON Output Schema</h3>
                <p className="text-slate-500 text-xs">
                  Below is the pristine, machine-readable JSON object representing all computed parameters from the Loshu Grid and Astrological equations. Designed for seamless future API bindings or database ingestion.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      const blob = new Blob([analysisResult.rawJSON], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `loshu_${analysisResult.personalDetails.name.toLowerCase().replace(/\s+/g,'_')}.json`;
                      a.click();
                    }}
                    className="bg-[#1F2937] text-white font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-xl hover:bg-black transition flex items-center gap-2 w-full md:w-auto justify-center"
                  >
                    <Download className="w-4 h-4" /> Download JSON File
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-slate-300 rounded-[30px] font-mono text-[11px] overflow-x-auto border-t-4 border-t-[#D97706]">
                <pre className="whitespace-pre-wrap">{analysisResult.rawJSON}</pre>
              </div>

            </div>
          )}

        </div>
      ) : (
        <div className="p-16 text-center text-slate-400 bg-white border border-[#E5E7EB] rounded-[40px] space-y-4">
          <Compass className="w-12 h-12 text-[#D97706]/40 mx-auto animate-spin-slow" />
          <h3 className="font-playfair text-xl font-bold text-[#1F2937]">Cast Your Loshu Grid Chart</h3>
          <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500">
            Please type in your full candidate name and date of birth in the alignment panel above to fetch all numerical coordinates.
          </p>
        </div>
      )}

    </div>
  );
};

// Simple visual spacer icon
const StarsPlaceholder = () => (
  <div className="flex gap-1 justify-center text-[#D97706]/35 my-2">
    <Star className="w-5 h-5 fill-current" />
    <Star className="w-5 h-5 fill-current scale-120 text-[#D97706]" />
    <Star className="w-5 h-5 fill-current" />
  </div>
);

export default CompleteLoshuGridAnalysis;
