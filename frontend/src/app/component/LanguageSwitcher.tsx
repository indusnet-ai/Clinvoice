import { useLanguage } from "@/language/context/LanguageContext";

export const LangSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <select
      className="text-[12px] font-medium text-[#01030F] outline-none border-none focus:outline-none focus:ring-0"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      style={{ padding: "6px" }}
    >
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
    </select>
  );
};
