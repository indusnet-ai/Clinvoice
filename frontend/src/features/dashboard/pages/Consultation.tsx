import { useLanguage } from "@/language/context/LanguageContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hook";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { skipToken } from "@reduxjs/toolkit/query";

import {
  useGetOpdCaseSheetQuery,
  useGetPatientProfileQuery,
  useGetVisitHistoryQuery,
  useLazyGetDentalReportQuery,
  useLazyGetMedicalReportQuery,
  useLazyGetSoapNotesQuery,
  useLazyGettransScriptQuery,
  useUpdateClinVoiceTransMutation,
  useUploadAudioMutation,
} from "../services/ConsultationApi";

import { setNotes, setSoapNote, setTransId } from "../services/ConsultationSlice";
import { ProfileData } from "../types";
import VisitHistory from "../components/VisitHistory";
import NewOpdDialog from "../components/NewOpdDialog";
import ManualSheet from "../components/ManualSheet";
import DentalForm from "../components/DentalCaseSheet";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { NavigateConfirmDialog } from "../components/NavigateConfirmDialog";
import { ConsultationTopBar } from "../components/ConsultationTopBar";
import { AiConsultationPanel } from "../components/AiConsultationPanel";
import { PastRecordsPanel } from "../components/PastRecordPanel";

import { useGetDoctorInfoQuery } from "../../onboard/services/OnBoardApi";
import { useNavigationGuard } from "@/app/navigation/NavigationGaurdContext";
import { convertWebmToWav, showToast } from "@/utils";

//  new extractions
import { exportVisitHistoryPdf } from "../utils/exportVisitHistoryPdf";
import { deriveConsultationUiState } from "../utils/deriveConsultationUiState";
import { useConsultationReports } from "../hooks/useConsultationReports";
import { useConsultationRecording } from "../hooks/useConsultationRecording";
import { useConsultationAutoLoad } from "../hooks/useConsultationAutoLoad";
import { useStreamingTranscription } from "../hooks/useStreamingTranscription";

const Profile_Tabs = [
  { label: "caseSheet", value: "#casesheet" },
  { label: "visitHistory", value: "#visit" },
];

const Consult_Tabs = [
  { label: "ai", value: "#ai" },
  { label: "manual", value: "#manual" },
];

