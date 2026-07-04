'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { EligibilityRequest, EligibilityResponse } from '../types/eligibility';
import { Language, translations } from '../lib/translations';
import { api } from '../lib/api';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  profile: EligibilityRequest | null;
  setProfile: (prof: EligibilityRequest | null) => void;
  results: EligibilityResponse | null;
  setResults: (res: EligibilityResponse | null) => void;
  t: (key: keyof typeof translations.en) => string;
  loading: boolean;
  setLoading: (l: boolean) => void;
  checkEligibility: (profileData: EligibilityRequest) => Promise<EligibilityResponse>;
  announce: (message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [profile, setProfileState] = useState<EligibilityRequest | null>(null);
  const [results, setResultsState] = useState<EligibilityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>('');

  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear after speech is synthesized to permit identical sequential updates
    setTimeout(() => setAnnouncement(''), 1500);
  };

  useEffect(() => {
    // Only runs on client — restore saved language and profile
    if (typeof window === 'undefined') return;
    let storedLang = localStorage.getItem('govscheme_lang') as Language;
    if (!storedLang) {
      storedLang = localStorage.getItem('yojana_lang') as Language;
    }
    if (storedLang && translations[storedLang]) {
      setLanguageState(storedLang);
      document.documentElement.lang = storedLang;
    }
    const storedProfile = api.getProfileFromStorage();
    if (storedProfile) {
      setProfileState(storedProfile);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('govscheme_lang', lang);
      document.documentElement.lang = lang;
    }
    
    // Announce locale change to screen readers
    const alertMsg = lang === 'hi' ? 'भाषा बदलकर हिंदी कर दी गई है' : `Language switched to ${lang.toUpperCase()}`;
    announce(alertMsg);

    if (profile) {
      const updatedProfile = { ...profile, language: (lang === 'hi' ? 'hi' : 'en') as 'en' | 'hi' };
      setProfileState(updatedProfile);
      api.saveProfileToStorage(updatedProfile);
    }
  };

  const setProfile = (prof: EligibilityRequest | null) => {
    setProfileState(prof);
    if (prof) {
      api.saveProfileToStorage(prof);
    } else {
      api.clearProfileFromStorage();
      setResultsState(null);
      announce(language === 'hi' ? 'प्रोफ़ाइल साफ़ कर दी गई है' : 'Profile reset successfully');
    }
  };

  const setResults = (res: EligibilityResponse | null) => {
    setResultsState(res);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language]?.[key] || translations.en[key] || '';
  };

  const checkEligibility = async (profileData: EligibilityRequest): Promise<EligibilityResponse> => {
    setLoading(true);
    try {
      const res = await api.checkEligibility(profileData);
      setResults(res);
      setProfile(profileData);
      announce(language === 'hi' ? 'पात्रता मिलान पूरा हो गया है' : 'Eligibility scanning complete');
      return res;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        profile,
        setProfile,
        results,
        setResults,
        t,
        loading,
        setLoading,
        checkEligibility,
        announce
      }}
    >
      {children}
      
      {/* Screen Reader Accessible Announcer (visually hidden) */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only absolute w-1 h-1 p-0 -m-1 overflow-hidden clip-rect"
      >
        {announcement}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
