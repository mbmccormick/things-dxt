/**
 * MCP Tool Definitions for Things 3
 * 
 * Defines all available tools with their parameters and descriptions
 */

export const TOOL_DEFINITIONS = [
  {
    name: "add_todo",
    description: "Create a new to-do item in Things",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the to-do item"
        },
        notes: {
          type: "string",
          description: "Optional notes for the to-do item"
        },
        when: {
          type: "string",
          description: "Optional when date (when scheduled to work on) in YYYY-MM-DD format"
        },
        deadline: {
          type: "string",
          description: "Optional deadline (when actually due) in YYYY-MM-DD format"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of tag names"
        },
        checklist_items: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of checklist items"
        },
        list_id: {
          type: "string",
          description: "Optional list ID to add the to-do to"
        },
        list_title: {
          type: "string",
          description: "Optional list title (project or area name) to add the to-do to"
        },
        heading: {
          type: "string",
          description: "Optional heading within the project to add the to-do under"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "add_project",
    description: "Create a new project in Things",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The name of the project"
        },
        notes: {
          type: "string",
          description: "Optional notes for the project"
        },
        when: {
          type: "string",
          description: "Optional when date (when scheduled to work on) in YYYY-MM-DD format"
        },
        deadline: {
          type: "string",
          description: "Optional deadline (when actually due) in YYYY-MM-DD format"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of tag names"
        },
        area_id: {
          type: "string",
          description: "Optional area ID to add the project to"
        },
        area_title: {
          type: "string",
          description: "Optional area title to add the project to"
        },
        todos: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of to-do titles to add to the project"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "get_inbox",
    description: "Get todos from Inbox",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_today",
    description: "Get todos due today",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_upcoming",
    description: "Get upcoming todos",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_anytime",
    description: "Get todos from Anytime list",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_someday",
    description: "Get todos from Someday list",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_projects",
    description: "Get all projects from Things",
    inputSchema: {
      type: "object",
      properties: {
        include_items: {
          type: "boolean",
          description: "Whether to include item details in each project",
          default: false
        }
      }
    }
  },
  {
    name: "get_areas",
    description: "Get all areas from Things",
    inputSchema: {
      type: "object",
      properties: {
        include_items: {
          type: "boolean",
          description: "Whether to include item details in each area",
          default: false
        }
      }
    }
  },
  {
    name: "get_tags",
    description: "Get all tags from Things",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_todos",
    description: "Get todos from Things, optionally filtered by project",
    inputSchema: {
      type: "object",
      properties: {
        project_uuid: {
          type: "string",
          description: "Optional project UUID to filter todos"
        },
        include_items: {
          type: "boolean",
          description: "Whether to include item details",
          default: true
        }
      }
    }
  },
  {
    name: "get_logbook",
    description: "Get completed todos from Logbook, defaults to last 7 days",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Time period (e.g., '7d', '2w', '1m', '1y')",
          pattern: "^\\d+[dwmy]$"
        },
        limit: {
          type: "integer",
          description: "Maximum number of todos to return",
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: "get_trash",
    description: "Get trashed todos",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_tagged_items",
    description: "Get items with a specific tag",
    inputSchema: {
      type: "object",
      properties: {
        tag_title: {
          type: "string",
          description: "The tag title to filter by"
        }
      },
      required: ["tag_title"]
    }
  },
  {
    name: "search_todos",
    description: "Search for todos",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_advanced",
    description: "Advanced search with multiple criteria",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        completed: {
          type: "boolean",
          description: "Include completed items"
        },
        canceled: {
          type: "boolean",
          description: "Include canceled items"
        },
        trashed: {
          type: "boolean",
          description: "Include trashed items"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of tag names to filter by"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_recent",
    description: "Get recently modified items",
    inputSchema: {
      type: "object",
      properties: {
        days: {
          type: "integer",
          description: "Number of days to look back",
          default: 7
        }
      }
    }
  },
  {
    name: "update_todo",
    description: "Update an existing to-do item in Things",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The ID of the to-do to update"
        },
        title: {
          type: "string",
          description: "Optional new title for the to-do item"
        },
        notes: {
          type: "string",
          description: "Optional new notes for the to-do"
        },
        when: {
          type: "string",
          description: "Optional when date (when scheduled to work on) in YYYY-MM-DD format"
        },
        deadline: {
          type: "string",
          description: "Optional deadline (when actually due) in YYYY-MM-DD format"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of tag names"
        },
        checklist_items: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of checklist items"
        },
        completed: {
          type: "boolean",
          description: "Mark as completed"
        },
        canceled: {
          type: "boolean",
          description: "Mark as canceled"
        }
      },
      required: ["id"]
    }
  },
  {
    name: "update_project",
    description: "Update an existing project in Things",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The ID of the project to update"
        },
        title: {
          type: "string",
          description: "Optional new name for the project"
        },
        notes: {
          type: "string",
          description: "Optional new notes for the project"
        },
        when: {
          type: "string",
          description: "Optional when date (when scheduled to work on) in YYYY-MM-DD format"
        },
        deadline: {
          type: "string",
          description: "Optional deadline (when actually due) in YYYY-MM-DD format"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of tag names"
        },
        completed: {
          type: "boolean",
          description: "Mark as completed"
        },
        canceled: {
          type: "boolean",
          description: "Mark as canceled"
        }
      },
      required: ["id"]
    }
  },
  {
    name: "show_item",
    description: "Show details of a specific item",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The ID of the item to show"
        }
      },
      required: ["id"]
    }
  },
  {
    name: "search_items",
    description: "Search for items in Things",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        }
      },
      required: ["query"]
    }
  }
];