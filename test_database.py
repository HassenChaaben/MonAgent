import sqlite3
from pathlib import Path

# Database file path
db_path = Path("data/conversations.db")

if not db_path.exists():
    print(f"Database not found at {db_path}. Please run setup_database.py first.")
    exit(1)

# Connect to the database
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row  # This allows accessing columns by name
cursor = conn.cursor()

# Test query to count tasks
cursor.execute("SELECT COUNT(*) as count FROM tasks")
task_count = cursor.fetchone()["count"]
print(f"Database contains {task_count} tasks")

# Test query to count steps
cursor.execute("SELECT COUNT(*) as count FROM steps")
step_count = cursor.fetchone()["count"]
print(f"Database contains {step_count} steps")

# Test query to get the most recent task
if task_count > 0:
    cursor.execute("SELECT id, prompt, created_at FROM tasks ORDER BY created_at DESC LIMIT 1")
    latest_task = cursor.fetchone()
    print(f"Most recent task: {latest_task['id']}")
    print(f"Created at: {latest_task['created_at']}")
    print(f"Prompt: {latest_task['prompt'][:50]}...")

# Close connection
conn.close()

print("Database test completed successfully!")