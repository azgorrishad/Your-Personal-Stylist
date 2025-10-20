import React, { useState } from 'react';
import { StyleSuggestion, SuggestionItem } from '../types';
import { Shirt, Glasses, Watch, Footprints, Info, Download, Image as ImageIcon } from 'lucide-react';
import { Loader } from './Loader';

interface StyleSuggestionsProps {
  suggestions: StyleSuggestion | null;
  styledImage: string | null;
  isLoading: boolean;
  isRefining: boolean;
  onRefineImage: (prompt: string) => Promise<void>;
}

const SuggestionCard: React.FC<{ icon: React.ReactNode; title: string; item: SuggestionItem }> = ({ icon, title, item }) => (
    <div className="bg-white p-4 rounded-lg shadow-md transition-transform hover:scale-105 duration-300">
        <div className="flex items-center mb-2">
            <div className="bg-indigo-100 text-indigo-600 rounded-full p-2 mr-3">
                {icon}
            </div>
            <h4 className="font-semibold text-lg text-gray-800">{title}</h4>
        </div>
        <p className="font-medium text-gray-700">{item.item}</p>
        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
    </div>
);

export const StyleSuggestions: React.FC<StyleSuggestionsProps> = ({ suggestions, styledImage, isLoading, isRefining, onRefineImage }) => {
  const [refinePrompt, setRefinePrompt] = useState('');

  const handleRefineClick = () => {
    if (refinePrompt.trim()) {
        onRefineImage(refinePrompt);
    }
  };
  
  const handleDownload = () => {
    if (styledImage) {
        const link = document.createElement('a');
        link.href = styledImage;
        link.download = 'ai-styled-look.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  const ImageLoader = () => (
    <div className="w-full aspect-[9/16] bg-gray-200 rounded-lg flex flex-col justify-center items-center animate-pulse">
        <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500 font-semibold">Generating Your Styled Image...</p>
        <p className="text-gray-400 text-sm">This may take a moment.</p>
    </div>
  );

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Your AI-Curated Look</h2>
      
        <div className="mb-8">
            {styledImage ? (
                 <div className="relative group w-full max-w-sm mx-auto">
                    <img 
                        src={styledImage} 
                        alt="AI Generated Look" 
                        className="w-full h-auto rounded-xl shadow-2xl object-contain"
                    />
                    <button 
                        onClick={handleDownload}
                        className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                        aria-label="Download Image"
                    >
                        <Download size={24} />
                    </button>
                 </div>
            ) : (isLoading || !suggestions) && (
                <ImageLoader />
            )}
        </div>
        
        {styledImage && !isLoading && (
            <div className="w-full max-w-sm mx-auto animate-fade-in mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Refine Your Look</h3>
                <div className="relative">
                    <input
                        type="text"
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        placeholder="e.g., Change shirt to blue, add a watch"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        disabled={isRefining}
                        onKeyDown={(e) => e.key === 'Enter' && handleRefineClick()}
                    />
                    <button
                        onClick={handleRefineClick}
                        disabled={isRefining || !refinePrompt.trim()}
                        className="absolute right-1.5 top-1.5 bottom-1.5 inline-flex items-center justify-center px-4 bg-indigo-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                    >
                        {isRefining ? (
                           <>
                            <Loader />
                            <span>Updating...</span>
                           </>
                        ) : (
                            "Update Image"
                        )}
                    </button>
                </div>
            </div>
        )}

      {suggestions && (
        <div className="animate-fade-in mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <p className="text-sm font-medium text-gray-500">Identified Face Shape</p>
                    <p className="text-xl font-semibold text-indigo-600">{suggestions.faceShape}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <p className="text-sm font-medium text-gray-500">Identified Body Shape</p>
                    <p className="text-xl font-semibold text-indigo-600">{suggestions.bodyShape}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <SuggestionCard icon={<Shirt size={24} />} title="Outfit" item={suggestions.outfit} />
                <SuggestionCard icon={<Glasses size={24} />} title="Sunglasses" item={suggestions.sunglasses} />
                <SuggestionCard icon={<Watch size={24} />} title="Accessories" item={suggestions.accessories} />
                <SuggestionCard icon={<Footprints size={24} />} title="Shoes" item={suggestions.shoes} />
            </div>

            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
                <div className="flex items-center mb-2">
                    <div className="bg-indigo-100 text-indigo-600 rounded-full p-2 mr-3">
                        <Info size={24} />
                    </div>
                    <h4 className="font-semibold text-lg text-gray-800">Stylist's Reasoning</h4>
                </div>
                <p className="text-gray-600 leading-relaxed">{suggestions.overallReasoning}</p>
            </div>
        </div>
      )}
    </div>
  );
};