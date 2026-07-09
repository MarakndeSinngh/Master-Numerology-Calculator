import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trash2, Eye, EyeOff } from 'lucide-react';
import { VisualMetrics } from './signatureImageAnalysis';

interface SignatureImagePreviewProps {
  imageSrc: string;
  isScanning: boolean;
  onRemove: () => void;
  language: string;
  metrics?: VisualMetrics | null;
}

export const SignatureImagePreview: React.FC<SignatureImagePreviewProps> = ({
  imageSrc,
  isScanning,
  onRemove,
  language,
  metrics
}) => {
  const isHi = language === 'hi';
  const [showDebug, setShowDebug] = useState(false);

  // Determine dot coordinates based on position
  let dotY = "50%";
  if (metrics?.finalDotPosition === 'upperRight') dotY = "30%";
  if (metrics?.finalDotPosition === 'lowerRight') dotY = "70%";

  // Determine underline Y position
  const isCuts = metrics?.underlinePosition === 'cutsName' || metrics?.underlineCutsSignature;
  const underlineY = isCuts ? "60%" : "78%";

  return (
    <div className="relative w-full max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl overflow-hidden group">
      {/* Dynamic Coordinate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-25" />
      
      {/* Corner Focus Reticles */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br" />

      {/* Signature Image Display */}
      <div className="relative w-full aspect-[4/3] bg-slate-900/50 rounded-2xl flex items-center justify-center p-6 border border-slate-800 overflow-hidden">
        <img
          src={imageSrc}
          alt="Uploaded Signature"
          className="max-w-full max-h-full object-contain filter invert opacity-90 contrast-125 select-none"
          referrerPolicy="no-referrer"
        />

        {/* ADMIN VISUAL DEBUG OVERLAY */}
        {showDebug && metrics && (
          <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-20">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* 1. Global Ink Bounding Box (dashed green) */}
              <rect 
                x="12" y="18" width="76" height="64" 
                fill="none" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2,2" 
              />
              <text x="14" y="24" fill="#10b981" fontSize="3" fontFamily="monospace" fontWeight="bold">INK BOUNDS</text>

              {/* 2. Start Clutter Zone (shaded purple left 28%) */}
              <rect 
                x="12" y="18" width="22" height="64" 
                fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="1,1" 
              />
              <text x="13" y="78" fill="#a855f7" fontSize="3" fontFamily="monospace" fontWeight="bold">START ZONE</text>
              <text x="13" y="81" fill="#a855f7" fontSize="2" fontFamily="monospace">
                {`Score: ${metrics.startClutterScore}`}
              </text>

              {/* 3. Estimated Baseline Slant (blue angle line) */}
              <line 
                x1="12" y1="50" x2="88" y2={50 - (metrics.baselineAngle * 0.5)} 
                stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="3,1" 
              />
              <text x="50" y="46" fill="#3b82f6" fontSize="3" fontFamily="monospace" fontWeight="bold">
                {`BASELINE (${metrics.baselineAngle}°)`}
              </text>

              {/* 4. Underline trajectory (gold line) */}
              {metrics.hasUnderline && (
                <>
                  <line 
                    x1="20" y1={underlineY} x2="80" y2={parseFloat(underlineY) - (metrics.underlineAngle * 0.4) + "%"} 
                    stroke="#fbbf24" strokeWidth="1.2" 
                  />
                  <text x="40" y={parseFloat(underlineY) - 3 + "%"} fill="#fbbf24" fontSize="3" fontFamily="monospace" fontWeight="bold">
                    {`UNDERLINE (${metrics.underlineAngle}°)`}
                  </text>
                </>
              )}

              {/* 5. Final Dot Target (red target & text) */}
              {metrics.hasFinalDot && (
                <>
                  <circle cx="86" cy={dotY} r="3" fill="none" stroke="#ef4444" strokeWidth="0.6" />
                  <circle cx="86" cy={dotY} r="0.8" fill="#ef4444" />
                  <text x="75" y={parseFloat(dotY) - 4 + "%"} fill="#ef4444" fontSize="3" fontFamily="monospace" fontWeight="bold">DOT TARGET</text>
                </>
              )}

              {/* 6. Loop Detection Highlights (Teal Circles) */}
              {metrics.loopBalance !== 'weak' && (
                <>
                  <circle cx="45" cy="45" r="4" fill="none" stroke="#14b8a6" strokeWidth="0.6" strokeDasharray="1,1" />
                  <circle cx="58" cy="40" r="5" fill="none" stroke="#14b8a6" strokeWidth="0.6" strokeDasharray="1,1" />
                  <text x="40" y="34" fill="#14b8a6" fontSize="3" fontFamily="monospace" fontWeight="bold">ENCLOSED LOOPS</text>
                </>
              )}
            </svg>
          </div>
        )}

        {/* Moving Scanning Laser Radar Line */}
        {isScanning && (
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2.5,
              ease: "easeInOut"
            }}
            className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] z-10"
          />
        )}
        
        {/* Decorative Grid Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
          <div className="w-16 h-16 border border-emerald-500 rounded-full animate-ping" />
        </div>
      </div>

      {/* Control Panel */}
      <div className="relative z-10 flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
            {isScanning 
              ? (isHi ? "वास्तु स्कैनिंग सक्रिय..." : "Optical Vastu Active...") 
              : (isHi ? "छवि लॉक और सिंक की गई" : "Image Sync Locked")
            }
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Debug overlay toggle button */}
          {metrics && !isScanning && (
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono transition-all uppercase cursor-pointer"
              title="Toggle Dev/Admin Analysis Overlay"
            >
              {showDebug ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
              {showDebug ? (isHi ? "डिबग छुपाएं" : "Hide Debug") : (isHi ? "डिबग दिखाएं" : "Show Debug")}
            </button>
          )}

          {!isScanning && (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1.5 bg-red-950/40 border border-red-800/60 hover:bg-red-900/40 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono transition-all uppercase cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isHi ? "छवि हटाएं" : "Remove Image"}
            </button>
          )}
        </div>
      </div>

      {/* Scanner metadata log overlay */}
      {isScanning && (
        <div className="absolute bottom-2 left-4 right-4 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl flex items-center justify-between text-[9px] font-mono text-emerald-400">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span>Analyzing ink density vectors...</span>
          </div>
          <span>UTC 2026.07</span>
        </div>
      )}
    </div>
  );
};
