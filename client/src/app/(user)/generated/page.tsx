"use client"
import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import axios from "axios"
import { Play, Pause, Loader2, Music, Volume2, VolumeX, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AudioFile {
  gridfs_id: any // Changed from string to any to handle ObjectId properly
  filename: string
  uploaded_at: string
  content_type?: string
}
export default function AudioFilesPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<any>(null)
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
      const response = await axios.get(`${API_URL}/files-generated/${idString}`, {
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
  const handleDelete = async (fileId: any) => {
    try {
      if (nowPlaying === getObjectIdString(fileId)) {
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      }

      setIsLoading(true)
      const response = await axios.delete(`${API_URL}/files-generated/${getObjectIdString(fileId)}`, {
        params: { userId: userData.id },
      })

      // Update local state
      setAudioFiles((prevFiles) =>
        prevFiles.filter((file) => getObjectIdString(file.gridfs_id) !== getObjectIdString(fileId)),
      )

      if (nowPlaying === getObjectIdString(fileId)) {
        setNowPlaying(null)
      }

      return response.data
    } catch (error) {
      console.error("Deletion failed:", error)
      setError("Failed to delete file")
      throw error
    } finally {
      setIsLoading(false)
      setDeleteModalOpen(false)
    }
  }

  // Add this function to handle the delete button click
  const handleDeleteClick = (fileId: any) => {
    setFileToDelete(fileId)
    setDeleteModalOpen(true)
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
        const response = await axios.get(`${API_URL}/files-generated`, {
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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Card className="mb-8">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            Your Audio Uplaods
          </CardTitle>
          <CardDescription className="text-sm md:text-base">Browse and play your uploaded audio files</CardDescription>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
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
            <div className="bg-gradient-to-b from-secondary/10 to-secondary/30 rounded-lg p-4 mb-6 space-y-4 shadow-md">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Album/Audio Cover */}
                <div className="w-32 h-32 rounded-lg overflow-hidden shadow-lg flex-shrink-0 bg-black/10">
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <Music className="h-12 w-12 text-primary/60" />
                  </div>
                </div>

                <div className="flex-1 w-full">
                  {/* Audio Info */}
                  <div className="mb-4 text-center md:text-left">
                    <h3 className="font-semibold text-lg truncate">
                      {audioFiles.find((file) => getObjectIdString(file.gridfs_id) === nowPlaying)?.filename ||
                        "Unknown file"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        audioFiles.find((file) => getObjectIdString(file.gridfs_id) === nowPlaying)?.uploaded_at || "",
                      ).toLocaleString(undefined, { dateStyle: "medium" })}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 w-full">
                    <Slider
                      value={[currentTime]}
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      disabled={!duration}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:shadow-md"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center md:justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={toggleMute}>
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <div className="w-20 hidden md:block">
                        <Slider
                          value={[volume]}
                          min={0}
                          max={1}
                          step={0.01}
                          onValueChange={handleVolumeChange}
                          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled={true}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polygon points="19 20 9 12 19 4 19 20"></polygon>
                          <line x1="5" y1="19" x2="5" y2="5"></line>
                        </svg>
                      </Button>

                      <Button
                        variant="default"
                        size="icon"
                        className="h-12 w-12 rounded-full shadow-md"
                        onClick={() => handlePlay(nowPlaying, "")}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5 ml-0.5" />
                        )}
                      </Button>

                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled={true}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polygon points="5 4 15 12 5 20 5 4"></polygon>
                          <line x1="19" y1="5" x2="19" y2="19"></line>
                        </svg>
                      </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hidden md:flex" disabled={true}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <polygon points="11 19 2 12 11 5 11 19"></polygon>
                        <polygon points="22 19 13 12 22 5 22 19"></polygon>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && !nowPlaying && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-center p-4 rounded-md mb-6 text-sm">{error}</div>
          )}

          {/* Empty state */}
          {audioFiles.length === 0 && !isLoading && !error && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-secondary/5">
              <div className="w-20 h-20 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                <Music className="h-10 w-10 text-primary/70" />
              </div>
              <h3 className="text-lg font-medium mb-1">No audio files found</h3>
              <p className="text-muted-foreground text-sm">Upload audio files to see them here</p>
            </div>
          )}

          {/* Audio files list */}
          <div className="space-y-3 mt-6">
            {audioFiles.map((file) => {
              const idString = getObjectIdString(file.gridfs_id)
              return (
                <Card
                  key={idString}
                  className={`transition-colors hover:bg-secondary/10 ${
                    nowPlaying === idString ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md bg-secondary/30 flex items-center justify-center flex-shrink-0">
                        <Music className="h-5 w-5 text-primary/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base truncate">{file.filename}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.uploaded_at).toLocaleString(undefined, { dateStyle: "medium" })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handlePlay(file.gridfs_id, file.filename)}
                          variant={nowPlaying === idString ? "default" : "outline"}
                          size="sm"
                          className={`min-w-[40px] w-10 h-10 rounded-full p-0 ${
                            nowPlaying === idString && isPlaying ? "bg-primary" : ""
                          }`}
                          disabled={isLoading && nowPlaying !== idString}
                        >
                          {isLoading && nowPlaying === idString ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : nowPlaying === idString && isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4 ml-0.5" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(file.gridfs_id)}
                          variant="ghost"
                          size="sm"
                          className="min-w-[40px] w-10 h-10 rounded-full p-0 hover:bg-destructive/10 hover:text-destructive"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal - Placed outside the Card component */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this audio file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(fileToDelete)} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

