type Message = {
  role: "doctor" | "patient";
  speaker?: string;
  text: string;
};

export const parseTranscript = (transcript: string): Message[] => {
  return transcript
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("DOCTOR:")) {
        return {
          role: "doctor",
          speaker: "Doctor", // DOCTOR
          text: line.replace("DOCTOR:", "").trim(),
        };
      }

      if (line.startsWith("PATIENT")) {
        const [speakerPart, ...rest] = line.split(":");
        return {
          role: "patient",
          speaker: speakerPart.trim(), // PATIENT 1, PATIENT 2
          text: rest.join(":").trim(),
        };
      }

      return null;
    })
    .filter(Boolean) as Message[];
};
