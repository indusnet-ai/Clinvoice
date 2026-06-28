import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, Shield, Cloud, UserCheck } from "lucide-react";
import { useAppDispatch } from "@/app/hook";
import { useSignupMutation } from "../services/authApi";
import { showToast } from "@/utils";
import { hydrateAuthFromLogin, setHospitalId } from "../services/authSlice";

const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const toggle = () => setShowPassword(!showPassword);
  const [signup, { isLoading }] = useSignupMutation();

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().min(5, "Password must be at least 5 characters").required("Password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await signup(values).unwrap();
        if (res?.status_code === 201) {
          handleLoginSuccess(res);
          showToast("Account created — welcome!", "success");
          navigate("/", { replace: true });
        } else {
          showToast(res?.message || "Sign up failed", "error");
        }
      } catch (err: any) {
        const message =
          err?.data?.message || err?.data?.detail || err?.message || err?.error || "Sign up failed";
        showToast(message, "error");
        setSubmitting(false);
      }
    },
  });

  const handleLoginSuccess = (res: any) => {
    const authPayload = {
      user_id: res?.user_id ?? null,
      hospital_id: res?.hospital_id ?? null,
      doctor_id: res?.doctor_id ?? null,
      access_token: res?.access_token ?? null,
      onboard: res?.onboard ?? {
        voice_address_completed: false,
        signature_completed: false,
        hospital_profile_completed: false,
        doctor_profile_completed: false,
      },
      doctor: res?.doctor ?? null,
      forceChangePassword: res?.is_reset_needed ?? false,
      username: res?.username,
    };
    dispatch(hydrateAuthFromLogin(authPayload));
    dispatch(setHospitalId(authPayload.hospital_id));
    localStorage.setItem("user_id", String(authPayload.user_id ?? ""));
    localStorage.setItem("access_token", String(authPayload.access_token ?? ""));
    localStorage.setItem("hospital_id", String(authPayload.hospital_id ?? ""));
    localStorage.setItem("forceChangePassword", String(res?.is_reset_needed ?? false));
    localStorage.setItem("userName", String(res?.username ?? ""));
    localStorage.setItem("onboard", JSON.stringify(authPayload.onboard));
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* SignUp Card */}
      <div className="w-full max-w-[460px] bg-white border border-slate-100 rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1.5">Create your account</h2>
          <p className="text-xs font-semibold text-slate-400">Get started with ClinVoice AI today</p>
        </div>

        <form className="space-y-5" onSubmit={formik.handleSubmit}>
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Full name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                className={`w-full rounded-xl border ${
                  formik.touched.name && formik.errors.name ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                } py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-4 transition-all duration-200`}
                placeholder="Dr. Ashwin Kumar"
              />
            </div>
            {formik.touched.name && formik.errors.name && (
              <span className="text-red-500 text-xs font-semibold mt-1 block">{formik.errors.name}</span>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={`w-full rounded-xl border ${
                  formik.touched.email && formik.errors.email ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                } py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-4 transition-all duration-200`}
                placeholder="you@example.com"
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <span className="text-red-500 text-xs font-semibold mt-1 block">{formik.errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className={`w-full rounded-xl border ${
                  formik.touched.password && formik.errors.password ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                } py-3 pl-11 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-4 transition-all duration-200`}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                onClick={toggle}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <span className="text-red-500 text-xs font-semibold mt-1 block">{formik.errors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#4A52F6] hover:bg-[#3B43E2] disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-6"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-xs text-slate-500 font-medium mt-6">
          Already have an account?{" "}
          <Link to="/auth/signin" className="text-[#4A52F6] hover:text-[#3B43E2] font-bold transition-colors">
            Sign In
          </Link>
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="w-full h-px bg-slate-100"></div>
          <span>OR</span>
          <div className="w-full h-px bg-slate-100"></div>
        </div>

        {/* SSO Button */}
        <button
          type="button"
          className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md"
        >
          <Shield className="w-4 h-4 text-blue-500" />
          <span>Sign up with SSO</span>
        </button>

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

export default SignUp;
