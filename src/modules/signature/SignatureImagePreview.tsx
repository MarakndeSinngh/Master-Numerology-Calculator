import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Crop, Trash2 } from 'lucide-react';

interface SignatureImagePreviewProps {
  imageSrc: string;
  isScanning: boolean;
  onRemove: () => void;
  language: string;
}

export const SignatureImagePreview: React.FC<SignatureImagePreviewProps> = ({
  imageSrc,
  isScanning,
  onRemove,
  language
}) => {
  const isHi = language === 'hi';

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
