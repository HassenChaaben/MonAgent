import asyncio
import json
import os
import re
import subprocess
import threading
import time
import tomllib
import uuid
import webbrowser
from contextlib import asynccontextmanager
from datetime import datetime
from functools import partial
from json import dumps
from pathlib import Path

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    FileResponse,
    HTMLResponse,
    JSONResponse,
    RedirectResponse,
    StreamingResponse,
)
from fastapi.staticfiles import StaticFiles

# from fastapi.templating import Jinja2Templates # Removed
from pydantic import BaseModel
from starlette.responses import Response

from app.logger import logger


# Define lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code (if any)
    print("Starting application...")
    yield
    # Shutdown code
    print("Shutting down application, closing database connection...")
    task_manager.db.close() if "task_manager" in globals() else None


# Initialize FastAPI with lifespan
app = FastAPI(lifespan=lifespan)

# app.mount("/static", StaticFiles(directory="static"), name="static") # Removed


# Add a route to serve static files from the workspace
@app.get("/workspace/{project_name}/static/{file_path:path}")
async def serve_static_file(project_name: str, file_path: str):
    """Serve static files (CSS, JS, images) from the workspace"""
    return await serve_project_file(project_name, file_path)


# Add a direct route to serve files from the project folder
# This route should be more specific than the project listing route
@app.get("/workspace/{project_name}/raw/{file_path:path}")
async def serve_project_file(project_name: str, file_path: str):
    """Serve static files (CSS, JS, images) from the workspace"""
    base_path = Path(__file__).parent / "workspace" / project_name

    if not base_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_name} not found")

    # Log the file path for debugging
    print(f"Serving raw file: {file_path} in project {project_name}")

    # Handle URL-encoded file paths
    from urllib.parse import unquote

    decoded_file_path = unquote(file_path)
    print(f"Decoded file path for raw file: {decoded_file_path}")

    # Handle the case where file_path might have a directory component
    full_path = base_path / decoded_file_path

    if not full_path.exists() or not full_path.is_file():
        # Try with the original path as a fallback
        original_full_path = base_path / file_path
        if original_full_path.exists() and original_full_path.is_file():
            full_path = original_full_path
            print(f"Using original path: {full_path}")
        else:
            # Try to find the file directly in the project root
            # This handles cases where the HTML file is in a subdirectory but references files in the root
            root_path = base_path / os.path.basename(decoded_file_path)
            if root_path.exists() and root_path.is_file():
                full_path = root_path
                print(f"Using root path: {full_path}")
            else:
                # Log the error for debugging
                print(f"Static file not found: {full_path}")
                print(f"Tried original path: {original_full_path}")
                print(f"Tried root path: {root_path}")
                raise HTTPException(
                    status_code=404,
                    detail=f"File {file_path} not found in project {project_name}",
                )

    # Determine content type based on file extension
    extension = full_path.suffix.lower()
    content_type = "application/octet-stream"  # Default

    if extension == ".css":
        content_type = "text/css"
    elif extension == ".js":
        content_type = "application/javascript"
    elif extension in [".jpg", ".jpeg"]:
        content_type = "image/jpeg"
    elif extension == ".png":
        content_type = "image/png"
    elif extension == ".gif":
        content_type = "image/gif"
    elif extension == ".svg":
        content_type = "image/svg+xml"
    elif extension == ".woff":
        content_type = "font/woff"
    elif extension == ".woff2":
        content_type = "font/woff2"
    elif extension == ".ttf":
        content_type = "font/ttf"
    elif extension == ".eot":
        content_type = "application/vnd.ms-fontobject"
    elif extension == ".otf":
        content_type = "font/otf"

    print(f"Serving static file: {full_path} with content type: {content_type}")

    return FileResponse(
        full_path,
        media_type=content_type,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


# templates = Jinja2Templates(directory="templates") # Removed

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Task(BaseModel):
    id: str
    prompt: str
    created_at: datetime
    status: str
    project_name: str = ""  # New field for project name
    steps: list = []

    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data["created_at"] = self.created_at.isoformat()
        return data


from app.database import Database


class TaskManager:
    def __init__(self):
        self.db = Database()
        self.queues = {}  # Keep event queues in memory for real-time updates

        # Load existing tasks into queues
        tasks = self.db.get_all_tasks()
        for task in tasks:
            self.queues[task["id"]] = asyncio.Queue()

    def create_task(self, prompt: str, project_name: str = "") -> Task:
        task_id = str(uuid.uuid4())
        created_at = datetime.now()

        # Create project workspace folder if project_name is provided
        if project_name and project_name.strip():
            from app.config import get_project_folder

            workspace_path = get_project_folder(project_name)
            print(f"Created/verified project workspace at: {workspace_path}")

        # Create task in database
        self.db.create_task(
            task_id=task_id,
            prompt=prompt,
            created_at=created_at,
            status="pending",
            project_name=project_name,
        )

        # Create queue for real-time updates
        self.queues[task_id] = asyncio.Queue()

        # Return task object
        return Task(
            id=task_id,
            prompt=prompt,
            created_at=created_at,
            status="pending",
            project_name=project_name,
            steps=[],
        )

    def get_task(self, task_id: str) -> Task:
        task_data = self.db.get_task(task_id)
        if not task_data:
            return None
        # Sort steps by timestamp, then by step index
        task_data["steps"].sort(key=lambda s: (s.get("timestamp", 0), s.get("step", 0)))
        return Task(**task_data)

    def get_all_tasks(self) -> list:
        return self.db.get_all_tasks()

    async def update_task_status(self, task_id: str, status: str):
        self.db.update_task_status(task_id, status)

        # Send status update to queue
        if task_id in self.queues:
            task = self.get_task(task_id)
            await self.queues[task_id].put(
                {"type": "status", "status": status, "steps": task.steps}
            )

    async def update_task_step(
        self,
        task_id: str,
        step: int,
        result: str,
        step_type: str = "step",
        metadata: dict = None,
    ):
        # Add step to database
        import time

        # Ensure unique, strictly increasing timestamp
        last_step = self.db.get_last_step(task_id)
        prev_ts = int(time.time() * 1000)
        if last_step and "timestamp" in last_step and last_step["timestamp"]:
            prev_ts = max(prev_ts, int(last_step["timestamp"]) + 1)

        # Store timestamp in metadata if provided
        if metadata and "timestamp" in metadata:
            try:
                # If timestamp is ISO format string, convert to milliseconds
                if isinstance(metadata["timestamp"], str):
                    from datetime import datetime

                    dt = datetime.fromisoformat(metadata["timestamp"])
                    prev_ts = int(dt.timestamp() * 1000)
            except Exception as e:
                print(f"Error converting timestamp in metadata: {str(e)}")

        # Get the current task to determine step number in sequence
        task = self.get_task(task_id)
        step_number = len(task.steps) if task else 0

        # Store in database
        self.db.add_task_step(task_id, step, result, step_type, timestamp=prev_ts)

        # Send updates to queue
        if task_id in self.queues:
            # Create the event with enhanced information
            event = {
                "type": step_type,
                "step": step,
                "step_number": step_number,  # Add sequential step number
                "result": result,
                "timestamp": prev_ts,
                "iso_timestamp": datetime.now().isoformat(),  # Add ISO timestamp for display
            }

            # Add any additional metadata
            if metadata:
                for key, value in metadata.items():
                    if key != "timestamp":  # We already handled timestamp
                        event[key] = value

            # Always add streaming flag for real-time updates
            if "streaming" not in event:
                event["streaming"] = True

            # Add progress information if this is a step-by-step process
            if step_type == "act" and "Step " in result:
                # Try to extract step number from content
                import re

                step_match = re.search(r"Step (\d+)(?:\s+of\s+(\d+))?", result)
                if step_match:
                    current_step = int(step_match.group(1))
                    total_steps = (
                        int(step_match.group(2)) if step_match.group(2) else None
                    )

                    event["current_step"] = current_step
                    if total_steps:
                        event["total_steps"] = total_steps
                        event["progress_percentage"] = round(
                            (current_step / total_steps) * 100
                        )

            # Send the actual step event first
            await self.queues[task_id].put(event)

            # Then send a status update
            task = self.get_task(task_id)
            await self.queues[task_id].put(
                {"type": "status", "status": task.status, "steps": task.steps}
            )

    async def complete_task(self, task_id):
        self.db.complete_task(task_id)

        # Send status update to queue
        if task_id in self.queues:
            task = self.get_task(task_id)
            await self.queues[task_id].put(
                {"type": "status", "status": "completed", "steps": task.steps}
            )

    async def fail_task(self, task_id, error_message):
        self.db.fail_task(task_id, error_message)

        # Send status update to queue
        if task_id in self.queues:
            task = self.get_task(task_id)
            await self.queues[task_id].put(
                {
                    "type": "status",
                    "status": f"failed: {error_message}",
                    "steps": task.steps,
                }
            )


task_manager = TaskManager()


async def get_project_source_code(
    project_name: str, base_workspace_path: Path = None
) -> str:
    if base_workspace_path is None:
        base_workspace_path = Path(__file__).parent / "workspace"

    base_path = base_workspace_path / project_name
    if not base_path.exists():
        return f"Project '{project_name}' not found."

    source_code_string = f"PROJECT_SOURCE_CODE for project '{project_name}':\n\n"
    for root, _, files in os.walk(base_path):
        for file_name in files:
            full_path = Path(root) / file_name
            relative_path = full_path.relative_to(base_path)
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                source_code_string += f"--- File: {relative_path} ---\n"
                source_code_string += content
                source_code_string += f"\n--- End File: {relative_path} ---\n\n"
            except Exception as e:
                source_code_string += (
                    f"--- Could not read file: {relative_path} (Error: {e}) ---\n\n"
                )
    return source_code_string


# Removed the index route
# @app.get("/", response_class=HTMLResponse)
# async def index(request: Request):
#     return templates.TemplateResponse("index.html", {"request": request})


@app.get("/download")
async def download_file(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, filename=os.path.basename(file_path))


@app.get("/workspace/{project_name}/view-html")
async def view_html_file(project_name: str, file_path: str):
    """Serve an HTML file for viewing in the browser"""
    # Use absolute path to ensure we're accessing the correct directory
    base_path = Path(__file__).parent / "workspace" / project_name

    if not base_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_name} not found")

    # Log the file path for debugging
    print(f"Viewing HTML file: {file_path} in project {project_name}")

    # Handle URL-encoded file paths
    from urllib.parse import unquote

    decoded_file_path = unquote(file_path)
    print(f"Decoded file path for HTML view: {decoded_file_path}")

    full_path = base_path / decoded_file_path

    if not full_path.exists() or not full_path.is_file():
        # Try with the original path as a fallback
        original_full_path = base_path / file_path
        if original_full_path.exists() and original_full_path.is_file():
            full_path = original_full_path
            decoded_file_path = file_path
            print(f"Using original path: {full_path}")
        else:
            print(f"File not found: {full_path}")
            print(f"Also tried: {original_full_path}")
            raise HTTPException(
                status_code=404,
                detail=f"File {file_path} not found in project {project_name}",
            )

    if full_path.suffix.lower() != ".html":
        raise HTTPException(
            status_code=400,
            detail=f"File {file_path} is not an HTML file",
        )

    # Log the file being served
    print(f"Serving HTML file: {full_path}")

    # Read the HTML content
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            html_content = f.read()

        # Use a simpler approach - just modify the base path for all resources
        # This handles both href and src attributes
        html_content = html_content.replace(
            'href="', f'href="/workspace/{project_name}/raw/'
        )
        html_content = html_content.replace(
            "href='", f"href='/workspace/{project_name}/raw/"
        )
        html_content = html_content.replace(
            'src="', f'src="/workspace/{project_name}/raw/'
        )
        html_content = html_content.replace(
            "src='", f"src='/workspace/{project_name}/raw/"
        )

        # Fix any double slashes
        html_content = html_content.replace("//", "/")
        # Fix the protocol slashes we just broke
        html_content = html_content.replace("http:/", "http://")
        html_content = html_content.replace("https:/", "https://")

        # Return the modified HTML content
        return Response(
            content=html_content,
            media_type="text/html",
            headers={
                "Content-Disposition": f"inline; filename={os.path.basename(full_path)}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "X-Content-Type-Options": "nosniff",
            },
        )
    except Exception as e:
        print(f"Error serving HTML file: {str(e)}")
        # If there's an error, fall back to serving the file directly
        return FileResponse(
            full_path,
            media_type="text/html",
            headers={
                "Content-Disposition": f"inline; filename={os.path.basename(full_path)}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "X-Content-Type-Options": "nosniff",
            },
        )


