/**
 * 🌌 SOVEREIGN API BRIDGE
 * Connects the HUD to the Rust Monolith (Axum)
 * Port: 8890
 */

const SOVEREIGN_BASE = "http://localhost:8890/api";

export const useSovereignAPI = () => {

    const fetchStatus = async () => {
        const response = await fetch(`${SOVEREIGN_BASE}/status`);
        return await response.json();
    };

    const runRefactor = async () => {
        const response = await fetch(`${SOVEREIGN_BASE}/scribe/refactor`, {
            method: 'POST'
        });
        return await response.json();
    };

    const askOracle = async (prompt: string) => {
        const response = await fetch(`${SOVEREIGN_BASE}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        return await response.json();
    };

    const generateAssets = async () => {
        const response = await fetch(`${SOVEREIGN_BASE}/scribe/generate`, {
            method: 'POST'
        });
        return await response.json();
    };

    return { fetchStatus, runRefactor, askOracle, generateAssets };
};
