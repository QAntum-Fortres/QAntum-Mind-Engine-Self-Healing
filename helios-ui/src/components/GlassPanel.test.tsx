import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassPanel } from './GlassPanel';

describe('GlassPanel', () => {
    it('renders children correctly', () => {
        render(
            <GlassPanel>
                <div data-testid="child">Test Content</div>
            </GlassPanel>
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies default glass panel classes', () => {
        const { container } = render(
            <GlassPanel>
                Content
            </GlassPanel>
        );

        const panel = container.firstChild;
        expect(panel).toHaveClass('bg-black/40', 'backdrop-blur-md', 'border', 'border-cyan-500/20', 'rounded-lg', 'p-4');
    });

    it('merges custom className with default classes', () => {
        const { container } = render(
            <GlassPanel className="custom-class mt-4">
                Content
            </GlassPanel>
        );

        const panel = container.firstChild;
        expect(panel).toHaveClass('custom-class', 'mt-4', 'bg-black/40', 'backdrop-blur-md');
    });
});
