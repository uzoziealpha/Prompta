import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CameraPreset, GenerationSettings, HistoryItem, UserImage, Page, AspectRatio, BotHistoryItem } from './types';
import { fileToBase64, createChatSession } from './services/geminiService';
import type { Chat } from '@google/genai';


// -- CONSTANTS --
const CAMERA_PRESETS: CameraPreset[] = [
  { name: 'Default', prompt: 'photorealistic, cinematic lighting, ultra detailed' },
];

const LOADING_MESSAGES = [
  "Igniting Nano Banana Realism Engine...",
  "Calibrating pixel-perfect relevance...",
  "Rendering hyper-realistic textures...",
  "Simulating cinematic lighting...",
  "Applying PBR material properties...",
  "Finalizing artifact-free output...",
];

const EXPLORE_DATA = {
    "Trending Now": [
        { id: 1, imageUrl: "https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "A serene forest in the early morning fog, cinematic, volumetric lighting, hyperrealistic." },
        { id: 2, imageUrl: "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "A dramatic tropical coastline with turquoise water and lush green cliffs, aerial shot, 8k." },
        { id: 3, imageUrl: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "Crashing ocean waves against a rocky shore during a vibrant sunset, long exposure, majestic." },
        { id: 4, imageUrl: "https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "Cosmic nebula with vibrant pink and purple clouds, stars shining through, deep space." }
    ],
    "Brand Moods": [
        { id: 5, imageUrl: "https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "Minimalist landscape of a mountain range at dusk, pastel color palette, serene and peaceful." },
        { id: 6, imageUrl: "https://images.pexels.com/photos/1528640/pexels-photo-1528640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "Sunlight filtering through a dense, ancient forest canopy, creating glowing god rays, magical." }
    ],
    "Community Showcase": [
        { id: 7, imageUrl: "https://images.pexels.com/photos/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "A wooden rope bridge extending into a lush jungle, adventure, exploration." },
        { id: 8, imageUrl: "https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", prompt: "A powerful waterfall cascading down mossy rocks into a crystal clear pool, nature's power." },
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
};

// -- HELPER COMPONENTS --

const Loader: React.FC<{ isInline?: boolean }> = ({ isInline = false }) => {
    const [message, setMessage] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
                return LOADING_MESSAGES[nextIndex];
            });
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    if (isInline) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl aspect-square">
                <div className="w-12 h-12 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin"></div>
                <p className="mt-4 text-xs text-center text-gray-400 font-mono tracking-wider">{message}</p>
            </div>
        )
    }

    return (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md z-50">
            <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-gray-300 font-mono tracking-wider">{message}</p>
        </div>
    );
};

interface GeneratedImageCardProps {
    imageUrl: string;
    prompt: string;
    onDelete: () => void;
}
const GeneratedImageCard: React.FC<GeneratedImageCardProps> = ({ imageUrl, prompt, onDelete }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const safePrompt = prompt.substring(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileExtension = imageUrl.split(';')[0].split('/')[1] || 'jpeg';
        link.download = `prompta_${safePrompt || 'vision'}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="bg-gray-800 rounded-xl overflow-hidden group relative">
            <img src={imageUrl} alt={prompt} className="w-full h-auto aspect-square object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-sm text-gray-200 font-light line-clamp-3">{prompt}</p>
            </div>
             <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onDelete}
                    className="bg-black/50 p-2 rounded-full text-white hover:bg-red-500/80 backdrop-blur-sm"
                    aria-label="Delete image"
                >
                    <Icon path={ICONS.trash} className="w-5 h-5" />
                </button>
                <button
                    onClick={handleDownload}
                    className="bg-black/50 p-2 rounded-full text-white hover:bg-purple-500/80 backdrop-blur-sm"
                    aria-label="Download image"
                >
                    <Icon path={ICONS.download} className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const CreatePage: React.FC<{
    history: HistoryItem[];
    aiCommunication: string;
    setAiCommunication: (value: string) => void;
    attachedImages: UserImage[];
    removeAttachedImage: (index: number) => void;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteHistoryItem: (id: number) => void;
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
    aiCommunication,
    setAiCommunication,
    attachedImages,
    removeAttachedImage,
    handleFileChange,
    handleDeleteHistoryItem,
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

    const generatedImages = history.filter(
        (item): item is BotHistoryItem => item.type === 'bot' && !!item.imageUrl
    );
    const isLoading = history.some(item => item.type === 'bot' && item.isLoading);
    const selectedAspectRatio = ASPECT_RATIO_OPTIONS.find(opt => opt.name === aspectRatio);

    useEffect(() => {
        if (historyContainerRef.current) {
            historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
        }
    }, [generatedImages.length, isLoading]);

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
        <div className="relative flex flex-col flex-grow min-h-0" {...dragHandlers} onPaste={handlePaste}>
             {isDragging && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md z-50 border-2 border-dashed border-purple-500 m-4 rounded-xl">
                    <Icon path={ICONS.addCircle} className="w-24 h-24 text-purple-500" />
                    <p className="mt-4 text-xl font-bold text-white">Drop Images Here</p>
                    <p className="text-sm text-gray-400">Attach up to 4 images (PNG, JPG, WebP)</p>
                </div>
            )}
            <main ref={historyContainerRef} className="flex-grow overflow-y-auto min-h-0 p-4">
                {generatedImages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                        <p className="font-semibold text-lg">Your Generated Images</p>
                        <p className="text-sm">Creations from your prompts will appear here.</p>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                     {generatedImages.map((item) => (
                        <GeneratedImageCard
                            key={item.id}
                            imageUrl={item.imageUrl!}
                            prompt={item.prompt || 'Generated Image'}
                            onDelete={() => handleDeleteHistoryItem(item.id)}
                        />
                    ))}
                    {isLoading && <Loader isInline={true} />}
                </div>
            </main>
            <div className="flex-shrink-0 p-4 bg-black border-t border-gray-900">
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
                            className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-28 pr-14 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                        />
                        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 space-x-1">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={attachedImages.length >= 4}
                                className="p-2 rounded-full transition-colors text-purple-400 hover:text-purple-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                                aria-label="Add images"
                            >
                                <Icon path={ICONS.addCircle} className="w-6 h-6" />
                            </button>
                             <div className="relative" ref={menuContainerRef}>
                                <button
                                    type="button"
                                    onClick={() => setAspectRatioMenuOpen(!isAspectRatioMenuOpen)}
                                    className="p-2 rounded-full transition-colors text-purple-400 hover:text-purple-300"
                                    aria-label={`Image aspect ratio settings: ${aspectRatio}`}
                                >
                                    <Icon path={selectedAspectRatio?.iconPath || ICONS.sliders} className="w-6 h-6" />
                                </button>
                                {isAspectRatioMenuOpen && (
                                    <div className="absolute bottom-full mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                                        <ul className="py-1">
                                            {ASPECT_RATIO_OPTIONS.map(opt => (
                                                <li key={opt.name}>
                                                    <button 
                                                        onClick={() => {
                                                            setAspectRatio(opt.name);
                                                            setAspectRatioMenuOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                                                            aspectRatio === opt.name ? 'font-semibold text-white bg-purple-600' : 'text-gray-300 hover:bg-gray-700'
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
                                className="p-2 rounded-full transition-colors text-white enabled:hover:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed"
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
    <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-8">
        <div className="relative">
            <input
                type="text"
                placeholder="Explore new ideas, styles, and themes..."
                className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
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

// -- MAIN APP COMPONENT --
const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const savedHistoryJSON = localStorage.getItem('prompta-history');
      if (savedHistoryJSON) {
        const savedHistory: HistoryItem[] = JSON.parse(savedHistoryJSON);
        if (Array.isArray(savedHistory)) {
          return savedHistory;
        }
      }
    } catch (error) {
      console.error("Failed to load history from local storage:", error);
      localStorage.removeItem('prompta-history'); // Clear corrupted data
    }
    return [];
  });
  const [aiCommunication, setAiCommunication] = useState('');
  const [attachedImages, setAttachedImages] = useState<UserImage[]>([]);
  const [activePage, setActivePage] = useState<Page>('create');
  const [chat, setChat] = useState<Chat | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('Square');
  const [isAspectRatioMenuOpen, setAspectRatioMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    try {
      // Filter out user messages, loading states, and errors to only save successful image generations.
      const persistableHistory = history.filter(
        (item): item is BotHistoryItem => 
          item.type === 'bot' && !!item.imageUrl && !item.isLoading
      );
      localStorage.setItem('prompta-history', JSON.stringify(persistableHistory));
    } catch (error) {
      console.error("Failed to save history to local storage:", error);
    }
  }, [history]);


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
        alert("There was an error uploading one or more images. Please try again.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      if (event.target) {
          event.target.value = ''; // Allow re-selecting the same file
      }
  };
  
  const removeAttachedImage = (indexToRemove: number) => {
      setAttachedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleDeleteHistoryItem = (idToDelete: number) => {
      setHistory(prev => prev.filter(item => item.id !== idToDelete));
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.clipboardData.files);
  };

  const handleAiSubmit = async () => {
    const message = aiCommunication.trim();
    if (!message && attachedImages.length === 0) return;

    // Lazily initialize chat session
    const currentChat = chat ?? createChatSession();
    if (!chat) {
        setChat(currentChat);
    }

    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;
    
    const systemPreamble = `You are Prompta, an expert AI vision assistant. Your role is to generate and edit images based on user requests, with a deep understanding of creative and technical specifications like aspect ratio.

- **Analyze & Execute**: Carefully analyze both the text prompt and any attached images.
- **Aspect Ratio Priority**: The user has specified a desired aspect ratio of **${aspectRatio} (${ASPECT_RATIO_OPTIONS.find(o => o.name === aspectRatio)?.ratio})**. All generated or edited images MUST strictly conform to this aspect ratio. If editing, this may require cropping, extending, or reframing the image content.
- **Identify Properties**: If asked, accurately identify an image's properties, including its current aspect ratio.`;

    let userInstruction = message;

    // Handle image-only request with a specific aspect ratio by creating a default instruction.
    if (!userInstruction && attachedImages.length > 0 && aspectRatio !== 'Square') {
        userInstruction = `Please change the aspect ratio of the provided image to ${aspectRatio}.`;
    }

    const finalMessage = userInstruction 
        ? `${systemPreamble}\n\n--- USER REQUEST ---\n${userInstruction}` 
        : '';

    setHistory(prev => [
        ...prev,
        { type: 'user', id: userMessageId, text: message, images: attachedImages },
        { type: 'bot', id: botMessageId, isLoading: true, prompt: message || `Edit image to ${aspectRatio}` }
    ]);
    
    setAiCommunication('');
    setAttachedImages([]);
    setAspectRatioMenuOpen(false);

    try {
        const parts: ({ inlineData: { data: string; mimeType: string; } } | { text: string })[] = [];

        if (attachedImages.length > 0) {
            const imageParts = attachedImages.map(img => ({
                inlineData: {
                    data: img.data,
                    mimeType: img.file.type,
                },
            }));
            parts.push(...imageParts);
        }
        
        if (finalMessage) {
            parts.push({ text: finalMessage });
        }
        
        if (parts.length === 0) {
            throw new Error("Cannot send an empty message.");
        }

        const response = await currentChat.sendMessage({ message: parts });

        let resultImage: string | undefined;
        let resultText: string | undefined;

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            } else if (part.text) {
                resultText = part.text;
            }
        }
        
        if (resultImage || resultText) {
            setHistory(prev => prev.map(item => 
                item.id === botMessageId 
                ? { ...item, type: 'bot', isLoading: false, imageUrl: resultImage, text: resultText, prompt: message } 
                : item
            ));
        } else {
            throw new Error("The AI did not return a valid response.");
        }

    } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || "Sorry, I couldn't process that. Please try again.";
        setHistory(prev => prev.map(item => 
            item.id === botMessageId ? { ...item, type: 'bot', isLoading: false, text: errorMessage } : item
        ));
    }
  };

  const NavButton: React.FC<{ page: Page, children: React.ReactNode }> = ({ page, children }) => (
      <button
          onClick={() => setActivePage(page)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activePage === page 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
      >
          {children}
      </button>
  );

  return (
    <div className="h-screen w-screen bg-black flex flex-col font-sans">
      <header className="p-4 flex-shrink-0 flex items-center justify-between border-b border-gray-900">
        <div className="flex items-center">
            <h1 className="text-xl font-bold tracking-tighter">Prompta</h1>
            <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 font-mono px-2 py-0.5 rounded-full">AI</span>
        </div>
        <nav className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg">
            <NavButton page="create">Create</NavButton>
            <NavButton page="explore">Explore</NavButton>
        </nav>
      </header>
      
      {activePage === 'create' ? (
          <CreatePage 
              history={history}
              aiCommunication={aiCommunication}
              setAiCommunication={setAiCommunication}
              attachedImages={attachedImages}
              removeAttachedImage={removeAttachedImage}
              handleFileChange={handleFileChange}
              handleDeleteHistoryItem={handleDeleteHistoryItem}
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
    </div>
  );
};


export default App;
