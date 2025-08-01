/**
 * Tool Handlers for Things 3 MCP Integration
 * 
 * This module contains all the handler methods for MCP tools.
 * Each handler is responsible for executing the specific functionality
 * of its corresponding tool.
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ThingsValidator, ParameterMapper, ThingsLogger } from "./utils.js";
import { JXATemplates } from "./jxa-templates.js";
import { ResponseFormatter } from "./response-formatter.js";

export class ToolHandlers {
  constructor(executeJXA, executeThingsJXA) {
    this.executeJXA = executeJXA;
    this.executeThingsJXA = executeThingsJXA;
  }

  async addTodo(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    ThingsLogger.info("Creating to-do", { name: scriptParams.name || scriptParams.title });

    const result = await this.executeThingsJXA(
      () => JXATemplates.createTodo(),
      {
        title: scriptParams.name || scriptParams.title,
        notes: scriptParams.notes,
        deadline: scriptParams.due_date,
        when: scriptParams.activation_date,
        list_id: scriptParams.list_id,
        list_title: scriptParams.project,
        area_id: scriptParams.area_id,
        area_title: scriptParams.area,
        tags: scriptParams.tags,
        checklist_items: args.checklist_items
      },
      "Create todo"
    );
    
    ThingsLogger.logAssignmentWarnings(scriptParams, "created");
    ThingsLogger.info("To-do created successfully", { name: scriptParams.name || scriptParams.title, id: result.id });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      message: `Created to-do: ${scriptParams.name || scriptParams.title}`,
      id: result.id,
    });
  }

  async addProject(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    ThingsLogger.info("Creating project", { name: scriptParams.name || scriptParams.title });

    const result = await this.executeThingsJXA(
      () => JXATemplates.createProject(),
      {
        title: scriptParams.name || scriptParams.title,
        notes: scriptParams.notes,
        deadline: scriptParams.due_date,
        when: scriptParams.activation_date,
        area_id: scriptParams.area_id,
        area_title: scriptParams.area,
        tags: scriptParams.tags,
        todos: args.todos
      },
      "Create project"
    );
    
    if (scriptParams.area || scriptParams.area_title) {
      ThingsLogger.info("Project created with area assignment", { 
        name: scriptParams.name || scriptParams.title, 
        area: scriptParams.area || scriptParams.area_title,
        note: "If area doesn't exist, project will remain without area assignment"
      });
    }
    
    ThingsLogger.info("Project created successfully", { name: scriptParams.name || scriptParams.title, id: result.id });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      message: `Created project: ${scriptParams.name || scriptParams.title}`,
      id: result.id,
    });
  }

  async getAreas(args) {
    const includeItems = args.include_items !== undefined ? Boolean(args.include_items) : false;
    ThingsLogger.info("Getting areas", { includeItems });

    const areas = await this.executeThingsJXA(
      () => JXATemplates.getAreas(includeItems),
      {},
      "Get areas"
    );
    
    ThingsLogger.info("Retrieved areas successfully", { count: areas.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: areas.length,
      areas: areas,
    });
  }

  async getTodos(args) {
    const projectUuid = args.project_uuid;
    const includeItems = args.include_items !== undefined ? Boolean(args.include_items) : true;
    
    ThingsLogger.info("Getting todos", { projectUuid, includeItems });

    const todos = await this.executeThingsJXA(
      () => JXATemplates.getTodos(),
      { project_uuid: projectUuid },
      "Get todos"
    );
    
    ThingsLogger.info("Retrieved todos successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getProjects(args) {
    const includeItems = args.include_items !== undefined ? Boolean(args.include_items) : false;
    
    ThingsLogger.info("Getting projects", { includeItems });

    const projects = await this.executeThingsJXA(
      () => JXATemplates.getProjects(includeItems),
      {},
      "Get projects"
    );
    
    ThingsLogger.info("Retrieved projects successfully", { count: projects.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: projects.length,
      projects: projects,
    });
  }

  async getInbox(args) {
    ThingsLogger.info("Getting inbox todos");

    const todos = await this.executeThingsJXA(
      () => JXATemplates.getInbox(),
      {},
      "Get inbox"
    );
    
    ThingsLogger.info("Retrieved inbox todos successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getToday(args) {
    ThingsLogger.info("Getting today todos");

    const todos = await this.executeThingsJXA(
      () => JXATemplates.getToday(),
      {},
      "Get today"
    );
    
    ThingsLogger.info("Retrieved today todos successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getUpcoming(args) {
    ThingsLogger.info("Getting upcoming todos");

    const todos = await this.executeThingsJXA(
      () => JXATemplates.getUpcoming(),
      {},
      "Get upcoming"
    );
    
    ThingsLogger.info("Retrieved upcoming todos successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getAnytime(args) {
    ThingsLogger.info("Getting anytime todos");

    const todos = await this.executeThingsJXA(
      () => JXATemplates.getAnytime(),
      {},
      "Get anytime"
    );
    
    ThingsLogger.info("Retrieved anytime todos successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getSomeday(args) {
    ThingsLogger.info("Getting someday todos");

    const todos = await this.executeThingsJXA(
      () => JXATemplates.getSomeday(),
      {},
      "Get someday"
    );
    
    ThingsLogger.info("Retrieved someday todos successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getLogbook(args) {
    const period = args.period || "7d";
    const limit = args.limit || 50;
    
    ThingsLogger.info("Getting logbook todos", { period, limit });

    // Parse period string (e.g., "7d", "2w", "1m")
    const match = period.match(/^(\d+)([dwmy])$/);
    const daysBack = match ? this.parsePeriodToDays(parseInt(match[1]), match[2]) : 7;
    
    const todos = await this.executeThingsJXA(
      () => JXATemplates.getLogbook(limit, daysBack),
      {},
      "Get logbook"
    );
    
    ThingsLogger.info("Retrieved logbook todos successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      period: period,
      count: todos.length,
      todos: todos,
    });
  }

  parsePeriodToDays(value, unit) {
    switch(unit) {
      case 'd': return value;
      case 'w': return value * 7;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 7;
    }
  }

  async getTrash(args) {
    ThingsLogger.info("Getting trashed todos");

    const todos = await this.executeThingsJXA(
      () => JXATemplates.getTrash(),
      {},
      "Get trash"
    );
    
    ThingsLogger.info("Retrieved trashed todos successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: todos.length,
      todos: todos,
    });
  }

  async getTags(args) {
    ThingsLogger.info("Getting tags");

    const tags = await this.executeThingsJXA(
      () => JXATemplates.getTags(),
      {},
      "Get tags"
    );
    
    ThingsLogger.info("Retrieved tags successfully", { count: tags.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      count: tags.length,
      tags: tags,
    });
  }

  async getTaggedItems(args) {
    const tagTitle = ThingsValidator.validateStringInput(args.tag_title, "tag_title");
    
    ThingsLogger.info("Getting tagged items", { tagTitle });

    const items = await this.executeThingsJXA(
      () => JXATemplates.getTaggedItems(),
      { tag_title: tagTitle },
      "Get tagged items"
    );
    
    ThingsLogger.info("Retrieved tagged items successfully", { count: items.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      tag: tagTitle,
      count: items.length,
      items: items,
    });
  }

  async searchTodos(args) {
    const validatedQuery = ThingsValidator.validateStringInput(args.query, "query");
    
    ThingsLogger.info("Searching todos", { query: validatedQuery });

    const todos = await this.executeThingsJXA(
      () => JXATemplates.searchTodos(),
      { query: validatedQuery },
      "Search todos"
    );
    
    ThingsLogger.info("Todo search completed successfully", { 
      query: validatedQuery, 
      count: todos.length 
    });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      query: validatedQuery,
      count: todos.length,
      todos: todos,
    });
  }

  async searchAdvanced(args) {
    const validatedQuery = ThingsValidator.validateStringInput(args.query, "query");
    const tags = args.tags ? ThingsValidator.validateArrayInput(args.tags, "tags") : [];
    const completed = args.completed !== undefined ? Boolean(args.completed) : false;
    const canceled = args.canceled !== undefined ? Boolean(args.canceled) : false;
    const trashed = args.trashed !== undefined ? Boolean(args.trashed) : false;
    
    ThingsLogger.info("Advanced search", { query: validatedQuery, tags, completed, canceled, trashed });

    const searchResults = await this.executeThingsJXA(
      () => JXATemplates.searchAdvanced(),
      {
        query: validatedQuery,
        tags: tags,
        completed: completed,
        canceled: canceled,
        trashed: trashed
      },
      "Advanced search"
    );
    
    ThingsLogger.info("Advanced search completed successfully", { 
      query: validatedQuery, 
      count: searchResults.length,
      filters: { tags, completed, canceled, trashed }
    });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      query: validatedQuery,
      filters: { tags, completed, canceled, trashed },
      count: searchResults.length,
      results: searchResults,
    });
  }

  async getRecent(args) {
    const days = args.days || 7;
    
    ThingsLogger.info("Getting recent items", { days });

    const todos = await this.executeThingsJXA(
      () => JXATemplates.getRecent(),
      { days: days },
      "Get recent"
    );
    
    ThingsLogger.info("Retrieved recent items successfully", { count: todos.length });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      days: days,
      count: todos.length,
      items: todos,
    });
  }

  async updateTodo(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    if (!scriptParams.id) {
      throw new McpError(ErrorCode.InvalidParams, "Todo ID is required for update");
    }
    
    ThingsLogger.info("Updating to-do", { id: scriptParams.id });

    try {
      const result = await this.executeThingsJXA(
        () => JXATemplates.updateTodo(),
        {
          id: scriptParams.id,
          title: scriptParams.title || scriptParams.new_name,
          notes: scriptParams.notes,
          deadline: scriptParams.due_date,
          when: scriptParams.activation_date,
          tags: scriptParams.tags,
          checklist_items: scriptParams.checklist_items,
          completed: scriptParams.completed,
          canceled: scriptParams.canceled
        },
        "Update todo"
      );
      
      ThingsLogger.logAssignmentWarnings(scriptParams, "updated");
      ThingsLogger.info("To-do updated successfully", { id: scriptParams.id });
      
      return ResponseFormatter.createSuccessResponse({
        success: true,
        message: `Updated to-do: ${scriptParams.id}`,
      });
    } catch (error) {
      ThingsLogger.warn("Todo not found for update", { id: scriptParams.id });
      
      return ResponseFormatter.createSuccessResponse({
        success: false,
        message: `To-do not found: ${scriptParams.id}`,
        error: "TODO_NOT_FOUND"
      });
    }
  }

  async updateProject(args) {
    const scriptParams = ParameterMapper.validateAndMapParameters(args);
    
    if (!scriptParams.id) {
      throw new McpError(ErrorCode.InvalidParams, "Project ID is required for update");
    }
    
    ThingsLogger.info("Updating project", { id: scriptParams.id });

    try {
      const result = await this.executeThingsJXA(
        () => JXATemplates.updateProject(),
        {
          id: scriptParams.id,
          title: scriptParams.title,
          notes: scriptParams.notes,
          deadline: scriptParams.due_date,
          when: scriptParams.activation_date,
          tags: scriptParams.tags,
          completed: scriptParams.completed,
          canceled: scriptParams.canceled
        },
        "Update project"
      );
      
      ThingsLogger.logAssignmentWarnings(scriptParams, "updated");
      ThingsLogger.info("Project updated successfully", { id: scriptParams.id });
      
      return ResponseFormatter.createSuccessResponse({
        success: true,
        message: `Updated project: ${scriptParams.id}`,
      });
    } catch (error) {
      ThingsLogger.warn("Project not found for update", { id: scriptParams.id });
      
      return ResponseFormatter.createSuccessResponse({
        success: false,
        message: `Project not found: ${scriptParams.id}`,
        error: "PROJECT_NOT_FOUND"
      });
    }
  }

  async showItem(args) {
    const itemId = ThingsValidator.validateStringInput(args.id, "id");
    
    ThingsLogger.info("Showing item", { id: itemId });

    try {
      const item = await this.executeThingsJXA(
        () => JXATemplates.showItem(),
        { id: itemId },
        "Show item"
      );
      
      ThingsLogger.info("Item found successfully", { id: itemId, type: item.type });
      
      return ResponseFormatter.createSuccessResponse({
        success: true,
        id: itemId,
        item: item,
      });
    } catch (error) {
      ThingsLogger.warn("Item not found", { id: itemId });
      
      return ResponseFormatter.createSuccessResponse({
        success: false,
        message: `Item not found: ${itemId}`,
        error: "ITEM_NOT_FOUND"
      });
    }
  }

  async searchItems(args) {
    const validatedQuery = ThingsValidator.validateStringInput(args.query, "query");

    ThingsLogger.info("Searching items", { query: validatedQuery });

    const searchResults = await this.executeThingsJXA(
      () => JXATemplates.searchItems(),
      { query: validatedQuery },
      "Search items"
    );
    
    ThingsLogger.info("Search completed successfully", { 
      query: validatedQuery, 
      count: searchResults.length 
    });
    
    return ResponseFormatter.createSuccessResponse({
      success: true,
      query: validatedQuery,
      count: searchResults.length,
      results: searchResults,
    });
  }
}