import React, { useState, useRef, useEffect } from 'react';
import ScreenHeader from './ScreenHeader';
import UploadZone from './UploadZone';
import { removeObjectsFromImage } from '../services/geminiService';
import ComparisonSlider from './ComparisonSlider';
import { EraseIcon, RedoIcon } from './icons';

interface RemoveObjectsScreenProps {
    mode: 'remove-objects' | 'ai-fill';
    navigate: (screen: string) => void;
    initialImage: string | null;
}

const MaskingCanvas: React.FC<{
    imageSrc: string;
    brushSize: number;
    onMasked: (dataUrl: string) => void;
}> = ({ imageSrc, brushSize, onMasked }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;
        img.onload = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const aspectRatio = img.width / img.height;
                const maxWidth = 800;
                canvas.width = Math.min(img.width, maxWidth);
                canvas.height = canvas.width / aspectRatio;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                setImageElement(img);
            }
        };
    }, [imageSrc]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientX : e.nativeEvent.clientX;
        const clientY = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientY : e.nativeEvent.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = getCoords(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            onMasked(canvas.toDataURL('image/png'));
        }
    };
    
    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="rounded-lg shadow-lg cursor-crosshair"
            style={{ touchAction: 'none' }}
        />
    );
};

const RemoveObjectsScreen: React.FC<RemoveObjectsScreenProps> = ({ mode, navigate, initialImage }) => {
    const [image, setImage] = useState<string | null>(initialImage);
    const [maskedImage, setMaskedImage] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState(40);
    const [prompt, setPrompt] = useState('');

    const title = mode === 'ai-fill' ? 'AI Fill' : 'Remove Objects';
    const buttonText = mode === 'ai-fill' ? 'Fill' : 'Remove';

    const handleImageUpload = (imageDataUrl: string) => {
        setImage(imageDataUrl);
        setResult(null);
        setMaskedImage(null);
        setError(null);
    };

    const handleProcess = async () => {
        if (!maskedImage) {
            setError('Please mask the area you want to edit.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const finalPrompt = mode === 'ai-fill' && prompt 
                ? `This image contains a transparent area. Fill the transparent area with: ${prompt}. Make it realistic and seamless.`
                : '';
            const res = await removeObjectsFromImage(maskedImage, finalPrompt);
            setResult(res);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Processing failed: ${errorMessage}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
      setImage(null);
      setMaskedImage(null);
      setResult(null);
      setError(null);
      setPrompt('');
    }

    if (!image) {
        return (
            <div className="max-w-xl mx-auto">
                <ScreenHeader title={title} onBack={() => navigate('home')} />
                <UploadZone onImageUpload={handleImageUpload} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <ScreenHeader title={title} onBack={() => navigate('home')} />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow flex flex-col items-center">
                    {result ? (
                         <ComparisonSlider original={image} generated={result} />
                    ) : (
                        <MaskingCanvas imageSrc={image} brushSize={brushSize} onMasked={setMaskedImage} />
                    )}
                </div>
                <div className="w-full lg:w-72 flex-shrink-0 space-y-6">
                    {result ? (
                         <div className="text-center card-effect p-6 rounded-2xl">
                             <h3 className="text-xl font-bold mb-4">Success!</h3>
                             <p className="text-gray-600 mb-6">Your image has been transformed.</p>
                             <button
                                onClick={handleReset}
                                className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transform transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                            >
                                <RedoIcon className="w-5 h-5"/>
                                Start Over
                            </button>
                         </div>
                    ) : (
                         <div className="card-effect p-6 rounded-2xl space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-gray-700">Brush Size</h3>
                                    <span className="text-sm font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{brushSize}</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-purple-600"
                                />
                            </div>
                            {mode === 'ai-fill' && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">What to fill with?</h3>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="e.g., 'a field of flowers'"
                                        className="w-full h-20 bg-gray-100 rounded-md p-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                    />
                                </div>
                            )}
                             <button
                                onClick={handleProcess}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : buttonText}
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default RemoveObjectsScreen;
