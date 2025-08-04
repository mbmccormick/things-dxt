/**
 * Test Utilities for Things DXT Test Suite
 * 
 * Provides common testing helpers, assertions, and mock factories
 */

import { strict as assert } from 'assert';
import { execSync } from 'child_process';

/**
 * Simple test framework
 */
export class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  test(description, testFn) {
    this.tests.push({ description, testFn });
  }
  
  async run() {
    console.log(`\n🧪 ${this.name}`);
    console.log('='.repeat(this.name.length + 3));
    
    for (const { description, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`  ✅ ${description}`);
        this.passed++;
      } catch (error) {
        console.log(`  ❌ ${description}`);
        console.log(`     ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 ${this.passed} passed, ${this.failed} failed\n`);
    
    if (this.failed > 0) {
      throw new Error(`${this.failed} test(s) failed in ${this.name}`);
    }
  }
}

/**
 * Enhanced assertions
 */
export const expect = {
  /**
   * Assert that value is truthy
   */
  toBeTruthy(value, message) {
    assert(value, message || `Expected ${value} to be truthy`);
  },
  
  /**
   * Assert that value is falsy
   */
  toBeFalsy(value, message) {
    assert(!value, message || `Expected ${value} to be falsy`);
  },
  
  /**
   * Assert strict equality
   */
  toEqual(actual, expected, message) {
    assert.strictEqual(actual, expected, message);
  },
  
  /**
   * Assert deep equality for objects/arrays
   */
  toDeepEqual(actual, expected, message) {
    assert.deepStrictEqual(actual, expected, message);
  },
  
  /**
   * Assert that function throws
   */
  toThrow(fn, expectedError, message) {
    if (typeof expectedError === 'string') {
      // If expectedError is a string, treat it as the message
      message = expectedError;
      expectedError = undefined;
    }
    assert.throws(fn, expectedError, message);
  },
  
  /**
   * Assert that async function rejects
   */
  async toReject(promise, expectedError, message) {
    await assert.rejects(promise, expectedError, message);
  },
  
  /**
   * Assert that value contains substring
   */
  toContain(haystack, needle, message) {
    assert(
      haystack.includes(needle), 
      message || `Expected "${haystack}" to contain "${needle}"`
    );
  },
  
  /**
   * Assert that array has length
   */
  toHaveLength(array, length, message) {
    assert.strictEqual(
      array.length, 
      length, 
      message || `Expected array to have length ${length}, got ${array.length}`
    );
  },
  
  /**
   * Assert that object has property
   */
  toHaveProperty(obj, prop, message) {
    assert(
      obj.hasOwnProperty(prop), 
      message || `Expected object to have property "${prop}"`
    );
  },
  
  /**
   * Assert that value is valid JSON
   */
  toBeValidJSON(str, message) {
    try {
      JSON.parse(str);
    } catch (error) {
      throw new Error(message || `Expected valid JSON, got parse error: ${error.message}`);
    }
  },
  
  /**
   * Assert that date strings are equal (ignoring timezone)
   */
  toEqualDate(actual, expected, message) {
    const actualDate = new Date(actual).toISOString().split('T')[0];
    const expectedDate = new Date(expected).toISOString().split('T')[0];
    assert.strictEqual(actualDate, expectedDate, message);
  }
};

/**
 * Mock factory for MCP requests
 */
export class MockMCPRequest {
  static listTools() {
    return {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {}
    };
  }
  
  static callTool(name, args = {}) {
    return {
      jsonrpc: "2.0", 
      id: 2,
      method: "tools/call",
      params: {
        name,
        arguments: args
      }
    };
  }
}

/**
 * Mock JXA responses for testing
 */
export class MockJXAResponse {
  static success(data) {
    return JSON.stringify({
      success: true,
      data
    });
  }
  
  static error(message, type = 'Error') {
    return JSON.stringify({
      success: false,
      error: {
        message,
        type
      }
    });
  }
  
  static todo(overrides = {}) {
    return {
      id: "test-todo-id",
      name: "Test Todo",
      status: "open",
      notes: "",
      tagNames: "",
      tags: [],
      deadline: null,
      when: null,
      creationDate: "2025-08-04T15:00:00.000Z",
      modificationDate: "2025-08-04T15:00:00.000Z",
      completionDate: null,
      cancellationDate: null,
      checklistItems: [],
      ...overrides
    };
  }
  
  static project(overrides = {}) {
    return {
      id: "test-project-id",
      name: "Test Project",
      status: "open",
      notes: "",
      tagNames: "",
      tags: [],
      deadline: null,
      when: null,
      creationDate: "2025-08-04T15:00:00.000Z",
      modificationDate: "2025-08-04T15:00:00.000Z",
      completionDate: null,
      cancellationDate: null,
      area: null,
      ...overrides
    };
  }
  
  static area(overrides = {}) {
    return {
      id: "test-area-id",
      name: "Test Area",
      tagNames: "",
      tags: [],
      collapsed: false,
      ...overrides
    };
  }
}

