"use client";
import { useState, useRef } from 'react';
import { UploadCloud, XCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';  // Using sonner for toasts
interface AudioFile {
  _id: string;
  file_id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  description: string;
  tags: string[];
  uploaded_at: string;
  download_url?: string;
}

interface UploadResponse {
  success: boolean;
  message?: string;
  filename?: string;
  file_id?: string;
  metadata_id?: string;
  error?: string;
}

interface AudioFilesResponse {
  success: boolean;
  files?: AudioFile[];
  error?: string;
}
const AudioUploadInterface = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {user, isLoaded} = useUser();
   const [mp3Uploaded, setMp3Uploaded] = useState<boolean>(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
     const [audioUrl, setAudioUrl] = useState<string | null>(null);
     const[isAdmin, setIsAdmin] = useState<boolean>(true)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };
  const handleUpload = async () => {
    const userData = {
        id: user?.id || null,
        email: user?.emailAddresses?.[0]?.emailAddress || null,
        fullName: user?.fullName || null,
        role: user?.publicMetadata?.role || null
    };
    
    console.log("User Data:", userData)
    
    if (!selectedFile || !userData.id || !userData.role) return
    
    console.log("Uploading MP3:", selectedFile.name)
    setMp3Uploaded(true)
    setUploadedFileName(selectedFile.name)
    
    // Create temporary URL for preview
    const tempUrl = URL.createObjectURL(selectedFile)
    setAudioUrl(tempUrl)
    
    // Upload to server with user ID and role in the URL path
    const formData = new FormData()
    formData.append("file", selectedFile)
    
    try {
        // Use the user ID and role in the URL path
        const response = await fetch(`http://127.0.0.1:5000/upload-edit/${userData.id}/${userData.role}`, {
            method: "POST",
            body: formData,
        })
        
        if (!response.ok) {
            throw new Error("Upload failed")
        }
        
        const result = await response.json()
        console.log("Upload successful:", result)
    } catch (error) {
        console.error("Error:", error)
        setMp3Uploaded(false)
        setUploadedFileName(null)
    }
}
  // Function to fetch user's audio files

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-semibold mb-5 text-gray-800 dark:text-gray-100 text-center">Upload Audio</h2>

      {/* File Input with Icon */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Audio File
        </label>
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          <UploadCloud className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click to select or drag & drop</p>
        </div>
      </div>

      {/* Preview Section */}
      {previewUrl && selectedFile && (
        <div className="mb-5 p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 shadow-md">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedFile.name}</h3>
            <button onClick={handleCancel} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-600">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <audio controls className="w-full mt-3">
            <source src={previewUrl} type={selectedFile.type} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className={`px-4 py-2 rounded-md text-white w-full transition-all ${
            !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
        >
          Upload
        </button>

        <button
          onClick={handleCancel}
          disabled={!selectedFile}
          className={`px-4 py-2 rounded-md w-full transition-all ${
            !selectedFile ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AudioUploadInterface;
