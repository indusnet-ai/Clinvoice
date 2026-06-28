//get nested value
// export const getNestedValue = (obj, path) => {
//   return path.split("").reduce((o, key) => (o ? o[key] : null), obj);
// };
export const getNestedValue = (obj: any, key: string) => {
  return key.split(".").reduce((acc, part) => {
    if (acc && acc[part] !== undefined) return acc[part];
    return undefined;
  }, obj);
};

// Replace params: t("user.greeting", { name: "Praveen" })
export const applyParams = (text, params = {}) => {
  if (!text) {
    return text;
  }
  return text.replace(/{{(.*?)}}/g, (_, key) => params[key.trim()] || "");
};
