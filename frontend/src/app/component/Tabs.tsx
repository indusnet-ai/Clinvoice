import { useLanguage } from "@/language/context/LanguageContext";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export interface TabItem {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: TabItem[];
  value?: string;
  defaultTab?: string;
  onChange?: (tab: TabItem) => void;
  containerClassName?: string;
  buttonClassName?: string;
  syncWithUrl?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  value,
  defaultTab,
  onChange,
  containerClassName = "",
  buttonClassName = "min-w-[151px] font-medium text-[14px]",
  syncWithUrl = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getInitialTab = () => {
    if (value) return value;
    if (syncWithUrl && location.hash) return location.hash;
    return defaultTab || tabs[0]?.value;
  };
  const [internalTab, setInternalTab] = useState(getInitialTab);
  const activeTab = value ?? internalTab;

  // Sync tab when URL hash changes (back/forward/refresh)
  useEffect(() => {
    if (syncWithUrl && location.hash && location.hash !== activeTab) {
      setInternalTab(location.hash);
    }
  }, [location.hash]);

  const handleTabChange = (tab: TabItem) => {
    setInternalTab(tab.value);

    if (syncWithUrl) {
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: tab.value,
        },
        { replace: true }
      );
    }

    onChange?.(tab);
  };

  return (
    <div className={`p-2 bg-white rounded-lg flex gap-x-2 ${containerClassName}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab)}
            className={`min-h-[38px] cursor-pointer rounded-lg transition-all
              ${
                isActive
                  ? "bg-[#EEF2FF] text-[#6070FF]"
                  : "bg-[#FDFDFD] text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#6070FF]"
              }
              ${buttonClassName}
            `}
          >
            {t(`tabs.${tab.label}`)}
          </button>
        );
      })}
    </div>
  );
};
