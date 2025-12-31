/**
 * Demo Application for javascriptgantt
 * This file contains the initialization and configuration for the demo page
 */

import javascriptgantt from '../src/gantt.js';

// ============= Data Generation =============

function generateGanttData() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

    function getRandomDay() {
        return Math.floor(Math.random() * 28) + 1; // Ensure the day is within a valid range
    }

    function formatDate(day) {
        return `${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}-${currentYear}`;
    }

    let data = [];
    let idCounter = 1;

    for (let project = 1; project <= 5; project++) {
        const projectId = idCounter++;
        data.push({ id: projectId, text: `Project ${project}`, parent: 0, progress: Math.floor(Math.random() * 100) });

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

// ============= Initialize Gantt =============

const data = generateGanttData();
const element = document.getElementById("js-gantt");
const ganttInstance = new javascriptgantt(element);

// Make available globally for inline event handlers
window.javascriptgantt = ganttInstance;

// ============= Editors Configuration =============

const textEditor = { type: "text", map_to: "text" };
const dateEditor = {
    type: "date", map_to: "start_date", min: new Date(2018, 0, 1),
    max: new Date(2019, 0, 1)
};
const numberEditor = { type: "number", map_to: "progress", min: 0, max: 100 };
const selectEditor = { type: "select", map_to: "priority", options: ["Low", "Medium", "High"] };

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
        editor: textEditor
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
        start_date: '06-20-2024',
        css: "party",
        text: "🎂 🎉",
        title: "Ek aur Sal Barbad!"
    }
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
            const { startDate: a, endDate: n, weekNum: i } = weekStartAndEnd(t);
            return ` ${ganttInstance.formatDateToString(
                "%j %M",
                a
            )} - ${ganttInstance.formatDateToString(
                "%j %M",
                n
            )}, ${a.getFullYear()}`;
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
                        const {
                            startDate: a,
                            endDate: n,
                            weekNum: i,
                        } = weekStartAndEnd(t);
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
ganttInstance.options.endDate = new Date(currentDate.setDate(31));

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

ganttInstance.templates.taskbar_text = function (start, end, task) {
    if (task.parent == 0 && task.type !== "milestone") {
        return `Project : ${task.text}`;
    } else if (task.type === "milestone") {
        return task.text;
    } else {
        return `Task : ${task.text}`;
    }
};

ganttInstance.templates.grid_folder = (task) => {
    return `<div></div>`;
};

ganttInstance.templates.grid_file = (task) => {
    if (task.parent != 0) {
        var tracker_name = task.hasOwnProperty("tracker")
            ? task.tracker.name
            : " ";
        let issue_id = task.id;
        return `<div class='gantt_file ${tracker_name}'><a  class="link-issue ${tracker_name}" href='http://127.0.0.1:5500//issues/${issue_id}'>#${issue_id}</a></div>`;
    }
};

ganttInstance.templates.task_drag = (mode, task) => {
    if (task.parent == 0 || (task.children && task.children.length > 0)) {
        return false;
    }
    return true;
};

ganttInstance.templates.task_class = (start, end, task) => {
    if (task.parent == 0) {
        return "parent-task test";
    } else {
        return "child-task test";
    }
};

ganttInstance.templates.scale_cell_class = (date, scale, scaleIndex) => {
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

const jsGanttTheme = localStorage.getItem('javascriptgantt-theme');
let cssStyle;

function changeTheme(isDark) {
    const root = document.querySelector(":root");
    if (isDark) {
        document.getElementById('toggle').checked = true;
        cssStyle = document.createElement("link");
        cssStyle.setAttribute("rel", "stylesheet");
        cssStyle.setAttribute("href", "src/theme/dark.css");
        document.getElementsByTagName("head")[0].append(cssStyle);
        localStorage.setItem('javascriptgantt-theme', 'dark');

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
        localStorage.setItem('javascriptgantt-theme', 'light');
    }
}

// Apply saved theme
changeTheme(jsGanttTheme === 'dark');

// ============= Event Handlers =============

let fullscreen = false;

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
    let stylesheet = [];
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
        subject: "Workflow - In the Workflow view, JOC reacts slow when handling large workflows or multiple smaller workflows in the same folder.",
        description: "requirements-\r\nwhen in the WORKFLOW view a larger workflow (several hundred jobs) or multiple smaller workflows in the same folder are completely expanded then JOC reacts rather slowly.\r\nThis affects actions like scrolling, opening instruction and order menus and executing items of these menus.",
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
    let isFilter = e.target.value.trim() !== "";
    ganttInstance.filterTask((task) => {
        return task.text.toLowerCase().includes(e.target.value.toLowerCase());
    }, isFilter, true);
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
    ganttInstance.options.columns.splice(ganttInstance.options.columns.length - 1, 1);
    ganttInstance.render();
}

