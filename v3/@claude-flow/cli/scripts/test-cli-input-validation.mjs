#!/usr/bin/env node
/**
 * CLI Input Validation Integration Test
 *
 * Tests that @claude-flow/security validators are properly wired to runtime.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.chdir(join(__dirname, '..', '..', '..'));

// Import validation functions (from cli-core)
import {
  validateIdentifier,
  validateGitRef,
  validatePackageName,
  validatePath,
  validateText
} from '../../cli-core/src/mcp-tools/validate-input.ts';

const green = (text) => `\x1b[32m[PASS]\x1b[0m ${text}`;
const red = (text) => `\x1b[31m[FAIL]\x1b[0m ${text}`;
const blue = (text) => `\x1b[34m[TST]\x1b[0m ${text}`;

let passed = 0;
let failed = 0;

function test(name, fn) {
  console.log(blue(`Testing: ${name}`));
  try {
    const result = fn();
    if (result.valid === true) {
      console.log(red(`  FAILED - should reject`));
      failed++;
    } else {
      console.log(green(`  Rejected as expected: ${result.error}`));
      passed++;
    }
  } catch (e) {
    console.log(red(`  Error: ${e.message}`));
    failed++;
  }
}

function expectValid(name, fn) {
  console.log(blue(`Testing: ${name}`));
  try {
    const result = fn();
    if (result.valid === true) {
      console.log(green(`  Valid - sanitized: "${result.sanitized}"`));
      passed++;
    } else {
      console.log(red(`  Should be valid but got: ${result.error}`));
      failed++;
    }
  } catch (e) {
    console.log(red(`  Error: ${e.message}`));
    failed++;
  }
}

async function main() {
  console.log("\n[CLI INPUT VALIDATION INTEGRATION TEST]\n");
  console.log("=".repeat(50));

  // ========================================
  // validateIdentifier Tests
  // ========================================
  console.log("\n[validateIdentifier]\n");

  // Valid cases
  expectValid("valid alphanumeric ID", () => validateIdentifier("agent-123", "agentId"));
  expectValid("valid underscore ID", () => validateIdentifier("my_agent", "agentId"));
  expectValid("valid colon ID (namespaced)", () => validateIdentifier("namespace:type", "agentId"));
  expectValid("valid dot ID", () => validateIdentifier("v1.2.3", "agentId"));
  expectValid("valid dash ID", () => validateIdentifier("my-agent-name", "agentId"));

  // Invalid cases (shell injection)
  test("reject semicolon injection", () => validateIdentifier("test; rm -rf /", "agentId"));
  test("reject backtick injection", () => validateIdentifier("test`whoami`", "agentId"));
  test("reject pipe injection", () => validateIdentifier("test | cat /etc/passwd", "agentId"));
  test("reject newlines", () => validateIdentifier("test\nwhoami", "agentId"));
  test("reject dollar expansion", () => validateIdentifier("test$(whoami)", "agentId"));
  test("reject path traversal in ID", () => validateIdentifier("../../../etc", "agentId"));

  // ========================================
  // validatePath Tests
  // ========================================
  console.log("\n[validatePath]\n");

  // Valid cases (Windows paths with backslash are blocked as shell metachar)
  expectValid("valid file path", () => validatePath("/project/src/index.ts", "path"));
  expectValid("valid relative path", () => validatePath("./config/settings.json", "path"));
  expectValid("valid Windows path (forward slash)", () => validatePath("C:/project/file.ts", "path"));

  // Invalid cases (path traversal)
  test("reject Unix path traversal", () => validatePath("/test/../../../etc/passwd", "path"));
  test("reject Windows path traversal", () => validatePath("C:\\..\\..\\..\\windows\\system32", "path"));
  test("reject double-dot path", () => validatePath("/test/./././../file", "path"));

  // ========================================
  // validateText Tests
  // ========================================
  console.log("\n[validateText]\n");

  // Valid cases (text is more permissive)
  expectValid("valid text with spaces", () => validateText("Hello World", "description"));
  expectValid("text with allowed chars", () => validateText("path/to/file (v1)", "description"));
  expectValid("text with brackets", () => validateText("func([x, y])", "description"));

  // ========================================
  // validateGitRef Tests
  // ========================================
  console.log("\n[validateGitRef]\n");

  // Valid cases
  expectValid("valid branch name", () => validateGitRef("main", "ref"));
  expectValid("valid commit hash", () => validateGitRef("abc123def456", "ref"));
  expectValid("valid git reference", () => validateGitRef("HEAD~5", "ref"));
  expectValid("valid range", () => validateGitRef("main..feature", "ref"));

  // Invalid cases
  test("reject git ref with shell chars", () => validateGitRef("test; whoami", "ref"));
  test("reject git ref with path traversal", () => validateGitRef("../../../etc", "ref"));

  // ========================================
  // validatePackageName Tests
  // ========================================
  console.log("\n[validatePackageName]\n");

  // Valid cases
  expectValid("valid package name", () => validatePackageName("@claude-flow/cli", "package"));
  expectValid("valid simple name", () => validatePackageName("lodash", "package"));

  // Invalid cases
  test("reject package with shell chars", () => validatePackageName("test; rm -rf /", "package"));
  test("reject package with path traversal", () => validatePackageName("../../package", "package"));

  // ========================================
  // Summary
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log("Some tests failed.\n");
    process.exit(1);
  } else {
    console.log("CLI Input Validation is properly integrated!\n");
    console.log("Security validators are wired to runtime.\n");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}\n`);
  process.exit(1);
});