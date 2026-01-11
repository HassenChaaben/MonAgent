import asyncio
import time

from app.agent.monagent import MonAgent
from app.logger import logger


async def main():
    # Initialize the enhanced MonAgent with tool awareness
    agent = MonAgent()

    try:
        # Get user input
        prompt = input("Enter your prompt: ")
        if not prompt.strip():
            logger.warning("Empty prompt provided.")
            return

        # For complex tasks, create a structured plan
        if is_complex_task(prompt):
            logger.info("Creating a structured plan for your complex task...")
            # Skip plan creation for now

        # Process the request
        logger.warning("Processing your request...")
        start_time = time.time()
        result = await agent.run(prompt)
        elapsed_time = time.time() - start_time

        # Log completion and performance metrics
        logger.info(f"Request processing completed in {elapsed_time:.2f} seconds.")
        logger.info(
            f"Tool usage: {agent.successful_tool_calls} successful, {agent.failed_tool_calls} failed"
        )

        # Perform self-reflection on tool usage
        logger.info("Reflecting on tool usage effectiveness...")
        # Skip reflection for now

    except KeyboardInterrupt:
        logger.warning("Operation interrupted.")
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")


def is_complex_task(prompt: str) -> bool:
    """Determine if a task is complex enough to warrant planning."""
    # Simple heuristic based on prompt length and complexity indicators
    complexity_indicators = [
        "create",
        "build",
        "develop",
        "implement",
        "design",
        "multiple",
        "steps",
        "complex",
        "project",
        "application",
    ]

    # Check prompt length
    if len(prompt.split()) > 20:
        return True

    # Check for complexity indicators
    for indicator in complexity_indicators:
        if indicator.lower() in prompt.lower():
            return True

    return False


if __name__ == "__main__":
    asyncio.run(main())
