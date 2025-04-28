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

  // Play audio from URL
  const playAudioFromUrl = async (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(url);
        
        audio.onplay = () => {
          setIsSpeaking(true);
          onStart?.();
        };
        
        audio.onended = () => {
          setIsSpeaking(false);
          onEnd?.();
          resolve();
        };
        
        audio.onerror = (error) => {
          setIsSpeaking(false);
          onError?.('Failed to play audio');
          console.error('Audio playback error:', error);
          reject(error);
        };
        
        audio.play().catch(error => {
          setIsSpeaking(false);
          onError?.('Failed to play audio');
          console.error('Audio play error:', error);
          reject(error);
        });
      } catch (error) {
        setIsSpeaking(false);
        onError?.(error instanceof Error ? error.message : String(error));
        console.error('Audio setup error:', error);
        reject(error);
      }
    });
  };

  // Generate speech using our server API proxy
  const getTeluguTTSUrl = (text: string): string => {
    // Use our server endpoint to proxy the TTS request
    return `/api/tts?text=${encodeURIComponent(text)}&lang=te`;
  };
  
  // Speak text with the given language
  const speak = async (text: string, lang: string = 'en-US') => {
    // Cancel any ongoing speech
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    try {
      // For Telugu use our server proxy to Google Translate TTS
      if (lang === 'te-IN' || lang === 'te') {
        console.log('Using server proxy for Telugu TTS');
        const url = getTeluguTTSUrl(text);
        return playAudioFromUrl(url);
      }
      
      // For other languages, use browser's speech synthesis
      if (!isSynthesisSupported()) {
        onError?.('Text-to-speech is not supported in this browser');
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      
      // For English (India), try to optimize the voice selection
      if (lang === 'en-IN') {
        const voices = synthRef.current?.getVoices() || [];
        const indianVoice = voices.find(voice => voice.lang.includes('en-IN'));
        
        if (indianVoice) {
          console.log(`Using voice: ${indianVoice.name} (${indianVoice.lang})`);
          utterance.voice = indianVoice;
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
