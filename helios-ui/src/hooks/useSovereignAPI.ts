/**
 * 🌌 SOVEREIGN API BRIDGE
 * Connects the HUD to the Enterprise Backend
 * Supports both OmniCore (8890) and Enterprise Server (8765)
 */

// Primary: Enterprise Server
const ENTERPRISE_BASE = "http://localhost:8765/api";
// Fallback: OmniCore Server
const OMNICORE_BASE = "http://localhost:8890/api";
// Aeterna Node (Rust)
const AETERNA_BASE = "http://localhost:8766";

// Helper to try multiple endpoints
const fetchWithFallback = async (primaryUrl: string, fallbackUrl?: string, options?: RequestInit) => {
    try {
        const response = await fetch(primaryUrl, options);
        if (response.ok) return response;
    } catch {
        // Primary failed, try fallback if available
    }
    
    if (fallbackUrl) {
        const fallbackResponse = await fetch(fallbackUrl, options);
        return fallbackResponse;
    }
    
    throw new Error('All endpoints failed');
};

export const useSovereignAPI = () => {

    const fetchStatus = async () => {
        const response = await fetchWithFallback(
            `${ENTERPRISE_BASE}/status`,
            `${OMNICORE_BASE}/status`
        );
        return await response.json();
    };

    const fetchHealth = async () => {
        const response = await fetch(`${ENTERPRISE_BASE}/health`);
        return await response.json();
    };

    const fetchDepartments = async () => {
        const response = await fetch(`${ENTERPRISE_BASE}/departments`);
        return await response.json();
    };

    const fetchDepartment = async (id: string) => {
        const response = await fetch(`${ENTERPRISE_BASE}/departments/${id}`);
        return await response.json();
    };

    const runRefactor = async () => {
        const response = await fetchWithFallback(
            `${ENTERPRISE_BASE}/scribe/refactor`,
            `${OMNICORE_BASE}/scribe/refactor`,
            { method: 'POST' }
        );
        return await response.json();
    };

    const askOracle = async (prompt: string) => {
        const response = await fetchWithFallback(
            `${ENTERPRISE_BASE}/ask`,
            `${OMNICORE_BASE}/ask`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            }
        );
        return await response.json();
    };

    const generateAssets = async () => {
        const response = await fetchWithFallback(
            `${ENTERPRISE_BASE}/scribe/generate`,
            `${OMNICORE_BASE}/scribe/generate`,
            { method: 'POST' }
        );
        return await response.json();
    };

    // Aeterna Node specific endpoints
    const fetchTelemetry = async () => {
        const response = await fetch(`${AETERNA_BASE}/telemetry`);
        return await response.json();
    };

    const fetchNervousSystem = async () => {
        const response = await fetch(`${AETERNA_BASE}/nervous-system`);
        return await response.json();
    };

    const sendCommand = async (command: string) => {
        const response = await fetch(`${AETERNA_BASE}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        return await response.json();
    };

    const fetchManifesto = async () => {
        const response = await fetch(`${AETERNA_BASE}/manifesto`);
        return await response.json();
    };

    const fetchRealityIntegrity = async () => {
        const response = await fetch(`${AETERNA_BASE}/reality-integrity`);
        return await response.json();
    };

    return { 
        // Core
        fetchStatus, 
        fetchHealth,
        fetchDepartments,
        fetchDepartment,
        runRefactor, 
        askOracle, 
        generateAssets,
        // Aeterna
        fetchTelemetry,
        fetchNervousSystem,
        sendCommand,
        fetchManifesto,
        fetchRealityIntegrity
    };
};
