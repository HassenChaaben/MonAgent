from pathlib import Path

import aiofiles

from app.config import get_project_folder
from app.tool.base import BaseTool


class FileSaver(BaseTool):
    name: str = "file_saver"
    description: str = """Save content to a local file at a specified path.
Use this tool when you need to save text, code, or generated content to a file on the local filesystem.
The tool accepts content and a file path, and saves the content to that location.
Files can be organized by project - if a project name is specified, the file will be saved in a folder with that name.
"""
    parameters: dict = {
        "type": "object",
        "properties": {
            "content": {
                "type": "string",
                "description": "(required) The content to save to the file.",
            },
            "file_path": {
                "type": "string",
                "description": "(required) The path where the file should be saved, including filename and extension.",
            },
            "mode": {
                "type": "string",
                "description": "(optional) The file opening mode. Default is 'w' for write. Use 'a' for append.",
                "enum": ["w", "a"],
                "default": "w",
            },
            "project_name": {
                "type": "string",
                "description": "(optional) The name of the project to save the file in. If provided, the file will be saved in the project folder.",
            },
        },
        "required": ["content", "file_path"],
    }

    async def execute(
        self, content: str, file_path: str, mode: str = "w", project_name: str = None
    ) -> str:
        """
        Save content to a file at the specified path.

        Args:
            content (str): The content to save to the file.
            file_path (str): The path where the file should be saved.
            mode (str, optional): The file opening mode. Default is 'w' for write. Use 'a' for append.
            project_name (str, optional): The name of the project to save the file in. If None, uses the workspace root.

        Returns:
            str: A message indicating the result of the operation.
        """
        try:
            # Get the base folder (project folder or workspace root)
            base_folder = get_project_folder(project_name)

            # Convert to Path objects for better path handling
            path_obj = Path(file_path)

            # Place the generated file in the appropriate directory
            if path_obj.is_absolute():
                file_name = path_obj.name
                full_path = base_folder / file_name
            else:
                full_path = base_folder / file_path

            # Ensure the directory exists
            directory = full_path.parent
            if directory and not directory.exists():
                directory.mkdir(parents=True, exist_ok=True)

            # Write directly to the file
            async with aiofiles.open(str(full_path), mode, encoding="utf-8") as file:
                await file.write(content)

            return f"Content successfully saved to {full_path}"
        except Exception as e:
            return f"Error saving file: {str(e)}"
