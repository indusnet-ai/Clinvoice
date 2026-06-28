import { useRef, useState } from "react";

export const useConsultationReports = ({
  spec,
  triggerGetMedicalReport,
  triggerDentalReport,
  setAiDraft,
  setDentalReport,
  bumpManualSeedVersion,
  aiAppliedRef,
  dentalRef,
}: any) => {
  const [isReportPreparing, setIsReportPreparing] = useState(false);
  const reportFetchedForTransRef = useRef<string | null>(null);

  const fetchSpecReport = async (transcriptId: string) => {
    if (reportFetchedForTransRef.current === transcriptId) return;
    reportFetchedForTransRef.current = transcriptId;

    setIsReportPreparing(true);
    try {
      if (spec === "1") {
        const res = await triggerGetMedicalReport({ transcript_id: transcriptId }).unwrap();
        if (res) {
          setAiDraft(res);
          bumpManualSeedVersion();
          aiAppliedRef.current = true;
        }
      } else if (spec === "2") {
        const res = await triggerDentalReport({ transcript_id: transcriptId }).unwrap();
        if (res) {
          setDentalReport(res);
          bumpManualSeedVersion();
          dentalRef.current = true;
        }
      }
    } catch (e) {
      console.warn("Spec report fetch failed", e);
    } finally {
      setIsReportPreparing(false);
    }
  };

  const resetFetchedRef = () => {
    reportFetchedForTransRef.current = null;
  };

  return { isReportPreparing, fetchSpecReport, resetFetchedRef, reportFetchedForTransRef };
};
