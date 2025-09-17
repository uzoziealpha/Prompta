import React from 'react';
import { UserHistoryItem, BotHistoryItem } from '../types';
import { ICONS } from '../constants';
import { Icon } from './Icon';

export const UserMessageCard: React.FC<{ item: UserHistoryItem }> = ({ item }) => (
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

export const BotMessageCard: React.FC<{ item: BotHistoryItem; onDelete: () => void; onCreateVariations: (prompt: string, imageUrl: string) => void; }> = ({ item, onDelete, onCreateVariations }) => {
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
                    <p className="text-[var(--color-text-primary)]/80 text-sm whitespace-pre-wrap">{item.text.replace(/\*/g, '')}</p>
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
                           <p className="text-sm text-[var(--color-text-secondary)] font-light line-clamp-3 whitespace-pre-wrap">{item.text.replace(/\*/g, '')}</p>
                        </div>
                     )}
                    
                    <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       {item.prompt && item.imageUrl && (
                         <button
                           onClick={() => onCreateVariations(item.prompt!, item.imageUrl!)}
                           className="bg-black/50 p-2 rounded-full text-white hover:bg-blue-500/80 backdrop-blur-sm"
                           aria-label="Create variations"
                         >
                           <Icon path={ICONS.variations} className="w-5 h-5" />
                         </button>
                       )}
                       <button
                           onClick={handleDownload}
                           className="bg-black/50 p-2 rounded-full text-white hover:bg-[var(--color-primary)]/80 backdrop-blur-sm"
                           aria-label="Download image"
                       >
                           <Icon path={ICONS.download} className="w-5 h-5" />
                       </button>
                       <button
                           onClick={onDelete}
                           className="bg-black/50 p-2 rounded-full text-white hover:bg-red-500/80 backdrop-blur-sm"
                           aria-label="Delete image"
                       >
                           <Icon path={ICONS.trash} className="w-5 h-5" />
                       </button>
                    </div>
                </div>
            </div>
        )
    }

    return null;
};
