import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionOptions {
  onResult: (text: string) => void;
  onError: (error: string) => void;
  language?: string;
}

export default function useSpeechRecognition({
  onResult,
  onError,
  language = 'en-IN' // Using Indian English as closest to Banjara/Telugu region
}: SpeechRecognitionOptions) {
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  
  // Reference to keep the speech recognition instance
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    // @ts-ignore - Handle non-standard browser APIs
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      console.log("Speech recognition is supported in this browser");
      setIsRecognitionSupported(true);
    } else {
      console.error("Speech recognition is NOT supported in this browser");
      setIsRecognitionSupported(false);
    }
    
    return () => {
      // Clean up on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      }
    };
  }, []);

  // Start speech recognition
  const startRecording = () => {
    console.log("Attempting to start speech recognition...");
    if (!isRecognitionSupported) {
      console.error("Speech recognition not supported");
      onError('Speech recognition is not supported in this browser. Please try Chrome or Edge.');
      return;
    }

    try {
      // If there's an existing instance, clean it up first
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }

      // @ts-ignore - Handle non-standard browser APIs
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // Create new instance
      recognitionRef.current = new SpeechRecognition();
      console.log("Speech recognition instance created");
      
      // Setup recognition
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      
      // Try both specific language and more general fallbacks
      try {
        recognitionRef.current.lang = language;
        console.log(`Set recognition language to: ${language}`);
      } catch (langError) {
        console.warn(`Could not set language to ${language}, using default`);
      }
      
      // Event handlers
      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
      };
      
      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
      };
      
      recognitionRef.current.onresult = (event: any) => {
        console.log("Speech recognition result received", event);
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            console.log("Final transcript:", finalTranscript);
          } else {
            interimTranscript += event.results[i][0].transcript;
            console.log("Interim transcript:", interimTranscript);
          }
        }
        
        // If we have a final transcript, call the callback
        if (finalTranscript) {
          onResult(finalTranscript);
        } else if (interimTranscript && event.results.length > 0) {
          // If the recognition ends without final results, use the interim results
          console.log("Using interim transcript as final");
          onResult(interimTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        onError(`Recognition error: ${event.error}`);
      };
      
      recognitionRef.current.onnomatch = () => {
        console.warn("No speech was recognized");
      };
      
      // Start recognition
      recognitionRef.current.start();
      console.log("Speech recognition started successfully");
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      onError(`Failed to start speech recognition: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Stop speech recognition
  const stopRecording = () => {
    console.log("Stopping speech recognition...");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped successfully");
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    } else {
      console.warn("No speech recognition instance to stop");
    }
  };

  return {
    isRecognitionSupported,
    startRecording,
    stopRecording
  };
}
