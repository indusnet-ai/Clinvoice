import { CloseIcon, DownLoadIcon, PrintIcon } from "@/assets/icons";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useGetOneOPdQuery } from "../services/VisitHistoryApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useLazyGetSoapNotesQuery } from "../../dashboard/services/ConsultationApi";
import { useDispatch } from "react-redux";
import { setSoapNote } from "../../dashboard/services/ConsultationSlice";
import { useAppSelector } from "@/app/hook";
import { formatSoapNotes } from "@/utils";
import { useReactToPrint } from "react-to-print";

function SoapNotes() {
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const opdIdParam = searchParams.get("opd_id");
  const opd_id = opdIdParam ? Number(opdIdParam) : 0;
  const [transcriptId, setTranscriptId] = useState();
  const { data: opdData } = useGetOneOPdQuery(opd_id ? { opd_id } : skipToken, { refetchOnMountOrArgChange: true });

  useEffect(() => {
    if (opdData) {
      const opd = opdData?.data;
      setTranscriptId(opd?.clinvoice_transaction_id);
    }
  }, [opdData]);
  const [triggerGetSoapNotes, soapNotesResult] = useLazyGetSoapNotesQuery();
  const { data: soapNoteData, isFetching: isSoapNoteFetching } = soapNotesResult;

  useEffect(() => {
    if (!transcriptId) return; // wait until transcriptId is available

    triggerGetSoapNotes({ transcript_id: transcriptId });
  }, [transcriptId, triggerGetSoapNotes]);

  const soapNotes = useAppSelector((s) => s.consult.soapnote);
  const sections = soapNotes ? formatSoapNotes(soapNotes) : [];

  useEffect(() => {
    if (!soapNoteData) return;
    // setNotes(transcriptData.transcript);
    dispatch(setSoapNote(soapNoteData));
  }, [soapNoteData]);
  useEffect(() => {
    dispatch(setSoapNote(null));
  }, [opd_id]);

  const hasTranscript = Boolean(transcriptId);
  const hasSoapNotes = sections?.length > 0;

  const handlePrint = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: "soap-notes",
  });
  return (
    <div className="flex flex-col gap-6 mt-6 min-h-[30vh]">
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-[#01030F] text-[16px] font-semibold">SOAP Notes</h1>
        <div className="flex items-center gap-3">
          {hasSoapNotes ? (
            <>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handlePrint}>
                <PrintIcon className="w-6 h-6" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handlePrint}>
                <DownLoadIcon className="w-6 h-6" />
              </button>
            </>
          ) : (
            <></>
          )}
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => {
              navigate(-1);
            }}
          >
            <CloseIcon color="#98999E" className="cursor-pointer w-6 h-6" />
          </button>
        </div>
      </div>
      {/* Loading */}
      {isSoapNoteFetching && <p className="text-center text-[14px] text-gray-500">Loading SOAP notes...</p>}

      {/* No transcript / no soap notes */}
      {!isSoapNoteFetching && !hasTranscript && (
        <div className="flex items-center justify-center h-[200px] text-[#6B7280] text-[14px] font-medium">
          No SOAP notes available for this visit.
        </div>
      )}

      {/* Transcript exists but no notes */}
      {!isSoapNoteFetching && hasTranscript && !hasSoapNotes && (
        <div className="flex items-center justify-center h-[200px] text-[#6B7280] text-[14px] font-medium">
          SOAP notes are not yet generated.
        </div>
      )}

      {/* SOAP Notes */}
      {!isSoapNoteFetching && hasSoapNotes && (
        <div>
          <div ref={pdfRef} className="bg-[white] p-6">
            {sections.map((section, index) => (
              <div key={index} className="flex flex-col gap-3">
                <h3 className="text-[16px] font-semibold bg-[#BFC6FF] text-[#6070FF] px-4 py-2 rounded">
                  {section.title}
                </h3>

                <ul className="flex flex-col gap-2 pl-5 list-disc text-[#01030F]">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-[14px] font-medium leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SoapNotes;
