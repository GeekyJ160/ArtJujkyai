
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ComparisonSliderProps {
    original: string;
    generated: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ original, generated }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPos(percent);
    }, [isDragging]);
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
    };

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleMove(e.clientX);
    }, [handleMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        handleMove(e.touches[0].clientX);
    }, [handleMove]);


    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-square max-h-[512px] mx-auto overflow-hidden rounded-lg select-none cursor-ew-resize"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <img
                src={generated}
                alt="Transformed"
                draggable="false"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div
                className="absolute inset-0 w-full h-full object-cover overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <img
                    src={original}
                    alt="Original"
                    draggable="false"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>
            <div
                className="absolute top-0 bottom-0 w-1 bg-white/50 pointer-events-none"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full h-8 w-8 flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-gray-600 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default ComparisonSlider;
