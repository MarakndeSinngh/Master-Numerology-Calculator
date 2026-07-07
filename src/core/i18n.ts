import { useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'gu' | 'mr' | 'es' | 'fr' | 'ar' | 'zh' | 'ja' | 'pt' | 'ta' | 'te' | 'bn' | 'de' | 'ru';

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
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '简体中文',
    dir: 'ltr',
    fontClass: 'font-sans'
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    dir: 'ltr',
    fontClass: 'font-sans'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    dir: 'ltr',
    fontClass: 'font-sans'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    dir: 'ltr',
    fontClass: 'font-sans',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    dir: 'ltr',
    fontClass: 'font-sans',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    dir: 'ltr',
    fontClass: 'font-sans',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    dir: 'ltr',
    fontClass: 'font-sans'
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    dir: 'ltr',
    fontClass: 'font-sans'
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
  },
  zh: {
    'nav.title': '狮子家族数字命理学',
    'nav.subtitle': '优质印度数字命理学门户',
    'nav.occult': '神秘科学',
    'nav.reset': '重置资料',
    'nav.loadDemo': '🔮 加载专家模式',
    'tab.aiConsultation': 'AI 大咨询中心 🔮',
    'tab.mobileNumerology': '手机数字命理学',
    'tab.loshuGrid': '吠陀洛书格',
    'tab.marriageCompatibility': '婚姻兼容性',
    'tab.premiumConsultations': '瓦斯图与高级审核',
    'form.title': '求道者诞生与行星配置',
    'form.subtitle': '精确输入您的凭据，以匹配天体坐标系统。',
    'form.fullName': '全名（按注册拼写）',
    'form.fullNamePlaceholder': '例如 Raajeev Singh Chauhann',
    'form.dob': '出生日期（太阳日）',
    'form.mobile': '有效手机号码',
    'form.mobilePlaceholder': '例如 9930117696',
    'form.email': '安全电子邮件地址',
    'form.emailPlaceholder': '例如 contact@numerologysage.com',
    'form.gender': '性别对齐',
    'form.gender.male': '男性 (Surya)',
    'form.gender.female': '女性 (Chandra)',
    'form.gender.other': '非双人 (Mercury)',
    'form.submit': '生成宇宙数字命理审核',
    'form.submitting': '对齐行星辐射...',
    'meta.mulank': '九宫数 (Driver)',
    'meta.bhagyank': '命运数 (Conductor)',
    'error.invalidMobile': '请提供有效的手机号码以检查频率。',
    'error.requiredFields': '请填写所有要求的对齐坐标。',
    'pdf.download': '下载多语言 PDF 报告',
    'pdf.generating': '合成 PDF 报告...',
    'seo.tagline': '吠陀数字命理学和迦勒底频率。探索行星瑜伽、物质障碍和治疗频率。'
  },
  ja: {
    'nav.title': 'レオ・ファミリー数秘術',
    'nav.subtitle': 'プレミアム・インド数秘術ポータル',
    'nav.occult': 'オカルト科学',
    'nav.reset': 'プロフィールをリセット',
    'nav.loadDemo': '🔮 エキスパートパターンをロード',
    'tab.aiConsultation': 'AI 総合相談センター 🔮',
    'tab.mobileNumerology': '携帯数秘術',
    'tab.loshuGrid': 'ヴェーダ・ロシュ・グリッド',
    'tab.marriageCompatibility': '結婚の相性',
    'tab.premiumConsultations': 'ヴァーストゥ＆プレミアム監査',
    'form.title': '探求者の誕生と惑星の構成',
    'form.subtitle': '天体の座標系に合わせるために、登録された通りの資格情報を入力してください。',
    'form.fullName': 'フルネーム（登録通り）',
    'form.fullNamePlaceholder': '例：Raajeev Singh Chauhann',
    'form.dob': '生年月日（太陽暦）',
    'form.mobile': '有効な携帯電話番号',
    'form.mobilePlaceholder': '例：9930117696',
    'form.email': '安全なメールアドレス',
    'form.emailPlaceholder': '例：contact@numerologysage.com',
    'form.gender': 'ジェンダーアライメント',
    'form.gender.male': '男性 (Surya)',
    'form.gender.female': '女性 (Chandra)',
    'form.gender.other': 'ノンバイナリー (Mercury)',
    'form.submit': '宇宙の数秘術監査を生成する',
    'form.submitting': '惑星の放射線を調整しています...',
    'meta.mulank': 'ムーランク (Driver)',
    'meta.bhagyank': 'バギャンク (Conductor)',
    'error.invalidMobile': '周波数を確認するには、アクティブな携帯番号を入力してください。',
    'error.requiredFields': 'すべての必須項目を入力してください。',
    'pdf.download': '多言語 PDF レポートをダウンロード',
    'pdf.generating': 'PDFを合成しています...',
    'seo.tagline': 'ヴェーダ数秘術とカルデア周波数。惑星のヨガ、物質的な障害、そして癒しの周波数を探求。'
  },
  pt: {
    'nav.title': 'Numerologia da Família Leo',
    'nav.subtitle': 'Portal Premium de Numerologia Indiana',
    'nav.occult': 'Pegada Oculta',
    'nav.reset': 'Redefinir Perfil',
    'nav.loadDemo': '🔮 Carregar Padrão Especialista',
    'tab.aiConsultation': 'Grande Centro de Consulta IA 🔮',
    'tab.mobileNumerology': 'Numerologia Móvel',
    'tab.loshuGrid': 'Grade Védica Lo Shu',
    'tab.marriageCompatibility': 'Compatibilidade de Casamento',
    'tab.premiumConsultations': 'Vastu e Auditorias Premium',
    'form.title': 'Configuração de Nascimento e Planetária do Buscador',
    'form.subtitle': 'Insira suas credenciais exatamente como registradas para alinhar com os sistemas de coordenadas celestes.',
    'form.fullName': 'Nome Completo (Conforme registrado)',
    'form.fullNamePlaceholder': 'ex. Raajeev Singh Chauhann',
    'form.dob': 'Data de Nascimento (Dia Solar)',
    'form.mobile': 'Número de Celular Ativo',
    'form.mobilePlaceholder': 'ex. 9930117696',
    'form.email': 'Endereço de E-mail Seguro',
    'form.emailPlaceholder': 'ex. contato@numerologysage.com',
    'form.gender': 'Alinhamento de Gênero',
    'form.gender.male': 'Masculino (Surya)',
    'form.gender.female': 'Femenino (Chandra)',
    'form.gender.other': 'Não-Binário (Mercúrio)',
    'form.submit': 'Gerar Auditoria Numerológica Cósmica',
    'form.submitting': 'Alinhando Radiações Planetárias...',
    'meta.mulank': 'Mulank (Condutor)',
    'meta.bhagyank': 'Bhagyank (Destino)',
    'error.invalidMobile': 'Forneça um número de celular ativo para verificar as frequências.',
    'error.requiredFields': 'Preencha todos os campos de coordenadas solicitados.',
    'pdf.download': 'Baixar Relatório PDF Multilíngue',
    'pdf.generating': 'Sintetizando relatório PDF...',
    'seo.tagline': 'Numerologia védica e frequências caldeias. Explore yogas planetários, obstáculos materiais e frequências de cura.'
  },
  ta: {
    'nav.title': 'லியோ குடும்ப எண் கணிதம்',
    'nav.subtitle': 'பிரீமியம் இந்திய எண் கணித போர்டல்',
    'nav.occult': 'மறைபொருள் அறிவியல்',
    'nav.reset': 'சுயவிவரத்தை மீட்டமை',
    'nav.loadDemo': '🔮 நிபுணர் மாதிரியை ஏற்றுக',
    'tab.aiConsultation': 'AI மகா ஆலோசனை மையம் 🔮',
    'tab.mobileNumerology': 'கைப்பேসি எண் கணிதம்',
    'tab.loshuGrid': 'வேத லோ ஷு கட்டம்',
    'tab.marriageCompatibility': 'திருமணப் பொருத்தம்',
    'tab.premiumConsultations': 'வாஸ்து & பிரீமியம் தணிக்கைகள்',
    'form.title': 'தேடுபவரின் பிறப்பு மற்றும் கிரக கட்டமைப்பு',
    'form.subtitle': 'விண்ணப்பித்தவாறு விவரங்களைச் சரியாக உள்ளிடவும்.',
    'form.fullName': 'முழு பெயர் (பதிவு செய்யப்பட்டவாறு)',
    'form.fullNamePlaceholder': 'எ.கா. ராஜீவ் சிంగ్ சௌஹான்',
    'form.dob': 'பிறந்த தேதி (சூரிய நாள்)',
    'form.mobile': 'செயலில் உள்ள கைப்பேசி எண்',
    'form.mobilePlaceholder': 'எ.கா. 9930117696',
    'form.email': 'பாதுகாப்பான மின்னஞ்சல்',
    'form.emailPlaceholder': 'எ.கா. contact@numerologysage.com',
    'form.gender': 'பாலின சீரமைப்பு',
    'form.gender.male': 'ஆண் (சூர்யா)',
    'form.gender.female': 'பெண் (சந்திரா)',
    'form.gender.other': 'மூன்றாம் பாலினம் (புதன்)',
    'form.submit': 'பிரபஞ்ச எண் கணித தணிக்கையை உருவாக்கு',
    'form.submitting': 'கிரக கதிர்வீச்சுகளை சீரமைக்கிறது...',
    'meta.mulank': 'மூல எண் (டிரைவர்)',
    'meta.bhagyank': 'விதி எண் (கண்டக்டர்)',
    'error.invalidMobile': 'அலைவரிசையைச் சரிபார்க்க செயலில் உள்ள கைப்பேसी எண்ணை வழங்கவும்.',
    'error.requiredFields': 'தேவையான அனைத்து விவரங்களையும் நிரப்பவும்.',
    'pdf.download': 'பல்மொழி PDF அறிக்கையை பதிவிறக்கு',
    'pdf.generating': 'PDF அறிக்கையை உருவாக்குகிறது...',
    'seo.tagline': 'வேத எண் கணிதம் மற்றும் சால்டியன் அதிர்வெண்கள். கிரக யோகங்கள், பொருள் தடைகள் மற்றும் தீர்வு அதிர்வெண்களை ஆராயுங்கள்.'
  },
  te: {
    'nav.title': 'లియో ఫ్యామిలీ సంఖ్యాశాస్త్రం',
    'nav.subtitle': 'ప్రీమియం ఇండియన్ న్యూమరాలజీ పోర్టల్',
    'nav.occult': 'రహస్య శాస్త్రం',
    'nav.reset': 'ప్రొఫైల్ రీసెట్ చేయి',
    'nav.loadDemo': '🔮 నిపుణుల నమూనాను లోడ్ చేయి',
    'tab.aiConsultation': 'AI మహా సంప్రదింపుల కేంద్రం 🔮',
    'tab.mobileNumerology': 'మొబైల్ సంఖ్యాశాస్త్రం',
    'tab.loshuGrid': 'వైదిక లో షూ గ్రిడ్',
    'tab.marriageCompatibility': 'వివాహ అనుకూలత',
    'tab.premiumConsultations': 'వాస్తు & ప్రీమియం ఆడిట్లు',
    'form.title': 'సాధకుడి పుట్టుక మరియు గ్రహాల కాన్ఫిగరేషన్',
    'form.subtitle': 'ఖగోళ కోఆర్డినేట్ సిస్టమ్‌లతో సరిపోల్చడానికి మీ వివరాలను నమోదు చేయండి.',
    'form.fullName': 'పూర్తి పేరు (నమోదు చేసినట్లుగా)',
    'form.fullNamePlaceholder': 'ఉదా. రాజీవ్ సింగ్ చౌహాన్',
    'form.dob': 'పుట్టిన తేదీ (సౌర దినం)',
    'form.mobile': 'క్రియాశీల మొబైల్ సంఖ్య',
    'form.mobilePlaceholder': 'ఉదా. 9930117696',
    'form.email': 'సురక్షిత ఇమెయిల్ చిరునామా',
    'form.emailPlaceholder': 'ఉదా. contact@numerologysage.com',
    'form.gender': 'లింగ అమరిక',
    'form.gender.male': 'పురుషుడు (సూర్యుడు)',
    'form.gender.female': 'స్త్రీ (చంద్రుడు)',
    'form.gender.other': 'ఇతర (బుధుడు)',
    'form.submit': 'కాస్మిక్ న్యూమరాలజీ ఆడిట్‌ను రూపొందించు',
    'form.submitting': 'గ్రహాల రేడియేషన్లను సమలేఖనం చేస్తోంది...',
    'meta.mulank': 'మూలాంకం (డ్రైవర్)',
    'meta.bhagyank': 'భాగ్యాంకం (కండక్టర్)',
    'error.invalidMobile': 'ఫ్రీక్వెన్సీలను తనిఖీ చేయడానికి దయచేసి క్రియాశీల మొబైల్ సంఖ్యను అందించండి.',
    'error.requiredFields': 'దయచేసి అడిగిన అన్ని కోఆర్డినేట్లను పూరించండి.',
    'pdf.download': 'బహుభాషా PDF నివేదికను డౌన్‌లోడ్ చేయి',
    'pdf.generating': 'PDF నివేదికను సిద్ధం చేస్తోంది...',
    'seo.tagline': 'వైదిక సంఖ్యాశాస్త్రం మరియు చాల్డియన్ ఫ్రీక్వెన్సీలు. గ్రహాల యోగాలు, మెటీరియల్ అడ్డంకులు మరియు నివారణ ఫ్రీక్వెన్సీలను అన్వేషించండి.'
  },
  bn: {
    'nav.title': 'লিও ফ্যামিলি সংখ্যাতত্ত্ব',
    'nav.subtitle': 'প্রিমিয়াম ইন্ডিয়ান নিউমারোলজি পোর্টাল',
    'nav.occult': 'গুপ্ত বিজ্ঞান',
    'nav.reset': 'প্রোফাইল রিসেট করুন',
    'nav.loadDemo': '🔮 বিশেষজ্ঞ প্যাটার্ন লোড করুন',
    'tab.aiConsultation': 'এআই মহাকনসাল্টেশন হাব 🔮',
    'tab.mobileNumerology': 'মোবাইল সংখ্যাতত্ত্ব',
    'tab.loshuGrid': 'বৈদিক লো শু গ্রিড',
    'tab.marriageCompatibility': ' can বিবাহের সামঞ্জস্যতা',
    'tab.premiumConsultations': 'বাস্তু ও প্রিমিয়াম অডিট',
    'form.title': 'সাধকের জন্ম ও গ্রহের বিন্যাস',
    'form.subtitle': 'মহাজাগতিক স্থানাঙ্ক সিস্টেমের সাথে মেলানোর জন্য আপনার বিবরণগুলি সঠিকভাবে লিখুন।',
    'form.fullName': 'পূর্ণ নাম (নিবন্ধিত বানান অনুযায়ী)',
    'form.fullNamePlaceholder': 'উদা. রাজীব সিং চৌহান',
    'form.dob': 'জন্ম তারিখ (সৌর দিন)',
    'form.mobile': 'সক্রিয় মোবাইল নম্বর',
    'form.mobilePlaceholder': 'উদা. 9930117696',
    'form.email': 'সুরক্ষিত ইমেল ঠিকানা',
    'form.emailPlaceholder': 'উদা. contact@numerologysage.com',
    'form.gender': 'লিঙ্গ সামঞ্জস্য',
    'form.gender.male': 'পুরুষ (সূর্য)',
    'form.gender.female': 'মহিলা (চন্দ্র)',
    'form.gender.other': 'অন্যান্য (বুধ)',
    'form.submit': 'মহাজাগতিক সংখ্যাতত্ত্ব অডিট তৈরি করুন',
    'form.submitting': 'গ্রহের বিকিরণ সামঞ্জস্য করা হচ্ছে...',
    'meta.mulank': 'মূলাঙ্ক (ড্রাইভার)',
    'meta.bhagyank': 'ভাগ্যাঙ্ক (কন্ডাক্টর)',
    'error.invalidMobile': 'ফ্রিকোয়েন্সি চেক করতে অনুগ্রহ করে একটি सक्रिय মোবাইল নম্বর দিন।',
    'error.requiredFields': 'অনুগ্রহ করে সমস্ত প্রয়োজনীয় বিবরণ পূরণ করুন।',
    'pdf.download': 'বহুভাষিক PDF রিপোর্ট ডাউনলোড করুন',
    'pdf.generating': 'PDF রিপোর্ট তৈরি হচ্ছে...',
    'seo.tagline': 'বৈদিক সংখ্যাতত্ত্ব এবং চালডীয় ফ্রিকোয়েন্সি। গ্রহের যোগ, বস্তুগত বাধা এবং প্রতিকারমূলক ফ্রিকোয়েন্সি অন্বেষণ করুন।'
  },
  de: {
    'nav.title': 'Leo Familien-Numerologie',
    'nav.subtitle': 'Premium Indisches Numerologie-Portal',
    'nav.occult': 'Okkulte Wissenschaft',
    'nav.reset': 'Profil zurücksetzen',
    'nav.loadDemo': '🔮 Expertenmuster laden',
    'tab.aiConsultation': 'Großes KI-Konsultationszentrum 🔮',
    'tab.mobileNumerology': 'Handy-Numerologie',
    'tab.loshuGrid': 'Vedisches Lo-Shu-Gitter',
    'tab.marriageCompatibility': 'Ehe-Kompatibilität',
    'tab.premiumConsultations': 'Vastu & Premium-Audits',
    'form.title': 'Geburts- und Planetenkonfiguration des Suchenden',
    'form.subtitle': 'Geben Sie Ihre Daten genau wie registriert ein, um sie mit den Himmelskoordinaten abzugleichen.',
    'form.fullName': 'Vollständiger Name (wie registriert)',
    'form.fullNamePlaceholder': 'z.B. Raajeev Singh Chauhann',
    'form.dob': 'Geburtsdatum (Solartag)',
    'form.mobile': 'Aktive Mobiltelefonnummer',
    'form.mobilePlaceholder': 'z.B. 9930117696',
    'form.email': 'Sichere E-Mail-Adresse',
    'form.emailPlaceholder': 'z.B. contact@numerologysage.com',
    'form.gender': 'Geschlechtsausrichtung',
    'form.gender.male': 'Männlich (Surya)',
    'form.gender.female': 'Weiblich (Chandra)',
    'form.gender.other': 'Nicht-Binär (Merkur)',
    'form.submit': 'Kosmisches Numerologie-Audit generieren',
    'form.submitting': 'Planetenstrahlungen ausrichten...',
    'meta.mulank': 'Mulank (Fahrer)',
    'meta.bhagyank': 'Bhagyank (Führer)',
    'error.invalidMobile': 'Bitte geben Sie eine aktive Mobiltelefonnummer an.',
    'error.requiredFields': 'Bitte füllen Sie alle erforderlichen Koordinaten aus.',
    'pdf.download': 'Mehrsprachigen PDF-Bericht herunterladen',
    'pdf.generating': 'PDF-Bericht wird generiert...',
    'seo.tagline': 'Vedische Numerologie und Chaldäische Frequenzen. Erforschen Sie planetarische Yogas, materielle Hindernisse und heilende Schwingungen.'
  },
  ru: {
    'nav.title': 'Семейная Нумерология Лео',
    'nav.subtitle': 'Премиум Портал Индийской Нумерологии',
    'nav.occult': 'Оккультные Науки',
    'nav.reset': 'Сбросить профиль',
    'nav.loadDemo': '🔮 Загрузить шаблон эксперта',
    'tab.aiConsultation': 'Центр Гранд-Консультаций ИИ 🔮',
    'tab.mobileNumerology': 'Мобильная Нумерология',
    'tab.loshuGrid': 'Ведическая сетка Ло Шу',
    'tab.marriageCompatibility': 'Совместимость в браке',
    'tab.premiumConsultations': 'Васту и Премиум-Аудит',
    'form.title': 'Конфигурация рождения и планет искателя',
    'form.subtitle': 'Введите ваши учетные данные точно так, как они зарегистрированы, чтобы соответствовать системам небесных координат.',
    'form.fullName': 'Полное имя (как зарегистрировано)',
    'form.fullNamePlaceholder': 'например, Raajeev Singh Chauhann',
    'form.dob': 'Дата рождения (солнечный день)',
    'form.mobile': 'Активный мобильный номер',
    'form.mobilePlaceholder': 'например, 9930117696',
    'form.email': 'Безопасный адрес электронной почты',
    'form.emailPlaceholder': 'например, contact@numerologysage.com',
    'form.gender': 'Гендерное выравнивание',
    'form.gender.male': 'Мужской (Сурья)',
    'form.gender.female': 'Женский (Чандра)',
    'form.gender.other': 'Небинарный (Меркурий)',
    'form.submit': 'Создать космический нумерологический аудит',
    'form.submitting': 'Выравнивание планетарных излучений...',
    'meta.mulank': 'Муланк (Водитель)',
    'meta.bhagyank': 'Бхагьянк (Проводник)',
    'error.invalidMobile': 'Пожалуйста, укажите активный мобильный номер для проверки частот.',
    'error.requiredFields': 'Пожалуйста, заполните все запрашиваемые поля.',
    'pdf.download': 'Скачать многоязычный PDF-отчет',
    'pdf.generating': 'Синтез PDF-отчета...',
    'seo.tagline': 'Ведическая нумерология и халдейские частоты. Исследуйте планетные йоги, материальные препятствия и лечебные частоты.'
  }
};

// Helper to auto-detect language based on browser/hash/cookie
export const detectLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  
  // 1. Check URL hash or path first for SEO routing
  const hash = window.location.hash;
  const path = window.location.pathname;
  
  const seoLang = [path, hash].map(s => {
    const match = s.match(/\/(en|hi|gu|mr|es|fr|ar|zh|ja|pt|ta|te|bn|de|ru)(\/|#|$)/);
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
