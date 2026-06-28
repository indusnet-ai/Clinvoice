import React from "react";
import { StatisticIcon } from "@/assets/icons";
import { useLanguage } from "@/language/context/LanguageContext";

interface StatCardProps {
  value: number | string;
  label: string;
  changePercent: number;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, changePercent }) => {
  const { t } = useLanguage();
  
  // Validate and format percentage value
  const formatPercentage = (percent: number): string => {
    // Handle invalid values
    if (percent === null || percent === undefined || isNaN(percent) || !isFinite(percent)) {
      return "0";
    }
    // Round to 1 decimal place
    return percent.toFixed(1);
  };

  const formattedPercent = formatPercentage(changePercent);
  const numericPercent = parseFloat(formattedPercent);
  const isPositive = numericPercent >= 0;

  // Ensure value is never undefined
  const displayValue = value ?? 0;

  return (
    <div className="bg-[#E9EAFF] rounded-xl p-4 flex flex-col gap-y-1 w-full">
      <div className="flex items-center gap-1.5">
        <div className="bg-[#B2B9FF] p-2 rounded-full">
          <StatisticIcon />
        </div>

        <h1 className="text-[24px] text-[#01030F] font-semibold">{displayValue}</h1>
      </div>

      <p className="text-[14px] text-[#01030F] font-medium">{label}</p>

      <p className="text-[12px] font-medium text-[#4079ED]">
        <span className={isPositive ? "text-[#16A34A]" : "text-[#DC2626]"}>{formattedPercent}%</span> {t("appointment.stats.ofTotal")}
      </p>
    </div>
  );
};
