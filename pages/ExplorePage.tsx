import React from 'react';
import { ICONS, EXPLORE_DATA } from '../constants';
import { Icon } from '../components/Icon';

const ExploreImageCard: React.FC<{ imageUrl: string; prompt: string }> = ({ imageUrl, prompt }) => (
    <div className="group relative overflow-hidden rounded-xl">
        <img src={imageUrl} alt={prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <p className="absolute bottom-0 left-0 p-4 text-sm text-white/90 font-light">{prompt}</p>
    </div>
);

export const ExplorePage: React.FC = () => {
    return (
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
};
