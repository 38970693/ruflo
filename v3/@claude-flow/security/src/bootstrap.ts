#!/usr/bin/env node
/**
 * Security Bootstrap Script
 *
 * Initializes all security measures before application startup.
 * This script should be run before any other application code.
 *
 * Features:
 * - Dependency vulnerability scanning
 * - Environment security validation
 * - Runtime security guardian initialization
 * - Secure configuration loading
 *
 * @module v3/security/bootstrap
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { securityGuardian } from './runtime-guardian.js';
import { createPasswordHasher } from './password-hasher.js';
import { createCredentialGenerator } from './credential-generator.js';
import { createDevelopmentExecutor } from './safe-executor.js';
import { createProjectPathValidator } from './path-validator.js';

export interface BootstrapConfig {
  /** Project root directory */
  projectRoot?: string;
  /** Enable dependency scanning */
  scanDependencies?: boolean;
  /** Enable runtime monitoring */
  enableMonitoring?: boolean;
  /** Strict mode (fail on warnings) */
  strictMode?: boolean;
  /** Environment file path */
  envFile?: string;
}

export class SecurityBootstrap {
  private config: BootstrapConfig;
  private initialized = false;

  constructor(config: BootstrapConfig = {}) {
    this.config = {
      projectRoot: process.cwd(),
      scanDependencies: true,
      enableMonitoring: true,
      strictMode: false,
      envFile: '.env',
      ...config,
    };
  }

  /**
   * Initialize all security measures
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔒 Initializing Ruflo Security Bootstrap...');

    try {
      // 1. Validate environment
      await this.validateEnvironment();

      // 2. Check dependencies
      if (this.config.scanDependencies) {
        await this.scanDependencies();
      }

      // 3. Initialize security components
      await this.initializeSecurityComponents();

      // 4. Start runtime monitoring
      if (this.config.enableMonitoring) {
        await this.startMonitoring();
      }

      // 5. Validate configuration
      await this.validateConfiguration();

      this.initialized = true;
      console.log('✅ Security bootstrap completed successfully');

    } catch (error) {
      console.error('❌ Security bootstrap failed:', error);
      if (this.config.strictMode) {
        process.exit(1);
      }
      throw error;
    }
  }

  /**
   * Validate environment security
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js version ${nodeVersion} is too old. Minimum required: 18.0.0`);
    }

    // Check for dangerous environment variables
    const dangerousVars = ['NODE_ENV=development', 'DEBUG=*'];
    for (const [key, value] of Object.entries(process.env)) {
      if (dangerousVars.includes(`${key}=${value}`)) {
        console.warn(`⚠️  Potentially dangerous environment variable: ${key}=${value}`);
      }
    }

    // Check file permissions (Windows-specific)
    if (process.platform === 'win32') {
      // On Windows, we can't easily check file permissions like on Unix
      // But we can check if we're running as administrator
      const isAdmin = await this.checkWindowsAdmin();
      if (isAdmin) {
        console.warn('⚠️  Running as administrator - consider running as regular user for better security');
      }
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Check if running as administrator on Windows
   */
  private async checkWindowsAdmin(): Promise<boolean> {
    try {
      // This is a simple check - in production you'd want more robust detection
      const { execSync } = await import('child_process');
      execSync('net session', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scan for dependency vulnerabilities
   */
  private async scanDependencies(): Promise<void> {
    console.log('🔍 Scanning dependencies for vulnerabilities...');

    try {
      const { execSync } = await import('child_process');
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);

      const vulnerabilities = audit.metadata?.vulnerabilities || {};

      if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
        const message = `Found ${vulnerabilities.critical} critical and ${vulnerabilities.high} high severity vulnerabilities`;
        if (this.config.strictMode) {
          throw new Error(message);
        } else {
          console.warn(`⚠️  ${message}`);
        }
      } else {
        console.log('✅ No critical or high severity vulnerabilities found');
      }
    } catch (error) {
      console.warn('⚠️  Could not scan dependencies:', (error as Error).message);
    }
  }

  /**
   * Initialize security components
   */
  private async initializeSecurityComponents(): Promise<void> {
    console.log('🔧 Initializing security components...');

    const projectRoot = this.config.projectRoot!;

    // Initialize password hasher
    globalThis.passwordHasher = createPasswordHasher(12);

    // Initialize credential generator
    globalThis.credentialGenerator = createCredentialGenerator();

    // Initialize safe executor
    globalThis.safeExecutor = createDevelopmentExecutor();

    // Initialize path validator
    globalThis.pathValidator = createProjectPathValidator(projectRoot);

    console.log('✅ Security components initialized');
  }

  /**
   * Start runtime monitoring
   */
  private async startMonitoring(): Promise<void> {
    console.log('👁️  Starting runtime security monitoring...');

    // Configure alert handler
    securityGuardian.on('alert', (alert) => {
      const level = alert.level.toUpperCase();
      const message = `[${level}] ${alert.type}: ${alert.message}`;

      switch (alert.level) {
        case 'critical':
          console.error('🚨', message);
          break;
        case 'warning':
          console.warn('⚠️ ', message);
          break;
        default:
          console.log('ℹ️ ', message);
      }
    });

    // Initialize guardian
    await securityGuardian.initialize();

    console.log('✅ Runtime monitoring started');
  }

  /**
   * Validate configuration files
   */
  private async validateConfiguration(): Promise<void> {
    console.log('🔍 Validating configuration...');

    const envFile = this.config.envFile!;
    const envPath = resolve(this.config.projectRoot!, envFile);

    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');

      // Check for hardcoded secrets
      const secretPatterns = [
        /API_KEY\s*=\s*[^$\n]+/,
        /SECRET\s*=\s*[^$\n]+/,
        /PASSWORD\s*=\s*[^$\n]+/,
        /TOKEN\s*=\s*[^$\n]+/,
      ];

      for (const pattern of secretPatterns) {
        if (pattern.test(envContent)) {
          console.warn(`⚠️  Found potential hardcoded secret in ${envFile}`);
        }
      }
    }

    // Validate package.json security
    const packagePath = join(this.config.projectRoot!, 'package.json');
    if (existsSync(packagePath)) {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

      // Check for security scripts
      const securityScripts = ['security:audit', 'security:test'];
      const hasSecurityScripts = securityScripts.some(script =>
        packageJson.scripts && packageJson.scripts[script]
      );

      if (!hasSecurityScripts) {
        console.warn('⚠️  No security scripts found in package.json');
      }
    }

    console.log('✅ Configuration validation completed');
  }

  /**
   * Get security status
   */
  getStatus(): {
    initialized: boolean;
    monitoring: boolean;
    alerts: any[];
  } {
    return {
      initialized: this.initialized,
      monitoring: securityGuardian['isMonitoring'],
      alerts: securityGuardian.getAlerts(10),
    };
  }

  /**
   * Shutdown security systems
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down security systems...');

    await securityGuardian.shutdown();
    this.initialized = false;

    console.log('✅ Security systems shut down');
  }
}

// Global bootstrap instance
export const securityBootstrap = new SecurityBootstrap();

// Auto-initialize if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  securityBootstrap.initialize().catch((error) => {
    console.error('Security bootstrap failed:', error);
    process.exit(1);
  });
}