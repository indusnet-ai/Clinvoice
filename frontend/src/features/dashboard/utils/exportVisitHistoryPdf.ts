import { useLanguage } from "@/language/context/LanguageContext";
import { showToast, StatusRenamer } from "@/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportVisitHistoryPdf = (getVisitData: any[], t: any) => {
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFontSize(14);
  doc.text(`${getVisitData ? getVisitData[0]?.patient_name : ""} Visit History Report`, 14, 15);

  const head = [["S.No", "OPD No", "Doctor Name", "Time Slot", "Status"]];
  const body = getVisitData?.map((item, index) => {
    const formattedStatus = StatusRenamer(item?.opd_status);
    return [index + 1, item?.id, item?.doctor_name, item?.time, t(formattedStatus)];
  });

  autoTable(doc, { head, body, startY: 25, styles: { fontSize: 9 } });

  doc.save(`${getVisitData ? getVisitData[0]?.patient_name : ""}_Visit_History.pdf`);
};
