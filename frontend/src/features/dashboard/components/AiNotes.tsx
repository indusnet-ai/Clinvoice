import React, { useEffect, useState } from "react";
import { ChatAiIcon } from "@/assets/icons";
import { useLanguage } from "@/language/context/LanguageContext";
import { useAppSelector } from "@/app/hook";
import { formatSoapNotes, parseTranscript, showToast } from "@/utils";
import {
  useLazyGetSoapNotesQuery,
  useLazyGettransScriptQuery,
  useGetPatientProfileQuery,
} from "../services/ConsultationApi";
import { useGetDoctorInfoQuery } from "@/features/onboard/services/OnBoardApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSearchParams } from "react-router";

interface AiNotesProps {
  notes: any;
  isPastRecord?: boolean;
  transId?: string;
}
const Note_Tabs = [
  // { label: "summary", value: "summary" },
  { label: "transcript", value: "transcript" },
  { label: "soapNotes", value: "soapnote" },
];

//for chat
const ChatBubble = ({ role, text, speaker }: { role: string; text: string; speaker: string }) => {
  const isDoctor = role === "doctor";

  return (
    <div className={`flex w-full ${isDoctor ? "justify-start" : "justify-end"} mb-5`}>
      <div className={`max-w-[70%] flex flex-col `}>
        <p className="flex items-center gap-2 text-[#01030F] font-semibold text-[14px]">
          <ChatAiIcon /> {speaker}
        </p>
        <p className="p-5 shadow-2xl text-balance rounded-[14px]">{text}</p>
      </div>
    </div>
  );
};

//for soap notes
const SoapNote = ({ soapnote }: { soapnote: Record<string, string[]> }) => {
  const sections = formatSoapNotes(soapnote);

  return (
    <div className="flex flex-col gap-6 mt-6">
      {sections.map((section, index) => (
        <div key={index} className="flex flex-col gap-3">
          {/* Title */}
          <h3 className="text-[16px] font-semibold bg-[#BFC6FF] text-[#6070FF] px-4 py-2 rounded">{section.title}</h3>

          {/* Content */}
          <ul className="flex flex-col gap-2 pl-5 list-disc text-[#01030F]">
            {section?.items?.map((item, i) => (
              <li key={i} className="text-[14px] font-medium leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const AiNotes: React.FC<AiNotesProps> = ({ notes, isPastRecord, transId }) => {
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "soapnote">("transcript");
  const messages = useAppSelector((s) => s.consult.message);
  const soapNotes = useAppSelector((s) => s.consult.soapnote);
  const { t } = useLanguage();
  const [pastTranscript, setPastTranscript] = useState<any[]>([]);
  const [pastSoapNote, setPastSoapNote] = useState<Record<string, any> | null>(null);

  const [searchParams] = useSearchParams();
  const patient_id = searchParams.get("patient_id");

  const { data: profileData } = useGetPatientProfileQuery(patient_id ? { patient_id: Number(patient_id) } : skipToken);
  const patientName = profileData?.data?.[0]?.patient_name || "Patient";

  const { data: doctorData } = useGetDoctorInfoQuery({ limit: 1, page: 1 });
  const docInfo = doctorData?.data?.[0];
  const docName = useAppSelector((s) => s.auth.doctor?.doctor_name) ?? docInfo?.name ?? "Doctor";

  //transcript
  const [triggerGetTranscript, transcriptResult] = useLazyGettransScriptQuery();
  const { data: transcriptData, isFetching: isTransIdFetching, isSuccess: isTrans } = transcriptResult;
  //soap notes
  const [triggerGetSoapNotes, soapNotesResult] = useLazyGetSoapNotesQuery();
  const { data: soapNoteData, isFetching: isSoapNoteFetching, isSuccess: isSoapNote } = soapNotesResult;

  useEffect(() => {
    if (!transId) {
      setPastTranscript([]);
      setPastSoapNote(null);
      return;
    }
    // Clear old data when transId changes to prevent stale UI
    setPastTranscript([]);
    setPastSoapNote(null);

    triggerGetTranscript({ transcript_id: transId });
    triggerGetSoapNotes({ transcript_id: transId });
  }, [transId]);

  useEffect(() => {
    if (isSoapNote && soapNoteData) {
      setPastSoapNote(soapNoteData);
    }
    if (isTrans && transcriptData) {
      const parseMessage = parseTranscript(transcriptData?.transcript);
      setPastTranscript(parseMessage);
    }
  }, [isSoapNote, isTrans, soapNoteData, transcriptData]);

  // If we have a specific transId, we use the local fetched data to ensure correctness
  // Otherwise, we fallback to global Redux state (useful for immediate recording results)
  const displayTranscript = transId && pastTranscript.length > 0 ? pastTranscript : isPastRecord ? [] : messages;
  const displaySoapNote = transId && pastSoapNote ? pastSoapNote : isPastRecord ? null : soapNotes;

  const isLoading = isTransIdFetching || isSoapNoteFetching;

  return (
    <div>
      <div className="flex items-start w-full gap-5">
        {Note_Tabs.map((tab: any, index) => {
          return (
            <div
              key={index}
              className={`${
                activeTab === tab.value ? `text-[#6070FF] underline underline-offset-10` : `text-[#5B657A]`
              } text-[16px] font-semibold cursor-pointer px-5`}
              onClick={() => setActiveTab(tab.value)}
            >
              {t(`consultation.notes.${tab.label}`)}
            </div>
          );
        })}
      </div>

      {activeTab === "transcript" && (
        <div className="flex flex-col w-full overflow-y-auto p-4">
          {isLoading && pastTranscript.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">{t("consultation.messages.loadingTranscript")}</p>
          ) : (
            displayTranscript
              .map((msg) => {
                let newSpeaker = msg.speaker;
                if (msg.role === "doctor") {
                  newSpeaker = `Dr. ${docName}`;
                } else if (msg.role === "patient") {
                  const speakerText = msg.speaker?.toUpperCase().trim();
                  if (speakerText === "PATIENT 1") {
                    newSpeaker = patientName;
                  } else {
                    newSpeaker = msg.speaker;
                  }
                }
                return { ...msg, speaker: newSpeaker };
              })
              .map((msg, i) => <ChatBubble key={i} role={msg.role} speaker={msg.speaker} text={msg.text} />)
          )}
        </div>
      )}

      {activeTab === "soapnote" && (
        <div className="p-4">
          {isLoading && !pastSoapNote ? (
            <p className="text-sm text-gray-500 mt-4">{t("consultation.messages.loadingSoapNotes")}</p>
          ) : displaySoapNote ? (
            <SoapNote soapnote={displaySoapNote} />
          ) : (
            <p className="text-sm text-gray-400 mt-4">{t("consultation.messages.noSoapNotes")}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AiNotes;
