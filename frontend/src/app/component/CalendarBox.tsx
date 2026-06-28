import { LeftArrowIcon } from "@/assets/icons";
import React, { useEffect, useState } from "react";

interface DatePickerProps {
  selectedDate: Date | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
}

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, setSelectedDate }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  useEffect(() => {
    buildWeek();
  }, [weekOffset]);

  const isSameDay = (a?: Date | null, b?: Date | null) => !!a && !!b && a.toDateString() === b.toDateString();

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay() || 7; // Sunday = 7
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const normalizeDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // prevents day shift
    return d;
  };

  const buildWeek = () => {
    const start = getStartOfWeek(new Date());
    start.setDate(start.getDate() + weekOffset * 7);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return normalizeDate(d);
    });

    setWeekDates(days);
  };

  const monthLabel = [...new Set(weekDates.map((d) => d.toLocaleString("default", { month: "long" })))].join(" / ");
  const yearLabel = [...new Set(weekDates.map((d) => d.getFullYear()))].join(" / ");

  return (
    <div className="w-full flex">
      <div className="max-w-3xl bg-white shadow-xs rounded-xl p-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between ">
          <button onClick={() => setWeekOffset((w) => w - 1)}>
            <LeftArrowIcon />
          </button>

          <span className="font-medium text-[14px] text-gray-900 text-center">
            {monthLabel} <br /> {yearLabel}
          </span>

          <button onClick={() => setWeekOffset((w) => w + 1)}>
            <LeftArrowIcon className="rotate-180" />
          </button>
        </div>

        {/* Week Days */}
        <div className="flex justify-between mt-2">
          {weekDates.map((date, idx) => {
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`w-[39px] h-12 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all
                  ${
                    isSelected
                      ? "bg-[#6070FF] text-white font-semibold"
                      : isToday
                      ? "border border-[#6070FF] text-[#6070FF]"
                      : "text-gray-800 hover:bg-[#6070FF]/10"
                  }
                `}
              >
                <span className="text-base font-medium">{date.getDate()}</span>
                <span className="text-[12px] font-medium">
                  {date.toLocaleDateString("default", { weekday: "short" })}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Date */}
        {/* <div className="mt-4 text-center font-medium text-gray-800">{selectedDate?.toLocaleDateString()}</div> */}
      </div>
    </div>
  );
};
