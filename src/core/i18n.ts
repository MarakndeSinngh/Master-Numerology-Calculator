import { useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'gu' | 'mr' | 'es' | 'fr' | 'ar';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  fontClass: string;
  googleFontUrl?: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    fontClass: 'font-sans'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    fontClass: 'font-hindi',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    dir: 'ltr',
    fontClass: 'font-gujarati',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;500;600;700&display=swap'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    dir: 'ltr',
    fontClass: 'font-marathi',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Yatra+One&family=Mukta:wght@400;500;600;700&display=swap'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    dir: 'ltr',
    fontClass: 'font-sans'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    dir: 'ltr',
    fontClass: 'font-sans'
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    fontClass: 'font-arabic',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap'
  }
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    'nav.title': 'Leo Family Numerology',
    'nav.subtitle': 'Premium Indian Numerology Portal',
    'nav.occult': 'Occult Science',
    'nav.reset': 'Reset Profile',
    'nav.loadDemo': '🔮 Load Expert Pattern',
    'tab.aiConsultation': 'AI Grand Consultation Hub 🔮',
    'tab.mobileNumerology': 'Mobile Numerology',
    'tab.loshuGrid': 'Vedic Lo Shu Grid',
    'tab.marriageCompatibility': 'Marriage Synastry',
    'tab.premiumConsultations': 'Vastu & Premium Audits',
    'form.title': 'Seeker Birth & Planetary Configuration',
    'form.subtitle': 'Enter your credentials exactly as registered to match celestial coordinate systems.',
    'form.fullName': 'Full Name (Spell as registered)',
    'form.fullNamePlaceholder': 'e.g. Raajeev Singh Chauhann',
    'form.dob': 'Date of Birth (Solar Day)',
    'form.mobile': 'Active Mobile Number',
    'form.mobilePlaceholder': 'e.g. 9930117696',
    'form.email': 'Secure Email Address',
    'form.emailPlaceholder': 'e.g. contact@numerologysage.com',
    'form.gender': 'Gender Alignment',
    'form.gender.male': 'Male (Surya)',
    'form.gender.female': 'Female (Chandra)',
    'form.gender.other': 'Non-Binary (Mercury)',
    'form.submit': 'Generate Cosmic Numerology Audit',
    'form.submitting': 'Aligning Planetary Radiations...',
    'meta.mulank': 'Mulank (Driver)',
    'meta.bhagyank': 'Bhagyank (Conductor)',
    'error.invalidMobile': 'Please provide an active mobile number to check frequencies.',
    'error.requiredFields': 'Please fill all requested alignment coordinates.',
    'pdf.download': 'Download Multilingual PDF Report',
    'pdf.generating': 'Synthesizing PDF Artifact...',
    'seo.tagline': 'Vedic Numerology & Chaldean Frequencies. Explore planetary yogas, material obstacles, and remedial frequencies.'
  },
  hi: {
    'nav.title': 'सिंह परिवार अंकशास्त्र',
    'nav.subtitle': 'प्रीमियम भारतीय अंकशास्त्र पोर्टल',
    'nav.occult': 'गुप्त विज्ञान',
    'nav.reset': 'प्रोफ़ाइल रीसेट करें',
    'nav.loadDemo': '🔮 विशेषज्ञ पैटर्न लोड करें',
    'tab.aiConsultation': 'एआई महा परामर्श केंद्र 🔮',
    'tab.mobileNumerology': 'मोबाइल अंकशास्त्र',
    'tab.loshuGrid': 'वैदिक लो शू ग्रिड',
    'tab.marriageCompatibility': 'विवाह अनुकूलता',
    'tab.premiumConsultations': 'वास्तु एवं प्रीमियम ऑडिट',
    'form.title': 'साधक जन्म एवं ग्रह विन्यास',
    'form.subtitle': 'खगोलीय निर्देशांक प्रणालियों से मिलान करने के लिए अपने क्रेडेंशियल बिल्कुल सही दर्ज करें।',
    'form.fullName': 'पूरा नाम (पंजीकृत हिज्जे)',
    'form.fullNamePlaceholder': 'उदा. राजीव सिंह चौहान',
    'form.dob': 'जन्म तिथि (सौर दिवस)',
    'form.mobile': 'सक्रिय मोबाइल नंबर',
    'form.mobilePlaceholder': 'उदा. 9930117696',
    'form.email': 'सुरक्षित ईमेल पता',
    'form.emailPlaceholder': 'उदा. contact@numerologysage.com',
    'form.gender': 'लिंग संरेखण',
    'form.gender.male': 'पुरुष (सूर्य)',
    'form.gender.female': 'महिला (चंद्र)',
    'form.gender.other': 'उभयलिंगी (बुध)',
    'form.submit': 'ब्रह्मांडीय अंकशास्त्र ऑडिट उत्पन्न करें',
    'form.submitting': 'ग्रहों के विकिरणों का संरेखण...',
    'meta.mulank': 'मूलांक (ड्राइवर)',
    'meta.bhagyank': 'भाग्यांक (कंडक्टर)',
    'error.invalidMobile': 'फ्रीक्वेंसी जांचने के लिए कृपया एक सक्रिय मोबाइल नंबर प्रदान करें।',
    'error.requiredFields': 'कृपया सभी अनुरोधित संरेखण निर्देशांक भरें।',
    'pdf.download': 'बहुभाषी पीडीएफ रिपोर्ट डाउनलोड करें',
    'pdf.generating': 'पीडीएफ आर्टिफैक्ट तैयार हो रहा है...',
    'seo.tagline': 'वैदिक अंकशास्त्र और चाल्डियन आवृत्तियां। ग्रहों के योग, भौतिक बाधाओं और उपचारात्मक आवृत्तियों का पता लगाएं।'
  },
  gu: {
    'nav.title': 'સિંહ પરિવાર અંકશાસ્ત્ર',
    'nav.subtitle': 'પ્રીમિયમ ભારતીય અંકશાસ્ત્ર પોર્ટલ',
    'nav.occult': 'ગૂઢ વિજ્ઞાન',
    'nav.reset': 'પ્રોફાઇલ રીસેટ કરો',
    'nav.loadDemo': '🔮 નિષ્ણાત પેટર્ન લોડ કરો',
    'tab.aiConsultation': 'AI મહા પરામર્શ કેન્દ્ર 🔮',
    'tab.mobileNumerology': 'મોબાઇલ અંકશાસ્ત્ર',
    'tab.loshuGrid': 'વૈદિક લો શૂ ગ્રીડ',
    'tab.marriageCompatibility': 'લગ્ન સુસંગતતા',
    'tab.premiumConsultations': 'વાસ્તુ અને પ્રીમિયમ ઓડિટ',
    'form.title': 'સાધક જન્મ અને ગ્રહ વિન્યાસ',
    'form.subtitle': 'ખગોળીય સંકલન પ્રણાલીઓ સાથે મેચ કરવા માટે તમારા ઓળખપત્રો બરાબર રજીસ્ટર કર્યા મુજબ દાખલ કરો.',
    'form.fullName': 'પૂરું નામ (નોંધણી મુજબ)',
    'form.fullNamePlaceholder': 'દા.ત. રાજીવ સિંહ ચૌહાણ',
    'form.dob': 'જન્મ તારીખ (સૌર દિવસ)',
    'form.mobile': 'સક્રિય મોબાઇલ નંબર',
    'form.mobilePlaceholder': 'દા.ત. 9930117696',
    'form.email': 'સુરક્ષિત ઇમેઇલ સરનામું',
    'form.emailPlaceholder': 'દા.ત. contact@numerologysage.com',
    'form.gender': 'લિંગ ગોઠવણી',
    'form.gender.male': 'પુરુષ (સૂર્ય)',
    'form.gender.female': 'સ્ત્રી (ચંદ્ર)',
    'form.gender.other': 'બિન-દ્વિસંગી (બુધ)',
    'form.submit': 'બ્રહ્માંડ અંકશાસ્ત્ર ઓડિટ બનાવો',
    'form.submitting': 'ગ્રહોના વિકિરણોનું સંરેખણ...',
    'meta.mulank': 'મૂલાંક (ડ્રાઇવર)',
    'meta.bhagyank': 'ભાગ્યાંક (કંડક્ટર)',
    'error.invalidMobile': 'આવર્તન તપાસવા માટે કૃપા કરીને સક્રિય મોબાઇલ નંબર પ્રદાન કરો.',
    'error.requiredFields': 'કૃપા કરીને તમામ વિનંતી કરેલ ગોઠવણી કોઓર્ડિનેટ્સ ભરો.',
    'pdf.download': 'બહુભાષી પીડીએફ રિપોર્ટ ડાઉનલોડ કરો',
    'pdf.generating': 'પીડીએફ આર્ટિફેક્ટનું સંશ્લેષણ...',
    'seo.tagline': 'વૈદિક અંકશાસ્ત્ર અને ચાલ્ડિયન ફ્રીક્વન્સીઝ. ગ્રહોના યોગો, સામગ્રી અવરોધો અને ઉપચારાત્મક આવર્તનોનું અન્વેષણ કરો.'
  },
  mr: {
    'nav.title': 'सिंह परिवार अंकशास्त्र',
    'nav.subtitle': 'प्रीमियम भारतीय अंकशास्त्र पोर्टल',
    'nav.occult': 'गुप्त विज्ञान',
    'nav.reset': 'प्रोफाइल रीसेट करा',
    'nav.loadDemo': '🔮 तज्ञ नमुना लोड करा',
    'tab.aiConsultation': 'एआय महा सल्लागार केंद्र 🔮',
    'tab.mobileNumerology': 'मोबाईल अंकशास्त्र',
    'tab.loshuGrid': 'वैदिक लो शू ग्रिड',
    'tab.marriageCompatibility': 'विवाह सुसंगतता',
    'tab.premiumConsultations': 'वास्तू आणि प्रीमियम ऑडिट',
    'form.title': 'साधक जन्म आणि ग्रह विन्यास',
    'form.subtitle': 'खगोलीय समन्वय प्रणालीशी जुळण्यासाठी तुमची क्रेडेन्शियल्स अगदी नोंदणीकृत केल्याप्रमाणे प्रविष्ट करा.',
    'form.fullName': 'पूर्ण नाव (नोंदणीकृत स्पेलिंग)',
    'form.fullNamePlaceholder': 'उदा. राजीव सिंह चौहान',
    'form.dob': 'जन्म तारीख (सौर दिवस)',
    'form.mobile': 'सक्रिय मोबाईल नंबर',
    'form.mobilePlaceholder': 'उदा. 9930117696',
    'form.email': 'सुरक्षित ईमेल पत्ता',
    'form.emailPlaceholder': 'उदा. contact@numerologysage.com',
    'form.gender': 'लिंग संरेखन',
    'form.gender.male': 'पुरुष (सूर्य)',
    'form.gender.female': 'महिला (चंद्र)',
    'form.gender.other': 'उभयलिंगी (बुध)',
    'form.submit': 'ब्रह्मांडीय अंकशास्त्र ऑडिट व्युत्पन्न करा',
    'form.submitting': 'ग्रहांच्या विकिरणांचे संरेखन...',
    'meta.mulank': 'मूलांक (ड्रायव्हर)',
    'meta.bhagyank': 'भाग्यांक (कंडक्टर)',
    'error.invalidMobile': 'कृपया फ्रिक्वेन्सी तपासण्यासाठी सक्रिय मोबाईल नंबर प्रदान करा.',
    'error.requiredFields': 'कृपया सर्व विनंती केलेले संरेखन समन्वय भरा.',
    'pdf.download': 'बहुभाषिक पीडीएफ अहवाल डाउनलोड करा',
    'pdf.generating': 'पीडीएफ आर्टिफॅक्ट तयार होत आहे...',
    'seo.tagline': 'वैदिक अंकशास्त्र आणि चाल्डियन फ्रिक्वेन्सी. ग्रहांचे योग, भौतिक अडथळे आणि उपचारात्मक फ्रिक्वेन्सी शोधा.'
  },
  es: {
    'nav.title': 'Numerología de la Familia Leo',
    'nav.subtitle': 'Portal Premium de Numerología India',
    'nav.occult': 'Ciencias Ocultas',
    'nav.reset': 'Restablecer Perfil',
    'nav.loadDemo': '🔮 Cargar Patrón Experto',
    'tab.aiConsultation': 'Centro de Gran Consulta IA 🔮',
    'tab.mobileNumerology': 'Numerología Móvil',
    'tab.loshuGrid': 'Cuadrícula Védica Lo Shu',
    'tab.marriageCompatibility': 'Sinastría de Matrimonio',
    'tab.premiumConsultations': 'Vastu y Auditorías Premium',
    'form.title': 'Configuración Natal y Planetaria del Buscador',
    'form.subtitle': 'Ingrese sus datos exactamente como están registrados para coincidir con los sistemas de coordenadas celestes.',
    'form.fullName': 'Nombre Completo (Tal como está registrado)',
    'form.fullNamePlaceholder': 'ej. Raajeev Singh Chauhann',
    'form.dob': 'Fecha de Nacimiento (Día Solar)',
    'form.mobile': 'Número de Teléfono Activo',
    'form.mobilePlaceholder': 'ej. 9930117696',
    'form.email': 'Dirección de Correo Seguro',
    'form.emailPlaceholder': 'ej. contacto@numerologysage.com',
    'form.gender': 'Alineación de Género',
    'form.gender.male': 'Masculino (Surya)',
    'form.gender.female': 'Femenino (Chandra)',
    'form.gender.other': 'No Binario (Mercurio)',
    'form.submit': 'Generar Auditoría Numerológica Cósmica',
    'form.submitting': 'Alineando Radiaciones Planetarias...',
    'meta.mulank': 'Mulank (Conductor)',
    'meta.bhagyank': 'Bhagyank (Destino)',
    'error.invalidMobile': 'Por favor proporcione un número de móvil activo para verificar las frecuencias.',
    'error.requiredFields': 'Por favor complete todos los campos de coordenadas solicitados.',
    'pdf.download': 'Descargar Informe PDF Multilingüe',
    'pdf.generating': 'Sintetizando informe PDF...',
    'seo.tagline': 'Numerología védica y frecuencias caldeas. Explore yogas planetarios, obstáculos materiales y frecuencias curativas.'
  },
  fr: {
    'nav.title': 'Numérologie de la Famille Leo',
    'nav.subtitle': 'Portail de Numérologie Indienne Premium',
    'nav.occult': 'Sciences Occultes',
    'nav.reset': 'Réinitialiser le Profil',
    'nav.loadDemo': '🔮 Charger le Modèle Expert',
    'tab.aiConsultation': 'Centre de Consultation IA 🔮',
    'tab.mobileNumerology': 'Numérologie Mobile',
    'tab.loshuGrid': 'Grille védique Lo Shu',
    'tab.marriageCompatibility': 'Synastrie de Mariage',
    'tab.premiumConsultations': 'Vastu & Audits Premium',
    'form.title': 'Configuration Natale et Planétaire du Chercheur',
    'form.subtitle': 'Saisissez vos informations exactement comme enregistrées pour correspondre aux systèmes de coordonnées célestes.',
    'form.fullName': 'Nom Complet (Orthographe exacte)',
    'form.fullNamePlaceholder': 'ex. Raajeev Singh Chauhann',
    'form.dob': 'Date de Naissance (Jour Solaire)',
    'form.mobile': 'Numéro de Mobile Actif',
    'form.mobilePlaceholder': 'ex. 9930117696',
    'form.email': 'Adresse E-mail Sécurisée',
    'form.emailPlaceholder': 'ex. contact@numerologysage.com',
    'form.gender': 'Alignement de Genre',
    'form.gender.male': 'Homme (Surya)',
    'form.gender.female': 'Femme (Chandra)',
    'form.gender.other': 'Non-Binaire (Mercure)',
    'form.submit': 'Générer l\'Audit Numérologique Cosmique',
    'form.submitting': 'Alignement des Radiations Planétaires...',
    'meta.mulank': 'Mulank (Conducteur)',
    'meta.bhagyank': 'Bhagyank (Destinée)',
    'error.invalidMobile': 'Veuillez fournir un numéro de mobile actif pour vérifier les fréquences.',
    'error.requiredFields': 'Veuillez remplir toutes les coordonnées d\'alignement demandées.',
    'pdf.download': 'Télécharger le rapport PDF multilingue',
    'pdf.generating': 'Synthèse du rapport PDF...',
    'seo.tagline': 'Numérologie védique et fréquences chaldéennes. Explorez les yogas planétaires, les obstacles matériels et les remèdes vibratoires.'
  },
  ar: {
    'nav.title': 'ليوناردو لعلم الأرقام',
    'nav.subtitle': 'بوابة علم الأرقام الهندية الفاخرة',
    'nav.occult': 'العلوم الخفية',
    'nav.reset': 'إعادة ضبط الملف الشخصي',
    'nav.loadDemo': '🔮 تحميل نمط الخبراء',
    'tab.aiConsultation': 'مركز الاستشارات الكبرى للذكاء الاصطناعي 🔮',
    'tab.mobileNumerology': 'علم أرقام الهواتف',
    'tab.loshuGrid': 'مربع لو شو الفيديك',
    'tab.marriageCompatibility': 'التوافق الزوجي السنداسي',
    'tab.premiumConsultations': 'الفاستو والتدقيق المتميز',
    'form.title': 'التكوين الولادي والكوكبي للباحث',
    'form.subtitle': 'أدخل بياناتك تمامًا كما هي مسجلة لتتوافق مع أنظمة الإحداثيات السماوية.',
    'form.fullName': 'الاسم الكامل (كما هو مسجل بالتهجئة)',
    'form.fullNamePlaceholder': 'مثال: راجيف سينغ شوهان',
    'form.dob': 'تاريخ الميلاد (اليوم الشمسي)',
    'form.mobile': 'رقم الهاتف النشط',
    'form.mobilePlaceholder': 'مثال: 9930117696',
    'form.email': 'البريد الإلكتروني الآمن',
    'form.emailPlaceholder': 'مثال: contact@numerologysage.com',
    'form.gender': 'محاذاة الجنس',
    'form.gender.male': 'ذكر (Surya - الشمس)',
    'form.gender.female': 'أنثى (Chandra - القمر)',
    'form.gender.other': 'غير ثنائي (Mercury - عطارد)',
    'form.submit': 'توليد تدقيق علم الأرقام الكوني',
    'form.submitting': 'محاذاة الإشعاعات الكوكبية...',
    'meta.mulank': 'مولانك (القائد)',
    'meta.bhagyank': 'بهاغيانك (الموصل)',
    'error.invalidMobile': 'يرجى تقديم رقم هاتف نشط للتحقق من الترددات.',
    'error.requiredFields': 'يرجى ملء جميع إحداثيات المحاذاة المطلوبة.',
    'pdf.download': 'تحميل تقرير PDF متعدد اللغات',
    'pdf.generating': 'تجميع تقرير PDF الفاخر...',
    'seo.tagline': 'علم الأرقام الفيدي والترددات الكلدانية. استكشف اليوغا الكوكبية والعقبات المادية والترددات العلاجية.'
  }
};

