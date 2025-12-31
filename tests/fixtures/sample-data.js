// tests/fixtures/sample-data.js
// Sample task data for testing

export const sampleTasks = [
  {
    id: 1,
    name: "Project Setup",
    start_date: "2024-01-01",
    duration: 5,
    progress: 50,
    type: "project",
  },
  {
    id: 2,
    name: "Design",
    start_date: "2024-01-06",
    duration: 10,
    progress: 75,
    parent: 1,
    type: "task",
  },
  {
    id: 3,
    name: "Development",
    start_date: "2024-01-16",
    duration: 20,
    progress: 30,
    parent: 1,
    type: "task",
  },
  {
    id: 4,
    name: "Testing",
    start_date: "2024-02-05",
    duration: 5,
    progress: 0,
    parent: 1,
    type: "milestone",
  },
];

export const invalidTasks = [
  {
    // Missing id
    name: "Task",
    start_date: "2024-01-01",
    duration: 5,
  },
  {
    id: 1,
    // Missing name
    start_date: "2024-01-01",
    duration: 5,
  },
  {
    id: "dup",
    name: "Task 1",
    start_date: "2024-01-01",
    duration: 5,
  },
  {
    id: "dup",
    name: "Task 2",
    start_date: "2024-01-06",
    duration: 5,
  },
];

export const sampleOptions = {
  data: sampleTasks,
  columns: [
    {
      label: "Task Name",
      name: "name",
      width: 200,
      resize: true,
    },
    {
      label: "Progress",
      name: "progress",
      width: 100,
    },
  ],
  row_height: 50,
  sidebarWidth: 400,
  zoomLevel: "day",
  collapse: true,
  fullWeek: true,
  todayMarker: true,
};

export const invalidOptions = [
  {
    data: "not an array",
  },
  {
    data: null,
  },
  {
    data: [],
    row_height: "not a number",
  },
  {
    data: [],
    sidebarWidth: "not a number",
  },
];
