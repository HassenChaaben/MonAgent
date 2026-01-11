class ToolError(Exception):
    """Raised when a tool encounters an error."""

    def __init__(self, message):
        self.message = message


class MonAgentError(Exception):
    """Base exception for all MonAgent errors"""


class TokenLimitExceeded(MonAgentError):
    """Exception raised when the token limit is exceeded"""
