/**
 * Area operations for Things 3
 */

import { mapArea, mapTodo } from './utils.js';

export class AreaOperations {
  
  /**
   * Get all areas
   */
  static getAll(things, params) {
    let areas;
    try {
      areas = things.areas();
    } catch (e) {
      return [];
    }
    
    const includeItems = params.include_items || false;
    
    return areas.map(area => {
      const mapped = mapArea(area);
      
      if (includeItems) {
        try {
          mapped.todos = area.toDos().map(mapTodo);
        } catch (e) {
          mapped.todos = [];
        }
      }
      
      return mapped;
    });
  }
}