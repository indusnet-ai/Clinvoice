export const mapSlotApiToForm = (slots: any[]) => {
  if (!slots || slots.length === 0) return null;

  const first = slots[0];

  const selectedDays = slots.map((s) => s.dayname.toLowerCase());

  return {
    from: first.start_time?.slice(0, 5) ?? "",
    to: first.end_time?.slice(0, 5) ?? "",
    slotDuration: first.duration ?? "",

    monday: selectedDays.includes("monday"),
    tuesday: selectedDays.includes("tuesday"),
    wednesday: selectedDays.includes("wednesday"),
    thursday: selectedDays.includes("thursday"),
    friday: selectedDays.includes("friday"),
    saturday: selectedDays.includes("saturday"),
    sunday: selectedDays.includes("sunday"),
  };
};
