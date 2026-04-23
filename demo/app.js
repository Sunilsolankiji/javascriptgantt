/**
 * Demo Application for javascriptgantt
 * This file contains the initialization and configuration for the demo page
 */

import javascriptgantt from "../src/gantt.js";
// The demo exercises every built-in locale, so pull in the full bundle.
// Real apps should import only the locales they need, e.g.:
//   import { fr, de } from "javascriptgantt/locales";
import { allLocales } from "../src/locales/index.js";

// jstour is loaded via global script tag in index.html
const { jstour } = window;

// ============= Data Generation =============

function generateGanttData() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

  function getRandomDay() {
    return Math.floor(Math.random() * 28) + 1; // Ensure the day is within a valid range
  }

  function formatDate(day) {
    return `${currentMonth.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}-${currentYear}`;
  }

  const data = [];
  let idCounter = 1;

  for (let project = 1; project <= 500; project++) {
    const projectId = idCounter++;
    data.push({
      id: projectId,
      text: `Project ${project}`,
      parent: 0,
      progress: Math.floor(Math.random() * 100),
    });

    const numTasks = Math.floor(Math.random() * 4) + 2; // 2 to 5 tasks per project
    for (let task = 1; task <= numTasks; task++) {
      const startDay = getRandomDay();
      const endDay = Math.min(startDay + Math.floor(Math.random() * 5) + 1, 28);

      data.push({
        id: idCounter++,
        text: `Task #${idCounter}`,
        start_date: formatDate(startDay),
        end_date: formatDate(endDay),
        parent: projectId,
        progress: Math.floor(Math.random() * 100),
      });
    }
  }

  return data;
}

// ============= Initialize Gantt =============

const data = generateGanttData();
const element = document.getElementById("js-gantt");
const ganttInstance = new javascriptgantt(element);

// Register every built-in locale so the language dropdown can switch freely.
// Only "en" is bundled with javascriptgantt by default — this is the
// tree-shaking opt-in point.
ganttInstance.registerLocales(allLocales);

// ============= Helper Functions =============

function weekStartAndEnd(t) {
  const e = t.getDay();
  let a, n;
  0 === e
    ? ((a = ganttInstance.add(t, -6, "day")), (n = t))
    : ((a = ganttInstance.add(t, -1 * e + 1, "day")),
      (n = ganttInstance.add(t, 7 - e, "day")));
  return {
    startDate: a,
    endDate: n,
    weekNum: ganttInstance.formatDateToString("%W", t),
  };
}

// Make available globally for inline event handlers
window.javascriptgantt = ganttInstance;

// ============= Editors Configuration =============

const textEditor = { type: "text", map_to: "text" };
// TODO: These editors are defined but not currently used in the column configuration
// const dateEditor = {
//     type: "date", map_to: "start_date", min: new Date(2018, 0, 1),
//     max: new Date(2019, 0, 1)
// };
// const numberEditor = { type: "number", map_to: "progress", min: 0, max: 100 };
// const selectEditor = { type: "select", map_to: "priority", options: ["Low", "Medium", "High"] };

// ============= Columns Configuration =============

ganttInstance.options.columns = [
  {
    name: "text",
    width: 245,
    min_width: 80,
    max_width: 300,
    tree: true,
    label: "Task Name",
    resize: true,
    template: (task) => {
      return `<span>${task.text}</span>`;
    },
    editor: textEditor,
  },
  {
    name: "progress",
    width: 245,
    min_width: 80,
    max_width: 300,
    tree: false,
    label: "Progress",
    resize: true,
    align: "center",
    template: (task) => {
      return `<span>${task.progress || 0}</span>`;
    },
  },
];

// ============= Basic Options =============

ganttInstance.options.date_format = "%m-%d-%Y";
ganttInstance.options.localLang = "en";
ganttInstance.options.data = data;
ganttInstance.options.collapse = false;
ganttInstance.options.weekends = ["Sat", "Sun"];
ganttInstance.options.fullWeek = true;
ganttInstance.options.todayMarker = true;
ganttInstance.options.dropArea = true;
ganttInstance.options.customMarker = [
  {
    start_date: "06-20-2024",
    css: "party",
    text: "🎂 🎉",
    title: "Ek aur Sal Barbad!",
  },
];
ganttInstance.options.updateLinkOnDrag = true;
ganttInstance.options.splitTask = false;
ganttInstance.options.sort = true;

// ============= Mouse Scroll Options =============

ganttInstance.options.mouseScroll = true;
ganttInstance.options.ctrlKeyRequiredForMouseScroll = true;

