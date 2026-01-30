import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const MisterMindTerminal = () => {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState<string[]>(['[SYSTEM]: READY FOR SOVEREIGN INPUT...']);
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const executeCommand = async () => {
        if (!input.trim()) return;

        const currentInput = input;
        setLogs(prev => [...prev, `> ${currentInput}`]);
        setInput('');
        setIsThinking(true);
        setLogs(prev => [...prev, `[AGENT]: THINKING...`]);

        try {
            // ПРАТКА КЪМ RUST ЯДРОТО
            let result: string;
            if (currentInput.toLowerCase().startsWith('probe ')) {
                const query = currentInput.substring(6);
                result = await invoke('process_probe', { input: query });
            } else {
                result = await invoke('process_mind_command', { input: currentInput });
            }
            setIsThinking(false);
            setLogs(prev => [...prev, `[MISTER MIND]: ${result}`]);
        } catch (err) {
            setIsThinking(false);
            setLogs(prev => [...prev, `[ERROR]: COLLAPSE DETECTED - ${err}`]);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="flex flex-col h-full bg-black/40 p-4 font-mono text-cyan-400">
            {/* LOG AREA */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto mb-4 text-xs space-y-1 scrollbar-hide"
            >
                {logs.map((log, i) => (
                    <div key={i} className={
                        log.startsWith('>') ? 'text-magenta-400' :
                            log.includes('THINKING') ? 'text-cyan-200 animate-pulse' :
                                'text-cyan-400'
                    }>
                        {log}
                    </div>
                ))}
            </div>

            {/* INPUT AREA */}
            <div className="flex gap-4 border-t border-cyan-900 pt-4">
                <input
                    autoFocus
                    className="flex-1 bg-transparent outline-none border-b border-cyan-800 focus:border-cyan-400 transition-colors p-2 text-white"
                    placeholder="ENTER SOVEREIGN COMMAND..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                    disabled={isThinking}
                />
                <button
                    onClick={executeCommand}
                    disabled={isThinking}
                    className={`px-6 py-2 border border-cyan-400 transition-all duration-300 font-bold tracking-widest uppercase text-xs ${isThinking ? 'opacity-50 cursor-wait' : 'hover:bg-cyan-400 hover:text-black glow-button'}`}
                >
                    {isThinking ? 'THINKING...' : 'EXECUTE'}
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .glow-button {
                    box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
                    text-shadow: 0 0 5px rgba(0, 243, 255, 0.5);
                }
                .glow-button:hover {
                    box-shadow: 0 0 20px rgba(0, 243, 255, 0.8);
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                `
            }} />
        </div>
    );
};
