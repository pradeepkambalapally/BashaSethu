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
