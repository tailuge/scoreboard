import { useRef, useState, useEffect } from "react"

type SpeechRecognitionInstance = {
  start: () => void
  stop: () => void
  abort: () => void
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList
  resultIndex: number
}

type SpeechRecognitionErrorEvent = {
  error: string
  message: string
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof globalThis === "undefined") return null
  return (
    (globalThis as any).SpeechRecognition ||
    (globalThis as any).webkitSpeechRecognition ||
    null
  )
}

export function useSpeechToText(onSend: (text: string) => void) {
  const [isHolding, setIsHolding] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const transcriptRef = useRef("")
  const onSendRef = useRef(onSend)
  const supported = !!getSpeechRecognition()

  onSendRef.current = onSend

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startListening = async () => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) return

    setIsHolding(true)
    setPermissionDenied(false)
    setErrorMessage(null)
    transcriptRef.current = ""

    // Step 1: Explicitly request microphone access to ensure permissions are granted
    try {
      console.log("[STT] Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      console.log("[STT] Microphone access granted")
    } catch (err) {
      console.error("[STT] Microphone access denied:", err)
      setPermissionDenied(true)
      setErrorMessage("Microphone access was blocked by the browser.")
      setIsHolding(false)
      return
    }

    // Step 2: Initialize Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (abortError) {
        console.warn("[STT] recognition.abort() failed:", abortError)
      }
    }

    const recognition = new Ctor()
    // Use single-shot for better reliability on some systems
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      console.log("[STT] onstart fired")
      setIsActive(true)
    }

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let finalTranscript = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        }
      }
      if (finalTranscript) {
        transcriptRef.current += finalTranscript
        console.log("[STT] Final transcript updated:", transcriptRef.current)
      }
    }

    recognition.onerror = (err: SpeechRecognitionErrorEvent) => {
      console.warn("[STT] Recognition Error:", err.error, err.message)
      if (err.error === "not-allowed") {
        setPermissionDenied(true)
        setErrorMessage("Microphone access was blocked by the browser.")
      } else if (err.error === "network") {
        setErrorMessage(
          "Speech recognition service unavailable in this browser. Try Chrome."
        )
      } else if (err.error === "no-speech") {
        setErrorMessage("No speech was detected. Try again.")
      } else if (err.error === "audio-capture") {
        setErrorMessage("No working microphone was available to the browser.")
      } else {
        setErrorMessage(
          err.message || `Speech recognition failed: ${err.error}`
        )
      }
      setIsHolding(false)
      setIsActive(false)
    }

    recognition.onend = () => {
      console.log("[STT] onend fired")
      setIsActive(false)
      const captured = transcriptRef.current.trim()
      if (captured) {
        onSendRef.current(captured)
      }
      transcriptRef.current = ""
      recognitionRef.current = null

      // Stop the mic stream tracks when done
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      console.log("[STT] recognition.start() called")
    } catch (err) {
      console.warn("[STT] recognition.start() failed:", err)
      setErrorMessage("Speech recognition could not be started.")
      setIsHolding(false)
    }
  }

  const stopListening = () => {
    setIsHolding(false)
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
      console.log("[STT] recognition.stop() called")
    } catch (err) {
      console.warn("[STT] recognition.stop() failed:", err)
    }
  }

  return {
    isHolding,
    isActive,
    supported,
    permissionDenied,
    errorMessage,
    startListening,
    stopListening,
  }
}
