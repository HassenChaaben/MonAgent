import os
import subprocess
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return its output"""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"Command '{command}' output:")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running '{command}':")
        print(e.stderr)
        return False

def update_gitignore():
    """Update .gitignore with common patterns"""
    gitignore_content = """
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# IDEs
.idea/
.vscode/
*.swp
*.swo

# Logs
logs/
*.log

# Database
*.db
*.db-shm
*.db-wal

# Environment variables
.env
.env.local
.env.*.local

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build files
frontend/build/
dist/
build/

# System files
.DS_Store
Thumbs.db
"""
    with open('.gitignore', 'w') as f:
        f.write(gitignore_content.strip())
    print("Updated .gitignore file")

def main():
    # Get the current directory
    project_dir = Path(__file__).parent
    os.chdir(project_dir)

    print("Starting fresh GitHub deployment process...")

    # 1. Remove existing git repository
    if Path('.git').exists():
        print("Removing existing Git repository...")
        if os.name == 'nt':  # Windows
            run_command("rmdir /s /q .git")
        else:  # Unix/Linux
            run_command("rm -rf .git")

    # 2. Update .gitignore
    update_gitignore()

    # 3. Initialize new repository
    print("Initializing new Git repository...")
    run_command("git init")

    # 4. Get new repository URL
    remote_url = input("Enter your new GitHub repository URL: ").strip()
    while not remote_url:
        print("Repository URL cannot be empty!")
        remote_url = input("Please enter your GitHub repository URL: ").strip()

    # 5. Add new remote
    print("Adding remote repository...")
    run_command(f'git remote add origin {remote_url}')

    # 6. Add all files
    print("Adding project files...")
    run_command("git add .")

    # 5. Commit changes
    commit_message = input("Enter commit message (press Enter for default): ").strip()
    if not commit_message:
        commit_message = "Update project files and structure"

    run_command(f'git commit -m "{commit_message}"')

    # 6. Push to GitHub
    branch_name = "main"  # or 'master' depending on your preference
    run_command(f"git push -u origin {branch_name}")

    print("\nDeployment process completed!")
    print("\nNext steps:")
    print("1. Visit your GitHub repository to verify the changes")
    print("2. Set up any necessary GitHub Actions for CI/CD")
    print("3. Configure repository settings and branch protection rules")

if __name__ == "__main__":
    main()
