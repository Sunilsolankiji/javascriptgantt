# AGENTS.md - Guide for AI Coding Agents

This document helps AI coding agents understand the structure, conventions, and workflows of the **javascriptgantt** project—a modern, zero-dependency JavaScript Gantt chart library.

## Project Overview

- **Project Name:** javascriptgantt
- **Type:** ES6+ module, zero-dependency library
- **Main Entry:** `src/gantt.js`
- **TypeScript Definitions:** `src/gantt.d.ts`
- **Package:** Published to npm as `javascriptgantt`
- **Node Version:** ≥16.0.0

## Architecture

### Module Organization

The codebase uses a modular architecture with clear separation of concerns:

**Core Entry Point:**

- `src/gantt.js` - Main class with private fields (using `#` syntax), uses ES modules

**Managers (in `src/modules/`):**

- `EventManager.js` - Central event system with `.on()`, `.off()`, `.emit()` interface
- `TaskManager.js` - Task manipulation and hierarchy management
- `LinkManager.js` - Task dependency/link management (4 link types: FS, SS, FF, SF)
- `ScaleManager.js` - Time scale and zoom level handling
- `I18nManager.js` - Internationalization (multilingual support)
- `DragDropManager.js` - Drag-and-drop interactions
- `AccessibilityManager.js` - WCAG accessibility features
- `ExportManager.js` - PDF, PNG, Excel export functionality

**Utilities (in `src/utils/`):**

- `dateUtils.js` - Date manipulation (addDays, daysBetween, stripTime, isWeekend)
- `domUtils.js` - DOM operations (createElement, querySelector, addClass, etc.)
- `dataUtils.js` - Data transformation (deepClone, findBy, groupBy, sortBy)
- `validators.js` - Type checking (isString, isNumber, isArray, isEmpty, etc.)

Each module has an `index.js` file that centrally exports all exports from that category.

### CSS Architecture

- `src/gantt.css` - Main styles (required)
- `src/accessibility.css` - Accessibility enhancements (optional)
- `src/theme/dark.css` - Dark theme override (optional)

## Development Workflow

### Scripts

```bash
# Code Quality
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix linting errors
npm run format         # Prettier formatting
npm run format:check   # Check format without changes

# Testing
npm run test           # Run all tests (vitest)
npm run test:ui        # UI mode for debugging tests
npm run test:coverage  # Generate coverage report
npm run test:all       # Lint + format check + tests

# Versioning & Release
npm run release        # Auto-detect version bump + changelog
npm run release:patch  # Patch bump (1.0.0 → 1.0.1)
npm run release:minor  # Minor bump (1.0.0 → 1.1.0)
npm run release:major  # Major bump (1.0.0 → 2.0.0)

# Git Hooks (automatic)
npm run prepare        # Install Husky hooks
```

### Code Quality Tools

**ESLint Configuration (`eslint.config.js`):**

- ES2022 target, module mode
- Rules: prefer `const`, arrow functions, template literals, destructuring
- Ignores: `node_modules/`, `src/gantt.js` (main file is excluded)
- Custom rule: unused vars with `^_` prefix are allowed

**Prettier:**

- Formats: JS, CSS, JSON, Markdown
- Run-on-save in most IDEs

**Commitlint:**

