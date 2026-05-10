/**
 * Security Module Test Suite
 *
 * Comprehensive tests for all security components and vulnerability fixes.
 *
 * @module v3/security/tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PasswordHasher,
  CredentialGenerator,
  SafeExecutor,
  PathValidator,
  InputValidator,
  TokenGenerator,
  RuntimeSecurityGuardian,
  SecureHttpClient,
  SecurityBootstrap,
} from '../src/index.js';

describe('Security Module Integration Tests', () => {
  let passwordHasher: PasswordHasher;
  let credentialGenerator: CredentialGenerator;
  let safeExecutor: SafeExecutor;
  let pathValidator: PathValidator;
  let tokenGenerator: TokenGenerator;
  let securityGuardian: RuntimeSecurityGuardian;
  let secureHttpClient: SecureHttpClient;
  let securityBootstrap: SecurityBootstrap;

  beforeEach(async () => {
    // Initialize all security components
    passwordHasher = new PasswordHasher({ rounds: 8 }); // Faster for tests
    credentialGenerator = new CredentialGenerator({
      passwordLength: 16,
      apiKeyLength: 32,
    });
    safeExecutor = new SafeExecutor({
      allowedCommands: ['echo', 'node', 'git'],
      timeout: 5000,
    });
    pathValidator = new PathValidator({
      projectRoot: process.cwd(),
      allowedPrefixes: [process.cwd()],
    });
    tokenGenerator = new TokenGenerator({
      hmacSecret: 'test-secret-key-for-testing-only',
    });
    securityGuardian = new RuntimeSecurityGuardian();
    secureHttpClient = new SecureHttpClient();
    securityBootstrap = new SecurityBootstrap({
      strictMode: false,
      scanDependencies: false,
      enableMonitoring: false,
    });
  });

  afterEach(async () => {
    // Cleanup
    await securityGuardian.shutdown();
  });

  describe('CVE-2: Weak Password Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'testPassword123!';
      const hash = await passwordHasher.hash(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long

      const isValid = await passwordHasher.verify(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await passwordHasher.verify('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = ['123', 'password', 'abc'];

      for (const password of weakPasswords) {
        await expect(passwordHasher.hash(password)).rejects.toThrow('Password too weak');
      }
    });
  });

  describe('CVE-3: Hardcoded Default Credentials', () => {
    it('should generate unique credentials', () => {
      const creds1 = credentialGenerator.generateCredentials();
      const creds2 = credentialGenerator.generateCredentials();

      expect(creds1.password).not.toBe(creds2.password);
      expect(creds1.apiKey).not.toBe(creds2.apiKey);
      expect(creds1.password.length).toBeGreaterThan(10);
      expect(creds1.apiKey.length).toBeGreaterThan(20);
    });

    it('should generate secure API keys', () => {
      const creds = credentialGenerator.generateCredentials();

      // API keys should be URL-safe
      expect(creds.apiKey).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(creds.apiKey.length).toBe(32);
    });
  });

  describe('HIGH-1: Command Injection', () => {
    it('should execute safe commands', async () => {
      const result = await safeExecutor.execute('echo "hello world"');
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('hello world');
    });

    it('should reject dangerous commands', async () => {
      await expect(safeExecutor.execute('rm -rf /')).rejects.toThrow('Command not allowed');
      await expect(safeExecutor.execute('echo "test"; rm -rf /')).rejects.toThrow('Command not allowed');
    });

    it('should prevent command injection', async () => {
      const maliciousInput = 'test"; rm -rf /; echo "';
      await expect(safeExecutor.execute(`echo "${maliciousInput}"`)).rejects.toThrow();
    });
  });

  describe('HIGH-2: Path Traversal', () => {
    it('should validate safe paths', () => {
      const safePaths = [
        'src/index.ts',
        'tests/security.test.ts',
        'package.json',
      ];

      for (const path of safePaths) {
        const result = pathValidator.validate(path);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject path traversal attacks', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '....//....//....//etc/passwd',
        'src/../../../etc/passwd',
      ];

      for (const path of maliciousPaths) {
        const result = pathValidator.validate(path);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Path traversal');
      }
    });
  });

  describe('Input Validation', () => {
    it('should validate email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user@localhost',
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..double@example.com',
      ];

      for (const email of validEmails) {
        expect(InputValidator.validateEmail(email)).toBe(true);
      }

      for (const email of invalidEmails) {
        expect(InputValidator.validateEmail(email)).toBe(false);
      }
    });

    it('should sanitize HTML input', () => {
      const maliciousHtml = '<script>alert("xss")</script><p>Hello</p>';
      const sanitized = InputValidator.sanitizeHtml(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Hello</p>');
    });
  });

  describe('Token Generation', () => {
    it('should generate and verify tokens', () => {
      const token = tokenGenerator.generate();
      expect(token.value).toBeDefined();
      expect(token.expiresAt).toBeDefined();

      const isValid = tokenGenerator.verify(token.value);
      expect(isValid).toBe(true);
    });

    it('should expire tokens', async () => {
      const shortToken = tokenGenerator.generate({ ttlMs: 1 });
      await new Promise(resolve => setTimeout(resolve, 10));

      const isValid = tokenGenerator.verify(shortToken.value);
      expect(isValid).toBe(false);
    });
  });

  describe('Runtime Security Guardian', () => {
    it('should detect dependency vulnerabilities', async () => {
      await securityGuardian.initialize();

      // Simulate a vulnerable dependency
      const alert = await new Promise<any>((resolve) => {
        securityGuardian.once('alert', resolve);
        // Trigger a mock vulnerability alert
        securityGuardian['checkDependencies']();
      });

      expect(alert).toBeDefined();
      expect(alert.level).toBeDefined();
    });

    it('should monitor memory usage', async () => {
      await securityGuardian.initialize();

      const stats = securityGuardian.getMemoryStats();
      expect(stats).toBeDefined();
      expect(typeof stats.heapUsed).toBe('number');
    });
  });

  describe('Secure HTTP Client', () => {
    it('should make safe HTTP requests', async () => {
      // Mock a safe request
      const response = await secureHttpClient.request({
        url: 'https://httpbin.org/get',
        method: 'GET',
        timeout: 5000,
      });

      expect(response).toBeDefined();
      expect(response.statusCode).toBe(200);
    });

    it('should prevent SSRF attacks', async () => {
      const maliciousUrls = [
        'http://localhost:22',
        'http://127.0.0.1:3306',
        'http://169.254.169.254', // AWS metadata
        'http://10.0.0.1', // Private IP
      ];

      for (const url of maliciousUrls) {
        await expect(secureHttpClient.request({ url })).rejects.toThrow('SSRF protection');
      }
    });

    it('should prevent prototype pollution', async () => {
      const maliciousData = JSON.stringify({
        '__proto__': { 'polluted': true },
        'constructor': { 'prototype': { 'polluted': true } },
      });

      await expect(secureHttpClient.request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: maliciousData,
      })).rejects.toThrow('Prototype pollution');
    });
  });

  describe('Security Bootstrap', () => {
    it('should initialize successfully', async () => {
      await securityBootstrap.initialize();

      const status = securityBootstrap.getStatus();
      expect(status.initialized).toBe(true);
    });

    it('should validate environment', async () => {
      // This should not throw in test environment
      await expect(securityBootstrap['validateEnvironment']()).resolves.not.toThrow();
    });

    it('should handle shutdown', async () => {
      await securityBootstrap.initialize();
      await securityBootstrap.shutdown();

      const status = securityBootstrap.getStatus();
      expect(status.initialized).toBe(false);
    });
  });

  describe('Integration: Complete Security Flow', () => {
    it('should handle a complete secure user registration flow', async () => {
      // 1. Generate secure credentials
      const credentials = credentialGenerator.generateCredentials();

      // 2. Hash the password
      const hashedPassword = await passwordHasher.hash(credentials.password);

      // 3. Generate a session token
      const token = tokenGenerator.generate();

      // 4. Validate user input (simulated)
      const isValidEmail = InputValidator.validateEmail('user@example.com');
      const isValidPassword = await passwordHasher.verify(credentials.password, hashedPassword);

      // 5. Execute a safe command (simulated user action logging)
      const logResult = await safeExecutor.execute(`echo "User registered: user@example.com"`);

      // Assertions
      expect(credentials.password).toBeDefined();
      expect(hashedPassword).toBeDefined();
      expect(token.value).toBeDefined();
      expect(isValidEmail).toBe(true);
      expect(isValidPassword).toBe(true);
      expect(logResult.success).toBe(true);
    });

    it('should prevent common attack vectors', async () => {
      // Test various attack vectors
      const attackVectors = [
        // Path traversal
        () => pathValidator.validate('../../../etc/passwd'),
        // Command injection
        () => safeExecutor.execute('echo "test"; rm -rf /'),
        // SSRF
        () => secureHttpClient.request({ url: 'http://localhost:22' }),
      ];

      for (const attack of attackVectors) {
        await expect(attack()).rejects.toThrow();
      }
    });
  });
});