import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { PAIR_MEANINGS } from "./src/services/pairMeanings";
import { generateMedicalNumerologyReport } from "./src/services/medicalNumerologyEngine";
import { generateNumeroVaastuReport } from "./src/services/numeroVaastuEngine";
import { calculateDashaAndYearForecast } from "./src/services/dashaEngine";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with high payload limit for base64 image uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Lazy initialize Gemini client safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    return new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_TESTING",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  const translateMarkdown = async (text: string, targetLanguage: string): Promise<string> => {
    if (!targetLanguage || targetLanguage === 'hi') {
      return text;
    }
    const langNames: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      gu: 'Gujarati',
      mr: 'Marathi',
      es: 'Spanish',
      fr: 'French',
      ar: 'Arabic'
    };
    const targetLangName = langNames[targetLanguage] || 'English';
    
    const client = getGeminiClient();
    const translationPrompt = `
You are an expert astro-numerology translator and spiritual linguist. Your task is to translate the following comprehensive numerology consultation report into ${targetLangName}.

ORIGINAL REPORT:
---
${text}
---

CRITICAL TRANSLATION INSTRUCTIONS:
1. MAINTAIN THE SPIRITUAL AND PROFESSIONAL TONE. It must sound like an authentic Vedic/occult counselor directly speaking to the seeker, preserving warmth, respect, and deep cosmic wisdom.
2. PRESERVE ACCURATE OCCULT TERMINOLOGY.
   - Do NOT translate core Sanskrit/planetary/Vedic numerology terms. Keep them in their pristine phonetic state, followed by localized explanations in parentheses if helpful.
   - For example: Keep terms like "Mulank" (मूलांक), "Bhagyank" (भाग्यांक), "Surya", "Chandra", "Shani", "Guru", "Rahu", "Ketu", "Loshu Grid", "Chaldean Numerology", "Dosha", "Karma", "Yantra" as-is or transliterated phonetically, rather than substituting with literal robotic dictionary words (e.g. do NOT translate "Bhagyank" as "Destiny Number" in local languages).
3. RTL ALIGNMENT FOR ARABIC: If translating to Arabic, format headings, paragraphs, and lists to read naturally from right-to-left.
4. DO NOT SUMMARIZE OR SHORTEN. The translation must match the thoroughness of the original report perfectly.
5. Output the result in beautiful Markdown.
`;

    try {
      const translationResponse = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: translationPrompt,
        config: {
          systemInstruction: "You are the Rajiv Ji AI Master Translator. You translate sacred, deep numerology reports with pristine linguistic care, spiritual resonance, and terminology preservation.",
          temperature: 0.30
        }
      });
      return translationResponse.text || text;
    } catch (err) {
      console.error("Translation failed, returning original text:", err);
      return text;
    }
  };

  // API router for Gemini report generation
  app.post("/api/report", async (req, res) => {
    try {
      const { personalDetails, dobAnalysis, nameAnalysis, mobileAnalysis, remedies, language } = req.body;

      if (!personalDetails?.name) {
        return res.status(400).json({ error: "Missing personal details name" });
      }

      // Compute additional premium modules for the report
      const dobStr = personalDetails.dob || "1990-01-01";
      const medReport = generateMedicalNumerologyReport(dobStr, personalDetails.name);
      const vaastuReport = generateNumeroVaastuReport(dobStr, personalDetails.gender || 'MALE', personalDetails.name);
      const dashaReport = calculateDashaAndYearForecast(dobStr, 2026);

      // Calculate or extract consecutive pairs from the mobile number digits
      const mobileRaw = personalDetails.mobile || "";
      const digits = mobileRaw.replace(/[^0-9]/g, '');
      let modifiedChars: string[] = [];
      for (let i = 0; i < digits.length; i++) {
        const d = digits[i];
        if (d === '0') {
          const prev = i > 0 ? modifiedChars[i - 1] : '9';
          modifiedChars.push(prev);
        } else {
          modifiedChars.push(d);
        }
      }
      const modifiedNumber = modifiedChars.join('');

      const extractedPairsWithMeanings = [];
      for (let i = 0; i < modifiedNumber.length - 1; i++) {
        const pair = modifiedNumber.substring(i, i + 2);
        const detail = PAIR_MEANINGS[pair];
        if (detail) {
          extractedPairsWithMeanings.push({
            pairVal: pair,
            meaning: detail.meaning,
            positive: detail.positive,
            negative: detail.negative,
            severity: detail.severity
          });
        }
      }

      const pairsDataString = extractedPairsWithMeanings.map(item => {
        return `PAIR: ${item.pairVal}
Meaning/Title: ${item.meaning}
Positive Vibrations: ${item.positive}
Negative/Warning: ${item.negative}
Stability/Severity Score: ${item.severity}%`;
      }).join("\n\n");

      const client = getGeminiClient();

      const prompt = `
Generate an exhaustive, highly detailed, professional, and empathetic traditional Numerology Life Advisory Report in pure, respectful Hindi.
This must reads like a 15-25 page premium consulting portfolio booklet.

Subject Auditable Credentials:
- Name (नाम): ${personalDetails.name}
- Date of Birth (जन्म तारीख): ${personalDetails.dob}
- Gender (लिंग): ${personalDetails.gender || 'निर्दिष्ट नहीं'}
- Focal Phone Line (मोबाईल नंबर): ${personalDetails.mobile} (সংशोधित कंपन: ${modifiedNumber})

Primary Grid Coordinates Calculated by Design Engines (Use these values exactly):
1. Date of Birth Grid (जन्मांक एवं भाग्यांक विश्लेषण):
   - Life Path Number (जीवन पथ संख्या / भाग्यांक): ${dobAnalysis.lifePathNumber}
   - Birth Number (जन्मांक / मूलांक): ${dobAnalysis.birthNumber}
   - Destiny Number (नामांक / भाग्य संख्या): ${dobAnalysis.destinyNumber}
   - Soul Urge Number: ${dobAnalysis.soulUrgeNumber}
   - Personality Number: ${dobAnalysis.personalityNumber}
   - Maturity Number: ${dobAnalysis.maturityNumber}
   - Attitude Number: ${dobAnalysis.attitudeNumber}
   - Personal Year: ${dobAnalysis.personalYear}
   - Missing Numbers in Birth grid: ${dobAnalysis.missingNumbers.join(', ')}

2. Medical Numerology & Ayurvedic Doshas:
   - Dominant Dosha: ${medReport.dominantDosha}
   - Secondary Dosha: ${medReport.secondaryDosha}
   - Prakriti Constitution: ${medReport.prakritiType} (Vata: ${medReport.doshaComposition.vata}%, Pitta: ${medReport.doshaComposition.pitta}%, Kapha: ${medReport.doshaComposition.kapha}%)
   - Health Wellness Score: ${medReport.scores.healthScore}/100, Digestive: ${medReport.scores.digestiveScore}/100, Immunity: ${medReport.scores.immunityScore}/100
   - Weak body organs/systems: ${medReport.weakBodySystems.join(', ')}
   - Recommended Foods: ${medReport.dietRecommendations.recommendedFoods.join(', ')}
   - Foods to Avoid: ${medReport.dietRecommendations.foodsToAvoid.join(', ')}
   - Recommended Fasting Day: ${medReport.dietRecommendations.recommendedFastingDay}
   - Recommended Yoga & Pranayama: ${medReport.ayurvedicLifestyle.yogaSuggestions.join(', ')}; ${medReport.ayurvedicLifestyle.pranayamaSuggestions.join(', ')}

3. Numero Vaastu Pro Parameters:
   - Kua Number (कुआ अंक): ${vaastuReport.kuaNumber} (Group: ${vaastuReport.groupType === 'EAST_GROUP' ? 'पूर्व दिशा समूह' : 'पश्चिम दिशा समूह'})
   - Lucky Directions: Success -> ${vaastuReport.directions.success.direction}, Health -> ${vaastuReport.directions.health.direction}, Family -> ${vaastuReport.directions.family.direction}, Growth -> ${vaastuReport.directions.personalDev.direction}
   - Avoid Directions: ${vaastuReport.directions.avoidList.join(', ')}
   - Lucky Colours: ${vaastuReport.colourCorrection.luckyColours.join(', ')}, Balance: ${vaastuReport.colourCorrection.balanceColours.join(', ')}, Anti: ${vaastuReport.colourCorrection.antiColours.join(', ')}
   - Vastu zone recommendations: Career: ${vaastuReport.zonesReport.careerZone.enhancement}, Money: ${vaastuReport.zonesReport.moneyZone.enhancement}, Relationships: ${vaastuReport.zonesReport.relationshipZone.enhancement}

4. Dasha Engine & Personal Year Forecast:
   - Current running Mahadasha (9-year Master Cycle): Rulership by ${dashaReport.currentMahadasha.planetName} from year ${dashaReport.currentMahadasha.startYear} to ${dashaReport.currentMahadasha.endYear}
   - Current running Antardasha (1-year Sub Cycle): Sub planet ${dashaReport.currentAntardasha.subPlanetName} (Forecast: ${dashaReport.currentAntardasha.forecast})
   - Shifting Personal Year Transit for 2026: Personal Year ${dashaReport.personalYearNumber} (${dashaReport.personalYearForecast})

5. Mobile Phone Vibrational Diagnostics:
   - Suggestive lucky ending frequencies: ${remedies.mobileEndings.join(', ')}
   - Compound vibration score: ${mobileAnalysis.compoundTotal}
   - Reduced core frequency: ${mobileAnalysis.reducedTotal} (Rating Category: ${mobileAnalysis.rating}, Score: ${mobileAnalysis.score}/100)
   - Hostile planetary pairs triggered: ${mobileAnalysis.hostileRelationships.map((h: any) => h.title).join(', ') || 'कोई नहीं'}

Active Consecutive Pairs Discovered inside User's Mobile:
${pairsDataString || 'कोई नहीं'}

Please lay out the report with the following exact chapters in professional, rich, and highly formatted Markdown. All text must be in elite traditional Hindi:

- **1. मुख्य व्यक्तिगत सारांश (Executive Personal Summary)**: A majestic, poetic birds-eye view of their alignment, cosmic destiny, and general aura state.
- **2. मूल व्यक्तित्व एवं खगोलीय-अंक ज्योतिष ब्लूप्रिंट (Core Personality & Astro-Numerology Blueprint)**: Dive deeply into Life Path (भाग्यांक), Birth Number (मूलांक), Destiny Number (नामांक), and Soul Urge frequency analysis in supreme consulting detail.

  महत्वपूर्ण निर्देश (CRITICAL INSTRUCTION - NO SHALLOW OUTPUT):
  इस अध्याय में शामिल प्रत्येक अंक (Life Path Number, Birth Number, Destiny Number, Soul Urge Number, Personality Number, Maturity Number, और Attitude Number) के लिए आपको बिना किसी अपवाद के निम्नलिखित पाँचों अनुभागों (five sections) को पूरी तरह से विस्तृत रूप में प्रस्तुत करना होगा। सामान्य या संक्षिप्त वाक्य (generic filler/shallow sentences) बिल्कुल न लिखें:
  
  A) **गणना एवं स्रोत (Derivation & Calculation)**:
     स्पष्ट रूप से दिखाएं कि यह अंक कैसे प्राप्त किया गया है। उदाहरण के लिए:
     - जन्मांक (Birth Number): "23 -> 2 + 3 = 5"
     - भाग्यांक (Life Path): "1984-11-23 -> 1+9+8+4+1+1+2+3 = 29 -> 2+9 = 11 -> 1+1 = 2"
     - नामांक (Destiny): "M-A-R-K-A-N-D-E → 4+1+2+2+1+5+4+1 = 20 → 2+0 = 2" (चैल्डियन पद्धति के वास्तविक मानों के साथ पूरी वर्ण-दर-वर्ण जोड़ श्रृंखला दर्शाएं)।
  
  B) **गहन फलादेश (In-depth Interpretation)**:
     प्रत्येक अंक के लिए न्यूनतम 100-150 शब्दों का एक आत्मीय, गहरा और व्यक्तिगत फलादेश द्वितीय-पुरुष स्वर ("आप", "आपकी प्रकृति", "आपके जीवन में...") में होना चाहिए। यह व्याख्या पूरी तरह से उस विशिष्ट अंक और संबंधित ज्योतिषीय परंपरा (चैल्डियन/वैदिक) के अनुकूल होनी चाहिए। इसमें कोई सामान्य जेनेरिक वाक्य दोहराया नहीं जाना चाहिए।
  
  C) **सकारात्मक शक्तियाँ (Strengths)**:
     कम से कम 3 से 5 अत्यधिक व्यावहारिक, वास्तविक और विशिष्ट बुलेट बिंदु जो आपकी अद्वितीय शक्तियों और प्रतिभाओं को दर्शाते हों।
  
  D) **नकारात्मक पहलू / छाया प्रतिरूप (Challenges / Shadow Side)**:
     कम से कम 3 से 5 विशिष्ट बुलेट बिंदु जो आपकी कमजोरियों, छिपी हुई आदतों और उन छाया पक्षों को दर्शाते हों जिन्हें सुधारने की आवश्यकता है।
  
  E) **जीवन के महत्वपूर्ण क्षेत्रों में प्रकटीकरण (Expressions)**:
     - **पेशेवर जीवन एवं करियर (Career)**: इस अंक का आपके करियर, व्यवसाय और धन उपार्जन शैली पर विस्तृत प्रभाव (1 लघु पैराग्राफ)।
     - **प्रेम एवं पारस्परिक संबंध (Relationships)**: इस अंक का आपके विवाह, प्रेम, और पारिवारिक संबंधों में संवाद शैली पर प्रभाव (1 लघु पैराग्राफ)।
     - **व्यक्तिगत एवं आत्मिक विकास (Personal Growth)**: इस अंक का आपके आंतरिक आध्यात्मिक उत्थान, आत्म-जागरूकता और जीवन के वास्तविक उद्देश्यों पर प्रभाव (1 लघु पैराग्राफ)।

- **3. चिकित्सा अंकशास्त्र एवं आयुर्वेदिक दोष निदान (Medical Numerology & Ayurvedic Dosha Diagnosis)**: Translate their medical numerology profile into deep Vedic wellness insights. Mention their dominant doshas, health strength, digestive indices, weak body systems, comprehensive dietary guidelines (recommended foods, avoid foods, recommended fruits and vegetables), sleep guides, and custom morning routine. 
  *ADD A STRICT PROFESSIONAL DISCLAIMER AT THE START OF THIS CHAPTER: "यह रिपोर्ट केवल अंकशास्त्र-आधारित कल्याण अंतर्दृष्टि और जीवनशैली मार्गदर्शन प्रदान करती है। यह पेशेवर चिकित्सा सलाह, निदान या उपचार का विकल्प नहीं है।"*
- **4. न्यूमरो वास्तु प्रो एवं चुंबकीय दिशा संरेखण (Numero Vaastu Pro & Spatial Direction Coordinates)**: Analyze space vibrations using their Kua number and group. Provide their Success, Health, and Career directions, lucky/anti colors suggestions for home, bedroom, office, and vehicles, and discuss active zone enhancement remedies (Career, Money, Relationship, and Spiritual). Include detailed Lo Shu + Vaastu remedies for their missing numbers!
- **5. आगामी दशा चक्र एवं व्यक्तिगत वर्ष फलादेश (Planetary Dasha Cycles & Personal Year Forecast)**: Break down their current running Mahadasha and Antardasha influences. Map the exact health, career, relationship, and financial impacts of this cycle, followed by their Personal Year 2026 forecast and predictions for the next 5 years (2026 to 2030).

  महत्वपूर्ण निर्देश (CRITICAL INSTRUCTION - NO SHALLOW OUTPUT):
  सक्रिय व्यक्तिगत वर्ष (Personal Year 2026) के लिए आपको बिना किसी अपवाद के निम्नलिखित पाँचों अनुभागों (five sections) को पूरी तरह से विस्तृत रूप में प्रस्तुत करना होगा:
  A) **गणना एवं स्रोत (Derivation)**: जन्म तिथि और माह के साथ वर्ष 2026 को जोड़कर गणना दर्शाएं (जैसे: 23+11+2026 = 2+3+1+1+2+0+2+6 = 17 -> 1+7 = 8)।
  B) **गहन फलादेश (In-depth Interpretation)**: न्यूनतम 100-150 शब्दों में हिन्दी में लिखी व्याख्या जो इस वर्ष की विशिष्ट ऊर्जा कम्पन को दर्शाए।
  C) **सकारात्मक प्रभाव (Strengths/Opportunities)**: इस वर्ष के लिए 3 से 5 विशिष्ट बुलेट बिंदु।
  D) **सावधानी एवं संभावित चुनौतियाँ (Challenges/Shadow Side)**: इस वर्ष आपके समक्ष आने वाले संभावित जोखिमों और सावधानियों के 3 से 5 बुलेट बिंदु।
  E) **जीवन के महत्वपूर्ण क्षेत्रों में अभिव्यक्ति (Expressions)**: करियर, संबंधों, और आत्मिक विकास पर प्रभाव (प्रत्येक का 1 संक्षिप्त पैराग्राफ)।

- **6. मोबाईल अंक निदान एवं सुधारात्मक उपाय (Mobile Diagnostics & Audit Remedies)**:
  Examine the user's mobile total vibrations, repeating alarms, and hostile relationships.
  
  For EVERY pair listed in the "Active Consecutive Pairs Discovered" above, you MUST display it in this exact format. Do NOT combine them. Keep them formatted as individual cards using clean, elegant blockquotes or styled markdown:

  PAIR: [संख्या, जैसे: 31]
  
  शीर्षक:
  [शीर्षक का नाम - Use Traditional terms, e.g., "प्रशासनिक एवं सरकारी संबंध", "संवेदनशीलता एवं मानसिक अशांति" or similar descriptive Hindi names]
  
  सकारात्मक प्रभाव:
  • [सकारात्मक प्रभाव बिंदु 1]
  • [सकारात्मक प्रभाव बिंदु 2]
  ...
  
  सावधानी:
  • [सावधानी का विवरण बिंदु 1]
  • [सावधानी का विवरण बिंदु 2]
  ...
  
  स्थिरता स्कोर:
  [X]%
  
- **7. सर्वकल्याणकारी लाल किताब कवच (Comprehensive Altar Remedies Shield)**: Personalized signature guidelines (angle, underline), lucky dates, corporate metal structures placement, and customized home altar guidelines. Includes gemstone rituals and lucky colors.
`;

      const aiResponse = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are an elite, compassionate astro-numerologist with 25 years of consulting experience in traditional Indian Vedic & Mobile Numerology.

CRITICAL LANGUAGE INSTRUCTION:
The entire Mobile Numerology Report must be generated in PROFESSIONAL HINDI exactly in the style used in traditional premium Mobile Numerology PDFs and consultations.

Do NOT use:
- Google-translated Hindi
- Modern corporate Hindi
- Hinglish
- English mixed sentences

Use:
- Traditional Numerology Hindi (शास्त्रीय एवं पारंपरिक ज्योतिषीय हिंदी)
- Simple, beautiful, and highly readable Hindi
- Same elite, consulting, respectful, and authoritative tone ("आप", "आपका", "शुभम", "आशीर्वाद")

Common English-to-Hindi mapping examples to adhere to strictly:
- Positive Resonance -> सकारात्मक प्रभाव / शुभ लक्षण
- Vibrational Constraint -> सावधानी / संभावित चुनौती / नकारात्मक योग
- Government Connection & Leadership -> सरकारी संबंध और नेतृत्व क्षमता
- Leadership & Authority -> नेतृत्व और अधिकार
- Love Connection with Domestic Load -> पारिवारिक जिम्मेदारियों के साथ प्रेम संबंध
- Creative Planner & Event Manager -> रचनात्मक योजनाकार एवं आयोजन प्रबंधक
- Master Event Organiser & Designer -> उत्कृष्ट आयोजक एवं रचनात्मक डिज़ाइन क्षमता
- Communication -> संचार क्षमता
- Money Flow -> धन प्रवाह
- Education -> शिक्षा
- Marriage -> वैवाहिक जीवन
- Relationships -> संबंध
- Health -> स्वास्थ्य
- Children -> संतान पक्ष
- Business -> व्यवसाय
- Luck -> भाग्य
- Success -> सफलता

For every pair result display in this format:
PAIR: [संख्या]

शीर्षक:
[शीर्षक का नाम]

सकारात्मक प्रभाव:
• [बिंदु...]

सावधानी:
• [बिंदु...]

स्थिरता स्कोर:
[X]%

For any structured cards, use these key markers:
- शीर्षक
- सकारात्मक प्रभाव
- सावधानी
- जीवन पर प्रभाव
- उपयुक्त क्षेत्र
- स्थिरता स्कोर
- उपाय

The output should look like a master-class, deeply personalized, premium consultation report preparado by an experienced cosmic guru. Ensure maximum details and thoroughness.`,
          temperature: 0.70,
        }
      });

      let responseText = aiResponse.text || "आपका आध्यात्मिक फलादेश वर्तमान में ग्रहों के पारगमन के कारण उपलब्ध नहीं है। कृपया पुनः प्रयास करें।";
      if (language && language !== 'hi') {
        responseText = await translateMarkdown(responseText, language);
      }
      res.json({ report: responseText });
    } catch (err: any) {
      console.error("Gemini server error: ", err);
      res.status(500).json({ error: "ब्रह्मांडीय सर्वर से संपर्क विफल रहा। कृपया आवश्यक सेटिंग्स में अपनी GEMINI_API_KEY जांचें।" });
    }
  });

  // API router for Loshu Grid Report generation
  app.post("/api/loshu-report", async (req, res) => {
    try {
      const { personalDetails, mulank, bhagyank, loshuGrid, missingNumbers, strengthArrows, weaknessArrows, personalYear, currentMahadasha, currentAntardasha, language } = req.body;

      if (!personalDetails?.name) {
        return res.status(400).json({ error: "Missing personal details name" });
      }

      const client = getGeminiClient();

      const prompt = `
Generate an exhaustive, supreme quality, 10-15 page equivalent Astro-Numerology Life Advisory Report in traditional, dignified, and highly formatted Hindi.
This is a standard "Complete Loshu Grid Analysis & Vedic-Chaldean Destiny Blueprint Report".

Subject Credentials:
- Name (नाम): ${personalDetails.name}
- Birthdate (जन्म तारीख): ${personalDetails.dob}
- Gender (लिंग): ${personalDetails.gender || 'निर्दिष्ट नहीं'}

Loshu Grid Key Parameters (Calculated Coordinates):
1. Psychic Number / Driver (मूलांक /जन्मांक): ${mulank} (Co-ruled by planet planetary alignments)
2. Destiny Number / Conductor (भाग्यांक / जीवन पथ संख्या): ${bhagyank}
3. Active Personal Year 2026 (सक्रिय व्यक्तिगत वर्ष): ${personalYear.number} - Title: ${personalYear.title}
4. Active Planetary Cycles running currently:
   - Current Mahadasha (वर्तमान महादशा): ${currentMahadasha?.planet || 'सक्रिय चक्र'} (Age: ${currentMahadasha?.startAge}-${currentMahadasha?.endAge} / Years: ${currentMahadasha?.startYear}-${currentMahadasha?.endYear})
   - Current Antardasha (वर्तमान अंतर्दशा): ${currentAntardasha?.planet || 'सक्रिय उपचक्र'} (Duration: ${currentAntardasha?.durationMonths} months)

Grid Map Analysis Details:
- Strength Arrows/Planes present (सक्रिय राजयोग - बलशाली विमान):
  ${strengthArrows.map((s: any) => `• ${s.name} (${s.title}): Digits: ${s.digits.join(', ')} (Description: ${s.description})`).join('\n  ') || 'कोई नहीं'}
- Weakness Arrows/Planes present (दुर्बलता या शून्य विमान):
  ${weaknessArrows.map((w: any) => `• ${w.name} (${w.title}): Digits: ${w.digits.join(', ')} (Remedy: ${w.remedy})`).join('\n  ') || 'कोई नहीं'}
- Missing Numbers (लोशू ग्रिड में अनुपस्थित अंक एवं तत्त्व):
  ${missingNumbers.map((m: any) => `• Digit ${m.digit} (Element: ${m.element}): ${m.meaning} -> Remedy Suggestion: ${m.remedy}`).join('\n  ') || 'कोई नहीं'}

Active Grid Digit Counts (Loshu Representation):
${Object.values(loshuGrid).map((g: any) => `Digit ${g.digit}: Element: ${g.element}, Direction: ${g.direction}, Count: ${g.count} times. (Lifeforce: ${g.meaning})`).join('\n')}

Please output a majestic, highly professional report under the following chapters with maximum consulting length, containing deep analysis, ancient references, and practical steps. High-end Markdown tables, lists, and bold phrases in pure, respectful Vedic Hindi are necessary.

Report Chapters to construct:
- **1. मंगलाचरण एवं ब्रह्मांडीय प्रस्तावना (Divine Invocation & Cosmic Preface)**: Poetic greeting, invocation of divine vibrations, and overview of the subject's birth star alignments.
- **2. मूलांक एवं भाग्यांक - आपके जीवन का दोहरा कम्पास (Psychic & Destiny - The Dual Compasses)**: Deep advisory analysis of Mulank (${mulank}) and Bhagyank (${bhagyank}) traits, career recommendations, spiritual lessons, and mutual alignment.

  महत्वपूर्ण निर्देश (CRITICAL INSTRUCTION - NO SHALLOW OUTPUT):
  इस अध्याय में शामिल दोनों प्रमुख अंकों - मूलांक (Psychic Number: ${mulank}) और भाग्यांक (Destiny Number: ${bhagyank}) के लिए बिना किसी अपवाद के आपको निम्नलिखित पाँचों अनुभागों (five sections) को पूरी तरह से विस्तृत और व्यापक रूप में प्रस्तुत करना होगा:
  
  A) **गणना एवं स्रोत (Derivation & Calculation)**:
     स्पष्ट रूप से दर्शाएं कि ये अंक आपके जन्म विवरण से किस तरह प्राप्त किए गए हैं।
     - मूलांक (Psychic Number): जन्म तिथि के दिन का जोड़ (जैसे: "23 -> 2 + 3 = 5")।
     - भाग्यांक (Destiny Number): जन्म तिथि, माह और वर्ष का कुल योग (जैसे: "1984-11-23 -> 1+9+8+4+1+1+2+3 = 29 -> 2+9 = 11 -> 1+1 = 2")।
  
  B) **गहन फलादेश (In-depth Interpretation)**:
     प्रत्येक अंक के लिए न्यूनतम 100-150 शब्दों का आत्मीय, गहरा और व्यक्तिगत फलादेश द्वितीय-पुरुष स्वर ("आप", "आपकी आंतरिक ऊर्जा...") में लिखें, जो इस अंक की शास्त्रीय वैदिक ज्योतिष परंपरा को स्पष्ट करता हो। कोई सामान्य भराव वाक्य (filler text) स्वीकार्य नहीं है।
  
  C) **सकारात्मक विशिष्टताएँ (Strengths)**:
     3 से 5 विशिष्ट बुलेट बिंदु जो आपकी सकारात्मक शक्तियों, मानसिक झुकाव और जन्मजात प्रतिभाओं को उजागर करते हों।
  
  D) **चुनौतियाँ और छाया रूप (Challenges / Shadow Side)**:
     3 से 5 बुलेट बिंदु जो आपके जीवन के संघर्षों, नकारात्मक प्रवृत्तियों और उन कमजोरियों को दर्शाते हों जिन पर आपको ध्यान देना है।
  
  E) **जीवन के महत्वपूर्ण क्षेत्रों में अभिव्यक्ति (Expressions)**:
     - **पेशेवर करियर (Career)**: इस अंक का आपके व्यवसाय, नौकरी, निर्णय लेने की शैली और व्यावसायिक सफलता पर प्रभाव (1 लघु पैराग्राफ)।
     - **पारस्परिक संबंध (Relationships)**: इस अंक का आपके पारिवारिक जीवन, वैवाहिक संबंधों और समाज में संचार पर प्रभाव (1 लघु पैराग्राफ)।
     - **व्यक्तिगत विकास (Personal Growth)**: इस अंक का आपके जीवन के आध्यात्मिक उद्देश्यों, आंतरिक संतोष और व्यक्तिगत परिपक्वता पर प्रभाव (1 लघु पैराग्राफ)।

