"use client";
import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

const instruments = [
  { name: "Sitar", image: "/sitar.png" },
  { name: "Tabla", image: "/tabla.png" },
  { name: "Flute (Bansuri)", image: "/flute.jpg" },
  { name: "Veena", image: "/veena.png" },
  { name: "Mridangam", image: "/mridangam.png" },
  { name: "Harmonium", image: "/harmonium.png" },
  { name: "Dholak", image: "/dholak.png" },
  { name: "Shehnai", image: "/shehnai.png" },
  { name: "Tanpura", image: "/tanpura.png" },
];

const Page = () => {
  const { user, isLoaded } = useUser();
  const [selectedInstruments, setSelectedInstruments] = useState<{ [key: string]: number }>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [mp3Uploaded, setMp3Uploaded] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInstrumentClick = (name: string) => {
    if (!mp3Uploaded) {
      if (selected.includes(name)) {
        setSelected(selected.filter(item => item !== name));
      } else {
        setSelected([...selected, name]);
      }
    }
  };

  const handleBPMChange = (name: string, bpm: number) => {
    if (!mp3Uploaded) {
      setSelectedInstruments(prev => ({ ...prev, [name]: bpm }));
    }
  };

  const handleMP3Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const confirmUpload = async () => {
    if (!selectedFile) return;

    console.log("Uploaded MP3:", selectedFile.name);
    setMp3Uploaded(true);
    setUploadedFileName(selectedFile.name);
    
    // Create temporary URL for preview
    const tempUrl = URL.createObjectURL(selectedFile);
    setAudioUrl(tempUrl);
    
    // Upload to server
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setMp3Uploaded(false);
      setUploadedFileName(null);
    }

    setSelectedFile(null);
    setShowConfirmDialog(false);
  };

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

  const logSelection = () => {
    if (!mp3Uploaded) {
      console.log("Selected Instruments and BPM:", selectedInstruments);
    }
  };

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <motion.h1 
        className="text-5xl font-bold mb-12 text-center tracking-tight"
        whileHover={{ scale: mp3Uploaded ? 1 : 1.02 }}
        transition={{ duration: 0.3 }}
      >
        Music Instrument Dashboard
      </motion.h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
        {instruments.map((instrument) => (
          <motion.div
            key={instrument.name}
            layoutId={`card-${instrument.name}`}
            className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl"
            onClick={() => handleInstrumentClick(instrument.name)}
          >
            <motion.div
              className="relative w-full aspect-square rounded-lg overflow-hidden"
              whileHover={{ scale: mp3Uploaded ? 1 : 1.05 }}
              whileTap={{ scale: mp3Uploaded ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={instrument.image}
                alt={instrument.name}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  selected.includes(instrument.name)
                    ? 'brightness-75 sepia'
                    : 'brightness-100'
                }`}
              />
              
              {selected.includes(instrument.name) && (
                <motion.div
                  layoutId={`overlay-${instrument.name}`}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-green-400 animate-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              )}

              {!mp3Uploaded && (
                <>
                  <motion.div
                    className="absolute inset-0 border-2 border-transparent pointer-events-none"
                    initial={{ borderColor: 'transparent' }}
                    whileHover={{ borderColor: 'white', boxShadow: '0px 0px 15px rgba(255, 255, 255, 0.5)' }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-center font-medium text-gray-200">
                      Click to {selected.includes(instrument.name) ? 'deselect' : 'select'}
                    </p>
                  </motion.div>
                </>
              )}
            </motion.div>
            
            <motion.p
              className="mt-4 text-center font-semibold text-lg transition-colors"
              style={{
                color: selected.includes(instrument.name) ? '#22c55e' : 'inherit'
              }}
            >
              {instrument.name}
            </motion.p>
          </motion.div>
        ))}
      </div>

      <motion.div className="mb-12 space-y-8">
        <h2 className="text-3xl font-bold mb-6">Adjust Tempo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments.map((instrument) => (
            <motion.div
              key={instrument.name}
              className="space-y-2"
              whileHover={{ scale: mp3Uploaded ? 1 : 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium">
                {instrument.name}
              </label>
              <input
                type="range"
                min="1"
                max="240"
                value={selectedInstruments[instrument.name] || 60}
                onChange={(e) => handleBPMChange(instrument.name, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                disabled={!selected.includes(instrument.name) || mp3Uploaded}
              />
              <div className="flex justify-between text-sm">
                <span>{selectedInstruments[instrument.name] || 60} BPM</span>
                {selected.includes(instrument.name) && (
                  <motion.span className="text-green-500">Selected</motion.span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

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
        onClick={logSelection}
        className={`w-full py-4 px-6 rounded-lg text-xl font-bold transition-all duration-300 ${
          mp3Uploaded ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={mp3Uploaded}
        whileHover={{ scale: mp3Uploaded ? 1 : 1.02 }}
        whileTap={{ scale: mp3Uploaded ? 1 : 0.98 }}
        transition={{ duration: 0.3 }}
      >
        Log Selection
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
    </motion.div>
  );
};

export default Page;