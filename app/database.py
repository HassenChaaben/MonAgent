import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path


class Database:
    def __init__(self, db_path="data/conversations.db"):
        # Ensure the directory exists
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

        self.db_path = db_path
        self.conn = None
        self.init_db()

    def get_connection(self):
        if self.conn is None:
            try:
                self.conn = sqlite3.connect(self.db_path)
                # Enable foreign keys
                self.conn.execute("PRAGMA foreign_keys = ON")
                # Configure for JSON serialization/deserialization
                self.conn.row_factory = sqlite3.Row

                # Performance optimizations
                self.conn.execute(
                    "PRAGMA journal_mode = WAL"
                )  # Write-Ahead Logging for better concurrency
                self.conn.execute(
                    "PRAGMA synchronous = NORMAL"
                )  # Slightly faster with good safety
                self.conn.execute(
                    "PRAGMA cache_size = 10000"
                )  # Larger cache (in pages)
                self.conn.execute(
                    "PRAGMA temp_store = MEMORY"
                )  # Store temp tables in memory
            except sqlite3.Error as e:
                print(f"Database connection error: {e}")
                raise
        return self.conn

    def execute_query(self, query, params=None):
        """Execute a query with error handling"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            conn.commit()
            return cursor
        except sqlite3.Error as e:
            print(f"Database query error: {e}")
            print(f"Query: {query}")
            print(f"Params: {params}")
            conn.rollback()
            raise

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()

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
            timestamp INTEGER,
            FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
        )
        """
        )

        conn.commit()

    def create_task(self, task_id, prompt, created_at, status, project_name=""):
        self.execute_query(
            "INSERT INTO tasks (id, prompt, created_at, status, project_name) VALUES (?, ?, ?, ?, ?)",
            (task_id, prompt, created_at.isoformat(), status, project_name),
        )

    def get_task(self, task_id):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        task_row = cursor.fetchone()

        if not task_row:
            return None

        # Get steps for this task
        cursor.execute(
            "SELECT * FROM steps WHERE task_id = ? ORDER BY step_number", (task_id,)
        )
        steps = []
        for step_row in cursor.fetchall():
            steps.append(
                {
                    "step": step_row["step_number"],
                    "result": step_row["result"],
                    "type": step_row["type"],
                    "timestamp": (
                        step_row["timestamp"]
                        if "timestamp" in step_row.keys()
                        else None
                    ),
                }
            )

        # Convert to Task object format with error handling
        try:
            # Safely parse the created_at field
            created_at_value = task_row["created_at"]
            if isinstance(created_at_value, str):
                created_at_parsed = datetime.fromisoformat(created_at_value)
            else:
                # If it's already a datetime object, use it directly
                created_at_parsed = created_at_value
        except Exception as e:
            print(f"Error parsing created_at for task {task_row['id']}: {str(e)}")
            # Use current time as fallback
            created_at_parsed = datetime.now()

        task = {
            "id": task_row["id"],
            "prompt": task_row["prompt"],
            "created_at": created_at_parsed,
            "status": task_row["status"],
            "project_name": task_row["project_name"],
            "steps": steps,
        }

        return task

    def get_all_tasks(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
        tasks = []

        for task_row in cursor.fetchall():
            task_id = task_row["id"]

            # Get steps for this task
            cursor.execute(
                "SELECT * FROM steps WHERE task_id = ? ORDER BY step_number", (task_id,)
            )
            steps = []
            for step_row in cursor.fetchall():
                steps.append(
                    {
                        "step": step_row["step_number"],
                        "result": step_row["result"],
                        "type": step_row["type"],
                        "timestamp": (
                            step_row["timestamp"]
                            if "timestamp" in step_row.keys()
                            else None
                        ),
                    }
                )

            # Convert to Task object format with error handling
            try:
                # Safely parse the created_at field
                created_at_value = task_row["created_at"]
                if isinstance(created_at_value, str):
                    created_at_parsed = datetime.fromisoformat(created_at_value)
                else:
                    # If it's already a datetime object, use it directly
                    created_at_parsed = created_at_value
            except Exception as e:
                print(f"Error parsing created_at for task {task_id}: {str(e)}")
                # Use current time as fallback
                created_at_parsed = datetime.now()

            task = {
                "id": task_id,
                "prompt": task_row["prompt"],
                "created_at": created_at_parsed,
                "status": task_row["status"],
                "project_name": task_row["project_name"],
                "steps": steps,
            }

            tasks.append(task)

        return tasks

    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None

    def update_task_status(self, task_id, status):
        self.execute_query(
            "UPDATE tasks SET status = ? WHERE id = ?", (status, task_id)
        )

    def add_task_step(self, task_id, step_number, result, step_type, timestamp=None):
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            # Begin transaction
            cursor.execute("BEGIN TRANSACTION")

            # Insert the step
            if timestamp is not None:
                cursor.execute(
                    "INSERT INTO steps (task_id, step_number, result, type, timestamp) VALUES (?, ?, ?, ?, ?)",
                    (task_id, step_number, result, step_type, timestamp),
                )
            else:
                cursor.execute(
                    "INSERT INTO steps (task_id, step_number, result, type) VALUES (?, ?, ?, ?)",
                    (task_id, step_number, result, step_type),
                )

            # Commit transaction
            cursor.execute("COMMIT")

            print(
                f"Successfully added step {step_number} of type {step_type} to task {task_id}"
            )
            return True
        except sqlite3.Error as e:
            # Rollback in case of error
            cursor.execute("ROLLBACK")
            print(f"Error adding step to task {task_id}: {e}")
            raise

    def complete_task(self, task_id):
        self.update_task_status(task_id, "completed")

    def fail_task(self, task_id, error_message):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE tasks SET status = ? WHERE id = ?",
            (f"failed: {error_message}", task_id),
        )

        conn.commit()

    def delete_task(self, task_id):
        """Delete a task and all its steps from the database"""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            print(f"Starting database deletion for task {task_id}")

            # Begin transaction
            cursor.execute("BEGIN TRANSACTION")

            # Check if task exists first
            cursor.execute(
                "SELECT COUNT(*) as count FROM tasks WHERE id = ?", (task_id,)
            )
            task_exists = cursor.fetchone()["count"] > 0

            if not task_exists:
                print(f"Task {task_id} does not exist in database")
                cursor.execute("ROLLBACK")
                return False

            # Count steps before deletion
            cursor.execute(
                "SELECT COUNT(*) as count FROM steps WHERE task_id = ?", (task_id,)
            )
            step_count = cursor.fetchone()["count"]
            print(f"Task {task_id} has {step_count} steps to delete")

            # Delete steps first (should cascade, but let's be explicit)
            cursor.execute("DELETE FROM steps WHERE task_id = ?", (task_id,))
            print(f"Deleted {step_count} steps for task {task_id}")

            # Delete the task
            cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            print(f"Deleted task {task_id} from tasks table")

            # Commit transaction
            cursor.execute("COMMIT")
            print(f"Successfully committed deletion of task {task_id}")

            return True
        except sqlite3.Error as e:
            # Rollback in case of error
            print(f"SQLite error during deletion of task {task_id}: {e}")
            try:
                cursor.execute("ROLLBACK")
                print(f"Rolled back transaction for task {task_id}")
            except:
                print(f"Failed to rollback transaction for task {task_id}")
            raise
        except Exception as e:
            print(f"Unexpected error during deletion of task {task_id}: {e}")
            try:
                cursor.execute("ROLLBACK")
                print(f"Rolled back transaction for task {task_id}")
            except:
                print(f"Failed to rollback transaction for task {task_id}")
            raise

    def clear_all_tasks(self):
        """Delete all tasks and steps from the database"""
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            # Begin transaction
            cursor.execute("BEGIN TRANSACTION")

            # Count tasks before deletion
            cursor.execute("SELECT COUNT(*) as count FROM tasks")
            task_count = cursor.fetchone()["count"]

            # Delete all steps
            cursor.execute("DELETE FROM steps")

            # Delete all tasks
            cursor.execute("DELETE FROM tasks")

            # Commit transaction
            cursor.execute("COMMIT")

            return task_count
        except sqlite3.Error as e:
            # Rollback in case of error
            cursor.execute("ROLLBACK")
            print(f"Error clearing database: {e}")
            raise

    def get_database_stats(self):
        """Get statistics about the database"""
        conn = self.get_connection()
        cursor = conn.cursor()

        stats = {}

        # Get task count
        cursor.execute("SELECT COUNT(*) as count FROM tasks")
        stats["task_count"] = cursor.fetchone()["count"]

        # Get step count
        cursor.execute("SELECT COUNT(*) as count FROM steps")
        stats["step_count"] = cursor.fetchone()["count"]

        # Get count of tasks by status
        cursor.execute("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
        status_counts = {}
        for row in cursor.fetchall():
            status_counts[row["status"]] = row["count"]
        stats["status_counts"] = status_counts

        # Get count of steps by type
        cursor.execute("SELECT type, COUNT(*) as count FROM steps GROUP BY type")
        step_type_counts = {}
        for row in cursor.fetchall():
            step_type_counts[row["type"]] = row["count"]
        stats["step_type_counts"] = step_type_counts

        # Get database file size
        try:
            stats["database_size_bytes"] = os.path.getsize(self.db_path)
            stats["database_size_mb"] = round(
                stats["database_size_bytes"] / (1024 * 1024), 2
            )
        except:
            stats["database_size_bytes"] = "unknown"
            stats["database_size_mb"] = "unknown"

        # Get most recent task
        cursor.execute("SELECT created_at FROM tasks ORDER BY created_at DESC LIMIT 1")
        most_recent = cursor.fetchone()
        stats["most_recent_task"] = most_recent["created_at"] if most_recent else None

        # Get oldest task
        cursor.execute("SELECT created_at FROM tasks ORDER BY created_at ASC LIMIT 1")
        oldest = cursor.fetchone()
        stats["oldest_task"] = oldest["created_at"] if oldest else None

        return stats

    def get_last_step(self, task_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM steps WHERE task_id = ? ORDER BY step_number DESC LIMIT 1",
            (task_id,),
        )
        row = cursor.fetchone()
        if row:
            return {
                "step": row["step_number"],
                "result": row["result"],
                "type": row["type"],
                "timestamp": row["timestamp"] if "timestamp" in row.keys() else None,
            }
        return None