class TaskCreateRequest(BaseModel):
    prompt: str
    project_name: str = ""


@app.post("/tasks")
async def create_task(request: TaskCreateRequest):
    task = task_manager.create_task(request.prompt, request.project_name)
    # Ensure we pass a string prompt to run_task
    prompt_text = (
        request.prompt if isinstance(request.prompt, str) else str(request.prompt)
    )
    asyncio.create_task(run_task(task.id, prompt_text))
    return {"task_id": task.id, "project_name": request.project_name}


from app.agent.manus import Manus


def is_complex_task(prompt: str) -> bool:
    """Determine if a task is complex enough to warrant planning."""
    # Simple heuristic based on prompt length and complexity indicators
    complexity_indicators = [
        "create",
        "build",
        "develop",
        "implement",
        "design",
        "multiple",
        "steps",
        "complex",
        "project",
        "application",
    ]

    # Check prompt length
    if len(prompt.split()) > 20:
        return True

    # Check for complexity indicators
    for indicator in complexity_indicators:
        if indicator.lower() in prompt.lower():
            return True

    return False


async def run_task(task_id: str, prompt):
    try:
        # Print the type of prompt for debugging
        print(f"run_task called with prompt type: {type(prompt)}")

        # Get task from database
        task = task_manager.get_task(task_id)
        if not task:
            print(f"Task {task_id} not found")
            return

        # Extract project name from task
        project_name = task.project_name if hasattr(task, "project_name") else ""

        # Handle different prompt types with robust error handling
        try:
            if isinstance(prompt, dict):
                # If prompt is a dictionary, extract the prompt text
                print(f"Prompt is a dictionary with keys: {list(prompt.keys())}")
                if "prompt" in prompt:
                    prompt_text = str(prompt["prompt"])
                else:
                    # Try to convert the dictionary to a string
                    prompt_text = str(prompt)
            else:
                # If prompt is already a string, use it directly
                prompt_text = str(prompt)

            # Ensure prompt_text is a string
            if not isinstance(prompt_text, str):
                prompt_text = str(prompt_text)

            print(f"Processing task {task_id} with prompt: {prompt_text[:50]}...")
        except Exception as e:
            print(f"Error processing prompt in task {task_id}: {str(e)}")
            # Fallback to a safe string if all else fails
            prompt_text = "Error processing the original prompt. Please try again."
            await task_manager.fail_task(task_id, f"Error processing prompt: {str(e)}")
            return
    except Exception as e:
        print(f"Error initializing task {task_id}: {str(e)}")
        await task_manager.fail_task(task_id, f"Error initializing task: {str(e)}")
        return

    try:
        # Initialize the enhanced Manus agent with tool awareness
        agent = Manus(
            name="Manus",
            description="An autonomous AI assistant with exceptional tool utilization capabilities",
            project_name=project_name,  # Pass the project name to the agent
            # Pass the base_workspace_path to the agent if it's available, for tools that might need it
            base_workspace_path=Path(__file__).parent / "workspace",
        )

        # Load conversation history into agent's memory with improved error handling
        conversation_loaded = False
        try:
            if hasattr(task, "steps") and task.steps:
                from app.schema import Message

                print(
                    f"Loading {len(task.steps)} previous steps into agent memory for task {task_id}"
                )

                # Track loaded messages for debugging
                loaded_user_messages = 0
                loaded_assistant_messages = 0
                skipped_messages = 0

                # Filter and sort steps to ensure proper conversation order
                conversation_steps = []
                for step_index, step in enumerate(task.steps):
                    try:
                        if (
                            isinstance(step, dict)
                            and "type" in step
                            and "result" in step
                        ):
                            step_type = step["type"]
                            step_content = step["result"]

                            # Only include conversation messages (prompt and result)
                            if (
                                step_type in ["prompt", "result"]
                                and step_content
                                and step_content.strip()
                            ):
                                conversation_steps.append(
                                    {
                                        "type": step_type,
                                        "content": step_content,
                                        "index": step_index,
                                    }
                                )
                        elif hasattr(step, "type") and hasattr(step, "content"):
                            if (
                                step.type in ["prompt", "result"]
                                and step.content
                                and step.content.strip()
                            ):
                                conversation_steps.append(
                                    {
                                        "type": step.type,
                                        "content": step.content,
                                        "index": step_index,
                                    }
                                )
                    except Exception as e:
                        print(f"Error processing step {step_index}: {str(e)}")
                        continue

                # Sort by index to maintain chronological order
                conversation_steps.sort(key=lambda x: x["index"])

                # Load conversation steps into agent memory
                for conv_step in conversation_steps:
                    try:
                        step_type = conv_step["type"]
                        step_content = conv_step["content"]

                        if step_type == "prompt":
                            agent.update_memory("user", step_content)
                            loaded_user_messages += 1
                            print(
                                f"Added user message to agent memory: {step_content[:50]}..."
                            )
                        elif step_type == "result":
                            agent.update_memory("assistant", step_content)
                            loaded_assistant_messages += 1
                            print(
                                f"Added assistant message to agent memory: {step_content[:50]}..."
                            )

                    except Exception as e:
                        print(
                            f"Error adding conversation step to agent memory: {str(e)}"
                        )
                        skipped_messages += 1
                        continue

                print(
                    f"Successfully loaded {loaded_user_messages} user messages and {loaded_assistant_messages} assistant messages. Skipped {skipped_messages} messages."
                )

                # Mark conversation as loaded if we have any messages
                if loaded_user_messages > 0 or loaded_assistant_messages > 0:
                    conversation_loaded = True

                    # Add context analysis system message to help agent understand the conversation
                    context_prompt = f"""CONVERSATION_CONTEXT: You are continuing a conversation that has {loaded_user_messages} user messages and {loaded_assistant_messages} assistant responses.
Review the conversation history above to understand what has been discussed and maintain context continuity.
Remember what you've created, discussed, or promised in previous messages.
Respond to the new user message while being aware of the full conversation context."""

                    agent.update_memory("system", context_prompt)
                    print(f"Added conversation context prompt to agent memory")

        except Exception as e:
            print(
                f"Error loading conversation history into agent memory for task {task_id}: {str(e)}"
            )
            # Continue even if loading history fails, but log the error

        # Add project source code to agent memory if project_name is available
        if project_name:
            print(f"Fetching source code for project: {project_name}")
            project_code_context = await get_project_source_code(project_name)
            agent.update_memory("system", project_code_context)
            print(
                f"Added project source code to agent memory for project {project_name}"
            )

        # Add the current prompt as the latest user message
        agent.update_memory("user", prompt_text)

        # For backward compatibility, also prepare the full prompt with conversation history
        full_prompt = prompt_text
        try:
            if hasattr(task, "steps") and task.steps:
                # Include conversation history in the prompt
                history = []
                for step in task.steps:
                    try:
                        # Access dictionary items with bracket notation instead of attribute access
                        if (
                            isinstance(step, dict)
                            and "type" in step
                            and "result" in step
                        ):
                            if step["type"] == "prompt":
                                history.append(f"User: {step['result']}")
                            elif step["type"] == "result":
                                history.append(f"Assistant: {step['result']}")
                        # For backward compatibility with object-style steps
                        elif hasattr(step, "type") and hasattr(step, "content"):
                            if step.type == "prompt":
                                history.append(f"User: {step.content}")
                            elif step.type == "result":
                                history.append(f"Assistant: {step.content}")
                    except Exception as e:
                        print(f"Error processing step in task {task_id}: {str(e)}")
                        # Continue with other steps even if one fails
                        continue

                if history:
                    full_prompt = (
                        "Previous conversation:\n"
                        + "\n".join(history)
                        + "\n\nNew request: "
                        + prompt_text
                    )
        except Exception as e:
            print(f"Error building conversation history for task {task_id}: {str(e)}")
            # Continue with just the prompt if history building fails

        # For complex tasks, create a structured plan
        if is_complex_task(prompt_text):
            logger.info("Creating a structured plan for complex task")
            # Skip plan creation for now

        async def on_think(thought):
            await task_manager.update_task_step(task_id, 0, thought, "think")

        async def on_tool_execute(tool, input):
            await task_manager.update_task_step(
                task_id, 0, f"Executing tool: {tool}\nInput: {input}", "tool"
            )

        async def on_action(action):
            await task_manager.update_task_step(
                task_id, 0, f"Executing action: {action}", "act"
            )

        async def on_run(step, result):
            await task_manager.update_task_step(task_id, step, result, "run")

        # Create a streaming callback for real-time updates
        async def stream_callback(event_type: str, message: str):
            """Callback function to stream agent events in real-time"""
            from datetime import datetime

            timestamp = datetime.now().isoformat()

            # Send the event immediately to the client
            await task_manager.update_task_step(
                task_id,
                0,
                message,
                event_type,
                metadata={
                    "streaming": True,
                    "timestamp": timestamp,
                    "source": "agent",
                    "display_mode": "realtime",
                },
            )

        # Set the streaming callback on the agent
        agent.stream_callback = stream_callback

        # Run the agent with the current prompt (no need to use full_prompt since we've loaded history into memory)
        print(f"Running agent with conversation context loaded into memory...")

        # Check if this is a continuation of an existing conversation
        # Determine if this is a continuation based on conversation steps loaded
        conversation_steps_count = len(
            [
                step
                for step in task.steps
                if isinstance(step, dict) and step.get("type") in ["prompt", "result"]
            ]
        )
        is_continuation = conversation_steps_count > 1  # At least one previous exchange

        if is_continuation:
            print(
                f"This is a continuation of an existing conversation with {conversation_steps_count} conversation steps"
            )
            print(
                f"Agent memory now contains {len(agent.memory.messages)} total messages"
            )

            # For continuation conversations, refresh the project source code context
            if project_name:
                print(f"Refreshing source code context for project: {project_name}")
                project_code_context = await get_project_source_code(project_name)
                # Add a separator before the project code to help distinguish it from conversation
                context_msg = f"\nPROJECT_SOURCE_CODE_REFRESH: Current state of project '{project_name}':\n{project_code_context}"
                agent.update_memory("system", context_msg)
                print(
                    f"Refreshed project source code context for project {project_name}"
                )

            # We pass the current prompt and let the agent respond with full context awareness
            result = await agent.run(prompt_text)
        else:
            print(f"This is a new conversation with prompt: {prompt_text[:50]}...")
            # For new conversations, we pass the prompt directly
            result = await agent.run(prompt_text)

        # No need to flush buffers since we're streaming directly

        await task_manager.update_task_step(task_id, 1, result, "result")

        # Send a complete event to the client with additional metadata
        if task_id in task_manager.queues:
            await task_manager.queues[task_id].put(
                {
                    "type": "complete",
                    "result": result,
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    "iso_timestamp": datetime.now().isoformat(),
                    "final": True,
                    "step_number": len(task.steps) if hasattr(task, "steps") else 0,
                }
            )

        # Mark the task as completed
        await task_manager.complete_task(task_id)
    except Exception as e:
        error_message = f"Error in run_task for task {task_id}: {str(e)}"
        print(error_message)

        # Add a more detailed error message to the task steps
        try:
            await task_manager.update_task_step(
                task_id,
                len(task.steps) if hasattr(task, "steps") else 0,
                f"Error: {str(e)}\n\nPlease try again or rephrase your request.",
                "error",
                metadata={
                    "timestamp": datetime.now().isoformat(),
                    "streaming": False,
                    "source": "system",
                    "error": True,
                },
            )
        except Exception as inner_e:
            print(f"Error updating task step with error message: {str(inner_e)}")

        # Mark the task as failed
        await task_manager.fail_task(task_id, str(e))


