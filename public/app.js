// app.js - Frontend Logic
// ENGSE207 Software Architecture - Week 3 Lab

// ========================================
// PART 1: STATE MANAGEMENT
// ========================================

let allTasks = [];       
let currentFilter = 'ALL'; 

// ========================================
// PART 2: DOM ELEMENTS
// ========================================

const addTaskForm = document.getElementById('addTaskForm');
const statusFilter = document.getElementById('statusFilter');
const loadingOverlay = document.getElementById('loadingOverlay');

// Task list containers
const todoTasks = document.getElementById('todoTasks');
const progressTasks = document.getElementById('progressTasks');
const doneTasks = document.getElementById('doneTasks');

// Task counters
const todoCount = document.getElementById('todoCount');
const progressCount = document.getElementById('progressCount');
const doneCount = document.getElementById('doneCount');


// ========================================
// PART 3: API FUNCTIONS - FETCH TASKS
// ========================================

async function fetchTasks() {
    showLoading();
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allTasks = data.tasks;  // Update global state
        renderTasks();           // Render tasks to Kanban board
    } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('Failed to load tasks. Please refresh the page.');
    } finally {
        hideLoading();
    }
}


// ========================================
// PART 4: API FUNCTIONS - CREATE TASK
// ========================================

async function createTask(taskData) {
    showLoading();
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            throw new Error('Failed to create task');
        }

        const data = await response.json();
        allTasks.unshift(data.task); // Add new task to beginning of array
        renderTasks();               // Update Kanban board

        // Reset form
        addTaskForm.reset();

        alert('✅ Task created successfully!');
    } catch (error) {
        console.error('Error creating task:', error);
        alert('❌ Failed to create task. Please try again.');
    } finally {
        hideLoading();
    }
}

// ========================================
// PART 5: API FUNCTIONS - UPDATE STATUS
// ========================================

async function updateTaskStatus(taskId, newStatus) {
    showLoading();
    try {
        const response = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update task status');
        }

        // Update task in allTasks array
        const taskIndex = allTasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            allTasks[taskIndex].status = newStatus;
        }

        renderTasks(); // Re-render Kanban board
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('❌ Failed to update task status. Please try again.');
    } finally {
        hideLoading();
    }
}

// ========================================
// PART 6: API FUNCTIONS - DELETE TASK
// ========================================

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        // Remove task from allTasks array
        allTasks = allTasks.filter(task => task.id !== taskId);

        renderTasks(); // Re-render Kanban board

        alert('✅ Task deleted successfully!');
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('❌ Failed to delete task. Please try again.');
    } finally {
        hideLoading();
    }
}


// ========================================
// PART 7: RENDER FUNCTIONS - MAIN RENDER
// ========================================

function renderTasks() {
    // 1. Clear all lists
    todoTasks.innerHTML = '';
    progressTasks.innerHTML = '';
    doneTasks.innerHTML = '';

    // 2. Filter tasks
    let filteredTasks = allTasks;
    if (currentFilter !== 'ALL') {
        filteredTasks = allTasks.filter(task => task.status === currentFilter);
    }

    // 3. Separate by status
    const todo = filteredTasks.filter(t => t.status === 'TODO');
    const progress = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
    const done = filteredTasks.filter(t => t.status === 'DONE');

    // 4. Update counters
    todoCount.textContent = todo.length;
    progressCount.textContent = progress.length;
    doneCount.textContent = done.length;

    // 5. Render each column
    renderTaskList(todo, todoTasks, 'TODO');
    renderTaskList(progress, progressTasks, 'IN_PROGRESS');
    renderTaskList(done, doneTasks, 'DONE');
}


// ========================================
// PART 8: RENDER FUNCTIONS - RENDER LIST
// ========================================

function renderTaskList(tasks, container, currentStatus) {
    // 1. Show empty state if no tasks
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No tasks yet</p></div>';
        return;
    }

    // 2. Loop through tasks and create cards
    tasks.forEach(task => {
        const card = createTaskCard(task, currentStatus);
        // 3. Append cards to container
        container.appendChild(card);
    });
}


