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

export default function InstrumentsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const { user, isLoaded } = useUser()
  const [selectedInstruments, setSelectedInstruments] = useState<{ [key: string]: number }>({})
  const [selected, setSelected] = useState<string[]>([])
  const hasUploaded = useRef(false)

  useEffect(() => {
    if (!hasUploaded.current) {
      HandleUserUpload()
      hasUploaded.current = true
    }
  }, [])

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

  const logSelection = () => {
    console.log("Selected Instruments and BPM:", selectedInstruments)

    // Here you could also send the selection to your backend
    // Example:
    // fetch('http://127.0.0.1:5000/save-instruments', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     userId: user?.id,
    //     instruments: selectedInstruments
    //   }),
    // });
  }

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <motion.h1
        className="text-5xl font-bold mb-12 text-center tracking-tight"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        Instrument Selection
      </motion.h1>

      <div className="flex justify-center mb-8">
        <Link href="/upload-analyze" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
          Go to Upload & Analysis
        </Link>
      </div>

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

      <motion.div className="mb-12 space-y-8">
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

      <motion.button
        onClick={logSelection}
        className="w-full py-4 px-6 rounded-lg text-xl font-bold bg-blue-600 hover:bg-blue-700 transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3 }}
      >
        Log Selection
      </motion.button>
    </motion.div>
  )
}

