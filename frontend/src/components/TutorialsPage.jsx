import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/TutorialsPage.css';
import '../styles/ScrollFix.css';
import Navigation from './Navigation';

// Icons for tutorial categories
const WebDevIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3H21C21.5304 3 22.0391 3.21071 22.4142 3.58579C22.7893 3.96086 23 4.46957 23 5V19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 8L3 12L7 16" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 8L21 12L17 16" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 4L10 20" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DataScienceIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 12C16 13.0609 15.5786 14.0783 14.8284 14.8284C14.0783 15.5786 13.0609 16 12 16C10.9391 16 9.92172 15.5786 9.17157 14.8284C8.42143 14.0783 8 13.0609 8 12C8 10.9391 8.42143 9.92172 9.17157 9.17157C9.92172 8.42143 10.9391 8 12 8C13.0609 8 14.0783 8.42143 14.8284 9.17157C15.5786 9.92172 16 10.9391 16 12Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12H8" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 12H22" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.93 4.93L8.17 8.17" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.83 15.83L19.07 19.07" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 2V8" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16V22" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.93 19.07L8.17 15.83" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.83 8.17L19.07 4.93" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MobileDevIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 18H12.01" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19V5C18 4.46957 17.7893 3.96086 17.4142 3.58579C17.0391 3.21071 16.5304 3 16 3H8C7.46957 3 6.96086 3.21071 6.58579 3.58579C6.21071 3.96086 6 4.46957 6 5V19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AIMLIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

const TutorialsPage = ({ isDarkMode, toggleTheme }) => {
  const [activeCategory, setActiveCategory] = React.useState('all');

  // Add effect to ensure body can scroll when TutorialsPage is mounted
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

  // Sample tutorial data
  const tutorials = [
    {
      id: 1,
      title: "Building a Responsive Website with HTML and CSS",
      description: "Learn how to create a modern, responsive website from scratch using HTML5 and CSS3.",
      category: "web-development",
      level: "Beginner",
      duration: "2 hours",
      author: "Jane Smith",
      image: "https://via.placeholder.com/300x200?text=Web+Dev+Tutorial"
    },
    {
      id: 2,
      title: "Introduction to React Hooks",
      description: "Master the basics of React Hooks and learn how to use useState, useEffect, and custom hooks.",
      category: "web-development",
      level: "Intermediate",
      duration: "1.5 hours",
      author: "John Doe",
      image: "https://via.placeholder.com/300x200?text=React+Hooks"
    },
    {
      id: 3,
      title: "Data Visualization with Python and Matplotlib",
      description: "Learn how to create compelling data visualizations using Python's Matplotlib library.",
      category: "data-science",
      level: "Beginner",
      duration: "3 hours",
      author: "Alex Johnson",
      image: "https://via.placeholder.com/300x200?text=Data+Viz"
    },
    {
      id: 4,
      title: "Building iOS Apps with SwiftUI",
      description: "Get started with SwiftUI and learn how to build beautiful iOS applications.",
      category: "mobile-development",
      level: "Intermediate",
      duration: "4 hours",
      author: "Sarah Williams",
      image: "https://via.placeholder.com/300x200?text=SwiftUI"
    },
    {
      id: 5,
      title: "Introduction to Machine Learning with TensorFlow",
      description: "Learn the fundamentals of machine learning and how to implement models using TensorFlow.",
      category: "ai-ml",
      level: "Advanced",
      duration: "5 hours",
      author: "Michael Chen",
      image: "https://via.placeholder.com/300x200?text=TensorFlow"
    },
    {
      id: 6,
      title: "Building RESTful APIs with Node.js and Express",
      description: "Learn how to create robust RESTful APIs using Node.js and Express framework.",
      category: "web-development",
      level: "Intermediate",
      duration: "2.5 hours",
      author: "David Wilson",
      image: "https://via.placeholder.com/300x200?text=Node.js+API"
    }
  ];

  // Filter tutorials based on active category
  const filteredTutorials = activeCategory === 'all' 
    ? tutorials 
    : tutorials.filter(tutorial => tutorial.category === activeCategory);

  return (
    <div className={`tutorials-container ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* Background effects */}
      <BackgroundEffect isDarkMode={isDarkMode} />

      {/* Theme toggle button */}
      <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </button>

      <header className="tutorials-header">
        <div className="logo-container">
          <div className="logo-icon">AI</div>
          <h1 className="logo-text">Tutorials</h1>
        </div>
        <p className="tagline">Learn how to make the most of Blok-GPT with our step-by-step guides</p>
      </header>

      <main className="tutorials-main">
        <div className="category-filter">
          <button 
            className={`category-button ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Tutorials
          </button>
          <button 
            className={`category-button ${activeCategory === 'web-development' ? 'active' : ''}`}
            onClick={() => setActiveCategory('web-development')}
          >
            <WebDevIcon isDarkMode={isDarkMode} />
            Web Development
          </button>
          <button 
            className={`category-button ${activeCategory === 'data-science' ? 'active' : ''}`}
            onClick={() => setActiveCategory('data-science')}
          >
            <DataScienceIcon isDarkMode={isDarkMode} />
            Data Science
          </button>
          <button 
            className={`category-button ${activeCategory === 'mobile-development' ? 'active' : ''}`}
            onClick={() => setActiveCategory('mobile-development')}
          >
            <MobileDevIcon isDarkMode={isDarkMode} />
            Mobile Development
          </button>
          <button 
            className={`category-button ${activeCategory === 'ai-ml' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ai-ml')}
          >
            <AIMLIcon isDarkMode={isDarkMode} />
            AI & Machine Learning
          </button>
        </div>

        <div className="tutorials-grid">
          {filteredTutorials.map(tutorial => (
            <div className="tutorial-card" key={tutorial.id}>
              <div className="tutorial-image">
                <img src={tutorial.image} alt={tutorial.title} />
                <div className="tutorial-level">{tutorial.level}</div>
              </div>
              <div className="tutorial-content">
                <h3>{tutorial.title}</h3>
                <p>{tutorial.description}</p>
                <div className="tutorial-meta">
                  <span className="tutorial-duration">{tutorial.duration}</span>
                  <span className="tutorial-author">By {tutorial.author}</span>
                </div>
                <button className="tutorial-button">Start Tutorial</button>
              </div>
            </div>
          ))}
        </div>

        <div className="tutorials-cta">
          <h2>Can't find what you're looking for?</h2>
          <p>Check our comprehensive documentation or ask Blok-GPT directly for personalized assistance.</p>
          <div className="cta-buttons">
            <Link to="/documentation" className="cta-button secondary">View Documentation</Link>
            <Link to="/chat" className="cta-button primary">Ask Blok-GPT</Link>
          </div>
        </div>
      </main>

      <footer className="tutorials-footer">
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
              <Link to="/tutorials">Tutorials</Link>
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

export default TutorialsPage;
