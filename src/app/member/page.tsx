"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

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
  const [selectedInstruments, setSelectedInstruments] = useState<{ [key: string]: number }>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [mp3Uploaded, setMp3Uploaded] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

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

  const handleMP3Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Uploaded MP3:", file.name);
      setMp3Uploaded(true);
      setUploadedFileName(file.name);
    }
  };

  const handleMP3Cut = () => {
    setMp3Uploaded(false);
    setUploadedFileName(null);
  };

  const logSelection = () => {
    if (!mp3Uploaded) {
      console.log("Selected Instruments and BPM:", selectedInstruments);
    }
  };

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}>
      {/* Header Section */}
      <motion.h1 className="text-5xl font-bold mb-12 text-center tracking-tight"
                 whileHover={{ scale: mp3Uploaded ? 1 : 1.02 }}
                 transition={{ duration: 0.3 }}>
        Music Instrument Dashboard
      </motion.h1>

      {/* Instrument Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
        {instruments.map((instrument) => (
          <motion.div
            key={instrument.name}
            layoutId={`card-${instrument.name}`}
            className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl"
            onClick={() => handleInstrumentClick(instrument.name)}
          >
            {/* Instrument Card */}
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
              
              {/* Selection Overlay */}
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
              
              {/* Hover Effects */}
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

            {/* Instrument Name */}
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

      {/* BPM Controls Section */}
      <motion.div className="mb-12 space-y-8"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: 0.2 }}>
        <h2 className="text-3xl font-bold mb-6">Adjust Tempo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments.map((instrument) => (
            <motion.div key={instrument.name}
                       className="space-y-2"
                       whileHover={{ scale: mp3Uploaded ? 1 : 1.02 }}
                       transition={{ duration: 0.3 }}>
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

      {/* MP3 Upload Section */}
      <motion.div className="mb-12 space-y-4"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: 0.4 }}>
        <h2 className="text-3xl font-bold mb-4">Upload Music Track</h2>
        
        <input
          type="file"
          accept=".mp3"
          onChange={handleMP3Upload}
          className={`w-full px-4 py-3 rounded-lg border-2 border-gray-700 bg-gray-800 ${
            mp3Uploaded ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={mp3Uploaded}
        />
        
        {uploadedFileName && (
          <motion.div className="mt-4 flex items-center justify-between rounded-lg bg-gray-800 p-4"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 0.3 }}>
            <span className="text-sm text-gray-400">{uploadedFileName}</span>
            <button onClick={handleMP3Cut}
                    className="ml-2 text-red-500 hover:text-red-600 font-medium">
              Cancel Upload ❌
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Log Selection Button */}
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
    </motion.div>
  );
};

export default Page;