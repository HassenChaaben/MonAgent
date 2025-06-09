import sqlite3
from pathlib import Path

# Create data directory if it doesn't exist
data_dir = Path("data")
data_dir.mkdir(exist_ok=True)
print(f"Created data directory at: {data_dir.absolute()}")

# Database file path
db_path = data_dir / "conversations.db"
print(f"Setting up database at: {db_path}")

# Connect to the database (creates it if it doesn't exist)
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Enable foreign keys
cursor.execute("PRAGMA foreign_keys = ON")

# Create tasks table
cursor.execute(
    """
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL,
    project_name TEXT DEFAULT ''
)
"""
)

# Create steps table with foreign key to tasks
cursor.execute(
    """
CREATE TABLE IF NOT EXISTS steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    result TEXT NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
)
"""
)

# Set up performance optimizations
cursor.execute(
    "PRAGMA journal_mode = WAL"
)  # Write-Ahead Logging for better concurrency
cursor.execute("PRAGMA synchronous = NORMAL")  # Slightly faster with good safety
cursor.execute("PRAGMA cache_size = 10000")  # Larger cache (in pages)
cursor.execute("PRAGMA temp_store = MEMORY")  # Store temp tables in memory

# Create indexes for faster queries
cursor.execute("CREATE INDEX IF NOT EXISTS idx_steps_task_id ON steps (task_id)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at)")

# Commit changes and close connection
conn.commit()
conn.close()

print("Database setup complete!")
