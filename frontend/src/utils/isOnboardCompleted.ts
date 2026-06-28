// export const isOnboardCompleted = (): boolean => {
//   try {
//     const flags = [
//       localStorage.getItem("voice_address_completed"),
//       localStorage.getItem("signature_completed"),
//       localStorage.getItem("hospital_profile_completed"),
//       localStorage.getItem("doctor_profile_completed"),
//     ];

import { RootState } from "@/app/store";
import { OnboardStatus } from "@/features/auth/services/authSlice";

//     // If ANY flag missing → NOT completed
//     if (flags.some((v) => v === null)) return false;

//     return flags.every((v) => v === "true");
//   } catch (error) {
//     console.error("Onboard check failed", error);
//     return false;
//   }
// };

export const selectIsOnboardCompleted = (state: RootState): boolean => {
  const o = state.auth.onboard;

  if (!o) return false;

  return (
    o.voice_address_completed && o.signature_completed && o.hospital_profile_completed && o.doctor_profile_completed
  );
};

export const getResumeStep = (onboard: OnboardStatus): number => {
  if (!onboard.hospital_profile_completed) return 1;
  if (!onboard.doctor_profile_completed) return 2;
  if (!onboard.voice_address_completed) return 3;
  if (!onboard.signature_completed) return 4;
  return 5; // completed
};