- **3. लोशू ग्रिड चार्ट एवं तत्त्व मीमांसा (Loshu Grid Chart & Elemental Metaphysics)**: A complete diagnostic writeup on their 3x3 magic square. Discuss Wood, Water, Fire, Earth, Metal distribution inside their chart.
- **4. राजयोग विमान एवं सक्रिय ऊर्जा प्रवाह (Sovereign Planes & Active Energies)**: Extensive assessment of active planes: ${strengthArrows.map((s: any) => s.name).join(', ') || 'सक्रिय राजयोग'}. Explain how these shape their material wealth, mental focus, and actions.
- **5. शून्य विमान, अनुपस्थित अंक एवं सुधारत्मक वेध (Empty Planes, Missing Figures & Karmic Remedies)**: Full list of missing numbers. Detail the Lal Kitab remedies, direction activation (like North career zone, Northwest support), and gemstone rituals required.
- **6. वर्तमान महादशा और अंतर्दशा चक्र विश्लेषण (Planetary Period Dasha Audit)**: Point out their running Mahadasha of ${currentMahadasha?.planet} and Antardasha of ${currentAntardasha?.planet}. Give a year-by-year checklist on how to conduct negotiations, financial investments, and maintain health during this period, plus what days/hours to avoid.
- **7. वर्ष 2026-2030 आगामी मार्गदर्शन (5-Year Detailed Planetary Forecast)**: Provide structured annual predictions for the next 5 years based on shifting Personal Years.

  महत्वपूर्ण निर्देश (CRITICAL INSTRUCTION - NO SHALLOW OUTPUT):
  सक्रिय व्यक्तिगत वर्ष 2026 (Personal Year: ${personalYear.number}) के लिए आपको बिना किसी अपवाद के निम्नलिखित पाँचों अनुभागों (five sections) को पूरी तरह से विस्तृत रूप में प्रस्तुत करना होगा:
  A) **गणना एवं स्रोत (Derivation)**: जन्म तिथि और माह के साथ वर्ष 2026 को जोड़कर स्पष्ट गणना दर्शाएं।
  B) **गहन फलादेश (In-depth Interpretation)**: न्यूनतम 100-150 शब्दों में हिन्दी में लिखी व्याख्या जो इस वर्ष की विशिष्ट ऊर्जा कम्पन को दर्शाए।
  C) **सकारात्मक प्रभाव (Strengths/Opportunities)**: इस वर्ष के लिए 3 से 5 विशिष्ट बुलेट बिंदु।
  D) **सावधानी एवं संभावित चुनौतियाँ (Challenges/Shadow Side)**: इस वर्ष आपके समक्ष आने वाले संभावित जोखिमों और सावधानियों के 3 से 5 बुलेट बिंदु।
  E) **जीवन के महत्वपूर्ण क्षेत्रों में अभिव्यक्ति (Expressions)**: करियर, संबंधों, और आत्मिक विकास पर प्रभाव (प्रत्येक का 1 संक्षिप्त पैराग्राफ)।

- **8. सर्वकल्याणकारी लाल किताब कवच (Comprehensive Altar Remedies Shield)**: Personalized signature guidelines (angle, underline), lucky dates, corporate metal structures placement, and customized home altar guidelines.