// ============= Event Attachments =============

let idCount = 0;

ganttInstance.attachEvent("onTaskDblClick", (event) => {
    // console.log("onTaskDblClick: ", event);
});

ganttInstance.attachEvent("selectAreaOnDrag", (event) => {
    ganttInstance.addTask({
        id: "Added" + idCount,
        start_date: new Date(event.task.startDate),
        end_date: new Date(event.task.endDate),
        parent: event.task.parent,
        text: "Task Added",
    });
    ganttInstance.render();
    idCount += 1;
});

ganttInstance.attachEvent("onLinkDblClick", (event) => {
    // console.log("onLinkDblClick: ", event);
});

ganttInstance.attachEvent("onBeforeLinkAdd", (event) => {
    // console.log("onBeforeLinkAdd: ", event);
});

ganttInstance.attachEvent("onLinkAdd", (event) => {
    // console.log("onLinkAdd: ", event);
});

ganttInstance.attachEvent("onDeleteLink", (event) => {
    // console.log("onDeleteLink: ", event);
});

ganttInstance.attachEvent("onBeforeTaskDrag", (event) => {
    if (event.task.children.length !== 0) {
        return false;
    } else {
        return true;
    }
});

ganttInstance.attachEvent("onTaskDrag", (event) => {
    // console.log("onTaskDrag: ", event);
});

ganttInstance.attachEvent("onAfterTaskDrag", (event) => {
    console.log("onAfterTaskDrag: ", event);
    console.log("onAfterTaskDrag??: ", ganttInstance.options.data);
});

ganttInstance.attachEvent("onBeforeTaskDrop", (event) => {
    console.log("onBeforeTaskDrop: ", event);
    if (event.parentTask?.id == 12) {
        return false;
    }
});

ganttInstance.attachEvent("onTaskToggle", (event) => {
    // console.log("onTaskToggle: ", event);
});

ganttInstance.attachEvent("onTaskDelete", (event) => {
    console.log("onTaskDelete: ", event);
});

ganttInstance.attachEvent("onAfterTaskUpdate", (event) => {
    // console.log("onAfterTaskUpdate: ", event);
});

ganttInstance.attachEvent("onCellClick", (event) => {
    // console.log("onCellClick: ", event);
});

ganttInstance.attachEvent("onRequestFullScreen", (event) => {
    // console.log("onRequestFullScreen: ", event);
});

ganttInstance.attachEvent("onExitFullScreen", (event) => {
    // console.log("onExitFullScreen: ", event);
});

ganttInstance.attachEvent("onAfterProgressDrag", (event) => {
    // console.log("onAfterProgressDrag: ", event);
});

ganttInstance.attachEvent("onBeforeProgressDrag", (event) => {
    // console.log("onBeforeProgressDrag: ", event);
});

ganttInstance.attachEvent("onAutoScheduling", (event) => {
    // console.log("onAutoScheduling: ", event);
});

ganttInstance.attachEvent("onColorChange", (event) => {
    // console.log("onColorChange: ", event);
});

ganttInstance.attachEvent("onBeforeTaskDblClick", (event) => {
    // console.log("onBeforeTaskDblClick: ", event);
});

ganttInstance.attachEvent("onBeforeSave", (event) => {
    // console.log("onBeforeSave: ", event);
});

ganttInstance.attachEvent("onSave", (event) => {
    // console.log("onSave: ", event);
});

// ============= Tour Configuration =============

function startTour() {
    let options = {
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
        visibleButtons: ['next', 'previous', 'close'],
        disableButtons: [],
        animationDuration: 400,
        onNextClick: (step) => {
            console.log(step, " Next Click");
        },
        onClose: () => {
            console.log("Tour Closed");
        },
        onPreviousClick: (step) => {
            console.log(step, " Previous Click");
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
                    description: "View your Gantt in full screen for an immersive experience",
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
                    description: "Multiple timeline views - hour, day, week, month, quarter, and year.",
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
                    description: "Search Tasks to quickly find and access tasks based on your search criteria. Streamline your workflow by searching for specific tasks with ease.",
                    side: "bottom",
                    align: "end",
                },
            },
            {
                element: "#js-gantt",
                popup: {
                    title: "Gantt Chart",
                    description: "The Gantt Chart view provides a visual representation of project tasks and their timelines, allowing you to efficiently manage project schedules, dependencies, and progress. Easily track and plan tasks, making project management a seamless experience.",
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
    let tour = new ztTour(options);
    tour.start();
}

// ============= Hint Icon Handler =============

function handleClick(e) {
    const tour = new ztTour({});
    tour.showHint({
        element: ".hint-icon",
        innerHTML: `<p>Click on "Start Tour" to start the tour.</p>`
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

