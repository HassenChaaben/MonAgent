import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import '../styles/ScrollFix.css';

// SVG Icons
// Enhanced summer-themed Sun illustration
const SunIllustration = () => (
  <svg className="celestial-svg sun-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Enhanced summer gradients */}
      <radialGradient id="sunFaceGradient" cx="50%" cy="50%" r="70%" fx="40%" fy="40%">
        <stop offset="0%" stopColor="#FFF59D" />
        <stop offset="50%" stopColor="#FFEE58" />
        <stop offset="80%" stopColor="#FFA000" />
        <stop offset="100%" stopColor="#FF8F00" />
      </radialGradient>

      <radialGradient id="sunGlowGradient" cx="50%" cy="50%" r="100%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#FFD54F" stopOpacity="0.9" />
        <stop offset="70%" stopColor="#FFB300" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
      </radialGradient>

      {/* Enhanced glow filter */}
      <filter id="summerSunGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feFlood floodColor="#FF9800" floodOpacity="0.8" result="glowColor" />
        <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
        <feComposite in="SourceGraphic" in2="softGlow" operator="over" />
      </filter>

      {/* Highlight gradient */}
      <linearGradient id="sunHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.8" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Sunglasses gradient */}
      <linearGradient id="sunglassesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#212121" />
        <stop offset="50%" stopColor="#424242" />
        <stop offset="100%" stopColor="#212121" />
      </linearGradient>

      {/* Sunglasses reflection */}
      <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.7" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Animated sun outer glow */}
    <circle cx="100" cy="100" r="95" fill="url(#sunGlowGradient)" className="sun-outer-glow" />

    {/* Enhanced rays - summer style with animation */}
    <g className="sun-rays-summer">
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * Math.PI) / 8;
        const innerRadius = 60;
        const outerRadius = 95 + (i % 3 === 0 ? 15 : i % 2 === 0 ? 10 : 5); // Varied ray lengths

        // Calculate points for triangle
        const innerX = 100 + innerRadius * Math.cos(angle);
        const innerY = 100 + innerRadius * Math.sin(angle);

        const outerX = 100 + outerRadius * Math.cos(angle);
        const outerY = 100 + outerRadius * Math.sin(angle);

        // Calculate points for the sides of the triangle
        const sideAngle1 = angle - 0.12;
        const sideAngle2 = angle + 0.12;
        const sideRadius = innerRadius + 5;

        const side1X = 100 + sideRadius * Math.cos(sideAngle1);
        const side1Y = 100 + sideRadius * Math.sin(sideAngle1);

        const side2X = 100 + sideRadius * Math.cos(sideAngle2);
        const side2Y = 100 + sideRadius * Math.sin(sideAngle2);

        return (
          <path
            key={`ray-${i}`}
            d={`M ${innerX} ${innerY} L ${side1X} ${side1Y} L ${outerX} ${outerY} L ${side2X} ${side2Y} Z`}
            fill="#FFD54F"
            className={`sun-ray summer-ray-${i % 4}`}
            style={{
              animationDelay: `${i * 0.2}s`,
              transformOrigin: '100px 100px'
            }}
          />
        );
      })}
    </g>

    {/* Main sun face - summer style */}
    <g className="sun-face" filter="url(#summerSunGlow)">
      {/* Base circle with 3D effect */}
      <circle cx="100" cy="100" r="60" fill="url(#sunFaceGradient)" stroke="#FF8F00" strokeWidth="2" />

      {/* 3D Highlights */}
      <ellipse cx="80" cy="80" rx="30" ry="25" fill="url(#sunHighlight)" className="sun-highlight" />
      <ellipse cx="70" cy="70" rx="15" ry="12" fill="white" fillOpacity="0.4" className="sun-highlight-small" />

      {/* Summer-themed face features */}
      <g className="sun-face-features">
        {/* Sunglasses - summer style */}
        <g className="sunglasses">
          {/* Left lens */}
          <path
            d="M65,85 Q75,75 90,80 Q95,85 90,95 Q80,100 70,95 Q65,90 65,85 Z"
            fill="url(#sunglassesGradient)"
            stroke="#424242"
            strokeWidth="1.5"
            className="sunglasses-lens"
          />

          {/* Right lens */}
          <path
            d="M110,80 Q125,75 135,85 Q140,90 135,95 Q125,100 115,95 Q110,85 110,80 Z"
            fill="url(#sunglassesGradient)"
            stroke="#424242"
            strokeWidth="1.5"
            className="sunglasses-lens"
          />

          {/* Bridge */}
          <path
            d="M90,85 Q100,80 110,85"
            fill="none"
            stroke="#424242"
            strokeWidth="2"
          />

          {/* Temple arms */}
          <path
            d="M65,85 Q60,85 55,83"
            fill="none"
            stroke="#424242"
            strokeWidth="2"
          />
          <path
            d="M135,85 Q140,85 145,83"
            fill="none"
            stroke="#424242"
            strokeWidth="2"
          />

          {/* Reflections */}
          <path
            d="M70,82 Q75,80 80,82"
            fill="none"
            stroke="url(#glassReflection)"
            strokeWidth="1.5"
            className="sunglasses-reflection"
          />
          <path
            d="M115,82 Q120,80 125,82"
            fill="none"
            stroke="url(#glassReflection)"
            strokeWidth="1.5"
            className="sunglasses-reflection"
          />
        </g>

        {/* Big summer smile */}
        <path
          d="M70 115 Q100 140 130 115"
          stroke="#5D4037"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          className="summer-smile"
        />

        {/* Rosy summer cheeks */}
        <circle cx="65" cy="105" r="12" fill="#FF7043" fillOpacity="0.6" className="summer-cheek" />
        <circle cx="135" cy="105" r="12" fill="#FF7043" fillOpacity="0.6" className="summer-cheek" />

        {/* Summer sweat drops */}
        <g className="sweat-drops">
          <path
            d="M60,70 Q58,75 60,80"
            fill="none"
            stroke="#B3E5FC"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="sweat-drop drop-1"
          />
          <circle cx="60" cy="82" r="2" fill="#B3E5FC" className="sweat-drop drop-1" />

          <path
            d="M140,70 Q142,75 140,80"
            fill="none"
            stroke="#B3E5FC"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="sweat-drop drop-2"
          />
          <circle cx="140" cy="82" r="2" fill="#B3E5FC" className="sweat-drop drop-2" />
        </g>
      </g>
    </g>
  </svg>
);

