#!/usr/bin/env node

/**
 * Unit tests for Tag Formatting
 * 
 * Tests the conversion between array format (user-friendly) and 
 * comma-separated string format (Things 3 API requirement)
 */

import { TestSuite, expect } from '../test-utils.js';

const suite = new TestSuite('Tag Formatting Unit Tests');

// Mock the tag formatting functions
const formatTags = (tags) => {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return "";
  }
  return tags.join(", ");
};

const parseTags = (tagString) => {
  if (!tagString || typeof tagString !== "string") {
    return [];
  }
  return tagString.split(",").map(t => t.trim()).filter(t => t);
};

// Test array to string conversion
suite.test('converts array to comma-separated string', () => {
  const testCases = [
    { input: ['work', 'urgent'], expected: 'work, urgent' },
    { input: ['personal'], expected: 'personal' },
    { input: ['a', 'b', 'c'], expected: 'a, b, c' },
    { input: [], expected: '' },
    { input: null, expected: '' },
    { input: undefined, expected: '' }
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = formatTags(input);
    expect.toEqual(result, expected);
  });
});

// Test string to array conversion
suite.test('converts comma-separated string to array', () => {
  const testCases = [
    { input: 'work, urgent', expected: ['work', 'urgent'] },
    { input: 'personal', expected: ['personal'] },
    { input: 'a, b, c', expected: ['a', 'b', 'c'] },
    { input: '', expected: [] },
    { input: null, expected: [] },
    { input: undefined, expected: [] }
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = parseTags(input);
    expect.toDeepEqual(result, expected);
  });
});

// Test round-trip conversion
suite.test('round-trip conversion preserves tags', () => {
  const originalTags = ['work', 'urgent', 'project'];
  const stringified = formatTags(originalTags);
  const parsed = parseTags(stringified);
  
  expect.toDeepEqual(parsed, originalTags);
});

// Test handling of whitespace
suite.test('handles whitespace correctly', () => {
  const testCases = [
    { input: 'work,urgent', expected: ['work', 'urgent'] },
    { input: 'work , urgent', expected: ['work', 'urgent'] },
    { input: ' work, urgent ', expected: ['work', 'urgent'] },
    { input: 'work,  urgent  , project', expected: ['work', 'urgent', 'project'] }
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = parseTags(input);
    expect.toDeepEqual(result, expected);
  });
});

// Test empty and invalid cases
suite.test('handles empty and invalid cases', () => {
  // Empty arrays
  expect.toEqual(formatTags([]), '');
  expect.toEqual(formatTags(null), '');
  expect.toEqual(formatTags(undefined), '');
  
  // Empty strings
  expect.toDeepEqual(parseTags(''), []);
  expect.toDeepEqual(parseTags('   '), []);
  expect.toDeepEqual(parseTags(',,,'), []);
  
  // Invalid types
  expect.toEqual(formatTags('not-an-array'), '');
  expect.toDeepEqual(parseTags(123), []);
  expect.toDeepEqual(parseTags({}), []);
});

// Test special characters in tags
suite.test('handles special characters in tags', () => {
  const specialTags = ['work & life', 'high-priority', 'émojis 🎉', '"quoted"'];
  const stringified = formatTags(specialTags);
  const parsed = parseTags(stringified);
  
  expect.toDeepEqual(parsed, specialTags);
});

// Test tags with commas (edge case)
suite.test('handles tags containing commas', () => {
  // This is an edge case - if a tag contains a comma, it might break parsing
  const problematicTags = ['Smith, John', 'before, after'];
  const stringified = formatTags(problematicTags);
  
  // This will break the round-trip, which is expected behavior
  // The comma in the tag will be treated as a separator
  expect.toEqual(stringified, 'Smith, John, before, after');
  
  const parsed = parseTags(stringified);
  expect.toDeepEqual(parsed, ['Smith', 'John', 'before', 'after']);
  
  // Document this limitation
  expect.toBeFalsy(parsed.length === problematicTags.length);
});

// Test case sensitivity
suite.test('preserves case sensitivity', () => {
  const mixedCaseTags = ['Work', 'URGENT', 'Personal', 'iPhone'];
  const stringified = formatTags(mixedCaseTags);
  const parsed = parseTags(stringified);
  
  expect.toDeepEqual(parsed, mixedCaseTags);
});

// Test large number of tags
suite.test('handles large number of tags', () => {
  const manyTags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
  const stringified = formatTags(manyTags);
  const parsed = parseTags(stringified);
  
  expect.toDeepEqual(parsed, manyTags);
  expect.toEqual(parsed.length, 100);
});

// Test Things 3 API format compliance
suite.test('produces Things 3 API compliant format', () => {
  const tags = ['work', 'urgent', 'project'];
  const result = formatTags(tags);
  
  // Things 3 expects comma-separated with spaces after commas
  expect.toEqual(result, 'work, urgent, project');
  expect.toContain(result, ', '); // Space after comma
  expect.toBeFalsy(result.startsWith(',')); // No leading comma
  expect.toBeFalsy(result.endsWith(',')); // No trailing comma
});

// Test consistency with Things 3 behavior
suite.test('matches Things 3 tag behavior', () => {
  // Empty tag list should result in empty string (not null)
  expect.toEqual(formatTags([]), '');
  
  // Single tag should not have commas
  expect.toEqual(formatTags(['single']), 'single');
  
  // Multiple tags should be comma-space separated
  expect.toEqual(formatTags(['first', 'second']), 'first, second');
});

// Run the tests
suite.run().catch(() => process.exit(1));