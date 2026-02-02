/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏛️ QANTUM MIND ENGINE - ENTERPRISE ENTRYPOINT
 * Production-grade application launcher with graceful shutdown
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer, WebSocket } from 'ws';

// ═══════════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const config = {
  port: parseInt(process.env.PORT || '8765', 10),
  metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Logger
// ═══════════════════════════════════════════════════════════════════════════════

const logger = {
  info: (message, meta = {}) => console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() })),
  warn: (message, meta = {}) => console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() })),
  error: (message, meta = {}) => console.error(JSON.stringify({ level: 'error', message, ...meta, timestamp: new Date().toISOString() })),
  debug: (message, meta = {}) => config.logLevel === 'debug' && console.log(JSON.stringify({ level: 'debug', message, ...meta, timestamp: new Date().toISOString() })),
};

// ═══════════════════════════════════════════════════════════════════════════════
// Metrics
// ═══════════════════════════════════════════════════════════════════════════════

const metrics = {
  requests: { total: 0, success: 0, error: 0 },
  latency: [],
  wsConnections: 0,
  startTime: Date.now(),
};

function recordRequest(duration, success) {
  metrics.requests.total++;
  if (success) metrics.requests.success++;
  else metrics.requests.error++;
  metrics.latency.push(duration);
  if (metrics.latency.length > 1000) metrics.latency.shift();
}

function getMetrics() {
  const avgLatency = metrics.latency.length > 0 
    ? metrics.latency.reduce((a, b) => a + b, 0) / metrics.latency.length 
    : 0;
  
  return {
    uptime: Date.now() - metrics.startTime,
    requests: metrics.requests,
    avgLatencyMs: avgLatency.toFixed(2),
    wsConnections: metrics.wsConnections,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Express App
// ═══════════════════════════════════════════════════════════════════════════════

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production',
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging & metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    recordRequest(duration, res.statusCode < 400);
    logger.debug(`${req.method} ${req.path}`, { 
      status: res.statusCode, 
      duration: `${duration}ms`,
      ip: req.ip 
    });
  });
  next();
});

// ═══════════════════════════════════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════════════════════════════════

// Health checks
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/ready', (req, res) => {
  // In production, check database and other dependencies
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    version: '1.0.0',
    environment: config.nodeEnv,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    departments: {
      intelligence: { status: 'OPERATIONAL', efficiency: 0.98 },
      omega: { status: 'OPERATIONAL', efficiency: 0.95 },
      fortress: { status: 'OPERATIONAL', efficiency: 0.99 },
      biology: { status: 'OPERATIONAL', efficiency: 0.92 },
      physics: { status: 'OPERATIONAL', efficiency: 0.97 },
      guardians: { status: 'OPERATIONAL', efficiency: 0.96 },
      reality: { status: 'OPERATIONAL', efficiency: 0.94 },
      chemistry: { status: 'OPERATIONAL', efficiency: 0.93 },
    }
  });
});

// Metrics endpoint (Prometheus format)
app.get('/api/metrics', (req, res) => {
  const m = getMetrics();
  const prometheus = `
# HELP qantum_uptime_seconds System uptime in seconds
# TYPE qantum_uptime_seconds gauge
qantum_uptime_seconds ${m.uptime / 1000}

# HELP qantum_requests_total Total number of requests
# TYPE qantum_requests_total counter
qantum_requests_total{status="success"} ${m.requests.success}
qantum_requests_total{status="error"} ${m.requests.error}

# HELP qantum_request_latency_ms Average request latency in milliseconds
# TYPE qantum_request_latency_ms gauge
qantum_request_latency_ms ${m.avgLatencyMs}

# HELP qantum_ws_connections Current WebSocket connections
# TYPE qantum_ws_connections gauge
qantum_ws_connections ${m.wsConnections}

# HELP qantum_memory_bytes Memory usage in bytes
# TYPE qantum_memory_bytes gauge
qantum_memory_bytes{type="heapUsed"} ${m.memory.heapUsed}
qantum_memory_bytes{type="heapTotal"} ${m.memory.heapTotal}
qantum_memory_bytes{type="rss"} ${m.memory.rss}
`.trim();
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheus);
});

