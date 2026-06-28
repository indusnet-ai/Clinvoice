import React, { useEffect } from "react";
import { HospitalInfo } from "../../onboard/components/HospitalInfo";
import { useGetHospitalInfoQuery, usePatchHospitalInfoMutation } from "../../onboard/services/OnBoardApi";
import { useDispatch } from "react-redux";
import { HospitalMapper } from "../../onboard/utils/mapHospitalPayload";
import { setHospitalId } from "../../onboard/services/OnBoardSlice";
import { HospitalForm } from "../../onboard/types/request.types";
import { useAppSelector } from "@/app/hook";
import { showToast } from "@/utils";
import { useLanguage } from "@/language/context/LanguageContext";

const HospitalInfoSet = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [hospitalDetails, setHospitalDetails] = React.useState(null);
  const user = useAppSelector((state) => state.auth.user_id) ?? Number(localStorage.getItem("user_id"));
  const hospitalId = useAppSelector((state) => state.onboard.hospitalId) ?? Number(localStorage.getItem("hospital_id"));

  const { data } = useGetHospitalInfoQuery({ limit: 1, page: 1, search: "" });
  const [patchHospitalInfo] = usePatchHospitalInfoMutation();

  useEffect(() => {
    if (data?.data?.length) {
      const apiHospital = data.data?.[0];
      // setHospitalId(apiHospital.id);
      dispatch(setHospitalId(apiHospital.id));
      localStorage.setItem("hospital_id", apiHospital.id.toString());
      setHospitalDetails((prev) => ({
        ...prev,
        hospital: HospitalMapper.toForm(apiHospital),
      }));
    }
  }, [data]);

  const handleHospitalNext = async (data: HospitalForm) => {
    try {
      const payload = HospitalMapper.toApi(data, Number(user));

      if (!hospitalId) {
        // CREATE
        showToast("Hospital ID not found. Cannot create hospital info.", "error");
        return;
      } else {
        // UPDATE
        await patchHospitalInfo({
          hospitalId,
          ...payload,
        }).unwrap();
      }
      setHospitalDetails((prev) => ({
        ...prev,
        hospital: data,
      }));

      showToast("Hospital info saved", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to save hospital info", "error");
    }
  };

  return (
    <div>
      <h1 className="text-[#01030F] font-semibold text-[16px] mb-4">{t("label.hospitalInfo")}</h1>
      <div className="bg-[white] min-h-[80vh] p-10 rounded-lg">
        <HospitalInfo hospitalData={hospitalDetails?.hospital} onNext={handleHospitalNext} isSetting={true} />
      </div>
    </div>
  );
};

export default HospitalInfoSet;
