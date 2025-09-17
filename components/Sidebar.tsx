import React from 'react';
import { Session } from '../types';
import { ICONS } from '../constants';
import { Icon } from './Icon';

export const Sidebar: React.FC<{
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
