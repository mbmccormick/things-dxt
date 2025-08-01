# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
```bash
# Run comprehensive test suite
npm test

# Run individual test suites  
npm run test:validation      # Input validation tests
npm run test:parameter      # Parameter mapping tests  
npm run test:response-formatter  # Response formatting tests
npm run test:jxa             # JXA-specific tests

# Syntax validation
npm run validate
```

### Development & Debugging
```bash
# Start server in debug mode
DEBUG=true npm start

# Package extension for distribution
dxt pack .

# Run server normally
npm start
```

## Architecture Overview

This is a Claude Desktop Extension (DXT) that integrates with Things 3 task manager via JavaScript for Automation (JXA). The architecture follows a modular design with clear separation of concerns:

### Core Components

**`server/index.js`** - Main MCP server entry point
- Handles MCP protocol communication
- Manages JXA execution with JSON parameter passing and timeouts
- Coordinates between tool handlers and JXA templates

**`server/tool-definitions.js`** - MCP tool schema definitions
- Defines all 21 available tools (add_todo, get_inbox, search_items, etc.)
- Specifies input parameters and validation schemas
- Maps user-friendly parameter names to internal representations

**`server/tool-handlers.js`** - Tool implementation logic
- Contains handler methods for each MCP tool
- Orchestrates parameter mapping, JXA execution, and response formatting
- Handles error cases and validation

**`server/jxa-templates.js`** - JXA (JavaScript for Automation) generation
- Contains JXA functions for all 21 MCP tools
- Native JavaScript syntax with JSON input/output
- Eliminates complex string escaping issues
- Better error handling with structured responses
- Uses `schedule` command for setting activation dates correctly

**`server/utils.js`** - Validation and utilities
- `ThingsValidator`: Input validation with security checks
- `ParameterMapper`: Maps user parameters to Things 3 internal terminology
- `DateConverter`: Converts YYYY-MM-DD to JavaScript Date objects
- `ThingsLogger`: Centralized logging functionality

**`server/response-formatter.js`** - Response formatting
- Creates standardized MCP responses from JXA execution results
- Formats both success and error responses consistently
- Handles structured JSON output from JXA templates

### Key Design Patterns

**Parameter Mapping**: User-friendly terms are mapped to Things 3 internal terminology:
- `when` (user) → `activation_date` (Things 3) = when scheduled to work on
- `deadline` (user) → `due_date` (Things 3) = when actually due

**JXA Execution Flow**:
1. User parameters → `ParameterMapper.validateAndMapParameters()`
2. Validated parameters → `JXATemplates.{method}()` → JXA script generation
3. Script execution → `executeJXA()` with JSON parameters and timeout
4. JSON response → direct use (no complex parsing needed)
5. Structured response → `ResponseFormatter.createSuccessResponse()`

**Error Handling**: All errors are wrapped in `McpError` with appropriate error codes. JXA failures are caught and converted to user-friendly messages with proper error types.

**Security**: Input validation prevents script injection attacks through `ThingsValidator` with pattern detection for dangerous JXA/AppleScript constructs.

## Critical Implementation Details

### JXA Date Scheduling
- Uses JavaScript `Date` objects for proper date handling
- The `schedule` command is used for setting activation dates: `schedule item for date "..."`
- For creation: create item first, then schedule if needed
- For updates: use `schedule` command directly on existing item
- Dates are converted from YYYY-MM-DD format to JavaScript Date objects

### Object References
- Use direct object access: `things.toDos.byId("...")`
- Use `things.projects.byId("...")` for project references
- Use `things.areas.byId("...")` for area references
- JXA provides cleaner object access than AppleScript's `whose` syntax

### JXA Parameter Passing
**CRITICAL**: JXA uses JSON for parameter passing, eliminating string escaping issues.

**Key Principles**:
- **Parameters**: Pass complex objects as JSON via `argv[0]`
- **Execution**: Use `osascript -l JavaScript -e 'script' 'params'`
- **Responses**: Return structured JSON from JXA functions
- **Error Handling**: Catch exceptions and return structured error objects

**Implementation Details**:
```javascript
// ✅ CORRECT: JXA execution (server/index.js)
async executeJXA(script, params = {}) {
  const jsonParams = JSON.stringify(params);
  const escapedParams = jsonParams.replace(/'/g, "'\"'\"'");
  const command = `osascript -l JavaScript -e '${script}' '${escapedParams}'`;
  // ... execution logic
}

// ✅ CORRECT: JXA template structure (server/jxa-templates.js)
static wrapScript(functionBody) {
  return `
function run(argv) {
  try {
    const params = argv[0] ? JSON.parse(argv[0]) : {};
    const things = Application('com.culturedcode.ThingsMac');
    ${functionBody}
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: { message: error.message, type: error.name }
    });
  }
}`;
}
```

**Benefits of JXA**:
- No complex string escaping required
- Native JSON input/output 
- JavaScript syntax is more maintainable
- Better error handling with structured responses
- Direct object manipulation without string templates

### Security Considerations
- All user input goes through `ThingsValidator` to prevent injection
- Dangerous patterns are detected for both JXA and AppleScript constructs
- JXA execution has timeouts and buffer limits
- JSON parameter passing prevents most injection attacks

### Testing Strategy
- Unit tests cover validation, parameter mapping, and data parsing
- JXA template tests verify correct command generation
- No integration tests with actual Things 3 app (by design)
- Use `npm test` before committing changes
- Manual testing can be done by running the server and testing with Things 3

## Tool Development Pattern

To add a new tool:

1. Add schema to `TOOL_DEFINITIONS` array in `tool-definitions.js`
2. Add JXA template method to `JXATemplates` class in `jxa-templates.js`
3. Add handler method to `ToolHandlers` class in `tool-handlers.js`
4. Add routing in `index.js` `getHandlerMethod()`
5. Add unit tests for the new functionality
6. Update documentation

## Version Bumping

When releasing a new version, update the version number in **all three** locations:

1. **`package.json`** - Update the `version` field
2. **`manifest.json`** - Update the `version` field
3. **`server/server-config.js`** - Update `SERVER_CONFIG.version`

```bash
# After updating all three files, repackage the extension:
dxt pack .
```

The packaged DXT file will be created at `things-dxt.dxt` with the new version number.

## Common Pitfalls

- Don't try to set `activation_date` property directly - use the `schedule` command
- Always validate user input through `ThingsValidator`
- JXA returns structured JSON - don't try to parse tab-separated output
- Things 3 must be running for JXA to work
- Date formats must be YYYY-MM-DD from user, converted to JavaScript Date objects
- Remember to handle JXA errors in the wrapped script template
- Always use `JSON.stringify()` for JXA responses to ensure proper formatting
- Be careful with parameter names - JXA uses camelCase while our API uses snake_case