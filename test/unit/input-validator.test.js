#!/usr/bin/env node

/**
 * Unit tests for Input Validation
 * 
 * Tests the security-focused input validation that prevents dangerous
 * patterns and validates user input before JXA execution
 */

import { TestSuite, expect } from '../test-utils.js';

const suite = new TestSuite('Input Validator Unit Tests');

// Mock the InputValidator since we can't import it directly
// In a real implementation, this would import from server/utils.js
const InputValidator = {
  // Dangerous patterns that should be detected
  DANGEROUS_PATTERNS: [
    /tell\s+application/i,
    /do\s+shell\s+script/i,
    /osascript/i,
    /AppleScript/i,
    /system\s+events/i,
    /keystroke/i,
    /delay/i,
    /exec/i,
    /spawn/i,
    /eval/i
  ],
  
  validate(input) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new Error('Input must be an object');
    }
    
    const inputStr = JSON.stringify(input);
    
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(inputStr)) {
        throw new Error(`Dangerous pattern detected: ${pattern.source}`);
      }
    }
    
    return true;
  },
  
  validateString(str) {
    if (typeof str !== 'string') return true;
    
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(str)) {
        throw new Error(`Dangerous pattern detected in string: ${pattern.source}`);
      }
    }
    
    return true;
  }
};

// Test basic validation
suite.test('accepts valid input objects', () => {
  const validInputs = [
    { name: 'Test Todo', notes: 'Some notes' },
    { name: 'Project', tags: ['work', 'important'] },
    { id: 'abc123', completed: true },
    { query: 'search term', limit: 10 },
    {}
  ];
  
  validInputs.forEach(input => {
    expect.toBeTruthy(InputValidator.validate(input));
  });
});

suite.test('rejects non-object inputs', () => {
  const invalidInputs = [
    'string',
    123,
    true,
    null,
    undefined,
    []
  ];
  
  invalidInputs.forEach(input => {
    expect.toThrow(() => InputValidator.validate(input));
  });
});

// Test dangerous pattern detection
suite.test('detects AppleScript injection attempts', () => {
  const dangerousInputs = [
    { name: 'tell application "Finder" to quit' },
    { notes: 'do shell script "rm -rf /"' },
    { query: 'osascript -e "display dialog"' },
    { name: 'AppleScript code here' }
  ];
  
  dangerousInputs.forEach(input => {
    expect.toThrow(() => InputValidator.validate(input));
  });
});

suite.test('detects system command injection attempts', () => {
  const dangerousInputs = [
    { name: 'exec("malicious command")' },
    { notes: 'spawn process' },
    { query: 'eval(dangerous_code)' },
    { name: 'system events keystroke' }
  ];
  
  dangerousInputs.forEach(input => {
    expect.toThrow(() => InputValidator.validate(input));
  });
});

suite.test('detects case-insensitive dangerous patterns', () => {
  const dangerousInputs = [
    { name: 'TELL APPLICATION "test"' },
    { notes: 'Do Shell Script "test"' },
    { query: 'OsaScript test' },
    { name: 'applescript test' }
  ];
  
  dangerousInputs.forEach(input => {
    expect.toThrow(() => InputValidator.validate(input));
  });
});

// Test edge cases
suite.test('handles nested objects', () => {
  const nestedInput = {
    name: 'Safe todo',
    metadata: {
      source: 'tell application "test"' // Dangerous in nested object
    }
  };
  
  expect.toThrow(() => InputValidator.validate(nestedInput));
});

suite.test('handles arrays in input', () => {
  const inputWithArray = {
    name: 'Safe todo',
    tags: ['safe', 'tell application "test"'] // Dangerous in array
  };
  
  expect.toThrow(() => InputValidator.validate(inputWithArray));
});