@app.get("/tasks/{task_id}/events")
async def stream_task_events(task_id: str, request: Request):
    """Stream task events using Server-Sent Events (SSE)."""
    if task_id not in task_manager.queues:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_generator():
        try:
            # Get the task
            task = task_manager.get_task(task_id)
            if not task:
                error_msg = f"Task {task_id} not found"
                print(error_msg)
                yield f"event: error\ndata: {dumps({'message': error_msg})}\n\n"
                return

            # Send all steps collected so far
            for i, step in enumerate(task.steps):
                try:
                    # Skip empty messages
                    if isinstance(step, dict) and "type" in step and "result" in step:
                        step_type = step["type"]
                        step_result = step["result"]

                        # Skip empty steps
                        if not step_result or len(str(step_result).strip()) == 0:
                            continue

                        # For act steps that contain multiple steps, split them
                        if step_type == "act" and "Step " in step_result:
                            # Split by "Step X:" pattern
                            sub_steps = re.split(r"(?=Step \d+:)", step_result)
                            for sub_step in sub_steps:
                                if sub_step.strip():
                                    sub_event = {
                                        "type": "act",
                                        "step": i,
                                        "result": sub_step.strip(),
                                        "timestamp": datetime.now().isoformat(),
                                    }
                                    yield f"event: act\ndata: {dumps(sub_event)}\n\n"
                        else:
                            # Send as a single event
                            step_event = {
                                "type": step_type,
                                "step": i,
                                "result": step_result,
                                "timestamp": datetime.now().isoformat(),
                            }
                            try:
                                event_data = dumps(step_event)
                                yield f"event: {step_type}\ndata: {event_data}\n\n"
                            except Exception as json_error:
                                print(
                                    f"JSON serialization error for step {i}: {str(json_error)}"
                                )
                                # Send a simplified error event
                                error_event = {
                                    "type": "error",
                                    "step": i,
                                    "result": f"Error serializing step data: {str(json_error)}",
                                    "timestamp": datetime.now().isoformat(),
                                }
                                yield f"event: error\ndata: {dumps(error_event)}\n\n"

                except Exception as e:
                    print(f"Error processing step {i} in task {task_id}: {str(e)}")
                    # Send an error event for this step
                    error_event = {
                        "type": "error",
                        "step": i,
                        "result": f"Error processing step: {str(e)}",
                        "timestamp": datetime.now().isoformat(),
                    }
                    yield f"event: error\ndata: {dumps(error_event)}\n\n"
                    continue

            print(f"Sent {len(task.steps)} historical steps for task {task_id}")

            # Now listen for new events
            queue = task_manager.queues[task_id]
            heartbeat_counter = 0
            last_event_time = datetime.now()

            # Send a streaming start event to indicate real-time updates are beginning
            streaming_start_event = {
                "type": "streaming_start",
                "timestamp": datetime.now().isoformat(),
                "message": "Starting real-time streaming updates",
            }
            yield f"event: streaming_start\ndata: {dumps(streaming_start_event)}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    print(f"Client disconnected from task {task_id} events")
                    break

                # Try to get a new event with a short timeout
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=1.0)
                    last_event_time = datetime.now()

                    # Add timestamp to event if not present
                    if "timestamp" not in event:
                        event["timestamp"] = datetime.now().isoformat()

                    # For act events that contain multiple steps, split them
                    if event.get("type") == "act" and "Step " in event.get(
                        "result", ""
                    ):
                        # Split by "Step X:" pattern
                        sub_steps = re.split(r"(?=Step \d+:)", event["result"])
                        for sub_step in sub_steps:
                            if sub_step.strip():
                                sub_event = {
                                    "type": "act",
                                    "step": event.get("step", 0),
                                    "result": sub_step.strip(),
                                    "timestamp": datetime.now().isoformat(),
                                    "streaming": True,
                                }
                                yield f"event: act\ndata: {dumps(sub_event)}\n\n"
                    else:
                        # Send as a single event with streaming flag
                        event_type = event.get("type", "message")

                        # Add streaming flag to all events except complete
                        if event_type != "complete":
                            event["streaming"] = True

                        try:
                            event_data = dumps(event)
                            yield f"event: {event_type}\ndata: {event_data}\n\n"
                        except Exception as json_error:
                            print(
                                f"JSON serialization error for event {event_type}: {str(json_error)}"
                            )
                            # Send a simplified error event
                            error_event = {
                                "type": "error",
                                "result": f"Error serializing event data: {str(json_error)}",
                                "timestamp": datetime.now().isoformat(),
                            }
                            yield f"event: error\ndata: {dumps(error_event)}\n\n"

                        # For complete events, send a streaming_end event
                        if event_type == "complete":
                            streaming_end_event = {
                                "type": "streaming_end",
                                "timestamp": datetime.now().isoformat(),
                                "message": "Streaming complete",
                            }
                            yield f"event: streaming_end\ndata: {dumps(streaming_end_event)}\n\n"

                except asyncio.TimeoutError:
                    # Send heartbeat every 15 seconds if no events
                    heartbeat_counter += 1
                    if heartbeat_counter >= 15:
                        heartbeat_counter = 0
                        yield f"event: heartbeat\ndata: {dumps({'timestamp': datetime.now().isoformat()})}\n\n"

                    # Check if we've been idle too long (2 minutes)
                    idle_time = (datetime.now() - last_event_time).total_seconds()
                    if idle_time > 120:
                        print(
                            f"Closing idle connection for task {task_id} after {idle_time:.1f}s"
                        )
                        # Send a streaming_end event before closing
                        streaming_end_event = {
                            "type": "streaming_end",
                            "timestamp": datetime.now().isoformat(),
                            "message": "Streaming ended due to inactivity",
                        }
                        yield f"event: streaming_end\ndata: {dumps(streaming_end_event)}\n\n"
                        break

                except Exception as e:
                    print(f"Error in event stream for task {task_id}: {str(e)}")
                    yield f"event: error\ndata: {dumps({'message': str(e), 'timestamp': datetime.now().isoformat()})}\n\n"
                    # Don't break, try to continue

        except Exception as e:
            error_msg = f"Error in event generator for task {task_id}: {str(e)}"
            print(error_msg)
            yield f"event: error\ndata: {dumps({'message': error_msg, 'timestamp': datetime.now().isoformat()})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )


