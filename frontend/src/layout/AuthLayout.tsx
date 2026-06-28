// import React, {  ReactNode } from 'react';

// const AuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
//   return (
//     <div className="dark:bg-boxdark-2 dark:text-bodydark">
//       <main className="bg-white">
//         <div className="">
//           {children}
//         </div>
//       </main>
//       {/* <!-- ===== Main Content End ===== --> */}

//       {/* <!-- ===== Page Wrapper End ===== --> */}
//     </div>
//   );
// };

// export default AuthLayout;

import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { Mic, FileText, Code, Link as LinkIcon, ShieldCheck } from "lucide-react";
import doctorImg from "@/images/login_doctor.png";

const AuthLayout = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <main className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left side: branding, features, and illustration */}
        <div className="lg:col-span-7 flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative overflow-hidden bg-gradient-to-b from-indigo-50/40 via-white to-indigo-50/20">
          
          {/* Header Row */}
          <div className="flex items-center justify-between w-full mb-12">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4A52F6] flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 9V15M8 6V18M12 4V20M16 7V17M20 10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">ClinVoice AI</span>
            </div>
            
            {/* HIPAA Badge */}
            <div className="flex items-center gap-1.5 bg-white border border-emerald-100 rounded-full px-3.5 py-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">HIPAA Compliant</span>
            </div>
          </div>

          {/* Headline & Description */}
          <div className="max-w-2xl">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
              AI-Powered Voice <br />
              Documentation for <br />
              <span className="text-[#4A52F6]">Better Patient Care</span>
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-xl mb-10">
              Transform clinical conversations into accurate, structured EMR documentation in real-time.
              Save time. Reduce burnout. Focus on what matters.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mb-12 relative z-20">
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-0.5">Voice to EMR</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Convert conversations into structured clinical notes
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-0.5">AI Clinical Notes</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Generate SOAP, H&P, and progress notes instantly
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-0.5">ICD-10 Suggestions</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Smart coding assistance for accurate documentation
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FDF2F8] flex items-center justify-center text-[#BE185D] shrink-0 shadow-sm">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-0.5">EMR Integration</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Seamless integration with Epic and more
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Illustration container */}
          <div className="relative w-full h-[280px] md:h-[330px] lg:h-[350px] overflow-visible mt-auto flex items-end justify-start select-none">
            {/* Background blob decoration */}
            <div className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-indigo-100/40 rounded-[40px] blur-3xl z-0" />
            
            {/* Doctor Image */}
            <img 
              src={doctorImg} 
              alt="Doctor using ClinVoice AI" 
              className="absolute bottom-0 left-0 h-[95%] w-auto z-10 object-contain"
            />

            {/* Floating Audio Wave Bubble */}
            <div className="absolute top-[20%] left-[32%] bg-white rounded-2xl px-3.5 py-2 shadow-lg border border-slate-100 z-20 flex items-center gap-2 animate-[bounce_3s_infinite]">
              <div className="flex items-end gap-0.5 h-5">
                <div className="w-0.5 bg-indigo-500 rounded-full h-2 animate-[pulse_1s_infinite]"></div>
                <div className="w-0.5 bg-indigo-500 rounded-full h-4 animate-[pulse_1.2s_infinite]"></div>
                <div className="w-0.5 bg-indigo-500 rounded-full h-5 animate-[pulse_0.8s_infinite]"></div>
                <div className="w-0.5 bg-indigo-500 rounded-full h-3 animate-[pulse_1.4s_infinite]"></div>
                <div className="w-0.5 bg-indigo-500 rounded-full h-1.5 animate-[pulse_1.1s_infinite]"></div>
              </div>
            </div>

            {/* Floating AI Generated Note Card */}
            <div className="absolute bottom-[10%] left-[45%] bg-white rounded-2xl p-4 shadow-xl border border-slate-100/80 z-20 w-[230px] md:w-[260px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  AI Generated Note
                </span>
              </div>
              <h5 className="text-xs font-bold text-slate-800 mb-2">SOAP Note</h5>
              <div className="space-y-1.5 mb-3">
                <div className="h-1.5 bg-slate-100 rounded-full w-full"></div>
                <div className="h-1.5 bg-slate-100 rounded-full w-[90%]"></div>
                <div className="h-1.5 bg-slate-100 rounded-full w-[80%]"></div>
                <div className="h-1.5 bg-slate-100 rounded-full w-[95%]"></div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[9px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                  Note synced to Epic
                </span>
                <span className="font-extrabold text-red-600 tracking-tighter italic text-[11px]">Epic</span>
              </div>
            </div>

            {/* Floating Encrypted & Secure Badge */}
            <div className="absolute bottom-[2%] left-[82%] bg-white rounded-2xl p-3 shadow-lg border border-slate-100/60 z-30 flex flex-col items-center justify-center gap-1.5 w-[90px] text-center">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 12 12 22 12 22Z" fill="currentColor" opacity="0.15"/>
                  <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 12 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11L11 13L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[9px] font-bold leading-tight text-slate-700">Encrypted & Secure</span>
            </div>
          </div>
        </div>

        {/* Right side: content forms */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 lg:p-12 xl:p-16 overflow-y-auto min-h-screen">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
              <span className="text-sm font-medium text-slate-500">Loading...</span>
            </div>
          }>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
