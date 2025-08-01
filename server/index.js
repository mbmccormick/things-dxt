#!/usr/bin/env node

/**
 * Things 3 MCP Server - Main Entry Point
 * 
 * This server provides MCP tools for creating, updating, and managing items in Things 3.
 * Key features:
 * - User-friendly date parameter mapping (when = when to work on, deadline = when actually due)
 * - Comprehensive CRUD operations for todos, projects, and areas
 * - Robust error handling and validation
 * - Centralized parameter mapping and JXA execution
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

import { ThingsLogger, ThingsNotRunningError, JXAExecutionError, JXAPermissionError } from "./utils.js";
import { JXATemplates } from "./jxa-templates.js";
import { TOOL_DEFINITIONS } from "./tool-definitions.js";
import { ToolHandlers } from "./tool-handlers.js";
import { SERVER_CONFIG, ERROR_MESSAGES } from "./server-config.js";

const execAsync = promisify(exec);

class ThingsExtension {
  constructor() {
    try {
      this.server = new Server(
        {
          name: SERVER_CONFIG.name,
          version: SERVER_CONFIG.version,
        },
        {
          capabilities: SERVER_CONFIG.capabilities,
        }
      );

      // Initialize tool handlers with bound methods
      this.toolHandlers = new ToolHandlers(
        this.executeJXA.bind(this),
        this.executeThingsJXA.bind(this)
      );

      this.setupToolHandlers();
      this.setupErrorHandling();
    } catch (error) {
      console.error("Failed to initialize Things MCP server:", error);
      process.exit(1);
    }
  }


  setupErrorHandling() {
    this.server.onerror = (error) => {
      ThingsLogger.error("MCP Server Error", { error: error.message, stack: error.stack });
    };

    process.on("SIGINT", async () => {
      ThingsLogger.info("Received SIGINT, shutting down gracefully");
      await this.server.close();
      process.exit(0);
    });

    process.on("uncaughtException", (error) => {
      ThingsLogger.error("Uncaught Exception", { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      ThingsLogger.error("Unhandled Rejection", { reason, promise });
      process.exit(1);
    });
  }


  /**
   * Execute JavaScript for Automation (JXA) with parameters
   * @param {string} script - The JXA script to execute
   * @param {Record<string, any>} params - Parameters to pass to the script (default: {})
   * @param {number} timeout - Timeout in milliseconds (default from SERVER_CONFIG.jxa.timeout)
   * @returns {Promise<{success: boolean, data?: any, error?: {type: string, message: string, code: number}}>} Parsed JSON response from the script
   * @throws {JXAExecutionError} When JXA script execution fails
   * @throws {JXAPermissionError} When accessibility permissions are denied
   * @throws {McpError} When script size exceeds limits or other validation fails
   */
  async executeJXA(script, params = {}, timeout = SERVER_CONFIG.jxa.timeout) {
    try {
      // Validate script size to prevent DoS attacks
      if (script.length > SERVER_CONFIG.validation.maxScriptSize) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Generated JXA script too large: ${script.length} bytes (max: ${SERVER_CONFIG.validation.maxScriptSize})`
        );
      }

      ThingsLogger.debug("Executing JXA script", { 
        scriptLength: script.length,
        hasParams: Object.keys(params).length > 0,
        scriptPreview: script.substring(0, 100) + '...'
      });
      
      // JXA script escaping - handle multi-line scripts properly
      // Replace single quotes with a special sequence that works in shell
      const escapedScript = script.replace(/'/g, "'\"'\"'");
      
      // Optimize parameter handling - avoid JSON.stringify for empty objects
      const hasParams = Object.keys(params).length > 0;
      let command;
      
      if (hasParams) {
        const jsonParams = JSON.stringify(params);
        // Parameter escaping for shell
        const escapedParams = jsonParams.replace(/'/g, "'\"'\"'");
        command = `osascript -l JavaScript -e '${escapedScript}' '${escapedParams}'`;
      } else {
        // No parameters - skip JSON processing entirely
        command = `osascript -l JavaScript -e '${escapedScript}' '{}'`;
      }
      
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        maxBuffer: SERVER_CONFIG.jxa.maxBuffer,
      });
      
      if (stderr) {
        ThingsLogger.warn("JXA stderr output", { stderr });
        throw new Error(`JXA error: ${stderr}`);
      }
      
      const result = stdout.trim();
      ThingsLogger.debug("JXA execution completed", { resultLength: result.length });
      
      // Parse the JSON response
      try {
        const parsed = JSON.parse(result);
        
        // Check if the script returned an error
        if (parsed.success === false && parsed.error) {
          throw new JXAExecutionError(parsed.error.message || 'JXA script returned an error');
        }
        
        return parsed;
      } catch (parseError) {
        ThingsLogger.error("Failed to parse JXA response", { 
          response: result,
          error: parseError.message 
        });
        throw new JXAExecutionError(`Invalid JXA response: ${parseError.message}`, parseError);
      }
    } catch (error) {
      ThingsLogger.error("JXA execution failed", { 
        error: error.message,
        code: error.code,
        timeout: error.code === 'ETIMEDOUT',
        stderr: error.stderr,
        stdout: error.stdout
      });
      
      if (error.code === 'ETIMEDOUT') {
        throw new McpError(
          ErrorCode.InternalError,
          ERROR_MESSAGES.JXA_TIMEOUT
        );
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `JXA execution failed: ${error.message}`
      );
    }
  }

  /**
   * Execute JXA template for Things operations
   * @param {() => string} templateFunction - JXA template function that returns a script string
   * @param {Record<string, any>} params - Parameters to pass to the script
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise<any>} Response data from the script (extracted from success response)
   * @throws {Error} When JXA execution fails or returns error response
   */
  async executeThingsJXA(templateFunction, params, operationName) {
    try {
      const script = templateFunction(params);
      const result = await this.executeJXA(script, params);
      
      if (result.success && result.data) {
        return result.data;
      }
      
      throw new Error(result.error?.message || 'Unknown error occurred');
    } catch (error) {
      ThingsLogger.error(`${operationName} failed`, { 
        params,
        error: error.message 
      });
      throw error;
    }
  }

  async validateThingsRunning() {
    try {
      const result = await this.executeJXA(JXATemplates.isThingsRunning(), {});
      if (!result.success || !result.data) {
        throw new ThingsNotRunningError();
      }
    } catch (error) {
      if (error instanceof ThingsNotRunningError) throw error;
      
      // Log the actual error for debugging
      ThingsLogger.error("Things 3 check failed", { 
        error: error.message,
        stack: error.stack
      });
      
      throw new McpError(
        ErrorCode.InternalError,
        ERROR_MESSAGES.THINGS_CHECK_FAILED
      );
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: TOOL_DEFINITIONS,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Validate request size to prevent DoS attacks
        const requestSize = JSON.stringify(request).length;
        if (requestSize > SERVER_CONFIG.validation.maxRequestSize) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Request too large: ${requestSize} bytes (max: ${SERVER_CONFIG.validation.maxRequestSize})`
          );
        }

        await this.validateThingsRunning();

        // Route to appropriate handler method
        const handlerMethod = this.getHandlerMethod(name);
        if (!handlerMethod) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        return await handlerMethod.call(this.toolHandlers, args);
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  // Static handler method mapping for O(1) lookup performance
  static HANDLER_METHOD_MAP = new Map([
    ["add_todo", "addTodo"],
    ["add_project", "addProject"],
    ["get_areas", "getAreas"],
    ["get_todos", "getTodos"],
    ["get_projects", "getProjects"],
    ["get_inbox", "getInbox"],
    ["get_today", "getToday"],
    ["get_upcoming", "getUpcoming"],
    ["get_anytime", "getAnytime"],
    ["get_someday", "getSomeday"],
    ["get_logbook", "getLogbook"],
    ["get_trash", "getTrash"],
    ["get_tags", "getTags"],
    ["get_tagged_items", "getTaggedItems"],
    ["search_todos", "searchTodos"],
    ["search_advanced", "searchAdvanced"],
    ["get_recent", "getRecent"],
    ["update_todo", "updateTodo"],
    ["update_project", "updateProject"],
    ["show_item", "showItem"],
    ["search_items", "searchItems"],
  ]);

  getHandlerMethod(toolName) {
    const methodName = this.constructor.HANDLER_METHOD_MAP.get(toolName);
    return methodName ? this.toolHandlers[methodName] : null;
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      // Only log startup message in debug mode to prevent stdio interference
      if (process.env.DEBUG === 'true') {
        console.error("Things DXT MCP server running on stdio");
      }
    } catch (error) {
      console.error("Failed to start MCP server:", error);
      process.exit(1);
    }
  }
}

const server = new ThingsExtension();
server.run().catch(error => {
  console.error("Critical error starting Things MCP server:", error);
  process.exit(1);
});