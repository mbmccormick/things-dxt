#!/usr/bin/env node

/**
 * Simple test runner for Things 3 MCP Server
 * Runs unit tests without requiring external dependencies
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning ${path.basename(testFile)}...`);
    console.log('─'.repeat(50));
    
    const child = spawn('node', [testFile], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function main() {
  console.log('🧪 Things 3 MCP Server Test Suite');
  console.log('='.repeat(50));
  
  const testFiles = [
    path.join(__dirname, 'validation.test.js'),
    path.join(__dirname, 'parameter-mapping.test.js'),
    path.join(__dirname, 'response-formatter.test.js'),
    path.join(__dirname, 'tags-handling.test.js'),
    path.join(__dirname, 'project-todos.test.js'),
    path.join(__dirname, 'area-id-support.test.js')
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testFile of testFiles) {
    try {
      // Check if test file exists
      await fs.access(testFile);
      await runTest(testFile);
      passed++;
    } catch (error) {
      console.error(`❌ ${path.basename(testFile)} failed:`, error.message);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);