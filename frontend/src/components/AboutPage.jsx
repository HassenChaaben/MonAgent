import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';
import '../styles/ScrollFix.css';
import Navigation from './Navigation';

// Team member icons
const TeamMemberIcon = ({ image, name, role, isDarkMode }) => (
  <div className="team-member">
    <div className="member-image">
      <img src={image} alt={name} />
    </div>
    <h3>{name}</h3>
    <p className="member-role">{role}</p>
  </div>
);

// Social media icons
const TwitterIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 3.00005C22.0424 3.67552 20.9821 4.19216 19.86 4.53005C19.2577 3.83756 18.4573 3.34674 17.567 3.12397C16.6767 2.90121 15.7395 2.95724 14.8821 3.2845C14.0247 3.61176 13.2884 4.19445 12.773 4.95376C12.2575 5.71308 11.9877 6.61238 12 7.53005V8.53005C10.2426 8.57561 8.50127 8.18586 6.93101 7.39549C5.36074 6.60513 4.01032 5.43868 3 4.00005C3 4.00005 -1 13 8 17C5.94053 18.398 3.48716 19.099 1 19C10 24 21 19 21 7.50005C20.9991 7.2215 20.9723 6.94364 20.92 6.67005C21.9406 5.66354 22.6608 4.39276 23 3.00005Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LinkedInIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 9H2V21H6V9Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GithubIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 19C4.7 20.4 4.7 16.5 3 16M15 21V17.5C15 16.5 15.1 16.1 14.5 15.5C17.3 15.2 20 14.1 20 9.50001C19.9988 8.30498 19.5325 7.15732 18.7 6.30001C19.0905 5.26198 19.0545 4.11164 18.6 3.10001C18.6 3.10001 17.5 2.80001 15.1 4.40001C13.0672 3.8706 10.9328 3.8706 8.9 4.40001C6.5 2.80001 5.4 3.10001 5.4 3.10001C4.94548 4.11164 4.90953 5.26198 5.3 6.30001C4.46745 7.15732 4.00122 8.30498 4 9.50001C4 14.1 6.7 15.2 9.5 15.5C8.9 16.1 8.9 16.7 9 17.5V21" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

const AboutPage = ({ isDarkMode, toggleTheme }) => {
  // Add effect to ensure body can scroll when AboutPage is mounted
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

  // Sample team members data
  const teamMembers = [
    {
      id: 1,
      name: "Jane Smith",
      role: "CEO & Founder",
      image: "https://via.placeholder.com/150?text=Jane+Smith"
    },
    {
      id: 2,
      name: "John Doe",
      role: "CTO",
      image: "https://via.placeholder.com/150?text=John+Doe"
    },
    {
      id: 3,
      name: "Alex Johnson",
      role: "Lead Developer",
      image: "https://via.placeholder.com/150?text=Alex+Johnson"
    },
    {
      id: 4,
      name: "Sarah Williams",
      role: "AI Research Scientist",
      image: "https://via.placeholder.com/150?text=Sarah+Williams"
    }
  ];

  return (
    <div className={`about-container ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* Background effects */}
      <BackgroundEffect isDarkMode={isDarkMode} />

      {/* Theme toggle button */}
      <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </button>

      <header className="about-header">
        <div className="logo-container">
          <div className="logo-icon">AI</div>
          <h1 className="logo-text">About Us</h1>
        </div>
        <p className="tagline">Meet the team behind Blok-GPT and learn about our mission</p>
      </header>

      <main className="about-main">
        <section className="about-section">
          <div className="about-content">
            <h2>Our Story</h2>
            <p>
              Blok-GPT was founded in 2023 with a simple mission: to make artificial intelligence accessible and useful for developers of all skill levels. We believe that AI should be a tool that enhances human creativity and productivity, not replace it.
            </p>
            <p>
              Our team of engineers, designers, and AI researchers came together with a shared vision of creating an AI assistant that truly understands the needs of developers. After months of development and testing, Blok-GPT was born.
            </p>
            <p>
              Today, we're proud to offer a platform that helps thousands of developers write better code, solve complex problems, and learn new skills. We're constantly improving our AI models and adding new features based on user feedback.
            </p>
          </div>
          <div className="about-image">
            <img src="https://via.placeholder.com/500x300?text=Our+Story" alt="Blok-GPT Team" />
          </div>
        </section>

        <section className="mission-section">
          <div className="mission-card">
            <h3>Our Mission</h3>
            <p>To empower developers with AI tools that enhance creativity, productivity, and learning.</p>
          </div>
          <div className="mission-card">
            <h3>Our Vision</h3>
            <p>A world where AI and human intelligence work together to solve the most challenging problems in software development.</p>
          </div>
          <div className="mission-card">
            <h3>Our Values</h3>
            <ul>
              <li>User-centered design</li>
              <li>Continuous learning</li>
              <li>Ethical AI development</li>
              <li>Transparency and trust</li>
            </ul>
          </div>
        </section>

        <section className="team-section">
          <h2>Meet Our Team</h2>
          <div className="team-grid">
            {teamMembers.map(member => (
              <TeamMemberIcon
                key={member.id}
                image={member.image}
                name={member.name}
                role={member.role}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </section>

        <section className="contact-section">
          <h2>Get in Touch</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Contact Information</h3>
              <p><strong>Email:</strong> info@blok-gpt.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 AI Street, Tech City, TC 12345</p>

              <div className="social-links">
                <a href="#" className="social-link">
                  <TwitterIcon isDarkMode={isDarkMode} />
                </a>
                <a href="#" className="social-link">
                  <LinkedInIcon isDarkMode={isDarkMode} />
                </a>
                <a href="#" className="social-link">
                  <GithubIcon isDarkMode={isDarkMode} />
                </a>
              </div>
            </div>

            <div className="contact-form">
              <h3>Send Us a Message</h3>
              <form>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" placeholder="Your email" />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows="5" placeholder="Your message"></textarea>
                </div>
                <button type="submit" className="submit-button">Send Message</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="about-footer">
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

export default AboutPage;
