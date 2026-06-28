import { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import { showToast } from "@/utils";
import { forceLogout } from "@/utils/logout";
import { CloseIcon, EyeSlashCloseIcon, EyeSlashOpenIcon } from "@/assets/icons";
import { CustomDialog } from "@/app/component";
import { FormInput } from "@/atoms";
import ChecklistImg from "@/assets/imgs/undraw_checklist.png";
import { useResetPasswordMutation } from "../services/authApi";
import { useGetDoctorInfoQuery } from "@/features/onboard/services/OnBoardApi";
import { useAppDispatch, useAppSelector } from "@/app/hook";
import { useLocation, useNavigate } from "react-router";
import { setForceChangePassword } from "../services/authSlice";
import { useLanguage } from "@/language/context/LanguageContext";

const validationSchema = Yup.object({
  password: Yup.string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .max(14, "Password must be at most 14 characters")
    //No spaces (but don't trigger on empty typing)
    .matches(/^\S*$/, {
      message: "Spaces are not allowed",
      excludeEmptyString: true,
    })

    //Strong password rule
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
      "Password must contain uppercase, lowercase, number, and special character",
    ),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

const ChangePassword = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isAfterLoginChange = location.pathname === "/changepassword";
  const { data } = useGetDoctorInfoQuery({ page: 1, limit: 1 }, { refetchOnMountOrArgChange: true });
  const dispatch = useAppDispatch();
  const userName = useAppSelector((state) => state.auth.username);
  const doctorEmail = data?.data?.[0]?.email || userName || sessionStorage.getItem("userName");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const forceChangePassword = useAppSelector((state) => state.auth.forceChangePassword);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (isSuccess && countdown === 0) {
      navigate("/auth/signin", { replace: true });
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  const handleSubmit = async (values: { password: string; confirmPassword: string }, { setSubmitting }: any) => {
    if (!doctorEmail) {
      showToast("Doctor email not found", "error");
      return;
    }

    try {
      await resetPassword({
        username: doctorEmail || "",
        newPassword: values.password,
      }).unwrap();

      const isResetNeededFlow = !!sessionStorage.getItem("temp_access_token");

      if (isResetNeededFlow) {
        sessionStorage.removeItem("temp_access_token");
        sessionStorage.removeItem("userName");
        setIsSuccess(true);
      } else if (isAfterLoginChange) {
        showToast("Password updated successfully. It will be applied the next time you log in.", "success");
        navigate("/", { replace: true });
      } else {
        showToast("Password changed successfully", "success");
        setTimeout(() => {
          forceLogout();
          localStorage.removeItem("forceChangePassword");
          dispatch(setForceChangePassword(false));
        }, 1500);
      }
    } catch (err: any) {
      const message = err?.data?.message?.[0] || "Failed to change password";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex relative justify-center h-screen items-center bg-white rounded-2xl px-8 py-6">
      {!forceChangePassword && (
        <div className="absolute top-6 right-6">
          <CloseIcon color="#98999E" className="cursor-pointer" onClick={() => navigate("/")} />
        </div>
      )}
      <div className="w-full max-w-md">
        {isSuccess ? (
          <div className="text-center flex flex-col items-center gap-4 justify-center">
            <img src={ChecklistImg} alt="checklist" />
            <h2 className="text-xl font-medium text-[#1C2253] mt-4">{t("changePassword.successTitle")}</h2>
            <p className="text-gray-600 mb-6">
              {t("changePassword.redirectMessage")} <span className="font-bold text-black">{countdown}</span>{" "}
              {t("changePassword.redirectSuffix")}
            </p>
            <span
              onClick={() => navigate("/auth/signin", { replace: true })}
              className="cursor-pointer w-full text-[#008cff] py-1"
            >
              {t("changePassword.goToLogin")}
            </span>
          </div>
        ) : (
          <>
            {/* Header */}

            <h2 className="text-xl text-center font-semibold text-black mb-6">{t("changePassword.title")}</h2>

            <Formik
              initialValues={{
                password: "",
                confirmPassword: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  {/* New Password */}
                  <div className="relative">
                    <FormInput name="password" label={t("changePassword.newPassword")} type={showPassword ? "text" : "password"} />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-12 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? (
                        <EyeSlashOpenIcon className="w-5 h-5" />
                      ) : (
                        <EyeSlashCloseIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <FormInput
                      name="confirmPassword"
                      label={t("changePassword.confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-12 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirm ? (
                        <EyeSlashOpenIcon className="w-5 h-5" />
                      ) : (
                        <EyeSlashCloseIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full bg-[#6070FF] text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? t("changePassword.updatingButton") : t("changePassword.updateButton")}
                  </button>
                </Form>
              )}
            </Formik>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
