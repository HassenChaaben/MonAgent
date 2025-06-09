import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/NewChat.css';
import { USER_AVATAR, ASSISTANT_AVATAR } from './AvatarIcons';
import LottieLoading from './LottieLoading';

// Define the backend URL
const API_BASE_URL = 'http://localhost:8080';

// Icon components
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

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Loading overlay component
function LoadingOverlay() {
  return (
    <div className="loading-overlay">
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
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [projectName, setProjectName] = useState('');
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTaskStatus, setCurrentTaskStatus] = useState(null);

  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Enhanced scroll to bottom with smooth animation
  const scrollToBottom = useCallback(() => {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });

      // Add a subtle highlight effect to the newest message
      const newestMessage = document.querySelector('.new-message');
      if (newestMessage) {
        newestMessage.classList.add('message-highlight');
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

  // Function to format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to get message type icon
  const getMessageTypeIcon = (type, isDarkMode) => {
    switch (type) {
      case 'think':
        return <ThinkIcon isDarkMode={isDarkMode} />;
      case 'tool':
      case 'act':
        return <ToolIcon isDarkMode={isDarkMode} />;
      default:
        return null;
    }
  };

  // Function to render message content with proper formatting
  const renderMessageContent = (text, isLoading, type, isStreaming) => {
    if (!text || text.trim() === '') {
      return <div className="empty-message">Empty message</div>;
    }

    // For code blocks, apply syntax highlighting
    if (text.includes('```')) {
      const parts = text.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g);
      return (
        <div className="formatted-message">
          {parts.map((part, i) => {
            if (part.startsWith('```') && part.endsWith('```')) {
              // Extract language and code
              const match = part.match(/```([\w-]+)?\n([\s\S]*?)\n```/);
              const language = match && match[1] ? match[1] : '';
              const code = match && match[2] ? match[2] : part.slice(3, -3);

              return (
                <pre key={i} className={`code-block ${language}`}>
                  <code>{code}</code>
                </pre>
              );
            } else {
              return <span key={i}>{part}</span>;
            }
          })}
        </div>
      );
    }

    // Regular text message
    return <div className="text-message">{text}</div>;
  };

  // Function to group messages by sender for UI display
  const groupMessagesByType = useCallback((messages) => {
    if (!messages || messages.length === 0) return [];

    // Normalize timestamps and ensure proper ordering
    const normalizedMessages = messages.map((msg, index) => {
      const messageCopy = { ...msg };

      // Ensure timestamp is a number in milliseconds
      if (typeof messageCopy.timestamp === 'string') {
        messageCopy.timestamp = new Date(messageCopy.timestamp).getTime();
      } else if (messageCopy.timestamp instanceof Date) {
        messageCopy.timestamp = messageCopy.timestamp.getTime();
      } else if (!messageCopy.timestamp || isNaN(messageCopy.timestamp)) {
        const baseTime = Date.now() - (messages.length * 1000);
        messageCopy.timestamp = baseTime + (index * 1000);
      }

      return messageCopy;
    });

    // Sort messages by timestamp
    normalizedMessages.sort((a, b) => {
      // Ensure user messages come before assistant messages when timestamps are close
      if (Math.abs(a.timestamp - b.timestamp) < 1000) {
        if (a.sender === 'user' && b.sender === 'assistant') return -1;
        if (a.sender === 'assistant' && b.sender === 'user') return 1;
      }
      return a.timestamp - b.timestamp;
    });

    // Group messages by sender
    const groups = [];
    let currentGroup = [];

    for (let i = 0; i < normalizedMessages.length; i++) {
      const message = normalizedMessages[i];
      const prevMessage = i > 0 ? normalizedMessages[i - 1] : null;

      // Start a new group if sender changes or it's a user/system message
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

  // Fetch conversation history (tasks)
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      // Map tasks to conversation format
      const fetchedConversations = tasks.map(task => ({
        id: task.id,
        title: task.prompt.substring(0, 40) + (task.prompt.length > 40 ? '...' : ''),
        status: task.status,
        created_at: task.created_at,
      }));
      setConversations(fetchedConversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, []);

  // Setup SSE event handling with improved streaming
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
        // Create a unique message ID
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
          isStreaming: true,
          ...stepInfo
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
                  ...stepInfo
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
                  ...stepInfo
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
        console.log("Raw think event data:", event.data);
        const data = JSON.parse(event.data);
        updateMessageStream('think', data);
      } catch (e) {
        console.error("Error processing think event:", e);
        console.error("Raw event data:", event.data);
        console.error("Event object:", event);
      }
    });

    eventSource.addEventListener('tool', (event) => {
      try {
        console.log("Raw tool event data:", event.data);
        const data = JSON.parse(event.data);
        updateMessageStream('tool', data);
      } catch (e) {
        console.error("Error processing tool event:", e);
        console.error("Raw event data:", event.data);
        console.error("Event object:", event);
      }
    });

    eventSource.addEventListener('act', (event) => {
      try {
        console.log("Raw act event data:", event.data);
        const data = JSON.parse(event.data);
        updateMessageStream('act', data);
      } catch (e) {
        console.error("Error processing act event:", e);
        console.error("Raw event data:", event.data);
        console.error("Event object:", event);
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        console.log("Raw error event data:", event.data);
        const data = JSON.parse(event.data);
        updateMessageStream('error', data);
      } catch (e) {
        console.error("Error processing error event:", e);
        console.error("Raw event data:", event.data);
        console.error("Event object:", event);
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
        console.log("Streaming started:", JSON.parse(event.data));
      } catch (e) {
        console.error("Error processing streaming_start event:", e);
      }
    });

    // Handle streaming end event
    eventSource.addEventListener('streaming_end', (event) => {
      try {
        console.log("Streaming ended:", JSON.parse(event.data));

        // Mark all streaming messages as no longer streaming
        setMessages(prev =>
          prev.map(msg =>
            msg.isStreaming ? { ...msg, isStreaming: false } : msg
          )
        );

        setTimeout(scrollToBottom, 100);
      } catch (e) {
        console.error("Error processing streaming_end event:", e);
      }
    });

    // Handle complete event
    eventSource.addEventListener('complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Complete event received:", data);

        // Check if we already have a result message to update
        const hasResultMessage = messageStreams.result !== null;

        if (hasResultMessage) {
          // Update the existing result message
          setMessages(prev => {
            return prev.map(msg => {
              if (msg.id === messageStreams.result) {
                return {
                  ...msg,
                  text: data.result,
                  isStreaming: false,
                  isFinalMessage: true
                };
              }
              return msg;
            });
          });
        } else {
          // Create a new final message
          const uniqueTimestamp = new Date().getTime();
          const randomPart1 = Math.random().toString(36).substring(2, 10);
          const randomPart2 = Math.random().toString(36).substring(2, 10);
          const contentHash = data.result ? data.result.substring(0, 5).replace(/\s/g, '') : '';
          const messageId = `${taskId}-complete-${uniqueTimestamp}-${randomPart1}-${randomPart2}-${contentHash}`;

          setMessages(prev => [
            ...prev,
            {
              id: messageId,
              sender: 'assistant',
              text: data.result,
              type: 'result',
              timestamp: data.timestamp || Date.now(),
              displayTimestamp: formatTimestamp(data.timestamp || Date.now()),
              isNew: true,
              isFinalMessage: true
            }
          ]);
        }

        // Mark all streaming messages as no longer streaming
        setMessages(prev =>
          prev.map(msg =>
            msg.isStreaming ? { ...msg, isStreaming: false } : msg
          )
        );

        setTimeout(scrollToBottom, 100);

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
      console.error("EventSource readyState:", eventSource.readyState);
      console.error("EventSource url:", eventSource.url);

      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("EventSource connection closed");
        setIsLoading(false);
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        console.log("EventSource reconnecting...");
      }
    };

    return eventSource;
  }, [scrollToBottom, formatTimestamp]);

  // Function to load a conversation
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
          setCurrentTaskId(null);
          setIsLoading(false);
          fetchConversations(); // Refresh list
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const task = await response.json();

      // Store the task status
      setCurrentTaskStatus(task.status);
      console.log(`Task ${taskId} status: ${task.status}`);

      // Set project name from task
      if (task.project_name) {
        setProjectName(task.project_name);
        setShowProjectInput(false);
      }

      // Format messages from task steps
      const formattedMessages = [];
      let lastTimestamp = new Date(task.created_at).getTime();
      let stepIndex = 0;

      // Add initial prompt as the first user message
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

      // Process all steps
      task.steps.forEach((step, index) => {
        // Ensure proper timestamp ordering
        let stepTimestamp = step.timestamp ? new Date(step.timestamp).getTime() : lastTimestamp + 1;
        if (stepTimestamp <= lastTimestamp) stepTimestamp = lastTimestamp + 1;
        lastTimestamp = stepTimestamp;

        // Generate a unique ID for each message
        const uniqueId = `${taskId}-${step.type}-${index}-${stepTimestamp}-${Math.random().toString(36).substring(2, 8)}`;

        let msg = null;

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

      // Sort messages by timestamp and step index
      formattedMessages.sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return (a.stepIndex || 0) - (b.stepIndex || 0);
      });

      // Ensure all messages have valid timestamps
      formattedMessages.forEach((msg) => {
        // Ensure timestamp is a number in milliseconds
        if (typeof msg.timestamp === 'string') {
          msg.timestamp = new Date(msg.timestamp).getTime();
        } else if (msg.timestamp instanceof Date) {
          msg.timestamp = msg.timestamp.getTime();
        }

        // Add a display timestamp for UI rendering
        msg.displayTimestamp = formatTimestamp(msg.timestamp);

        // Ensure the timestamp is fixed
        msg.timestampFixed = true;
      });

      // Filter out system context messages
      const filteredMessages = formattedMessages.filter(msg =>
        msg.sender !== 'system' || msg.type === 'error'
      );

      console.log(`Loaded ${filteredMessages.length} messages for conversation ${taskId}`);

      // Set messages without any loading indicators
      setMessages(filteredMessages.map(msg => ({
        ...msg,
        isNew: false, // No typing effect
        noScroll: true // No auto-scroll
      })));

      // Turn off loading state
      setIsLoading(false);

      // Set up SSE connection for continued conversation
      console.log(`Setting up SSE connection for task ${taskId}`);
      setupEventSource(taskId);

      // If task is already completed, ensure loading is off
      if (task.status === 'completed' || task.status.startsWith('failed')) {
        console.log(`Task ${taskId} is already finished (${task.status})`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`Failed to load conversation ${taskId}:`, error);
      setIsLoading(false);
      setCurrentTaskId(null);
    }
  }, [currentTaskId, fetchConversations, setupEventSource, formatTimestamp]);

  // Handle starting a new chat
  const handleNewChat = () => {
    console.log('Starting new chat...');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setCurrentTaskId(null);
    setCurrentTaskStatus(null);
    setMessages([]);
    setInputMessage('');
    setIsLoading(false);
    setProjectName('');
    setShowProjectInput(true);

    // Navigate to the base chat route
    navigate('/chat');
  };

  // Handle project name example click
  const handleExampleClick = (example) => {
    setInputMessage(example);
    // Focus the input field
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
      setMessages([]);
      setIsLoading(false);
      return;
    }

    // For regular messages, display user message immediately
    const currentTimestamp = Date.now();
    // Create a unique user message ID
    const randomPart1 = Math.random().toString(36).substring(2, 10);
    const randomPart2 = Math.random().toString(36).substring(2, 10);
    const userMessageId = `user-${currentTimestamp}-${randomPart1}-${randomPart2}`;

    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text: prompt,
      type: 'prompt',
      timestamp: currentTimestamp,
      isNew: true,
      isFixed: true,
      isPermanent: true
    };

    // Clear input
    setInputMessage('');

    // Create loading message
    const startTime = Date.now() + 100;
    const loadingRandomPart1 = Math.random().toString(36).substring(2, 10);
    const loadingRandomPart2 = Math.random().toString(36).substring(2, 10);
    const loadingMessageId = `assistant-loading-${startTime}-${loadingRandomPart1}-${loadingRandomPart2}`;

    const loadingMessage = {
      id: loadingMessageId,
      sender: 'assistant',
      text: 'Thinking...',
      type: 'think',
      timestamp: startTime,
      displayTimestamp: formatTimestamp(startTime),
      isNew: true,
      isLoading: true,
      loadingStartTime: startTime
    };

    // Set loading state
    setIsLoading(true);
    console.log("Setting isLoading to TRUE");

    // Add user message and loading message
    setMessages(prev => {
      const filteredMessages = prev.filter(msg => !msg.isLoading);
      const lastMsg = filteredMessages[filteredMessages.length - 1];
      if (lastMsg && lastMsg.sender === 'user' && lastMsg.text === prompt) {
        return [...filteredMessages, loadingMessage];
      }
      return [...filteredMessages, userMessage, loadingMessage];
    });

    // Scroll to bottom
    setTimeout(scrollToBottom, 50);

    try {
      if (!currentTaskId) {
        // Create a new task
        console.log("Creating new task with prompt:", prompt);

        const response = await fetch(`${API_BASE_URL}/tasks?fast_mode=true&buffer_size=1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            project_name: projectName
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Task created:", data);

        // Update current task ID
        setCurrentTaskId(data.task_id);

        // Set up SSE connection for the new task
        setupEventSource(data.task_id);

        // Update URL to include task ID
        navigate(`/chat/${data.task_id}`);
      } else {
        // Continue existing conversation
        console.log(`Continuing conversation ${currentTaskId} with prompt:`, prompt);

        const response = await fetch(`${API_BASE_URL}/tasks/${currentTaskId}/continue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("Continuation request sent");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);

      // Add error message
      setMessages(prev => [
        ...prev.filter(msg => !msg.isLoading),
        {
          id: `error-${Date.now()}`,
          sender: 'system',
          text: `Error: ${error.message}. Please try again.`,
          type: 'error',
          timestamp: Date.now(),
          isNew: true
        }
      ]);

      setTimeout(scrollToBottom, 50);
    }
  };

  // Handle conversation deletion
  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm('Are you sure you want to delete this conversation? ')) {
      try {
        console.log(`Attempting to delete conversation ${conversationId}`);

        const response = await fetch(`${API_BASE_URL}/tasks/${conversationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log(`Delete response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Delete failed with status ${response.status}:`, errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Delete successful:', result);

        // If we're deleting the current conversation, go back to new chat
        if (currentTaskId === conversationId) {
          handleNewChat();
        }

        // Refresh the conversation list
        await fetchConversations();

        console.log(`Successfully deleted conversation ${conversationId}`);
      } catch (error) {
        console.error("Error deleting conversation:", error);
        alert(`Failed to delete conversation: ${error.message}. Please try again.`);
      }
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch conversations on initial mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load conversation from URL if taskId is present
  useEffect(() => {
    if (taskId) {
      loadConversation(taskId);
    }
  }, [taskId, loadConversation]);

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

  // Monitor SSE connection and reconnect if needed
  useEffect(() => {
    // Only run this effect if we have a current task ID, we're not loading, and the task is not completed
    if (!currentTaskId || isLoading || currentTaskStatus === 'completed' || currentTaskStatus?.startsWith('failed')) {
      return;
    }

    // Check if we need to reconnect the SSE connection
    const checkConnection = () => {
      if (currentTaskId &&
        (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) &&
        currentTaskStatus !== 'completed' &&
        !currentTaskStatus?.startsWith('failed')) {

        console.log(`SSE connection missing or closed for active task ${currentTaskId}, reconnecting...`);
        setupEventSource(currentTaskId);
      }
    };

    // Check connection immediately
    checkConnection();

    // For active tasks, set up a periodic check every 10 seconds
    const intervalId = setInterval(checkConnection, 10000);

    // Clean up the interval when the component unmounts or dependencies change
    return () => clearInterval(intervalId);
  }, [currentTaskId, currentTaskStatus, isLoading, setupEventSource]);

  // Example project names for suggestions
  const exampleProjects = ['Web-App', 'Data-Analysis', 'ML-Model', 'API-Service', 'Portfolio'];

  return (
    <div className="chat-container">
      {/* Theme toggle button */}
      <button className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode ? (
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
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#F9A825" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
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

        {projectName && (
          <div className="project-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{projectName}</span>
          </div>
        )}

        <div className="conversation-list">
          {conversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${currentTaskId === conversation.id ? 'selected' : ''}`}
              onClick={() => navigate(`/chat/${conversation.id}`)}
            >
              {conversation.title}
              <button
                className="delete-conversation-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(conversation.id);
                }}
                title="Delete conversation"
                aria-label="Delete conversation"
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main" style={{ marginLeft: isSidebarOpen ? '300px' : '0' }}>
        {/* Mobile sidebar toggle */}
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Chat messages */}
        <div className="chat-messages">
          {showProjectInput ? (
            <div className="project-name-input-container">
              <div className="icon-container">
                <svg className="folder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2>Create a New Project</h2>
              <p>Enter a name for your project to help organize your files and conversations.</p>
              <form className="project-name-input-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="project-name-input"
                  placeholder="Enter project name..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="project-name-submit"
                  disabled={!inputMessage.trim()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Create Project
                </button>
              </form>
              <div className="project-name-examples">
                <p>Examples:</p>
                {exampleProjects.map((example) => (
                  <span
                    key={example}
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Display messages in chronological order */}
              {groupMessagesByType(messages).map((group, groupIndex) => (
                <div key={`group-${groupIndex}`} className={`message-group ${group[0].sender}-group`}>
                  {group.map((msg, msgIndex) => {
                    return (
                      <div
                        key={msg.id}
                        className={`message ${msg.sender} type-${msg.type} ${msg.isNew ? 'new-message' : ''} ${msg.isLoading ? 'isLoading' : ''}`}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        {/* Show avatar for the first message in a group */}
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
                        {/* For subsequent messages in a group, add a spacer */}
                        {msgIndex !== 0 && <div className="message-avatar-spacer"></div>}

                        <div className="message-content">
                          {/* Show sender name and timestamp for every message */}
                          <div className="message-header">
                            <span className="message-sender">
                              {msg.sender === 'user' ? 'You' : 'Assistant'}
                            </span>
                            <span className="message-timestamp">{formatTimestamp(msg.timestamp)}</span>
                          </div>

                          {/* Show message type indicator for special message types */}
                          {msg.type !== 'prompt' && msg.type !== 'result' && (
                            <div className={`message-type-indicator ${msg.type}-indicator`}>
                              {getMessageTypeIcon(msg.type, isDarkMode)}
                              <span>{msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}</span>
                            </div>
                          )}

                          {/* Show thinking indicator for thinking messages */}
                          {msg.type === 'think' && (
                            <div className="thinking-indicator">
                              <span className="thinking-dot"></span>
                              <span className="thinking-dot"></span>
                              <span className="thinking-dot"></span>
                            </div>
                          )}

                          {/* Message text content */}
                          <div className={`message-text ${msg.type === 'think' ? 'thinking-text' : ''} ${msg.type === 'tool' || msg.type === 'act' ? 'tool-text' : ''} ${msg.isFinalMessage ? 'final-message' : ''} ${msg.isStreaming ? 'streaming-message' : ''}`}>
                            {!msg.text || msg.text.trim() === '' ? (
                              <div className="typing-container">
                                <div className="typing-header">
                                  <LottieLoading width={100} height={50} />
                                </div>
                              </div>
                            ) : (
                              renderMessageContent(msg.text, msg.isLoading, msg.type, msg.isStreaming)
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
          {/* Scroll target div */}
          <div ref={messagesEndRef} style={{ height: '1px', width: '1px' }} />
        </div>

        {/* Input container */}
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
