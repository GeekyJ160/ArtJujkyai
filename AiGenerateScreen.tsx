
import React, { useState, useCallback, useEffect } from 'react';
import { ArtStyle, UpscaleType } from '../types';
// Add AspectRatioValue to imports
import { generateImageVariants, enhanceImageQuality, AspectRatioValue } from '../services/geminiService';
import { styleOptions } from '../utils/constants';
import Header from './Header';
import UploadZone from './UploadZone';
import StyleSelector from './StyleSelector';
import OptionsPanel, { AspectRatio } from './OptionsPanel';
import ProcessingView from './ProcessingView';
import ResultsGrid from './ResultsGrid';
import { ImagePreview } from './ImagePreview';
import ImageEditor from './ImageEditor';
import ScreenHeader from './ScreenHeader';

interface AiGenerateScreenProps {
    navigate: (screen: string) => void;
    initialImage: string | null;
}

interface GeneratedImage {
    original: string;
    upscaled?: string;
}

const AiGenerateScreen: React.FC<AiGenerateScreenProps> = ({ navigate, initialImage }) => {
    const [originalUpload, setOriginalUpload] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(styleOptions[0]);
    const [selectedVariants, setSelectedVariants] = useState<number>(2);
    const [intensity, setIntensity] = useState<number>(75);
    const [styleIntensity, setStyleIntensity] = useState<number>(75);
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [negativePrompt, setNegativePrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [statusText, setStatusText] = useState<string>('');
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [upscalingIndex, setUpscalingIndex] = useState<number | null>(null);

    const handleImageUpload = (imageDataUrl: string) => {
        setOriginalUpload(imageDataUrl);
        setUploadedImage(imageDataUrl);
        setGeneratedImages([]);
        setError(null);
    };

    useEffect(() => {
        if (initialImage) {
            handleImageUpload(initialImage);
        }
    }, [initialImage]);

    const handleClearImage = useCallback(() => {
        setOriginalUpload(null);
        setUploadedImage(null);
        setGeneratedImages([]);
        setError(null);
    }, []);

    const handleReset = useCallback(() => {
        navigate('home');
    }, [navigate]);

    const handleApplyEdit = useCallback((editedImage: string) => {
        setUploadedImage(editedImage);
        setIsEditing(false);
    }, []);

    const handleStartEditing = useCallback(() => setIsEditing(true), []);
    const handleCloseEditor = useCallback(() => setIsEditing(false), []);
    
    const handleUpscaleImage = async (index: number, upscaleType: UpscaleType) => {
        if (upscalingIndex !== null) return;
    
        setUpscalingIndex(index);
        setError(null);
    
        const imageToUpscale = generatedImages[index].original;
        
        try {
            const upscaledImage = await enhanceImageQuality(imageToUpscale, 'upscale', { upscaleType });
            const newImages = [...generatedImages];
            newImages[index] = { ...newImages[index], upscaled: upscaledImage };
            setGeneratedImages(newImages);
        } catch (err) {
            console.error("Upscaling Error:", err);
            setError("Sorry, we couldn't upscale the image. Please try again.");
        } finally {
            setUpscalingIndex(null);
        }
    };

    const handleKeywordClick = (keyword: string) => {
        setCustomPrompt(prev => prev ? `${prev}, ${keyword}` : keyword);
    };

    const handleTransform = async () => {
        if (!uploadedImage && !customPrompt) {
            setError('Please upload an image or enter a description to generate an image.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        setProgress(0);
        setStatusText('Preparing your masterpiece...');

        try {
            // Fix: Map the aspect ratio to the AspectRatioValue type expected by the API.
            // This ensures the value passed to the service is one of '1:1', '16:9', '9:16', '4:3', '3:4'.
            let resolvedAspectRatio: AspectRatioValue = '1:1';
            if (aspectRatio === 'auto') {
                if (uploadedImage) {
                    resolvedAspectRatio = await new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            const ratio = img.width / img.height;
                            if (ratio > 1.5) resolve('16:9');
                            else if (ratio > 1.1) resolve('4:3');
                            else if (ratio < 0.6) resolve('9:16');
                            else if (ratio < 0.9) resolve('3:4');
                            else resolve('1:1');
                        };
                        img.onerror = () => resolve('1:1');
                        img.src = uploadedImage;
                    });
                } else {
                    resolvedAspectRatio = '1:1';
                }
            } else {
                resolvedAspectRatio = aspectRatio as AspectRatioValue;
            }

            const base64Image = uploadedImage?.split(',')[1];

            const onProgress = (p: number) => {
                setProgress(p);
                if (p < 100) {
                    setStatusText(`Generating variant... ${Math.round(p)}%`);
                } else {
                    setStatusText('Almost there...');
                }
            };

            const results = await generateImageVariants({
                style: selectedStyle,
                intensity,
                styleIntensity,
                variants: selectedVariants,
                customPrompt,
                negativePrompt,
                aspectRatio: resolvedAspectRatio,
                onProgress,
                base64Image,
                mimeType: 'image/png'
            });

            setGeneratedImages(results.map(img => ({ original: img })));
            setStatusText('Transformation complete!');
        } catch (err) {
            console.error("Image Generation Error:", err);
            let userFriendlyError = 'An unexpected error occurred. Please try again later.';

            if (err instanceof Error) {
                const message = err.message.toLowerCase();
                if (message.includes('api key not valid')) {
                    userFriendlyError = 'The API key is invalid. Please check your configuration.';
                } else if (message.includes('quota')) {
                    userFriendlyError = 'You have exceeded your usage limit for the API. Please check your quota and billing status.';
                } else if (message.includes('safety') || message.includes('blocked') || message.includes('unexpected format')) {
                    userFriendlyError = 'Your request was blocked due to safety concerns. Please adjust your prompt or image and try again.';
                } else if (message.includes('500') || message.includes('503') || message.includes('server error')) {
                    userFriendlyError = 'The AI service is currently experiencing issues. Please try again in a few minutes.';
                } else {
                    userFriendlyError = `An error occurred: ${err.message}. Please try again.`;
                }
            }
            
            setError(userFriendlyError);
        } finally {
            setIsLoading(false);
        }
    };

    const showResults = generatedImages.length > 0;

    return (
        <div className="max-w-4xl mx-auto">
            {isEditing && originalUpload && (
                <ImageEditor
                    imageSrc={originalUpload}
                    onClose={handleCloseEditor}
                    onApply={handleApplyEdit}
                    aspectRatio="square"
                />
            )}
            
            <ScreenHeader title="AI Generate & Filters" onBack={() => navigate('home')} />
            
            {isLoading ? (
                <ProcessingView progress={progress} statusText={statusText} />
            ) : showResults ? (
                <ResultsGrid
                    originalImage={uploadedImage}
                    generatedImages={generatedImages}
                    style={selectedStyle}
                    onReset={handleReset}
                    onUpscale={handleUpscaleImage}
                    upscalingIndex={upscalingIndex}
                />
            ) : (
                <div id="transform" className="space-y-8">
                    <section className="flex flex-col gap-8 items-start">
                        <div className="w-full flex flex-col gap-4">
                            <h2 className="text-2xl font-bold text-gray-700">1. Start with an Image or a Prompt</h2>
                            {uploadedImage ? (
                                <ImagePreview src={uploadedImage} onClear={handleClearImage} onEdit={handleStartEditing} />
                            ) : (
                                <UploadZone onImageUpload={handleImageUpload} />
                            )}
                        </div>
                        <div className="w-full flex flex-col gap-4">
                            <h2 className="text-2xl font-bold text-gray-700">2. Customize Your Art</h2>
                            <div className="card-effect p-6 rounded-2xl space-y-6">
                                <OptionsPanel
                                    title="Add a Custom Prompt"
                                    placeholder="e.g., 'a cat wearing a wizard hat', 'in a mystical forest'"
                                    selectedVariants={selectedVariants}
                                    onVariantsChange={setSelectedVariants}
                                    intensity={intensity}
                                    onIntensityChange={setIntensity}
                                    styleIntensity={styleIntensity}
                                    onStyleIntensityChange={setStyleIntensity}
                                    customPrompt={customPrompt}
                                    onCustomPromptChange={setCustomPrompt}
                                    negativePrompt={negativePrompt}
                                    onNegativePromptChange={setNegativePrompt}
                                    aspectRatio={aspectRatio}
                                    onAspectRatioChange={setAspectRatio}
                                    keywordSuggestions={selectedStyle.keywords}
                                    onKeywordClick={handleKeywordClick}
                                />
                                <StyleSelector
                                    selectedStyle={selectedStyle}
                                    onStyleChange={setSelectedStyle}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="text-center sticky bottom-4 z-10 py-2">
                        <button
                            id="transformBtn"
                            onClick={handleTransform}
                            disabled={isLoading || (!uploadedImage && !customPrompt)}
                            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xl py-4 px-16 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            Transform Now
                        </button>
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                    </section>
                </div>
            )}
        </div>
    );
};

export default AiGenerateScreen;
