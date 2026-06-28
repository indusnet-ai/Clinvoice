import { useEffect, useRef } from "react";

export const useConsultationAutoLoad = ({
  visitList,
  opd_id,
  searchParams,
  navigate,
  canAutoLoadCurrentOpd,
  currentOpdTransId,
  dispatch,
  triggerGetTranscript,
  triggerGetSoapNotes,
  setTransIdAction,
  clearNotesAction,
  clearSoapAction,
  clearTransAction,
  retakeLocked,
  ignoreTranscript,
}: any) => {
  const autoLoadedRef = useRef(false);

  useEffect(() => {
    if (!visitList?.length) return;

    const currentOpdId = searchParams.get("opd_id");
    if (!currentOpdId) {
      const firstVisit = visitList[0];
      const status = (firstVisit?.opd_status ?? "").toLowerCase();

      if (["inprocess", "inprogress", "in_progress"].includes(status)) {
        const patientId = searchParams.get("patient_id");
        navigate(`/consultation?patient_id=${patientId}&opd_id=${firstVisit.id}`, { replace: true });
      }
    }
  }, [visitList, searchParams, navigate]);

  useEffect(() => {
    if (retakeLocked) return;
    if (!canAutoLoadCurrentOpd) return;
    if (autoLoadedRef.current) return;
    if (!currentOpdTransId) return;

    autoLoadedRef.current = true;

    dispatch(setTransIdAction(currentOpdTransId));
    triggerGetTranscript({ transcript_id: currentOpdTransId });
    triggerGetSoapNotes({ transcript_id: currentOpdTransId });
  }, [canAutoLoadCurrentOpd, currentOpdTransId, dispatch, retakeLocked]);

  useEffect(() => {
    autoLoadedRef.current = false;
    dispatch(clearNotesAction(""));
    dispatch(clearSoapAction(null));
    dispatch(clearTransAction(""));
  }, [opd_id, dispatch]);

  useEffect(() => {
    if (!ignoreTranscript) return;
    autoLoadedRef.current = true; // block auto-load while retake mode
  }, [ignoreTranscript]);

  return { autoLoadedRef };
};
