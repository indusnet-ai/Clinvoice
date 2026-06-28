// CountryFlag.tsx

import { FLAG_MAP } from "@/data/FlagMap";

export const CountryFlag = ({ code }: { code: string }) => {
  const Flag = FLAG_MAP[code];

  if (!Flag) return null;

  return <Flag className="w-5 h-4 rounded-sm" />;
};
