/**
 * Utility classes for Things 3 MCP Server
 * 
 * Key Design Decisions:
 * - User-friendly parameter mapping: when (user) -> activation_date (Things), deadline (user) -> due_date (Things)
 * - Centralized validation and mapping via ParameterMapper
 * - Consistent error handling and logging patterns
 * - Clean separation of concerns between validation, JXA execution, and data parsing
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { SERVER_CONFIG } from "./server-config.js";

/**
 * Custom error classes for JXA operations (following Raycast pattern)
 */
export class JXAError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'JXAError';
    this.code = code;
    this.originalError = originalError;
  }
}

export class ThingsNotRunningError extends JXAError {
  constructor() {
    super('Things 3 is not running. Please launch Things 3 and try again.', 'THINGS_NOT_RUNNING');
  }
}

export class JXAExecutionError extends JXAError {
  constructor(message, originalError) {
    super(`JXA execution failed: ${message}`, 'JXA_EXECUTION_ERROR', originalError);
  }
}

export class JXAPermissionError extends JXAError {
  constructor() {
    super('Permission denied. Please grant accessibility permissions for this application.', 'PERMISSION_DENIED');
  }
}

export class ThingsValidator {
  static validateStringInput(input, fieldName, maxLength = SERVER_CONFIG.validation.maxStringLength) {
    if (typeof input !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be a string`
      );
    }
    
    if (input.length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} cannot be empty`
      );
    }
    
    if (input.length > maxLength) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} cannot exceed ${maxLength} characters`
      );
    }
    
    // Only reject truly dangerous patterns like script injection attempts
    const dangerousPatterns = [
      /tell\s+application/i,    // Prevents: tell application "System Events" 
      /end\s+tell/i,            // Prevents: end tell (legacy AppleScript pattern)
      /set\s+\w+\s+to/i,        // Prevents: set variable to malicious value
      /do\s+shell\s+script/i,   // Prevents: do shell script "rm -rf /"
      /osascript/i              // Prevents: osascript command injection
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `${fieldName} contains potentially dangerous script patterns`
        );
      }
    }
    
    return input.trim();
  }
  
  static validateArrayInput(input, fieldName, maxItems = SERVER_CONFIG.validation.maxArrayLength) {
    if (!Array.isArray(input)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be an array`
      );
    }
    
    if (input.length > maxItems) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} cannot exceed ${maxItems} items`
      );
    }
    
    return input.map(item => this.validateStringInput(item, `${fieldName} item`, 100));
  }
  
  static validateDateInput(input, fieldName) {
    if (typeof input !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be a string in YYYY-MM-DD format`
      );
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be in YYYY-MM-DD format`
      );
    }
    
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} is not a valid date`
      );
    }
    
    return input;
  }
  
  static validateNumberInput(input, fieldName, min = 1, max = 1000) {
    if (typeof input !== 'number' || !Number.isInteger(input)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be an integer`
      );
    }
    
    if (input < min || input > max) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `${fieldName} must be between ${min} and ${max}`
      );
    }
    
    return input;
  }
}

export class DateConverter {
  /**
   * Convert YYYY-MM-DD date to JavaScript Date object for JXA
   */
  static toJavaScriptDate(isoDate) {
    // Validate input format
    if (!isoDate || typeof isoDate !== 'string') {
      throw new Error('Date must be a non-empty string');
    }
    
    // Check YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(isoDate)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    
    const date = new Date(isoDate + 'T00:00:00');
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${isoDate}`);
    }
    
    return date;
  }
}

export class StatusValidator {
  /**
   * Valid status values for Things 3 items
   */
  static VALID_STATUSES = ["open", "completed", "canceled"];
  static VALID_LISTS = ["inbox", "today", "upcoming", "anytime", "someday", "all"];

  /**
   * Validate status parameter
   */
  static validateStatus(status, fieldName = "status") {
    if (!this.VALID_STATUSES.includes(status)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid ${fieldName}: ${status}. Must be one of: ${this.VALID_STATUSES.join(', ')}`
      );
    }
    return status;
  }

  /**
   * Validate list parameter
   */
  static validateList(list, fieldName = "list") {
    if (!this.VALID_LISTS.includes(list)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid ${fieldName}: ${list}. Must be one of: ${this.VALID_LISTS.join(', ')}`
      );
    }
    return list;
  }

  /**
   * Convert status to JXA filter condition
   */
  static statusToFilter(status) {
    switch(status) {
      case "open":
        return "open";
      case "completed":
        return "completed";
      case "canceled":
        return "canceled";
      default:
        return "open";
    }
  }
}

