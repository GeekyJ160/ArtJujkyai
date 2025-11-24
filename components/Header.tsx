import React from 'react';

const Header: React.FC = () => (
    <header className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
            AI Image Suite
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Generate new images from text or transform your photos with a range of powerful AI tools.
        </p>
    </header>
);

export default Header;