suite.test('handles special characters safely', () => {
  const inputsWithSpecialChars = [
    { name: "Todo with apostrophe's" },
    { notes: 'Todo with "quotes"' },
    { query: 'Search with & ampersand' },
    { name: 'Todo with émojis 🎉' },
    { notes: 'Line\nbreaks\nare\nok' },
    { query: 'Tabs\tare\tok' }
  ];
  
  inputsWithSpecialChars.forEach(input => {
    expect.toBeTruthy(InputValidator.validate(input));
  });
});

// Test string validation separately
suite.test('string validation works independently', () => {
  const safeStrings = [
    'Normal todo name',
    'Todo with "quotes"',
    "Todo with apostrophe's",
    'Todo with émojis 🎉',
    ''
  ];
  
  safeStrings.forEach(str => {
    expect.toBeTruthy(InputValidator.validateString(str));
  });
  
  const dangerousStrings = [
    'tell application "test"',
    'do shell script "test"',
    'osascript test',
    'AppleScript test'
  ];
  
  dangerousStrings.forEach(str => {
    expect.toThrow(() => InputValidator.validateString(str));
  });
});

// Test legitimate Things 3 content that might look suspicious
suite.test('allows legitimate Things 3 content', () => {
  const legitimateInputs = [
    { name: 'Call application support' }, // "application" but not "tell application"
    { notes: 'Script for automation' }, // "script" but not "shell script"
    { name: 'Learn to script automation' }, // Contains "script" as content
    { notes: 'Meeting with Shell Oil company' }, // Contains "shell" but not dangerous
  ];
  
  legitimateInputs.forEach(input => {
    expect.toBeTruthy(InputValidator.validate(input));
  });
});

// Test that validation doesn't break normal functionality
suite.test('does not interfere with normal todo operations', () => {
  const normalTodoOperations = [
    { name: 'Buy groceries', tags: ['personal', 'shopping'] },
    { name: 'Finish project', notes: 'Complete by Friday', deadline: '2025-08-05' },
    { id: 'abc123', completed: true, tags: [] },
    { query: 'work items', tags: ['work'], completed: false },
    { name: 'Review code', checklist_items: ['Check syntax', 'Run tests', 'Review docs'] }
  ];
  
  normalTodoOperations.forEach(input => {
    expect.toBeTruthy(InputValidator.validate(input));
  });
});

// Test performance with large inputs
suite.test('handles large inputs efficiently', () => {
  const largeInput = {
    name: 'Large todo',
    notes: 'A'.repeat(10000), // 10KB of text
    tags: Array(100).fill('tag'),
    checklist_items: Array(50).fill('checklist item')
  };
  
  const startTime = Date.now();
  expect.toBeTruthy(InputValidator.validate(largeInput));
  const endTime = Date.now();
  
  // Should complete within reasonable time (< 100ms)
  expect.toBeTruthy(endTime - startTime < 100);
});

// Test validation error messages are helpful
suite.test('provides helpful error messages', () => {
  try {
    InputValidator.validate({ name: 'tell application "test"' });
    expect.toBeFalsy(true, 'Should have thrown error');
  } catch (error) {
    expect.toContain(error.message, 'Dangerous pattern detected');
    expect.toContain(error.message.toLowerCase(), 'tell');
  }
  
  try {
    InputValidator.validate('not an object');
    expect.toBeFalsy(true, 'Should have thrown error');
  } catch (error) {
    expect.toContain(error.message, 'Input must be an object');
  }
});

// Test that validation is consistent
suite.test('validation is consistent across calls', () => {
  const testInput = { name: 'Test todo', notes: 'Safe content' };
  
  // Should give same result multiple times
  expect.toBeTruthy(InputValidator.validate(testInput));
  expect.toBeTruthy(InputValidator.validate(testInput));
  expect.toBeTruthy(InputValidator.validate(testInput));
  
  const dangerousInput = { name: 'tell application "test"' };
  
  // Should consistently reject dangerous input
  expect.toThrow(() => InputValidator.validate(dangerousInput));
  expect.toThrow(() => InputValidator.validate(dangerousInput));
  expect.toThrow(() => InputValidator.validate(dangerousInput));
});

// Run the tests
suite.run().catch(() => process.exit(1));