// Enhanced dreamy night-themed Moon illustration
const MoonIllustration = () => (
  <svg className="celestial-svg moon-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Enhanced night sky gradients */}
      <radialGradient id="moonFaceGradient" cx="40%" cy="40%" r="70%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#E1F5FE" />
        <stop offset="40%" stopColor="#B3E5FC" />
        <stop offset="80%" stopColor="#4FC3F7" />
        <stop offset="100%" stopColor="#29B6F6" />
      </radialGradient>

      <radialGradient id="moonOuterGlow" cx="50%" cy="50%" r="100%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.9" />
        <stop offset="70%" stopColor="#29B6F6" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#0288D1" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="craterGradient" cx="40%" cy="40%" r="60%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#E1F5FE" />
        <stop offset="100%" stopColor="#B3E5FC" />
      </radialGradient>

      {/* Enhanced neon glow filter */}
      <filter id="moonNeonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="12" result="blur" />
        <feFlood floodColor="#00BCD4" floodOpacity="0.9" result="glowColor" />
        <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
        <feComposite in="SourceGraphic" in2="softGlow" operator="over" />
      </filter>

      {/* Enhanced star sparkle filter */}
      <filter id="starSparkle" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feFlood floodColor="#E1F5FE" floodOpacity="1" result="glowColor" />
        <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
        <feComposite in="SourceGraphic" in2="softGlow" operator="over" />
      </filter>

      {/* Shooting star filter */}
      <filter id="shootingStarGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feFlood floodColor="white" floodOpacity="1" result="glowColor" />
        <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
        <feComposite in="SourceGraphic" in2="softGlow" operator="over" />
      </filter>

      {/* 3D highlight gradient */}
      <linearGradient id="moonHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.8" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Night cloud gradient */}
      <linearGradient id="nightCloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B3E5FC" stopOpacity="0.2" />
        <stop offset="50%" stopColor="#81D4FA" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0.1" />
      </linearGradient>
    </defs>

    {/* Enhanced night sky background */}
    <g className="night-sky-background">
      {/* Star shapes with enhanced animation */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = 20 + Math.random() * 160;
        const y = 20 + Math.random() * 160;
        const size = 2 + Math.random() * 3;
        const rotation = Math.random() * 45;
        const delay = Math.random() * 5;
        const duration = 2 + Math.random() * 3;

        // Create star shape
        return (
          <g
            key={`star-${i}`}
            transform={`translate(${x}, ${y}) rotate(${rotation})`}
            filter="url(#starSparkle)"
            className="night-star"
            style={{
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`
            }}
          >
            <path
              d={`M 0 -${size} L ${size / 3} -${size / 3} L ${size} 0 L ${size / 3} ${size / 3} L 0 ${size} L -${size / 3} ${size / 3} L -${size} 0 L -${size / 3} -${size / 3} Z`}
              fill="white"
              className="star-shape"
            />
          </g>
        );
      })}

      {/* Small stars with varied animations */}
      {Array.from({ length: 50 }).map((_, i) => {
        const x = 10 + Math.random() * 180;
        const y = 10 + Math.random() * 180;
        const size = 0.5 + Math.random() * 1;
        const delay = Math.random() * 5;
        const duration = 1 + Math.random() * 4;

        return (
          <circle
            key={`small-star-${i}`}
            cx={x}
            cy={y}
            r={size}
            fill="white"
            opacity={0.4 + Math.random() * 0.6}
            className="small-night-star"
            style={{
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`
            }}
          />
        );
      })}

      {/* Shooting stars */}
      {Array.from({ length: 3 }).map((_, i) => {
        const startX = 20 + Math.random() * 80;
        const startY = 20 + Math.random() * 80;
        const length = 30 + Math.random() * 50;
        const angle = 30 + Math.random() * 60;
        const delay = i * 3 + Math.random() * 5;

        // Calculate end point
        const endX = startX + length * Math.cos(angle * Math.PI / 180);
        const endY = startY + length * Math.sin(angle * Math.PI / 180);

        return (
          <g key={`shooting-star-${i}`} className="shooting-star" style={{ animationDelay: `${delay}s` }}>
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="white"
              strokeWidth="1"
              filter="url(#shootingStarGlow)"
            />
            <circle
              cx={startX}
              cy={startY}
              r="1.5"
              fill="white"
              filter="url(#shootingStarGlow)"
            />
          </g>
        );
      })}

      {/* Constellation lines - enhanced */}
      <g className="constellation" stroke="#81D4FA" strokeWidth="0.7" strokeOpacity="0.8">
        <path d="M30 40 L 45 55 L 65 50 L 80 70" className="constellation-line" />
        <path d="M120 30 L 140 45 L 160 40" className="constellation-line" />
        <path d="M50 140 L 70 150 L 90 135" className="constellation-line" />
        <path d="M140 120 L 160 140 L 170 130" className="constellation-line" />
      </g>

      {/* Night clouds */}
      <g className="night-clouds">
        <path
          d="M30,50 Q45,40 60,50 Q75,40 90,50 Q75,60 60,55 Q45,65 30,50 Z"
          fill="url(#nightCloudGradient)"
          className="night-cloud cloud-1"
        />
        <path
          d="M130,40 Q145,30 160,40 Q175,30 190,40 Q175,50 160,45 Q145,55 130,40 Z"
          fill="url(#nightCloudGradient)"
          className="night-cloud cloud-2"
        />
        <path
          d="M20,150 Q35,140 50,150 Q65,140 80,150 Q65,160 50,155 Q35,165 20,150 Z"
          fill="url(#nightCloudGradient)"
          className="night-cloud cloud-3"
        />
      </g>
    </g>

    {/* Enhanced moon outer glow with animation */}
    <circle cx="100" cy="100" r="90" fill="url(#moonOuterGlow)" className="moon-outer-glow" />

    {/* Main moon body - enhanced with animations */}
    <g className="moon-body" filter="url(#moonNeonGlow)">
      {/* Base circle with border for cartoon effect */}
      <circle cx="100" cy="100" r="60" fill="url(#moonFaceGradient)" stroke="#29B6F6" strokeWidth="2" />

      {/* Enhanced craters with depth and animation */}
      <g className="moon-craters">
        <circle cx="75" cy="75" r="12" fill="url(#craterGradient)" stroke="#29B6F6" strokeWidth="1" className="crater crater-1" />
        <circle cx="120" cy="85" r="15" fill="url(#craterGradient)" stroke="#29B6F6" strokeWidth="1" className="crater crater-2" />
        <circle cx="85" cy="120" r="10" fill="url(#craterGradient)" stroke="#29B6F6" strokeWidth="1" className="crater crater-3" />
        <circle cx="60" cy="100" r="8" fill="url(#craterGradient)" stroke="#29B6F6" strokeWidth="1" className="crater crater-4" />
        <circle cx="110" cy="60" r="7" fill="url(#craterGradient)" stroke="#29B6F6" strokeWidth="1" className="crater crater-5" />

        {/* Additional small craters */}
        <circle cx="95" cy="70" r="5" fill="url(#craterGradient)" stroke="#29B6F6" strokeWidth="0.5" className="crater crater-6" />
        <circle cx="130" cy="110" r="6" fill="url(#craterGradient)" stroke="#29B6F6" strokeWidth="0.5" className="crater crater-7" />
        <circle cx="70" cy="130" r="4" fill="url(#craterGradient)" stroke="#29B6F6" strokeWidth="0.5" className="crater crater-8" />
      </g>

      {/* Enhanced 3D highlights */}
      <ellipse cx="80" cy="70" rx="30" ry="20" fill="url(#moonHighlight)" className="moon-highlight" />
      <ellipse cx="70" cy="60" rx="15" ry="10" fill="white" fillOpacity="0.3" className="moon-highlight-small" />

      {/* Dreamy face features */}
      <g className="moon-face-features">
        {/* Sleeping eyes with animation */}
        <path
          d="M75 90 Q85 85 95 90"
          stroke="#0288D1"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          className="moon-eye left-eye"
        />
        <path
          d="M105 90 Q115 85 125 90"
          stroke="#0288D1"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          className="moon-eye right-eye"
        />

        {/* Animated rosy cheeks */}
        <circle cx="75" cy="100" r="8" fill="#B3E5FC" fillOpacity="0.6" className="moon-cheek left-cheek" />
        <circle cx="125" cy="100" r="8" fill="#B3E5FC" fillOpacity="0.6" className="moon-cheek right-cheek" />

        {/* Gentle smile with animation */}
        <path
          d="M85 110 Q100 120 115 110"
          stroke="#0288D1"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          className="moon-smile"
        />

        {/* Z's for sleeping effect */}
        <g className="sleeping-zs">
          <text x="140" y="70" fill="#4FC3F7" fontSize="14" fontWeight="bold" className="z-text z1">z</text>
          <text x="150" y="60" fill="#4FC3F7" fontSize="18" fontWeight="bold" className="z-text z2">Z</text>
          <text x="160" y="50" fill="#4FC3F7" fontSize="22" fontWeight="bold" className="z-text z3">Z</text>
        </g>
      </g>
    </g>
  </svg>
);

const ChatIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IDEIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 3H4C2.89543 3 2 3.89543 2 5V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V5C22 3.89543 21.1046 3 20 3Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 3V21" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 9L17 12L14 15" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

const DataIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 5C21 6.65685 16.9706 8 12 8C7.02944 8 3 6.65685 3 5M21 5C21 3.34315 16.9706 2 12 2C7.02944 2 3 3.34315 3 5M21 5V19C21 20.66 17 22 12 22C7 22 3 20.66 3 19V5M21 12C21 13.66 17 15 12 15C7 15 3 13.66 3 12" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SettingsIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AIIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 17L12 22L22 17" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SecurityIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AutomationIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.59 13.51L15.42 17.49" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.41 6.51L8.59 10.49" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AdminIcon = ({ isDarkMode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5C12 5.88071 10.8807 7 9.5 7C8.11929 7 7 5.88071 7 4.5C7 3.11929 8.11929 2 9.5 2C10.8807 2 12 3.11929 12 4.5Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 4.5C17 5.88071 15.8807 7 14.5 7C13.1193 7 12 5.88071 12 4.5C12 3.11929 13.1193 2 14.5 2C15.8807 2 17 3.11929 17 4.5Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 19.5C12 20.8807 10.8807 22 9.5 22C8.11929 22 7 20.8807 7 19.5C7 18.1193 8.11929 17 9.5 17C10.8807 17 12 18.1193 12 19.5Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 19.5C17 20.8807 15.8807 22 14.5 22C13.1193 22 12 20.8807 12 19.5C12 18.1193 13.1193 17 14.5 17C15.8807 17 17 18.1193 17 19.5Z" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.5 7V17" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 7V17" stroke={!isDarkMode ? "#38A169" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HomePage = ({ isDarkMode, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState('features');

  // Add effect to ensure body can scroll when HomePage is mounted
  React.useEffect(() => {
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

  // Enhanced background effect component - Snow in dark mode, Summer vibes in light mode
  const BackgroundEffect = ({ isDarkMode }) => {
    if (isDarkMode) {
      // Snow effect for dark mode
      const snowflakes = Array.from({ length: 70 }).map((_, index) => {
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
      // Enhanced summer vibes for light mode
      return (
        <div className="summer-container">
          {/* Sun lights - enhanced rays */}
          {Array.from({ length: 60 }).map((_, index) => {
            // Create different types of sun lights
            const isBeam = index % 5 === 0;
            const isGlow = index % 7 === 0;
            const isSparkle = index % 11 === 0;

            // Common properties
            const initialLeft = Math.random() * 100;
            const initialTop = Math.random() * 100;
            const initialDelay = Math.random() * 5;

            if (isBeam) {
              // Enhanced sun beam - longer light rays with gradient
              const width = Math.random() * 200 + 150;
              const height = 1.5 + Math.random() * 2.5;
              const rotation = Math.random() * 360;
              const opacity = Math.random() * 0.4 + 0.15;
              const hue = 45 + Math.random() * 10; // Golden yellow hue

              return (
                <div
                  key={`sunbeam-${index}`}
                  className="sunlight sunbeam"
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    left: `${initialLeft}%`,
                    top: `${initialTop}%`,
                    opacity: opacity,
                    background: `linear-gradient(90deg, hsla(${hue}, 100%, 70%, ${opacity * 1.5}) 0%, hsla(${hue}, 100%, 60%, ${opacity}) 50%, hsla(${hue}, 100%, 70%, 0) 100%)`,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'left center',
                    animationDuration: `${12 + Math.random() * 8}s`,
                    animationDelay: `${initialDelay}s`,
                    boxShadow: `0 0 10px hsla(${hue}, 100%, 70%, ${opacity / 2})`
                  }}
                />
              );
            } else if (isGlow) {
              // Enhanced sun glow - circular light spots with gradient
              const size = Math.random() * 100 + 60;
              const opacity = Math.random() * 0.2 + 0.1;

              return (
                <div
                  key={`sunglow-${index}`}
                  className="sunlight sunglow"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${initialLeft}%`,
                    top: `${initialTop}%`,
                    opacity: opacity,
                    background: `radial-gradient(circle, rgba(255,236,179,${opacity * 1.5}) 0%, rgba(255,213,79,${opacity}) 50%, rgba(255,193,7,0) 100%)`,
                    borderRadius: '50%',
                    filter: 'blur(15px)',
                    animationDuration: `${18 + Math.random() * 12}s`,
                    animationDelay: `${initialDelay}s`
                  }}
                />
              );
            } else if (isSparkle) {
              // New lens flare effect
              const size = Math.random() * 40 + 20;
              const opacity = Math.random() * 0.5 + 0.3;

              return (
                <div
                  key={`lensflare-${index}`}
                  className="sunlight lens-flare"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${initialLeft}%`,
                    top: `${initialTop}%`,
                    opacity: opacity,
                    background: `radial-gradient(circle, rgba(255,255,255,${opacity}) 0%, rgba(255,236,179,${opacity * 0.7}) 40%, rgba(255,213,79,0) 100%)`,
                    borderRadius: '50%',
                    filter: 'blur(2px)',
                    animationDuration: `${3 + Math.random() * 4}s`,
                    animationDelay: `${initialDelay}s`,
                    boxShadow: `0 0 15px rgba(255,236,179,${opacity / 2})`
                  }}
                />
              );
            } else {
              // Enhanced sun sparkle - small bright dots with glow
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
            }
          })}

          {/* Summer elements - butterflies */}
          {Array.from({ length: 5 }).map((_, index) => {
            const left = Math.random() * 90 + 5;
            const top = Math.random() * 80 + 10;
            const size = 15 + Math.random() * 10;
            const delay = Math.random() * 10;
            const duration = 20 + Math.random() * 20;
            const wingColor = index % 2 === 0 ? '#FF9800' : '#FFEB3B';

            return (
              <div
                key={`butterfly-${index}`}
                className="summer-butterfly"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`
                }}
              >
                <div
                  className="butterfly-wing left-wing"
                  style={{
                    width: `${size}px`,
                    height: `${size * 1.2}px`,
                    backgroundColor: wingColor,
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%'
                  }}
                ></div>
                <div
                  className="butterfly-wing right-wing"
                  style={{
                    width: `${size}px`,
                    height: `${size * 1.2}px`,
                    backgroundColor: wingColor,
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%'
                  }}
                ></div>
                <div
                  className="butterfly-body"
                  style={{
                    height: `${size * 1.5}px`,
                    width: `${size / 5}px`,
                    backgroundColor: '#795548'
                  }}
                ></div>
              </div>
            );
          })}

          {/* Summer clouds */}
          {Array.from({ length: 4 }).map((_, index) => {
            const left = Math.random() * 80 + 10;
            const top = Math.random() * 40 + 5;
            const size = 60 + Math.random() * 40;
            const delay = Math.random() * 20;
            const duration = 120 + Math.random() * 60;
            const opacity = 0.7 + Math.random() * 0.3;

            return (
              <div
                key={`cloud-${index}`}
                className="summer-cloud"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}px`,
                  height: `${size * 0.6}px`,
                  opacity: opacity,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`
                }}
              >
                <div className="cloud-puff" style={{ width: `${size * 0.4}px`, height: `${size * 0.4}px`, left: `${size * 0.1}px`, top: `${size * 0.1}px` }}></div>
                <div className="cloud-puff" style={{ width: `${size * 0.5}px`, height: `${size * 0.5}px`, left: `${size * 0.3}px`, top: `${size * 0.05}px` }}></div>
                <div className="cloud-puff" style={{ width: `${size * 0.4}px`, height: `${size * 0.4}px`, left: `${size * 0.5}px`, top: `${size * 0.1}px` }}></div>
                <div className="cloud-puff" style={{ width: `${size * 0.3}px`, height: `${size * 0.3}px`, left: `${size * 0.7}px`, top: `${size * 0.15}px` }}></div>
              </div>
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className={`home-container ${!isDarkMode ? 'light-mode' : ''}`} style={{ overflowY: 'auto', height: 'auto', minHeight: '100vh' }}>
      {/* Background effects - Snow in dark mode, Sun lights in light mode */}
      <BackgroundEffect isDarkMode={isDarkMode} />

      {/* Theme toggle button */}
      <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </button>

      <header className="home-header">
        <div className="logo-container">
          <div className="logo-icon">AI</div>
          <h1 className="logo-text">MonAgent</h1>
        </div>
        <p className="tagline">Advanced AI Assistant for Development and Productivity</p>
      </header>

      <main className="home-main" style={{ overflowY: 'visible', height: 'auto' }}>
        <section className="hero-section">
          <div className="hero-content">
            <h2>MonAgent Overview</h2>
            <p>MonAgent is an intelligent AI assistant designed to enhance your productivity with advanced coding assistance, data analysis, and project management capabilities. It provides a seamless interface for natural language interactions, code generation, and integrated development tools to streamline your workflow.</p>
            <div className="cta-buttons">
              <Link to="/chat" className="cta-button primary">
                <ChatIcon isDarkMode={isDarkMode} />
                Start Chatting
              </Link>
              <Link to="/ide" className="cta-button secondary">
                <IDEIcon isDarkMode={isDarkMode} />
                Open Workspace
              </Link>
              <Link to="/admin" className="cta-button secondary">
                <AdminIcon isDarkMode={isDarkMode} />
                Admin Dashboard
              </Link>
              <Link to="/config" className="cta-button primary">
                <SettingsIcon isDarkMode={isDarkMode} />
                Configuration
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="celestial-container">
              {isDarkMode ? (
                <div className="moon-container">
                  <MoonIllustration />
                </div>
              ) : (
                <div className="sun-container">
                  <SunIllustration />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="tabs-section">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Key Features
            </button>
            <button
              className={`tab-button ${activeTab === 'capabilities' ? 'active' : ''}`}
              onClick={() => setActiveTab('capabilities')}
            >
              Capabilities
            </button>
            <button
              className={`tab-button ${activeTab === 'benefits' ? 'active' : ''}`}
              onClick={() => setActiveTab('benefits')}
            >
              Benefits & Use Cases
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'features' && (
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon chat-feature"></div>
                  <h3>Intelligent Chat</h3>
                  <p>Engage in natural conversations with our AI to solve complex problems and get assistance with your tasks.</p>
                  <ul className="feature-list">
                    <li>Natural language understanding</li>
                    <li>Context-aware responses</li>
                    <li>Multi-turn conversations</li>
                  </ul>
                </div>
                <div className="feature-card">
                  <div className="feature-icon code-feature"></div>
                  <h3>Code Assistant</h3>
                  <p>Get help with coding, debugging, and optimizing your projects across multiple programming languages.</p>
                  <ul className="feature-list">
                    <li>Code generation and completion</li>
                    <li>Support for Python, JavaScript, and more</li>
                    <li>Debugging and optimization assistance</li>
                  </ul>
                </div>
                <div className="feature-card">
                  <div className="feature-icon workspace-feature"></div>
                  <h3>Integrated Workspace</h3>
                  <p>Manage your projects in our built-in IDE with AI assistance for a seamless development experience.</p>
                  <ul className="feature-list">
                    <li>Built-in code editor</li>
                    <li>Project organization</li>
                    <li>Real-time execution</li>
                  </ul>
                </div>
                <div className="feature-card">
                  <div className="feature-icon learning-feature"></div>
                  <h3>Advanced Customization</h3>
                  <p>Configure the AI assistant to match your specific needs and preferences for optimal productivity.</p>
                  <ul className="feature-list">
                    <li>Customizable settings</li>
                    <li>Configurable parameters</li>
                    <li>Integration with existing tools</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'capabilities' && (
              <div className="capabilities-container">
                <div className="capability-row">
                  <div className="capability-item">
                    <AIIcon isDarkMode={isDarkMode} />
                    <h3>Advanced AI Models</h3>
                    <p>Powered by state-of-the-art language models that understand context, nuance, and complex instructions to provide intelligent assistance.</p>
                  </div>
                  <div className="capability-item">
                    <DataIcon isDarkMode={isDarkMode} />
                    <h3>Data Analysis</h3>
                    <p>Process and analyze data, generate visualizations, and extract meaningful insights from your information to support decision-making.</p>
                  </div>
                </div>
                <div className="capability-row">
                  <div className="capability-item">
                    <SecurityIcon isDarkMode={isDarkMode} />
                    <h3>Secure Environment</h3>
                    <p>Your code and conversations are protected in a secure environment with privacy controls and data protection measures.</p>
                  </div>
                  <div className="capability-item">
                    <AutomationIcon isDarkMode={isDarkMode} />
                    <h3>Workflow Automation</h3>
                    <p>Automate repetitive tasks and streamline your development process with AI assistance to boost productivity and efficiency.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="benefits-container">
                <div className="benefit-column">
                  <h3>For Developers</h3>
                  <ul className="benefit-list">
                    <li>Accelerate coding with AI-powered suggestions</li>
                    <li>Debug faster with intelligent error analysis</li>
                    <li>Learn new programming concepts and techniques</li>
                    <li>Automate repetitive coding tasks</li>
                    <li>Get instant answers to technical questions</li>
                  </ul>
                </div>
                <div className="benefit-column">
                  <h3>For Data Scientists</h3>
                  <ul className="benefit-list">
                    <li>Analyze data more efficiently</li>
                    <li>Generate and optimize data models</li>
                    <li>Visualize complex datasets</li>
                    <li>Extract insights from unstructured data</li>
                    <li>Automate data preprocessing tasks</li>
                  </ul>
                </div>
                <div className="benefit-column">
                  <h3>For Teams</h3>
                  <ul className="benefit-list">
                    <li>Improve collaboration with shared workspaces</li>
                    <li>Standardize code quality across projects</li>
                    <li>Reduce onboarding time for new team members</li>
                    <li>Document code and processes automatically</li>
                    <li>Increase productivity across the entire team</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="how-it-works">
          <h2>How MonAgent Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Ask a Question</h3>
              <p>Start a conversation with MonAgent by asking a question or describing your task in natural language.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Get Intelligent Responses</h3>
              <p>MonAgent processes your request using advanced AI models and provides relevant, context-aware responses.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Iterate and Refine</h3>
              <p>Continue the conversation to refine your results, ask follow-up questions, or explore new directions.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Implement Solutions</h3>
              <p>Use MonAgent's suggestions and code in your projects, either in the integrated workspace or your own environment.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon small">AI</div>
            <span className="footer-logo-text">MonAgent</span>
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
              <a href="#">Documentation</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} MonAgent. All rights reserved.</p>
          <a href="/scroll-fix.html" style={{ fontSize: '12px', marginTop: '10px', display: 'inline-block', color: 'inherit', opacity: 0.7 }}>
            Fix scrolling issues
          </a>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;


