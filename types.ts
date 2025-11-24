
export interface ArtStyle {
  id: string;
  name: string;
  prompt: string;
  image: string;
  category: 'Digital' | 'Painting' | 'Photography';
  keywords?: string[];
}

export interface Character {
  id: string;
  name: string;
  viewBox: string;
  svgTemplate: string;
  mouths: string[]; // array of <path> d="..." strings
}

export interface StoryboardScene {
  id: string;
  prompt: string;
  duration: number;
  image?: string | null;
}

export type UpscaleType = 'standard' | 'creative' | 'face_retouch';
