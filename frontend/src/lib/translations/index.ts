import { en } from './en';
import { hi } from './hi';

export const translations = {
  en,
  hi,
  // Future-ready regional language placeholders falling back to English structure
  bn: en, // Bengali
  mr: en, // Marathi
  gu: en, // Gujarati
  ta: en, // Tamil
  te: en, // Telugu
  kn: en, // Kannada
  ml: en, // Malayalam
  pa: en, // Punjabi
  or: en, // Odia
  as: en, // Assamese
  ur: en  // Urdu
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof en;

export const LANGUAGE_NAMES: Record<Language, { name: string; nativeName: string; isActive: boolean }> = {
  en: { name: "English", nativeName: "English", isActive: true },
  hi: { name: "Hindi", nativeName: "हिन्दी", isActive: true },
  bn: { name: "Bengali", nativeName: "বাংলা", isActive: false },
  mr: { name: "Marathi", nativeName: "मराठी", isActive: false },
  gu: { name: "Gujarati", nativeName: "ગુજરાતી", isActive: false },
  ta: { name: "Tamil", nativeName: "தமிழ்", isActive: false },
  te: { name: "Telugu", nativeName: "తెలుగు", isActive: false },
  kn: { name: "Kannada", nativeName: "ಕನ್ನಡ", isActive: false },
  ml: { name: "Malayalam", nativeName: "മലയാളം", isActive: false },
  pa: { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", isActive: false },
  or: { name: "Odia", nativeName: "ଓଡ଼ିଆ", isActive: false },
  as: { name: "Assamese", nativeName: "অসমীয়া", isActive: false },
  ur: { name: "Urdu", nativeName: "اردو", isActive: false }
};
