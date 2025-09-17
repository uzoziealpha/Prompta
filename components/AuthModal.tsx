import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
// FIX: Corrected import path to point to constants/index.ts to avoid conflict with empty constants.ts at root
import { ICONS } from '../constants/index';
// FIX: Corrected import path to point to types/index.ts to avoid conflict with empty types.ts at root
import { User } from '../types/index';

type AuthTab = 'signin' | 'signup' | 'magiclink';

const AuthModalTab: React.FC<{
    label: string;
    tabId: AuthTab;
    activeTab: AuthTab;
    setActiveTab: (tab: AuthTab) => void;
}> = ({ label, tabId, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        role="tab"
        aria-selected={activeTab === tabId}
        className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === tabId ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
        }`}
    >
        {label}
        {activeTab === tabId && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"></div>
        )}
    </button>
);

export const AuthModal: React.FC<{
    onClose?: () => void;
    onLoginSuccess: (user: User) => void;
    isGated?: boolean;
}> = ({ onClose, onLoginSuccess, isGated = false }) => {
    const [activeTab, setActiveTab] = useState<AuthTab>('signin');
    const modalRef = useRef<HTMLDivElement>(null);

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!isGated && modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose?.();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, isGated]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock login/signup logic
        const userEmail = email.split('@')[0];
        const fName = firstName || userEmail.charAt(0).toUpperCase() + userEmail.slice(1);
        const lName = lastName || '';

        onLoginSuccess({
            firstName: fName,
            lastName: lName,
            email: email,
            avatar: null,
            mfaEnabled: false,
            linkedProviders: [],
        });
    };

    const handleGoogleLogin = () => {
         onLoginSuccess({
            firstName: "Demo",
            lastName: "User",
            email: "demo.user@google.com",
            avatar: null,
            mfaEnabled: true,
            linkedProviders: ['google'],
        });
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'signup':
                return (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="flex space-x-4">
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">First Name</label>
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]" required/>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Last Name</label>
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]" required/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]" required/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]" required/>
                        </div>
                        <button type="submit" className="w-full bg-[var(--color-primary)] text-white font-semibold rounded-lg py-3 hover:bg-[var(--color-primary-hover)] transition-colors">Create Account</button>
                    </form>
                );
            case 'magiclink':
                 return (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                         <p className="text-center text-sm text-[var(--color-text-secondary)]">Enter your email to receive a passwordless sign-in link.</p>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]" required/>
                        </div>
                        <button type="submit" className="w-full bg-[var(--color-primary)] text-white font-semibold rounded-lg py-3 hover:bg-[var(--color-primary-hover)] transition-colors">Send Magic Link</button>
                    </form>
                );
            case 'signin':
            default:
                return (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]" required/>
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline">
                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Password</label>
                                <a href="#" className="text-xs font-medium text-[var(--color-primary)] hover:underline">Forgot?</a>
                            </div>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]" required/>
                        </div>
                        <button type="submit" className="w-full bg-[var(--color-primary)] text-white font-semibold rounded-lg py-3 hover:bg-[var(--color-primary-hover)] transition-colors">Sign In</button>
                    </form>
                );
        }
    };


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md">
            <div ref={modalRef} className="bg-[var(--color-surface-2)] w-full max-w-sm rounded-2xl p-8 border border-[var(--color-border)] relative">
                {!isGated && onClose && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white">
                        <Icon path={ICONS.close} className="w-6 h-6" />
                    </button>
                )}
                <h2 className="text-2xl font-bold text-center mb-1">Welcome to Prompta</h2>
                <p className="text-center text-[var(--color-text-secondary)] mb-6 text-sm">Sign in or create an account to begin.</p>
                
                <div className="border-b border-[var(--color-border)] mb-6">
                    <div className="flex justify-center -mb-px" role="tablist">
                        <AuthModalTab label="Sign In" tabId="signin" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <AuthModalTab label="Create Account" tabId="signup" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <AuthModalTab label="Magic Link" tabId="magiclink" activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </div>

                {renderContent()}
                
                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-[var(--color-border)]"></div>
                    <span className="mx-4 text-xs text-[var(--color-text-secondary)]">OR</span>
                    <div className="flex-grow border-t border-[var(--color-border)]"></div>
                </div>

                <div className="space-y-3">
                     <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-[var(--color-surface-3)] hover:bg-[var(--color-surface-1)] border border-[var(--color-border)] transition-colors">
                        <Icon path={ICONS.google} className="w-5 h-5" />
                        <span className="text-sm font-medium">Continue with Google</span>
                    </button>
                     <button className="w-full flex items-center justify-center space-x-3 py-3 rounded-lg bg-white hover:bg-gray-200 border border-gray-700 transition-colors text-black">
                        <Icon path={ICONS.apple} className="w-5 h-5" />
                        <span className="text-sm font-medium">Continue with Apple</span>
                    </button>
                </div>
            </div>
        </div>
    );
};