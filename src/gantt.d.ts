/**
 * JavaScript Gantt Chart Library - TypeScript Definitions
 * Version: 1.2.0
 */

/**
 * Represents a single task/activity in the Gantt chart
 */
export interface GanttTask {
  /**
   * Unique identifier for the task (must be unique within the dataset)
   */
  id: string | number;

  /**
   * Display name of the task
   */
  name: string;

  /**
   * Task start date (YYYY-MM-DD format or Date object)
   */
  start_date: string | Date;

  /**
   * Task end date (optional, calculated if duration is provided)
   */
  end_date?: string | Date;

  /**
   * Task duration in days
   */
  duration: number;

  /**
   * Task progress percentage (0-100)
   * @default 0
   */
  progress?: number;

  /**
   * Parent task ID for hierarchical tasks
   */
  parent?: string | number;

  /**
   * Child tasks (nested tasks)
   */
  children?: GanttTask[];

  /**
   * Task type ('task', 'milestone', 'project', etc.)
   */
  type?: string;

  /**
   * Task description/text
   */
  text?: string;

  /**
   * Custom color for the task bar
   */
  color?: string;

  /**
   * Custom CSS class for the task
   */
  custom_class?: string;

  /**
   * Resource assigned to the task
   */
  resource?: string;

  /**
   * Whether the task is open/expanded
   */
  isOpen?: boolean;

  /**
   * Additional custom properties
   */
  [key: string]: any;
}

/**
 * Represents a column definition in the left sidebar
 */
export interface GanttColumn {
  /**
   * Display label for the column header
   */
  label: string;

  /**
   * Property name to bind from task data
   */
  name: string;

  /**
   * Column width in pixels
   */
  width: number;

  /**
   * Template function to render cell content
   */
  template?: (task: GanttTask) => string;

  /**
   * Whether the column is resizable
   */
  resize?: boolean;

  /**
   * Minimum column width
   */
  min_width?: number;

  /**
   * Maximum column width
   */
  max_width?: number;

  /**
   * Custom CSS class for the column
   */
  class?: string;
}

/**
 * Represents a time scale definition
 */
export interface GanttScale {
  /**
   * Time unit ('day', 'week', 'month', 'quarter', 'year', 'hour')
   */
  unit: string;

  /**
   * Step size (e.g., 1 day, 2 weeks, etc.)
   */
  step: number;

  /**
   * Date format string or function
   */
  format: string | ((date: Date) => string);
}

/**
 * Represents a task link/dependency
 */
export interface GanttLink {
  /**
   * Source task ID
   */
  source: string | number;

  /**
   * Target task ID
   */
  target: string | number;

  /**
   * Link type ('0' = FS, '1' = SS, '2' = FF, '3' = SF)
   */
  type: string;

  /**
   * Optional lag/lead time in days
   */
  lag?: number;
}

/**
 * Main Gantt Chart configuration options
 */
export interface GanttOptions {
  /**
   * Array of task objects
   */
  data: GanttTask[];

  /**
   * Left sidebar column definitions
   */
  columns?: GanttColumn[];

  /**
   * Right sidebar column definitions
   */
  rightGrid?: GanttColumn[];

  /**
   * Date format string for display
   */
  date_format?: string;

  /**
   * Whether tasks are collapsed by default
   * @default true
   */
  collapse?: boolean;

  /**
   * Show full weeks in the timeline
   * @default true
   */
  fullWeek?: boolean;

  /**
   * Show today marker on timeline
   * @default true
   */
  todayMarker?: boolean;

  /**
   * Array of weekend days (0=Sunday, 6=Saturday)
   * @default []
   */
  weekends?: number[];

  /**
   * Gantt chart start date
   */
  startDate?: string | Date;

  /**
   * Gantt chart end date
   */
  endDate?: string | Date;

  /**
   * Initial zoom level ('hour', 'day', 'week', 'month', 'quarter', 'year')
   * @default 'day'
   */
  zoomLevel?: string;

  /**
   * Zoom level configurations
   */
  zoomConfig?: {
    levels: GanttScale[];
  };

  /**
   * Time scales for the timeline
   */
  scales?: GanttScale[];

  /**
   * Minimum column width
   * @default 80
   */
  minColWidth?: number;

  /**
   * Day of week that starts the week (0=Sunday, 1=Monday, etc.)
   * @default 1
   */
  weekStart?: number;

  /**
   * Height of the scale header in pixels
   * @default 30
   */
  scale_height?: number;

  /**
   * Height of each task row in pixels
   * @default 50
   */
  row_height?: number;

  /**
   * Width of the left sidebar in pixels
   * @default 400
   */
  sidebarWidth?: number;

  /**
   * Custom markers to display on timeline
   */
  customMarker?: any[];

  /**
   * Whether to show full cell background
   * @default true
   */
  fullCell?: boolean;

  /**
   * Task color configuration (boolean or function)
   */
  taskColor?: boolean | ((task: GanttTask) => string);

  /**
   * Task opacity (0-1)
   * @default 0.8
   */
  taskOpacity?: number;

  /**
   * Whether to show task dependencies
   */
  addLinks?: boolean | ((task: GanttTask) => boolean);

  /**
   * Export API configuration
   */
  exportApi?: any;

  /**
   * Update task links when dragging
   * @default true
   */
  updateLinkOnDrag?: boolean;

  /**
   * Whether to allow task splitting
   */
  splitTask?: boolean;

  /**
   * Array of task links/dependencies
   */
  links?: GanttLink[];

  /**
   * Allow selecting area by dragging
   */
  selectAreaOnDrag?: boolean;

