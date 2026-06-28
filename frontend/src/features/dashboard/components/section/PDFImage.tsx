import React from "react";
import clinVoiceImg from "../../../../images/ClinVoice_icon.png";

function PDFImage({
  hospitalName,
  hospitalAddress1,
  hospitalAddress2,
  patientName,
  patientId,
  age,
  gender,
  email,
  address,
  doctorName,
  chiefComplaints,
}) {
  return (
    <div className="flex items-center justify-baseline flex-col p-1">
      {/* Header Section */}
      <div className="p-0.5">
        <div className="flex text-nowrap gap-0.5 justify-baseline items-center  ">
          <img src={clinVoiceImg} alt="Hospital Logo" className="h-2 w-2" />
          <h1 className="text-blue-800 text-[6px] font-normal">{hospitalName}</h1>
        </div>

        {/* Address */}
        <p className="flex items-center flex-wrap pt-0.5 text-left mb-0.5 text-[2px] text-[#9CA3AF]">
          {hospitalAddress1}

          {hospitalAddress2}
        </p>
      </div>

      <div className="border-b border-0 bg-transparent border-gray-400 w-full"></div>
      {/* Patient Information Grid */}

      <div className="grid grid-cols-3 w-full bg-[#B8BFFF] h-2  py-0.5 mt-0.5 text-left pl-0.5 ">
        <div className="text-[2px]">
          <div className="text-[#5B6B9C]">Name</div>
          <div>{patientName}</div>
        </div>

        <div className="text-[2px]">
          <div className="text-[#5B6B9C]">Patient ID</div>
          <div>{patientId}</div>
        </div>
        <div className="text-[2px]">
          <div className="text-[#5B6B9C]">Age & Gender</div>
          <div>
            {age} / {gender}
          </div>
        </div>
      </div>

      {/* Contact Information Grid */}
      <div className="grid grid-cols-2 w-full mt-0.5 text-left">
        <div>
          <div className="text-[2px] text-[#666666] ">Email ID</div>
          <div className="text-[2px] text-[#333333]">{email}</div>
        </div>

        <div>
          <div className="text-[2px] text-[#666666]">Address</div>
          <div className="text-[2px] text-[#333333]">{address}</div>
        </div>
      </div>

      {/* Chief Complaints Section */}

      <div className="w-full bg-[#B8BFFF] py-0.5 mt-0.5 text-left pl-0.5 p-0.5 ">
        <h2 className="text-[2px]  text-[#1C2253]">Chief Complaints</h2>
      </div>
      <div className="text-[2px] w-full pl-1 overflow-hidden text-left text-[#666666]">{chiefComplaints}</div>
    </div>
  );
}

export default PDFImage;
