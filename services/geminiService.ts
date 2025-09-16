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
        model: 'gemini-2.5-flash-image-preview',
        // The config is the same as the models.generateContent config.
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
};