// ============= Links Configuration =============

ganttInstance.options.addLinks = (task) => {
  if (task.parent === 0) {
    return false;
  }
  return true;
};

ganttInstance.options.exportApi = "";
ganttInstance.options.taskColor = true;
ganttInstance.options.taskOpacity = 0.7;
ganttInstance.options.links = [
  // 0 is finish_to_start
  // 1 is start_to_start
  // 2 is finish_to_finish
  // 3 is start_to_finish
  { id: 1, source: 2, target: 23, type: 1 },
  { id: 2, source: 3, target: 6, type: 2 },
  { id: 3, source: 4, target: 23, type: 3 },
  { id: 4, source: 12, target: 15 },
];

// ============= Scale Configuration =============

ganttInstance.options.weekStart = 1;
ganttInstance.options.sidebarWidth = 300;
ganttInstance.options.scales = [
  {
    unit: "week",
    step: 1,
    format: (t) => {
      const { startDate: a, endDate: n } = weekStartAndEnd(t);
      return ` ${ganttInstance.formatDateToString(
        "%j %M",
        a
      )} - ${ganttInstance.formatDateToString("%j %M", n)}, ${a.getFullYear()}`;
    },
  },
  { unit: "day", step: 1, format: "%d %D" },
];

ganttInstance.options.zoomLevel = "day";

// ============= Zoom Configuration =============

ganttInstance.options.zoomConfig = {
  levels: [
    {
      name: "hour",
      scale_height: 27,
      min_col_width: 550,
      scales: [
        { unit: "day", step: 1, format: "%d %M" },
        { unit: "hour", step: 1, format: "%H" },
      ],
    },
    {
      name: "day",
      scale_height: 27,
      min_col_width: 80,
      scales: [
        { unit: "week", step: 1, format: "%W" },
        { unit: "day", step: 1, format: "%d %M" },
      ],
    },
    {
      name: "week",
      scale_height: 45,
      min_col_width: 50,
      scales: [
        { unit: "month", step: 1, format: "%M" },
        {
          unit: "week",
          step: 1,
          format: (t) => {
            const { startDate: a, endDate: n } = weekStartAndEnd(t);
            return ` ${ganttInstance.formatDateToString(
              "%j %M",
              a
            )} - ${ganttInstance.formatDateToString(
              "%j %M",
              n
            )}, ${a.getFullYear()}`;
          },
        },
      ],
    },
    {
      name: "month",
      scale_height: 30,
      min_col_width: 120,
      scales: [
        { unit: "year", step: 1, format: "%Y" },
        { unit: "month", step: 1, format: "%M" },
      ],
    },
    {
      name: "quarter",
      scale_height: 25,
      min_col_width: 90,
      scales: [
        { unit: "year", step: 1, format: "%Y" },
        { unit: "quarter", step: 1, format: "Q%q" },
        { unit: "month", format: "%M" },
      ],
    },
    {
      name: "year",
      scale_height: 30,
      min_col_width: 30,
      scales: [
        { unit: "year", step: 3, format: "2022 - 2024" },
        { unit: "year", step: 1, format: "%Y" },
      ],
    },
  ],
};

// ============= Display Options =============

ganttInstance.options.scale_height = 30;
ganttInstance.options.row_height = 24;
ganttInstance.options.minColWidth = 80;
ganttInstance.options.selectAreaOnDrag = true;
ganttInstance.options.taskProgress = true;

// ============= Date Range =============

const currentDate = new Date();
ganttInstance.options.startDate = new Date(currentDate.setDate(1));
ganttInstance.options.endDate = new Date(currentDate.setDate(331));

// ============= Templates =============

ganttInstance.templates.tooltip_text = function (start, end, task) {
  return `<b>${task.parent === 0 ? "Project" : "Task"}:</b>
        ${task.text}
        <br/><b>Start date:</b>
        ${ganttInstance.formatDateToString("%d-%m-%y %H:%i", start)}
        <br/><b>End date:</b>
        ${ganttInstance.formatDateToString("%d-%m-%y %H:%i", end)}<br/>
        <b>Duration:</b> ${task.duration} ${task.duration > 1 ? "Days" : "Day"}`;
};

ganttInstance.templates.taskbar_text = function (_start, _end, task) {
  if (task.parent === 0 && task.type !== "milestone") {
    return `Project : ${task.text}`;
  } else if (task.type === "milestone") {
    return task.text;
  } else {
    return `Task : ${task.text}`;
  }
};

