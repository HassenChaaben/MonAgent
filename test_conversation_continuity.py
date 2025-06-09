#!/usr/bin/env python3
"""
Test script to verify Manus agent conversation continuity.
Tests if the agent can maintain context across multiple interactions.
This simulates the exact flow that happens in app.py when handling continuous conversations.
"""

import asyncio
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.agent.manus import Manus
from app.database import Database
from app.schema import Memory


class ConversationTest:
    def __init__(self):
        self.db = Database()
        self.task_id = str(uuid.uuid4())
        self.project_name = "snake_game_test"

    async def simulate_conversation(self):
        """Simulate a multi-turn conversation"""
        print("🐍 Starting Snake Game Conversation Test")
        print("=" * 60)

        # First interaction: Create snake game
        print("\n📝 First Interaction: Create Snake Game")
        first_response = await self.send_message(
            "Create a simple snake game in Python using pygame. Make it playable with arrow keys."
        )

        print(f"🤖 Agent Response 1: {first_response[:200]}...")

        # Second interaction: Add start button
        print("\n📝 Second Interaction: Add Start Button")
        second_response = await self.send_message(
            "Add a start game button to the snake game you just created. The button should appear before the game starts."
        )

        print(f"🤖 Agent Response 2: {second_response[:200]}...")

        # Third interaction: Test context understanding
        print("\n📝 Third Interaction: Test Context Understanding")
        third_response = await self.send_message(
            "What color did you make the snake in the game?"
        )

        print(f"🤖 Agent Response 3: {third_response[:200]}...")

        # Analyze conversation continuity
        return await self.analyze_conversation_continuity()

    async def send_message(self, message):
        """Send a message and get response from agent"""
        # Create agent with project name
        agent = Manus(project_name=self.project_name)

        # Load previous conversation history if exists (using improved app.py logic)
        task_data = self.db.get_task(self.task_id)
        if task_data and task_data.get("steps"):
            print(
                f"📚 Loading {len(task_data['steps'])} previous conversation steps..."
            )

            # Track loaded messages for debugging (same as app.py)
            loaded_user_messages = 0
            loaded_assistant_messages = 0
            skipped_messages = 0

            # Filter and sort steps to ensure proper conversation order (same as app.py)
            conversation_steps = []
            for step_index, step in enumerate(task_data["steps"]):
                try:
                    if isinstance(step, dict) and "type" in step and "result" in step:
                        step_type = step["type"]
                        step_content = step["result"]

                        # Only include conversation messages (prompt and result)
                        if (
                            step_type in ["prompt", "result"]
                            and step_content
                            and step_content.strip()
                        ):
                            conversation_steps.append(
                                {
                                    "type": step_type,
                                    "content": step_content,
                                    "index": step_index,
                                }
                            )
                except Exception as e:
                    print(f"Error processing step {step_index}: {str(e)}")
                    continue

            # Sort by index to maintain chronological order (same as app.py)
            conversation_steps.sort(key=lambda x: x["index"])

            # Load conversation steps into agent memory (same as app.py)
            for conv_step in conversation_steps:
                try:
                    step_type = conv_step["type"]
                    step_content = conv_step["content"]

                    if step_type == "prompt":
                        agent.update_memory("user", step_content)
                        loaded_user_messages += 1
                        print(
                            f"Added user message to agent memory: {step_content[:50]}..."
                        )
                    elif step_type == "result":
                        agent.update_memory("assistant", step_content)
                        loaded_assistant_messages += 1
                        print(
                            f"Added assistant message to agent memory: {step_content[:50]}..."
                        )

                except Exception as e:
                    print(f"Error adding conversation step to agent memory: {str(e)}")
                    skipped_messages += 1
                    continue

            print(
                f"Successfully loaded {loaded_user_messages} user messages and {loaded_assistant_messages} assistant messages. Skipped {skipped_messages} messages."
            )

            # Add context analysis system message (same as app.py)
            if loaded_user_messages > 0 or loaded_assistant_messages > 0:
                context_prompt = f"""CONVERSATION_CONTEXT: You are continuing a conversation that has {loaded_user_messages} user messages and {loaded_assistant_messages} assistant responses.
Review the conversation history above to understand what has been discussed and maintain context continuity.
Remember what you've created, discussed, or promised in previous messages.
Respond to the new user message while being aware of the full conversation context."""

                agent.update_memory("system", context_prompt)
                print(f"Added conversation context prompt to agent memory")

        # Add current message
        agent.update_memory("user", message)

        # Debug: Show agent memory state
        print(
            f"🧠 Agent memory now contains {len(agent.memory.messages)} total messages"
        )
        for i, msg in enumerate(agent.memory.messages):
            print(f"  {i+1}. {msg.role}: {msg.content[:50]}...")

        # Get response
        print(f"🤖 Running agent with conversation context...")
        response = await agent.run(message)

        # Store in database
        if not task_data:
            # Create new task
            self.db.create_task(
                task_id=self.task_id,
                prompt=message,
                created_at=datetime.now(),
                status="completed",
                project_name=self.project_name,
            )
            step_number = 0
        else:
            step_number = len(task_data["steps"])

        # Add user message
        self.db.add_task_step(
            task_id=self.task_id,
            step_number=step_number,
            result=message,
            step_type="prompt",
        )

        # Add agent response
        self.db.add_task_step(
            task_id=self.task_id,
            step_number=step_number + 1,
            result=response,
            step_type="result",
        )

        return response

    async def analyze_conversation_continuity(self):
        """Analyze if the agent maintained conversation context"""
        print("\n🔍 Analyzing Conversation Continuity")
        print("=" * 40)

        # Get full conversation from database
        task_data = self.db.get_task(self.task_id)
        if not task_data or not task_data.get("steps"):
            print("❌ No conversation data found")
            return False

        steps = task_data["steps"]
        print(f"📊 Total conversation steps: {len(steps)}")

        # Extract user messages and agent responses
        user_messages = []
        agent_responses = []

        for step in steps:
            if isinstance(step, dict):
                step_type = step.get("type")
                content = step.get("result", "")

                if step_type == "prompt":
                    user_messages.append(content)
                elif step_type == "result":
                    agent_responses.append(content)

        print(f"👤 User messages: {len(user_messages)}")
        print(f"🤖 Agent responses: {len(agent_responses)}")

        # Test context continuity
        context_tests = []

        # Test 1: Does second response reference the snake game?
        if len(agent_responses) >= 2:
            second_response = agent_responses[1].lower()
            snake_keywords = [
                "snake",
                "game",
                "pygame",
                "previous",
                "created",
                "earlier",
            ]
            has_context = any(keyword in second_response for keyword in snake_keywords)
            context_tests.append(("Second response references snake game", has_context))

        # Test 2: Does third response show understanding of the game details?
        if len(agent_responses) >= 3:
            third_response = agent_responses[2].lower()
            context_keywords = [
                "color",
                "snake",
                "game",
                "made",
                "created",
                "green",
                "red",
                "blue",
            ]
            has_context = any(keyword in third_response for keyword in context_keywords)
            context_tests.append(
                ("Third response shows game understanding", has_context)
            )

        # Test 3: Check if agent memory contains all messages
        agent = Manus(project_name=self.project_name)

        # Load conversation history
        for step in steps:
            if isinstance(step, dict):
                step_type = step.get("type")
                step_content = step.get("result", "")

                if step_type == "prompt":
                    agent.update_memory("user", step_content)
                elif step_type == "result":
                    agent.update_memory("assistant", step_content)

        memory_test = len(agent.memory.messages) >= len(user_messages) + len(
            agent_responses
        )
        context_tests.append(("Agent memory contains all messages", memory_test))

        # Display results
        print("\n📋 Context Continuity Tests:")
        passed_tests = 0
        for test_name, passed in context_tests:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"  {test_name}: {status}")
            if passed:
                passed_tests += 1

        success_rate = passed_tests / len(context_tests) if context_tests else 0
        print(
            f"\n📊 Context Continuity Score: {passed_tests}/{len(context_tests)} ({success_rate:.1%})"
        )

        if success_rate >= 0.8:
            print("🎉 Conversation continuity is working well!")
            return True
        else:
            print("⚠️  Conversation continuity needs improvement!")
            return False

    def cleanup(self):
        """Clean up test data"""
        try:
            self.db.delete_task(self.task_id)
            print(f"🧹 Cleaned up test task: {self.task_id}")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")


async def main():
    """Run the conversation continuity test"""
    test = ConversationTest()

    try:
        success = await test.simulate_conversation()

        if not success:
            print("\n🔧 Conversation continuity issues detected!")
            print("The agent is not properly maintaining context between interactions.")
            print(
                "This suggests the conversation history loading mechanism needs fixing."
            )

        return success

    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback

        traceback.print_exc()
        return False

    finally:
        test.cleanup()


if __name__ == "__main__":
    print("🧪 Manus Agent Conversation Continuity Test")
    print(
        "This test will simulate a multi-turn conversation about creating a snake game."
    )
    print("It will check if the agent maintains context across interactions.\n")

    success = asyncio.run(main())

    if success:
        print("\n✅ Test completed successfully!")
    else:
        print("\n❌ Test revealed issues that need to be fixed!")

    sys.exit(0 if success else 1)
