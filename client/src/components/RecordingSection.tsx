import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

interface RecordingSectionProps {
  onRecognize: (text: string) => void;
}

export default function RecordingSection({ onRecognize }: RecordingSectionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const { 
    startRecording, 
    stopRecording, 
    isRecognitionSupported 
  } = useSpeechRecognition({
    onResult: (text) => {
      if (text) {
        onRecognize(text);
      }
    },
    onError: (error) => {
      toast({
        title: "Recording Error",
        description: error,
        variant: "destructive"
      });
      setIsRecording(false);
      clearRecordingTimer();
    }
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecordingTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const clearRecordingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      clearRecordingTimer();
      stopRecording();
    } else {
      if (!isRecognitionSupported) {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Please try Chrome or Edge.",
          variant: "destructive"
        });
        return;
      }

      setIsRecording(true);
      startRecordingTimer();
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex flex-col items-center">
        {/* Recording Status */}
        <div className="mb-4 h-6">
          {isRecording && (
            <div className="text-indigo-500 font-medium">
              Recording... <span>{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        
        {/* Recording Button */}
        <button 
          onClick={toggleRecording}
          className={`relative w-24 h-24 rounded-full ${
            isRecording 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-indigo-500 hover:bg-indigo-600"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 mb-4 flex items-center justify-center shadow-lg`}
        >
          <span className="sr-only">{isRecording ? "Stop Recording" : "Start Recording"}</span>
          <i className={`fas fa-${isRecording ? "stop" : "microphone"} text-white text-2xl`}></i>
          
          {/* Recording Indicator Animation */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-indigo-300 opacity-75 animate-pulse"></div>
          )}
        </button>
        
        <p className="text-gray-600 text-center text-sm">
          Tap the microphone and speak in Banjara language
        </p>
      </div>
    </div>
  );
}
