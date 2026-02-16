import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Text, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Activity, Cpu, Terminal, Zap, Skull } from 'lucide-react';
import axios from 'axios';

// --- CONFIGURATION ---
const REFRESH_RATE = 1000; // ms
const API_URL = '/api';

// --- TYPES ---
interface Telemetry {
  cpu_usage: number;
  gpu_usage: number;
  entropy: number;
  temperature: number;
}

interface ModuleState {
  id: string;
  name: string;
  status: 'ACTIVE' | 'IDLE' | 'CRITICAL';
  pulse_rate: number;
}

// --- SHADERS ---
const VOID_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const VOID_FRAGMENT_SHADER = `
uniform float time;
uniform float entropy;
varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 st = vUv * 3.0;
    // Organic movement based on time and entropy
    float n = noise(st + time * 0.1);

    // The Void Color Palette (Dark Teal/Black)
    vec3 color = vec3(0.0, 0.05, 0.05);

    // Add "Noetic Bridge" resonance lines
    float line = step(0.98, sin(st.y * 50.0 + time * 2.0 + n * 5.0));
    color += vec3(0.0, 1.0, 0.41) * line * entropy; // Matrix Green lines

    // Violently pulse if entropy is high
    if (entropy > 0.8) {
        color.r += sin(time * 20.0) * 0.1;
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

// --- COMPONENTS ---

// 1. THE VOID (Background Layer)
const TheVoid = ({ entropy }: { entropy: number }) => {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      entropy: { value: 0.5 },
    }),
    []
  );

  useFrame((state) => {
    if (mesh.current) {
      uniforms.time.value = state.clock.getElapsedTime();
      uniforms.entropy.value = THREE.MathUtils.lerp(uniforms.entropy.value, entropy, 0.05);
    }
  });

  return (
    <mesh ref={mesh} scale={[100, 100, 1]} position={[0, 0, -50]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={VOID_VERTEX_SHADER}
        fragmentShader={VOID_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
};

// 2. THE NERVOUS SYSTEM (Visualization of Modules)
const NervousSystem = ({ modules }: { modules: ModuleState[] }) => {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
        group.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={group}>
      <Stars radius={30} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      {modules.map((mod, i) => {
        const angle = (i / modules.length) * Math.PI * 2;
        const radius = 10;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
            <ModuleEntity key={mod.id} position={[x, 0, z]} data={mod} />
        );
      })}
    </group>
  );
};

const ModuleEntity = ({ position, data }: { position: [number, number, number], data: ModuleState }) => {
    const mesh = useRef<THREE.Mesh>(null);
    const textRef = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (mesh.current) {
            // Pulse logic
            const t = state.clock.getElapsedTime();
            const pulseSpeed = data.status === 'ACTIVE' ? 5 : 1;
            const scale = 1 + Math.sin(t * pulseSpeed) * 0.1;
            mesh.current.scale.set(scale, scale, scale);

            // Color shift based on status
            const color = data.status === 'CRITICAL'
                ? new THREE.Color('#FF0055') // Red
                : data.status === 'ACTIVE'
                    ? new THREE.Color('#00FF41') // Matrix Green
                    : new THREE.Color('#00F3FF'); // Cyan (Idle)

            (mesh.current.material as THREE.MeshStandardMaterial).color.lerp(color, 0.1);
            (mesh.current.material as THREE.MeshStandardMaterial).emissive.lerp(color, 0.1);
        }
        if (textRef.current) {
            textRef.current.lookAt(state.camera.position);
        }
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh
                    ref={mesh}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                >
                    <icosahedronGeometry args={[1, 1]} />
                    <meshStandardMaterial wireframe={!hovered} transparent opacity={0.8} />
                </mesh>
            </Float>
            <group ref={textRef} position={[0, 1.5, 0]}>
                <Text
                    fontSize={0.5}
                    color={data.status === 'CRITICAL' ? '#FF0055' : '#FFFFFF'}
                    anchorX="center"
                    anchorY="middle"
                >
                    {data.name}
                </Text>
                <Text
                    position={[0, -0.4, 0]}
                    fontSize={0.25}
                    color="#888888"
                >
                    [{data.status}]
                </Text>
            </group>
            {/* Connection line to center */}
            <line>
                <bufferGeometry>
                    <float32BufferAttribute
                        attach="attributes-position"
                        args={[new Float32Array([0, 0, 0, -position[0], -position[1], -position[2]]), 3]}
                        count={2}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#004411" transparent opacity={0.3} />
            </line>
        </group>
    );
};

// 3. THE COMMAND LOGOS (Terminal)
const CommandLogos = () => {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState<string[]>([
        "> SYSTEM INITIALIZED...",
        "> NOETIC BRIDGE CONNECTED [0x4121]",
        "> AWAITING SOVEREIGN COMMAND..."
    ]);
    const bottomRef = useRef<HTMLDivElement>(null);

    const executeCommand = async (cmd: string) => {
        setLogs(prev => [...prev, `> ${cmd}`]);
        try {
             // Mocking execution or calling API
             if (cmd === 'purge') {
                 setLogs(prev => [...prev, ">> PURGING ENTROPY BUFFERS...", ">> DONE."]);
             } else if (cmd === 'evolve') {
                 setLogs(prev => [...prev, ">> INITIATING EVOLUTIONARY CYCLE...", ">> GEN 420 STARTED."]);
             } else {
                 const res = await axios.post(`${API_URL}/command`, { command: cmd });
                 setLogs(prev => [...prev, `>> ${res.data.response}`]);
             }
        } catch (e) {
             setLogs(prev => [...prev, ">> EXECUTION FAILURE: NETWORK UNREACHABLE"]);
        }
        setInput('');
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <motion.div
            className="fixed bottom-10 left-10 w-1/3 h-64 bg-black/80 border-2 border-green-500 font-mono text-green-500 p-4 overflow-hidden shadow-[0_0_20px_rgba(0,255,65,0.2)]"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
        >
            <div className="flex items-center gap-2 mb-2 border-b border-green-900 pb-1">
                <Terminal size={16} />
                <span className="font-bold">COMMAND_LOGOS v3.0</span>
            </div>
            <div className="h-40 overflow-y-auto mb-2 text-sm scrollbar-hide">
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="flex gap-2">
                <span className="animate-pulse">{'>'}</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeCommand(input)}
                    className="bg-transparent border-none outline-none w-full text-green-400 font-bold"
                    placeholder="ENTER MODAL LOGIC..."
                    autoFocus
                />
            </div>
        </motion.div>
    );
};

// 4. THE TELEMETRY ARRAY (Stats)
const TelemetryArray = ({ data }: { data: Telemetry }) => {
    return (
        <motion.div
            className="fixed top-10 right-10 w-64 bg-black/80 border-2 border-cyan-500/50 p-4 text-cyan-500 font-mono shadow-[0_0_20px_rgba(0,243,255,0.2)]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
        >
             <div className="flex items-center gap-2 mb-4 border-b border-cyan-900 pb-2">
                <Activity size={16} />
                <span className="font-bold">SYSTEM_TELEMETRY</span>
            </div>

            <StatRow label="CPU [RYZEN]" value={data.cpu_usage} icon={<Cpu size={14} />} color="text-cyan-400" />
            <StatRow label="GPU [RTX]" value={data.gpu_usage} icon={<Zap size={14} />} color="text-purple-400" />
            <StatRow label="ENTROPY" value={data.entropy} icon={<Skull size={14} />} color="text-red-500" />

            <div className="mt-4 pt-2 border-t border-cyan-900">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>TEMP</span>
                    <span>{data.temperature}°C</span>
                </div>
                <div className="w-full h-1 bg-gray-900">
                    <div
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${Math.min(data.temperature, 100)}%` }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

