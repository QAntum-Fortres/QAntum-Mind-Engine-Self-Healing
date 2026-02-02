# 🏛️ QAntum Mind Engine - Enterprise API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8765` (development) | `https://api.qantum.app` (production)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Core Endpoints](#core-endpoints)
3. [Department APIs](#department-apis)
4. [Intelligence APIs](#intelligence-apis)
5. [WebSocket API](#websocket-api)
6. [Aeterna Node APIs](#aeterna-node-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

The QAntum Mind Engine uses JWT (JSON Web Tokens) for authentication.

### Obtain Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### Using the Token

Include the token in the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

---

## Core Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Readiness Check

```http
GET /api/ready
```

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### System Status

```http
GET /api/status
```

**Response:**
```json
{
  "status": "ONLINE",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 86400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "departments": {
    "intelligence": { "status": "OPERATIONAL", "efficiency": 0.98 },
    "omega": { "status": "OPERATIONAL", "efficiency": 0.95 },
    "fortress": { "status": "OPERATIONAL", "efficiency": 0.99 },
    "biology": { "status": "OPERATIONAL", "efficiency": 0.92 },
    "physics": { "status": "OPERATIONAL", "efficiency": 0.97 },
    "guardians": { "status": "OPERATIONAL", "efficiency": 0.96 },
    "reality": { "status": "OPERATIONAL", "efficiency": 0.94 },
    "chemistry": { "status": "OPERATIONAL", "efficiency": 0.93 }
  }
}
```

### Metrics (Prometheus Format)

```http
GET /api/metrics
```

**Response:** Plain text in Prometheus exposition format

---

## Department APIs

### List All Departments

```http
GET /api/departments
```

**Response:**
```json
{
  "departments": [
    {
      "id": "intelligence",
      "name": "Intelligence",
      "status": "OPERATIONAL",
      "description": "AI/ML processing"
    }
  ]
}
```

### Get Department Details

```http
GET /api/departments/:id
```

**Parameters:**
- `id` - Department identifier (e.g., `intelligence`, `omega`, `fortress`)

**Response:**
```json
{
  "id": "intelligence",
  "name": "Intelligence",
  "status": "OPERATIONAL",
  "efficiency": 0.98,
  "metrics": {
    "requests": 10523,
    "latency": 45.2,
    "errorRate": 0.002
  },
  "lastUpdate": "2024-01-15T10:30:00.000Z"
}
```

### Execute Department Action

```http
POST /api/departments/:name/action
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "query",
  "params": {
    "query": "Analyze market conditions"
  }
}
```

---

## Intelligence APIs

### Query Intelligence

```http
POST /api/ask
Content-Type: application/json

{
  "prompt": "Analyze the current system status"
}
```

**Response:**
```json
{
  "response": "[Intelligence Node] Processed query. Analysis complete with 98.5% confidence.",
  "confidence": 0.985,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## WebSocket API

### Connection

```
ws://localhost:8765/ws
```

### Message Types

#### Heartbeat (Server → Client)

```json
{
  "type": "heartbeat",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "entropy": 0.05,
  "orchestrator": "SINGULARITY_HEALTHY",
  "systemHealth": 0.98
}
```

#### Chat Request (Client → Server)

```json
{
  "type": "chat",
  "content": "What is the current system status?"
}
```

#### Chat Response (Server → Client)

```json
{
  "type": "chat_response",
  "content": "[QANTUM]: System status is optimal...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Ping/Pong

```json
// Client sends
{ "type": "ping" }

// Server responds
{ "type": "pong", "timestamp": "2024-01-15T10:30:00.000Z" }
```

---

## Aeterna Node APIs

The Aeterna Node is a Rust-based backend providing additional functionality.

**Base URL:** `http://localhost:8766` or via gateway `/aeterna/`

### Telemetry

```http
GET /aeterna/telemetry
```

**Response:**
```json
{
  "cpu_usage": 45.5,
  "gpu_usage": 82.3,
  "entropy": 0.42,
  "temperature": 65.0
}
```

### Nervous System Status

```http
GET /aeterna/nervous-system
```

**Response:**
```json
[
  { "id": "1", "name": "BIOLOGY", "status": "ACTIVE", "pulse_rate": 1.0 },
  { "id": "2", "name": "COGNITION", "status": "IDLE", "pulse_rate": 0.5 },
  { "id": "3", "name": "EVOLUTION", "status": "ACTIVE", "pulse_rate": 1.2 },
  { "id": "4", "name": "SECURITY", "status": "CRITICAL", "pulse_rate": 2.0 }
]
```

### Execute Command

```http
POST /aeterna/command
Content-Type: application/json

{
  "command": "status"
}
```

**Available Commands:** `help`, `status`, `purge`

### Manifesto

```http
GET /aeterna/manifesto
```

**Response:**
```json
{
  "title": "AETERNA 2200: ARCHITECTURE OF THE POST-MATTER ERA",
  "classification": "OMEGA-RESTRICTED",
  "pillars": [
    "TRANSPORT: Ontological Shift",
    "BIOLOGY: Noetic Membrane",
    "ENERGY: Zero-Point Entropy Inversion",
    "QA: Architecture of Truth",
    "SOCIOLOGY: Anticipatory Empathy Grid"
  ]
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limiting

### Default Limits

| Endpoint Type | Limit |
|---------------|-------|
| API Endpoints | 100 requests/minute |
| Authentication | 10 requests/minute |
| WebSocket | Unlimited (connection-based) |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705315800
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8765',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Get status
const status = await client.get('/api/status');

// Query intelligence
const response = await client.post('/api/ask', {
  prompt: 'Analyze system health',
});
```

### WebSocket

```typescript
const ws = new WebSocket('ws://localhost:8765/ws');

ws.onopen = () => {
  console.log('Connected to QAntum');
  ws.send(JSON.stringify({ type: 'chat', content: 'Hello!' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### cURL

```bash
# Health check
curl http://localhost:8765/api/health

# Get status
curl http://localhost:8765/api/status

# Query intelligence
curl -X POST http://localhost:8765/api/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "System analysis"}'

# With authentication
curl http://localhost:8765/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**For more information, visit our [GitHub Repository](https://github.com/QAntum-Fortres/QAntum-Mind-Engine-Self-Healing)**
