#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🏛️ QANTUM MIND ENGINE - STARTUP SCRIPT
# Enterprise production launcher with health checks
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██████╗  █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗                    ║
║  ██╔═══██╗██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║                    ║
║  ██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║                    ║
║  ██║▄▄ ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║                    ║
║  ╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║                    ║
║   ╚══▀▀═╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝                    ║
║                                                                               ║
║                 🏛️ MIND ENGINE - ENTERPRISE EDITION                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check for required tools
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All requirements met${NC}"
}

# Load environment variables
load_env() {
    if [ -f .env ]; then
        echo -e "${YELLOW}Loading environment from .env${NC}"
        # Use safer method to load env vars
        set -a
        source .env
        set +a
    elif [ -f .env.example ]; then
        echo -e "${YELLOW}Creating .env from .env.example${NC}"
        cp .env.example .env
        echo -e "${RED}⚠ Please configure .env file before production deployment${NC}"
    fi
}

# Start services
start_services() {
    echo -e "${YELLOW}Starting QAntum Mind Engine services...${NC}"
    
    # Check if docker compose (v2) or docker-compose (v1)
    if docker compose version &> /dev/null; then
        COMPOSE="docker compose"
    else
        COMPOSE="docker-compose"
    fi
    
    case "$1" in
        "dev")
            echo -e "${CYAN}Starting in development mode...${NC}"
            $COMPOSE up -d postgres redis
            npm run dev
            ;;
        "prod")
            echo -e "${CYAN}Starting in production mode...${NC}"
            $COMPOSE up -d
            ;;
        "full")
            echo -e "${CYAN}Starting full stack with monitoring...${NC}"
            $COMPOSE --profile monitoring up -d
            ;;
        *)
            echo -e "${CYAN}Starting core services...${NC}"
            $COMPOSE up -d
            ;;
    esac
}

# Health check
health_check() {
    echo -e "${YELLOW}Running health checks...${NC}"
    
    local max_retries=30
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if curl -sf http://localhost:8765/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ QAntum Core is healthy${NC}"
            return 0
        fi
        retry=$((retry + 1))
        echo -e "${YELLOW}Waiting for services... ($retry/$max_retries)${NC}"
        sleep 2
    done
    
    echo -e "${RED}✗ Health check failed${NC}"
    return 1
}

# Show service status
show_status() {
    echo -e "${CYAN}"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "                           SERVICE STATUS"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
    
    echo -e "${GREEN}🌐 API Gateway:${NC}     http://localhost:80"
    echo -e "${GREEN}🔌 QAntum Core:${NC}     http://localhost:8765"
    echo -e "${GREEN}⚙️  Aeterna Node:${NC}   http://localhost:8766"
    echo -e "${GREEN}📊 Prometheus:${NC}      http://localhost:9091"
    echo -e "${GREEN}📈 Grafana:${NC}         http://localhost:3001"
    echo -e "${GREEN}🐰 RabbitMQ:${NC}        http://localhost:15672"
    
    echo ""
    echo -e "${CYAN}WebSocket: ws://localhost:8765/ws${NC}"
    echo ""
}

# Stop services
stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    
    echo -e "${GREEN}✓ All services stopped${NC}"
}

# Clean up
cleanup() {
    echo -e "${YELLOW}Cleaning up...${NC}"
    
    if docker compose version &> /dev/null; then
        docker compose down -v --remove-orphans
    else
        docker-compose down -v --remove-orphans
    fi
    
    docker system prune -f
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Show logs
show_logs() {
    local service=${1:-"qantum-core"}
    
    if docker compose version &> /dev/null; then
        docker compose logs -f $service
    else
        docker-compose logs -f $service
    fi
}

# Main
main() {
    case "$1" in
        "start")
            check_requirements
            load_env
            start_services "$2"
            sleep 5
            health_check
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_services "$2"
            ;;
        "status")
            show_status
            health_check
            ;;
        "logs")
            show_logs "$2"
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|logs|cleanup|health} [mode]"
            echo ""
            echo "Commands:"
            echo "  start [mode]   Start services (modes: dev, prod, full)"
            echo "  stop           Stop all services"
            echo "  restart        Restart all services"
            echo "  status         Show service status"
            echo "  logs [service] Show logs for a service"
            echo "  cleanup        Remove all containers and volumes"
            echo "  health         Run health checks"
            exit 1
            ;;
    esac
}

main "$@"
