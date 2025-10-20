import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  title: string;
  description: string;
  onImageUpload: (base64Image: string | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, description, onImageUpload }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        onImageUpload(result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      onImageUpload(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    onImageUpload(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div
        onClick={handleAreaClick}
        className={`relative w-full h-64 border-2 border-dashed rounded-lg flex justify-center items-center cursor-pointer transition-all duration-300 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50`}
      >
        {imagePreview ? (
          <>
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
            <button
              onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
              className="absolute top-2 right-2 bg-white rounded-full p-1.5 text-gray-600 hover:bg-red-500 hover:text-white transition-colors shadow-md"
              aria-label="Remove image"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <div className="text-center text-gray-400">
            <UploadCloud className="mx-auto h-12 w-12" />
            <p className="mt-2 text-sm">Click to upload image</p>
          </div>
        )}
      </div>
    </div>
  );
};