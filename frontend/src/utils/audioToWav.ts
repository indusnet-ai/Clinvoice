export async function convertWebmToWav(webmBlob: Blob, targetSampleRate = 16000): Promise<Blob> {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const decodeContext = new AudioContext();
  try {
    const audioBuffer = await decodeContext.decodeAudioData(arrayBuffer);

    // If the buffer already matches targetSampleRate and is mono, encode directly
    if (audioBuffer.sampleRate === targetSampleRate && audioBuffer.numberOfChannels === 1) {
      const wavBuffer = audioBufferToWav(audioBuffer);
      return new Blob([wavBuffer], { type: "audio/wav" });
    }

    // Use OfflineAudioContext to resample and mix to mono.
    const OfflineCtx: any = (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (OfflineCtx) {
      const offlineCtx = new OfflineCtx(1, Math.ceil(audioBuffer.duration * targetSampleRate), targetSampleRate);
      const bufferSource = offlineCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(offlineCtx.destination);
      bufferSource.start(0);
      const renderedBuffer: AudioBuffer = await offlineCtx.startRendering();
      const wavBuffer = audioBufferToWav(renderedBuffer);
      return new Blob([wavBuffer], { type: "audio/wav" });
    }

    // Fallback: simple manual resample (linear interpolation)
    const resampled = manualResample(audioBuffer, targetSampleRate);
    const wavBuffer = audioBufferToWav(resampled);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } finally {
    try {
      decodeContext.close();
    } catch (e) {
      /* ignore */
    }
  }
}

function audioBufferToWav(buffer: AudioBuffer) {
  const numChannels = Math.min(1, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let samples: Float32Array;
  // Mix down to mono if necessary
  if (buffer.numberOfChannels === 1) {
    samples = buffer.getChannelData(0);
  } else {
    const ch = buffer.numberOfChannels;
    const len = buffer.getChannelData(0).length;
    samples = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      let sum = 0;
      for (let c = 0; c < ch; c++) {
        sum += buffer.getChannelData(c)[i];
      }
      samples[i] = sum / ch;
    }
  }

  return encodeWav(samples, format, sampleRate, numChannels, bitDepth);
}

function interleave(left: Float32Array, right: Float32Array) {
  const length = left.length + right.length;
  const result = new Float32Array(length);

  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    result[index++] = left[inputIndex];
    result[index++] = right[inputIndex];
    inputIndex++;
  }
  return result;
}

// Fallback linear resample: create a new AudioBuffer with target sample rate and mix to mono
function manualResample(buffer: AudioBuffer, targetSampleRate: number): AudioBuffer {
  const duration = buffer.duration;
  const length = Math.ceil(duration * targetSampleRate);
  const offlineCtx = new (window as any).AudioContext();
  const newBuffer = offlineCtx.createBuffer(1, length, targetSampleRate);
  const out = newBuffer.getChannelData(0);

  // Mix down to mono source data
  const ch = buffer.numberOfChannels;
  const inLen = buffer.getChannelData(0).length;
  for (let i = 0; i < length; i++) {
    const t = (i / (length - 1)) * (inLen - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(i0 + 1, inLen - 1);
    const frac = t - i0;
    let sample = 0;
    for (let c = 0; c < ch; c++) {
      const data = buffer.getChannelData(c);
      const s0 = data[i0];
      const s1 = data[i1];
      sample += s0 + frac * (s1 - s0);
    }
    out[i] = sample / ch;
  }

  try {
    offlineCtx.close();
  } catch (e) {
    /* ignore */
  }
  return newBuffer;
}

function encodeWav(samples: Float32Array, format: number, sampleRate: number, channels: number, bitDepth: number) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  floatTo16BitPCM(view, 44, samples);
  return buffer;
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
