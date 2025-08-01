/**
 * Unit tests for parameter mapping
 */

import { strict as assert } from 'assert';
import { ParameterMapper } from '../server/utils.js';

console.log('Testing ParameterMapper...\n');

// Test 1: Basic parameter mapping
try {
  const args = {
    title: 'Test task',
    when: '2024-12-25',
    deadline: '2024-12-31'
  };
  
  const result = ParameterMapper.validateAndMapParameters(args);
  assert.equal(result.name, 'Test task');
  assert.equal(result.title, 'Test task');
  assert.equal(result.activation_date, '2024-12-25');
  assert.equal(result.due_date, '2024-12-31');
  console.log('✅ Basic parameter mapping');
} catch (error) {
  console.log('❌ Basic parameter mapping:', error.message);
  process.exit(1);
}

// Test 2: Backward compatibility
try {
  const args = {
    name: 'Old style task',
    due_date: '2024-12-25'
  };
  
  const result = ParameterMapper.validateAndMapParameters(args);
  assert.equal(result.name, 'Old style task');
  assert.equal(result.activation_date, '2024-12-25');
  console.log('✅ Backward compatibility mapping');
} catch (error) {
  console.log('❌ Backward compatibility mapping:', error.message);
  process.exit(1);
}

// Test 3: Null value filtering
try {
  const args = {
    title: 'Minimal task'
  };
  
  const result = ParameterMapper.validateAndMapParameters(args);
  assert.equal(result.name, 'Minimal task');
  assert.equal(result.notes, undefined);
  assert.equal(result.activation_date, undefined);
  assert.equal(result.due_date, undefined);
  console.log('✅ Null value filtering');
} catch (error) {
  console.log('❌ Null value filtering:', error.message);
  process.exit(1);
}

// Test 4: Tag array mapping
try {
  const args = {
    title: 'Task with tags',
    tags: ['work', 'urgent']
  };
  
  const result = ParameterMapper.validateAndMapParameters(args);
  assert.deepEqual(result.tags, ['work', 'urgent']);
  console.log('✅ Tag array mapping');
} catch (error) {
  console.log('❌ Tag array mapping:', error.message);
  process.exit(1);
}

console.log('\n✨ All parameter mapping tests passed!');