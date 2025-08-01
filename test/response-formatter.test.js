/**
 * Unit tests for response formatting
 */

import { strict as assert } from 'assert';
import { ResponseFormatter } from '../server/response-formatter.js';

console.log('Testing ResponseFormatter...\n');

// Test 1: Create success response
try {
  const data = { todos: [{ id: 'test-123', name: 'Test Todo' }] };
  const result = ResponseFormatter.createSuccessResponse(data);
  
  assert(result.content);
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, 'text');
  
  const parsedData = JSON.parse(result.content[0].text);
  assert.deepEqual(parsedData, data);
  
  console.log('✅ Create success response');
} catch (error) {
  console.log('❌ Create success response:', error.message);
  process.exit(1);
}

// Test 2: Create error response
try {
  const result = ResponseFormatter.createErrorResponse('Test error', 'TEST_ERROR');
  
  assert(result.content);
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, 'text');
  
  const parsedData = JSON.parse(result.content[0].text);
  assert.equal(parsedData.success, false);
  assert.equal(parsedData.error.message, 'Test error');
  assert.equal(parsedData.error.code, 'TEST_ERROR');
  
  console.log('✅ Create error response');
} catch (error) {
  console.log('❌ Create error response:', error.message);
  process.exit(1);
}

// Test 3: Error response with default code
try {
  const result = ResponseFormatter.createErrorResponse('Default error');
  
  const parsedData = JSON.parse(result.content[0].text);
  assert.equal(parsedData.error.code, 'UNKNOWN_ERROR');
  
  console.log('✅ Error response with default code');
} catch (error) {
  console.log('❌ Error response with default code:', error.message);
  process.exit(1);
}

console.log('\n✨ All response formatter tests passed!');