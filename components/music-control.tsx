"use client"

import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBackgroundMusic, type MusicTrack } from "@/hooks/use-background-music"

interface MusicControlProps {
  track?: MusicTrack
  volume?: number
}

export function MusicControl({ track = "nature", volume = 0.3 }: MusicControlProps) {
  const { isPlaying, isMuted, toggleMusic, toggleMute } = useBackgroundMusic(track, volume)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={isPlaying ? toggleMute : toggleMusic}
      className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white/90"
      aria-label={isMuted || !isPlaying ? "Activar musica" : "Silenciar musica"}
    >
      {isMuted || !isPlaying ? (
        <VolumeX className="h-5 w-5 text-muted-foreground" />
      ) : (
        <Volume2 className="h-5 w-5 text-violet-600" />
      )}
    </Button>
  )
}
