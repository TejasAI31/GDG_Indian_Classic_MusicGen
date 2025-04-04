"use client"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"

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
]

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

export default function InstrumentsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const { user, isLoaded } = useUser()
  const [selectedInstruments, setSelectedInstruments] = useState<{ [key: string]: number }>({})
  const [selected, setSelected] = useState<string[]>([])
  const hasUploaded = useRef(false)
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [genre, setGenre] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [melody, setMelody] = useState<string>("");
  const [mood, setMood] = useState<string>("Neutral");
  const [complexity, setComplexity] = useState<number>(5);
  const [duration, setDuration] = useState<number>(60);
  const [customNotes, setCustomNotes] = useState<string>("");
  const [generationPrompt, setGenerationPrompt] = useState<string>("");
  const [analysisImages, setAnalysisImages] = useState<{
    waveform: string;
    harmonic: string;
  }>({ waveform: "", harmonic: "" });

  useEffect(() => {
    if (!hasUploaded.current) {
      HandleUserUpload()
      hasUploaded.current = true
    }
  }, [])

  // Update generation prompt when relevant state changes
  useEffect(() => {
    updateGenerationPrompt();
  }, [selectedInstruments, selected, genre, key, mood, complexity, duration, customNotes, melody]);

  // Update selected instruments based on analysis
  useEffect(() => {
    if (analysisData && analysisData.status === "success") {
      // Set the tempo if available in the analysis
      if (analysisData.analyses.key_tempo.status === "success") {
        const tempo = analysisData.analyses.key_tempo.tempo;
        const detectedKey = analysisData.analyses.key_tempo.key;
        setKey(detectedKey);
        
        // Update the detected instrument with its tempo
        if (analysisData.analyses.instrument.status === "success") {
          const predictedInstrument = analysisData.analyses.instrument.predicted_instrument;
          const matchedInstrument = instruments.find(
            i => i.name.toLowerCase().includes(predictedInstrument.toLowerCase())
          );
          
          if (matchedInstrument) {
            setSelected(prev => {
              if (!prev.includes(matchedInstrument.name)) {
                return [...prev, matchedInstrument.name];
              }
              return prev;
            });
            
            setSelectedInstruments(prev => ({
              ...prev,
              [matchedInstrument.name]: tempo
            }));
          }
        }
        
        // Update genre if detected
        if (analysisData.analyses.genre) {
          setGenre(analysisData.analyses.genre);
        }
      }
    }
  }, [analysisData]);

  const HandleUserUpload = async () => {
    try {
      if (isLoaded && user) {
        const userData = {
          id: user.id || null,
          email: user.emailAddresses?.[0]?.emailAddress || null,
          fullName: user.fullName || null,
        }
        
        // First check if user exists
        const checkResponse = await fetch(`${API_URL}/check_user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userData.id }),
        })
        
        if (!checkResponse.ok) {
          throw new Error("User check failed")
        }
        
        const checkResult = await checkResponse.json()
        
        if (checkResult.exists) {
          console.log("User already exists")
          return // Exit the function if user exists
        }
        
        // If user doesn't exist, proceed with upload
        const response = await fetch(`${API_URL}/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        })
        
        if (!response.ok) {
          console.log("Response Status:", response.status)
          throw new Error("Upload failed")
        }
        
        const result = await response.json()
        console.log(result.message)
      } else {
        console.warn("User not loaded or missing data")
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setFileUploaded(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !isLoaded || !user) {
      setError("Please select a file and ensure you're logged in");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/upload/${user.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Upload result:", result);
      setFileUploaded(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAudio = async () => {
    try {
      if (!selectedFile || !isLoaded || !user) {
        setError("Please select a file and ensure you're logged in");
        return;
      }

      if (!fileUploaded) {
        setError("Please upload the file first");
        return;
      }

      setLoading(true);

      // Call the process-audio endpoint
      const processResponse = await fetch(`${API_URL}/process-audio/${user.id}`, {
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
        const musicAnalysisResponse = await fetch(`${API_URL}/analyze-instruments/${user.id}`, {
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

  const handleInstrumentClick = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter((item) => item !== name))
    } else {
      setSelected([...selected, name])
    }
  }

  const handleBPMChange = (name: string, bpm: number) => {
    setSelectedInstruments((prev) => ({ ...prev, [name]: bpm }))
  }

  const updateGenerationPrompt = () => {
    // Create a pointwise prompt for music generation
    let promptPoints = [];
    
    // Add genre if available
    if (genre) {
      promptPoints.push(`genre: ${genre}`);
    }
    
    // Add instruments if selected
    if (selected.length > 0) {
      promptPoints.push(`instruments: ${selected.join(", ")}`);
    }
    
    // Add key if available
    if (key) {
      promptPoints.push(`key: ${key}`);
    }
    
    // Add mood
    promptPoints.push(`mood: ${mood}`);
    
    // Add instrument tempos
    const tempoPoints: string[] = [];
    Object.entries(selectedInstruments).forEach(([instrument, bpm]) => {
      if (selected.includes(instrument)) {
        tempoPoints.push(`${instrument}: ${bpm} BPM`);
      }
    });
    
    if (tempoPoints.length > 0) {
      promptPoints.push(`tempos: {
      ${tempoPoints.join(",\n    ")}
  }`);
    }
    
    // Add complexity
    promptPoints.push(`complexity: ${complexity}/10`);
    
    // Add duration
    promptPoints.push(`duration: ${duration} seconds`);
    
    // Add melody if available
    if (melody) {
      promptPoints.push(`melody: ${melody}`);
    }
    
    // Add custom notes if available
    if (customNotes) {
      promptPoints.push(`notes: ${customNotes}`);
    }
    
    // Join all points with line breaks
    setGenerationPrompt(promptPoints.join("\n"));
  };
  

  const handleGenerateMusic = () => {
    // This function would call your music generation API
    // using the generationPrompt
    console.log("Generating music with prompt:", generationPrompt);
    // Implement your music generation call here
  };

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <motion.h1
        className="text-5xl font-bold mb-12 text-center tracking-tight"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        Music Creation Studio
      </motion.h1>
      
      <div className="flex justify-center gap-4 mb-8">
        <Link href="/upload-analyze" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
          Go to Upload & Analysis
        </Link>
      </div>
      
      {/* File Upload Section */}
      <motion.div 
        className="mb-12 p-6 bg-gray-800 rounded-xl shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-6">Upload Your Music</h2>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 text-sm text-gray-300"
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || loading}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload File"}
            </button>
            <button
              onClick={handleAnalyzeAudio}
              disabled={!fileUploaded || loading}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing..." : "Analyze Audio"}
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}
          
          {selectedFile && (
            <p className="text-sm text-gray-300">
              Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
          
          {fileUploaded && (
            <div className="p-3 bg-green-900/30 border border-green-600 rounded-lg text-green-200">
              File uploaded successfully! You can now analyze it.
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Analysis Results Display */}
      {analysisData && (
        <motion.div 
          className="mb-12 p-6 bg-gray-800 rounded-xl shadow-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold mb-6">Analysis Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Audio Characteristics</h3>
              <ul className="space-y-2">
                <li><span className="text-gray-400">Genre:</span> {analysisData.analyses.genre || "Unknown"}</li>
                <li><span className="text-gray-400">Key:</span> {analysisData.analyses.key_tempo.key || "Unknown"}</li>
                <li><span className="text-gray-400">Tempo:</span> {analysisData.analyses.key_tempo.tempo?.toFixed(1) || "Unknown"} BPM</li>
                <li><span className="text-gray-400">Detected Instrument:</span> {analysisData.analyses.instrument.predicted_instrument || "Unknown"}</li>
              </ul>
            </div>
            
            {analysisImages.waveform && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Visualizations</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Waveform</p>
                    <img src={analysisImages.waveform} alt="Waveform visualization" className="w-full rounded-lg border border-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Harmonic Content</p>
                    <img src={analysisImages.harmonic} alt="Harmonic visualization" className="w-full rounded-lg border border-gray-700" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Instrument Selection */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold mb-6">Instrument Selection</h2>
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={instrument.image || "/placeholder.svg"}
                  alt={instrument.name}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    selected.includes(instrument.name) ? "brightness-75 sepia" : "brightness-100"
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
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
                
                <motion.div
                  className="absolute inset-0 border-2 border-transparent pointer-events-none"
                  initial={{ borderColor: "transparent" }}
                  whileHover={{ borderColor: "white", boxShadow: "0px 0px 15px rgba(255, 255, 255, 0.5)" }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-center font-medium text-gray-200">
                    Click to {selected.includes(instrument.name) ? "deselect" : "select"}
                  </p>
                </motion.div>
              </motion.div>
              
              <motion.p
                className="mt-4 text-center font-semibold text-lg transition-colors"
                style={{
                  color: selected.includes(instrument.name) ? "#22c55e" : "inherit",
                }}
              >
                {instrument.name}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Tempo Adjustment */}
      <motion.div 
        className="mb-12 space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-6">Adjust Tempo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments.map((instrument) => (
            <motion.div
              key={instrument.name}
              className="space-y-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium">{instrument.name}</label>
              <input
                type="range"
                min="1"
                max="240"
                value={selectedInstruments[instrument.name] || 60}
                onChange={(e) => handleBPMChange(instrument.name, Number.parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                disabled={!selected.includes(instrument.name)}
              />
              <div className="flex justify-between text-sm">
                <span>{selectedInstruments[instrument.name] || 60} BPM</span>
                {selected.includes(instrument.name) && <motion.span className="text-green-500">Selected</motion.span>}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Additional Music Parameters */}
      <motion.div 
        className="mb-12 p-6 bg-gray-800 rounded-xl shadow-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <h2 className="text-3xl font-bold mb-6">Music Parameters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., Classical, Jazz, Rock"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Key</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="">Select Key</option>
                <option value="C Major">C Major</option>
                <option value="A Minor">A Minor</option>
                <option value="G Major">G Major</option>
                <option value="E Minor">E Minor</option>
                <option value="D Major">D Major</option>
                <option value="B Minor">B Minor</option>
                <option value="A Major">A Major</option>
                <option value="F# Minor">F# Minor</option>
                <option value="E Major">E Major</option>
                <option value="C# Minor">C# Minor</option>
                <option value="B Major">B Major</option>
                <option value="G# Minor">G# Minor</option>
                <option value="F# Major">F# Major</option>
                <option value="D# Minor">D# Minor</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="Neutral">Neutral</option>
                <option value="Happy">Happy</option>
                <option value="Sad">Sad</option>
                <option value="Energetic">Energetic</option>
                <option value="Calm">Calm</option>
                <option value="Mysterious">Mysterious</option>
                <option value="Epic">Epic</option>
                <option value="Romantic">Romantic</option>
                <option value="Suspenseful">Suspenseful</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Complexity (1-10): {complexity}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={complexity}
                onChange={(e) => setComplexity(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (seconds): {duration}
              </label>
              <input
                type="range"
                min="30"
                max="300"
                step="10"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Melody Pattern</label>
              <input
                type="text"
                value={melody}
                onChange={(e) => setMelody(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., C-D-E-G or describe a pattern"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Additional Notes</label>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white h-32"
            placeholder="Add any specific requirements or details about the music you want to generate..."
          />
        </div>
      </motion.div>
      
      {/* Real-time Generation Prompt Display */}
      <motion.div
    className="mb-12 p-6 bg-gray-800 rounded-xl shadow-xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 1.0 }}
  >
    <h2 className="text-3xl font-bold mb-6">Generation Prompt</h2>
    <div className="p-4 bg-black/30 border border-gray-600 rounded-lg">
      <pre className="text-gray-300 whitespace-pre font-mono text-sm">{generationPrompt}</pre>
    </div>
    <div className="mt-4 flex justify-end">
      <button
        onClick={() => {
          navigator.clipboard.writeText(generationPrompt);
          // Optionally add a copied confirmation here
        }}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
      >
        Copy to Clipboard
      </button>
    </div>
  </motion.div>
  
  {/* Generate Button */}
  <motion.button
    onClick={handleGenerateMusic}
    className="w-full py-4 px-6 rounded-lg text-xl font-bold bg-blue-600 hover:bg-blue-700 transition-all duration-300"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.3 }}
  >
    Generate Music
  </motion.button>
</motion.div>
  )
}