ganttInstance.templates.grid_folder = (_task) => {
  return `<div></div>`;
};

ganttInstance.templates.grid_file = (_task) => {
  if (_task.parent !== 0) {
    const tracker_name = Object.prototype.hasOwnProperty.call(_task, "tracker")
      ? _task.tracker.name
      : " ";
    const issue_id = _task.id;
    return `<div class='gantt_file ${tracker_name}'><a  class="link-issue ${tracker_name}" href='http://127.0.0.1:5500//issues/${issue_id}'>#${issue_id}</a></div>`;
  }
  return "";
};

ganttInstance.templates.task_drag = (_mode, task) => {
  if (task.parent === 0 || (task.children && task.children.length > 0)) {
    return false;
  }
  return true;
};

ganttInstance.templates.task_class = (_start, _end, task) => {
  if (task.parent === 0) {
    return "parent-task test";
  } else {
    return "child-task test";
  }
};

ganttInstance.templates.scale_cell_class = (_date, _scale, scaleIndex) => {
  if (scaleIndex === 1) {
    return "my-scale-class-2";
  } else {
    return "my-scale-class-1";
  }
};

// ============= Custom Markers =============

ganttInstance.addMarker({
  start_date: ganttInstance.add(new Date(), 1, "day"),
  css: "tomorrow",
  text: "Tomorrow",
  title: ganttInstance.formatDateToString(
    "%d %F %y",
    ganttInstance.add(new Date(), 1, "day")
  ),
});

// ============= Render Gantt =============

ganttInstance.render(element);

// ============= Theme Management =============

const jsGanttTheme = localStorage.getItem("javascriptgantt-theme");
let cssStyle;

function changeTheme(isDark) {
  const root = document.querySelector(":root");
  if (isDark) {
    document.getElementById("toggle").checked = true;
    cssStyle = document.createElement("link");
    cssStyle.setAttribute("rel", "stylesheet");
    cssStyle.setAttribute("href", "src/theme/dark.css");
    document.getElementsByTagName("head")[0].append(cssStyle);
    localStorage.setItem("javascriptgantt-theme", "dark");

    root.style.setProperty("--bg-color", "#333332");
    root.style.setProperty("--text-color", "#fff");
    root.style.setProperty("--text-secondary-color", "#fff");
    root.style.setProperty("--index-primary-color", "#1395BE");
    root.style.setProperty("--index-primary-hover-color", "#0E7595");
  } else {
    if (cssStyle) {
      cssStyle.remove();
    }
    root.style.setProperty("--bg-color", "#fff");
    root.style.setProperty("--text-color", "#000");
    root.style.setProperty("--text-secondary-color", "#fff");
    root.style.setProperty("--index-primary-color", "#4ca0fff2");
    root.style.setProperty("--index-primary-hover-color", "#3585e0f2");
    localStorage.setItem("javascriptgantt-theme", "light");
  }
}

// Apply saved theme
changeTheme(jsGanttTheme === "dark");

// ============= Event Handlers =============

const fullscreen = false;

function changeScreen() {
  if (fullscreen === false) {
    ganttInstance.requestFullScreen();
  } else {
    ganttInstance.exitFullScreen();
  }
}

function changeZoom(e) {
  ganttInstance.options.zoomLevel = e.target.value;
  if (e.target.value === "month" || e.target.value === "quarter") {
    ganttInstance.options.startDate = "2024-01-01T11:46:17.775Z";
    ganttInstance.options.endDate = "2024-12-31T11:46:17.775Z";
  } else if (e.target.value === "year") {
    ganttInstance.options.startDate = "2022-01-01T11:46:17.775Z";
    ganttInstance.options.endDate = "2024-12-31T11:46:17.775Z";
  } else {
    ganttInstance.options.startDate = "2024-03-01T11:46:17.775Z";
    ganttInstance.options.endDate = "2024-03-30T11:46:17.775Z";
  }
  ganttInstance.zoomInit();
}

function changeLang(e) {
  ganttInstance.setLocalLang(e.target.value);
}

function changeCollapse(e) {
  if (e.target.checked === true) {
    ganttInstance.collapseAll();
  } else {
    ganttInstance.expandAll();
  }
}

function changeToday(e) {
  if (e.target.checked === true) {
    ganttInstance.addTodayFlag();
  } else {
    ganttInstance.removeTodayFlag();
  }
}