@app.get("/tasks")
async def get_tasks():
    return task_manager.get_all_tasks()


@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task and all its associated data"""
    print(f"Received delete request for task: {task_id}")

    task = task_manager.get_task(task_id)
    if not task:
        print(f"Task {task_id} not found in task manager")
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        print(f"Attempting to delete task {task_id} from database...")

        # Remove the task from the database
        success = task_manager.db.delete_task(task_id)
        print(f"Database deletion result for task {task_id}: {success}")

        if not success:
            print(f"Database deletion failed for task {task_id}")
            raise HTTPException(
                status_code=500, detail="Failed to delete task from database"
            )

        # Clean up any in-memory data
        if task_id in task_manager.queues:
            print(f"Cleaning up queue for task {task_id}")
            del task_manager.queues[task_id]
        else:
            print(f"No queue found for task {task_id}")

        print(f"Task {task_id} cleanup completed - database and memory cleaned")

        print(f"Successfully deleted task {task_id}")
        return {"status": "success", "message": f"Task {task_id} deleted successfully"}

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error deleting task {task_id}: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")


@app.post("/tasks/{task_id}/messages")
async def add_message_to_task(task_id: str, message: str = Body(..., embed=True)):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "completed":
        # Restart completed task with new prompt but keep conversation history
        task.status = "running"
        await task_manager.queues[task_id].put(
            {"type": "status", "status": task.status, "steps": task.steps}
        )

    # Add message to task steps with metadata
    await task_manager.update_task_step(
        task_id=task_id,
        step=len(task.steps),
        result=message,
        step_type="prompt",
        metadata={
            "timestamp": datetime.now().isoformat(),
            "streaming": False,
            "source": "user",
        },
    )

    # Restart task processing with new prompt
    # Ensure we pass a string prompt to run_task
    prompt_text = message if isinstance(message, str) else str(message)
    asyncio.create_task(run_task(task_id, prompt_text))
    return {"status": "message added and task restarted"}


@app.post("/tasks/{task_id}/continue")
async def continue_task(task_id: str, prompt: str = Body(..., embed=True)):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Reset the task status to running if it was completed
    if task.status == "completed" or task.status.startswith("failed"):
        await task_manager.update_task_status(task_id, "running")

    # Add the continuation prompt as a new step with metadata
    await task_manager.update_task_step(
        task_id=task_id,
        step=len(task.steps),
        result=prompt,
        step_type="prompt",
        metadata={
            "timestamp": datetime.now().isoformat(),
            "streaming": False,
            "source": "user",
        },
    )

    # Start processing the task with the new prompt
    asyncio.create_task(run_task(task_id, prompt))

    return {"status": "message added and task restarted"}


@app.get("/config/status")
async def get_config_status():
    """Get the current configuration status."""
    try:
        config_dir = Path(__file__).parent / "config"
        config_path = config_dir / "config.toml"
        example_config_path = config_dir / "config.example.toml"

        if config_path.exists():
            # Configuration exists, return current config
            with open(config_path, "rb") as f:
                config = tomllib.load(f)
            return {"status": "exists", "config": config}
        elif example_config_path.exists():
            # Configuration doesn't exist but example does
            with open(example_config_path, "rb") as f:
                example_config = tomllib.load(f)
            return {"status": "missing", "example_config": example_config}
        else:
            # No configuration or example exists
            return {"status": "no_example"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/config/save")
async def save_config(config_data: dict = Body(...)):
    try:
        config_dir = Path(__file__).parent / "config"
        config_dir.mkdir(exist_ok=True)

        config_path = config_dir / "config.toml"

        toml_content = ""

        if "llm" in config_data:
            toml_content += "# Global LLM configuration\n[llm]\n"
            llm_config = config_data["llm"]
            for key, value in llm_config.items():
                if key != "vision":
                    if isinstance(value, str):
                        toml_content += f'{key} = "{value}"\n'
                    else:
                        toml_content += f"{key} = {value}\n"

        # Add default server configuration (since the app will be deployed soon)
        toml_content += "\n# Server configuration\n[server]\n"
        toml_content += 'host = "localhost"\n'
        toml_content += "port = 8080\n"

        with open(config_path, "w", encoding="utf-8") as f:
            f.write(toml_content)

        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Workspace IDE routes
@app.get("/workspace")
async def list_workspace_projects():
    """List all project folders in the workspace directory"""
    # Use absolute path to ensure we're accessing the correct directory
    workspace_path = Path(__file__).parent / "workspace"

    if not workspace_path.exists():
        workspace_path.mkdir(exist_ok=True)
        return {"projects": []}

    projects = [
        {"name": folder.name, "path": str(folder), "type": "directory"}
        for folder in workspace_path.iterdir()
        if folder.is_dir()
    ]

    print(f"Found {len(projects)} projects in {workspace_path}")
    return {"projects": projects}


@app.get("/workspace/{project_name}")
async def list_project_files(project_name: str, path: str = ""):
    """List files and directories in a project folder"""
    # Use absolute path to ensure we're accessing the correct directory
    base_path = Path(__file__).parent / "workspace" / project_name

    if not base_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_name} not found")

    # Log the path for debugging
    print(f"Listing files in project {project_name}, path: {path}")

    # Handle URL-encoded paths
    from urllib.parse import unquote

    decoded_path = unquote(path)
    print(f"Decoded path: {decoded_path}")

    current_path = base_path
    if decoded_path:
        current_path = base_path / decoded_path

    if not current_path.exists():
        # Try with the original path as a fallback
        original_current_path = base_path / path
        if original_current_path.exists():
            current_path = original_current_path
            decoded_path = path
            print(f"Using original path: {current_path}")
        else:
            print(f"Path not found: {current_path}")
            print(f"Also tried: {original_current_path}")
            raise HTTPException(
                status_code=404,
                detail=f"Path {path} not found in project {project_name}",
            )

    items = []
    for item in current_path.iterdir():
        item_type = "directory" if item.is_dir() else "file"
        rel_path = str(item.relative_to(base_path))

        # Determine file type for syntax highlighting
        extension = item.suffix.lower()[1:] if item.suffix else ""

        items.append(
            {
                "name": item.name,
                "path": rel_path,
                "type": item_type,
                "extension": extension,
                "size": os.path.getsize(item) if item.is_file() else None,
                "last_modified": datetime.fromtimestamp(
                    os.path.getmtime(item)
                ).isoformat(),
            }
        )

    # Sort by type (directories first) then by name
    items.sort(key=lambda x: (0 if x["type"] == "directory" else 1, x["name"].lower()))

    print(f"Listed {len(items)} items in project {project_name}, path: {path}")
    return {"project": project_name, "current_path": path, "items": items}


@app.get("/workspace/{project_name}/file")
async def get_file_content(project_name: str, file_path: str):
    """Get the content of a file"""
    # Use absolute path to ensure we're accessing the correct directory
    base_path = Path(__file__).parent / "workspace" / project_name

    if not base_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_name} not found")

    # Log the file path for debugging
    print(f"Requested file: {file_path!r} in project {project_name}")

    # Handle URL-encoded file paths
    try:
        from urllib.parse import unquote

        decoded_file_path = unquote(file_path)
        print(f"Decoded file path: {decoded_file_path!r}")

        # Try multiple path variations
        path_variations = [
            decoded_file_path,
            file_path,
            decoded_file_path.replace("\\", "/"),
            file_path.replace("\\", "/"),
        ]

        full_path = None
        for path_var in path_variations:
            test_path = base_path / path_var
            print(f"Trying path: {test_path}")
            if test_path.exists() and test_path.is_file():
                full_path = test_path
                print(f"Found file at: {full_path}")
                break

        if not full_path:
            # If still not found, try to list files in the directory to help debugging
            print(f"File not found. Listing files in {base_path}:")
            try:
                for item in base_path.iterdir():
                    print(f"  - {item.name} ({'dir' if item.is_dir() else 'file'})")
            except Exception as e:
                print(f"Error listing directory: {str(e)}")

            raise HTTPException(
                status_code=404,
                detail=f"File {file_path} not found in project {project_name}",
            )

        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()

        print(f"Successfully read file {full_path}")
        return {
            "project": project_name,
            "file_path": decoded_file_path,
            "content": content,
        }
    except UnicodeDecodeError as e:
        # For binary files
        print(f"Binary file {full_path} cannot be displayed: {str(e)}")
        return {
            "project": project_name,
            "file_path": file_path,
            "content": None,
            "error": "Binary file cannot be displayed",
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")


@app.post("/workspace/{project_name}/file")
async def save_file_content(
    project_name: str, file_path: str, content: str = Body(..., embed=True)
):
    """Save content to a file"""
    # Use absolute path to ensure we're accessing the correct directory
    base_path = Path(__file__).parent / "workspace" / project_name

    if not base_path.exists():
        base_path.mkdir(parents=True, exist_ok=True)

    # Log the file path for debugging
    print(f"Saving file: {file_path} in project {project_name}")

    # Handle URL-encoded file paths
    try:
        from urllib.parse import unquote

        decoded_file_path = unquote(file_path)
        print(f"Decoded file path for saving: {decoded_file_path}")

        full_path = base_path / decoded_file_path

        # Create parent directories if they don't exist
        full_path.parent.mkdir(parents=True, exist_ok=True)

        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"Successfully saved file {full_path}")
        return {
            "project": project_name,
            "file_path": decoded_file_path,
            "status": "success",
        }
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")


import signal

# --- Script Process Management ---
import threading

# Global dictionary to store running script processes (keyed by project_name)
running_script_processes = {}
process_locks = {}


# --- Modified Run Endpoint ---
@app.post("/workspace/{project_name}/run")
async def run_file(project_name: str, file_path: str):
    """Run a file (supports Python and JS files, now stoppable)"""
    import sys

    from fastapi.responses import JSONResponse

    base_path = Path(__file__).parent / "workspace" / project_name
    if not base_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_name} not found")

    from urllib.parse import unquote

    decoded_file_path = unquote(file_path)
    full_path = base_path / decoded_file_path
    if not full_path.exists() or not full_path.is_file():
        original_full_path = base_path / file_path
        if original_full_path.exists() and original_full_path.is_file():
            full_path = original_full_path
            decoded_file_path = file_path
        else:
            raise HTTPException(
                status_code=404,
                detail=f"File {file_path} not found in project {project_name}",
            )
    extension = full_path.suffix.lower()
    try:
        result = ""
        if extension in [".py", ".js"]:
            # Only allow one running script per project at a time
            lock = process_locks.setdefault(project_name, threading.Lock())
            with lock:
                # If a process is already running, return error
                if project_name in running_script_processes:
                    proc = running_script_processes[project_name]
                    if proc.poll() is None:
                        return JSONResponse(
                            status_code=409,
                            content={
                                "status": "error",
                                "message": "A script is already running for this project. Please stop it first.",
                            },
                        )
                    else:
                        del running_script_processes[project_name]
                # Start the process
                if extension == ".py":
                    cmd = [sys.executable, str(full_path)]
                else:
                    cmd = ["node", str(full_path)]
                proc = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=str(base_path),
                    text=True,
                )
                running_script_processes[project_name] = proc

            # Start a thread to read output and wait for process to finish
            def read_output_and_cleanup():
                try:
                    stdout, stderr = proc.communicate()
                    output = stdout
                    if stderr:
                        output += "\n\nErrors:\n" + stderr
                except Exception as e:
                    output = f"Error reading process output: {str(e)}"
                finally:
                    with lock:
                        if project_name in running_script_processes:
                            del running_script_processes[project_name]

            threading.Thread(target=read_output_and_cleanup, daemon=True).start()
            return {
                "project": project_name,
                "file_path": file_path,
                "status": "running",
                "message": "Script started. Use the stop endpoint to terminate.",
            }
        elif extension == ".html":
            # For HTML files, return a special response that will trigger browser opening
            host = "localhost"
            port = 8080  # Always use port 8080 for the backend
            from urllib.parse import quote

            encoded_file_path = quote(decoded_file_path)
            file_url = f"http://{host}:{port}/workspace/{project_name}/view-html?file_path={encoded_file_path}"
            direct_url = (
                f"http://{host}:{port}/workspace/{project_name}/raw/{encoded_file_path}"
            )
            html_link = f"""