const Consultation = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const patientIdParam = searchParams.get("patient_id");
  const opdIdParam = searchParams.get("opd_id");

  const patient_id = patientIdParam ? Number(patientIdParam) : undefined;
  const opd_id = opdIdParam ? Number(opdIdParam) : undefined;

  // UI state
  const [expandProfile, setExpandProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("#casesheet");
  const [consultTab, setConsultTab] = useState("#ai");
  const [isMaximize, setIsMaximize] = useState(false);

  // data state
  const [profileDetails, setProfileDetials] = useState<ProfileData | null>(null);
  const [openOpd, setOpenOpd] = useState(false);
  const [getVisitData, setGetVisitData] = useState<any[]>([]);
  const [aiDraft, setAiDraft] = useState<any | null>(null);
  const [dentalDraft, setDentalReport] = useState<any | null>(null);
  const [existCaseSheet, setExistCaseSheet] = useState<any | null>(null);

  // form reset keys
  const [manualResetKey, setManualResetKey] = useState(0);
  const [manualSeedVersion, setManualSeedVersion] = useState(0);

  // transcript ignore (retake)
  const [ignoreTranscript, setIgnoreTranscript] = useState(false);

  // confirm dialog for deferred send
  const [openConfirmation, setOpenConfiramtion] = useState(false);

  // api
  const { data: doctorData } = useGetDoctorInfoQuery({ limit: 1, page: 1 });
  const docInfo = doctorData?.data?.[0];
  const spec = useAppSelector((s) => s.auth.doctor?.spec) ?? docInfo?.specialisation;

  const notes = useAppSelector((s) => s.consult.notes);
  const transId = useAppSelector((s) => s.consult.transId);

  // queries
  const { data: profileData } = useGetPatientProfileQuery(patient_id ? { patient_id } : skipToken, {
    refetchOnMountOrArgChange: true,
  });

  const {
    data: visitHistory,
    isFetching: isVisitHistoryFetching,
    isLoading: isVisitHistoryLoading,
  } = useGetVisitHistoryQuery(patient_id ? { patientId: patient_id } : skipToken, {
    refetchOnMountOrArgChange: true,
  });

  const { data: OpdCaseSheet } = useGetOpdCaseSheetQuery(opd_id ? { opd_id } : skipToken, {
    refetchOnMountOrArgChange: true,
  });

  // lazy transcript / soap
  const [triggerGetTranscript, transcriptResult] = useLazyGettransScriptQuery();
  const { data: transcriptData } = transcriptResult;

  const [triggerGetSoapNotes, soapNotesResult] = useLazyGetSoapNotesQuery();
  const { data: soapNoteData, isFetching: isSoapNoteFetching } = soapNotesResult;

  // report triggers
  const [triggerGetMedicalReport, medicalReport] = useLazyGetMedicalReportQuery();
  const { isFetching: isReportFetching } = medicalReport;

  const [triggerDentalReport, dentalReport] = useLazyGetDentalReportQuery();
  const { isFetching: isDentalFetching } = dentalReport;

  // upload + update trans
  const [uploadAudio] = useUploadAudioMutation();
  const [updateClinVoiceTrans] = useUpdateClinVoiceTransMutation();

  // nav guard
  const { isDialogOpen, dialogConfig, confirmNavigation, cancelNavigation, block, unblock } = useNavigationGuard();

  // initial loading
  const isInitailLoading = !!patient_id && (isVisitHistoryLoading || isVisitHistoryFetching);

  // keep existing ref behavior
  const aiAppliedRef = useRef(false);
  const dentalRef = useRef(false);

  //for stop refetch the notes
  const retakeLockRef = useRef(false);

  // reports hook (same fetchSpecReport logic)
  const { isReportPreparing, fetchSpecReport, resetFetchedRef } = useConsultationReports({
    spec,
    triggerGetMedicalReport,
    triggerDentalReport,
    setAiDraft,
    setDentalReport,
    bumpManualSeedVersion: () => setManualSeedVersion((v) => v + 1),
    aiAppliedRef,
    dentalRef,
  });

  // streaming transcription hook
  const { liveTranscript, streamStatus, startStream, stopStream, resetStream, pauseStream, resumeStream } =
    useStreamingTranscription();

  // recording hook (same start/stop/send logic)
  const {
    recordingState,
    setRecordingState,
    micError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    MAX_DURATION,
    MIN_DURATION,
    elapsedSeconds,
    remainingSeconds,
    setElapsedSeconds,
    setRemainingSeconds,
    recordedBlob,
    setRecordedBlob,
    audioPreviewUrl,
    sendAudioToApi,
  } = useConsultationRecording({
    opd_id,
    block,
    unblock,
    uploadAudio,
    updateClinVoiceTrans,
    triggerGetTranscript,
    triggerGetSoapNotes,
    dispatchSetTransId: (id: string) => dispatch(setTransId(id)),
    onTranscriptReady: async (transcriptId: string) => {
      await fetchSpecReport(transcriptId);
    },
    onMicStreamReady: (stream: MediaStream) => {
      startStream(stream);
    },
    onPause: () => {
      pauseStream();
    },
    onResume: () => {
      resumeStream();
    },
  });

  // visit list derived
  const visitList = visitHistory?.data ?? [];

  const currentOpd = useMemo(() => visitList.find((v: any) => v.id === opd_id), [visitList, opd_id]);

  const otherPastOpds = useMemo(
    () => visitList.filter((v: any) => v.id !== opd_id && v.opd_status === "completed" && !!v.clinvoice_transaction_id),
    [visitList, opd_id],
  );

  const shouldShowPastRecords = otherPastOpds.length > 0;

  // ui derive helper (same boolean logic)
  const ui = deriveConsultationUiState({
    currentOpd,
    opd_id,
    ignoreTranscript,
    recordingState,
  });

  const effectiveHasTranscript = ui.effectiveHasTranscript;
  const isCompletedOpd = ui.isCompletedOpd;
  const isInProgressOpd = ui.isInProgressOpd;
  const canAutoLoadCurrentOpd = ui.canAutoLoadCurrentOpd;
  const shouldShowStartStop = ui.shouldShowStartStop;
  const shouldShowSaveRetake = ui.shouldShowSaveRetake;

  // auto-load hook (same effects moved)
  useConsultationAutoLoad({
    visitList,
    opd_id,
    searchParams,
    navigate,
    canAutoLoadCurrentOpd,
    currentOpdTransId: currentOpd?.clinvoice_transaction_id,
    dispatch,
    triggerGetTranscript,
    triggerGetSoapNotes,
    setTransIdAction: setTransId,
    clearNotesAction: setNotes,
    clearSoapAction: setSoapNote,
    clearTransAction: setTransId,
    retakeLocked: retakeLockRef.current,
    ignoreTranscript,
  });

  // clear any previously loaded drafts/case-sheets when switching to a different OPD
  useEffect(() => {
    if (!opd_id) return;

    setExistCaseSheet(null);
    setAiDraft(null);
    setDentalReport(null);
    aiAppliedRef.current = false;
    dentalRef.current = false;
  }, [opd_id]);

  // keep: set exist case sheet
  useEffect(() => {
    if (!OpdCaseSheet) return;
    setExistCaseSheet(OpdCaseSheet?.data);
  }, [OpdCaseSheet]);

  // keep: profile details
  useEffect(() => {
    if (profileData) setProfileDetials(profileData?.data?.[0]);
  }, [profileData]);

  // keep: active tab from hash
  useEffect(() => {
    if (location.hash) setActiveTab(location.hash);
  }, [location.hash]);

  // keep: reset from visit history route state
  useEffect(() => {
    if (location.state?.from === "visithistory") {
      setRecordingState("idle");
      setActiveTab("#casesheet");
      setConsultTab("#ai");
      dispatch(setNotes(""));
      dispatch(setSoapNote(null));
      dispatch(setTransId(""));
      setRecordingState("idle");
      // don’t force idle here if we want autoStart
    }
  }, [location.state?.from]);

  // keep: transcript + soap -> redux + state
  useEffect(() => {
    if (retakeLockRef.current) return;
    if (!transcriptData) return;

    // dispatch(setNotes(transcriptData?.transcript));
    // dispatch(setSoapNote(soapNoteData));
    // setRecordingState("result");
    if (transId) {
      dispatch(setNotes(transcriptData.transcript ?? ""));
      dispatch(setSoapNote(soapNoteData));
      setRecordingState("result");
      return;
    }

    /**
     * CASE 2: auto-loaded transcript from visit history
     * → must match current OPD
     */
    if (currentOpd?.clinvoice_transaction_id) {
      dispatch(setNotes(transcriptData.transcript ?? ""));
      dispatch(setSoapNote(soapNoteData));
      setRecordingState("result");
    }
  }, [transcriptData, soapNoteData, opd_id, dispatch, setRecordingState, currentOpd?.clinvoice_transaction_id, transId]);

  // keep: report fetch when existing trans id (completed/inprocess)
  useEffect(() => {
    const existingTransId = currentOpd?.clinvoice_transaction_id;
    if (!existingTransId) {
      resetFetchedRef();
      return;
    }
    if (isInitailLoading) return;
    fetchSpecReport(existingTransId);
  }, [currentOpd?.clinvoice_transaction_id, spec, isInitailLoading]); // keep same deps style

  // keep: processing navigation block (only blocks while audio is actively processing;
  // automatically releases once the state transitions out of "processing").
  useEffect(() => {
    if (recordingState === "processing") {
      block({
        title: "Are you sure you want to leave?",
        message: "Audio is processing. Leaving will lose the recording.",
        confirmText: "Leave",
        cancelText: "Continue",
        reason: "navigation",
      });
    } else {
      unblock();
    }
  }, [recordingState]);

  // keep: visit data list for export/history
  useEffect(() => {
    if (!visitHistory) return;
    setGetVisitData(visitHistory?.data);
  }, [visitHistory]);

  const hasSavedContent = useMemo(() => {
    if (!existCaseSheet) return false;
    const cs = existCaseSheet.casesheet || existCaseSheet.payload;
    if (!cs) return false;

    const hasVitals = cs.vitals && Object.values(cs.vitals).some(v => v !== null && v !== "");
    const hasComplaints = cs.chiefComplaints && Object.values(cs.chiefComplaints).some(v => v !== null && v !== "");
    const hasMedication = Array.isArray(cs.medication) && cs.medication.some((m: any) => m.medicineName);
    const hasInvestigations = Array.isArray(cs.investigations) && cs.investigations.some((i: any) => i.testCat || i.subCat);
    const hasDiagnosis = cs.diagnosis && String(cs.diagnosis).trim() !== "";
    const hasDietPlan = cs.dietPlan && String(cs.dietPlan).trim() !== "";
    const hasFollowUp = cs.followUp && (cs.followUp.followdate || cs.followUp.followremark || cs.followUp.day?.value);

    const hasPastDental = cs.pastdentalhistory && String(cs.pastdentalhistory).trim() !== "";
    const hasOralExam = cs.oralExamination && Object.values(cs.oralExamination).some(v => v !== null && v !== "");
    const hasClinicalFindings = cs.clinicalFindings && (
      cs.clinicalFindings.attrition ||
      cs.clinicalFindings.abrasion ||
      cs.clinicalFindings.erosions ||
      (cs.clinicalFindings.teeth && Object.keys(cs.clinicalFindings.teeth).length > 0)
    );

    return !!(
      hasVitals ||
      hasComplaints ||
      hasMedication ||
      hasInvestigations ||
      hasDiagnosis ||
      hasDietPlan ||
      hasFollowUp ||
      hasPastDental ||
      hasOralExam ||
      hasClinicalFindings
    );
  }, [existCaseSheet]);

  // derived form source
  const formSource = useMemo(() => {
    if (existCaseSheet && hasSavedContent) return "opd";
    if (aiDraft) return "ai";
    if (dentalDraft) return "dental";
    if (existCaseSheet) return "opd";
    return "empty";
  }, [existCaseSheet, hasSavedContent, aiDraft, dentalDraft, opd_id]);

  const formData = useMemo(() => {
    if (formSource === "opd") return existCaseSheet;
    if (formSource === "ai") return aiDraft;
    if (formSource === "dental") return dentalDraft;
    return null;
  }, [formSource, existCaseSheet, aiDraft, dentalDraft]);

  const isHardBlocked = ["recording", "checking", "processing"].includes(recordingState);

  const isSaveDisabled = isSoapNoteFetching || isReportPreparing || isReportFetching || isDentalFetching;

  const handleSave = async () => {
    if (transId) {
      showToast("Clinical Notes Saved Successfully", "success");
      setConsultTab("#manual");
    } else {
      console.log("trans id is missing");
    }
  };

  const handleRetake = () => {
    resetStream();
    unblock();
    retakeLockRef.current = true;
    setIgnoreTranscript(true);
    setRecordedBlob(null);
    setElapsedSeconds(0);
    setRemainingSeconds(MAX_DURATION);
    setOpenConfiramtion(false);
    setRecordingState("idle");

    setExistCaseSheet(null);
    setAiDraft(null);
    setDentalReport(null);

    resetFetchedRef();
    aiAppliedRef.current = false;
    dentalRef.current = false;

    dispatch(setNotes(""));
    dispatch(setSoapNote(null));
    dispatch(setTransId(""));

    setManualSeedVersion((v) => v + 1);
    setManualResetKey((k) => k + 1);
  };

  const handleConfirmSave = async () => {
    if (!recordedBlob) return;
    try {
      const wavBlob = await convertWebmToWav(recordedBlob);
      setOpenConfiramtion(false);
      setRecordingState("processing");
      await sendAudioToApi(wavBlob);
      setRecordedBlob(null);
    } catch {
      showToast("Failed to process audio", "error");
      setRecordingState("idle");
    }
  };

  const handleExportPdf = () => {
    console.log(getVisitData?.length);

    if (getVisitData?.length <= 0) {
      showToast("No record found to export", "info");
      return;
    } else {
      exportVisitHistoryPdf(getVisitData, t);
    }
  };

  // format time stays here (tiny)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  //for on start
  const handleStart = async () => {
    retakeLockRef.current = false;

    await startRecording();
  };

  //force the user to stay in ai tab
  const mustStayInAiTab =
    recordingState === "processing" ||
    isReportPreparing || // your hook state (medical/dental fetch)
    isSoapNoteFetching || // soap fetch
    isReportFetching || // RTK medical fetch flag
    isDentalFetching; // RTK dental fetch flag

  useEffect(() => {
    if (mustStayInAiTab && consultTab !== "#ai") {
      setConsultTab("#ai");
    }
  }, [mustStayInAiTab, consultTab]);

  const consultTabsWithLock = Consult_Tabs.map((tab) =>
    tab.value === "#manual" && mustStayInAiTab ? { ...tab, disabled: true } : tab,
  );

  return (
    <div>
      <ConsultationTopBar
        isMaximize={isMaximize}
        expandProfile={expandProfile}
        setExpandProfile={setExpandProfile}
        profileDetails={profileDetails}
        t={t}
        Profile_Tabs={Profile_Tabs}
        Consult_Tabs={consultTabsWithLock}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        consultTab={consultTab}
        setConsultTab={setConsultTab}
        onExportPdf={handleExportPdf}
        onOpenOpd={() => setOpenOpd(true)}
        onManualTabSelected={() => setManualSeedVersion((v) => v + 1)}
      />
      {activeTab === "#casesheet" ? (
        <div>
          {consultTab === "#ai" ? (
            <div className={`${shouldShowPastRecords ? "grid grid-cols-2 gap-2" : ``}`}>
              <AiConsultationPanel
                shouldShowPastRecords={shouldShowPastRecords}
                isMaximize={isMaximize}
                setIsMaximize={setIsMaximize}
                expandProfile={expandProfile}
                setExpandProfile={setExpandProfile}
                isInitailLoading={isInitailLoading}
                opd_id={opd_id}
                currentOpd={currentOpd}
                isCompletedOpd={isCompletedOpd}
                effectiveHasTranscript={effectiveHasTranscript}
                notes={notes}
                transId={transId}
                currentOpdTransId={currentOpd?.clinvoice_transaction_id}
                recordingState={recordingState}
                audioPreviewUrl={audioPreviewUrl}
                t={t}
                shouldShowStartStop={shouldShowStartStop}
                shouldShowSaveRetake={shouldShowSaveRetake}
                isSaveDisabled={isSaveDisabled}
                onStart={handleStart}
                onStop={async () => {
                  const date = Math.floor(Date.now() / 1000).toString();
                  stopStream(date).catch(() => {});
                  const save = await stopRecording({ forceStop: false, deferSend: false, reason: "manual" });
                  if (save) setRecordingState("processing");
                }}
                onPause={pauseRecording}
                onResume={resumeRecording}
                onConfirmSave={handleConfirmSave}
                onRetake={handleRetake}
                onSave={handleSave}
                micError={micError}
                remainingSeconds={remainingSeconds}
                elapsedSeconds={elapsedSeconds}
                MIN_DURATION={MIN_DURATION}
                formatTime={formatTime}
                liveTranscript={liveTranscript}
                streamStatus={streamStatus}
              />

              <PastRecordsPanel
                shouldShowPastRecords={shouldShowPastRecords}
                otherPastTransId={otherPastOpds[0]?.clinvoice_transaction_id}
              />
            </div>
          ) : (
            <div className="">
              {spec === "1" ? (
                <ManualSheet
                  data={formData}
                  isCompletedOpd={isCompletedOpd}
                  key={`${opd_id}-${manualResetKey}`}
                  seedVersion={manualSeedVersion}
                  hardBlock={isHardBlocked}
                  recordState={recordingState}
                />
              ) : (
                <DentalForm
                  data={formData}
                  isCompletedOpd={isCompletedOpd}
                  key={`${opd_id}-${manualResetKey}`}
                  seedVersion={manualSeedVersion}
                  hardBlock={isHardBlocked}
                  recordState={recordingState}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <VisitHistory VisitData={getVisitData} spec={spec} />
        </div>
      )}
      <NewOpdDialog
        open={openOpd}
        onClose={() => {
          setOpenOpd(false);
        }}
        patientData={profileDetails}
      />
      <ConfirmationDialog
        open={openConfirmation}
        onClose={() => {
          setOpenConfiramtion(false);
        }}
        onRetake={handleRetake}
        onConfirm={handleConfirmSave}
      />

      {dialogConfig && (
        <NavigateConfirmDialog
          open={isDialogOpen}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          cancelText={dialogConfig.cancelText}
          onClose={cancelNavigation}
          onConfirm={async () => {
            if (dialogConfig.reason === "navigation") {
              await stopRecording({
                forceStop: true,
                deferSend: true,
                reason: "navigation",
              });

              setRecordingState("idle");
            }

            confirmNavigation();
          }}
        />
      )}
    </div>
  );
};

export default Consultation;
