// In audioWorker.ts
function downsampleBuffer(buffer, sampleRate, outRate) {
  if (outRate === sampleRate) return buffer;

  const ratio = sampleRate / outRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  // Pre-calculate increments to avoid recalculating in loop
  const increment = 1 / ratio;

  for (let i = 0; i < newLength; i++) {
    const startIdx = Math.floor(i * ratio);
    const endIdx = Math.floor((i + 1) * ratio);

    let sum = 0;
    let count = 0;

    // Use simple for loop with cache-friendly access
    for (let j = startIdx; j < endIdx && j < buffer.length; j++) {
      sum += buffer[j];
      count++;
    }

    result[i] = count > 0 ? sum / count : 0;
  }

  return result;
}

self.onmessage = async (event) => {
  console.log("Worker received message with channelData length:", event.data.channelData?.length);

  try {
    const { channelData, sampleRate } = event.data;

    if (!channelData || channelData.length === 0) {
      throw new Error("Empty channel data received");
    }

    console.log("Original sample rate:", sampleRate, "data length:", channelData.length);

    const targetRate = 16000;

    // Process in chunks to avoid freezing
    const CHUNK_SIZE = 100000; // Process 100k samples at a time

    if (channelData.length > CHUNK_SIZE * 2) {
      console.log("Processing large buffer in chunks...");
      const downsampled = downsampleBufferInChunks(channelData, sampleRate, targetRate, CHUNK_SIZE);
      const wavBuffer = encodeWav(downsampled, targetRate);
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });

      self.postMessage({
        success: true,
        wavBlob,
        debug: {
          originalLength: channelData.length,
          downsampledLength: downsampled.length,
          wavSize: wavBuffer.byteLength,
          processedInChunks: true,
        },
      });
    } else {
      // Original processing for smaller buffers
      const downsampled = downsampleBuffer(channelData, sampleRate, targetRate);

      const wavBuffer = encodeWav(downsampled, targetRate);
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });

      self.postMessage({
        success: true,
        wavBlob,
        debug: {
          originalLength: channelData.length,
          downsampledLength: downsampled.length,
          wavSize: wavBuffer.byteLength,
          processedInChunks: false,
        },
      });
    }
  } catch (err) {
    console.error("Worker error:", err);
    self.postMessage({
      success: false,
      error: err?.message || "Worker failed",
      stack: err?.stack,
    });
  }
};

function downsampleBufferInChunks(buffer, sampleRate, outRate, chunkSize) {
  if (outRate === sampleRate) return buffer;

  const ratio = sampleRate / outRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  // Calculate how many source chunks we need
  const sourceChunkSize = Math.floor(chunkSize * ratio);
  const numChunks = Math.ceil(buffer.length / sourceChunkSize);

  console.log(`Processing ${numChunks} chunks...`);

  for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
    const startSourceIdx = chunkIdx * sourceChunkSize;
    const endSourceIdx = Math.min(startSourceIdx + sourceChunkSize, buffer.length);

    const startResultIdx = Math.floor(startSourceIdx / ratio);
    const endResultIdx = Math.floor(endSourceIdx / ratio);

    // Process this chunk
    for (let i = startResultIdx; i < endResultIdx && i < result.length; i++) {
      const sourceStart = Math.floor(i * ratio);
      const sourceEnd = Math.floor((i + 1) * ratio);

      let sum = 0;
      let count = 0;

      for (let j = sourceStart; j < sourceEnd && j < buffer.length; j++) {
        sum += buffer[j];
        count++;
      }

      result[i] = count > 0 ? sum / count : 0;
    }

    // Send progress update (optional)
    if (chunkIdx % 10 === 0 || chunkIdx === numChunks - 1) {
      self.postMessage({
        type: "progress",
        progress: (chunkIdx + 1) / numChunks,
      });
    }
  }

  return result;
}
