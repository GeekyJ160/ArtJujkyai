import React, { useState } from 'react';
import { ArtStyle, UpscaleType } from '../types';
import ComparisonSlider from './ComparisonSlider';
import { RedoIcon, DownloadIcon, ShareIcon, UpscaleIcon, MagicWandIcon, EnhanceFaceIcon } from './icons';

interface GeneratedImage {
    original: string;
    upscaled?: string;
}

interface ResultsGridProps {
    originalImage: string | null;
    generatedImages: GeneratedImage[];
    style: ArtStyle;
    onReset: () => void;
    onUpscale: (index: number, upscaleType: UpscaleType) => void;
    upscalingIndex: number | null;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ originalImage, generatedImages, style, onReset, onUpscale, upscalingIndex }) => {
    const [showUpscaleOptionsFor, setShowUpscaleOptionsFor] = useState<number | null>(null);

    const handleDownload = (imageData: GeneratedImage, index: number) => {
        const isUpscaled = !!imageData.upscaled;
        const imageUrl = imageData.upscaled || imageData.original;
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `artjunky-${style.id}-variant-${index + 1}${isUpscaled ? '-upscaled' : ''}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadAll = async () => {
        for (let i = 0; i < generatedImages.length; i++) {
            handleDownload(generatedImages[i], i);
            if (i < generatedImages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    };
    
    const handleShare = async (imageData: GeneratedImage, index: number) => {
        const isUpscaled = !!imageData.upscaled;
        const imageUrl = imageData.upscaled || imageData.original;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `artjunky-${style.id}-variant-${index + 1}${isUpscaled ? '-upscaled' : ''}.png`, { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `My ${style.name} ArtJunky Creation`,
                    text: `Check out this image I created with ArtJunky AI!`,
                    files: [file],
                });
                return;
            }
            
            if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                alert('Image copied to clipboard!');
            } else {
                alert('Sharing is not supported on your browser. Please download the image to share it.');
            }
        } catch (error) {
            console.error('Error sharing/copying:', error);
            alert('Could not share or copy image. Your browser might not support this feature. Please try downloading it instead.');
        }
    };

    const handleUpscaleClick = (index: number, type: UpscaleType) => {
        if (showUpscaleOptionsFor !== null) {
            onUpscale(showUpscaleOptionsFor, type);
            setShowUpscaleOptionsFor(null);
        }
    };

    return (
        <>
            <section id="results" className="space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">Your Masterpieces</h2>
                    <p className="text-gray-600">
                        Drag the slider to compare. Download or share your favorites!
                    </p>
                </div>
                <div id="resultsGrid" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {generatedImages.map((imageData, i) => (
                        <div key={i} className="card-effect rounded-2xl p-4 text-center hover-lift relative">
                            {upscalingIndex === i && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-2xl">
                                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-white"></div>
                                    <p className="text-white mt-4 font-semibold">Upscaling...</p>
                                </div>
                            )}
                            {imageData.upscaled ? (
                                <ComparisonSlider original={imageData.original} generated={imageData.upscaled} />
                            ) : originalImage ? (
                                <ComparisonSlider original={originalImage} generated={imageData.original} />
                            ) : (
                                <img src={imageData.original} alt={`Generated art variant ${i + 1}`} className="w-full aspect-square max-h-[512px] mx-auto overflow-hidden rounded-lg object-cover" />
                            )}
                            <div className="flex justify-between items-center mt-4 mb-3">
                                <p className="text-gray-800 text-sm">{style.name} Style - Variant {i + 1}</p>
                                {imageData.upscaled && <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Upscaled ✨</span>}
                            </div>

                            <div className="flex space-x-2">
                                {!imageData.upscaled && (
                                    <button
                                        onClick={() => setShowUpscaleOptionsFor(i)}
                                        disabled={upscalingIndex !== null}
                                        className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <UpscaleIcon className="w-4 h-4" /> Upscale
                                    </button>
                                )}
                                <button onClick={() => handleDownload(imageData, i)} className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 hover:bg-purple-700 transition-colors">
                                    <DownloadIcon className="w-4 h-4" /> Download{imageData.upscaled ? ' HD' : ''}
                                </button>
                                <button onClick={() => handleShare(imageData, i)} className="flex-1 bg-pink-500 text-white py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 hover:bg-pink-600 transition-colors">
                                    <ShareIcon className="w-4 h-4" /> Share
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                        onClick={onReset}
                        className="bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transform transition-all duration-300 ease-in-out flex items-center gap-2"
                    >
                        <RedoIcon className="w-5 h-5" />
                        Create Another
                    </button>
                    <button
                        onClick={handleDownloadAll}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 px-8 rounded-full hover:shadow-lg transform transition-all duration-300 ease-in-out flex items-center gap-2"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Download All
                    </button>
                </div>
            </section>
            
            {showUpscaleOptionsFor !== null && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowUpscaleOptionsFor(null)}>
                    <div className="bg-white rounded-2xl p-6 space-y-4 w-full max-w-sm card-effect" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-center">Advanced Upscale</h3>
                        <p className="text-sm text-gray-600 text-center">Choose an upscaling method to enhance your image.</p>
                        <div className="space-y-3 pt-2">
                            <button onClick={() => handleUpscaleClick(showUpscaleOptionsFor, 'standard')} className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                                <UpscaleIcon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-left">Standard Upscale</p>
                                    <p className="text-xs text-gray-500 text-left">Improves resolution and sharpness (2x).</p>
                                </div>
                            </button>
                            <button onClick={() => handleUpscaleClick(showUpscaleOptionsFor, 'creative')} className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                                <MagicWandIcon className="w-8 h-8 text-pink-500 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-left">Creative Detail</p>
                                    <p className="text-xs text-gray-500 text-left">Adds fine, artistic details and textures (4k).</p>
                                </div>
                            </button>
                            <button onClick={() => handleUpscaleClick(showUpscaleOptionsFor, 'face_retouch')} className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                                <EnhanceFaceIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-left">Face Retouch</p>
                                    <p className="text-xs text-gray-500 text-left">Focuses on enhancing facial features (4k).</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ResultsGrid;
