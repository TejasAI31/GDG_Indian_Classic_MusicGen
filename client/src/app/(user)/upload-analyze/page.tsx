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
interface AnalysisResponse {
  status: string;
  file_path: string;
  analyses: {
    genre: string;
    instrument: {
      status: string;
      predicted_instrument: string;
      probabilities: {
        Dhol: number;
        Flute: number;
        Sitar: number;
        Tabla: number;
        Veena: number;
      };
      features: {
        mel_spectrogram: {
          mean: number;
          std: number;
          min: number;
          max: number;
        };
        mfcc: {
          mean: number;
          std: number;
          min: number;
          max: number;
        };
      };
      analysis_type: string;
    };
    key_tempo: {
      status: string;
      key: string;
      tempo: number;
      analysis_type: string;
    };
  };
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
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
      setLoading(true);
      
      if (!mp3Uploaded) {
        console.error("Please upload the file first");
        return;
      }
      
      // Call the process-audio endpoint
      const processResponse = await fetch(`${API_URL}/process-audio/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!processResponse.ok) {
        throw new Error(`Server responded with ${processResponse.status}: ${processResponse.statusText}`);
      }
      
      const processResult = await processResponse.json();
      console.log("Audio processing result:", processResult);
      
      if (processResult.status === 'success') {
        const timestamp = Date.now();
        setGenre(processResult.genre);
        
        setAnalysisImages({
          waveform: `${API_URL}${processResult.plot_urls.waveform}?t=${timestamp}`,
          harmonic: `${API_URL}${processResult.plot_urls.harmonic}?t=${timestamp}`,
        });
  
        // Call the analyze-music endpoint
        const musicAnalysisResponse = await fetch(`${API_URL}/analyze-instruments/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!musicAnalysisResponse.ok) {
          throw new Error("Music analysis failed");
        }
  
        const musicAnalysisResult = await musicAnalysisResponse.json();
        console.log("Music analysis result:", musicAnalysisResult);
        
        // Store the analysis data in state
        setAnalysisData(musicAnalysisResult);
      } else {
        console.error("Error processing audio:", processResult.error || "Unknown error");
      }
    } catch (error) {
      console.error('Error analyzing audio:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
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
    <motion.div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-white px-6 py-12">
    <motion.h1 
      className="text-4xl md:text-5xl font-bold mb-12 text-center"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      Music Upload & Analysis
    </motion.h1>

    <div className="flex justify-center mb-8">
      <Link 
        href="/instruments" 
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      >
        Go to Instrument Selection
      </Link>
    </div>

    <motion.div className="mb-12 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold">Upload Music Track</h2>
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`w-full px-4 py-3 rounded-lg border-2 border-gray-600 bg-gray-800 text-left ${
          mp3Uploaded ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={mp3Uploaded}
      >
        {uploadedFileName || 'Upload MP3'}
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
          className="flex flex-wrap gap-4 mt-4 text-sm"
        >
          <span className="text-gray-400 flex-grow truncate">{selectedFile.name}</span>
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="text-green-500 hover:underline"
          >
            Upload 📤
          </button>
          <button
            onClick={handlePreview}
            className="text-blue-400 hover:underline"
          >
            Preview 🎵
          </button>
          <button
            onClick={handleCancel}
            className="text-red-500 hover:underline"
          >
            Cancel ❌
          </button>
        </motion.div>
      )}

      {uploadedFileName && (
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="truncate">{uploadedFileName}</span>
          <button
            onClick={handleMP3Cut}
            className="text-red-500 hover:underline"
          >
            Cancel Upload ❌
          </button>
        </div>
      )}
    </motion.div>

    <motion.button
      onClick={handleShowAnalysis}
      className={`w-full max-w-3xl mx-auto block py-4 px-6 rounded-lg text-xl font-semibold transition-all duration-300 ${
        mp3Uploaded ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 cursor-not-allowed text-gray-400'
      }`}
      disabled={!mp3Uploaded}
      whileHover={{ scale: mp3Uploaded ? 1.02 : 1 }}
      whileTap={{ scale: mp3Uploaded ? 0.98 : 1 }}
    >
      Show Audio Analysis
    </motion.button>

    {/* Confirm Upload Dialog */}
    <AnimatePresence>
      {showConfirmDialog && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full"
            layoutId="confirmDialog"
          >
            <h3 className="text-xl font-bold mb-4">Confirm Upload</h3>
            <p className="mb-4">Are you sure you want to upload this MP3 file?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
              >
                Confirm Upload
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Audio Preview Dialog */}
    <AnimatePresence>
      {showAudioPlayer && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full"
            layoutId="audioPlayer"
          >
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full hover:bg-gray-700"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <span className="font-medium truncate">{uploadedFileName || 'Audio Track'}</span>
            </div>

            <audio
              src={audioUrl || undefined}
              controls
              className="w-full"
              ref={(audio) => {
                if (audio && isPlaying) audio.play();
                else if (audio) audio.pause();
              }}
            />

            <button
              onClick={() => {
                setIsPlaying(false);
                setShowAudioPlayer(false);
              }}
              className="mt-4 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Audio Analysis Section */}
    {showAnalysis && (
      <div className="mt-12 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">Audio Analysis</h3>
          <button
            onClick={() => setIsAnalysisMinimized(!isAnalysisMinimized)}
            className="text-sm text-gray-300 hover:text-white"
          >
            {isAnalysisMinimized ? '⬇️ Show' : '⬆️ Hide'}
          </button>
        </div>

        {!isAnalysisMinimized && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysisImages.waveform && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Waveform</h4>
                  <img 
                    src={analysisImages.waveform} 
                    alt="Waveform analysis" 
                    className="w-full rounded"
                  />
                </div>
              )}

              {analysisImages.harmonic && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Harmonic/Percussive</h4>
                  <img 
                    src={analysisImages.harmonic} 
                    alt="Harmonic analysis" 
                    className="w-full rounded"
                  />
                </div>
              )}
            </div>

            {analysisData && (
              <motion.div
                className="bg-gray-900 p-6 rounded-xl space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-center">Music Analysis Results</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Genre */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2">Genre</h4>
                    <p className="text-2xl font-bold text-blue-400">{analysisData.analyses.genre}</p>
                  </div>

                  {/* Instrument */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2">Instrument</h4>
                    <p className="text-xl font-bold text-purple-400 mb-2">
                      {analysisData.analyses.instrument.predicted_instrument}
                    </p>
                    {Object.entries(analysisData.analyses.instrument.probabilities).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="w-24 truncate">{key}</span>
                        <div className="flex-1 h-2 bg-gray-600 rounded-full">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${val * 100}%` }}></div>
                        </div>
                        <span className="w-12 text-right">{(val * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Key & Tempo */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2">Key & Tempo</h4>
                    <p className="text-gray-300">Key: <span className="text-green-400 font-bold">{analysisData.analyses.key_tempo.key}</span></p>
                    <p className="text-gray-300">Tempo: <span className="text-green-400 font-bold">{analysisData.analyses.key_tempo.tempo} BPM</span></p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p>Mel Spectrogram Mean: <span className="font-medium">{analysisData.analyses.instrument.features.mel_spectrogram.mean.toFixed(2)}</span></p>
                      <p>MFCC Mean: <span className="font-medium">{analysisData.analyses.instrument.features.mfcc.mean.toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 truncate">File: {analysisData.file_path}</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    )}
  </motion.div>

);

}