export class ParameterMapper {
  /**
   * Validate and map user-friendly parameters to internal parameters
   * Maps: when (user) -> activation_date (internal), deadline (user) -> due_date (internal)
   */
  static validateAndMapParameters(args, additionalFields = {}) {
    const result = {
      // Support both old (name) and new (title) parameter names for backward compatibility
      name: args.title ? ThingsValidator.validateStringInput(args.title, "title") : 
            (args.name ? ThingsValidator.validateStringInput(args.name, "name") : null),
      title: args.title ? ThingsValidator.validateStringInput(args.title, "title") : null,
      id: args.id ? ThingsValidator.validateStringInput(args.id, "id") : null,
      notes: args.notes ? ThingsValidator.validateStringInput(args.notes, "notes", SERVER_CONFIG.validation.maxNotesLength) : null,
      
      // Map user-friendly parameters to internal Things 3 parameters
      // User terminology -> Things 3 terminology:
      // - "when" (when to work on it) -> "activation_date" (Things 3 internal field)
      // - "deadline" (when it's due) -> "due_date" (Things 3 internal field)
      // Also supports legacy parameter names for backward compatibility
      activation_date: args.when ? ThingsValidator.validateDateInput(args.when, "when") : 
                      (args.due_date ? ThingsValidator.validateDateInput(args.due_date, "due_date") : null),
      due_date: args.deadline ? ThingsValidator.validateDateInput(args.deadline, "deadline") : null,
      
      // Area and project mappings
      area: args.area_title ? ThingsValidator.validateStringInput(args.area_title, "area_title") : 
            (args.area ? ThingsValidator.validateStringInput(args.area, "area") : null),
      area_id: args.area_id ? ThingsValidator.validateStringInput(args.area_id, "area_id") : null,
      project: args.list_title ? ThingsValidator.validateStringInput(args.list_title, "list_title") : 
               (args.project ? ThingsValidator.validateStringInput(args.project, "project") : null),
      list_id: args.list_id ? ThingsValidator.validateStringInput(args.list_id, "list_id") : null,
      
      // Additional fields
      tags: args.tags ? ThingsValidator.validateArrayInput(args.tags, "tags") : null,
      checklist_items: args.checklist_items ? ThingsValidator.validateArrayInput(args.checklist_items, "checklist_items") : null,
      todos: args.todos ? ThingsValidator.validateArrayInput(args.todos, "todos") : null,
      heading: args.heading ? ThingsValidator.validateStringInput(args.heading, "heading") : null,
      
      // Status flags
      completed: args.completed !== undefined ? Boolean(args.completed) : null,
      canceled: args.canceled !== undefined ? Boolean(args.canceled) : null,
      
      ...additionalFields
    };
    
    // Remove null values to keep the object clean
    return Object.fromEntries(Object.entries(result).filter(([_, v]) => v !== null));
  }
}

export class ThingsLogger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    // Only log to stderr to avoid interfering with MCP communication
    // Reduce verbosity during normal operations to prevent stdio interference
    if (level === 'error' || process.env.DEBUG === 'true') {
      console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
    }
  }
  
  static info(message, data) {
    this.log('info', message, data);
  }
  
  static warn(message, data) {
    this.log('warn', message, data);
  }
  
  static error(message, data) {
    this.log('error', message, data);
  }
  
  static debug(message, data) {
    if (process.env.DEBUG === 'true') {
      this.log('debug', message, data);
    }
  }
  
  /**
   * Log warnings for project/area assignments that might not exist
   */
  static logAssignmentWarnings(scriptParams, operation = "created") {
    const itemName = scriptParams.title || scriptParams.name;
    if (scriptParams.project || scriptParams.list_title) {
      this.info(`Item ${operation} with project assignment`, { 
        name: itemName, 
        project: scriptParams.project || scriptParams.list_title,
        note: "If project doesn't exist, item will remain in current location"
      });
    }
    if (scriptParams.area || scriptParams.area_title) {
      this.info(`Item ${operation} with area assignment`, { 
        name: itemName, 
        area: scriptParams.area || scriptParams.area_title,
        note: "If area doesn't exist, item will remain in current location"
      });
    }
  }
}