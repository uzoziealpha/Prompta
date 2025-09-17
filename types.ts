export interface CameraPreset {
  name: string;
  prompt: string;
}

export interface IdeaHook {
  id: number;
  prompt: string;
  imageUrl: string;
}

export interface GenerationSettings {
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    camera: CameraPreset | null;
    seed: string;
}

export type FileType = 'jpeg' | 'png' | 'webp' | 'tiff';
export type ColorProfile = 'sRGB' | 'Adobe RGB' | 'ProPhoto RGB';
export type AspectRatio = 'Square' | 'Portrait' | 'Landscape';

export interface ExportSettings {
    fileType: FileType;
    quality: number; // 0-1 for jpeg/webp
    colorProfile: ColorProfile;
}

// Represents an image file attached by the user.
export interface UserImage {
    data: string; // base64 encoded
    file: File;
}

// Represents a message sent by the user.
export interface UserHistoryItem {
    type: 'user';
    id: number;
    text: string;
    images: UserImage[];
}

// Represents a response from the AI.
export interface BotHistoryItem {
    type: 'bot';
    id: number;
    prompt?: string;
    imageUrl?: string;
    text?: string; // For errors or text responses
    isLoading?: boolean;
}

export type HistoryItem = UserHistoryItem | BotHistoryItem;

export type Page = 'create' | 'explore' | 'settings';

export interface Session {
    id: number;
    title: string;
    date: string; // ISO String for consistent date handling
    history: HistoryItem[];
}

export interface Theme {
    id: string;
    name: string;
    className: string;
    styles: React.CSSProperties;
}

export interface User {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null; // base64 string
    mfaEnabled: boolean;
    linkedProviders: ('google' | 'apple')[];
}

export interface SessionDevice {
    id: string;
    isCurrent: boolean;
    browser: string;
    os: string;
    ip: string;
    lastActive: string; // ISO String
}
