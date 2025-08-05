Help me build an integration for Claude Desktop that provides access to Things, the award-winning personal task manager that helps you plan your day, manage your projects, and make real progress toward your goals.

Things provides an AppleScript integration to automate certain actions on Mac. This functionality is documented in the following specifications:
   - https://culturedcode.com/things/support/articles/2803572/ - Using AppleScript
   - https://culturedcode.com/things/support/articles/4562654/ - Things AppleScript Commands
   - https://culturedcode.com/things/download/Things3AppleScriptGuide.pdf - Things AppleScript Guide

I want to build this as a Desktop Extension, abbreviated as "DXT". Please follow these steps:

1. **Read the specifications thoroughly:**
   - https://github.com/anthropics/dxt/blob/main/README.md - DXT architecture overview, capabilities, and integration
     patterns
   - https://github.com/anthropics/dxt/blob/main/MANIFEST.md - Complete extension manifest structure and field definitions
   - https://github.com/anthropics/dxt/tree/main/examples - Reference implementations including a "Hello World" example
2. **Create a proper extension structure:**
   - Generate a valid manifest.json following the MANIFEST.md spec
   - Implement an MCP server using @modelcontextprotocol/sdk with proper tool definitions
   - Include proper error handling, security measures, and timeout management
3. **Follow best development practices:**
   - Implement proper MCP protocol communication via stdio transport
   - Structure tools with clear schemas, validation, and consistent JSON responses
   - Make use of the fact that this extension will be running locally
   - Add appropriate logging and debugging capabilities
   - Include proper documentation and setup instructions
4. **Test considerations:**
   - Validate that all tool calls return properly structured responses
   - Verify manifest loads correctly and host integration works

Generate complete, production-ready code that can be immediately tested. Focus on defensive programming, clear error messages, and following the exact DXT specifications to ensure compatibility with the ecosystem.