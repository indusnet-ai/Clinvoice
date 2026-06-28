import React from "react";
import NodataImg from "@/assets/imgs/searching_nodata.png";
import { useLanguage } from "@/language/context/LanguageContext";

export const NoDataFallBack = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <img src={NodataImg} alt="no data found" className="w-56 mb-4 opacity-90 mx-auto" />
      <p className="text-[#01030F] text-[14px] font-medium">{t("noDataFallBack.text")}</p>
    </div>
  );
};
