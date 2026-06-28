import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { HospitalInfo } from "../components/HospitalInfo";
import { DoctorInfo } from "../components/DoctorInfo";
import { VoiceAddress } from "../components/VoiceAddress";
import { Signature } from "../components/Signature";
import { FallBack, Stepper } from "@/app/component";
import { SetupCompleted } from "../components/SetupCompleted";
import {
  useGetDoctorInfoQuery,
  useGetHospitalInfoQuery,
  useGetSignatureQuery,
  useGetVoiceAddressQuery,
  usePatchDoctorInfoMutation,
  usePatchHospitalInfoMutation,
  usePostDoctorInfoMutation,
  usePostHospitalInfoMutation,
  usePostSignatureMutation,
  usePostVoiceAddressMutation,
} from "../services/OnBoardApi";
import { showToast } from "@/utils";
import { useAppSelector } from "@/app/hook";
import { Hospital } from "../types";
import { HospitalMapper } from "../utils/mapHospitalPayload";
import { DoctorForm, HospitalForm } from "../types/request.types";
import { useDispatch } from "react-redux";
import { restoreActiveStep, setActiveStep, setDoctorId, setHospitalId } from "../services/OnBoardSlice";
import { DoctorMapper } from "../utils/mapDoctorPayload";
import { fileUploadApi, useUploadFileMutation } from "@/app/fileUploadApi";
import { updateDoctor, updateOnboardStatus } from "../../auth/services/authSlice";
import { getResumeStep, selectIsOnboardCompleted } from "@/utils/isOnboardCompleted";

const Tabs = ["Hosptial Info", "Doctor Info", "Voice Address", "Signature"];

