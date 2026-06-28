export const toDateInputValue = (isoString?: string) => {
  if (!isoString) return "";
  return isoString.split("T")[0]; // Returns YYYY-MM-DD for form inputs
};

/**
 * Formats a date string for display purposes in DD-MM-YYYY format
 * @param isoString - ISO date string or YYYY-MM-DD format
 * @returns Formatted date string in DD-MM-YYYY format
 */
export const formatDateForDisplay = (
  value?: string | Date | null
): string => {
  if (!value) return "";

  // Handle Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();
    return `${day}-${month}-${year}`;
  }

  if (typeof value !== "string") return "";

  const dateStr = value.split("T")[0].trim();

  // Already in DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  }

  return "";
};

export const toUtcDate = (dateStr: string) => {
  return new Date(`${dateStr}T00:00:00Z`).toISOString();
};
export const addISTOffset = (date: string) => {
  const d = new Date(date); // YYYY-MM-DD → local midnight
  d.setMinutes(d.getMinutes() + 330); // +05:30 IST
  return d.toISOString();
};