function exportChange(e) {
  const stylesheet = [];
  if (e.target.value === "png") {
    ganttInstance.exportToPNG("jsGanttChart", stylesheet);
  } else if (e.target.value === "pdf") {
    ganttInstance.exportToPDF("jsGanttChart", stylesheet);
  } else {
    ganttInstance.exportToExcel("jsGanttChart");
  }
  e.target.value = "";
}

function autoScheduling() {
  ganttInstance.autoScheduling();
}

function addTask() {
  ganttInstance.addTask({
    id: 5354653546,
    tracker_id: 4,
    project_id: 86,
    subject:
      "Workflow - In the Workflow view, JOC reacts slow when handling large workflows or multiple smaller workflows in the same folder.",
    description:
      "requirements-\r\nwhen in the WORKFLOW view a larger workflow (several hundred jobs) or multiple smaller workflows in the same folder are completely expanded then JOC reacts rather slowly.\r\nThis affects actions like scrolling, opening instruction and order menus and executing items of these menus.",
    due_date: "2024-05-17",
    category_id: null,
    status_id: 2,
    assigned_to_id: 308,
    priority_id: 2,
    fixed_version_id: null,
    author_id: 308,
    lock_version: 3,
    created_on: "2024-05-18T05:03:17.000Z",
    updated_on: "2024-05-18T05:03:25.000Z",
    start_date: "2024-05-17",
    done_ratio: 70,
    estimated_hours: 8.5,
    parent: 12,
    parent_id: null,
    root_id: 53546,
    lft: 1,
    rgt: 2,
    is_private: false,
    closed_on: null,
    tag_list: [],
  });
  ganttInstance.render();
}

function searchTask(e) {
  const isFilter = e.target.value.trim() !== "";
  ganttInstance.filterTask(
    (task) => {
      return task.text.toLowerCase().includes(e.target.value.toLowerCase());
    },
    isFilter,
    true
  );
}

function addCol() {
  ganttInstance.options.columns.push({
    name: "progress",
    width: 245,
    min_width: 80,
    max_width: 300,
    tree: false,
    label: "Progress",
    resize: true,
    align: "center",
    template: (task) => {
      return `<span>${task.progress || 0}</span>`;
    },
  });
  ganttInstance.render();
}

function removeCol() {
  ganttInstance.options.columns.splice(
    ganttInstance.options.columns.length - 1,
    1
  );
  ganttInstance.render();
}

// ============= Event Attachments =============

let idCount = 0;

ganttInstance.attachEvent("onTaskDblClick", (event) => {
  // Event handler - task double clicked. Logged once per double-click
  // (was firing twice before the attachEvent dedup fix).
  // eslint-disable-next-line no-console
  console.log("onTaskDblClick", event);
});

ganttInstance.attachEvent("selectAreaOnDrag", (event) => {
  ganttInstance.addTask({
    id: `Added${idCount}`,
    start_date: new Date(event.task.startDate),
    end_date: new Date(event.task.endDate),
    parent: event.task.parent,
    text: "Task Added",
  });
  ganttInstance.render();
  idCount += 1;
});

ganttInstance.attachEvent("onLinkDblClick", (_event) => {
  // Event handler - link double clicked
});

ganttInstance.attachEvent("onBeforeLinkAdd", (_event) => {
  // Event handler - before link add
});

ganttInstance.attachEvent("onLinkAdd", (_event) => {
  // Event handler - link added
});

ganttInstance.attachEvent("onDeleteLink", (_event) => {
  // Event handler - link deleted
});

ganttInstance.attachEvent("onBeforeTaskDrag", (event) => {
  if (event.task.children.length !== 0) {
    return false;
  } else {
    return true;
  }
});

ganttInstance.attachEvent("onTaskDrag", (_event) => {
  // Event handler - task drag in progress
});

ganttInstance.attachEvent("onAfterTaskDrag", (_event) => {
  // Event handler - task drag completed
});

ganttInstance.attachEvent("onBeforeTaskDrop", (event) => {
  // Prevent dropping on task with id 12
  if (event.parentTask?.id === 12) {
    return false;
  }
});

ganttInstance.attachEvent("onTaskToggle", (_event) => {
  // Event handler - task toggle (expand/collapse)
});

ganttInstance.attachEvent("onTaskDelete", (_event) => {
  // Event handler - task deleted
});

ganttInstance.attachEvent("onAfterTaskUpdate", (_event) => {
  // Event handler - task updated
});

ganttInstance.attachEvent("onCellClick", (_event) => {
  // Event handler - cell clicked
});

ganttInstance.attachEvent("onRequestFullScreen", (_event) => {
  // Event handler - full screen requested
});

