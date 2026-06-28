import { useLanguage } from "../context/LanguageContext";

export const useTranslate = () => {
  const { t } = useLanguage();
  return t;
};
