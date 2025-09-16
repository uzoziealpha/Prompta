import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CameraPreset, GenerationSettings, HistoryItem, UserImage, Page, AspectRatio, BotHistoryItem, UserHistoryItem, Session, Theme } from './types';
import { fileToBase64, createChatSession } from './services/geminiService';
import type { Chat } from '@google/genai';


// -- CONSTANTS --
const CAMERA_PRESETS: CameraPreset[] = [
  { name: 'Default', prompt: 'photorealistic, cinematic lighting, ultra detailed' },
];

const THEMES: Theme[] = [
    { id: 'default', name: 'Default', className: 'theme-default', styles: {
        '--color-bg': '#000000',
        '--color-surface-1': '#111111',
        '--color-surface-2': '#1F1F1F',
        '--color-surface-3': '#2a2a2a',
        '--color-primary': '#8B5CF6',
        '--color-primary-hover': '#7C3AED',
        '--color-text-primary': '#FFFFFF',
        '--color-text-secondary': '#A1A1AA',
        '--color-border': '#27272a',
    } as React.CSSProperties },
    { id: 'nebula', name: 'Nebula', className: 'theme-nebula', styles: {
        '--color-bg': '#0D011A',
        '--color-surface-1': 'rgba(18, 2, 33, 0.5)',
        '--color-surface-2': 'rgba(29, 10, 51, 0.6)',
        '--color-surface-3': 'rgba(44, 21, 74, 0.7)',
        '--color-primary': '#A78BFA',
        '--color-primary-hover': '#9333EA',
        '--color-text-primary': '#F3E8FF',
        '--color-text-secondary': '#D9C2FF',
        '--color-border': '#4A2A69',
    } as React.CSSProperties },
    { id: 'aether', name: 'Aether', className: 'theme-aether', styles: {
        '--color-bg': '#0f172a',
        '--color-surface-1': 'rgba(15, 23, 42, 0.6)',
        '--color-surface-2': 'rgba(30, 41, 59, 0.7)',
        '--color-surface-3': 'rgba(51, 65, 85, 0.8)',
        '--color-primary': '#38BDF8',
        '--color-primary-hover': '#0EA5E9',
        '--color-text-primary': '#E2E8F0',
        '--color-text-secondary': '#94A3B8',
        '--color-border': '#334155',
    } as React.CSSProperties },
];

