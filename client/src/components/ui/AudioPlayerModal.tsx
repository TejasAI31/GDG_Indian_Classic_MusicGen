import { useState, useRef, ChangeEvent } from 'react';
import { motion, MotionConfig } from 'framer-motion';

interface MusicPlayerProps {
  audioSrc: string;
}

const MusicPlayer = ({ audioSrc }: MusicPlayerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchRandomAudio = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/random-audio');
      
      if (!response.ok) {
        throw new Error('Failed to fetch audio');
      }

      // Create a blob URL from the response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Set the audio source and play
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          setError('Playback failed. Please click play button.');
        });
      }
    } catch (err) {
      console.error('Error fetching audio:', err);
      setError('Failed to load audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Random Audio Player</h1>
      
      <div className="flex flex-col items-center gap-4">
        <audio
          ref={audioRef}
          controls
          className="w-full max-w-md"
        >
          Your browser does not support the audio element.
        </audio>
        
        <button
          onClick={fetchRandomAudio}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          {isLoading ? 'Loading...' : 'Get Random Audio'}
        </button>
        
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>

  );
};

export default MusicPlayer;