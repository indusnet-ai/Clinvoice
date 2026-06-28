import React from "react";

type Props = {
  title: React.ReactNode;
  expanded: boolean;
  headerRight?: React.ReactNode;

  children: React.ReactNode;

  maxHeightClassName?: string;
  className?: string;
};

export const InvestigationCard: React.FC<Props> = ({
  title,
  expanded,
  headerRight,
  children,
  maxHeightClassName = "max-h-[800px]",
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-xl p-4 ${className}`}>
      <div className="flex bg-[#B8BFFF] items-center px-2 py-[15px] rounded-md justify-between">
        <p className="text-[#01030F] text-xs font-semibold">{title}</p>
        {headerRight ? <div>{headerRight}</div> : null}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? `${maxHeightClassName} opacity-100` : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};
