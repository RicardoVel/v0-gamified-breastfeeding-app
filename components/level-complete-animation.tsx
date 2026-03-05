"use client"

import { useRef, useEffect, useState } from "react"

interface LevelCompleteAnimationProps {
  stars: number
}

export function LevelCompleteAnimation({ stars }: LevelCompleteAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  const videoSrc = stars === 3 ? "/videos/motivacion.mp4" : "/videos/mejorar.mp4"

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.play().catch(() => {
      // Autoplay might be blocked, that's okay
    })

    const handleEnded = () => {
      setIsVisible(false)
    }

    video.addEventListener("ended", handleEnded)
    return () => {
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="flex justify-center">
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        playsInline
        autoPlay
        className="w-48 h-48 object-contain rounded-2xl"
        aria-label={stars === 3 ? "Animacion de felicitaciones" : "Animacion de motivacion para mejorar"}
      />
    </div>
  )
}
