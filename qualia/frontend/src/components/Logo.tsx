import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 32 }: LogoProps) {
  const id = useId();
  const orangeGradientId = `orangeGradient-${id}`;
  const accentGradientId = `accentGradient-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-label="Qualia Logo"
    >
      <defs>
        <linearGradient id={orangeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'oklch(0.705 0.213 47.604)', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: 'oklch(0.646 0.222 41.116)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'oklch(0.47 0.157 37.304)', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={accentGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'oklch(0.837 0.128 66.29)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'oklch(0.705 0.213 47.604)', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Main Q shape */}
      <circle
        cx="60"
        cy="55"
        r="35"
        fill="none"
        stroke={`url(#${orangeGradientId})`}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Q tail with curved design */}
      <path
        d="M 80 75 Q 90 85, 95 95"
        fill="none"
        stroke={`url(#${orangeGradientId})`}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Inner accent circle for depth */}
      <circle
        cx="60"
        cy="55"
        r="20"
        fill="none"
        stroke={`url(#${accentGradientId})`}
        strokeWidth="3"
        opacity="0.5"
      />

      {/* Small dot accent in top right */}
      <circle cx="85" cy="30" r="4" fill={`url(#${accentGradientId})`} />
    </svg>
  );
}

export default Logo;
