import React, { useState, useCallback, useRef, useEffect } from 'react';
// FIX: Corrected Chat type import to be a value import as per @google/genai guidelines.
import { Chat } from '@google/genai';
// FIX: Corrected import path to point to types/index.ts to avoid conflict with empty types.ts file
import { HistoryItem, UserImage, Page, AspectRatio, BotHistoryItem, UserHistoryItem, Session, Theme, User } from './types/index';
import { fileToBase64, createChatSession } from './services/geminiService';

// FIX: Corrected import path to point to constants/index.ts to avoid conflict with empty constants.ts file
import { ICONS, THEMES } from './constants/index';
import { Icon } from './components/Icon';
import { DynamicBackground } from './components/DynamicBackground';
import { AuthModal } from './components/AuthModal';
import { CreatePage } from './pages/CreatePage';
import { ExplorePage } from './pages/ExplorePage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setIsUserMenuOpen(false);
    setActivePage('create');
  };

  const handleUpdateUser = (updatedFields: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updatedFields } : null));
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
        handleUpdateUser({ avatar: base64 });
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
    if (!user) return; // Don't load sessions if not logged in
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
  }, [handleNewChat, user]);

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
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
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
        
        // FIX: The `chat.sendMessage` payload's `message` property should be an array of Parts for multipart content, not an object containing a `parts` array.
        const response = await currentChat.sendMessage({ message: parts });

        let resultImage: string | undefined;
        const resultText = response.text;
        // FIX: The response object is `GenerateContentResponse`, so candidates are at `response.candidates`, not `response.response.candidates`.
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
        
        // FIX: The `chat.sendMessage` payload's `message` property should be an array of Parts for multipart content, not an object containing a `parts` array.
        const response = await currentChat.sendMessage({ message: parts });

        let resultImage: string | undefined;
        const resultText = response.text;
        // FIX: The response object is `GenerateContentResponse`, so candidates are at `response.candidates`, not `response.response.candidates`.
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
        
        const filePaths = [
            "index.html",
            "index.tsx",
            "App.tsx",
            "metadata.json",
            "components/Icon.tsx",
            "components/DynamicBackground.tsx",
            "components/MessageCards.tsx",
            "components/AuthModal.tsx",
            "components/Sidebar.tsx",
            "pages/CreatePage.tsx",
            "pages/ExplorePage.tsx",
            "pages/AccountSettingsPage.tsx",
            "services/geminiService.ts",
            "types/index.ts",
            "constants/index.ts",
        ];

        for (const path of filePaths) {
            try {
                const response = await fetch(`${window.location.origin}/${path}`);
                if (!response.ok) throw new Error(`Failed to fetch ${path}`);
                const content = await response.text();
                zip.file(path, content);
            } catch (error) {
                console.warn(error);
            }
        }
        
        zip.file("README.md", `# Prompta AI Vision Studio\n\nThis zip contains the source code for your Prompta application. You can use these files to set up a local development environment or deploy to a hosting provider.`);

        zip.generateAsync({ type: "blob" }).then(function(content: Blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "prompta-project.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };


  const PageNavButton: React.FC<{ page: Page, children: React.ReactNode }> = ({ page, children }) => (
      <button
          onClick={() => setActivePage(page)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activePage === page 
              ? 'bg-[var(--color-surface-3)] text-white' 
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-white'
          }`}
          aria-current={activePage === page}
      >
          {children}
      </button>
  );

  return (
    <div className="h-screen w-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col font-sans relative">
      <DynamicBackground theme={activeTheme} />
      
      {!user ? (
        <AuthModal onLoginSuccess={handleLoginSuccess} isGated={true} />
      ) : (
        <>
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
                            {THEMES.map(theme => (
                                <button
                                    key={theme.id}
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
                            ))}
                        </div>
                    )}
                </div>
                <div className="w-px h-6 bg-[var(--color-border)] mx-2"></div>
                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                        <img 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=8B5CF6&color=fff&rounded=true`} 
                            alt="User avatar" 
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-offset-2 ring-offset-[var(--color-surface-1)] ring-transparent group-hover:ring-[var(--color-primary)] transition-all"
                        />
                    </button>
                    {isUserMenuOpen && (
                         <div className="absolute top-full right-0 mt-3 w-56 bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg shadow-2xl z-20 py-1">
                             <div className="px-3 py-2 border-b border-[var(--color-border)]">
                                <p className="font-semibold text-sm text-white">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
                             </div>
                             <div className="py-1">
                                <button
                                    onClick={() => { setActivePage('settings'); setIsUserMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center space-x-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
                                >
                                    <Icon path={ICONS.settings} className="w-4 h-4" />
                                    <span>Account Settings</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center space-x-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
                                >
                                     <Icon path={ICONS.logout} className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                             </div>
                         </div>
                    )}
                </div>
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
                 <nav className="flex-shrink-0 px-4 pt-2">
                    <div className="flex items-center space-x-2 bg-[var(--color-surface-1)] p-1 rounded-lg max-w-min">
                        <PageNavButton page="create">Create</PageNavButton>
                        <PageNavButton page="explore">Explore</PageNavButton>
                        <PageNavButton page="settings">Settings</PageNavButton>
                    </div>
                 </nav>
                 <div className="flex-grow min-h-0 p-4">
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
                        />
                    ) : activePage === 'explore' ? (
                        <ExplorePage />
                    ) : (
                       <AccountSettingsPage user={user} onUpdateUser={handleUpdateUser} onAvatarChange={handleAvatarChange} />
                    )}
                 </div>
              </main>
          </div>
        </>
      )}
    </div>
  );
};


export default App;
