
import { GoogleGenAI, Modality, GenerateVideosOperation } from "@google/genai";
import { ArtStyle, UpscaleType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
const model = 'gemini-2.5-flash-image';

// Safety settings to prevent over-blocking which leads to empty responses
const safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

interface GenerationParams {
    style: ArtStyle;
    intensity: number;
    styleIntensity: number;
    variants: number;
    customPrompt: string;
    negativePrompt: string;
    aspectRatio: 'portrait' | 'square' | 'landscape';
    onProgress: (progress: number) => void;
    base64Image?: string;
    mimeType?: string;
}

function constructPrompt(
    style: ArtStyle,
    intensity: number,
    styleIntensity: number,
    customPrompt: string,
    negativePromptInput: string,
    aspectRatio: string,
    isTextToImage: boolean
): string {
  let intensityPrompt = '';
  if (intensity > 85) {
    intensityPrompt = 'a masterpiece, best quality, extremely detailed, 8k, sharp focus';
  } else if (intensity > 60) {
    intensityPrompt = 'high quality, very detailed, 4k, good focus';
  } else {
    intensityPrompt = 'good quality, detailed';
  }

  let aspectRatioPrompt = '';
  if (aspectRatio === 'portrait') aspectRatioPrompt = 'portrait orientation, 9:16 aspect ratio';
  if (aspectRatio === 'landscape') aspectRatioPrompt = 'landscape orientation, 16:9 aspect ratio';
  if (aspectRatio === 'square') aspectRatioPrompt = 'square image, 1:1 aspect ratio';

  const defaultNegativePrompt = 'blurry, low quality, deformed, ugly, extra limbs, disfigured, text, watermarks, signatures';
  const combinedNegative = [defaultNegativePrompt, negativePromptInput].filter(Boolean).join(', ');
  const finalNegativePrompt = `Negative prompt: ${combinedNegative}`;
  
  const mainPrompt = customPrompt ? `${style.prompt}, ${customPrompt}` : style.prompt;

  if (isTextToImage) {
      let stylePrefix = '';
      if (styleIntensity > 85) {
        stylePrefix = 'a strong, prominent example of';
      } else if (styleIntensity < 40) {
          stylePrefix = 'with subtle hints of';
      }
      const finalStylePrompt = stylePrefix ? `${stylePrefix} ${mainPrompt}` : mainPrompt;
      const textToImageCorePrompt = customPrompt || `A beautiful image in the style of ${style.name}`;
      return `A masterpiece image of ${textToImageCorePrompt}, ${finalStylePrompt}. ${intensityPrompt}. ${aspectRatioPrompt}. ${finalNegativePrompt}`;
  }

  let transformationInstruction = "Transform the provided image. Recreate it";
   if (styleIntensity > 85) {
    transformationInstruction = `Completely transform the provided image, ignoring its original style and composition. Recreate it with a heavy emphasis on`;
  } else if (styleIntensity > 60) {
      transformationInstruction = `Transform the provided image. Recreate it in a strong style of`;
  } else if (styleIntensity < 40) {
    transformationInstruction = `Gently adapt the provided image, keeping the original composition. Apply subtle hints of`;
  }
  return `${transformationInstruction} ${mainPrompt}. The new image should be ${intensityPrompt}. ${aspectRatioPrompt}. ${finalNegativePrompt}`;
}

async function generateSingleImage(prompt: string, base64Image?: string, mimeType?: string): Promise<string> {
    const parts: any[] = [];
    
    if (base64Image && mimeType) {
        parts.push({
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: { safetySettings },
    });

    let textResponse = '';
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      if (part.text) {
          textResponse += part.text;
      }
    }

    if (textResponse) {
        throw new Error(`Generation failed: ${textResponse}`);
    }

    throw new Error('Image generation failed or returned an unexpected format.');
}

export async function generateImageVariants({
    style,
    intensity,
    styleIntensity,
    variants,
    customPrompt,
    negativePrompt,
    aspectRatio,
    onProgress,
    base64Image,
    mimeType,
}: GenerationParams): Promise<string[]> {
    const isTextToImage = !base64Image;
    const prompt = constructPrompt(style, intensity, styleIntensity, customPrompt, negativePrompt, aspectRatio, isTextToImage);
    const results: string[] = [];

    for (let i = 0; i < variants; i++) {
        const result = await generateSingleImage(prompt, base64Image, mimeType);
        results.push(result);
        const progress = ((i + 1) / variants) * 100;
        onProgress(progress);
    }

    return results;
}

export async function removeImageBackground(base64ImageWithHeader: string): Promise<string> {
    const [header, base64Image] = base64ImageWithHeader.split(',');
    if (!base64Image) {
        throw new Error("Invalid image data URL format");
    }
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    const prompt = "Identify the main subject in the image and remove the background. Return the image with a transparent background.";
    
    const parts: any[] = [{
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    }, { text: prompt }];

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: { safetySettings },
    });

    let textResponse = '';
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      if (part.text) {
          textResponse += part.text;
      }
    }
    
    if (textResponse) {
        throw new Error(`Background removal failed: ${textResponse}`);
    }
    
    throw new Error('Background removal failed or returned an unexpected format.');
}

