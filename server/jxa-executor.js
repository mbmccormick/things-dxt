/**
 * JXA Executor using bundled modular scripts
 * Improved with better error handling and logging
 */

import { execFile } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ThingsLogger } from "./utils.js";

const execFileAsync = promisify(execFile);

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class JXAExecutor {
  constructor() {
    // Use path relative to this script file, not process.cwd()
    this.scriptsDir = path.join(__dirname, '..', 'jxa', 'build');
    this.timeout = 30000;
    this.maxBuffer = 10 * 1024 * 1024; // 10MB
  }
  
  /**
   * Execute JXA operation using pre-built bundled script
   */
  async execute(operation, params = {}) {
    const startTime = Date.now();
    
    try {
      ThingsLogger.debug(`Executing JXA operation: ${operation}`, { 
        params: Object.keys(params)
      });
      
      // Load the bundled script
      const script = await this.loadScript(operation);
      
      // Execute with secure parameter passing
      const result = await this.executeScript(script, params);
      
      const duration = Date.now() - startTime;
      ThingsLogger.debug(`JXA operation completed: ${operation}`, { 
        duration: `${duration}ms`,
        resultSize: JSON.stringify(result).length
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      ThingsLogger.error(`JXA operation failed: ${operation}`, {
        error: error.message,
        duration: `${duration}ms`,
        params: Object.keys(params)
      });
      
      // Re-throw with better context
      if (error instanceof McpError) {
        throw error;
      }
      
      throw this.createMcpError(error, operation);
    }
  }
  
  /**
   * Load bundled script for operation
   */
  async loadScript(operation) {
    try {
      const scriptPath = path.join(this.scriptsDir, `${operation}.js`);
      return await readFile(scriptPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new McpError(
          ErrorCode.InternalError,
          `JXA script not found for operation '${operation}'. Run 'npm run build' to generate scripts.`
        );
      }
      throw error;
    }
  }
  
  /**
   * Execute script with secure parameter passing via execFile
   */
  async executeScript(script, params) {
    const args = [
      '-l', 'JavaScript',    // Use JXA
      '-e', script,          // Execute script
      JSON.stringify(params) // Pass params as JSON
    ];
    
    try {
      const { stdout, stderr } = await execFileAsync('osascript', args, {
        timeout: this.timeout,
        maxBuffer: this.maxBuffer,
      });
      
      if (stderr && stderr.trim()) {
        ThingsLogger.warn("JXA stderr output", { stderr: stderr.trim() });
        throw new Error(`JXA error: ${stderr.trim()}`);
      }
      
      return this.parseResponse(stdout);
      
    } catch (error) {
      // Enhanced error handling for common JXA issues
      if (error.code === 'ETIMEDOUT') {
        throw new McpError(
          ErrorCode.InternalError,
          `JXA execution timed out after ${this.timeout}ms`
        );
      }
      
      if (error.message.includes('Application isn\'t running')) {
        throw new McpError(
          ErrorCode.InternalError,
          'Things 3 is not running. Please start Things 3 and try again.'
        );
      }
      
      if (error.message.includes('not authorized')) {
        throw new McpError(
          ErrorCode.InternalError,
          'Automation access denied. Please enable automation for this application in System Preferences > Security & Privacy > Privacy > Automation.'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Parse JXA response with error handling
   */
  parseResponse(stdout) {
    const response = stdout.trim();
    
    if (!response) {
      throw new Error('Empty response from JXA script');
    }
    
    try {
      const parsed = JSON.parse(response);
      
      if (parsed.success === false) {
        const errorMsg = parsed.error?.message || 'Unknown JXA error';
        throw new Error(errorMsg);
      }
      
      if (parsed.success === true) {
        return parsed.data;
      }
      
      // Legacy response format (direct data)
      return parsed;
      
    } catch (parseError) {
      if (parseError.name === 'SyntaxError') {
        ThingsLogger.error("Invalid JSON response from JXA", { 
          response: response.substring(0, 500) 
        });
        throw new Error(`Invalid JSON response from JXA: ${parseError.message}`);
      }
      throw parseError;
    }
  }
  
  /**
   * Create appropriate MCP error from generic error
   */
  createMcpError(error, operation) {
    const message = error.message || String(error);
    
    if (message.includes('not found') || message.includes('ENOENT')) {
      return new McpError(
        ErrorCode.InternalError,
        `Operation '${operation}' not available: ${message}`
      );
    }
    
    if (message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return new McpError(
        ErrorCode.InternalError,
        `Operation '${operation}' timed out: ${message}`
      );
    }
    
    if (message.includes('permission') || message.includes('authorized')) {
      return new McpError(
        ErrorCode.InternalError,
        `Permission denied for operation '${operation}': ${message}`
      );
    }
    
    return new McpError(
      ErrorCode.InternalError,
      `Operation '${operation}' failed: ${message}`
    );
  }
  
  /**
   * Check if bundled scripts are available
   */
  async isReady() {
    try {
      const testScript = path.join(this.scriptsDir, 'get_inbox.js');
      await readFile(testScript);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Rebuild scripts if needed
   */
  async rebuild() {
    const { exec } = await import('child_process');
    const execAsync = promisify(exec);
    
    ThingsLogger.info("Rebuilding JXA scripts...");
    
    try {
      const { stdout, stderr } = await execAsync('node jxa/build.js', {
        timeout: 60000, // 1 minute timeout for build
      });
      
      if (stderr) {
        ThingsLogger.warn("Build warnings", { stderr });
      }
      
      ThingsLogger.debug("Build output", { stdout });
      
    } catch (error) {
      ThingsLogger.error("Build failed", { error: error.message });
      throw new Error(`Failed to rebuild JXA scripts: ${error.message}`);
    }
  }
}