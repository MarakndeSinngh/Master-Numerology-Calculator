import { VisualMetrics } from './signatureImageAnalysis';
import { ScoreBreakdown } from './signatureScoring';
import { getTranslatedKey } from './signatureInterpretationKeys';

export interface SignatureDossier {
  personalDetails: {
    name: string;
    dob: string;
    gender: string;
    intent: string;
    hand: string;
  };
  metrics: {
    slantLabel: string;
    underlineLabel: string;
    finalDotLabel: string;
    readabilityLabel: string;
    pressureLabel: string;
    startingLabel: string;
    loopsLabel: string;
    spacing: string;
  };
  numerology: {
    chaldeanValue: number;
    driver: number;
    conductor: number;
    compatibleStyle: string;
    luckyAngle: string;
    colors: { color: string; reason: string }[];
  };
  executiveSummary: {
    overallVibeKey: string;
    score: number;
    mainPositiveKey: string;
    mainPositiveDescKey: string;
    criticalCorrectionKey: string;
    criticalCorrectionDescKey: string;
    summaryText: string;
  };
  intentBreakdowns: {
    labelKey: string;
    score: number;
    description: string;
  }[];
  corrections: {
    keep: string[];
    remove: string[];
    improve: string[];
  };
  formula: {
    blueprint: string;
    penType: string;
    direction: string;
  };
}

