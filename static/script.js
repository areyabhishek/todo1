class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTodos();
    }

    bindEvents() {
        // Form submission (handles Enter key automatically)
        document.getElementById('todoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Deadline select change
        document.getElementById('deadlineSelect').addEventListener('change', (e) => {
            const customDate = document.getElementById('customDate');
            if (e.target.value === 'custom') {
                customDate.style.display = 'block';
                customDate.focus();
            } else {
                customDate.style.display = 'none';
            }
        });
    }

    async loadTodos() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/todos');
            if (response.ok) {
                this.todos = await response.json();
                this.renderTodos();
                this.updateStats();
            } else {
                this.showError('Failed to load todos');
            }
        } catch (error) {
            this.showError('Error loading todos');
            console.error('Error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async addTodo() {
        const input = document.getElementById('todoInput');
        const task = input.value.trim();
        const deadlineSelect = document.getElementById('deadlineSelect');
        const customDate = document.getElementById('customDate');

        if (!task) return;

        let deadline = null;
        const selectedDeadline = deadlineSelect.value;

        if (selectedDeadline === 'custom' && customDate.value) {
            deadline = customDate.value;
        } else if (selectedDeadline) {
            deadline = this.calculateDeadline(selectedDeadline);
        }

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ task, deadline })
            });

            if (response.ok) {
                const newTodo = await response.json();
                this.todos.unshift(newTodo);
                this.renderTodos();
                this.updateStats();
                input.value = '';
                deadlineSelect.value = '';
                customDate.value = '';
                customDate.style.display = 'none';
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to add todo');
            }
        } catch (error) {
            this.showError('Error adding todo');
            console.error('Error:', error);
        }
    }

    calculateDeadline(type) {
        const now = new Date();
        let deadline = new Date();

        switch (type) {
            case 'today':
                deadline.setHours(23, 59, 59, 999);
                break;
            case 'tomorrow':
                deadline.setDate(now.getDate() + 1);
                deadline.setHours(23, 59, 59, 999);
                break;
            case 'week':
                const daysUntilSunday = 7 - now.getDay();
                deadline.setDate(now.getDate() + daysUntilSunday);
                deadline.setHours(23, 59, 59, 999);
                break;
            case 'month':
                deadline.setMonth(now.getMonth() + 1);
                deadline.setDate(0);
                deadline.setHours(23, 59, 59, 999);
                break;
        }

        return deadline.toISOString().split('T')[0];
    }

    async toggleTodo(id, event) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !todo.completed })
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                const index = this.todos.findIndex(t => t.id === id);
                this.todos[index] = updatedTodo;

                // Show confetti when marking as complete
                if (updatedTodo.completed && event) {
                    this.showConfetti(event);
                }

                this.renderTodos();
                this.updateStats();
            } else {
                this.showError('Failed to update todo');
            }
        } catch (error) {
            this.showError('Error updating todo');
            console.error('Error:', error);
        }
    }

    showConfetti(event) {
        const rect = event.target.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x, y },
            colors: ['#667eea', '#764ba2', '#ffd700', '#ff6b6b', '#4ecdc4']
        });
    }

    async deleteTodo(id, event) {
        const todoItem = event.target.closest('.todo-item');

        // Add slide-out animation
        todoItem.style.transition = 'all 0.3s ease';
        todoItem.style.opacity = '0';
        todoItem.style.transform = 'translateX(100%)';

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.todos = this.todos.filter(t => t.id !== id);
                this.renderTodos();
                this.updateStats();
            } else {
                // Restore item if delete failed
                todoItem.style.opacity = '1';
                todoItem.style.transform = 'translateX(0)';
                this.showError('Failed to delete todo');
            }
        } catch (error) {
            // Restore item if delete failed
            todoItem.style.opacity = '1';
            todoItem.style.transform = 'translateX(0)';
            this.showError('Error deleting todo');
            console.error('Error:', error);
        }
    }

    enableInlineEdit(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const todoItem = document.querySelector(`[data-id="${id}"]`);
        const todoText = todoItem.querySelector('.todo-text');

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'todo-edit-input';
        input.value = todo.task;

        const saveEdit = async () => {
            const newTask = input.value.trim();
            if (newTask === '' || newTask === todo.task) {
                this.renderTodos();
                return;
            }

            try {
                const response = await fetch(`/api/todos/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ task: newTask })
                });

                if (response.ok) {
                    const updatedTodo = await response.json();
                    const index = this.todos.findIndex(t => t.id === id);
                    this.todos[index] = updatedTodo;
                    this.renderTodos();
                } else {
                    const error = await response.json();
                    this.showError(error.error || 'Failed to update todo');
                }
            } catch (error) {
                this.showError('Error updating todo');
                console.error('Error:', error);
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                this.renderTodos();
            }
        });

        todoText.replaceWith(input);
        input.focus();
        input.select();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTodos();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No todos found</h3>
                    <p>${this.currentFilter === 'all' ? 'Add your first task above to get started!' : `No ${this.currentFilter} todos yet.`}</p>
                </div>
            `;
            return;
        }

        todoList.innerHTML = filteredTodos.map(todo => {
            const deadlineInfo = todo.deadline ? this.getDeadlineInfo(todo.deadline) : null;
            return `
                <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="todoApp.toggleTodo(${todo.id}, event)">
                        ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="todo-text" onclick="todoApp.enableInlineEdit(${todo.id})">${this.escapeHtml(todo.task)}</div>
                    ${deadlineInfo ? `<span class="todo-deadline ${deadlineInfo.class}">${deadlineInfo.text}</span>` : ''}
                    <div class="todo-actions">
                        <button class="todo-btn delete-btn" onclick="todoApp.deleteTodo(${todo.id}, event)" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('emptyState');
        
        if (show) {
            loading.style.display = 'block';
            emptyState.style.display = 'none';
        } else {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getDeadlineInfo(deadline) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);

        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let text = '';
        let className = '';

        if (diffDays < 0) {
            text = `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`;
            className = 'overdue';
        } else if (diffDays === 0) {
            text = 'Due today';
            className = 'today';
        } else if (diffDays === 1) {
            text = 'Due tomorrow';
            className = 'upcoming';
        } else if (diffDays <= 7) {
            text = `Due in ${diffDays} days`;
            className = 'upcoming';
        } else {
            const options = { month: 'short', day: 'numeric' };
            text = deadlineDate.toLocaleDateString('en-US', options);
            className = '';
        }

        return { text, class: className };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});
