import React from 'react';
import { MagicWandIcon, RemoveObjectsIcon, RemoveBackgroundIcon, AiFillIcon, ExpandImageIcon, EnhanceQualityIcon, AiFiltersIcon, EditIcon, AiVideoIcon, LipSyncIcon, AiInpaintIcon } from './icons';

interface HomeScreenProps {
    navigate: (screen: string) => void;
}

// Fix: Changed component typing to React.FC<ToolButtonProps> to resolve an issue
// where the 'key' prop was not recognized on the component when used in a map function.
// This ensures the component type is compatible with React's list rendering requirements.
interface ToolButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex flex-col items-center justify-center space-y-2 p-3 bg-white/60 shadow-sm rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
    >
        <div className="w-12 h-12 bg-blue-100/50 rounded-xl flex items-center justify-center text-blue-600">
            {icon}
        </div>
        <span className="text-xs font-semibold text-gray-700 text-center">{label}</span>
    </button>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ navigate }) => {
    // Fix: Defined an interface for the tool objects to allow for an optional `disabled` property, resolving a TypeScript error.
    interface Tool {
        id: string;
        label: string;
        icon: React.ReactNode;
        action: () => void;
        disabled?: boolean;
    }

    const tools: Tool[] = [
        { id: 'ai-generate', label: 'AI Generate', icon: <MagicWandIcon className="w-6 h-6" />, action: () => navigate('ai-generate') },
        { id: 'ai-edit', label: 'AI Edit', icon: <EditIcon className="w-6 h-6" />, action: () => navigate('ai-edit') },
        { id: 'ai-inpaint', label: 'AI Inpaint', icon: <AiInpaintIcon className="w-6 h-6" />, action: () => navigate('ai-inpaint') },
        { id: 'lip-sync', label: 'Lip Sync', icon: <LipSyncIcon className="w-6 h-6" />, action: () => navigate('lip-sync') },
        { id: 'remove-objects', label: 'Remove Objects', icon: <RemoveObjectsIcon className="w-6 h-6" />, action: () => navigate('remove-objects') },
        { id: 'remove-background', label: 'Remove BG', icon: <RemoveBackgroundIcon className="w-6 h-6" />, action: () => navigate('remove-background') },
        { id: 'ai-fill', label: 'AI Fill', icon: <AiFillIcon className="w-6 h-6" />, action: () => navigate('ai-fill') },
        { id: 'expand-image', label: 'Expand Image', icon: <ExpandImageIcon className="w-6 h-6" />, action: () => navigate('expand-image') },
        { id: 'enhance-quality', label: 'Enhance Quality', icon: <EnhanceQualityIcon className="w-6 h-6" />, action: () => navigate('enhance-quality') },
        { id: 'ai-filters', label: 'AI Filters', icon: <AiFiltersIcon className="w-6 h-6" />, action: () => navigate('ai-filters') },
        { id: 'ai-video', label: 'AI Video', icon: <AiVideoIcon className="w-6 h-6" />, action: () => navigate('ai-video') },
    ];

    return (
        <div className="max-w-md mx-auto">
             <header className="mb-8 text-center">
                <div style={{ fontFamily: 'Bangers, cursive', letterSpacing: '0.05em' }}>
                    <h1 className="text-6xl bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 -mb-2">
                        Art
                    </h1>
                    <h2 className="text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        Junky
                    </h2>
                </div>
            </header>

            <section
                className="relative rounded-3xl overflow-hidden mb-8 p-6 flex flex-col justify-between h-56 bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=2574&auto=format&fit=crop')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="relative z-10 text-white">
                    <h2 className="text-3xl font-bold drop-shadow-md">Remove<br />Background</h2>
                </div>
                <button
                    onClick={() => navigate('remove-background')}
                    className="relative z-10 bg-white/90 backdrop-blur-sm text-gray-800 font-semibold py-2 px-5 rounded-full transition-transform hover:scale-105 self-start"
                >
                    Try now
                </button>
            </section>

            <section className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {tools.map(tool => (
                    <ToolButton key={tool.id} icon={tool.icon} label={tool.label} onClick={tool.action || (() => { })} disabled={!!tool.disabled} />
                ))}
            </section>
        </div>
    );
};

export default HomeScreen;
