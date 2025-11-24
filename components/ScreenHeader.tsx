import React from 'react';
import { BackIcon } from './icons';

interface ScreenHeaderProps {
    title: string;
    onBack: () => void;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack }) => (
    <header className="flex items-center mb-8 relative justify-center">
        <button onClick={onBack} className="absolute left-0 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <BackIcon className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    </header>
);

export default ScreenHeader;
