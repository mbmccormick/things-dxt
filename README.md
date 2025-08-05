# Things DXT - Claude Desktop Extension

A comprehensive Claude Desktop Extension that provides seamless integration with Things 3, enabling you to manage your complete task workflow directly from Claude conversations using AppleScript via secure JavaScript for Automation (JXA).

## Download

### [⬇️ Download Latest Release](https://github.com/mbmccormick/things-dxt/releases/latest)

## Quick Start

1. **Install Dependencies**: `npm install`
2. **Run Tests**: `npm test` (optional but recommended)
3. **Package Extension**: `dxt pack .`
4. **Install in Claude Desktop**: Follow Claude Desktop's extension installation process
5. **Launch Things 3**: Ensure Things 3 is running before using commands

> **💡 Pro Tip**: Use `when` for scheduling (when to work on) and `deadline` for final due dates.

## Recent Improvements

### Version 1.3.0
- **🏗️ Complete Architecture Overhaul**: Migrated from AppleScript to modular JavaScript for Automation (JXA)
- **🔒 Security-First Design**: Eliminated shell injection risks with `execFile` and JSON parameter passing
- **📦 Modular Build System**: ES6 modules compiled with esbuild for maintainable, modern code
- **⚡ Performance**: Pre-built bundled scripts for faster execution
- **🧪 Comprehensive Testing**: Unit, integration, and regression test suites
- **🔧 Better Error Handling**: Enhanced error messages and timeout protection
- **📚 Developer Experience**: Improved debugging, logging, and development workflow

## Features

### 🎯 Core Functionality
- **Complete Task Management**: Create, read, update, and search todos and projects
- **Smart List Access**: Work with all Things 3 lists (Inbox, Today, Upcoming, Anytime, Someday)
- **Project & Area Organization**: Full project and area management capabilities
- **Advanced Search**: Multiple search types across all your Things data

### 🔍 Discovery & Navigation  
- **Tag Management**: Get all tags and find items by specific tags
- **Logbook Access**: View completed tasks with flexible time periods
- **Trash Management**: Access and review trashed items
- **Recent Items**: Find recently modified items

### 🛠️ Advanced Features
- **Flexible Updates**: Modify existing tasks and projects with full parameter control
- **Data Integrity**: Comprehensive input validation and error handling
- **Security**: Built-in AppleScript injection protection and safe execution
- **User-Friendly Parameters**: Intuitive date terminology and parameter mapping

## API Reference

### 📝 Creation Tools

#### `add_todo` - Create a new to-do
**Required**: `title`  
**Optional**: `notes`, `when`, `deadline`, `list_title`, `list_id`, `heading`, `tags`, `checklist_items`

#### `add_project` - Create a new project  
**Required**: `title`  
**Optional**: `notes`, `when`, `deadline`, `area_title`, `area_id`, `tags`, `todos`

### 📋 List Access Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_inbox` | Get todos from Inbox | None |
| `get_today` | Get todos due today | None |
| `get_upcoming` | Get upcoming todos | None |
| `get_anytime` | Get Anytime list todos | None |
| `get_someday` | Get Someday list todos | None |
| `get_logbook` | Get completed todos | `period`, `limit` |
| `get_trash` | Get trashed todos | None |

#### `get_todos` - Get todos with filtering
**Optional**: `project_uuid`, `include_items`

#### `get_projects` - Get all projects
**Optional**: `include_items`

#### `get_areas` - Get all areas
**Optional**: `include_items`

### 🔍 Search & Discovery Tools

#### `search_items` - Universal search
**Required**: `query`

#### `search_todos` - Todo-specific search  
**Required**: `query`

#### `search_advanced` - Multi-criteria search
**Required**: `query`  
**Optional**: `tags`, `completed`, `canceled`, `trashed`

#### `get_tags` - Get all tags
**Parameters**: None

#### `get_tagged_items` - Find items by tag
**Required**: `tag_title`

#### `get_recent` - Get recent items
**Optional**: `days` (default: 7)

### ✏️ Update Tools

#### `update_todo` - Update existing todo
**Required**: `id`  
**Optional**: `title`, `notes`, `when`, `deadline`, `tags`, `checklist_items`, `completed`, `canceled`
- `tags`: Array of tag names. Use `[]` to remove all tags
- `checklist_items`: Array of checklist items. Appends to existing notes as formatted list

#### `update_project` - Update existing project
**Required**: `id`  
**Optional**: `title`, `notes`, `when`, `deadline`, `tags`, `completed`, `canceled`
- `tags`: Array of tag names. Use `[]` to remove all tags

#### `show_item` - Show item details
**Required**: `id`

## Usage Examples

### Daily Workflow
```
Show me my inbox and today's tasks, then help me plan my day
```

### Task Creation
```
Create a task "Prepare quarterly report" with notes "Include Q3 metrics and future roadmap" due next Friday in my Work project with tags "urgent" and "quarterly"
```

### Project Management
```
Create a new project "Website Redesign" in my "Product Development" area with deadline March 15th and add initial todos: "Research competitors", "Create wireframes", "Design mockups"
```

### Search & Organization
```
Search for all tasks containing "meeting" and show me what's tagged with "urgent"
```

### Tag Management
```
Remove all tags from task ID "abc123" by updating it with tags: []
```

### Weekly Review
```
Show me what I completed last week, what's in my logbook, and help me organize my upcoming tasks
```

## Parameter Guide

### Date Parameters
- **`when`**: When scheduled to work on (appears in Today/Upcoming)
- **`deadline`**: When actually due (final deadline)
- **Format**: YYYY-MM-DD (e.g., "2024-03-15")

