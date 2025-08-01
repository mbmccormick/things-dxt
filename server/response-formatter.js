/**
 * Response Formatter for Things 3 JXA Integration
 * 
 * This module provides utilities for creating standardized MCP responses
 * from JXA execution results.
 */

export class ResponseFormatter {
  /**
   * Create a standardized success response for MCP tools
   * @param {Object} data - The data to include in the response
   * @returns {Object} Formatted MCP response
   */
  static createSuccessResponse(data) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data),
        },
      ],
    };
  }

  /**
   * Create a standardized error response for MCP tools
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {Object} Formatted MCP error response
   */
  static createErrorResponse(message, code = 'UNKNOWN_ERROR') {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: {
              message,
              code
            }
          }),
        },
      ],
    };
  }
}