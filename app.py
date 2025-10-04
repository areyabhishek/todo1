from flask import Flask, render_template, request, jsonify
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)

# Database setup
DATABASE = 'todos.db'

def init_db():
    """Initialize the database with todos table"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            deadline TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.before_request
def before_first_request():
    """Initialize database before first request"""
    if not os.path.exists(DATABASE):
        init_db()

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/todos', methods=['GET'])
def get_todos():
    """Get all todos"""
    conn = get_db_connection()
    todos = conn.execute('SELECT * FROM todos ORDER BY created_at DESC').fetchall()
    conn.close()

    todos_list = []
    for todo in todos:
        todos_list.append({
            'id': todo['id'],
            'task': todo['task'],
            'completed': bool(todo['completed']),
            'deadline': todo['deadline'],
            'created_at': todo['created_at']
        })

    return jsonify(todos_list)

@app.route('/api/todos', methods=['POST'])
def add_todo():
    """Add a new todo"""
    data = request.get_json()
    task = data.get('task', '').strip()
    deadline = data.get('deadline')

    if not task:
        return jsonify({'error': 'Task cannot be empty'}), 400

    conn = get_db_connection()
    cursor = conn.execute('INSERT INTO todos (task, deadline) VALUES (?, ?)', (task, deadline))
    todo_id = cursor.lastrowid
    conn.commit()

    # Get the newly created todo
    new_todo = conn.execute('SELECT * FROM todos WHERE id = ?', (todo_id,)).fetchone()
    conn.close()

    return jsonify({
        'id': new_todo['id'],
        'task': new_todo['task'],
        'completed': bool(new_todo['completed']),
        'deadline': new_todo['deadline'],
        'created_at': new_todo['created_at']
    }), 201

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """Update a todo (toggle completion or update task)"""
    data = request.get_json()

    conn = get_db_connection()

    if 'completed' in data:
        # Toggle completion status
        conn.execute('UPDATE todos SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    (data['completed'], todo_id))
    elif 'task' in data:
        # Update task text
        task = data['task'].strip()
        if not task:
            conn.close()
            return jsonify({'error': 'Task cannot be empty'}), 400
        conn.execute('UPDATE todos SET task = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    (task, todo_id))
    elif 'deadline' in data:
        # Update deadline
        conn.execute('UPDATE todos SET deadline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    (data['deadline'], todo_id))

    conn.commit()

    # Get updated todo
    updated_todo = conn.execute('SELECT * FROM todos WHERE id = ?', (todo_id,)).fetchone()
    conn.close()

    if updated_todo is None:
        return jsonify({'error': 'Todo not found'}), 404

    return jsonify({
        'id': updated_todo['id'],
        'task': updated_todo['task'],
        'completed': bool(updated_todo['completed']),
        'deadline': updated_todo['deadline'],
        'created_at': updated_todo['created_at']
    })

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """Delete a todo"""
    conn = get_db_connection()
    conn.execute('DELETE FROM todos WHERE id = ?', (todo_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Todo deleted successfully'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
