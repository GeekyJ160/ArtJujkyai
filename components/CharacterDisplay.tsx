import React, { useState, useEffect } from 'react';
import { Character } from '../types';

interface CharacterDisplayProps {
    character: Character;
    isTalking: boolean;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ character, isTalking }) => {
    const [mouthIndex, setMouthIndex] = useState(0);

    useEffect(() => {
        let intervalId: number | undefined;
        if (isTalking) {
            intervalId = window.setInterval(() => {
                setMouthIndex(prev => (prev + 1) % character.mouths.length);
            }, 120); // Change mouth shape every 120ms for a natural feel
        } else {
            setMouthIndex(0); // Reset to closed mouth when not talking
        }
        return () => clearInterval(intervalId);
    }, [isTalking, character.mouths.length]);

    const mouthPath = character.mouths[mouthIndex] || character.mouths[0];
    const finalSvg = character.svgTemplate.replace('{{MOUTH_PATH}}', mouthPath);

    return (
        <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: finalSvg }}
        />
    );
};

export default CharacterDisplay;
