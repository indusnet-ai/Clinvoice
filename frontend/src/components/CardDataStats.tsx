import React, { ReactNode } from 'react';
import StatsIc from '../images/StatsIc.png';

interface ColorSchema {
  light: string;
  dark: string;
}

interface CardDataStatsProps {
  count: ReactNode;
  title: string;
  total: string;
  color: ColorSchema;
  // children: ReactNode;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
  count,
  title,
  total,
  color,
}) => {
  const { light, dark } = color;
  return (
    <div
      className="rounded-xl py-5 px-7.5 dark:border-strokedark dark:bg-boxdark  mt-2 shadow-1"
      style={{ backgroundColor: light }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11.5 w-11.5 items-center justify-center rounded-full  dark:bg-meta-4"
          style={{ backgroundColor: dark }}
        >
          <img src={StatsIc} alt="stats icon" />
        </div>
        <h2 className="text-[#1C2253] font-bold text-2xl">{count}</h2>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <h4
            className="text-title-xxsm font-bold mb-1"
            style={{ color: dark }}
          >
            {total}
          </h4>
          {title && (
            <span className="text-sm font-medium text-[#6070FF]">{title}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDataStats;
