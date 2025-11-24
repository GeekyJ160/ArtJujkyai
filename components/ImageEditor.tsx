import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/imageUtils';
import { removeImageBackground } from '../services/geminiService';
import { RotateIcon, ClearIcon, MagicWandIcon, UndoIcon, EditIcon } from './icons';
import RefinementCanvas from './RefinementCanvas';

type AspectRatio = 'portrait' | 'square' | 'landscape';

interface ImageEditorProps {
    imageSrc: string;
    onClose: () => void;
    onApply: (editedImage: string) => void;
    aspectRatio: AspectRatio;
}

interface CropPreset {
    name: string;
    aspect?: number;
}

const cropPresets: CropPreset[] = [
    { name: 'Freeform' },
    { name: 'Original' },
    { name: 'Square', aspect: 1 },
    { name: 'Story', aspect: 9 / 16 },
    { name: 'Post', aspect: 4 / 5 },
    { name: 'Thumbnail', aspect: 16 / 9 },
];


const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onClose, onApply, aspectRatio }) => {
    const [currentImageSrc, setCurrentImageSrc] = useState(imageSrc);
    const [hasAiEdited, setHasAiEdited] = useState(false);

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    const [isRefining, setIsRefining] = useState(false);
    const [imageBeforeRefine, setImageBeforeRefine] = useState<string | null>(null);

    const [activePresetName, setActivePresetName] = useState<string>('Freeform');
    const [originalImageAspect, setOriginalImageAspect] = useState<number | undefined>(undefined);

    useEffect(() => {
        let initialPresetName = 'Freeform';
        if (aspectRatio === 'square') initialPresetName = 'Square';
        else if (aspectRatio === 'portrait') initialPresetName = 'Story';
        else if (aspectRatio === 'landscape') initialPresetName = 'Thumbnail';
        setActivePresetName(initialPresetName);
    }, [aspectRatio]);

    const getCropperAspect = () => {
        if (activePresetName === 'Original' && originalImageAspect) {
            return originalImageAspect;
        }
        const preset = cropPresets.find(p => p.name === activePresetName);
        return preset?.aspect; // undefined for Freeform
    };
    
    const onMediaLoaded = useCallback((mediaSize: {width: number, height: number}) => {
        setOriginalImageAspect(mediaSize.width / mediaSize.height);
    }, []);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleApply = useCallback(async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(
                currentImageSrc,
                croppedAreaPixels,
                rotation,
                brightness,
                contrast,
                saturation
            );
            onApply(croppedImage);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    }, [currentImageSrc, croppedAreaPixels, rotation, onApply, brightness, contrast, saturation]);

    const handleRotate = () => {
        setRotation((prevRotation) => (prevRotation + 90) % 360);
    };

    const handleResetAll = () => {
        setZoom(1);
        setRotation(0);
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
    };

    const handleRemoveBackground = async () => {
        setIsAiProcessing(true);
        try {
            const result = await removeImageBackground(currentImageSrc);
            setCurrentImageSrc(result);
            setHasAiEdited(true);
        } catch (e) {
            console.error("Background removal failed:", e);
            alert("Sorry, we couldn't remove the background. Please try again.");
        } finally {
            setIsAiProcessing(false);
        }
    };

    const handleUndoAiEdit = () => {
        setCurrentImageSrc(imageSrc);
        setHasAiEdited(false);
    };

    const handleStartRefining = () => {
        setImageBeforeRefine(currentImageSrc);
        setIsRefining(true);
    };

    const handleApplyRefinement = (refinedImage: string) => {
        setCurrentImageSrc(refinedImage);
        setIsRefining(false);
        setImageBeforeRefine(null);
    };

    const handleCancelRefinement = () => {
        if (imageBeforeRefine) {
            setCurrentImageSrc(imageBeforeRefine);
        }
        setIsRefining(false);
        setImageBeforeRefine(null);
    };


    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col z-50 p-4" role="dialog" aria-modal="true">
            <div className="relative flex-grow flex items-center justify-center">
                {isRefining ? (
                     <RefinementCanvas
                        baseImageSrc={imageBeforeRefine!}
                        originalImageSrc={imageSrc}
                        onApply={handleApplyRefinement}
                        onCancel={handleCancelRefinement}
                    />
                ) : (
                    <>
                        {isAiProcessing && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
                                <p className="text-white mt-4">AI is thinking...</p>
                            </div>
                        )}
                        <Cropper
                            image={currentImageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={getCropperAspect()}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                            onMediaLoaded={onMediaLoaded}
                            imageStyle={{
                                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                                transition: 'filter 0.1s ease-in-out'
                            }}
                        />
                    </>
                )}
            </div>
            
            {!isRefining && (
                 <div className="flex-shrink-0 pt-4 space-y-4">
                 <div className="bg-black/40 p-4 rounded-lg max-w-3xl mx-auto space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-2 text-center">Crop Presets</h4>
                        <div className="flex flex-wrap justify-center gap-2">
                            {cropPresets.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => setActivePresetName(preset.name)}
                                    disabled={preset.name === 'Original' && !originalImageAspect}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200 ${activePresetName === preset.name ? 'bg-purple-600 text-white' : 'bg-gray-700/50 text-white/80 hover:bg-gray-600/50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-white/10"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm"><label htmlFor="zoom-slider">Zoom</label><span>{zoom.toFixed(1)}x</span></div>
                            <input id="zoom-slider" type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm"><label htmlFor="brightness-slider">Brightness</label><span>{brightness}%</span></div>
                            <input id="brightness-slider" type="range" value={brightness} min={0} max={200} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm"><label htmlFor="contrast-slider">Contrast</label><span>{contrast}%</span></div>
                            <input id="contrast-slider" type="range" value={contrast} min={0} max={200} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm"><label htmlFor="saturation-slider">Saturation</label><span>{saturation}%</span></div>
                            <input id="saturation-slider" type="range" value={saturation} min={0} max={200} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                    </div>
                     <div className="border-t border-white/10"></div>
                    <div className="flex justify-center items-center gap-4 pt-2">
                        <div className="text-center">
                            <h4 className="text-sm font-semibold text-white mb-2">Adjustments</h4>
                            <div className="flex items-center gap-4">
                                <button onClick={handleRotate} className="p-3 bg-gray-700/50 rounded-full text-white hover:bg-gray-600/50 transition-colors" aria-label="Rotate 90 degrees"><RotateIcon className="w-6 h-6" /></button>
                                <button onClick={handleResetAll} className="text-white text-sm py-2 px-4 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors">Reset All</button>
                            </div>
                        </div>
                        <div className="border-l border-white/10 h-16"></div>
                        <div className="text-center">
                            <h4 className="text-sm font-semibold text-white mb-2">AI Tools</h4>
                            <div className="flex items-center gap-4">
                                <button onClick={handleRemoveBackground} disabled={isAiProcessing || hasAiEdited} className="p-3 bg-purple-600/80 rounded-full text-white hover:bg-purple-500/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Remove background"><MagicWandIcon className="w-6 h-6" /></button>
                                {hasAiEdited && (
                                    <>
                                        <button onClick={handleStartRefining} className="p-3 bg-gray-700/50 rounded-full text-white hover:bg-gray-600/50 transition-colors" aria-label="Refine background removal"><EditIcon className="w-6 h-6" /></button>
                                        <button onClick={handleUndoAiEdit} className="p-3 bg-gray-700/50 rounded-full text-white hover:bg-gray-600/50 transition-colors" aria-label="Undo background removal"><UndoIcon className="w-6 h-6" /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="flex-shrink-0 flex justify-center items-center gap-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transition-colors"
                        disabled={isProcessing || isAiProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 px-8 rounded-full hover:shadow-lg transition-transform hover:scale-105"
                        disabled={isProcessing || isAiProcessing}
                    >
                        {isProcessing ? 'Applying...' : 'Apply'}
                    </button>
                </div>
            </div>
            )}
             <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
                aria-label="Close editor"
            >
                <ClearIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default ImageEditor;