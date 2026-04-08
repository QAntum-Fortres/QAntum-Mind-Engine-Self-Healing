import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Window } from '@tauri-apps/api/window';
import { Minus, Square, X, Search, Settings, Shield, Menu, Power, LayoutGrid } from 'lucide-react';

const SovereignShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appWindow, setAppWindow] = useState<Window | null>(null);
  const [isStartOpen, setIsStartOpen] = useState(false);

  useEffect(() => {
    // Dynamically import Tauri window api to avoid SSR/build issues
    import('@tauri-apps/api/window').then((module) => {
      setAppWindow(module.getCurrentWindow());
    });
  }, []);

  const handleMinimize = () => appWindow?.minimize();
  const handleMaximize = () => appWindow?.toggleMaximize();
  const handleClose = () => appWindow?.close();

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-transparent font-sans text-slate-100 select-none">

      {/* Background Wallpaper Layer with Mica-like tint */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#020c1b]">
        <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
      </div>

      {/* --- TITLEBAR (Draggable) --- */}
      <div
        data-tauri-drag-region
        className="relative z-50 h-10 w-full flex items-center justify-between px-3 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-sm"
      >
        <div className="flex items-center space-x-3 pointer-events-none text-xs font-semibold tracking-wider text-slate-300">
          <Shield size={14} className="text-blue-400" />
          <span>QANTUM SOVEREIGN OS</span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center space-x-1 h-full">
          <button onClick={handleMinimize} className="p-2 h-full hover:bg-white/10 transition-colors flex items-center justify-center rounded-sm">
            <Minus size={16} />
          </button>
          <button onClick={handleMaximize} className="p-2 h-full hover:bg-white/10 transition-colors flex items-center justify-center rounded-sm">
            <Square size={14} />
          </button>
          <button onClick={handleClose} className="p-2 h-full hover:bg-red-500/80 transition-colors flex items-center justify-center rounded-sm group">
            <X size={16} className="group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="relative z-10 flex-1 overflow-auto flex items-center justify-center p-8">
        {/* The Acrylic material for the main window content */}
        <div className="w-full h-full max-w-5xl bg-slate-900/40 backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          {children}
        </div>
      </div>

      {/* --- START MENU (Fluent Design) --- */}
      <AnimatePresence>
        {isStartOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[600px] h-[650px] bg-slate-900/70 backdrop-blur-3xl rounded-xl border border-white/10 shadow-2xl p-6 z-40 flex flex-col"
          >
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Type here to search"
                className="w-full bg-black/20 border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all"
              />
            </div>

            {/* Pinned Apps */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-200">Pinned</h3>
                <button className="text-xs text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 px-2 py-1 rounded transition-colors">All apps &gt;</button>
              </div>

              <div className="grid grid-cols-6 gap-4">
                {[
                  { icon: LayoutGrid, name: "Dashboard" },
                  { icon: Shield, name: "Guardian" },
                  { icon: Settings, name: "Settings" },
                ].map((app, i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-3 hover:bg-white/10 rounded-lg cursor-pointer transition-colors group">
                    <app.icon size={28} className="text-blue-400 mb-2 group-hover:-translate-y-1 transition-transform" />
                    <span className="text-xs text-slate-300">{app.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User & Power */}
            <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold shadow-md">
                  Q
                </div>
                <span className="text-sm font-medium">QANTUM Administrator</span>
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-red-400 transition-colors">
                <Power size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TASKBAR (Windows 11 Centered Style) --- */}
      <div className="relative z-50 h-14 w-full bg-slate-900/60 backdrop-blur-xl border-t border-white/10 shadow-[0_-5px_15px_rgba(0,0,0,0.2)] flex items-center px-4">

        {/* Left Side - Widgets/Weather (mock) */}
        <div className="flex-1 flex items-center">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 hover:bg-white/10 p-2 rounded-md cursor-pointer transition-colors">
             <span>☀️ 24°C</span>
          </div>
        </div>

        {/* Center - Icons */}
        <div className="flex items-center justify-center space-x-2">
          {/* Start Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsStartOpen(!isStartOpen)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${isStartOpen ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
          >
            <Menu size={20} className="text-blue-400" />
          </motion.button>

          {/* Active App Indicator */}
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 relative cursor-pointer">
            <LayoutGrid size={20} className="text-white" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-1 bg-blue-500 rounded-t-full"></div>
          </div>
        </div>

        {/* Right Side - System Tray */}
        <div className="flex-1 flex justify-end items-center space-x-2">
          <div className="flex items-center space-x-3 hover:bg-white/10 px-3 py-1.5 rounded-md cursor-pointer transition-colors">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[11px] font-medium text-slate-200">14:30</span>
              <span className="text-[11px] text-slate-400">14.01.2026</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SovereignShell;
