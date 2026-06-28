import React, { useState } from "react";
import { useLanguage } from "@/language/context/LanguageContext";

const MedicalCaseSheet = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const { t } = useLanguage();

  return (
    <div>
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === "summary" && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">AI Notes summary</h2>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <Printer className="w-5 h-5 text-gray-600" /> */}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <Download className="w-5 h-5 text-gray-600" /> */}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <X className="w-5 h-5 text-gray-600" /> */}
                </button>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acute febrile illness</h3>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  The patient presents with a 2-day history of feeling unwell, accompanied by high fever (103°F/39.4°C),
                  chills, and body aches. These symptoms are consistent with an acute febrile illness, possibly of
                  infectious etiology. The differential diagnosis at this point could include viral infections (such as
                  influenza or COVID-19) or bacterial infections. Further evaluation is needed to determine the specific
                  cause.
                </p>

                <ul className="space-y-2 ml-4">
                  <li className="text-gray-700">
                    - Obtain detailed history regarding onset, progression, and associated symptoms
                  </li>
                  <li className="text-gray-700">- Perform physical examination</li>
                  <li className="text-gray-700">
                    - Consider diagnostic tests (e.g., complete blood count, rapid influenza test, COVID-19 test) based
                    on clinical presentation and examination findings
                  </li>
                  <li className="text-gray-700">- Discuss symptomatic management options</li>
                  <li className="text-gray-700">
                    - Provide patient education on red flag symptoms and when to seek immediate medical attention
                  </li>
                  <li className="text-gray-700">- Schedule follow-up as clinically indicated Acute febrile illness</li>
                </ul>

                <p>
                  The patient presents with a 2-day history of feeling unwell, accompanied by high fever (103°F/39.4°C),
                  chills, and body aches. These symptoms are consistent with an acute febrile illness, possibly of
                  infectious etiology. The differential diagnosis at this point could include viral infections (such as
                  influenza or COVID-19) or bacterial infections. Further evaluation is needed to determine the specific
                  cause.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "soap" && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">SOAP Notes</h2>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <Printer className="w-5 h-5 text-gray-600" /> */}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <Download className="w-5 h-5 text-gray-600" /> */}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <X className="w-5 h-5 text-gray-600" /> */}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Subjective Section */}
              <div>
                <div className="bg-blue-100 px-4 py-3 rounded-t-lg">
                  <h3 className="text-base font-semibold text-gray-900">Subjective</h3>
                </div>
                <div className="bg-blue-50 px-4 py-4 rounded-b-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Acute febrile illness</h4>
                  <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p>
                      The patient presents with a 2-day history of feeling unwell, accompanied by high fever
                      (103°F/39.4°C), chills, and body aches. These symptoms are consistent with an acute febrile
                      illness, possibly of infectious etiology. The differential diagnosis at this point could include
                      viral infections (such as influenza or COVID-19) or bacterial infections. Further evaluation is
                      needed to determine the specific cause.
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li>- Obtain detailed history regarding onset, progression, and associated symptoms</li>
                      <li>- Perform physical examination</li>
                      <li>
                        - Consider diagnostic tests (e.g., complete blood count, rapid influenza test, COVID-19 test)
                        based on clinical presentation and examination findings
                      </li>
                      <li>- Discuss symptomatic management options</li>
                      <li>
                        - Provide patient education on red flag symptoms and when to seek immediate medical attention
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Objective Section */}
              <div>
                <div className="bg-blue-100 px-4 py-3 rounded-t-lg">
                  <h3 className="text-base font-semibold text-gray-900">Objective</h3>
                </div>
                <div className="bg-blue-50 px-4 py-4 rounded-b-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Acute febrile illness</h4>
                  <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p>
                      The patient presents with a 2-day history of feeling unwell, accompanied by high fever
                      (103°F/39.4°C), chills, and body aches. These symptoms are consistent with an acute febrile
                      illness, possibly of infectious etiology. The differential diagnosis at this point could include
                      viral infections (such as influenza or COVID-19) or bacterial infections. Further evaluation is
                      needed to determine the specific cause.
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li>- Obtain detailed history regarding onset, progression, and associated symptoms</li>
                      <li>- Perform physical examination</li>
                      <li>
                        - Consider diagnostic tests (e.g., complete blood count, rapid influenza test, COVID-19 test)
                        based on clinical presentation and examination findings
                      </li>
                      <li>- Discuss symptomatic management options</li>
                      <li>
                        - Provide patient education on red flag symptoms and when to seek immediate medical attention
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pdf" && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Case Sheet summary</h2>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <Printer className="w-5 h-5 text-gray-600" /> */}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <Download className="w-5 h-5 text-gray-600" /> */}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {/* <X className="w-5 h-5 text-gray-600" /> */}
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Hospital Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-indigo-600 mb-1">P ClinVoice Hospitals</h3>
                  <p className="text-xs text-gray-600">Healthcare Scitrasop Television Estates,</p>
                  <p className="text-xs text-gray-600">(HTE) 5th floor, Block C. The Between York,</p>
                  <p className="text-xs text-gray-600">Fifth road, Taramani, Chennai, Tamilnadu, 600113</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">#919157323</p>
                  <p className="text-gray-600">konthainyara@clinvoice.com</p>
                  <p className="text-gray-600">www.clinvoice.com</p>
                  <p className="font-semibold mt-2">25-02-2025 11:00 AM</p>
                </div>
              </div>

              {/* Patient Information Grid */}
              <div className="grid grid-cols-5 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Name</p>
                  <p className="font-semibold">Royapuram Pater</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Patient ID</p>
                  <p className="font-semibold">PT29234</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Age & Gender</p>
                  <p className="font-semibold">24 Years Male</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Mobile Number</p>
                  <p className="font-semibold">+919515157323</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Email ID</p>
                  <p className="font-semibold">peter@gmail.com</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Address</p>
                  <p className="font-semibold">Chennai, Tamilnadu</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Doctor Name</p>
                  <p className="font-semibold">Dr. Agathiyar</p>
                </div>
                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <svg className="h-12" viewBox="0 0 100 40">
                      <rect x="2" y="5" width="2" height="30" fill="black" />
                      <rect x="6" y="5" width="1" height="30" fill="black" />
                      <rect x="9" y="5" width="2" height="30" fill="black" />
                      <rect x="13" y="5" width="1" height="30" fill="black" />
                      <rect x="16" y="5" width="3" height="30" fill="black" />
                      <rect x="21" y="5" width="1" height="30" fill="black" />
                      <rect x="24" y="5" width="2" height="30" fill="black" />
                      <rect x="28" y="5" width="1" height="30" fill="black" />
                      <rect x="31" y="5" width="2" height="30" fill="black" />
                    </svg>
                    <p className="text-xs mt-1">PT29234</p>
                  </div>
                </div>
              </div>

              {/* Vitals Table */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">{t("casesheet.vitals")}</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.temperature")}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.pulse")}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.bloodPressure")}</th>
                      <th className="px-4 py-2 text-left font-semibold">Respiratory Rate</th>
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.weight")}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.height")}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.spo2")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3">102°C</td>
                      <td className="px-4 py-3">92 bpm</td>
                      <td className="px-4 py-3">100/70 mmhg</td>
                      <td className="px-4 py-3">52 rpm</td>
                      <td className="px-4 py-3">92 kg</td>
                      <td className="px-4 py-3">167 cm</td>
                      <td className="px-4 py-3">99°C</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Chief Complaints */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">{t("casesheet.chiefComplaints")}</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.symptoms")}</th>
                      <th className="px-4 py-2 text-left font-semibold">Body Site</th>
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.duration")}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t("casesheet.remarks")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3">Fever</td>
                      <td className="px-4 py-3">Body</td>
                      <td className="px-4 py-3">4 Days</td>
                      <td className="px-4 py-3">Every 3 hours once</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Past Treatment History */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-2">Past Treatment History</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Designing a treatment plan or screen for a web application requires a layout that is user-friendly,
                  intuitive, and organized to help doctors quickly and accurately develop and update patient care plans.
                  Below are key components and design elements
                </p>
              </div>

              {/* Diagnosis */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Diagnosis</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="px-4 py-2 text-left font-semibold">Test Categories</th>
                      <th className="px-4 py-2 text-left font-semibold">Sub-categories</th>
                      <th className="px-4 py-2 text-left font-semibold">Laboratory</th>
                      <th className="px-4 py-2 text-left font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalCaseSheet;
