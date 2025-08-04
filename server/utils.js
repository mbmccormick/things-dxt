/**
 * Consolidated utility classes for Things 3 MCP Server
 * Simplified after modular JXA migration
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

export class ThingsLogger {
  static debug(message, data = {}) {
    if (process.env.DEBUG) {
      console.error(`[DEBUG] ${message}`, data);
    }
  }
  
  static info(message, data = {}) {
    console.error(`[INFO] ${message}`, data);
  }
  
  static warn(message, data = {}) {
    console.error(`[WARN] ${message}`, data);
  }
  
  static error(message, data = {}) {
    console.error(`[ERROR] ${message}`, data);
  }
}

export class InputValidator {
  /**
   * Validate string input for dangerous patterns
   */
  static validateStringInput(value, fieldName) {
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /tell\s+application/i,
      /do\s+shell\s+script/i,
      /osascript/i,
      /AppleScript/i,
      /JavaScript\s+for\s+Automation/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        throw new Error(`Input contains dangerous script patterns: ${fieldName}`);
      }
    }
    
    return value;
  }
  
  /**
   * Validate date input format
   */
  static validateDateInput(value, fieldName) {
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
    }
    
    const date = new Date(value + 'T00:00:00');
    if (isNaN(date.getTime())) {
      throw new Error(`${fieldName} is not a valid date`);
    }
    
    return value;
  }
  
  /**
   * Validate array input
   */
  static validateArrayInput(value, fieldName) {
    if (!Array.isArray(value)) {
      throw new Error(`${fieldName} must be an array`);
    }
    
    for (const item of value) {
      if (typeof item !== 'string') {
        throw new Error(`${fieldName} must contain only strings`);
      }
    }
    
    return value;
  }
  
  /**
   * Validate number input
   */
  static validateNumberInput(value, fieldName) {
    if (typeof value !== 'number') {
      throw new Error(`${fieldName} must be a number`);
    }
    
    if (value < 0) {
      throw new Error(`${fieldName} must be positive`);
    }
    
    return value;
  }
}

export class ParameterProcessor {
  /**
   * Process and validate parameters for JXA execution
   * Maps user-friendly terms to Things 3 internal terminology
   */
  static process(params) {
    const processed = { ...params };
    
    // Validate tags parameter if present
    if (params.tags !== undefined && params.tags !== null && !Array.isArray(params.tags)) {
      throw new Error('tags must be an array');
    }
    
    // Map user-friendly parameter names to Things 3 internal names
    if (params.title !== undefined) {
      processed.name = params.title;
      delete processed.title;
    }
    
    // when (user-friendly) → activation_date (Things 3 internal)
    if (params.when !== undefined) {
      processed.activation_date = params.when;
      delete processed.when;
    }
    
    // deadline (user-friendly) → due_date (Things 3 internal)
    if (params.deadline !== undefined) {
      processed.due_date = params.deadline;
      delete processed.deadline;
    }
    
    // checklist_items (user-friendly) → child_tasks (internal)
    if (params.checklist_items !== undefined) {
      processed.child_tasks = params.checklist_items;
      delete processed.checklist_items;
    }
    
    return processed;
  }
}