const EXPLORE_DATA = {
    "Trending Now": [
        { id: 1, imageUrl: "https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "A serene forest in the early morning fog, cinematic, volumetric lighting, hyperrealistic." },
        { id: 2, imageUrl: "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "A dramatic tropical coastline with turquoise water and lush green cliffs, aerial shot, 8k." },
    ],
    "Brand Moods": [
        { id: 5, imageUrl: "https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "Minimalist landscape of a mountain range at dusk, pastel color palette, serene and peaceful." },
        { id: 6, imageUrl: "https://images.pexels.com/photos/1528640/pexels-photo-1528640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "Sunlight filtering through a dense, ancient forest canopy, creating glowing god rays, magical." }
    ]
};

const ASPECT_RATIO_OPTIONS: { name: AspectRatio; ratio: string; iconPath: string }[] = [
    { name: 'Square', ratio: '1:1', iconPath: 'M3.375 3.375C3.375 3.375 3 4.125 3 5.25v13.5C3 19.875 4.125 21 5.25 21h13.5c1.125 0 2.25-1.125 2.25-2.25V5.25C21 4.125 19.875 3 18.75 3H5.25C4.125 3 3.375 3.375 3.375 3.375z' },
    { name: 'Portrait', ratio: '9:16', iconPath: 'M5.25 3A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h8.25A2.25 2.25 0 0015.75 18.75V5.25A2.25 2.25 0 0013.5 3H5.25z' },
    { name: 'Landscape', ratio: '16:9', iconPath: 'M3.375 6.75A2.25 2.25 0 001.125 9v6A2.25 2.25 0 003.375 17.25h17.25A2.25 2.25 0 0022.875 15V9A2.25 2.25 0 0020.625 6.75H3.375z' },
];


// -- SVG ICONS --
const Icon: React.FC<{ path: string; className?: string }> = ({ path, className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

const ICONS = {
  addCircle: 'M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
  close: 'M6 18L18 6M6 6l12 12',
  send: 'M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z',
  trash: 'M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.006a.75.75 0 01-.749.654H5.25a.75.75 0 01-.749-.654L3.495 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.9h1.368c1.603 0 2.816 1.336 2.816 2.9zM12 3.25a.75.75 0 01.75.75v.008l.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.007.008h-.007v-.008l-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008A.75.75 0 0112 3.25z',
  search: 'M11.5 2.5a9 9 0 100 18 9 9 0 000-18zM10 4a6 6 0 100 12 6 6 0 000-12zM21.707 20.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414-1.414l-3-3z',
  download: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
  sliders: 'M3 5.75A.75.75 0 013.75 5h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 6.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 01-.75-.75z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  edit: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
  palette: 'M12 3.75a.75.75 0 01.75.75v.008l.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.007.008h-.007v-.008l-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008A.75.75 0 0112 3.75zM12 5.25a.75.75 0 01.75.75v.008l.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.007.008h-.007v-.008l-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008A.75.75 0 0112 5.25zm0 1.5a.75.75 0 01.75.75v.008l.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.007.008h-.007v-.008l-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008A.75.75 0 0112 6.75zM12 15a.75.75 0 01.75.75v.008l.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.008.007.008h-.007v-.008l-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008-.008A.75.75 0 0112 15z M3.055 11.23a.75.75 0 010-1.06l4.242-4.243a.75.75 0 011.061 0l4.243 4.243a.75.75 0 010 1.06l-4.243 4.243a.75.75 0 01-1.06 0L3.055 11.23z',
};

// -- DYNAMIC BACKGROUND COMPONENT --
const DynamicBackground: React.FC<{ theme: Theme }> = ({ theme }) => {
    if (theme.id === 'nebula') {
        return <div className="fixed top-0 left-0 w-full h-full -z-10 bg-cover" style={{ backgroundImage: 'url(https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg)', animation: 'nebula-scroll 60s ease infinite' }}></div>;
    }
    if (theme.id === 'aether') {
        return (
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-[var(--color-primary)]" style={{
                        width: `${Math.random() * 3 + 1}px`,
                        height: `${Math.random() * 3 + 1}px`,
                        left: `${Math.random() * 100}%`,
                        bottom: `-${Math.random() * 20 + 20}px`,
                        animation: `float ${Math.random() * 20 + 10}s linear infinite`,
                        animationDelay: `${Math.random() * -30}s`,
                    }} />
                ))}
            </div>
        );
    }
    return null;
};

// -- HELPER COMPONENTS --

const UserMessageCard: React.FC<{ item: UserHistoryItem }> = ({ item }) => (
  <div className="flex justify-end ml-10">
    <div className="bg-[var(--color-primary)] text-white rounded-xl p-3 max-w-2xl">
      {item.text && <p className="text-white/90">{item.text}</p>}
      {item.images.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${item.text ? 'mt-2' : ''}`}>
          {item.images.map((img, index) => (
            <img 
              key={index} 
              src={URL.createObjectURL(img.file)} 
              className="w-24 h-24 rounded-md object-cover" 
              alt={`user attachment ${index + 1}`} 
            />
          ))}
        </div>
      )}
    </div>
  </div>
);

const BotMessageCard: React.FC<{ item: BotHistoryItem; onDelete: () => void; }> = ({ item, onDelete }) => {
    if (item.isLoading) {
        return (
            <div className="flex justify-start mr-10">
                <div className="bg-[var(--color-surface-2)] rounded-xl p-4 max-w-lg inline-block w-64 h-64 flex flex-col items-center justify-center">
                     <div className="w-12 h-12 border-4 border-t-[var(--color-primary)] border-gray-700 rounded-full animate-spin"></div>
                     <p className="mt-4 text-xs text-center text-[var(--color-text-secondary)] font-mono tracking-wider">{item.prompt}</p>
                </div>
            </div>
        );
    }

    if (item.text && !item.imageUrl) { // Error or text-only response
        return (
             <div className="flex justify-start mr-10">
                <div className="bg-[var(--color-surface-2)] rounded-xl p-3 max-w-2xl">
                    <p className="text-[var(--color-text-primary)]/80 text-sm whitespace-pre-wrap">{item.text}</p>
                </div>
            </div>
        )
    }
    
    if (item.imageUrl) {
        const handleDownload = () => {
            const link = document.createElement('a');
            link.href = item.imageUrl!;
            const safePrompt = (item.prompt || '').substring(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileExtension = item.imageUrl!.split(';')[0].split('/')[1] || 'jpeg';
            link.download = `prompta_${safePrompt || 'vision'}.${fileExtension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        return (
             <div className="flex justify-start mr-10">
                <div className="bg-[var(--color-surface-2)] rounded-xl p-1.5 max-w-2xl group relative inline-block">
                    <img src={item.imageUrl} alt={item.prompt} className="w-full h-auto rounded-lg" />
                     {item.text && (
                        <div className="p-2 border-t border-[var(--color-border)] mt-1.5">
                           <p className="text-sm text-[var(--color-text-secondary)] font-light line-clamp-3 whitespace-pre-wrap">{item.text}</p>
                        </div>
                     )}
                    
                    <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                           onClick={onDelete}
                           className="bg-black/50 p-2 rounded-full text-white hover:bg-red-500/80 backdrop-blur-sm"
                           aria-label="Delete image"
                       >
                           <Icon path={ICONS.trash} className="w-5 h-5" />
                       </button>
                       <button
                           onClick={handleDownload}
                           className="bg-black/50 p-2 rounded-full text-white hover:bg-[var(--color-primary)]/80 backdrop-blur-sm"
                           aria-label="Download image"
                       >
                           <Icon path={ICONS.download} className="w-5 h-5" />
                       </button>
                    </div>
                </div>
            </div>
        )
    }

    return null;
};

const CreatePage: React.FC<{
    history: HistoryItem[];
    setHistory: (updater: React.SetStateAction<HistoryItem[]>) => void;
    aiCommunication: string;
    setAiCommunication: (value: string) => void;
    attachedImages: UserImage[];
    setAttachedImages: (images: UserImage[]) => void;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleAiSubmit: () => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;
    isAspectRatioMenuOpen: boolean;
    setAspectRatioMenuOpen: (isOpen: boolean) => void;
    isDragging: boolean;
    handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
    dragHandlers: {
        handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
        handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
        handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
        handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    };
}> = ({
    history,
    setHistory,
    aiCommunication,
    setAiCommunication,
    attachedImages,
    setAttachedImages,
    handleFileChange,
    handleAiSubmit,
    aspectRatio,
    setAspectRatio,
    isAspectRatioMenuOpen,
    setAspectRatioMenuOpen,
    isDragging,
    handlePaste,
    dragHandlers,
}) => {
    const historyContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuContainerRef = useRef<HTMLDivElement>(null);
    const selectedAspectRatio = ASPECT_RATIO_OPTIONS.find(opt => opt.name === aspectRatio);

    const removeAttachedImage = (indexToRemove: number) => {
        setAttachedImages(attachedImages.filter((_, index) => index !== indexToRemove));
    };

    const handleDeleteHistoryItem = (idToDelete: number) => {
        setHistory(prev => prev.filter(item => item.id !== idToDelete));
    };

    useEffect(() => {
        if (historyContainerRef.current) {
            historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
        }
    }, [history.length, history[history.length - 1]]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
                setAspectRatioMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setAspectRatioMenuOpen]);

    return (
        <div className="relative flex flex-col flex-grow min-h-0 bg-[var(--color-surface-1)]/80 backdrop-blur-sm" {...dragHandlers} onPaste={handlePaste}>
             {isDragging && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md z-50 border-2 border-dashed border-[var(--color-primary)] m-4 rounded-xl">
                    <Icon path={ICONS.addCircle} className="w-24 h-24 text-[var(--color-primary)]" />
                    <p className="mt-4 text-xl font-bold text-white">Drop Images Here</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Attach up to 4 images (PNG, JPG, WebP)</p>
                </div>
            )}
            <main ref={historyContainerRef} className="flex-grow overflow-y-auto min-h-0 p-4">
                {history.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-secondary)]">
                        <p className="font-semibold text-lg text-[var(--color-text-primary)]">Your Conversation with Prompta</p>
                        <p className="text-sm">Your prompts and the AI's creations will appear here.</p>
                    </div>
                )}
                 <div className="flex flex-col space-y-6">
                    {history.map((item) => {
                        if (item.type === 'user') {
                            return <UserMessageCard key={item.id} item={item} />;
                        }
                        if (item.type === 'bot') {
                            return <BotMessageCard key={item.id} item={item} onDelete={() => handleDeleteHistoryItem(item.id)} />;
                        }
                        return null;
                    })}
                </div>
            </main>
            <div className="flex-shrink-0 p-4 bg-transparent border-t border-[var(--color-border)]">
                {attachedImages.length > 0 && (
                    <div className="pb-3">
                        <div className="flex items-center space-x-2">
                            {attachedImages.map((img, index) => (
                                <div key={index} className="relative w-16 h-16 rounded-md overflow-hidden group flex-shrink-0">
                                    <img src={URL.createObjectURL(img.file)} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeAttachedImage(index)}
                                        className="absolute top-0.5 right-0.5 bg-black/60 p-0.5 rounded-full text-white transition-colors hover:bg-red-500/80 z-10"
                                        aria-label={`Remove image ${index + 1}`}
                                    >
                                        <Icon path={ICONS.close} className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleAiSubmit(); }}>
                    <div className="relative">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                            multiple
                        />
                        <input
                            type="text"
                            value={aiCommunication}
                            onChange={(e) => setAiCommunication(e.target.value)}
                            placeholder="Communicate with AI..."
                            className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full py-3 pl-28 pr-14 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-shadow"
                        />
                        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 space-x-1">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={attachedImages.length >= 4}
                                className="p-2 rounded-full transition-colors text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] disabled:text-gray-600 disabled:cursor-not-allowed"
                                aria-label="Add images"
                            >
                                <Icon path={ICONS.addCircle} className="w-6 h-6" />
                            </button>
                             <div className="relative" ref={menuContainerRef}>
                                <button
                                    type="button"
                                    onClick={() => setAspectRatioMenuOpen(!isAspectRatioMenuOpen)}
                                    className="p-2 rounded-full transition-colors text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                                    aria-label={`Image aspect ratio settings: ${aspectRatio}`}
                                >
                                    <Icon path={selectedAspectRatio?.iconPath || ICONS.sliders} className="w-6 h-6" />
                                </button>
                                {isAspectRatioMenuOpen && (
                                    <div className="absolute bottom-full mb-2 w-48 bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg shadow-lg z-20">
                                        <ul className="py-1">
                                            {ASPECT_RATIO_OPTIONS.map(opt => (
                                                <li key={opt.name}>
                                                    <button 
                                                        onClick={() => {
                                                            setAspectRatio(opt.name);
                                                            setAspectRatioMenuOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                                                            aspectRatio === opt.name ? 'font-semibold text-white bg-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center">
                                                           <Icon path={opt.iconPath} className="w-5 h-5" />
                                                           <span className="ml-3">{opt.name}</span>
                                                           {aspectRatio === opt.name && <Icon path={ICONS.check} className="w-4 h-4 ml-2" />}
                                                        </div>
                                                        <span className={`text-xs ${aspectRatio === opt.name ? 'text-purple-200' : 'text-gray-500'}`}>{opt.ratio}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <button
                                type="submit"
                                disabled={!aiCommunication.trim() && attachedImages.length === 0}
                                className="p-2 rounded-full transition-colors text-white enabled:hover:bg-[var(--color-surface-3)] disabled:text-gray-600 disabled:cursor-not-allowed"
                                aria-label="Send message"
                            >
                                <Icon path={ICONS.send} className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ExploreImageCard: React.FC<{ imageUrl: string; prompt: string }> = ({ imageUrl, prompt }) => (
    <div className="group relative overflow-hidden rounded-xl">
        <img src={imageUrl} alt={prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <p className="absolute bottom-0 left-0 p-4 text-sm text-white/90 font-light">{prompt}</p>
    </div>
);

const ExplorePage: React.FC = () => (
    <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-8 bg-[var(--color-surface-1)]/80 backdrop-blur-sm">
        <div className="relative">
            <input
                type="text"
                placeholder="Explore new ideas, styles, and themes..."
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full py-3 pl-12 pr-4 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                <Icon path={ICONS.search} className="w-5 h-5" />
            </div>
        </div>

        {Object.entries(EXPLORE_DATA).map(([title, images]) => (
            <section key={title}>
                <h2 className="text-xl font-bold tracking-tight mb-4">{title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {images.map(image => (
                        <ExploreImageCard key={image.id} imageUrl={image.imageUrl} prompt={image.prompt} />
                    ))}
                </div>
            </section>
        ))}
    </main>
);

const Sidebar: React.FC<{
    isOpen: boolean;
    sessions: Session[];
    activeSessionId: number | null;
    onNewChat: () => void;
    onSelectSession: (id: number) => void;
    onDeleteSession: (id: number) => void;
}> = ({ isOpen, sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession }) => {
    if (!isOpen) return null;

    const groupSessionsByDate = (sessionList: Session[]) => {
        const groups: { [key: string]: Session[] } = {};
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        sessionList.forEach(session => {
            const sessionDate = new Date(session.date);
            let groupName = sessionDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
            if (sessionDate.toDateString() === today.toDateString()) groupName = 'Today';
            else if (sessionDate.toDateString() === yesterday.toDateString()) groupName = 'Yesterday';
            
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(session);
        });
        return groups;
    };

    const groupedSessions = groupSessionsByDate(sessions);

    return (
        <aside className="w-72 bg-[var(--color-surface-1)]/50 border-r border-[var(--color-border)] flex-shrink-0 flex flex-col transition-all duration-300 backdrop-blur-lg">
            <div className="p-2 border-b border-[var(--color-border)]">
                <button 
                    onClick={onNewChat}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)] transition-colors"
                >
                    <span>New Chat</span>
                    <Icon path={ICONS.edit} className="w-4 h-4" />
                </button>
            </div>
            <nav className="flex-grow overflow-y-auto p-2">
                {Object.entries(groupedSessions).map(([groupTitle, sessionsInGroup]) => (
                    <div key={groupTitle} className="mb-4">
                        <h3 className="px-2 py-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{groupTitle}</h3>
                        <ul>
                            {sessionsInGroup.map(session => (
                                <li key={session.id}>
                                    <button 
                                        onClick={() => onSelectSession(session.id)}
                                        className={`w-full text-left p-2 my-0.5 rounded-lg text-sm truncate flex justify-between items-center group transition-colors ${
                                            activeSessionId === session.id ? 'bg-[var(--color-primary)]/80 text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                                        }`}
                                    >
                                        <span className="flex-grow truncate pr-2">{session.title}</span>
                                        <div className="flex-shrink-0">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                                                className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label={`Delete session: ${session.title}`}
                                            >
                                                <Icon path={ICONS.trash} className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
};


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

  const handleAiSubmit = async () => {
    const message = aiCommunication.trim();
    if ((!message && attachedImages.length === 0) || !activeSessionId) return;

    const currentChat = chat ?? createChatSession();
    if (!chat) setChat(currentChat);

    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;
    
    const isImageTask = attachedImages.length > 0 || /create|generate|make|draw|edit|change|render|imagine/i.test(message);

    let systemPreamble = `You are Prompta, a multi-talented AI creative assistant. Your primary role is to help users generate and edit stunning visuals. You are also a helpful partner, capable of answering general questions (like 'what is today?'), brainstorming ideas, writing captions for images, and refining user prompts to be more effective. Be friendly, creative, and always aim to be as helpful as possible. Never use the phrase 'I do not have access to real-time information'.`;
    
    if (isImageTask) {
        systemPreamble += ` When generating or editing an image, you MUST strictly conform to the user's specified aspect ratio: **${aspectRatio} (${ASPECT_RATIO_OPTIONS.find(o => o.name === aspectRatio)?.ratio})**.`;
    }
    
    let userInstruction = message || `Please perform the most logical edit based on the attached image(s). If an aspect ratio is selected (${aspectRatio}), prioritize resizing the image.`;
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
        const resultText = response.text;
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
      <header className="p-4 flex-shrink-0 flex items-center justify-between border-b border-[var(--color-border)] z-10 bg-[var(--color-surface-1)]/50 backdrop-blur-lg">
        <div className="flex items-center">
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-white transition-all duration-300 mr-2 group relative border border-[var(--color-border)] hover:border-[var(--color-primary)]"
                aria-label="Toggle session history"
            >
                <div className="absolute -inset-0.5 bg-[var(--color-primary)] rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity"></div>
                <Icon path={isSidebarOpen ? ICONS.close : ICONS.menu} className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            </button>
            <h1 className="text-xl font-bold tracking-tighter">Prompta</h1>
            <span className="ml-2 text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-mono px-2 py-0.5 rounded-full">AI</span>
        </div>
        <div className="flex items-center space-x-2">
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
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    isAspectRatioMenuOpen={isAspectRatioMenuOpen}
                    setAspectRatioMenuOpen={setAspectRatioMenuOpen}
                    isDragging={isDragging}
                    handlePaste={handlePaste}
                    dragHandlers={{ handleDragEnter, handleDragLeave, handleDragOver, handleDrop }}
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
