import { Button } from "@/atoms";
import React, { useEffect, useState } from "react";
import { VoiceAddress } from "../../onboard/components/VoiceAddress";
import { DeleteIcon, RefreshIcon } from "@/assets/icons";
import WaveformPlayer from "@/app/component/WaveformPlayer";
import { Signature } from "../../onboard/components/Signature";
import {
  useGetSignatureQuery,
  useGetVoiceAddressQuery,
  usePostSignatureMutation,
  usePostVoiceAddressMutation,
} from "../../onboard/services/OnBoardApi";
import { useUploadFileMutation } from "@/app/fileUploadApi";
import { useAppSelector } from "@/app/hook";
import { useDispatch } from "react-redux";
import { showToast } from "@/utils";
import { setActiveStep } from "../../onboard/services/OnBoardSlice";
import { useLanguage } from "@/language/context/LanguageContext";

const VoiceSignSet = () => {
  const user = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const hospitalId = useAppSelector((state) => state.onboard.hospitalId) ?? Number(localStorage.getItem("hospital_id"));
  const doctorId = useAppSelector((state) => state.onboard.doctorId) ?? Number(localStorage.getItem("doctor_id"));
  const [voiceSignData, setVoiceSignData] = useState<{
    voice: any;
    signature: any;
  }>({
    voice: {},
    signature: {},
  });
  const [postVoiceAddress, { isLoading: isVoicePosting }] = usePostVoiceAddressMutation();
  const [postSignature, { isLoading: isSignaturePosting }] = usePostSignatureMutation();
  const [uploadFile, { isLoading: isFileUploading }] = useUploadFileMutation();

  const { data: voiceData } = useGetVoiceAddressQuery({ userId: Number(user) });
  const { data: signData } = useGetSignatureQuery({ userId: Number(user) });
  useEffect(() => {
    if (voiceData?.data) {
      setVoiceSignData((prev) => ({
        ...prev,
        voice: voiceData?.data?.user_voice_address,
      }));
    }
    if (signData?.data) {
      setVoiceSignData((prev) => ({
        ...prev,
        signature: signData?.data?.user_signature,
      }));
    }
  }, [voiceData, signData]);

  const handleNextVoice = async (data: any) => {
    const fileName = await uploadFile(data as File).unwrap();
    try {
      const payload = {
        user_id: Number(user),
        voice_address: fileName?.data,
      };
      await postVoiceAddress(payload).unwrap();
      setVoiceSignData((prev) => ({
        ...prev,
        voice: data,
      }));
      showToast("Voice address saved", "success");
    } catch (error) {
      showToast(error?.message || "Failed to save Voice Address", "error");
    }
  };

  const handleNextSign = async (data: any) => {
    const fileName = await uploadFile(data as File).unwrap();
    try {
      const payload = {
        user_id: Number(user),
        signature: fileName?.data,
      };
      await postSignature(payload).unwrap();
      setVoiceSignData((prev) => ({
        ...prev,
        signature: data,
      }));
      showToast("Signature saved", "success");
    } catch (error) {
      showToast(error?.message || "Failed to save Signature", "error");
    }
  };
  // Voice from API (mock for now)
  const [apiVoiceUrl] = useState<string | null>("/sample_conversation_english_venkat 4.wav");
  // Editable voice (draft)
  const [draftVoiceUrl, setDraftVoiceUrl] = useState<string | null>(apiVoiceUrl);

  //for signature
  const [apiSignUrl] = useState<string | null>(null);
  // Editable sign (draft)
  const [draftSignUrl, setDraftSignUrl] = useState<string | null>(apiSignUrl);

  const handleRefresh = () => {
    // restore API voice
    setDraftVoiceUrl(apiVoiceUrl);
  };

  const handleDelete = () => {
    // remove only in UI
    setDraftVoiceUrl(null);
  };

  const handleVoiceRecorded = (audioUrl: string) => {
    // after recording
    setDraftVoiceUrl(audioUrl);
  };

  const handleSave = () => {
    if (!draftVoiceUrl) return;

    // later:
    // if (draftVoiceUrl !== apiVoiceUrl) -> upload
    // if (!draftVoiceUrl && apiVoiceUrl) -> delete
    // if (draftVoiceUrl !== apiVoiceUrl) {
    //   uploadVoice(draftVoiceUrl);
    // }

    // if (!draftVoiceUrl && apiVoiceUrl) {
    //   deleteVoice();
    // }

  };

  return (
    <div>
      <h1 className="text-[#01030F] font-semibold text-[16px] mb-4">{t("label.voiceAdd")} & {t("label.signature")}</h1>

      <div className="bg-white min-h-[80vh] p-10 rounded-lg">
        <h1 className="text-[#01030F] font-semibold text-[16px] mb-4">{t("label.voiceAdd")}</h1>
        <VoiceAddress voiceData={voiceSignData?.voice} isSetting onNext={handleNextVoice} />

        {/* SHOW RECORDER */}
        {/* {!draftVoiceUrl ? (
          <VoiceAddress voiceData={voiceSignData?.voice} isSetting onNext={handleNextVoice} />
        ) : (
          <div className="flex items-center gap-4">
            <WaveformPlayer audioUrl={draftVoiceUrl} />

            <button onClick={handleRefresh}>
              <RefreshIcon />
            </button>

            <button onClick={handleDelete}>
              <DeleteIcon color="#6070FF" />
            </button>
          </div>
        )} */}
        <div>
          <h1 className="text-[#01030F] font-semibold text-[16px] mb-4">{t("label.signature")}</h1>
          <div>
            <Signature onNext={handleNextSign} signData={voiceSignData.signature} isSetting />
          </div>
        </div>
        {/* <div className="flex justify-end w-full mt-10">
          <Button label="Save" disable={!draftVoiceUrl} onClick={handleSave} />
        </div> */}
      </div>
    </div>
  );
};

export default VoiceSignSet;
