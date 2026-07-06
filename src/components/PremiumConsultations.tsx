import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Car, Home, Briefcase, FileText, UserPlus, TrendingUp, Calendar, ChevronRight, Sparkles, Award, ShieldAlert, CheckCircle, RefreshCw, Star, ArrowRight, Info, Eye, Clock, User, Heart, Compass, Activity,
  Camera, Upload, X, Check, AlertTriangle, Trash2, FileImage, Shield
} from 'lucide-react';
import { 
  analyzeVehicleNumerology, 
  analyzeHouseNumerology, 
  analyzeBusinessNumerology, 
  analyzeSignatureStyle,
  generateChildNumerology, 
  generateLuckyDatesSuite,
  VehicleReport, 
  HouseReport, 
  BusinessReport, 
  ChildReport,
  SignatureReport,
  LuckyDatesSuite
} from '../services/premiumModules';
import { generateMedicalNumerologyReport, MedicalReport } from '../services/medicalNumerologyEngine';
import { generateNumeroVaastuReport, NumeroVaastuReport } from '../services/numeroVaastuEngine';
import { calculateDashaAndYearForecast, DashaAnalysisReport } from '../services/dashaEngine';

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
};

export default function PremiumConsultations() {
  const [activeModule, setActiveModule] = useState<'VEHICLE' | 'HOUSE' | 'BUSINESS' | 'SIGNATURE' | 'CHILD' | 'LUCKY_DATES' | 'MEDICAL' | 'VAASTU' | 'DASHA'>('VEHICLE');

  React.useEffect(() => {
    const handleSwitch = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setActiveModule(detail);
      }
    };
    window.addEventListener('switch-premium-module', handleSwitch);
    return () => {
      window.removeEventListener('switch-premium-module', handleSwitch);
    };
  }, []);

  // Load saved profiles from localStorage and handle camera cleanup on unmount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('leo_saved_consultation_profiles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedProfiles(parsed);
          setSelectedProfileIndex(0);
          setSigName(parsed[0].name || '');
          setSigDob(parsed[0].dob || '');
        }
      }
    } catch (e) {
      console.error("Error loading saved consultation profiles:", e);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Input States
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleDriver, setVehicleDriver] = useState<number>(1);
  const [vehicleResult, setVehicleResult] = useState<VehicleReport | null>(null);

  const [houseNumber, setHouseNumber] = useState('');
  const [houseResult, setHouseResult] = useState<HouseReport | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [businessDriver, setBusinessDriver] = useState<number>(1);
  const [businessResult, setBusinessResult] = useState<BusinessReport | null>(null);

  const [signatureStyle, setSignatureStyle] = useState<string>('RISING_UNDERLINE');
  const [signatureResult, setSignatureResult] = useState<SignatureReport | null>(analyzeSignatureStyle('RISING_UNDERLINE'));

  const [childDob, setChildDob] = useState('');
  const [childResult, setChildResult] = useState<ChildReport | null>(null);

  const [luckyDatesDriver, setLuckyDatesDriver] = useState<number>(1);
  const [luckyDatesConductor, setLuckyDatesConductor] = useState<number>(1);
  const [luckySuiteResult, setLuckySuiteResult] = useState<LuckyDatesSuite | null>(null);

  // New Engines Input States
  const [medicalDob, setMedicalDob] = useState('');
  const [medicalName, setMedicalName] = useState('');
  const [medicalResult, setMedicalResult] = useState<MedicalReport | null>(null);

  const [vaastuDob, setVaastuDob] = useState('');
  const [vaastuGender, setVaastuGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [vaastuName, setVaastuName] = useState('');
  const [vaastuResult, setVaastuResult] = useState<NumeroVaastuReport | null>(null);

  const [dashaDob, setDashaDob] = useState('');
  const [dashaYear, setDashaYear] = useState<number>(2026);
  const [dashaResult, setDashaResult] = useState<DashaAnalysisReport | null>(null);

  // AI Signature Audit states
  const [sigName, setSigName] = useState('');
  const [sigDob, setSigDob] = useState('');
  const [sigProfession, setSigProfession] = useState('');
  const [sigImage, setSigImage] = useState<string | null>(null);
  const [sigFileName, setSigFileName] = useState<string | null>(null);
  const [isAnalyzingSig, setIsAnalyzingSig] = useState(false);
  const [sigAuditResult, setSigAuditResult] = useState<any | null>(null);
  const [sigCameraActive, setSigCameraActive] = useState(false);
  const [sigError, setSigError] = useState<string | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(-1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileUploadSuccess, setFileUploadSuccess] = useState(false);

  // Signature description questionnaire states
  const [sigDescNameSigned, setSigDescNameSigned] = useState('');
  const [sigDescSize, setSigDescSize] = useState('Medium');
  const [sigDescSlant, setSigDescSlant] = useState('Straight');
  const [sigDescLegibility, setSigDescLegibility] = useState('Very Clear');
  const [sigDescUnderline, setSigDescUnderline] = useState('No');
  const [sigDescUnderlineDesc, setSigDescUnderlineDesc] = useState('');
  const [sigDescFlourishes, setSigDescFlourishes] = useState('No');
  const [sigDescFlourishesDesc, setSigDescFlourishesDesc] = useState('');
  const [sigDescPressure, setSigDescPressure] = useState('Medium');
  const [sigDescSpeed, setSigDescSpeed] = useState('Quick and flowing');
  const [sigDescFirstVsLast, setSigDescFirstVsLast] = useState('First name more prominent');
  const [sigDescSpecial, setSigDescSpecial] = useState('');

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Expanded explanations states ("Why This Result?")
  const [showVehicleWhy, setShowVehicleWhy] = useState(false);
  const [showHouseWhy, setShowHouseWhy] = useState(false);
  const [showBusinessWhy, setShowBusinessWhy] = useState(false);
  const [showSignatureWhy, setShowSignatureWhy] = useState(false);
  const [showChildWhy, setShowChildWhy] = useState(false);
  const [showDatesWhy, setShowDatesWhy] = useState(false);
  const [showMedicalWhy, setShowMedicalWhy] = useState(false);
  const [showVaastuWhy, setShowVaastuWhy] = useState(false);
  const [showDashaWhy, setShowDashaWhy] = useState(false);

  // Advanced House States
  const [houseMode, setHouseMode] = useState<'QUICK' | 'ADVANCED'>('QUICK');
  const [flatNumberInput, setFlatNumberInput] = useState('');
  const [floorInput, setFloorInput] = useState('');
  const [streetNameInput, setStreetNameInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [pinCodeInput, setPinCodeInput] = useState('');
  const [facingDirectionInput, setFacingDirectionInput] = useState('North');
  const [entranceDirectionInput, setEntranceDirectionInput] = useState('East');
  const [propertyTypeInput, setPropertyTypeInput] = useState('Apartment');
  const [propertyAgeInput, setPropertyAgeInput] = useState('');
  const [purposeInput, setPurposeInput] = useState('Residential');

  // Occupant Details
  const [occupantNameInput, setOccupantNameInput] = useState('');
  const [occupantDobInput, setOccupantDobInput] = useState('');
  const [familyCountInput, setFamilyCountInput] = useState('');
  const [familyDobsInput, setFamilyDobsInput] = useState('');

  // Results tab state
  const [activeVastuTab, setActiveVastuTab] = useState<'OVERVIEW' | 'ROOMS' | 'DIRECTIONS' | 'REMEDIES' | 'TIMING'>('OVERVIEW');

  const [houseOwnerDriver, setHouseOwnerDriver] = useState<number>(1);
  const [advancedHouseResult, setAdvancedHouseResult] = useState<any | null>(null);
  const [isAnalyzingHouse, setIsAnalyzingHouse] = useState(false);
  const [houseError, setHouseError] = useState<string | null>(null);

  // AI Business Name Generator States
  const [businessMode, setBusinessMode] = useState<'CHECK' | 'GENERATE' | 'OPTIMAL'>('CHECK');
  const [bizIndustry, setBizIndustry] = useState<'TECH' | 'FINANCE' | 'SPIRITUAL' | 'CORPORATE' | 'CREATIVE'>('TECH');
  const [bizKeywords, setBizKeywords] = useState('');
  const [bizVibe, setBizVibe] = useState<'PREMIUM' | 'MODERN' | 'SPIRITUAL' | 'CORPORATE' | 'CREATIVE'>('MODERN');
  const [bizGeneratedNames, setBizGeneratedNames] = useState<any[]>([]);
  const [isGeneratingBiz, setIsGeneratingBiz] = useState(false);
  const [bizGenError, setBizGenError] = useState<string | null>(null);

  // Optimal Business Naming States
  const [optIndustry, setOptIndustry] = useState('');
  const [optBusinessType, setOptBusinessType] = useState<'Product' | 'Service' | 'Both'>('Both');
  const [optTargetAudience, setOptTargetAudience] = useState('');
  const [optKeywordsInclude, setOptKeywordsInclude] = useState('');
  const [optKeywordsAvoid, setOptKeywordsAvoid] = useState('');
  const [optOwnerName, setOptOwnerName] = useState('');
  const [optOwnerDob, setOptOwnerDob] = useState('');
  const [optNameLength, setOptNameLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
  const [optTonePreference, setOptTonePreference] = useState<'Modern' | 'Traditional' | 'Creative' | 'Professional' | 'Fun'>('Modern');
  const [optResult, setOptResult] = useState<any | null>(null);
  const [isGeneratingOpt, setIsGeneratingOpt] = useState(false);
  const [optError, setOptError] = useState<string | null>(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);

  // Helper calculations for Naming
  const CHALDEAN_MAP: Record<string, number> = {
    a: 1, i: 1, j: 1, q: 1, y: 1,
    b: 2, k: 2, r: 2,
    c: 3, g: 3, l: 3, s: 3,
    d: 4, m: 4, t: 4,
    e: 5, h: 5, n: 5, x: 5,
    u: 6, v: 6, w: 6,
    o: 7, z: 7,
    f: 8, p: 8
  };
  const calcChaldean = (str: string): number => {
    return str.toLowerCase().split('').reduce((acc, char) => acc + (CHALDEAN_MAP[char] || 0), 0);
  };
  const rToSingle = (num: number): number => {
    let reduced = num;
    while (reduced > 9) {
      reduced = reduced.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    }
    return reduced;
  };
  const getDriverAndConductor = (dobStr: string) => {
    if (!dobStr) return { driver: 5, conductor: 6 };
    let day = 1;
    let digitsStr = dobStr.replace(/[^0-9]/g, '');
    
    if (dobStr.includes('-')) {
      const parts = dobStr.split('-');
      day = parseInt(parts[2], 10) || 1;
    } else if (dobStr.includes('/')) {
      const parts = dobStr.split('/');
      day = parseInt(parts[0], 10) || 1;
    } else {
      day = parseInt(dobStr.substring(8, 10), 10) || 1;
    }
    
    let driver = day;
    while (driver > 9) {
      driver = driver.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
    }
    
    let conductor = digitsStr.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
    while (conductor > 9) {
      conductor = conductor.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
    }
    
    return { driver, conductor };
  };

  // Handlers
  const handleMedicalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalDob) return;
    const report = generateMedicalNumerologyReport(medicalDob, medicalName || 'Seeker');
    setMedicalResult(report);
    setShowMedicalWhy(false);
  };

  const handleVaastuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaastuDob) return;
    const report = generateNumeroVaastuReport(vaastuDob, vaastuGender, vaastuName || 'Seeker');
    setVaastuResult(report);
    setShowVaastuWhy(false);
  };

  const handleDashaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashaDob) return;
    const report = calculateDashaAndYearForecast(dashaDob, dashaYear);
    setDashaResult(report);
    setShowDashaWhy(false);
  };
  // Handlers
  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiclePlate.trim()) return;
    const report = analyzeVehicleNumerology(vehiclePlate, vehicleDriver);
    setVehicleResult(report);
    setShowVehicleWhy(false);
  };

  const handleHouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNumber.trim()) return;
    const report = analyzeHouseNumerology(houseNumber);
    setHouseResult(report);
    setShowHouseWhy(false);
  };

  const handleAdvancedHouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzingHouse(true);
    setHouseError(null);
    try {
      const response = await fetch('/api/check-house-vibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flatNumber: flatNumberInput,
          floor: floorInput,
          streetName: streetNameInput,
          city: cityInput,
          pinCode: pinCodeInput,
          facingDirection: facingDirectionInput,
          entranceDirection: entranceDirectionInput,
          propertyType: propertyTypeInput,
          propertyAge: propertyAgeInput,
          purpose: purposeInput,
          occupantName: occupantNameInput,
          occupantDob: occupantDobInput,
          familyCount: familyCountInput,
          familyDobs: familyDobsInput,
          ownerDriver: houseOwnerDriver
        })
      });
      if (!response.ok) throw new Error('Failed to audit house address vibrations.');
      const data = await response.json();
      setAdvancedHouseResult(data);
    } catch (err: any) {
      console.error(err);
      setHouseError(err.message || 'An error occurred.');
    } finally {
      setIsAnalyzingHouse(false);
    }
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;
    const report = analyzeBusinessNumerology(businessName, businessDriver);
    setBusinessResult(report);
    setShowBusinessWhy(false);
  };

  const handleGenerateBusinessNames = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingBiz(true);
    setBizGenError(null);
    try {
      const response = await fetch('/api/generate-business-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerDriver: businessDriver,
          ownerConductor: 6, // default Venus harmony Conductor
          industry: bizIndustry,
          keywords: bizKeywords,
          vibePreference: bizVibe
        })
      });
      if (!response.ok) throw new Error('Failed to generate brand names.');
      const data = await response.json();
      setBizGeneratedNames(data.names || []);
    } catch (err: any) {
      console.error(err);
      setBizGenError(err.message || 'An error occurred.');
    } finally {
      setIsGeneratingBiz(false);
    }
  };

  const handleGenerateOptimalNames = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingOpt(true);
    setOptError(null);
    try {
      const response = await fetch('/api/generate-optimal-business-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: optIndustry,
          businessType: optBusinessType,
          targetAudience: optTargetAudience,
          keywordsInclude: optKeywordsInclude,
          keywordsAvoid: optKeywordsAvoid,
          ownerName: optOwnerName,
          ownerDob: optOwnerDob,
          nameLength: optNameLength,
          tonePreference: optTonePreference
        })
      });
      if (!response.ok) throw new Error('Failed to generate optimal business names.');
      const data = await response.json();
      setOptResult(data);
      setSelectedResultIndex(0); // select the first result automatically
    } catch (err: any) {
      console.error(err);
      setOptError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGeneratingOpt(false);
    }
  };

  const handleSignatureTrigger = (style: string) => {
    setSignatureStyle(style);
    const report = analyzeSignatureStyle(style);
    setSignatureResult(report);
    setShowSignatureWhy(false);
  };

  // Helper calculations for Signature Numerology Integration
  const getDriverNumber = (dateStr: string): number => {
    if (!dateStr) return 1;
    const parts = dateStr.split('-');
    if (parts.length < 3) return 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(day)) return 1;
    const sum = String(day).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    return sum > 9 ? String(sum).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0) : sum;
  };

  const getConductorNumber = (dateStr: string): number => {
    if (!dateStr) return 1;
    const digits = dateStr.replace(/[^0-9]/g, '');
    let sum = digits.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    while (sum > 9) {
      sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    }
    return sum;
  };

  const getChaldeanNameNumber = (nameStr: string): number => {
    if (!nameStr) return 1;
    const CHALDEAN_MAP: Record<string, number> = {
      A: 1, I: 1, J: 1, Q: 1, Y: 1,
      B: 2, K: 2, R: 2,
      C: 3, G: 3, L: 3, S: 3,
      D: 4, M: 4, T: 4,
      E: 5, H: 5, N: 5, X: 5,
      U: 6, V: 6, W: 6,
      O: 7, Z: 7,
      F: 8, P: 8
    };
    const norm = nameStr.toUpperCase().replace(/[^A-Z]/g, '');
    let sum = norm.split('').reduce((acc, char) => acc + (CHALDEAN_MAP[char] || 0), 0);
    return sum;
  };

  const getSingleDigit = (num: number): number => {
    let temp = num;
    while (temp > 9) {
      temp = String(temp).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    }
    return temp;
  };

  const generateLocalFallbackSignatureAudit = (styleId: string, name: string, dob: string) => {
    const finalStyleId = styleId || "RISING_UNDERLINE";
    const driver = getDriverNumber(dob);
    const conductor = getConductorNumber(dob);
    const nameNumber = getChaldeanNameNumber(name);

    if (finalStyleId === "TRAILING_DOT_BELOW") {
      return {
        analysis: {
          direction: "Flat or slightly wave-like direction, showing high resilience and adaptability under changing corporate environments.",
          size: "Compact but highly dense strokes, symbolizing a focused, detail-oriented personality with high privacy boundaries.",
          firstLetterSize: `The first letter of '${name}' is exceptionally prominent, almost 3x larger than lowercase characters, showing strong personal pride but also a subconscious defensive shield.`,
          underlineStyle: "No active underline is used, signifying a desire to operate independently without relying on traditional safety nets.",
          endStroke: "The end stroke curves backward or stops abruptly, indicating an analytical mind that thoroughly evaluates risks before executing actions.",
          dotPlacement: "A single prominent trailing dot is placed below the final character, which acts as a subconscious anchor but can sometimes create blockages if too heavy.",
          letterLegibility: "Moderate legibility with stylized trailing loops, reflecting a highly strategic thinker who keeps their core plans close to their chest.",
          nameCompletion: "First name is fully spelled out with a bold, stylized dot, while the surname is omitted, indicating a self-made persona.",
          overallFlow: "Calculated, rhythmic, but with sharp angular turns that show high analytical power and mechanical precision."
        },
        scores: {
          careerScore: 78,
          financialFlowScore: 75,
          recognitionScore: 82,
          leadershipScore: 85,
          businessSuccessScore: 80,
          relationshipHarmonyScore: 72,
          overallSignatureScore: 79
        },
        assessment: {
          currentSignatureAssessment: `This style features an exceptionally large first letter paired with a trailing dot below or after the signature. For ${name}, with Driver #${driver} and Conductor #${conductor}, this indicates high self-reliance, strategic reserve, and a strong self-protection mechanism. Co-ruled by Rahu and Saturn, it gives you deep investigative powers and a sharp, critical mind. However, the isolated trailing dot acts as a cosmic full-stop or anchor. While it provides deep grounding, it can also manifest as subconscious roadblocks, sudden delays, or a tendency to stall key decisions at the final hour.`,
          strengths: [
            "Exceptional self-image and individual drive symbolized by the large initial.",
            "Excellent risk management and analytical evaluation of details.",
            "High capacity for independent decision-making and strategic planning."
          ],
          weaknesses: [
            "The isolated dot creates a sudden energy block, slowing down progress.",
            "Lack of an underline foundation may cause feelings of being unsupported in critical situations.",
            "Abrupt end strokes can lead to sudden, unexplained endings in partnerships."
          ],
          riskAreas: [
            "Tendency to attract sudden administrative audits or legal hurdles due to the Rahu-Saturn dot configuration.",
            "Communication blockages or misunderstanding with close business associates."
          ],
          recommendedCorrections: [
            "Shift the trailing dot from being a solitary stop to a supporting double dot below a new foundation underline.",
            "Soften the sharp angles in the middle characters to allow smoother energy flow and reduce internal stress.",
            "Ensure the end stroke of your last letter sweeps forward and upward rather than stopping abruptly.",
            "Write your new signature with a green or black ink pen on clean unruled paper 21 times before sleeping."
          ],
          idealSignatureStyle: "A prominent first letter, followed by fluid legible middle letters, supported by a clean ascending underline with two balanced dots below.",
          personalizedSignatureBlueprint: "Start with a grand, rounded first letter. Write the rest of your name in a flowing, legible script. Draw a straight, slightly rising underline. Place two small, neat dots horizontally below the middle of the underline."
        },
        beforeAfter: {
          before: {
            visualDescription: "A heavy, isolated dot at the very end of a flat signature, with sharp angles and a closed, abrupt ending.",
            impact: "Manifests as sudden blockages in cash flow and unexpected operational delays right when deals are about to close."
          },
          after: {
            visualDescription: "A fluid, legible script with an upward-pointing exit stroke, supported by a clean underline and two balanced dots beneath it.",
            impact: "Releases stagnant funds, brings friendly mentors into your sphere, and unlocks continuous opportunities."
          }
        }
      };
    } else if (finalStyleId === "FALLING_LINE") {
      return {
        analysis: {
          direction: "Downward sloping (Southwest descent) in the trailing segment, showing a gradual drop in stamina or confidence toward the end of tasks.",
          size: "Medium at the start but shrinking significantly toward the end, signaling an energy leak or fatigue.",
          firstLetterSize: "Standard first letter, but the succeeding letters gradually lose their height and scale, representing vulnerability to external pressure.",
          underlineStyle: "Absent or a downward-drooping line, which drains the grounding element and increases anxiety.",
          endStroke: "Declining or pointing downwards, representing a leak in the wealth sector and sudden loss of interest.",
          dotPlacement: "Irregular dotting or a dot cutting the baseline, signifying minor health issues or frequent energy drains.",
          letterLegibility: "Low to moderate legibility, indicating a tendency to feel overwhelmed or misunderstood by peers.",
          nameCompletion: "Letters get compressed or scribbled at the end, showing a rush to finish and a lack of patience with administrative details.",
          overallFlow: "Declining momentum, starting with high enthusiasm but closing with high tension or friction."
        },
        scores: {
          careerScore: 60,
          financialFlowScore: 52,
          recognitionScore: 58,
          leadershipScore: 62,
          businessSuccessScore: 55,
          relationshipHarmonyScore: 65,
          overallSignatureScore: 58
        },
        assessment: {
          currentSignatureAssessment: `Your current signature exhibits a downward slope, particularly in the trailing segment. In Handwriting Vastu, this is a critical energy drain known as the 'Descent Trap'. For someone with Driver #${driver} and Conductor #${conductor}, it indicates that while you start projects with immense enthusiasm (ruled by Mars/Sun), you face substantial stamina drains, mental fatigue, or self-doubt as you approach the finish line. This downward angle acts as a siphoning force in your wealth and career sectors, causing hard-earned gains or recognition to slip away at the last moment. Immediate structural alignment is strongly recommended.`,
          strengths: [
            "Energetic and powerful start to new initiatives.",
            "Strong initial presentation and personal charm."
          ],
          weaknesses: [
            "Downward trailing slope drains career energy and causes fatigue.",
            "Shrinking letter size indicates falling confidence under sustained pressure.",
            "Scribbled ending letters lead to misunderstandings and administrative delays."
          ],
          riskAreas: [
            "High vulnerability to financial losses, unexpected expenses, or leakage of liquid wealth.",
            "Frequent delays in receiving credit or recognition for your hard work."
          ],
          recommendedCorrections: [
            "You MUST consciously tilt your signature upwards. Ensure the entire signature slopes at a 10 to 15-degree angle from left to right.",
            "Keep all letters in your name uniform in height, rather than letting them shrink toward the end.",
            "Add a solid, straight, independent horizontal underline that rises slightly at the end to act as a cosmic support shield.",
            "Practice the new ascending signature 33 times daily for 21 days with a high-quality indigo rollerball pen."
          ],
          idealSignatureStyle: "A 15-degree rising line with uniform character sizing and an independent upward-flicking underline foundation.",
          personalizedSignatureBlueprint: "Write on unruled white paper. Keep your hand relaxed. Write your name so that each letter is legible and stays on an ascending line. Draw a bold, straight underline underneath, starting from the second letter and flicking upwards at the end."
        },
        beforeAfter: {
          before: {
            visualDescription: "A signature that starts strong but slopes downwards toward the right, with letters shrinking and scribbling at the end.",
            impact: "Drains your financial savings, causes minor joint or energy health issues, and delays promotions."
          },
          after: {
            visualDescription: "An ascending signature with beautifully spaced, uniform letters and a firm, rising underline foundation.",
            impact: "Secures your financial assets, boosts daily energy levels, and ensures you receive full credit and fame for your achievements."
          }
        }
      };
    } else if (finalStyleId === "DOUBLE_UNDERLINE") {
      return {
        analysis: {
          direction: "Stable, perfectly flat horizontal alignment, representing a highly structured, objective, and realistic approach to life.",
          size: "Large, bold, and expansive, commanding immediate attention and establishing a powerful physical presence.",
          firstLetterSize: "Strong, blocky, and wide first letter, representing a solid corporate base and high protective instincts.",
          underlineStyle: "Two clean, parallel underlines run beneath the signature. In Vastu, this represents a double-foundation (Earth and Metal elements) which guarantees massive stability.",
          endStroke: "Horizontal or curving slightly upward, representing a careful, calculated exit that locks in profits.",
          dotPlacement: "Perfectly balanced dots placed precisely between or below the underlines, serving as protective anchors.",
          letterLegibility: "Highly structured and legible, showing absolute clarity of purpose and high commercial acumen.",
          nameCompletion: "Uses both first name and surname clearly, establishing strong connection to lineage and a desire for legacy building.",
          overallFlow: "Robust, authoritative, with clear spacing and powerful deliberate strokes that show immense discipline."
        },
        scores: {
          careerScore: 88,
          financialFlowScore: 95,
          recognitionScore: 85,
          leadershipScore: 90,
          businessSuccessScore: 93,
          relationshipHarmonyScore: 78,
          overallSignatureScore: 89
        },
        assessment: {
          currentSignatureAssessment: `Your current signature uses a straight horizontal style with a double underline support. In Handwriting Vastu, this is known as the 'Fortress' or 'Double Vault' structure. It is an exceptionally strong format for corporate leaders, business owners, and financial experts. For someone with Driver #${driver} and Conductor #${conductor}, co-ruled by Mercury and Saturn, it instills immense commercial intelligence, deep financial discipline, and a highly systematic way of working. The double parallel lines create an unbreakable barrier against financial losses and ensure that your business ventures have a permanent, rock-solid foundation.`,
          strengths: [
            "Unmatched financial stability and asset protection from the double underline.",
            "Immense administrative and executive authority.",
            "Outstanding clarity of goals and methodical execution."
          ],
          weaknesses: [
            "Can sometimes indicate extreme rigidity or a reluctance to adapt to rapid changes.",
            "The double lines can occasionally attract heavy responsibilities that cause mental pressure."
          ],
          riskAreas: [
            "Over-analyzing simple situations, leading to missed fast-paced opportunities.",
            "Creating an overly formal barrier in personal relationships due to high structure."
          ],
          recommendedCorrections: [
            "Keep the double underlines exactly parallel and ensure they never cross each other or touch any descending loops.",
            "Soften the starting letters slightly with a gentle curve to improve personal relationship harmony and adaptability.",
            "Ensure the underlines do not extend too far beyond the signature itself, keeping the energy concentrated.",
            "Practice your signature 15 times daily using a premium black or deep blue fountain pen on rich paper."
          ],
          idealSignatureStyle: "A stable horizontal signature supported by two parallel lines that are clean, distinct, and end with a slight upward tilt.",
          personalizedSignatureBlueprint: "Write your full name in a clean, bold horizontal line. Draw two perfectly straight, parallel lines underneath, separated by 2mm. Ensure both lines are clean and unbroken, ending exactly where your name ends."
        },
        beforeAfter: {
          before: {
            visualDescription: "Double underlines that are uneven, crossing, or touching the bottom loops of your letters.",
            impact: "Manifests as excessive workload, minor back-and-forth delays in partnerships, and unnecessary rigid arguments."
          },
          after: {
            visualDescription: "Two beautiful, clean, perfectly parallel underlines below a bold, clearly spaced horizontal signature.",
            impact: "Locks in massive wealth accumulation, secures corporate leadership positions, and builds an enduring personal legacy."
          }
        }
      };
    } else {
      return {
        analysis: {
          direction: "The signature maintains a beautiful, precise 15-degree upward slope (Eastward ascent), symbolizing constant growth and healthy ambition.",
          size: "A healthy medium-to-large size, occupying the page space with confidence without spilling over or crowding other elements.",
          firstLetterSize: `The first letter of '${name}' is perfectly scaled, being approximately 2x larger than the lowercase characters, showing strong self-image and protective boundaries.`,
          underlineStyle: "A straight, single underline starts after the first letter and runs to the end. This acts as a firm, stable foundation (Earth Element) to support your endeavors.",
          endStroke: "The end stroke finishes with an assertive upward-right flick, signaling positive closure and inviting prosperous future partnerships.",
          dotPlacement: "No unnecessary blocking dots are present, which ensures smooth movement and lack of communication gaps with outer allies.",
          letterLegibility: "Highly legible and distinct letters, establishing that the subject has clear, transparent intentions and values direct public relationships.",
          nameCompletion: "The full first name is clearly utilized, reinforcing personal identity, followed by a stylized last name initial to manage family heritage elegantly.",
          overallFlow: "Extremely fluid, consistent rhythm, showing a balanced flow of personal energy and healthy stamina."
        },
        scores: {
          careerScore: 92,
          financialFlowScore: 89,
          recognitionScore: 94,
          leadershipScore: 88,
          businessSuccessScore: 90,
          relationshipHarmonyScore: 86,
          overallSignatureScore: 91
        },
        assessment: {
          currentSignatureAssessment: `Your current signature utilizes an upward ascending style with a solid underline foundation. In Handwriting Vastu, this style is known as the 'Vanguard' or 'Sovereign Path'. For someone with Driver #${driver} and Conductor #${conductor}, this progressive mindset aligns perfectly with your cosmic timeline. The planetary vibrations of the Sun and Jupiter are well-aligned here, creating strong leadership traits and natural executive abilities. The underline acts as a horizontal anchor, providing a steady support system for your career decisions and preventing sudden energy drops.`,
          strengths: [
            "Excellent ascending confidence that drives persistent progress.",
            "Underline acts as a firm Vastu foundation, securing long-term career stability.",
            "Upward end stroke invites healthy recognition and lucrative opportunities."
          ],
          weaknesses: [
            "Minor rush in ending letters can sometimes lead to impatience in closing deals.",
            "The underline must be kept clean; any overlapping lower loop letters like g, j, p, y could create self-sabotaging traps."
          ],
          riskAreas: [
            "Potential financial leakages if the underline crosses or cuts the baseline of any trailing letters.",
            "Slight over-commitment of personal resources due to high ambition slope."
          ],
          recommendedCorrections: [
            "Ensure the underline begins after the first letter and never cuts any lower loops (g, j, p, y) of your name.",
            "Enlarge the first letter slightly so it stands exactly 2.5 times higher than the succeeding lowercase letters.",
            "Ensure the upward trailing stroke rises exactly at a 15 to 20 degree angle to keep Jupiter vibrations active.",
            "Begin practicing this corrected script 11 times daily on unruled white paper with an indigo gel pen."
          ],
          idealSignatureStyle: "A 15-degree rising line with a single clean underline and a bold first letter, matching the 'Sovereign Path' archetype.",
          personalizedSignatureBlueprint: "Use an indigo or deep blue ink pen. Write your first name clearly, sloping upwards at a 15-degree angle. Draw a single straight line underneath from the second letter to the end, ending with an upward flick at the top right. Leave a 1mm gap between letters."
        },
        beforeAfter: {
          before: {
            visualDescription: "Slightly congested letters with an underline that occasionally touches or cuts through the lower loops of your characters.",
            impact: "Creates minor delays in project approvals and causes occasional unexpected expenditure or leakages of liquid cash."
          },
          after: {
            visualDescription: "A pristine, spacious script ascending at 15 degrees, supported by a clean, independent horizontal foundation line and a larger initial letter.",
            impact: "Unlocks supreme cash-flow stability, accelerates pending executive promotions, and commands high social respect."
          }
        }
      };
    }
  };

  const generateLocal7PartSignatureAudit = (styleId: string, name: string, dob: string, description?: any) => {
    const finalStyleId = styleId || "RISING_UNDERLINE";
    const driver = getDriverNumber(dob);
    const conductor = getConductorNumber(dob);
    const nameNumber = getChaldeanNameNumber(name);

    // Standardize input description from manual style or provided description
    let d = description;
    if (!d) {
      if (finalStyleId === "TRAILING_DOT_BELOW") {
        d = {
          nameSigned: name,
          size: "Small",
          slant: "Straight",
          legibility: "Moderately Clear",
          underline: "No",
          underlineDesc: "",
          flourishes: "No",
          flourishesDesc: "",
          pressure: "Medium",
          speed: "Slow and careful",
          firstVsLast: "First name more prominent",
          specialCharacteristics: "Trailing dot below signature"
        };
      } else if (finalStyleId === "FALLING_LINE") {
        d = {
          nameSigned: name,
          size: "Medium",
          slant: "Backward",
          legibility: "Stylized",
          underline: "No",
          underlineDesc: "",
          flourishes: "No",
          flourishesDesc: "",
          pressure: "Heavy",
          speed: "Slow and careful",
          firstVsLast: "First name more prominent",
          specialCharacteristics: "Downward sloping trailing segment"
        };
      } else if (finalStyleId === "DOUBLE_UNDERLINE") {
        d = {
          nameSigned: name,
          size: "Medium",
          slant: "Straight",
          legibility: "Very Clear",
          underline: "Yes",
          underlineDesc: "Double straight parallel underlines",
          flourishes: "No",
          flourishesDesc: "",
          pressure: "Medium",
          speed: "Quick and flowing",
          firstVsLast: "Equally balanced",
          specialCharacteristics: "Perfect parallel foundations"
        };
      } else { // RISING_UNDERLINE
        d = {
          nameSigned: name,
          size: "Large",
          slant: "Forward",
          legibility: "Very Clear",
          underline: "Yes",
          underlineDesc: "A clean single ascending underline",
          flourishes: "Yes",
          flourishesDesc: "Assertive upward exit flick",
          pressure: "Medium",
          speed: "Quick and flowing",
          firstVsLast: "First name more prominent",
          specialCharacteristics: "Auspicious ascending progress node"
        };
      }
    }

    const sizeVal = d.size || "Medium";
    const slantVal = d.slant || "Straight";
    const legibilityVal = d.legibility || "Very Clear";
    const underlineVal = d.underline || "No";
    const flourishesVal = d.flourishes || "No";
    const pressureVal = d.pressure || "Medium";
    const speedVal = d.speed || "Quick and flowing";

    // Let's map different profiles
    let confidence = "";
    let ego = "";
    let publicPrivate = "";
    let emotional = "";
    let ambition = "";
    let score = 8;
    let explanation = "";
    let firstImpression = "";
    let authority = "";
    let suitability = "";
    let sizeDesc = "";
    let slantDesc = "";
    let legibilityDesc = "";
    let underlineDescText = "";
    let flourishesDescText = "";
    let recommendationText = "";
    let variants = ["", ""];
    let legal = "";
    let creative = "";
    let financial = "";
    let personal = "";

    if (finalStyleId === "TRAILING_DOT_BELOW") {
       score = 7;
       confidence = "Reflects a highly strategic and self-reliant mindset. Confidence is moderate-to-high, but tempered by caution.";
       ego = `Substantial self-esteem, shown by a prominent initial letter of '${name}', but protected by defensive barriers.`;
       publicPrivate = "Keeps plans strictly confidential, sharing details on a highly strategic, need-to-know basis.";
       emotional = "Deep self-control and analytical reserve. Emotions are kept under wrap, maintaining composure.";
       ambition = "Steady and cautious progression. Prefers strong planning over rapid execution to minimize exposure.";
       explanation = `The trailing dot acts as a cosmic stop or anchor. For a native with Driver #${driver} and Conductor #${conductor}, this provides high stability but can occasionally create sudden administrative blocks or stalls in pending transactions.`;
       firstImpression = "Projects a quiet, formidable presence and a strong air of professional discretion.";
       authority = "Command is projected through self-reliance rather than social assertion. Needs stronger foundation lines.";
       suitability = "Exceptional for strategic planning, corporate compliance, finance, and confidential audit sectors.";
       sizeDesc = "Compact lettering suggests strong detail-orientation and high mental focus.";
       slantDesc = "Straight letters indicate high logical control and objective execution.";
       legibilityDesc = "Highly stylized, reflecting high discretion and guarding of personal plans.";
       underlineDescText = "No active underline foundation is utilized, signifying an independent self-made path.";
       flourishesDescText = "A solitary trailing dot below acts as a protective boundary but can create energetic blockages.";
       recommendationText = "Yes. Shifting the trailing dot to a double dot under an ascending underline will unlock stagnant wealth flows.";
       variants = [
         `Variant A: Write '${name}' with a bold starting initial, ending with an upward sweep and a clean ascending underline.`,
         `Variant B: Write your first name clearly, draw a straight support underline underneath, and place two dots below.`
       ];
       legal = "Spell out your full legal name clearly, avoid isolated trailing dots, and use a solid single underline.";
       creative = "You can use creative flourishes or stylized curves with a large initial and an upward trailing sweep.";
       financial = "Keep letters uniform in height and draw two parallel underline foundations, adding two horizontal dots below.";
       personal = "Write your first name in a warm, flowing script, avoiding sharp angles or blocking dots.";
    } else if (finalStyleId === "FALLING_LINE") {
       score = 5;
       confidence = "Fluctuating confidence under sustained pressure, shown by a gradual downward trailing slope.";
       ego = "Starts with positive ambition but can experience self-doubt or fatigue towards the completion of major tasks.";
       publicPrivate = "High sensitivity to public opinion, occasionally leading to feelings of being overwhelmed.";
       emotional = "Prone to high internal stress and stamina drains. Emotional energy is leaked through downward slopes.";
       ambition = "High initial motivation but tends to lose steam or interest right before the finish line.";
       explanation = `The southwest downward slope acts as a severe wealth and career drain. Immediate alignment is required to protect liquid assets under Driver #${driver} and Conductor #${conductor}.`;
       firstImpression = "Appears highly enthusiastic at the start but can project exhaustion or over-commitment later.";
       authority = "Prone to sudden drops in commanding authority due to trailing letter compression.";
       suitability = "Suited for supportive execution roles. Struggles with high-pressure leadership positions.";
       sizeDesc = "Starts medium but shrinks towards the end, showing stamina leaks.";
       slantDesc = "Backward slant reflects high emotional reserve and cautious self-defense.";
       legibilityDesc = "Compressed or scribbled trailing characters, causing administrative or communication delays.";
       underlineDescText = "Absent or drooping downwards, which drains stability and causes anxiety.";
       flourishesDescText = "Scribbled ending loops that capture mental worry or loops of overthinking.";
       recommendationText = "Yes. You must consciously tilt your signature upwards at a 10 to 15-degree angle from left to right.";
       variants = [
         `Variant A: Write your name with uniform letter height, sloping upwards, with a straight rising underline.`,
         `Variant B: Write your first name clearly with an upward flick at the end, and an independent upward-flicking underline.`
       ];
       legal = "Draw a solid rising underline that rises slightly at the end to act as a cosmic support shield.";
       creative = "Ensure the trailing characters rise upwards at a 15-degree angle to keep Jovian/Mercury energies active.";
       financial = "Avoid any trailing downward slope to prevent wealth leakage. Ensure a parallel double underline.";
       personal = "Write in an upright, ascending flow with a clean starting letter to keep positive vibrations active.";
    } else if (finalStyleId === "DOUBLE_UNDERLINE") {
       score = 9;
       confidence = "Extremely high confidence and resilience, backed by a strong internal support system.";
       ego = "Pristine self-image and powerful professional pride. Demands respect and commands authority.";
       publicPrivate = "Clear, healthy balance between public presentation and private boundaries.";
       emotional = "Stable, grounded, and emotionally composed under severe corporate pressure.";
       ambition = "High administrative drive, looking for long-term legacy and permanent organizational stature.";
       explanation = `The double parallel underline acts as a double-lock safe. It provides exceptional stability for those with Driver #${driver} and Conductor #${conductor}.`;
       firstImpression = "Projects absolute authority, solid reliability, and high executive power.";
       authority = "Superb leadership command. The double lines act as an unshakable cosmic foundation.";
       suitability = "Outstanding for executive leadership, corporate directorships, business enterprises, and legal administration.";
       sizeDesc = "Medium and balanced, showing practical social adaptiveness and objectivity.";
       slantDesc = "Straight characters showing objective logic, absolute control, and stable mind.";
       legibilityDesc = "Very clear and distinct script, showing direct, transparent communication.";
       underlineDescText = "Two parallel straight lines run underneath, acting as a massive stable foundation (Earth Element).";
       flourishesDescText = "No unnecessary loops, signifying disciplined, straight-to-the-point execution.";
       recommendationText = "No. Your current signature has excellent structural Vastu nodes. Only minor fine-tuning is needed.";
       variants = [
         `Variant A: Keep your double-underline exactly as is, ensuring it starts after the first letter and never cuts any characters.`,
         `Variant B: Enlarge the first letter slightly so it stands exactly 2.5 times higher than the lowercase letters.`
       ];
       legal = "Use your full name with a double underline in deep black ink to lock in Saturnian asset protection.";
       creative = "Soften the sharp angles slightly to allow smooth creative flows while retaining the foundation lines.";
       financial = "Ensure double underlines are perfectly parallel, with two neat horizontal dots below.";
       personal = "Use a warm, slightly more compact single-underline version for cozy family letters.";
    } else { // RISING_UNDERLINE (Auspicious Default)
       score = 9;
       confidence = "High, progressive, and healthy confidence. Always looking for growth and forward expansion.";
       ego = "Balanced self-worth, high professional ambition, and strong leadership potential.";
       publicPrivate = "Direct and honest public communication with balanced personal boundaries.";
       emotional = "Positive, warm, responsive, and highly proactive in social and professional circles.";
       ambition = `Strong career momentum. Naturally strives for promotions, fame, and executive authority under Driver #${driver}.`;
       explanation = `A 15-degree rising line with a single clean underline foundation. This perfectly aligns with Driver #${driver} and Conductor #${conductor}.`;
       firstImpression = "Projects a highly dynamic, optimistic, and trustworthy professional persona.";
       authority = "Command is projected smoothly through clear, rising letters and an independent underline support.";
       suitability = "Highly suited for leadership, sales, creative entrepreneurship, public speaking, and business.";
       sizeDesc = "Slightly large, showing healthy pride and strong executive drive.";
       slantDesc = "Forward slant at 15 degrees, showing warm proactivity and high emotional intelligence.";
       legibilityDesc = "Highly legible and transparent, indicating direct and honest intentions.";
       underlineDescText = "A clean single rising line runs from the second letter, signifying strong cosmic support.";
       flourishesDescText = "A graceful upward-right exit stroke, signaling positive closure and prosperous agreements.";
       recommendationText = "No. Excellent Vastu flow. Keep practicing this script daily to maintain progressive vibrations.";
       variants = [
         `Variant A: Write your first name clearly, sloping upwards at a 15-degree angle, with a straight independent underline.`,
         `Variant B: Write first initial large and bold, followed by full surname, supported by a clean rising underline.`
       ];
       legal = "Write full first and last name legibly, supported by a clean rising underline in royal blue ink.";
       creative = "Let the trailing exit stroke sweep gracefully upwards in a grand arc for high public recognition.";
       financial = "Ensure the underline begins after the first letter and never cuts any lower loops (g, j, p, y).";
       personal = "Use your first name or preferred nickname with a soft, ascending slope to share warm vibes.";
     }

    // Adjust score and details if customized questionnaire fields are provided
    if (description) {
      if (underlineVal === "No" || legibilityVal === "Illegible" || slantVal === "Backward") {
        score = Math.max(4, score - 2);
      } else if (underlineVal === "Yes" && legibilityVal === "Very Clear" && slantVal === "Forward") {
        score = Math.min(10, score + 1);
      }
    }

    return {
      psychologicalInterpretation: {
        confidenceLevel: confidence,
        egoSelfImage: ego,
        publicPrivateGap: publicPrivate,
        emotionalStyle: emotional,
        ambitionDrive: ambition
      },
      numerologicalCompatibility: {
        signatureNameValue: nameNumber,
        birthNameValue: getChaldeanNameNumber(name),
        compatibilityScore: score,
        explanation: `Your signed name '${d.nameSigned || name}' and birth path form a highly compatible acoustic resonance.`
      },
      professionalImpact: {
        firstImpression: firstImpression,
        authorityCredibility: authority,
        industrySuitability: suitability
      },
      specificTraitIndicators: {
        size: sizeDesc,
        slant: slantDesc,
        legibility: legibilityDesc,
        underline: underlineDescText,
        flourishes: flourishesDescText
      },
      compatibilityScore: {
        score: score,
        detailedExplanation: `Your overall signature compatibility score is calculated at ${score}/10 based on Chaldean numeric frequency synastry. Graphologically, your selections reflect ${legibilityVal === "Very Clear" ? "exceptional directness" : "deep strategic reservation"} and ${underlineVal === "Yes" ? "a strong foundation" : "high personal self-reliance"}.`
      },
      recommendations: {
        shouldModify: recommendationText,
        variants: variants,
        colors: [
          { color: "Royal Blue Ink", reason: "Invokes powerful Jovian/Mercury vibrations, enhancing communication authority." },
          { color: "Deep Black Ink", reason: "Provides rock-solid Saturnian grounding, protecting assets from cash drains." },
          { color: "Emerald Green Ink", reason: "Stimulates financial growth and increases commercial intelligence." }
        ],
        penType: pressureVal === "Heavy" ? "Medium Rollerball or Gel pen to smooth out friction and allow faster ink flow." : "Classic Fountain pen to enrich strokes.",
        signingDirection: slantVal === "Forward" ? "Right slant rising at a neat 15-degree angle" : "Straight and horizontal with a slight upward exit stroke"
      },
      differentPurposes: {
        legal: legal,
        creative: creative,
        financial: financial,
        personal: personal
      }
    };
  };

  React.useEffect(() => {
    // Keep sigAuditResult in sync with manual signature inputs unless a custom AI image analysis has run successfully
    if (!sigImage) {
      const localAudit = generateLocal7PartSignatureAudit(
        signatureStyle,
        sigName || 'Aspirant',
        sigDob || '1990-01-01',
        {
          nameSigned: sigDescNameSigned,
          size: sigDescSize,
          slant: sigDescSlant,
          legibility: sigDescLegibility,
          underline: sigDescUnderline,
          underlineDesc: sigDescUnderlineDesc,
          flourishes: sigDescFlourishes,
          flourishesDesc: sigDescFlourishesDesc,
          pressure: sigDescPressure,
          speed: sigDescSpeed,
          firstVsLast: sigDescFirstVsLast,
          specialCharacteristics: sigDescSpecial
        }
      );
      setSigAuditResult(localAudit);
    }
  }, [
    signatureStyle, sigName, sigDob, sigImage,
    sigDescNameSigned, sigDescSize, sigDescSlant, sigDescLegibility,
    sigDescUnderline, sigDescUnderlineDesc, sigDescFlourishes, sigDescFlourishesDesc,
    sigDescPressure, sigDescSpeed, sigDescFirstVsLast, sigDescSpecial
  ]);

  // Profile selection
  const handleProfileSelectChange = (idx: number) => {
    setSelectedProfileIndex(idx);
    if (idx >= 0 && idx < savedProfiles.length) {
      const p = savedProfiles[idx];
      setSigName(p.name || '');
      setSigDob(p.dob || '');
      setSigError(null);
    } else {
      setSigName('');
      setSigDob('');
    }
  };

  // Convert uploaded image to base64 with validation and Canvas compression to avoid large payloads
  const processSignatureFile = (file: File) => {
    if (!file) return;

    // Validate type (PNG, JPG, JPEG, WEBP)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSigError("कृपया केवल वैध छवि फ़ाइलें (PNG, JPG, JPEG, WEBP) अपलोड करें। (Please upload only valid image files: PNG, JPG, JPEG, WEBP.)");
      setFileUploadSuccess(false);
      return;
    }

    // Validate size (max 10MB)
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setSigError(`फ़ाइल बहुत बड़ी है। कृपया ${MAX_SIZE_MB}MB से छोटी फ़ाइल अपलोड करें। (File is too large. Please upload a file smaller than ${MAX_SIZE_MB}MB.)`);
      setFileUploadSuccess(false);
      return;
    }

    setIsProcessingFile(true);
    setSigError(null);
    setFileUploadSuccess(false);
    setSigFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Downscale to a maximum of 800px on either side to maintain detail while drastically reducing payload size (~50-100KB)
          const MAX_DIM = 800;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress with jpeg format and 0.8 quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setSigImage(compressedBase64);
            setFileUploadSuccess(true);
          } else {
            // Fallback to original read if canvas context fails
            if (typeof e.target?.result === 'string') {
              setSigImage(e.target.result);
              setFileUploadSuccess(true);
            }
          }
        } catch (err) {
          console.error("Canvas compression failed, using original base64:", err);
          if (typeof e.target?.result === 'string') {
            setSigImage(e.target.result);
            setFileUploadSuccess(true);
          }
        } finally {
          setIsProcessingFile(false);
        }
      };
      img.onerror = () => {
        setSigError("छवि लोड करने में असमर्थ। कृपया फ़ाइल की जाँच करें। (Unable to load image. Please check the file.)");
        setIsProcessingFile(false);
        setFileUploadSuccess(false);
      };
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        setIsProcessingFile(false);
      }
    };
    reader.onerror = () => {
      setSigError("सिग्नेचर फ़ाइल पढ़ने में विफल। (Failed to read signature file.)");
      setIsProcessingFile(false);
      setFileUploadSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  // Camera Support
  const startCamera = async () => {
    setSigError(null);
    setSigImage(null);
    setSigFileName(null);
    setSigCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error("Video play failed:", err));
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setSigError("कैमरा एक्सेस करने में असमर्थ। कृपया जांचें कि आपने कैमरा अनुमति दी है या नहीं।");
      setSigCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setSigCameraActive(false);
  };

  const captureSignature = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Horizontal flip for mirror video preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        setSigImage(dataUrl);
        setSigFileName("Camera_Capture.png");
        setFileUploadSuccess(true);
      }
      stopCamera();
    } catch (err) {
      console.error("Capture failed:", err);
      setSigError("सिग्नेचर कैप्चर करने में विफलता। कृपया मैन्युअल रूप से फ़ाइल अपलोड करें।");
    }
  };

  // AI Signature Audit trigger
  const handleAISignatureAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sigName.trim()) {
      setSigError("कृपया नाम दर्ज करें या ऊपर से एक सहेजा गया प्रोफ़ाइल चुनें।");
      return;
    }
    if (!sigDob) {
      setSigError("कृपया जन्म तिथि दर्ज करें।");
      return;
    }

    setIsAnalyzingSig(true);
    setSigError(null);

    const fallbackErrorMessage = "LeoFamily Signature Analysis temporarily unavailable. Please use manual signature style selection.";

    try {
      const response = await fetch('/api/signature-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: sigImage || undefined,
          personalDetails: { name: sigName, dob: sigDob, profession: sigProfession },
          manualSelection: { styleId: signatureStyle },
          driver: getDriverNumber(sigDob),
          conductor: getConductorNumber(sigDob),
          nameNumber: getChaldeanNameNumber(sigName),
          description: {
            nameSigned: sigDescNameSigned || sigName,
            size: sigDescSize,
            slant: sigDescSlant,
            legibility: sigDescLegibility,
            underline: sigDescUnderline,
            underlineDesc: sigDescUnderlineDesc,
            flourishes: sigDescFlourishes,
            flourishesDesc: sigDescFlourishesDesc,
            pressure: sigDescPressure,
            speed: sigDescSpeed,
            firstVsLast: sigDescFirstVsLast,
            specialCharacteristics: sigDescSpecial
          }
        })
      });

      // Safely validate content-type headers before calling response.json()
      const contentType = response.headers.get("content-type") || "";
      let result: any = null;

      if (contentType.includes("application/json")) {
        try {
          result = await response.json();
        } catch (jsonErr) {
          console.error("Failed to parse JSON response payload:", jsonErr);
        }
      } else {
        // Log actual response text to aid in debugging without exposing to the user
        try {
          const rawText = await response.text();
          console.error("Non-JSON Server Error Response Detected:", {
            status: response.status,
            statusText: response.statusText,
            bodySample: rawText.slice(0, 1000)
          });
        } catch (textErr) {
          console.error("Failed to read non-JSON response text:", textErr);
        }
      }

      if (!response.ok || !result) {
        // If the AI image analysis API fails, log details internally
        console.error("Signature Audit failed with status:", response.status, "and parsed result:", result);
        
        // Automatically switch to manual signature style selection as a fallback
        const fallbackResult = generateLocal7PartSignatureAudit(
          signatureStyle || 'RISING_UNDERLINE',
          sigName,
          sigDob,
          {
            nameSigned: sigDescNameSigned,
            size: sigDescSize,
            slant: sigDescSlant,
            legibility: sigDescLegibility,
            underline: sigDescUnderline,
            underlineDesc: sigDescUnderlineDesc,
            flourishes: sigDescFlourishes,
            flourishesDesc: sigDescFlourishesDesc,
            pressure: sigDescPressure,
            speed: sigDescSpeed,
            firstVsLast: sigDescFirstVsLast,
            specialCharacteristics: sigDescSpecial
          }
        );
        setSigAuditResult(fallbackResult);
        handleSignatureTrigger(signatureStyle || 'RISING_UNDERLINE');
        
        throw new Error(fallbackErrorMessage);
      }

      setSigAuditResult(result);
    } catch (err: any) {
      console.error("Signature Audit API Flow Error:", err);
      // Ensure we display the exact user-friendly message requested
      setSigError(fallbackErrorMessage);
      
      // Automatically switch to manual signature style selection on any failure
      const fallbackResult = generateLocal7PartSignatureAudit(
        signatureStyle || 'RISING_UNDERLINE',
        sigName,
        sigDob,
        {
          nameSigned: sigDescNameSigned,
          size: sigDescSize,
          slant: sigDescSlant,
          legibility: sigDescLegibility,
          underline: sigDescUnderline,
          underlineDesc: sigDescUnderlineDesc,
          flourishes: sigDescFlourishes,
          flourishesDesc: sigDescFlourishesDesc,
          pressure: sigDescPressure,
          speed: sigDescSpeed,
          firstVsLast: sigDescFirstVsLast,
          specialCharacteristics: sigDescSpecial
        }
      );
      setSigAuditResult(fallbackResult);
      handleSignatureTrigger(signatureStyle || 'RISING_UNDERLINE');
    } finally {
      setIsAnalyzingSig(false);
    }
  };

  const handleChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childDob) return;
    const report = generateChildNumerology(childDob);
    setChildResult(report);
    setShowChildWhy(false);
  };

  const handleLuckyDatesTrigger = () => {
    const suite = generateLuckyDatesSuite(luckyDatesDriver, luckyDatesConductor);
    setLuckySuiteResult(suite);
    setShowDatesWhy(false);
  };

  return (
    <div id="premium-consultations-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Sidebar Selector */}
      <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-4 h-fit">
        <div>
          <h3 className="font-playfair text-lg font-bold text-slate-800">Premium Astro-Consultations</h3>
          <p className="text-[10px] text-[#D97706] uppercase tracking-widest font-mono font-bold mt-1">Pro Vedic & Chaldean Tools v3.0</p>
        </div>
        <div className="space-y-2 border-t border-slate-100 pt-4">
          {[
            { id: 'VEHICLE', label: 'Pro Vehicle Numerology', icon: Car },
            { id: 'HOUSE', label: 'Pro House / Flat Vastu', icon: Home },
            { id: 'BUSINESS', label: 'Pro Business Name Suite', icon: Briefcase },
            { id: 'SIGNATURE', label: 'Signature Style Diagnostics', icon: FileText },
            { id: 'CHILD', label: 'Child Auspicious Names', icon: UserPlus },
            { id: 'LUCKY_DATES', label: 'Auspicious Dates Finder', icon: Calendar },
            { id: 'MEDICAL', label: 'Medical Numerology Scanner', icon: Activity },
            { id: 'VAASTU', label: 'Numero Vaastu Pro', icon: Compass },
            { id: 'DASHA', label: 'Annual Dasha Forecast', icon: Clock },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id as any)}
              className={`w-full text-left py-3 px-4 rounded-2xl text-xs font-bold font-sans flex items-center justify-between transition-all duration-300 cursor-pointer ${
                activeModule === m.id
                  ? 'bg-[#1E3A8A] text-white shadow-md'
                  : 'bg-transparent text-[#4B5563] hover:bg-[#FDFCF7]/80 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <m.icon className="w-4 h-4" />
                <span>{m.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Form and Report Console */}
      <div className="lg:col-span-8 bg-[#FDFCF7] border border-[#F2E8DC] rounded-[40px] p-8 md:p-10 shadow-sm min-h-[550px]">
        
        {/* VEHICLE MODULE */}
        {activeModule === 'VEHICLE' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4">
              <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">Pro Vehicle Numerology Analyzer</h3>
              <p className="text-xs text-slate-500 font-sans">Calculate precise cumulative Chaldean vibrations, accident risks, and suitability ratings of your vehicle.</p>
            </div>

            <form onSubmit={handleVehicleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Vehicle Plate Number (eg. MH12AB1234)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH12AB1234"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Your Driver / Birth Root Number</label>
                <select
                  value={vehicleDriver}
                  onChange={(e) => setVehicleDriver(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>Driver {n}</option>)}
                </select>
              </div>
              <button
                type="submit"
                className="col-span-1 sm:col-span-2 w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-all"
              >
                Scan Plate Compatibility (500+ Words)
              </button>
            </form>

            {vehicleResult && (
              <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-6 animate-in fade-in duration-500 leading-relaxed font-sans">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <span className="text-[9px] font-mono bg-indigo-50 text-[#1E3A8A] font-extrabold px-3 py-1 rounded-full uppercase">Chaldean Sum: {vehicleResult.totalSum}</span>
                    <h4 className="font-playfair text-lg font-bold text-slate-800 mt-2">Vehicle Root Index: {vehicleResult.reducedTotal}</h4>
                    <p className="text-xs text-amber-600 font-mono mt-1">Ruler Planet: {vehicleResult.rulerPlanet}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider ${
                      vehicleResult.suitability === 'EXCELLENT' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      vehicleResult.suitability === 'AVOID' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-50 text-slate-600'
                    }`}>{vehicleResult.suitability} SUITABILITY</span>
                  </div>
                </div>

                {/* Score meters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-center border">
                    <p className="text-[10px] font-mono text-slate-450 uppercase font-bold">Business Suitability</p>
                    <p className="text-xl font-bold font-mono text-[#1E3A8A] mt-1">{vehicleResult.businessUsageScore}/100</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-center border">
                    <p className="text-[10px] font-mono text-slate-450 uppercase font-bold">Travel Luck Rating</p>
                    <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{vehicleResult.travelLuckScore}/100</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-center border">
                    <p className="text-[10px] font-mono text-slate-450 uppercase font-bold font-bold">Protection Level</p>
                    <p className="text-xl font-bold font-mono text-indigo-600 mt-1">{vehicleResult.protectionEnergyScore}/100</p>
                  </div>
                </div>

                {/* Core meanings & predictions */}
                <div className="space-y-3">
                  <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1"><Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" /> Complete Astral Meaning</h5>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">{vehicleResult.meaning}</p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-playfair text-sm font-bold text-slate-800">Detailed Vehicle Prediction</h5>
                  <p className="text-xs text-slate-500 mt-1">{vehicleResult.prediction}</p>
                  <p className="text-xs text-slate-500 mt-1">{vehicleResult.ownershipAnalysis}</p>
                </div>

                {/* Risk and safety block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500">Accident Risk</span>
                    <p className={`text-xs font-bold mt-0.5 ${vehicleResult.accidentRisk === 'HIGH' ? 'text-rose-600' : 'text-emerald-600'}`}>{vehicleResult.accidentRisk}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500">Theft Vulnerability</span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{vehicleResult.theftRisk}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500">Breakdown Probability</span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{vehicleResult.mechanicalBreakdownRisk}</p>
                  </div>
                </div>

                {/* Remedies & Elements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <strong className="text-rose-800 text-xs flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Vibration Flaws:</strong>
                    <p className="text-xs text-slate-600 mt-1">{vehicleResult.vulnerability}</p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <strong className="text-emerald-800 text-xs flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Vastu & Puja Remedies:</strong>
                    <p className="text-xs text-slate-600 mt-1">{vehicleResult.remedy}</p>
                  </div>
                </div>

                {/* Lucky details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/30 rounded-2xl p-4 border border-amber-500/10 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#D97706] font-bold">Auspicious Colors</span>
                    <p className="font-bold text-slate-700 mt-0.5">{vehicleResult.luckyColors.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#D97706] font-bold font-bold">Best Service Days</span>
                    <p className="font-bold text-slate-700 mt-0.5">{vehicleResult.luckyServiceDays.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#D97706] font-bold font-bold">First Travel Days</span>
                    <p className="font-bold text-slate-700 mt-0.5">{vehicleResult.luckyTravelDays.join(', ')}</p>
                  </div>
                </div>

                {/* Expandable Why section */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowVehicleWhy(!showVehicleWhy)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <Info className="w-4 h-4" /> {showVehicleWhy ? 'Hide' : 'Show'} "Why This Result?" Detailed Logic Breakdown
                  </button>
                  {showVehicleWhy && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-2xl border text-xs text-slate-600 space-y-2">
                      <p><strong>Calculations Matrix:</strong> The system sums the alphabetical values of your vehicle plate under classical Chaldean rules (A=1, B=2, R=2 etc.) and adds the numeric sequence to obtain Compound total {vehicleResult.totalSum}. This reduces to Root {vehicleResult.reducedTotal}.</p>
                      <p><strong>Driver Alignment:</strong> Your Driver Number is {vehicleDriver} (governed by traditional rules). Based on the ancient planetary relationships chart, the value {vehicleResult.reducedTotal} is {vehicleResult.suitability === 'EXCELLENT' ? 'ultra-friendly' : vehicleResult.suitability === 'AVOID' ? 'inimical / hostile' : 'neutral'} to your lifestyle energy coordinates.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* HOUSE MODULE */}
        {activeModule === 'HOUSE' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">Pro House & Flat Vastu Auditor</h3>
                <p className="text-xs text-slate-500 font-sans">Discover planetary vibrations, wealth indexes, family harmony parameters, and dedicated remedies for your home address.</p>
              </div>
              <div className="flex bg-[#F2E8DC]/40 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setHouseMode('QUICK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    houseMode === 'QUICK' ? 'bg-[#1E3A8A] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quick Flat
                </button>
                <button
                  type="button"
                  onClick={() => setHouseMode('ADVANCED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    houseMode === 'ADVANCED' ? 'bg-[#1E3A8A] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Address Audit
                </button>
              </div>
            </div>

            {houseMode === 'QUICK' ? (
              <div className="space-y-6">
                <form onSubmit={handleHouseSubmit} className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">House / Apartment / Flat Number (any structure)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B-101 or 403"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-6 py-3 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer self-end h-[46px] transition-all"
                  >
                    Find Vastu
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <form onSubmit={handleAdvancedHouseSubmit} className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  {/* Section 1: Property Core Details */}
                  <div>
                    <h4 className="text-xs font-mono text-[#1E3A8A] uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5 border-b pb-1">
                      <Home className="w-3.5 h-3.5 text-[#1E3A8A]" /> 1. Property Core Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">House / Flat Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 403 or B-101"
                          value={flatNumberInput}
                          onChange={(e) => setFlatNumberInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Floor (if apartment)</label>
                        <input
                          type="text"
                          placeholder="e.g. 4th Floor"
                          value={floorInput}
                          onChange={(e) => setFloorInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Street Number / Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. MG Road or Regency Crest"
                          value={streetNameInput}
                          onChange={(e) => setStreetNameInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">City / State</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. New Delhi"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Postal Code / Pin Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 110001"
                          value={pinCodeInput}
                          onChange={(e) => setPinCodeInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Property Type</label>
                        <select
                          value={propertyTypeInput}
                          onChange={(e) => setPropertyTypeInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        >
                          <option value="Independent House">Independent House</option>
                          <option value="Apartment">Apartment</option>
                          <option value="Villa">Villa</option>
                          <option value="Plot">Plot</option>
                          <option value="Commercial Office">Commercial Office</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Property Age (years)</label>
                        <input
                          type="number"
                          placeholder="e.g. 3"
                          value={propertyAgeInput}
                          onChange={(e) => setPropertyAgeInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Usage Purpose</label>
                        <select
                          value={purposeInput}
                          onChange={(e) => setPurposeInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Vastu Directions */}
                  <div>
                    <h4 className="text-xs font-mono text-[#1E3A8A] uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5 border-b pb-1">
                      <Compass className="w-3.5 h-3.5 text-[#1E3A8A]" /> 2. Vastu Directions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Facing Direction of Property</label>
                        <select
                          value={facingDirectionInput}
                          onChange={(e) => setFacingDirectionInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        >
                          <option value="North">North</option>
                          <option value="South">South</option>
                          <option value="East">East</option>
                          <option value="West">West</option>
                          <option value="North-East">North-East (Ishan)</option>
                          <option value="North-West">North-West (Vayu)</option>
                          <option value="South-East">South-East (Agni)</option>
                          <option value="South-West">South-West (Nairutya)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Main Entrance Direction</label>
                        <select
                          value={entranceDirectionInput}
                          onChange={(e) => setEntranceDirectionInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        >
                          <option value="North">North</option>
                          <option value="South">South</option>
                          <option value="East">East</option>
                          <option value="West">West</option>
                          <option value="North-East">North-East (Ishan)</option>
                          <option value="North-West">North-West (Vayu)</option>
                          <option value="South-East">South-East (Agni)</option>
                          <option value="South-West">South-West (Nairutya)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Occupant Details */}
                  <div>
                    <h4 className="text-xs font-mono text-[#1E3A8A] uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5 border-b pb-1">
                      <User className="w-3.5 h-3.5 text-[#1E3A8A]" /> 3. Primary Occupant & Family
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Primary Occupant Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rajesh Kumar"
                          value={occupantNameInput}
                          onChange={(e) => setOccupantNameInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Date of Birth (DD/MM/YYYY)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 15/08/1988"
                          value={occupantDobInput}
                          onChange={(e) => setOccupantDobInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Primary Owner Driver (1-9)</label>
                        <select
                          value={houseOwnerDriver}
                          onChange={(e) => setHouseOwnerDriver(parseInt(e.target.value, 10))}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>Driver {n}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Family Members Count</label>
                        <input
                          type="number"
                          placeholder="e.g. 4"
                          value={familyCountInput}
                          onChange={(e) => setFamilyCountInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Family Members DOBs (comma separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. 12/03/1990, 05/11/2015"
                          value={familyDobsInput}
                          onChange={(e) => setFamilyDobsInput(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzingHouse}
                    className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 disabled:bg-slate-300 text-white py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {isAnalyzingHouse ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Performing Scientific Astro-Vastu & Numerology Analysis...
                      </>
                    ) : (
                      <>
                        <Compass className="w-4 h-4 text-amber-300 animate-pulse" />
                        Generate Complete 13-Point Astro-Vastu Audit
                      </>
                    )}
                  </button>
                </form>

                {houseError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{houseError}</span>
                  </div>
                )}

                {advancedHouseResult && (
                  <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-6 animate-in fade-in duration-500 leading-relaxed font-sans">
                    {/* Upper Badges & Main Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                      <div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-[9px] font-mono bg-indigo-50 text-[#1E3A8A] font-extrabold px-3 py-1 rounded-full uppercase">
                            Compound Address Value: {advancedHouseResult.totalSum}
                          </span>
                          <span className="text-[9px] font-mono bg-amber-50 text-amber-700 font-extrabold px-3 py-1 rounded-full uppercase">
                            VIBE: {advancedHouseResult.vibe}
                          </span>
                          <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full uppercase">
                            Root {advancedHouseResult.reducedTotal} Alignment
                          </span>
                        </div>
                        <h4 className="font-playfair text-xl font-bold text-slate-800 mt-2">
                          House Number & Vastu Audit Report
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-sans">For {occupantNameInput || 'Seeker'} • Governed by {advancedHouseResult.energyType || 'Vedic Forces'}</p>
                      </div>
                    </div>

                    {/* Breakdown Mini Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 border p-4 rounded-2xl">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Flat / Door Sum</span>
                        <p className="font-bold text-slate-700 font-mono">{advancedHouseResult.addressBreakdown?.flatSum || 'Calculated'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Street / Building Sum</span>
                        <p className="font-bold text-slate-700 font-mono">{advancedHouseResult.addressBreakdown?.streetSum || 'Calculated'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">City Sum</span>
                        <p className="font-bold text-slate-700 font-mono">{advancedHouseResult.addressBreakdown?.citySum || 'Calculated'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Pincode Sum</span>
                        <p className="font-bold text-slate-700 font-mono">{advancedHouseResult.addressBreakdown?.pinSum || 'Calculated'}</p>
                      </div>
                    </div>

                    {/* Score Gauges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50/50 border rounded-2xl space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Prosperity Potential</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold font-mono text-[#1E3A8A]">{advancedHouseResult.scores?.prosperityScore || 85}</span>
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${advancedHouseResult.scores?.prosperityScore || 85}%` }} />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50/50 border rounded-2xl space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Domestic Harmony</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold font-mono text-emerald-600">{advancedHouseResult.scores?.peaceScore || 80}</span>
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${advancedHouseResult.scores?.peaceScore || 80}%` }} />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50/50 border rounded-2xl space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Safety & Protection</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold font-mono text-amber-600">{advancedHouseResult.scores?.safetyScore || 90}</span>
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${advancedHouseResult.scores?.safetyScore || 90}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs for results */}
                    <div className="flex flex-wrap border-b border-[#F2E8DC] gap-1 pb-1">
                      {[
                        { id: 'OVERVIEW', label: '1-3. Overview & Numerology' },
                        { id: 'ROOMS', label: '4. Room recommendations' },
                        { id: 'DIRECTIONS', label: '5. Directional Analysis' },
                        { id: 'REMEDIES', label: '6-10. Remedies & Optimization' },
                        { id: 'TIMING', label: '11-13. Timing & Future' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveVastuTab(tab.id as any)}
                          className={`px-3 py-2 text-xs font-mono rounded-lg transition-all border ${
                            activeVastuTab === tab.id
                              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] font-bold shadow-sm'
                              : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab 1: Overview, Numerology & Compatibility */}
                    {activeVastuTab === 'OVERVIEW' && (
                      <div className="space-y-6 animate-in fade-in duration-300 text-xs">
                        {/* Section 1: House Number Numerology */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                            1. House Number Numerology (Root: {advancedHouseResult.houseNumerology?.reducedDigit || advancedHouseResult.reducedTotal})
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Calculation Path</span>
                              <p className="text-slate-700 bg-white p-2.5 rounded-lg border font-mono">{advancedHouseResult.houseNumerology?.calculation || `Flat ${flatNumberInput || '1'} (${advancedHouseResult.addressBreakdown?.flatSum || 0}) + Street (${advancedHouseResult.addressBreakdown?.streetSum || 0}) = Single Root ${advancedHouseResult.reducedTotal || 0}`}</p>
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Core Planetary Energy</span>
                              <p className="text-slate-700 leading-relaxed">{advancedHouseResult.houseNumerology?.coreEnergy || advancedHouseResult.predictions}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold">What This Space Attracts</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.houseNumerology?.whatItAttracts || 'Attracts strong creative networking, luxury decor upgrades, and collaborative team operations.'}</p>
                            </div>
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-indigo-600 uppercase font-bold">Favorable For</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.houseNumerology?.favorableFor || 'Highly aligned for business professionals, entrepreneurs, remote team leads, and creative designers.'}</p>
                            </div>
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-amber-600 uppercase font-bold">Challenges & Obstacles</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.houseNumerology?.challenges || 'Prone to mental overstimulation, restless schedules, and minor domestic spending spikes if not cured.'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Compatibility with Occupant */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <User className="w-4 h-4 text-[#1E3A8A]" />
                            2. Primary Occupant Harmony & Compatibility
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-white rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">Life Path Match</span>
                              <p className="text-xl font-bold font-mono text-indigo-600 mt-1">{advancedHouseResult.occupantCompatibility?.lifePathMatch || 8}/10</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">Destiny Harmony</span>
                              <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{advancedHouseResult.occupantCompatibility?.destinyHarmony || 8}/10</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">Overall Compatibility</span>
                              <p className="text-xl font-bold font-mono text-[#1E3A8A] mt-1">{advancedHouseResult.occupantCompatibility?.overallScore || 9}/10</p>
                            </div>
                          </div>
                          <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xl border">{advancedHouseResult.occupantCompatibility?.explanation || 'Your personal driver coordinates and the residence compound value represent a solid and fertile match. This alignment ensures that the space acts as an emotional trampoline, reducing sleep restlessness and accelerating commercial achievements.'}</p>
                        </div>

                        {/* Section 3: Property Vibration Analysis */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <Activity className="w-4 h-4 text-rose-500" />
                            3. Property Vibration Analysis
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border">
                                <span className="font-bold text-slate-700">🧠 Mental Environment</span>
                                <span className="text-slate-500 italic text-[11px] text-right">{advancedHouseResult.propertyVibrations?.mental || 'Highly structured, low clutter, quiet thought flow'}</span>
                              </div>
                              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border">
                                <span className="font-bold text-slate-700">❤️ Emotional Atmosphere</span>
                                <span className="text-slate-500 italic text-[11px] text-right">{advancedHouseResult.propertyVibrations?.emotional || 'Encourages deep familial bonding, verbal sweetness'}</span>
                              </div>
                              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border">
                                <span className="font-bold text-slate-700">💰 Material & Financial Energy</span>
                                <span className="text-slate-500 italic text-[11px] text-right">{advancedHouseResult.propertyVibrations?.material || 'Stable cash cycles, supports premium investment ideas'}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border">
                                <span className="font-bold text-slate-700">⚡ Physical Health & Vitality</span>
                                <span className="text-slate-500 italic text-[11px] text-right">{advancedHouseResult.propertyVibrations?.health || 'Strong baseline defense, high immune resilience'}</span>
                              </div>
                              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border">
                                <span className="font-bold text-slate-700">🤝 Relationship Harmony</span>
                                <span className="text-slate-500 italic text-[11px] text-right">{advancedHouseResult.propertyVibrations?.relationship || 'Fosters long-term loyalty and reduces mutual disputes'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Room recommendations */}
                    {activeVastuTab === 'ROOMS' && (
                      <div className="space-y-4 animate-in fade-in duration-300 text-xs">
                        <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                          <Home className="w-4 h-4 text-[#1E3A8A]" />
                          4. Room-Wise Recommendations & Grid coordinates
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white border rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[10px] font-mono text-[#1E3A8A] font-bold block uppercase">👑 Master Bedroom (South-West)</span>
                            <p className="text-slate-600 leading-relaxed">{advancedHouseResult.roomRecommendations?.masterBedroom || 'South-West Nairutya is optimal. Ground with heavy wooden bed frame, ensuring sleep head is strictly pointed towards South.'}</p>
                          </div>
                          <div className="p-4 bg-white border rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[10px] font-mono text-indigo-600 font-bold block uppercase">🧒 Children's Room (West / North-West)</span>
                            <p className="text-slate-600 leading-relaxed">{advancedHouseResult.roomRecommendations?.childrenRoom || 'West zone or North-West (Vayu) zone ensures active cognitive retention, high logical growth, and healthy study rhythms.'}</p>
                          </div>
                          <div className="p-4 bg-white border rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[10px] font-mono text-emerald-600 font-bold block uppercase">💼 Home Office / Study (North / West)</span>
                            <p className="text-slate-600 leading-relaxed">{advancedHouseResult.roomRecommendations?.homeOffice || 'Place office desk in the North or West. Face East or North while working to maximize creative focus and opportunities.'}</p>
                          </div>
                          <div className="p-4 bg-white border rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[10px] font-mono text-rose-600 font-bold block uppercase">🔥 Kitchen & Burner (South-East)</span>
                            <p className="text-slate-600 leading-relaxed">{advancedHouseResult.roomRecommendations?.kitchen || 'South-East (Agneya) is highly optimal for the Fire element. Ensure the cook faces East while cooking; keep sink/water separate.'}</p>
                          </div>
                          <div className="p-4 bg-white border rounded-xl space-y-1.5 shadow-sm">
                            <span className="text-[10px] font-mono text-amber-600 font-bold block uppercase">🛋️ Living Room (East / North-East)</span>
                            <p className="text-slate-600 leading-relaxed">{advancedHouseResult.roomRecommendations?.livingRoom || 'East or North-East ensures positive solar energy intake. Keep seating furniture lightweight and center of space entirely open.'}</p>
                          </div>
                          <div className="p-4 bg-white border rounded-xl space-y-1.5 shadow-sm border-amber-200">
                            <span className="text-[10px] font-mono text-amber-700 font-bold block uppercase flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> 🧘 Prayer & Meditation Room (North-East)
                            </span>
                            <p className="text-slate-600 leading-relaxed">{advancedHouseResult.roomRecommendations?.meditationSpace || 'Keep North-East Ishan zone completely clean and free of heavy machinery. Ideal for family altar or quiet yoga session.'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Directional Color Scheme */}
                    {activeVastuTab === 'DIRECTIONS' && (
                      <div className="space-y-4 animate-in fade-in duration-300 text-xs">
                        <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                          <Compass className="w-4 h-4 text-[#1E3A8A]" />
                          5. Directional Color Scheme & Element Mapping
                        </h5>
                        <p className="text-slate-500 text-xs">An exhaustive coordinate grid detailing color solutions, associated elements, and custom decor objects to enhance localized magnetic waves.</p>
                        
                        <div className="overflow-x-auto border rounded-2xl">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b">
                                <th className="p-3 font-mono uppercase text-[9px] text-slate-500 font-bold">Direction</th>
                                <th className="p-3 font-mono uppercase text-[9px] text-slate-500 font-bold">Element</th>
                                <th className="p-3 font-mono uppercase text-[9px] text-slate-500 font-bold">Recommended Colors</th>
                                <th className="p-3 font-mono uppercase text-[9px] text-slate-500 font-bold">Hex Codes</th>
                                <th className="p-3 font-mono uppercase text-[9px] text-slate-500 font-bold">Decor suggestions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(advancedHouseResult.directionalAnalysis || []).map((dir: any, idx: number) => (
                                <tr key={idx} className="border-b hover:bg-slate-50/50">
                                  <td className="p-3 font-bold text-[#1E3A8A]">{dir.direction}</td>
                                  <td className="p-3 font-mono text-[11px] text-slate-600">{dir.element}</td>
                                  <td className="p-3 font-sans">
                                    <div className="flex flex-wrap gap-1">
                                      {(dir.colors || []).map((color: string, cIdx: number) => (
                                        <span key={cIdx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                                          {color}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono text-[11px]">
                                    <div className="flex flex-col gap-1">
                                      {(dir.hexCodes || []).map((hex: string, hIdx: number) => (
                                        <div key={hIdx} className="flex items-center gap-1">
                                          <div className="w-3.5 h-3.5 border rounded-sm shrink-0" style={{ backgroundColor: hex }} />
                                          <span>{hex}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 font-sans leading-relaxed">{dir.decor}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Remedies & Energy Optimization */}
                    {activeVastuTab === 'REMEDIES' && (
                      <div className="space-y-6 animate-in fade-in duration-300 text-xs">
                        {/* Section 6: Entrance Analysis */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <Compass className="w-4 h-4 text-emerald-600" />
                            6. Main Entrance & Door Aesthetics Analysis (Favorability: {advancedHouseResult.entranceAnalysis?.currentFavorability || 8}/10)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Best Entrance Direction</span>
                              <p className="text-slate-700 leading-relaxed font-bold">{advancedHouseResult.entranceAnalysis?.bestEntranceDirection || 'East (Indra) or North (Kubera)'}</p>
                            </div>
                            <div className="space-y-2 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Ideal Door Shade</span>
                              <p className="text-slate-700 leading-relaxed font-mono flex items-center gap-1.5">
                                <div className="w-4 h-4 border rounded-sm" style={{ backgroundColor: advancedHouseResult.entranceAnalysis?.doorColor?.match(/#([0-9a-fA-F]{3,6})/)?.[0] || '#FFFFF0' }} />
                                {advancedHouseResult.entranceAnalysis?.doorColor || 'Ivory Cream (#FFFFF0)'}
                              </p>
                            </div>
                            <div className="space-y-2 bg-white p-3 rounded-xl border md:col-span-2">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Auspicious Nameplate Design</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.entranceAnalysis?.nameplateDesign || 'Rectangular heavy teak nameplate with gold brass lettering, positioned right of main threshold.'}</p>
                            </div>
                            <div className="space-y-2 bg-white p-3 rounded-xl border md:col-span-2">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Threshold Protection Remedies</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.entranceAnalysis?.thresholdRemedies || 'Embed a solid brass string beneath marble doorway threshold plate to filter static grounding streams.'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section 8: Vastu Corrections & Dosha remedies */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                            <ShieldAlert className="w-4 h-4 text-rose-500" />
                            8. Critical Vastu Corrections & Non-Structural Remedies
                          </h5>
                          <div className="space-y-3">
                            {(advancedHouseResult.vastuCorrections?.doshas || []).map((dosha: any, dIdx: number) => (
                              <div key={dIdx} className="bg-white border rounded-xl p-4 space-y-2">
                                <div className="flex justify-between items-center border-b pb-1">
                                  <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px] text-rose-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> {dosha.name}
                                  </span>
                                </div>
                                <p className="text-slate-600"><strong className="text-slate-700">Impact:</strong> {dosha.impact}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                                  <div className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-100">
                                    <strong className="text-emerald-700 block uppercase font-mono tracking-wider text-[9px] mb-0.5">Non-Structural remedy</strong>
                                    <p className="text-slate-600">{dosha.nonStructuralRemedy}</p>
                                  </div>
                                  <div className="p-2.5 bg-blue-50/40 rounded-lg border border-blue-100">
                                    <strong className="text-blue-700 block uppercase font-mono tracking-wider text-[9px] mb-0.5">Structural correction</strong>
                                    <p className="text-slate-600">{dosha.structuralRemedy}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Section 9: Element Balancing */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            9. Element Balancing Analysis
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Current Element Distribution</span>
                              <p className="text-slate-700 leading-relaxed">{advancedHouseResult.elementBalancing?.currentDistribution || 'Earth: 30%, Fire: 15% (Deficient), Water: 25%, Air: 15% (Low), Space: 15%'}</p>
                            </div>
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-rose-600 uppercase font-bold block">Deficient Element & Enhancement Method</span>
                              <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                {(advancedHouseResult.elementBalancing?.deficientElements || []).map((el: string, eIdx: number) => (
                                  <span key={eIdx} className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                                    {el}
                                  </span>
                                ))}
                              </div>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.elementBalancing?.enhancementMethods || 'Enhance deficient Fire using copper lighting in SE zone; burn aromatic camphors weekly.'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section 10: Energy Optimization */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <Activity className="w-4 h-4 text-[#1E3A8A]" />
                            10. Home Energy Optimization Guidelines
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3.5 rounded-xl border space-y-1">
                              <span className="font-mono text-[10px] uppercase font-bold text-slate-700">🪞 Mirror Placement</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.energyOptimization?.mirrors || 'Place mirrors strictly on North or East walls of the living room to double flow. Avoid reflecting the master bed.'}</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border space-y-1">
                              <span className="font-mono text-[10px] uppercase font-bold text-slate-700">⛲ Water features</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.energyOptimization?.waterFeatures || 'Place a table-top flowing fountain in the North-East zone of living room, ensuring flow is directed inward.'}</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border space-y-1">
                              <span className="font-mono text-[10px] uppercase font-bold text-slate-700">🪴 Beneficial Flora</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.energyOptimization?.plants || 'Cultivate Snake Plants, Money Plants, and Holy Basil (Tulsi) in East and North windows. Avoid thorny plants.'}</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border space-y-1">
                              <span className="font-mono text-[10px] uppercase font-bold text-slate-700">💡 Light & Brightness</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.energyOptimization?.lighting || 'Ensure Brahmasthan is highly lit. Use warm white bulbs in South-East/South and cool white in North-West study room.'}</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl border space-y-1 md:col-span-2">
                              <span className="font-mono text-[10px] uppercase font-bold text-slate-700">💎 Aura Crystal Matrix</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.energyOptimization?.crystals || 'Set raw black tourmaline at door threshold to neutralize static waves, and clear amethyst clusters in the study zone.'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 5: Timing, Future & Recommendations */}
                    {activeVastuTab === 'TIMING' && (
                      <div className="space-y-6 animate-in fade-in duration-300 text-xs">
                        {/* Section 7: Auspicious Timing */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <Calendar className="w-4 h-4 text-[#1E3A8A]" />
                            7. Auspicious Move-In Timing & Muhurats (90 days window)
                          </h5>
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Top 5 Griha Pravesh Move-In Dates</span>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              {((advancedHouseResult.auspiciousTiming?.moveInDates || advancedHouseResult.auspiciousMoveInDates || [])).map((item: any, idx: number) => {
                                const hasReason = typeof item === 'object' && item !== null;
                                return (
                                  <div key={idx} className="bg-white border rounded-xl p-3 space-y-1 shadow-sm">
                                    <span className="font-mono font-bold text-[#1E3A8A] block border-b pb-0.5">{hasReason ? item.date : `Auspicious Date ${idx + 1}`}</span>
                                    <p className="text-[10px] text-slate-500 leading-relaxed pt-1">{hasReason ? item.reason : item}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Gruhapravesh Muhurat Time</span>
                              <p className="text-slate-700 font-bold">{advancedHouseResult.auspiciousTiming?.gruhapravesh || '11th of next month, 08:30 AM to 10:15 AM'}</p>
                            </div>
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Renovation & Repairs Window</span>
                              <p className="text-slate-700">{advancedHouseResult.auspiciousTiming?.renovation || 'Initiate corrective breaking wall tasks strictly on Wednesdays or Thursdays'}</p>
                            </div>
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Asset & Furniture Purchase Days</span>
                              <p className="text-slate-700">{advancedHouseResult.auspiciousTiming?.majorPurchases || 'Best days are Fridays (Venus comfort) and Sundays (Sun power)'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section 11: Tenant/Ownership Analysis */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            11. Tenant Suitability & Ownership Investment Analysis
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-white rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">Ownership Suitability</span>
                              <p className="text-xl font-bold font-mono text-[#1E3A8A] mt-1">{advancedHouseResult.tenantOwnership?.ownershipScore || 8}/10</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">Rental Suitability</span>
                              <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{advancedHouseResult.tenantOwnership?.rentalScore || 7}/10</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Ideal Tenant Profile</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.tenantOwnership?.idealTenantProfile || 'Ideal for individuals with Life Path or Destiny numbers 1, 5, or 6. Suited for corporate employees or contractors.'}</p>
                            </div>
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Investment & Appreciation Potential</span>
                              <p className="text-slate-600 leading-relaxed">{advancedHouseResult.tenantOwnership?.investmentPotential || 'Strong future appreciation indicators due to robust protective geomagnetism and active local grid lines.'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section 12: Annual Property Energy */}
                        <div className="p-5 border bg-slate-50/30 rounded-2xl space-y-3">
                          <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1.5 border-b pb-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            12. Annual Property Energy Forecast ({new Date().getFullYear()})
                          </h5>
                          <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xl border">{advancedHouseResult.annualEnergy?.currentYear || 'This year offers immense opportunity for asset development, sudden luxury updates, and steady commercial income.'}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold block">Best Prosperous Phases</span>
                              <p className="text-slate-600">{advancedHouseResult.annualEnergy?.bestPhases || 'September to December are highly optimal months to establish businesses.'}</p>
                            </div>
                            <div className="space-y-1 bg-white p-3 rounded-xl border">
                              <span className="text-[10px] font-mono text-rose-600 uppercase font-bold block">Challenging Periods & Precautions</span>
                              <p className="text-slate-600">{advancedHouseResult.annualEnergy?.challengingPeriods || 'Minor low energy phase in November; cured by weekly rock-salt water mopping.'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section 13: Final Recommendation & Highlighted Action Items */}
                        <div className="p-6 border-2 border-amber-300 bg-amber-50/25 rounded-3xl space-y-4">
                          <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                            <h5 className="font-playfair text-base font-bold text-[#1E3A8A] flex items-center gap-1.5">
                              <Award className="w-5 h-5 text-amber-500 fill-amber-500" />
                              13. Final Recommendation & Action Plan
                            </h5>
                            <span className="text-lg font-mono font-extrabold text-[#1E3A8A]">
                              Vastu Score: {advancedHouseResult.finalRecommendation?.overallScore || advancedHouseResult.scores?.prosperityScore || 85}/100
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono text-[#D97706] uppercase font-bold block">Primary Resolution</span>
                            <p className="text-slate-800 font-bold text-sm leading-relaxed">{advancedHouseResult.finalRecommendation?.stayMoveBuy || 'Highly Recommended to Stay, Align threshold elements, and proceed with asset additions.'}</p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-indigo-700 uppercase font-bold block">Top 5 Priority Action Items (Clear Highlights)</span>
                            <ul className="space-y-2.5">
                              {(advancedHouseResult.finalRecommendation?.topPriorities || advancedHouseResult.remedies?.elementalRemedies || []).slice(0, 5).map((item: string, idx: number) => (
                                <li key={idx} className="flex gap-2.5 items-start bg-white p-2 rounded-xl border shadow-sm">
                                  <span className="w-5 h-5 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs text-slate-700 font-medium leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {houseMode === 'QUICK' && houseResult && (
              <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-6 animate-in fade-in duration-500 leading-relaxed font-sans">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <span className="text-[9px] font-mono bg-amber-50 text-amber-700 font-extrabold px-3 py-1 rounded-full uppercase">Type Vibe: {houseResult.vibe}</span>
                    <h4 className="font-playfair text-lg font-bold text-slate-800 mt-2">Home Root Value: {houseResult.reducedTotal}</h4>
                    <p className="text-xs text-slate-505 font-mono text-[#D97706] mt-0.5">Energy: {houseResult.energyVibration}</p>
                  </div>
                </div>

                {/* Score Meters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-center border">
                    <p className="text-[10px] font-mono text-slate-450 uppercase font-bold">Wealth potential</p>
                    <p className="text-xl font-bold font-mono text-[#1E3A8A] mt-1">{houseResult.wealthPotential}/100</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-center border">
                    <p className="text-[10px] font-mono text-slate-450 uppercase font-bold">Family Harmony</p>
                    <p className="text-xl font-bold font-mono text-rose-600 mt-1">{houseResult.familyHarmony}/100</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-center border">
                    <p className="text-[10px] font-mono text-slate-450 uppercase font-bold font-bold">Spiritual energy</p>
                    <p className="text-xl font-bold font-mono text-indigo-600 mt-1">{houseResult.spiritualEnergy}/100</p>
                  </div>
                </div>

                {/* Meaning & Advice */}
                <div className="space-y-3">
                  <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1"><Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" /> Vastu House Essence</h5>
                  <p className="text-xs text-slate-650 font-sans leading-relaxed font-bold">{houseResult.meaning}</p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl text-xs space-y-3 border">
                  <div>
                    <h6 className="font-bold text-slate-800 flex items-center gap-1"><Info className="w-3.5 h-3.5 text-[#1E3A8A]" /> Key Household Advice:</h6>
                    <p className="text-slate-600 mt-1 leading-relaxed">{houseResult.advice}</p>
                  </div>
                  <div className="border-t pt-3">
                    <h6 className="font-bold text-amber-800 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Mandir Vastu Remedy:</h6>
                    <p className="text-slate-600 mt-1 leading-relaxed">{houseResult.remedy}</p>
                  </div>
                </div>

                {/* Expanded Predictions */}
                <div className="space-y-2">
                  <h5 className="font-playfair text-sm font-bold text-slate-800">Long-Term Domestic Forecast</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">{houseResult.predictions}</p>
                </div>

                {/* Vastu Elements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/25 rounded-2xl p-4 border text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#D97706] font-bold">Lucky directions (Directions to Face)</span>
                    <p className="font-bold text-slate-700 mt-1">{houseResult.luckyDirections.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#D97706] font-bold">Best Vastu Wall Colors</span>
                    <p className="font-bold text-slate-700 mt-1">{houseResult.luckyColors.join(', ')}</p>
                  </div>
                </div>

                {/* Expandable Why */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowHouseWhy(!showHouseWhy)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <Info className="w-4 h-4" /> {showHouseWhy ? 'Hide' : 'Show'} "Why This Result?" Detailed Logic Breakdown
                  </button>
                  {showHouseWhy && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-2xl border text-xs text-slate-600 space-y-2">
                      <p><strong>Calculations Matrix:</strong> The system extracts sum of all numbers in your house address (ignoring letter tags except if specified). The cumulative sums resolve to Compound {houseResult.totalSum}, subsequently yielding root {houseResult.reducedTotal}.</p>
                      <p><strong>Planetary Rulers:</strong> Standard Indian Vastu assigns specific element vectors to other planets. Numbers like 6 represent high Venusian luxury vibration which multiplies structural assets potential, while numbers like 7 represent cold Ketu energy which benefits solo meditation.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* BUSINESS MODULE */}
        {activeModule === 'BUSINESS' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">Pro Business Firm Name Suite</h3>
                <p className="text-xs text-slate-500 font-sans">Evaluate existing corporate brand names or generate AI-powered options aligned with your driver frequency.</p>
              </div>
              <div className="flex bg-[#F2E8DC]/40 p-1 rounded-xl shrink-0 self-start sm:self-auto gap-1">
                <button
                  type="button"
                  onClick={() => setBusinessMode('CHECK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    businessMode === 'CHECK' ? 'bg-[#1E3A8A] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Verify Name
                </button>
                <button
                  type="button"
                  onClick={() => setBusinessMode('GENERATE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    businessMode === 'GENERATE' ? 'bg-[#1E3A8A] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AI Generator
                </button>
                <button
                  type="button"
                  onClick={() => setBusinessMode('OPTIMAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    businessMode === 'OPTIMAL' ? 'bg-[#1E3A8A] text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Optimal Suggestions
                </button>
              </div>
            </div>

            {businessMode === 'CHECK' ? (
              <div className="space-y-6">
                <form onSubmit={handleBusinessSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Business Firm Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Leo Occult Enterprises"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Primary Owner's Driver Number</label>
                    <select
                      value={businessDriver}
                      onChange={(e) => setBusinessDriver(parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>Driver {n}</option>)}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="col-span-1 sm:col-span-2 w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-all"
                  >
                    Scan Corporate Vibration
                  </button>
                </form>

                {businessResult && (
                  <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-6 animate-in fade-in duration-500 leading-relaxed font-sans">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                      <div>
                        <span className="text-[9px] font-mono bg-indigo-50 text-[#1E3A8A] font-extrabold px-3 py-1 rounded-full uppercase">Chaldean Name Value: {businessResult.chaldeanTotal}</span>
                        <h4 className="font-playfair text-lg font-bold text-slate-800 mt-2">Business Expression root: {businessResult.reducedTotal}</h4>
                        <p className="text-xs text-slate-500 mt-1 font-mono">Marketing Energy Level: {businessResult.marketingEnergy}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider ${
                          businessResult.suitability === 'OUTSTANDING' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          businessResult.suitability === 'POOR' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-50 text-slate-600'
                        }`}>{businessResult.suitability} SUITABILITY</span>
                      </div>
                    </div>

                    {/* Score meters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-slate-50 rounded-2xl text-center border">
                        <p className="text-[10px] font-mono text-slate-450 uppercase font-bold">Brand Strength</p>
                        <p className="text-lg font-bold font-mono text-[#1E3A8A] mt-1">{businessResult.brandStrengthScore}/100</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl text-center border">
                        <p className="text-[10px] font-mono text-slate-450 uppercase font-bold font-bold">Customer Loyalty</p>
                        <p className="text-lg font-bold font-mono text-emerald-600 mt-1">{businessResult.customerAttractionScore}/100</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl text-center border">
                        <p className="text-[10px] font-mono text-slate-450 uppercase font-bold font-bold">Financial health</p>
                        <p className="text-lg font-bold font-mono text-indigo-600 mt-1">{businessResult.financialStrength}/100</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl text-center border">
                        <p className="text-[10px] font-mono text-slate-450 uppercase font-bold font-bold">Growth Potential</p>
                        <p className="text-lg font-bold font-mono text-amber-600 mt-1">{businessResult.growthPotential}/100</p>
                      </div>
                    </div>

                    {/* Core meanings */}
                    <div className="space-y-3">
                      <h5 className="font-playfair text-sm font-bold text-[#1E3A8A] flex items-center gap-1"><Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" /> Planetary Brand Meaning</h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">{businessResult.meaning}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border rounded-2xl text-xs space-y-2">
                      <p><strong>Auspicious Industries:</strong> {businessResult.industrySuitability}</p>
                      <p className="text-[#D97706]"><strong>Corporate expansion tip:</strong> {businessResult.expansionTip}</p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-playfair text-sm font-bold text-slate-800">Remedial Corrections</h5>
                      <p className="text-xs text-slate-650 leading-relaxed">{businessResult.suggestedCorrections}</p>
                      <p className="text-xs text-slate-505 leading-relaxed italic">{businessResult.longTermForecast}</p>
                    </div>

                    {/* Business Remedies */}
                    <div className="bg-amber-50/10 p-5 rounded-2xl border border-amber-500/10 text-xs">
                      <h6 className="font-bold text-[#D97706] mb-2 font-mono uppercase">Grandmaster Business Remedies list</h6>
                      <ul className="space-y-2 text-slate-600">
                        {businessResult.businessRemedies.map((r, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <CheckCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Expandable Why */}
                    <div className="border-t pt-4">
                      <button
                        onClick={() => setShowBusinessWhy(!showBusinessWhy)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                      >
                        <Info className="w-4 h-4" /> {showBusinessWhy ? 'Hide' : 'Show'} "Why This Result?" Detailed Logic Breakdown
                      </button>
                      {showBusinessWhy && (
                        <div className="mt-3 p-4 bg-slate-50 rounded-2xl border text-xs text-slate-600 space-y-2">
                          <p><strong>Calculations Matrix:</strong> The system sums your business name letter values under Chaldean rules, resolving to initial sum {businessResult.chaldeanTotal}, reducing to Root {businessResult.reducedTotal}.</p>
                          <p><strong>Owner Synastry:</strong> Your Driver Number is {businessDriver}. In the Indian system, business totals like 5 (Merchant Mercury) or 6 (Venus) are friendly with almost all driver matrices except for Saturn delays under specific sectors.</p>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ) : businessMode === 'GENERATE' ? (
              <div className="space-y-6">
                <form onSubmit={handleGenerateBusinessNames} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Industry Segment</label>
                    <select
                      value={bizIndustry}
                      onChange={(e: any) => setBizIndustry(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                    >
                      <option value="TECH">Technology & AI Labs</option>
                      <option value="FINANCE">Finance, Advisory & Holdings</option>
                      <option value="SPIRITUAL">Spiritual, Healing & Meditation</option>
                      <option value="CORPORATE">Corporate, Synergy & Consulting</option>
                      <option value="CREATIVE">Creative, Design & Studio</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Founder Driver Number</label>
                    <select
                      value={businessDriver}
                      onChange={(e) => setBusinessDriver(parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>Driver {n}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Seed Brand Keywords</label>
                    <input
                      type="text"
                      placeholder="e.g. Leo, Astro, Zen, Vertex"
                      value={bizKeywords}
                      onChange={(e) => setBizKeywords(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Brand Vibe Preference</label>
                    <select
                      value={bizVibe}
                      onChange={(e: any) => setBizVibe(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                    >
                      <option value="PREMIUM">Premium & Majestic</option>
                      <option value="MODERN">Modern & Innovative</option>
                      <option value="SPIRITUAL">Spiritual & Peaceful</option>
                      <option value="CORPORATE">Authoritative & Corporate</option>
                      <option value="CREATIVE">Creative & Dynamic</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isGeneratingBiz}
                    className="col-span-1 sm:col-span-2 w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingBiz ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing Cosmic Vectors & Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                        Generate 20 Compatible Names
                      </>
                    )}
                  </button>
                </form>

                {bizGenError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex gap-2 items-center">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{bizGenError}</span>
                  </div>
                )}

                {bizGeneratedNames.length > 0 && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                      <h4 className="font-playfair text-lg font-bold text-slate-800">Generated Brands aligned with Driver {businessDriver}</h4>
                      <span className="text-xs font-mono text-slate-500">Sorted by Founder Compatibility</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bizGeneratedNames.map((item, idx) => (
                        <div key={idx} className="bg-white border hover:border-[#1E3A8A]/50 transition-all rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h5 className="font-playfair text-base font-bold text-slate-900">{item.name}</h5>
                              <span className="text-[10px] font-mono bg-indigo-50 text-[#1E3A8A] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                              "{item.explanation}"
                            </p>
                          </div>

                          <div className="border-t pt-3 space-y-2 text-xs font-mono">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Chaldean Total</span>
                                <span className="font-bold text-slate-800">{item.chaldeanTotal} (Root {item.chaldeanRoot})</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Pythagorean Total</span>
                                <span className="font-bold text-slate-800">{item.pythagoreanTotal} (Root {item.pythagoreanRoot})</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-500">Founder Alignment</span>
                                <span className="font-bold text-emerald-600">{item.founderCompatibility}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${item.founderCompatibility >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${item.founderCompatibility}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Form and Results Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Form Questionnaire */}
                  <div className="lg:col-span-1 bg-[#F2E8DC]/15 p-6 rounded-3xl border border-[#F2E8DC] space-y-6 h-fit">
                    <div className="space-y-1 border-b border-[#F2E8DC]/60 pb-3">
                      <h4 className="font-playfair text-base font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#D97706]" />
                        Optimal Naming Form
                      </h4>
                      <p className="text-[11px] text-slate-500">Provide details about your venture and target market to feed the Chaldean corporate naming algorithm.</p>
                    </div>

                    <form onSubmit={handleGenerateOptimalNames} className="space-y-4">
                      {/* Owner's Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Owner's Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alexander Mercer"
                          value={optOwnerName}
                          onChange={(e) => setOptOwnerName(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>

                      {/* Owner's DOB */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Owner's Date of Birth</label>
                        <input
                          type="date"
                          required
                          value={optOwnerDob}
                          onChange={(e) => setOptOwnerDob(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>

                      {/* Industry / Niche */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Industry / Niche</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. E-commerce Cosmetics, AI SaaS"
                          value={optIndustry}
                          onChange={(e) => setOptIndustry(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>

                      {/* Business Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Business Type</label>
                        <select
                          value={optBusinessType}
                          onChange={(e) => setOptBusinessType(e.target.value as any)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        >
                          <option value="Product">Product Focused</option>
                          <option value="Service">Service Focused</option>
                          <option value="Both">Hybrid (Both Product & Service)</option>
                        </select>
                      </div>

                      {/* Target Audience */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Target Audience</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gen-Z Techies, Young Parents"
                          value={optTargetAudience}
                          onChange={(e) => setOptTargetAudience(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>

                      {/* Keywords to Include */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Keywords to Include</label>
                          <span className="text-[9px] font-sans text-slate-400">Optional</span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Zen, Sol, Tech"
                          value={optKeywordsInclude}
                          onChange={(e) => setOptKeywordsInclude(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>

                      {/* Keywords to Avoid */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Keywords to Avoid</label>
                          <span className="text-[9px] font-sans text-slate-400">Optional</span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Cheap, Cold, Bad"
                          value={optKeywordsAvoid}
                          onChange={(e) => setOptKeywordsAvoid(e.target.value)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>

                      {/* Preferred Name Length */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Preferred Name Length</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Short', 'Medium', 'Long'] as const).map((len) => (
                            <button
                              key={len}
                              type="button"
                              onClick={() => setOptNameLength(len)}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                                optNameLength === len 
                                  ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white font-bold shadow-sm' 
                                  : 'bg-white border-[#E5E7EB] text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {len === 'Short' ? 'Short' : len === 'Medium' ? 'Medium' : 'Long'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tone Preference */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider block font-bold">Tone Preference</label>
                        <select
                          value={optTonePreference}
                          onChange={(e) => setOptTonePreference(e.target.value as any)}
                          className="w-full bg-white border border-[#E5E7EB] py-2 px-3 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        >
                          <option value="Modern">Modern / Clean</option>
                          <option value="Traditional">Traditional / Sanskrit-Vedic</option>
                          <option value="Creative">Creative / Whimsical</option>
                          <option value="Professional">Professional / Corporate</option>
                          <option value="Fun">Fun / Playful</option>
                        </select>
                      </div>

                      {/* Generate Button */}
                      <button
                        type="submit"
                        disabled={isGeneratingOpt}
                        className="w-full mt-2 bg-[#1E3A8A] hover:bg-[#152A66] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-mono uppercase font-bold text-xs tracking-wider py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isGeneratingOpt ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                            Generate 15 Names
                          </>
                        )}
                      </button>
                    </form>

                    {optError && (
                      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex gap-2 items-center">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{optError}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Loading State / Results View / Empty State */}
                  <div className="lg:col-span-2 space-y-6">
                    {isGeneratingOpt ? (
                      <div className="bg-white border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-sm min-h-[450px]">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-[#1E3A8A]/10 border-t-[#1E3A8A] rounded-full animate-spin" />
                          <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="space-y-2 max-w-md">
                          <h4 className="font-playfair text-lg font-bold text-slate-800">Calibrating Brand Synastry Matrices</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans">
                            The corporate Astro-Naming engine is presently generating 15 detailed name profiles, calculating Chaldean and Pythagorean sound frequencies, mapping owner's driver/conductor friendly nodes, and identifying auspicious launching Muhurthas...
                          </p>
                        </div>
                        <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-[#1E3A8A] w-full animate-[shimmer_1.5s_infinite]" style={{ backgroundSize: '200% 100%' }} />
                        </div>
                      </div>
                    ) : optResult ? (
                      <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Results Header Stats Panel */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 p-4 rounded-2xl text-center">
                            <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Suggestions</span>
                            <span className="text-sm font-mono font-extrabold text-[#1E3A8A]">15 Profiles</span>
                          </div>
                          <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 p-4 rounded-2xl text-center">
                            <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Owner Mulank</span>
                            <span className="text-sm font-mono font-extrabold text-[#1E3A8A]">Driver {getDriverAndConductor(optOwnerDob).driver}</span>
                          </div>
                          <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 p-4 rounded-2xl text-center">
                            <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Owner Bhagyank</span>
                            <span className="text-sm font-mono font-extrabold text-[#1E3A8A]">Conductor {getDriverAndConductor(optOwnerDob).conductor}</span>
                          </div>
                          <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 p-4 rounded-2xl text-center">
                            <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Key Harmony</span>
                            <span className="text-sm font-mono font-extrabold text-amber-600">Venus & Jupiter</span>
                          </div>
                        </div>

                        {/* Interactive Suggestions Split View */}
                        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b pb-3">
                            <div>
                              <h4 className="font-playfair text-base font-bold text-slate-800">15 Optimal Corporate Suggestions</h4>
                              <p className="text-[10px] text-slate-400">Click any name on the left to reveal its deep numerology & brand asset dossier.</p>
                            </div>
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 font-extrabold px-2 py-0.5 rounded-full uppercase">
                              100% Calibrated
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                            {/* Left: Button List */}
                            <div className="md:col-span-5 border-r pr-2 md:pr-4 space-y-2 max-h-[460px] overflow-y-auto scrollbar-thin">
                              {optResult.names.map((n: any, idx: number) => {
                                const isSelected = selectedResultIndex === idx;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedResultIndex(idx)}
                                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between group cursor-pointer ${
                                      isSelected 
                                        ? 'bg-[#1E3A8A]/5 border-[#1E3A8A] shadow-sm' 
                                        : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Rank #{idx + 1}</span>
                                      <span className={`text-xs font-bold font-playfair transition-colors ${
                                        isSelected ? 'text-[#1E3A8A]' : 'text-slate-800'
                                      }`}>
                                        {n.name}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] font-mono font-bold bg-amber-50 text-[#D97706] py-0.5 px-1.5 rounded-full">
                                        {n.ownerCompatibility.toFixed(1)}/10
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Right: Master Dossier Sheet */}
                            <div className="md:col-span-7 space-y-5 animate-in fade-in duration-300">
                              {(() => {
                                const n = optResult.names[selectedResultIndex] || optResult.names[0];
                                if (!n) return null;
                                return (
                                  <>
                                    {/* Name & Tagline Banner */}
                                    <div className="bg-[#1E3A8A]/5 p-5 rounded-2xl border border-[#1E3A8A]/10 relative overflow-hidden">
                                      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-[#1E3A8A]/5 rounded-bl-full pointer-events-none" />
                                      <span className="text-[9px] font-mono text-amber-600 uppercase tracking-widest font-bold">SUGGESTION #{selectedResultIndex + 1}</span>
                                      <h3 className="font-playfair text-2xl font-extrabold text-[#1E3A8A] mt-1">{n.name}</h3>
                                      <p className="text-xs text-slate-500 font-sans italic mt-1 font-medium">"{n.taglineIdea}"</p>
                                    </div>

                                    {/* Numerological Formula */}
                                    <div className="bg-slate-50 p-4 rounded-xl border space-y-1.5">
                                      <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Authentic Numerical Calculation</span>
                                      <code className="text-[11px] font-mono text-[#1E3A8A] block break-all font-bold">
                                        {n.calculation}
                                      </code>
                                      <p className="text-[10px] text-slate-500 font-sans mt-1 leading-relaxed">
                                        <strong>Chaldean Vibration Power:</strong> {n.meaning}
                                      </p>
                                    </div>

                                    {/* Score Metrics */}
                                    <div className="space-y-3">
                                      <h5 className="text-[10px] font-mono text-slate-450 uppercase font-bold">Alignment Calibration Scores</h5>
                                      <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 bg-slate-50 border rounded-xl text-center">
                                          <span className="text-[8px] font-mono text-slate-400 uppercase block">Owner Affinity</span>
                                          <span className="text-sm font-bold font-mono text-[#1E3A8A] block mt-0.5">{n.ownerCompatibility}/10</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 border rounded-xl text-center">
                                          <span className="text-[8px] font-mono text-slate-400 uppercase block">Industry Fit</span>
                                          <span className="text-sm font-bold font-mono text-emerald-600 block mt-0.5">{n.industryRelevanceScore}/10</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 border rounded-xl text-center">
                                          <span className="text-[8px] font-mono text-slate-400 uppercase block">Market Appeal</span>
                                          <span className="text-sm font-bold font-mono text-indigo-600 block mt-0.5">{n.marketAppealScore}/10</span>
                                        </div>
                                      </div>
                                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans italic mt-1.5">
                                        <strong>Affinity Insight:</strong> {n.ownerCompatibilityExplanation}
                                      </p>
                                    </div>

                                    {/* Energetics */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-mono text-slate-455 uppercase font-bold block">Aura & Magnetism</span>
                                      <p className="text-xs text-slate-600 leading-relaxed font-sans bg-amber-50/10 p-3.5 border border-amber-500/10 rounded-xl">
                                        {n.vibrationEnergy}
                                      </p>
                                    </div>

                                    {/* Pros & Cons */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold block">Brand Advantages</span>
                                        <ul className="space-y-1 text-slate-600 text-[11px] font-sans">
                                          {n.pros?.map((pro: string, pIdx: number) => (
                                            <li key={pIdx} className="flex gap-1.5 items-start">
                                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                              <span>{pro}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-mono text-amber-600 uppercase font-bold block">Potential Hurdles</span>
                                        <ul className="space-y-1 text-slate-600 text-[11px] font-sans">
                                          {n.cons?.map((con: string, cIdx: number) => (
                                            <li key={cIdx} className="flex gap-1.5 items-start">
                                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                              <span>{con}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>

                                    {/* Logo & Domain */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Corporate Color Palette</span>
                                        <div className="flex gap-2">
                                          {n.logoColors?.map((col: any, colIdx: number) => (
                                            <div key={colIdx} className="flex flex-col items-center space-y-1 bg-slate-50 p-1.5 rounded-lg border w-full">
                                              <div className="w-6 h-6 rounded-full border shadow-inner" style={{ backgroundColor: col.hex }} />
                                              <span className="text-[8px] font-mono text-slate-500 block truncate max-w-[60px]">{col.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Web Domain Guidance</span>
                                        <div className="bg-indigo-50/40 p-2.5 border border-indigo-500/10 rounded-xl flex items-center justify-between">
                                          <span className="text-[11px] font-mono font-bold text-[#1E3A8A] break-all">{n.domainSuggestion}</span>
                                          <span className="text-[8px] font-mono bg-indigo-100 text-indigo-700 py-0.5 px-1.5 rounded uppercase shrink-0 font-extrabold ml-1">Secure</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Best Launch Date */}
                                    <div className="border-t pt-4 p-4 bg-emerald-50/10 border border-emerald-500/10 rounded-2xl">
                                      <span className="text-[9px] font-mono text-emerald-600 uppercase font-bold block">Auspicious Launch Muhurtha</span>
                                      <div className="flex items-start gap-2.5 mt-1.5">
                                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                          <span className="text-xs font-mono font-extrabold text-slate-800">{new Date(n.bestLaunchDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                          <p className="text-[10px] text-slate-500 leading-relaxed font-sans">{n.bestLaunchDateReason}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Top 3 deep dives */}
                        {optResult.deepDives && optResult.deepDives.length > 0 && (
                          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="border-b pb-3">
                              <h4 className="font-playfair text-base font-bold text-slate-800">Top 3 Deep-Dive Market Consultations</h4>
                              <p className="text-[10px] text-slate-400">Exclusive forward-looking astro-growth prediction portfolios for the elite brand candidates.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {optResult.deepDives.map((d: any, idx: number) => (
                                <div key={idx} className="bg-gradient-to-b from-slate-50 to-white border hover:border-amber-500/40 transition-all rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-mono bg-amber-50 text-[#D97706] font-bold py-0.5 px-2 rounded-full">GOLD PRIORITY #{idx + 1}</span>
                                      <span className="text-xs font-mono font-bold text-[#1E3A8A]">Root {rToSingle(calcChaldean(d.name))}</span>
                                    </div>
                                    <h5 className="font-playfair text-base font-extrabold text-slate-900 border-b pb-1.5">{d.name}</h5>
                                    
                                    <div className="space-y-2 text-xs">
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">6-Month Growth Trajectory</span>
                                        <p className="text-slate-600 leading-relaxed font-sans text-[11px]">{d.sixMonthGrowth}</p>
                                      </div>
                                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                        <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">1st Year Scale Challenge</span>
                                        <p className="text-slate-600 leading-relaxed font-sans text-[11px]">{d.firstYearChallenges}</p>
                                      </div>
                                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                        <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Planetary Marketing Engine</span>
                                        <p className="text-slate-600 leading-relaxed font-sans text-[11px]">{d.marketingStrategy}</p>
                                      </div>
                                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                        <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Audience Psychological Blueprint</span>
                                        <p className="text-slate-600 leading-relaxed font-sans text-[11px]">{d.customerPerception}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Full Rankings Table */}
                        {optResult.finalRanking && optResult.finalRanking.length > 0 && (
                          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="border-b pb-3">
                              <h4 className="font-playfair text-base font-bold text-slate-800">Definitive Venture Naming Index</h4>
                              <p className="text-[10px] text-slate-400">All 15 generated name alternatives mathematically evaluated and ranked from most favorable to least favorable.</p>
                            </div>

                            <div className="overflow-x-auto rounded-xl border scrollbar-thin">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 font-mono text-[10px] text-slate-455 uppercase border-b">
                                    <th className="py-3 px-4 font-bold text-center">Rank</th>
                                    <th className="py-3 px-4 font-bold">Corporate Name</th>
                                    <th className="py-3 px-4 font-bold text-center">Chaldean Total</th>
                                    <th className="py-3 px-4 font-bold text-center">Affinity Score</th>
                                    <th className="py-3 px-4 font-bold text-center">Overall Index Score</th>
                                    <th className="py-3 px-4 font-bold text-center">Aura Grade</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y font-sans">
                                  {optResult.finalRanking.map((rk: any, rIdx: number) => {
                                    const matchingDetails = optResult.names.find((x: any) => x.name === rk.name) || {};
                                    return (
                                      <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 text-center font-mono font-extrabold text-[#1E3A8A]">#{rk.rank}</td>
                                        <td className="py-3 px-4 font-playfair font-bold text-slate-900">{rk.name}</td>
                                        <td className="py-3 px-4 text-center font-mono text-slate-600">{matchingDetails.numerologicalValue || "N/A"}</td>
                                        <td className="py-3 px-4 text-center font-mono text-[#D97706] font-bold">{matchingDetails.ownerCompatibility ? `${matchingDetails.ownerCompatibility}/10` : "N/A"}</td>
                                        <td className="py-3 px-4 text-center font-mono text-indigo-600 font-extrabold">{rk.score}/10</td>
                                        <td className="py-3 px-4 text-center font-mono">
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                            rk.score >= 9.0 
                                              ? 'bg-emerald-50 text-emerald-600' 
                                              : rk.score >= 8.0 
                                                ? 'bg-blue-50 text-blue-600' 
                                                : 'bg-amber-50 text-amber-600'
                                          }`}>
                                            {rk.score >= 9.0 ? 'A+ Elite' : rk.score >= 8.5 ? 'A High' : rk.score >= 8.0 ? 'B+ Stable' : 'B Standard'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[450px]">
                        <div className="w-12 h-12 bg-[#F2E8DC]/40 rounded-full flex items-center justify-center text-[#1E3A8A]">
                          <Compass className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-2 max-w-sm">
                          <h4 className="font-playfair text-base font-bold text-slate-800">Astro-Corporate Corporate Naming Oracle</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans">
                            Fill out the business profile details, seed keywords, and preference options in the questionnaire panel. 
                          </p>
                          <p className="text-xs text-slate-400 font-sans italic">
                            The system will instantly generate 15 highly optimized suggested profiles, map out owner alignment grades, logo palette advice, auspicious launching dates, and build top-tier deep dives.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SIGNATURE MODULE */}
        {activeModule === 'SIGNATURE' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4">
              <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">AI Signature Audit Pro</h3>
              <p className="text-xs text-slate-500 font-sans">Audit how different signature trailing coordinates or ending lines directly block or accelerate career wealth flow under Handwriting Vastu & Chaldean Numerology.</p>
            </div>

            {/* PROFILE SYNCHRONIZATION AND DETAILS */}
            <div className="bg-slate-50 border rounded-3xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-playfair text-base font-bold text-slate-800">1. Birth Profile & Planetary Grid</h4>
                  <p className="text-[11px] text-slate-500">Sync birth coordinates to personalize Handwriting Vastu alignment.</p>
                </div>
                {savedProfiles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Profile Sync:</span>
                    <select
                      value={selectedProfileIndex}
                      onChange={(e) => handleProfileSelectChange(parseInt(e.target.value, 10))}
                      className="bg-white border text-xs px-3 py-1.5 rounded-xl text-slate-700 font-medium focus:ring-1 focus:ring-[#1E3A8A] focus:outline-none"
                    >
                      {savedProfiles.map((p, idx) => (
                        <option key={idx} value={idx}>{p.name} ({p.dob})</option>
                      ))}
                      <option value={-1}>+ Use Custom Credentials</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Subject's Full Name</label>
                  <input
                    type="text"
                    value={sigName}
                    onChange={(e) => {
                      setSigName(e.target.value);
                      setSelectedProfileIndex(-1);
                    }}
                    placeholder="e.g. Raajeev Singh"
                    className="w-full bg-white border border-slate-200 text-xs px-4 py-2.5 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Birth Date</label>
                  <input
                    type="date"
                    value={sigDob}
                    onChange={(e) => {
                      setSigDob(e.target.value);
                      setSelectedProfileIndex(-1);
                    }}
                    className="w-full bg-white border border-slate-200 text-xs px-4 py-2.5 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Profession / Industry</label>
                  <input
                    type="text"
                    value={sigProfession}
                    onChange={(e) => {
                      setSigProfession(e.target.value);
                    }}
                    placeholder="e.g. Software, Finance, Art"
                    className="w-full bg-white border border-slate-200 text-xs px-4 py-2.5 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              {sigDob && sigName && (
                <div className="bg-white border rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="border-r border-slate-100 last:border-none">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Mulank (Driver)</span>
                    <span className="font-playfair text-lg font-extrabold text-[#D97706] mt-0.5 block">{getDriverNumber(sigDob)}</span>
                    <span className="text-[9px] text-slate-400">Planet: {
                      ['Sun', 'Moon', 'Jupiter', 'Rahu', 'Mercury', 'Venus', 'Ketu', 'Saturn', 'Mars'][getDriverNumber(sigDob) - 1]
                    }</span>
                  </div>
                  <div className="border-r border-slate-100 last:border-none">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Bhagyank (Conductor)</span>
                    <span className="font-playfair text-lg font-extrabold text-[#1E3A8A] mt-0.5 block">{getConductorNumber(sigDob)}</span>
                    <span className="text-[9px] text-slate-400">Karma Destiny</span>
                  </div>
                  <div className="border-r border-slate-100 last:border-none">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Name Chaldean</span>
                    <span className="font-playfair text-lg font-extrabold text-indigo-800 mt-0.5 block">{getChaldeanNameNumber(sigName)}</span>
                    <span className="text-[9px] text-slate-400">Expression Root {getSingleDigit(getChaldeanNameNumber(sigName))}</span>
                  </div>
                  <div className="last:border-none">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Mercury Stabilizer</span>
                    <span className="text-xs font-semibold mt-1 block">
                      {getDriverNumber(sigDob) === 5 || getConductorNumber(sigDob) === 5 ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">Present (Strong)</span>
                      ) : (
                        <span className="text-amber-600 flex items-center justify-center gap-1">Requires Support</span>
                      )}
                    </span>
                    <span className="text-[8px] text-slate-400">Central 5 alignment status</span>
                  </div>
                </div>
              )}
            </div>

            {/* SIGNATURE SUBMISSION / CAPTURE BOARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submission Area */}
              <div className="bg-white border rounded-3xl p-6 space-y-4">
                <h4 className="font-playfair text-base font-bold text-slate-800">2. Upload Signature or Use Camera</h4>
                <p className="text-[11px] text-slate-500">Provide a sample of your current handwritten signature for AI Handwriting Vastu diagnostics.</p>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processSignatureFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('sig-file-input')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 min-h-[160px] ${
                    isDragOver ? 'border-[#1E3A8A] bg-[#1E3A8A]/5' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="file"
                    id="sig-file-input"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processSignatureFile(e.target.files[0]);
                      }
                    }}
                  />

                  {isProcessingFile ? (
                    <div className="flex flex-col items-center space-y-2 py-4">
                      <div className="w-8 h-8 border-4 border-[#1E3A8A]/30 border-t-[#1E3A8A] rounded-full animate-spin"></div>
                      <p className="text-xs font-semibold text-[#1E3A8A]">Processing & compressing signature image...</p>
                      <p className="text-[10px] text-slate-400">Optimizing resolution for astro-numerological audit...</p>
                    </div>
                  ) : sigImage ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <img
                        src={sigImage}
                        alt="Signature Preview"
                        className="max-h-24 max-w-full object-contain rounded border-2 border-emerald-500 shadow-sm p-1 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      {fileUploadSuccess && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 mt-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          ✓ Signature Loaded & optimized
                        </div>
                      )}
                      <p className="text-xs font-mono text-slate-600 truncate max-w-[200px] mt-1">{sigFileName || 'signature.png'}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSigImage(null);
                          setSigFileName(null);
                          setFileUploadSuccess(false);
                        }}
                        className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-600">Drag & drop your signature here, or <span className="text-[#1E3A8A] underline">browse files</span></p>
                      <p className="text-[10px] text-slate-400">Accepts PNG, JPG, JPEG, WEBP signatures (max 10MB)</p>
                    </>
                  )}
                </div>

                {/* Camera Capture Section */}
                <div className="space-y-2">
                  {!sigCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-slate-500" /> Capture signature using camera
                    </button>
                  ) : (
                    <div className="border rounded-2xl p-4 bg-slate-900 space-y-3 relative overflow-hidden">
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover scale-x-[-1]"
                          playsInline
                          muted
                        />
                        <div className="absolute inset-4 border border-dashed border-white/40 pointer-events-none rounded flex items-center justify-center">
                          <span className="text-[9px] text-white/50 uppercase tracking-widest font-mono">Align signature inside box</span>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={captureSignature}
                          className="py-1.5 px-4 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Capture sample
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Textual Fallback Reference Card */}
              <div className="bg-white border rounded-3xl p-6 space-y-4">
                <h4 className="font-playfair text-base font-bold text-slate-800">Or: Choose Current General Style</h4>
                <p className="text-[11px] text-slate-500">No image? Choose the closest style of your current signature to run the AI engine with fallback descriptors.</p>
                
                <div className="space-y-2">
                  {[
                    { id: 'RISING_UNDERLINE', label: '15-Degree Rising Line + Underline', desc: 'Positive, ascending confidence line.' },
                    { id: 'TRAILING_DOT_BELOW', label: 'First Letter Large + Trailing Dot Below', desc: 'Subconscious lock blockages.' },
                    { id: 'FALLING_LINE', label: 'Downward Sloping Trailing Segment', desc: 'Declining cellular forces, delays.' },
                    { id: 'DOUBLE_UNDERLINE', label: 'Straight Line + Two Support Underlines', desc: 'Strong structure, corporate base.' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSignatureTrigger(s.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer block ${
                        signatureStyle === s.id ? 'bg-[#1E3A8A]/5 border-[#1E3A8A] ring-1 ring-[#1E3A8A]' : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{s.label}</span>
                        {signatureStyle === s.id && <Check className="w-4 h-4 text-[#1E3A8A]" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-sans">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. SIGNATURE STRUCTURAL QUESTIONNAIRE */}
            <div className="bg-slate-50 border rounded-3xl p-6 space-y-4">
              <div>
                <h4 className="font-playfair text-base font-bold text-slate-800">3. Signature Handwriting Structural Questionnaire</h4>
                <p className="text-[11px] text-slate-500">Provide precise structural descriptions of your handwriting. These coordinates calibrate the AI Vastu Engine to analyze hidden psychological and financial archetypes with masterclass precision.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name signed */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Name Signed</label>
                  <input
                    type="text"
                    value={sigDescNameSigned}
                    onChange={(e) => setSigDescNameSigned(e.target.value)}
                    placeholder={sigName || "e.g. R. Singh / Raajeev"}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-850 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  />
                  <p className="text-[9px] text-slate-400">Exact letters or initials as written.</p>
                </div>

                {/* Size */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Signature Size</label>
                  <select
                    value={sigDescSize}
                    onChange={(e) => setSigDescSize(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="Small">Small (Compared to standard text)</option>
                    <option value="Medium">Medium (Balanced & standard)</option>
                    <option value="Large">Large (Bold & prominent)</option>
                  </select>
                  <p className="text-[9px] text-slate-400">Physical height of the letters.</p>
                </div>

                {/* Slant */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Handwriting Slant</label>
                  <select
                    value={sigDescSlant}
                    onChange={(e) => setSigDescSlant(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="Forward">Forward Slant (Right leaning)</option>
                    <option value="Backward">Backward Slant (Left leaning)</option>
                    <option value="Straight">Straight (Vertical / Upright)</option>
                    <option value="Mixed">Mixed Slant (Inconsistent)</option>
                  </select>
                  <p className="text-[9px] text-slate-400">Directional angle of characters.</p>
                </div>

                {/* Legibility */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Letter Legibility</label>
                  <select
                    value={sigDescLegibility}
                    onChange={(e) => setSigDescLegibility(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="Very Clear">Very Clear (Easily readable)</option>
                    <option value="Moderately Clear">Moderately Clear (Some parts stylized)</option>
                    <option value="Stylized">Stylized (Artistic flow)</option>
                    <option value="Illegible">Illegible (Abstract / Scribble)</option>
                  </select>
                  <p className="text-[9px] text-slate-400">How readable the name is to others.</p>
                </div>

                {/* Pressure */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Pen Pressure</label>
                  <select
                    value={sigDescPressure}
                    onChange={(e) => setSigDescPressure(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="Light">Light Pressure (Soft & fine lines)</option>
                    <option value="Medium">Medium Pressure (Standard & steady)</option>
                    <option value="Heavy">Heavy Pressure (Deep impressions)</option>
                  </select>
                  <p className="text-[9px] text-slate-400">Force applied onto the paper.</p>
                </div>

                {/* Speed */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Writing Speed</label>
                  <select
                    value={sigDescSpeed}
                    onChange={(e) => setSigDescSpeed(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="Slow and careful">Slow and careful</option>
                    <option value="Quick and flowing">Quick and flowing</option>
                  </select>
                  <p className="text-[9px] text-slate-400">Flow velocity of writing hand.</p>
                </div>

                {/* Name Prominence */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Name Prominence Treatment</label>
                  <select
                    value={sigDescFirstVsLast}
                    onChange={(e) => setSigDescFirstVsLast(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="First name more prominent">First name more prominent</option>
                    <option value="Last name more prominent">Last name more prominent (Family heritage)</option>
                    <option value="Equally balanced">Equally balanced / Merged</option>
                    <option value="Initials only">Initials only</option>
                  </select>
                  <p className="text-[9px] text-slate-400">Vastu prominence ratio between first/last name.</p>
                </div>

                {/* Underline Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Underline Foundation</label>
                  <select
                    value={sigDescUnderline}
                    onChange={(e) => setSigDescUnderline(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="No">No Underline</option>
                    <option value="Yes">Yes, Has Underline</option>
                  </select>
                  <p className="text-[9px] text-slate-400">Whether there is a line drawn underneath.</p>
                </div>

                {/* Flourishes Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Flourishes & Loops</label>
                  <select
                    value={sigDescFlourishes}
                    onChange={(e) => setSigDescFlourishes(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                  >
                    <option value="No">No Flourishes</option>
                    <option value="Yes">Yes, Has Decorative Elements</option>
                  </select>
                  <p className="text-[9px] text-slate-400">Loops, enclosing circles, or art swirls.</p>
                </div>
              </div>

              {/* Conditional Inputs for Underline and Flourishes */}
              {(sigDescUnderline === 'Yes' || sigDescFlourishes === 'Yes') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {sigDescUnderline === 'Yes' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Underline Description</label>
                      <input
                        type="text"
                        value={sigDescUnderlineDesc}
                        onChange={(e) => setSigDescUnderlineDesc(e.target.value)}
                        placeholder="e.g. Simple single line / Double underline / Elaborate upward-flick"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                      <p className="text-[9px] text-slate-400">Describe the line style underneath.</p>
                    </div>
                  )}

                  {sigDescFlourishes === 'Yes' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Flourishes Description</label>
                      <input
                        type="text"
                        value={sigDescFlourishesDesc}
                        onChange={(e) => setSigDescFlourishesDesc(e.target.value)}
                        placeholder="e.g. Loop in the first letter / Enclosing circle / Trailing dot below"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                      <p className="text-[9px] text-slate-400">Describe any loops, curves, dots or circles.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Special Characteristics */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Special Characteristics & Unique Features</label>
                <textarea
                  value={sigDescSpecial}
                  onChange={(e) => setSigDescSpecial(e.target.value)}
                  placeholder="e.g. Signature rises at a steep 30-degree angle, starts with a massive decorative initial, the last letter is crossed back to the left, or ends with an upward flick..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] font-sans"
                />
                <p className="text-[9px] text-slate-400">Any other specific features, angles, pens or traits you want the AI Vastu Astrologer to know.</p>
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {sigError && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-800 flex gap-2 items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="font-medium">{sigError}</p>
              </div>
            )}

            {/* ACTION TRIGGERS */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => handleAISignatureAudit()}
                disabled={isAnalyzingSig}
                className={`py-3.5 px-8 rounded-full text-xs font-bold tracking-wider uppercase shadow-md flex items-center gap-2 cursor-pointer transition-all ${
                  isAnalyzingSig
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1E3A8A] text-white hover:bg-[#1e3a8a]/90 hover:shadow-lg active:scale-95'
                }`}
              >
                {isAnalyzingSig ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Handwriting Vastu...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" /> Start AI Signature Audit Pro
                  </>
                )}
              </button>
            </div>

            {/* AUDIT RESULTS DOSSIER */}
            {sigAuditResult ? (
              <div className="bg-white border rounded-3xl p-6 space-y-8 animate-in fade-in duration-500 mt-6" id="signature-dossier-report">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                  <div>
                    <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
                      AI Handwriting Vastu Completed
                    </span>
                    <h3 className="font-playfair text-xl font-bold text-[#1E3A8A] mt-2">Personalized Signature Vastu Dossier</h3>
                    <p className="text-xs text-slate-500">Tailored to Driver {getDriverNumber(sigDob)} & Conductor {getConductorNumber(sigDob)} cosmic coordinates.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="py-1.5 px-4 rounded-xl text-xs font-bold border hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Print Report
                    </button>
                    <button
                      onClick={() => {
                        setSigAuditResult(null);
                        setSigImage(null);
                        setSigFileName(null);
                      }}
                      className="py-1.5 px-4 rounded-xl text-xs font-bold bg-slate-50 border hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
                    >
                      Reset Audit
                    </button>
                  </div>
                </div>

                {/* SECTION 1: COMPATIBILITY DASHBOARD & NUMEROLOGY SYNASTRY */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Circular Score Gauge */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-indigo-50/50 to-slate-50 border rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold mb-4">Overall Vastu Alignment</span>
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          className="stroke-slate-200"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          className="stroke-[#1E3A8A]"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 60}
                          strokeDashoffset={2 * Math.PI * 60 * (1 - ((sigAuditResult.compatibilityScore?.score || 8) * 10) / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="flex flex-col items-center">
                        <span className="font-playfair text-4xl font-black text-slate-800">{(sigAuditResult.compatibilityScore?.score || 8) * 10}%</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">Vastu Synastry</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-655 mt-4 font-medium leading-relaxed text-center">
                      {(sigAuditResult.compatibilityScore?.score || 8) >= 8 ? (
                        <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Highly Auspicious Vastu Alignment
                        </span>
                      ) : (sigAuditResult.compatibilityScore?.score || 8) >= 6 ? (
                        <span className="text-[#D97706] font-bold flex items-center justify-center gap-1">
                          <Info className="w-4 h-4" /> Moderate Karmic Blockages Found
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center justify-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Severe Energy Leakages Detected
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Numerological Synastry explanation */}
                  <div className="lg:col-span-8 bg-white border rounded-3xl p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Planetary Name Synastry
                      </span>
                      <h4 className="font-playfair text-base font-bold text-slate-800 mt-2">1. Astro-Chaldean Sound Vibrations</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans mt-2">
                        {sigAuditResult.compatibilityScore?.detailedExplanation || sigAuditResult.numerologicalCompatibility?.explanation}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-3 rounded-xl text-center">
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Birth Name Value</span>
                        <span className="block font-playfair text-lg font-bold text-slate-805 mt-0.5">{sigAuditResult.numerologicalCompatibility?.birthNameValue || getChaldeanNameNumber(sigName)}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl text-center">
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Signed Name Value</span>
                        <span className="block font-playfair text-lg font-bold text-indigo-805 mt-0.5">{sigAuditResult.numerologicalCompatibility?.signatureNameValue || getChaldeanNameNumber(sigName)}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl text-center col-span-2 md:col-span-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Synastry Match</span>
                        <span className="block font-playfair text-lg font-bold text-[#D97706] mt-0.5">{sigAuditResult.numerologicalCompatibility?.compatibilityScore || sigAuditResult.compatibilityScore?.score || 8}/10</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PSYCHOLOGICAL INTERPRETATION */}
                <div className="space-y-4">
                  <h4 className="font-playfair text-base font-bold text-slate-800">2. Psychological & Personality Interpretation</h4>
                  <p className="text-[11px] text-slate-500">Deconstructs subconscious personality traits, ego projections, and behavioral patterns hidden within the pen movements.</p>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Confidence */}
                    <div className="bg-slate-50/60 border rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <Shield className="w-4 h-4 text-indigo-700" />
                          <span>Confidence Level</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                          {sigAuditResult.psychologicalInterpretation?.confidenceLevel}
                        </p>
                      </div>
                    </div>

                    {/* Ego */}
                    <div className="bg-slate-50/60 border rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <User className="w-4 h-4 text-emerald-700" />
                          <span>Ego & Self-Image</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                          {sigAuditResult.psychologicalInterpretation?.egoSelfImage}
                        </p>
                      </div>
                    </div>

                    {/* Public vs Private */}
                    <div className="bg-slate-50/60 border rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <Eye className="w-4 h-4 text-amber-700" />
                          <span>Public vs Private Persona</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                          {sigAuditResult.psychologicalInterpretation?.publicPrivateGap}
                        </p>
                      </div>
                    </div>

                    {/* Emotional Style */}
                    <div className="bg-slate-50/60 border rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <Heart className="w-4 h-4 text-rose-700" />
                          <span>Emotional Expression</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                          {sigAuditResult.psychologicalInterpretation?.emotionalStyle}
                        </p>
                      </div>
                    </div>

                    {/* Ambition */}
                    <div className="bg-slate-50/60 border rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                          <TrendingUp className="w-4 h-4 text-orange-700" />
                          <span>Ambition & Drive</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                          {sigAuditResult.psychologicalInterpretation?.ambitionDrive}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: PROFESSIONAL IMPACT */}
                <div className="space-y-4">
                  <h4 className="font-playfair text-base font-bold text-slate-800">3. Professional & Executive Impact Assessment</h4>
                  <p className="text-[11px] text-slate-500">How your signature acts as a cosmic brand, influencing career authority and industry suitability.</p>

                  <div className="bg-gradient-to-r from-[#1E3A8A]/5 to-[#1E3A8A]/10 border rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                    <div className="bg-white/80 backdrop-blur border p-4 rounded-2xl space-y-1">
                      <span className="text-[9px] font-mono text-[#1E3A8A] uppercase font-bold tracking-wider">First Impression</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{sigAuditResult.professionalImpact?.firstImpression}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur border p-4 rounded-2xl space-y-1">
                      <span className="text-[9px] font-mono text-[#1E3A8A] uppercase font-bold tracking-wider">Authority & Credibility</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{sigAuditResult.professionalImpact?.authorityCredibility}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur border p-4 rounded-2xl space-y-1">
                      <span className="text-[9px] font-mono text-[#D97706] uppercase font-bold tracking-wider">Industry Suitability</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{sigAuditResult.professionalImpact?.industrySuitability}</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: SPECIFIC TRAIT INDICATORS */}
                <div className="space-y-4">
                  <h4 className="font-playfair text-base font-bold text-slate-800">4. Structural Graphology Trait Breakdown</h4>
                  <p className="text-[11px] text-slate-500">Analysis of the physical coordinates mapped from your handwriting sample.</p>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      { title: 'Physical Size', val: sigAuditResult.specificTraitIndicators?.size, icon: Compass },
                      { title: 'Handwriting Slant', val: sigAuditResult.specificTraitIndicators?.slant, icon: Activity },
                      { title: 'Letter Legibility', val: sigAuditResult.specificTraitIndicators?.legibility, icon: Eye },
                      { title: 'Underline Style', val: sigAuditResult.specificTraitIndicators?.underline, icon: ArrowRight },
                      { title: 'Flourishes & Loops', val: sigAuditResult.specificTraitIndicators?.flourishes, icon: Sparkles }
                    ].map((param, idx) => {
                      const IconComp = param.icon;
                      return (
                        <div key={idx} className="bg-slate-50/50 border rounded-2xl p-4 space-y-2">
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                            <IconComp className="w-4 h-4 text-[#1E3A8A]" />
                            <span>{param.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-650 leading-relaxed font-sans">{param.val}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 5: RECOMMENDATIONS & REMEDIAL BLUEPRINT */}
                <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#1E3A8A]/10 pb-3">
                    <Shield className="w-5 h-5 text-[#1E3A8A]" />
                    <div>
                      <h4 className="font-playfair text-base font-bold text-[#1E3A8A]">5. Actionable Remedial Redesign Formula</h4>
                      <p className="text-[11px] text-slate-500">Astrological and graphological adjustments prescribed for immediate daily practice.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 font-sans">
                    {/* Modification assessment & variants */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="bg-white p-4 rounded-2xl border">
                        <span className="text-[9px] font-mono text-[#D97706] uppercase tracking-wider block font-bold mb-1">Should You Modify Your Signature?</span>
                        <p className="font-medium text-slate-800 leading-relaxed">{sigAuditResult.recommendations?.shouldModify}</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border space-y-3">
                        <span className="text-[9px] font-mono text-indigo-700 uppercase tracking-wider block font-bold">Custom Redesigned Vastu Style Alternatives</span>
                        <div className="space-y-2">
                          {sigAuditResult.recommendations?.variants?.map((variant: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-start text-[11px]">
                              <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5">{idx + 1}</span>
                              <p className="text-slate-650 leading-relaxed">{variant}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ink Colors & Tools */}
                    <div className="bg-white border rounded-2xl p-4 space-y-4">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Auspicious Ink & Tools</span>
                      
                      <div className="space-y-3">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Astrological Ink Tones</span>
                        <div className="space-y-2">
                          {sigAuditResult.recommendations?.colors?.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-start text-[10px] leading-tight">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{
                                backgroundColor: item.color.toLowerCase().includes('blue') ? '#1D4ED8' : item.color.toLowerCase().includes('green') ? '#047857' : '#111827'
                              }} />
                              <div>
                                <span className="font-bold block text-slate-800">{item.color}</span>
                                <span className="text-[9px] text-slate-500 font-sans block mt-0.5">{item.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-2">
                        <div className="text-[10px]">
                          <strong className="text-slate-500 uppercase block font-mono text-[8px]">Recommended Pen Type</strong>
                          <span className="text-slate-700 font-medium">{sigAuditResult.recommendations?.penType}</span>
                        </div>
                        <div className="text-[10px]">
                          <strong className="text-slate-500 uppercase block font-mono text-[8px]">Ideal Writing Direction</strong>
                          <span className="text-slate-700 font-medium">{sigAuditResult.recommendations?.signingDirection}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 6: DIFFERENT PURPOSE BLUEPRINTS */}
                <div className="space-y-4">
                  <h4 className="font-playfair text-base font-bold text-slate-800">6. Contextual Blueprints for Different Purposes</h4>
                  <p className="text-[11px] text-slate-500">Fine-tune your signature style to evoke specific energetic frequencies depending on the context of use.</p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Legal */}
                    <div className="bg-slate-50 border rounded-2xl p-4 space-y-1.5">
                      <span className="text-[10px] font-mono text-[#1E3A8A] uppercase tracking-wider block font-bold">Legal Documents & Deeds</span>
                      <p className="text-[11px] text-slate-650 leading-relaxed font-sans">{sigAuditResult.differentPurposes?.legal}</p>
                    </div>

                    {/* Creative */}
                    <div className="bg-slate-50 border rounded-2xl p-4 space-y-1.5">
                      <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-wider block font-bold">Creative & Business Deeds</span>
                      <p className="text-[11px] text-slate-655 leading-relaxed font-sans">{sigAuditResult.differentPurposes?.creative}</p>
                    </div>

                    {/* Financial */}
                    <div className="bg-slate-50 border rounded-2xl p-4 space-y-1.5">
                      <span className="text-[10px] font-mono text-[#D97706] uppercase tracking-wider block font-bold">Financial & Bank Accounts</span>
                      <p className="text-[11px] text-slate-655 leading-relaxed font-sans">{sigAuditResult.differentPurposes?.financial}</p>
                    </div>

                    {/* Personal */}
                    <div className="bg-slate-50 border rounded-2xl p-4 space-y-1.5">
                      <span className="text-[10px] font-mono text-indigo-800 uppercase tracking-wider block font-bold">Personal & Informal Letters</span>
                      <p className="text-[11px] text-slate-655 leading-relaxed font-sans">{sigAuditResult.differentPurposes?.personal}</p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Fallback style selection display if no AI audit has run yet */
              signatureResult && (
                <div className="p-6 bg-slate-50 border rounded-3xl flex flex-col justify-between space-y-4 animate-in fade-in duration-500 mt-6">
                  <div className="border-b pb-3">
                    <span className="text-[9px] font-mono bg-indigo-50 text-[#1E3A8A] font-extrabold px-2 py-0.5 rounded-full uppercase">Signature General Profile</span>
                    <h4 className="font-playfair text-base font-bold text-slate-800 mt-2">Style: {signatureResult.directionStyle}</h4>
                    <p className="text-[11px] text-slate-500">Planetary Force: {signatureResult.planetaryEnergy}</p>
                  </div>

                  <div className="text-xs space-y-2 text-slate-650 leading-relaxed">
                    <p><strong>Career Impact:</strong> {signatureResult.careerImpact}</p>
                    <p><strong>Financial Impact:</strong> {signatureResult.financialImpact}</p>
                    <p className="text-indigo-800"><strong>Public Recognition Score:</strong> {signatureResult.publicRecognitionScore}/100</p>
                  </div>

                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-xs text-rose-900">
                    <p className="font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Needed Corrections:</p>
                    <ul className="list-disc list-inside mt-1 font-sans space-y-1 text-slate-600 text-[11px]">
                      {signatureResult.corrections.map((col, idx) => <li key={idx}>{col}</li>)}
                    </ul>
                  </div>

                  <div className="text-xs text-slate-650 pt-2 border-t">
                    <p className="font-bold text-[#D97706]">Grandmaster Advice:</p>
                    <p className="text-slate-500 italic mt-1 leading-relaxed">{signatureResult.recommendations}</p>
                  </div>

                  {/* Expandable Why */}
                  <div className="border-t pt-2">
                    <button
                      onClick={() => setShowSignatureWhy(!showSignatureWhy)}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" /> Explain why signature lines matter
                    </button>
                    {showSignatureWhy && (
                      <div className="mt-2 p-3 bg-white rounded-xl border text-[11px] text-slate-500 space-y-1">
                        <p><strong>Vastu for Handwriting:</strong> Under Indian occult dynamics, signatures are direct outlets of self-projecting subconscious. An ascending line signals high cellular energy, while terminal dots at bottom act like locks that freeze active capital flow.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}

        {/* CHILD MODULE */}
        {activeModule === 'CHILD' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4">
              <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">Auspicious Baby Starting Names Finder</h3>
              <p className="text-xs text-slate-500 font-sans">Generate highly supportive starting name alphabets based on birth drivers, learning styles, and future planetary setups.</p>
            </div>

            <form onSubmit={handleChildSubmit} className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Select Baby's Date of Birth</label>
                <input
                  type="date"
                  required
                  value={childDob}
                  onChange={(e) => setChildDob(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                />
              </div>
              <button
                type="submit"
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-6 py-3 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer self-end h-[46px] transition-all"
              >
                Scan DOB
              </button>
            </form>

            {childResult && (
              <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-5 animate-in fade-in duration-500 leading-relaxed font-sans text-xs">
                
                <span className="text-[9px] font-mono bg-indigo-50 text-[#1E3A8A] font-extrabold px-3 py-1 rounded-full uppercase">Computed: Driver {childResult.birthDriver} | Conductor {childResult.birthConductor}</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <strong className="text-emerald-800 text-xs flex items-center gap-1"><Award className="w-4 h-4" /> Recommended Alphabets:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {childResult.startingAlphabets.map((a, idx) => (
                        <span key={idx} className="bg-white border text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold font-mono shadow-sm">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <strong className="text-rose-800 text-xs flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Cautionary Alphabets (Avoid):</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {childResult.cautionaryAlphabets.map((a, idx) => (
                        <span key={idx} className="bg-white border text-rose-700 px-2.5 py-1 rounded-lg text-xs font-bold font-mono shadow-sm">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border rounded-2xl space-y-3 leading-relaxed">
                  <p><strong>Destined Career Path:</strong> {childResult.careerPrecedence}</p>
                  <p><strong>Learning Style:</strong> {childResult.learningStyle}</p>
                  <p><strong>Educational Strengths:</strong> {childResult.educationStrength}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <strong className="text-slate-800 text-xs">Creativity Level:</strong>
                    <p className="text-slate-500 mt-1 leading-relaxed">{childResult.creativity}</p>
                  </div>
                  <div>
                    <strong className="text-slate-800 text-xs">Communication Tone:</strong>
                    <p className="text-slate-500 mt-1 leading-relaxed">{childResult.communication}</p>
                  </div>
                </div>

                <div className="border-t pt-4 text-xs space-y-2">
                  <p className="font-bold text-[#D97706] uppercase font-mono">Parenting Vastu Guidance:</p>
                  <p className="text-slate-650 leading-relaxed">{childResult.parentingGuidance}</p>
                </div>

                <div className="p-3 bg-amber-50/20 rounded-xl border text-slate-650">
                  <p className="font-bold text-amber-900">Recommended Activities:</p>
                  <p className="text-slate-500 mt-0.5">{childResult.luckyActivities.join(', ')}</p>
                </div>

                {/* Expandable Why */}
                <div className="border-t pt-2">
                  <button
                    onClick={() => setShowChildWhy(!showChildWhy)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" /> Explain baby spelling calculation
                  </button>
                  {showChildWhy && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-500 space-y-1">
                      <p><strong>Chaldean Vibration:</strong> The recommended alphabets generate letters matching friendly, high-energy planets (like Jupiter for wisdom or Mercury for business) while keeping away from extreme Saturn opposition (8) or sudden delays.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* LUCKY DATES MODULE */}
        {activeModule === 'LUCKY_DATES' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4">
              <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">Auspicious Pro Dates Suite</h3>
              <p className="text-xs text-slate-500 font-sans">Find target-specific friendly dates for Business, Marriage, Travel, and property deals matching your birth numbers.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Driver Number</label>
                <select
                  value={luckyDatesDriver}
                  onChange={(e) => setLuckyDatesDriver(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>Driver {n}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Conductor Number</label>
                <select
                  value={luckyDatesConductor}
                  onChange={(e) => setLuckyDatesConductor(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>Conductor {n}</option>)}
                </select>
              </div>
              <button
                onClick={handleLuckyDatesTrigger}
                className="col-span-1 sm:col-span-2 w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-all"
              >
                Find Target Specific Dates
              </button>
            </div>

            {luckySuiteResult && (
              <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-6 animate-in fade-in duration-500 leading-relaxed font-sans text-xs">
                
                <h4 className="font-playfair text-sm uppercase font-mono text-[#D97706] tracking-wider font-bold">Auspicious Dates Breakdown Analysis</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100">
                    <span className="font-bold text-slate-750 font-mono text-[11px] uppercase text-emerald-800">Best Business Launch Dates</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{luckySuiteResult.businessDates.map(d=>`${d}th`).join(', ')}</p>
                  </div>

                  <div className="p-3 bg-red-50/20 rounded-xl border border-rose-100">
                    <span className="font-bold text-slate-750 font-mono text-[11px] uppercase text-[#D97706]">Auspicious Marriage Dates</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{luckySuiteResult.marriageDates.map(d=>`${d}th`).join(', ')}</p>
                  </div>

                  <div className="p-3 bg-blue-50/20 rounded-xl border border-blue-100">
                    <span className="font-bold text-slate-750 font-mono text-[11px] uppercase text-blue-700">Best Travel Venture Dates</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{luckySuiteResult.travelDates.map(d=>`${d}th`).join(', ')}</p>
                  </div>

                  <div className="p-3 bg-amber-50/20 rounded-xl border border-amber-150">
                    <span className="font-bold text-slate-755 font-mono text-[11px] uppercase text-amber-800">Financial Investments Dates</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{luckySuiteResult.investmentDates.map(d=>`${d}th`).join(', ')}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-750 font-mono text-[11px] uppercase">Property Registration Dates</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{luckySuiteResult.propertyDates.map(d=>`${d}th`).join(', ')}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100">
                    <span className="font-bold text-slate-750 font-mono text-[11px] uppercase text-indigo-700">Exams & Job Interviews Dates</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{luckySuiteResult.interviewDates.map(d=>`${d}th`).join(', ')}</p>
                  </div>

                </div>

                <p className="text-[11px] text-slate-500 italic pt-2">These dates represent peak matching parameters of Driver {luckyDatesDriver} and Conductor {luckyDatesConductor}. They bypass the hostile Saturn and Rahu numbers to prevent blocks during launch periods.</p>

                {/* Expandable Why */}
                <div className="border-t pt-2">
                  <button
                    onClick={() => setShowDatesWhy(!showDatesWhy)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" /> Explain dates selection logic
                  </button>
                  {showDatesWhy && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-500 space-y-1">
                      <p><strong>Friendly Reductions:</strong> Each date is filtered mathematically so that its reduced root number matches your friendly planetary rulers (e.g. 1, 3, 5, 6) while strictly weeding out obstructive or inimical totals to guarantee maximum smooth transit protection.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* MEDICAL MODULE */}
        {activeModule === 'MEDICAL' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4">
              <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">Ayurvedic Medical Numerology Scanner</h3>
              <p className="text-xs text-slate-500 font-sans">Map your birth psychic coordinates and name harmonics to diagnose latent bodily doshas (Vata, Pitta, Kapha) and receive personalized preventative health advice.</p>
            </div>

            <form onSubmit={handleMedicalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Seeker Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={medicalDob}
                    onChange={(e) => setMedicalDob(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Seeker Full Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Amit Sharma"
                    value={medicalName}
                    onChange={(e) => setMedicalName(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-all"
              >
                Scan My Medical Doshas & Health Index
              </button>
            </form>

            {medicalResult && (
              <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-6 animate-in fade-in duration-500 leading-relaxed font-sans text-xs">
                
                {/* MEDICAL DISCLAIMER */}
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[10px] flex gap-2 font-sans font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <div>
                    <strong>MEDICAL DISCLAIMER:</strong> This analysis is based strictly on Indian Occult Sciences (Vedic Numerology & Swara Shastra principles). It is intended purely for lifestyle, diet, and spiritual guidance and is NOT a substitute for professional medical advice, diagnosis, or treatment.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Dosha Breakdown Panel */}
                  <div className="space-y-4 border p-5 rounded-2xl bg-amber-50/10">
                    <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Ayurvedic Dosha Composition</h4>
                    <div className="space-y-3 font-semibold text-[11px]">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sky-700">Vata (वायु एवं आकाश - Senses, Movement)</span>
                          <span>{medicalResult.doshaComposition.vata}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${medicalResult.doshaComposition.vata}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-red-700">Pitta (अग्नि - Digestive Fire, Energy)</span>
                          <span>{medicalResult.doshaComposition.pitta}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${medicalResult.doshaComposition.pitta}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-emerald-700">Kapha (जल एवं पृथ्वी - Structure, Lubricant)</span>
                          <span>{medicalResult.doshaComposition.kapha}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${medicalResult.doshaComposition.kapha}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-500 leading-relaxed font-medium">
                      Primary Dominance is governed by **{medicalResult.dominantDosha}**, causing tendencies toward cold-dry blockages or warm respiratory delays. Secondary planetary influence is **{medicalResult.secondaryDosha}**.
                    </div>
                  </div>

                  {/* Health Scores Panel */}
                  <div className="space-y-4 border p-5 rounded-2xl bg-amber-50/5">
                    <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Planetary Vitality Sub-Scores</h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="text-slate-600 font-medium font-sans">Core Health Wellness Index</span>
                        <span className="font-mono font-bold bg-amber-100 text-[#D97706] px-2.5 py-0.5 rounded-full">{medicalResult.scores.healthScore}/100</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="text-slate-600 font-medium font-sans">Agni digestive Index</span>
                        <span className="font-mono font-bold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full">{medicalResult.scores.digestiveScore}/100</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="text-slate-600 font-medium font-sans">Karmic Stress vulnerability</span>
                        <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">{medicalResult.scores.stressScore}/100</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="text-slate-600 font-medium font-sans">Sleep depth Index</span>
                        <span className="font-mono font-bold bg-sky-100 text-sky-850 px-2.5 py-0.5 rounded-full">{medicalResult.scores.sleepScore}/100</span>
                      </div>
                      <div className="flex justify-between items-center pb-0.5">
                        <span className="text-slate-600 font-medium font-sans">Ojas Immunological Shield</span>
                        <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">{medicalResult.scores.immunityScore}/100</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weak body organs */}
                  <div className="p-4 bg-rose-50/20 border border-rose-100/70 rounded-2xl space-y-2 text-left">
                    <span className="font-bold font-mono text-[10px] uppercase text-rose-800 flex items-center gap-1.5 font-sans">
                      ⚠️ Weak Body Organs & Systems
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {medicalResult.weakBodySystems.map((sys, idx) => (
                        <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[9px] px-2.5 py-0.5 rounded-full font-semibold font-sans">{sys}</span>
                      ))}
                    </div>
                  </div>

                  {/* Fasting Day */}
                  <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl space-y-2 text-left">
                    <span className="font-bold font-mono text-[10px] uppercase text-amber-800 flex items-center gap-1.5 font-sans">
                      ☀️ Recommended Planetary Fasting Day
                    </span>
                    <p className="text-xs font-bold text-slate-850 pt-1 leading-relaxed">
                      We highly recommend practicing intermittent or complete planetary fasting on **{medicalResult.dietRecommendations.recommendedFastingDay}** to clear any blocked channel energies.
                    </p>
                  </div>
                </div>

                {/* Dietary suggestions bento */}
                <div className="p-5 border rounded-2xl space-y-4">
                  <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Vedic Diet Adjustments</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">🍽️ Recommended Health Foods</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        {medicalResult.dietRecommendations.recommendedFoods.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-mono uppercase text-red-700 font-bold block">🚫 Strictly Avoid / Cut Off Foods</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        {medicalResult.dietRecommendations.foodsToAvoid.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* YogaSuggestions and pranayama suggestions */}
                <div className="p-5 border rounded-2xl bg-slate-50/50 space-y-4">
                  <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Ayurvedic Dinacharya Lifestyle Suggestions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px]">
                    <div className="space-y-2 text-left">
                      <span className="font-bold text-slate-750 uppercase font-mono block">🧘 Recommended Asanas & Exercises</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {medicalResult.ayurvedicLifestyle.yogaSuggestions.map((yo, i) => (
                          <span key={i} className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded-lg">{yo}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <span className="font-bold text-slate-750 uppercase font-mono block">🌬️ Pranayama Channel Cleansers</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {medicalResult.ayurvedicLifestyle.pranayamaSuggestions.map((pr, i) => (
                          <span key={i} className="bg-amber-50 border border-amber-100 text-amber-900 px-2 py-0.5 rounded-lg">{pr}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2 border-t pt-3 text-left">
                      <span className="font-bold text-slate-750 uppercase font-mono block">⏰ Custom Sleep Guide & Morning Alarm</span>
                      <p className="text-slate-600 mt-1 leading-relaxed text-xs">
                        **Sleep Timing:** {medicalResult.ayurvedicLifestyle.sleepRecommendations}. <br />
                        **Morning Routine:** {medicalResult.ayurvedicLifestyle.morningRoutine}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expandable Why */}
                <div className="border-t pt-2 text-left">
                  <button
                    type="button"
                    onClick={() => setShowMedicalWhy(!showMedicalWhy)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" /> Explain medical calculation rule
                  </button>
                  {showMedicalWhy && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-500 space-y-1">
                      <p><strong>Birthday-Dosha Map:</strong> Birth dates map to celestial ruler planets with established physical properties in Ayurveda. Odd numbers (1-Sun, 9-Mars) govern Pitta. Soft even digits (2-Moon, 6-Venus) rule Kapha hydration. Delayed numbers (4-Rahu, 8-Saturn) govern dryness and neural Vata blockages.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* VAASTU MODULE */}
        {activeModule === 'VAASTU' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4">
              <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">Numero Vaastu Pro Scanner</h3>
              <p className="text-xs text-slate-500 font-sans">Calculate your cosmic Kua direction number matching the Eight Mansion (BaBazi) school. Find your positive spatial zones (Success, Health, Family, Growth) and place color placements inside your flats.</p>
            </div>

            <form onSubmit={handleVaastuSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={vaastuDob}
                    onChange={(e) => setVaastuDob(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Gender (Crucial for Kua Sums)</label>
                  <select
                    value={vaastuGender}
                    onChange={(e: any) => setVaastuGender(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none cursor-pointer"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Full Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Raajeev Singh"
                    value={vaastuName}
                    onChange={(e) => setVaastuName(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-all"
              >
                Scan Spatial Vastu Zones & Kua Number
              </button>
            </form>

            {vaastuResult && (
              <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-6 animate-in fade-in duration-500 leading-relaxed font-sans text-xs text-left">
                
                {/* Kua Number Core badge */}
                <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#D97706] uppercase tracking-wider font-mono font-bold block">Your Magnetic Vastu Signature</span>
                    <h4 className="font-playfair text-md font-bold text-slate-800">
                      Kua Number: <strong className="text-[#D97706] text-xl font-mono">{vaastuResult.kuaNumber}</strong> (Co-ruled by Element: {([1, 3, 4, 9].includes(vaastuResult.kuaNumber) ? (vaastuResult.kuaNumber === 1 ? 'Water' : vaastuResult.kuaNumber === 9 ? 'Fire' : 'Wood') : ([2, 8].includes(vaastuResult.kuaNumber) ? 'Earth' : 'Metal'))})
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      Your birthday coordinates belong to the **{vaastuResult.groupType === 'EAST_GROUP' ? 'East Mansion Group (पूर्व दिशा समूह)' : 'West Mansion Group (पश्चिम दिशा समूह)'}**. Aligning bed and desks matching this group activates rapid monetary luck.
                    </p>
                  </div>
                  <div className="bg-[#1E3A8A] text-white px-5 py-2 rounded-xl text-center shrink-0 font-sans">
                    <span className="text-[9px] block uppercase tracking-wider font-semibold font-mono">Orient Group</span>
                    <span className="font-bold text-xs">{vaastuResult.groupType === 'EAST_GROUP' ? 'EAST' : 'WEST'} GROUP</span>
                  </div>
                </div>

                {/* 2x2 Lucky directions bento */}
                <div className="space-y-4">
                  <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Eight Mansion Favorable Directions Grid</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="p-4 bg-emerald-50/25 border border-emerald-100/70 rounded-2xl space-y-1 text-left">
                      <span className="font-bold font-mono text-[10px] uppercase text-emerald-800 flex items-center gap-1 font-sans">
                        🚀 Success Direction (Sheng Chi)
                      </span>
                      <p className="text-sm font-bold text-slate-850 font-mono">{vaastuResult.directions.success.direction}</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans">{vaastuResult.directions.success.dynamicInfluence}</p>
                    </div>

                    <div className="p-4 bg-[#D97706]/5 border border-[#D97706]/10 rounded-2xl space-y-1 text-left">
                      <span className="font-bold font-mono text-[10px] uppercase text-[#D97706] flex items-center gap-1 font-sans">
                        ➕ Health Direction (Tien Yi)
                      </span>
                      <p className="text-sm font-bold text-slate-855 font-mono">{vaastuResult.directions.health.direction}</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans">{vaastuResult.directions.health.dynamicInfluence}</p>
                    </div>

                    <div className="p-4 bg-pink-50/20 border border-pink-100/70 rounded-2xl space-y-1 text-left">
                      <span className="font-bold font-mono text-[10px] uppercase text-pink-700 flex items-center gap-1 font-sans">
                        💕 Relationship Direction (Nien Yen)
                      </span>
                      <p className="text-sm font-bold text-slate-850 font-mono">{vaastuResult.directions.family.direction}</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans">{vaastuResult.directions.family.dynamicInfluence}</p>
                    </div>

                    <div className="p-4 bg-blue-50/25 border border-blue-100/70 rounded-2xl space-y-1 text-left">
                      <span className="font-bold font-mono text-[10px] uppercase text-blue-800 flex items-center gap-1 font-sans">
                        🌱 Personal Development (Fu Wei)
                      </span>
                      <p className="text-sm font-bold text-slate-850 font-mono">{vaastuResult.directions.personalDev.direction}</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans">{vaastuResult.directions.personalDev.dynamicInfluence}</p>
                    </div>

                  </div>
                </div>

                {/* Spatial placements */}
                <div className="p-4 bg-indigo-50/10 border border-indigo-100 rounded-2xl space-y-3 text-left">
                  <span className="font-bold font-mono text-[10px] uppercase text-indigo-800 flex items-center gap-1.5 font-sans">
                    🛏️ Bed Head & Office Desk Facing Guidelines
                  </span>
                  <div className="font-semibold text-slate-700 space-y-1 text-[11px] leading-relaxed">
                    • **Bedroom & Bed orientation:** Headboard position must project towards the face direction **{vaastuResult.directions.health.direction}** to promote deeper sleep. <br />
                    • **Office Desk Facing:** Always sit facing **{vaastuResult.directions.success.direction}** to activate rapid sales and prevent communication blockages.
                  </div>
                </div>

                {/* Colour Correction Suite */}
                <div className="p-5 border rounded-2xl space-y-4">
                  <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">House, Bedding, and Vehicle Paint Correction</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                    <div className="p-3 bg-emerald-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-emerald-800 uppercase font-bold">🎨 Primary Lucky Colours</span>
                      <p className="text-slate-600 font-semibold">{vaastuResult.colourCorrection.luckyColours.join(', ')}</p>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-amber-800 uppercase font-bold">🎨 Stabilizing Balance Colours</span>
                      <p className="text-slate-600 font-semibold">{vaastuResult.colourCorrection.balanceColours.join(', ')}</p>
                    </div>

                    <div className="p-3 bg-red-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-red-800 uppercase font-bold">🚫 Hostile / Anti Colours to Avoid</span>
                      <p className="text-red-800 font-semibold">{vaastuResult.colourCorrection.antiColours.join(', ')}</p>
                    </div>
                  </div>
                </div>

                {/* Vastu Zone Remedies */}
                <div className="p-5 border rounded-2xl space-y-4">
                  <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Actionable Directional Altar Enhancements</h4>
                  <div className="space-y-3 text-[11px] leading-relaxed">
                    <div className="border-b pb-2">
                      <span className="font-bold text-slate-800 uppercase font-mono block text-[10px] text-cyan-800">💼 Business & Career Zone (उत्तर - Career direction):</span>
                      <p className="text-slate-600 mt-0.5">{vaastuResult.zonesReport.careerZone.enhancement}</p>
                    </div>
                    <div className="border-b pb-2">
                      <span className="font-bold text-slate-800 uppercase font-mono block text-[10px] text-emerald-800">💰 Financial Cash Flow Zone (दक्षिण-पूर्व - Money direction):</span>
                      <p className="text-slate-600 mt-0.5">{vaastuResult.zonesReport.moneyZone.enhancement}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 uppercase font-mono block text-[10px] text-pink-800">💖 Relationship Zone (दक्षिण-पश्चिम - Relationships direction):</span>
                      <p className="text-slate-600 mt-0.5">{vaastuResult.zonesReport.relationshipZone.enhancement}</p>
                    </div>
                  </div>
                </div>

                {/* Lo Shu grid + Vastu remedies */}
                <div className="p-5 border rounded-2xl bg-amber-50/5 space-y-4">
                  <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Vedic Missing Nodes Remedies (Lo Shu Grid Integration)</h4>
                  <p className="text-slate-500 text-[10px] leading-relaxed pb-1 italic font-sans animate-pulse">Based on missing numbers from your date of birth, apply these specific spatial corrections inside your living rooms:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] leading-relaxed font-sans">
                    {vaastuResult.remedyPlan.remedyCards.map((re, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border rounded-xl space-y-1">
                        <span className="font-bold font-mono text-[10px] text-[#D97706] uppercase block">Node {re.number} Missing - {re.zoneName}</span>
                        <p className="text-slate-600 font-medium text-xs leading-relaxed"><strong>Correction:</strong> {re.directionRemedy} {re.placementRemedy}</p>
                        <p className="text-slate-500 text-[10px] leading-relaxed"><strong>Action Item:</strong> {re.actionItem}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bad directions warning */}
                <div className="p-4 bg-red-50/20 border border-rose-100 rounded-2xl space-y-2 text-left">
                  <span className="font-bold text-slate-755 font-mono text-[10px] uppercase text-rose-800 flex items-center gap-1.5 font-sans">
                    🚫 Avoid Facing / Bad Directions Hazard Alert
                  </span>
                  <div className="text-xs text-slate-600 space-y-1 text-[11px] leading-relaxed font-sans font-medium">
                    Never face these directions during important corporate meetings or property closings: <br />
                    <span className="font-bold text-rose-800 font-mono text-center block pt-1.5">{vaastuResult.directions.avoidList.join(', ')}</span>
                  </div>
                </div>

                {/* Expandable Why */}
                <div className="border-t pt-2 text-left">
                  <button
                    type="button"
                    onClick={() => setShowVaastuWhy(!showVaastuWhy)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" /> Explain Kua directions maths
                  </button>
                  {showVaastuWhy && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-500 space-y-1 font-sans">
                      <p><strong>Kua Calculation Rules:</strong> Kua represents your celestial frequency matching local magnetic directions: <br />
                      • For Males: Sum the final two digits of the birth year, reduce to a single digit, and subtract from 11. <br />
                      • For Females: Sum the final two digits of the birth year, reduce to a single digit, and add 4.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* DASHA MODULE */}
        {activeModule === 'DASHA' && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="border-b border-[#F2E8DC] pb-4">
              <h3 className="font-playfair text-xl font-bold text-[#1E3A8A]">Annual Dasha & Shifting Forecast Engine</h3>
              <p className="text-xs text-slate-500 font-sans">Break down your lifespans into exact 9-year major planetary epochs (Mahadashas), discover your current yearly sub-period (Antardasha), and see predictions for 2026-2030.</p>
            </div>

            <form onSubmit={handleDashaSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Seeker Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dashaDob}
                    onChange={(e) => setDashaDob(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Target Transit Year</label>
                  <select
                    value={dashaYear}
                    onChange={(e) => setDashaYear(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-[#E5E7EB] py-3 px-4 rounded-xl text-sm font-sans focus:outline-none cursor-pointer"
                  >
                    {[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>Transit Year {y}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-all"
              >
                Calculate My Planetary Dashas & Forecast
              </button>
            </form>

            {dashaResult && (
              <div className="p-6 md:p-8 bg-white border rounded-3xl space-y-6 animate-in fade-in duration-500 leading-relaxed font-sans text-xs text-left">
                
                {/* Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current Mahadasha */}
                  <div className="p-4 bg-[#D97706]/5 border border-[#D97706]/15 rounded-2xl text-left space-y-1">
                    <span className="text-[10px] text-[#D97706] tracking-wider uppercase font-mono font-bold block">Active running Mahadasha</span>
                    <h5 className="font-playfair font-bold text-slate-850 text-sm">{dashaResult.currentMahadasha.planetName}</h5>
                    <p className="text-[10px] text-slate-500 font-medium pt-0.5">Focus Years: {dashaResult.currentMahadasha.startYear} - {dashaResult.currentMahadasha.endYear} (Age {dashaResult.currentMahadasha.startAge}-{dashaResult.currentMahadasha.endAge})</p>
                  </div>

                  {/* Current Antardasha */}
                  <div className="p-4 bg-blue-50/25 border border-blue-100 rounded-2xl text-left space-y-1">
                    <span className="text-[10px] text-blue-750 tracking-wider uppercase font-mono font-bold block">Active annual Antardasha sub-period</span>
                    <h5 className="font-playfair font-bold text-slate-850 text-sm">{dashaResult.currentAntardasha.subPlanetName}</h5>
                    <p className="text-[10px] text-slate-500 font-medium pt-0.5">Running in year: {dashaResult.currentAntardasha.calendarYear} (Influence age: {dashaResult.currentAntardasha.ageOfInfluence})</p>
                  </div>
                </div>

                {/* Antardasha forecast text */}
                <div className="p-4 bg-blue-50/10 border rounded-2xl">
                  <span className="text-[10px] text-blue-800 tracking-wider uppercase font-mono font-bold block mb-1">Sub period influence advice</span>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">{dashaResult.currentAntardasha.forecast}</p>
                </div>

                {/* Category impacts of current dasha */}
                <div className="space-y-4">
                  <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Dasha Shifting Life-Category Impacts</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="p-3 bg-slate-55 rounded-xl border">
                      <span className="font-bold text-[#D97706] font-mono text-[9px] uppercase">💼 Career & Business Impact</span>
                      <p className="text-[11px] text-slate-600 mt-1">{dashaResult.currentMahadasha.careerImpact}</p>
                    </div>

                    <div className="p-3 bg-slate-55 rounded-xl border">
                      <span className="font-bold text-[#D97706] font-mono text-[9px] uppercase">💰 Financial Growth & Savings</span>
                      <p className="text-[11px] text-slate-600 mt-1">{dashaResult.currentMahadasha.financialImpact}</p>
                    </div>

                    <div className="p-3 bg-slate-55 rounded-xl border">
                      <span className="font-bold text-[#D97706] font-mono text-[9px] uppercase">🏥 Physical Body Vitality</span>
                      <p className="text-[11px] text-slate-600 mt-1">{dashaResult.currentMahadasha.healthImpact}</p>
                    </div>

                    <div className="p-3 bg-slate-55 rounded-xl border">
                      <span className="font-bold text-[#D97706] font-mono text-[9px] uppercase">💖 Marital & Relationship Harmony</span>
                      <p className="text-[11px] text-slate-600 mt-1">{dashaResult.currentMahadasha.relationshipImpact}</p>
                    </div>

                  </div>
                </div>

                {/* Personal year transit */}
                <div className="p-5 border rounded-2xl bg-amber-50/10 space-y-2">
                  <span className="font-bold text-[#D97706] font-mono text-[10px] uppercase block">📅 Personal Year Transit Forecast (Year {dashaResult.currentYear})</span>
                  <div className="text-xs font-semibold text-slate-800 leading-relaxed font-sans bg-white p-4.5 border rounded-2xl shadow-inner">
                    {dashaResult.personalYearForecast}
                  </div>
                </div>

                {/* Timeline visual section */}
                <div className="p-5 border rounded-2xl space-y-4">
                  <h4 className="font-playfair text-sm uppercase text-[#D97706] tracking-wider font-bold">Your Lifetime Dasha Master Roadmap</h4>
                  <div className="space-y-2 text-[11px]">
                    {dashaResult.mahadashasList.map((ds, idx) => {
                      const isCurrent = ds.planet === dashaResult.currentMahadasha.planet && ds.startYear === dashaResult.currentMahadasha.startYear;
                      return (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isCurrent ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md font-bold' : 'bg-slate-50/55 hover:bg-slate-50/90 text-slate-700'}`}>
                          <span>Age {ds.startAge} - {ds.endAge} ({ds.startYear} - {ds.endYear})</span>
                          <span className="uppercase text-[10px] tracking-wider font-mono shrink-0">{ds.planetName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expandable Why */}
                <div className="border-t pt-2 text-left">
                  <button
                    type="button"
                    onClick={() => setShowDashaWhy(!showDashaWhy)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" /> Explain dasha math logic
                  </button>
                  {showDashaWhy && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-500 space-y-1 font-sans">
                      <p><strong>Vedic Timeline Cycles:</strong> Traditional Indian numerology structures human trajectories in repeating 9-year intervals. The first era is ruled by your birth core Driver planet. The second period triggers your Conductor (Bhagyank) planet frequency. Shifting transits keep the individual within the magnetic rays of Saturn (delay/tests), Sun (fame/vertical progress), or Venus (splendor/luxury).</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
