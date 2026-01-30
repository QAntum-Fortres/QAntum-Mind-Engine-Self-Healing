import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const MetricsChart = () => {
    const [data, setData] = useState({
        total_ram: '0 GB',
        used_ram: '0 GB',
        cpu_usage: '0%',
        ram_percentage: 0,
        cpu_percentage: 0
    });

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const metrics: any = await invoke('get_hardware_metrics');
                setData(metrics);
            } catch (e) {
                console.error("Telemetry Link Failed:", e);
            }
        }, 1000); // 1Hz Refresh Rate for Real-time pulse
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 p-2">
            {/* RAM METRIC */}
            <div className="group">
                <div className="flex justify-between items-end mb-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-50">Physical Memory</p>
                    <p className="text-[10px] text-cyan-500 animate-pulse">LIVE</p>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{data.used_ram} <span className="text-sm opacity-50 font-normal">/ {data.total_ram}</span></p>
                <div className="w-full h-1 bg-cyan-900/30 mt-2 overflow-hidden rounded-full">
                    <div
                        className="h-full bg-cyan-400 transition-all duration-500 ease-out shadow-[0_0_10px_#00f3ff]"
                        style={{ width: `${data.ram_percentage}%` }}
                    ></div>
                </div>
            </div>

            {/* CPU METRIC */}
            <div className="group">
                <p className="text-[10px] uppercase tracking-widest opacity-50">Neural Load (CPU)</p>
                <p className="text-2xl font-bold text-magenta-400 tracking-tight">{data.cpu_usage}</p>
                <div className="w-full h-1 bg-magenta-900/30 mt-2 overflow-hidden rounded-full">
                    <div
                        className="h-full bg-magenta-500 transition-all duration-500 ease-out shadow-[0_0_10px_#ff00ff]"
                        style={{ width: `${data.cpu_percentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
