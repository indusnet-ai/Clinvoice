import { RefObject } from "react";

export interface RecorderRefs {
  mediaRecorderRef: RefObject<MediaRecorder | null>;
  audioContextRef: RefObject<AudioContext | null>;
  micStreamRef: RefObject<MediaStream | null>;
  analyserRef: RefObject<AnalyserNode | null>;
  chunksRef: RefObject<Blob[]>;
  startTimeRef: RefObject<number | null>;
}

/**
 * Initialize and start recording with the processed audio stream
 */
export const startRecorder = async (
  processedStream: MediaStream,
  refs: RecorderRefs,
  timeslice?: number,
): Promise<MediaRecorder> => {
  const recorder = new MediaRecorder(processedStream, {
    mimeType: "audio/webm;codecs=opus",
    audioBitsPerSecond: 64000, // Optimized for smaller file size while maintaining voice clarity
  });

  refs.chunksRef.current = [];
  refs.startTimeRef.current = Date.now();

  recorder.ondataavailable = (e) => {
    if (e.data.size) refs.chunksRef.current.push(e.data);
  };

  if (typeof timeslice === "number") recorder.start(timeslice);
  else recorder.start();

  refs.mediaRecorderRef.current = recorder;

  return recorder;
};

/**
 * Stop the MediaRecorder gracefully
 */
export const stopRecorder = (refs: RecorderRefs): void => {
  if (refs.mediaRecorderRef.current?.state !== "inactive") {
    refs.mediaRecorderRef.current?.stop();
  }
};

/**
 * Set up Web Audio API pipeline (high-pass filter + compressor)
 * Returns the processed stream ready for recording
 */
export const setupAudioPipeline = (
  rawStream: MediaStream,
  refs: RecorderRefs,
): MediaStream => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  refs.audioContextRef.current = audioContext;
  const source = audioContext.createMediaStreamSource(rawStream);

  // High-pass filter (remove low-frequency noise)
  const highPass = audioContext.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 120;

  // Compressor (normalize voice levels)
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  // Analyser for monitoring
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  refs.analyserRef.current = analyser;

  source.connect(highPass);
  highPass.connect(compressor);
  compressor.connect(analyser);

  const destination = audioContext.createMediaStreamDestination();
  analyser.connect(destination);

  return destination.stream;
};

/**
 * Complete cleanup: stop recorder, mic tracks, and audio context
 */
export const stopMicCompletely = async (refs: RecorderRefs): Promise<void> => {
  // Stop MediaRecorder if active
  if (refs.mediaRecorderRef.current?.state !== "inactive") {
    refs.mediaRecorderRef.current?.stop();
  }

  // Stop raw mic tracks (turns off mic LED)
  refs.micStreamRef.current?.getTracks().forEach((track) => track.stop());
  refs.micStreamRef.current = null;

  // Close AudioContext
  if (refs.audioContextRef.current?.state !== "closed") {
    await refs.audioContextRef.current?.close();
  }
  refs.audioContextRef.current = null;
  refs.analyserRef.current = null;
};

/**
 * Request microphone access with optimized constraints
 */
export const requestMicrophoneAccess = async (): Promise<MediaStream> => {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: { ideal: 16000 }, // Optimized for voice recording
    },
  });
};
