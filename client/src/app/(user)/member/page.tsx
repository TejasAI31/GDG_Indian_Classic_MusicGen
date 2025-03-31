"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
interface CardSectionProps {
  title: string
  isRevealed: boolean
  delay: number
  emoji: string
  description: string
  imageName: string
}
interface UserData {
  id: string | null
  email: string | null
  fullName: string | null
}

const Index = () => {
  const { user, isLoaded } = useUser()
  const HandleUserUpload = async () => {
    try {
      if (isLoaded && user) {
        const userData = {
          id: user.id || null,
          email: user.emailAddresses?.[0]?.emailAddress || null,
          fullName: user.fullName || null,
        }

        // First check if user exists
        const checkResponse = await fetch("http://127.0.0.1:5000/check_user", {
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
        const response = await fetch("http://127.0.0.1:5000/user", {
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

  const hasUploaded = useRef(false)

  useEffect(() => {
    if (!hasUploaded.current) {
      HandleUserUpload()
      hasUploaded.current = true
    }
  }, [])
  const [isRevealed, setIsRevealed] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: event.clientX,
        y: event.clientY,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    // Only reveal if clicking on the background, not cards
    if (e.target === containerRef.current) {
      setIsRevealed(true)
    }
  }

  const getCursorStyle = (): React.CSSProperties => {
    return {
      background: `radial-gradient(circle 250px at ${mousePosition.x}px ${mousePosition.y}px, 
                rgba(200, 200, 200, 0.5), transparent 70%)`,
      transition: "background 300ms ease-out",
    }
  }

  const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
`

  return (
    <div ref={containerRef} className="min-h-screen w-full relative overflow-hidden bg-black" onClick={handleClick}>
      <style jsx>{pulseAnimation}</style>
      {!isRevealed && <div className="absolute inset-0 pointer-events-none z-10" style={getCursorStyle()} />}

      <div
        className={`max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-0 ${
          isRevealed ? "opacity-100" : "opacity-50"
        }`}
        style={{
          transition: "opacity 1000ms ease-out",
          pointerEvents: isRevealed ? "auto" : "none", // Disable clicks until revealed
        }}
      >
        <Link href="/explore" className="relative z-10" onClick={(e) => (isRevealed ? null : e.preventDefault())}>
          <CardSection
            title="Explore"
            isRevealed={isRevealed}
            delay={200}
            emoji="🎧"
            description="Immerse yourself in the world of indian classical music with handpicked songs "
            imageName="explore.png"
          />
        </Link>
        <Link
          href="/upload-analyze"
          className="relative z-10"
          onClick={(e) => (isRevealed ? null : e.preventDefault())}
        >
          <CardSection
            title="Analyze"
            isRevealed={isRevealed}
            delay={400}
            emoji="🎶"
            description="Analyze and understand the intricacies of your favorite songs"
            imageName="analyze.png"
          />
        </Link>
        <Link href="/instruments" className="relative z-10" onClick={(e) => (isRevealed ? null : e.preventDefault())}>
          <CardSection
            title="Generate"
            isRevealed={isRevealed}
            delay={600}
            emoji="🎹"
            description="Generate music based on your favorite songs"
            imageName="generate.png"
          />
        </Link>
      </div>
    </div>
  )
}
const CardSection: React.FC<CardSectionProps> = ({ title, isRevealed, delay, emoji, description, imageName }) => {
  // Construct the image path
  const imagePath = `/${imageName}`

  return (
    <div
      className="transition-all duration-700 ease-out hover:transform"
      style={{
        transform: isRevealed ? "translateY(0)" : "translateY(8px)",
        opacity: isRevealed ? 1 : 0.3,
        transitionDelay: `${delay}ms`,
        transitionProperty: "transform, opacity",
        animation: isRevealed ? `pulse 2s ease-in-out ${delay + 500}ms` : "none",
      }}
    >
      <Card
        className="h-96 overflow-hidden relative cursor-pointer group 
             hover:shadow-xl border-0 transition-all duration-500 
             ease-out hover:shadow-gray-400/40
             hover:transform hover:-translate-y-1"
      >
        {/* Background image with dark overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${imagePath})` }}
        />
        <div className="absolute inset-0 bg-black/60 transition-all duration-500 group-hover:bg-black/40" />
        <div className="absolute inset-0 backdrop-blur-sm transition-opacity duration-500 opacity-30 group-hover:opacity-40" />

        <CardContent className="relative h-full flex flex-col items-center justify-center p-6 z-10">
          <div
            className="w-24 h-24 mb-6 rounded-full flex items-center justify-center 
               bg-gray-800/80 border border-gray-600 transition-all duration-400 
               ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 group-hover:bg-gray-700/70
               group-hover:border-gray-500 group-hover:shadow-lg"
          >
            <span
              className="text-4xl text-gray-100 transition-transform duration-400 
                  group-hover:scale-110 group-hover:text-white"
            >
              {emoji}
            </span>
          </div>
          <h2
            className="text-white text-3xl font-bold mb-4 tracking-wide 
                         transition-all duration-500 group-hover:tracking-wider group-hover:text-gray-100"
          >
            {title}
          </h2>
          <p
            className="text-center text-gray-300 transition-all duration-500 
                        group-hover:text-gray-200 px-4"
          >
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Index