export async function removeObjectsFromImage(base64ImageWithHeader: string, customPrompt: string): Promise<string> {
    const [header, base64Image] = base64ImageWithHeader.split(',');
    if (!base64Image) {
        throw new Error("Invalid image data URL format");
    }
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    const prompt = customPrompt || "This image contains a transparent area. Fill in the transparent area realistically and seamlessly based on the surrounding pixels. Only fill the transparent area, do not change anything else.";
    
    const parts: any[] = [{
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    }, { text: prompt }];

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: { safetySettings },
    });

    let textResponse = '';
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      if (part.text) {
          textResponse += part.text;
      }
    }
    
    if (textResponse) {
        throw new Error(`Object removal failed: ${textResponse}`);
    }
    
    throw new Error('Object removal failed or returned an unexpected format.');
}

export async function generateInpaintVariants({
    maskedImage,
    prompt,
    variants,
    onProgress
}: {
    maskedImage: string;
    prompt: string;
    variants: number;
    onProgress: (progress: number) => void;
}): Promise<string[]> {
    const results: string[] = [];
    const fullPrompt = `This image contains a transparent area. Inpaint this area based on the following instruction: "${prompt}". The result should be realistic and seamlessly blended with the original image.`;

    for (let i = 0; i < variants; i++) {
        // Using removeObjectsFromImage as it's designed to fill transparent areas based on a prompt
        const result = await removeObjectsFromImage(maskedImage, fullPrompt);
        results.push(result);
        const progress = ((i + 1) / variants) * 100;
        onProgress(progress);
    }

    return results;
}

export async function editImage(base64ImageWithHeader: string, prompt: string): Promise<string> {
    const [header, base64Image] = base64ImageWithHeader.split(',');
    if (!base64Image) {
        throw new Error("Invalid image data URL format");
    }
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    const parts: any[] = [{
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    }, { text: prompt }];

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: { safetySettings },
    });

    let textResponse = '';
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      if (part.text) {
          textResponse += part.text;
      }
    }
    
    if (textResponse) {
        throw new Error(`Image editing failed: ${textResponse}`);
    }
    
    throw new Error('Image editing failed or returned an unexpected format.');
}

