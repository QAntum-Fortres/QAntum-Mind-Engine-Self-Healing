import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className }) => {
    return (
        <div className={cn(
            "bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-lg p-4 shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]",
            className
        )}>
            {children}
        </div>
    );
};