export function generateLocalSignatureReport(
  name: string,
  dob: string,
  gender: string,
  intent: string,
  hand: string,
  metrics: VisualMetrics,
  scoreBreakdown: ScoreBreakdown,
  chaldeanValue: number,
  driver: number,
  conductor: number,
  language: string
): SignatureDossier {
  const isHi = language === 'hi';

  // Ink color recommendations based on astrological rulers
  const recommendedColors = [
    {
      color: isHi ? "रॉयल ब्लू स्याही (Royal Blue Ink)" : "Royal Blue Ink",
      reason: isHi 
        ? "यह बृहस्पति और बुध की सकारात्मक ऊर्जाओं को संरेखित करता है, जिससे आपके आधिकारिक भाषण और निर्णय लेने में स्पष्टता आती है।" 
        : "Invokes powerful Jovian/Mercury vibrations, enhancing communication authority and command."
    },
    {
      color: isHi ? "गहरी काली स्याही (Deep Black Ink)" : "Deep Black Ink",
      reason: isHi 
        ? "शनि की स्थिरता और अनुशासन प्रदान करता है, जो लंबे समय तक टिकने वाली संपत्ति और कानूनी समझौतों की सुरक्षा करता है।" 
        : "Provides solid Saturnian grounding, protecting corporate assets and shielding from cash drains."
    },
    {
      color: isHi ? "पन्ना हरी स्याही (Emerald Green Ink)" : "Emerald Green Ink",
      reason: isHi 
        ? "वित्तीय विकास और वाणिज्यिक बुद्धि को प्रेरित करता है। यह व्यापारियों और पेशेवरों के लिए अत्यंत शुभ है।" 
        : "Stimulates financial growth, unlocks trade prospects, and increases commercial intelligence."
    }
  ];

  // Visual label maps
  const slantLabels = {
    UPWARD: "signature.metrics.slant.upward",
    STRAIGHT: "signature.metrics.slant.straight",
    DOWNWARD: "signature.metrics.slant.downward"
  };
  const underlineLabels = {
    NONE: "signature.metrics.underline.none",
    PRESENT: "signature.metrics.underline.present",
    CUTTING: "signature.metrics.underline.cutting"
  };
  const finalDotLabels = {
    NONE: "signature.metrics.finalDot.none",
    PRESENT: "signature.metrics.finalDot.present"
  };
  const readabilityLabels = {
    CLEAR: "signature.metrics.readability.clear",
    MODERATE: "signature.metrics.readability.moderate",
    UNCLEAR: "signature.metrics.readability.unclear"
  };
  const pressureLabels = {
    LIGHT: "signature.metrics.pressure.light",
    MEDIUM: "signature.metrics.pressure.medium",
    HEAVY: "signature.metrics.pressure.heavy"
  };

  // Build Executive Summary Paragraph
  let summaryText = "";
  if (isHi) {
    summaryText = `यह हस्ताक्षर ऑडिट ${name} के जन्म विवरण के साथ संरेखित है। आपके मूलांक ${driver} और भाग्यांक ${conductor} का विश्लेषण करके, हमने पाया कि आपके वर्तमान हस्ताक्षर का झुकाव ${getTranslatedKey(language, slantLabels[metrics.slant])} और इसकी पठनीयता ${getTranslatedKey(language, readabilityLabels[metrics.readability])} है। इस संरचनात्मक बनावट के कारण आपके जीवन में करियर, धन और व्यावसायिक स्थिरता पर महत्वपूर्ण प्रभाव पड़ता है। ${metrics.slant === 'DOWNWARD' ? 'नीचे की ओर झुकाव ऊर्जा को नष्ट कर रहा है, जिसे तुरंत ठीक करना अनिवार्य है।' : 'ऊपर उठता हुआ झुकाव सकारात्मक प्रगति दे रहा है।'}`;
  } else {
    summaryText = `This custom signature audit is aligned with the cosmic birth coordinates of ${name}. By analyzing Driver #${driver} and Conductor #${conductor}, we find that your current handwriting baseline is ${getTranslatedKey(language, slantLabels[metrics.slant])} and readability is ${getTranslatedKey(language, readabilityLabels[metrics.readability])}. Graphologically, this structural arrangement creates direct acoustic frequencies on your career, monetary retention, and social standing. ${metrics.slant === 'DOWNWARD' ? 'The downward slope acts as an energy drain, which must be immediately realigned to protect your wealth.' : 'The upward slope ensures an optimistic flow of energy and public recognition.'}`;
  }

  // Construct keepers, erasers, polishers
  const keep: string[] = [];
  const remove: string[] = [];
  const improve: string[] = [];

  if (metrics.slant === 'UPWARD') {
    keep.push(isHi ? 'बाएं से दाएं 15 डिग्री का ऊपर की ओर उठने वाला झुकाव।' : 'The 15-degree upward baseline slope climbing from left to right.');
  } else if (metrics.slant === 'DOWNWARD') {
    remove.push(isHi ? 'नीचे की ओर गिरता हुआ झुकाव (यह ऊर्जा को कम करता है)।' : 'The downward sloping tail segment (which siphons professional energy).');
    improve.push(isHi ? 'हस्ताक्षर के कोण को 15 डिग्री ऊपर की ओर उठाएं।' : 'Force the signature axis upward to an angle of 15 degrees.');
  } else {
    keep.push(isHi ? 'समतल और स्थिर आधार रेखा।' : 'The stable flat horizontal baseline.');
    improve.push(isHi ? 'करियर में तीव्र प्रगति के लिए मामूली 10-15 डिग्री ऊपर की ओर झुकाव लाएं।' : 'Introduce a slight 10-15 degree ascending angle to accelerate promotions.');
  }

  if (metrics.underline === 'PRESENT') {
    keep.push(isHi ? 'नाम के नीचे साफ और सहायक स्वतंत्र रेखा।' : 'The clean, independent horizontal underline.');
  } else if (metrics.underline === 'CUTTING') {
    remove.push(isHi ? 'नाम के निचले हिस्से को काटती हुई अंडरलाइन।' : 'The cutting underline intersecting lower letter loops (which attracts legal obstacles).');
    improve.push(isHi ? 'अंडरलाइन को अक्षरों को काटे बिना थोड़ा नीचे खींचें।' : 'Position the underline support line lower, running cleanly beneath the name without cutting any letters.');
  } else {
    improve.push(isHi ? 'स्थिरता और ग्रहों के समर्थन के लिए नाम के नीचे एक साफ अंडरलाइन जोड़ें।' : 'Draw a clean solid single underline from the second letter to the end to act as a supportive foundation.');
  }

  if (metrics.finalDot === 'PRESENT') {
    remove.push(isHi ? 'हस्ताक्षर के अंत में मौजूद एकल या भारी बिंदु।' : 'The isolated trailing full-stop dot (which acts as a terminal barrier).');
  } else {
    keep.push(isHi ? 'खुला और ऊपर की ओर समाप्त होने वाला स्ट्रोक।' : 'The open ending without trailing stops, allowing positive opportunities.');
  }

  if (metrics.starting === 'CLEAN') {
    keep.push(isHi ? 'बड़ा, साफ और बोल्ड पहला अक्षर।' : 'The large, clean and open first capital initial of your name.');
  } else {
    remove.push(isHi ? 'पहले अक्षर के चारों ओर बने उलझे हुए घेरे और लूप।' : 'The cluttered starting circles wrapping around the initial.');
    improve.push(isHi ? 'पहले अक्षर को बाकी अक्षरों से लगभग 2.5 गुना बड़ा और साफ बनाएं।' : 'Enlarge the first letter to be exactly 2.5 times the size of lowercase letters, and keep it neat.');
  }

  // Fallbacks if any array is empty
  if (keep.length === 0) keep.push(isHi ? 'कोई भी सकारात्मक भाग नहीं मिला।' : 'No major positive trait found. Realignment recommended.');
  if (remove.length === 0) remove.push(isHi ? 'कोई अवांछित बिंदु नहीं है।' : 'No negative blockages or dots detected.');
  if (improve.length === 0) improve.push(isHi ? 'मौजूदा रूप को सामान्य रूप से साफ रखें।' : 'Maintain overall baseline cleanliness.');

  // Build corrected formula
  const blueprint = isHi
    ? `अपने पहले नाम का पहला अक्षर बड़ा और स्पष्ट लिखें, बाकी अक्षरों को मध्यम आकार में एक दूसरे से जोड़ते हुए बाएं से दाएं 15 डिग्री के कोण पर ऊपर की ओर ले जाएं। नीचे एक सीधी, बिना कटी हुई सहायक अंडरलाइन खींचें, जिसके नीचे कोई बिंदु न हो।`
    : `Write your first name with a prominent initial capital (2.5x larger than lowercases), sloping upward at exactly 15 degrees. Draw a single, solid supporting underline underneath starting from the second letter to the last, with no ending dots.`;

  const penType = metrics.pressure === 'HEAVY'
    ? (isHi ? 'मीडियम रोलरबॉल या जेल पेन जो हाथ के तनाव को कम करे और स्याही का सुचारू प्रवाह सुनिश्चित करे।' : 'Medium Rollerball or Gel pen to reduce hand strain and ensure fluid, stress-free ink distribution.')
    : (isHi ? 'क्लासिक फाउंटेन पेन या महीन जेल पेन जो अक्षरों के कोनों को स्पष्टता प्रदान करे।' : 'Classic Fountain pen or fine gel pen to enrich character strokes and project executive presence.');

  const direction = isHi
    ? 'बाएं से दाएं ऊपर की ओर उठता हुआ कोण (15 डिग्री)'
    : 'Ascending left-to-right at a 15-degree positive angle';

  // Build Intent-Based Score card
  const intentScores = [
    {
      labelKey: "signature.scores.career",
      score: scoreBreakdown.careerGrowthScore,
      description: isHi
        ? (metrics.slant === 'UPWARD' ? "करियर में मजबूत वृद्धि के संकेत। यह आपके व्यावसायिक जीवन में पदोन्नति और अधिकार को आकर्षित करता है।" : "करियर में उतार-चढ़ाव या प्रगति की धीमी गति। झुकाव सुधारने से वृद्धि तेज होगी।")
        : (metrics.slant === 'UPWARD' ? "Strong positive career growth signals. Attracts promotions and managerial responsibilities." : "Career momentum is slightly bottlenecked. Realigning baseline angle is advised.")
    },
    {
      labelKey: "signature.scores.prosperity",
      score: scoreBreakdown.vastuAlignmentScore,
      description: isHi
        ? (metrics.underline === 'PRESENT' ? "व्यवसाय में उत्कृष्ट स्थिरता। सहायक अंडरलाइन मजबूत आर्थिक आधार और नए सौदों की ओर इशारा करती है।" : "व्यापारिक प्रयासों में अनिश्चितता। एक सहायक अंडरलाइन जोड़ने से वित्तीय निर्णय मजबूत होंगे।")
        : (metrics.underline === 'PRESENT' ? "Excellent commercial stability. The underline support provides firm business roots." : "Fluctuations in trading or startup stability. Adding an underline is highly recommended.")
    },
    {
      labelKey: "signature.scores.finance",
      score: scoreBreakdown.financialStabilityScore,
      description: isHi
        ? (metrics.finalDot === 'NONE' ? "वित्तीय प्रवाह अबाधित है। कोई बिंदु न होने से धन संचय में कोई रुकावट नहीं आती।" : "अंतिम बिंदु वित्तीय अवरोध पैदा कर रहा है। अचानक पैसे खर्च होने या धन अटकने की समस्या हो सकती है।")
        : (metrics.finalDot === 'NONE' ? "Liquid cash flow is unblocked. Absence of dot prevents sudden asset freezes." : "The final dot triggers sudden monetary leakages or blocks payments. Erasing it is crucial.")
    },
    {
      labelKey: "signature.scores.authority",
      score: scoreBreakdown.authorityScore,
      description: isHi
        ? (metrics.starting === 'CLEAN' ? "उच्च नेतृत्व क्षमता और अधिकार। पहला साफ अक्षर आपको दूसरों के सामने सम्मान दिलाता है।" : "प्रशासनिक कार्यों या दूसरों पर प्रभुत्व स्थापित करने में कठिनाई। पहला अक्षर बड़ा बनाएं।")
        : (metrics.starting === 'CLEAN' ? "Superb executive authority. The clean capital initial projects strong command." : "Struggles with authority projection. Enlarge the initial to claim your professional space.")
    }
  ];

  const primaryPositive = scoreBreakdown.positives[0] || {
    titleKey: 'signature.obs.slant.straight.title',
    descKey: 'signature.obs.slant.straight.desc'
  };

  const primaryCorrection = scoreBreakdown.negatives[0] || {
    titleKey: 'signature.obs.underline.none.title',
    descKey: 'signature.obs.underline.none.desc'
  };

  return {
    personalDetails: {
      name,
      dob,
      gender,
      intent,
      hand
    },
    metrics: {
      slantLabel: slantLabels[metrics.slant],
      underlineLabel: underlineLabels[metrics.underline],
      finalDotLabel: finalDotLabels[metrics.finalDot],
      readabilityLabel: readabilityLabels[metrics.readability],
      pressureLabel: pressureLabels[metrics.pressure],
      startingLabel: metrics.starting === 'CLEAN' ? "signature.metrics.starting.clean" : "signature.metrics.starting.complex",
      loopsLabel: metrics.loops === 'BALANCED' ? "signature.metrics.loops.balanced" : (metrics.loops === 'TALL' ? "signature.metrics.loops.tall" : "signature.metrics.loops.excessive"),
      spacing: metrics.spacing
    },
    numerology: {
      chaldeanValue,
      driver,
      conductor,
      compatibleStyle: isHi ? '15-डिग्री ऊपर की ओर उठने वाली शैली' : '15-Degree Ascending Script with Foundation Underline',
      luckyAngle: '15° - 20° Upward Ascent',
      colors: recommendedColors
    },
    executiveSummary: {
      overallVibeKey: scoreBreakdown.vibeText,
      score: scoreBreakdown.score,
      mainPositiveKey: primaryPositive.titleKey,
      mainPositiveDescKey: primaryPositive.descKey,
      criticalCorrectionKey: primaryCorrection.titleKey,
      criticalCorrectionDescKey: primaryCorrection.descKey,
      summaryText
    },
    intentBreakdowns: intentScores,
    corrections: {
      keep,
      remove,
      improve
    },
    formula: {
      blueprint,
      penType,
      direction
    }
  };
}
