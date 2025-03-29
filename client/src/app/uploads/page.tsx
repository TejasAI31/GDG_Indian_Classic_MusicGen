"use client"
import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import axios from "axios"
import { Play, Pause, Loader2, Music, Volume2, VolumeX } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface AudioFile {
  gridfs_id: any // Changed from string to any to handle ObjectId properly
  filename: string
  uploaded_at: string
  content_type?: string
}

export default function AudioFilesPage() {
  const { user, isLoaded } = useUser()
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nowPlaying, setNowPlaying] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  const userData = {
    id: user?.id || null,
    email: user?.emailAddresses?.[0]?.emailAddress || null,
    fullName: user?.fullName || null,
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Helper function to extract the ObjectId string from MongoDB format
  const getObjectIdString = (id: any): string => {
    // If it's already a string, return it
    if (typeof id === "string") return id

    // If it's an object with $oid property (MongoDB extended JSON format)
    if (id && typeof id === "object" && "$oid" in id) {
      return id.$oid
    }

    // If it's an object with a toString method (like ObjectId)
    if (id && typeof id.toString === "function") {
      const str = id.toString()
      // If it looks like an ObjectId string (24 hex chars)
      if (/^[0-9a-f]{24}$/i.test(str)) {
        return str
      }
    }

    // Last resort, just stringify it
    return String(id)
  }

  const handlePlay = async (fileId: any, filename: string) => {
    try {
      const idString = getObjectIdString(fileId)

      // If we're already playing this file, just toggle play/pause
      if (nowPlaying === idString) {
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
          } else {
            audioRef.current.play()
            setIsPlaying(true)
          }
        }
        return
      }

      // Clean up previous audio if any
      if (audioRef.current) {
        audioRef.current.pause()
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
        }
      }

      setIsLoading(true)
      setError(null)
      setNowPlaying(idString)

      console.log("Fetching file with ID:", idString)

      // Use the extracted ObjectId string
      const response = await axios.get(`http://localhost:5000/files/${idString}`, {
        responseType: "blob",
      })

      if (response.status !== 200) {
        throw new Error(`Failed to fetch audio file: ${response.status}`)
      }

      const url = URL.createObjectURL(response.data)
      audioUrlRef.current = url

      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.volume = volume
        audioRef.current.load()
        await audioRef.current.play()
        setIsPlaying(true)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Playback failed:", error)
      setError("Failed to play audio")
      setNowPlaying(null)
      setIsPlaying(false)
      setIsLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    // Don't clear nowPlaying to keep the UI state
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }

    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      const newTime = value[0]
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  useEffect(() => {
    if (!isLoaded || !user) return

    const fetchAudioFiles = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get("http://localhost:5000/files", {
          params: { userId: userData.id },
        })

        // Process the response data to ensure we have proper ObjectId handling
        const processedFiles = response.data.map((file: any) => ({
          ...file,
          // Store the original gridfs_id but also create a string version for comparison
          gridfs_id: file.gridfs_id,
          gridfs_id_string: getObjectIdString(file.gridfs_id),
        }))

        setAudioFiles(processedFiles)
      } catch (err) {
        setError("Failed to fetch audio files")
        console.error("Error fetching audio files:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAudioFiles()
  }, [userData.id, isLoaded, user])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Your Audio Library</CardTitle>
          <CardDescription>Browse and play your uploaded audio files</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Audio element (hidden) */}
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            className="hidden"
          />

          {/* Player controls (visible when a file is selected) */}
          {nowPlaying && (
            <div className="bg-secondary/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium truncate max-w-[70%]">
                  {audioFiles.find((file) => getObjectIdString(file.gridfs_id) === nowPlaying)?.filename ||
                    "Unknown file"}
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <div className="w-24">
                    <Slider value={[volume]} min={0} max={1} step={0.01} onValueChange={handleVolumeChange} />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => handlePlay(nowPlaying, "")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[currentTime]}
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    disabled={!duration}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && !nowPlaying && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error message */}
          {error && <div className="bg-destructive/10 text-destructive text-center py-4 rounded-md mb-4">{error}</div>}

          {/* Empty state */}
          {audioFiles.length === 0 && !isLoading && !error && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">No audio files found</h3>
              <p className="text-muted-foreground">Upload audio files to see them here</p>
            </div>
          )}

          {/* Audio files list */}
          <div className="space-y-3 mt-4">
            {audioFiles.map((file) => {
              const idString = getObjectIdString(file.gridfs_id)
              return (
                <Card key={idString} className={`transition-colors ${nowPlaying === idString ? "border-primary" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 mr-4">
                        <h3 className="font-medium truncate">{file.filename}</h3>
                        <p className="text-sm text-muted-foreground">{new Date(file.uploaded_at).toLocaleString()}</p>
                      </div>
                      <Button
                        onClick={() => handlePlay(file.gridfs_id, file.filename)}
                        variant={nowPlaying === idString ? "default" : "outline"}
                        size="sm"
                        className="min-w-[80px]"
                        disabled={isLoading && nowPlaying !== idString}
                      >
                        {isLoading && nowPlaying === idString ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : nowPlaying === idString && isPlaying ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" /> Play
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

