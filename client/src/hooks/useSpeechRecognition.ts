import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionOptions {
  onResult: (text: string) => void;
  onError: (error: string) => void;
  language?: string;
}

export default function useSpeechRecognition({
  onResult,
  onError,
  language = 'en-US' // Default language, would be set to Banjara if proper code available
}: SpeechRecognitionOptions) {
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  
  // Reference to keep the speech recognition instance
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    // @ts-ignore - Handle non-standard browser APIs
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsRecognitionSupported(true);
    } else {
      setIsRecognitionSupported(false);
    }
    
    return () => {
      // Clean up on unmount
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Start speech recognition
  const startRecording = () => {
    if (!isRecognitionSupported) {
      onError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      // @ts-ignore - Handle non-standard browser APIs
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // Create new instance
      recognitionRef.current = new SpeechRecognition();
      
      // Setup recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      // Try to use the specified language if available
      // Note: Banjara might not have a specific language code,
      // so in practice, we might need to use a related language
      recognitionRef.current.lang = language;
      
      // Event handlers
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // If we have a final transcript, call the callback
        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        onError(`Recognition error: ${event.error}`);
      };
      
      // Start recognition
      recognitionRef.current.start();
    } catch (error) {
      onError(`Failed to start speech recognition: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Stop speech recognition
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return {
    isRecognitionSupported,
    startRecording,
    stopRecording
  };
}