const Onboard = () => {
  const navigate = useNavigate();

  // const [activeTab, setActiveTab] = useState(1);
  // const [isOnboardCompleted, setisOnboardCompleted] = useState<boolean>(false);
  const isOnboardCompleted = useAppSelector(selectIsOnboardCompleted);
  const [postHospitalInfo, { isLoading }] = usePostHospitalInfoMutation();
  const [patchHospitalInfo, { isLoading: isPatching }] = usePatchHospitalInfoMutation();
  const [postDoctorInfo, { isLoading: isDoctorPosting }] = usePostDoctorInfoMutation();
  const [patchDoctorInfo, { isLoading: isDoctorPatching }] = usePatchDoctorInfoMutation();
  const [postVoiceAddress, { isLoading: isVoicePosting }] = usePostVoiceAddressMutation();
  const [postSignature, { isLoading: isSignaturePosting }] = usePostSignatureMutation();
  const [uploadFile, { isLoading: isFileUploading }] = useUploadFileMutation();

  const user = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const dispatch = useDispatch();
  const hospitalId = useAppSelector((state) => state.auth.hospital_id) ?? Number(localStorage.getItem("hospital_id"));
  const doctorId = useAppSelector((state) => state.auth.doctor_id) ?? Number(localStorage.getItem("doctor_id"));
  const onboard = useAppSelector((s) => s.auth.onboard);
  const activeStep = useAppSelector((s) => s.onboard.activeStep);
  const [onboardData, setOnboardData] = useState<{
    hospital: HospitalForm;
    doctor: DoctorForm;
    voice: any;
    signature: any;
  }>({
    hospital: null,
    doctor: null,
    voice: {},
    signature: {},
  });

  // const activeStep = useAppSelector((s) => s.onboard.activeStep);

  useEffect(() => {
    dispatch(restoreActiveStep());
  }, []);

  const {
    data,
    isLoading: isHospitalLoading,
    isFetching: isHospitalFetching,
  } = useGetHospitalInfoQuery({ limit: 1, page: 1, search: "" });
  const {
    data: doctorData,
    isLoading: isDoctorLoading,
    isFetching: isDoctorFetching,
  } = useGetDoctorInfoQuery({ limit: 1, page: 1, search: "" });
  const { data: voiceData, isLoading: isVoiceLoading } = useGetVoiceAddressQuery({ userId: Number(user) });
  const { data: signData, isLoading: isSignLoading } = useGetSignatureQuery({ userId: Number(user) });

  // Track if initial data queries are complete
  const [isDataLoaded, setIsDataLoaded] = useState(false);

    (() => {
    if (data?.data?.length) {
      const apiHospital = data.data?.[0];
      // setHospitalId(apiHospital.id);
      dispatch(setHospitalId(apiHospital.id));
      localStorage.setItem("hospital_id", apiHospital.id.toString());
      setOnboardData((prev) => ({
        ...prev,
        hospital: HospitalMapper.toForm(apiHospital),
      }));
    }
    if (doctorData?.data?.length) {
      const apiDoctor = doctorData.data?.[0];
      dispatch(setDoctorId(apiDoctor.id));
      localStorage.setItem("doctor_id", apiDoctor.id.toString());
      setOnboardData((prev) => ({
        ...prev,
        doctor: DoctorMapper.toForm(doctorData?.data?.[0]),
      }));
    }
    if (voiceData?.data) {
      setOnboardData((prev) => ({
        ...prev,
        voice: voiceData?.data?.user_voice_address,
      }));
    }
    if (signData?.data) {
      setOnboardData((prev) => ({
        ...prev,
        signature: signData?.data?.user_signature,
      }));
    }

    // Mark data as loaded once all queries have completed (either with data or empty results)
    if (!isHospitalLoading && !isHospitalFetching && !isDoctorLoading && !isDoctorFetching) {
      setIsDataLoaded(true);
    }
  }, [data, doctorData, voiceData, signData, isHospitalLoading, isHospitalFetching, isDoctorLoading, isDoctorFetching]);

  const handleHospitalNext = async (data: HospitalForm) => {
    if (!user) {
      showToast("User ID not found. Please log in again.", "error");
      return;
    }

    try {
      const payload = HospitalMapper.toApi(data, Number(user));

      if (!hospitalId) {
        // CREATE
        const res = await postHospitalInfo(payload).unwrap();
        dispatch(setHospitalId(res.data?.[0]?.id));
        localStorage.setItem("hospital_id", res.data?.[0]?.id.toString());
      } else {
        // UPDATE
        await patchHospitalInfo({
          hospitalId,
          ...payload,
        }).unwrap();
      }
      dispatch(updateOnboardStatus({ hospital_profile_completed: true }));
      setOnboardData((prev) => ({
        ...prev,
        hospital: data,
      }));

      showToast("Hospital info saved", "success");
      dispatch(setActiveStep(2));
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to save hospital info", "error");
      console.log(err, "error");
    }
  };

  const handleNextDoctor = async (data: DoctorForm) => {
    // Validate that hospitalId exists before attempting to save
    if (!hospitalId) {
      showToast("Please wait for hospital data to load, then try again", "error");
      console.error("Cannot save doctor info: hospitalId is missing");
      return;
    }

    if (!user) {
      showToast("User ID not found. Please log in again.", "error");
      return;
    }

    try {
      const payload = DoctorMapper.toApi(data, Number(user), Number(hospitalId));

      let doctorResponse;

      if (!doctorId) {
        //  CREATE
        const res = await postDoctorInfo(payload).unwrap();
        doctorResponse = res.response; //  IMPORTANT
      } else {
        // UPDATE
        const res = await patchDoctorInfo({
          doctorId,
          ...payload,
          // user_id: undefined,
        }).unwrap();
        doctorResponse = res.response; //  IMPORTANT
      }

      // Extract values safely
      const finalDoctorId = doctorResponse.id;

      // Redux
      dispatch(setDoctorId(finalDoctorId));
      dispatch(
        updateDoctor({
          doctor_name: doctorResponse.name,
          doctor_email: doctorResponse.email,
          spec: doctorResponse.specialisation,
        }),
      );
      dispatch(updateOnboardStatus({ doctor_profile_completed: true }));

      // localStorage
      localStorage.setItem("doctor_id", String(finalDoctorId));
      localStorage.setItem("doctor_name", doctorResponse.name ?? "");
      localStorage.setItem("doctor_email", doctorResponse.email ?? "");
      localStorage.setItem("spec", doctorResponse.specialisation ?? "");

      //  Local form state (UI only)
      setOnboardData((prev) => ({
        ...prev,
        doctor: data,
      }));

      showToast("Doctor info saved", "success");
      dispatch(setActiveStep(3));
    } catch (err: any) {
      showToast(err?.message || "Failed to save doctor info", "error");
    }
  };

  const handleNextVoice = async (data: any) => {
    // Step is optional — skip API work entirely when the user didn't record anything.
    if (!data) {
      dispatch(setActiveStep(4));
      return;
    }
    try {
      const fileName = await uploadFile(data as File).unwrap();
      const payload = {
        user_id: Number(user),
        voice_address: fileName?.data,
      };
      await postVoiceAddress(payload).unwrap();
      setOnboardData((prev) => ({
        ...prev,
        voice: data,
      }));
      showToast("Voice address saved", "success");
      dispatch(updateOnboardStatus({ voice_address_completed: true }));
    } catch (error) {
      showToast(error?.message || "Failed to save Voice Address", "error");
    }
    dispatch(setActiveStep(4));
  };

  const handleNextSign = async (data: any) => {
    // Step is optional — finish onboarding even if no file was provided.
    if (!data) {
      dispatch(setActiveStep(5));
      setTimeout(() => {
        dispatch(updateOnboardStatus({ signature_completed: true }));
      }, 500);
      return;
    }
    try {
      const fileName = await uploadFile(data as File).unwrap();
      const payload = {
        user_id: Number(user),
        signature: fileName?.data,
      };
      await postSignature(payload).unwrap();
      setOnboardData((prev) => ({
        ...prev,
        signature: data,
      }));
      dispatch(setActiveStep(5));
      showToast("Signature saved", "success");
      // Delay updating the onboard status (which triggers the redirect to dashboard)
      setTimeout(() => {
        dispatch(updateOnboardStatus({ signature_completed: true }));
      }, 5000);
    } catch (error) {
      showToast(error?.message || "Failed to save Signature", "error");
    }
    // setisOnboardCompleted(true);
  };

  const handleback = () => {
    dispatch(setActiveStep(activeStep - 1));
  };

  const didResumeRef = React.useRef(false);

  useEffect(() => {
    if (!onboard) return;
    if (didResumeRef.current) return;

    if (
      onboard.voice_address_completed &&
      onboard.signature_completed &&
      onboard.hospital_profile_completed &&
      onboard.doctor_profile_completed
    ) {
      didResumeRef.current = true;
      return;
    }

    const resumeStep = getResumeStep(onboard);
    dispatch(setActiveStep(resumeStep));

    didResumeRef.current = true;
  }, [onboard, dispatch]);

  // Prevent back navigation when onboarding is completed
  useEffect(() => {
    if (!isOnboardCompleted) return;

    const handlePopState = (e: PopStateEvent) => {
      // If onboarding is completed, prevent going back to onboarding pages
      window.history.pushState(null, "", window.location.pathname);
      navigate("/appointment", { replace: true });
    };

    // Push a state to enable popstate detection
    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOnboardCompleted, navigate]);

  const renderSteps = () => {
    // Show loading indicator while initial data is being fetched
    const isLoadingInitialData =
      (isHospitalLoading || isHospitalFetching || isDoctorLoading || isDoctorFetching) && !isDataLoaded;

    if (isLoadingInitialData) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your information...</p>
          </div>
        </div>
      );
    }

    if (activeStep === 1) {
      return <HospitalInfo hospitalData={onboardData.hospital} onNext={handleHospitalNext} />;
    } else if (activeStep === 2) {
      return <DoctorInfo doctorData={onboardData.doctor} onNext={handleNextDoctor} onBack={handleback} />;
    } else if (activeStep === 3) {
      return <VoiceAddress voiceData={onboardData.voice} onNext={handleNextVoice} onBack={handleback} />;
    } else if (activeStep === 4) {
      return <Signature signData={onboardData.signature} onNext={handleNextSign} onBack={handleback} />;
    } else {
      return <FallBack />;
    }
  };

  return (
    <div className="mx-9 my-6 bg-[#FFFFFF] rounded-xl p-[34px] relative">
      {isOnboardCompleted || activeStep === 5 ? (
        <>
          <SetupCompleted />
        </>
      ) : (
        <>
          <div className="w-full">
            <Stepper activeStep={activeStep} steps={Tabs} />
          </div>
          <div className="min-h-[50vh]">{renderSteps()}</div>
        </>
      )}
    </div>
  );
};

export default Onboard;
