// Singleton para manejar el audio global y evitar que se apilen reproducciones

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
  dreamy: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/goldensoundlabs-colors-everywhere-on-earth-dreamy-opening-497549-IFrwDFwXUkq0ZCNS3h0PAsqZs2H6P7.mp3",
  victory: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sfx-victory7-jHKGu3MQl9lG65N9zcekGjBG4ciAHD.mp3",
} as const

export type MusicTrack = keyof typeof BACKGROUND_MUSIC

class AudioManager {
  private static instance: AudioManager
  private currentAudio: HTMLAudioElement | null = null
  private currentTrack: string | null = null
  private isMuted: boolean = false
  private volume: number = 0.3

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  play(track: MusicTrack, volume: number = 0.3, loop: boolean = true): Promise<boolean> {
    // Si ya esta reproduciendo el mismo track, no hacer nada
    if (this.currentTrack === track && this.currentAudio && !this.currentAudio.paused) {
      return Promise.resolve(true)
    }

    // Detener audio anterior si existe
    this.stop()

    // Crear nuevo audio
    this.currentAudio = new Audio(BACKGROUND_MUSIC[track])
    this.currentAudio.loop = loop
    this.currentAudio.volume = volume
    this.currentAudio.muted = this.isMuted
    this.currentTrack = track
    this.volume = volume

    return this.currentAudio.play()
      .then(() => true)
      .catch(() => false)
  }

  playVictoryThenDreamy(): void {
    this.stop()
    
    const victoryAudio = new Audio(BACKGROUND_MUSIC.victory)
    victoryAudio.volume = 0.5
    this.currentAudio = victoryAudio
    this.currentTrack = "victory"
    
    victoryAudio.play().catch(() => {})
    
    victoryAudio.onended = () => {
      this.play("dreamy", 0.3, true)
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio.src = ""
      this.currentAudio = null
      this.currentTrack = null
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (this.currentAudio) {
      this.currentAudio.muted = this.isMuted
    }
    return this.isMuted
  }

  getMuted(): boolean {
    return this.isMuted
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused
  }

  getCurrentTrack(): string | null {
    return this.currentTrack
  }

  togglePlay(): boolean {
    if (!this.currentAudio) return false
    
    if (this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {})
      return true
    } else {
      this.currentAudio.pause()
      return false
    }
  }
}

export const audioManager = AudioManager.getInstance()
