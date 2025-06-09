from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator

from app.llm import LLM
from app.logger import logger
from app.schema import ROLE_TYPE, AgentState, Memory, Message


class BaseAgent(BaseModel, ABC):
    """Abstract base class for managing agent state and execution.

    Provides foundational functionality for state transitions, memory management,
    and a step-based execution loop. Subclasses must implement the `step` method.
    """

    # Core attributes
    name: str = Field(..., description="Unique name of the agent")
    description: Optional[str] = Field(None, description="Optional agent description")

    # Prompts
    system_prompt: Optional[str] = Field(
        None, description="System-level instruction prompt"
    )
    next_step_prompt: Optional[str] = Field(
        None, description="Prompt for determining next action"
    )

    # Dependencies
    llm: LLM = Field(default_factory=LLM, description="Language model instance")
    memory: Memory = Field(default_factory=Memory, description="Agent's memory store")
    state: AgentState = Field(
        default=AgentState.IDLE, description="Current agent state"
    )

    # Execution control
    max_steps: int = Field(default=10, description="Maximum steps before termination")
    current_step: int = Field(default=0, description="Current step in execution")

    duplicate_threshold: int = 2

    class Config:
        arbitrary_types_allowed = True
        extra = "allow"  # Allow extra fields for flexibility in subclasses

    @model_validator(mode="after")
    def initialize_agent(self) -> "BaseAgent":
        """Initialize agent with default settings if not provided."""
        if self.llm is None or not isinstance(self.llm, LLM):
            self.llm = LLM(config_name=self.name.lower())
        if not isinstance(self.memory, Memory):
            self.memory = Memory()
        return self

    @asynccontextmanager
    async def state_context(self, new_state: AgentState):
        """Context manager for safe agent state transitions.

        Args:
            new_state: The state to transition to during the context.

        Yields:
            None: Allows execution within the new state.

        Raises:
            ValueError: If the new_state is invalid.
        """
        if not isinstance(new_state, AgentState):
            raise ValueError(f"Invalid state: {new_state}")

        previous_state = self.state
        self.state = new_state
        try:
            yield
        except Exception as e:
            self.state = AgentState.ERROR  # Transition to ERROR on failure
            raise e
        finally:
            self.state = previous_state  # Revert to previous state

    def update_memory(
        self,
        role: ROLE_TYPE,  # type: ignore
        content: str,
        **kwargs,
    ) -> None:
        """Add a message to the agent's memory.

        Args:
            role: The role of the message sender (user, system, assistant, tool).
            content: The message content.
            **kwargs: Additional arguments (e.g., tool_call_id for tool messages).

        Raises:
            ValueError: If the role is unsupported.
        """
        message_map = {
            "user": Message.user_message,
            "system": Message.system_message,
            "assistant": Message.assistant_message,
            "tool": lambda content, **kw: Message.tool_message(content, **kw),
        }

        if role not in message_map:
            raise ValueError(f"Unsupported message role: {role}")

        msg_factory = message_map[role]
        msg = msg_factory(content, **kwargs) if role == "tool" else msg_factory(content)
        self.memory.add_message(msg)

    # Cache for conversation analysis to avoid redundant processing
    _conversation_analysis_cache = {}
    _max_analysis_cache_size = 50

    async def analyze_conversation_history(self) -> None:
        """Analyze the conversation history to ensure context continuity.

        This method is called before processing a new request to ensure the agent
        has properly analyzed and understood the conversation history.
        """
        try:
            # Quick checks to avoid unnecessary processing
            if len(self.memory.messages) <= 1:
                logger.debug("No conversation history to analyze")
                return

            if not self.memory.needs_context_analysis():
                logger.debug("Context already analyzed or not needed")
                return

            # Create a cache key based on message identities
            cache_key = tuple(
                (msg.role, hash(msg.content or "")) for msg in self.memory.messages
            )

            # Check if we have already analyzed this conversation state
            if cache_key in self._conversation_analysis_cache:
                # Reuse the cached analysis result
                context_summary = self._conversation_analysis_cache[cache_key]
                self.update_memory("system", context_summary)
                self.memory.mark_context_analyzed()
                logger.debug("Using cached conversation analysis")
                return

            # Find the most recent system message asking for history analysis
            history_analysis_requested = False
            for msg in reversed(self.memory.messages):
                if (
                    msg.role == "system"
                    and msg.content
                    and "ANALYZE_CONVERSATION_HISTORY" in msg.content
                ):
                    history_analysis_requested = True
                    logger.debug("Found explicit history analysis request")
                    break

            # If no explicit analysis request but we have history, still analyze
            if not history_analysis_requested and len(self.memory.messages) > 2:
                # Use dictionary comprehension for faster filtering
                role_counts = {}
                for msg in self.memory.messages:
                    role_counts[msg.role] = role_counts.get(msg.role, 0) + 1

                if (
                    role_counts.get("user", 0) > 0
                    and role_counts.get("assistant", 0) > 0
                ):
                    history_analysis_requested = True
                    logger.debug(
                        f"Implicitly analyzing conversation history: {role_counts.get('user', 0)} user messages, {role_counts.get('assistant', 0)} assistant messages"
                    )

            if not history_analysis_requested:
                logger.debug("No history analysis needed")
                return

            # Remove any existing analysis request messages to avoid duplication
            original_message_count = len(self.memory.messages)
            self.memory.messages = [
                msg
                for msg in self.memory.messages
                if not (
                    msg.role == "system"
                    and msg.content
                    and (
                        "ANALYZE_CONVERSATION_HISTORY" in msg.content
                        or "CONVERSATION_CONTEXT" in msg.content
                    )
                )
            ]

            if original_message_count != len(self.memory.messages):
                logger.debug(
                    f"Removed {original_message_count - len(self.memory.messages)} existing analysis messages"
                )

            # Count message types more efficiently
            role_counts = {}
            for msg in self.memory.messages:
                role_counts[msg.role] = role_counts.get(msg.role, 0) + 1

            # Get user messages for most recent message
            user_messages = [msg for msg in self.memory.messages if msg.role == "user"]

            # Get the most recent user message for context
            most_recent_user_message = (
                user_messages[-1].content if user_messages else "No user message"
            )

            # Create a more detailed context summary
            context_summary = (
                "CONVERSATION_CONTEXT: You are continuing an existing conversation. "
                "Review the message history carefully before responding to maintain continuity. "
                f"There are {len(self.memory.messages)} previous messages in this conversation "
                f"({role_counts.get('user', 0)} from user, {role_counts.get('assistant', 0)} from assistant). "
                f"The most recent user message is: '{most_recent_user_message[:100]}...' "
                "DO NOT repeat information or ask questions that have already been addressed. "
                "Acknowledge the conversation history and build upon it directly. "
                "Ensure your response is relevant to the current conversation thread."
            )

            # Cache the analysis result
            if len(self._conversation_analysis_cache) >= self._max_analysis_cache_size:
                # Remove a random item to keep cache size in check
                self._conversation_analysis_cache.pop(
                    next(iter(self._conversation_analysis_cache))
                )

            self._conversation_analysis_cache[cache_key] = context_summary

            # Add the context summary as a system message
            self.update_memory("system", context_summary)
            logger.debug(f"Added context analysis message: {context_summary[:100]}...")

            # Mark that we've analyzed the context
            self.memory.mark_context_analyzed()

        except Exception as e:
            logger.error(f"Error analyzing conversation history: {str(e)}")
            # Add a simpler context message as a fallback
            fallback_message = (
                "CONVERSATION_CONTEXT: Review previous messages before responding."
            )
            self.update_memory("system", fallback_message)
            self.memory.mark_context_analyzed()

    async def run(self, request: Optional[str] = None) -> str:
        """Execute the agent's main loop asynchronously.

        Args:
            request: Optional initial user request to process.

        Returns:
            A string summarizing the execution results.

        Raises:
            RuntimeError: If the agent is not in IDLE state at start.
        """
        if self.state != AgentState.IDLE:
            raise RuntimeError(f"Cannot run agent from state: {self.state}")

        if request:
            self.update_memory("user", request)

        # Analyze conversation history before processing the request
        await self.analyze_conversation_history()

        results: List[str] = []
        async with self.state_context(AgentState.RUNNING):
            while (
                self.current_step < self.max_steps and self.state != AgentState.FINISHED
            ):
                self.current_step += 1
                logger.info(f"Executing step {self.current_step}/{self.max_steps}")

                # Stream step start if streaming callback is available
                if hasattr(self, "stream_callback") and self.stream_callback:
                    await self.stream_callback(
                        "act",
                        f"📋 Step {self.current_step}/{self.max_steps}: Starting execution...",
                    )

                step_result = await self.step()

                # Check for stuck state
                if self.is_stuck():
                    self.handle_stuck_state()

                results.append(f"Step {self.current_step}: {step_result}")

                # Stream step completion if streaming callback is available
                if hasattr(self, "stream_callback") and self.stream_callback:
                    await self.stream_callback(
                        "act",
                        f"✅ Step {self.current_step} completed: {step_result[:100]}...",
                    )

            # Check if task finished normally
            if self.state == AgentState.FINISHED:
                if hasattr(self, "stream_callback") and self.stream_callback:
                    await self.stream_callback(
                        "complete",
                        f"🏁 Task completed successfully after {self.current_step} steps",
                    )

            if self.current_step >= self.max_steps:
                self.current_step = 0
                self.state = AgentState.IDLE
                results.append(f"Terminated: Reached max steps ({self.max_steps})")

                # Stream completion if streaming callback is available
                if hasattr(self, "stream_callback") and self.stream_callback:
                    await self.stream_callback(
                        "complete", f"🏁 Task completed after {self.max_steps} steps"
                    )

        return "\n".join(results) if results else "No steps executed"

    @abstractmethod
    async def step(self) -> str:
        """Execute a single step in the agent's workflow.

        Must be implemented by subclasses to define specific behavior.
        """

    def handle_stuck_state(self):
        """Handle stuck state by adding a prompt to change strategy"""
        stuck_prompt = "\
        Observed duplicate responses. Consider new strategies and avoid repeating ineffective paths already attempted."
        self.next_step_prompt = f"{stuck_prompt}\n{self.next_step_prompt}"
        logger.warning(f"Agent detected stuck state. Added prompt: {stuck_prompt}")

    def is_stuck(self) -> bool:
        """Check if the agent is stuck in a loop by detecting duplicate content"""
        if len(self.memory.messages) < 2:
            return False

        last_message = self.memory.messages[-1]
        if not last_message.content:
            return False

        # Count identical content occurrences
        duplicate_count = sum(
            1
            for msg in reversed(self.memory.messages[:-1])
            if msg.role == "assistant" and msg.content == last_message.content
        )

        return duplicate_count >= self.duplicate_threshold

    @property
    def messages(self) -> List[Message]:
        """Retrieve a list of messages from the agent's memory."""
        return self.memory.messages

    @messages.setter
    def messages(self, value: List[Message]):
        """Set the list of messages in the agent's memory."""
        self.memory.messages = value
