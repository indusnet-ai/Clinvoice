import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft, ShieldCheck, Shield, Cloud, UserCheck } from "lucide-react";
import { showToast } from "@/utils";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../services/authApi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validation, setValidation] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotpassword, { isLoading: isForgotLoading, isSuccess }] = useForgotPasswordMutation();
  const [resetpassword, { isLoading: isResetLoading }] = useResetPasswordMutation();

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailSubmit = async (e: any) => {
    e.preventDefault();
    let valid = true;

    if (!email) {
      setValidation((prev) => ({ ...prev, email: "Email is required" }));
      valid = false;
    } else if (!validateEmail(email)) {
      setValidation((prev) => ({ ...prev, email: "Invalid email format" }));
      valid = false;
    } else {
      setValidation((prev) => ({ ...prev, email: "" }));
    }

    if (!valid) return;

    try {
      const res = await forgotpassword({ username: email }).unwrap();
      showToast(res?.message || "Email sent successfully with a temporary password", "success");
      navigate("/auth/signin");
    } catch (error: any) {
      showToast(error?.data?.message || "Server error. Please try again later.", "error");
    }
  };

  const handleResetSubmit = async (e: any) => {
    e.preventDefault();
    let valid = true;

    if (!newPassword || newPassword.length < 8) {
      setValidation((prev) => ({
        ...prev,
        newPassword: "Password must be at least 8 characters",
      }));
      valid = false;
    } else {
      setValidation((prev) => ({ ...prev, newPassword: "" }));
    }

    if (confirmPassword !== newPassword) {
      setValidation((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      valid = false;
    } else {
      setValidation((prev) => ({ ...prev, confirmPassword: "" }));
    }

    if (!valid) return;

    try {
      const payload = {
        username: email,
        password: newPassword,
      };
      await resetpassword(payload).unwrap();
      showToast("Reset password successfully", "success");
      navigate("/auth/signin");
    } catch (error: any) {
      showToast(error?.data?.message || "Server error. Please try again later.", "error");
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* ResetPassword Card */}
      <div className="w-full max-w-[460px] bg-white border border-slate-100 rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative">
        
        {/* Back Link */}
        <button
          onClick={() => navigate("/auth/signin")}
          className="absolute top-6 left-6 w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1.5">
            {step === 1 ? "Reset your password" : "Set new password"}
          </h2>
          <p className="text-xs font-semibold text-slate-400 max-w-xs mx-auto">
            {step === 1
              ? "Enter your registered email address to reset password"
              : "Enter and confirm your new password"}
          </p>
        </div>

        <form className="space-y-5" onSubmit={step === 1 ? handleEmailSubmit : handleResetSubmit}>
          {step === 1 && (
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border ${
                    validation.email ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                  } py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-4 transition-all duration-200`}
                  placeholder="doctor.test@example.com"
                />
              </div>
              {validation.email && (
                <span className="text-red-500 text-xs font-semibold mt-1 block">{validation.email}</span>
              )}
            </div>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full rounded-xl border ${
                      validation.newPassword ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-4 transition-all duration-200`}
                    placeholder="••••••••••••"
                  />
                </div>
                {validation.newPassword && (
                  <span className="text-red-500 text-xs font-semibold mt-1 block">{validation.newPassword}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl border ${
                      validation.confirmPassword ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                    } py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-4 transition-all duration-200`}
                    placeholder="••••••••••••"
                  />
                </div>
                {validation.confirmPassword && (
                  <span className="text-red-500 text-xs font-semibold mt-1 block">{validation.confirmPassword}</span>
                )}
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isForgotLoading || isResetLoading}
            className="w-full bg-[#4A52F6] hover:bg-[#3B43E2] disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-6"
          >
            {isForgotLoading || isResetLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>{step === 1 ? "Next" : "Submit"}</span>
            )}
          </button>
        </form>

        {/* Back link under form */}
        <p className="text-center text-xs text-slate-500 font-medium mt-6">
          Remember your password?{" "}
          <Link to="/auth/signin" className="text-[#4A52F6] hover:text-[#3B43E2] font-bold transition-colors">
            Sign In
          </Link>
        </p>

        {/* Trust Badges */}
        <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-6 mt-8">
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 leading-tight">HIPAA Compliant</span>
          </div>

          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 leading-tight">End-to-End Encryption</span>
          </div>

          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <Cloud className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 leading-tight">Secure Cloud Infrastructure</span>
          </div>

          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <UserCheck className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 leading-tight">PHI Data Protection</span>
          </div>
        </div>
      </div>

      {/* Footer copyright and links */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400 mt-8 max-w-[460px] px-2 gap-3 text-center md:text-left select-none">
        <span>© 2024 ClinVoice AI. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Contact Us</a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