/**
 * Test helpers for Things 3 operations
 */
export class ThingsTestHelper {
  /**
   * Check if Things 3 is running
   */
  static async isRunning() {
    try {
      execSync('osascript -l JavaScript -e "Application(\\"com.culturedcode.ThingsMac\\").running()"', { 
        stdio: 'pipe' 
      });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Execute a JXA script for testing
   */
  static async executeJXA(script, params = {}) {
    const tempScript = '/tmp/test-script.js';
    const fs = await import('fs');
    
    // Write script to temp file to avoid shell escaping issues
    fs.writeFileSync(tempScript, script);
    
    try {
      const result = execSync(`osascript -l JavaScript "${tempScript}" '${JSON.stringify(params)}'`, { 
        encoding: 'utf8' 
      });
      return JSON.parse(result.trim());
    } catch (error) {
      throw new Error(`JXA execution failed: ${error.message}`);
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempScript);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  /**
   * Get test list IDs from Things 3
   */
  static async getListIDs() {
    const script = `
      function run(argv) {
        try {
          const things = Application('com.culturedcode.ThingsMac');
          const lists = things.lists();
          const listData = [];
          
          for (let list of lists) {
            listData.push({
              id: list.id(),
              name: list.name()
            });
          }
          
          return JSON.stringify({
            success: true,
            data: listData
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: { message: error.message, type: error.name }
          });
        }
      }
    `;
    
    return await this.executeJXA(script);
  }
  
  /**
   * Create a test todo for integration testing
   */
  static async createTestTodo(name = 'Test Todo', cleanup = true) {
    const script = `
      function run(argv) {
        try {
          const params = JSON.parse(argv[0] || '{}');
          const things = Application('com.culturedcode.ThingsMac');
          
          const todo = things.ToDo({ name: params.name });
          things.toDos.push(todo);
          
          return JSON.stringify({
            success: true,
            data: {
              id: todo.id(),
              name: todo.name()
            }
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: { message: error.message, type: error.name }
          });
        }
      }
    `;
    
    const result = await this.executeJXA(script, { name });
    
    if (cleanup && result.success) {
      // Store for cleanup
      this._testTodos = this._testTodos || [];
      this._testTodos.push(result.data.id);
    }
    
    return result;
  }
  
  /**
   * Clean up test todos
   */
  static async cleanup() {
    if (!this._testTodos || this._testTodos.length === 0) return;
    
    const script = `
      function run(argv) {
        try {
          const params = JSON.parse(argv[0] || '{}');
          const things = Application('com.culturedcode.ThingsMac');
          
          for (const todoId of params.todoIds) {
            try {
              const todo = things.toDos.byId(todoId);
              things.delete(todo);
            } catch (e) {
              // Todo might already be deleted
            }
          }
          
          return JSON.stringify({ success: true });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: { message: error.message, type: error.name }
          });
        }
      }
    `;
    
    await this.executeJXA(script, { todoIds: this._testTodos });
    this._testTodos = [];
  }
}

/**
 * Validation helpers
 */
export class ValidationHelper {
  /**
   * Validate MCP tool definition structure
   */
  static validateToolDefinition(tool) {
    expect.toHaveProperty(tool, 'name');
    expect.toHaveProperty(tool, 'description');
    expect.toHaveProperty(tool, 'inputSchema');
    
    expect.toHaveProperty(tool.inputSchema, 'type');
    expect.toEqual(tool.inputSchema.type, 'object');
    
    if (tool.inputSchema.properties) {
      assert(typeof tool.inputSchema.properties === 'object');
    }
  }
  
  /**
   * Validate Things 3 todo object structure
   */
  static validateTodo(todo) {
    expect.toHaveProperty(todo, 'id');
    expect.toHaveProperty(todo, 'name');
    expect.toHaveProperty(todo, 'status');
    expect.toHaveProperty(todo, 'tagNames');
    expect.toHaveProperty(todo, 'tags');
    
    // Tags should be both string (tagNames) and array (tags)
    assert(typeof todo.tagNames === 'string');
    assert(Array.isArray(todo.tags));
    
    // Status should be valid
    assert(['open', 'completed', 'canceled'].includes(todo.status));
  }
  
  /**
   * Validate Things 3 project object structure
   */
  static validateProject(project) {
    expect.toHaveProperty(project, 'id');
    expect.toHaveProperty(project, 'name');
    expect.toHaveProperty(project, 'status');
    expect.toHaveProperty(project, 'tagNames');
    expect.toHaveProperty(project, 'tags');
    
    assert(typeof project.tagNames === 'string');
    assert(Array.isArray(project.tags));
    assert(['open', 'completed', 'canceled'].includes(project.status));
  }
}

export default {
  TestSuite,
  expect,
  MockMCPRequest,
  MockJXAResponse,
  ThingsTestHelper,
  ValidationHelper
};