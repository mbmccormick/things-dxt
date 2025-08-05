#!/usr/bin/env node

/**
 * Unit tests for ParameterProcessor
 * 
 * Tests the parameter mapping and validation functionality that converts
 * user-friendly parameters to Things 3 internal terminology
 */

import { TestSuite, expect } from '../test-utils.js';
import { ParameterProcessor } from '../../server/utils.js';

const suite = new TestSuite('ParameterProcessor Unit Tests');

// Test user-friendly parameter mapping
suite.test('maps "when" to "activation_date"', () => {
  const input = { when: '2025-08-04' };
  const result = ParameterProcessor.process(input);
  
  expect.toHaveProperty(result, 'activation_date');
  expect.toEqual(result.activation_date, '2025-08-04');
  expect.toBeFalsy(result.hasOwnProperty('when'));
});

suite.test('maps "deadline" to "due_date"', () => {
  const input = { deadline: '2025-08-05' };  
  const result = ParameterProcessor.process(input);
  
  expect.toHaveProperty(result, 'due_date');
  expect.toEqual(result.due_date, '2025-08-05');
  expect.toBeFalsy(result.hasOwnProperty('deadline'));
});

suite.test('preserves unmapped parameters', () => {
  const input = { name: 'Test Todo', notes: 'Test notes' };
  const result = ParameterProcessor.process(input);
  
  expect.toEqual(result.name, 'Test Todo');
  expect.toEqual(result.notes, 'Test notes');
});

suite.test('handles mixed mapped and unmapped parameters', () => {
  const input = { 
    name: 'Test Todo',
    when: '2025-08-04',
    deadline: '2025-08-05',
    tags: ['work', 'urgent']
  };
  const result = ParameterProcessor.process(input);
  
  expect.toEqual(result.name, 'Test Todo');
  expect.toEqual(result.activation_date, '2025-08-04');
  expect.toEqual(result.due_date, '2025-08-05');
  expect.toDeepEqual(result.tags, ['work', 'urgent']);
  
  expect.toBeFalsy(result.hasOwnProperty('when'));
  expect.toBeFalsy(result.hasOwnProperty('deadline'));
});

suite.test('handles empty objects', () => {
  const result = ParameterProcessor.process({});
  expect.toDeepEqual(result, {});
});

suite.test('handles null and undefined values', () => {
  const input = { when: null, deadline: undefined, name: 'Test' };
  const result = ParameterProcessor.process(input);
  
  expect.toEqual(result.activation_date, null);
  expect.toEqual(result.due_date, undefined);
  expect.toEqual(result.name, 'Test');
});

suite.test('does not mutate original input', () => {
  const input = { when: '2025-08-04', name: 'Test' };
  const originalInput = JSON.parse(JSON.stringify(input));
  
  ParameterProcessor.process(input);
  
  expect.toDeepEqual(input, originalInput);
});

suite.test('processes nested objects correctly', () => {
  const input = {
    name: 'Test Todo',
    when: '2025-08-04',
    metadata: {
      deadline: '2025-08-05' // This should NOT be mapped (nested)
    }
  };
  const result = ParameterProcessor.process(input);
  
  expect.toEqual(result.activation_date, '2025-08-04');
  expect.toHaveProperty(result, 'metadata');
  expect.toEqual(result.metadata.deadline, '2025-08-05'); // Unchanged
});

// Edge cases and error handling
suite.test('handles arrays', () => {
  const input = { 
    tags: ['work', 'urgent'],
    when: '2025-08-04'
  };
  const result = ParameterProcessor.process(input);
  
  expect.toDeepEqual(result.tags, ['work', 'urgent']);
  expect.toEqual(result.activation_date, '2025-08-04');
});

suite.test('preserves special values', () => {
  const input = {
    when: '',
    deadline: 0,
    tags: [],
    completed: false
  };
  const result = ParameterProcessor.process(input);
  
  expect.toEqual(result.activation_date, '');
  expect.toEqual(result.due_date, 0);
  expect.toDeepEqual(result.tags, []);
  expect.toEqual(result.completed, false);
});

// Run the tests
suite.run().catch(() => process.exit(1));