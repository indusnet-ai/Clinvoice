import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import FooterButton from "./FooterButton";
import { Button } from "@/atoms";
import WaveformPlayer, {
  WaveformPlayerHandle,
} from "@/app/component/WaveformPlayer";
import { VoiceWaveAnimation } from "@/app/component";
import { useDownloadFileMutation } from "@/app/fileUploadApi";
import { base64ToBlob } from "@/utils";
import {
  startRecorder,
  stopRecorder,
  setupAudioPipeline,
  stopMicCompletely,
  requestMicrophoneAccess,
} from "@/utils/recorderHelpers";
import { DeleteIcon, RefreshIcon } from "@/assets/icons";
import { useLocation } from "react-router";
import WelcomeSetupImg from "@/assets/imgs/welcome_setup.png";
import { useLanguage } from "@/language/context/LanguageContext";

interface VoiceAddressProps {
  onNext: (_data?: any) => void;
  voiceData: string | null;
  onBack?: () => void;
  isSetting?: boolean;
}

const MIN_DURATION = 10;
const MAX_DURATION = 180;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export const VoiceAddress: React.FC<VoiceAddressProps> = ({
  onNext,
  voiceData,
  onBack,
  isSetting = false,
}) => {
  const location = useLocation();
  const { t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [reRecord, setRerecord] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);

  const [fileDownload, { isLoading }] = useDownloadFileMutation();
  //for stop playing the audio on unmount
  const waveformRef = useRef<WaveformPlayerHandle | null>(null);

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const stopAudio = () => {
    waveformRef.current?.stop();
  };
  // const hasLoadref = useRef(false);

  useEffect(() => {
    if (!voiceData || typeof voiceData !== "string") return;
    let cancelled = false;
    const loadAudioFromBase64 = async () => {
      try {
        setIsPreparingAudio(true);
        // Send filename to API
        const res = await fileDownload(voiceData).unwrap();
        if (cancelled) return;
        // Create audio source from base64
        // const audioSrc = `data:audio/webm;base64,${res.fileBase64}`;
        //for audio blob
        const blob = base64ToBlob(res.fileBase64, "audio/webm");
        const url = URL.createObjectURL(blob);
        if (cancelled) return;
        setAudioBlob(blob);
        // Set for preview
        setAudioUrl(url);
        setIsValid(true);
        setRerecord(false);
        if (!isSetting) setShowSuccess(true);
      } catch (err) {
        if (!cancelled) console.error("Failed to load voice preview", err);
      } finally {
        if (!cancelled) setIsPreparingAudio(false);
      }
    };

    loadAudioFromBase64();
    return () => {
      cancelled = true;
    };
  }, [voiceData, fileDownload, isSetting]);

  // Auto-stop recording after 3 minutes
  useEffect(() => {
    if (recording && timer <= 0) {
      stopRecording();
    }
  }, [timer, recording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    // Clear any old interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setError("");
    setAudioUrl("");
    setIsValid(false);
    setTimer(MAX_DURATION);

    startTimeRef.current = Date.now();

    try {
      const rawStream = await requestMicrophoneAccess();
      micStreamRef.current = rawStream;

      // const refs = { mediaRecorderRef, audioContextRef, micStreamRef, chunksRef, startTimeRef };
      const refs = {
        mediaRecorderRef,
        audioContextRef,
        micStreamRef,
        analyserRef,
        chunksRef,
        startTimeRef,
      };
      const processedStream = setupAudioPipeline(rawStream, refs);
      const recorder = await startRecorder(processedStream, refs);

      recorder.onstop = () => {
        const duration = Math.floor(
          (Date.now() - startTimeRef.current!) / 1000,
        );
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (duration < MIN_DURATION) {
          setError(t("voiceAddress.shortRecordingError"));
          setIsValid(false);
          setAudioBlob(null);
          setAudioUrl("");
        } else {
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
          setIsValid(true);
          setError("");
          setShowSuccess(true);
          setRerecord(false);
        }
      };

      setRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError(t("voiceAddress.micError"));
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    const elapsed = MAX_DURATION - timer;
    // Check if recording is at least 10 seconds
    if (elapsed < MIN_DURATION) {
      setError(t("voiceAddress.shortRecordingError"));
      return; // Don't allow stopping before 10 seconds
    }

    if (isSetting) {
      setRerecord(false);
    }

    const refs = {
      mediaRecorderRef,
      audioContextRef,
      micStreamRef,
      analyserRef,
      chunksRef,
      startTimeRef,
    };
    stopRecorder(refs);
    await stopMicCompletely(refs);

    setRecording(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleNextStep = () => {
    // Voice address is optional — let the user proceed without a recording.
    if (!isValid || !audioBlob) {
      stopAudio();
      onNext(null);
      return;
    }
    stopAudio();

    const file = new File([audioBlob], `voice_${Date.now()}.webm`, {
      type: audioBlob.type,
    });

    onNext(file); //  pass to parent / API
  };

  useEffect(() => {
    return () => {
      // Stop waveform audio playback
      // stopAudio();
      waveformRef.current?.stop();
      // Stop microphone tracks
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      // Clear timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleBack = () => {
    stopAudio();
    onBack?.();
  };

  const handleRefresh = () => {
    stopAudio();
    setRerecord(true);
    setAudioUrl(""); // not null
    setAudioBlob(null);
    setIsValid(false);
    setError("");
  };

  const handleDelete = () => {
    stopAudio();
    setRerecord(true); // show recorder section again
    setAudioUrl("");
    setAudioBlob(null);
    setIsValid(false);
    setError("");
  };

  // const showVoiceRecorder = isSetting && reRecord ? true : !isSetting;

  const hasAudio = !!audioUrl; // audioUrl should be string, keep it ""
  const showRecorder = !hasAudio || reRecord; // first time OR retake/delete
  const showPreview = hasAudio && !reRecord; // existing audio view
  const showRecorderOnboarding = !isSetting && !showSuccess; // only when not in success screen
  const showRecorderSettings = isSetting && (!hasAudio || reRecord);

  const showRecorderUI = showRecorderOnboarding || showRecorderSettings;
  //loading state
  if (isPreparingAudio || isLoading) {
    return (
      <div className="min-h-[350px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          <p className="text-gray-600">{"Loading voice preview..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col justify-center">
      {showSuccess && !isSetting ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center min-h-[400px] w-full">
          <div className="w-80 h-auto mb-4">
            <img
              src={WelcomeSetupImg}
              alt="Success"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[#01030F] font-semibold text-[16px] mb-6">
            {t("voiceAddress.successMessage")}
          </h1>

          {/* Waveform Preview on Success Screen */}
          <div className="w-full max-w-2xl bg-[#F8F9FF] p-4 rounded-xl mb-6">
            {audioUrl && (
              <WaveformPlayer audioUrl={audioUrl} ref={waveformRef} />
            )}
          </div>

          <Button
            label={t("label.recAgain")}
            onClick={() => {
              stopAudio();
              setShowSuccess(false);
              setRerecord(true); // this is the missing part
              setIsValid(false);
              setAudioUrl("");
              setAudioBlob(null);
              setError("");
              setTimer(MAX_DURATION);
            }}
            variant="contained"
          />
        </div>
      ) : (
        <>
          {showRecorderUI && (
            <div className="flex items-center flex-col justify-center">
              <h1 className="text-[#01030F] font-semibold text-[16px]">
                {t("voiceAddress.instruction")}
              </h1>
              {/* Recording Mic Animation */}
              <VoiceWaveAnimation isRecording={recording} />
              {/* Paragraph */}
              <p className="text-[16px] font-medium text-[#01030F] text-center max-w-4xl">
                {t("voiceAddress.abhaParagraph")}
              </p>
              {/* Instruction message */}
              {!recording && !audioUrl && (
                <p className="text-red-600 mt-4 font-medium">
                  {t("voiceAddress.minDuration")}
                </p>
              )}

              {error && (
                <p className="text-red-600 mt-4 text-sm font-medium">{error}</p>
              )}

              {recording && (
                <div className="mt-8 text-center">
                  <p
                    className={`text-lg font-semibold transition-colors duration-300 ${
                      timer <= 30
                        ? "text-red-500 animate-pulse"
                        : "text-[#04aa04e7]"
                    }`}
                  >
                    ⏱ {formatTime(timer)}
                  </p>
                  {MAX_DURATION - timer < MIN_DURATION && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t("voiceAddress.minDuration")}
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-center items-center gap-3 mt-8">
                {!recording ? (
                  <Button
                    label={t("label.startRec")}
                    onClick={startRecording}
                    variant="contained"
                  />
                ) : (
                  <Button
                    label={t("label.stopRec")}
                    onClick={stopRecording}
                    variant="contained"
                    disable={MAX_DURATION - timer < MIN_DURATION}
                  />
                )}
              </div>
            </div>
          )}

          {/* Waveform Preview */}

          {isSetting && showPreview && (
            <div className="mt-8 flex items-center gap-2 w-full">
              <div className="w-full">
                {audioUrl && (
                  <WaveformPlayer audioUrl={audioUrl} ref={waveformRef} />
                )}
              </div>
              {isSetting && (
                <>
                  <button onClick={handleRefresh}>
                    <RefreshIcon />
                  </button>

                  <button onClick={handleDelete}>
                    <DeleteIcon color="#6070FF" />
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer Navigation */}
      {!isSetting && (
        <div className="flex w-full justify-end mt-12">
          <FooterButton onNext={handleNextStep} onBack={handleBack} hasBack />
        </div>
      )}
      {isSetting && (
        <div className="flex w-full justify-end mt-12">
          <Button
            type="submit"
            onClick={handleNextStep}
            label={t("label.save")}
            disable={!isValid}
          />
        </div>
      )}
    </div>
  );
};
