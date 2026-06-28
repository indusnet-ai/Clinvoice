// import { CloseIcon } from "@/assets/icons";
// import React, { useEffect, useState } from "react";
// import { useSearchParams } from "react-router";
// import { useGetOneOPdQuery } from "../services/VisitHistoryApi";
// import { skipToken } from "@reduxjs/toolkit/query";
// import { useLazyGetSoapNotesQuery } from "../../dashboard/services/ConsultationApi";
// import { useDispatch } from "react-redux";
// import { setSoapNote } from "../../dashboard/services/ConsultationSlice";
// import { useAppSelector } from "@/pages/app/hook";
// import { formatSoapNotes } from "@/utils";

// function soapnotes() {
//   const [searchParams] = useSearchParams();
//   const dispatch = useDispatch();
//   const opdIdParam = searchParams.get("opd_id");
//   const opd_id = opdIdParam ? Number(opdIdParam) : 0;
//   const [transcriptId, setTranscriptId] = useState();
//   const { data: opdData } = useGetOneOPdQuery(opd_id ? { opd_id } : skipToken, { refetchOnMountOrArgChange: true });
//   console.log(opd_id, opdIdParam, "opd params");

//   useEffect(() => {
//     if (opdData) {
//       const opd = opdData?.data;
//       setTranscriptId(opd?.clinvoice_transaction_id);
//     }
//   }, [opdData]);
//   const [triggerGetSoapNotes, soapNotesResult] = useLazyGetSoapNotesQuery();
//   const { data: soapNoteData, isFetching: isSoapNoteFetching } = soapNotesResult;

//   useEffect(() => {
//     if (!transcriptId) return; // wait until transcriptId is available

//     triggerGetSoapNotes({ transcript_id: transcriptId });
//   }, [transcriptId, triggerGetSoapNotes]);

//   const soapNotes = useAppSelector((s) => s.consult.soapnote);
//   const sections = soapNotes ? formatSoapNotes(soapNotes) : [];

//   useEffect(() => {
//     if (!soapNoteData) return;
//     // setNotes(transcriptData.transcript);
//     dispatch(setSoapNote(soapNoteData));
//   }, [soapNoteData]);
//   return (
//     <div className="flex flex-col gap-6 mt-6">
//       {sections?.map((section, index) => (
//         <div key={index} className="flex flex-col gap-3">
//           {/* Title */}
//           <h3 className="text-[16px] font-semibold bg-[#BFC6FF] text-[#6070FF] px-4 py-2 rounded">{section?.title}</h3>

//           {/* Content */}
//           <ul className="flex flex-col gap-2 pl-5 list-disc text-[#01030F]">
//             {section?.items.map((item, i) => (
//               <li key={i} className="text-[14px] font-medium leading-relaxed">
//                 {item}
//               </li>
//             ))}
//           </ul>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default soapnotes;
