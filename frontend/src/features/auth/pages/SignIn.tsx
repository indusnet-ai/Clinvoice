import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Shield, Cloud, UserCheck } from "lucide-react";
import { useAppDispatch } from "@/app/hook";
import { useLoginMutation } from "../services/authApi";
import { showToast } from "@/utils";
import { hydrateAuthFromLogin, setHospitalId } from "../services/authSlice";

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("logout") === "success") {
      showToast("Logout Successfully", "success");
      // Clean up the URL
      navigate("/auth/signin", { replace: true });
    }
  }, [location, navigate]);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().min(5, "Password must be at least 5 characters").required("Password is required"),
    }),

    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          username: values.email,
          password: values.password,
        };
        const res = await login(payload).unwrap();
        if (res?.status_code !== 201) {
          showToast(res?.message || "Incorrect Username/Password", "error");
          return;
        }

        if (res?.status_code === 201) {
          if (res?.is_reset_needed) {
            sessionStorage.setItem("temp_access_token", res.access_token);
            sessionStorage.setItem("userName", res.username);
            navigate("/auth/change-password", { replace: true });
            return;
          } else {
            handleLoginSuccess(res);
            showToast("Login Successfully", "success");
            navigate("/", { replace: true });
          }
        }
      } catch (err: any) {
        const message =
          err?.data?.message || err?.data?.detail || err?.message || err?.error || "Incorrect Username/Password";
        showToast(message, "error");
        setSubmitting(false);
      }
    },
  });

  const handleLoginSuccess = (res: any) => {
    const hospital = res?.hospitals?.[0] ?? null;
    const doctor = res?.doctors?.[0] ?? null;

    const authPayload = {
      user_id: res?.user_id ?? null,
      hospital_id: hospital?.id ?? null,
      doctor_id: doctor?.id ?? null,
      access_token: res?.access_token ?? null,

      onboard: {
        voice_address_completed: !!res?.voice_address_completed,
        signature_completed: !!res?.signature_completed,
        hospital_profile_completed: !!res?.hospital_profile_completed,
        doctor_profile_completed: !!res?.doctor_profile_completed,
      },

      doctor: doctor
        ? {
            doctor_name: doctor?.name ?? null,
            doctor_email: doctor?.email ?? null,
            spec: doctor?.specialisation ?? null,
          }
        : null,
      forceChangePassword: res?.is_reset_needed ?? false,
      username: res?.username,
    };

    dispatch(hydrateAuthFromLogin(authPayload));
    dispatch(setHospitalId(authPayload.hospital_id));

    localStorage.setItem("user_id", authPayload.user_id ?? "");
    localStorage.setItem("access_token", authPayload.access_token ?? "");
    localStorage.setItem("hospital_id", authPayload.hospital_id ?? "");
    localStorage.setItem("forceChangePassword", String(res.is_reset_needed));
    localStorage.setItem("userName", String(res.username));
    localStorage.setItem("onboard", JSON.stringify(authPayload.onboard));
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Login Card */}
      <div className="w-full max-w-[460px] bg-white border border-slate-100 rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1.5">Welcome back</h2>
          <p className="text-xs font-semibold text-slate-400">Sign in to continue to ClinVoice AI</p>
        </div>

        <form className="space-y-5" onSubmit={formik.handleSubmit}>
          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="email"
                name="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={`w-full rounded-xl border ${
                  formik.touched.email && formik.errors.email ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                } py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-4 transition-all duration-200`}
                placeholder="doctor.test@example.com"
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
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <span className="text-red-500 text-xs font-semibold mt-1 block">{formik.errors.password}</span>
            )}
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="remember"
                className="rounded border-slate-300 text-[#4A52F6] focus:ring-[#4A52F6] h-4 w-4 transition-colors"
              />
              <span className="text-slate-500 font-semibold">Remember me</span>
            </label>

            <Link to="/auth/forgotpassword" className="text-[#4A52F6] hover:text-[#3B43E2] font-bold transition-colors">
              Forgot password?
            </Link>
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
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-xs text-slate-500 font-medium mt-6">
          Don't have an account?{" "}
          <Link to="/auth/signup" className="text-[#4A52F6] hover:text-[#3B43E2] font-bold transition-colors">
            Sign up
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
          <span>Sign in with SSO</span>
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

export default SignIn;