const StatRow = ({ label, value, icon, color }: any) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs mb-1 items-center">
            <div className="flex gap-2 items-center">
                {icon}
                <span>{label}</span>
            </div>
            <span className="font-bold">{value.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-900 relative overflow-hidden">
            <motion.div
                className={`h-full ${color.replace('text-', 'bg-')} opacity-80`}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ type: 'spring', damping: 20 }}
            />
            {/* Scanline effect on bar */}
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 animate-pulse" />
        </div>
    </div>
);

// --- MAIN SINGULARITY ---
const Singularity = () => {
    // State
    const [telemetry, setTelemetry] = useState<Telemetry>({ cpu_usage: 0, gpu_usage: 0, entropy: 0, temperature: 40 });
    const [modules, setModules] = useState<ModuleState[]>([
        { id: '1', name: 'BIOLOGY', status: 'ACTIVE', pulse_rate: 1 },
        { id: '2', name: 'COGNITION', status: 'IDLE', pulse_rate: 0.5 },
        { id: '3', name: 'EVOLUTION', status: 'ACTIVE', pulse_rate: 1.2 },
        { id: '4', name: 'SECURITY', status: 'CRITICAL', pulse_rate: 2.0 },
    ]);

    // Data Fetching Loop
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                // Try to fetch real data
                // const res = await axios.get(`${API_URL}/telemetry`);
                // setTelemetry(res.data);

                // Fallback / Simulation for "God Mode" Demo
                setTelemetry(prev => ({
                    cpu_usage: Math.min(100, Math.max(0, prev.cpu_usage + (Math.random() - 0.5) * 10)),
                    gpu_usage: Math.min(100, Math.max(0, prev.gpu_usage + (Math.random() - 0.5) * 20)),
                    entropy: Math.random(),
                    temperature: 40 + Math.random() * 40
                }));

                // Simulate module fluctuation
                setModules(prev => prev.map(m => ({
                    ...m,
                    status: Math.random() > 0.9 ? (m.status === 'ACTIVE' ? 'IDLE' : 'ACTIVE') : m.status
                })));

            } catch (e) {
                console.error("Noetic Connection Lost");
            }
        }, REFRESH_RATE);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-screen relative bg-black">
            {/* 3D SCENE */}
            <Canvas camera={{ position: [0, 10, 30], fov: 60 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00FF41" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00F3FF" />

                <Suspense fallback={<Html center>LOADING SINGULARITY...</Html>}>
                    <TheVoid entropy={telemetry.entropy} />
                    <NervousSystem modules={modules} />
                </Suspense>
            </Canvas>

            {/* UI OVERLAYS */}
            <CommandLogos />
            <TelemetryArray data={telemetry} />

            {/* HEADERS */}
            <div className="fixed top-5 left-10 pointer-events-none">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-cyan-500 tracking-widest drop-shadow-[0_0_10px_rgba(0,255,65,0.8)]">
                    QANTUM-JULES v2.0
                </h1>
                <h2 className="text-sm text-gray-500 tracking-[0.5em] mt-1">GOD_MODE // ACTIVE</h2>
            </div>

            <div className="fixed bottom-5 right-10 pointer-events-none text-right">
                <div className="flex items-center gap-2 justify-end text-green-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span>NOETIC BRIDGE: STABLE</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                    0x4121 :: {telemetry.entropy.toFixed(6)}
                </div>
            </div>
        </div>
    );
};

export default Singularity;