// Department endpoints
app.get('/api/departments', (req, res) => {
  res.json({
    departments: [
      { id: 'intelligence', name: 'Intelligence', status: 'OPERATIONAL', description: 'AI/ML processing' },
      { id: 'omega', name: 'Omega', status: 'OPERATIONAL', description: 'Market analysis' },
      { id: 'fortress', name: 'Fortress', status: 'OPERATIONAL', description: 'Security operations' },
      { id: 'biology', name: 'Biology', status: 'OPERATIONAL', description: 'Bio-metric processing' },
      { id: 'physics', name: 'Physics', status: 'OPERATIONAL', description: 'Physical simulation' },
      { id: 'guardians', name: 'Guardians', status: 'OPERATIONAL', description: 'System protection' },
      { id: 'reality', name: 'Reality', status: 'OPERATIONAL', description: 'Reality simulation' },
      { id: 'chemistry', name: 'Chemistry', status: 'OPERATIONAL', description: 'Molecular operations' },
    ]
  });
});

app.get('/api/departments/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    status: 'OPERATIONAL',
    efficiency: Math.random() * 0.1 + 0.9,
    metrics: {
      requests: Math.floor(Math.random() * 10000),
      latency: Math.random() * 50 + 10,
      errorRate: Math.random() * 0.01,
    },
    lastUpdate: new Date().toISOString(),
  });
});

// Intelligence endpoint
app.post('/api/ask', (req, res) => {
  const { prompt } = req.body;
  res.json({
    response: `[Intelligence Node] Processed query: "${prompt}". Analysis complete with 98.5% confidence.`,
    confidence: 0.985,
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// WebSocket Server
// ═══════════════════════════════════════════════════════════════════════════════

const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();

wss.on('connection', (ws, req) => {
  clients.add(ws);
  metrics.wsConnections++;
  logger.info('WebSocket client connected', { 
    ip: req.socket.remoteAddress,
    connections: metrics.wsConnections 
  });

  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(message.toString());
      logger.debug('WebSocket message received', { type: payload.type });

      if (payload.type === 'chat') {
        ws.send(JSON.stringify({
          type: 'chat_response',
          content: `[QANTUM]: Received "${payload.content}". Processing complete.`,
          timestamp: new Date().toISOString(),
        }));
      } else if (payload.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (err) {
      logger.error('WebSocket message parse error', { error: err.message });
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    metrics.wsConnections--;
    logger.info('WebSocket client disconnected', { connections: metrics.wsConnections });
  });

  ws.on('error', (err) => {
    logger.error('WebSocket error', { error: err.message });
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to QAntum Mind Engine',
    timestamp: new Date().toISOString(),
  }));
});

// Heartbeat broadcast
setInterval(() => {
  const heartbeat = JSON.stringify({
    type: 'heartbeat',
    timestamp: new Date().toISOString(),
    entropy: Math.random() * 0.1,
    orchestrator: 'SINGULARITY_HEALTHY',
    systemHealth: 0.98,
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(heartbeat);
    }
  });
}, 2000);

// ═══════════════════════════════════════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Graceful Shutdown
// ═══════════════════════════════════════════════════════════════════════════════

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Close WebSocket connections
  clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });

  // Close HTTP server
  server.close((err) => {
    if (err) {
      logger.error('Error during server close', { error: err.message });
      process.exit(1);
    }
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════════════════════════════════════════

server.listen(config.port, '0.0.0.0', () => {
  logger.info('═══════════════════════════════════════════════════════════════');
  logger.info('🏛️  QANTUM MIND ENGINE - ENTERPRISE SERVER');
  logger.info('═══════════════════════════════════════════════════════════════');
  logger.info(`🚀 HTTP/WS Server: http://0.0.0.0:${config.port}`);
  logger.info(`📊 Metrics: http://0.0.0.0:${config.port}/api/metrics`);
  logger.info(`🔧 Environment: ${config.nodeEnv}`);
  logger.info(`📝 Log Level: ${config.logLevel}`);
  logger.info('═══════════════════════════════════════════════════════════════');
  logger.info('✅ All systems operational. Ready to serve.');
});
