import React from 'react';
// FIX: Corrected import path to point to types/index.ts to avoid conflict with empty types.ts at root
import { Theme } from '../types/index';

export const DynamicBackground: React.FC<{ theme: Theme }> = ({ theme }) => {
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