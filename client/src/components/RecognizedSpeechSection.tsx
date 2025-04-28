import { Card, CardContent } from "@/components/ui/card";

interface RecognizedSpeechSectionProps {
  text: string;
}

export default function RecognizedSpeechSection({ text }: RecognizedSpeechSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-3 flex items-center">
        <i className="fas fa-comment-alt text-indigo-500 mr-2"></i>
        Recognized Speech
      </h2>
      
      <div className="bg-gray-50 rounded-lg p-4 min-h-[80px]">
        <p className="text-gray-800">
          {text || "Speak into the microphone to see recognized Banjara text here"}
        </p>
      </div>
    </div>
  );
}