### Organization Parameters
- **`list_title`/`area_title`**: Use names for easy reference
- **`list_id`/`area_id`**: Use IDs for precise targeting
- **`tags`**: Array of tag names (e.g., ["urgent", "work"])

### Update Parameters
- **`id`**: Required for all update operations
- **Status flags**: `completed`, `canceled` (boolean)

## Requirements

- **macOS**: Required for JXA integration
- **Things 3**: Must be installed and accessible
- **Node.js**: Version 18.0.0 or higher
- **Claude Desktop**: Compatible with DXT specification
- **esbuild**: Automatically installed as dev dependency

## Installation

```bash
# Clone or download the extension
cd things-dxt

# Install dependencies
npm install

# Build JXA scripts
npm run build

# Package the extension
npm run package

# Install in Claude Desktop (follow Claude Desktop docs)
```

## Architecture

### Project Structure
```
things-dxt/
├── manifest.json              # DXT extension manifest
├── package.json               # Dependencies and scripts
├── README.md                  # Documentation
├── CLAUDE.md                  # Claude Code instructions
├── server/
│   ├── index.js               # Main MCP server
│   ├── tool-definitions.js    # MCP tool schemas
│   ├── jxa-executor.js        # Secure JXA execution engine
│   ├── server-config.js       # Configuration constants
│   ├── utils.js               # Validation and utilities
│   └── response-formatter.js  # Response formatting
├── jxa/
│   ├── build.js               # Build system for JXA scripts
│   ├── src/                   # Modular JXA source files
│   │   ├── main.js            # Entry point and router
│   │   ├── utils.js           # Shared utilities
│   │   ├── todos.js           # Todo operations
│   │   ├── projects.js        # Project operations
│   │   ├── lists.js           # List operations
│   │   ├── search.js          # Search operations
│   │   ├── tags.js            # Tag operations
│   │   └── areas.js           # Area operations
│   └── build/                 # Generated bundled scripts
└── test/
    ├── run-tests.js           # Test runner
    ├── unit/                  # Unit tests
    ├── integration/           # Integration tests
    └── regression/            # Regression tests
```

### Key Design Principles
- **Separation of Concerns**: Modular architecture with clear responsibilities
- **Security First**: No shell injection risks with `execFile` and JSON parameter passing
- **User-Friendly**: Intuitive parameter names and helpful error messages
- **Robust Error Handling**: Comprehensive error catching and reporting
- **Test-Driven**: Comprehensive test coverage for reliability
- **Performance Optimized**: Pre-built scripts with efficient resource usage
- **Extensible**: Easy to add new tools and functionality
- **Modern JavaScript**: ES6 modules compiled for JXA compatibility

## Security Features

- **Input Validation**: All parameters validated for type, length, and content
- **No Shell Injection**: Uses `execFile` instead of `exec` - parameters never touch shell
- **JSON Parameter Passing**: Parameters passed as JSON arguments, not embedded in scripts
- **Pattern Detection**: Dangerous patterns blocked before execution
- **Error Handling**: Structured error responses with detailed logging
- **Timeout Management**: Prevents hanging JXA operations (30s default)
- **Safe Execution**: Secure command execution with process isolation
- **Comprehensive Testing**: Security validation covered by automated test suite

## Development

### Testing
```bash
# Run comprehensive test suite
npm test

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:regression  # Regression tests
npm run test:watch       # Watch mode for development

# Build JXA scripts
npm run build
npm run build:watch     # Watch mode

# Syntax validation
npm run validate

# Debug mode
DEBUG=true npm start
```

### Test Coverage
The extension includes a comprehensive test suite covering:
- **Input Validation**: String, date, array, and number validation with security checks
- **Parameter Processing**: User-friendly parameter conversion and validation
- **JXA Execution**: Script loading, execution, and error handling
- **Security**: Pattern detection and safe parameter passing
- **Error Handling**: Consistent error message formatting and validation
- **Date Handling**: Timezone-aware date parsing and formatting
- **Tag Management**: Format conversion and removal scenarios
- **List Operations**: Built-in list ID mapping verification
- **Regression Tests**: Specific issue fixes (#3, #5, etc.)

### Adding New Tools
1. Add operation to appropriate module in `jxa/src/` (e.g., `todos.js`)
2. Update router in `jxa/src/main.js`
3. Add tool definition to `server/tool-definitions.js`
4. Run `npm run build` to generate bundled script
5. Add tests and update documentation

### Contributing Guidelines
- Include comprehensive input validation
- Add structured error handling
- Write unit tests for new functionality
- Update documentation for new features
- Test thoroughly with Things 3 on macOS
- Follow established patterns and conventions
- Maintain backward compatibility when possible

## Troubleshooting

### Common Issues

**Things 3 Not Running**
```
Solution: Launch Things 3 application and ensure it's running (not just in dock)
```

**Permission Errors**
```
Solution: 
1. System Preferences > Security & Privacy > Privacy
2. Select "Automation" 
3. Grant permission for your terminal/Claude Desktop to control Things 3
```

**Debug Information**
```bash
# Enable detailed logging
DEBUG=true npm start
```

### Getting Help

- **Things 3 Issues**: Contact Cultured Code support
- **Claude Desktop**: Follow Claude Desktop documentation  
- **Extension Issues**: Create issue in project repository

## License

MIT License - See package.json for details

## Acknowledgments

- **Cultured Code** for Things 3 and its automation support
- **Anthropic** for the Model Context Protocol (MCP) SDK
- **esbuild** for fast, reliable JavaScript bundling

---

*Built with ❤️ for the Claude Desktop ecosystem*