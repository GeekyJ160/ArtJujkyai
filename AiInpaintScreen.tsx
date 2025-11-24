import React, { useState, useRef, useEffect, useCallback } from 'react';
import ScreenHeader from './ScreenHeader';
import UploadZone from './UploadZone';
import { generateInpaintVariants } from '../services/geminiService';
import { EraseIcon, RedoIcon, EditIcon, DownloadIcon, ShareIcon, MagicWandIcon } from './icons';
import RefinementCanvas from './RefinementCanvas';

interface AiInpaintScreenProps {
    navigate: (screen: string, image?: string) => void;
    initialImage: string | null;
}

interface Preset {
  id: string;
  name: string;
  prompt: string;
  image: string;
}

interface Category {
  id:string;
  name: string;
  presets: Preset[];
}

const inpaintCategories: Category[] = [
    {
        id: 'clothes',
        name: 'Clothes',
        presets: [
            { id: 'remove_clothes', name: 'Remove', prompt: 'Remove the clothing in the selected area, replacing it with bare skin that matches the person\'s body.', image: 'https://picsum.photos/seed/remove/200' },
            { id: 'custom_clothes', name: 'Custom', prompt: 'Use a custom prompt to change clothes.', image: 'https://picsum.photos/seed/custom/200' },
            { id: 'suit', name: 'Suit', prompt: 'Change the clothes in the selected area to a modern, stylish business suit.', image: 'https://picsum.photos/seed/suit/200' },
            { id: 'old_money', name: 'Old Money', prompt: 'Change the clothes in the selected area to an "old money" aesthetic outfit, like a tweed blazer or a cashmere sweater.', image: 'https://picsum.photos/seed/oldmoney/200' },
        ]
    },
    {
        id: 'body',
        name: 'Body',
        presets: [
            { id: 'custom_body', name: 'Custom', prompt: 'Use a custom prompt for body modification.', image: 'https://picsum.photos/seed/custom_body/200' },
            { id: 'hourglass', name: 'Hourglass', prompt: 'Modify the body shape in the selected area to be an hourglass figure. Make the changes look natural and realistic.', image: 'https://picsum.photos/seed/hourglass/200' },
            { id: 'slim', name: 'Slim', prompt: 'Modify the body shape in the selected area to be slimmer. Make the changes look natural and realistic.', image: 'https://picsum.photos/seed/slim/200' },
            { id: 'macho', name: 'Macho', prompt: 'Modify the body shape in the selected area to be more muscular and macho. Make the changes look natural and realistic.', image: 'https://picsum.photos/seed/macho/200' },
        ]
    },
    { id: 'hair', name: 'Hair', presets: [] },
    { id: 'skin', name: 'Skin', presets: [] },
];


