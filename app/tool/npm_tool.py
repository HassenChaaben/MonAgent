import os
import platform
import subprocess
from pathlib import Path
from typing import Optional

from app.config import get_project_folder
from app.logger import logger
from app.tool.base import BaseTool, ToolFailure, ToolResult


class NpmTool(BaseTool):
    name: str = "npm_tool"
    description: str = "Execute npm commands for JavaScript/React development"
    parameters: dict = {
        "type": "object",
        "properties": {
            "command": {
                "type": "string",
                "description": "The npm command to execute (install, init, run, etc.)",
            },
            "args": {
                "type": "string",
                "description": "Additional arguments for the npm command (optional)",
            },
            "cwd": {
                "type": "string",
                "description": "Working directory for the command (optional). If not provided, will use project directory.",
            },
            "project_name": {
                "type": "string",
                "description": "Project name for organizing files (optional)",
            },
        },
        "required": ["command"],
    }

    @staticmethod
    def find_npm_path() -> Optional[str]:
        """Find the npm executable path on the system."""
        is_windows = platform.system() == "Windows"
        npm_cmd = "npm.cmd" if is_windows else "npm"

        # First check if npm is in PATH
        try:
            if is_windows:
                result = subprocess.run(
                    "where npm", shell=True, capture_output=True, text=True, check=False
                )
                if result.returncode == 0:
                    npm_path = result.stdout.strip().split("\n")[0]
                    logger.info(f"Found npm in PATH: {npm_path}")
                    return npm_path
            else:
                result = subprocess.run(
                    "which npm", shell=True, capture_output=True, text=True, check=False
                )
                if result.returncode == 0:
                    npm_path = result.stdout.strip()
                    logger.info(f"Found npm in PATH: {npm_path}")
                    return npm_path
        except Exception as e:
            logger.warning(f"Error checking npm in PATH: {str(e)}")

        # Check common installation locations on Windows
        if is_windows:
            potential_npm_paths = [
                Path(r"C:\Program Files\nodejs") / npm_cmd,
                Path(r"C:\Program Files (x86)\nodejs") / npm_cmd,
                Path(os.path.expanduser("~")) / "AppData" / "Roaming" / "npm" / npm_cmd,
                Path(os.path.expanduser("~")) / ".nvm" / "current" / "npm.cmd",
            ]

            for npm_path in potential_npm_paths:
                if npm_path.exists():
                    logger.info(f"Found npm at: {npm_path}")
                    return str(npm_path)

        # Check common installation locations on Unix
        else:
            potential_npm_paths = [
                Path("/usr/local/bin") / npm_cmd,
                Path("/usr/bin") / npm_cmd,
                Path(os.path.expanduser("~")) / ".nvm" / "current" / "bin" / npm_cmd,
                Path(os.path.expanduser("~")) / ".nodejs" / "bin" / npm_cmd,
            ]

            for npm_path in potential_npm_paths:
                if npm_path.exists():
                    logger.info(f"Found npm at: {npm_path}")
                    return str(npm_path)

        return None

    async def execute(
        self,
        command: str,
        args: Optional[str] = None,
        cwd: Optional[str] = None,
        project_name: Optional[str] = None,
    ) -> ToolResult:
        """Execute npm commands for JavaScript and React development."""
        try:
            if project_name:
                # Create project directory if it doesn't exist
                project_dir = get_project_folder(project_name)
                # Convert Path to string for subprocess
                project_dir_str = str(project_dir)
                if not cwd:
                    cwd = project_dir_str

            if not cwd:
                cwd = os.getcwd()

            # Ensure cwd exists
            os.makedirs(cwd, exist_ok=True)

            # Special handling for create-react-app command
            if command == "create-react-app" or (
                command == "npx" and args and "create-react-app" in args
            ):
                # For create-react-app, we need to ensure the app is created within the project directory
                # instead of the root directory

                # Extract the app name from args
                import shlex

                app_name = None

                if command == "create-react-app" and args:
                    # If command is create-react-app, the app name is the first argument
                    app_name = shlex.split(args)[0] if args else None
                elif command == "npx" and args:
                    # If command is npx, parse the args to find the app name after create-react-app
                    arg_parts = shlex.split(args)
                    if "create-react-app" in arg_parts:
                        cra_index = arg_parts.index("create-react-app")
                        if cra_index + 1 < len(arg_parts):
                            app_name = arg_parts[cra_index + 1]

                if app_name:
                    logger.info(
                        f"Creating React app '{app_name}' within project directory '{cwd}'"
                    )

                    # Modify the command to use npx create-react-app directly
                    full_command = ["npx", "create-react-app", app_name]

                    # Add any additional arguments if present
                    if command == "npx" and args:
                        arg_parts = shlex.split(args)
                        cra_index = arg_parts.index("create-react-app")
                        # Skip the app name and add any remaining arguments
                        if cra_index + 2 < len(arg_parts):
                            full_command.extend(arg_parts[cra_index + 2 :])
                else:
                    # If no app name is found, proceed with the original command
                    full_command = ["npm", command]
                    if args:
                        full_command.extend(shlex.split(args))
            else:
                # For other npm commands, proceed normally
                full_command = ["npm", command]
                if args:
                    # Split args by spaces, but respect quotes
                    import shlex

                    full_command.extend(shlex.split(args))

            logger.info(f"Executing npm command: {' '.join(full_command)} in {cwd}")

            # Find npm in the system
            npm_path = self.find_npm_path()

            if npm_path:
                # Add npm directory to PATH for this process
                npm_dir = os.path.dirname(npm_path)
                os.environ["PATH"] = npm_dir + os.pathsep + os.environ["PATH"]
                logger.info(f"Added {npm_dir} to PATH")

                # Check npm version
                try:
                    npm_version = subprocess.run(
                        f'"{npm_path}" --version',
                        shell=True,
                        capture_output=True,
                        text=True,
                        check=False,
                    )
                    if npm_version.returncode == 0:
                        logger.info(f"Using npm version: {npm_version.stdout.strip()}")
                    else:
                        return ToolFailure(
                            error=f"Found npm at {npm_path} but failed to get version: {npm_version.stderr}. "
                            f"Please run the install_nodejs.bat script to install Node.js and npm properly."
                        )
                except Exception as e:
                    return ToolFailure(
                        error=f"Error running npm: {str(e)}. "
                        f"Please run the install_nodejs.bat script to install Node.js and npm properly."
                    )
            else:
                # If we can't find npm, suggest running the install script
                return ToolFailure(
                    error="npm is not installed or not in PATH. "
                    "Please run the install_nodejs.bat script to install Node.js and npm properly."
                )

            # Use the npm path we found
            if npm_path and os.path.exists(npm_path):
                # Replace 'npm' with the full path
                if full_command[0] == "npm":
                    full_command[0] = f'"{npm_path}"'

            # Convert command list to string for shell execution
            cmd_str = " ".join(full_command)
            logger.info(f"Executing shell command: {cmd_str}")

            # Set up environment with the updated PATH
            env = os.environ.copy()

            result = subprocess.run(
                cmd_str,
                cwd=cwd,
                shell=True,
                capture_output=True,
                text=True,
                check=False,
                env=env,
            )

            if result.returncode != 0:
                return ToolFailure(
                    error=f"Error executing npm command: {result.stderr}"
                )

            # Format the output for better readability
            output = result.stdout.strip()

            # For create-react-app, verify that the app was created in the correct location
            if (
                (
                    command == "create-react-app"
                    or (command == "npx" and args and "create-react-app" in args)
                )
                and "app_name" in locals()
                and app_name
            ):
                expected_app_dir = os.path.join(cwd, app_name)
                if os.path.exists(expected_app_dir):
                    logger.info(f"Successfully created React app at {expected_app_dir}")
                    # Add a success message to the output
                    success_msg = f"\n\nReact app '{app_name}' was successfully created in {expected_app_dir}."
                    if output:
                        output = output + success_msg
                    else:
                        output = f"npm command executed successfully.{success_msg}"
                else:
                    logger.warning(
                        f"React app directory {expected_app_dir} was not found after creation"
                    )
                    warning_msg = f"\n\nWARNING: React app directory {expected_app_dir} was not found after creation. The app may have been created in a different location."
                    if output:
                        output = output + warning_msg
                    else:
                        output = f"npm command executed successfully.{warning_msg}"

            if output:
                return ToolResult(
                    output=f"npm command executed successfully:\n\n{output}"
                )
            else:
                return ToolResult(
                    output=f"npm command executed successfully with no output."
                )

        except Exception as e:
            logger.error(f"Failed to execute npm command: {str(e)}")
            return ToolFailure(error=f"Failed to execute npm command: {str(e)}")
