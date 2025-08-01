/**
 * Test area_id support in JXA templates
 * 
 * This test verifies that area_id parameter is properly handled
 * when creating projects and todos.
 */

import { strict as assert } from 'assert';
import { JXATemplates } from '../server/jxa-templates.js';
import { ParameterMapper } from '../server/utils.js';

console.log('Testing Area ID Support...\n');

// Test 1: Create project with area_id parameter mapping
try {
  const args = {
    title: 'Test Project',
    area_id: '4MvDtua4a4h2a9fwSQLfX2'
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.createProject();
  
  // Verify parameter mapping works
  assert.equal(scriptParams.name, 'Test Project');
  assert.equal(scriptParams.area_id, '4MvDtua4a4h2a9fwSQLfX2');
  
  // Verify JXA script is generated
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ Create project with area_id parameter mapping');
} catch (error) {
  console.log('❌ Create project with area_id:', error.message);
  process.exit(1);
}

// Test 2: Create project with area name (backward compatibility)
try {
  const args = {
    title: 'Test Project',
    area_title: 'Work'
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.createProject();
  
  // Verify parameter mapping works (area_title gets mapped to area)
  assert.equal(scriptParams.name, 'Test Project');
  assert.equal(scriptParams.area, 'Work');
  
  // Verify JXA script is generated
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ Create project with area name parameter mapping');
} catch (error) {
  console.log('❌ Create project with area name:', error.message);
  process.exit(1);
}

// Test 3: Create todo with area_id parameter mapping
try {
  const args = {
    title: 'Test Todo',
    area_id: '4MvDtua4a4h2a9fwSQLfX2'
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.createTodo();
  
  // Verify parameter mapping works
  assert.equal(scriptParams.name, 'Test Todo');
  assert.equal(scriptParams.area_id, '4MvDtua4a4h2a9fwSQLfX2');
  
  // Verify JXA script is generated
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ Create todo with area_id parameter mapping');
} catch (error) {
  console.log('❌ Create todo with area_id:', error.message);
  process.exit(1);
}

// Test 4: Create todo with list_id parameter mapping
try {
  const args = {
    title: 'Test Todo',
    list_id: 'project-123'
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.createTodo();
  
  // Verify parameter mapping works
  assert.equal(scriptParams.name, 'Test Todo');
  assert.equal(scriptParams.list_id, 'project-123');
  
  // Verify JXA script is generated
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ Create todo with list_id parameter mapping');
} catch (error) {
  console.log('❌ Create todo with list_id:', error.message);
  process.exit(1);
}

// Test 5: Multiple location parameters are mapped correctly
try {
  const args = {
    title: 'Test Todo',
    list_id: 'project-123',
    list_title: 'Project Name',
    area_id: 'area-456',
    area_title: 'Area Name'
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  const script = JXATemplates.createTodo();
  
  // Verify all parameters are mapped (list_title maps to project, area_title maps to area)
  assert.equal(scriptParams.name, 'Test Todo');
  assert.equal(scriptParams.list_id, 'project-123');
  assert.equal(scriptParams.project, 'Project Name');
  assert.equal(scriptParams.area_id, 'area-456');
  assert.equal(scriptParams.area, 'Area Name');
  
  // Verify JXA script is generated
  assert(typeof script === 'string');
  assert(script.includes('function run'));
  
  console.log('✅ Multiple location parameters mapped correctly');
} catch (error) {
  console.log('❌ Multiple location parameters:', error.message);
  process.exit(1);
}

console.log('\n✨ All area ID support tests passed!');