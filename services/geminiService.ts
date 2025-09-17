import { GoogleGenAI, Modality, Chat } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const createChatSession = (): Chat => {
    return ai.chats.create({
        // FIX: The model 'gemini-2.5-flash-image-preview' is specifically for image editing. For a chat that can handle both text and images, 'gemini-2.5-flash' is more appropriate and versatile. The responseModalities config is not needed for this model.
        model: 'gemini-2.5-flash',
    });
};