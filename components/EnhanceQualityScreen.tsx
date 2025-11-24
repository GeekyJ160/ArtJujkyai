import React, { useState } from 'react';
import ScreenHeader from './ScreenHeader';
import UploadZone from './UploadZone';
import { enhanceImageQuality } from '../services/geminiService';
import ComparisonSlider from './ComparisonSlider';
import { RedoIcon, UpscaleIcon, DenoiseIcon, AiFlashIcon, EnhanceFaceIcon } from './icons';

interface EnhanceQualityScreenProps {
    navigate: (screen: string) => void;
    initialImage: string | null;
}

type EnhancementType = 'upscale' | 'denoise' | 'flash' | 'enhance_face';
type FlashIntensity = 'subtle' | 'standard' | 'strong';

const EnhanceQualityScreen: React.FC<EnhanceQualityScreenProps> = ({ navigate, initialImage }) => {
    const [image, setImage] = useState<string | null>(initialImage);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enhancementType, setEnhancementType] = useState<EnhancementType>('upscale');
    const [flashIntensity, setFlashIntensity] = useState<FlashIntensity>('standard');

    const handleImageUpload = (imageDataUrl: string) => {
        setImage(imageDataUrl);
        setResult(null);
        setError(null);
    };

    const handleProcess = async () => {
        if (!image) {
            setError('Please upload an image to enhance.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await enhanceImageQuality(image, enhancementType, { flashIntensity, upscaleType: 'standard' });
            setResult(res);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Enhancement failed: ${errorMessage}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
      setImage(null);
      setResult(null);
      setError(null);
      setEnhancementType('upscale');
      setFlashIntensity('standard');
    };

    if (!image) {
        return (
            <div className="max-w-xl mx-auto">
                <ScreenHeader title="Enhance Quality" onBack={() => navigate('home')} />
                <UploadZone onImageUpload={handleImageUpload} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <ScreenHeader title="Enhance Quality" onBack={() => navigate('home')} />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow flex flex-col items-center">
                    {result ? (
                         <ComparisonSlider original={image} generated={result} />
                    ) : (
                        <img src={image} alt="Original to enhance" className="rounded-lg shadow-lg w-full max-w-lg" />
                    )}
                </div>
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    {result ? (
                         <div className="text-center card-effect p-6 rounded-2xl">
                             <h3 className="text-xl font-bold mb-4">Enhancement Complete!</h3>
                             <p className="text-gray-600 mb-6">Drag the slider to see the difference.</p>
                             <button
                                onClick={handleReset}
                                className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transform transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                            >
                                <RedoIcon className="w-5 h-5"/>
                                Enhance Another
                            </button>
                         </div>
                    ) : (
                         <div className="card-effect p-6 rounded-2xl space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Enhancement Type</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setEnhancementType('upscale')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors duration-300 ${enhancementType === 'upscale' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        <UpscaleIcon className="w-8 h-8 mb-2" />
                                        <span className="font-semibold text-sm">Upscale</span>
                                    </button>
                                    <button
                                        onClick={() => setEnhancementType('denoise')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors duration-300 ${enhancementType === 'denoise' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        <DenoiseIcon className="w-8 h-8 mb-2" />
                                        <span className="font-semibold text-sm">Denoise</span>
                                    </button>
                                    <button
                                        onClick={() => setEnhancementType('flash')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors duration-300 ${enhancementType === 'flash' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        <AiFlashIcon className="w-8 h-8 mb-2" />
                                        <span className="font-semibold text-sm">AI Flash</span>
                                    </button>
                                    <button
                                        onClick={() => setEnhancementType('enhance_face')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors duration-300 ${enhancementType === 'enhance_face' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        <EnhanceFaceIcon className="w-8 h-8 mb-2" />
                                        <span className="font-semibold text-sm">Enhance Face</span>
                                    </button>
                                </div>
                            </div>
                            {enhancementType === 'flash' && (
                                <div className="space-y-3 pt-4 border-t border-gray-200 animate-fade-in">
                                    <h3 className="font-semibold text-gray-700">Flash Intensity</h3>
                                    <div className="flex space-x-2">
                                        {(['subtle', 'standard', 'strong'] as FlashIntensity[]).map(intensity => (
                                            <button
                                                key={intensity}
                                                onClick={() => setFlashIntensity(intensity)}
                                                className={`flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-colors duration-300 capitalize ${flashIntensity === intensity ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                            >
                                                {intensity}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                             <button
                                onClick={handleProcess}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Enhancing...' : 'Enhance Image'}
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default EnhanceQualityScreen;