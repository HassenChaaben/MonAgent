import os
import re
import subprocess
import sys
import tempfile
from typing import Any, Dict

if __name__ == "__main__":  # if running as a script for individual testing
    sys.path.append(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    )

from app.tool.base import BaseTool


class GoInterpreter(BaseTool):
    """
    This class is a tool to allow execution of Go code.
    """

    name: str = "go_interpreter"
    description: str = "This tool allows you to execute Go code."
    parameters: dict = {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "The Go code to execute",
            }
        },
        "required": ["code"],
    }

    def execute(self, code: str, safety: bool = False) -> str:
        """
        Execute Go code by compiling and running it.
        Args:
            code: The Go code to execute
            safety: Whether to ask for confirmation before executing
        Returns:
            str: The output from executing the code
        """
        if safety and input("Execute code? y/n ") != "y":
            return "Code rejected by user."

        with tempfile.TemporaryDirectory() as tmpdirname:
            source_file = os.path.join(tmpdirname, "temp.go")
            exec_file = os.path.join(tmpdirname, "temp")
            with open(source_file, "w") as f:
                f.write(code)

            try:
                env = os.environ.copy()
                env["GO111MODULE"] = "off"
                compile_command = ["go", "build", "-o", exec_file, source_file]
                compile_result = subprocess.run(
                    compile_command, capture_output=True, text=True, timeout=10, env=env
                )

                if compile_result.returncode != 0:
                    return f"Compilation failed: {compile_result.stderr}"

                run_command = [exec_file]
                run_result = subprocess.run(
                    run_command, capture_output=True, text=True, timeout=10
                )

                if run_result.returncode != 0:
                    return f"Execution failed: {run_result.stderr}"
                output = run_result.stdout

            except subprocess.TimeoutExpired as e:
                return f"Execution timed out: {str(e)}"
            except FileNotFoundError:
                return "Error: 'go' not found. Ensure Go is installed and in PATH."
            except Exception as e:
                return f"Code execution failed: {str(e)}"

            return output

    def _check_execution_failure(self, output: str) -> bool:
        """
        Check if the code execution failed.
        """
        error_patterns = [
            r"error",
            r"failed",
            r"traceback",
            r"invalid",
            r"exception",
            r"syntax",
            r"panic",
            r"undefined",
            r"cannot",
        ]
        combined_pattern = "|".join(error_patterns)
        return bool(re.search(combined_pattern, output, re.IGNORECASE))

    def execution_failure_check(self, output: str) -> bool:
        """
        Check if the execution failed. Required interface method.
        Args:
            output: The output from code execution
        Returns:
            bool: True if execution failed, False otherwise
        """
        return self._check_execution_failure(output)

    def interpreter_feedback(self, output: str) -> str:
        """
        Provide feedback based on the output of the code execution.
        Args:
            output: The output from code execution
        Returns:
            str: Formatted feedback string
        """
        if self._check_execution_failure(output):
            return f"[failure] Error in execution:\n{output}"
        return "[success] Execution success, code output:\n" + output


if __name__ == "__main__":
    codes = """
package main
import "fmt"

func hello() {
    fmt.Println("Hello, World!")
}

func main() {
    hello()
}
"""
    g = GoInterpreter()
    print(g.execute(codes))