export async function enhanceImageQuality(
    base64ImageWithHeader: string,
    enhancementType: 'upscale' | 'denoise' | 'flash' | 'enhance_face',
    options: {
        flashIntensity?: 'subtle' | 'standard' | 'strong';
        upscaleType?: UpscaleType;
    } = {}
): Promise<string> {
    const [header, base64Image] = base64ImageWithHeader.split(',');
    if (!base64Image) {
        throw new Error("Invalid image data URL format");
    }
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

    let prompt = '';
    if (enhancementType === 'upscale') {
        const upscaleType = options.upscaleType || 'standard';
        switch(upscaleType) {
            case 'creative':
                prompt = "Artistically upscale this image to 4k resolution. Creatively add fine details, enhance textures, and enrich colors to make it a masterpiece. The result should be an ultra-detailed, high-fidelity image with an artistic touch. Output a PNG file.";
                break;
            case 'face_retouch':
                prompt = "Upscale this image, paying special attention to facial features. Enhance skin texture naturally, sharpen eyes and hair, and improve overall portrait quality while increasing resolution to 4k. Output a PNG file.";
                break;
            case 'standard':
            default:
                prompt = "Upscale this image to a higher resolution (e.g., 2x). Enhance details, increase sharpness, and improve clarity without adding artifacts. The result should be a crisp, high-quality image. Output a PNG file.";
        }
    } else if (enhancementType === 'denoise') {
        prompt = "Denoise this image. Remove digital noise, grain, and compression artifacts while carefully preserving important details and textures. The result should be a clean, smooth, and natural-looking image. Output a PNG file.";
    } else if (enhancementType === 'enhance_face') {
        prompt = "Enhance the face in this portrait. Smooth the skin naturally, brighten the eyes and make them sparkle, subtly whiten the teeth, and enhance the definition of the lips and eyebrows. The result should be a beautified but realistic portrait. Output a PNG file.";
    } else if (enhancementType === 'flash') {
        const flashIntensity = options.flashIntensity || 'standard';
        switch(flashIntensity) {
            case 'subtle':
                prompt = "Subtly enhance the lighting on the person in this photo as if using a soft fill flash. Slightly brighten the face, reduce harsh shadows, and add a gentle catchlight to the eyes. Keep the effect very natural and understated. Output a PNG file.";
                break;
            case 'strong':
                prompt = "Apply a powerful and dramatic 'on-camera flash' effect to this photo. Significantly brighten the subject, creating a high-fashion, high-contrast look with deep shadows and bright highlights. Enhance skin to look flawless and radiant. The background may become darker in contrast. Output a PNG file.";
                break;
            case 'standard':
            default:
                prompt = "Apply a professional 'flash' effect to brighten the person in this photo. Even out the lighting on the face, making it clear and vibrant. Enhance skin tone for a healthy glow and sharpen key facial features like eyes and lips. The result should look like a well-lit, high-quality portrait. Output a PNG file.";
        }
    }
    
    const parts: any[] = [{
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    }, { text: prompt }];

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: { safetySettings },
    });

    let textResponse = '';
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      if (part.text) {
          textResponse += part.text;
      }
    }
    
    if (textResponse) {
         throw new Error(`Image enhancement failed: ${textResponse}`);
    }
    
    throw new Error('Image enhancement failed or returned an unexpected format.');
}

interface VideoGenerationParams {
    prompt: string;
    onProgress: (status: string) => void;
    aspectRatio: '16:9' | '9:16';
    resolution: '720p' | '1080p';
    base64Image?: string;
    mimeType?: string;
}

export async function generateVideo({
    prompt,
    onProgress,
    aspectRatio,
    resolution,
    base64Image,
    mimeType
}: VideoGenerationParams): Promise<{ videoUrl: string, downloadUrl: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution,
            aspectRatio,
        }
    };
    
    if (base64Image && mimeType) {
        payload.image = {
            imageBytes: base64Image,
            mimeType,
        };
    }

    onProgress("Initiating video generation...");
    let operation: GenerateVideosOperation = await ai.models.generateVideos(payload);
    
    const pollingInterval = 10000; // 10 seconds
    const statusMessages = [
        "Warming up the virtual director...",
        "Storyboarding your prompt...",
        "Rendering the first frames...",
        "Adding special effects...",
        "This can take a few minutes...",
        "Polishing the final cut...",
    ];
    let messageIndex = 0;

    while (!operation.done) {
        onProgress(statusMessages[messageIndex % statusMessages.length]);
        messageIndex++;
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        onProgress("Checking generation status...");
        operation = await ai.operations.getVideosOperation({ operation });
    }

    if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
        const errorDetails = (operation as any).error?.message || 'No video URI found in response.';
        throw new Error(`Video generation failed: ${errorDetails}`);
    }

    onProgress("Video generated! Preparing for playback...");
    const downloadLink = operation.response.generatedVideos[0].video.uri;

    const apiKey = process.env.API_KEY as string;
    const fetchUrl = `${downloadLink}&key=${apiKey}`;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch video file: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    return { videoUrl, downloadUrl: fetchUrl };
}

export async function generateSpeech(text: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a friendly tone: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Audio generation failed or returned no data.");
    }
    return base64Audio;
}
