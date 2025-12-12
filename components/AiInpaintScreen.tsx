
import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import ScreenHeader from './ScreenHeader';
import UploadZone from './UploadZone';
import { generateInpaintVariants } from '../services/geminiService';
import { EraseIcon, RedoIcon, EditIcon, DownloadIcon, ShareIcon, MagicWandIcon, UndoIcon, UploadIcon } from './icons';
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
            { id: 'remove_clothes', name: 'Remove Clothes', prompt: 'Remove the clothing in the selected area, replacing it with bare skin that matches the person\'s body.', image: 'https://picsum.photos/seed/remove/200' },
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

interface Point { x: number, y: number }
interface Stroke { tool: 'draw' | 'erase'; size: number; points: Point[] }
interface ImageMask { tool: 'image'; image: HTMLImageElement }
type HistoryItem = Stroke | ImageMask;

interface MaskingCanvasRef {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    addMaskImage: (dataUrl: string) => void;
}

interface MaskingCanvasProps {
    imageSrc: string;
    brushSize: number;
    tool: 'draw' | 'erase';
    onMaskReady: (dataUrl: string) => void;
    onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
}

const MaskingCanvas = forwardRef<MaskingCanvasRef, MaskingCanvasProps>(({ imageSrc, brushSize, tool, onMaskReady, onHistoryChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // History state
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const currentStroke = useRef<Stroke | null>(null);

    useImperativeHandle(ref, () => ({
        undo: () => {
            if (historyStep >= 0) {
                setHistoryStep(prev => prev - 1);
            }
        },
        redo: () => {
            if (historyStep < history.length - 1) {
                setHistoryStep(prev => prev + 1);
            }
        },
        clear: () => {
             setHistory([]);
             setHistoryStep(-1);
        },
        addMaskImage: (dataUrl: string) => {
            const img = new Image();
            img.onload = () => {
                const newItem: ImageMask = { tool: 'image', image: img };
                const newHistory = history.slice(0, historyStep + 1);
                newHistory.push(newItem);
                setHistory(newHistory);
                setHistoryStep(newHistory.length - 1);
            };
            img.src = dataUrl;
        }
    }));

    useEffect(() => {
        onHistoryChange(historyStep >= 0, historyStep < history.length - 1);
    }, [historyStep, history, onHistoryChange]);

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
            
            // Re-draw mask history after resize/init
            redrawMask(maskCanvas.getContext('2d')!, history.slice(0, historyStep + 1));
        };
    }, [imageSrc]); // Intentionally not including history/historyStep to avoid infinite loops on resize, managed by useEffect below

    // Initial draw and resize handler
    useEffect(() => {
        drawCanvases();
        window.addEventListener('resize', drawCanvases);
        return () => window.removeEventListener('resize', drawCanvases);
    }, [drawCanvases]);

    // Redraw when history changes
    useEffect(() => {
        const ctx = maskCanvasRef.current?.getContext('2d');
        if (!ctx) return;
        redrawMask(ctx, history.slice(0, historyStep + 1));
        updateMaskData();
    }, [history, historyStep]);

    const redrawMask = (ctx: CanvasRenderingContext2D, items: HistoryItem[]) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        items.forEach(item => {
            if (item.tool === 'image') {
                ctx.globalCompositeOperation = 'source-over';
                // Draw image scaling to canvas size
                ctx.drawImage(item.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
                return;
            }

            const stroke = item as Stroke;
            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = stroke.size;
            
            if (stroke.tool === 'draw') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
            } else {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            }

            if (stroke.points.length > 0) {
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                for (let i = 1; i < stroke.points.length; i++) {
                    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                }
                // Handle single point click
                if (stroke.points.length === 1) {
                    ctx.lineTo(stroke.points[0].x, stroke.points[0].y + 0.001);
                }
            }
            ctx.stroke();
        });
    };

    const updateMaskData = () => {
        const imageCanvas = imageCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!imageCanvas || !maskCanvas) return;

        // Debounce mask generation slightly to avoid lag during rapid undo/redo? 
        // For now, synchronous is fine for basic size.
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
        
        // If history is empty, pass empty string to signify no mask
        if (historyStep === -1) {
             onMaskReady('');
        } else {
             onMaskReady(finalCanvas.toDataURL('image/png'));
        }
    };

    const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
        const canvas = maskCanvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientX : e.nativeEvent.clientX;
        const clientY = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientY : e.nativeEvent.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        currentStroke.current = {
            tool,
            size: brushSize,
            points: [{ x, y }]
        };
        draw(e);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentStroke.current) return;
        const { x, y } = getCoords(e);
        
        // Add point to stroke
        currentStroke.current.points.push({ x, y });

        // Draw immediately for feedback (no need to redraw full history here for performance)
        const ctx = maskCanvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        
        if (tool === 'draw') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(236, 72, 153, 0.5)';
            ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        }

        // Connect from last point
        const points = currentStroke.current.points;
        const len = points.length;
        if (len > 1) {
            ctx.beginPath();
            ctx.moveTo(points[len - 2].x, points[len - 2].y);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else {
            // Dot
            ctx.beginPath();
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing || !currentStroke.current) return;
        setIsDrawing(false);
        
        // Commit stroke to history
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(currentStroke.current);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        currentStroke.current = null;
        
        // updateMaskData is triggered by useEffect on history change
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
});

