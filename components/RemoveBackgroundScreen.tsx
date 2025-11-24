import React, { useState } from 'react';
import ScreenHeader from './ScreenHeader';
import UploadZone from './UploadZone';
import { removeImageBackground } from '../services/geminiService';
import ComparisonSlider from './ComparisonSlider';
import { RedoIcon, DownloadIcon, ShareIcon, MagicWandIcon } from './icons';

interface RemoveBackgroundScreenProps {
    navigate: (screen: string) => void;
    initialImage: string | null;
}

const RemoveBackgroundScreen: React.FC<RemoveBackgroundScreenProps> = ({ navigate, initialImage }) => {
    const [image, setImage] = useState<string | null>(initialImage);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (imageDataUrl: string) => {
        setImage(imageDataUrl);
        setResult(null);
        setError(null);
    };

    const handleProcess = async () => {
        if (!image) {
            setError('Please upload an image to process.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await removeImageBackground(image);
            setResult(res);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Background removal failed: ${errorMessage}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
      setImage(null);
      setResult(null);
      setError(null);
    };

    const handleDownload = (imageUrl: string) => {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `artjunky-background-removed.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleShare = async (imageUrl: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `artjunky-background-removed.png`, { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `My ArtJunky Creation`,
                    text: `I removed the background from this image with ArtJunky AI!`,
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

    if (!image) {
        return (
            <div className="max-w-xl mx-auto">
                <ScreenHeader title="Remove Background" onBack={() => navigate('home')} />
                <UploadZone onImageUpload={handleImageUpload} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <ScreenHeader title="Remove Background" onBack={() => navigate('home')} />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow flex flex-col items-center">
                    {isLoading ? (
                         <div className="w-full aspect-square max-w-lg bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 mb-4"></div>
                            <p className="text-gray-600">Removing background...</p>
                         </div>
                    ) : result ? (
                         <ComparisonSlider original={image} generated={result} />
                    ) : (
                        <img src={image} alt="Original to process" className="rounded-lg shadow-lg w-full max-w-lg" />
                    )}
                </div>
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    {result ? (
                         <div className="text-center card-effect p-6 rounded-2xl space-y-4">
                             <h3 className="text-xl font-bold mb-2">Background Removed!</h3>
                             <p className="text-gray-600 mb-4">Drag the slider to see the magic.</p>
                             <div className="flex space-x-2">
                                <button onClick={() => handleDownload(result)} className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 hover:bg-purple-700 transition-colors">
                                    <DownloadIcon className="w-4 h-4" /> Download
                                </button>
                                <button onClick={() => handleShare(result)} className="flex-1 bg-pink-500 text-white py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 hover:bg-pink-600 transition-colors">
                                    <ShareIcon className="w-4 h-4" /> Share
                                </button>
                            </div>
                             <button
                                onClick={handleReset}
                                className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transform transition-all duration-300 ease-in-out flex items-center justify-center gap-2 mt-2"
                            >
                                <RedoIcon className="w-5 h-5"/>
                                Remove Another
                            </button>
                         </div>
                    ) : (
                         <div className="card-effect p-6 rounded-2xl space-y-6 text-center">
                            <h3 className="font-semibold text-gray-700 text-xl">Ready to Go?</h3>
                            <p className="text-gray-600 text-sm">Click the button below to instantly remove the background from your image.</p>
                             <button
                                onClick={handleProcess}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <MagicWandIcon className="w-6 h-6"/>
                                {isLoading ? 'Processing...' : 'Remove Background'}
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default RemoveBackgroundScreen;