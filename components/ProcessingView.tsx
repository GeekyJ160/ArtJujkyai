import React from 'react';

interface ProcessingViewProps {
    progress: number;
    statusText: string;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ progress, statusText }) => {
    return (
        <div id="processing" className="text-center py-16 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
                Creating your art...
            </h2>
            <p className="text-gray-500 mb-8">{statusText}</p>
            <div className="w-full max-w-lg bg-gray-200 rounded-full h-2.5">
                <div
                    id="progressBar"
                    className="bg-gradient-to-r from-purple-600 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ProcessingView;