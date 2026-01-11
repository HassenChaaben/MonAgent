from typing import Any, Callable, Optional

from pydantic import Field

from app.agent.toolcall import ToolCallAgent
from app.prompt.monagent import NEXT_STEP_PROMPT, SYSTEM_PROMPT
from app.tool import (
    Bash,
    CodeAnalyzer,
    CodebaseSearch,
    CodeDebugger,
    DockerDeploy,
    FileReader,
    JavaScriptExecute,
    MCPClient,
    MCPManager,
    NpmTool,
    PlanningTool,
    ReactRunner,
    StrReplaceEditor,
    Terminal,
    Terminate,
    TestGenerator,
    ToolCollection,
)
from app.tool.browser_use_tool import BrowserUseTool
from app.tool.file_finder import FileFinder
from app.tool.file_saver import FileSaver
from app.tool.GoInterpreter import GoInterpreter
from app.tool.JavaInterpreter import JavaInterpreter
from app.tool.python_execute import PythonExecute
from app.tool.web_search import WebSearch


class MonAgent(ToolCallAgent):
    """
    An expert AI code agent and software development assistant with advanced capabilities.

    This agent is designed to be a professional-level coding companion that can handle
    complex software development tasks with precision and expertise. It combines
    traditional development tools with advanced code analysis capabilities including:

    - Comprehensive codebase search and analysis
    - Advanced debugging and error detection
    - Code quality assessment and refactoring suggestions
    - Intelligent test generation and coverage analysis
    - Security vulnerability detection
    - Performance optimization recommendations
    - Architecture analysis and documentation generation

    The agent maintains conversation context and provides expert-level guidance
    while being approachable and educational in its communication style.
    """

    name: str = "MonAgent"
    description: str = (
        "An expert AI code agent that provides comprehensive software development assistance "
        "with advanced code analysis, debugging, testing, and optimization capabilities"
    )
    project_name: str = ""  # Project name for organizing files

    # Streaming callback for real-time updates
    stream_callback: Optional[Callable[[str, str], None]] = None

    def model_post_init(self, __context) -> None:
        """Initialize project workspace after model creation"""
        super().model_post_init(__context)
        if self.project_name and self.project_name.strip():
            from app.config import get_project_folder

            workspace_path = get_project_folder(self.project_name)
            print(f"MonAgent initialized with project workspace: {workspace_path}")

            # Set the workspace path for all tools that need it
            for tool in self.available_tools.tools:
                if hasattr(tool, "set_workspace"):
                    tool.set_workspace(str(workspace_path))
                elif hasattr(tool, "workspace_path"):
                    tool.workspace_path = str(workspace_path)

    system_prompt: str = SYSTEM_PROMPT
    next_step_prompt: str = NEXT_STEP_PROMPT

    max_observe: int = 10000
    max_steps: int = 15

    # Add general-purpose tools to the tool collection
    available_tools: ToolCollection = Field(
        default_factory=lambda: ToolCollection(
            # Core tools
            PythonExecute(),
            FileSaver(),
            FileReader(),
            FileFinder(),
            Terminate(),
            # Code analysis and development tools
            CodebaseSearch(),
            CodeDebugger(),
            CodeAnalyzer(),
            TestGenerator(),
            # MCP (Model Context Protocol) external tools
            MCPClient(),
            MCPManager(),
            # Language interpreters
            GoInterpreter(),
            JavaInterpreter(),
            # Search tools
            # WebSearch(),
            # Browser tools
            # BrowserUseTool(),
            # Development tools
            Bash(),
            DockerDeploy(),
            JavaScriptExecute(),
            NpmTool(),
            PlanningTool(),
            ReactRunner(),
            StrReplaceEditor(),
            Terminal(),
        )
    )

    async def think(self) -> bool:
        """Override think method to add streaming support"""
        # Stream thinking process
        if self.stream_callback:
            await self.stream_callback(
                "think", "🤔 Analyzing the request and planning next steps..."
            )

        # Call parent think method
        result = await super().think()

        # Stream the thought process result
        if self.stream_callback and self.messages:
            last_message = self.messages[-1]
            if last_message.role == "assistant" and last_message.content:
                await self.stream_callback(
                    "think", f"✨ {self.name}'s thoughts: {last_message.content}"
                )

        return result

    async def act(self) -> str:
        """Override act method to add streaming support"""
        # Stream action start
        if self.stream_callback and self.tool_calls:
            tool_names = [call.function.name for call in self.tool_calls]
            await self.stream_callback(
                "tool",
                f"🛠️ {self.name} selected {len(tool_names)} tools to use: {', '.join(tool_names)}",
            )

        # Call parent act method
        result = await super().act()

        # Stream action result
        if self.stream_callback:
            await self.stream_callback(
                "act", f"🎯 Tools completed their mission! Result: {result}"
            )

        return result

    async def _handle_special_tool(self, name: str, result: Any, **kwargs):
        if not self._is_special_tool(name):
            return
        else:
            browser_tool = self.available_tools.get_tool(BrowserUseTool().name)
            if browser_tool:
                await browser_tool.cleanup()
            await super()._handle_special_tool(name, result, **kwargs)