// Helper to auto-detect language based on browser/hash/cookie
export const detectLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  
  // 1. Check URL hash or path first for SEO routing
  const hash = window.location.hash;
  const path = window.location.pathname;
  
  const seoLang = [path, hash].map(s => {
    const match = s.match(/\/(en|hi|gu|mr|es|fr|ar)(\/|#|$)/);
    return match ? (match[1] as SupportedLanguage) : null;
  }).find(Boolean);

  if (seoLang) return seoLang;

  // 2. Local storage preference
  const saved = localStorage.getItem('user-language') as SupportedLanguage;
  if (saved && TRANSLATIONS[saved]) return saved;

  // 3. Browser languages
  const navLangs = window.navigator.languages || [window.navigator.language];
  for (const lang of navLangs) {
    const code = lang.split('-')[0].toLowerCase() as SupportedLanguage;
    if (TRANSLATIONS[code]) return code;
  }

  return 'en';
};

// Dynamic dynamic font-injector and RTL attribute updater
export const applyLanguageSettings = (lang: SupportedLanguage) => {
  if (typeof document === 'undefined') return;

  const config = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

  // Set HTML direction for RTL support (Arabic)
  document.documentElement.dir = config.dir;
  document.documentElement.lang = lang;

  // Set classes on body
  const body = document.body;
  SUPPORTED_LANGUAGES.forEach(l => {
    if (l.fontClass) body.classList.remove(l.fontClass);
  });
  body.classList.add(config.fontClass);

  // Dynamically load external fonts if configured
  if (config.googleFontUrl) {
    const linkId = `google-font-${lang}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = config.googleFontUrl;
      document.head.appendChild(link);
    }
  }
};
