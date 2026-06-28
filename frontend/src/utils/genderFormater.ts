export const genderFormatter = (gender: string): string => {
  switch (gender.toLowerCase()) {
    case "male":
      return "M";
    case "female":
      return "F";
    case "other":
      return "O";
    default:
      return "Unknown";
  }
};
