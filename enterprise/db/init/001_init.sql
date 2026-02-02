-- ═══════════════════════════════════════════════════════════════════════════════
-- 🏛️ QANTUM MIND ENGINE - DATABASE INITIALIZATION
-- Enterprise PostgreSQL schema with proper indexing and constraints
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════════════════════════════════════════════
-- USER MANAGEMENT
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_role CHECK (role IN ('admin', 'user', 'operator', 'viewer')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- API KEYS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['read'],
    rate_limit INTEGER DEFAULT 1000,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_key_per_user UNIQUE (user_id, name)
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SESSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DEPARTMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'online',
    config JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_department_status CHECK (status IN ('online', 'offline', 'degraded', 'critical', 'maintenance'))
);

-- Insert default departments
INSERT INTO departments (name, display_name, description, status) VALUES
    ('intelligence', 'Intelligence Department', 'AI/ML processing and neural operations', 'online'),
    ('omega', 'Omega Department', 'Market analysis and financial operations', 'online'),
    ('fortress', 'Fortress Department', 'Security operations and threat detection', 'online'),
    ('biology', 'Biology Department', 'Bio-metric processing and life-science operations', 'online'),
    ('physics', 'Physics Department', 'Physical simulation and quantum operations', 'online'),
    ('guardians', 'Guardians Department', 'System protection and integrity monitoring', 'online'),
    ('reality', 'Reality Department', 'Reality simulation and dimensional operations', 'online'),
    ('chemistry', 'Chemistry Department', 'Chemical analysis and molecular operations', 'online')
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- EVENTS & AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'info',
    payload JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_severity CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_severity ON events(severity);
CREATE INDEX idx_events_created ON events(created_at);
CREATE INDEX idx_events_payload ON events USING GIN (payload);

-- ═══════════════════════════════════════════════════════════════════════════════
-- METRICS STORAGE (Time-series data)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(200) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    labels JSONB DEFAULT '{}',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_name ON metrics(metric_name);
CREATE INDEX idx_metrics_recorded ON metrics(recorded_at);
CREATE INDEX idx_metrics_department ON metrics(department_id);

-- Partition metrics table by month (for production scale)
-- This would be implemented with pg_partman in production

-- ═══════════════════════════════════════════════════════════════════════════════
-- TASKS & JOBS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    payload JSONB DEFAULT '{}',
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_task_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_at);
CREATE INDEX idx_tasks_priority ON tasks(priority DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CONFIGURATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configurations
INSERT INTO configurations (key, value, description) VALUES
    ('system.version', '"1.0.0"', 'System version'),
    ('system.maintenance_mode', 'false', 'Enable/disable maintenance mode'),
    ('rate_limits.default', '{"requests_per_minute": 100}', 'Default rate limits'),
    ('features.ai_enabled', 'true', 'Enable AI features'),
    ('features.websocket_enabled', 'true', 'Enable WebSocket connections')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configurations_updated_at BEFORE UPDATE ON configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_department_health AS
SELECT 
    d.id,
    d.name,
    d.display_name,
    d.status,
    d.updated_at,
    COUNT(DISTINCT m.id) AS metric_count,
    AVG(m.value) FILTER (WHERE m.metric_name = 'efficiency') AS avg_efficiency
FROM departments d
LEFT JOIN metrics m ON m.department_id = d.id 
    AND m.recorded_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY d.id, d.name, d.display_name, d.status, d.updated_at;

CREATE OR REPLACE VIEW v_active_users AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.role,
    u.last_login_at,
    COUNT(s.id) AS active_sessions
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id AND s.expires_at > CURRENT_TIMESTAMP
WHERE u.status = 'active'
GROUP BY u.id, u.email, u.username, u.role, u.last_login_at;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GRANTS (for application user)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create application role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'qantum_app') THEN
        CREATE ROLE qantum_app WITH LOGIN PASSWORD 'app_password_change_me';
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO qantum_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO qantum_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO qantum_app;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA (Development Only - Remove in Production)
-- ═══════════════════════════════════════════════════════════════════════════════

-- NOTE: In production, create admin user via secure initialization script
-- DO NOT use default passwords in production environments
-- Example production setup:
--   docker exec -it qantum-postgres psql -U qantum -d qantum_db -c \
--     "INSERT INTO users (email, password_hash, username, role, status) \
--      VALUES ('admin@your-domain.com', crypt('YOUR_SECURE_PASSWORD', gen_salt('bf')), 'admin', 'admin', 'active');"

COMMIT;
