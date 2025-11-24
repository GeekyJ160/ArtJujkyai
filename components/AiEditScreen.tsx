import React, { useState } from 'react';
import ScreenHeader from './ScreenHeader';
import UploadZone from './UploadZone';
import { editImage } from '../services/geminiService';
import ComparisonSlider from './ComparisonSlider';
import { RedoIcon, MagicWandIcon } from './icons';

interface AiEditScreenProps {
    navigate: (screen: string, image?: string) => void;
    initialImage: string | null;
}

const AiEditScreen: React.FC<AiEditScreenProps> = ({ navigate, initialImage }) => {
    const [image, setImage] = useState<string | null>(initialImage);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');

    const handleImageUpload = (imageDataUrl: string) => {
        setImage(imageDataUrl);
        setResult(null);
        setError(null);
    };

    const handleProcess = async () => {
        if (!image) {
            setError('Please upload an image to edit.');
            return;
        }
        if (!prompt) {
            setError('Please enter a prompt to describe your edit.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await editImage(image, prompt);
            setResult(res);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Editing failed: ${errorMessage}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
      setImage(null);
      setResult(null);
      setError(null);
      setPrompt('');
    };

    if (!image) {
        return (
            <div className="max-w-xl mx-auto">
                <ScreenHeader title="AI Edit" onBack={() => navigate('home')} />
                <UploadZone onImageUpload={handleImageUpload} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <ScreenHeader title="AI Edit" onBack={() => navigate('home')} />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow flex flex-col items-center">
                    {isLoading ? (
                         <div className="w-full aspect-square max-w-lg bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 mb-4"></div>
                            <p className="text-gray-600">Applying your edits...</p>
                         </div>
                    ) : result ? (
                         <ComparisonSlider original={image} generated={result} />
                    ) : (
                        <img src={image} alt="Original to edit" className="rounded-lg shadow-lg w-full max-w-lg" />
                    )}
                </div>
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    {result ? (
                         <div className="text-center card-effect p-6 rounded-2xl">
                             <h3 className="text-xl font-bold mb-4">Edit Complete!</h3>
                             <p className="text-gray-600 mb-6">Drag the slider to see the difference.</p>
                             <button
                                onClick={handleReset}
                                className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transform transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                            >
                                <RedoIcon className="w-5 h-5"/>
                                Edit Another
                            </button>
                         </div>
                    ) : (
                         <div className="card-effect p-6 rounded-2xl space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Describe your edit</h3>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., 'turn the cat into a dog', 'add sunglasses to the person', 'change the background to a beach'"
                                    className="w-full h-24 bg-gray-100 rounded-md p-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                />
                            </div>
                             <button
                                onClick={handleProcess}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <MagicWandIcon className="w-6 h-6"/>
                                {isLoading ? 'Applying...' : 'Apply Edit'}
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default AiEditScreen;