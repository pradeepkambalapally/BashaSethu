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
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  // Initialize speech synthesis on first use
  if (typeof window !== 'undefined' && !synthRef.current) {
    synthRef.current = window.speechSynthesis;
    
    // Load voices
    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      if (voices.length > 0) {
        setVoicesLoaded(true);
        console.log('Text-to-speech voices loaded, total:', voices.length);
      }
    };
    
    // Check if voices are already loaded
    loadVoices();
    
    // Listen for voices changed event
    window.speechSynthesis.onvoiceschanged = loadVoices;
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
      
      // For Telugu, try to optimize the voice selection
      if (lang === 'te-IN' || lang === 'te') {
        // Get available voices
        const voices = synthRef.current?.getVoices() || [];
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Try to find an Indian voice
        let teluguVoice = voices.find(
          voice => voice.lang.includes('te') || 
                  voice.lang.includes('hi-IN') || 
                  voice.lang.includes('kn-IN') || 
                  voice.lang.includes('ta-IN')
        );
        
        // If no Telugu/Indian voice found, use any available voice
        if (teluguVoice) {
          console.log(`Using voice: ${teluguVoice.name} (${teluguVoice.lang})`);
          utterance.voice = teluguVoice;
          
          // For non-Telugu voices, reduce rate slightly for better pronunciation
          if (!teluguVoice.lang.includes('te')) {
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
          }
        } else {
          console.log('No suitable voice found for Telugu, using default');
        }
      }
      
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
        console.error('Speech synthesis error:', event);
      };
      
      // Speak the text
      if (synthRef.current) {
        synthRef.current.speak(utterance);
      }
    } catch (error) {
      setIsSpeaking(false);
      onError?.(error instanceof Error ? error.message : String(error));
      console.error('Text-to-speech error:', error);
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
    voicesLoaded,
    isSynthesisSupported: isSynthesisSupported()
  };
}
