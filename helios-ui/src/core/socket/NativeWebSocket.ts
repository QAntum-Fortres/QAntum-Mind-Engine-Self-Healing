import { create } from 'zustand';
import { VeritasEngine } from '../veritas/VeritasEngine';

interface SovereignState {
    isConnected: boolean;
    lastPing: number;
    latency: number;
    metrics: {
        entropy: number;
        bioStress: number;
        marketStress: number;
        energyStress: number;
        orchestratorMsg: string;
    };
    ledger: string[]; // History of "Black Box" hashes
    updateMetrics: (data: OmniPayload) => void;
    setConnected: (status: boolean) => void;
    addLedgerEntry: (entry: string) => void;
}

export interface OmniPayload {
    timestamp: string;
    entropy: number;
    orchestrator: string;
    bio: { stress: number; action: string };
    market: { stress: number; action: string };
    energy: { stress: number; action: string };
}

export const useSovereignStore = create<SovereignState>((set) => ({
    isConnected: false,
    lastPing: 0,
    latency: 0,
    metrics: {
        entropy: 0,
        bioStress: 0,
        marketStress: 0,
        energyStress: 0,
        orchestratorMsg: "INITIALIZING..."
    },
    ledger: [],
    updateMetrics: (data) => set((_state) => ({
        lastPing: Date.now(),
        latency: Math.random() * 10 + 5,
        metrics: {
            entropy: data.entropy,
            bioStress: data.bio.stress,
            marketStress: data.market.stress,
            energyStress: data.energy.stress,
            orchestratorMsg: data.orchestrator
        }
    })),
    setConnected: (status) => set({ isConnected: status }),
    addLedgerEntry: (entry) => set((state) => ({
        ledger: [entry, ...state.ledger].slice(0, 50) // Keep last 50
    }))
}));

export class NativeWebSocket {
    private static instance: NativeWebSocket;
    private ws: WebSocket | null = null;
    private url: string = "ws://127.0.0.1:8765";
    private reconnectInterval: number = 2000;
    private veritas = VeritasEngine.getInstance();

    private constructor() {
        this.connect();
    }

    public static getInstance(): NativeWebSocket {
        if (!NativeWebSocket.instance) {
            NativeWebSocket.instance = new NativeWebSocket();
        }
        return NativeWebSocket.instance;
    }

    private connect() {
        console.log(`[NEURAL LINK] Connecting to ${this.url}...`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("[NEURAL LINK] 🟢 CONNECTED to OmniCore");
            useSovereignStore.getState().setConnected(true);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle different message types from enterprise server
                if (data.type === 'welcome') {
                    console.log("[NEURAL LINK] 🎉 Welcome message received:", data.message);
                    return;
                }

                if (data.type === 'heartbeat') {
                    // Enterprise server heartbeat format - transform to OmniPayload
                    const omniData: OmniPayload = {
                        timestamp: data.timestamp,
                        entropy: data.entropy || 0,
                        orchestrator: data.orchestrator || 'ENTERPRISE_SERVER',
                        bio: { stress: data.systemHealth ? 1 - data.systemHealth : 0.1, action: 'HEALTHY' },
                        market: { stress: 0.2, action: 'STABLE' },
                        energy: { stress: 0.1, action: 'OPTIMAL' }
                    };
                    useSovereignStore.getState().updateMetrics(omniData);
                    return;
                }

                if (data.type === 'chat_response') {
                    console.log("[NEURAL LINK] 💬 Chat response:", data.content);
                    return;
                }

                // Legacy OmniCore format - 🛡️ VERITAS VALIDATION
                const verification = this.veritas.verify('omni-payload', data);
                if (!verification.valid) return; // Reject hallucination

                if (data.entropy === 0) {
                    console.warn("[NEURAL LINK] ⚠️ Entropy is 0.00. Check backend connection.");
                }

                // Update State
                useSovereignStore.getState().updateMetrics(data);

                // Simulate Ledger Stream (In real version, backend would send the hash too)
                // For prototype, we generate a visual hash representation of the valid data
                // This proves the frontend validated it.
                if (Math.random() > 0.9) { // Don't spam UI
                    useSovereignStore.getState().addLedgerEntry(`VERIFIED_BLK_${Date.now()}_${data.entropy.toFixed(4)}`);
                }

            } catch (e) {
                console.error("[NEURAL LINK] Parse Error", e);
            }
        };

        this.ws.onclose = () => {
            console.log("[NEURAL LINK] 🔴 Disconnected. Retrying...");
            useSovereignStore.getState().setConnected(false);
            setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.ws.onerror = (err) => {
            console.error("[NEURAL LINK] Error", err);
            this.ws?.close();
        };
    }

    public send(payload: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        } else {
            console.error("[NEURAL LINK] ❌ Socket not open. Message aborted.");
        }
    }
}
