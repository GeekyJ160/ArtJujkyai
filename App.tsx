import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import AiGenerateScreen from './components/AiGenerateScreen';
import RemoveObjectsScreen from './components/RemoveObjectsScreen';
import EnhanceQualityScreen from './components/EnhanceQualityScreen';
import RemoveBackgroundScreen from './components/RemoveBackgroundScreen';
import AiVideoScreen from './components/AiVideoScreen';
import AiEditScreen from './components/AiEditScreen';
import ExpandImageScreen from './components/ExpandImageScreen';
import LipSyncScreen from './components/LipSyncScreen';
import AiInpaintScreen from './components/AiInpaintScreen';

const App: React.FC = () => {
    const [activeScreen, setActiveScreen] = useState('home');
    const [initialImage, setInitialImage] = useState<string | null>(null);

    const navigate = (screen: string, image?: string) => {
        if (image) {
            setInitialImage(image);
        } else {
            setInitialImage(null);
        }
        setActiveScreen(screen);
    };

    const renderScreen = () => {
        switch (activeScreen) {
            case 'ai-generate':
            case 'ai-filters':
                return <AiGenerateScreen navigate={navigate} initialImage={initialImage} />;
            case 'remove-objects':
            case 'ai-fill':
                return <RemoveObjectsScreen mode={activeScreen as 'remove-objects' | 'ai-fill'} navigate={navigate} initialImage={initialImage} />;
            case 'enhance-quality':
                return <EnhanceQualityScreen navigate={navigate} initialImage={initialImage} />;
            case 'remove-background':
                return <RemoveBackgroundScreen navigate={navigate} initialImage={initialImage} />;
            case 'ai-video':
                return <AiVideoScreen navigate={navigate} initialImage={initialImage} />;
            case 'ai-edit':
                return <AiEditScreen navigate={navigate} initialImage={initialImage} />;
            case 'expand-image':
                return <ExpandImageScreen navigate={navigate} initialImage={initialImage} />;
            case 'lip-sync':
                return <LipSyncScreen navigate={navigate} />;
            case 'ai-inpaint':
                return <AiInpaintScreen navigate={navigate} initialImage={initialImage} />;
            case 'home':
            default:
                return <HomeScreen navigate={navigate} />;
        }
    };

    return (
        <div className="text-gray-800 min-h-screen">
            <main className="mx-auto px-4 py-8 md:py-12">
                {renderScreen()}
            </main>
        </div>
    );
};

export default App;
