from pathlib import Path

import aiofiles

from app.config import WORKSPACE_ROOT, get_project_folder
from app.tool.base import BaseTool


class FileReader(BaseTool):
    name: str = "file_reader"
    description: str = """Read content from a local file at a specified path.
Use this tool when you need to read text, code, or content from a file on the local filesystem.
The tool accepts a file path and returns the content of that file.
Files can be organized by project - if a project name is specified, the file will be read from a folder with that name.
"""
    parameters: dict = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "(required) The path of the file to read, including filename and extension.",
            },
            "encoding": {
                "type": "string",
                "description": "(optional) The encoding to use when reading the file. Default is 'utf-8'.",
                "default": "utf-8",
            },
            "max_length": {
                "type": "integer",
                "description": "(optional) Maximum number of characters to read. Default is 100000.",
                "default": 100000,
            },
            "project_name": {
                "type": "string",
                "description": "(optional) The name of the project to read the file from. If provided, the file will be read from the project folder.",
            },
        },
        "required": ["file_path"],
    }

    async def execute(
        self,
        file_path: str,
        encoding: str = "utf-8",
        max_length: int = 100000,
        project_name: str = None,
    ) -> str:
        """
        Read content from a file at the specified path.

        Args:
            file_path (str): The path of the file to read.
            encoding (str, optional): The encoding to use when reading the file. Default is 'utf-8'.
            max_length (int, optional): Maximum number of characters to read. Default is 100000.
            project_name (str, optional): The name of the project to read the file from. If None, uses the workspace root.

        Returns:
            str: The content of the file or an error message.
        """
        try:
            # Get the base folder (project folder or workspace root)
            base_folder = get_project_folder(project_name)

            # Convert file_path to Path object
            path_obj = Path(file_path)

            # Resolve the file path
            if path_obj.is_absolute():
                full_path = path_obj
                # Check if the file is outside the workspace
                workspace_root_str = str(WORKSPACE_ROOT)
                if not str(full_path).startswith(workspace_root_str):
                    # For security, only allow reading files within the workspace
                    file_name = path_obj.name
                    full_path = base_folder / file_name
            else:
                full_path = base_folder / file_path

            # Check if the file exists
            if not full_path.exists():
                return f"Error: File not found at {full_path}"

            # Read the file
            async with aiofiles.open(str(full_path), "r", encoding=encoding) as file:
                content = await file.read(max_length)

                # Check if the file was truncated
                if len(content) >= max_length:
                    content += (
                        f"\n\n[Note: File content truncated at {max_length} characters]"
                    )

                return content
        except UnicodeDecodeError:
            return f"Error: Could not decode file with encoding '{encoding}'. The file might be binary or use a different encoding."
        except Exception as e:
            return f"Error reading file: {str(e)}"
