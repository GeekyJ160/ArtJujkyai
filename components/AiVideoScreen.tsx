import React, { useState, useEffect, useRef } from 'react';
import ScreenHeader from './ScreenHeader';
import UploadZone from './UploadZone';
import { generateVideo } from '../services/geminiService';
import { DownloadIcon, RedoIcon, LandscapeIcon, PortraitIcon, PlusIcon, TrashIcon, DragHandleIcon } from './icons';
import { StoryboardScene } from '../types';

interface AiVideoScreenProps {
    navigate: (screen: string) => void;
    initialImage: string | null;
}

const AiVideoScreen: React.FC<AiVideoScreenProps> = ({ navigate, initialImage }) => {
    const [isKeySelected, setIsKeySelected] = useState(false);
    const [keyCheckCompleted, setKeyCheckCompleted] = useState(false);
    
    const [scenes, setScenes] = useState<StoryboardScene[]>([{ id: Date.now().toString(), prompt: '', duration: 5, image: initialImage }]);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const [generatedVideo, setGeneratedVideo] = useState<{ videoUrl: string, downloadUrl: string } | null>(null);
    
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);


    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsKeySelected(hasKey);
            }
            setKeyCheckCompleted(true);
        };
        checkKey();
    }, []);
    
    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true);
        }
    };

    const addScene = () => {
        setScenes(prev => [...prev, { id: Date.now().toString(), prompt: '', duration: 5, image: null }]);
    };

    const removeScene = (id: string) => {
        setScenes(prev => prev.filter(scene => scene.id !== id));
    };

    const updateScene = (id: string, newValues: Partial<StoryboardScene>) => {
        setScenes(prev => prev.map(scene => scene.id === id ? { ...scene, ...newValues } : scene));
    };
    
    const handleImageUpload = (id: string, imageDataUrl: string) => {
        updateScene(id, { image: imageDataUrl });
    };

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newScenes = [...scenes];
        const draggedItemContent = newScenes.splice(dragItem.current, 1)[0];
        newScenes.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setScenes(newScenes);
    };

    const handleGenerate = async () => {
        if (scenes.every(s => !s.prompt && !s.image)) {
            setError('Please provide a text prompt or an image for at least one scene.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideo(null);
        
        try {
            const combinedPrompt = scenes.map((scene, index) => 
                `Scene ${index + 1} (${scene.duration} seconds): ${scene.prompt || 'Animate the provided image'}`
            ).join('. ');

            const firstImageScene = scenes.find(s => s.image);
            const base64Image = firstImageScene?.image?.split(',')[1];
            const mimeType = firstImageScene?.image?.match(/:(.*?);/)?.[1];

            const result = await generateVideo({
                prompt: combinedPrompt,
                aspectRatio,
                resolution,
                base64Image,
                mimeType,
                onProgress: (status) => setLoadingStatus(status)
            });
            setGeneratedVideo(result);
        } catch (err: any) {
            console.error("Video Generation Error:", err);
            let userFriendlyError = 'An unexpected error occurred. Please try again later.';
            if (err.message.includes('Requested entity was not found')) {
                userFriendlyError = 'API Key error. Please re-select your API key and try again.';
                setIsKeySelected(false);
            } else {
                 userFriendlyError = `An error occurred: ${err.message}. Please try again.`;
            }
            setError(userFriendlyError);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setScenes([{ id: Date.now().toString(), prompt: '', duration: 5, image: initialImage }]);
        setGeneratedVideo(null);
        setError(null);
        setIsLoading(false);
    };

    const handleDownload = () => {
        if (generatedVideo) {
            const a = document.createElement('a');
            a.href = generatedVideo.videoUrl;
            a.download = `artjunky-storyboard-video.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    if (keyCheckCompleted && !isKeySelected) {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <ScreenHeader title="AI Video Storyboard" onBack={() => navigate('home')} />
                <div className="card-effect p-8 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-4">API Key Required</h2>
                    <p className="text-gray-600 mb-6">
                        Video generation with Veo requires a project-linked API key. Please select your API key to continue.
                        This feature may incur costs.
                    </p>
                    <button
                        onClick={handleSelectKey}
                        className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 transition-colors mb-4"
                    >
                        Select API Key
                    </button>
                    <p className="text-sm text-gray-500">
                        For more information on pricing, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">billing documentation</a>.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <ScreenHeader title="AI Video Storyboard" onBack={() => navigate('home')} />

            {isLoading ? (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
                        Crafting your video...
                    </h2>
                     <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 my-8"></div>
                    <p className="text-gray-500">{loadingStatus || 'Please wait, this may take several minutes.'}</p>
                </div>
            ) : generatedVideo ? (
                <div className="text-center space-y-6">
                    <h2 className="text-3xl font-bold">Your Video is Ready!</h2>
                    <video
                        src={generatedVideo.videoUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full rounded-2xl shadow-lg"
                    />
                    <div className="flex justify-center gap-4">
                         <button
                            onClick={handleDownload}
                            className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                           <DownloadIcon className="w-5 h-5"/> Download
                        </button>
                        <button
                            onClick={handleReset}
                            className="bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2"
                        >
                            <RedoIcon className="w-5 h-5"/> Create Another
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="space-y-4">
                        {scenes.map((scene, index) => (
                             <div 
                                key={scene.id} 
                                className="card-effect p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start relative animate-fade-in"
                                draggable
                                onDragStart={() => dragItem.current = index}
                                onDragEnter={() => dragOverItem.current = index}
                                onDragEnd={handleDragSort}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <div className="flex md:flex-col items-center gap-2">
                                     <button className="cursor-grab text-gray-400 hover:text-gray-600" title="Drag to reorder">
                                        <DragHandleIcon className="w-6 h-6"/>
                                    </button>
                                    <span className="font-bold text-gray-500 text-lg">{index + 1}</span>
                                </div>
                               <div className="flex-grow w-full space-y-3">
                                    <textarea
                                        value={scene.prompt}
                                        onChange={(e) => updateScene(scene.id, { prompt: e.target.value })}
                                        placeholder={`Describe scene ${index + 1}...`}
                                        className="w-full h-20 bg-gray-100 rounded-md p-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    />
                                    <div className="flex items-center gap-2">
                                        <label htmlFor={`duration-${scene.id}`} className="text-sm font-semibold text-gray-600">Duration:</label>
                                        <input 
                                            type="number" 
                                            id={`duration-${scene.id}`} 
                                            value={scene.duration}
                                            onChange={(e) => updateScene(scene.id, { duration: parseInt(e.target.value, 10) || 0 })}
                                            className="w-20 bg-gray-100 rounded-md p-1 text-sm text-center"
                                            min="1"
                                            max="30"
                                        />
                                        <span className="text-sm text-gray-500">seconds</span>
                                    </div>
                               </div>
                                <div className="w-full md:w-32 h-32 flex-shrink-0">
                                    {scene.image ? (
                                        <div className="relative group w-full h-full">
                                            <img src={scene.image} alt={`Scene ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                                            <button onClick={() => updateScene(scene.id, { image: null })} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-gray-400 text-center p-2 hover:border-purple-400 bg-white/50">
                                            <UploadZone onImageUpload={(img) => handleImageUpload(scene.id, img)} />
                                        </div>
                                    )}
                                </div>
                                {scenes.length > 1 && (
                                    <button onClick={() => removeScene(scene.id)} className="absolute top-2 right-2 md:relative md:top-auto md:right-auto p-2 text-gray-400 hover:text-red-500">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addScene}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 hover:border-purple-400 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5"/> Add Scene
                    </button>
                    
                    <div className="card-effect p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-3 text-gray-700">Aspect Ratio</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {(['16:9', '9:16'] as const).map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors duration-300 ${aspectRatio === ratio ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        {ratio === '16:9' ? <LandscapeIcon className="w-8 h-8 mb-2" /> : <PortraitIcon className="w-8 h-8 mb-2" />}
                                        <span className="font-semibold text-sm">{ratio}</span>
                                        <span className="text-xs opacity-80">{ratio === '16:9' ? 'Landscape' : 'Portrait'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3 text-gray-700">Resolution</h3>
                            <div className="flex space-x-2">
                                {(['720p', '1080p'] as const).map(res => (
                                    <button
                                        key={res}
                                        onClick={() => setResolution(res)}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-300 capitalize ${resolution === res ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        {res}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                     <section className="text-center sticky bottom-4 z-10 py-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xl py-4 px-16 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            Generate Video
                        </button>
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                    </section>
                </div>
            )}
        </div>
    );
};

export default AiVideoScreen;
