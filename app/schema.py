from enum import Enum
from typing import Any, List, Literal, Optional, Union

from pydantic import BaseModel, Field


class Role(str, Enum):
    """Message role options"""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


ROLE_VALUES = tuple(role.value for role in Role)
ROLE_TYPE = Literal[ROLE_VALUES]  # type: ignore


class ToolChoice(str, Enum):
    """Tool choice options"""

    NONE = "none"
    AUTO = "auto"
    REQUIRED = "required"


TOOL_CHOICE_VALUES = tuple(choice.value for choice in ToolChoice)
TOOL_CHOICE_TYPE = Literal[TOOL_CHOICE_VALUES]  # type: ignore


class AgentState(str, Enum):
    """Agent execution states"""

    IDLE = "IDLE"
    RUNNING = "RUNNING"
    FINISHED = "FINISHED"
    ERROR = "ERROR"


class Function(BaseModel):
    name: str
    arguments: str


class ToolCall(BaseModel):
    """Represents a tool/function call in a message"""

    id: str
    type: str = "function"
    function: Function


class Message(BaseModel):
    """Represents a chat message in the conversation"""

    role: ROLE_TYPE = Field(...)  # type: ignore
    content: Optional[str] = Field(default=None)
    tool_calls: Optional[List[ToolCall]] = Field(default=None)
    name: Optional[str] = Field(default=None)
    tool_call_id: Optional[str] = Field(default=None)

    def __add__(self, other) -> List["Message"]:
        """支持 Message + list 或 Message + Message 的操作"""
        if isinstance(other, list):
            return [self] + other
        elif isinstance(other, Message):
            return [self, other]
        else:
            raise TypeError(
                f"unsupported operand type(s) for +: '{type(self).__name__}' and '{type(other).__name__}'"
            )

    def __radd__(self, other) -> List["Message"]:
        """支持 list + Message 的操作"""
        if isinstance(other, list):
            return other + [self]
        else:
            raise TypeError(
                f"unsupported operand type(s) for +: '{type(other).__name__}' and '{type(self).__name__}'"
            )

    def to_dict(self) -> dict:
        """Convert message to dictionary format"""
        message = {"role": self.role}
        if self.content is not None:
            message["content"] = self.content
        if self.tool_calls is not None:
            message["tool_calls"] = [
                tool_call.model_dump() for tool_call in self.tool_calls
            ]
        if self.name is not None:
            message["name"] = self.name
        if self.tool_call_id is not None:
            message["tool_call_id"] = self.tool_call_id
        return message

    @classmethod
    def user_message(cls, content: str) -> "Message":
        """Create a user message"""
        return cls(role=Role.USER, content=content)

    @classmethod
    def system_message(cls, content: str) -> "Message":
        """Create a system message"""
        return cls(role=Role.SYSTEM, content=content)

    @classmethod
    def assistant_message(cls, content: Optional[str] = None) -> "Message":
        """Create an assistant message"""
        return cls(role=Role.ASSISTANT, content=content)

    @classmethod
    def tool_message(cls, content: str, name, tool_call_id: str) -> "Message":
        """Create a tool message"""
        return cls(
            role=Role.TOOL, content=content, name=name, tool_call_id=tool_call_id
        )

    @classmethod
    def from_tool_calls(
        cls, tool_calls: List[Any], content: Union[str, List[str]] = "", **kwargs
    ):
        """Create ToolCallsMessage from raw tool calls.

        Args:
            tool_calls: Raw tool calls from LLM
            content: Optional message content
        """
        formatted_calls = [
            {"id": call.id, "function": call.function.model_dump(), "type": "function"}
            for call in tool_calls
        ]
        return cls(
            role=Role.ASSISTANT, content=content, tool_calls=formatted_calls, **kwargs
        )


class Memory(BaseModel):
    messages: List[Message] = Field(default_factory=list)
    max_messages: int = Field(default=100)
    context_analyzed: bool = Field(default=False)

    # Cache for frequently accessed data
    message_count_cache: dict = Field(default_factory=dict)
    dict_list_cache: Optional[List[dict]] = Field(default=None)
    cache_valid: bool = Field(default=True)

    def add_message(self, message: Message) -> None:
        """Add a message to memory with efficient caching"""
        self.messages.append(message)

        # Invalidate caches when adding a message
        self.invalidate_caches()

        # Optional: Implement message limit
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages :]
            # Further invalidate caches when truncating
            self.invalidate_caches()

        # Reset context_analyzed flag when a new user message is added
        if message.role == "user":
            self.context_analyzed = False

        # Update role count cache for the added message
        if message.role in self.message_count_cache:
            self.message_count_cache[message.role] += 1
        else:
            self.message_count_cache[message.role] = 1

    def add_messages(self, messages: List[Message]) -> None:
        """Add multiple messages to memory with efficient caching"""
        if not messages:
            return

        self.messages.extend(messages)

        # Invalidate caches when adding messages
        self.invalidate_caches()

        # Check if any user messages were added and update role counts
        has_user_message = False
        for msg in messages:
            if msg.role == "user":
                has_user_message = True

            # Update role count cache
            if msg.role in self.message_count_cache:
                self.message_count_cache[msg.role] += 1
            else:
                self.message_count_cache[msg.role] = 1

        if has_user_message:
            self.context_analyzed = False

    def clear(self) -> None:
        """Clear all messages and caches"""
        self.messages.clear()
        self.context_analyzed = False
        self.invalidate_caches()
        self.message_count_cache.clear()

    def get_recent_messages(self, n: int) -> List[Message]:
        """Get n most recent messages"""
        return self.messages[-n:]

    def mark_context_analyzed(self) -> None:
        """Mark that the conversation context has been analyzed"""
        self.context_analyzed = True

    def needs_context_analysis(self) -> bool:
        """Check if the conversation context needs to be analyzed"""
        # If we have more than 2 messages and context hasn't been analyzed yet
        return len(self.messages) > 2 and not self.context_analyzed

    def to_dict_list(self) -> List[dict]:
        """Convert messages to list of dicts with caching"""
        # Use cached version if available and valid
        if self.dict_list_cache is not None and self.cache_valid:
            return self.dict_list_cache

        # Generate and cache the result
        self.dict_list_cache = [msg.to_dict() for msg in self.messages]
        self.cache_valid = True
        return self.dict_list_cache

    def get_message_count_by_role(self, role: str) -> int:
        """Get count of messages with a specific role using cache"""
        # If we have a cached count and the cache is valid, use it
        if role in self.message_count_cache and self.cache_valid:
            return self.message_count_cache[role]

        # Otherwise, calculate and cache the count
        count = sum(1 for msg in self.messages if msg.role == role)
        self.message_count_cache[role] = count
        return count

    def invalidate_caches(self) -> None:
        """Invalidate all caches"""
        self.cache_valid = False
        self.dict_list_cache = None
