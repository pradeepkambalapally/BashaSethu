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
  const [permissionState, setPermissionState] = useState<string>("prompt");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Check microphone permission on component mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        // Check if navigator.permissions is available
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionState(permissionStatus.state);
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
          };
        }
      } catch (error) {
        console.warn("Could not check microphone permission:", error);
      }
    };
    
    checkMicrophonePermission();
  }, []);
  
  const { 
    startRecording, 
    stopRecording, 
    isRecognitionSupported 
  } = useSpeechRecognition({
    onResult: (text) => {
      if (text) {
        console.log("Recognition result received:", text);
        toast({
          title: "Speech Recognized",
          description: "Processing your Banjara speech...",
        });
        onRecognize(text);
        // Auto-stop after getting a result
        setIsRecording(false);
        clearRecordingTimer();
      }
    },
    onError: (error) => {
      console.error("Speech recognition error in component:", error);
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
    try {
      if (isRecording) {
        console.log("Stopping recording...");
        setIsRecording(false);
        clearRecordingTimer();
        stopRecording();
        
        toast({
          title: "Recording Stopped",
          description: "Processing your speech...",
        });
      } else {
        // Check microphone permissions first
        if (permissionState === "denied") {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access in your browser settings to use speech recognition.",
            variant: "destructive"
          });
          return;
        }
        
        if (!isRecognitionSupported) {
          toast({
            title: "Speech Recognition Not Supported",
            description: "Your browser doesn't support speech recognition. Please try Chrome or Edge.",
            variant: "destructive"
          });
          return;
        }

        console.log("Starting recording...");
        // Request microphone permission explicitly
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately, we just needed it to trigger permission
            stream.getTracks().forEach(track => track.stop());
          }
        } catch (error) {
          console.error("Error accessing microphone:", error);
          toast({
            title: "Microphone Access Error",
            description: "Could not access your microphone. Please check browser permissions.",
            variant: "destructive"
          });
          return;
        }

        setIsRecording(true);
        startRecordingTimer();
        
        toast({
          title: "Recording Started",
          description: "Speak in Banjara language. Recording will automatically stop when you pause.",
        });
        
        startRecording();
      }
    } catch (error) {
      console.error("Error in recording toggle:", error);
      toast({
        title: "Recording Error",
        description: "An unexpected error occurred while trying to record audio.",
        variant: "destructive"
      });
      setIsRecording(false);
      clearRecordingTimer();
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
            <div className="text-indigo-500 font-medium flex items-center">
              <span className="mr-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              Recording... <span className="ml-1">{formatTime(recordingTime)}</span>
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
          {permissionState === "denied" 
            ? "Microphone access denied. Please enable in browser settings." 
            : "Tap the microphone and speak in Banjara language"}
        </p>
        
        {!isRecognitionSupported && (
          <p className="text-red-500 text-xs mt-2">
            Speech recognition is not supported in your browser. Please try Chrome or Edge.
          </p>
        )}
      </div>
    </div>
  );
}
