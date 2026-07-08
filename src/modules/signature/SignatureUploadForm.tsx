import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, User, Calendar, Smartphone, FileText, Info } from 'lucide-react';
import { getTranslatedKey } from './signatureInterpretationKeys';

interface SignatureUploadFormProps {
  onSubmit: (data: {
    name: string;
    dob: string;
    gender: string;
    mobile: string;
    intent: string;
    hand: string;
    image: string; // base64 string
  }) => void;
  isLoading: boolean;
  language: string;
}

export const SignatureUploadForm: React.FC<SignatureUploadFormProps> = ({
  onSubmit,
  isLoading,
  language
}) => {
  const isHi = language === 'hi';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('MALE');
  const [mobile, setMobile] = useState('');
  const [intent, setIntent] = useState('CAREER');
  const [hand, setHand] = useState('RIGHT');
  const [image, setImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);

  // Helper to read file as base64
  const processFile = (file: File) => {
    setError(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(isHi ? 'केवल JPG, PNG, या WEBP छवियाँ स्वीकार्य हैं।' : 'Only JPG, PNG, or WEBP images are accepted.');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(isHi ? 'छवि का आकार 5MB से कम होना चाहिए।' : 'Image size must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setError(isHi ? 'फ़ाइल पढ़ने में त्रुटि।' : 'Error reading file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name (required)
    if (!name.trim()) {
      setError(getTranslatedKey(language, "signature.form.error.nameRequired"));
      return;
    }

    // Validate image (required)
    if (!image) {
      setError(getTranslatedKey(language, "signature.form.error.imageRequired"));
      return;
    }

    // Validate mobile (optional, 10 digits)
    if (mobile.trim() && !/^\d{10}$/.test(mobile.trim())) {
      setError(getTranslatedKey(language, "signature.form.error.invalidMobile"));
      return;
    }

    onSubmit({
      name,
      dob,
      gender,
      mobile,
      intent,
      hand,
      image
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="bg-white/80 backdrop-blur-md border border-[#F2E8DC] rounded-3xl p-6 shadow-sm space-y-5">
        
        {/* Full Name & DOB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {getTranslatedKey(language, "signature.form.fullName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={getTranslatedKey(language, "signature.form.fullNamePlaceholder")}
              className="w-full bg-white border border-slate-200 text-xs px-4 py-3 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {getTranslatedKey(language, "signature.form.dob")}
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs px-4 py-3 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] transition-all"
            />
          </div>
        </div>

        {/* Gender Alignment & Mobile Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
              {getTranslatedKey(language, "signature.form.gender")}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs px-4 py-3 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] transition-all"
            >
              <option value="MALE">{getTranslatedKey(language, "signature.form.gender.male")}</option>
              <option value="FEMALE">{getTranslatedKey(language, "signature.form.gender.female")}</option>
              <option value="OTHER">{getTranslatedKey(language, "signature.form.gender.other")}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              {getTranslatedKey(language, "signature.form.mobile")}
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder={getTranslatedKey(language, "signature.form.mobilePlaceholder")}
              className="w-full bg-white border border-slate-200 text-xs px-4 py-3 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] transition-all"
            />
          </div>
        </div>

        {/* Signature Intent & Writing Hand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {getTranslatedKey(language, "signature.form.intent")}
            </label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs px-4 py-3 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] transition-all"
            >
              <option value="CAREER">{getTranslatedKey(language, "signature.form.intent.career")}</option>
              <option value="BUSINESS">{getTranslatedKey(language, "signature.form.intent.business")}</option>
              <option value="FINANCE">{getTranslatedKey(language, "signature.form.intent.finance")}</option>
              <option value="LEADERSHIP">{getTranslatedKey(language, "signature.form.intent.leadership")}</option>
              <option value="HARMONY">{getTranslatedKey(language, "signature.form.intent.harmony")}</option>
              <option value="GENERAL">{getTranslatedKey(language, "signature.form.intent.general")}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
              {getTranslatedKey(language, "signature.form.writingHand")}
            </label>
            <select
              value={hand}
              onChange={(e) => setHand(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs px-4 py-3 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A] transition-all"
            >
              <option value="RIGHT">{getTranslatedKey(language, "signature.form.hand.right")}</option>
              <option value="LEFT">{getTranslatedKey(language, "signature.form.hand.left")}</option>
              <option value="AMBI">{getTranslatedKey(language, "signature.form.hand.ambi")}</option>
              <option value="UNKNOWN">{getTranslatedKey(language, "signature.form.hand.unknown")}</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop File Upload */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
            {getTranslatedKey(language, "signature.form.upload")} <span className="text-red-500">*</span>
          </label>
          
          {image ? (
            <div className="border border-dashed border-emerald-500/40 bg-emerald-50/20 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2">
              <span className="text-xs text-emerald-800 font-medium font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                {isHi ? "हस्ताक्षर छवि सुरक्षित रूप से अपलोड की गई!" : "Signature Image Successfully Locked!"}
              </span>
              <button
                type="button"
                onClick={() => setImage('')}
                className="text-[10px] font-mono text-red-600 font-bold underline uppercase tracking-wider hover:text-red-500 cursor-pointer"
              >
                {getTranslatedKey(language, "signature.form.removeImage")}
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? 'border-[#1E3A8A] bg-slate-50/80 scale-[0.99]'
                  : 'border-slate-200 bg-white hover:border-[#1E3A8A]/40 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mb-3 animate-bounce" />
              <p className="text-xs font-semibold text-slate-700">
                {getTranslatedKey(language, "signature.form.dragDrop")}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {getTranslatedKey(language, "signature.form.uploadRules")}
              </p>
            </div>
          )}
        </div>

        {/* Form Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Legal / Astrological Disclaimer */}
        <div className="bg-amber-50/60 border border-amber-200/50 rounded-2xl p-4 flex gap-3 items-start">
          <Info className="w-4.5 h-4.5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 leading-relaxed">
            <strong>{isHi ? "वास्तु अस्वीकरण:" : "Handwriting Vastu Disclaimer:"}</strong> {getTranslatedKey(language, "signature.disclaimer")}
          </p>
        </div>
      </div>

      {/* Submit Trigger */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isLoading}
          className={`py-4 px-10 rounded-full text-xs font-bold tracking-widest uppercase shadow-md flex items-center gap-2 cursor-pointer transition-all duration-300 ${
            isLoading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-[#1E3A8A] text-white hover:bg-[#1e3a8a]/95 hover:shadow-xl active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              {getTranslatedKey(language, "signature.form.analyzing")}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              {getTranslatedKey(language, "signature.form.analyze")}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
