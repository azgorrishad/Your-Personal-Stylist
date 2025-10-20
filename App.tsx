import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { StyleSuggestions } from './components/StyleSuggestions';
import { Loader } from './components/Loader';
import { generateStyleSuggestions, generateStyledImage, refineStyledImage } from './services/geminiService';
import { StyleSuggestion } from './types';
import { Wand2 } from 'lucide-react';

const App: React.FC = () => {
  const [closeupImage, setCloseupImage] = useState<string | null>(null);
  const [fullBodyImage, setFullBodyImage] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<string>('');
  const [styleCategory, setStyleCategory] = useState<string>('Let AI Decide');

  const [suggestions, setSuggestions] = useState<StyleSuggestion | null>(null);
  const [styledImage, setStyledImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const styleOptions = [
    'Let AI Decide',
    'Streetwear',
    'Casual',
    'Business Casual',
    'Formal',
    'Vintage',
    'Bohemian',
    'Minimalist',
    'Sporty',
  ];

  const handleGenerateClick = async () => {
    if (!closeupImage || !fullBodyImage) {
      setError('Please upload both a closeup and a full body photo.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    setStyledImage(null);

    try {
      const generatedSuggestions = await generateStyleSuggestions(
        closeupImage,
        fullBodyImage,
        occasion,
        styleCategory
      );
      setSuggestions(generatedSuggestions);

      const generatedImage = await generateStyledImage(
        closeupImage,
        fullBodyImage,
        generatedSuggestions,
        occasion,
        styleCategory
      );
      setStyledImage(generatedImage);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineImage = async (refinePrompt: string) => {
    if (!styledImage || !closeupImage) {
        setError('Cannot refine image without a base image and a closeup reference.');
        return;
    }
    
    setIsRefining(true);
    setError(null);
    
    try {
        const refinedImage = await refineStyledImage(
            styledImage,
            refinePrompt,
            closeupImage
        );
        setStyledImage(refinedImage);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred during refinement.');
    } finally {
        setIsRefining(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Get Your Personalized Style</h2>
            <p className="text-gray-500 mt-2">Upload your photos, tell us about the occasion, and let our AI craft the perfect look for you.</p>
          </div>

          {/* Image Uploaders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <ImageUploader
              title="Closeup Photo"
              description="For face shape analysis. Use a clear, front-facing photo."
              onImageUpload={setCloseupImage}
            />
            <ImageUploader
              title="Full Body Photo"
              description="For body shape analysis. Use a clear, well-lit photo."
              onImageUpload={setFullBodyImage}
            />
          </div>

          {/* Style Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-1">Occasion (Optional)</label>
              <input
                type="text"
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g., Summer wedding, casual brunch"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-1">Style Preference</label>
              <select
                id="style"
                value={styleCategory}
                onChange={(e) => setStyleCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {styleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleGenerateClick}
              disabled={isLoading || !closeupImage || !fullBodyImage}
              className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <>
                  <Loader />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  <span>Generate My Style</span>
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
              <strong>Error:</strong> {error}
            </div>
          )}

        </div>

        {(isLoading || suggestions) && (
            <div className="max-w-4xl mx-auto mt-8">
                 <StyleSuggestions 
                    suggestions={suggestions} 
                    styledImage={styledImage}
                    isLoading={isLoading}
                    isRefining={isRefining}
                    onRefineImage={handleRefineImage}
                />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
