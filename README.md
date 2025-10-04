# Todo List App

A beautiful, modern single-page todo list application built with Flask and SQLite.

## Features

- ✅ Add new todos
- ✅ Mark todos as complete/incomplete
- ✅ Edit existing todos
- ✅ Delete todos
- ✅ Filter todos (All, Pending, Completed)
- ✅ Real-time statistics
- ✅ Responsive design
- ✅ Modern UI with smooth animations
- ✅ Persistent data storage with SQLite

## Installation

1. Make sure you have Python 3.7+ installed
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Start the Flask server:
   ```bash
   python app.py
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

- **Add a todo**: Type your task in the input field and press Enter or click the + button
- **Complete a todo**: Click the circle next to any todo to mark it as complete
- **Edit a todo**: Click the edit button (pencil icon) to modify a task
- **Delete a todo**: Click the delete button (trash icon) to remove a task
- **Filter todos**: Use the filter buttons to view All, Pending, or Completed todos
- **View statistics**: See the total, completed, and pending task counts at the top

## Technical Details

- **Backend**: Flask with SQLite database
- **Frontend**: Vanilla JavaScript with modern CSS
- **Database**: SQLite with automatic table creation
- **API**: RESTful API endpoints for CRUD operations
- **Styling**: Modern gradient design with smooth animations

## File Structure

```
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── templates/
│   └── index.html     # Main HTML template
├── static/
│   ├── style.css      # CSS styling
│   └── script.js      # JavaScript functionality
└── todos.db           # SQLite database (created automatically)
```

## API Endpoints

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/<id>` - Update a todo
- `DELETE /api/todos/<id>` - Delete a todo

Enjoy staying organized! 🎉