const MaskingCanvas: React.FC<{
    imageSrc: string;
    brushSize: number;
    tool: 'draw' | 'erase';
    onMaskReady: (dataUrl: string) => void;
    onClear: number;
}> = ({ imageSrc, brushSize, tool, onMaskReady, onClear }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const drawCanvases = useCallback(() => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imageSrc;
        image.onload = () => {
            const container = containerRef.current;
            const imageCanvas = imageCanvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            if (!container || !imageCanvas || !maskCanvas) return;

            const { clientWidth, clientHeight } = container;
            const imgAspectRatio = image.width / image.height;
            const containerAspectRatio = clientWidth / clientHeight;

            let canvasWidth, canvasHeight;
            if (imgAspectRatio > containerAspectRatio) {
                canvasWidth = clientWidth;
                canvasHeight = clientWidth / imgAspectRatio;
            } else {
                canvasHeight = clientHeight;
                canvasWidth = clientHeight * imgAspectRatio;
            }

            [imageCanvas, maskCanvas].forEach(canvas => {
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
            });

            imageCanvas.getContext('2d')?.drawImage(image, 0, 0, canvasWidth, canvasHeight);
            maskCanvas.getContext('2d')?.clearRect(0, 0, canvasWidth, canvasHeight);
        };
    }, [imageSrc]);

    useEffect(() => {
        drawCanvases();
        window.addEventListener('resize', drawCanvases);
        return () => window.removeEventListener('resize', drawCanvases);
    }, [drawCanvases]);
    
    useEffect(() => {
       const maskCtx = maskCanvasRef.current?.getContext('2d');
       if(maskCtx) maskCtx.clearRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height);
       onMaskReady('');
    }, [onClear, onMaskReady]);


    const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
        const canvas = maskCanvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientX : e.nativeEvent.clientX;
        const clientY = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientY : e.nativeEvent.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = maskCanvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = getCoords(e);
        
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);

        if (tool === 'draw') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(236, 72, 153, 0.5)';
            ctx.fill();
        } else { // erase
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fill();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const imageCanvas = imageCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!imageCanvas || !maskCanvas) return;

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = imageCanvas.width;
        offscreenCanvas.height = imageCanvas.height;
        const offCtx = offscreenCanvas.getContext('2d');
        if (!offCtx) return;

        offCtx.drawImage(imageCanvas, 0, 0);
        offCtx.globalCompositeOperation = 'destination-in';
        offCtx.drawImage(maskCanvas, 0, 0);
        offCtx.globalCompositeOperation = 'destination-out';
        offCtx.fillStyle = 'black';
        offCtx.fillRect(0,0, offscreenCanvas.width, offscreenCanvas.height);
        
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = imageCanvas.width;
        finalCanvas.height = imageCanvas.height;
        const finalCtx = finalCanvas.getContext('2d');
        if(!finalCtx) return;

        finalCtx.drawImage(imageCanvas, 0, 0);
        finalCtx.globalCompositeOperation = 'destination-out';
        finalCtx.drawImage(offscreenCanvas, 0, 0);
        
        onMaskReady(finalCanvas.toDataURL('image/png'));
    };

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <canvas ref={imageCanvasRef} className="absolute inset-0" />
            <canvas
                ref={maskCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 cursor-crosshair"
                style={{ touchAction: 'none' }}
            />
        </div>
    );
};

