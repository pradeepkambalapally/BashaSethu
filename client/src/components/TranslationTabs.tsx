import { Button } from "@/components/ui/button";
import useTextToSpeech from "@/hooks/useTextToSpeech";
import { Loader2 } from "lucide-react";
import type { TranslationResponse } from "@shared/schema";

interface TranslationTabsProps {
  activeTab: "telugu" | "english";
  setActiveTab: (tab: "telugu" | "english") => void;
  translations?: TranslationResponse;
  isLoading: boolean;
  error: Error | null;
  onCopy: (text: string) => void;
}

export default function TranslationTabs({
  activeTab,
  setActiveTab,
  translations,
  isLoading,
  error,
  onCopy
}: TranslationTabsProps) {
  const { speak, isSpeaking, voicesLoaded } = useTextToSpeech();

  const playTranslation = async (text: string, lang: string) => {
    try {
      await speak(text, lang === "english" ? "en-US" : "te-IN");
    } catch (error) {
      console.error("Failed to play translation:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab("telugu")}
          className={`flex-1 py-3 font-medium text-center border-b-2 ${
            activeTab === "telugu" 
              ? "border-pink-500 text-pink-500" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Telugu
        </button>
        <button 
          onClick={() => setActiveTab("english")}
          className={`flex-1 py-3 font-medium text-center border-b-2 ${
            activeTab === "english" 
              ? "border-pink-500 text-pink-500" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          English
        </button>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mb-3"></div>
            <p className="text-gray-600">Translating...</p>
          </div>
        ) : error ? (
          <div className="py-6">
            <div className="bg-red-50 text-red-500 p-4 rounded-lg flex items-start">
              <i className="fas fa-exclamation-circle mt-1 mr-3"></i>
              <div>
                <p className="font-medium">Translation failed</p>
                <p className="text-sm">{error.message || "Could not connect to translation service. Please try again."}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Telugu Translation Panel */}
            {activeTab === "telugu" && (
              <div>
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[80px]">
                    <p className="text-gray-800">
                      {translations?.teluguText || "Telugu translation will appear here"}
                    </p>
                  </div>
                </div>
                
                {translations?.teluguText && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button 
                        onClick={() => playTranslation(translations.teluguText, "telugu")}
                        disabled={isSpeaking}
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow transition-colors disabled:opacity-50"
                      >
                        <i className={`fas fa-${isSpeaking ? "volume-up" : "play"} text-sm`}></i>
                      </button>
                      <div className="ml-3 text-sm text-gray-600">
                        Speak in Telugu <span className="text-xs">(Server TTS)</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onCopy(translations.teluguText)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* English Translation Panel */}
            {activeTab === "english" && (
              <div>
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[80px]">
                    <p className="text-gray-800">
                      {translations?.englishText || "English translation will appear here"}
                    </p>
                  </div>
                </div>
                
                {translations?.englishText && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button 
                        onClick={() => playTranslation(translations.englishText, "english")}
                        disabled={isSpeaking}
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow transition-colors disabled:opacity-50"
                      >
                        <i className={`fas fa-${isSpeaking ? "volume-up" : "play"} text-sm`}></i>
                      </button>
                      <div className="ml-3 text-sm text-gray-600">
                        Speak in English <span className="text-xs">(Browser TTS)</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onCopy(translations.englishText)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