- Enforces [Conventional Commits](https://www.conventionalcommits.org/)
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Example: `git commit -m "feat: add export to Excel functionality"`

**Husky Hooks:**

- `pre-commit` - Runs lint-staged (format + lint staged files)
- `commit-msg` - Validates commit message format

### Testing

**Framework:** Vitest with happy-dom environment (browser DOM simulation)

**Test Structure:**

- Tests live in `tests/unit/`
- Fixtures (sample data) in `tests/fixtures/sample-data.js`
- Include setup/teardown (beforeEach/afterEach)
- Example: `tests/unit/gantt.test.js`

**Coverage Exclusions:**

- `tests/` directory
- `**/*.d.ts` files
- `**/*.config.js` files

## Code Patterns & Conventions

### ES6+ Module Imports

The project uses ES6 module syntax throughout. Always:

- Import specific utilities/managers rather than whole modules
- Use relative paths with `.js` extension
- Place imports at the top of files

Example:

```javascript
import { EventManager } from "./modules/EventManager.js";
import { addDays, stripTime } from "./utils/dateUtils.js";
```

### Private Class Fields

The main `javascriptgantt` class uses private fields (WeakMap-like behavior):

```javascript
class javascriptgantt {
  #eventManager = null;
  #taskManager = null;
  #searchedData = undefined;
  // ...
}
```

### Event System

All event-driven behavior uses the EventManager:

```javascript
this.#eventManager.on("task:change", (data) => {
  /* ... */
});
this.#eventManager.emit("task:change", taskData);
```

### Data Structures

**Task Object:** Must have `id`, `text`, `start_date`, `end_date`, `parent`, `progress`

```javascript
{
  id: 1,
  text: "Task Name",
  start_date: "05-05-2023",
  end_date: "05-10-2023",
  parent: 0,
  progress: 50,
  custom_class: "optional-class"
}
```

**Link Object:** Represents task dependencies

```javascript
{
  id: 1,
  source: 1,      // task id
  target: 2,      // task id
  type: 0         // 0=FS, 1=SS, 2=FF, 3=SF
}
```

### Utility Functions

Always use utility functions for common operations:

- **Date:** `addDays()`, `daysBetween()`, `stripTime()`, `isWeekend()`
- **DOM:** `createElement()`, `addClass()`, `removeClass()`, `hasClass()`, `setStyles()`
- **Data:** `deepClone()`, `findBy()`, `groupBy()`, `sortBy()`, `hasProperty()`
- **Validation:** `isString()`, `isNumber()`, `isArray()`, `isEmpty()`, `isFunction()`

### Type Safety

TypeScript definitions exist in `src/gantt.d.ts`. When modifying:

- Update interface definitions for new public methods/properties
- Keep JSDoc comments in JavaScript for IDE support
- Export types from `gantt.d.ts` for consumers

### Exports

**Named exports from modules:**

```javascript
export { EventManager } from "./EventManager.js";
```

**Package.json exports map:**

```json
"exports": {
  ".": { "import": "./src/gantt.js" },
  "./utils": { "import": "./src/utils/index.js" },
  "./modules": { "import": "./src/modules/index.js" }
}
```

Consumers can import: `import { addDays } from 'javascriptgantt/utils'`

## Common Workflows

### Adding a New Utility Function

1. Create/edit file in `src/utils/`
2. Export from `src/utils/index.js`
3. Add tests to `tests/unit/utils.test.js`
4. Run `npm run test` to verify
5. Run `npm run lint:fix && npm run format` to polish

Example:

```javascript
// src/utils/stringUtils.js
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// src/utils/index.js
export * from "./stringUtils.js";

// Usage in modules
import { capitalize } from "../utils/stringUtils.js";
```

### Adding a New Manager Module

1. Create `src/modules/NewManager.js`
2. Export from `src/modules/index.js`
3. Instantiate in main `gantt.js` class
4. Use EventManager for cross-module communication
5. Add tests to `tests/unit/modules.test.js`

Example:

```javascript
// src/modules/NewManager.js
export class NewManager {
  constructor(eventManager) {
    this.eventManager = eventManager;
  }

  doSomething() {
    this.eventManager.emit("new:event", data);
  }
}

// In gantt.js main class
this.#newManager = new NewManager(this.#eventManager);
```

### Debugging & Testing

- Run tests with UI: `npm run test:ui` (opens browser for debugging)
- Check coverage: `npm run test:coverage` → view `coverage/index.html`
- Use ESLint to catch issues: `npm run lint`
- Format before testing: `npm run format`

### Making a Release

1. Ensure all changes are committed with conventional commit messages
2. Run `npm run release` (auto-detects version)
3. Review generated `CHANGELOG.md`
4. Push with tags: `git push --follow-tags origin main`
5. GitHub Actions will publish to npm (if configured)

## File Structure Reference

```
src/
├── gantt.js                 # Main class (private fields, ES modules)
├── gantt.d.ts              # TypeScript definitions
├── gantt.css               # Core styles
├── accessibility.css       # Accessibility styles
├── modules/
│   ├── EventManager.js      # Event pub/sub system
│   ├── TaskManager.js       # Task CRUD & hierarchy
│   ├── LinkManager.js       # Task dependencies
│   ├── ScaleManager.js      # Time scale handling
│   ├── I18nManager.js       # Localization
│   ├── DragDropManager.js   # Drag-and-drop
│   ├── AccessibilityManager.js # a11y features
│   ├── ExportManager.js     # Export formats
│   └── index.js             # Central exports
├── utils/
│   ├── dateUtils.js         # Date operations
│   ├── domUtils.js          # DOM manipulations
│   ├── dataUtils.js         # Data transformations
│   ├── validators.js        # Type checks
│   └── index.js             # Central exports
└── theme/
    └── dark.css             # Dark theme

tests/
├── unit/
│   ├── gantt.test.js        # Core functionality
│   ├── modules.test.js      # Module tests
│   └── utils.test.js        # Utility tests
└── fixtures/
    └── sample-data.js       # Test data

demo/
├── app.js                   # Demo app initialization
└── style.css                # Demo styling

docs/
└── Gantt-Chart-Documentation.pdf  # Full user docs
```

## Important Conventions

- **No External Dependencies:** Zero-dependency design—use built-in browser APIs
- **No Breaking Changes Without Major Version:** Always bump major version for breaking changes
- **Test Coverage:** New features should include corresponding tests
- **Accessibility:** Maintain WCAG compliance; test with AccessibilityManager
- **TypeScript Support:** Keep `gantt.d.ts` in sync with JavaScript implementation
- **CSS Encapsulation:** Use BEM or scoped selectors to avoid global style conflicts
- **Private Members:** Use `#` prefix for true privacy in classes

## Useful Commands for Development

```bash
# Quick check before committing
npm run lint:fix && npm run format && npm run test

# Full validation pipeline
npm run test:all

# Check what changed in formatting
npm run format:check

# Debug a specific test
npm run test:ui -- gantt.test.js

# Preview coverage gaps
npm run test:coverage
```

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Prettier Documentation](https://prettier.io/)
- [ESLint Documentation](https://eslint.org/)
- [Vitest Documentation](https://vitest.dev/)
