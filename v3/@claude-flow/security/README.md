# @claude-flow/security

[![npm version](https://img.shields.io/npm/v/@claude-flow/security.svg)](https://www.npmjs.com/package/@claude-flow/security)
[![npm downloads](https://img.shields.io/npm/dm/@claude-flow/security.svg)](https://www.npmjs.com/package/@claude-flow/security)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Security Audit](https://img.shields.io/badge/Security-Audited-green.svg)](https://github.com/ruvnet/claude-flow)

> Comprehensive security module for Claude Flow V3 - CVE fixes, input validation, path security, secure credential management, runtime monitoring, and SSRF protection.

## Features

### CVE Remediation
- **CVE-2** - Weak Password Hashing (bcrypt with configurable rounds)
- **CVE-3** - Hardcoded Default Credentials (cryptographically secure generation)
- **HIGH-1** - Command Injection (allowlist-based execution)
- **HIGH-2** - Path Traversal (multi-layer validation)

### Security Modules
| Module | Description |
|--------|-------------|
| `PasswordHasher` | Secure bcrypt-based password hashing |
| `CredentialGenerator` | Cryptographically secure credentials & API keys |
| `SafeExecutor` | Allowlist-based command execution |
| `PathValidator` | Path traversal and symlink protection |
| `InputValidator` | Zod-based schema validation |
| `TokenGenerator` | HMAC-signed secure tokens |
| `RuntimeSecurityGuardian` | Runtime monitoring & dependency scanning |
| `SecureHttpClient` | SSRF-protected HTTP client |
| `SecurityBootstrap` | Application startup security initialization |

### Security Protections
- ✅ SSRF (Server-Side Request Forgery) protection
- ✅ Prototype pollution prevention
- ✅ Header injection prevention
- ✅ SSL certificate verification (always enforced)
- ✅ Memory usage monitoring
- ✅ Command injection prevention
- ✅ Path traversal prevention
- ✅ XSS protection (HTML sanitization)

## Installation

```bash
npm install @claude-flow/security
# or
pnpm add @claude-flow/security
```

### Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for type definitions)

### Project Setup

For Claude Flow V3 projects, the security module is already included. To update dependencies:

```bash
# Clone the project
git clone https://github.com/38970693/ruflo.git
cd ruflo

# Install dependencies
pnpm install

# Run security audit
pnpm audit --audit-level high

# Update to latest secure versions
pnpm install
```

## Quick Start

```typescript
import { createSecurityModule } from '@claude-flow/security';

// Create a complete security module
const security = createSecurityModule({
  projectRoot: '/workspaces/project',
  hmacSecret: process.env.HMAC_SECRET!,
  bcryptRounds: 12,
  allowedCommands: ['git', 'npm', 'node']
});

// Hash a password
const hash = await security.passwordHasher.hash('userPassword123');

// Validate a path
const pathResult = await security.pathValidator.validate('/workspaces/project/src/file.ts');

// Execute command safely
const output = await security.safeExecutor.execute('git', ['status']);

// Generate secure credentials
const creds = await security.credentialGenerator.generate();
```

## API Reference

### Password Hashing (CVE-2 Fix)

```typescript
import { PasswordHasher, createPasswordHasher } from '@claude-flow/security';

const hasher = createPasswordHasher({ rounds: 12 });

// Hash password
const hash = await hasher.hash('password');

// Verify password
const isValid = await hasher.verify('password', hash);

// Check if hash needs rehashing
const needsRehash = hasher.needsRehash(hash);
```

### Credential Generation (CVE-3 Fix)

```typescript
import { CredentialGenerator, generateCredentials } from '@claude-flow/security';

const generator = new CredentialGenerator();

// Generate API key
const apiKey = await generator.generateApiKey({
  prefix: 'cf',
  length: 32
});

// Generate complete credentials
const creds = generateCredentials({
  includeApiKey: true,
  includeSecret: true
});
```

### Safe Command Execution (HIGH-1 Fix)

```typescript
import { SafeExecutor, createDevelopmentExecutor } from '@claude-flow/security';

const executor = createDevelopmentExecutor();

// Execute allowed command
const result = await executor.execute('git', ['status']);

// With timeout
const result2 = await executor.execute('npm', ['install'], {
  timeout: 60000,
  cwd: '/workspaces/project'
});
```

### Path Validation (HIGH-2 Fix)

```typescript
import { PathValidator, createProjectPathValidator } from '@claude-flow/security';

const validator = createProjectPathValidator('/workspaces/project');

// Validate path
const result = await validator.validate('../../../etc/passwd');
// { valid: false, reason: 'Path traversal detected' }

// Safe path
const result2 = await validator.validate('/workspaces/project/src/index.ts');
// { valid: true, normalized: '/workspaces/project/src/index.ts' }
```

### Input Validation

```typescript
import {
  InputValidator,
  SafeStringSchema,
  EmailSchema,
  PasswordSchema,
  SpawnAgentSchema
} from '@claude-flow/security';

// Validate email
const email = EmailSchema.parse('user@example.com');

// Validate password
const password = PasswordSchema.parse('SecurePass123!');

// Validate agent spawn request
const agentRequest = SpawnAgentSchema.parse({
  type: 'coder',
  name: 'code-agent-1'
});

// Sanitize HTML
import { sanitizeHtml } from '@claude-flow/security';
const safe = sanitizeHtml('<script>alert("xss")</script>Hello');
// 'Hello'
```

### Token Generation

```typescript
import { TokenGenerator, quickGenerate } from '@claude-flow/security';

const generator = new TokenGenerator({
  hmacSecret: process.env.HMAC_SECRET!
});

// Generate signed token
const token = await generator.generate({
  type: 'session',
  expiresIn: 3600
});

// Verify token
const verified = await generator.verify(token);

// Quick generation
const sessionToken = quickGenerate.sessionToken();
const verificationCode = quickGenerate.verificationCode();
```

### Runtime Security Guardian

Runtime monitoring system with dependency scanning, memory monitoring, and attack detection.

```typescript
import { RuntimeSecurityGuardian } from '@claude-flow/security';

const guardian = new RuntimeSecurityGuardian({
  scanDependencies: true,      // Enable npm audit scanning
  validateInputs: true,         // Enable input validation
  monitorCommands: true,        // Enable command monitoring
  memoryThreshold: 500,        // Memory threshold in MB
  onAlert: (alert) => {
    console.log(`[${alert.level}] ${alert.type}: ${alert.message}`);
  }
});

// Initialize monitoring
await guardian.initialize();

// Listen for security alerts
guardian.on('alert', (alert) => {
  if (alert.level === 'critical') {
    // Handle critical security event
    console.error('🚨 SECURITY ALERT:', alert.message);
  }
});

// Get memory statistics
const memory = guardian.getMemoryStats();
// { heapUsed: 45.2, heapTotal: 120.5, external: 12.3, rss: 89.1 }

// Get recent alerts
const alerts = guardian.getAlerts(50);

// Get alerts by severity
const warnings = guardian.getAlertsByLevel('warning');
const critical = guardian.getAlertsByLevel('critical');

// Validate network requests (SSRF protection)
const isSafe = guardian.validateNetworkRequest('https://example.com/api', 'GET');
// Returns false for internal IPs (10.x, 172.16-31.x, 192.168.x, 127.x, localhost)

// Shutdown
await guardian.shutdown();
```

**Alert Types:**
| Type | Description |
|------|-------------|
| `dependency` | Vulnerability found in dependencies |
| `input` | Potentially malicious input detected |
| `execution` | Dangerous command execution attempt |
| `memory` | High memory usage warning |
| `network` | Potential SSRF attempt |

### Secure HTTP Client

SSRF-protected HTTP client with prototype pollution prevention.

```typescript
import { SecureHttpClient } from '@claude-flow/security';

const client = new SecureHttpClient();

// Simple GET request
const response = await client.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  timeout: 30000
});

// POST with JSON body
const postResponse = await client.request({
  url: 'https://api.example.com/submit',
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  }
});

// Response structure
// {
//   statusCode: 200,
//   headers: { 'content-type': 'application/json' },
//   body: '...',
//   url: 'https://api.example.com/data',
//   redirected: false
// }

// Convenience methods
const get = await client.get('https://api.example.com/get');
const post = await client.post('https://api.example.com/post', {
  body: JSON.stringify({ data: 'value' })
});
```

**Security Features:**
- ✅ **SSRF Protection**: Blocks requests to internal IPs (10.x, 172.16-31.x, 192.168.x, 127.x, localhost)
- ✅ **Prototype Pollution**: Detects and warns on `__proto__` or `constructor` in responses
- ✅ **Header Injection**: Rejects headers with newlines
- ✅ **SSL Verification**: Always enabled (rejectUnauthorized: true)
- ✅ **Response Size Limits**: Default 10MB max

**Blocked URLs:**
```typescript
// These will throw SecureHttpClientError
await client.request({ url: 'http://localhost:8080' });      // SSRF_ATTEMPT
await client.request({ url: 'http://127.0.0.1:3306' });      // SSRF_ATTEMPT
await client.request({ url: 'http://10.0.0.1/api' });        // SSRF_ATTEMPT
await client.request({ url: 'http://169.254.169.254/' });    // SSRF_ATTEMPT (AWS metadata)
```

### Security Bootstrap

Application startup security initialization with automatic component setup.

```typescript
import { SecurityBootstrap } from '@claude-flow/security';

const bootstrap = new SecurityBootstrap({
  projectRoot: process.cwd(),     // Project root for path validation
  scanDependencies: true,          // Run npm audit
  enableMonitoring: true,          // Start RuntimeSecurityGuardian
  strictMode: false,               // Exit on error in production
  envFile: '.env'                 // Environment file to validate
});

// Initialize all security components
await bootstrap.initialize();

// Get status
const status = bootstrap.getStatus();
// {
//   initialized: true,
//   monitoring: true,
//   alerts: [...]
// }

// Shutdown
await bootstrap.shutdown();
```

**Initialization Steps:**
1. **Environment Validation** - Check Node.js version, dangerous env vars
2. **Dependency Scanning** - Run `npm audit` for vulnerabilities
3. **Security Components** - Initialize PasswordHasher, SafeExecutor, PathValidator
4. **Runtime Monitoring** - Start Guardian if enabled
5. **Configuration Validation** - Check .env for hardcoded secrets

**Auto-Initialization:**
```typescript
// When run directly as script
if (import.meta.url === `file://${process.argv[1]}`) {
  securityBootstrap.initialize()
    .then(() => console.log('✅ Security ready'))
    .catch((err) => {
      console.error('❌ Security init failed:', err);
      process.exit(1);
    });
}
```

## Security Constants

```typescript
import {
  MIN_BCRYPT_ROUNDS,      // 12
  MAX_BCRYPT_ROUNDS,      // 14
  MIN_PASSWORD_LENGTH,    // 8
  MAX_PASSWORD_LENGTH,    // 72 (bcrypt limit)
  DEFAULT_TOKEN_EXPIRATION,   // 3600 (1 hour)
  DEFAULT_SESSION_EXPIRATION  // 86400 (24 hours)
} from '@claude-flow/security';
```

## Security Audit

```typescript
import { auditSecurityConfig } from '@claude-flow/security';

const warnings = auditSecurityConfig({
  bcryptRounds: 10,
  hmacSecret: 'short'
});

// ['bcryptRounds (10) below recommended minimum (12)',
//  'hmacSecret should be at least 32 characters']
```

## Validation Schemas

| Schema | Description |
|--------|-------------|
| `SafeStringSchema` | Basic safe string with length limits |
| `IdentifierSchema` | Alphanumeric identifiers |
| `FilenameSchema` | Safe filenames |
| `EmailSchema` | Email addresses |
| `PasswordSchema` | Secure passwords |
| `UUIDSchema` | UUID v4 format |
| `HttpsUrlSchema` | HTTPS URLs only |
| `SemverSchema` | Semantic versions |
| `PortSchema` | Valid port numbers |
| `IPv4Schema` | IPv4 addresses |
| `SpawnAgentSchema` | Agent spawn requests |
| `TaskInputSchema` | Task definitions |
| `SecurityConfigSchema` | Security configuration |

## Dependencies

- `bcryptjs` - Password hashing
- `zod` - Schema validation

## Related Packages

- [@claude-flow/shared](../shared) - Shared types and utilities
- [@claude-flow/swarm](../swarm) - Swarm coordination (secure agent spawning)
- [@claude-flow/mcp](../mcp) - MCP protocol with secure initialization

## Security Best Practices

### Production Checklist

- [ ] Use `MIN_BCRYPT_ROUNDS` (12) or higher for password hashing
- [ ] Store `HMAC_SECRET` in environment variables, never in code
- [ ] Enable `RuntimeSecurityGuardian` in production
- [ ] Use `SecureHttpClient` for all external HTTP requests
- [ ] Always validate user input with `InputValidator` schemas
- [ ] Run `npm audit` in CI/CD pipeline

### Security Configuration Example

```typescript
import { createSecurityModule, MIN_BCRYPT_ROUNDS } from '@claude-flow/security';

const security = createSecurityModule({
  projectRoot: process.cwd(),
  hmacSecret: process.env.HMAC_SECRET!, // Required: 32+ characters
  bcryptRounds: Math.max(MIN_BCRYPT_ROUNDS, 14), // Higher in production
  allowedCommands: ['git', 'npm', 'node', 'pnpm']
});

// Verify configuration
const warnings = auditSecurityConfig({
  bcryptRounds: 14,
  hmacSecret: process.env.HMAC_SECRET!,
  projectRoot: process.cwd()
});

if (warnings.length > 0) {
  console.warn('Security warnings:', warnings);
}
```

### Dependency Security

The project uses `overrides` in `package.json` to ensure secure versions:

```json
{
  "overrides": {
    "axios": ">=1.16.0",
    "hono": ">=4.12.18",
    "undici": ">=8.2.0",
    "path-to-regexp": ">=8.4.2",
    "yaml": ">=2.8.4",
    "follow-redirects": ">=1.15.11"
  }
}
```

Run security audit:
```bash
pnpm audit --audit-level high
```

## License

MIT