// ========================================
// PART 9: RENDER FUNCTIONS - CREATE CARD
// ========================================

function createTaskCard(task, currentStatus) {
    const card = document.createElement('div');
    card.className = 'task-card';

    const priorityClass = `priority-${task.priority.toLowerCase()}`;

    card.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <span class="priority-badge ${priorityClass}">${task.priority}</span>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
            Created: ${formatDate(task.created_at)}
        </div>
        <div class="task-actions">
            ${createStatusButtons(task.id, currentStatus)}
            <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">
                🗑️ Delete
            </button>
        </div>
    `;

    return card;
}


// ========================================
// PART 10: HELPER FUNCTIONS - STATUS BUTTONS
// ========================================

function createStatusButtons(taskId, currentStatus) {
    const buttons = [];

    if (currentStatus !== 'TODO') {
        buttons.push(`
            <button class="btn btn-warning btn-sm" onclick="updateTaskStatus(${taskId}, 'TODO')">
                ← To Do
            </button>
        `);
    }

    if (currentStatus !== 'IN_PROGRESS') {
        buttons.push(`
            <button class="btn btn-info btn-sm" onclick="updateTaskStatus(${taskId}, 'IN_PROGRESS')">
                ${currentStatus === 'TODO' ? '→ In Progress' : '← In Progress'}
            </button>
        `);
    }

    if (currentStatus !== 'DONE') {
        buttons.push(`
            <button class="btn btn-success btn-sm" onclick="updateTaskStatus(${taskId}, 'DONE')">
                ${currentStatus === 'TODO' || currentStatus === 'IN_PROGRESS' ? '→ Done' : '← Done'}
            </button>
        `);
    }

    return buttons.join(' ');
}


// ========================================
// PART 11: UTILITY FUNCTIONS
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text; // แปลง text ให้เป็น content ปลอดภัย
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// ========================================
// PART 12: EVENT LISTENERS
// ========================================

addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    createTask({ title, description, priority });
});

statusFilter.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderTasks();
});


// ========================================
// PART 13: INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Task Board App Initialized');
    console.log('📊 Architecture: Monolithic');
    fetchTasks();
});


// ========================================
// PART 14: GLOBAL FUNCTION EXPOSURE
// ========================================

window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;


// ========================================
// IMPLEMENTATION CHECKLIST
// ========================================

/*
✅ Step-by-step implementation order:

1. Uncomment Part 1 (State) and Part 2 (DOM Elements)
2. Implement Part 11 (Utility Functions) - test with console.log
3. Implement Part 3 (Fetch Tasks) - test in browser console
4. Implement Part 7 (Main Render) and Part 8 (Render List)
5. Implement Part 9 (Create Card) and Part 10 (Status Buttons)
6. Implement Part 4 (Create Task)
7. Implement Part 5 (Update Status)
8. Implement Part 6 (Delete Task)
9. Add Part 12 (Event Listeners)
10. Add Part 13 (Initialization)
11. Add Part 14 (Global Functions)

Testing tips:
- Test each function in browser console before moving to next
- Use console.log() to debug
- Check Network tab in DevTools for API calls
- Check Console tab for errors
*/


// ========================================
// HINTS & COMMON MISTAKES
// ========================================

/*
FETCH API CHEAT SHEET:
- GET: fetch(url)
- POST: fetch(url, { method: 'POST', headers: {...}, body: JSON.stringify(data) })
- PUT: fetch(url, { method: 'PUT', headers: {...}, body: JSON.stringify(data) })
- DELETE: fetch(url, { method: 'DELETE' })
- PATCH: fetch(url, { method: 'PATCH', headers: {...}, body: JSON.stringify(data) })

COMMON MISTAKES:
1. Forgetting to use await with fetch
2. Not checking response.ok before parsing
3. Not handling errors with try-catch
4. Forgetting to add 'Content-Type: application/json' header
5. Not escaping HTML (XSS vulnerability!)
6. Forgetting to update allTasks array after CRUD operations

DEBUGGING TIPS:
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for API calls
4. Use console.log() liberally
5. Test API endpoints with Thunder Client first
6. Use breakpoints for step-by-step debugging
*/