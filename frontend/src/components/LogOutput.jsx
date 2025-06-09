import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Icons for different log types
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const LogOutput = ({ output, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when output changes
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Check if the output is HTML content
  const isHtmlContent = output.includes('<div') || output.includes('<a href=');

  // If it's HTML content, render it directly
  if (isHtmlContent) {
    // Process HTML content to add theme-specific classes and styles
    let processedOutput = output;

    if (isDarkMode) {
      // Add dark-theme class and inline styles to code, pre, and anchor tags
      processedOutput = output
        .replace(/<code/g, '<code class="dark-theme-code" style="font-family: \'Fira Code\', monospace; background-color: rgba(0, 243, 255, 0.1); color: white; padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(0, 243, 255, 0.3); box-shadow: 0 0 5px rgba(0, 243, 255, 0.2); display: inline-block; margin: 0 2px;"')
        .replace(/<pre/g, '<pre class="dark-theme-pre" style="background-color: rgba(10, 10, 16, 0.8); border: 1px solid rgba(0, 243, 255, 0.3); border-radius: 6px; padding: 4px; margin: 12px 0; overflow-x: auto; box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);"')
        .replace(/<a href/g, '<a class="dark-theme-link" style="color: #00f3ff; text-decoration: none; font-weight: 500; padding: 8px 16px; margin: 10px 0; display: inline-block; border: 1px solid #00f3ff; border-radius: 4px; transition: all 0.2s ease;" href');
    } else {
      // Add light-theme class and inline styles for light mode
      processedOutput = output
        .replace(/<code/g, '<code class="light-theme-code" style="font-family: \'Fira Code\', monospace; background-color: #F0F9FF; color: #2D3748; padding: 3px 6px; border-radius: 4px; border: 1px solid #E2E8F0; display: inline-block; margin: 0 2px;"')
        .replace(/<pre/g, '<pre class="light-theme-pre" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 4px; margin: 12px 0; overflow-x: auto; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);"')
        .replace(/<a href/g, '<a class="light-theme-link" style="color: #38A169; text-decoration: none; font-weight: 500; padding: 8px 16px; margin: 10px 0; display: inline-block; border: 1px solid #38A169; border-radius: 4px; transition: all 0.2s ease;" href');
    }

    return (
      <div className="log-output-container">
        <div className="log-output-header">
          <h4 className={isDarkMode ? "neon-text" : ""} style={!isDarkMode ? { color: '#38A169' } : {}}>
            Output
          </h4>
          <div className="log-actions">
            <button
              className="log-action-button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
        <div
          ref={outputRef}
          className={`log-content html-output ${isExpanded ? 'expanded' : ''} ${isDarkMode ? 'dark-theme' : 'light-theme'}`}
          style={isDarkMode ?
            { color: '#ffffff', backgroundColor: 'rgba(10, 10, 16, 0.8)' } :
            { color: '#2D3748', backgroundColor: '#F8FAFC' }
          }
          dangerouslySetInnerHTML={{ __html: processedOutput }}
        />
      </div>
    );
  }

  // Process text output to identify different log types
  const processOutput = (text) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Detect error messages
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception') || line.startsWith('Traceback')) {
        return (
          <div key={index} className="log-line error">
            <ErrorIcon /> <span>{line}</span>
          </div>
        );
      }
      // Detect warning messages
      else if (line.toLowerCase().includes('warning') || line.toLowerCase().includes('warn')) {
        return (
          <div key={index} className="log-line warning">
            <WarningIcon /> <span>{line}</span>
          </div>
        );
      }
      // Detect success messages
      else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) {
        return (
          <div key={index} className="log-line success">
            <SuccessIcon /> <span>{line}</span>
          </div>
        );
      }
      // Default info message
      else {
        return (
          <div key={index} className="log-line info">
            <InfoIcon /> <span>{line}</span>
          </div>
        );
      }
    });
  };

  return (
    <div className="log-output-container">
      <div className="log-output-header">
        <h4 className={isDarkMode ? "neon-text" : ""} style={!isDarkMode ? { color: '#38A169' } : {}}>
          Output
        </h4>
        <div className="log-actions">
          <button
            className="log-action-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      <div
        ref={outputRef}
        className={`log-content ${isExpanded ? 'expanded' : ''} ${isDarkMode ? 'dark-theme' : 'light-theme'}`}
        style={isDarkMode ?
          { backgroundColor: 'rgba(10, 10, 16, 0.8)', color: '#ffffff' } :
          { backgroundColor: '#F8FAFC', color: '#2D3748' }
        }
      >
        {processOutput(output)}
      </div>
    </div>
  );
};

LogOutput.propTypes = {
  output: PropTypes.string.isRequired,
  isDarkMode: PropTypes.bool.isRequired
};

export default LogOutput;
