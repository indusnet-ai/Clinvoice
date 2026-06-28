import { LeftArrowIcon } from "@/assets/icons";
import React, { useState, useEffect } from "react";
import { formatDateForDisplay } from "@/utils";

interface Day {
  weekday: string;
  ordinal: string;
  active: boolean;
  currentDayToday: boolean;
  actual: Date;
}

interface DatePickerProps {
  selectedDate: any;
  setSelectedDate: React.Dispatch<React.SetStateAction<any>>;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, setSelectedDate }) => {
  const [i, setI] = useState<number>(0);
  const [year, setYear] = useState<string[]>([]);
  const [month, setMonth] = useState<string[]>([]);
  const [week, setWeek] = useState<Day[]>([]);

  useEffect(() => {
    getWeekBlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const getWeekdayName = (date: Date): string => {
    return date.toLocaleDateString("default", { weekday: "short" });
  };

  const getOrdinalNum = (n: number): string => {
    return n + (n > 0 ? ["th", "st", "nd", "rd"][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : "");
  };

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const getWeekBlock = (): void => {
    const today = new Date();
    const prevMonday = new Date(today);
    const n = today.getDay();
    prevMonday.setDate(today.getDate() - (n - 1) + i * 7);

    const newWeek: Day[] = [];
    const newMonth: string[] = [];
    const newYear: string[] = [];

    for (let j = 0; j < 7; j++) {
      const day = addDays(prevMonday, j);
      const currentDayToday = today.toDateString() === day.toDateString();

      newWeek.push({
        weekday: getWeekdayName(day),
        ordinal: getOrdinalNum(day.getDate()),
        active: selectedDate?.actual?.toDateString() === day.toDateString(),
        currentDayToday,
        actual: new Date(day.setHours(0, 0, 0, 0)),
      });

      const monthStr = day.toLocaleString("default", { month: "long" });
      const yearStr = day.toLocaleString("default", { year: "numeric" });

      if (!newMonth.includes(monthStr)) newMonth.push(monthStr);
      if (!newYear.includes(yearStr)) newYear.push(yearStr);
    }

    setWeek(newWeek);
    setMonth(newMonth);
    setYear(newYear);
  };

  const getNextWeek = (): void => setI(i + 1);
  const getPreviousWeek = (): void => setI(i - 1);

  const handleActiveDay = (activeDay: Day): void => {
    setSelectedDate(activeDay);
    const updatedWeek = week.map((day) =>
      day.actual.toDateString() === activeDay.actual.toDateString()
        ? { ...day, active: true }
        : { ...day, active: false },
    );
    setWeek(updatedWeek);
  };

  return (
    <div className="w-full flex  px-4 sm:px-6 md:px-8 mt-4">
      <div className=" max-w-3xl bg-white shadow-lg rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={getPreviousWeek} className="text-gray-500 hover:text-gray-700" aria-label="Previous week">
            <LeftArrowIcon />
          </button>

          <span className="text-gray-900 text-sm sm:text-base font-medium">
            {month.join(" / ")} {year.join(" / ")}
          </span>

          <button onClick={getNextWeek} className="text-gray-500 hover:text-gray-700" aria-label="Next week">
            <LeftArrowIcon className="rotate-180" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="flex justify-between min-w-[420px] sm:min-w-0">
            {week.map((day, index) => (
              <div
                key={index}
                onClick={() => handleActiveDay(day)}
                className={`flex flex-col items-center justify-center w-12 h-16 rounded-md cursor-pointer mx-1 transition-all
                ${
                  day.active
                    ? "bg-[#6070FF] text-white font-semibold"
                    : "text-gray-800 hover:bg-[#6070FF]/10 hover:text-[#6070FF]"
                }`}
              >
                <span className="text-base">{parseInt(day.ordinal)}</span>
                <span className="text-sm">{day.weekday}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center text-gray-800 font-medium text-sm sm:text-base">
          {formatDateForDisplay(selectedDate?.actual)}
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
