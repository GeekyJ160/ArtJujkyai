import React, { useState } from 'react';
import { MoreIcon } from './icons';

type AspectRatio = 'portrait' | 'square' | 'landscape' | 'auto';

interface OptionsPanelProps {
    selectedVariants: number;
    onVariantsChange: (variants: number) => void;
    intensity: number;
    onIntensityChange: (intensity: number) => void;
    styleIntensity: number;
    onStyleIntensityChange: (intensity: number) => void;
    customPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
    negativePrompt: string;
    onNegativePromptChange: (prompt: string) => void;
    aspectRatio: AspectRatio;
    onAspectRatioChange: (ratio: AspectRatio) => void;
    title: string;
    placeholder: string;
    keywordSuggestions?: string[];
    onKeywordClick: (keyword: string) => void;
}

const aspectRatioOptions: { value: AspectRatio; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'portrait', label: '9:16' },
    { value: 'square', label: '1:1' },
    { value: 'landscape', label: '16:9' },
];

const OptionsPanel: React.FC<OptionsPanelProps> = ({
    selectedVariants,
    onVariantsChange,
    intensity,
    onIntensityChange,
    styleIntensity,
    onStyleIntensityChange,
    customPrompt,
    onCustomPromptChange,
    negativePrompt,
    onNegativePromptChange,
    aspectRatio,
    onAspectRatioChange,
    title,
    placeholder,
    keywordSuggestions,
    onKeywordClick
}) => {
    const [advancedOpen, setAdvancedOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
                <textarea
                    value={customPrompt}
                    onChange={(e) => onCustomPromptChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-20 bg-gray-100 rounded-md p-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                    aria-label="Custom art style prompt"
                />
            </div>
            {keywordSuggestions && keywordSuggestions.length > 0 && (
                <div className="animate-fade-in">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        Inspiration ✨
                        <span className="text-xs font-normal text-gray-500">(click to add)</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {keywordSuggestions.map(keyword => (
                            <button
                                key={keyword}
                                onClick={() => onKeywordClick(keyword)}
                                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold hover:bg-purple-200 transition-colors"
                                title={`Add "${keyword}" to your prompt`}
                            >
                                + {keyword}
                            </button>
                        ))}
                    </div>
                </div>
            )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <h3 className="font-semibold mb-3 text-gray-700">Variants</h3>
                    <div className="flex space-x-2">
                        {[1, 2, 4].map(v => (
                            <button
                                key={v}
                                onClick={() => onVariantsChange(v)}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-300 ${selectedVariants === v ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-3 text-gray-700">Image Aspect Ratio</h3>
                    <div className="flex space-x-2">
                        {aspectRatioOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => onAspectRatioChange(option.value)}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-300 ${aspectRatio === option.value ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-700">Image Quality</h3>
                        <span className="text-sm font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{intensity}</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={intensity}
                        onChange={(e) => onIntensityChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-purple-600"
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-700">Style Strength</h3>
                        <span className="text-sm font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{styleIntensity}</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={styleIntensity}
                        onChange={(e) => onStyleIntensityChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-purple-600"
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
                <button 
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    className="w-full flex justify-between items-center text-left font-semibold text-gray-700 hover:text-purple-600"
                >
                    <span>Advanced Prompting</span>
                    <MoreIcon className={`w-5 h-5 transition-transform duration-300 ${advancedOpen ? 'rotate-180' : ''}`} />
                </button>
                {advancedOpen && (
                    <div className="mt-4 space-y-6 animate-fade-in">
                        <div>
                            <h4 className="font-semibold text-gray-600 mb-2 text-sm">Negative Prompt</h4>
                            <textarea
                                value={negativePrompt}
                                onChange={(e) => onNegativePromptChange(e.target.value)}
                                placeholder="e.g., 'no people', 'black and white', 'extra fingers'"
                                className="w-full h-20 bg-gray-100 rounded-md p-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                aria-label="Negative prompt"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OptionsPanel;