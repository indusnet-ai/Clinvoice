// export const ProcessingView = () => (
//   <div className="flex flex-col items-center gap-3">
//     <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
//     <p className="text-sm text-gray-600">Processing your consultation...</p>
//   </div>
// );

import { useLanguage } from "@/language/context/LanguageContext";
import { useEffect, useState } from "react";
import { Bot } from "lucide-react"; // or your own robot icon

export const ProcessingView = () => {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  const MESSAGES = [
    t("consultation.processing.listening"),
    t("consultation.processing.transcribing"),
    t("consultation.processing.structuring"),
    t("consultation.processing.analyzing"),
    t("consultation.processing.preparing"),
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      {/* AI Pulse */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping" />
        <div className="relative h-14 w-14 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
          <Bot className="text-white h-7 w-7 animate-float" />
        </div>
      </div>

      {/* Dynamic Message */}
      <p className="text-sm font-medium text-gray-700 transition-opacity duration-500">{MESSAGES[index]}</p>

      {/* Typing dots */}
      <div className="flex gap-1">
        <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
        <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.1s]" />
        <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
};
