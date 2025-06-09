"""Collection classes for managing multiple tools with performance optimizations."""

import time
from typing import Any, Dict, List, Optional

from app.exceptions import ToolError
from app.logger import logger
from app.tool.base import BaseTool, ToolFailure, ToolResult


class ToolCollection:
    """A collection of defined tools with performance optimizations."""

    def __init__(self, *tools: BaseTool):
        self.tools = tools
        self.tool_map = {tool.name: tool for tool in tools}
        # Cache for tool parameters to avoid redundant conversions
        self._params_cache: Optional[List[Dict[str, Any]]] = None
        self._cache_valid = False
        # Cache for tool execution results
        self._execution_cache = {}
        self._max_cache_size = 100
        # Performance metrics
        self._execution_times = {}

    def __iter__(self):
        return iter(self.tools)

    def to_params(self) -> List[Dict[str, Any]]:
        """Convert tools to parameters with caching for better performance"""
        if self._params_cache is not None and self._cache_valid:
            return self._params_cache

        # Generate and cache the result
        self._params_cache = [tool.to_param() for tool in self.tools]
        self._cache_valid = True
        return self._params_cache

    async def execute(
        self, *, name: str, tool_input: Dict[str, Any] = None
    ) -> ToolResult:
        """Execute a tool with performance tracking and caching for read-only tools"""
        tool = self.tool_map.get(name)
        if not tool:
            return ToolFailure(error=f"Tool {name} is invalid")

        # Create default empty dict for tool_input if None
        if tool_input is None:
            tool_input = {}

        # Special handling for str_replace_editor to ensure required parameters are present
        if name == "str_replace_editor":
            # Log the tool input for debugging
            logger.debug(f"str_replace_editor tool input: {tool_input}")

            # Check if 'command' parameter is missing
            if "command" not in tool_input:
                logger.error(f"Tool '{name}' missing required 'command' parameter")
                return ToolFailure(error=f"Tool '{name}' requires 'command' parameter")

            # Check if 'path' parameter is missing
            if "path" not in tool_input:
                logger.error(f"Tool '{name}' missing required 'path' parameter")
                return ToolFailure(error=f"Tool '{name}' requires 'path' parameter")

            # Additional validation for specific commands
            if (
                tool_input.get("command") == "str_replace"
                and "old_str" not in tool_input
            ):
                logger.error(
                    f"Tool '{name}' with command 'str_replace' missing required 'old_str' parameter"
                )
                return ToolFailure(
                    error=f"Tool '{name}' with command 'str_replace' requires 'old_str' parameter"
                )

            if (
                tool_input.get("command") == "insert"
                and "insert_line" not in tool_input
            ):
                logger.error(
                    f"Tool '{name}' with command 'insert' missing required 'insert_line' parameter"
                )
                return ToolFailure(
                    error=f"Tool '{name}' with command 'insert' requires 'insert_line' parameter"
                )

            if tool_input.get("command") == "insert" and "new_str" not in tool_input:
                logger.error(
                    f"Tool '{name}' with command 'insert' missing required 'new_str' parameter"
                )
                return ToolFailure(
                    error=f"Tool '{name}' with command 'insert' requires 'new_str' parameter"
                )

            if tool_input.get("command") == "create" and "file_text" not in tool_input:
                logger.error(
                    f"Tool '{name}' with command 'create' missing required 'file_text' parameter"
                )
                return ToolFailure(
                    error=f"Tool '{name}' with command 'create' requires 'file_text' parameter"
                )

        # Check if this is a read-only tool that can be cached
        read_only_tools = ["file_reader", "web_search", "planning_tool"]
        can_cache = name in read_only_tools

        if can_cache:
            # Create a cache key based on tool name and arguments
            cache_key = (name, hash(str(tool_input)))

            # Check if we have already executed this tool with these arguments
            if cache_key in self._execution_cache:
                return self._execution_cache[cache_key]

        try:
            # Track execution time
            start_time = time.time()

            # Log the tool execution
            logger.debug(f"Executing tool '{name}' with parameters: {tool_input}")

            try:
                # Execute the tool
                result = await tool(**tool_input)

                # Record execution time
                execution_time = time.time() - start_time
                self._update_execution_metrics(name, execution_time)

                logger.debug(
                    f"Tool '{name}' executed successfully in {execution_time:.2f}s"
                )
            except Exception as e:
                logger.error(f"Error executing tool '{name}': {str(e)}")
                raise

            # Cache the result for read-only tools
            if can_cache:
                # Manage cache size
                if len(self._execution_cache) >= self._max_cache_size:
                    # Remove a random item to keep cache size in check
                    self._execution_cache.pop(next(iter(self._execution_cache)))

                # Store the result in cache
                self._execution_cache[cache_key] = result

            return result
        except ToolError as e:
            return ToolFailure(error=e.message)

    async def execute_all(self) -> List[ToolResult]:
        """Execute all tools in the collection with parallel execution where possible."""
        # Separate tools into those that can run concurrently and those that must be sequential
        concurrent_tools = []
        sequential_tools = []

        for tool in self.tools:
            # Tools that are safe to run concurrently (read-only operations)
            if tool.name in ["file_reader", "web_search", "planning_tool"]:
                concurrent_tools.append(tool)
            else:
                sequential_tools.append(tool)

        results = []

        # Execute concurrent tools in parallel
        if concurrent_tools:
            import asyncio

            concurrent_results = await asyncio.gather(
                *[self._execute_tool_with_metrics(tool) for tool in concurrent_tools]
            )
            results.extend(concurrent_results)

        # Execute sequential tools one by one
        for tool in sequential_tools:
            result = await self._execute_tool_with_metrics(tool)
            results.append(result)

        return results

    async def _execute_tool_with_metrics(self, tool: BaseTool) -> ToolResult:
        """Execute a tool and track performance metrics"""
        try:
            start_time = time.time()
            result = await tool()
            execution_time = time.time() - start_time
            self._update_execution_metrics(tool.name, execution_time)
            return result
        except ToolError as e:
            return ToolFailure(error=e.message)

    def _update_execution_metrics(self, tool_name: str, execution_time: float) -> None:
        """Update performance metrics for a tool"""
        if tool_name not in self._execution_times:
            self._execution_times[tool_name] = []

        # Keep only the last 10 execution times to avoid memory growth
        times = self._execution_times[tool_name]
        times.append(execution_time)
        if len(times) > 10:
            times.pop(0)

    def get_tool(self, name: str) -> BaseTool:
        """Get a tool by name"""
        return self.tool_map.get(name)

    def get_tool_performance(self, name: str = None) -> Dict[str, Dict[str, float]]:
        """Get performance metrics for tools"""
        metrics = {}

        # If a specific tool is requested
        if name is not None:
            if name in self._execution_times:
                times = self._execution_times[name]
                if times:
                    metrics[name] = {
                        "avg": sum(times) / len(times),
                        "min": min(times),
                        "max": max(times),
                        "last": times[-1],
                    }
            return metrics

        # Get metrics for all tools
        for tool_name, times in self._execution_times.items():
            if times:
                metrics[tool_name] = {
                    "avg": sum(times) / len(times),
                    "min": min(times),
                    "max": max(times),
                    "last": times[-1],
                }

        return metrics

    def add_tool(self, tool: BaseTool):
        """Add a tool to the collection"""
        self.tools += (tool,)
        self.tool_map[tool.name] = tool
        # Invalidate cache when adding a tool
        self._cache_valid = False
        return self

    def add_tools(self, *tools: BaseTool):
        """Add multiple tools to the collection"""
        for tool in tools:
            self.add_tool(tool)
        return self
