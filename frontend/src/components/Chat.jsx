import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Chat.css'; // Import the CSS styles
import '../styles/CustomOverrides.css'; // Import custom overrides
import '../styles/ChatAnimations.css'; // Import enhanced animations
import '../styles/ThemeOverrides.css'; // Import theme overrides for both light and dark modes
import '../styles/ThinkingAnimation.css'; // Import neon thinking animation styles
import '../styles/DeleteButton.css'; // Import delete button styles
import '../styles/LottieLoading.css'; // Import Lottie animation styles
import { USER_AVATAR, ASSISTANT_AVATAR } from './AvatarIcons';
import LottieLoading from './LottieLoading'; // Import the Lottie animation component

// Define the backend URL (adjust if your backend runs on a different port/host)
const API_BASE_URL = 'http://localhost:8080'; // Updated backend port

const ThinkIcon = ({ isDarkMode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill={!isDarkMode ? "#3182CE" : "#4299E1"} />
    <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" fill={!isDarkMode ? "#3182CE" : "#4299E1"} />
    <path d="M12 7V14" stroke={!isDarkMode ? "#3182CE" : "#4299E1"} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ToolIcon = ({ isDarkMode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.7 6.3C14.3 5.9 13.7 5.9 13.3 6.3L9.3 10.3C8.9 10.7 8.9 11.3 9.3 11.7C9.7 12.1 10.3 12.1 10.7 11.7L14.7 7.7C15.1 7.3 15.1 6.7 14.7 6.3Z" fill={!isDarkMode ? "#ED8936" : "#F6AD55"} />
  </svg>
);

// Light mode and dark mode icons
const LightModeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#00bcd4" />
    <path d="M12 1V3" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 21V23" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M23 12H21" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 12H1" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.7778 4.22266L18.3636 5.63687" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.63604 18.3638L4.22183 19.778" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.7778 19.7783L18.3636 18.3641" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
    <path d="M5.63604 5.63715L4.22183 4.22294" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DarkModeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#F9A825" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Professional trash icon component for delete button
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Removed ThinkingAnimation component - replaced with Lottie animation

// Add a new LoadingOverlay component at the top of the file
function LoadingOverlay() {
  return (
    <div className="loading-overlay" data-type="loading">
      <div className="loading-card">
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
        <div className="loading-text">Waiting for MonAgent...</div>
      </div>
    </div>
  );
}

// Main Chat component
const Chat = ({ isDarkMode, toggleTheme }) => {
  const { taskId } = useParams(); // Get taskId from URL parameters
  const navigate = useNavigate(); // For navigation
  const [conversations, setConversations] = useState([]); // Holds the list of past tasks
  const [currentTaskId, setCurrentTaskId] = useState(null); // ID of the active task/chat
  const [messages, setMessages] = useState([]); // Messages/steps for the current task
  const [inputMessage, setInputMessage] = useState(''); // Current user input (prompt)
  const [projectName, setProjectName] = useState(''); // Project name for organizing files
  const [showProjectInput, setShowProjectInput] = useState(false); // Whether to show the project name input
  const [isLoading, setIsLoading] = useState(false); // Loading state for responses
  // Removed unused loading start time state - now tracked in individual message objects
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State for mobile sidebar toggle
  const messagesEndRef = useRef(null); // Ref to scroll to the bottom
  const eventSourceRef = useRef(null); // Ref to hold the current EventSource instance
  // Removed unused timestamp tracking state
  // No typing messages state needed anymore
  const [currentTaskStatus, setCurrentTaskStatus] = useState(null);

  // Enhanced scroll to bottom with smooth animation
  const scrollToBottom = useCallback(() => {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      // Use a more natural easing for scrolling
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });

      // Add a subtle highlight effect to the newest message
      const newestMessage = document.querySelector('.new-message');
      if (newestMessage) {
        // Add a subtle highlight class
        newestMessage.classList.add('message-highlight');

        // Remove it after the animation completes
        setTimeout(() => {
          newestMessage.classList.remove('message-highlight');
        }, 1000);
      }
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDarkMode);
  }, [isDarkMode]);

  // Improved function to group messages by sender and ensure proper conversation flow
  const groupMessagesByType = useCallback((messages) => {
    console.log("Grouping messages, total count:", messages.length);

    // Skip processing if there are no messages
    if (!messages || messages.length === 0) {
      return [];
    }

    // STEP 1: Normalize timestamps for all messages
    const messagesWithValidTimestamps = messages.map((msg, index) => {
      // Create a copy to avoid modifying the original message
      const messageCopy = { ...msg };

      // Ensure timestamp is a number in milliseconds
      if (typeof messageCopy.timestamp === 'string') {
        messageCopy.timestamp = new Date(messageCopy.timestamp).getTime();
      } else if (messageCopy.timestamp instanceof Date) {
        messageCopy.timestamp = messageCopy.timestamp.getTime();
      } else if (!messageCopy.timestamp || isNaN(messageCopy.timestamp)) {
        // If timestamp is missing or invalid, create one based on index
        console.warn(`Message with invalid timestamp found:`, messageCopy);
        // Use a base timestamp and add index to ensure order
        const baseTime = Date.now() - (messages.length * 1000);
        messageCopy.timestamp = baseTime + (index * 1000);
      }

      // Add a display timestamp for UI rendering if not already present
      if (!messageCopy.displayTimestamp) {
        messageCopy.displayTimestamp = new Date(messageCopy.timestamp).toLocaleTimeString();
      }

      return messageCopy;
    });

    // STEP 2: Filter out duplicate and unwanted messages
    // TEMPORARY: Show all messages for debugging
    const filteredMessages = messagesWithValidTimestamps;

    // STEP 3: Ensure logical ordering of messages
    // First, create a map of user messages by timestamp
    const userMessages = filteredMessages.filter(msg => msg.sender === 'user');
    userMessages.sort((a, b) => a.timestamp - b.timestamp);

    // Ensure assistant messages come after their corresponding user messages
    filteredMessages.forEach(msg => {
      if (msg.sender === 'assistant') {
        // Find the latest user message that came before this assistant message
        const precedingUserMessages = userMessages.filter(userMsg =>
          userMsg.timestamp < msg.timestamp
        );

        if (precedingUserMessages.length > 0) {
          // Get the most recent user message
          const latestUserMessage = precedingUserMessages[precedingUserMessages.length - 1];

          // If the assistant message timestamp is too close to the user message,
          // adjust it to ensure proper ordering
          if (msg.timestamp - latestUserMessage.timestamp < 500) {
            msg.timestamp = latestUserMessage.timestamp + 500;
            msg.displayTimestamp = new Date(msg.timestamp).toLocaleTimeString();
          }
        }
      }
    });

    // STEP 4: Sort messages by timestamp
    filteredMessages.sort((a, b) => {
      // First ensure user messages always come before assistant messages
      // when timestamps are very close (within 1 second)
      if (Math.abs(a.timestamp - b.timestamp) < 1000) {
        if (a.sender === 'user' && b.sender === 'assistant') {
          return -1; // User message comes first
        }
        if (a.sender === 'assistant' && b.sender === 'user') {
          return 1; // User message comes first
        }
      }

      // Otherwise, sort by timestamp
      return a.timestamp - b.timestamp;
    });

    // STEP 5: Group messages by sender for UI display
    const groups = [];
    let currentGroup = [];

    for (let i = 0; i < filteredMessages.length; i++) {
      const message = filteredMessages[i];
      const prevMessage = i > 0 ? filteredMessages[i - 1] : null;

      // Start a new group if:
      // 1. This is the first message
      // 2. The sender changed from the previous message
      // 3. The current message is a system message (always in its own group)
      // 4. The previous message was a system message (always in its own group)
      // 5. The current message is a user message (each user message gets its own group)
      const shouldStartNewGroup =
        i === 0 ||
        message.sender !== prevMessage.sender ||
        message.sender === 'system' ||
        prevMessage.sender === 'system' ||
        message.sender === 'user';

      if (shouldStartNewGroup) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    }

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, []);

  // Enhanced function to add a message with immediate display
  const addMessage = useCallback((messageId, text) => {
    // Display messages immediately without typing effect
    setMessages(messages => {
      // First check if the message already exists
      const messageIndex = messages.findIndex(msg => msg.id === messageId);

      if (messageIndex >= 0) {
        // Update existing message
        const updatedMessages = [...messages];
        const originalMessage = updatedMessages[messageIndex];

        // Update the message while preserving all original properties
        updatedMessages[messageIndex] = {
          ...originalMessage,
          text: text,
          isTyping: false,
          isNew: true, // Mark as new for animation
          timestamp: originalMessage.timestamp,
          displayTimestamp: originalMessage.displayTimestamp ||
            new Date(originalMessage.timestamp).toLocaleTimeString()
        };

        return updatedMessages;
      } else {
        // If message not found, create a new one with current timestamp
        console.log(`Message with ID ${messageId} not found, creating new message`);
        const timestamp = Date.now();

        const newMessage = {
          id: messageId,
          sender: 'assistant', // Assume it's from assistant since we're streaming
          text: text,
          type: 'result', // Default type
          timestamp: timestamp,
          displayTimestamp: new Date(timestamp).toLocaleTimeString(),
          isNew: true,
          isRealTime: true
        };

        // Add the new message to the list
        return [...messages, newMessage];
      }
    });

    // Scroll to bottom for new messages
    setTimeout(() => {
      scrollToBottom();
    }, 50);
  }, [scrollToBottom]);

  // Fetch conversation history (tasks)
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      // Map tasks to conversation format (using prompt as title for simplicity)
      const fetchedConversations = tasks.map(task => ({
        id: task.id,
        title: task.prompt.substring(0, 40) + (task.prompt.length > 40 ? '...' : ''), // Shorten title
        status: task.status,
        created_at: task.created_at,
      }));
      setConversations(fetchedConversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      // Handle error display to user if needed
    }
  }, []);

  // Create a reusable function for setting up SSE event handling with improved streaming
  const setupEventSource = useCallback((taskId) => {
    if (eventSourceRef.current) {
      console.log("Closing existing event source");
      eventSourceRef.current.close();
    }

    const url = `${API_BASE_URL}/tasks/${taskId}/events`;
    console.log(`Setting up event source for ${url}`);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Create a map to track message streams by type
    const messageStreams = {
      think: null,
      tool: null,
      act: null,
      result: null,
      error: null
    };

    // Function to create or update a message stream
    const updateMessageStream = (type, data) => {
      const timestamp = data.timestamp || Date.now();
      const displayTimestamp = new Date(timestamp).toLocaleTimeString();

      // Extract step information from the data
      const stepInfo = {
        step_number: data.step_number,
        current_step: data.current_step,
        total_steps: data.total_steps,
        progress_percentage: data.progress_percentage,
        streaming: data.streaming || true
      };

      // If we don't have a stream for this type yet, create one
      if (!messageStreams[type]) {
        // Create a more unique message ID with longer random string and additional uniqueness factors
        const randomId = Math.random().toString(36).substring(2, 10);
        const uniqueTimestamp = new Date().getTime();
        const messageId = `${taskId}-${type}-${uniqueTimestamp}-${randomId}`;

        // Create a new message for this stream
        const newMessage = {
          id: messageId,
          sender: 'assistant',
          text: data.result || '',
          type: type,
          timestamp: timestamp,
          displayTimestamp: displayTimestamp,
          isNew: true,
          isRealTime: true,
          isStreaming: true, // Mark as streaming
          ...stepInfo // Add step information
        };

        // Store the message ID for this stream
        messageStreams[type] = messageId;

        // Add the new message to the list
        setMessages(prev => [...prev, newMessage]);
      } else {
        // Update the existing message for this stream
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.id === messageStreams[type]) {
              // For 'result' type, replace the content
              if (type === 'result') {
                return {
                  ...msg,
                  text: data.result || msg.text,
                  timestamp: timestamp,
                  displayTimestamp: displayTimestamp,
                  ...stepInfo // Update step information
                };
              }
              // For act type with step information, handle specially
              else if (type === 'act' && data.current_step) {
                // If this is a step-by-step process, format it nicely
                const stepText = data.result || '';
                const existingSteps = msg.text ? msg.text.split(/(?=Step \d+:)/) : [];

                // Check if this step already exists in the message
                const stepMatch = stepText.match(/Step (\d+)(?:\s+of\s+(\d+))?:/);
                if (stepMatch) {
                  const stepNumber = parseInt(stepMatch[1], 10);
                  const existingStepIndex = existingSteps.findIndex(s =>
                    s.match(new RegExp(`Step ${stepNumber}(?:\\s+of\\s+\\d+)?:`))
                  );

                  // If step exists, replace it; otherwise add it
                  if (existingStepIndex >= 0) {
                    existingSteps[existingStepIndex] = stepText;
                  } else {
                    existingSteps.push(stepText);
                  }

                  return {
                    ...msg,
                    text: existingSteps.join('\n\n'),
                    timestamp: timestamp,
                    displayTimestamp: displayTimestamp,
                    ...stepInfo
                  };
                }
              }
              // For other types, append the content if it's different
              else if (data.result && !msg.text.includes(data.result)) {
                return {
                  ...msg,
                  text: msg.text ? `${msg.text}\n\n${data.result}` : data.result,
                  timestamp: timestamp,
                  displayTimestamp: displayTimestamp,
                  ...stepInfo // Update step information
                };
              }
              return msg;
            }
            return msg;
          });
        });
      }

      // Scroll to bottom for new content
      setTimeout(scrollToBottom, 50);
    };

    // Handle different event types
    eventSource.addEventListener('think', (event) => {
      try {
        const data = JSON.parse(event.data);
        updateMessageStream('think', data);
      } catch (e) {
        console.error("Error processing think event:", e);
      }
    });

    eventSource.addEventListener('tool', (event) => {
      try {
        const data = JSON.parse(event.data);
        updateMessageStream('tool', data);
      } catch (e) {
        console.error("Error processing tool event:", e);
      }
    });

    eventSource.addEventListener('act', (event) => {
      try {
        const data = JSON.parse(event.data);
        updateMessageStream('act', data);
      } catch (e) {
        console.error("Error processing act event:", e);
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse(event.data);
        updateMessageStream('error', data);
      } catch (e) {
        console.error("Error processing error event:", e);
      }
    });

    eventSource.addEventListener('result', (event) => {
      try {
        const data = JSON.parse(event.data);
        updateMessageStream('result', data);
      } catch (e) {
        console.error("Error processing result event:", e);
      }
    });

    // Handle streaming start event
    eventSource.addEventListener('streaming_start', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Streaming started:", data);

        // You can add UI indicators that streaming has started
        // For example, show a special indicator in the UI
        setMessages(prev => {
          // Mark all messages as streaming
          return prev.map(msg => {
            if (msg.sender === 'assistant' && !msg.isStreaming) {
              return {
                ...msg,
                isStreaming: true
              };
            }
            return msg;
          });
        });
      } catch (e) {
        console.error("Error processing streaming_start event:", e);
      }
    });

    // Handle streaming end event
    eventSource.addEventListener('streaming_end', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Streaming ended:", data);

        // Update UI to indicate streaming has ended
        setMessages(prev => {
          // Mark all streaming messages as complete
          return prev.map(msg => {
            if (msg.isStreaming) {
              return {
                ...msg,
                isStreaming: false,
                final: true
              };
            }
            return msg;
          });
        });
      } catch (e) {
        console.error("Error processing streaming_end event:", e);
      }
    });

    // Handle complete event separately with improved handling
    eventSource.addEventListener('complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.result) {
          const finalMessageTimestamp = Date.now();

          // Find any existing result message to update instead of creating a new one
          setMessages(prev => {
            // Find the most recent result message if it exists
            const resultMessageIndex = prev.findIndex(msg =>
              msg.type === 'result' && msg.sender === 'assistant' && msg.isStreaming
            );

            // If we found a result message, update it
            if (resultMessageIndex >= 0) {
              const updatedMessages = [...prev];
              updatedMessages[resultMessageIndex] = {
                ...updatedMessages[resultMessageIndex],
                text: data.result.trim(),
                timestamp: finalMessageTimestamp,
                displayTimestamp: new Date(finalMessageTimestamp).toLocaleTimeString(),
                isStreaming: false,
                isFinalMessage: true
              };
              return updatedMessages;
            }
            // Otherwise create a new message
            else {
              // Generate a truly unique ID with multiple random components
              const contentHash = data.result ? data.result.substring(0, 5).replace(/\s/g, '') : '';
              const randomPart1 = Math.random().toString(36).substring(2, 10);
              const randomPart2 = Math.random().toString(36).substring(2, 10);
              const uniqueTimestamp = new Date().getTime();
              const messageId = `${taskId}-complete-${uniqueTimestamp}-${randomPart1}-${randomPart2}-${contentHash}`;

              // Check if this is a duplicate of the last message
              const lastMessage = prev[prev.length - 1];
              if (lastMessage &&
                lastMessage.sender === 'assistant' &&
                lastMessage.text === data.result.trim()) {
                console.log("Final message is a duplicate of the last message, not adding");
                return prev;
              }

              return [
                ...prev,
                {
                  id: messageId,
                  sender: 'assistant',
                  text: data.result.trim(),
                  type: 'result',
                  timestamp: finalMessageTimestamp,
                  displayTimestamp: new Date(finalMessageTimestamp).toLocaleTimeString(),
                  isNew: true,
                  isFinalMessage: true,
                  isRealTime: true
                }
              ];
            }
          });

          // Mark all streaming messages as complete
          setMessages(prev =>
            prev.map(msg =>
              msg.isStreaming ? { ...msg, isStreaming: false } : msg
            )
          );

          setTimeout(scrollToBottom, 100);
        }

        // Update task status
        setCurrentTaskStatus('completed');

        // Turn off loading state
        setIsLoading(false);
      } catch (e) {
        console.error("Error processing complete event:", e);
      }
    });

    // Handle status updates
    eventSource.addEventListener('status', (event) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentTaskStatus(data.status);
      } catch (e) {
        console.error("Error processing status event:", e);
      }
    });

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("EventSource connection closed");
      }
    };

    return eventSource;
  }, [scrollToBottom]);

  // Fetch messages (steps) for a selected task and listen to events
  const loadConversation = useCallback(async (taskId) => {
    if (currentTaskId === taskId) return; // Avoid reloading the same conversation

    console.log(`Loading conversation ${taskId}...`);
    setIsLoading(true);
    setMessages([]); // Clear previous messages
    setCurrentTaskId(taskId);

    // Close existing SSE connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log("Closed previous SSE connection");
    }

    try {
      // Fetch initial task details (including past steps)
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.error(`Task ${taskId} not found.`);
          // Handle task not found - maybe remove from list or show error
          setCurrentTaskId(null);
          setIsLoading(false);
          fetchConversations(); // Refresh list
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const task = await response.json();

      // Store the task status to prevent unnecessary reconnections
      setCurrentTaskStatus(task.status);
      console.log(`Task ${taskId} status: ${task.status}`);

      // Set project name from task
      if (task.project_name) {
        setProjectName(task.project_name);
        setShowProjectInput(false);
      }

      // Make sure we have the initial prompt as the first user message
      const formattedMessages = [];
      let lastTimestamp = new Date(task.created_at).getTime();
      let stepIndex = 0;
      if (task.prompt) {
        formattedMessages.push({
          id: `${taskId}-prompt-initial`,
          sender: 'user',
          text: task.prompt,
          type: 'prompt',
          timestamp: lastTimestamp,
          timestampFixed: true,
          stepIndex: stepIndex++
        });
      }
      task.steps.forEach((step, index) => {
        let stepTimestamp = step.timestamp ? new Date(step.timestamp).getTime() : getSafeTimestamp(lastTimestamp);
        if (stepTimestamp <= lastTimestamp) stepTimestamp = lastTimestamp + 1;
        lastTimestamp = stepTimestamp;
        let msg = null;
        // Generate a unique ID for each message using a combination of taskId, type, index, timestamp, and a random string
        const uniqueId = `${taskId}-${step.type}-${index}-${stepTimestamp}-${Math.random().toString(36).substring(2, 8)}`;

        if (step.type === 'prompt') {
          msg = {
            id: uniqueId,
            sender: 'user',
            text: step.result,
            type: 'prompt',
            timestamp: stepTimestamp,
            timestampFixed: true,
            stepIndex: stepIndex++
          };
        } else if (step.type === 'result') {
          msg = {
            id: uniqueId,
            sender: 'assistant',
            text: step.result,
            type: 'result',
            timestamp: stepTimestamp,
            timestampFixed: true,
            stepIndex: stepIndex++
          };
        } else if (["think", "tool", "act", "run"].includes(step.type)) {
          if (step.result && step.result.trim() === '') return;
          msg = {
            id: uniqueId,
            sender: 'assistant',
            text: step.result,
            type: step.type,
            timestamp: stepTimestamp,
            timestampFixed: true,
            stepIndex: stepIndex++
          };
        } else if (step.type === 'error') {
          msg = {
            id: uniqueId,
            sender: 'system',
            text: step.result,
            type: 'error',
            timestamp: stepTimestamp,
            isSystemError: true,
            timestampFixed: true,
            stepIndex: stepIndex++
          };
        }
        if (msg) formattedMessages.push(msg);
      });
      // Sort by timestamp, then by stepIndex as tiebreaker
      formattedMessages.sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return (a.stepIndex || 0) - (b.stepIndex || 0);
      });

      // CRITICAL FIX: Ensure messages are in proper chronological order
      // First, ensure all timestamps are properly normalized to milliseconds
      formattedMessages.forEach((msg, index) => {
        // Ensure timestamp is a number in milliseconds
        if (typeof msg.timestamp === 'string') {
          msg.timestamp = new Date(msg.timestamp).getTime();
        } else if (msg.timestamp instanceof Date) {
          msg.timestamp = msg.timestamp.getTime();
        } else if (!msg.timestamp || isNaN(msg.timestamp)) {
          // If timestamp is missing or invalid, create one based on index
          // This ensures all messages have valid timestamps for sorting
          console.warn(`Message with invalid timestamp found:`, msg);
          // Use a base timestamp and add index to ensure order
          const baseTime = Date.now() - (formattedMessages.length * 1000);
          msg.timestamp = baseTime + (index * 1000);
          console.log(`Assigned timestamp ${new Date(msg.timestamp).toISOString()} to message`);
        }

        // Add a display timestamp for UI rendering
        msg.displayTimestamp = new Date(msg.timestamp).toLocaleTimeString();

        // Ensure the timestamp is fixed and won't be modified
        msg.timestampFixed = true;

        // Log for debugging
        console.log(`Message ${index} timestamp: ${new Date(msg.timestamp).toISOString()}, sender: ${msg.sender}, content: ${msg.content?.substring(0, 30) || 'N/A'}...`);
      });

      // CRITICAL FIX: Group messages by conversation flow with logical ordering
      // This ensures user messages and their corresponding AI responses stay together
      // and that user messages always come before AI responses
      const conversationPairs = [];
      let currentPair = [];

      // First, separate user and assistant messages
      const userMessages = formattedMessages.filter(msg => msg.sender === 'user');
      const assistantMessages = formattedMessages.filter(msg => msg.sender === 'assistant');

      // Sort each group by timestamp
      userMessages.sort((a, b) => a.timestamp - b.timestamp);
      assistantMessages.sort((a, b) => a.timestamp - b.timestamp);

      // For each user message, find all assistant messages that should follow it
      userMessages.forEach((userMsg, index) => {
        // Start a new pair with the user message
        currentPair = [userMsg];

        // Get the next user message timestamp (if any)
        const nextUserTimestamp = index < userMessages.length - 1
          ? userMessages[index + 1].timestamp
          : Infinity;

        // Find all assistant messages that belong between this user message and the next
        const relevantAssistantMessages = assistantMessages.filter(assistantMsg =>
          // Assistant message must be after this user message
          assistantMsg.timestamp > userMsg.timestamp &&
          // And before the next user message (if any)
          assistantMsg.timestamp < nextUserTimestamp
        );

        // Add these assistant messages to the current pair
        if (relevantAssistantMessages.length > 0) {
          currentPair.push(...relevantAssistantMessages);
        }

        // Add the pair to our collection
        conversationPairs.push(currentPair);
      });

      // Add the last pair if it exists
      if (currentPair.length > 0) {
        conversationPairs.push(currentPair);
      }

      // Flatten the pairs back into a single array
      // This preserves the conversation flow while maintaining chronological order
      const orderedMessages = conversationPairs.flat();

      // CRITICAL FIX: Ensure user messages always appear before AI responses
      // This fixes the issue where AI responses sometimes appear before user messages
      orderedMessages.sort((a, b) => {
        // First, check if we have a user-assistant pair with timestamps that are out of order
        if (a.sender === 'assistant' && b.sender === 'user') {
          // If the assistant message appears before the user message, force the user message to come first
          return 1; // User message (b) should come before assistant message (a)
        }

        if (a.sender === 'user' && b.sender === 'assistant') {
          // If the user message appears before the assistant message, keep this order
          return -1; // User message (a) should come before assistant message (b)
        }

        // For messages of the same sender type, use timestamp order
        return a.timestamp - b.timestamp;
      });

      // Replace the original array contents
      formattedMessages.length = 0;
      formattedMessages.push(...orderedMessages);

      // Filter out any system context messages including project creation messages
      const filteredMessages = formattedMessages.filter(msg =>
        msg.sender !== 'system' || msg.type === 'error'
      );

      console.log(`Loaded ${filteredMessages.length} messages for conversation ${taskId} (filtered from ${formattedMessages.length})`);

      // No typing messages to clear anymore

      // Set messages directly without any typing effect
      // Mark all messages as not new to prevent typing effect
      const messagesWithoutTypingEffect = filteredMessages.map(msg => ({
        ...msg,
        isNew: false, // Explicitly mark as not new to prevent typing effect
        noScroll: true // Add flag to prevent scrolling for these messages
      }));

      // Use a ref to track that we're loading a conversation
      // This will be used to prevent auto-scrolling
      window.isLoadingConversation = true;

      // CRITICAL FIX: Make sure there are no loading messages in loaded conversations
      // Filter out any loading messages that might have been saved
      const messagesWithoutLoading = messagesWithoutTypingEffect.filter(msg => !msg.isLoading);

      // Set messages without any loading indicators
      setMessages(messagesWithoutLoading);

      // Turn off loading state when conversation is loaded
      setIsLoading(false);

      // After a short delay, reset the loading flag
      setTimeout(() => {
        window.isLoadingConversation = false;
      }, 1000);

      // Do not force any scrolling - let user control scrolling completely

      // Always set up an SSE connection regardless of task status
      // This ensures we can continue the conversation even if the task was previously completed
      console.log(`Setting up SSE connection for task ${taskId} (status: ${task.status}).`);

      // Close any existing connection first
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Create a new SSE connection
      setupEventSource(taskId);

      // If the task is already completed, make sure loading is turned off
      if (task.status === 'completed' || task.status.startsWith('failed')) {
        console.log(`Task ${taskId} is already finished (${task.status}), but SSE connection is ready for continuation.`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`Failed to load conversation ${taskId}:`, error);
      setIsLoading(false);
      setCurrentTaskId(null); // Reset if loading failed
      // Handle error display
    }
  }, [currentTaskId, fetchConversations, setupEventSource]);


  // --- Component Lifecycle & Event Handlers ---

  // Fetch conversations on initial mount and load conversation from URL if taskId is present
  useEffect(() => {
    fetchConversations();

    // If taskId is provided in the URL, load that conversation
    if (taskId) {
      loadConversation(taskId);
    }
    // Start with a new chat interface if no conversations exist or none selected
  }, [fetchConversations, taskId, loadConversation]); // Include taskId and loadConversation in dependencies

  // Cleanup SSE connection on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        console.log("Closed SSE connection on component unmount");
      }
    };
  }, []);

  // Monitor SSE connection and reconnect if needed ONLY for active conversations
  useEffect(() => {
    // Only run this effect if we have a current task ID, we're not loading, and the task is not completed
    if (!currentTaskId || isLoading || currentTaskStatus === 'completed' || currentTaskStatus?.startsWith('failed')) {
      return;
    }

    // Check if we need to reconnect the SSE connection
    const checkConnection = () => {
      // If we have an active task ID but no SSE connection, or the connection is closed
      if (currentTaskId &&
        (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) &&
        currentTaskStatus !== 'completed' &&
        !currentTaskStatus?.startsWith('failed')) {

        console.log(`SSE connection missing or closed for active task ${currentTaskId}, reconnecting...`);

        // Use the reusable setupEventSource function to create a new connection
        setupEventSource(currentTaskId);
      }
    };

    // Check connection immediately
    checkConnection();

    // For active tasks, set up a periodic check every 10 seconds (increased from 5 to reduce frequency)
    const intervalId = setInterval(checkConnection, 10000);

    // Clean up the interval when the component unmounts or dependencies change
    return () => clearInterval(intervalId);
  }, [currentTaskId, currentTaskStatus, isLoading, setupEventSource]);


  // Example project names for suggestions
  const exampleProjects = ['Web-App', 'Data-Analysis', 'ML-Model', 'API-Service', 'Portfolio'];

  // Handle starting a new chat
  const handleNewChat = () => {
    console.log('Starting new chat...');
    if (eventSourceRef.current) {
      eventSourceRef.current.close(); // Close any active SSE connection
      eventSourceRef.current = null;
    }
    setCurrentTaskId(null);
    setCurrentTaskStatus(null); // Reset task status
    setMessages([]);
    setInputMessage('');
    setIsLoading(false); // Ensure loading is off
    setProjectName(''); // Reset project name
    setShowProjectInput(true); // Show the project name input field

    // Navigate to the base chat route
    navigate('/chat');

    // We'll use a dedicated UI component instead of a system message
    setMessages([]);
  };

  // Handle project name example click
  const handleExampleClick = (example) => {
    setInputMessage(example);
    // Focus the input field after selecting an example
    document.querySelector('.project-name-input')?.focus();
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputMessage.trim();
    if (!prompt || isLoading) return;

    // Check if we're in project name input mode
    if (showProjectInput) {
      // Handle project name submission
      setProjectName(prompt);
      setShowProjectInput(false);
      setInputMessage('');

      // Don't add any project creation message - we're filtering these out
      setMessages([]);

      setIsLoading(false);
      return;
    }

    // For regular messages, display user message immediately with a unique ID
    const currentTimestamp = Date.now();
    // Create a truly unique ID with multiple random components
    const randomPart1 = Math.random().toString(36).substring(2, 10);
    const randomPart2 = Math.random().toString(36).substring(2, 10);
    const userMessageId = `user-${currentTimestamp}-${randomPart1}-${randomPart2}`;

    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text: prompt,
      type: 'prompt',
      timestamp: currentTimestamp,
      isNew: true, // Mark as a new message for animation
      isFixed: true, // Mark as fixed to prevent modifications
      isPermanent: true // Special flag to prevent this message from being removed
    };

    // Clear input immediately for better UX
    setInputMessage('');

    // Set loading start time for the timer
    const startTime = Date.now() + 100; // Ensure loading message timestamp is after user message

    // Create a single consistent loading message with a unique ID
    const loadingRandomPart1 = Math.random().toString(36).substring(2, 10);
    const loadingRandomPart2 = Math.random().toString(36).substring(2, 10);
    const loadingMessageId = `assistant-loading-${startTime}-${loadingRandomPart1}-${loadingRandomPart2}`;

    const loadingMessage = {
      id: loadingMessageId,
      sender: 'assistant',
      text: 'Thinking...',
      type: 'think',
      timestamp: startTime, // Ensure timestamp is after user message
      displayTimestamp: new Date(startTime).toLocaleTimeString(),
      isNew: true,
      isLoading: true, // Mark as a loading message that will be removed when response arrives
      loadingStartTime: startTime // Store the start time for potential animation
    };

    // CRITICAL: Set loading state to true BEFORE adding any messages
    setIsLoading(true);
    console.log("Setting isLoading to TRUE");

    // First add the user message and the loading message in a single update
    // This ensures we always have exactly one loading message per user message
    setMessages(prev => {
      const filteredMessages = prev.filter(msg => !msg.isLoading);
      const lastMsg = filteredMessages[filteredMessages.length - 1];
      if (lastMsg && lastMsg.sender === 'user' && lastMsg.text === prompt) {
        return [...filteredMessages, loadingMessage];
      }
      return [...filteredMessages, userMessage, loadingMessage];
    });

    // Scroll to the messages immediately
    setTimeout(() => {
      scrollToBottom();
    }, 50);

    // Make sure loading state stays true
    setIsLoading(true);

    try {
      if (!currentTaskId) {
        // If no current task, create a new one with fast_mode parameter
        console.log("Creating new task with prompt:", prompt);

        const response = await fetch(`${API_BASE_URL}/tasks?fast_mode=true&buffer_size=1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            project_name: projectName // Include the project name
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const newTaskId = data.task_id;
        console.log("Created new task with ID:", newTaskId);
        setCurrentTaskId(newTaskId);
        await fetchConversations();

        // Navigate to the new task route
        navigate(`/chat/${newTaskId}`);

        // Start a new SSE connection for this task
        setupEventSource(newTaskId);

        // Make sure loading state is still true after all this async work
        setIsLoading(true);
      } else {
        // If there's an existing task, continue the conversation
        console.log(`Continuing conversation with task ${currentTaskId}...`);

        // Always close any existing SSE connection first to ensure a fresh connection
        if (eventSourceRef.current) {
          console.log(`Closing existing SSE connection for task ${currentTaskId} before continuing...`);
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Create a new SSE connection for the continued conversation
        setupEventSource(currentTaskId);

        // Now send the continuation request with fast_mode parameter
        console.log(`Sending continuation request for task ${currentTaskId} with prompt:`, prompt);
        const response = await fetch(`${API_BASE_URL}/tasks/${currentTaskId}/continue?fast_mode=true&buffer_size=1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          const errorText = await response.text();
          console.error(`Error response: ${errorText}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log(`Successfully sent continuation request for task ${currentTaskId}:`, responseData);

        // Set the current task status to running
        setCurrentTaskStatus('running');

        // Make sure loading state is still true after all this async work
        setIsLoading(true);
      }
    } catch (error) {
      console.error(`Error sending message: ${error.message}`);

      // Remove any temporary loading messages on error and add the error message in a single update
      // This ensures we don't have flickering or multiple state updates
      setMessages(prev => {
        // First filter out temporary messages
        const filteredMessages = prev.filter(msg =>
          msg.isPermanent || // Keep permanent messages
          !(msg.isTemporary || msg.isThinking || msg.isLoading) // Filter out temporary messages
        );

        // Don't add error messages to the UI
        console.log(`Error sending message: ${error.message}, but not displaying in UI`);
        return filteredMessages;
      });

      // Explicitly set loading state to false
      setIsLoading(false);
      console.log("Error occurred, turning off loading state");
    }
  };



  // Auto-scroll when new messages are added
  useEffect(() => {
    // Only scroll for new messages from the assistant
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'assistant' && lastMessage.isNew) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Toggle sidebar for mobile
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Function to handle code block rendering with action buttons
  const handleFileAction = (codeContent, language, action) => {
    // Create a filename based on language or default to txt
    let fileName;

    if (action === 'run') {
      // Always use Python for run action
      fileName = `chat_code_${Date.now()}.py`;
    } else {
      // For edit action, use the language or default to txt
      fileName = `chat_code_${Date.now()}.${language || 'txt'}`;
    }

    console.log(`Opening file in IDE: ${fileName}, action: ${action}`);

    // Store file data in both localStorage and sessionStorage
    const fileData = {
      project: "default", // Use default project
      fileName: fileName,
      content: codeContent,
      action: action,
      // Add a timestamp to ensure uniqueness
      timestamp: Date.now()
    };

    // Use sessionStorage as primary and localStorage as backup
    sessionStorage.setItem('ide_file_data', JSON.stringify(fileData));
    localStorage.setItem('ideFileToOpen', JSON.stringify(fileData));

    // Navigate to IDE
    window.location.href = '/ide';
  };

  const renderCodeBlock = (codeContent, language) => {
    return (
      <pre>
        <div className="file-actions">
          <button
            className="file-action-button edit"
            title="Edit in IDE"
            onClick={() => handleFileAction(codeContent, language, 'edit')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="file-action-button run"
            title="Run in IDE"
            onClick={() => handleFileAction(codeContent, language, 'run')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <code className={language ? `language-${language}` : ''}>{codeContent}</code>
      </pre>
    );
  };

  // Removed unused function: extractFileNameFromCode

  // Enhanced function to render message content with streaming support
  const renderMessageContent = (text, isLoading, messageType, isStreaming) => {
    // Handle empty content
    if (!text && !isLoading) return '';

    // Show loading animation for loading messages
    if (isLoading || text === 'Thinking...') {
      return (
        <div className="typing-container">
          <div className="typing-header">
            <LottieLoading width={100} height={50} />
          </div>
        </div>
      );
    }

    // Process and render the message content based on message type
    if (messageType === 'think') {
      return renderThinkContent(text, isStreaming);
    } else if (messageType === 'tool' || messageType === 'act') {
      return renderToolContent(text, isStreaming);
    } else {
      return processMessageContent(text, isStreaming);
    }
  };

  // Enhanced render "think" type messages with special formatting and streaming support
  const renderThinkContent = (text, isStreaming = false) => {
    // Format MonAgent's thoughts with special styling
    if (text.includes("MonAgent's thoughts:")) {
      const thoughts = text.replace(/✨\s*MonAgent's thoughts:\s*/, '');

      return (
        <div className={`think-content ${isStreaming ? 'streaming' : ''}`}>
          <div className="message-type-indicator think-indicator">
            <ThinkIcon isDarkMode={isDarkMode} />
            <span>Think</span>
            {isStreaming && (
              <div className="streaming-indicator">
                <span className="streaming-dot"></span>
                <span className="streaming-dot"></span>
                <span className="streaming-dot"></span>
              </div>
            )}
          </div>
          <p className="think-header">✨ MonAgent's thoughts:</p>
          <div className="think-body">
            {processThoughtContent(thoughts)}
          </div>
        </div>
      );
    }

    return processMessageContent(text, isStreaming);
  };

  // Helper function to process thought content
  const processThoughtContent = (thoughts) => {
    // Check if the thoughts contain a numbered list
    if (thoughts.match(/\d+\.\s+/)) {
      // Process the thoughts to extract steps
      const steps = thoughts.split(/(?=\d+\.\s+)/).filter(step => step.trim());

      return (
        <>
          {steps.map((step, index) => {
            // Split step into title and description if possible
            const match = step.match(/(\d+\.\s+[^:]+):(.*)/s);
            if (match) {
              return (
                <div key={index} className="think-step">
                  <p className="think-step-title">{match[1]}</p>
                  <p className="think-step-description">{match[2].trim()}</p>
                </div>
              );
            } else {
              return <p key={index} className="think-step">{step}</p>;
            }
          })}
        </>
      );
    } else {
      // Regular thoughts without numbered steps
      return <p>{thoughts}</p>;
    }
  };

  // Render "tool" or "act" type messages with special formatting
  const renderToolContent = (text) => {
    // Format tool execution results
    if (text.includes("completed its mission!")) {
      const match = text.match(/🎯\s*Tool\s*"([^"]+)"\s*completed its mission!\s*Result:\s*(.*)/s);
      if (match) {
        const toolName = match[1];
        const result = match[2];

        // Check if result contains command execution
        const cmdMatch = result.match(/Observed output of cmd\s+`?([^`]+)`?\s+executed:/);
        if (cmdMatch) {
          const command = cmdMatch[1];
          const output = result.replace(/Observed output of cmd\s+`?([^`]+)`?\s+executed:/, '').trim();

          return (
            <div className="tool-content">
              <div className="message-type-indicator tool-indicator">
                <ToolIcon isDarkMode={isDarkMode} />
                <span>Tool</span>
              </div>
              <p className="tool-header">🎯 Tool "{toolName}" completed its mission!</p>
              <div className="tool-result">
                <p className="tool-command">$ {command}</p>
                <pre className="tool-output">{output}</pre>
              </div>
            </div>
          );
        }

        return (
          <div className="tool-content">
            <div className="message-type-indicator tool-indicator">
              <ToolIcon isDarkMode={isDarkMode} />
              <span>Tool</span>
            </div>
            <p className="tool-header">🎯 Tool "{toolName}" completed its mission!</p>
            <p className="tool-result">{result}</p>
          </div>
        );
      }
    }

    // For step-by-step execution results
    if (text.match(/Step \d+:/)) {
      const steps = text.split(/(?=Step \d+:)/).filter(step => step.trim());

      // Try to extract total steps information
      let totalSteps = null;
      const totalStepsMatch = text.match(/Step \d+ of (\d+):/);
      if (totalStepsMatch) {
        totalSteps = parseInt(totalStepsMatch[1], 10);
      }

      return (
        <div className="steps-container">
          {totalSteps && (
            <div className="step-progress-container">
              <div
                className="step-progress-bar"
                style={{ width: `${Math.min(100, (steps.length / totalSteps) * 100)}%` }}
              ></div>
            </div>
          )}

          {steps.map((step, index) => {
            const stepMatch = step.match(/Step (\d+)(?:\s+of\s+(\d+))?:(.*?)(?=\n|$)([\s\S]*)/);
            if (stepMatch) {
              const stepNumber = stepMatch[1];
              const stepTotal = stepMatch[2] || totalSteps;
              const stepTitle = stepMatch[3].trim();
              const stepContent = stepMatch[4] ? stepMatch[4].trim() : '';

              // Calculate progress percentage if we know total steps
              const progressPercentage = stepTotal ? Math.round((parseInt(stepNumber, 10) / parseInt(stepTotal, 10)) * 100) : null;

              return (
                <div key={index} className="sequential-step">
                  <div className="sequential-step-header">
                    <div className="step-number">{stepNumber}</div>
                    <span>{stepTitle}</span>
                    {progressPercentage !== null && (
                      <span className="step-percentage">{progressPercentage}%</span>
                    )}
                  </div>
                  {stepContent && (
                    <div className="sequential-step-content">
                      {processMessageContent(stepContent)}
                    </div>
                  )}
                </div>
              );
            } else {
              return <p key={index}>{step}</p>;
            }
          })}
        </div>
      );
    }

    return processMessageContent(text);
  };

  // Enhanced process message content with streaming support
  const processMessageContent = (content, isStreaming = false) => {
    if (!content) return '';

    // Improved regex to find code blocks with better language detection
    const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g;

    // Split the content by code blocks
    const parts = [];
    let lastIndex = 0;
    let match;

    // First process code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        // Process inline code in text before code block
        const textBeforeBlock = content.substring(lastIndex, match.index);
        parts.push(processInlineCode(textBeforeBlock));
      }

      // Add code block with action buttons
      const language = match[1].trim();
      const code = match[2].trim();
      parts.push(renderCodeBlock(code, language));

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text with inline code processing
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parts.push(processInlineCode(remainingText));
    }

    // Return the processed content with enhanced animation
    return (
      <div className={`message-content-wrapper ${isStreaming ? 'streaming' : ''}`}>
        {parts.map((part, index) => {
          if (typeof part === 'string') {
            // Process line breaks and basic markdown
            const processedText = part
              .replace(/\n/g, '<br />') // Handle line breaks
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold text
              .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic text
              .replace(/~~([^~]+)~~/g, '<del>$1</del>'); // Strikethrough

            return (
              <span
                key={index}
                className="animated-text"
                dangerouslySetInnerHTML={{ __html: processedText }}
              />
            );
          }
          return <span key={index} className="animated-text">{part}</span>;
        })}
        {isStreaming && (
          <span className="streaming-cursor"></span>
        )}
      </div>
    );
  };

  // Helper function to process inline code
  const processInlineCode = (text) => {
    if (!text) return '';

    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add inline code with styling
      const code = match[1];
      parts.push(`<code class="inline-code">${code}</code>`);

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.join('');
  };

  // Helper function to format timestamps with seconds
  const formatTimestamp = (timestamp) => {
    // If timestamp is undefined or invalid, use current time but log a warning
    if (!timestamp || isNaN(timestamp)) {
      console.warn('Invalid timestamp encountered:', timestamp);
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // Use the provided timestamp
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Helper function to get the appropriate icon for message types
  const getMessageTypeIcon = (type, isDarkMode) => {
    switch (type) {
      case 'think':
        return <ThinkIcon isDarkMode={isDarkMode} />;
      case 'tool':
        return <ToolIcon isDarkMode={isDarkMode} />;
      default:
        return null;
    }
  };

  // Add this function to handle conversation deletion
  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation(); // Prevent navigation to the conversation

    if (window.confirm(`Are you sure you want to delete this conversation? `)) {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/database/task/${conversationId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete conversation: ${response.status}`);
        }

        // Remove the conversation from the list
        setConversations(conversations.filter(convo => convo.id !== conversationId));

        // If the deleted conversation was the current one, go back to empty state
        if (conversationId === currentTaskId) {
          navigate('/chat');
          setCurrentTaskId(null);
          setMessages([]);
        }

      } catch (error) {
        console.error(`Failed to delete conversation ${conversationId}:`, error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  // --- Fix: Ensure unique, strictly increasing timestamps and robust ordering ---
  // Helper to generate a unique timestamp greater than the previous
  function getSafeTimestamp(prevTimestamp) {
    const now = Date.now();
    return now > prevTimestamp ? now : prevTimestamp + 1;
  }

  // --- Render ---
  return (
    <div className={`chat-container ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* Theme toggle button */}
      <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="new-chat-button" onClick={handleNewChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          New Chat
        </button>

        {/* Project indicator */}
        {projectName && (
          <div className="project-indicator" style={!isDarkMode ? { backgroundColor: 'rgba(56, 161, 105, 0.1)', color: '#38A169' } : {}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5C3 3.89543 3.89543 3 5 3H9.5C10.0304 3 10.5391 3.21071 10.9142 3.58579L12.5 5.17157C12.8751 5.54664 13.3838 5.75736 13.9142 5.75736H19C20.1046 5.75736 21 6.65279 21 7.75736V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke={!isDarkMode ? "#38A169" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Project: {projectName}</span>
          </div>
        )}

        <div className="conversation-list">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`conversation-item ${convo.id === currentTaskId ? 'selected' : ''}`}
              onClick={() => {
                navigate(`/chat/${convo.id}`);
                loadConversation(convo.id);
              }}
              title={`${convo.title}\nStatus: ${convo.status}\nCreated: ${new Date(convo.created_at).toLocaleString()}`}
              style={!isDarkMode && convo.id === currentTaskId ? {
                backgroundColor: 'rgba(56, 161, 105, 0.1)',
                borderLeft: '3px solid #38A169',
                color: '#2D3748',
                fontWeight: '500'
              } : {}}
            >
              {convo.title}
              <button
                className="delete-conversation-btn"
                onClick={(e) => handleDeleteConversation(convo.id, e)}
                title="Delete conversation"
                aria-label="Delete conversation"
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>
        {/* Add other sidebar items like settings, user profile etc. here */}
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Button to toggle sidebar on mobile */}
        <button className="menu-button" onClick={toggleSidebar}>
          {isSidebarOpen ? '✕' : '☰'} {/* Simple toggle icon */}
        </button>

        <div className="chat-messages">
          {showProjectInput ? (
            <div className="project-name-input-container">
              <div className="icon-container">
                <svg className="folder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5C3 3.89543 3.89543 3 5 3H9.5C10.0304 3 10.5391 3.21071 10.9142 3.58579L12.5 5.17157C12.8751 5.54664 13.3838 5.75736 13.9142 5.75736H19C20.1046 5.75736 21 6.65279 21 7.75736V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2>Name Your Project</h2>
              <p>Give your project a name to organize files created during this conversation. All files will be saved in a dedicated folder with this name.</p>

              <form className="project-name-input-form" onSubmit={(e) => {
                e.preventDefault();
                const projectName = inputMessage.trim();
                if (projectName) {
                  // Handle project name submission separately
                  setProjectName(projectName);
                  setShowProjectInput(false);
                  setInputMessage('');

                  // Don't add any project creation message - we're filtering these out
                  setMessages([]);
                }
              }}>
                <input
                  type="text"
                  className="project-name-input"
                  placeholder="Enter a project name..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="project-name-submit"
                  disabled={!inputMessage.trim()}
                  style={!isDarkMode ? { backgroundColor: '#38A169', boxShadow: '0 4px 12px rgba(56, 161, 105, 0.2)' } : {}}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Create Project
                </button>
              </form>

              <div className="project-name-examples">
                <p>Examples:</p>
                {exampleProjects.map((example, index) => (
                  <span
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    style={!isDarkMode ? {
                      backgroundColor: 'rgba(56, 161, 105, 0.08)',
                      borderColor: 'rgba(56, 161, 105, 0.3)',
                      color: '#38A169'
                    } : {}}
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Ensure messages are displayed in chronological order */}
              {groupMessagesByType(messages).map((group, groupIndex) => (
                <div key={`group-${groupIndex}`} className={`message-group ${group[0].sender}-group`}>
                  {group.map((msg, msgIndex) => {
                    // No typing effect anymore - display full text immediately
                    const displayText = msg.text;

                    return (
                      <div key={msg.id}
                        className={`message ${msg.sender} type-${msg.type} ${msg.isNew ? 'new-message' : ''} ${msg.isLoading ? 'isLoading' : ''}`}
                        style={{ willChange: 'transform, opacity' }}>
                        {/* Always show avatar for the first message in a group */}
                        {msgIndex === 0 && (
                          <div className={`message-avatar ${msg.sender === 'assistant' && isLoading ? 'pulse-animation' : ''}`}>
                            <img
                              src={msg.sender === 'user' ? USER_AVATAR : ASSISTANT_AVATAR}
                              alt={msg.sender === 'user' ? 'User' : 'Assistant'}
                              width="20"
                              height="20"
                            />
                          </div>
                        )}
                        {/* For subsequent messages in a group, add a spacer to align with the first message */}
                        {msgIndex !== 0 && <div className="message-avatar-spacer"></div>}
                        <div className="message-content">
                          {/* Always show sender name and timestamp for every message */}
                          <div className="message-header">
                            <span className="message-sender">
                              {msg.sender === 'user' ? 'You' : 'Assistant'}
                            </span>
                            <span className="message-timestamp">{formatTimestamp(msg.timestamp)}</span>
                          </div>
                          {msg.type !== 'prompt' && msg.type !== 'result' && (
                            <div className={`message-type-indicator ${msg.type}-indicator`}>
                              {getMessageTypeIcon(msg.type, isDarkMode)}
                              <span>{msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}</span>
                            </div>
                          )}
                          {/* Always show thinking indicator for thinking messages */}
                          {msg.type === 'think' && (
                            <div className="thinking-indicator">
                              <span className="thinking-dot"></span>
                              <span className="thinking-dot"></span>
                              <span className="thinking-dot"></span>
                            </div>
                          )}
                          <div className={`message-text ${msg.type === 'think' ? 'thinking-text' : ''} ${msg.type === 'tool' || msg.type === 'act' ? 'tool-text' : ''} ${msg.isFinalMessage ? 'final-message' : ''} ${msg.isStreaming ? 'streaming-message' : ''}`}>
                            {/* Always show at least a placeholder if there's no content */}
                            {!displayText || displayText.trim() === '' ? (
                              <div className="typing-container">
                                <div className="typing-header">
                                  <LottieLoading width={100} height={50} />
                                </div>
                              </div>
                            ) : (
                              renderMessageContent(displayText, msg.isLoading, msg.type, msg.isStreaming)
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* REMOVED: Standalone "Assistant is thinking..." message - we'll rely on the message in the messages array */}
              {/* Debug info removed - uncomment if needed for troubleshooting
              <div className="debug-info" style={{ position: 'fixed', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '5px', fontSize: '10px', zIndex: 1000, opacity: 0.7, maxWidth: '200px', borderRadius: '5px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Debug Info:</div>
                <div>isLoading: <span style={{ color: isLoading ? '#00ff00' : '#ff6666' }}>{isLoading ? 'true' : 'false'}</span></div>
                <div>Has loading msg: <span style={{ color: messages.some(msg => msg.isLoading) ? '#00ff00' : '#ff6666' }}>{messages.some(msg => msg.isLoading) ? 'true' : 'false'}</span></div>
                <div>Messages: {messages.length}</div>
                <div>Events visible: <span style={{ color: messages.some(msg => msg.type === 'think' || msg.type === 'tool' || msg.type === 'act') ? '#00ff00' : '#ff6666' }}>
                  {messages.some(msg => msg.type === 'think' || msg.type === 'tool' || msg.type === 'act') ? 'true' : 'false'}
                </span></div>
              </div>
              */}
            </>
          )}
          {/* Simple scroll target div - only used for new messages */}
          <div ref={messagesEndRef} style={{ height: '1px', width: '1px' }} />
        </div>

        <div className="input-container">
          <div className="input-box">
            <form onSubmit={handleSubmit}>
              <textarea
                rows="1"
                placeholder={showProjectInput
                  ? "Enter a project name..."
                  : projectName
                    ? `Send a message (Project: ${projectName})...`
                    : "Send a message to continue this conversation..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className="chat-textarea"
                disabled={isLoading && messages.length > 0}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="send-button"
                style={!isDarkMode ? {
                  background: 'linear-gradient(135deg, #38A169 0%, #2F855A 100%)',
                  boxShadow: '0 2px 8px rgba(56, 161, 105, 0.2)'
                } : {}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && !messages.some(msg =>
        msg.sender === 'assistant' &&
        ['result', 'tool', 'act', 'think'].includes(msg.type) &&
        !msg.isLoading
      ) && (
          <LoadingOverlay />
        )}
    </div>
  );
}

export default Chat;
