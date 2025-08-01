/**
 * Test for tags handling including empty array scenarios
 */

import { strict as assert } from 'assert';
import { ParameterMapper } from '../server/utils.js';
import { JXATemplates } from '../server/jxa-templates.js';

console.log('Testing tags handling functionality...\n');

// Test 1: updateTodo method exists and can be called
try {
  const args = {
    id: "test-todo-123",
    tags: []
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.updateTodo();
  
  // Should return a valid JXA script
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ updateTodo JXA template generates valid script');
} catch (error) {
  console.log('❌ updateTodo JXA template:', error.message);
  process.exit(1);
}

// Test 2: createTodo method exists and can be called
try {
  const args = {
    title: "Test todo",
    tags: ["work", "urgent"]
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.createTodo();
  
  // Should return a valid JXA script
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ createTodo JXA template generates valid script');
} catch (error) {
  console.log('❌ createTodo JXA template:', error.message);
  process.exit(1);
}

// Test 3: updateProject method exists and can be called
try {
  const args = {
    id: "test-project-456",
    tags: []
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.updateProject();
  
  // Should return a valid JXA script
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ updateProject JXA template generates valid script');
} catch (error) {
  console.log('❌ updateProject JXA template:', error.message);
  process.exit(1);
}

// Test 4: createProject method exists and can be called
try {
  const args = {
    title: "Test project",
    tags: ["milestone", "q1"]
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.createProject();
  
  // Should return a valid JXA script
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ createProject JXA template generates valid script');
} catch (error) {
  console.log('❌ createProject JXA template:', error.message);
  process.exit(1);
}

// Test 5: Parameter mapping works correctly for tags
try {
  const args = {
    id: "test-todo-123",
    title: "Updated title",
    tags: ["work", "urgent"]
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  
  // Should correctly map title to name
  assert.equal(scriptParams.name, "Updated title");
  assert.deepEqual(scriptParams.tags, ["work", "urgent"]);
  
  console.log('✅ Parameter mapping works correctly for tags');
} catch (error) {
  console.log('❌ Parameter mapping for tags:', error.message);
  process.exit(1);
}

// Test 6: Parameter validation rejects invalid input
try {
  const args = {
    id: "test-todo-123",
    tags: "not-an-array"  // This should cause validation error
  };
  
  try {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    console.log('❌ Should have thrown validation error for non-array tags');
    process.exit(1);
  } catch (validationError) {
    // This is expected - validation should reject invalid input
    assert(validationError.message.includes('tags must be an array'));
    console.log('✅ Parameter validation correctly rejects invalid input');
  }
} catch (error) {
  console.log('❌ Parameter validation test setup:', error.message);
  process.exit(1);
}

// Test 7: Null tags parameter is handled correctly
try {
  const args = {
    id: "test-todo-123",
    title: "Updated title",
    tags: null
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  
  // Should handle null tags parameter correctly
  assert.equal(scriptParams.name, "Updated title");
  assert.equal(scriptParams.id, "test-todo-123");
  
  console.log('✅ Parameter mapping handles null tags parameter correctly');
} catch (error) {
  console.log('❌ Parameter mapping null tags:', error.message);
  process.exit(1);
}

console.log('\n✨ All tags handling tests passed!');