const AiInpaintScreen: React.FC<AiInpaintScreenProps> = ({ navigate, initialImage }) => {
    const [image, setImage] = useState<string | null>(initialImage);
    const [maskedImageForApi, setMaskedImageForApi] = useState<string | null>(null);
    const [results, setResults] = useState<string[]>([]);
    const [activeResult, setActiveResult] = useState<string | null>(null);
    
    // Generation History
    const [generationHistory, setGenerationHistory] = useState<string[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState(40);
    const [activeCategory, setActiveCategory] = useState<Category>(inpaintCategories[0]);
    const [maskTool, setMaskTool] = useState<'draw' | 'erase'>('draw');
    const [isRefiningResult, setIsRefiningResult] = useState(false);
    const [refiningResult, setRefiningResult] = useState<{ image: string, index: number } | null>(null);

    // Mask History UI State
    const [canUndoMask, setCanUndoMask] = useState(false);
    const [canRedoMask, setCanRedoMask] = useState(false);
    const maskCanvasRef = useRef<MaskingCanvasRef>(null);
    const maskInputRef = useRef<HTMLInputElement>(null);

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
        setGenerationHistory([]);
        setHistoryIndex(-1);
    };
    
    const handleMaskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    maskCanvasRef.current?.addMaskImage(ev.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = '';
    };

    const addToGenerationHistory = (newVariants: string[]) => {
        const newHistory = generationHistory.slice(0, historyIndex + 1);
        newHistory.push(newVariants);
        setGenerationHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undoGeneration = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const prevResults = generationHistory[newIndex];
            setResults(prevResults);
            setActiveResult(prevResults[0]);
        }
    };

    const redoGeneration = () => {
        if (historyIndex < generationHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const nextResults = generationHistory[newIndex];
            setResults(nextResults);
            setActiveResult(nextResults[0]);
        }
    };

    const runGeneration = async (promptToUse: string) => {
        if (!maskedImageForApi) {
            setError('Please select an area on the image by drawing on it first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const onProgress = (p: number) => setProgress(p);
            const variants = await generateInpaintVariants({ maskedImage: maskedImageForApi, prompt: promptToUse, variants: 4, onProgress });
            setResults(variants);
            setActiveResult(variants[0]);
            addToGenerationHistory(variants);
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
      setGenerationHistory([]);
      setHistoryIndex(-1);
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
        maskCanvasRef.current?.clear();
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
        
        // Update history with refined result
        const newHistory = [...generationHistory];
        newHistory[historyIndex] = newResults;
        setGenerationHistory(newHistory);
        
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
                        ref={maskCanvasRef}
                        imageSrc={finalImageToShow!} 
                        brushSize={brushSize} 
                        tool={maskTool}
                        onMaskReady={setMaskedImageForApi}
                        onHistoryChange={(undo, redo) => { setCanUndoMask(undo); setCanRedoMask(redo); }}
                    />
                )}
            </div>

            <div className="flex-shrink-0 bg-white rounded-b-2xl shadow-lg p-4 space-y-4">
                {results.length > 0 ? (
                    <div className="space-y-4 text-center">
                        <div className="flex justify-between items-center px-2">
                             <h3 className="font-semibold text-gray-800">Results ({historyIndex + 1}/{generationHistory.length})</h3>
                             <div className="flex gap-2">
                                <button 
                                    onClick={undoGeneration} 
                                    disabled={historyIndex <= 0}
                                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Undo Generation"
                                >
                                    <UndoIcon className="w-5 h-5 text-gray-700" />
                                </button>
                                <button 
                                    onClick={redoGeneration} 
                                    disabled={historyIndex >= generationHistory.length - 1}
                                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Redo Generation"
                                >
                                    <RedoIcon className="w-5 h-5 text-gray-700" />
                                </button>
                             </div>
                        </div>
                        
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
                                <div className="flex gap-1 flex-1">
                                    <button 
                                        onClick={() => maskCanvasRef.current?.undo()} 
                                        disabled={!canUndoMask}
                                        className="flex-1 py-1.5 px-1 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        title="Undo Mask Stroke"
                                    >
                                        <UndoIcon className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => maskCanvasRef.current?.redo()} 
                                        disabled={!canRedoMask}
                                        className="flex-1 py-1.5 px-1 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        title="Redo Mask Stroke"
                                    >
                                        <RedoIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={handleClearMask} className="flex-1 py-1.5 px-2 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">Clear</button>
                             </div>
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                            <h3 className="font-semibold text-gray-700 text-sm mb-2">Brush Size & Upload</h3>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="range" min="10" max="100" value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-purple-600"
                                />
                                <button
                                    onClick={() => maskInputRef.current?.click()}
                                    className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    title="Upload Mask Image"
                                >
                                    <UploadIcon className="w-4 h-4" />
                                </button>
                                <input
                                    type="file"
                                    ref={maskInputRef}
                                    onChange={handleMaskUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
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