  /**
   * Show task progress (boolean or function)
   * @default true
   */
  taskProgress?: boolean | ((task: GanttTask) => number);

  /**
   * Enable mouse wheel scrolling
   */
  mouseScroll?: boolean;

  /**
   * Require Ctrl key for mouse scroll
   * @default true
   */
  ctrlKeyRequiredForMouseScroll?: boolean;

  /**
   * Enable column sorting
   */
  sort?: boolean;

  /**
   * Allow dropping tasks in drop area
   * @default true
   */
  dropArea?: boolean;

  /**
   * Internationalization settings
   */
  i18n?: {
    [languageCode: string]: {
      month_full: string[];
      month_short: string[];
      day_full: string[];
      day_short: string[];
      [key: string]: any;
    };
  };
}

/**
 * Template configuration for custom rendering
 */
export interface GanttTemplate {
  /**
   * Custom grid header class function
   */
  grid_header_class?: (column: GanttColumn, index: number) => string;

  /**
   * Custom grid row class function
   */
  grid_row_class?: (task: GanttTask, index: number) => string;

  /**
   * Custom task element class function
   */
  task_class?: (task: GanttTask) => string;

  /**
   * Custom task row class function
   */
  task_row_class?: (task: GanttTask) => string;

  /**
   * Custom scale cell class function
   */
  scale_cell_class?: (date: Date) => string;

  /**
   * Custom grid cell class function
   */
  grid_cell_class?: (task: GanttTask, column: GanttColumn) => string;

  /**
   * Custom timeline cell class function
   */
  timeline_cell_class?: (date: Date) => string;

  /**
   * Custom lightbox content
   */
  showLightBox?: (task: GanttTask) => string;

  /**
   * Additional custom templates
   */
  [key: string]: any;
}

/**
 * Main Gantt Chart class
 */
export class javascriptgantt {
  /**
   * Creates a new Gantt chart instance
   *
   * @param element - The DOM element to mount the chart in
   * @param options - Configuration options for the chart
   * @param templates - Custom templates for rendering
   *
   * @example
   * const gantt = new javascriptgantt(
   *   document.getElementById('gantt_here'),
   *   {
   *     data: tasks,
   *     columns: columns,
   *     row_height: 50
   *   }
   * );
   */
  constructor(
    element: HTMLElement,
    options: GanttOptions,
    templates?: GanttTemplate
  );

  /**
   * Initializes the Gantt chart
   */
  init(): void;

  /**
   * Destroys the Gantt instance and cleans up resources
   */
  destroy(): void;

  /**
   * Adds a new task to the chart
   */
  addTask(task: GanttTask): void;

  /**
   * Deletes a task from the chart
   */
  deleteTask(taskId: string | number): void;

  /**
   * Updates an existing task
   */
  updateTaskData(task: Partial<GanttTask>): void;

  /**
   * Gets a task by ID
   */
  getTask(taskId: string | number): GanttTask | undefined;

  /**
   * Selects a task (highlights it)
   */
  selectTask(taskId: string | number): void;

  /**
   * Gets the currently selected task
   */
  getSelectedTask(): GanttTask | null;

  /**
   * Expands a task to show children
   */
  expandTask(taskId: string | number): void;

  /**
   * Collapses a task to hide children
   */
  collapseTask(taskId: string | number): void;

  /**
   * Exports the chart as a PNG image
   */
  exportToPNG(name?: string, styleSheet?: any): void;

  /**
   * Exports the chart as a PDF document
   */
  exportToPDF(name?: string, styleSheet?: any): void;

  /**
   * Exports the chart as an Excel file
   */
  exportToExcel(name?: string): void;

  /**
   * Searches for tasks matching a query
   */
  search(query: string): GanttTask[];

  /**
   * Sorts tasks by a column
   */
  sort(column: string, ascending?: boolean): void;

  /**
   * Scrolls the view to a specific task
   */
  scrollToTask(taskId: string | number): void;

  /**
   * Refreshes/re-renders the chart
   */
  refresh(): void;

  /**
   * Registers an event listener
   */
  on(eventName: string, callback: (event: any) => void): void;

  /**
   * Removes an event listener
   */
  off(eventName: string, callback?: (event: any) => void): void;

  /**
   * Gets current options
   */
  getOptions(): GanttOptions;

  /**
   * Updates options
   */
  setOptions(options: Partial<GanttOptions>): void;

  /**
   * The options object
   */
  options: GanttOptions;

  /**
   * The container element
   */
  element: HTMLElement;

  /**
   * Original task data
   */
  originalData: GanttTask[];
}

/**
 * Creates a new Gantt chart instance
 *
 * @example
 * import { javascriptgantt } from 'javascriptgantt';
 *
 * const tasks = [
 *   { id: 1, name: 'Task 1', start_date: '2024-01-01', duration: 5 }
 * ];
 *
 * const gantt = new javascriptgantt(
 *   document.getElementById('gantt'),
 *   { data: tasks }
 * );
 */
export default javascriptgantt;

/**
 * Event types dispatched by Gantt chart
 */
export enum GanttEventType {
  /**
   * Fired when a task is selected
   */
  TaskSelected = 'onTaskSelected',

  /**
   * Fired when a task is deleted
   */
  TaskDeleted = 'onTaskDelete',

  /**
   * Fired after a task is updated
   */
  TaskUpdated = 'onAfterTaskUpdate',

  /**
   * Fired when Gantt is destroyed
   */
  Destroyed = 'onDestroy',

  /**
   * Fired when an error occurs
   */
  Error = 'onError',

  /**
   * Fired after rendering
   */
  Rendered = 'onAfterRender',
}

