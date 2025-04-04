"use client";
import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface AudioProcessingResponse {
  message: string;
  input_filename?: string;
  output_filename?: string;
  output_path?: string;
  user_id?: string;
  error?: string;
  details?: string;
}

export default function UploadAnalyzePage() {
  const { user, isLoaded } = useUser();
  const [mp3Uploaded, setMp3Uploaded] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalysisMinimized, setIsAnalysisMinimized] = useState(false);
  const [analysisImages, setAnalysisImages] = useState<{
    waveform: string | null;
    harmonic: string | null;
  }>({ waveform: null, harmonic: null });
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const userId = user?.id || null;
  const hasUploaded = useRef(false);
  const [genre,setGenre] = useState<string | null>(null);
  useEffect(() => {
    if (!hasUploaded.current) {
      HandleUserUpload();
      hasUploaded.current = true;
    }
  }, []);

  const HandleUserUpload = async () => {
    try {
      if (isLoaded && user) {
        const userData = {
          id: user.id || null,
          email: user.emailAddresses?.[0]?.emailAddress || null,
          fullName: user.fullName || null,
        };

        // First check if user exists
        const checkResponse = await fetch(`${API_URL}/check_user`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: userData.id }),
        });

        if (!checkResponse.ok) {
          throw new Error('User check failed');
        }

        const checkResult = await checkResponse.json();

        if (checkResult.exists) {
          console.log('User already exists');
          return; // Exit the function if user exists
        }

        // If user doesn't exist, proceed with upload
        const response = await fetch(`${API_URL}/user`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          console.log('Response Status:', response.status);
          throw new Error('Upload failed');
        }

        const result = await response.json();
        console.log(result.message);
      } else {
        console.warn('User not loaded or missing data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleShowAnalysis = async () => {
    try {
      if (!selectedFile || !userId) {
        console.error("No file selected or user ID missing");
        return;
      }
      
      setShowAnalysis(true);
      
      // First check if the file has been uploaded
      if (!mp3Uploaded) {
        console.error("Please upload the file first");
        return;
      }
      
      // Call the process-audio endpoint
      const response = await fetch(`${API_URL}/process-audio/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Audio processing result:", result);
      
      if (result.status === 'success') {
        // Add timestamp to prevent browser caching
        const timestamp = Date.now();
        setGenre(result.genre);
        
        // Set the plot URLs from the response
        setAnalysisImages({
          waveform: `${API_URL}${result.plot_urls.waveform}?t=${timestamp}`,
          harmonic: `${API_URL}${result.plot_urls.harmonic}?t=${timestamp}`,
        });
      } else {
        console.error("Error processing audio:", result.error || "Unknown error");
      }
    } catch (error) {
      console.error('Error analyzing audio:', error);
    }
  };

  const handleMP3Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const confirmUpload = async () => {
    const userData = {
      id: user?.id || null,
      email: user?.emailAddresses?.[0]?.emailAddress || null,
      fullName: user?.fullName || null,
    }
  
    if (!selectedFile || !userData.id) return

    console.log("Uploading MP3:", selectedFile.name)
    setMp3Uploaded(true)
    setUploadedFileName(selectedFile.name)

    // Create temporary URL for preview
    const tempUrl = URL.createObjectURL(selectedFile)
    setAudioUrl(tempUrl)

    // Upload to server with user ID in the URL path
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      // Use the user ID in the URL path
      const response = await fetch(`${API_URL}/upload/${userData.id}`, {
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

    setShowConfirmDialog(false)
  }
  
  const handlePreview = () => {
    if (selectedFile) {
      const tempUrl = URL.createObjectURL(selectedFile);
      setAudioUrl(tempUrl);
      setShowAudioPlayer(true);
      setIsPlaying(true);
    }
  };
 
  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMP3Cut = () => {
    setMp3Uploaded(false);
    setUploadedFileName(null);
    setIsPlaying(false);
    setShowAudioPlayer(false);
  };

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <motion.h1 
        className="text-5xl font-bold mb-12 text-center tracking-tight"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        Music Upload & Analysis
      </motion.h1>

      <div className="flex justify-center mb-8">
        <Link 
          href="/instruments" 
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Go to Instrument Selection
        </Link>
      </div>

      <motion.div className="mb-12 space-y-4">
        <h2 className="text-3xl font-bold mb-4">Upload Music Track</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-full px-4 py-3 rounded-lg border-2 border-gray-700 bg-gray-800 ${
            mp3Uploaded ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={mp3Uploaded}
        >
          {uploadedFileName ? uploadedFileName : 'Upload MP3'}
        </button>
        
        <input
          type="file"
          accept=".mp3"
          ref={fileInputRef}
          onChange={handleMP3Upload}
          style={{ display: 'none' }}
        />
        
        {selectedFile && !mp3Uploaded && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 mt-4"
          >
            <span className="text-sm text-gray-400 flex-grow">{selectedFile.name}</span>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="ml-2 text-green-500 hover:text-green-600 font-medium"
            >
              Upload 📤
            </button>
            <button
              onClick={handlePreview}
              className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
            >
              Preview 🎵
            </button>
            <button
              onClick={handleCancel}
              className="ml-2 text-red-500 hover:text-red-600 font-medium"
            >
              Cancel ❌
            </button>
          </motion.div>
        )}

        {uploadedFileName && (
          <motion.div className="flex gap-4">
            <span className="text-sm text-gray-400">{uploadedFileName}</span>
            <button
              onClick={handleMP3Cut}
              className="ml-2 text-red-500 hover:text-red-600 font-medium"
            >
              Cancel Upload ❌
            </button>
          </motion.div>
        )}
      </motion.div>

      <motion.button
        onClick={handleShowAnalysis}
        className={`w-full py-4 px-6 rounded-lg text-xl font-bold transition-all duration-300 ${
          mp3Uploaded ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 cursor-not-allowed'
        }`}
        disabled={!mp3Uploaded}
        whileHover={{ scale: mp3Uploaded ? 1.02 : 1 }}
        whileTap={{ scale: mp3Uploaded ? 0.98 : 1 }}
        transition={{ duration: 0.3 }}
      >
        Show Audio Analysis
      </motion.button>

      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
              layoutId="confirmDialog"
            >
              <h3 className="text-xl font-bold mb-4">Confirm Upload</h3>
              <p className="mb-4">Are you sure you want to upload this MP3 file?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Confirm Upload
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAudioPlayer && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
              layoutId="audioPlayer"
            >
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <span className="font-medium">{uploadedFileName || 'Audio Track'}</span>
              </div>
              
              <audio
                src={audioUrl || ''}
                controls
                className="w-full"
                ref={(audio) => {
                  if (audio && isPlaying) {
                    audio.play();
                  } else if (audio) {
                    audio.pause();
                  }
                }}
              />
              
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setShowAudioPlayer(false);
                }}
                className="mt-4 w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAnalysis && (
        <div className="mt-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">Audio Analysis</h3>
            <button
              onClick={() => setIsAnalysisMinimized(!isAnalysisMinimized)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              {isAnalysisMinimized ? '⬇️ Show' : '⬆️ Hide'}
            </button>
          </div>
          
          {!isAnalysisMinimized && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysisImages.waveform && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Waveform</h4>
                  <img 
                    src={analysisImages.waveform || "/placeholder.svg"} 
                    alt="Waveform analysis" 
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
              
              {analysisImages.harmonic && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Harmonic/Percussive</h4>
                  <img 
                    src={analysisImages.harmonic || "/placeholder.svg"} 
                    alt="Harmonic analysis" 
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
