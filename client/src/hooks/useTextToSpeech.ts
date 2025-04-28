import { useState, useRef } from 'react';

interface TextToSpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export default function useTextToSpeech({
  onStart,
  onEnd,
  onError
}: TextToSpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  // Initialize speech synthesis on first use
  if (typeof window !== 'undefined' && !synthRef.current) {
    synthRef.current = window.speechSynthesis;
  }

  // Check if speech synthesis is supported
  const isSynthesisSupported = (): boolean => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  };

  // Speak text with the given language
  const speak = (text: string, lang: string = 'en-US') => {
    if (!isSynthesisSupported()) {
      onError?.('Text-to-speech is not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      
      // Set event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        onStart?.();
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        onError?.(event.error);
      };
      
      // Speak the text
      if (synthRef.current) {
        synthRef.current.speak(utterance);
      }
    } catch (error) {
      setIsSpeaking(false);
      onError?.(error instanceof Error ? error.message : String(error));
    }
  };

  // Stop speaking
  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return {
    speak,
    stop,
    isSpeaking,
    isSynthesisSupported: isSynthesisSupported()
  };
}
