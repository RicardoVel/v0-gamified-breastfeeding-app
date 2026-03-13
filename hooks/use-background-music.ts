"use client"

import { useEffect, useState, useCallback } from "react"
import { audioManager, type MusicTrack } from "@/lib/audio-manager"

export { type MusicTrack, BACKGROUND_MUSIC } from "@/lib/audio-manager"

export function useBackgroundMusic(track: MusicTrack = "nature", volume: number = 0.3) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(audioManager.getMuted())

  useEffect(() => {
    // Intentar reproducir el track
    audioManager.play(track, volume, true).then((success) => {
      setIsPlaying(success)
    })

    // Cleanup: detener la musica cuando el componente se desmonte
    return () => {
      audioManager.stop()
    }
  }, [track, volume])

  const toggleMusic = useCallback(() => {
    const playing = audioManager.togglePlay()
    setIsPlaying(playing)
  }, [])

  const toggleMute = useCallback(() => {
    const muted = audioManager.toggleMute()
    setIsMuted(muted)
  }, [])

  const stopMusic = useCallback(() => {
    audioManager.stop()
    setIsPlaying(false)
  }, [])

  return {
    isPlaying,
    isMuted,
    toggleMusic,
    toggleMute,
    stopMusic,
  }
}
