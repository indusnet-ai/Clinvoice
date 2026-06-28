import { useState } from "react";
import UserProf from "../images/Profile.png";
import { fileUpload } from "../apiServices/Api";

interface ImageProp {
  setImage: (arg: any) => void;
  image: string;
}
export default function ImageUpload({ setImage }: ImageProp) {
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const handleImageChange = async (event: any) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("file", file);
      const data = await fileUpload(formData);
      setImage(data.data);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-26 h-26 mb-4 mt-6">
        <img
          src={selectedImage || UserProf}
          alt="Upload Preview"
          className="w-full h-full object-cover rounded-full border border-gray-300"
        />

        {/* File select icon positioned at the bottom */}
        <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-2">
          <label htmlFor="file-input">
            <div className="bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </label>
        </div>
      </div>

      {/* Hidden File Input */}
      <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
    </div>
  );
}