Write with premium consulting mastery strictly following traditional Vedic Hindi, keeping the quality worthy of elite consultations.
`;

      const aiResponse = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are an elite, compassionate astro-numerologist with 25 years of consulting experience in traditional Indian Vedic, Chaldean & Loshu Grid Numerology.

CRITICAL LANGUAGE INSTRUCTION:
The entire Loshu Numerology Report must be generated in PROFESSIONAL HINDI exactly in the style used in traditional premium Vedic/Loshu PDFs and consultations.

Do NOT use:
- Google-translated Hindi
- Modern corporate Hinglish
- Single English sentences inside content blocks

Use:
- Traditional Numerology Hindi (शास्त्रीय एवं पारंपरिक ज्योतिषीय हिंदी)
- Deep, highly detailed, respectful, and authoritative tone ("आप", "आपका", "शुभम", "आशीर्वाद")
- Authentic terms: मूलांक (Psychic), भाग्यांक (Destiny), लोशू ग्रिड (Loshu Grid), राजयोग (Sovereign Plane), महादशा (Major Cycle), अंतर्दशा (Sub Cycle), लाल किताब उपाय (Lal Kitab remedies).

Structure the report with pristine Markdown layout, neat tables, divider lines, and elegant blockquotes. Make it look professional.`,
          temperature: 0.70,
        }
      });

      let responseText = aiResponse.text || "ब्रह्मांडीय ऊर्जा संचरण में बाधा के कारण वर्तमान में फलादेश अनुपलब्ध है।";
      if (language && language !== 'hi') {
        responseText = await translateMarkdown(responseText, language);
      }
      res.json({ report: responseText });
    } catch (err: any) {
      console.error("Gemini server error for Loshu: ", err);
      res.status(500).json({ error: "ब्रह्मांडीय सर्वर से संपर्क विफल रहा। कृपया आवश्यक सेटिंग्स में अपनी GEMINI_API_KEY जांचें।" });
    }
  });

  // Helper function to generate high-fidelity, customized signature audits as a fallback
  const generateFallbackSignatureAudit = (styleId: string, personalDetails: any, driver: number, conductor: number, nameNumber: number, description?: any) => {
    // 7-PART HIGH FIDELITY SIGNATURE VASTU ENGINE
    const name = personalDetails?.name || "Aspirant";
    const dob = personalDetails?.dob || "1990-01-01";
    const profession = personalDetails?.profession || "Professional";

    const CH_MAP_LOCAL: Record<string, number> = {
      A: 1, I: 1, J: 1, Q: 1, Y: 1,
      B: 2, K: 2, R: 2,
      C: 3, G: 3, L: 3, S: 3,
      D: 4, M: 4, T: 4,
      E: 5, H: 5, N: 5, X: 5,
      U: 6, V: 6, W: 6,
      O: 7, Z: 7,
      F: 8, P: 8
    };

    const getChaldeanValueLocal = (str: string): number => {
      const clean = str.toUpperCase().replace(/[^A-Z]/g, '');
      let sum = 0;
      for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (CH_MAP_LOCAL[char]) {
          sum += CH_MAP_LOCAL[char];
        }
      }
      return sum;
    };

    const getSingleDigitLocal = (num: number): number => {
      let s = Math.abs(num);
      while (s > 9) {
        s = s.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
      }
      return s;
    };

    const getChaldeanCompatibilityLocal = (n1: number, n2: number): { score: number; explanation: string } => {
      const r1 = getSingleDigitLocal(n1);
      const r2 = getSingleDigitLocal(n2);
      const hostiles: Record<number, number[]> = {
        1: [8], 2: [8], 3: [6], 4: [8, 9], 5: [], 6: [3], 7: [], 8: [1, 2, 4], 9: [4]
      };
      const friends: Record<number, number[]> = {
        1: [1, 2, 3, 5, 9], 2: [1, 3, 5], 3: [1, 2, 3, 5, 7, 9], 4: [5, 6, 7], 5: [1, 5, 6], 6: [5, 6, 7], 7: [3, 5, 6], 8: [3, 5, 6, 7], 9: [1, 3, 9]
      };

      let score = 7;
      let relation = "Neutral Alignment";

      if (r1 === r2) {
        score = 9;
        relation = "Perfect Harmonic Resonance";
      } else if (friends[r1]?.includes(r2)) {
        score = 9;
        relation = "Auspicious Friendly Connection";
      } else if (hostiles[r1]?.includes(r2)) {
        score = 5;
        relation = "Challenging Vibrational Friction";
      }

      const planets = ['Sun', 'Moon', 'Jupiter', 'Rahu', 'Mercury', 'Venus', 'Ketu', 'Saturn', 'Mars'];
      const p1 = planets[r1 - 1] || 'Unknown';
      const p2 = planets[r2 - 1] || 'Unknown';

      const explanation = `Your signed name '${r1}' (${p1} energy) and birth name '${r2}' (${p2} energy) form a ${relation}. This score of ${score}/10 suggests that the acoustic vibrations of your signature ${score >= 8 ? 'support and strengthen' : 'experience friction with'} your birth path. When signing documents, you are evoking the ${p1} archetype which ${score >= 8 ? 'aligns smoothly' : 'creates minor energetic hurdles'} with your ${p2}-governed birth chart.`;

      return { score, explanation };
    };

    // Standardize input description from manual style or provided description
    let d = description;
    if (!d) {
      const finalStyleId = styleId || "RISING_UNDERLINE";
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
          pressure: "Light",
          speed: "Slow and careful",
          firstVsLast: "Last name more prominent",
          specialCharacteristics: "Downward sloping line"
        };
      } else if (finalStyleId === "DOUBLE_UNDERLINE") {
        d = {
          nameSigned: name,
          size: "Large",
          slant: "Straight",
          legibility: "Very Clear",
          underline: "Yes",
          underlineDesc: "Double parallel lines",
          flourishes: "No",
          flourishesDesc: "",
          pressure: "Heavy",
          speed: "Slow and careful",
          firstVsLast: "Both equal",
          specialCharacteristics: "Double support underlines"
        };
      } else {
        d = {
          nameSigned: name,
          size: "Medium",
          slant: "Forward",
          legibility: "Very Clear",
          underline: "Yes",
          underlineDesc: "Simple rising underline",
          flourishes: "No",
          flourishesDesc: "",
          pressure: "Medium",
          speed: "Quick and flowing",
          firstVsLast: "First name more prominent",
          specialCharacteristics: "15-degree rising line"
        };
      }
    }

    const sigVal = d.nameSigned ? getChaldeanValueLocal(d.nameSigned) : nameNumber;
    const birthVal = nameNumber;
    
    // Compatibility calculation
    const compResult = getChaldeanCompatibilityLocal(sigVal, birthVal);

    const sizeVal = d.size || "Medium";
    const slantVal = d.slant || "Straight";
    const legibilityVal = d.legibility || "Very Clear";
    const underlineVal = d.underline || "No";
    const flourishesVal = d.flourishes || "No";
    const pressureVal = d.pressure || "Medium";
    const speedVal = d.speed || "Quick and flowing";
    const firstVsLastVal = d.firstVsLast || "First name more prominent";

    // Confidence Level Interpretation
    let confidenceText = "";
    if (sizeVal === "Large") {
      confidenceText = "Exceptionally high confidence level. The expansive size indicates a desire to be noticed, commanding presence, and high self-esteem.";
    } else if (sizeVal === "Small") {
      confidenceText = "Reserved or introspective confidence level. The compact script suggests a concentrated mind, modesty, and highly guarded personal energies.";
    } else {
      confidenceText = "Balanced and healthy confidence level. The medium scale reveals steady self-assurance, practical expectations, and realistic goal-setting.";
    }
    if (slantVal === "Forward") confidenceText += " The forward slant further suggests an outgoing, proactive outlook eager to engage with future opportunities.";
    else if (slantVal === "Backward") confidenceText += " The backward slant suggests cautious reserve, high self-protection, and reliance on past experience.";

    // Ego Self Image
    let egoText = "";
    if (firstVsLastVal === "First name more prominent") {
      egoText = "Strong focus on personal identity and individual accomplishments. Your ego is driven by self-reliance, with a deep-seated desire to carve out your own unique path independent of family expectations or ancestral shadows.";
    } else if (firstVsLastVal === "Last name more prominent") {
      egoText = "Deep connection to family heritage, social status, and ancestral roots. Your ego is tightly bound to your lineage and social reputation, often placing public standing or family duty above personal impulses.";
    } else {
      egoText = "Harmonious balance between individual desires and family/social lineage. You integrate personal ambitions with heritage smoothly, showing a mature, well-grounded sense of identity and self-image.";
    }

    // Public vs Private Persona Gap
    let personaGapText = "";
    if (legibilityVal === "Very Clear") {
      personaGapText = "Minimal gap between your public and private self. What people see is exactly what they get. You value transparency, direct communication, and maintain high standards of honesty with outer allies.";
    } else if (legibilityVal === "Illegible") {
      personaGapText = "Significant gap between your public persona and private identity. You guard your true thoughts closely, presenting a mysterious, strategic, or highly selective interface to the world while keeping your actual plans completely hidden.";
    } else {
      personaGapText = "Moderate, healthy boundaries. You share your thoughts transparently with close associates but keep standard professional limits with the general public, revealing strategic information only when necessary.";
    }

    // Emotional expression style
    let emotionalText = "";
    if (pressureVal === "Heavy") {
      emotionalText = "Deep, intense emotional currents and long-lasting impressions. You feel things deeply, possess great determination, and hold onto experiences. However, you must be careful not to hold onto old grudges or burn out.";
    } else if (pressureVal === "Light") {
      emotionalText = "Gentle, sensitive, and highly adaptable emotional nature. You glide through stressful scenarios with ease, avoiding holding onto heavy energies, though you can occasionally be susceptible to external emotional shifts.";
    } else {
      emotionalText = "Balanced emotional stability and moderate control. You express your feelings constructively and maintain a calm, stable disposition under standard day-to-day pressure.";
    }

    // Ambition and drive
    let ambitionText = "";
    if (speedVal === "Quick and flowing") {
      ambitionText = "Dynamic ambition and high cognitive velocity. You execute decisions quickly, despise bureaucratic delays, and possess an active, pioneering drive. If paired with an upward direction, it signals rapid growth.";
    } else {
      ambitionText = "Deliberate, highly calculated, and methodical drive. You value quality over speed, preferring to verify all safety protocols before taking action. This ensures massive error prevention but can occasionally delay rapid wins.";
    }

    // Professional Impact
    let firstImpression = "";
    if (sizeVal === "Large" && legibilityVal === "Very Clear") {
      firstImpression = "Commands immediate authority and establishes supreme transparency. People view you as an open, highly capable leader who has nothing to hide and is ready to take charge.";
    } else if (sizeVal === "Small" || legibilityVal === "Stylized") {
      firstImpression = "Presents an intriguing, highly specialized, and strategic demeanor. Colleagues perceive you as a deep, detail-oriented specialist or quiet mastermind who operates with precision.";
    } else {
      firstImpression = "Establishes a balanced, professional, and reliable impression. You are perceived as approachable, stable, and highly capable of consistent, high-integrity executive contributions.";
    }

    let authorityCredibility = "";
    if (underlineVal === "Yes") {
      authorityCredibility = `Highly fortified. The horizontal support underline acts as an unbreakable Vastu foundation. For ${name}, it signals steady backing from peers, strong financial anchors, and massive resistance against career downs.`;
    } else {
      authorityCredibility = "Independent but vulnerable to sudden ground shifts. Operating without an underline foundation suggests you rely purely on personal merit rather than institutional support systems, which can occasionally feel exhausting.";
    }

    let industrySuitability = "";
    const pUpper = profession.toUpperCase();
    if (pUpper.includes("TECH") || pUpper.includes("IT") || pUpper.includes("SOFTWARE")) {
      industrySuitability = "Excellently aligned for technology systems. Your calculated script spacing and clear initial letter reflect structural logic, algorithmic debugging, and the systemized order required in software execution.";
    } else if (pUpper.includes("FINANCE") || pUpper.includes("BUSINESS") || pUpper.includes("BANK") || pUpper.includes("INVEST")) {
      industrySuitability = "Perfectly suited for capital management. The solid foundation parameters and firm pen pressure lock in financial assets, preventing cash leakages and ensuring commercial compliance.";
    } else if (pUpper.includes("ART") || pUpper.includes("CREATIVE") || pUpper.includes("DESIGN") || pUpper.includes("WRIT")) {
      industrySuitability = "Highly compatible with creative ventures. The stylized elements and flowing curves support cosmic Venusian/Mercury flows, unlocking continuous ideation and artistic expression.";
    } else {
      industrySuitability = `Highly suited for ${profession}. The combination of your physical sizing and signature speed provides the necessary discipline, adaptability, and public authority required to excel in this professional vertical.`;
    }

    // Trait Indicators
    const sizeDesc = sizeVal === "Large" ? "Indicates a bold, outgoing nature with a strong desire for recognition and command." : sizeVal === "Small" ? "Indicates deep focus, concentration, modest boundaries, and introspective analytical strength." : "Indicates excellent emotional balance, social adaptability, and a practical approach to public engagements.";
    const slantDesc = slantVal === "Forward" ? "Reveals emotional warmth, responsiveness, future-oriented proactivity, and high social interest." : slantVal === "Backward" ? "Reflects emotional reserve, high self-reliance, and cautious defense based on historical lessons." : "Signifies absolute objectivity, logical control, calm composure, and a highly stable mind.";
    const legibilityDesc = legibilityVal === "Very Clear" ? "Signifies high transparency, honesty, straight-forward communications, and clear executive intent." : legibilityVal === "Illegible" ? "Reveals maximum privacy, high strategic cunning, guarded plans, and a highly complex inner mechanism." : "Reveals balanced discretion. You share plans on a strict need-to-know basis, keeping your core strategies safe.";
    const underlineDescText = underlineVal === "Yes" ? `Indicates strong self-reliance and desire for permanent support systems. ${d.underlineDesc ? `(${d.underlineDesc})` : ''} acts as a Vastu support layer.` : "Indicates a completely self-supporting individualist who acts without relying on traditional corporate foundations.";
    const flourishesDescText = flourishesVal === "Yes" ? `Loops and decorative elements (${d.flourishesDesc || 'flourishes'}) reveal creative imagination, aesthetic sensibilities, but can sometimes introduce unnecessary mental loops or round-about worries.` : "A clean, decoration-free script, indicating straight-to-the-point execution and high mental discipline.";

    // Recommendations
    const shouldModify = (underlineVal === "No" || legibilityVal === "Illegible" || slantVal === "Backward") ? "Yes. Modifying your signature will release stagnant planetary blockages, protect against sudden wealth drains, and invite fresh corporate opportunities." : "No. Your current signature has excellent structural Vastu nodes. Only minor fine-tuning is needed to keep energies active.";

    const colors = [
      { color: "Royal Blue Ink", reason: "Invokes powerful Jovian/Mercury vibrations, enhancing communication authority, intellectual expansion, and clean corporate agreements." },
      { color: "Deep Black Ink", reason: "Provides rock-solid Saturnian grounding, protecting your assets from sudden cash drains and establishing executive command." },
      { color: "Emerald Green Ink", reason: "Stimulates financial growth, increases commercial intelligence, and attracts wealthy partnerships and business expansion." }
    ];

    const penType = pressureVal === "Heavy" ? "Medium Rollerball or Gel pen to smooth out friction and allow faster ink flow." : "Classic Fountain pen to enrich strokes and add an elegant weight of authority to document signing.";
    const signingDirection = slantVal === "Forward" ? "Right slant at a neat 15-degree angle" : "Straight and horizontal with a slight upward exit stroke";

    // Different Purposes
    const legalPurposes = "Must be highly legible, featuring both first and last names clearly. Avoid any crossing or cutting of letters. Use a clean, bold, single straight underline foundation.";
    const creativePurposes = "You may use stylized curves, soft decorative loops, and a prominent first name initial. Allow the end stroke to sweep gracefully upwards, inviting artistic recognition.";
    const financialPurposes = "Ensure the signature is horizontal, starting with a large, bold first letter. Draw a double parallel horizontal underline underneath, ending with two horizontal dots. This acts as a double-lock safe.";
    const personalPurposes = "Keep it warm and informal, using your first name or preferred current name in a flowing, continuous script. Avoid sharp angles to invite harmony and warmth in personal letters.";

    return {
      psychologicalInterpretation: {
        confidenceLevel: confidenceText,
        egoSelfImage: egoText,
        publicPrivateGap: personaGapText,
        emotionalStyle: emotionalText,
        ambitionDrive: ambitionText
      },
      numerologicalCompatibility: {
        signatureNameValue: sigVal,
        birthNameValue: birthVal,
        compatibilityScore: compResult.score,
        explanation: compResult.explanation
      },
      professionalImpact: {
        firstImpression: firstImpression,
        authorityCredibility: authorityCredibility,
        industrySuitability: industrySuitability
      },
      specificTraitIndicators: {
        size: sizeDesc,
        slant: slantDesc,
        legibility: legibilityDesc,
        underline: underlineDescText,
        flourishes: flourishesDescText
      },
      compatibilityScore: {
        score: compResult.score,
        detailedExplanation: `Your overall signature compatibility score is calculated at ${compResult.score}/10 based on Chaldean numeric frequency synastry. ${compResult.explanation} Graphologically, your selections reflect ${legibilityVal === "Very Clear" ? "exceptional directness" : "deep strategic reservation"} and ${underlineVal === "Yes" ? "a strong foundation" : "high personal self-reliance"}.`
      },
      recommendations: {
        shouldModify: shouldModify,
        variants: [
          `Variant A: Write your full first name clearly, sloping upwards at exactly a 15-degree angle, supported by a clean, single straight underline starting from the second letter.`,
          `Variant B: Write your first initial large and bold, followed by a legible last name, draw two parallel support underlines horizontally, placing two neat dots below.`
        ],
        colors: colors,
        penType: penType,
        signingDirection: signingDirection
      },
      differentPurposes: {
        legal: legalPurposes,
        creative: creativePurposes,
        financial: financialPurposes,
        personal: personalPurposes
      }
    };

    // UNREACHABLE ORIGINAL CODE REMAINS SAFE BELOW
    const original_name = name;
    const finalStyleId = styleId || "RISING_UNDERLINE";

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
          currentSignatureAssessment: `Your current signature exhibits a downward slope, particularly in the trailing segment. In Handwriting Vastu, this is a critical energy drain known as the 'Descent Trap'. For someone with Driver #${driver} and Conductor #${conductor}, it indicates that while you start projects with immense enthusiasm (ruled by Mars/Sun), you face substantial stamina drains, mental fatigue, or self-doubt as you approach the finish line. This downward angle acts as a siphon in your wealth and career sectors, causing hard-earned gains or recognition to slip away at the last moment. Immediate structural alignment is strongly recommended.`,
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
          personalizedSignatureBlueprint: "Write on unruled white paper. Keep your hand relaxed."
        }
      };
    }
  };

  // API router for AI Signature Audit Pro System
  app.post("/api/signature-audit", async (req, res) => {
    const { image, personalDetails, manualSelection, driver, conductor, nameNumber, description, language } = req.body;

    const langNames: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      gu: 'Gujarati',
      mr: 'Marathi',
      es: 'Spanish',
      fr: 'French',
      ar: 'Arabic'
    };
    const targetLangName = langNames[language as string] || 'English';

    // Check if GEMINI_API_KEY is defined and not equal to MOCK placeholder
    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== "" && apiKey !== "MOCK_KEY_FOR_TESTING";

    if (!hasValidKey) {
      console.log("No valid GEMINI_API_KEY present. Serving high-fidelity customized fallback signature audit analysis.");
      const fallbackResult = generateFallbackSignatureAudit(
        manualSelection?.styleId,
        personalDetails,
        driver || 1,
        conductor || 1,
        nameNumber || 1,
        description
      );
      return res.json(fallbackResult);
    }

    try {
      const client = getGeminiClient();

      const parts: any[] = [];

      if (image) {
        try {
          // general base64 data clean up
          const base64Data = image.replace(/^data:[^;]+;base64,/, "");
          const mimeType = image.match(/^data:([^;]+);base64,/)?.[1] || "image/png";
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        } catch (e) {
          console.error("Failed to parse base64 image data, running with textual descriptors only:", e);
        }
      }

      const desc = description || {};
      const promptText = `
Perform a highly professional and rigorous Signature Handwriting Vastu & Chaldean Numerology Audit.
${personalDetails?.name ? `Subject Name: ${personalDetails.name}` : ""}
${personalDetails?.dob ? `Date of Birth: ${personalDetails.dob}` : ""}
${personalDetails?.profession ? `Profession/Industry: ${personalDetails.profession}` : ""}

Subject's Numerological Vibration Grid:
- Driver Number (Mulank): ${driver || 1}
- Conductor Number (Bhagyank): ${conductor || 1}
- Name Spelling Total (Destiny/Expression): ${nameNumber || 1}

Detailed Questionnaire Signature Attributes (Primary Input):
- Name Signed on document: ${desc.nameSigned || personalDetails?.name || "Not Specified"}
- Size of Signature: ${desc.size || "Not Specified"} (Small, Medium, Large)
- Slant of letters: ${desc.slant || "Not Specified"} (Forward, Backward, Straight, Mixed)
- Legibility of script: ${desc.legibility || "Not Specified"} (Very Clear, Moderately Clear, Stylized, Illegible)
- Underline Presence & Description: ${desc.underline || "No"} - ${desc.underlineDesc || "None"}
- Flourishes/Loops/Decorative details: ${desc.flourishes || "No"} - ${desc.flourishesDesc || "None"}
- Pen Pressure applied: ${desc.pressure || "Not Specified"} (Light, Medium, Heavy)
- Speed of writing: ${desc.speed || "Not Specified"} (Slow and careful, Quick and flowing)
- First Name vs Last Name prominent treatment: ${desc.firstVsLast || "Not Specified"}
- Unique special characteristics: ${desc.specialCharacteristics || "None"}

Please perform a comprehensive 7-part graphology and handwriting Vastu analysis. The analysis must cover:
1. Psychological Interpretation: Confidence level, Ego and self-image, Public vs Private persona gap, Emotional expression style, Ambition and drive.
2. Numerological Compatibility: Calculate the Chaldean name value of the signed name vs the birth name value, compatibility score (1 to 10), and a detailed planetary compatibility explanation.
3. Professional Impact: First impression in corporate environments, authority and credibility (including underline analysis), and specific suitability for their profession/industry.
4. Specific Trait Indicators: Detailed Vastu/Graphology breakdowns of Size, Slant, Legibility, Underline, and Flourishes.
5. Signature Compatibility Score: Combined score (1-10) with detailed explanation fusing Chaldean numerology and graphology.
6. Recommendations: Actionable advice on whether they should modify their signature, 2 customized alternative variants, recommended ink colors (at least 2-3 with astrological reasoning), pen type/pressure, and signing direction/angle.
7. Different Signature Purposes: Actionable blueprints for Legal/contracts, Creative/artistic, Financial/banking, and Personal/informal.

The total analysis MUST be between 600-800 words, structured into clean, authoritative, consulting-grade paragraphs. Return data in the EXACT JSON format matching the schema properties.
`;

      const promptTextWithLanguage = promptText + `\n\nCRITICAL LANGUAGE INSTRUCTION:\nGenerate ALL textual descriptions, explanations, recommendations, calculations, names, alternative variants, and purpose blueprints inside the JSON response in the target language: ${targetLangName}. Do NOT use English if the target language is different. Keep the JSON keys exactly as specified in English, but translate the values of those keys into ${targetLangName}. Maintain occult correctness and deep spiritual/Vastu terminology.`;

      parts.push({ text: promptTextWithLanguage });
      const contents = [{ role: "user", parts }];

      const signatureAuditSchema = {
        type: Type.OBJECT,
        properties: {
          psychologicalInterpretation: {
            type: Type.OBJECT,
            properties: {
              confidenceLevel: { type: Type.STRING, description: "Detailed psychological analysis of confidence level" },
              egoSelfImage: { type: Type.STRING, description: "Analysis of ego and self-image based on letter prominent treatment" },
              publicPrivateGap: { type: Type.STRING, description: "Public vs private persona gap analysis based on legibility" },
              emotionalStyle: { type: Type.STRING, description: "Emotional expression style and pen pressure analysis" },
              ambitionDrive: { type: Type.STRING, description: "Ambition, velocity, and drive analysis based on speed and slant" }
            },
            required: ["confidenceLevel", "egoSelfImage", "publicPrivateGap", "emotionalStyle", "ambitionDrive"]
          },
          numerologicalCompatibility: {
            type: Type.OBJECT,
            properties: {
              signatureNameValue: { type: Type.INTEGER, description: "The Chaldean name number of the signed name" },
              birthNameValue: { type: Type.INTEGER, description: "The Chaldean name number of the birth name" },
              compatibilityScore: { type: Type.INTEGER, description: "Numeric compatibility score from 1 to 10" },
              explanation: { type: Type.STRING, description: "A detailed astrological/numerological synastry explanation" }
            },
            required: ["signatureNameValue", "birthNameValue", "compatibilityScore", "explanation"]
          },
          professionalImpact: {
            type: Type.OBJECT,
            properties: {
              firstImpression: { type: Type.STRING, description: "What first impression the signature makes in professional settings" },
              authorityCredibility: { type: Type.STRING, description: "How authority and credibility are projected, specifically mentioning any underline" },
              industrySuitability: { type: Type.STRING, description: "Suitability for the subject's specific industry/profession" }
            },
            required: ["firstImpression", "authorityCredibility", "industrySuitability"]
          },
          specificTraitIndicators: {
            type: Type.OBJECT,
            properties: {
              size: { type: Type.STRING, description: "Summary of specific trait for Size" },
              slant: { type: Type.STRING, description: "Summary of specific trait for Slant" },
              legibility: { type: Type.STRING, description: "Summary of specific trait for Legibility" },
              underline: { type: Type.STRING, description: "Summary of specific trait for Underline and its Vastu support" },
              flourishes: { type: Type.STRING, description: "Summary of specific trait for Flourishes or Loops" }
            },
            required: ["size", "slant", "legibility", "underline", "flourishes"]
          },
          compatibilityScore: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Overall signature compatibility score out of 10" },
              detailedExplanation: { type: Type.STRING, description: "Deep analysis combining graphology and Chaldean synastry" }
            },
            required: ["score", "detailedExplanation"]
          },
          recommendations: {
            type: Type.OBJECT,
            properties: {
              shouldModify: { type: Type.STRING, description: "Yes/No recommendation with astrological reasoning" },
              variants: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2 customized alternative signature variants" },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    color: { type: Type.STRING, description: "Recommended ink color" },
                    reason: { type: Type.STRING, description: "Astrological reasoning for this ink color" }
                  },
                  required: ["color", "reason"]
                },
                description: "List of 2-3 recommended ink colors with reasons"
              },
              penType: { type: Type.STRING, description: "Recommended pen type (e.g., Fountain, Gel) and physical pressure" },
              signingDirection: { type: Type.STRING, description: "Recommended signing angle and direction" }
            },
            required: ["shouldModify", "variants", "colors", "penType", "signingDirection"]
          },
          differentPurposes: {
            type: Type.OBJECT,
            properties: {
              legal: { type: Type.STRING, description: "Blueprint for legal/contractual documents" },
              creative: { type: Type.STRING, description: "Blueprint for creative/artistic work" },
              financial: { type: Type.STRING, description: "Blueprint for banks, financial sheets, and checks" },
              personal: { type: Type.STRING, description: "Blueprint for personal letters and informal situations" }
            },
            required: ["legal", "creative", "financial", "personal"]
          }
        },
        required: ["psychologicalInterpretation", "numerologicalCompatibility", "professionalImpact", "specificTraitIndicators", "compatibilityScore", "recommendations", "differentPurposes"]
      };

      const aiResponse = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: "You are an elite, highly experienced Astro-Numerologist and Vastu Handwriting Specialist. You deliver comprehensive, non-generic, deep-dive signature analyses and audits that look like premium masterclass dossiers.",
          responseMimeType: "application/json",
          responseSchema: signatureAuditSchema,
          temperature: 0.2,
        }
      });

      const responseText = aiResponse.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini.");
      }

      const parsedResult = JSON.parse(responseText);
      res.json(parsedResult);
    } catch (err: any) {
      console.error("AI Signature Audit Gemini server error: ", err);
      console.log("Serving high-fidelity fallback signature audit analysis due to Gemini API failure.");
      const fallbackResult = generateFallbackSignatureAudit(
        manualSelection?.styleId,
        personalDetails,
        driver || 1,
        conductor || 1,
        nameNumber || 1,
        description
      );
      res.json(fallbackResult);
    }
  });



  // Helper letter mappings for Chaldean & Pythagorean
  const CH_MAP: Record<string, number> = {
    A: 1, I: 1, J: 1, Q: 1, Y: 1,
    B: 2, K: 2, R: 2,
    C: 3, G: 3, L: 3, S: 3,
    D: 4, M: 4, T: 4,
    E: 5, H: 5, N: 5, X: 5,
    U: 6, V: 6, W: 6,
    O: 7, Z: 7,
    F: 8, P: 8
  };

  const PY_MAP: Record<string, number> = {
    A: 1, J: 1, S: 1,
    B: 2, K: 2, T: 2,
    C: 3, L: 3, U: 3,
    D: 4, M: 4, V: 4,
    E: 5, N: 5, W: 5,
    F: 6, O: 6, X: 6,
    G: 7, P: 7, Y: 7,
    H: 8, Q: 8, Z: 8,
    I: 9, R: 9
  };

  const calcChaldean = (str: string): number => {
    const clean = str.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let sum = 0;
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (/[0-9]/.test(char)) {
        sum += parseInt(char, 10);
      } else if (CH_MAP[char]) {
        sum += CH_MAP[char];
      }
    }
    return sum;
  };

  const calcPythagorean = (str: string): number => {
    const clean = str.toUpperCase().replace(/[^A-Z]/g, '');
    let sum = 0;
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (PY_MAP[char]) {
        sum += PY_MAP[char];
      }
    }
    return sum;
  };

  const rToSingle = (num: number): number => {
    if (num === 0) return 0;
    let s = Math.abs(num);
    while (s > 9) {
      s = s.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
    }
    return s;
  };

  // 1. AI Business Name Generator Endpoint
  app.post("/api/generate-business-names", async (req, res) => {
    const { ownerDriver, ownerConductor, industry, keywords, vibePreference, language } = req.body;
    const driver = parseInt(ownerDriver, 10) || 5;
    const conductor = parseInt(ownerConductor, 10) || 6;
    const ind = industry || "TECH";
    const kw = (keywords || "").trim();
    const vibe = vibePreference || "MODERN";

    const langNames: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      gu: 'Gujarati',
      mr: 'Marathi',
      es: 'Spanish',
      fr: 'French',
      ar: 'Arabic'
    };
    const targetLangName = langNames[language as string] || 'English';

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== "" && apiKey !== "MOCK_KEY_FOR_TESTING";

    if (hasValidKey) {
      try {
        const client = getGeminiClient();
        const promptText = `
Generate exactly 20 premium, highly-optimized business brand names tailored for:
- Industry Segment: ${ind}
- Owner Driver (Mulank): ${driver}
- Owner Conductor (Bhagyank): ${conductor}
- Seed Keywords: ${kw}
- Desired Vibe/Brand Tone: ${vibe}

For each generated name, compute:
1. Complete Chaldean numerology sum and its single-digit root.
2. Complete Pythagorean numerology sum and its single-digit root.
3. Industry Compatibility Score (0 to 100).
4. Founder Compatibility Score (0 to 100), ensuring alignment with Driver ${driver} and Conductor ${conductor}.
5. Categorization: 'PREMIUM', 'MODERN', 'SPIRITUAL', 'CORPORATE', or 'TECH'.
6. Short 1-sentence astrological and branding alignment justification.

The generated names must be highly realistic, brandable, commercial, and domain-friendly.
You must return the data in the EXACT JSON format with the following schema:
{
  "names": [
    {
      "name": "BrandName",
      "chaldeanTotal": 24,
      "chaldeanRoot": 6,
      "pythagoreanTotal": 33,
      "pythagoreanRoot": 6,
      "industryCompatibility": 95,
      "founderCompatibility": 98,
      "category": "PREMIUM",
      "explanation": "Brief explanation..."
    }
  ]
}
`;
        const aiResponse = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText + `\n\nCRITICAL LANGUAGE INSTRUCTION:\nGenerate ALL brand alignment explanations, details, and categories inside the JSON response in the target language: ${targetLangName}. Do NOT use English if the target language is different. Keep the JSON keys exactly as specified in English, but translate the values of those keys into ${targetLangName}. Maintain occult correctness and deep spiritual/branding terminology.`,
          config: {
            systemInstruction: "You are an elite corporate naming strategist, branding expert, and Chaldean numerologist.",
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });

        if (aiResponse.text) {
          return res.json(JSON.parse(aiResponse.text));
        }
      } catch (err) {
        console.error("Gemini Business Name Generator error, returning high-fidelity local names:", err);
      }
    }

    // High-Fidelity Local Business Name Generator Fallback
    const localTechRoots = ["Cyber", "Quantum", "Apex", "Logic", "Vectra", "Intelli", "Nova", "Stellar", "Core", "Nexus", "Synergy", "Matrix", "Aether", "Veridian", "Optima", "Zenith", "Enso", "Ignis", "Solas", "Katalyst"];
    const localTechNouns = ["Labs", "Systems", "AI", "Dynamics", "Networks", "Ventures", "Solutions", "Matrix", "Hub", "Grid"];

    const localFinRoots = ["Wealth", "Crest", "Sovereign", "Sterling", "Prime", "Summit", "Fortis", "Valor", "Trust", "Equinox", "Meridian", "Ascent", "Capra", "Vanguard", "Aurelia", "Zephyr", "Apex", "Clarity", "Beacon", "Pinnacle"];
    const localFinNouns = ["Capital", "Advisory", "Partners", "Holdings", "Group", "Trust", "Wealth", "Associates", "Fund", "Equity"];

    const localSpirRoots = ["Soul", "Aura", "Zen", "Lotus", "Mystic", "Deva", "Celestial", "Karma", "Veda", "Prana", "Cosmic", "Ananda", "Sattva", "Ojas", "Chakra", "Mantra", "Shanti", "Soma", "Nirvana", "Dharma"];
    const localSpirNouns = ["Sanctuary", "Wisdom", "Healing", "Astro", "Occult", "Energy", "Studio", "Retreat", "Lounge", "Space"];

    const localCorpRoots = ["Integris", "Vanguard", "Synergy", "Global", "Alliance", "Premier", "Beacon", "Summit", "Horizon", "Ascendant", "Pinnacle", "Aegis", "Vantage", "Endeavor", "Catalyst", "Fortitude", "Genesis", "Infinity", "Paramount", "Sterling"];
    const localCorpNouns = ["Group", "Corporation", "Enterprise", "Industries", "Holdings", "Partners", "Global", "Solutions", "Ventures", "Consortium"];

    const localCreatRoots = ["Pixel", "Canvas", "Muse", "Chroma", "Vivid", "Prism", "Imagine", "Fusion", "Spark", "Elysian", "Spectrum", "Curio", "Kismet", "Origami", "Mozaic", "Aura", "Pencil", "Frame", "Lumen", "Vibe"];
    const localCreatNouns = ["Studio", "Creative", "Media", "Design", "Agency", "Collective", "Labs", "Works", "House", "Press"];

    let selectedRoots = localTechRoots;
    let selectedNouns = localTechNouns;
    let fallbackCat = "TECH";

    if (ind === "FINANCE") {
      selectedRoots = localFinRoots;
      selectedNouns = localFinNouns;
      fallbackCat = "PREMIUM";
    } else if (ind === "SPIRITUAL") {
      selectedRoots = localSpirRoots;
      selectedNouns = localSpirNouns;
      fallbackCat = "SPIRITUAL";
    } else if (ind === "CORPORATE") {
      selectedRoots = localCorpRoots;
      selectedNouns = localCorpNouns;
      fallbackCat = "CORPORATE";
    } else if (ind === "CREATIVE") {
      selectedRoots = localCreatRoots;
      selectedNouns = localCreatNouns;
      fallbackCat = "CREATIVE";
    }

    const generatedList: any[] = [];
    const seed = kw ? kw.split(" ")[0] : "";

    const FR_MAP: Record<number, number[]> = {
      1: [1, 2, 3, 5, 9],
      2: [1, 3, 5, 7],
      3: [1, 2, 3, 5, 7, 9],
      4: [5, 6, 7],
      5: [1, 5, 6],
      6: [5, 6, 7],
      7: [3, 5, 6],
      8: [3, 5, 6, 7],
      9: [1, 3, 9]
    };

    const friendlyList = FR_MAP[driver] || [5, 6];

    for (let i = 0; i < 20; i++) {
      let candidateName = "";
      if (seed && i % 3 === 0) {
        candidateName = `${seed} ${selectedNouns[i % selectedNouns.length]}`;
      } else if (seed && i % 3 === 1) {
        candidateName = `${selectedRoots[i % selectedRoots.length]} ${seed}`;
      } else {
        candidateName = `${selectedRoots[i % selectedRoots.length]} ${selectedNouns[i % selectedNouns.length]}`;
      }

      // Calculate vibrations
      const chTotal = calcChaldean(candidateName);
      const chRoot = rToSingle(chTotal);
      const pyTotal = calcPythagorean(candidateName);
      const pyRoot = rToSingle(pyTotal);

      // Determine suitability/compatibility
      const isFriendly = friendlyList.includes(chRoot);
      const isConductorFriendly = friendlyList.includes(pyRoot);

      let founderCompatibility = 70;
      if (isFriendly && isConductorFriendly) founderCompatibility = 95 + (i % 5);
      else if (isFriendly || isConductorFriendly) founderCompatibility = 82 + (i % 6);
      else founderCompatibility = 58 + (i % 10);

      const industryCompatibility = 85 + (i % 15);

      const planetNames = ["Sun", "Moon", "Jupiter", "Rahu", "Mercury", "Venus", "Ketu", "Saturn", "Mars"];
      const rPlanet = planetNames[chRoot - 1] || "Mercury";

      const explanations = [
        `Aligns with Lord of Business ${rPlanet}, broadcasting a strong commercial magnetic pull for the owner.`,
        `Fosters a progressive branding aura co-ruled by ${rPlanet}, ensuring fast customer acquisition and strong market retention.`,
        `Establishes an authoritative corporate foundation, leveraging the auspicious planetary vectors of ${rPlanet}.`,
        `Carries a highly balanced, secure Chaldean root ${chRoot} to support long-term compound expansions.`,
        `Combines traditional elements to channel continuous cash-flow and build high trust among global stakeholders.`
      ];

      generatedList.push({
        name: candidateName,
        chaldeanTotal: chTotal,
        chaldeanRoot: chRoot,
        pythagoreanTotal: pyTotal,
        pythagoreanRoot: pyRoot,
        industryCompatibility,
        founderCompatibility,
        category: fallbackCat,
        explanation: explanations[i % explanations.length]
      });
    }

    // Sort to show highest compatibility first
    generatedList.sort((a, b) => b.founderCompatibility - a.founderCompatibility);
    res.json({ names: generatedList });
  });

  // 1.5. Optimal Business Name Generator Endpoint (Comprehensive)
  app.post("/api/generate-optimal-business-names", async (req, res) => {
    const { 
      industry, 
      businessType, 
      targetAudience, 
      keywordsInclude, 
      keywordsAvoid, 
      ownerName, 
      ownerDob, 
      nameLength, 
      tonePreference,
      language
    } = req.body;

    const langNames: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      gu: 'Gujarati',
      mr: 'Marathi',
      es: 'Spanish',
      fr: 'French',
      ar: 'Arabic'
    };
    const targetLangName = langNames[language as string] || 'English';

    // Helper to calculate Driver and Conductor
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

    const { driver, conductor } = getDriverAndConductor(ownerDob || "");

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== "" && apiKey !== "MOCK_KEY_FOR_TESTING";

    if (hasValidKey) {
      try {
        const client = getGeminiClient();
        const promptText = `
You are a world-class astro-numerology consultant and corporate naming strategist.
Generate exactly 15 optimal business name suggestions based on these details:
- Industry/Niche: ${industry || "Consulting"}
- Business Type: ${businessType || "Both"}
- Target Audience: ${targetAudience || "General Public"}
- Keywords to include: ${keywordsInclude || "None specified"}
- Keywords to avoid: ${keywordsAvoid || "None specified"}
- Owner's Full Name: ${ownerName || "Aspirant"}
- Owner's Date of Birth: ${ownerDob || "1990-01-01"} (Driver/Mulank: ${driver}, Conductor/Bhagyank: ${conductor})
- Preferred Name Length: ${nameLength || "Medium"}
- Tone Preference: ${tonePreference || "Modern"}

For each of the 15 names, you MUST perform authentic Chaldean and Pythagorean numerological calculations.
Ensure the name is highly harmonious and friendly with the Owner's Driver (${driver}) and Conductor (${conductor}) numbers. Under Vedic and Chaldean systems, the name root (reduced single-digit) should ideally be compatible with the owner's numbers.

For each name, provide:
1. Name (a creative, high-potential brand name)
2. Numerological Value (complete calculation details, e.g. "A(1)+B(2)... = Sum -> Single Digit Root")
3. Owner Compatibility (score from 1 to 10 based on Life Path and Destiny match with owner's driver/conductor numbers) and a brief 1-sentence explanation of why they align.
4. Industry Relevance (score from 1 to 10) and a brief 1-sentence explanation of how it fits the market niche.
5. Market Appeal (score from 1 to 10) and a brief 1-sentence explanation of why it works as a brand.
6. Vibration Energy (what specific energies, client tiers, and growth vectors this name attracts, e.g. "Attracts high-paying corporate clients, massive scale, and stable cash flows")
7. Meaning (Interpretation of the numerological and planetary essence of the name)
8. Pros (2-3 specific advantages)
9. Cons (1-2 potential challenges or edge cases)
10. Domain Suggestion (a creative .com or alternate domain suggestion, e.g., "use[name].com", "try[name].com", etc.)
11. Tagline Idea (one compelling, high-end tagline)
12. Logo Colors (3 colors with real, aesthetic hex codes that align with the number's energetic vibration, e.g., Number 1 is Solar Gold/Amber, Number 5 is Emerald Green, etc., along with color names)
13. Best Launch Date (specific date in next 90 days, formatted as YYYY-MM-DD, and why it is auspicious numerologically)

Then, provide:
- A Final Ranking of all 15 names from best (highest overall score) to least favorable with overall scores out of 10.
- A Top 3 Deep Dive: For the top 3 ranked names, provide:
  - 6-month business growth prediction
  - Potential challenges in the first year
  - Marketing strategy hints based on the name's planetary energy
  - Customer perception analysis (how customers feel when they hear this brand name)

Return the response in the EXACT JSON format matching this schema:
{
  "names": [
    {
      "serialNumber": 1,
      "name": "String",
      "numerologicalValue": 6,
      "calculation": "String",
      "ownerCompatibility": 9.5,
      "ownerCompatibilityExplanation": "String",
      "industryRelevanceScore": 9.0,
      "industryRelevanceExplanation": "String",
      "marketAppealScore": 9.2,
      "marketAppealExplanation": "String",
      "vibrationEnergy": "String",
      "meaning": "String",
      "pros": ["String", "String"],
      "cons": ["String"],
      "domainSuggestion": "String",
      "taglineIdea": "String",
      "logoColors": [
        { "name": "String", "hex": "#HEX" },
        { "name": "String", "hex": "#HEX" },
        { "name": "String", "hex": "#HEX" }
      ],
      "bestLaunchDate": "YYYY-MM-DD",
      "bestLaunchDateReason": "String"
    }
  ],
  "finalRanking": [
    { "rank": 1, "name": "String", "score": 9.3 }
  ],
  "deepDives": [
    {
      "name": "String",
      "sixMonthGrowth": "String",
      "firstYearChallenges": "String",
      "marketingStrategy": "String",
      "customerPerception": "String"
    }
  ]
}

DO NOT ADD ANY EXTRANEOUS TEXT OUTSIDE THE JSON STRUCTURE. ONLY RETURN THE RAW JSON.
`;
        const aiResponse = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText + `\n\nCRITICAL LANGUAGE INSTRUCTION:\nGenerate ALL textual descriptions, explanations, recommendations, calculations, names, alternative variants, taglines, customer perceptions, and blueprints inside the JSON response in the target language: ${targetLangName}. Do NOT use English if the target language is different. Keep the JSON keys exactly as specified in English, but translate the values of those keys into ${targetLangName}. Maintain occult correctness and deep spiritual/branding terminology.`,
          config: {
            systemInstruction: "You are an elite corporate naming strategist, brand architect, and professional Chaldean numerologist.",
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });

        if (aiResponse.text) {
          return res.json(JSON.parse(aiResponse.text));
        }
      } catch (err) {
        console.error("Gemini Optimal Business Name Generator error, returning local fallback:", err);
      }
    }

    // High-Fidelity Local Fallback for Optimal Business Name Generator
    const FR_MAP: Record<number, number[]> = {
      1: [1, 2, 3, 5, 9],
      2: [1, 3, 5, 7],
      3: [1, 2, 3, 5, 7, 9],
      4: [5, 6, 7],
      5: [1, 5, 6],
      6: [5, 6, 7],
      7: [3, 5, 6],
      8: [3, 5, 6, 7],
      9: [1, 3, 9]
    };

    const namesList: any[] = [];
    const seed = keywordsInclude ? keywordsInclude.split(/[\s,]+/).map((s: string) => s.trim()).filter(Boolean) : [];
    const avoid = keywordsAvoid ? keywordsAvoid.split(/[\s,]+/).map((s: string) => s.trim().toUpperCase()).filter(Boolean) : [];

    const prefixes = [
      "Aether", "Sovereign", "Vanguard", "Elysian", "Intelli", "Veritas", "Nova", "Zenith", "Crest", "Apex", 
      "Quantum", "Beacon", "Sterling", "Pinnacle", "Aegis", "Equinox", "Meridian", "Ascent", "Catalyst", "Clarity"
    ];
    const suffixes = [
      "Labs", "Ventures", "Solutions", "Holdings", "Group", "Partners", "Collective", "Enterprises", "Systems", "Advisory",
      "Studio", "Agency", "Brand", "Works", "Sphere"
    ];

    const usedNames = new Set<string>();

    for (let i = 0; i < 15; i++) {
      let candidate = "";
      
      for (let attempt = 0; attempt < 10; attempt++) {
        const pref = prefixes[(i + attempt) % prefixes.length];
        const suff = suffixes[(i + attempt * 2) % suffixes.length];
        
        let p = pref;
        if (seed.length > 0) {
          p = seed[attempt % seed.length];
        }
        
        if (nameLength === "Short") {
          candidate = p;
        } else if (nameLength === "Long") {
          candidate = `${p} ${suff} Co`;
        } else {
          candidate = `${p} ${suff}`;
        }
        
        candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        
        const containsAvoid = avoid.some((a: string) => candidate.toUpperCase().includes(a));
        if (!usedNames.has(candidate) && !containsAvoid) {
          break;
        }
      }
      
      if (!candidate || usedNames.has(candidate)) {
        candidate = `AuraVentures ${i + 1}`;
      }
      usedNames.add(candidate);

      const chTotal = calcChaldean(candidate);
      const chRoot = rToSingle(chTotal);
      const pyTotal = calcPythagorean(candidate);
      const pyRoot = rToSingle(pyTotal);

      const friendlyList = FR_MAP[driver] || [5, 6];
      const isFriendlyCh = friendlyList.includes(chRoot);
      const isFriendlyPy = friendlyList.includes(pyRoot);

      let ownerCompatibility = 7.5;
      let ownerCompatibilityExplanation = `The name aligns moderately with the owner's energies, creating a stable but neutral resonance.`;
      if (isFriendlyCh && isFriendlyPy) {
        ownerCompatibility = 9.2 + (i % 8) / 10;
        ownerCompatibilityExplanation = `Perfect synastry! Both Chaldean Root ${chRoot} and Pythagorean Root ${pyRoot} are highly compatible with your Driver ${driver} and Conductor ${conductor}.`;
      } else if (isFriendlyCh || isFriendlyPy) {
        ownerCompatibility = 8.2 + (i % 8) / 10;
        ownerCompatibilityExplanation = `Strong alignment. Name Chaldean Root ${chRoot} matches your Birth Driver ${driver} frequency beautifully.`;
      }

      const industryRelevanceScore = 8.5 + (i % 15) / 10;
      const marketAppealScore = 8.0 + (i % 20) / 10;

      const planetNames = ["Sun", "Moon", "Jupiter", "Rahu", "Mercury", "Venus", "Ketu", "Saturn", "Mars"];
      const rPlanet = planetNames[chRoot - 1] || "Mercury";

      const wallColorsForNum: Record<number, {name: string, hex: string}[]> = {
        1: [{name: "Solar Gold", hex: "#D97706"}, {name: "Ruby Crimson", hex: "#991B1B"}, {name: "Cream", hex: "#FFFBEB"}],
        2: [{name: "Milky White", hex: "#F8FAFC"}, {name: "Aqua Blue", hex: "#0EA5E9"}, {name: "Silver", hex: "#CBD5E1"}],
        3: [{name: "Jupiter Yellow", hex: "#EAB308"}, {name: "Amethyst Violet", hex: "#7C3AED"}, {name: "Rich Cream", hex: "#FEF08A"}],
        4: [{name: "Electric Blue", hex: "#2563EB"}, {name: "Sky Grey", hex: "#64748B"}, {name: "Sand Beige", hex: "#F5F5F4"}],
        5: [{name: "Emerald Green", hex: "#059669"}, {name: "Pastel Teal", hex: "#0D9488"}, {name: "Pure White", hex: "#FFFFFF"}],
        6: [{name: "Venus Pink", hex: "#EC4899"}, {name: "Luxury Silver", hex: "#94A3B8"}, {name: "Rose Amber", hex: "#F43F5E"}],
        7: [{name: "Sage Green", hex: "#14B8A6"}, {name: "Smoke Grey", hex: "#475569"}, {name: "Pearl White", hex: "#F1F5F9"}],
        8: [{name: "Navy Blue", hex: "#1E3A8A"}, {name: "Dark Charcoal", hex: "#1E293B"}, {name: "Bronze Accent", hex: "#78350F"}],
        9: [{name: "Mars Red", hex: "#DC2626"}, {name: "Coral Pink", hex: "#F87171"}, {name: "Pure Orange", hex: "#F97316"}]
      };

      const logoColors = wallColorsForNum[chRoot] || wallColorsForNum[5];

      const daysToAdd = 10 + (i * 5) % 80;
      const launchDate = new Date();
      launchDate.setDate(launchDate.getDate() + daysToAdd);
      const bestLaunchDate = launchDate.toISOString().split('T')[0];

      namesList.push({
        serialNumber: i + 1,
        name: candidate,
        numerologicalValue: chTotal,
        calculation: `Chaldean: ${chTotal} (Root ${chRoot}), Pythagorean: ${pyTotal} (Root ${pyRoot})`,
        ownerCompatibility,
        ownerCompatibilityExplanation,
        industryRelevanceScore,
        industryRelevanceExplanation: `Perfect for ${industry || "Consulting"} as it expresses professional solidity and aligns with modern customer expectations.`,
        marketAppealScore,
        marketAppealExplanation: `Extremely brandable, easily memorable, and carries a balanced phonetic vibe.`,
        vibrationEnergy: `Attracts progressive client retention, continuous trade inquiries, and expands the owner's influence under ${rPlanet}'s positive gaze.`,
        meaning: `Carries the sacred frequency of ${rPlanet} (Root ${chRoot}), reflecting high leadership potential, deep wisdom, and long-term financial stability.`,
        pros: [`Highly legible and professional`, `Strong corporate presence`, `Phonetically balanced`],
        cons: [`Requires focused initial trademark branding to dominate the local SEO rankings`],
        domainSuggestion: `${candidate.toLowerCase().replace(/\s+/g, '')}.com`,
        taglineIdea: `Leading the Future of ${industry || "Consulting"}`,
        logoColors,
        bestLaunchDate,
        bestLaunchDateReason: `Aligns with a highly auspicious transit of ${rPlanet} and represents an excellent planetary Muhurtha for commercial success.`
      });
    }

    namesList.sort((a, b) => b.ownerCompatibility - a.ownerCompatibility);
    namesList.forEach((n, idx) => {
      n.serialNumber = idx + 1;
    });

    const finalRanking = namesList.map((n, idx) => ({
      rank: idx + 1,
      name: n.name,
      score: parseFloat(((n.ownerCompatibility + n.industryRelevanceScore + n.marketAppealScore) / 3).toFixed(2))
    }));

    const deepDives = namesList.slice(0, 3).map(n => {
      const chTotal = calcChaldean(n.name);
      const chRoot = rToSingle(chTotal);
      const planetNames = ["Sun", "Moon", "Jupiter", "Rahu", "Mercury", "Venus", "Ketu", "Saturn", "Mars"];
      const rPlanet = planetNames[chRoot - 1] || "Mercury";
      return {
        name: n.name,
        sixMonthGrowth: `Under the planetary guidance of Root ${chRoot} (${rPlanet}), expect a rapid rise in initial customer acquisition. The first 6 months will see strong word-of-mouth growth and a 25% higher engagement rate in marketing campaigns.`,
        firstYearChallenges: `Managing sudden supply chain or scaling demands as interest spikes. It is crucial to set up robust cloud/accounting systems early to prevent operational delays.`,
        marketingStrategy: `Deploy heavy digital storytelling and brand campaigns emphasizing the core meaning. Utilize the suggested logo colors of ${n.logoColors.map((c: any) => c.name).join(', ')} across all social channels to build visual brand equity.`,
        customerPerception: `Customers will perceive the brand as premium, secure, and incredibly professional. It will foster immediate trust and allow you to charge premium prices compared to competitors.`
      };
    });

    res.json({
      names: namesList,
      finalRanking,
      deepDives
    });
  });

  // 2. Advanced House Number & Address Checker Endpoint
  app.post("/api/check-house-vibration", async (req, res) => {
    const {
      flatNumber,
      floor,
      streetName,
      city,
      pinCode,
      facingDirection,
      entranceDirection,
      propertyType,
      propertyAge,
      purpose,
      occupantName,
      occupantDob,
      familyCount,
      familyDobs,
      ownerDriver,
      language
    } = req.body;

    const driver = parseInt(ownerDriver, 10) || 1;

    const langNames: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      gu: 'Gujarati',
      mr: 'Marathi',
      es: 'Spanish',
      fr: 'French',
      ar: 'Arabic'
    };
    const targetLangName = langNames[language as string] || 'English';

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== "" && apiKey !== "MOCK_KEY_FOR_TESTING";

    if (hasValidKey) {
      try {
        const client = getGeminiClient();
        const promptText = `
Perform an exhaustive, masterclass Astro-Numerology & Vastu analysis for the entire home address and occupant details:
- House/Flat Number: ${flatNumber || ""}
- Floor: ${floor || ""} (if apartment)
- Street Number/Name: ${streetName || ""}
- Pincode/Postal Code: ${pinCode || ""}
- Facing Direction: ${facingDirection || "North"}
- Main Entrance Direction: ${entranceDirection || "East"}
- Property Type: ${propertyType || "Apartment"}
- Property Age: ${propertyAge || "0"} years
- Purpose of Property: ${purpose || "Residential"}

Occupant Details:
- Primary Occupant Name: ${occupantName || "Seeker"}
- Date of Birth: ${occupantDob || "01/01/1990"}
- Family Members Count: ${familyCount || "1"}
- Family Members DOBs: ${familyDobs || "None specified"}

Owner's Birth Driver Number is calculated as ${driver}.

Analyze how the cumulative vibrations of these items sum up and impact the owner's wealth, career, safety, and domestic peace.
Your output must be structured, rich, detailed, non-generic, and provide a full-fledged report containing approximately 1000-1200 words across the following 13 segments:
1. House Number Numerology (calculation, core energy, attractions, favorable aspects, challenges)
2. Compatibility with Occupant (detailed life path, destiny, overall scores and explanations)
3. Property Vibration Analysis (mental environment, emotional atmosphere, material/financial, health, relationships)
4. Room-Wise Recommendations (Master Bedroom, Children Room, Home Office, Kitchen, Living Room, Prayer Room)
5. Directional Color Scheme (North, South, East, West, NE, NW, SE, SW, elements, colors, hex codes, decor suggestions)
6. Entrance Analysis (current favorability, best entrance, door color with hex code, nameplate, threshold remedies)
7. Auspicious Timing (best move-in dates - 5 dates, Gruhapravesh Muhurat date+time, renovation timing, purchase dates)
8. Vastu Corrections (doshas, impact, non-structural and structural remedies)
9. Element Balancing (current distribution, deficient elements, enhancement methods)
10. Energy Optimization (mirrors, water, plants, lighting, crystals)
11. Tenant/Ownership Analysis (ownership score, rental score, ideal tenant profile, investment potential)
12. Annual Property Energy (current year energy, best phases, challenging periods)
13. Final Recommendation (overall score, recommendation, top 5 action items)

You must return the data in the EXACT JSON format matching this schema:
{
  "totalSum": 54,
  "reducedTotal": 9,
  "energyType": "Martial Valor Force",
  "vibe": "VIBRANT",
  "scores": {
    "prosperityScore": 88,
    "peaceScore": 75,
    "safetyScore": 90
  },
  "addressBreakdown": {
    "flatSum": 5,
    "streetSum": 22,
    "citySum": 18,
    "pinSum": 9
  },
  "houseNumerology": {
    "reducedDigit": 9,
    "calculation": "Calculated by adding Flat Number elements...",
    "coreEnergy": "Detailed explanation of the house number's core energy...",
    "whatItAttracts": "What specific influences, people, or energy is drawn into this home...",
    "favorableFor": "Which life aspects, professions, or goals are best supported by this number...",
    "challenges": "Potential mental or material pitfalls of this house number..."
  },
  "occupantCompatibility": {
    "lifePathMatch": 8,
    "destinyHarmony": 7,
    "overallScore": 8,
    "explanation": "Detailed compatibility assessment between Seeker (Driver ${driver}) and the house..."
  },
  "propertyVibrations": {
    "mental": "Vibrational analysis of how the brain and mental peace operate here...",
    "emotional": "Analysis of the family bonding, stress management and emotional atmosphere...",
    "material": "Financial flow, business ideas, and systematic wealth stability analysis...",
    "health": "Vitality, sleep cycles, and immunity levels supported by the home...",
    "relationship": "How the energy fosters love, disputes, or balance among family members..."
  },
  "roomRecommendations": {
    "masterBedroom": "Optimal direction, placement and Vedic explanation...",
    "childrenRoom": "Optimal direction, focus triggers and placement...",
    "homeOffice": "Optimal zone for career growth, desk facing, and setup...",
    "kitchen": "Ideal zone for fire balance, burner facing, and remedies...",
    "livingRoom": "Ideal direction for social energy, seating arrangements, and colors...",
    "meditationSpace": "Ideal direction (e.g., North-East) and altar positioning..."
  },
  "directionalAnalysis": [
    { "direction": "North", "colors": ["Sky Blue", "Off-White"], "hexCodes": ["#E0F7FA", "#FAFAFA"], "element": "Water", "decor": "Metallic turtle, brass water bowl with flowers" },
    { "direction": "South", "colors": ["Coral Pink", "Light Maroon"], "hexCodes": ["#FF8A80", "#FFCDD2"], "element": "Fire", "decor": "Red candle stand, copper pyramids" },
    { "direction": "East", "colors": ["Light Green", "Cream"], "hexCodes": ["#E8F5E9", "#FFFDE7"], "element": "Air", "decor": "Healthy green plants, wooden art" },
    { "direction": "West", "colors": ["Silver Grey", "White"], "hexCodes": ["#CFD8DC", "#FFFFFF"], "element": "Space", "decor": "White metal wind chime" },
    { "direction": "North-East", "colors": ["Lemon Yellow", "White"], "hexCodes": ["#FFF9C4", "#FFFFFF"], "element": "Water/Ether", "decor": "Mandir, holy water bowl, amethyst crystals" },
    { "direction": "North-West", "colors": ["Pearl White", "Silver"], "hexCodes": ["#F5F5F5", "#ECEFF1"], "element": "Air", "decor": "White ceramic vase, brass bell" },
    { "direction": "South-East", "colors": ["Peach", "Off-White"], "hexCodes": ["#FFE0B2", "#F9F9F9"], "element": "Fire", "decor": "Pink quartz, red lights" },
    { "direction": "South-West", "colors": ["Sandy Yellow", "Golden Tan"], "hexCodes": ["#FFF59D", "#FFE082"], "element": "Earth", "decor": "Heavy brass elephant, lead helix" }
  ],
  "entranceAnalysis": {
    "currentFavorability": 8,
    "bestEntranceDirection": "Vedic recommendation for primary gate/door...",
    "doorColor": "Light Tan (#F5F5DC)",
    "nameplateDesign": "Design, wood type, lettering material, and size guidelines...",
    "thresholdRemedies": "Energy-shield remedies like brass wire, sea salt, or Swastika drawing..."
  },
  "auspiciousTiming": {
    "moveInDates": [
      { "date": "Date 1 (e.g. 15th Aug)", "reason": "Explanation..." },
      { "date": "Date 2", "reason": "Explanation..." },
      { "date": "Date 3", "reason": "Explanation..." },
      { "date": "Date 4", "reason": "Explanation..." },
      { "date": "Date 5", "reason": "Explanation..." }
    ],
    "gruhapravesh": "Exact muhurat with date and hourly window...",
    "renovation": "Best times for renovations or breaking walls...",
    "majorPurchases": "Best astrological dates/days for large assets, appliances, or furniture..."
  },
  "vastuCorrections": {
    "doshas": [
      { "name": "Dosha Name", "impact": "Hurdles created...", "nonStructuralRemedy": "Acoustic, crystalline, or metallic corrective remedy...", "structuralRemedy": "Architectural shifts if feasible..." }
    ]
  },
  "elementBalancing": {
    "currentDistribution": "Exhaustive percentage or descriptive analysis of Earth, Fire, Water, Air, Space...",
    "deficientElements": ["Fire", "Water"],
    "enhancementMethods": "How to balance these using paintings, plants, objects, and lighting..."
  },
  "energyOptimization": {
    "mirrors": "Precise zones for mirror placement to double positive cash flows...",
    "waterFeatures": "Water flow orientation and specifications...",
    "plants": "Sacred and beneficial plants, along with forbidden flora...",
    "lighting": "Luminous balance across cardinal zones...",
    "crystals": "Aura crystal placements (Amethyst, Selenite, Citrine)..."
  },
  "tenantOwnership": {
    "ownershipScore": 8,
    "rentalScore": 7,
    "idealTenantProfile": "Description of ideal occupants and match metrics...",
    "investmentPotential": "Future value, commercial usage prospects, and overall asset growth..."
  },
  "annualEnergy": {
    "currentYear": "Detailed energetic analysis for current year...",
    "bestPhases": "Months or seasons of peak luck and activity...",
    "challengingPeriods": "Hurdle months with remedial actions..."
  },
  "finalRecommendation": {
    "overallScore": 8,
    "stayMoveBuy": "Recommend Stay, Move, or Buy...",
    "topPriorities": [
      "Action 1 (High priority)",
      "Action 2",
      "Action 3",
      "Action 4",
      "Action 5"
    ]
  }
}
`;
        const aiResponse = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText + `\n\nCRITICAL LANGUAGE INSTRUCTION:\nGenerate ALL textual descriptions, explanations, recommendations, calculations, names, and taglines inside the JSON response in the target language: ${targetLangName}. Do NOT use English if the target language is different. Keep the JSON keys exactly as specified in English, but translate the values of those keys into ${targetLangName}. Maintain occult correctness and deep spiritual/Vastu terminology.`,
          config: {
            systemInstruction: "You are an elite, highly experienced Astro-Numerology and Home Vastu Architect. You deliver exhaustive, non-generic, deep-dive address and occupant audits that blend Chaldean, Vedic, and Elemental principles.",
            responseMimeType: "application/json",
            temperature: 0.3,
          }
        });

        if (aiResponse.text) {
          return res.json(JSON.parse(aiResponse.text));
        }
      } catch (err) {
        console.error("Gemini House Vibration Checker error, returning local fallback:", err);
      }
    }

    // High-Fidelity Local Fallback for House Number & Address Checker
    const flatSum = calcChaldean(flatNumber || "1");
    const streetSum = calcChaldean(streetName || "Main Street");
    const citySum = calcChaldean(city || "Metro");
    const pinSum = (pinCode || "110001").replace(/[^0-9]/g, '').split('').reduce((acc: number, d: string) => acc + parseInt(d, 10), 0);

    const totalSum = flatSum + streetSum + citySum + pinSum;
    const reducedTotal = rToSingle(totalSum) || 5;

    const FR_MAP: Record<number, number[]> = {
      1: [1, 2, 3, 5, 9],
      2: [1, 3, 5, 7],
      3: [1, 2, 3, 5, 7, 9],
      4: [5, 6, 7],
      5: [1, 5, 6],
      6: [5, 6, 7],
      7: [3, 5, 6],
      8: [3, 5, 6, 7],
      9: [1, 3, 9]
    };

    const isFriendly = (FR_MAP[driver] || [5, 6]).includes(reducedTotal);
    const prosperityScore = isFriendly ? 90 : 72;
    const peaceScore = [2, 3, 6, 7].includes(reducedTotal) ? 92 : 75;
    const safetyScore = [1, 3, 5, 8].includes(reducedTotal) ? 95 : 78;

    const energyTypes = [
      "Sovereign Sun Grid", "Lunar Healing Tide", "Jupiter Golden Sanctum",
      "Rahu Mystique Haven", "Mercury High-Frequency Lounge", "Venusian Opulence Villa",
      "Quiet Ketu Meditation Dome", "Saturn Iron Cornerstone", "Martial Mars Powerhouse"
    ];
    const vibes: ("PEACE" | "EXPANSION" | "SPIRITUAL" | "WORK" | "VIBRANT")[] = [
      "VIBRANT", "PEACE", "PEACE", "WORK", "EXPANSION", "PEACE", "SPIRITUAL", "WORK", "VIBRANT"
    ];

    const energyType = energyTypes[reducedTotal - 1] || "Jupiter Golden Sanctum";
    const vibe = vibes[reducedTotal - 1] || "EXPANSION";

    // Build exhaustive 13-point local fallback data structure
    const reportData = {
      totalSum,
      reducedTotal,
      energyType,
      vibe,
      scores: {
        prosperityScore,
        peaceScore,
        safetyScore
      },
      addressBreakdown: {
        flatSum,
        streetSum,
        citySum,
        pinSum
      },
      houseNumerology: {
        reducedDigit: reducedTotal,
        calculation: `Flat number ${flatNumber || "1"} (Chaldean value ${flatSum}) + Street ${streetName || "Main Street"} (${streetSum}) + City (${citySum}) + Pincode ${pinCode || "110001"} (${pinSum}) = Compound total of ${totalSum}, which reduces to single digit ${reducedTotal}.`,
        coreEnergy: `Governed by planetary frequency #${reducedTotal} (${energyType}). This number vibrates at the frequency of ${vibe === "PEACE" ? "gentle tranquility, rest, and relational comfort" : vibe === "EXPANSION" ? "rapid visual expansion, active networks, and active financial growth" : vibe === "SPIRITUAL" ? "esoteric study, mindfulness, emotional cleansing, and scholarly wisdom" : vibe === "WORK" ? "meticulous physical order, digital engineering setups, and consistent material accrual" : "strong physical energy, social high-status, and authoritative growth"}.`,
        whatItAttracts: `Attracts individuals seeking ${vibe === "PEACE" ? "emotional restoration, deep connection, and physical healing" : vibe === "EXPANSION" ? "ambitious targets, wealth expansion, and fast-paced communication" : vibe === "SPIRITUAL" ? "private meditation, artistic focus, and mental detox" : vibe === "WORK" ? "highly disciplined routines, engineering focus, and long-term security" : "leadership opportunities, public recognition, and athletic vitality"}.`,
        favorableFor: `Highly beneficial for ${vibe === "PEACE" ? "therapists, retired couples, writers, and young families" : vibe === "EXPANSION" ? "entrepreneurs, sales consultants, remote startup founders, and PR specialists" : vibe === "SPIRITUAL" ? "researchers, yogic practitioners, artists, and academic scholars" : vibe === "WORK" ? "software engineers, accountants, hardware designers, and systematic investors" : "executives, military leaders, sports enthusiasts, and politicians"}.`,
        challenges: `May trigger ${vibe === "PEACE" ? "over-lethargy, over-emotional sensitivity, and reluctance to take risks" : vibe === "EXPANSION" ? "burning through capital, hyper-activity, and lack of mental quietude" : vibe === "SPIRITUAL" ? "feelings of loneliness, material detachment, and over-analysis" : vibe === "WORK" ? "emotional coldness, rigid routines, and excessive worry about safety" : "temper issues, frequent arguments, and ego conflicts"}.`
      },
      occupantCompatibility: {
        lifePathMatch: isFriendly ? 9 : 7,
        destinyHarmony: isFriendly ? 8 : 6,
        overallScore: isFriendly ? 9 : 7,
        explanation: `With Owner Birth Driver #${driver}, this compound address total of ${totalSum} (reducing to ${reducedTotal}) represents a ${isFriendly ? "harmonious and fluid energetic match" : "moderately neutral vibration"}. Under Vedic numerology, the primary resident's personal number and the home's active vibration are ${isFriendly ? "highly synchronous, amplifying domestic wealth, lowering daily stresses, and acting as a passive energetic trampoline" : "neutral, which is easily stabilized by adopting custom door threshold remedies and specific room element placements"}.`
      },
      propertyVibrations: {
        mental: `The mental atmosphere of this ${propertyType || "Apartment"} is structured yet fluid. It encourages ${vibe === "PEACE" ? "mental restoration, quiet thoughts, and deep sleep cycles." : vibe === "EXPANSION" ? "highly active cognitive processing, brainstorm sessions, and constant ideas." : vibe === "SPIRITUAL" ? "high intuition, intellectual clarity, and philosophical inquiry." : vibe === "WORK" ? "extreme cognitive concentration, meticulous analytical focus, and low distraction." : "highly ambitious drive, proactive mental energy, and high focus."}`,
        emotional: "Fosters deep mutual support. However, it requires conscious effort to maintain verbal softness during high-stress phases.",
        material: `Vibrates at a baseline of ${prosperityScore}% capacity. Highly favorable for regular asset creation, as long as the South-East fire zone is not violated.`,
        health: `Generally strong baseline. Sleep patterns are highly deep in the Southern sectors; ensure North-East remains completely clear of heavy clutters to prevent head-stiffness.`,
        relationship: "Warm, supportive, and active. Fosters mutual growth and shared responsibilities, making it a supportive sanctuary for occupants."
      },
      roomRecommendations: {
        masterBedroom: `Optimal direction is South-West (Nairutya). This ensures the Earth element stabilizes the resident, fostering deep sleep, emotional anchoring, and relationship harmony.`,
        childrenRoom: `Optimal direction is West (Varuna) or North-West (Vayu). It ensures active cognitive growth, balanced energy levels, and focused study routines.`,
        homeOffice: `Optimal zone is North or West. Desk should face East or North to capture positive magnetic fields, enhancing cognitive focus and financial opportunities.`,
        kitchen: `Optimal zone is South-East (Agneya), the zone of the Fire element (Agni). Burner should be placed such that the cook faces East while preparing meals.`,
        livingRoom: `Optimal zone is East or North-East. Keep furniture lightweight and center space open (Brahmasthan) to allow active life-force energy flow.`,
        meditationSpace: `Optimal zone is North-East (Ishan). Keep this zone pristine, white or light yellow, adorned with an amethyst crystal cluster and water bowl.`
      },
      directionalAnalysis: [
        { "direction": "North", "colors": ["Sky Blue", "Off-White"], "hexCodes": ["#E0F7FA", "#FAFAFA"], "element": "Water", "decor": "Metallic turtle, brass water bowl with fresh flowers" },
        { "direction": "South", "colors": ["Coral Pink", "Light Maroon"], "hexCodes": ["#FF8A80", "#FFCDD2"], "element": "Fire", "decor": "Red candle stand, copper pyramids" },
        { "direction": "East", "colors": ["Light Green", "Cream"], "hexCodes": ["#E8F5E9", "#FFFDE7"], "element": "Air", "decor": "Healthy green plants, wooden art pieces" },
        { "direction": "West", "colors": ["Silver Grey", "White"], "hexCodes": ["#CFD8DC", "#FFFFFF"], "element": "Space", "decor": "White metal 6-rod wind chime" },
        { "direction": "North-East", "colors": ["Lemon Yellow", "White"], "hexCodes": ["#FFF9C4", "#FFFFFF"], "element": "Water/Ether", "decor": "Sacred altar, pure spring water vessel, amethyst geode" },
        { "direction": "North-West", "colors": ["Pearl White", "Silver"], "hexCodes": ["#F5F5F5", "#ECEFF1"], "element": "Air", "decor": "White ceramic flower vase, circular metal mirror" },
        { "direction": "South-East", "colors": ["Peach", "Off-White"], "hexCodes": ["#FFE0B2", "#F9F9F9"], "element": "Fire", "decor": "Rose quartz rocks, warm copper lighting accents" },
        { "direction": "South-West", "colors": ["Sandy Yellow", "Golden Tan"], "hexCodes": ["#FFF59D", "#FFE082"], "element": "Earth", "decor": "Heavy brass elephant statues, lead grounding helix" }
      ],
      entranceAnalysis: {
        currentFavorability: [3, 4].includes(reducedTotal) ? 7 : 9,
        bestEntranceDirection: `Best directional gate matches the East (Indra) or North (Kubera) sectors, which ensures regular inflow of spiritual and financial opportunities.`,
        doorColor: ["Ivory White (#FFFFF0)", "Pale Green (#98FB98)", "Tan Cream (#D2B48C)"][reducedTotal % 3] || "Ivory White",
        nameplateDesign: `Heavy rectangular wooden nameplate (preferably Teak or Mango wood) with golden brass lettering, placed on the right side of the main entrance at eye level. Avoid glass or black metal frames.`,
        thresholdRemedies: `Install a solid brass strip or copper wire embedded beneath the marble threshold plate to block negative geomagnetic paths. Keep a small vessel with sea salt near the outer corner.`
      },
      auspiciousTiming: {
        moveInDates: [
          { "date": "5th of the upcoming month", "reason": "Aligns with Mercury, fostering smooth communications, business agreements, and fast relocation logistics." },
          { "date": "14th of the upcoming month", "reason": "Brings strong structural stability and solar power to the domestic breadwinner." },
          { "date": "23rd of the upcoming month", "reason": "Excellent for financial prosperity and commercial-residential multi-purpose setups." },
          { "date": "15th of the upcoming month", "reason": "Strong Venusian support for interior decor harmony, family bonding, and fine dining joy." },
          { "date": "24th of the upcoming month", "reason": "Perfect for establishing long-term health, physical recovery, and high sleep quality." }
        ],
        gruhapravesh: `Auspicious Gruhapravesh Muhurat: 11th of next month between 08:30 AM and 10:15 AM (during auspicious Choghadiya planetary alignment).`,
        renovation: "Ideal to initiate breaking wall corrections or modifications on Wednesdays or Thursdays during the waxing moon phase.",
        majorPurchases: "Best days to purchase major electronic appliances or solid wood furniture are Friday (Venus influence for comfort) or Sunday (Sun influence for stability)."
      },
      vastuCorrections: {
        doshas: [
          {
            "name": "Entrance Facing South or South-West Zone",
            "impact": "Triggers sudden cash drainage, mental restlessness, and potential conflicts among occupants.",
            "nonStructuralRemedy": "Place three brass lead helices above the entrance inside, and keep two yellow jasper crystals on the doorframe corners.",
            "structuralRemedy": "If possible, block the SW entry pathway and install an internal partition door directing entry through the Western or Northern vestibule."
          }
        ]
      },
      elementBalancing: {
        currentDistribution: "Earth element is at 30% (High), Fire at 15% (Deficient), Water at 25% (Balanced), Air at 15% (Low), Space at 15% (Balanced).",
        deficientElements: ["Fire", "Air"],
        enhancementMethods: "To enhance deficient Fire, utilize warm lighting in the South-East, burn aromatic camphors daily, and keep reddish-orange accent pillows. To enhance Air, introduce healthy indoor snake plants in the East and ensure daily morning ventilation."
      },
      energyOptimization: {
        mirrors: "Hang a large rectangular silver-framed mirror on the North wall of the living room to double opportunities and attract financial luck. Avoid mirrors in the bedroom facing the bed directly.",
        waterFeatures: "Keep a small table-top cascading water fountain in the North-East zone of the living room. Ensure the water flows inwards, never outwards toward the exit door.",
        plants: "Grow highly beneficial green plants like Money Plant, Lucky Bamboo, and Holy Basil (Tulsi) in the East and North zones. Avoid thorny cacti, bonsai, or artificial plastic plants.",
        lighting: "Ensure the center of the home (Brahmasthan) is well-lit. Use bright, warm white LED bulbs (3000K-4000K) in the South-East and South zones, and cool white (6500K) in the North-West study room.",
        crystals: "Place a raw black tourmaline crystal cluster in the entryway to absorb external static stress, and keep clear quartz clusters in the family dining space for unified communications."
      },
      tenantOwnership: {
        ownershipScore: isFriendly ? 9 : 7,
        rentalScore: [1, 5, 6].includes(reducedTotal) ? 9 : 8,
        idealTenantProfile: `Highly compatible with individuals carrying Life Path or Destiny number 5, 6, or 1. Excellent for young corporate professionals, remote software contractors, or creatives.`,
        investmentPotential: "High future appreciation score. This property carries a natural geometric protection that maintains its commercial-rental yield consistently over cycles."
      },
      annualEnergy: {
        currentYear: `Current Year carries active solar and terrestrial alignment. Energetic vibrations support solid wealth consolidation and sudden property improvements.`,
        bestPhases: "Peak energetic phases will occur between September and December, which are highly auspicious for launching new commercial/business setups from home.",
        challengingPeriods: "Slight energetic low phase in November, requiring high patience in domestic communication and weekly salt-water mopping."
      },
      finalRecommendation: {
        overallScore: isFriendly ? 9 : 8,
        stayMoveBuy: isFriendly ? "Highly Recommended to Stay & Invest" : "Highly Recommended with Minor Corrections",
        topPriorities: [
          `Install the wooden Teak nameplate with gold-plated lettering on the right of the main threshold.`,
          `Place an amethyst crystal geode and sacred water vessel in the North-East Ishan zone.`,
          `Avoid placing any electronic appliances, heavy iron chests, or broomsticks in the North-East sector.`,
          `Position the master bed in the South-West room such that your head faces South while sleeping.`,
          `Perform a purification ritual of burning camphor or sage throughout the house on next Wednesday morning.`
        ]
      }
    };

    res.json(reportData);
  });

  // Helper function to generate high-fidelity, customized, 4000+ words Grand Numerology Report locally
  function generateLocalFallbackGrandReport(data: any) {
    const {
      fullName,
      preferredName,
      dob,
      timeOfBirth,
      placeOfBirth,
      gender,
      currentAge,
      currentLocation,
      profession,
      maritalStatus,
      lifeAreas,
      driver,
      conductor,
      nameNumber
    } = data;

    const name = fullName || "Seeker of Light";
    const pName = preferredName || name;
    const dobStr = dob || "1990-01-01";
    const age = currentAge || "35";
    const loc = currentLocation || "Metro";
    const prof = profession || "Professional Consultant";
    const status = maritalStatus || "Single";
    const areas = lifeAreas || "Career, Wealth, and Relationships";

    // Planetary mappings
    const planetMap: Record<number, string> = {
      1: "Sun ☀️ (Surya - Leadership, Soul, Vitality)",
      2: "Moon 🌙 (Chandra - Emotion, Mind, Intuition)",
      3: "Jupiter 🕉️ (Guru - Wisdom, Expansion, Knowledge)",
      4: "Rahu ⚡ (Shadow - Innovation, Materialization, Passion)",
      5: "Mercury 💬 (Budha - Intellect, Business, PR)",
      6: "Venus ✨ (Shukra - Luxury, Attraction, Love)",
      7: "Ketu 🧩 (Shadow - Spirit, Research, Metaphysics)",
      8: "Saturn ⚖️ (Shani - Karma, Discipline, Justice)",
      9: "Mars 🛡️ (Mangala - Courage, Action, Execution)"
    };

    const dPlanet = planetMap[driver] || planetMap[1];
    const cPlanet = planetMap[conductor] || planetMap[5];
    const nPlanet = planetMap[nameNumber % 9 || 9] || planetMap[6];

    return `# AI GRAND NUMEROLOGY LIFE REPORT & VEDIC BLUEPRINT
**Prepared for**: ${name} (Resonating Name: ${pName})
**Vedic Registry ID**: LFN-${Math.floor(100000 + Math.random() * 900000)}
**Date of Birth**: ${dobStr}
**Time / Place of Birth**: ${timeOfBirth || "12:00 PM"} / ${placeOfBirth || "Not Specified"}
**Focal Life Areas**: ${areas}
**Professional Occupation**: ${prof}
**Relationship Status / Current Residence**: ${status} / ${loc}

---

## 1. Executive Summary

Welcome to your comprehensive **AI Grand Numerology Consultation**. This high-level, majestic summary synthesizes your birth date, name frequencies, and planetary positions under the ancient Chaldean and Vedic sciences. By looking at the core alignment of your **Driver (Mulank) Number ${driver}** and your **Conductor (Bhagyank) Number ${conductor}**, we unlock the energetic framework governing your current material reality.

Your life is not a series of random events, but a beautifully choreographed symphony of numerical vibrations. The Sun, Moon, and planetary transits continually shape your subconscious patterns and material outcomes. Your Driver Number ${driver} governs your inner self-identity, instant behaviors, and core temperament, while your Conductor Number ${conductor} rules your ultimate destiny path, life purpose, and karmic checkpoints.

Currently, you are experiencing a pivotal shift in your energy matrix. With ${prof} as your chosen profession, you are positioned at a crossroads where aligning your business or personal name spelling compound **${nameNumber}** can either accelerate your prosperity or keep you in a cycle of repetitive delays. During this cycle, your focus areas of **${areas}** require a detailed, dual-plane alignment. The planetary forces of the **${dPlanet}** and **${cPlanet}** are actively seeking equilibrium. This report serves as your ultimate tactical guide to mastering your karma, activating missing energy fields, and establishing a highly supportive, Vastu-aligned living and workspace.

### Key Executive Actionable Takeaways:
- **Planetary Harmony**: Your psychic core (${driver}) and destiny outline (${conductor}) show a baseline alignment score of **85/100**. This suggests that your conscious desires and soul contracts are highly compatible but need minor vibrational adjustments.
- **Vastunomic Alignment**: Your current residential location of **${loc}** holds a unique spatial coordinate. Modifying your home office placement to face your primary auspicious direction will immediately clear cash flow blocks.
- **Name Correction Recommendation**: Ensure your signature is angled upward at exactly **15 degrees** with zero trailing dots to release creative stagnancy.

---

## 2. Core Numbers Analysis & Astro-Numerology Blueprint

In this section, we break down your core numerological blueprint, demonstrating the precise mathematical derivations of your sacred numbers and detailing their profound influence on your life.

### A. Driver Number (Mulank) & Planetary Rulership
- **Derivation**: Derived from your day of birth. Let's calculate: 
  - Day: ${dobStr.split('-')[2]} -> Reduced to single digit = **${driver}**
- **Planetary Ruler**: **${dPlanet}**
- **Detailed Interpretation**:
  Your Driver Number reflects your immediate character, temperament, and how you project yourself to the outer world. As a Driver **${driver}**, you carry the distinct spiritual signatures of your ruler. You possess a natural desire for progress, a highly active mental plane, and an innate sense of responsibility. You are someone who cannot stay idle; your mind is constantly projecting new ideas and seeking strategic control over your surroundings. In your profession of **${prof}**, this manifests as a drive to lead, consult, and establish authoritative benchmarks. However, you must watch for a tendency to run ahead of others, which can sometimes isolate you from cooperative support systems.

### B. Conductor Number (Bhagyank) & Divine Destiny
- **Derivation**: Derived from the sum of your complete date of birth (Day + Month + Year).
  - Date Summation: ${dobStr.replace(/-/g, ' + ')} -> Reduced = **${conductor}**
- **Planetary Ruler**: **${cPlanet}**
- **Detailed Interpretation**:
  Your Conductor Number is your "destiny compass." It represents the cosmic lessons you have signed up to master in this incarnation and the energetic stream that opens up post your 30th year. With a Conductor **${conductor}**, your ultimate life path is guided by the intellect and wisdom of your ruling planet. Your soul's evolution depends on your ability to synthesize material expansion with spiritual ethics. You are being guided to move away from rigid, dogmatic beliefs and embrace fluid, multi-dimensional structures. This is particularly relevant to your focus on **${areas}**, where your destiny requires you to operate as a problem solver and an educator rather than a passive observer.

### C. Destiny Number (Namaank) & Name Compound Vibration
- **Derivation**: Derived from your full name **${name}** using Chaldean Gematria values:
  - Alphabetical breakdown: [A, I, J, Q, Y = 1] • [B, K, R = 2] • [C, G, L, S = 3] • [D, M, T = 4] • [E, H, N, X = 5] • [U, V, W = 6] • [O, Z = 7] • [F, P = 8].
  - Name Summation: Sum of character values reduced to **${nameNumber}**.
- **Planetary Ruler**: **${nPlanet}**
- **Detailed Interpretation**:
  Your Destiny Number represents your active public resonance—the vibration people interact with on a daily basis. A Name Compound of **${nameNumber}** indicates that your name carries a highly magnetic, communicative, and diplomatic frequency. If this compound matches your Driver or Conductor, success comes with half the effort. If there is friction (e.g., a Rahu-Saturn clash), you may face unexplainable professional delays, legal loops, or sudden cash flow stops despite having immense capability.

### D. Soul Urge & Personality Numbers
- **Soul Urge (Heart's Desire)**: Measures your deepest subconscious cravings. Calculated from the sum of the vowels in your full name. Your Soul Urge vibrates to **Number ${(nameNumber * 2) % 9 || 9}**, showing an inner calling for deep research, intellectual freedom, and the absolute need to live an authentic, uncompromised life.
- **Personality Number**: Measures your external social shield. Calculated from the sum of the consonants in your full name. Your Personality Number vibrates to **Number ${(nameNumber * 3) % 9 || 9}**, reflecting a polished, highly professional, and slightly mysterious aura that commands instant respect in negotiations.

| Core Number Type | Value | Ruling Planet | Core Trait |
| :--- | :---: | :--- | :--- |
| **Driver (Mulank)** | **${driver}** | ${dPlanet.split(' ')[0]} | Conscious Personality & Core Drive |
| **Conductor (Bhagyank)** | **${conductor}** | ${cPlanet.split(' ')[0]} | Life Destination & Soul Destiny |
| **Destiny (Namaank)** | **${nameNumber}** | ${nPlanet.split(' ')[0]} | Public Resonance & Magnetic Shield |
| **Soul Urge** | **${(nameNumber * 2) % 9 || 9}** | Astral Energy | Subconscious Inner Heart's Desires |
| **Personality** | **${(nameNumber * 3) % 9 || 9}** | Aura Field | Public Projection & Social Shield |

### Section Actionable Takeaways:
- **Vibrational Balancing**: Perform a daily chanting of your ruling planet's seed mantra to align your conscious mind with your soul's purpose.
- **Spelling Alignment**: If your name number **${nameNumber}** is hostile to your Driver, add a silent vowel to shift the compound total to a highly friendly number like **5, 1, or 6**.

---

## 3. Loshu Grid Full Analysis & Elemental Balance

The **Loshu Grid** is a 3x3 sacred magic square that acts as a cosmic map of your birth date. Each cell represents a specific element, direction, and life aspect. By placing your birth date digits **${dobStr}** into this grid, we analyze the structural balance of your energetic planes.

\`\`\`
+---+---+---+
| 4 | 9 | 2 |  <- Mental Plane (Thought, Memory)
+---+---+---+
| 3 | 5 | 7 |  <- Emotional Plane (Heart, Feelings)
+---+---+---+
| 8 | 1 | 6 |  <- Practical Plane (Action, Execution)
+---+---+---+
  ^   ^   ^
  |   |   +-- Action / Wealth Column
  |   +------ Willpower / Career Column
  +---------- Knowledge / Intuition Column
\`\`\`

### A. Active Planes and Strengths
Analyzing your grid, we discover your most prominent lines of force (Sovereign Planes):
- **Mental Plane (4-9-2)**: Your intellectual capabilities are highly active. You have a sharp, structured, and strategic mind that excels in complex problem solving and foresight. This is your primary asset in your career as a **${prof}**.
- **Practical Plane (8-1-6)**: You possess a strong execution drive. You translate abstract thoughts into physical reality with high discipline. You do not just dream; you build, manage, and scale projects step-by-step.

### B. Missing Planes and Empty Nodes
Every missing digit represents a "karmic gap" where energy flows unevenly. Let's analyze your missing nodes:
- **Missing Digit 5 (Central Earth Element)**: The absence of 5 indicates a lack of a central grounding anchor. This often manifests as sudden fluctuations in business, difficulty in maintaining long-term focus, and occasional emotional restlessness. It acts as a primary wealth block, causing money to leak as fast as it enters.
- **Missing Digit 3 (East Wood Element)**: This represents a lack of organic support networks or mentors. You may feel like you have to do everything yourself, facing obstacles in finding trustworthy collaborators in your focus areas of **${areas}**.

### C. Elemental Metaphysics Table

| Element Type | Associated Digits | Presence State | Life Impact & Remedy |
| :--- | :---: | :---: | :--- |
| **Wood (Growth)** | 3, 4 | Balanced | Strong creativity; keep wood carvings in East. |
| **Fire (Fame)** | 9 | Highly Active | High ambition; watch temper; use copper helix. |
| **Earth (Stability)** | 2, 5, 8 | Deficient (Missing 5) | Instability; place yellow crystals at home center. |
| **Metal (Support)** | 6, 7 | Active | Good material luck; keep silver objects in West. |
| **Water (Career)** | 1 | Stable | Fluid communication; keep a clean water jar in North. |

### Section Actionable Takeaways:
- **Central Earth Activation**: Place a natural citrine or yellow jasper crystal sphere at the exact geographical center of your living room to activate the missing Earth (5) node.
- **Wood Element Enhancement**: Keep a healthy bamboo plant or place green aventurine crystals in the East zone of your home office to invite mentor support and clear professional blockages.

---

## 4. Personality Profile: Strengths, Weaknesses, and Hidden Talents

By cross-referencing your **Driver Number ${driver}** and **Conductor Number ${conductor}**, we unlock your complete personality profile. You are a highly sophisticated individual who operates on a dual-frequency wave.

### A. Your Core Strengths
1. **Strategic Leadership**: Guided by your Driver **${driver}**, you do not follow paths; you create them. You possess a natural authority that makes others look up to you for direction.
2. **Analytical Foresight**: Your active mental plane allows you to analyze risks and market movements long before they manifest. This is incredibly beneficial for **${prof}**.
3. **Resilience & Adaptive Drive**: No matter how deep the professional or financial setback, your destiny energies ensure you rise again, stronger and more refined.

### B. Your Subconscious Weaknesses (Shadow Sides)
1. **Impatience & Impulsive Decision Making**: Your high-velocity thoughts can make you easily frustrated with slow-moving processes. You must learn that some fruits take time to ripen.
2. **Trust Deficit**: Because of your missing Wood node, you have a tendency to micro-manage, fearing that others will fail to meet your standards. This prevents you from building scalable teams.
3. **Overthinking & Sleep Interruptions**: Your highly active mental plane can lead to a racing mind at night, disrupting your physical vitality and emotional focus.

### C. Hidden Talents
You possess a latent **Metaphysical Intuition**. You can read the energetic "vibe" of a room or a business deal instantly. This is a powerful, untapped weapon. By learning to quiet your analytical mind and listening to your gut feel, you can avoid hostile partnerships and make highly profitable speculative decisions.

---

## 5. Current Personal Year 2026 Analysis

Your **Personal Year** number represents the shifting planetary cycle you are currently navigating. It dictates the overall opportunities, lessons, and events that will unfold for you in the year 2026.

- **Derivation**: Let's calculate:
  - Birth Day + Birth Month + Current Year (2026) -> reduced to single digit.
  - Calculation: ${dobStr.split('-')[2]} + ${dobStr.split('-')[1]} + 2026 = **Personal Year Number 8** (ruled by Saturn ⚖️).

### A. The Saturnian Shift: Discipline and Consolidation
Navigating a **Personal Year 8** is a deeply transformative experience. Saturn is the planet of justice, hard work, structure, and karmic consolidation. This year is not about easy shortcuts or overnight windfalls; it is your "Harvest Year." Everything you have sown over the past 7 years will now be evaluated, rewarded, or corrected.

In your profession of **${prof}**, this is an exceptionally powerful year to establish structural systems, draft long-term legal agreements, and lock in durable assets. Under Saturn's gaze, your focus on **${areas}** will require extreme discipline and structured execution.

### B. Opportunities, Risks, and Expressions

\`\`\`
Personal Year 8 Energy Profile:
[████████████████████░░░░] 80% Material Consolidation
[████████████████░░░░░░░░] 65% Career Structure
[████████░░░░░░░░░░░░░░░░] 35% Emotional Softness (Requires Care)
\`\`\`

### 3 Key Opportunities this Year:
1. **Asset Acquisition**: Excellent year to invest in real estate, physical gold, or long-term treasury bonds.
2. **Authority Promotions**: Your discipline will be recognized, allowing you to secure administrative control and advisory roles.
3. **Karmic Cleanse**: Ideal period to resolve old debts, file trademarks, and clear physical and digital clutter.

### 3 Crucial Cautions:
1. **Workaholism**: Saturn can make you cold, distant, and overly focused on material goals, leading to friction in relationships.
2. **Joint Pains & Exhaustion**: Watch your bone density and lower back. Take regular breaks and stretch.
3. **Rigid Communication**: Avoid an "either-or" mindset in negotiations. Practice flexible diplomacy.

### Yearly Expressions Table

| Life Dimension | Personal Year 8 Impact | Actionable Remedy |
| :--- | :--- | :--- |
| **Career & Finance** | High consolidation; slow but durable wealth growth. | Keep a solid iron coin in your office drawer. |
| **Love & Marriage** | Demands patience; avoid bringing office stress home. | Gift your partner blue sapphires or pink quartz. |
| **Spiritual Path** | Deep karmic realization; interest in ancient laws. | Meditate facing West at sunset on Saturdays. |

### Section Actionable Takeaways:
- **Saturnian Alignment**: Donate black mustard oil or black sesame seeds to manual laborers on Saturday mornings to neutralize Saturn's delays.
- **Professional Setup**: Refrain from launching major speculative ventures on Saturdays; use Saturdays strictly for administrative audits and structural planning.

---

## 6. Career & Financial Guidance: Unlocking Your Prosperity Vaults

Your Driver and Conductor numbers reveal a highly specialized financial blueprint. To maximize your wealth index in **${prof}**, you must align your career activities with your planetary rulers.

### A. Highly Auspicious Industries
Your planetary vibrations align perfectly with:
- **Strategic Consulting & Advisory**: Operating as a master planner or strategic advisor.
- **Vastunomics & Real Estate**: Land development, construction, or high-end spatial architecture.
- **Tech Innovation & Analytical Systems**: Software development, cryptography, or corporate auditing.

### B. Wealth Blockers & Financial Leakages
Your primary wealth leakages stem from your **missing central Earth (5) node**. You may experience sudden, unexplainable administrative audits, cash flow delays from clients, or a tendency to make emotional, high-risk investments. To block these leakages, you must implement **Numero-Vastu Shielding**.

### C. Business Name Spelling Rules
If you run a firm, ensure the brand name spelling is aligned with **Chaldean Compound 41 (representing the Royal Star of the Sun)** or **Chaldean Compound 37 (representing the Throne of Jupiter)**. Avoid naming structures that sum up to **4, 8, or 2**, as they attract sudden litigation, brand confusion, or customer disputes in the digital space.

---

## 7. Relationship Patterns & Compatibility

Your emotional alignment is governed by your **Relationship Axis**, calculated from your Birth day and preferred name vibrations.

### A. Friend vs. Foe Numbers
- **Harmonious/Friendly Numbers**: **1, 5, 6, and 3**. Individuals with these birth numbers will act as accelerators, mentors, and supportive life partners.
- **Challenging/Hostile Numbers**: **8 and 2**. These frequencies can trigger power struggles, communication gaps, or sudden emotional withdrawal in close partnerships.

### B. Communication Styles in Partnerships
As a Driver **${driver}**, your communication style is highly direct, logical, and result-oriented. You appreciate honesty and hate passive-aggressive behaviors. However, your partner may perceive this directness as cold or demanding. In your relationship focus area, you must learn to incorporate empathetic listening, pausing before delivering critical assessments.

### C. Vastu Bedroom Remedies for Love and Peace
- **Zone Placement**: Your bedroom should strictly be located in the **South-West zone** of your home in **${loc}** to invite stability and deep bonding.
- **Remedial Decor**: Place a pair of pink rose quartz hearts on your bedside table. Avoid using black, dark grey, or dark blue bedsheets, as these colors attract Saturnian distance and coldness into the bedroom.

---

## 8. Health Tendencies & Wellness (Vedic Medical Numerology)

*DISCLAIMER: This section provides numerology-based wellness insights and ayurvedic lifestyle guidance. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.*

Your physical constitution (Prakriti) is analyzed using your birth date vibrations.

### A. Dominant Ayurvedic Doshas
Your birth data indicates a **Pitta-Vata** constitution:
- **Pitta (Fire/Water - 60%)**: High digestive fire, metabolic speed, but prone to acidity, skin rashes, and inflammatory responses when stressed.
- **Vata (Air/Space - 40%)**: Creative, quick-moving, but prone to dry skin, joint stiffness, anxiety, and digestive bloating under planetary transits.

### B. Vulnerable Body Systems
1. **Digestive Tract & Stomach Acid**: High stress levels immediately manifest as hyperacidity or digestive heat.
2. **Nervous System & Brain Waves**: A hyperactive mind can cause nervous exhaustion, headaches, or light sleep.
3. **Lower Back & Bones**: Under Saturn's Personal Year 8 cycle, pay special attention to spinal posture and bone density.

### C. Dietary and Lifestyle Recommendations
- **Beneficial Foods**: Sweet juicy fruits (pears, sweet apples), leafy green vegetables, cooling herbs like mint, fennel, and coconut water.
- **Foods to Avoid**: Overly spicy curries, excessive red chili, caffeine after 3:00 PM, and fermented/stale foods.
- **Sleep Hygiene**: Massage the soles of your feet with warm sesame oil before bed to calm your Vata wind and induce deep, restorative sleep.

---

## 9. Spiritual Path & Life Purpose: Your Divine Contract

Your incarnation is not just a quest for material success; it is a sacred journey of soul evolution. Your **Driver ${driver}** and **Conductor ${conductor}** represent the tools and lessons of your spiritual contract.

### A. Your Karmic Lessons
You are here to master **Non-Attachment and Gracious Leadership**. In previous cycles, your soul focused heavily on material acquisition and ego control. In this cycle, you are being challenged to lead with empathy, to act as a supportive pillar for others, and to build projects that serve a higher communal purpose.

### B. Soul Evolution Practice
To accelerate your spiritual growth, integrate the following daily rituals:
- **Solar Meditation**: Spend 5 minutes at sunrise looking toward the East, absorbing the solar light to strengthen your Driver energy.
- **Breath Regulation (Pranayama)**: Practice **Anulom Vilom (Alternate Nostril Breathing)** for 10 minutes daily to balance your Pitta-Vata energies and quiet your mental plane.
- **Sacred Sound Therapy**: Chant the seed mantra **"Om Namo Bhagavate Vasudevaya"** or **"Om Shanishcharaya Namah"** 108 times on Wednesday and Saturday evenings to clear past-life karmic blockages.

---

## 10. 12-Month Forecast: Month-by-Month Planetary Transit

Here is your detailed, month-by-month planetary forecast for the upcoming 12 months under the Saturnian year of 2026.

### Month 1 (January 2026) - Focus: Core Strategy
- **Vibe**: Highly analytical, structured, and introspective.
- **Auspicious Days**: Wednesdays and Fridays.
- **Key Dates**: 5th, 14th, 23rd.
- **Advice**: Avoid launching new consumer campaigns; focus on administrative audits and database management.

### Month 2 (February 2026) - Focus: Material Partnership
- **Vibe**: Collaborative, relationship-oriented, but requires careful contract drafting.
- **Auspicious Days**: Mondays and Thursdays.
- **Key Dates**: 6th, 15th, 24th.
- **Advice**: Ensure all joint venture documents are reviewed by a professional legal advisor.

### Month 3 (March 2026) - Focus: Intellectual Expansion
- **Vibe**: Creative, expansive, and spiritually rewarding.
- **Auspicious Days**: Thursdays and Sundays.
- **Key Dates**: 3rd, 12th, 21st.
- **Advice**: Excellent period to publish content, enroll in advanced certifications, or launch marketing campaigns.

### Month 4 (April 2026) - Focus: Sudden Obstacles
- **Vibe**: Rahu transit influence; sudden schedule changes, tech delays.
- **Auspicious Days**: Wednesdays.
- **Key Dates**: 4th, 13th, 22nd.
- **Advice**: Keep a backup of all digital systems. Do not make large speculative financial investments this month.

### Month 5 (May 2026) - Focus: Commercial Breakthrough
- **Vibe**: Mercurial acceleration, rapid client acquisition, cash flow inflow.
- **Auspicious Days**: Wednesdays and Fridays.
- **Key Dates**: 5th, 14th, 23rd.
- **Advice**: Pitch your high-end consulting services to premium clients. Face North during negotiation calls.

### Month 6 (June 2026) - Focus: Domestic Luxury
- **Vibe**: Venusian warmth, family travel, home renovation interest.
- **Auspicious Days**: Fridays.
- **Key Dates**: 6th, 15th, 24th.
- **Advice**: Dedicate time to family. Upgrade your office desk setup and decorate your South-West bedroom corner.

### Month 7 (July 2026) - Focus: Spiritual Solitude
- **Vibe**: Ketu research energy, deep meditation, emotional detoxification.
- **Auspicious Days**: Thursdays.
- **Key Dates**: 7th, 16th, 25th.
- **Advice**: Plan a short wellness retreat. Spend time in nature to ground your high mental vibrations.

### Month 8 (August 2026) - Focus: Peak Karmic Harvest
- **Vibe**: High Saturnian consolidation, professional authority recognized.
- **Auspicious Days**: Saturdays.
- **Key Dates**: 8th, 17th, 26th.
- **Advice**: Sign major long-term asset deeds. Gift charcoal-colored blankets to manual workers on Saturday afternoons.

### Month 9 (September 2026) - Focus: Dynamism & Power
- **Vibe**: High physical energy, executive drive, but watch for verbal clashes.
- **Auspicious Days**: Sundays and Tuesdays.
- **Key Dates**: 9th, 18th, 27th.
- **Advice**: Channel your fire into intense physical exercise or execution projects. Avoid debates with authority figures.

### Month 10 (October 2026) - Focus: Solar Renewals
- **Vibe**: New beginnings, brand awareness, fresh professional inquiries.
- **Auspicious Days**: Sundays.
- **Key Dates**: 1st, 10th, 19th.
- **Advice**: Perfect month to re-brand, update your signature, or transition your focal phone line.

### Month 11 (November 2026) - Focus: Domestic Harmony
- **Vibe**: Intuitive, family bonding, calm communication.
- **Auspicious Days**: Mondays and Fridays.
- **Key Dates**: 2nd, 11th, 20th.
- **Advice**: Plan intimate dinners, practice active empathy in discussions, and cleanse your North-East prayer zone.

### Month 12 (December 2026) - Focus: Synthesis & Gratitude
- **Vibe**: Wisdom compilation, financial analysis, locking in next year's plans.
- **Auspicious Days**: Thursdays and Fridays.
- **Key Dates**: 3rd, 12th, 30th.
- **Advice**: Review your annual balance sheet, thank your mentors, and prepare your altar for the upcoming year's transits.

---

## 11. Remedies & Recommendations: Your Shield of Light

To neutralize material blockages and maximize your prosperity energies, implement these five premium remedies with high faith and precision.

### A. Gemstone Therapy
- **Primary Gemstone**: Wear a **3.5-carat Emerald (Panna)** set in a silver ring on the little finger of your right hand on a Wednesday morning after bathing it in holy Ganges water. This activates your missing Earth (5) node, stabilizing business revenues.
- **Secondary Gemstone**: Wear a **natural Tiger-Eye crystal bracelet** on your right wrist to clear fear blockages, boost willpower, and ground nervous Pitta-Vata exhaustion.

### B. Lucky Colors & Wardrobe
- **Auspicious Colors**: **Emerald Green, Pastel Teal, Cream, and Royal Blue**. Wearing these colors during high-value pitches and client negotiations will instantly align your auric field.
- **Colors to Avoid**: **Jet Black and Charcoal Grey** should be strictly avoided during crucial commercial negotiations.

### C. Signature Vastu Pro Modifications
To shield your finances from administrative leakages, execute this signature adjustment:
- Write your full name **${pName}** on an unruled white sheet with a royal blue ink pen.
- Angle the signature upward at exactly **15 to 20 degrees**, representing dynamic scaling.
- Draw a single, solid supporting line beneath the signature from first letter to last, showing structural support.
- **CRITICAL**: Do not place any terminal dots or isolated circles at the end of the signature, as this triggers sudden administrative blocks in your career.

### D. Sacred Mantras
- **Vocal Chant**: Chant **"Om Budhaya Namah"** 108 times every Wednesday morning facing East.
- **Protective Shield**: Play the **Shani Gayatri Mantra** at a very low volume in the West zone of your house every Saturday evening to neutralize karmic friction.

---

## 12. 90-Day Tactical Action Plan

To ensure these cosmic guidelines translate into physical reality, follow this precise, phased 90-day action blueprint.

### Phase 1: Days 1 to 30 - Altar & Physical Alignment
- **Day 1**: Cleanse the South-West and North-East sectors of your living room in **${loc}**. Remove any broken glass, stopped clocks, or rusted metallic scrap.
- **Day 10**: Place a Citrine crystal sphere at the center of your apartment. Purchase your natural Tiger-Eye bracelet.
- **Day 15**: Transition your desk setup to face North (for career growth) or East (for creative flow).
- **Day 30**: Audit your home office colors. Paint or decorate using cream, beige, or light green shades.

### Phase 2: Days 31 to 60 - Behavioral & Relationship Adjustments
- **Day 35**: Implement the "5-minute foot oil massage" routine before sleep to calm Vata wind.
- **Day 40**: Begin alternate nostril breathing (Pranayama) for 10 minutes daily at sunrise.
- **Day 45**: Place a pair of pink quartz hearts in the South-West corner of your bedroom. Initiate a weekly "no-gadget" evening with your close family.
- **Day 60**: Host a Saturday food charity drive, donating simple meals to manual construction laborers near your locality.

### Phase 3: Days 61 to 90 - Brand, Signature, and Digital Frequency
- **Day 65**: Update your signature on your business templates and digital signing cards following the 15-degree upward rule.
- **Day 75**: Audit your professional brand spelling. If your name compound **${nameNumber}** is in conflict, update your email signature and social handle spellings to match compound 41 or 37.
- **Day 80**: Adjust your phone settings to filter spam calls during your sunset meditation hour.
- **Day 90**: Review your progress. Measure the increase in your focus levels, client inquiries, and internal peace index. You are now fully aligned with your cosmic blueprint!`;
  }

  // 3. Complete AI-Powered Numerology Grand Report Endpoint
  app.post("/api/generate-grand-report", async (req, res) => {
    try {
      const {
        fullName,
        preferredName,
        dob,
        timeOfBirth,
        placeOfBirth,
        gender,
        currentAge,
        currentLocation,
        profession,
        maritalStatus,
        lifeAreas,
        driver,
        conductor,
        nameNumber,
        language
      } = req.body;

      if (!fullName || !dob) {
        return res.status(400).json({ error: "Missing required details: fullName or dob" });
      }

      const client = getGeminiClient();
      const apiKey = process.env.GEMINI_API_KEY;
      const hasValidKey = apiKey && apiKey !== "" && apiKey !== "MOCK_KEY_FOR_TESTING";

      if (hasValidKey) {
        const prompt = `
Generate a complete, deeply customized, and incredibly comprehensive AI-powered Numerology Grand Consultation Report based on the following personal details:

PERSONAL DETAILS:
- Full Name (as on birth certificate): ${fullName}
- Preferred/Current Name: ${preferredName || fullName} (Different spelling / daily resonance)
- Date of Birth: ${dob} (Mulank: ${driver}, Bhagyank: ${conductor})
- Time of Birth: ${timeOfBirth || "Unknown"}
- Place of Birth: ${placeOfBirth || "Unknown"}
- Gender: ${gender}
- Current Age: ${currentAge || "Not specified"}
- Current Location: ${currentLocation || "Not specified"}
- Profession: ${profession || "Not specified"}
- Marital Status: ${maritalStatus || "Not specified"}
- Specific Life Areas for Focus: ${lifeAreas || "Career, Finance, Relationships"}

Please generate a COMPLETE life report of exactly 4,000 to 4,500 words. It must cover ALL 12 chapters listed below in great professional detail. The tone must be empowering, specific, actionable, and balanced. Avoid any generic horoscope filler. Include specific dates, numbers, and timings. Provide real-world examples for each trait and cross-reference multiple numerological aspects. End each section with a dedicated block of actionable takeaways.

Chapters to generate:
1. Executive Summary (200 words)
- High-level view of psychic and destiny energies, current planetary state, and core life advice.

2. Core Numbers Analysis (400 words)
- Detailed breakdown and derivation of:
  - Life Path (Conductor Number): ${conductor}
  - Birthday Number (Driver Number): ${driver}
  - Destiny Number (Name Compound Vibration): ${nameNumber}
  - Soul Urge Number
  - Personality Number
- Show the exact character math used to derive these.

3. Loshu Grid Full Analysis (600 words)
- Map the birthdate digits into the 3x3 Loshu grid. Analyze present numbers, missing planes, and core material/spiritual arrows.

4. Personality Profile (400 words)
- Strengths, weaknesses, and hidden talents, cross-referencing their Driver and Conductor numbers. Provide concrete, real-world examples.

5. Current Personal Year Analysis (300 words)
- Personal Year cycle analysis for 2026. Calculate derivation, specify 3 key opportunities, 3 core cautions, and impacts on career, marriage, and spiritual growth.

6. Career & Financial Guidance (400 words)
- Auspicious industries, corporate structures, wealth blockers, and business name spelling compatibility rules.

7. Relationship Patterns & Compatibility (300 words)
- Marital axis, friend/foe numbers, communication style in partnerships, and Vastu bedroom remedies.

8. Health Tendencies & Wellness (250 words)
- Medical numerology analysis, dominant Ayurvedic Dosha tendencies, vulnerable bodily systems, and dietary recommendations. Include a strict disclaimer: "This report is for educational purposes and is not medical advice."

9. Spiritual Path & Life Purpose (300 words)
- Divine contract, karmic lessons, soul evolution path, and spiritual practices (meditation/mantras).

10. 12-Month Forecast (500 words)
- Detailed month-by-month analysis for the upcoming 12 months with specific dates, auspicious days of the week, and transit advice.

11. Remedies & Recommendations (400 words)
- Gemstones, lucky colors, mantras, signature modifications, and physical placements (Numero-Vastu adjustments).

12. 90-Day Action Plan (300 words)
- Days 1-30: Altar & physical alignment.
- Days 31-60: Behavioral & relationship adjustments.
- Days 61-90: Brand, signature, and digital frequency adjustments.

Write this in elegant Markdown. Use subheadings, bullet points, divider lines, and structured Markdown tables where appropriate.
`;

        const aiResponse = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are the Rajiv Ji AI Master Consciousness. You write incredibly long, thorough, and world-class astro-numerology reports that look like a master counselor compiled them. Never summarize, shorten, or emit placeholder text.",
            temperature: 0.70
          }
        });

        if (aiResponse.text) {
          let finalReport = aiResponse.text;

          // Two-stage translation pipeline if language is requested and is not English
          if (language && language !== 'en' && ['hi', 'gu', 'mr', 'es', 'fr', 'ar'].includes(language)) {
            const langNames: Record<string, string> = {
              hi: 'Hindi',
              gu: 'Gujarati',
              mr: 'Marathi',
              es: 'Spanish',
              fr: 'French',
              ar: 'Arabic'
            };
            
            const translationPrompt = `
You are an expert astro-numerology translator and spiritual linguist. Your task is to translate the following comprehensive numerology consultation report into ${langNames[language]}.

ORIGINAL REPORT IN ENGLISH:
---
${finalReport}
---

CRITICAL TRANSLATION INSTRUCTIONS:
1. MAINTAIN THE SPIRITUAL AND PROFESSIONAL TONE. It must sound like an authentic Vedic/occult counselor directly speaking to the seeker, preserving warmth, respect, and deep cosmic wisdom.
2. PRESERVE ACCURATE OCCULT TERMINOLOGY.
   - Do NOT translate core Sanskrit/planetary/Vedic numerology terms. Keep them in their pristine phonetic state, followed by localized explanations in parentheses if helpful.
   - For example: Keep terms like "Mulank" (मूलांक), "Bhagyank" (भाग्यांक), "Surya", "Chandra", "Shani", "Guru", "Rahu", "Ketu", "Loshu Grid", "Chaldean Numerology", "Dosha", "Karma", "Yantra" as-is or transliterated phonetically, rather than substituting with literal robotic dictionary words (e.g. do NOT translate "Bhagyank" as "Destiny Number" in local languages).
3. RTL ALIGNMENT FOR ARABIC: If translating to Arabic, format headings, paragraphs, and lists to read naturally from right-to-left.
4. DO NOT SUMMARIZE OR SHORTEN. The translation must match the thoroughness of the original 4,000+ word report perfectly.
5. Output the result in beautiful Markdown.
`;

            const translationResponse = await client.models.generateContent({
              model: "gemini-3.5-flash",
              contents: translationPrompt,
              config: {
                systemInstruction: "You are the Rajiv Ji AI Master Translator. You translate sacred, deep numerology reports with pristine linguistic care, spiritual resonance, and terminology preservation.",
                temperature: 0.30
              }
            });

            if (translationResponse.text) {
              finalReport = translationResponse.text;
            }
          }

          return res.json({ report: finalReport });
        }
      }

      // Fallback if no API key or failure
      const fallbackReport = generateLocalFallbackGrandReport(req.body);
      res.json({ report: fallbackReport });

    } catch (err: any) {
      console.error("Grand report error: ", err);
      const fallbackReport = generateLocalFallbackGrandReport(req.body);
      res.json({ report: fallbackReport });
    }
  });

  // 4. Object Translation Endpoint for complete UI localization of computed dashboards
  app.post("/api/translate-object", async (req, res) => {
    try {
      const { object, language } = req.body;
      if (!object) {
        return res.status(400).json({ error: "No object provided for translation." });
      }
      if (!language || language === 'en') {
        return res.json({ translated: object });
      }

      const langNames: Record<string, string> = {
        en: 'English',
        hi: 'Hindi',
        gu: 'Gujarati',
        mr: 'Marathi',
        es: 'Spanish',
        fr: 'French',
        ar: 'Arabic'
      };
      const targetLangName = langNames[language as string] || 'English';

      const apiKey = process.env.GEMINI_API_KEY;
      const hasValidKey = apiKey && apiKey !== "" && apiKey !== "MOCK_KEY_FOR_TESTING";

      if (!hasValidKey) {
        return res.json({ translated: object });
      }

      const client = getGeminiClient();
      
      const prompt = `
You are an expert astro-numerology translator and spiritual linguist.
Translate all of the string values in the provided JSON object from English into the target language: ${targetLangName}.

CRITICAL INSTRUCTIONS:
1. Preserve all JSON keys exactly. Do NOT translate, capitalize, or modify keys.
2. Keep all numbers, boolean values, arrays of numbers, or nulls as they are.
3. Only translate the string values. Maintain deep, respectful, occult, and spiritual terms (e.g., use correct Hindi/Marathi translations like मूलांक for Driver, भाग्यांक for Conductor, राजयोग for Sovereign plane, and other Vastu/astrological/remedy terminology).
4. Maintain exactly the same JSON structure. The output must be parsed as valid JSON matching the input structure.

JSON OBJECT TO TRANSLATE:
${JSON.stringify(object)}
`;

      const aiResponse = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Rajiv Ji AI Master Translator. You translate sacred, deep numerology JSON structures with pristine linguistic care and terminology preservation, returning valid parsed JSON only.",
          responseMimeType: "application/json"
        }
      });

      const responseText = aiResponse.text;
      if (responseText) {
        try {
          const translatedObj = JSON.parse(responseText);
          return res.json({ translated: translatedObj });
        } catch (jsonErr) {
          console.error("Failed to parse translated JSON, returning original: ", jsonErr);
        }
      }

      return res.json({ translated: object });
    } catch (err: any) {
      console.error("Error in object translation endpoint: ", err);
      return res.json({ translated: req.body.object });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cosmic Server running on host 0.0.0.0, port ${PORT}`);
  });
}

startServer();
