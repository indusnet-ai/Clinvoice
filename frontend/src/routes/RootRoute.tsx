// import { Routes, Route, Navigate } from "react-router-dom";
// import PublicRoute from "./PublicRoute";
// import SignIn from "../pages/Authentication/SignIn";
// import ResetPassword from "../pages/Authentication/ResetPassword";
// import ChangePassword from "../pages/Authentication/ChangePassword";
// import Appointment from "../pages/Appointment/Appointment";
// import ProtectedRoute from "./AdminRoute";
// import AuthLayout from "@/layout/AuthLayout";
// import { FC, lazy } from "react";
// import DefaultLayout from "@/layout/DefaultLayout";
// import HospitalOnboard from "@/pages/HospitalOnboard";
// import DoctorInfo from "@/pages/HospitalOnboard/Sections/DoctorInfo";
// import OPDProfileVoice from "@/pages/OPDOutPatient/OPDProfileVoice";
// import DentalCaseSheet from "@/pages/DentalCaseSheet";
// import HospitalInfo from "@/pages/HospitalOnboard/Sections/HospitalInfo";
// import VoiceAddress from "@/pages/HospitalOnboard/Sections/VoiceAddress";
// import Slots from "@/pages/HospitalOnboard/Sections/Slots";
// import Onboard from "@/pages/onboard/Onboard";
// import Components from "@/pages/component/Components";
// import OnboardLayout from "@/layout/OnboardLayout";
// import Appoinment from "@/pages/features/dashboard/pages/Dashboard";
// import Consultation from "@/pages/features/dashboard/pages/Consultation";
// const SessionLayout = lazy(() => import("@/pages/features/auth/pages/SessionLayout"));

// const insideRoutes = (
//   <>
//     <Route path="appointment" element={<Appointment />} />
//     <Route path="hospital" element={<HospitalOnboard />} />
//     <Route path="doctor-info" element={<DoctorInfo />} />
//     <Route path="opd-profile/:patient_id" element={<OPDProfileVoice />} />
//     <Route path="dental-case-sheet" element={<DentalCaseSheet />} />
//     <Route path="hospital-info" element={<HospitalInfo handleNextHosInfo={() => console.log("Next pressed")} />} />
//     <Route path="voice-address" element={<VoiceAddress />} />
//   </>
// );

// const AppRoutes = () => {
//   //for onboard
//   const isOnboardCompleted = true;
//   return (
//     <Routes>
//       {/* Redirect root to login or dashboard */}
//       {/* <Route path="/" element={<Navigate to="/appointment" replace />} /> */}

//       {/* ---------- Public Routes ---------- */}
//       <Route element={<PublicRoute />}>
//         <Route
//           path="/auth/*"
//           element={
//             <AuthLayout>
//               <SessionLayout />
//             </AuthLayout>
//           }
//         />
//       </Route>

//       {/* ---------- Protected Routes (Default Layout + Sidebar + Header) ---------- */}
//       {!isOnboardCompleted ? (
//         <Route element={<OnboardLayout />}>
//           <Route element={<ProtectedRoute />}>
//             <Route path="onboard" element={<Onboard />} />
//           </Route>
//         </Route>
//       ) : (
//         <Route element={<DefaultLayout />}>
//           <Route element={<ProtectedRoute />}>
//             <Route path="appointment" element={<Appoinment />} />
//             <Route path="consultation" element={<Consultation />} />
//             <Route path="hospital" element={<HospitalOnboard />} />
//             <Route path="doctor-info" element={<DoctorInfo />} />
//             <Route path="opd-profile/:patient_id" element={<OPDProfileVoice />} />
//             <Route path="dental-case-sheet" element={<DentalCaseSheet />} />
//             <Route
//               path="hospital-info"
//               element={<HospitalInfo handleNextHosInfo={() => console.log("Next pressed")} />}
//             />
//             <Route path="voice-address" element={<VoiceAddress />} />
//             <Route path="slots" element={<Slots />} />
//           </Route>
//         </Route>
//       )}
//       <Route path="component" element={<Components />} />
//     </Routes>
//   );
// };

// export default AppRoutes;

import { Navigate, useRoutes } from "react-router-dom";
import { featureRoutes } from "./featureRoutes";
import { isAuthenticated } from "@/utils/auth";
import { useAppSelector } from "@/app/hook";
import { selectIsOnboardCompleted } from "@/utils/isOnboardCompleted";
import ChangePasswordLayout from "@/layout/ChangePasswordLayout";
import ForcePasswordGuard from "@/features/auth/hooks/ForcePasswordGuard";
import ChangePassword from "@/features/auth/pages/ChangePassword";
// import { isOnboardCompleted } from "@/utils/isOnboardCompleted";

// const getRootRedirect = () => {
//   if (!isAuthenticated()) return "/auth/signin";
//   if (!isOnboardCompleted()) return "/onboard";
//   return "/appointment";
// };

const RootRedirect = () => {
  const isCompleted = useAppSelector(selectIsOnboardCompleted);

  if (!isAuthenticated()) return <Navigate to="/auth/signin" replace />;
  if (!isCompleted) return <Navigate to="/onboard" replace />;
  return <Navigate to="/appointment" replace />;
};

export default function AppRoutes() {
  const routes = useRoutes([
    {
      path: "/",
      element: <RootRedirect />,
    },
    {
      element: <ForcePasswordGuard />,
      children: [
        {
          element: <ChangePasswordLayout />,
          children: [
            {
              path: "/change-password",
              element: <ChangePassword />,
            },
          ],
        },
      ],
    },
    ...featureRoutes,
    {
      path: "*",
      // element: <Navigate to="/" replace />,
      element: <div>Not Found</div>,
    },
  ]);

  return routes;
}
