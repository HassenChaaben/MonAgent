import sqlite3
import shutil
import os
from datetime import datetime
from pathlib import Path

# Database file path
db_path = Path("data/conversations.db")

if not db_path.exists():
    print(f"Database not found at {db_path}. Nothing to backup.")
    exit(1)

# Create backups directory if it doesn't exist
backup_dir = Path("data/backups")
backup_dir.mkdir(exist_ok=True, parents=True)

# Generate backup filename with timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_path = backup_dir / f"conversations_{timestamp}.db"

# Connect to the database and create a backup
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Make sure all changes are written to disk
cursor.execute("PRAGMA wal_checkpoint(FULL)")

# Close the connection before copying
conn.close()

# Copy the database file
shutil.copy2(db_path, backup_path)

# Also backup the WAL file if it exists
wal_path = Path(f"{db_path}-wal")
if wal_path.exists():
    shutil.copy2(wal_path, Path(f"{backup_path}-wal"))

# Backup the SHM file if it exists
shm_path = Path(f"{db_path}-shm")
if shm_path.exists():
    shutil.copy2(shm_path, Path(f"{backup_path}-shm"))

print(f"Database backup created at: {backup_path}")

# Clean up old backups (keep only the 5 most recent)
backups = sorted(backup_dir.glob("conversations_*.db"))
if len(backups) > 5:
    for old_backup in backups[:-5]:
        old_backup.unlink()
        print(f"Removed old backup: {old_backup}")
        
        # Remove associated WAL and SHM files if they exist
        for ext in ["-wal", "-shm"]:
            old_ext_file = Path(f"{old_backup}{ext}")
            if old_ext_file.exists():
                old_ext_file.unlink()

print("Backup process completed!")