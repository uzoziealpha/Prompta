import React, { useRef, useEffect } from 'react';
import { HistoryItem, UserImage, AspectRatio, User, UserHistoryItem, BotHistoryItem } from '../types';
import { ICONS, ASPECT_RATIO_OPTIONS } from '../constants';
import { Icon } from '../components/Icon';
import { UserMessageCard, BotMessageCard } from '../components/MessageCards';

export const CreatePage: React.FC<{
    history: HistoryItem[];
    setHistory: (updater: React.SetStateAction<HistoryItem[]>) => void;
    aiCommunication: string;
    setAiCommunication: (value: string) => void;
    attachedImages: UserImage[];
    setAttachedImages: (images: UserImage[]) => void;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleAiSubmit: () => void;
    handleCreateVariations: (prompt: string, imageUrl: string) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;
    isAspectRatioMenuOpen: boolean;
    setAspectRatioMenuOpen: (isOpen: boolean) => void;
    isDragging: boolean;
    handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
    dragHandlers: {
        onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
        onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
        onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
        onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    };
    user: User | null;
    onOpenLoginModal: () => void;
    onLogout: () => void;
    onAvatarChange: (file: File) => void;
}> = ({
    history,
    setHistory,
    aiCommunication,
    setAiCommunication,
    attachedImages,
    setAttachedImages,
    handleFileChange,
    handleAiSubmit,
    handleCreateVariations,
    aspectRatio,
    setAspectRatio,
    isAspectRatioMenuOpen,
    setAspectRatioMenuOpen,
    isDragging,
    handlePaste,
    dragHandlers,
    user,
    onOpenLoginModal,
    onLogout,
    onAvatarChange
}) => {
    const historyContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const menuContainerRef = useRef<HTMLDivElement>(null);
    const selectedAspectRatio = ASPECT_RATIO_OPTIONS.find(opt => opt.name === aspectRatio);

    const removeAttachedImage = (indexToRemove: number) => {
        setAttachedImages(attachedImages.filter((_, index) => index !== indexToRemove));
    };

    const handleDeleteHistoryItem = (idToDelete: number) => {
        setHistory(prev => prev.filter(item => item.id !== idToDelete));
    };
    
    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onAvatarChange(e.target.files[0]);
        }
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
                            return <BotMessageCard key={item.id} item={item} onDelete={() => handleDeleteHistoryItem(item.id)} onCreateVariations={handleCreateVariations} />;
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
                <div className="mt-2 flex items-center justify-center">
                    {user && user.isLoggedIn ? (
                        <div className="flex items-center space-x-3 text-sm">
                            <input
                                type="file"
                                ref={avatarInputRef}
                                onChange={handleAvatarFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button onClick={() => avatarInputRef.current?.click()} className="group relative">
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name.replace(' ', '+')}&background=8B5CF6&color=fff&rounded=true`}
                                    alt="User avatar"
                                    className="w-8 h-8 rounded-full object-cover transition-opacity group-hover:opacity-80"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon path={ICONS.edit} className="w-4 h-4 text-white" />
                                </div>
                            </button>
                            <span className="font-medium text-[var(--color-text-primary)]">{user.name}</span>
                            <button onClick={onLogout} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-colors text-[var(--color-text-secondary)] hover:text-white">
                                <Icon path={ICONS.logout} className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenLoginModal}
                            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white text-gray-800 font-medium hover:bg-gray-200 transition-colors"
                        >
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