ganttInstance.attachEvent("onExitFullScreen", (_event) => {
  // Event handler - full screen exited
});

ganttInstance.attachEvent("onAfterProgressDrag", (_event) => {
  // Event handler - progress drag completed
});

ganttInstance.attachEvent("onBeforeProgressDrag", (_event) => {
  // Event handler - before progress drag
});

ganttInstance.attachEvent("onAutoScheduling", (_event) => {
  // Event handler - auto scheduling completed
});

ganttInstance.attachEvent("onColorChange", (_event) => {
  // Event handler - color changed
});

ganttInstance.attachEvent("onBeforeTaskDblClick", (_event) => {
  // Event handler - before task double click
});

ganttInstance.attachEvent("onBeforeSave", (_event) => {
  // Event handler - before save
});

ganttInstance.attachEvent("onSave", (_event) => {
  // Event handler - save completed
});

// ============= Tour Configuration =============

function startTour() {
  const options = {
    overlayOpacity: 0.7,
    stagePadding: 10,
    stageRadius: 5,
    overlayColor: "#000",
    animate: true,
    smoothScroll: true,
    allowBackdropClose: true,
    popupClass: "popupClass",
    keyboardControl: true,
    showProgress: true,
    visibleButtons: ["next", "previous", "close"],
    disableButtons: [],
    animationDuration: 400,
    onNextClick: (_step) => {
      // Tour step navigated forward
    },
    onClose: () => {
      // Tour closed
    },
    onPreviousClick: (_step) => {
      // Tour step navigated backward
    },
    steps: [
      {
        element: ".collapse-container",
        popup: {
          title: "Toggle Collapse",
          description: "Toggle all the Tasks!!",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".today-container",
        popup: {
          title: "Toggle Marker",
          description: "Toggle Today Marker!!",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".export-data",
        popup: {
          title: "Export Chart",
          description: "Get your charts in PDF, PNG, or Excel formats",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".fullscreen",
        popup: {
          title: "Full Screen",
          description:
            "View your Gantt in full screen for an immersive experience",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: ".auto-scheduling",
        popup: {
          title: "Auto Scheduling",
          description: "Tasks are automatically scheduled.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".zoom",
        popup: {
          title: "Zoom Levels",
          description:
            "Multiple timeline views - hour, day, week, month, quarter, and year.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: ".Language",
        popup: {
          title: "Change Language",
          description: "Change language of the gantt chart.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: ".dark-mode",
        popup: {
          title: "Toggle Dark Mode",
          description: "Dark mode for those late-night work sessions.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: ".gantt-search",
        popup: {
          title: "Search Tasks",
          description:
            "Search Tasks to quickly find and access tasks based on your search criteria. Streamline your workflow by searching for specific tasks with ease.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#js-gantt",
        popup: {
          title: "Gantt Chart",
          description:
            "The Gantt Chart view provides a visual representation of project tasks and their timelines, allowing you to efficiently manage project schedules, dependencies, and progress. Easily track and plan tasks, making project management a seamless experience.",
          side: "top",
          align: "start",
        },
      },
      {
        popup: {
          title: "That's everything",
          description: `<div class="finish">
              <p>Looks like you're ready to go 🎉</p>
              <p>Click anywhere to exit the tour.</p>
              <img src="https://media.tenor.com/y2JXkY1pXkwAAAAM/cat-computer.gif">
              </div>`,
          side: "over",
          align: "over",
        },
      },
    ],
  };
  const tour = new jstour(options);
  tour.start();
}

// ============= Hint Icon Handler =============

function handleClick(_e) {
  const tour = new jstour({});
  tour.showHint({
    element: ".hint-icon",
    innerHTML: `<p>Click on "Start Tour" to start the tour.</p>`,
  });
}

document.querySelector(".hint-icon").removeEventListener("click", handleClick);
document.querySelector(".hint-icon").addEventListener("click", handleClick);

// ============= Expose Functions to Window for Inline Handlers =============

window.changeCollapse = changeCollapse;
window.changeToday = changeToday;
window.exportChange = exportChange;
window.changeScreen = changeScreen;
window.autoScheduling = autoScheduling;
window.changeZoom = changeZoom;
window.changeLang = changeLang;
window.changeTheme = changeTheme;
window.searchTask = searchTask;
window.startTour = startTour;
window.addCol = addCol;
window.removeCol = removeCol;
window.addTask = addTask;

// Export for potential module usage
export { ganttInstance, changeTheme, changeZoom, changeLang };
