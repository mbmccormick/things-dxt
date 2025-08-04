#!/usr/bin/env node

/**
 * Things 3 MCP Server
 * 
 * Streamlined server using modular JXA architecture
 * Implements secure execFile-based JXA execution with bundled scripts
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOL_DEFINITIONS } from "./tool-definitions.js";
import { JXAExecutor } from "./jxa-executor.js";
import { ThingsLogger, ParameterProcessor } from "./utils.js";
import { SERVER_CONFIG } from "./server-config.js";

class ThingsServer {
  constructor() {
    this.server = new Server(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
      },
      {
        capabilities: SERVER_CONFIG.capabilities,
      }
    );
    
    this.jxaExecutor = new JXAExecutor();
    this.setupHandlers();
    this.ensureScriptsReady();
  }
  
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS,
    }));
    
    // Execute tool requests directly via JXA
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Process parameters for consistency and validation
        const processedArgs = ParameterProcessor.process(args || {});
        
        // Execute via modular JXA
        const result = await this.jxaExecutor.execute(name, processedArgs);
        
        return {
          content: [
            {
              type: "text",
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        ThingsLogger.error(`Tool execution failed: ${name}`, { 
          error: error.message,
          args: args 
        });
        throw error;
      }
    });
    
    // Error handling
    this.server.onerror = (error) => {
      ThingsLogger.error("MCP Server Error", { 
        error: error.message, 
        stack: error.stack 
      });
    };
    
    // Graceful shutdown
    process.on("SIGINT", async () => {
      ThingsLogger.info("Received SIGINT, shutting down gracefully");
      await this.server.close();
      process.exit(0);
    });
  }
  
  async ensureScriptsReady() {
    try {
      const isReady = await this.jxaExecutor.isReady();
      if (!isReady) {
        ThingsLogger.info("JXA scripts not found. Building...");
        await this.jxaExecutor.rebuild();
        ThingsLogger.info("JXA scripts built successfully");
      } else {
        ThingsLogger.debug("JXA scripts are ready");
      }
    } catch (error) {
      ThingsLogger.error("Failed to ensure JXA scripts are ready", { 
        error: error.message 
      });
      // Continue startup - let individual tool calls fail with better error messages
    }
  }
  
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    ThingsLogger.info("Things MCP server running on stdio");
  }
}

// Start the server
const server = new ThingsServer();
server.start().catch((error) => {
  ThingsLogger.error("Server startup failed", { error: error.message });
  process.exit(1);
});