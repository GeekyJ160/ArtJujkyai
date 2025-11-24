import React, { useState, useEffect, useRef } from 'react';
import ScreenHeader from './ScreenHeader';
import UploadZone from './UploadZone';
import { removeObjectsFromImage } from '../services/geminiService';
import ComparisonSlider from './ComparisonSlider';
import { RedoIcon, MagicWandIcon } from './icons';

interface ExpandImageScreenProps {
    navigate: (screen: string, image?: string) => void;
    initialImage: string | null;
}

const ExpandImageScreen: React.FC<ExpandImageScreenProps> = ({ navigate, initialImage }) => {
    const [image, setImage] = useState<string | null>(initialImage);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [padding, setPadding] = useState(25); // Percentage
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleImageUpload = (imageDataUrl: string) => {
        setImage(imageDataUrl);
        setResult(null);
        setError(null);
    };

    useEffect(() => {
        if (!image) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = image;
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const paddingPixels = (img.width * padding) / 100;
            const newWidth = img.width + 2 * paddingPixels;
            const newHeight = img.height + 2 * paddingPixels;
            
            canvas.width = newWidth;
            canvas.height = newHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.clearRect(0, 0, newWidth, newHeight);
            ctx.drawImage(img, paddingPixels, paddingPixels, img.width, img.height);
            setExpandedImage(canvas.toDataURL('image/png'));
        };

    }, [image, padding]);

    const handleProcess = async () => {
        if (!expandedImage) {
            setError('Please upload an image to expand.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const finalPrompt = prompt 
                ? `This image has a transparent border. Fill the transparent area based on the following description: ${prompt}. Make it realistic and seamless, extending the original image.`
                : 'This image has a transparent border. Please fill in the transparent area realistically and seamlessly, extending the original image.';
            const res = await removeObjectsFromImage(expandedImage, finalPrompt);
            setResult(res);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Expansion failed: ${errorMessage}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
      setImage(null);
      setResult(null);
      setError(null);
      setPrompt('');
      setPadding(25);
    };

    if (!image) {
        return (
            <div className="max-w-xl mx-auto">
                <ScreenHeader title="Expand Image" onBack={() => navigate('home')} />
                <UploadZone onImageUpload={handleImageUpload} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <ScreenHeader title="Expand Image" onBack={() => navigate('home')} />
            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" /> 
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow flex flex-col items-center">
                    {isLoading ? (
                         <div className="w-full aspect-square max-w-lg bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 mb-4"></div>
                            <p className="text-gray-600">Expanding your image...</p>
                         </div>
                    ) : result ? (
                         <ComparisonSlider original={image} generated={result} />
                    ) : expandedImage ? (
                        <div className="relative w-full max-w-lg">
                            <img src={expandedImage} alt="Ready to expand" className="rounded-lg shadow-lg w-full" style={{ background: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Crect width=\"10\" height=\"10\" x=\"0\" y=\"0\" fill=\"%23f0f0f0\" /%3E%3Crect width=\"10\" height=\"10\" x=\"10\" y=\"10\" fill=\"%23f0f0f0\" /%3E%3Crect width=\"10\" height=\"10\" x=\"10\" y=\"0\" fill=\"%23dcdcdc\" /%3E%3Crect width=\"10\" height=\"10\" x=\"0\" y=\"10\" fill=\"%23dcdcdc\" /%3E%3C/svg%3E')"}} />
                            <div className="absolute inset-0 border-2 border-dashed border-purple-500/50 rounded-lg pointer-events-none"></div>
                        </div>
                    ) : null }
                </div>
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    {result ? (
                         <div className="text-center card-effect p-6 rounded-2xl">
                             <h3 className="text-xl font-bold mb-4">Expansion Complete!</h3>
                             <p className="text-gray-600 mb-6">Drag the slider to see the difference.</p>
                             <button
                                onClick={handleReset}
                                className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transform transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                            >
                                <RedoIcon className="w-5 h-5"/>
                                Expand Another
                            </button>
                         </div>
                    ) : (
                         <div className="card-effect p-6 rounded-2xl space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-gray-700">Expand Amount</h3>
                                    <span className="text-sm font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{padding}%</span>
                                </div>
                                <input
                                    type="range" min="10" max="100" step="5"
                                    value={padding}
                                    onChange={(e) => setPadding(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-purple-600"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">(Optional) Describe what to add</h3>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., 'a starry night sky', 'a beautiful beach scene'"
                                    className="w-full h-24 bg-gray-100 rounded-md p-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                />
                            </div>
                             <button
                                onClick={handleProcess}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <MagicWandIcon className="w-6 h-6"/>
                                {isLoading ? 'Expanding...' : 'Expand Image'}
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default ExpandImageScreen;
