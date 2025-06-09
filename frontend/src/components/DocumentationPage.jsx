import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DocumentationPage.css';
import '../styles/ScrollFix.css';
import Navigation from './Navigation';

// Icons for documentation sections
const GettingStartedIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const APIReferenceIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 3H4C2.89543 3 2 3.89543 2 5V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V5C22 3.89543 21.1046 3 20 3Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 3V21" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 9L17 12L14 15" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FAQIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17H12.01" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

const DocumentationPage = ({ isDarkMode, toggleTheme }) => {
  const [activeSection, setActiveSection] = React.useState('getting-started');

  // Add effect to ensure body can scroll when DocumentationPage is mounted
  useEffect(() => {
    // Save original styles
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;

    // Apply styles that force scrolling
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100%';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';

    // Force layout recalculation
    void document.body.offsetHeight;

    // Cleanup function to restore original styles when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  // Background effect component - Snow in dark mode, Summer vibes in light mode
  const BackgroundEffect = ({ isDarkMode }) => {
    if (isDarkMode) {
      // Snow effect for dark mode
      const snowflakes = Array.from({ length: 50 }).map((_, index) => {
        const size = Math.random() * 4 + 1.5;
        const animationDuration = Math.random() * 15 + 15;
        const initialLeft = Math.random() * 100;
        const initialDelay = Math.random() * 10;
        const opacity = Math.random() * 0.3 + 0.1;
        const blur = Math.random() * 2;

        return (
          <div
            key={`snow-${index}`}
            className="snowflake"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${initialLeft}%`,
              opacity: opacity,
              backgroundColor: 'white',
              filter: `blur(${blur}px)`,
              animationDuration: `${animationDuration}s`,
              animationDelay: `${initialDelay}s`
            }}
          />
        );
      });

      return <div className="snow-container">{snowflakes}</div>;
    } else {
      // Summer vibes for light mode
      return (
        <div className="summer-container">
          {/* Sun lights */}
          {Array.from({ length: 40 }).map((_, index) => {
            const initialLeft = Math.random() * 100;
            const initialTop = Math.random() * 100;
            const initialDelay = Math.random() * 5;
            const size = Math.random() * 6 + 3;
            const opacity = Math.random() * 0.6 + 0.3;

            return (
              <div
                key={`sunsparkle-${index}`}
                className="sunlight sunsparkle"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${initialLeft}%`,
                  top: `${initialTop}%`,
                  opacity: opacity,
                  backgroundColor: '#FFFDE7',
                  borderRadius: '50%',
                  filter: 'blur(1px)',
                  boxShadow: `0 0 ${size * 2}px rgba(255,249,196,${opacity})`,
                  animationDuration: `${4 + Math.random() * 6}s`,
                  animationDelay: `${initialDelay}s`
                }}
              />
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className={`documentation-container ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* Background effects */}
      <BackgroundEffect isDarkMode={isDarkMode} />

      {/* Theme toggle button */}
      <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </button>

      <header className="documentation-header">
        <div className="logo-container">
          <div className="logo-icon">AI</div>
          <h1 className="logo-text">Documentation</h1>
        </div>
        <p className="tagline">Comprehensive guides and references for Blok-GPT</p>
      </header>

      <main className="documentation-main">
        <div className="documentation-sidebar">
          <h3>Documentation</h3>
          <ul className="sidebar-nav">
            <li
              className={activeSection === 'getting-started' ? 'active' : ''}
              onClick={() => setActiveSection('getting-started')}
            >
              <GettingStartedIcon isDarkMode={isDarkMode} />
              Getting Started
            </li>
            <li
              className={activeSection === 'api-reference' ? 'active' : ''}
              onClick={() => setActiveSection('api-reference')}
            >
              <APIReferenceIcon isDarkMode={isDarkMode} />
              API Reference
            </li>
            <li
              className={activeSection === 'faq' ? 'active' : ''}
              onClick={() => setActiveSection('faq')}
            >
              <FAQIcon isDarkMode={isDarkMode} />
              FAQ
            </li>
          </ul>
          <div className="sidebar-cta">
            <Link to="/chat" className="sidebar-cta-button">Start Using Blok-GPT</Link>
          </div>
        </div>

        <div className="documentation-content">
          {activeSection === 'getting-started' && (
            <div className="content-section">
              <h2>Getting Started with Blok-GPT</h2>
              <p className="section-intro">Welcome to Blok-GPT! This guide will help you get up and running quickly with our AI assistant platform.</p>

              <div className="doc-card">
                <h3>What is Blok-GPT?</h3>
                <p>Blok-GPT is an advanced AI assistant designed to help with coding, data analysis, and project management. It provides a natural language interface for interacting with your development environment.</p>
              </div>

              <div className="doc-card">
                <h3>System Requirements</h3>
                <ul>
                  <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                  <li>Internet connection</li>
                  <li>2GB RAM minimum (4GB recommended)</li>
                </ul>
              </div>

              <div className="doc-card">
                <h3>Quick Start Guide</h3>
                <ol>
                  <li>Navigate to the <Link to="/chat">Chat</Link> interface</li>
                  <li>Type your question or request in natural language</li>
                  <li>Blok-GPT will respond with relevant information or code</li>
                  <li>For more complex tasks, use the <Link to="/ide">IDE</Link> environment</li>
                </ol>
              </div>

              <div className="doc-card">
                <h3>Key Features</h3>
                <ul>
                  <li><strong>Natural Language Understanding:</strong> Communicate with the AI in plain English</li>
                  <li><strong>Code Generation:</strong> Get help writing code in multiple languages</li>
                  <li><strong>Integrated Development Environment:</strong> Edit and run code directly in the browser</li>
                  <li><strong>Project Management:</strong> Organize and track your development tasks</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'api-reference' && (
            <div className="content-section">
              <h2>API Reference</h2>
              <p className="section-intro">Comprehensive documentation of the Blok-GPT API endpoints and parameters.</p>

              <div className="doc-card">
                <h3>Authentication</h3>
                <p>All API requests require authentication using an API key. You can generate an API key in the <Link to="/config">Configuration</Link> page.</p>
                <pre><code>
                  {`// Example API request with authentication
fetch('https://api.blok-gpt.com/v1/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    prompt: 'Write a function to calculate fibonacci numbers',
    max_tokens: 150
  })
})`}
                </code></pre>
              </div>

              <div className="doc-card">
                <h3>Endpoints</h3>
                <table className="api-table">
                  <thead>
                    <tr>
                      <th>Endpoint</th>
                      <th>Method</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>/v1/generate</td>
                      <td>POST</td>
                      <td>Generate text or code based on a prompt</td>
                    </tr>
                    <tr>
                      <td>/v1/chat</td>
                      <td>POST</td>
                      <td>Have a conversation with the AI assistant</td>
                    </tr>
                    <tr>
                      <td>/v1/analyze</td>
                      <td>POST</td>
                      <td>Analyze code for errors or improvements</td>
                    </tr>
                    <tr>
                      <td>/v1/projects</td>
                      <td>GET</td>
                      <td>List all projects</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'faq' && (
            <div className="content-section">
              <h2>Frequently Asked Questions</h2>
              <p className="section-intro">Find answers to common questions about Blok-GPT.</p>

              <div className="doc-card faq-card">
                <h3>What programming languages does Blok-GPT support?</h3>
                <p>Blok-GPT supports a wide range of programming languages including JavaScript, Python, Java, C++, Ruby, Go, and many more. The AI assistant can help with code generation, debugging, and optimization in all these languages.</p>
              </div>

              <div className="doc-card faq-card">
                <h3>Is my code secure when using Blok-GPT?</h3>
                <p>Yes, we take security seriously. Your code is encrypted in transit and at rest. We do not store your code permanently unless you explicitly save it as a project. All temporary code snippets are automatically deleted after your session ends.</p>
              </div>

              <div className="doc-card faq-card">
                <h3>Can I use Blok-GPT offline?</h3>
                <p>Currently, Blok-GPT requires an internet connection to function as it relies on our cloud-based AI models. However, we are working on a lightweight offline version with limited capabilities for the future.</p>
              </div>

              <div className="doc-card faq-card">
                <h3>How do I report bugs or request features?</h3>
                <p>You can report bugs or request features through our <Link to="/about">Contact Page</Link>. We appreciate your feedback and continuously work to improve Blok-GPT based on user suggestions.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="documentation-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon small">AI</div>
            <span className="footer-logo-text">Blok-GPT</span>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="/chat">Chat Interface</Link>
              <Link to="/ide">Workspace</Link>
              <Link to="/config">Configuration</Link>
              <Link to="/admin">Admin Dashboard</Link>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <Link to="/documentation">Documentation</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Blok-GPT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default DocumentationPage;
