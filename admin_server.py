import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Database path
DB_PATH = "data/conversations.db"


# Error handling
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500, content={"message": f"An error occurred: {str(exc)}"}
    )


def get_connection():
    """Get a connection to the SQLite database"""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=404, detail=f"Database not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Admin API Server"}


@app.get("/admin/database/stats")
async def get_database_stats():
    """Get statistics about the database"""
    conn = get_connection()
    cursor = conn.cursor()

    stats = {}

    # Get task count
    cursor.execute("SELECT COUNT(*) as count FROM tasks")
    stats["task_count"] = cursor.fetchone()["count"]

    # Get step count
    cursor.execute("SELECT COUNT(*) as count FROM steps")
    stats["step_count"] = cursor.fetchone()["count"]

    # Get database size
    stats["database_size_mb"] = os.path.getsize(DB_PATH) / (1024 * 1024)

    # Get count of tasks by status
    cursor.execute("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
    status_counts = {}
    for row in cursor.fetchall():
        # Clean up error messages for display
        status = row["status"]
        if status and status.startswith("failed:"):
            # Simplify error messages by removing technical details
            status = "failed"
        status_counts[status] = status_counts.get(status, 0) + row["count"]
    stats["status_counts"] = status_counts

    # Get count of steps by type
    cursor.execute("SELECT type, COUNT(*) as count FROM steps GROUP BY type")
    step_type_counts = {}
    for row in cursor.fetchall():
        step_type_counts[row["type"]] = row["count"]
    stats["step_type_counts"] = step_type_counts

    conn.close()
    return stats


@app.get("/admin/database")
async def get_all_tasks():
    """Get all tasks from the database"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
    tasks = []

    for task_row in cursor.fetchall():
        task_id = task_row["id"]

        # Get steps for this task
        cursor.execute(
            "SELECT COUNT(*) as count FROM steps WHERE task_id = ?", (task_id,)
        )
        step_count = cursor.fetchone()["count"]

        # Clean up status for display
        status = task_row["status"]
        if status and status.startswith("failed:"):
            # Simplify error messages by removing technical details
            status = "failed"

        # Format task data
        tasks.append(
            {
                "id": task_id,
                "project_name": task_row["project_name"] or "No Project",
                "created_at": task_row["created_at"],
                "status": status,
                "prompt_preview": (
                    task_row["prompt"][:100] + "..."
                    if len(task_row["prompt"]) > 100
                    else task_row["prompt"]
                ),
                "step_count": step_count,
            }
        )

    conn.close()
    return {"tasks": tasks}


@app.get("/admin/database/task/{task_id}")
async def get_task(task_id: str):
    """Get a specific task from the database"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    task_row = cursor.fetchone()

    if not task_row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    # Get steps for this task
    cursor.execute(
        "SELECT * FROM steps WHERE task_id = ? ORDER BY step_number", (task_id,)
    )
    steps = []
    for step_row in cursor.fetchall():
        steps.append(
            {
                "number": step_row["step_number"],
                "result": step_row["result"],
                "type": step_row["type"],
            }
        )

    # Clean up status for display
    status = task_row["status"]
    if status and status.startswith("failed:"):
        # Simplify error messages by removing technical details
        status = "failed"

    # Format task data
    task = {
        "id": task_row["id"],
        "project_name": task_row["project_name"] or "No Project",
        "created_at": task_row["created_at"],
        "status": status,
        "prompt": task_row["prompt"],
        "steps": steps,
    }

    conn.close()
    return task


@app.delete("/admin/database/task/{task_id}")
async def delete_task(task_id: str):
    """Delete a task from the database"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM tasks WHERE id = ?", (task_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    # Delete steps first
    cursor.execute("DELETE FROM steps WHERE task_id = ?", (task_id,))

    # Delete task
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))

    conn.commit()
    conn.close()

    return {"status": "success", "message": f"Task {task_id} deleted successfully"}


@app.delete("/admin/database/clear")
async def clear_database(confirm: bool = False):
    """Clear all tasks from the database"""
    if not confirm:
        return {
            "status": "warning",
            "message": "This will delete ALL tasks from the database. Set confirm=true to proceed.",
        }

    conn = get_connection()
    cursor = conn.cursor()

    # Count tasks before deletion
    cursor.execute("SELECT COUNT(*) as count FROM tasks")
    task_count = cursor.fetchone()["count"]

    # Delete all steps
    cursor.execute("DELETE FROM steps")

    # Delete all tasks
    cursor.execute("DELETE FROM tasks")

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": f"Database cleared successfully. {task_count} tasks were deleted.",
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