<div style=\"margin: 20px 0; text-align: center;\">
    <a href=\"{file_url}\" target=\"_blank\" style=\"display: inline-block; padding: 10px 20px; background-color: #38A169; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;\">
        Open HTML File (Processed)
    </a>
    <a href=\"{direct_url}\" target=\"_blank\" style=\"display: inline-block; padding: 10px 20px; background-color: #3182CE; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;\">
        Open HTML File (Direct)
    </a>
</div>
<div style=\"margin: 10px 0;\">
    <p>If the buttons don't work, copy and paste one of these URLs in your browser:</p>
    <p><strong>Processed URL</strong> (recommended - fixes relative paths):</p>
    <code style=\"display: block; padding: 10px; background-color: #f5f5f5; border-radius: 3px; word-break: break-all; margin-bottom: 10px;\">{file_url}</code>
    <p><strong>Direct URL</strong> (if processed version has issues):</p>
    <code style=\"display: block; padding: 10px; background-color: #f5f5f5; border-radius: 3px; word-break: break-all;\">{direct_url}</code>
</div>
"""
            result = f"HTML file ready to view. Click one of the buttons below to open it in a new tab.\n{html_link}"
            return {
                "project": project_name,
                "file_path": file_path,
                "output": result,
                "status": "success",
                "file_type": "html",
                "view_url": file_url,
                "direct_url": direct_url,
                "html_link": html_link,
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Running files with extension {extension} is not supported",
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running file: {str(e)}")


# --- New Stop Script Endpoint ---
@app.post("/workspace/{project_name}/stop-script")
async def stop_script(project_name: str):
    """Stop a running Python or JS script for a project"""
    import psutil

    lock = process_locks.setdefault(project_name, threading.Lock())
    with lock:
        proc = running_script_processes.get(project_name)
        if not proc or proc.poll() is not None:
            return {
                "status": "not_running",
                "message": "No script is currently running.",
            }
        try:
            # Use psutil to kill the process tree
            p = psutil.Process(proc.pid)
            for child in p.children(recursive=True):
                child.kill()
            p.kill()
            del running_script_processes[project_name]
            return {"status": "stopped", "message": "Script stopped successfully."}
        except Exception as e:
            return {"status": "error", "message": f"Failed to stop script: {str(e)}"}


# --- Script Running Status Endpoint ---
@app.get("/workspace/{project_name}/script-status")
async def script_status(project_name: str):
    lock = process_locks.setdefault(project_name, threading.Lock())
    with lock:
        proc = running_script_processes.get(project_name)
        if proc and proc.poll() is None:
            return {"status": "running"}
        else:
            return {"status": "not_running"}


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500, content={"message": f"Server error: {str(exc)}"}
    )


def open_local_browser(config):
    webbrowser.open_new_tab(f"http://{config['host']}:{config['port']}")


def load_config():
    try:
        config_path = Path(__file__).parent / "config" / "config.toml"

        if not config_path.exists():
            return {"host": "localhost", "port": 8080}

        with open(config_path, "rb") as f:
            config = tomllib.load(f)

        return {"host": config["server"]["host"], "port": config["server"]["port"]}
    except FileNotFoundError:
        return {"host": "localhost", "port": 8080}
    except KeyError as e:
        print(
            f"The configuration file is missing necessary fields: {str(e)}, use default configuration"
        )
        return {"host": "localhost", "port": 8080}


# Lifespan context manager is defined at the top of the file


# Database admin routes
@app.get("/admin/database")
async def admin_database_view():
    """View all tasks in the database with basic information"""
    try:
        tasks = task_manager.db.get_all_tasks()

        # Format tasks for display
        formatted_tasks = []
        for task in tasks:
            try:
                # Count steps by type
                step_counts = {}
                if task.get("steps"):
                    for step in task["steps"]:
                        if isinstance(step, dict) and "type" in step:
                            step_type = step["type"]
                            step_counts[step_type] = step_counts.get(step_type, 0) + 1

                # Safely format the created_at field
                created_at_str = "unknown"
                created_at_value = task.get("created_at")
                if created_at_value:
                    try:
                        # Check if it's already a datetime object
                        if hasattr(created_at_value, "isoformat"):
                            created_at_str = created_at_value.isoformat()
                        # Check if it's a string that can be converted
                        elif isinstance(created_at_value, str):
                            # Try to parse and reformat to ensure consistency
                            parsed_dt = datetime.fromisoformat(created_at_value)
                            created_at_str = parsed_dt.isoformat()
                        else:
                            created_at_str = str(created_at_value)
                    except Exception as dt_error:
                        print(
                            f"Error formatting created_at for task {task.get('id', 'unknown')}: {str(dt_error)}"
                        )
                        created_at_str = (
                            str(created_at_value) if created_at_value else "unknown"
                        )

                # Safely format the task data
                formatted_task = {
                    "id": task.get("id", "unknown"),
                    "project_name": task.get("project_name") or "No Project",
                    "created_at": created_at_str,
                    "status": task.get("status", "unknown"),
                    "prompt_preview": (
                        task.get("prompt", "")[:100] + "..."
                        if len(task.get("prompt", "")) > 100
                        else task.get("prompt", "")
                    ),
                    "step_count": len(task.get("steps", [])),
                    "step_types": step_counts,
                }
                formatted_tasks.append(formatted_task)
            except Exception as e:
                print(f"Error formatting task {task.get('id', 'unknown')}: {str(e)}")
                # Add a minimal task entry for failed formatting
                formatted_tasks.append(
                    {
                        "id": task.get("id", "unknown"),
                        "project_name": "Error",
                        "created_at": "unknown",
                        "status": "error",
                        "prompt_preview": f"Error formatting task: {str(e)}",
                        "step_count": 0,
                        "step_types": {},
                    }
                )

        return {"task_count": len(tasks), "tasks": formatted_tasks}
    except Exception as e:
        print(f"Error in admin_database_view: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/admin/database/task/{task_id}")
async def admin_view_task(task_id: str):
    """View detailed information about a specific task"""
    try:
        task = task_manager.db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Safely format the created_at field
        created_at_str = "unknown"
        created_at_value = task.get("created_at")
        if created_at_value:
            try:
                # Check if it's already a datetime object
                if hasattr(created_at_value, "isoformat"):
                    created_at_str = created_at_value.isoformat()
                # Check if it's a string that can be converted
                elif isinstance(created_at_value, str):
                    # Try to parse and reformat to ensure consistency
                    parsed_dt = datetime.fromisoformat(created_at_value)
                    created_at_str = parsed_dt.isoformat()
                else:
                    created_at_str = str(created_at_value)
            except Exception as dt_error:
                print(
                    f"Error formatting created_at for task {task.get('id', 'unknown')}: {str(dt_error)}"
                )
                created_at_str = (
                    str(created_at_value) if created_at_value else "unknown"
                )

        # Format the task for better readability with error handling
        formatted_task = {
            "id": task.get("id", "unknown"),
            "project_name": task.get("project_name") or "No Project",
            "created_at": created_at_str,
            "status": task.get("status", "unknown"),
            "prompt": task.get("prompt", ""),
            "steps": [],
        }

        # Format steps with error handling
        if task.get("steps"):
            for step in task["steps"]:
                try:
                    formatted_step = {
                        "number": step.get("step", 0),
                        "type": step.get("type", "unknown"),
                        "content_preview": (
                            step.get("result", "")[:100] + "..."
                            if len(step.get("result", "")) > 100
                            else step.get("result", "")
                        ),
                        "full_content": step.get("result", ""),
                    }
                    formatted_task["steps"].append(formatted_step)
                except Exception as e:
                    print(f"Error formatting step: {str(e)}")
                    # Add a minimal step entry for failed formatting
                    formatted_task["steps"].append(
                        {
                            "number": 0,
                            "type": "error",
                            "content_preview": f"Error formatting step: {str(e)}",
                            "full_content": f"Error formatting step: {str(e)}",
                        }
                    )

        return formatted_task
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error in admin_view_task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/admin/database/task/{task_id}")
async def admin_delete_task(task_id: str):
    """Delete a specific task from the database"""
    task = task_manager.db.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Add method to delete a task
    task_manager.db.delete_task(task_id)

    return {"status": "success", "message": f"Task {task_id} deleted successfully"}


@app.delete("/admin/database/clear")
async def admin_clear_database(confirm: bool = False):
    """Clear all tasks from the database (requires confirmation)"""
    if not confirm:
        return {
            "status": "warning",
            "message": "This will delete ALL tasks from the database. Set confirm=true to proceed.",
        }

    # Add method to clear all tasks
    task_count = task_manager.db.clear_all_tasks()

    # Clear the queues as well
    task_manager.queues = {}

    return {
        "status": "success",
        "message": f"Database cleared successfully. {task_count} tasks were deleted.",
    }


# Add a route to get database statistics
@app.get("/admin/database/stats")
async def admin_database_stats():
    """Get statistics about the database"""
    try:
        stats = task_manager.db.get_database_stats()
        return stats
    except Exception as e:
        print(f"Error getting database stats: {str(e)}")
        # Return default stats if there's an error
        return {
            "task_count": 0,
            "step_count": 0,
            "status_counts": {},
            "step_type_counts": {},
            "database_size_bytes": 0,
            "database_size_mb": 0,
            "most_recent_task": None,
            "oldest_task": None,
            "error": f"Error retrieving stats: {str(e)}",
        }


@app.get("/admin")
async def admin_dashboard(request: Request):
    """Redirect to the React frontend admin page"""
    return RedirectResponse(url="/")  # Redirect to the React frontend


@app.get("/config")
async def config_page():
    """Handle the config route for client-side routing"""
    return RedirectResponse(url="/")


# React Project Management Endpoints
@app.post("/workspace/{project_name}/react/start")
async def start_react_project(project_name: str, port: int = 3001):
    """Start a React project on the specified port"""
    import os
    import signal
    import socket
    import subprocess
    import time
    import traceback

    from app.tool.react_runner import ReactRunner

    try:
        print(f"Starting React project {project_name} on port {port}")

        # Check if the project exists
        project_path = Path(__file__).parent / "workspace" / project_name
        if not project_path.exists():
            print(f"Project {project_name} not found at {project_path}")
            return {
                "status": "error",
                "project": project_name,
                "message": f"Project {project_name} not found",
            }

        # Check if it's a React project (has package.json)
        package_json_path = project_path / "package.json"
        is_react_project = package_json_path.exists()

        if not is_react_project:
            print(f"No package.json found in project {project_name}")
            return {
                "status": "error",
                "project": project_name,
                "message": f"Project {project_name} is not a React project (no package.json found)",
            }

        # Check if package.json has a start script
        try:
            import json

            with open(package_json_path, "r") as f:
                package_data = json.load(f)

            if not package_data.get("scripts", {}).get("start"):
                print(
                    f"No 'start' script found in package.json for project {project_name}"
                )
                return {
                    "status": "error",
                    "project": project_name,
                    "message": f"Project {project_name} does not have a 'start' script in package.json",
                }
        except Exception as e:
            print(f"Error reading package.json: {str(e)}")
            # Continue anyway, as the ReactRunner will handle this error

        # Check if node_modules exists
        node_modules_path = project_path / "node_modules"
        if not node_modules_path.exists():
            print(f"No node_modules directory found in project {project_name}")
            # Try to run npm install directly
            try:
                print(f"Running npm install in {project_path}")
                npm_process = subprocess.run(
                    "npm install",
                    cwd=str(project_path),
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=120,  # 2 minute timeout
                )
                if npm_process.returncode != 0:
                    print(f"npm install failed: {npm_process.stderr}")
                    return {
                        "status": "error",
                        "project": project_name,
                        "message": f"Failed to install dependencies: {npm_process.stderr}",
                    }
                print("npm install completed successfully")
            except Exception as e:
                print(f"Error running npm install: {str(e)}")
                # Continue anyway, as the ReactRunner will try again

        # Check if the port is in use and try to free it
        def is_port_in_use(port):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("localhost", port)) == 0

        def kill_process_on_port(port):
            try:
                # On Windows, use netstat and taskkill
                if os.name == "nt":
                    try:
                        # Find process using netstat
                        netstat_output = subprocess.check_output(
                            f"netstat -ano | findstr :{port}", shell=True, text=True
                        )

                        # Extract PIDs from netstat output
                        import re

                        pid_matches = re.findall(
                            r"\s+(\d+)$", netstat_output, re.MULTILINE
                        )

                        if pid_matches:
                            for pid_str in pid_matches:
                                try:
                                    pid = int(pid_str)
                                    print(f"Killing process {pid} using port {port}")
                                    # Use taskkill to forcefully terminate the process and its children
                                    subprocess.run(
                                        f"taskkill /F /T /PID {pid}",
                                        shell=True,
                                        check=False,
                                    )
                                except ValueError:
                                    print(f"Invalid PID from netstat: {pid_str}")
                    except subprocess.CalledProcessError:
                        print(f"No processes found using port {port} through netstat")
                    except Exception as e:
                        print(f"Error using netstat/taskkill: {str(e)}")
                else:
                    # On Unix, use lsof and kill
                    try:
                        subprocess.run(
                            f"lsof -ti:{port} | xargs kill -9", shell=True, check=False
                        )
                    except Exception as e:
                        print(f"Error using lsof/kill: {str(e)}")
            except Exception as e:
                print(f"Error killing process on port {port}: {str(e)}")

        # Check if port is in use and try to free it
        if is_port_in_use(port):
            print(f"Port {port} is in use, attempting to free it")
            kill_process_on_port(port)
            time.sleep(2)  # Wait for the port to be freed

            # Check again
            if is_port_in_use(port):
                print(f"Port {port} is still in use after attempting to kill processes")
                # Try one more time with more aggressive methods
                kill_process_on_port(port)
                time.sleep(2)

                if is_port_in_use(port):
                    print(f"Port {port} could not be freed")
                    return {
                        "status": "error",
                        "project": project_name,
                        "message": f"Port {port} is in use by another process and could not be freed. Please try again later or use a different port.",
                    }

        # Use the ReactRunner tool to start the project with auto-stop after 10 seconds
        print(
            f"Using ReactRunner to start project {project_name} with auto-stop after 10 seconds"
        )
        react_runner = ReactRunner()
        result = await react_runner.execute(
            action="start", project_name=project_name, port=port, auto_stop_seconds=10
        )

        if hasattr(result, "error"):
            # This is a ToolFailure
            print(f"ReactRunner failed to start project {project_name}: {result.error}")
            return {"status": "error", "project": project_name, "message": result.error}

        # Verify the app is actually running
        time.sleep(5)  # Give it more time to start

        if not is_port_in_use(port):
            print(f"Port {port} is not in use after starting React app")
            return {
                "status": "error",
                "project": project_name,
                "message": f"React app started but is not listening on port {port}. Check for errors in the React app.",
            }

        # Try to access the React app to verify it's actually serving content
        try:
            import requests
            from requests.exceptions import RequestException

            # Try to access the React app with a timeout
            try:
                response = requests.get(f"http://localhost:{port}/", timeout=5)
                if response.status_code == 200:
                    print(f"React app is accessible at http://localhost:{port}/")
                else:
                    print(f"React app returned status code {response.status_code}")
            except RequestException as e:
                print(f"Could not access React app: {str(e)}")
                # Don't fail here, as some React apps might take longer to fully initialize
        except ImportError:
            print("Requests library not available, skipping accessibility check")

        # Return success response with absolute URL
        print(f"React project {project_name} started successfully on port {port}")
        return {
            "status": "success",
            "project": project_name,
            "port": port,
            "message": result.output,
            "url": f"http://localhost:{port}/",
        }
    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"Error starting React project: {str(e)}")
        print(f"Traceback: {error_traceback}")
        return {
            "status": "error",
            "project": project_name,
            "message": f"Error starting React project: {str(e)}",
            "traceback": error_traceback,
        }


@app.post("/workspace/{project_name}/react/stop")
async def stop_react_project(project_name: str):
    """Stop a running React project"""
    from app.tool.react_runner import ReactRunner

    try:
        # Check if the project exists
        project_path = Path(__file__).parent / "workspace" / project_name
        if not project_path.exists():
            return {
                "status": "error",
                "project": project_name,
                "message": f"Project {project_name} not found",
            }

        # Use the ReactRunner tool to stop the project
        react_runner = ReactRunner()
        result = await react_runner.execute(action="stop", project_name=project_name)

        if hasattr(result, "error"):
            # This is a ToolFailure
            return {"status": "error", "project": project_name, "message": result.error}

        # Return success response
        return {"status": "success", "project": project_name, "message": result.output}
    except Exception as e:
        print(f"Error stopping React project: {str(e)}")
        return {
            "status": "error",
            "project": project_name,
            "message": f"Error stopping React project: {str(e)}",
        }


@app.post("/react/stop-port")
async def stop_process_on_port(port: int = 3001):
    """Stop any process running on the specified port (default: 3001)"""
    import os
    import socket
    import subprocess
    import time

    try:
        print(f"Attempting to stop any process running on port {port}")

        # Check if the port is actually in use
        def is_port_in_use(port):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                return s.connect_ex(("localhost", port)) == 0

        if not is_port_in_use(port):
            print(f"Port {port} is not in use, nothing to stop")
            return {
                "status": "success",
                "message": f"No process found running on port {port}",
                "port": port,
                "was_running": False,
            }

        # Kill any process using the port
        def kill_process_on_port(port):
            try:
                # On Windows, use netstat and taskkill
                if os.name == "nt":
                    try:
                        # Find process using netstat
                        netstat_output = subprocess.check_output(
                            f"netstat -ano | findstr :{port}", shell=True, text=True
                        )

                        # Extract PIDs from netstat output
                        import re

                        pid_matches = re.findall(
                            r"\s+(\d+)$", netstat_output, re.MULTILINE
                        )

                        if pid_matches:
                            for pid_str in pid_matches:
                                try:
                                    pid = int(pid_str)
                                    print(f"Killing process {pid} using port {port}")
                                    # Use taskkill to forcefully terminate the process and its children
                                    subprocess.run(
                                        f"taskkill /F /T /PID {pid}",
                                        shell=True,
                                        check=False,
                                    )
                                except ValueError:
                                    print(f"Invalid PID from netstat: {pid_str}")
                    except subprocess.CalledProcessError:
                        print(f"No processes found using port {port} through netstat")
                    except Exception as e:
                        print(f"Error using netstat/taskkill: {str(e)}")
                else:
                    # On Unix, use lsof and kill
                    try:
                        subprocess.run(
                            f"lsof -ti:{port} | xargs kill -9", shell=True, check=False
                        )
                    except Exception as e:
                        print(f"Error using lsof/kill: {str(e)}")
            except Exception as e:
                print(f"Error killing process on port {port}: {str(e)}")

        # Try to kill the process
        kill_process_on_port(port)
        time.sleep(2)  # Wait for the port to be freed

        # Check if the port is now free
        if is_port_in_use(port):
            print(f"Port {port} is still in use after first attempt, trying again")
            # Try one more time with more aggressive methods
            kill_process_on_port(port)
            time.sleep(2)

            if is_port_in_use(port):
                print(f"Port {port} could not be freed after multiple attempts")
                return {
                    "status": "error",
                    "message": f"Failed to stop process on port {port} after multiple attempts",
                    "port": port,
                    "was_running": True,
                }

        # Success - port is now free
        print(f"Successfully stopped process on port {port}")
        return {
            "status": "success",
            "message": f"Successfully stopped process on port {port}",
            "port": port,
            "was_running": True,
        }
    except Exception as e:
        print(f"Error stopping process on port {port}: {str(e)}")
        return {
            "status": "error",
            "message": f"Error stopping process on port {port}: {str(e)}",
            "port": port,
        }


@app.get("/workspace/{project_name}/react/status")
async def get_react_project_status(project_name: str):
    """Get the status of a React project"""
    from app.tool.react_runner import ReactRunner

    try:
        # Check if the project exists
        project_path = Path(__file__).parent / "workspace" / project_name
        if not project_path.exists():
            return {
                "status": "error",
                "project": project_name,
                "is_running": False,
                "port": None,
                "message": f"Project {project_name} not found",
                "url": None,
            }

        # Check if it's a React project (has package.json)
        package_json_path = project_path / "package.json"
        is_react_project = package_json_path.exists()

        if not is_react_project:
            return {
                "status": "error",
                "project": project_name,
                "is_running": False,
                "port": None,
                "message": f"Project {project_name} is not a React project (no package.json found)",
                "url": None,
            }

        # Use the ReactRunner tool to get the project status
        react_runner = ReactRunner()
        result = await react_runner.execute(action="status", project_name=project_name)

        # Parse the output to determine if the project is running
        is_running = False
        port = None

        if hasattr(result, "output"):
            # Check if the output indicates the project is running
            is_running = "is running on port" in result.output

            # Extract the port from the output
            import re

            port_match = re.search(r"running on port (\d+)", result.output)
            if port_match:
                port = int(port_match.group(1))

                # Double-check that the port is actually in use
                import socket

                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.settimeout(1)
                        result = s.connect_ex(("localhost", port))
                        # If result is not 0, port is not in use
                        if result != 0:
                            print(
                                f"Port {port} is not in use despite React project status indicating it is running"
                            )
                            is_running = False
                            port = None
                except Exception as e:
                    print(f"Error checking if port {port} is in use: {str(e)}")
                    # Don't change is_running here, rely on the output parsing

        # Return the status
        return {
            "status": "success",
            "project": project_name,
            "is_running": is_running,
            "port": port,
            "message": result.output if hasattr(result, "output") else result.error,
            "url": f"http://localhost:{port}/" if port else None,
        }
    except Exception as e:
        print(f"Error getting React project status: {str(e)}")
        return {
            "status": "error",
            "project": project_name,
            "is_running": False,
            "port": None,
            "message": f"Error getting React project status: {str(e)}",
            "url": None,
        }


@app.delete("/workspace/{project_name}/delete")
async def delete_project(project_name: str):
    """Delete a project folder and all its contents"""
    # Use absolute path to ensure we're accessing the correct directory
    base_path = Path(__file__).parent / "workspace" / project_name

    print(f"Attempting to delete project: {project_name}")
    print(f"Looking for project at path: {base_path}")

    # Check if workspace directory exists
    workspace_path = Path(__file__).parent / "workspace"
    if not workspace_path.exists():
        print(f"Workspace directory does not exist: {workspace_path}")
        raise HTTPException(status_code=404, detail="Workspace directory not found")

    # List available projects for debugging
    available_projects = [d.name for d in workspace_path.iterdir() if d.is_dir()]
    print(f"Available projects: {available_projects}")

    if not base_path.exists():
        print(f"Project directory not found: {base_path}")
        raise HTTPException(status_code=404, detail=f"Project {project_name} not found")

    try:
        # Log the deletion for debugging
        print(f"Deleting project folder: {base_path}")

        # Check if a React app is running for this project and stop it
        from app.tool.react_runner import ReactRunner

        react_runner = ReactRunner()
        try:
            await react_runner.execute(action="stop", project_name=project_name)
            print(f"Stopped React app for project {project_name} if it was running")
        except Exception as e:
            print(
                f"Note: Failed to stop React app for project {project_name}: {str(e)}"
            )
            # Continue with deletion even if stopping the React app fails

        # Delete the directory and all its contents
        shutil.rmtree(base_path)

        print(f"Project {project_name} deleted successfully")
        return {
            "status": "success",
            "message": f"Project {project_name} deleted successfully",
        }
    except Exception as e:
        print(f"Error deleting project {project_name}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error deleting project {project_name}: {str(e)}"
        )
        print(f"Error checking React project status: {str(e)}")
        return {
            "status": "error",
            "project": project_name,
            "is_running": False,
            "port": None,
            "message": f"Error checking project status: {str(e)}",
            "url": None,
        }


import shutil


@app.delete("/workspace/{project_name}/delete")
async def delete_project(project_name: str):
    """Delete a project folder and all its contents"""
    # Use absolute path to ensure we're accessing the correct directory
    base_path = Path(__file__).parent / "workspace" / project_name

    if not base_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_name} not found")

    try:
        # Log the deletion for debugging
        print(f"Deleting project folder: {base_path}")

        # Check if a React app is running for this project and stop it
        from app.tool.react_runner import ReactRunner

        react_runner = ReactRunner()
        try:
            await react_runner.execute(action="stop", project_name=project_name)
            print(f"Stopped React app for project {project_name} if it was running")
        except Exception as e:
            print(
                f"Note: Failed to stop React app for project {project_name}: {str(e)}"
            )
            # Continue with deletion even if stopping the React app fails

        # Delete the directory and all its contents
        shutil.rmtree(base_path)

        print(f"Project {project_name} deleted successfully")
        return {
            "status": "success",
            "message": f"Project {project_name} deleted successfully",
        }
    except Exception as e:
        print(f"Error deleting project {project_name}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error deleting project {project_name}: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    # Always use port 8080
    port = 8080
    host = "localhost"
    config = {"host": host, "port": port}

    open_with_config = partial(open_local_browser, config)
    threading.Timer(3, open_with_config).start()
    uvicorn.run(app, host=host, port=port)
