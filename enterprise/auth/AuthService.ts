/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏛️ QANTUM MIND ENGINE - ENTERPRISE AUTHENTICATION MODULE
 * JWT-based authentication with RBAC (Role-Based Access Control)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  status: UserStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  lastLoginAt?: Date;
}

export type UserRole = 'admin' | 'user' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface JWTPayload {
  sub: string;          // User ID
  email: string;
  role: UserRole;
  iat: number;          // Issued at
  exp: number;          // Expiration
  jti: string;          // JWT ID (for revocation)
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'execute')[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC Configuration
// ═══════════════════════════════════════════════════════════════════════════════

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete', 'execute'] },
  ],
  operator: [
    { resource: 'departments', actions: ['read', 'update', 'execute'] },
    { resource: 'metrics', actions: ['read'] },
    { resource: 'tasks', actions: ['create', 'read', 'update'] },
    { resource: 'events', actions: ['read'] },
    { resource: 'users', actions: ['read'] },
  ],
  user: [
    { resource: 'departments', actions: ['read'] },
    { resource: 'metrics', actions: ['read'] },
    { resource: 'tasks', actions: ['read'] },
    { resource: 'profile', actions: ['read', 'update'] },
  ],
  viewer: [
    { resource: 'departments', actions: ['read'] },
    { resource: 'metrics', actions: ['read'] },
    { resource: 'profile', actions: ['read'] },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Authentication Service
// ═══════════════════════════════════════════════════════════════════════════════

export class AuthService {
  private readonly jwtSecret: string;
  private readonly accessTokenTTL: number;  // seconds
  private readonly refreshTokenTTL: number; // seconds
  private revokedTokens: Set<string> = new Set();

  constructor(options?: { jwtSecret?: string; accessTokenTTL?: number; refreshTokenTTL?: number }) {
    this.jwtSecret = options?.jwtSecret || process.env.JWT_SECRET || 'change-me-in-production';
    this.accessTokenTTL = options?.accessTokenTTL || 3600;       // 1 hour
    this.refreshTokenTTL = options?.refreshTokenTTL || 604800;   // 7 days
  }

  /**
   * Generate JWT tokens for a user
   */
  generateTokens(user: User): AuthToken {
    const now = Math.floor(Date.now() / 1000);
    const jti = crypto.randomUUID();

    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + this.accessTokenTTL,
      jti,
    };

    const accessToken = this.signJWT(payload);
    const refreshPayload = { ...payload, exp: now + this.refreshTokenTTL, type: 'refresh' };
    const refreshToken = this.signJWT(refreshPayload);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTTL,
      tokenType: 'Bearer',
    };
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;
      
      // Verify signature
      const expectedSig = this.sign(`${headerB64}.${payloadB64}`);
      if (signatureB64 !== expectedSig) return null;

      // Decode payload
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as JWTPayload;

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) return null;

      // Check revocation
      if (this.revokedTokens.has(payload.jti)) return null;

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Revoke a token (for logout)
   */
  revokeToken(token: string): boolean {
    const payload = this.verifyToken(token);
    if (payload) {
      this.revokedTokens.add(payload.jti);
      return true;
    }
    return false;
  }

  /**
   * Hash a password using PBKDF2 (async version for production)
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * Verify a password against a hash (async version)
   */
  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(hash === derivedKey.toString('hex'));
      });
    });
  }

  /**
   * Check if a user has permission for an action on a resource
   */
  hasPermission(
    role: UserRole,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete' | 'execute'
  ): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    
    return permissions.some(perm => {
      const resourceMatch = perm.resource === '*' || perm.resource === resource;
      const actionMatch = perm.actions.includes(action);
      return resourceMatch && actionMatch;
    });
  }

  /**
   * Generate API key
   */
  generateApiKey(): { key: string; hash: string } {
    const key = `qk_${crypto.randomBytes(32).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    return { key, hash };
  }

  /**
   * Verify API key
   */
  verifyApiKey(key: string, storedHash: string): boolean {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    return hash === storedHash;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Private Methods
  // ═══════════════════════════════════════════════════════════════════════════

  private signJWT(payload: Record<string, unknown>): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(`${headerB64}.${payloadB64}`);
    return `${headerB64}.${payloadB64}.${signature}`;
  }

  private sign(data: string): string {
    return crypto.createHmac('sha256', this.jwtSecret).update(data).digest('base64url');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Express Middleware
// ═══════════════════════════════════════════════════════════════════════════════

export function createAuthMiddleware(authService: AuthService) {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);
    const payload = authService.verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  };
}

export function createRBACMiddleware(
  authService: AuthService,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'execute'
) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!authService.hasPermission(req.user.role, resource, action)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: { resource, action },
        current: { role: req.user.role }
      });
    }

    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Export singleton instance
// ═══════════════════════════════════════════════════════════════════════════════

export const authService = new AuthService();
