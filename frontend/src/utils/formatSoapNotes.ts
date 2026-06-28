type SoapSection = {
  title: string;
  items: string[];
};

export const formatSoapNotes = (soapnote: Record<string, string[]>): SoapSection[] => {
  return Object.entries(soapnote)?.map(([title, items]) => ({
    title,
    items,
  }));
};
