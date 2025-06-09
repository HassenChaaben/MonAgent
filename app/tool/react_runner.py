import os
import platform
import signal
import subprocess
import threading
import time
from typing import Dict, Optional

import psutil

from app.config import get_project_folder
from app.logger import logger
from app.tool.base import BaseTool, ToolFailure, ToolResult
from app.tool.browser_opener import open_browser_url

# Check if we're on Windows
IS_WINDOWS = platform.system() == "Windows"


class ReactRunner(BaseTool):
    """Tool for running React projects."""

    name: str = "react_runner"
    description: str = (
        "Run React projects on a specific port to avoid conflicts with the IDE"
    )
    parameters: dict = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "description": "The action to perform (start, stop, status)",
                "enum": ["start", "stop", "status"],
            },
            "project_name": {
                "type": "string",
                "description": "Project name for the React application",
            },
            "port": {
                "type": "integer",
                "description": "Port to run the React application on (default: 3001)",
            },
            "custom_command": {
                "type": "string",
                "description": "Custom command to run instead of 'npm start' (optional)",
            },
            "auto_stop_seconds": {
                "type": "integer",
                "description": "Automatically stop the React app after this many seconds (default: 0, which means no auto-stop)",
            },
        },
        "required": ["action", "project_name"],
    }

    # Store running processes
    _running_processes: Dict[str, subprocess.Popen] = {}
    _process_ports: Dict[str, int] = {}
    _auto_stop_timers: Dict[str, threading.Timer] = {}

    async def execute(
        self,
        action: str,
        project_name: str,
        port: Optional[int] = 3001,
        custom_command: Optional[str] = None,
        auto_stop_seconds: Optional[int] = 0,
    ) -> ToolResult:
        """Execute React runner commands."""
        try:
            if action == "start":
                return await self._start_react_project(
                    project_name, port, custom_command, auto_stop_seconds
                )
            elif action == "stop":
                return await self._stop_react_project(project_name)
            elif action == "status":
                return await self._get_react_project_status(project_name)
            else:
                return ToolFailure(error=f"Unknown action: {action}")
        except Exception as e:
            logger.error(f"Failed to execute React runner: {str(e)}")
            return ToolFailure(error=f"Failed to execute React runner: {str(e)}")

    async def _start_react_project(
        self,
        project_name: str,
        port: int = 3001,
        custom_command: Optional[str] = None,
        auto_stop_seconds: int = 0,
    ) -> ToolResult:
        """Start a React project on the specified port."""
        try:
            logger.info(f"Starting React project '{project_name}' on port {port}")

            # Check if project is already running
            if project_name in self._running_processes:
                process = self._running_processes[project_name]
                if process.poll() is None:  # Process is still running
                    current_port = self._process_ports.get(project_name, port)
                    logger.info(
                        f"React project '{project_name}' is already running on port {current_port}"
                    )
                    return ToolResult(
                        output=f"React project '{project_name}' is already running on port {current_port}.\n"
                        f"You can view it at http://localhost:{current_port}/\n"
                        f"To stop it, use the 'stop' action."
                    )
                else:
                    # Process has terminated, clean up
                    logger.info(
                        f"Cleaning up terminated process for project '{project_name}'"
                    )
                    del self._running_processes[project_name]
                    if project_name in self._process_ports:
                        del self._process_ports[project_name]

            # Get project directory
            project_dir = get_project_folder(project_name)
            project_dir_str = str(project_dir)

            # Check if the project directory exists
            if not os.path.exists(project_dir_str):
                return ToolFailure(
                    error=f"Project directory '{project_dir_str}' does not exist."
                )

            # Check if package.json exists
            package_json_path = os.path.join(project_dir_str, "package.json")
            if not os.path.exists(package_json_path):
                return ToolFailure(
                    error=f"No package.json found in '{project_dir_str}'. "
                    f"This doesn't appear to be a valid React project."
                )

            # Kill any process that might be using the port
            logger.info(
                f"Checking for processes using port {port} before starting React app"
            )
            self._kill_process_on_port(port)

            # Double-check that the port is actually free now
            port_free_attempts = 0
            max_attempts = 3

            while self._is_port_in_use(port) and port_free_attempts < max_attempts:
                port_free_attempts += 1
                logger.warning(
                    f"Port {port} is still in use after attempt {port_free_attempts} to kill processes"
                )

                # Try more aggressive killing
                if port_free_attempts == max_attempts - 1:
                    logger.warning(f"Using more aggressive methods to free port {port}")

                    if IS_WINDOWS:
                        # On Windows, try using the system netstat and taskkill commands
                        try:
                            # Find any process using the port with netstat
                            subprocess.run(
                                f"for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :{port}') do taskkill /F /PID %a",
                                shell=True,
                                check=False,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                            )
                            time.sleep(2)  # Give it time to take effect
                        except Exception as e:
                            logger.error(f"Error using netstat/taskkill: {str(e)}")
                    else:
                        # On Unix, try using lsof and kill -9
                        try:
                            subprocess.run(
                                f"lsof -ti:{port} | xargs kill -9",
                                shell=True,
                                check=False,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                            )
                            time.sleep(2)  # Give it time to take effect
                        except Exception as e:
                            logger.error(f"Error using lsof/kill: {str(e)}")
                else:
                    # Regular kill attempt
                    self._kill_process_on_port(port)
                    time.sleep(2)  # Give it more time to take effect

            # Final check
            if self._is_port_in_use(port):
                logger.error(
                    f"Failed to free port {port} after {max_attempts} attempts"
                )

                # Try an alternative port
                alternative_port = port + 1
                while (
                    self._is_port_in_use(alternative_port)
                    and alternative_port < port + 10
                ):
                    alternative_port += 1

                if not self._is_port_in_use(alternative_port):
                    logger.info(f"Suggesting alternative port: {alternative_port}")
                    return ToolFailure(
                        error=f"Port {port} is still in use by another process and could not be freed. "
                        f"Please try using port {alternative_port} instead."
                    )
                else:
                    return ToolFailure(
                        error=f"Port {port} is still in use by another process and could not be freed. "
                        f"Please try stopping any running React applications or restart your computer."
                    )

            # Set environment variables for the React app
            env = os.environ.copy()
            env["PORT"] = str(port)
            env["HOST"] = "0.0.0.0"  # Bind to all network interfaces
            env["BROWSER"] = "none"  # Prevent browser from opening automatically

            # For Create React App specifically
            env["WDS_SOCKET_HOST"] = "localhost"  # WebSocket host for hot reloading
            env["WDS_SOCKET_PORT"] = str(port)  # WebSocket port for hot reloading

            # Prepare the command
            if custom_command:
                cmd = custom_command
            else:
                cmd = "npm start"

            # Check if node_modules directory exists
            node_modules_path = os.path.join(project_dir_str, "node_modules")
            if not os.path.exists(node_modules_path):
                logger.warning(f"No node_modules directory found in {project_dir_str}")
                # Try to run npm install first
                logger.info(f"Running npm install in {project_dir_str}")
                try:
                    install_process = subprocess.run(
                        "npm install",
                        cwd=project_dir_str,
                        shell=True,
                        capture_output=True,
                        text=True,
                        timeout=120,  # 2 minute timeout
                    )
                    if install_process.returncode != 0:
                        logger.error(f"npm install failed: {install_process.stderr}")
                        return ToolFailure(
                            error=f"Failed to install dependencies for React project '{project_name}'.\n"
                            f"Error: {install_process.stderr}\n"
                            f"You may need to run 'npm install' manually."
                        )
                    logger.info("npm install completed successfully")
                except subprocess.TimeoutExpired:
                    logger.error("npm install timed out after 2 minutes")
                    return ToolFailure(
                        error=f"Dependency installation timed out for React project '{project_name}'.\n"
                        f"You may need to run 'npm install' manually."
                    )
                except Exception as e:
                    logger.error(f"Error running npm install: {str(e)}")
                    # Continue anyway, as the start command might still work

            logger.info(
                f"Starting React app with command: {cmd} in directory: {project_dir_str}"
            )

            # Use a simpler approach to start the React app
            # First, create a batch file to start the React app
            batch_file_path = os.path.join(project_dir_str, "start_react_app.bat")

            # Create the batch file content - we'll set BROWSER to open automatically
            batch_content = f"""@echo off
cd "{project_dir_str}"
set PORT={port}
set HOST=0.0.0.0
set BROWSER=chrome
set REACT_APP_BROWSER=chrome
set WDS_SOCKET_HOST=localhost
set WDS_SOCKET_PORT={port}

:: Start the React app - this will open the browser automatically
npm start
"""

            # Write the batch file
            try:
                with open(batch_file_path, "w") as f:
                    f.write(batch_content)
                logger.info(f"Created batch file at {batch_file_path}")
            except Exception as e:
                logger.error(f"Failed to create batch file: {str(e)}")
                return ToolFailure(error=f"Failed to create batch file: {str(e)}")

            # Start the React app using the batch file
            try:
                if IS_WINDOWS:
                    # On Windows, start the batch file in a new window with visible console
                    # This ensures the browser opens correctly
                    logger.info(
                        f"Starting React app with batch file: {batch_file_path}"
                    )

                    # Use a direct command that will show the console window
                    start_cmd = (
                        f'start "React App - {project_name}" cmd /k "{batch_file_path}"'
                    )
                    logger.info(f"Command: {start_cmd}")

                    process = subprocess.Popen(
                        start_cmd,
                        shell=True,
                        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                    )
                else:
                    # On Unix, use process group with BROWSER set to open automatically
                    process = subprocess.Popen(
                        f"bash -c 'cd {project_dir_str} && PORT={port} HOST=0.0.0.0 BROWSER=google-chrome WDS_SOCKET_HOST=localhost WDS_SOCKET_PORT={port} npm start'",
                        shell=True,
                        preexec_fn=os.setpgrp,
                    )

                logger.info(f"React app process started for project {project_name}")

                # Store a dummy process and port
                self._running_processes[project_name] = process
                self._process_ports[project_name] = port

                # Wait a short time to see if the process starts
                time.sleep(3)

                # Check if the port is in use
                port_check_attempts = 0
                max_port_check_attempts = 5

                while port_check_attempts < max_port_check_attempts:
                    if self._is_port_in_use(port):
                        logger.info(f"React app is now running on port {port}")
                        break

                    logger.info(
                        f"Waiting for React app to start on port {port}... (attempt {port_check_attempts + 1}/{max_port_check_attempts})"
                    )
                    port_check_attempts += 1
                    time.sleep(2)

                # Start a thread to open the browser after a delay
                # This ensures the React app has time to start
                url = f"http://localhost:{port}/"
                logger.info(f"Starting thread to open browser at {url}")
                browser_thread = threading.Thread(
                    target=open_browser_url,
                    args=(url, 10),  # 10 second delay to ensure app is started
                )
                browser_thread.daemon = True
                browser_thread.start()

                # Set up auto-stop timer if requested
                auto_stop_message = ""
                if auto_stop_seconds > 0:
                    logger.info(
                        f"Setting up auto-stop timer for {auto_stop_seconds} seconds"
                    )

                    # Cancel any existing timer for this project
                    if project_name in self._auto_stop_timers:
                        old_timer = self._auto_stop_timers[project_name]
                        old_timer.cancel()

                    # Create a new timer to stop the project after the specified time
                    def auto_stop_project():
                        logger.info(
                            f"Auto-stop timer triggered for project '{project_name}' after {auto_stop_seconds} seconds"
                        )
                        # Use asyncio.run to call the async stop method from this sync context
                        import asyncio

                        asyncio.run(self._stop_react_project(project_name))

                        # Also kill any process on port 3001 directly
                        self._kill_process_on_port(port)

                        # Remove the timer from the dictionary
                        if project_name in self._auto_stop_timers:
                            del self._auto_stop_timers[project_name]

                    # Create and start the timer
                    timer = threading.Timer(auto_stop_seconds, auto_stop_project)
                    timer.daemon = True
                    timer.start()

                    # Store the timer
                    self._auto_stop_timers[project_name] = timer

                    # Add message about auto-stop
                    auto_stop_message = f"\nThe application will automatically stop after {auto_stop_seconds} seconds."

                # Even if the port is not in use yet, return success
                # The app might still be starting up
                return ToolResult(
                    output=f"React project '{project_name}' started successfully on port {port}.\n"
                    f"You can view it at {url}\n"
                    f"The application is running in the background and will open in your browser shortly.{auto_stop_message}\n"
                    f"To stop it manually, use the 'stop' action."
                )

            except Exception as e:
                logger.error(f"Failed to start React app process: {str(e)}")
                return ToolFailure(error=f"Failed to start React app process: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to start React project: {str(e)}")
            return ToolFailure(error=f"Failed to start React project: {str(e)}")

    async def _stop_react_project(self, project_name: str) -> ToolResult:
        """Stop a running React project."""
        try:
            logger.info(f"Stopping React project '{project_name}'")

            # Cancel any auto-stop timer for this project
            if project_name in self._auto_stop_timers:
                logger.info(f"Cancelling auto-stop timer for project '{project_name}'")
                timer = self._auto_stop_timers[project_name]
                timer.cancel()
                del self._auto_stop_timers[project_name]

            # Get the port before cleaning up
            port = self._process_ports.get(project_name, None)

            if port is None:
                logger.warning(f"No port found for project '{project_name}'")
                port = 3001  # Default port

            # Kill any processes using the port
            if isinstance(port, int):
                logger.info(f"Killing any processes using port {port}")
                self._kill_process_on_port(port)

            # Kill any node processes that might be running the React app
            if IS_WINDOWS:
                try:
                    # On Windows, use taskkill to kill all node processes
                    logger.info("Killing all node processes")
                    subprocess.run(
                        "taskkill /F /IM node.exe",
                        shell=True,
                        check=False,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                    )
                except Exception as e:
                    logger.warning(f"Error killing node processes: {str(e)}")

            # Clean up the process record
            if project_name in self._running_processes:
                process = self._running_processes[project_name]

                # Try to terminate the process if it's still running
                if process and process.poll() is None:
                    try:
                        if IS_WINDOWS:
                            # On Windows, we need to terminate the process tree
                            self._terminate_process_tree(process.pid)
                        else:
                            # On Unix, we can use the process group
                            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                    except Exception as e:
                        logger.warning(f"Error terminating process: {str(e)}")

                # Remove from running processes
                del self._running_processes[project_name]

            # Double-check that the port is actually free now
            if isinstance(port, int) and self._is_port_in_use(port):
                logger.warning(
                    f"Port {port} is still in use after stopping React project"
                )
                # Try to kill any process still using the port with multiple attempts
                for attempt in range(3):
                    logger.info(f"Attempt {attempt+1} to free port {port}")
                    if self._kill_process_on_port(port):
                        logger.info(
                            f"Successfully freed port {port} on attempt {attempt+1}"
                        )
                        break
                    time.sleep(2)  # Wait between attempts

                # Final check
                if self._is_port_in_use(port):
                    logger.error(f"Failed to free port {port} after multiple attempts")
                    # Use more aggressive methods as a last resort
                    if IS_WINDOWS:
                        try:
                            # Force kill any process using the port
                            subprocess.run(
                                f"for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :{port}') do taskkill /F /PID %a",
                                shell=True,
                                check=False,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                            )
                        except Exception as e:
                            logger.error(f"Error using netstat/taskkill: {str(e)}")
                    else:
                        try:
                            # Force kill on Unix
                            subprocess.run(
                                f"lsof -ti:{port} | xargs kill -9",
                                shell=True,
                                check=False,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                            )
                        except Exception as e:
                            logger.error(f"Error using lsof/kill: {str(e)}")

                    # Wait a bit more
                    time.sleep(3)

            return ToolResult(
                output=f"React project '{project_name}' stopped successfully. It was running on port {port}."
            )
        except Exception as e:
            logger.error(f"Failed to stop React project: {str(e)}")
            return ToolFailure(error=f"Failed to stop React project: {str(e)}")

    async def _get_react_project_status(self, project_name: str) -> ToolResult:
        """Get the status of a React project."""
        try:
            # First check if we have a record of the process
            if project_name not in self._running_processes:
                return ToolResult(
                    output=f"React project '{project_name}' is not currently running."
                )

            process = self._running_processes[project_name]
            port = self._process_ports.get(project_name, None)

            # Check if process is still running
            process_running = process.poll() is None

            # Check if port is in use (this is a more reliable indicator)
            port_in_use = False
            if port is not None:
                port_in_use = self._is_port_in_use(port)

            # If the process is running and the port is in use, everything is good
            if process_running and port_in_use:
                return ToolResult(
                    output=f"React project '{project_name}' is running on port {port}.\n"
                    f"You can view it at http://localhost:{port}/"
                )

            # If the process is running but the port is not in use, something is wrong
            if process_running and not port_in_use and port is not None:
                logger.warning(
                    f"Process for {project_name} is running but port {port} is not in use"
                )
                # Try to stop the process since it's not working correctly
                if IS_WINDOWS:
                    self._terminate_process_tree(process.pid)
                else:
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)

                # Clean up
                del self._running_processes[project_name]
                if project_name in self._process_ports:
                    del self._process_ports[project_name]

                return ToolResult(
                    output=f"React project '{project_name}' was running but not responding on port {port}. "
                    f"The process has been terminated. Please try starting it again."
                )

            # If the process is not running, clean up
            if not process_running:
                # Process has terminated, clean up
                del self._running_processes[project_name]
                if project_name in self._process_ports:
                    del self._process_ports[project_name]
                return ToolResult(
                    output=f"React project '{project_name}' is not running. It has terminated."
                )

            # Fallback case
            return ToolResult(
                output=f"React project '{project_name}' status is unclear. "
                f"Process running: {process_running}, Port in use: {port_in_use}, Port: {port}"
            )
        except Exception as e:
            logger.error(f"Failed to get React project status: {str(e)}")
            return ToolFailure(error=f"Failed to get React project status: {str(e)}")

    def _is_port_in_use(self, port: int) -> bool:
        """Check if a port is in use."""
        try:
            import socket

            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(("localhost", port))
                return result == 0  # If result is 0, port is in use
        except Exception as e:
            logger.warning(f"Error checking if port {port} is in use: {str(e)}")
            return False  # Assume port is free if we can't check

    def _kill_process_on_port(self, port: int) -> bool:
        """Kill any process using the specified port. Returns True if successful."""
        try:
            logger.info(f"Attempting to kill any process using port {port}")

            # First check if the port is actually in use
            if not self._is_port_in_use(port):
                logger.info(f"Port {port} is not in use, no need to kill any processes")
                return True

            # Try to find processes using the port through psutil
            connections = psutil.net_connections()
            pids_to_kill = []

            for conn in connections:
                if (
                    hasattr(conn, "laddr")
                    and conn.laddr.port == port
                    and conn.pid is not None
                    and conn.pid > 0
                ):
                    pids_to_kill.append(conn.pid)

            if pids_to_kill:
                logger.info(
                    f"Found {len(pids_to_kill)} processes using port {port}: {pids_to_kill}"
                )
            else:
                logger.info(f"No processes found using port {port} through psutil")

            # Kill each process found through psutil
            for pid in pids_to_kill:
                try:
                    # Check if process exists before attempting to kill it
                    process = psutil.Process(pid)
                    process_name = process.name()
                    logger.info(
                        f"Killing process {pid} ({process_name}) using port {port}"
                    )

                    if IS_WINDOWS:
                        self._terminate_process_tree(pid)
                    else:
                        os.kill(pid, signal.SIGTERM)

                    # Give it time to terminate
                    time.sleep(1)

                    # Check if it's still running and force kill if necessary
                    if psutil.pid_exists(pid):
                        logger.info(f"Process {pid} still running, force killing")
                        if IS_WINDOWS:
                            self._terminate_process_tree(pid, force=True)
                        else:
                            os.kill(pid, signal.SIGKILL)

                    logger.info(f"Successfully killed process {pid}")
                except (psutil.AccessDenied, psutil.NoSuchProcess) as e:
                    logger.warning(f"Could not access or find process {pid}: {str(e)}")
                    pass

            # On Windows, use netstat and taskkill as a backup method
            if IS_WINDOWS:
                try:
                    logger.info(f"Using netstat to find processes on port {port}")
                    # Find process using netstat
                    netstat_output = subprocess.check_output(
                        f"netstat -ano | findstr :{port}", shell=True, text=True
                    )

                    logger.info(f"Netstat output: {netstat_output}")

                    # Extract PIDs from netstat output
                    import re

                    pid_matches = re.findall(r"\s+(\d+)$", netstat_output, re.MULTILINE)

                    if pid_matches:
                        for pid_str in pid_matches:
                            try:
                                pid = int(pid_str)
                                logger.info(f"Killing process {pid} found via netstat")
                                # Use taskkill to forcefully terminate the process and its children
                                subprocess.run(
                                    f"taskkill /F /T /PID {pid}",
                                    shell=True,
                                    check=False,
                                    stdout=subprocess.PIPE,
                                    stderr=subprocess.PIPE,
                                )
                                logger.info(f"Taskkill executed for PID {pid}")
                            except ValueError:
                                logger.warning(f"Invalid PID from netstat: {pid_str}")
                except subprocess.CalledProcessError:
                    logger.info(f"No processes found using port {port} through netstat")
                except Exception as e:
                    logger.warning(f"Error using netstat/taskkill: {str(e)}")

            # Check if the port is now free
            if self._is_port_in_use(port):
                logger.warning(
                    f"Port {port} is still in use after attempting to kill processes"
                )
                return False
            else:
                logger.info(f"Port {port} is now free")
                return True

        except Exception as e:
            logger.warning(f"Failed to kill process on port {port}: {str(e)}")
            return False

    def _terminate_process_tree(self, pid: int, force: bool = False) -> None:
        """Terminate a process and all its children on Windows."""
        if pid <= 0:
            logger.warning(f"Invalid process ID: {pid}")
            return

        try:
            parent = psutil.Process(pid)

            # Get children before terminating parent
            try:
                children = parent.children(recursive=True)
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                children = []
                logger.warning(f"Could not access children of process {pid}")

            # Terminate children first
            for child in children:
                try:
                    child_pid = child.pid
                    if child_pid > 0:  # Ensure valid PID
                        logger.info(f"Terminating child process {child_pid}")
                        if force:
                            child.kill()
                        else:
                            child.terminate()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    logger.warning(f"Could not terminate child process")
                    pass

            # Then terminate the parent
            try:
                logger.info(f"Terminating parent process {pid}")
                if force:
                    parent.kill()
                else:
                    parent.terminate()
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                logger.warning(f"Could not terminate parent process {pid}")
                pass

        except psutil.NoSuchProcess:
            logger.info(f"Process {pid} no longer exists")
            pass
        except Exception as e:
            logger.warning(f"Error terminating process tree for PID {pid}: {str(e)}")
            pass
