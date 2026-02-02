# 🏛️ QAntum Mind Engine - Deployment Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Configuration](#configuration)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/QAntum-Fortres/QAntum-Mind-Engine-Self-Healing.git
cd QAntum-Mind-Engine-Self-Healing

# Copy environment configuration
cp .env.example .env

# Start with Docker Compose
./start.sh start prod

# Or manually
docker-compose up -d
```

Access the services:
- **API Gateway:** http://localhost:80
- **QAntum Core:** http://localhost:8765
- **Grafana:** http://localhost:3001 (admin/qantum_admin)
- **Prometheus:** http://localhost:9091

---

## Prerequisites

### Required
- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Node.js** 18+ (for development)
- **Rust** 1.75+ (for Aeterna Node development)

### Recommended
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ disk space
- Linux/macOS (Windows with WSL2)

---

## Development Setup

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# OmniCore backend
cd OmniCore && npm install && cd ..

# Helios UI (frontend)
cd helios-ui && npm install && cd ..

# Enterprise module
cd enterprise && npm install && cd ..
```

### 2. Start Development Services

```bash
# Start databases only
docker-compose up -d postgres redis

# Run backend in development mode
cd enterprise && npm run dev

# In another terminal, run frontend
cd helios-ui && npm run dev
```

### 3. Development URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:8765
- WebSocket: ws://localhost:8765/ws

---

## Production Deployment

### Environment Configuration

1. Copy and configure environment:
```bash
cp .env.example .env
```

2. Update critical settings in `.env`:
```env
NODE_ENV=production
JWT_SECRET=your-secure-random-secret-minimum-32-characters
GRAFANA_PASSWORD=secure-grafana-password
RABBITMQ_PASSWORD=secure-rabbitmq-password
```

### Security Checklist

- [ ] Change all default passwords
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS origins
- [ ] Set up log rotation
- [ ] Enable database backups

---

## Docker Deployment

### Build and Run

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f qantum-core

# Stop services
docker-compose down
```

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      NGINX Gateway (80/443)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ QAntum Core │  │Aeterna Node │  │   Frontend  │         │
│  │    :8765    │  │    :8766    │  │   (static)  │         │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘         │
├─────────┼────────────────┼──────────────────────────────────┤
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │    Redis    │  │  RabbitMQ   │         │
│  │    :5432    │  │    :6379    │  │    :5672    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ Prometheus  │  │   Grafana   │      Monitoring          │
│  │    :9091    │  │    :3001    │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| qantum-core | 2 | 2GB | 1GB |
| aeterna-node | 1 | 512MB | 500MB |
| postgres | 1 | 1GB | 10GB |
| redis | 0.5 | 256MB | 1GB |
| nginx | 0.5 | 128MB | 100MB |
| prometheus | 0.5 | 512MB | 5GB |
| grafana | 0.5 | 256MB | 1GB |

---

## Kubernetes Deployment

### Basic Deployment

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: qantum
```

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qantum-core
  namespace: qantum
spec:
  replicas: 3
  selector:
    matchLabels:
      app: qantum-core
  template:
    metadata:
      labels:
        app: qantum-core
    spec:
      containers:
      - name: qantum-core
        image: ghcr.io/qantum-fortres/qantum-mind-engine:latest
        ports:
        - containerPort: 8765
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: qantum-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "2"
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 8765
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8765
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Helm Chart (Coming Soon)

```bash
helm repo add qantum https://charts.qantum.app
helm install qantum-mind qantum/qantum-mind-engine
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | HTTP server port | `8765` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |

### Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `FEATURE_AI_ENABLED` | Enable AI features | `true` |
| `FEATURE_WEBSOCKET_ENABLED` | Enable WebSocket | `true` |
| `FEATURE_METRICS_ENABLED` | Enable Prometheus metrics | `true` |

---

## Monitoring

### Grafana Dashboards

Access Grafana at http://localhost:3001

Pre-configured dashboards:
- **QAntum Main** - Overall system health
- **Department Status** - Individual department metrics
- **API Performance** - Request latency and throughput

### Prometheus Metrics

Available metrics:
- `qantum_uptime_seconds` - System uptime
- `qantum_requests_total` - Total HTTP requests
- `qantum_request_latency_ms` - Request latency
- `qantum_ws_connections` - WebSocket connections
- `qantum_memory_bytes` - Memory usage

### Health Endpoints

```bash
# Liveness probe
curl http://localhost:8765/api/health

# Readiness probe
curl http://localhost:8765/api/ready

# Full status
curl http://localhost:8765/api/status
```

---

## Troubleshooting

### Common Issues

#### Container fails to start

```bash
# Check logs
docker-compose logs qantum-core

# Check container status
docker-compose ps

# Restart service
docker-compose restart qantum-core
```

#### Database connection errors

```bash
# Check PostgreSQL is running
docker-compose exec postgres pg_isready

# Check connection string
echo $DATABASE_URL

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### Port conflicts

```bash
# Find process using port
lsof -i :8765

# Use different port
PORT=8766 docker-compose up -d
```

### Logs Location

| Service | Log Path |
|---------|----------|
| qantum-core | `/app/logs/` |
| nginx | `/var/log/nginx/` |
| postgres | `docker-compose logs postgres` |

### Support

- **GitHub Issues:** [Report a bug](https://github.com/QAntum-Fortres/QAntum-Mind-Engine-Self-Healing/issues)
- **Documentation:** [Full docs](https://docs.qantum.app)

---

## Upgrading

### From Docker Compose

```bash
# Pull latest images
docker-compose pull

# Stop services
docker-compose down

# Start with new images
docker-compose up -d

# Run migrations if needed
docker-compose exec qantum-core npm run migrate
```

### Backup Before Upgrade

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U qantum qantum_db > backup.sql

# Backup volumes
docker run --rm -v qantum_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```
