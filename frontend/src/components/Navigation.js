import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation({ isDarkMode }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isInChatView, setIsInChatView] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();

  // Throttle function to limit how often the scroll handler fires
  const throttle = (callback, delay) => {
    let lastCall = 0;
    return function (...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return callback(...args);
    };
  };

  useEffect(() => {
    // Check if we're in a view that should have auto-hide navigation
    const isChatRoute = location.pathname.includes('/chat');
    const isConfigRoute = location.pathname.includes('/config');
    const isAdminRoute = location.pathname.includes('/admin');
    const isDocumentationRoute = location.pathname.includes('/documentation');
    const isAboutRoute = location.pathname.includes('/about');
    const shouldAutoHide = isChatRoute || isConfigRoute || isAdminRoute ||
      isDocumentationRoute || isAboutRoute;

    setIsInChatView(shouldAutoHide);

    // Reset visibility when changing routes
    setIsVisible(true);
    setLastScrollY(0);

    // Only add scroll listeners in views that should auto-hide
    if (shouldAutoHide) {
      // Create the scroll handler
      const handleScroll = () => {
        // Find the appropriate scroll container based on the route
        let scrollContainer;

        if (isChatRoute) {
          scrollContainer = document.querySelector('.chat-messages');
        } else if (isConfigRoute) {
          scrollContainer = document.querySelector('.config-page');
        } else if (isAdminRoute) {
          scrollContainer = document.querySelector('.admin-dashboard');
        } else if (isDocumentationRoute) {
          scrollContainer = document.querySelector('.documentation-container');
        } else if (isAboutRoute) {
          scrollContainer = document.querySelector('.about-container');
        }

        if (!scrollContainer) {
          // Fallback to window if specific container not found
          scrollContainer = window;
        }

        // Get current scroll position
        const currentScrollY = scrollContainer === window
          ? window.scrollY
          : scrollContainer.scrollTop;

        // Determine if we should show or hide the navbar
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down & past threshold - hide navbar
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
          // Scrolling up or near top - show navbar
          setIsVisible(true);
        }

        // Update the last scroll position
        setLastScrollY(currentScrollY);
      };

      // Throttle the scroll handler to improve performance
      const throttledHandleScroll = throttle(handleScroll, 100);

      // Find the appropriate scroll container based on the route
      let scrollContainer;

      if (isChatRoute) {
        scrollContainer = document.querySelector('.chat-messages');
      } else if (isConfigRoute) {
        scrollContainer = document.querySelector('.config-page');
      } else if (isAdminRoute) {
        scrollContainer = document.querySelector('.admin-dashboard');
      } else if (isDocumentationRoute) {
        scrollContainer = document.querySelector('.documentation-container');
      } else if (isAboutRoute) {
        scrollContainer = document.querySelector('.about-container');
      }

      // Add a small delay to ensure the DOM elements are loaded
      if (!scrollContainer && (isConfigRoute || isAdminRoute || isDocumentationRoute || isAboutRoute)) {
        setTimeout(() => {
          if (isConfigRoute) {
            const configContainer = document.querySelector('.config-page');
            if (configContainer) {
              configContainer.addEventListener('scroll', throttledHandleScroll);
            }
          } else if (isAdminRoute) {
            const adminContainer = document.querySelector('.admin-dashboard');
            if (adminContainer) {
              adminContainer.addEventListener('scroll', throttledHandleScroll);
            }
          } else if (isDocumentationRoute) {
            const docContainer = document.querySelector('.documentation-container');
            if (docContainer) {
              docContainer.addEventListener('scroll', throttledHandleScroll);
            }
          } else if (isAboutRoute) {
            const aboutContainer = document.querySelector('.about-container');
            if (aboutContainer) {
              aboutContainer.addEventListener('scroll', throttledHandleScroll);
            }
          }
        }, 500);
      }

      // If specific container not found, use window
      if (!scrollContainer) {
        scrollContainer = window;
        window.addEventListener('scroll', throttledHandleScroll);
      } else {
        scrollContainer.addEventListener('scroll', throttledHandleScroll);
      }

      return () => {
        // Clean up the event listeners
        if (scrollContainer === window) {
          window.removeEventListener('scroll', throttledHandleScroll);
        } else if (scrollContainer) {
          scrollContainer.removeEventListener('scroll', throttledHandleScroll);
        }

        // Clean up any delayed event listeners
        const configContainer = document.querySelector('.config-page');
        if (configContainer) {
          configContainer.removeEventListener('scroll', throttledHandleScroll);
        }

        const adminContainer = document.querySelector('.admin-dashboard');
        if (adminContainer) {
          adminContainer.removeEventListener('scroll', throttledHandleScroll);
        }

        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
          chatContainer.removeEventListener('scroll', throttledHandleScroll);
        }

        const docContainer = document.querySelector('.documentation-container');
        if (docContainer) {
          docContainer.removeEventListener('scroll', throttledHandleScroll);
        }

        const aboutContainer = document.querySelector('.about-container');
        if (aboutContainer) {
          aboutContainer.removeEventListener('scroll', throttledHandleScroll);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <nav
      ref={navRef}
      className={`app-nav ${isDarkMode ? 'dark-mode' : ''} ${isInChatView ? 'in-chat-view' : ''} ${!isVisible ? 'hidden' : ''}`}
    >
      <Link to="/" className="nav-link">Home</Link>
      <Link to="/chat" className="nav-link">Chat</Link>
      <Link to="/ide" className="nav-link">IDE</Link>
      <Link to="/admin" className="nav-link">Admin</Link>
      <Link to="/config" className="nav-link">Configuration</Link>
      <Link to="/documentation" className="nav-link">Docs</Link>
      <Link to="/about" className="nav-link">About</Link>
    </nav>
  );
}

export default Navigation;

