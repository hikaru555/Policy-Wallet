
import React from 'react';

interface AppLogoProps {
  className?: string;
  id?: string;
  size?: number;
}

const AppLogo: React.FC<AppLogoProps> = ({ className = "", id = "main", size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={`drop-shadow-xl ${className}`}>
    <defs>
      <linearGradient id={`grad_logo_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    {/* Background Rounded Rect */}
    <rect width="60" height="60" rx="18" fill={`url(#grad_logo_${id})`} />
    <rect width="60" height="60" rx="18" fill="white" fillOpacity="0.05" />
    
    {/* Shield Shape */}
    <path d="M30 14L44 19V32C44 40.5 38 48.5 30 51C22 48.5 16 40.5 16 32V19L30 14Z" fill="white" fillOpacity="0.12" />
    
    {/* Wallet / Folder Core */}
    <path d="M22 24C22 22.3431 23.3431 21 25 21H38C39.6569 21 41 22.3431 41 24V40C41 41.6569 39.6569 43 38 43H25C23.3431 43 22 41.6569 22 40V24Z" fill="white" />
    
    {/* Document Lines inside Wallet */}
    <rect x="26" y="27" width="10" height="2.5" rx="1" fill="#4F46E5" />
    <rect x="26" y="32" width="12" height="2.5" rx="1" fill="#4F46E5" />
    <rect x="26" y="37" width="8" height="2.5" rx="1" fill="#4F46E5" fillOpacity="0.5" />
    
    {/* Accent Dot */}
    <circle cx="41" cy="21" r="5" fill="#FACC15" stroke="white" strokeWidth="2" />
    <path d="M39.5 21L40.5 22L42.5 20" stroke="#854D0E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default AppLogo;
