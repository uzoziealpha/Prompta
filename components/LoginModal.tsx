import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { ICONS } from '../constants';

export const LoginModal: React.FC<{
    onClose: () => void;
    onEmailLogin: (email: string) => void;
    onGoogleLogin: () => void;
}> = ({ onClose, onEmailLogin, onGoogleLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    // Close modal on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) { // Simple validation
            onEmailLogin(email);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md">
            <div ref={modalRef} className="bg-[var(--color-surface-2)] w-full max-w-sm rounded-2xl p-8 border border-[var(--color-border)] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white">
                    <Icon path={ICONS.close} className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-center mb-1">Welcome Back</h2>
                <p className="text-center text-[var(--color-text-secondary)] mb-6">Sign in to continue your vision.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1 w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-[var(--color-primary)] text-white font-semibold rounded-lg py-3 hover:bg-[var(--color-primary-hover)] transition-colors">
                        Sign In
                    </button>
                </form>
                
                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-[var(--color-border)]"></div>
                    <span className="mx-4 text-xs text-[var(--color-text-secondary)]">OR</span>
                    <div className="flex-grow border-t border-[var(--color-border)]"></div>
                </div>

                <div className="space-y-3">
                     <button onClick={onGoogleLogin} className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-[var(--color-surface-3)] hover:bg-[var(--color-surface-1)] border border-[var(--color-border)] transition-colors">
                        <Icon path={ICONS.google} className="w-5 h-5" />
                        <span className="text-sm font-medium">Sign in with Google</span>
                    </button>
                     <button onClick={onGoogleLogin} className="w-full flex items-center justify-center space-x-3 py-3 rounded-lg bg-white hover:bg-gray-200 border border-gray-700 transition-colors text-black">
                        <Icon path={ICONS.apple} className="w-5 h-5" />
                        <span className="text-sm font-medium">Sign in with Apple</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
