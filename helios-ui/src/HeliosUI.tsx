import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { listen } from '@tauri-apps/api/event';
import { SingularityShader } from './SingularityShader';

const QUANTUM_BATCH = 1000000;

export const SingularityField = () => {
    const meshRef = useRef<THREE.Points>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const [evolution, setEvolution] = useState(0);

    // Слушаме за еволюционния импулс от Rust
    useEffect(() => {
        const unlisten = listen('evolution-pulse', () => {
            console.log("🧬 EVOLUTION PULSE RECEIVED");
            setEvolution(prev => Math.min(prev + 0.2, 1.0));
        });
        return () => { unlisten.then(f => f()); };
    }, []);

    const { positions, resonance } = useMemo(() => {
        const posArr = new Float32Array(QUANTUM_BATCH * 3);
        const resArr = new Float32Array(QUANTUM_BATCH);
        for (let i = 0; i < QUANTUM_BATCH; i++) {
            posArr[i * 3] = 0;
            posArr[i * 3 + 1] = 0;
            posArr[i * 3 + 2] = 0;
            resArr[i] = Math.random() > 0.999 ? 1.0 : 0.0;
        }
        return { positions: posArr, resonance: resArr };
    }, []);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
            // Плавно интерполираме към новата стойност на еволюцията
            materialRef.current.uniforms.uEvolution.value = THREE.MathUtils.lerp(
                materialRef.current.uniforms.uEvolution.value,
                evolution,
                0.05
            );
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={QUANTUM_BATCH}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-aResonance"
                    count={QUANTUM_BATCH}
                    array={resonance}
                    itemSize={1}
                    args={[resonance, 1]}
                />
            </bufferGeometry>
            <shaderMaterial
                ref={materialRef}
                args={[SingularityShader]}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export const HeliosUI = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            {/* 3D Canvas */}
            <Canvas camera={{ position: [0, 20, 50], fov: 60 }} style={{ background: '#000' }}>
                <SingularityField />
            </Canvas>
        </div>
    );
};
