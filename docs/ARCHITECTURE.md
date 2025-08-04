# Architecture Overview

This document describes the refactored architecture of the Things 3 MCP server following bendrucker's security and modularity recommendations.

## Core Principles

1. **Security First**: Uses `execFile` instead of `exec` to eliminate shell injection vulnerabilities
2. **Modular Design**: Separate ES6 modules bundled with esbuild for maintainability  
3. **Zero String Escaping**: Parameters passed as structured JSON data, not embedded in code
4. **Clean Separation**: Clear boundaries between server, executor, and JXA operations

## Architecture Layers

### 1. MCP Server Layer (`server/index.js`)
- **Purpose**: Handle MCP protocol communication
- **Responsibilities**: 
  - Tool discovery and routing
  - Parameter processing and validation
  - Error handling and logging
- **Key Features**:
  - Direct JXA execution (no intermediate handlers)
  - Automatic script building on startup
  - Comprehensive error messages

### 2. JXA Executor (`server/jxa-executor.js`)
- **Purpose**: Secure JXA script execution
- **Responsibilities**:
  - Load pre-built bundled scripts
  - Execute via `execFile` with JSON parameters
  - Parse responses and handle errors
- **Security Features**:
  - No shell interpretation
  - Timeout protection
  - Buffer size limits
  - Enhanced error context

### 3. Modular JXA Sources (`jxa/src/`)
- **Purpose**: Maintainable Things 3 operations
- **Structure**:
  ```
  jxa/src/
  ├── main.js      # Entry point and operation routing
  ├── utils.js     # Shared utilities and mapping functions
  ├── todos.js     # Todo CRUD operations
  ├── projects.js  # Project CRUD operations
  ├── lists.js     # Built-in list operations (Inbox, Today, etc.)
  ├── search.js    # Search and filtering operations
  ├── tags.js      # Tag operations
  └── areas.js     # Area operations
  ```

### 4. Build System (`jxa/build.js`)
- **Purpose**: Bundle modular sources into executable JXA scripts
- **Process**:
  1. Validate source files exist
  2. Generate entry points for each operation
  3. Bundle with esbuild (ES6 → IIFE)
  4. Wrap with JXA-compatible function
  5. Output to `jxa/build/`
- **Benefits**:
  - Modern JavaScript features in source
  - Tree shaking and optimization
  - Single-file deployment per operation

### 5. Consolidated Utilities (`server/utils.js`)
- **Purpose**: Shared validation and processing logic
- **Classes**:
  - `ThingsLogger`: Centralized logging with debug support
  - `InputValidator`: Security-focused input validation
  - `ParameterProcessor`: API consistency and backward compatibility
- **Features**:
  - Legacy aliases for test compatibility
  - Dangerous pattern detection
  - Parameter mapping for user-friendly API

## Data Flow

```
MCP Request → Server → ParameterProcessor → JXAExecutor → Bundled Script → Things 3
            ↑                                    ↓
       Response ← ResponseFormatter ← JSON Parser ← JXA Response
```

1. **Request Processing**: MCP request → parameter validation/mapping
2. **Script Loading**: Load pre-built bundled script for operation
3. **Secure Execution**: `execFile('osascript', ['-l', 'JavaScript', '-e', script, jsonParams])`
4. **Response Parsing**: Parse JSON response from JXA
5. **Error Handling**: Convert JXA errors to appropriate MCP errors

## Security Features

### Input Validation
- Pattern detection for dangerous script constructs
- Type validation for all parameters
- Array/object structure validation

### Execution Security  
- No shell interpretation (`execFile` vs `exec`)
- Parameters passed as separate command arguments
- Timeout protection (30s default)
- Buffer size limits (10MB default)

### Error Handling
- Structured error responses
- No sensitive data in error messages
- Operation-specific error context
- Enhanced user guidance for common issues

## Build Process

### Development Workflow
```bash
npm run build       # Build all JXA scripts
npm run start       # Build and start server
npm run dev         # Build and start with debug logging
npm test           # Build and run test suite
```

### Files Generated
- 21 bundled JXA scripts in `jxa/build/`
- Each script is self-contained and executable
- Auto-generated warning headers
- Optimized for JXA execution environment

## Testing Strategy

### Unit Tests
- Input validation and parameter mapping
- Response formatting
- Tag handling and backward compatibility
- Area/project parameter support

### Legacy Compatibility
- Test adapter maintains existing test interface
- All original tests pass without modification
- Gradual migration path for future changes

## Performance Characteristics

### Benefits
- **Pre-built Scripts**: No runtime compilation
- **Modular Loading**: Only load script for requested operation  
- **Efficient Bundling**: Tree shaking removes unused code
- **Structured Data**: No parsing overhead for parameters

### Trade-offs
- **Build Step Required**: Must run `npm run build` before use
- **Disk Usage**: 21 separate script files (~2MB total)
- **Memory**: Loads one script per operation execution

## Extension Points

### Adding New Operations
1. Add operation to appropriate module in `jxa/src/`
2. Update `main.js` routing switch statement
3. Add tool definition to `tool-definitions.js`
4. Run `npm run build` to generate script
5. Add tests as needed

### Modifying Existing Operations
1. Edit source file in `jxa/src/`
2. Run `npm run build` to regenerate
3. Test changes with `npm test`

This architecture provides a secure, maintainable, and extensible foundation for Things 3 automation while following modern JavaScript development practices.