import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RecordingSection from "@/components/RecordingSection";
import RecognizedSpeechSection from "@/components/RecognizedSpeechSection";
import TranslationTabs from "@/components/TranslationTabs";
import HistorySection from "@/components/HistorySection";
import type { Translation } from "@shared/schema";

export default function Home() {
  const [recognizedText, setRecognizedText] = useState("");
  const [activeTab, setActiveTab] = useState<"telugu" | "english">("telugu");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const { toast } = useToast();

  // Fetch translation history
  const { 
    data: translationHistory = [], 
    isLoading: isHistoryLoading,
    isError: isHistoryError 
  } = useQuery<Translation[]>({
    queryKey: ['/api/translations'],
  });

  // Translate mutation
  const translateMutation = useMutation({
    mutationFn: async (banjaraText: string) => {
      const response = await apiRequest("POST", "/api/translate", { banjaraText });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/translations'] });
    },
    onError: (error) => {
      toast({
        title: "Translation Failed",
        description: error instanceof Error ? error.message : "Could not connect to translation service",
        variant: "destructive"
      });
    }
  });

  const handleTranslate = async (text: string) => {
    if (!text.trim()) return;
    setRecognizedText(text);
    translateMutation.mutate(text);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      duration: 2000,
    });
  };

  const currentTranslation = translateMutation.data;

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-8 bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Banjara Translator</h1>
        <p className="text-gray-600">Speak in Banjara, get translations in Telugu and English</p>
        <div className="mt-3 text-sm text-gray-500 bg-indigo-50 p-3 rounded-md border border-indigo-100">
          <p className="mb-2"><strong>How to use:</strong></p>
          <ol className="list-decimal list-inside text-left">
            <li>Click the microphone button to start recording</li>
            <li>Speak clearly in Banjara language (angar, khaldo, guddu, etc.)</li>
            <li>When you pause speaking, recording will stop automatically</li>
            <li>View translations in Telugu and English</li>
            <li>Click on the speaker icon to hear the Telugu pronunciation</li>
          </ol>
          <p className="mt-2 text-xs"><i className="fas fa-info-circle mr-1"></i> Make sure your browser has microphone permissions enabled</p>
        </div>
      </header>

      {/* Recording Section */}
      <RecordingSection onRecognize={handleTranslate} />

      {/* Recognized Speech Section */}
      <RecognizedSpeechSection text={recognizedText} />

      {/* Translation Tabs */}
      <TranslationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        translations={currentTranslation}
        isLoading={translateMutation.isPending}
        error={translateMutation.error}
        onCopy={copyToClipboard}
      />

      {/* History Section */}
      <HistorySection translations={translationHistory} isLoading={isHistoryLoading} />
    </div>
  );
}
