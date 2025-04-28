import { Skeleton } from "@/components/ui/skeleton";
import type { Translation } from "@shared/schema";

interface HistorySectionProps {
  translations: Translation[];
  isLoading: boolean;
}

export default function HistorySection({ translations, isLoading }: HistorySectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-3 flex items-center">
        <i className="fas fa-history text-indigo-500 mr-2"></i>
        Recent Translations
      </h2>
      
      {isLoading ? (
        // Loading skeletons
        Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="border-b border-gray-100 py-3 last:border-0">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-full mb-3" />
            <div className="flex space-x-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        ))
      ) : translations.length === 0 ? (
        // Empty state
        <div className="py-6 text-center text-gray-500">
          Your translation history will appear here
        </div>
      ) : (
        // Translation history
        translations.map((translation) => (
          <div key={translation.id} className="border-b border-gray-100 py-3 last:border-0">
            <div className="text-sm text-gray-500 mb-1">Banjara</div>
            <p className="text-gray-800 mb-2">{translation.banjaraText}</p>
            
            <div className="flex flex-wrap space-x-4 text-sm">
              <div className="mb-1">
                <span className="text-pink-500 font-medium">Telugu:</span> 
                <span className="text-gray-600 ml-1">{translation.teluguText}</span>
              </div>
              <div>
                <span className="text-pink-500 font-medium">English:</span> 
                <span className="text-gray-600 ml-1">{translation.englishText}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
