// import { createContext, useContext, useEffect, useState } from "react";
// import en from "../translations/en.json";
// import { applyParams, getNestedValue } from "..";

// type LanguageContextType = {
//   lang: string;
//   setLang: (lang: string) => void;
//   t: (key: string, params?: Record<string, any>) => string;
// };

// //register languages
// const translationFiles = { en };

// const LanguageContext = createContext<LanguageContextType>({
//   lang: "en",
//   setLang: () => {},
//   t: () => "",
// });

// const DEFAULT_LANG = "en";

// export const LanguageProvider = ({ childern }) => {
//   //load from lacal storage or default language
//   const [lang, setLang] = useState(localStorage.getItem("lang") || DEFAULT_LANG);

//   useEffect(() => {
//     localStorage.setItem("lang", lang);
//   }, [lang]);

//   // main translation function
//   const t = (key, params = {}) => {
//     const langFile = translationFiles[lang];
//     const fallBackFile = translationFiles[DEFAULT_LANG];

//     let value = getNestedValue(langFile, key);

//     // fallback to english if misssing
//     if (!value) value = getNestedValue(fallBackFile, key) || key;

//     //apply dynamic params
//     value = applyParams(value, params);

//     return value;
//   };

//   return <LanguageContext.Provider value={{ lang, setLang, t }}>{childern}</LanguageContext.Provider>;
// };

// export const useLanguage = () => useContext(LanguageContext);

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import en from "@/language/translations/en.json";
import es from "@/language/translations/es.json";
import fr from "@/language/translations/fr.json";
import { applyParams, getNestedValue } from "..";

const translationFiles = { en, es, fr };

const DEFAULT_LANG = "en";

// Define Type
type LanguageContextType = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
};

// Create context with default fallback
const LanguageContext = createContext<LanguageContextType>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: () => "",
});

// Component props type
interface ProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: ProviderProps) => {
  const [lang, setLang] = useState(localStorage.getItem("lang") || DEFAULT_LANG);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = (key: string, params = {}) => {
    const langFile = translationFiles[lang];
    const fallbackFile = translationFiles[DEFAULT_LANG];

    let value = getNestedValue(langFile, key);

    if (!value) value = getNestedValue(fallbackFile, key) || key;

    return applyParams(value, params);
  };

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
