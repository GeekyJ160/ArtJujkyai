import React, { useState } from 'react';
import { ArtStyle } from '../types';
import { styleOptions } from '../utils/constants';
import { SearchIcon } from './icons';

interface StyleSelectorProps {
    selectedStyle: ArtStyle;
    onStyleChange: (style: ArtStyle) => void;
}

const categories: Array<ArtStyle['category'] | 'All'> = ['All', 'Digital', 'Painting', 'Photography'];

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<typeof categories[number]>('All');

    const filteredStyles = styleOptions.filter(style => {
        const matchesCategory = selectedCategory === 'All' || style.category === selectedCategory;
        const matchesSearch = style.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Art Styles</h3>
            
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search styles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 rounded-md py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 flex-shrink-0 ${selectedCategory === category ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                        {category}
                    </button>
                ))}
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredStyles.length > 0 ? (
                    filteredStyles.map((style) => (
                        <div
                            key={style.id}
                            onClick={() => onStyleChange(style)}
                            className={`cursor-pointer rounded-lg p-2 text-center transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${selectedStyle.id === style.id ? 'bg-purple-100 ring-2 ring-purple-500 shadow-lg' : 'bg-gray-100 hover:bg-white hover:shadow-lg'}`}
                        >
                            <img src={style.image} alt={style.name} className="w-full h-16 object-cover rounded-md mx-auto" />
                            <p className="text-xs mt-2 truncate font-medium text-gray-700">{style.name}</p>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 py-4">No styles found.</p>
                )}
            </div>
        </div>
    );
};

export default StyleSelector;