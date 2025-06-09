import asyncio
import json
import time
from typing import Any, List, Optional, Union

from pydantic import Field

from app.agent.react import ReActAgent
from app.exceptions import TokenLimitExceeded
from app.logger import logger
from app.prompt.toolcall import NEXT_STEP_PROMPT, SYSTEM_PROMPT
from app.schema import TOOL_CHOICE_TYPE, AgentState, Message, ToolCall, ToolChoice
from app.tool import Terminate, ToolCollection

TOOL_CALL_REQUIRED = "Tool calls required but none provided"


class ToolCallAgent(ReActAgent):
    """Base agent class for handling tool/function calls with enhanced abstraction"""

    name: str = "toolcall"
    description: str = "an agent that can execute tool calls."

    system_prompt: str = SYSTEM_PROMPT
    next_step_prompt: str = NEXT_STEP_PROMPT

    available_tools: ToolCollection = ToolCollection(Terminate())
    tool_choices: TOOL_CHOICE_TYPE = ToolChoice.AUTO  # type: ignore
    special_tool_names: List[str] = Field(default_factory=lambda: [Terminate().name])

    tool_calls: List[ToolCall] = Field(default_factory=list)

    max_steps: int = 30
    max_observe: Optional[Union[int, bool]] = None

    # Cache for system prompt messages to avoid recreating them
    _system_prompt_cache = {}

    async def think(self) -> bool:
        """Process current state and decide next actions using tools with optimized performance"""
        start_time = time.time()

        if self.next_step_prompt:
            user_msg = Message.user_message(self.next_step_prompt)
            self.messages += [user_msg]

        try:
            # Get system messages from cache or create them
            system_msgs = None
            if self.system_prompt:
                cache_key = hash(self.system_prompt)
                if cache_key in self._system_prompt_cache:
                    system_msgs = self._system_prompt_cache[cache_key]
                else:
                    system_msgs = [Message.system_message(self.system_prompt)]
                    self._system_prompt_cache[cache_key] = system_msgs

            # Get tool parameters - this could be cached if tools don't change frequently
            tool_params = self.available_tools.to_params()

            # Get response with tool options
            response = await self.llm.ask_tool(
                messages=self.messages,
                system_msgs=system_msgs,
                tools=tool_params,
                tool_choice=self.tool_choices,
            )
        except ValueError:
            raise
        except Exception as e:
            # Check if this is a RetryError containing TokenLimitExceeded
            if hasattr(e, "__cause__") and isinstance(e.__cause__, TokenLimitExceeded):
                token_limit_error = e.__cause__
                logger.error(
                    f"Token limit error (from RetryError): {token_limit_error}"
                )
                self.memory.add_message(
                    Message.assistant_message(
                        f"Maximum token limit reached, cannot continue execution: {str(token_limit_error)}"
                    )
                )
                self.state = AgentState.FINISHED
                return False
            raise

        self.tool_calls = response.tool_calls
        has_tool_calls = bool(response.tool_calls)
        tool_call_count = len(response.tool_calls) if has_tool_calls else 0

        # Log response info with less emoji for better performance
        logger.debug(f"{self.name}'s thoughts: {response.content}")
        logger.debug(f"{self.name} selected {tool_call_count} tools to use")

        if has_tool_calls:
            logger.debug(
                f"Tools being prepared: {[call.function.name for call in response.tool_calls]}"
            )

        try:
            # Handle different tool_choices modes
            if self.tool_choices == ToolChoice.NONE:
                if has_tool_calls:
                    logger.warning(
                        f"{self.name} tried to use tools when they weren't available!"
                    )
                if response.content:
                    self.memory.add_message(Message.assistant_message(response.content))
                    return True
                return False

            # Create and add assistant message - optimize message creation
            if has_tool_calls:
                assistant_msg = Message.from_tool_calls(
                    content=response.content, tool_calls=self.tool_calls
                )
            else:
                assistant_msg = Message.assistant_message(response.content)

            self.memory.add_message(assistant_msg)

            if self.tool_choices == ToolChoice.REQUIRED and not has_tool_calls:
                return True  # Will be handled in act()

            # For 'auto' mode, continue with content if no commands but content exists
            if self.tool_choices == ToolChoice.AUTO and not has_tool_calls:
                return bool(response.content)

            execution_time = time.time() - start_time
            logger.debug(f"Think method execution time: {execution_time:.2f}s")
            return has_tool_calls

        except Exception as e:
            logger.error(f"Error in {self.name}'s thinking process: {e}")
            self.memory.add_message(
                Message.assistant_message(
                    f"Error encountered while processing: {str(e)}"
                )
            )
            return False

    async def act(self) -> str:
        """Execute tool calls and handle their results with optimized performance"""
        start_time = time.time()

        if not self.tool_calls:
            if self.tool_choices == ToolChoice.REQUIRED:
                raise ValueError(TOOL_CALL_REQUIRED)

            # Return last message content if no tool calls
            return self.messages[-1].content or "No content or commands to execute"

        # Prepare for concurrent execution where possible
        results = []
        concurrent_tools = ["file_reader", "web_search", "planning_tool"]
        sequential_commands = []
        concurrent_commands = []

        # Separate tools that can be run concurrently from those that must be sequential
        for command in self.tool_calls:
            if command.function.name in concurrent_tools:
                concurrent_commands.append(command)
            else:
                sequential_commands.append(command)

        # Execute concurrent tools in parallel
        if concurrent_commands:
            concurrent_results = await asyncio.gather(
                *[self.execute_tool(cmd) for cmd in concurrent_commands]
            )

            # Process results from concurrent execution
            for i, result in enumerate(concurrent_results):
                command = concurrent_commands[i]

                if self.max_observe:
                    result = result[: self.max_observe]

                logger.debug(
                    f"Tool '{command.function.name}' completed (concurrent). Result length: {len(str(result))}"
                )

                # Add tool response to memory
                tool_msg = Message.tool_message(
                    content=result, tool_call_id=command.id, name=command.function.name
                )
                self.memory.add_message(tool_msg)
                results.append(result)

        # Execute sequential tools one by one
        for command in sequential_commands:
            result = await self.execute_tool(command)

            if self.max_observe:
                result = result[: self.max_observe]

            logger.debug(
                f"Tool '{command.function.name}' completed (sequential). Result length: {len(str(result))}"
            )

            # Add tool response to memory
            tool_msg = Message.tool_message(
                content=result, tool_call_id=command.id, name=command.function.name
            )
            self.memory.add_message(tool_msg)
            results.append(result)

        execution_time = time.time() - start_time
        logger.debug(f"Act method execution time: {execution_time:.2f}s")

        return "\n\n".join(results)

    # Cache for tool execution results to avoid redundant processing
    _tool_execution_cache = {}
    _max_tool_cache_size = 100

    async def execute_tool(self, command: ToolCall) -> str:
        """Execute a single tool call with robust error handling and caching"""
        if not command or not command.function or not command.function.name:
            return "Error: Invalid command format"

        name = command.function.name
        if name not in self.available_tools.tool_map:
            return f"Error: Unknown tool '{name}'"

        try:
            # Parse arguments
            args = json.loads(command.function.arguments or "{}")

            # Add project_name to file tools if it exists on the agent
            if hasattr(self, "project_name") and self.project_name:
                # Only add project_name to file-related tools
                if name in ["file_saver", "file_reader"]:
                    logger.debug(
                        f"Adding project_name '{self.project_name}' to tool '{name}'"
                    )
                    args["project_name"] = self.project_name

            # Create a cache key for this tool execution
            # Only cache for tools that are safe to cache (read-only operations)
            cacheable_tools = ["file_reader", "web_search", "planning_tool"]

            if name in cacheable_tools:
                # Create a cache key based on tool name and arguments
                cache_key = (name, hash(str(args)))

                # Check if we have already executed this tool with these arguments
                if cache_key in self._tool_execution_cache:
                    # Reuse the cached result
                    result = self._tool_execution_cache[cache_key]
                    logger.debug(f"Using cached result for tool '{name}'")

                    # Format result for display
                    observation = (
                        f"Observed output of cmd `{name}` executed (cached):\n{str(result)}"
                        if result
                        else f"Cmd `{name}` completed with no output (cached)"
                    )

                    return observation

            # Execute the tool
            logger.info(f"Activating tool: '{name}'...")

            # Stream tool execution start if streaming callback is available
            if hasattr(self, "stream_callback") and self.stream_callback:
                await self.stream_callback("tool", f"🔧 Executing tool: {name}")

            start_time = time.time()
            result = await self.available_tools.execute(name=name, tool_input=args)
            execution_time = time.time() - start_time
            logger.debug(f"Tool '{name}' execution time: {execution_time:.2f}s")

            # Stream tool execution result if streaming callback is available
            if hasattr(self, "stream_callback") and self.stream_callback:
                result_preview = (
                    str(result)[:200] + "..." if len(str(result)) > 200 else str(result)
                )
                await self.stream_callback(
                    "tool", f"✅ Tool {name} completed: {result_preview}"
                )

            # Cache the result for read-only tools
            if name in cacheable_tools:
                # Manage cache size
                if len(self._tool_execution_cache) >= self._max_tool_cache_size:
                    # Remove a random item to keep cache size in check
                    self._tool_execution_cache.pop(
                        next(iter(self._tool_execution_cache))
                    )

                # Store the result in cache
                self._tool_execution_cache[cache_key] = result

            # Format result for display
            observation = (
                f"Observed output of cmd `{name}` executed:\n{str(result)}"
                if result
                else f"Cmd `{name}` completed with no output"
            )

            # Handle special tools like `finish`
            await self._handle_special_tool(name=name, result=result)

            return observation
        except json.JSONDecodeError:
            error_msg = f"Error parsing arguments for {name}: Invalid JSON format"
            logger.error(
                f"The arguments for '{name}' don't make sense - invalid JSON, arguments:{command.function.arguments}"
            )
            return f"Error: {error_msg}"
        except Exception as e:
            error_msg = f"Tool '{name}' encountered a problem: {str(e)}"
            logger.error(error_msg)
            return f"Error: {error_msg}"

    async def _handle_special_tool(self, name: str, result: Any, **kwargs):
        """Handle special tool execution and state changes"""
        if not self._is_special_tool(name):
            return

        if self._should_finish_execution(name=name, result=result, **kwargs):
            # Set agent state to finished
            logger.info(f"🏁 Special tool '{name}' has completed the task!")
            self.state = AgentState.FINISHED

    @staticmethod
    def _should_finish_execution(**_) -> bool:
        """Determine if tool execution should finish the agent"""
        return True

    def _is_special_tool(self, name: str) -> bool:
        """Check if tool name is in special tools list"""
        return name.lower() in [n.lower() for n in self.special_tool_names]
