# javascriptgantt

[![npm version](https://img.shields.io/npm/v/javascriptgantt?style=flat-square)](https://www.npmjs.com/package/javascriptgantt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/Sunilsolankiji/javascriptgantt?style=flat-square)](https://github.com/Sunilsolankiji/javascriptgantt/issues)
[![GitHub stars](https://img.shields.io/github/stars/Sunilsolankiji/javascriptgantt?style=flat-square)](https://github.com/Sunilsolankiji/javascriptgantt/stargazers)
[![npm downloads](https://img.shields.io/npm/dm/javascriptgantt?style=flat-square)](https://www.npmjs.com/package/javascriptgantt)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

A modern, feature-rich JavaScript Gantt chart library for project management. Build interactive, responsive Gantt charts
with zero dependencies, featuring drag-and-drop functionality, task dependencies, auto-scheduling, and extensive
customization options.

## ✨ Key Highlights

- 🚀 **Zero Dependencies** - Lightweight and fast
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🎨 **Fully Customizable** - Themes, colors, and layouts
- 🔗 **Task Dependencies** - Four types of task linking
- 📊 **Multiple Views** - Hour, day, week, month, quarter, year
- 🌍 **i18n Support** - Multilingual ready
- 📤 **Export Options** - PDF, PNG, Excel
- 🎯 **Auto-Scheduling** - Intelligent task scheduling

## 📚 Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Features](#features)
- [Documentation](#documentation)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

<a name="installation"></a>

## 📦 Installation

### Using npm (Recommended)

```bash
npm install javascriptgantt
```

Or using yarn:

```bash
yarn add javascriptgantt
```

### Via CDN

Add these lines to your HTML file:

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/javascriptgantt@latest/src/gantt.css"
/>
<script src="https://unpkg.com/javascriptgantt@latest/src/gantt.js"></script>
```

### Manual Download

1. Download the latest release from our [GitHub repository](https://github.com/Sunilsolankiji/javascriptgantt/releases)
2. Extract and copy `gantt.js` and `gantt.css` to your project
3. Link the files in your HTML:
   ```html
   <link rel="stylesheet" href="path/to/gantt.css" />
   <script src="path/to/gantt.js"></script>
   ```

<a href="https://sunilsolankiji.github.io/javascriptgantt/">
  <img src="./src/assets/images/jsgantt-screenshot.png" alt="javascriptgantt Screenshot">
</a>    
  
---

<a name="getting-started"></a>

## 🚀 Getting Started

### Quick Start Guide

**Step 1:** Include the library files in your HTML

```html
<link rel="stylesheet" href="gantt.css" />
<script src="gantt.js"></script>
```

**Step 2:** Create a container element

```html
<div id="gantt_here" style="width: 100%; height: 100vh;"></div>
```

**Step 3:** Initialize the Gantt chart with your data

```js
const element = document.getElementById("gantt_here");
const gantt = new javascriptgantt(element);

// Configure columns
gantt.options.columns = [
  {
    name: "text",
    width: 245,
    min_width: 80,
    max_width: 300,
    tree: true,
    label: "Name",
    resize: true,
    template: (task) => {
      return `<span>${task.parent == 0 ? task.text : task.subject}</span>`;
    },
  },
  // ...more columns
];

// Add your tasks
gantt.options.data = [
  { id: 1, text: "Project 1", parent: 0, progress: 50 },
  {
    id: 2,
    text: "Task #1",
    start_date: "05-05-2023",
    end_date: "05-05-2023",
    parent: 1,
    progress: 60,
  },
  // ...more tasks
];

// Configure time scales
gantt.options.scales = [
  {
    unit: "week",
    step: 1,
    format: (t) => {
      return "%d %F";
    },
  },
  {
    unit: "day",
    step: 1,
    format: "%d %D",
  },
];

// Define task dependencies
gantt.options.links = [
  { id: 1, source: 1, target: 2, type: 0 }, // Finish-to-Start
  { id: 2, source: 2, target: 3, type: 1 }, // Start-to-Start
  { id: 3, source: 3, target: 4, type: 2 }, // Finish-to-Finish
  { id: 4, source: 12, target: 15, type: 3 }, // Start-to-Finish
];

// Render the chart
gantt.render();
```

> **💡 Tip:** Call `gantt.render()` whenever you need to update the chart with new data.

### 📖 Resources

- [Live Demo](https://sunilsolankiji.github.io/javascriptgantt/)
- [Interactive Tutorial on StackBlitz](https://stackblitz.com/edit/js-bdaa47?file=index.js)
- [Complete Documentation](./docs/Gantt-Chart-Documentation.pdf)

  ***

<a name="features"></a>

## ✨ Features

### Core Functionality

#### 🔗 Task Linking

Four types of task dependencies:

- **Finish-to-Start (FS)** - Task B starts when Task A finishes
- **Start-to-Start (SS)** - Task B starts when Task A starts
- **Finish-to-Finish (FF)** - Task B finishes when Task A finishes
- **Start-to-Finish (SF)** - Task B finishes when Task A starts

<a href="https://sunilsolankiji.github.io/javascriptgantt/">
  <img src="./src/assets/images/links.gif" alt="Task Linking Demo">
</a>

#### 🎯 Interactive Controls

- **Drag and Drop:** Move tasks horizontally (reschedule) and vertically (reorder)
- **Task Progress:** Update progress by dragging or set percentage manually
- **Date Selection:** Select start and end dates via drag and drop
- **Mouse Scroll:** Navigate timeline with mouse click and drag

#### 🎨 Customization & Theming

- **Task Colors:** Customize task appearance with color picker
- **Themes:** Built-in dark mode support
- **Grid Columns:** Fully customizable column layout
- **Time Scale:** Configurable time scale and formats

<a href="https://sunilsolankiji.github.io/javascriptgantt/">
  <img src="./src/assets/images/theme.gif" alt="Theme Demo">
</a>

<a href="https://sunilsolankiji.github.io/javascriptgantt/">
  <img src="./src/assets/images/taskColor.gif" alt="Task Color Demo">
</a>

### Advanced Features

#### 📊 Views & Display

- **Multiple Zoom Levels:** Hour, day, week, month, quarter, and year views
- **Full Screen Mode:** Immersive full-screen experience
- **Tooltips:** Detailed task information on hover
- **Filtering:** Advanced task filtering capabilities
- **Expand/Collapse:** Hierarchical task management

<a href="https://sunilsolankiji.github.io/javascriptgantt/">
  <img src="./src/assets/images/popup.gif" alt="Popup Demo">
</a>

#### ⚡ Productivity

- **Auto-Scheduling:** Automatic task scheduling based on dependencies
- **Task Management:** Add, modify, or delete tasks easily
- **Markers:** Add visual markers to important dates
- **Progress Tracking:** Visual progress indicators

#### 📤 Export & Integration

- **PDF Export:** Generate professional PDF reports
- **PNG Export:** Export charts as images
- **Excel Export:** Export data to spreadsheet format
- **Localization:** Multi-language support (i18n ready)

### 🔍 Learn More

For a complete list of features and detailed usage instructions, see
our [Full Documentation](./docs/Gantt-Chart-Documentation.pdf).

**Try it yourself:**

- [Live Demo](https://sunilsolankiji.github.io/javascriptgantt/)
- [Interactive Examples on StackBlitz](https://stackblitz.com/edit/js-bdaa47?file=index.js)
  ***

<a name="documentation"></a>

## 📖 Documentation

**Complete Documentation:** [javascriptgantt Documentation](./docs/Gantt-Chart-Documentation.pdf)

### Quick Links

- 📘 [Full Documentation PDF](./docs/Gantt-Chart-Documentation.pdf) - Comprehensive guide with all features
- 🎮 [Live Demo](https://sunilsolankiji.github.io/javascriptgantt/) - See it in action
- 💻 [StackBlitz Tutorial](https://stackblitz.com/edit/js-bdaa47?file=index.js) - Interactive examples

---

<a name="development"></a>

## 🔧 Development

This project uses modern development tools to maintain code quality and consistency.

### Development Tools

- **Prettier** - Automatic code formatting
- **ESLint** - Code linting and quality checks
- **Commitlint** - Conventional commit message validation
- **Husky** - Git hooks automation
- **Lint-Staged** - Run linters on staged files
- **Standard-Version** - Automated versioning and changelog generation

### Quick Start for Contributors

```bash
# Install dependencies
npm install

# Format code
npm run format

# Lint code
npm run lint

# Run tests (lint + format check)
npm run test

# Create a release with automatic changelog
npm run release
```

### Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```bash
<type>(<scope>): <subject>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

**Example:**

```bash
git commit -m "feat: add export to Excel functionality"
git commit -m "fix: resolve drag and drop issue on mobile"
```

For detailed development guidelines, see [DEVELOPMENT.md](DEVELOPMENT.md).

---

<a name="contributing"></a>

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started.

### How to Contribute

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

<a name="license"></a>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<a name="support"></a>

## 💬 Support

### Get Help

- 📖 **Documentation:** [Full Documentation](./docs/Gantt-Chart-Documentation.pdf)
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/Sunilsolankiji/javascriptgantt/issues)
- 💡 **Feature Requests:** [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Sunilsolankiji/javascriptgantt/discussions)

### Reporting Issues

Found a bug? Please report it using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md).

**Include:**

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Code samples or screenshots

---

## 🌟 Show Your Support

If you find this project useful, please consider:

- ⭐ **Star this repository**
- 🐛 **Report bugs** to help improve it
- 💡 **Suggest features** you'd like to see
- 🤝 **Contribute** to the codebase
- 📢 **Share** with others who might find it useful

---

Made with ❤️ by [Sunil Solanki](https://github.com/Sunilsolankiji)

**[⬆ Back to Top](#javascriptgantt)**
