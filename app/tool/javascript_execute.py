import asyncio
import os
import tempfile
from typing import Dict

from app.tool.base import BaseTool
from app.tool.run import run


class JavaScriptExecute(BaseTool):
    """A tool for executing JavaScript code with timeout and safety restrictions."""

    name: str = "javascript_execute"
    description: str = "Executes JavaScript code string using Node.js. Note: Only console.log outputs are visible, function return values are not captured. Use console.log statements to see results."
    parameters: dict = {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "The JavaScript code to execute.",
            },
            "timeout": {
                "type": "integer",
                "description": "Execution timeout in seconds (default: 5).",
                "default": 5,
            },
        },
        "required": ["code"],
    }

    async def execute(
        self,
        code: str,
        timeout: int = 5,
    ) -> Dict:
        """
        Executes the provided JavaScript code with a timeout.

        Args:
            code (str): The JavaScript code to execute.
            timeout (int): Execution timeout in seconds.

        Returns:
            Dict: Contains 'observation' with execution output or error message and 'success' status.
        """
        # Create a temporary file to store the JavaScript code
        with tempfile.NamedTemporaryFile(suffix=".js", delete=False, mode="w") as temp_file:
            temp_file_path = temp_file.name
            temp_file.write(code)

        try:
            # Execute the JavaScript code using Node.js
            cmd = f"node {temp_file_path}"
            returncode, stdout, stderr = await run(cmd, timeout=timeout)

            if returncode == 0:
                return {
                    "observation": stdout,
                    "success": True,
                }
            else:
                return {
                    "observation": f"Error: {stderr}",
                    "success": False,
                }
        except TimeoutError:
            return {
                "observation": f"Execution timeout after {timeout} seconds",
                "success": False,
            }
        finally:
            # Clean up the temporary file
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass
