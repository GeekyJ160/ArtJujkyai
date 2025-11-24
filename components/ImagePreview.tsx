import React from 'react';
import { ClearIcon, EditIcon } from './icons';

interface ImagePreviewProps {
    src: string;
    onClear: () => void;
    onEdit?: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, onClear, onEdit }) => {
    return (
        <div className="relative group card-effect rounded-2xl p-4">
            <img id="previewImg" src={src} alt="Image preview" className="rounded-lg w-full h-auto max-h-96 object-contain" />
            <div className="absolute top-3 right-3 flex gap-2">
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80"
                        aria-label="Edit image"
                    >
                        <EditIcon className="w-6 h-6" />
                    </button>
                )}
                 <button
                    onClick={onClear}
                    className="bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80"
                    aria-label="Clear image"
                >
                    <ClearIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};