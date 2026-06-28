import React, { useEffect, useState } from "react";
import { DoctorInfo } from "../../onboard/components/DoctorInfo";
import { Button } from "@/atoms";
import { useGetDoctorInfoQuery, usePatchDoctorInfoMutation } from "../../onboard/services/OnBoardApi";
import { useDispatch } from "react-redux";
import { setDoctorId, setHospitalId } from "../../onboard/services/OnBoardSlice";
import { DoctorMapper } from "../../onboard/utils/mapDoctorPayload";
import { DoctorForm } from "../../onboard/types/request.types";
import { useAppSelector } from "@/app/hook";
import { showToast } from "@/utils";
import { updateDoctor } from "../../auth/services/authSlice";
import { useLanguage } from "@/language/context/LanguageContext";

const DoctorInfoSet = () => {
  const [doctorDetails, setDoctorDetails] = useState(null);
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const user = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const doctorId = useAppSelector((state) => state.onboard.doctorId) ?? Number(localStorage.getItem("doctor_id"));
  const hospitalId = useAppSelector((state) => state.onboard.hospitalId) ?? Number(localStorage.getItem("hospital_id"));

  const { data: doctorData } = useGetDoctorInfoQuery({ limit: 1, page: 1, search: "" });
  const [patchDoctorInfo, { isLoading: isDoctorPatching }] = usePatchDoctorInfoMutation();
  useEffect(() => {
    if (doctorData?.data?.length) {
      const apiDoctor = doctorData.data?.[0];
      dispatch(setDoctorId(apiDoctor.id));
      localStorage.setItem("doctor_id", apiDoctor.id.toString());
      setDoctorDetails((prev) => ({
        ...prev,
        doctor: DoctorMapper.toForm(doctorData?.data?.[0]),
      }));
    }
  }, [doctorData]);

  const handleNextDoctor = async (data: DoctorForm) => {
    try {
      const payload = DoctorMapper.toApi(data, Number(user), Number(hospitalId));
      if (!doctorId) {
        //CREATE
        showToast("Doctor ID not found. Cannot create doctor info.", "error");
        return;
      } else {
        //UPDATE
        const res = await patchDoctorInfo({
          doctorId,
          ...payload,
        }).unwrap();
        const doctorResponse = res?.response;
        // Extract values safely
        // Redux
        dispatch(
          updateDoctor({
            doctor_name: doctorResponse.name,
            doctor_email: doctorResponse.email,
            spec: doctorResponse.specialisation,
          }),
        );
      }
      setDoctorDetails((prev) => ({
        ...prev,
        doctor: data,
      }));
      showToast("Doctor info saved", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to save doctor info", "error");
    }
  };

  return (
    <div>
      <h1 className="text-[#01030F] font-semibold text-[16px] mb-4">{t("label.doctorInfo")}</h1>
      <div className="bg-[white] min-h-[80vh] p-10 rounded-lg">
        <DoctorInfo doctorData={doctorDetails?.doctor || {}} onNext={handleNextDoctor} isSetting={true} />
        {/* <div className="flex justify-end w-full mt-10 pr-[0%]">
          <Button label="Save" />
        </div> */}
      </div>
    </div>
  );
};

export default DoctorInfoSet;
