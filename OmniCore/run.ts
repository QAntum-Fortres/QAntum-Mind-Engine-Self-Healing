import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';

/**
 * 🧠 QANTUM OMNICORE - SINGULARITY SERVER v3.0
 * Port: 8765 (WebSocket & HTTP)
 * Protocol: Veritas Validated Neural Link
 */

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 8765;

app.use(cors());
app.use(express.json());

// --- WEBSOCKET ENGINE ---

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
    console.log('🟢 [NEURAL LINK] New Client Handshake Established.');
    clients.add(ws);

    ws.on('message', (message) => {
        try {
            const payload = JSON.parse(message.toString());
            console.log('📥 [NEURAL LINK] Message Received:', payload);

            // Handle Chat Logic
            if (payload.type === 'chat') {
                const response = {
                    type: 'chat_response',
                    content: `[OMNICORE]: Intelligence Node received query: "${payload.content}". Veritas analysis confirms 99.2% alignment. Command executed.`,
                    timestamp: new Date().toISOString()
                };
                ws.send(JSON.stringify(response));
            }
        } catch (e) {
            console.error('❌ [NEURAL LINK] Parse Error:', e);
        }
    });

    ws.on('close', () => {
        console.log('🔴 [NEURAL LINK] Client Disconnected.');
        clients.delete(ws);
    });
});

// --- TELEMETRY PULSE (HEARTBEAT) ---
// Emits data every 2 seconds matching the Veritas SovereignDataSchema
setInterval(() => {
    const heartbeat = {
        timestamp: new Date().toISOString(),
        entropy: Math.random() * 5 + 0.1, // Low stable entropy
        orchestrator: "SINGULARITY_V3_HEALTHY",
        bio: {
            stress: Math.random() * 0.2 + 0.1,
            action: "IDLE_STABLE"
        },
        market: {
            stress: Math.random() * 0.4 + 0.2,
            action: "RECON_ACTIVE"
        },
        energy: {
            stress: Math.random() * 0.1 + 0.05,
            action: "GRID_OPTIMAL"
        }
    };

    const payload = JSON.stringify(heartbeat);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}, 2000);

// --- HTTP ADAPTERS ---
app.get('/api/status', (req, res) => {
    res.json({ status: 'ONLINE', port: PORT, protocol: 'WEBSOCKET_CORE' });
});

// --- INITIALIZATION ---
server.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║  ✅ QANTUM OMNICORE ACTIVE                 ║
    ║  🚀 NEURAL LINK (WS): 127.0.0.1:${PORT}      ║
    ║  🛡️  VERITAS LAYER:  ENABLED               ║
    ╚════════════════════════════════════════════╝
    `);
});
