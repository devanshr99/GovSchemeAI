import { TranslationType } from './en';

export const hi: TranslationType = {
  // Navigation & Layout
  title: "GovSchemeAI",
  subtitle: "राष्ट्रीय सरकारी योजना पोर्टल",
  findSchemes: "पात्रता जांचें",
  browseSchemes: "सभी योजनाएं",
  chatAssistant: "योजना सलाहकार",
  about: "पोर्टल परिचय",
  adminPanel: "प्रशासन",
  logout: "लॉगआउट",
  navMenuLabel: "मुख्य नेविगेशन मेनू",
  langPickerLabel: "भाषा बदलें",
  activeLangLabel: "सक्रिय भाषा हिन्दी है",
  comingSoon: "शीघ्र उपलब्ध",
  back: "पीछे जाएं",

  // Landing / Hero Section
  heroTitle: "अपनी पात्रता के अनुसार सरकारी योजनाएं खोजें",
  heroSubtitle: "अपनी प्रोफाइल दर्ज करें और केंद्र व राज्य सरकार की आधिकारिक योजनाओं में अपनी पात्रता का मूल्यांकन करें।",
  startChecking: "योजना पात्रता जांचें",
  schemesChecked: "योजनाएं सूचीबद्ध",
  eligibleMatches: "पात्र योजनाएं मिलीं",
  activeSchemes: "सक्रिय योजनाएं",
  categories: "क्षेत्र",

  // Profile Form Labels & Attributes
  formHeading: "नागरिक पात्रता प्रश्नावली",
  formSubheading: "स्थानीय नियमों के अनुसार मूल्यांकन किया गया। कोई व्यक्तिगत डेटा संग्रहीत नहीं होता।",
  labelAge: "आयु (वर्ष)",
  labelGender: "लिंग",
  genderMale: "पुरुष",
  genderFemale: "महिला",
  genderOther: "अन्य",
  labelState: "राज्य / केंद्र शासित प्रदेश",
  labelDistrict: "जिला",
  labelOccupation: "व्यवसाय श्रेणी",
  labelAnnualIncome: "वार्षिक पारिवारिक आय (₹)",
  labelCategory: "सामाजिक वर्ग",
  categoryGeneral: "सामान्य",
  categoryObc: "अन्य पिछड़ा वर्ग (OBC)",
  categorySc: "अनुसूचित जाति (SC)",
  categorySt: "अनुसूचित जनजाति (ST)",
  labelDisability: "दिव्यांग व्यक्ति (PwD)",
  labelBpl: "बीपीएल कार्ड (BPL Card)",
  labelFarmer: "किसान / कृषि श्रमिक",
  labelLand: "कृषि भूमि (हेक्टेयर में)",
  labelStudent: "छात्र / विद्यार्थी",
  labelWoman: "महिला लाभार्थी",
  labelSenior: "वरिष्ठ नागरिक (60+)",
  buttonCheck: "योजना पात्रता जांचें",
  buttonChecking: "मूल्यांकन जारी है...",
  resetForm: "प्रश्नावली रीसेट करें",

  // Occupations List
  occupationFarmer: "किसान / कृषि",
  occupationStudent: "छात्र / विद्यार्थी",
  occupationHomemaker: "गृहणी",
  occupationUnemployed: "बेरोजगार / रोजगारप्रार्थी",
  occupationSalaried: "वेतनभोगी कर्मचारी",
  occupationBusiness: "व्यवसायी / स्वरोजगार (MSME)",
  occupationLaborer: "दिहाड़ी मजदूर",

  // Form Validation & Errors
  valAgeMin: "आयु नकारात्मक नहीं हो सकती",
  valAgeMax: "आयु 120 वर्ष से अधिक नहीं हो सकती",
  valIncomeMin: "वार्षिक आय नकारात्मक नहीं हो सकती",
  valLandMin: "भूमि जोत नकारात्मक नहीं हो सकती",
  backendOfflineError: "पोर्टल सर्वर से संपर्क नहीं हो पा रहा है। कृपया अपने इंटरनेट कनेक्शन की जांच करें।",
  generalFormError: "पात्रता मूल्यांकन में त्रुटि हुई। कृपया पुनः प्रयास करें।",

  // Results & Schemes Card UI
  matchedResults: "आपकी पात्र सरकारी योजनाएं",
  matchScore: "पात्रता स्कोर",
  benefits: "योजना लाभ",
  documents: "आवश्यक दस्तावेज",
  applicationProcess: "आवेदन प्रक्रिया",
  applyNow: "आधिकारिक आवेदन लिंक",
  helpline: "टोल-फ्री हेल्पलाइन",
  deadline: "आवेदन की अंतिम तिथि",
  explainWhy: "नियम विश्लेषण",
  close: "बंद करें",
  aiSummaryTitle: "पात्रता मूल्यांकन विवरण",
  noDeadline: "खुली / निरंतर योजना",
  loadingSchemes: "योजना रिकॉर्ड लोड हो रहे हैं...",
  noSchemesFound: "आपके मापदंडों के अनुसार कोई योजना नहीं मिली।",
  emptyStatesTitle: "कोई योजना नहीं मिली",
  emptyStatesDesc: "कृपया अपने खोज शब्द, राज्य या वर्ग फ़िल्टर बदलें।",
  loadMore: "और योजनाएं देखें",

  // Chat Interface
  chatPromptPlaceholder: "आवेदन चरण, दस्तावेज़ या नियमों के बारे में पूछें...",
  chatWelcome: "डिजिटल योजना सलाहकार में आपका स्वागत है। मैं केंद्र और राज्य सरकार की योजनाओं, पात्रता नियमों और आवेदन प्रक्रियाओं से संबंधित आपके प्रश्नों का उत्तर दे सकता हूं।",
  chatSources: "आधिकारिक स्रोत",
  chatSending: "जानकारी खोजी जा रही है...",
  chatError: "सेवा अस्थायी रूप से अनुपलब्ध है। कृपया पुनः प्रयास करें।",
  searchPlaceholder: "योजना का नाम, मंत्रालय या शब्द खोजें...",
  filterLevel: "सरकारी स्तर",
  filterCategory: "लक्ष्य क्षेत्र",
  allLevels: "सभी स्तर",
  central: "केंद्र सरकार",
  state: "राज्य सरकार",
  allCategories: "सभी क्षेत्र",

  // Offline / Error States UI
  offlineTitle: "नेटवर्क संपर्क टूटा",
  offlineDesc: "कृपया अपना इंटरनेट कनेक्शन जांचें। कुछ सुविधाएं निलंबित हो सकती हैं।",
  retryBtn: "पुनः प्रयास करें",
  successMessage: "जानकारी सफलतापूर्वक सहेजी गई!",
  errorTitle: "अनपेक्षित त्रुटि",
  errorDesc: "कुछ गलत हो गया। कृपया पृष्ठ को रीफ़्रेश करें।",

  // Accessibility Announcements
  loadingIndicator: "सामग्री लोड हो रही है, कृपया प्रतीक्षा करें...",
  profileResetAnnounce: "प्रोफाइल डेटा सफलतापूर्वक साफ कर दिया गया है",
  langChangedAnnounce: "भाषा सफलतापूर्वक बदल दी गई है"
};

