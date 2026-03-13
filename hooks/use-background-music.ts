"use client"

import { useEffect, useRef, useState } from "react"

// URLs de audio con nombres sencillos
export const BACKGROUND_MUSIC = {
  bengal: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-breath-of-the-bengal-mind-clearing-hz-494102-GvmCjOOpC4fcwb5I34nedClxZs9dU6.mp3",
  oasis: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-echoes-of-the-oasis-pure-relief-tone-494098-ypldrRySdpwSNLI1BmuuNGpwfp8gjS.mp3",
  tranquil: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-tranquil-stripes-deep-brain-massage-494096-Gp5n1MnsMNhLkdimgZMfpsj7Wb7Ul2.mp3",
  nature: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jorisvermeer-gentle-nature-background-497439-Ef2jyBSXJ5OwlrUEQTFbj5sJIZtMGp.mp3",
  trance: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-the-white-tiger-trance-sleep-cue-494097-GYRYX3AAaV3gBpzQ6CMVnvMceWpZ0D.mp3",
  piano: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jorisvermeer-calm-piano-background-music-for-documentary-493449-lJzH0Gt1pUQPwjwJVLUwlJnWO9X4c0.mp3",
  amber: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-sonic-amber-hypnotherapy-frequency-494095-wnQWAyWngi9PLSxLpiaZRaSfFGSMeM.mp3",
  majestic: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-majestic-flow-neurological-soothing-494100-5JhlryyZHgRUZAdqMAISpYXcgiw8lu.mp3",
  velvet: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-velvet-binaurals-rapid-trance-therapy-494113-JIaWm0qyLrZ8wjf8ITrvoh2kBM52Jw.mp3",
  solitude: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-striped-solitude-hypnotic-theta-pulse-494114-p2BsS6lxT7sfddnLQWmxGkcEv1Q8mW.mp3",
  roar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meditativetiger-the-meditative-roar-subliminal-calm-494111-HwjWMnPq3OMvjdHEz1p0uyeiH4nIAs.mp3",
} as const

export type MusicTrack = keyof typeof BACKGROUND_MUSIC

export function useBackgroundMusic(track: MusicTrack = "nature", volume: number = 0.3) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Create audio element
    const audio = new Audio(BACKGROUND_MUSIC[track])
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    // Try to play (may be blocked by browser autoplay policy)
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          // Autoplay was prevented, user needs to interact first
          setIsPlaying(false)
        })
    }

    return () => {
      audio.pause()
      audio.src = ""
      audioRef.current = null
    }
  }, [track, volume])

  const toggleMusic = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !audioRef.current.muted
    setIsMuted(!isMuted)
  }

  const stopMusic = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
  }

  return {
    isPlaying,
    isMuted,
    toggleMusic,
    toggleMute,
    stopMusic,
  }
}
