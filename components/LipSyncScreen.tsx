import React, { useState, useEffect, useRef } from 'react';
import ScreenHeader from './ScreenHeader';
import { Character } from '../types';
import { characterOptions } from '../utils/constants';
import { generateSpeech } from '../services/geminiService';
import { decode, decodePcmData } from '../utils/audioUtils';
import CharacterDisplay from './CharacterDisplay';
import { MagicWandIcon, MicrophoneIcon, StopIcon } from './icons';

interface LipSyncScreenProps {
    navigate: (screen: string) => void;
}

const LipSyncScreen: React.FC<LipSyncScreenProps> = ({ navigate }) => {
    const [selectedCharacter, setSelectedCharacter] = useState<Character>(characterOptions[0]);
    const [inputText, setInputText] = useState('');
    const [mode, setMode] = useState<'tts' | 'record'>('tts');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        // Initialize AudioContext
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
             audioContextRef.current?.close();
        }
    }, []);

    const playAudioBuffer = (buffer: AudioBuffer) => {
        const source = audioContextRef.current?.createBufferSource();
        if (!source || !audioContextRef.current) return;

        // Stop any existing audio
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }
        audioSourceRef.current = source;
        
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
        setIsPlaying(true);
    };

    const handleGenerateSpeech = async () => {
        if (!inputText.trim()) {
            setError('Please enter some text to generate speech.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const base64Audio = await generateSpeech(inputText);
            const audioBytes = decode(base64Audio);
            const audioBuffer = await decodePcmData(audioBytes, audioContextRef.current!);
            playAudioBuffer(audioBuffer);
        } catch (err) {
            console.error('TTS Error:', err);
            setError('Failed to generate speech. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const startRecording = async () => {
        if (isRecording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioBuffer = await audioContextRef.current?.decodeAudioData(arrayBuffer);
                if (audioBuffer) {
                    playAudioBuffer(audioBuffer);
                }
                stream.getTracks().forEach(track => track.stop()); // Release microphone
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Recording Error:', err);
            setError('Could not access microphone. Please grant permission and try again.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const renderControls = () => {
        if (mode === 'tts') {
            return (
                <div className="w-full space-y-4">
                     <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type what you want the character to say..."
                        className="w-full h-28 bg-gray-100 rounded-md p-3 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                        disabled={isLoading || isPlaying}
                    />
                    <button
                        onClick={handleGenerateSpeech}
                        disabled={isLoading || isPlaying}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <MagicWandIcon className="w-6 h-6"/>
                        {isLoading ? 'Generating...' : isPlaying ? 'Playing...' : 'Generate & Play'}
                    </button>
                </div>
            );
        }

        if (mode === 'record') {
            return (
                <div className="text-center w-full flex flex-col items-center space-y-4">
                    <p className="text-gray-600">
                        {isRecording ? "Recording in progress..." : "Click the button to record your voice."}
                    </p>
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isPlaying}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 text-white ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-50`}
                    >
                        {isRecording ? <StopIcon className="w-10 h-10" /> : <MicrophoneIcon className="w-10 h-10" />}
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <ScreenHeader title="Lip Sync Studio" onBack={() => navigate('home')} />
            
            <section className="card-effect rounded-2xl p-4 md:p-6 mb-8">
                <div className="w-full aspect-square max-w-sm mx-auto bg-gray-100 rounded-lg overflow-hidden">
                    <CharacterDisplay character={selectedCharacter} isTalking={isPlaying} />
                </div>
            </section>

            <section className="card-effect rounded-2xl p-4 md:p-6 mb-8">
                 <h3 className="font-semibold text-gray-700 mb-4 text-center">Choose a Character</h3>
                 <div className="flex justify-center gap-4">
                    {characterOptions.map(char => (
                        <div key={char.id} onClick={() => setSelectedCharacter(char)} className={`cursor-pointer rounded-lg p-2 text-center transition-all duration-300 ease-in-out w-24 h-24 ${selectedCharacter.id === char.id ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                           <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: char.svgTemplate.replace('{{MOUTH_PATH}}', char.mouths[0])}} />
                        </div>
                    ))}
                 </div>
            </section>

             <section className="card-effect rounded-2xl p-4 md:p-6">
                <div className="flex justify-center border-b border-gray-200 mb-6">
                    <button onClick={() => setMode('tts')} className={`px-6 py-3 font-semibold ${mode === 'tts' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
                        Text-to-Speech
                    </button>
                    <button onClick={() => setMode('record')} className={`px-6 py-3 font-semibold ${mode === 'record' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>
                        Record Audio
                    </button>
                </div>
                <div className="flex items-center justify-center">
                    {renderControls()}
                </div>
                 {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </section>
        </div>
    );
};

export default LipSyncScreen;
