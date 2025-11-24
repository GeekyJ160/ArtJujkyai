import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface UploadZoneProps {
    onImageUpload: (imageDataUrl: string) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onImageUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = useCallback((file: File) => {
        setError(null);
        if (file && file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    onImageUpload(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please select a valid image (JPG, PNG, WebP) under 10MB.');
        }
    }, [onImageUpload]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [handleFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };
    
    return (
        <div className="flex flex-col">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 bg-white/50'}`}
            >
                <input
                    type="file"
                    id="fileInput"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-4 text-gray-500">
                    <UploadIcon className="w-12 h-12 text-gray-400" />
                    <p className="font-semibold text-lg">
                        <span className="text-purple-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm">PNG, JPG, or WEBP (max 10MB)</p>
                </div>
            </div>
            {error && <p className="text-red-500 mt-2 text-sm text-center">{error}</p>}
        </div>
    );
};

export default UploadZone;