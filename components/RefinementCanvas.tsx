import React, { useRef, useEffect, useState, MouseEvent, TouchEvent } from 'react';
import { EraseIcon, RestoreIcon } from './icons';

interface RefinementCanvasProps {
    baseImageSrc: string;
    originalImageSrc: string;
    onApply: (refinedImage: string) => void;
    onCancel: () => void;
}

const RefinementCanvas: React.FC<RefinementCanvasProps> = ({ baseImageSrc, originalImageSrc, onApply, onCancel }) => {
    const [tool, setTool] = useState<'erase' | 'restore'>('erase');
    const [brushSize, setBrushSize] = useState(40);
    const [isDrawing, setIsDrawing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const originalImageRef = useRef<HTMLImageElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        contextRef.current = context;

        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = baseImageSrc;
        image.onload = () => {
            const container = canvas.parentElement;
            if (container) {
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                const imgAspectRatio = image.width / image.height;
                const containerAspectRatio = containerWidth / containerHeight;

                let canvasWidth, canvasHeight;
                if (imgAspectRatio > containerAspectRatio) {
                    canvasWidth = containerWidth;
                    canvasHeight = containerWidth / imgAspectRatio;
                } else {
                    canvasHeight = containerHeight;
                    canvasWidth = containerHeight * imgAspectRatio;
                }

                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
            }
        };

        const originalImage = new Image();
        originalImage.crossOrigin = 'anonymous';
        originalImage.src = originalImageSrc;
        originalImage.onload = () => {
            originalImageRef.current = originalImage;
        };
    }, [baseImageSrc, originalImageSrc]);

    const getCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
        const coords = getCoords(e);
        if (coords) {
            setIsDrawing(true);
            lastPointRef.current = coords;
            draw(e); 
        }
    };
    
    const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        const coords = getCoords(e);
        const ctx = contextRef.current;
        if (!coords || !ctx || !lastPointRef.current) return;

        const { x, y } = coords;
        const lastPoint = lastPointRef.current;
        
        const distance = Math.hypot(x - lastPoint.x, y - lastPoint.y);
        const angle = Math.atan2(y - lastPoint.y, x - lastPoint.x);

        for (let i = 0; i < distance; i += 1) {
            const px = lastPoint.x + (Math.cos(angle) * i);
            const py = lastPoint.y + (Math.sin(angle) * i);

            ctx.beginPath();
            ctx.arc(px, py, brushSize / 2, 0, Math.PI * 2);

            if (tool === 'erase') {
                ctx.save();
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fill();
                ctx.restore();
            } else if (originalImageRef.current) {
                ctx.save();
                ctx.clip();
                ctx.drawImage(originalImageRef.current, 0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }
        }

        lastPointRef.current = coords;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPointRef.current = null;
    };

    const handleApply = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onApply(canvas.toDataURL('image/png'));
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing as any}
                onMouseMove={draw as any}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing as any}
                onTouchMove={draw as any}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair max-w-full max-h-full"
            />
            <div className="bg-black/40 p-4 rounded-lg mt-4 w-full max-w-lg">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                         <button
                            onClick={() => setTool('erase')}
                            className={`p-3 rounded-full transition-colors ${tool === 'erase' ? 'bg-purple-600 text-white' : 'bg-gray-700/50 text-white hover:bg-gray-600/50'}`}
                            aria-label="Erase tool"
                        >
                            <EraseIcon className="w-6 h-6" />
                        </button>
                         <button
                            onClick={() => setTool('restore')}
                            className={`p-3 rounded-full transition-colors ${tool === 'restore' ? 'bg-purple-600 text-white' : 'bg-gray-700/50 text-white hover:bg-gray-600/50'}`}
                            aria-label="Restore tool"
                        >
                            <RestoreIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-grow w-full sm:w-auto">
                        <div className="flex justify-between text-sm text-white mb-1"><label htmlFor="brush-size-slider">Brush Size</label><span>{brushSize}px</span></div>
                        <input
                            id="brush-size-slider"
                            type="range"
                            value={brushSize}
                            min={5}
                            max={100}
                            step={1}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm">Cancel</button>
                        <button onClick={handleApply} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefinementCanvas;