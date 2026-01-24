import React from 'react';
import { Canvas } from '@react-three/fiber';
import { SingularityField } from '../HeliosUI'; // Corrected import path

export const NeuralMeshCanvas: React.FC = () => {
    return (
        <div className="w-full h-full relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/20 to-transparent pointer-events-none z-10" />
            <Canvas camera={{ position: [0, 20, 50], fov: 60 }} dpr={[1, 2]}>
                <ambientLight intensity={0.5} />
                <SingularityField />
            </Canvas>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
            </div>
        </div>
    );
};
