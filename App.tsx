import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { HistoryItem, UserImage, Page, AspectRatio, BotHistoryItem, UserHistoryItem, Session, Theme, User } from './types';
import { fileToBase64, createChatSession } from './services/geminiService';

import { ICONS, THEMES } from './constants';
import { Icon } from './components/Icon';
import { DynamicBackground } from './components/DynamicBackground';
import { LoginModal } from './components/LoginModal';
import { CreatePage } from './pages/CreatePage';
import { ExplorePage } from './pages/ExplorePage';
import { Sidebar } from './components/Sidebar';

// Extend the Window interface to include JSZip
declare global {
    interface Window {
        JSZip: any;
    }
}

// -- MAIN APP COMPONENT --
const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => localStorage.getItem('prompta-sidebar-open') !== 'false');
  
  const [aiCommunication, setAiCommunication] = useState('');
  const [attachedImages, setAttachedImages] = useState<UserImage[]>([]);
  const [activePage, setActivePage] = useState<Page>('create');
  const [chat, setChat] = useState<Chat | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('Square');
  const [isAspectRatioMenuOpen, setAspectRatioMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem('prompta-theme-id');
    return THEMES.find(t => t.id === savedThemeId) || THEMES[0];
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
        const savedUserJSON = localStorage.getItem('prompta-user');
        if (savedUserJSON) {
            const loadedUser: User = JSON.parse(savedUserJSON);
            setUser(loadedUser);
        }
    } catch (e) {
        console.error("Failed to load user:", e);
        setUser(null);
    }
  }, []);

  useEffect(() => {
    if (user) {
        localStorage.setItem('prompta-user', JSON.stringify(user));
    } else {
        localStorage.removeItem('prompta-user');
    }
  }, [user]);

  const handleGoogleLogin = () => {
    setUser({
        isLoggedIn: true,
        name: 'Demo User',
        avatar: null,
    });
    setIsLoginModalOpen(false);
  };
  
  const handleEmailLogin = (email: string) => {
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    setUser({
        isLoggedIn: true,
        name: name || "User",
        avatar: null,
    });
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleAvatarChange = async (file: File) => {
    if (!user) return;
    try {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
        setUser({ ...user, avatar: base64 });
    } catch (error) {
        console.error("Error updating avatar:", error);
    }
  };


  const activeSession = sessions.find(s => s.id === activeSessionId);
  const history = activeSession?.history || [];

  const handleNewChat = useCallback(() => {
    const newSession: Session = {
        id: Date.now(),
        title: 'New Chat',
        date: new Date().toISOString(),
        history: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setAiCommunication('');
    setAttachedImages([]);
    setChat(null);
  }, []);

  useEffect(() => {
    try {
        const savedSessionsJSON = localStorage.getItem('prompta-sessions');
        const savedActiveId = localStorage.getItem('prompta-active-session-id');

        if (savedSessionsJSON) {
            const loadedSessions: Session[] = JSON.parse(savedSessionsJSON);
            if (loadedSessions.length > 0) {
                setSessions(loadedSessions);
                const activeId = savedActiveId ? parseInt(savedActiveId, 10) : loadedSessions[0].id;
                if (loadedSessions.some(s => s.id === activeId)) {
                    setActiveSessionId(activeId);
                } else {
                    setActiveSessionId(loadedSessions[0].id);
                }
                return;
            }
        }
    } catch (e) {
        console.error("Failed to load sessions:", e);
    }
    handleNewChat();
  }, [handleNewChat]);

  useEffect(() => {
    if (sessions.length > 0) {
        localStorage.setItem('prompta-sessions', JSON.stringify(sessions));
    }
    if (activeSessionId !== null) {
        localStorage.setItem('prompta-active-session-id', String(activeSessionId));
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    localStorage.setItem('prompta-sidebar-open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('prompta-theme-id', activeTheme.id);
    document.body.className = activeTheme.className;
    Object.entries(activeTheme.styles).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
  }, [activeTheme]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
            setIsThemeMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setHistory = (updater: React.SetStateAction<HistoryItem[]>) => {
    setSessions(prevSessions =>
        prevSessions.map(s => {
            if (s.id === activeSessionId) {
                const newHistory = typeof updater === 'function' ? updater(s.history) : updater;
                return { ...s, history: newHistory };
            }
            return s;
        })
    );
  };
  
  const handleSelectSession = (id: number) => {
    if (id === activeSessionId) return;
    setActiveSessionId(id);
    setAiCommunication('');
    setAttachedImages([]);
    setChat(null);
  };

  const handleDeleteSession = (idToDelete: number) => {
    const remainingSessions = sessions.filter(s => s.id !== idToDelete);
    setSessions(remainingSessions);
    if (activeSessionId === idToDelete) {
        if (remainingSessions.length > 0) {
            setActiveSessionId(remainingSessions[0].id);
        } else {
            handleNewChat();
        }
    }
  };


  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
        const newFiles = Array.from(files)
            .filter(file => file.type.startsWith('image/'))
            .slice(0, 4 - attachedImages.length);
      
        if (newFiles.length === 0) return;

        const newImagePromises = newFiles.map(file => 
            fileToBase64(file).then(base64 => ({ data: base64, file }))
        );

        const newImageData = await Promise.all(newImagePromises);
        setAttachedImages(prev => [...prev, ...newImageData]);

    } catch (error) {
        console.error("Error processing files:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      if (event.target) event.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFiles(e.clipboardData.files);
    }
  };

  const getSystemPreamble = (isImageTask: boolean, currentAspectRatio: AspectRatio) => {
    const currentDate = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let preamble = `You are Prompta, a multi-talented AI creative assistant. Your primary role is to help users generate and edit stunning visuals. You are also a helpful partner, capable of answering general questions, brainstorming ideas, writing captions for images, and refining user prompts to be more effective. Be friendly, creative, and always aim to be as helpful as possible. For your reference, the current date is ${currentDate}.`;
    
    if (isImageTask) {
        const aspectRatioData = {
            'Square': '1:1',
            'Portrait': '9:16',
            'Landscape': '16:9',
        }
        preamble += ` When generating or editing an image, you MUST strictly conform to the user's specified aspect ratio: **${currentAspectRatio} (${aspectRatioData[currentAspectRatio]})**.`;
    }
    return preamble;
  };

  const handleAiSubmit = async () => {
    const message = aiCommunication.trim();
    if ((!message && attachedImages.length === 0) || !activeSessionId) return;

    const currentChat = chat ?? createChatSession();
    if (!chat) setChat(currentChat);

    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;
    
    const isImageTask = attachedImages.length > 0 || /create|generate|make|draw|edit|change|render|imagine/i.test(message);
    
    let userInstruction = message || `Please perform the most logical edit based on the attached image(s). If an aspect ratio is selected (${aspectRatio}), prioritize resizing the image.`;
    const systemPreamble = getSystemPreamble(isImageTask, aspectRatio);
    const finalMessage = `${systemPreamble}\n\n--- USER REQUEST ---\n${userInstruction}`;
    
    const userMessage: UserHistoryItem = { type: 'user', id: userMessageId, text: message, images: attachedImages };
    const loadingMessage: BotHistoryItem = { type: 'bot', id: botMessageId, isLoading: true, prompt: message || `Processing image...` };

    setSessions(prevSessions => prevSessions.map(s => {
        if (s.id === activeSessionId) {
            const isFirstMessage = s.history.length === 0;
            return {
                ...s,
                title: isFirstMessage && message ? message.substring(0, 40) : s.title,
                history: [...s.history, userMessage, loadingMessage],
            };
        }
        return s;
    }));
    
    setAiCommunication('');
    setAttachedImages([]);
    setAspectRatioMenuOpen(false);

    try {
        const parts: ({ inlineData: { data: string; mimeType: string; } } | { text: string })[] = [];
        if (attachedImages.length > 0) parts.push(...attachedImages.map(img => ({ inlineData: { data: img.data, mimeType: img.file.type } })));
        if (finalMessage) parts.push({ text: finalMessage });
        
        const response = await currentChat.sendMessage({ message: parts });

        let resultImage: string | undefined;
        const resultText = response.text ? response.text : undefined;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        
        const botResponse: BotHistoryItem = (resultImage || resultText) ?
            { type: 'bot', id: botMessageId, isLoading: false, imageUrl: resultImage, text: resultText, prompt: message } :
            { type: 'bot', id: botMessageId, isLoading: false, text: isImageTask ? "The AI responded, but did not generate an image. Please try rephrasing your request." : "The AI did not return a valid response.", prompt: message };

        setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? { ...s, history: s.history.map(item => item.id === botMessageId ? botResponse : item) } : s));
    } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || "Sorry, I couldn't process that. Please try again.";
        const errorResponse: BotHistoryItem = { type: 'bot', id: botMessageId, isLoading: false, text: errorMessage };
        setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? { ...s, history: s.history.map(item => item.id === botMessageId ? errorResponse : item) } : s));
    }
  };
  
  const handleCreateVariations = async (originalPrompt: string, imageUrl: string) => {
    if (!activeSessionId) return;

    // 1. Convert data URL back into a UserImage object
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const fileName = originalPrompt?.substring(0, 20).replace(/[^a-z0-9]/gi, '_') || 'source';
    const file = new File([blob], `${fileName}.png`, { type: blob.type });
    const base64Data = imageUrl.substring(imageUrl.indexOf(',') + 1);
    const variationSourceImage: UserImage = { data: base64Data, file: file };

    // 2. Set up for API call
    const currentChat = chat ?? createChatSession();
    if (!chat) setChat(currentChat);

    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;
    
    const variationPromptText = `Generate a stylistic variation of the provided image. Use the original prompt for context and inspiration: "${originalPrompt}"`;
    const systemPreamble = getSystemPreamble(true, aspectRatio);
    const finalMessage = `${systemPreamble}\n\n--- USER REQUEST ---\n${variationPromptText}`;

    // 3. Update history with user action and loading state
    const userMessage: UserHistoryItem = { type: 'user', id: userMessageId, text: `Create a variation...`, images: [variationSourceImage] };
    const loadingMessage: BotHistoryItem = { type: 'bot', id: botMessageId, isLoading: true, prompt: "Generating variation..." };
    
    setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? { ...s, history: [...s.history, userMessage, loadingMessage] } : s));

    try {
        const parts = [
            { inlineData: { data: variationSourceImage.data, mimeType: variationSourceImage.file.type } },
            { text: finalMessage }
        ];
        
        const response = await currentChat.sendMessage({ message: parts });

        let resultImage: string | undefined;
        const resultText = response.text ? response.text : undefined;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        
        const botResponse: BotHistoryItem = (resultImage || resultText) ?
            { type: 'bot', id: botMessageId, isLoading: false, imageUrl: resultImage, text: resultText, prompt: originalPrompt } :
            { type: 'bot', id: botMessageId, isLoading: false, text: "The AI responded, but did not generate a variation. Please try again.", prompt: originalPrompt };

        setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? { ...s, history: s.history.map(item => item.id === botMessageId ? botResponse : item) } : s));
    } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || "Sorry, I couldn't create a variation. Please try again.";
        const errorResponse: BotHistoryItem = { type: 'bot', id: botMessageId, isLoading: false, text: errorMessage };
        setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? { ...s, history: s.history.map(item => item.id === botMessageId ? errorResponse : item) } : s));
    }
  };
  
    const handleExportProject = async () => {
        if (!window.JSZip) {
            alert("Could not find the JSZip library. Please try again.");
            return;
        }
        const zip = new window.JSZip();
        
        // Define file contents
        const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prompta: The Ultimate Vision Studio</title>
    <link rel="icon" href="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238B5CF6'%3e%3cpath d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm1-12H9v8h4a4 4 0 0 0 0-8zm-2 6v-4h2a2 2 0 0 1 0 4z'/%3e%3c/svg%3e" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <style>
      body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: var(--color-bg);
          color: var(--color-text-primary);
      }
      
      /* --- Dynamic Background Keyframes --- */
      @keyframes nebula-scroll {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes float {
        0% { transform: translateY(0px); opacity: 0; }
        25% { opacity: 0.7; }
        50% { transform: translateY(-500px); opacity: 1; }
        75% { opacity: 0.7; }
        100% { transform: translateY(-1000px); opacity: 0; }
      }
    </style>
  <script type="importmap">
{
  "imports": {
    "react/": "https://aistudiocdn.com/react@^19.1.1/",
    "react": "https://aistudiocdn.com/react@^19.1.1",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.19.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>`;
        
        const indexTsxContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

        const metadataJsonContent = `{
  "name": "Prompta: The Ultimate Vision Studio",
  "description": "An AI-powered vision studio that brings your creative prompts to life with unparalleled speed, control, and photorealism. Generate and edit flawless, high-resolution visuals using cutting-edge Google AI.",
  "requestFramePermissions": []
}`;
        const typesTsContent = `export interface CameraPreset {
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

export type Page = 'create' | 'explore';

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
    isLoggedIn: boolean;
    name: string;
    avatar: string | null; // base64 string
}`;

        const geminiServiceTsContent = `import { GoogleGenAI, Modality, Chat } from "@google/genai";

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
};`;
        
        const readmeMdContent = `# Prompta AI Vision Studio

This is the code for the Prompta AI Vision Studio application, generated for you to push to your own Git repository.

## How to use this code

This project consists of a single \`index.html\` file that loads a React application via ES modules. All the necessary dependencies are loaded from a CDN, and it's configured to use the \`process.env.API_KEY\` provided by its hosting environment.

## Pushing to GitHub

You can now use these files to create your own Git repository.

1.  Create a new repository on [GitHub](https://github.com/new).
2.  Unzip the downloaded folder.
3.  Follow the instructions provided by GitHub to "push an existing repository from the command line":

    \`\`\`bash
    # Navigate to the unzipped folder in your terminal
    cd path/to/your/project

    # Initialize a new git repository
    git init -b main
    git add .
    git commit -m "Initial commit of Prompta AI Studio"

    # Add your GitHub repository as a remote and push
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
    git push -u origin main
    \`\`\`

That's it! Your code is now on GitHub.
`;
        
        const constantsTsContent = (await (await fetch(window.location.origin + '/constants.ts')).text());
        const appTsxContent = (await (await fetch(window.location.origin + '/App.tsx')).text());
        const iconTsxContent = (await (await fetch(window.location.origin + '/components/Icon.tsx')).text());
        const dynamicBackgroundTsxContent = (await (await fetch(window.location.origin + '/components/DynamicBackground.tsx')).text());
        const messageCardsTsxContent = (await (await fetch(window.location.origin + '/components/MessageCards.tsx')).text());
        const loginModalTsxContent = (await (await fetch(window.location.origin + '/components/LoginModal.tsx')).text());
        const sidebarTsxContent = (await (await fetch(window.location.origin + '/components/Sidebar.tsx')).text());
        const createPageTsxContent = (await (await fetch(window.location.origin + '/pages/CreatePage.tsx')).text());
        const explorePageTsxContent = (await (await fetch(window.location.origin + '/pages/ExplorePage.tsx')).text());
        
        zip.file("index.html", indexHtmlContent);
        zip.file("index.tsx", indexTsxContent);
        zip.file("App.tsx", appTsxContent);
        zip.file("types.ts", typesTsContent);
        zip.file("constants.ts", constantsTsContent);
        zip.file("services/geminiService.ts", geminiServiceTsContent);
        zip.file("metadata.json", metadataJsonContent);
        zip.file("README.md", readmeMdContent);
        zip.file("components/Icon.tsx", iconTsxContent);
        zip.file("components/DynamicBackground.tsx", dynamicBackgroundTsxContent);
        zip.file("components/MessageCards.tsx", messageCardsTsxContent);
        zip.file("components/LoginModal.tsx", loginModalTsxContent);
        zip.file("components/Sidebar.tsx", sidebarTsxContent);
        zip.file("pages/CreatePage.tsx", createPageTsxContent);
        zip.file("pages/ExplorePage.tsx", explorePageTsxContent);

        zip.generateAsync({ type: "blob" }).then(function(content: Blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "prompta-project.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };


  const NavButton: React.FC<{ page: Page, children: React.ReactNode }> = ({ page, children }) => (
      <button
          onClick={() => setActivePage(page)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activePage === page 
              ? 'bg-[var(--color-primary)] text-white' 
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-white'
          }`}
      >
          {children}
      </button>
  );

  return (
    <div className="h-screen w-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col font-sans relative">
      <DynamicBackground theme={activeTheme} />
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onEmailLogin={handleEmailLogin} onGoogleLogin={handleGoogleLogin} />}
      <header className="p-4 flex-shrink-0 flex items-center justify-between border-b border-[var(--color-border)] z-10 bg-[var(--color-surface-1)]/50 backdrop-blur-lg">
        <div className="flex items-center">
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-white transition-all duration-300 mr-2 group relative border border-[var(--color-border)] hover:border-[var(--color-primary)]"
                aria-label="Toggle session history"
            >
                <div className="absolute -inset-0.5 bg-[var(--color-primary)] rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity"></div>
                <Icon path={isSidebarOpen ? ICONS.close : ICONS.promptaLogo} className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            </button>
            <h1 className="text-xl font-bold tracking-tighter">Prompta</h1>
            <span className="ml-2 text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-mono px-2 py-0.5 rounded-full">AI</span>
        </div>
        <div className="flex items-center space-x-2">
            <button
                onClick={handleExportProject}
                className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-white transition-colors bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]"
                aria-label="Export project code"
            >
                <Icon path={ICONS.code} className="w-5 h-5" />
            </button>
            <div className="relative" ref={themeMenuRef}>
                <button 
                    onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                    className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-white transition-colors bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]"
                    aria-label="Select theme"
                >
                    <Icon path={ICONS.palette} className="w-5 h-5" />
                </button>
                {isThemeMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg shadow-2xl z-20">
                        <ul className="py-1">
                            {THEMES.map(theme => (
                                <li key={theme.id}>
                                    <button
                                        onClick={() => {
                                            setActiveTheme(theme);
                                            setIsThemeMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                                            activeTheme.id === theme.id ? 'font-semibold text-white bg-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                                        }`}
                                    >
                                        <span>{theme.name}</span>
                                        {activeTheme.id === theme.id && <Icon path={ICONS.check} className="w-4 h-4" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <nav className="flex items-center space-x-2 bg-[var(--color-surface-2)] p-1 rounded-lg">
                <NavButton page="create">Create</NavButton>
                <NavButton page="explore">Explore</NavButton>
            </nav>
        </div>
      </header>
      <div className="flex flex-grow min-h-0">
          <Sidebar
              isOpen={isSidebarOpen}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onNewChat={handleNewChat}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
          />
          <main className="flex-grow flex flex-col min-h-0">
            {activePage === 'create' ? (
                <CreatePage 
                    history={history}
                    setHistory={setHistory}
                    aiCommunication={aiCommunication}
                    setAiCommunication={setAiCommunication}
                    attachedImages={attachedImages}
                    setAttachedImages={setAttachedImages}
                    handleFileChange={handleFileChange}
                    handleAiSubmit={handleAiSubmit}
                    handleCreateVariations={handleCreateVariations}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    isAspectRatioMenuOpen={isAspectRatioMenuOpen}
                    setAspectRatioMenuOpen={setAspectRatioMenuOpen}
                    isDragging={isDragging}
                    handlePaste={handlePaste}
                    dragHandlers={{ 
                        onDragEnter: handleDragEnter, 
                        onDragLeave: handleDragLeave, 
                        onDragOver: handleDragOver, 
                        onDrop: handleDrop 
                    }}
                    user={user}
                    onOpenLoginModal={() => setIsLoginModalOpen(true)}
                    onLogout={handleLogout}
                    onAvatarChange={handleAvatarChange}
                />
            ) : (
                <ExplorePage />
            )}
          </main>
      </div>
    </div>
  );
};


export default App;