const AiInpaintScreen: React.FC<AiInpaintScreenProps> = ({ navigate, initialImage }) => {
    const [image, setImage] = useState<string | null>(initialImage);
    const [maskedImageForApi, setMaskedImageForApi] = useState<string | null>(null);
    const [results, setResults] = useState<string[]>([]);
    const [activeResult, setActiveResult] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState(40);
    const [activeCategory, setActiveCategory] = useState<Category>(inpaintCategories[0]);
    const [clearMask, setClearMask] = useState(0);
    const [maskTool, setMaskTool] = useState<'draw' | 'erase'>('draw');
    const [isRefiningResult, setIsRefiningResult] = useState(false);
    const [refiningResult, setRefiningResult] = useState<{ image: string, index: number } | null>(null);

    // State for refining the mask and regenerating
    const [isRefiningMask, setIsRefiningMask] = useState(false);
    const [lastUsedPrompt, setLastUsedPrompt] = useState<string | null>(null);
    const [previousResults, setPreviousResults] = useState<string[]>([]);


    const handleImageUpload = (imageDataUrl: string) => {
        setImage(imageDataUrl);
        setResults([]);
        setActiveResult(null);
        setMaskedImageForApi(null);
        setError(null);
    };

    const runGeneration = async (promptToUse: string) => {
        if (!maskedImageForApi) {
            setError('Please select an area on the image by drawing on it first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults([]);
        setActiveResult(null);
        
        try {
            const onProgress = (p: number) => setProgress(p);
            const variants = await generateInpaintVariants({ maskedImage: maskedImageForApi, prompt: promptToUse, variants: 4, onProgress });
            setResults(variants);
            setActiveResult(variants[0]);
            setIsRefiningMask(false);
            setPreviousResults([]);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Inpainting failed: ${errorMessage}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async (preset: Preset) => {
        let finalPrompt = preset.prompt;
        if (preset.id.startsWith('custom')) {
            const customInput = prompt('Enter your custom instruction:');
            if (!customInput) return;
            finalPrompt = customInput;
        }
        setLastUsedPrompt(finalPrompt);
        await runGeneration(finalPrompt);
    };
    
    const handleReset = () => {
      setImage(null);
      setMaskedImageForApi(null);
      setResults([]);
      setActiveResult(null);
      setError(null);
      setIsRefiningMask(false);
      setLastUsedPrompt(null);
      setPreviousResults([]);
    };

    const handleDownload = (imageUrl: string | null) => {
        if (!imageUrl) return;
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `artjunky-inpaint-result.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadAll = async () => {
        for (let i = 0; i < results.length; i++) {
            const imageUrl = results[i];
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = `artjunky-inpaint-result-${i + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            if (i < results.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    };

    const handleShare = async (imageUrl: string | null) => {
        if (!imageUrl) return;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `artjunky-inpaint-result.png`, { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `My ArtJunky Inpaint Creation`,
                    text: `Check out this image I edited with ArtJunky AI!`,
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
    
    const handleClearMask = () => {
        setClearMask(c => c + 1);
        setMaskedImageForApi(null);
    };

    const handleStartRefiningResult = (imageToRefine: string, index: number) => {
        setRefiningResult({ image: imageToRefine, index });
        setIsRefiningResult(true);
    };

    const handleApplyRefinement = (refinedImage: string) => {
        if (refiningResult === null) return;
        const newResults = [...results];
        newResults[refiningResult.index] = refinedImage;
        setResults(newResults);
        setActiveResult(refinedImage);
        setIsRefiningResult(false);
        setRefiningResult(null);
    };

    const handleCancelRefinement = () => {
        setIsRefiningResult(false);
        setRefiningResult(null);
    };

    const handleStartRefineMask = () => {
        setPreviousResults(results);
        setResults([]);
        setActiveResult(null);
        setIsRefiningMask(true);
        handleClearMask();
    };

    const handleCancelRefineMask = () => {
        setResults(previousResults);
        setActiveResult(previousResults[0] || null);
        setIsRefiningMask(false);
        setPreviousResults([]);
    };

    const handleRegenerate = async () => {
        if (lastUsedPrompt) {
            await runGeneration(lastUsedPrompt);
        } else {
            setError("Could not find the last used prompt to regenerate.");
        }
    };

    if (!image) {
        return (
            <div className="max-w-xl mx-auto">
                <ScreenHeader title="AI Inpaint" onBack={() => navigate('home')} />
                <UploadZone onImageUpload={handleImageUpload} />
            </div>
        );
    }
    
    if (isRefiningResult && refiningResult) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 p-4">
                 <RefinementCanvas
                    baseImageSrc={refiningResult.image}
                    originalImageSrc={image}
                    onApply={handleApplyRefinement}
                    onCancel={handleCancelRefinement}
                />
            </div>
        )
    }
    
    const finalImageToShow = isRefiningMask ? image : activeResult || image;

    return (
        <div className="max-w-5xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 80px)'}}>
            <ScreenHeader title="AI Inpaint" onBack={() => navigate('home')} />
            
            <div className="flex-grow w-full h-full min-h-0 bg-gray-900 rounded-t-2xl p-4 flex items-center justify-center">
                 {isLoading ? (
                    <div className="text-center text-white">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 mb-4 mx-auto"></div>
                        <p>AI is painting...</p>
                        <div className="w-64 bg-gray-700 rounded-full h-2.5 mt-4">
                            <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                ) : (
                    <MaskingCanvas 
                        imageSrc={finalImageToShow!} 
                        brushSize={brushSize} 
                        tool={maskTool}
                        onMaskReady={setMaskedImageForApi}
                        onClear={clearMask}
                    />
                )}
            </div>

            <div className="flex-shrink-0 bg-white rounded-b-2xl shadow-lg p-4 space-y-4">
                {results.length > 0 ? (
                    <div className="space-y-4 text-center">
                        <h3 className="font-semibold">Results</h3>
                        <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                            {results.map((res, i) => (
                                <div key={i} className="relative group flex-shrink-0">
                                    <img 
                                        src={res} 
                                        alt={`Result ${i+1}`}
                                        onClick={() => setActiveResult(res)}
                                        className={`w-16 h-16 object-cover rounded-md cursor-pointer transition-all ${activeResult === res ? 'ring-2 ring-purple-500' : 'ring-1 ring-gray-200'}`}
                                    />
                                    <button 
                                        onClick={() => handleStartRefiningResult(res, i)}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Refine result"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center flex-wrap gap-2">
                            <button onClick={() => handleDownload(activeResult)} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-full hover:bg-purple-700 text-sm flex items-center justify-center gap-2">
                                <DownloadIcon className="w-4 h-4" /> Download
                            </button>
                            <button onClick={handleDownloadAll} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-2 px-6 rounded-full hover:shadow-lg text-sm flex items-center justify-center gap-2">
                                <DownloadIcon className="w-4 h-4" /> Download All
                            </button>
                            <button onClick={() => handleShare(activeResult)} className="bg-pink-500 text-white font-bold py-2 px-6 rounded-full hover:bg-pink-600 text-sm flex items-center justify-center gap-2">
                                <ShareIcon className="w-4 h-4" /> Share
                            </button>
                             <button onClick={handleStartRefineMask} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 text-sm flex items-center justify-center gap-2">
                                <EditIcon className="w-4 h-4" /> Refine Mask
                            </button>
                            <button onClick={handleReset} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-300 text-sm flex items-center justify-center gap-2">
                                <RedoIcon className="w-4 h-4" /> Start Over
                            </button>
                        </div>
                    </div>
                ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2 space-y-2">
                             <h3 className="font-semibold text-gray-700 text-sm mb-2">Refine Mask</h3>
                             <div className="flex gap-2">
                                <button onClick={() => setMaskTool('draw')} className={`flex-1 py-1.5 px-2 text-xs rounded-md flex items-center justify-center gap-1 transition-colors ${maskTool === 'draw' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                    <EditIcon className="w-3 h-3"/> Draw
                                </button>
                                <button onClick={() => setMaskTool('erase')} className={`flex-1 py-1.5 px-2 text-xs rounded-md flex items-center justify-center gap-1 transition-colors ${maskTool === 'erase' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                    <EraseIcon className="w-3 h-3"/> Erase
                                </button>
                                <button onClick={handleClearMask} className="flex-1 py-1.5 px-2 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">Clear</button>
                             </div>
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                            <h3 className="font-semibold text-gray-700 text-sm mb-2">Brush Size</h3>
                            <input
                                type="range" min="10" max="100" value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-purple-600"
                            />
                        </div>
                    </div>
                    {isRefiningMask ? (
                        <div className="border-t pt-4 text-center space-y-3">
                            <h3 className="font-semibold text-gray-800">Refine Your Mask</h3>
                            <p className="text-sm text-gray-500">Draw a new mask on the image above, then generate new results.</p>
                            <div className="flex justify-center gap-2">
                                <button onClick={handleCancelRefineMask} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-300 text-sm">Cancel</button>
                                <button onClick={handleRegenerate} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-full hover:bg-purple-700 text-sm flex items-center justify-center gap-2">
                                    <MagicWandIcon className="w-4 h-4"/> Generate Again
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex border-b">
                                {inpaintCategories.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-2 text-sm font-semibold transition-colors ${activeCategory.id === cat.id ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-800'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                               {activeCategory.presets.length > 0 ? activeCategory.presets.map(preset => (
                                    <div key={preset.id} onClick={() => handleGenerate(preset)} className="cursor-pointer rounded-lg text-center transition-transform hover:scale-105">
                                        <img src={preset.image} alt={preset.name} className="w-full h-16 object-cover rounded-md mx-auto ring-1 ring-gray-200" />
                                        <p className="text-xs mt-1.5 font-medium text-gray-600">{preset.name}</p>
                                    </div>
                               )) : <p className="col-span-full text-center text-sm text-gray-400 py-4">Presets for {activeCategory.name} coming soon!</p>}
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </>
                )}
            </div>
        </div>
    );
};

export default AiInpaintScreen;