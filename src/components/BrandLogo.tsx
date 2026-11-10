import React from 'react';

interface BrandLogoIconProps {
  className?: string;
}

/**
 * Exact vector recreation of the AmigoFrank CPU icon:
 * Outer rounded square in deep teal (#1B4F6B) on dark navy (#0E1520),
 * Inner microprocessor chip in bright electric cyan (#1EB5E5) with 3 pins on each side.
 */
export const AmigoFrankCpuIcon: React.FC<BrandLogoIconProps> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Dark Navy Base */}
    <rect x="4" y="4" width="92" height="92" rx="22" fill="#0E1520" />
    {/* Outer Rounded Square Border in Deep Teal */}
    <rect
      x="6"
      y="6"
      width="88"
      height="88"
      rx="20"
      stroke="#1C5270"
      strokeWidth="5.5"
    />

    {/* Top 3 Pins */}
    <rect x="33" y="17" width="5.5" height="10" rx="2.75" fill="#1EB5E5" />
    <rect x="47.25" y="15" width="5.5" height="12" rx="2.75" fill="#1EB5E5" />
    <rect x="61.5" y="17" width="5.5" height="10" rx="2.75" fill="#1EB5E5" />

    {/* Bottom 3 Pins */}
    <rect x="33" y="73" width="5.5" height="10" rx="2.75" fill="#1EB5E5" />
    <rect x="47.25" y="73" width="5.5" height="12" rx="2.75" fill="#1EB5E5" />
    <rect x="61.5" y="73" width="5.5" height="10" rx="2.75" fill="#1EB5E5" />

    {/* Left 3 Pins */}
    <rect x="17" y="33" width="10" height="5.5" rx="2.75" fill="#1EB5E5" />
    <rect x="15" y="47.25" width="12" height="5.5" rx="2.75" fill="#1EB5E5" />
    <rect x="17" y="61.5" width="10" height="5.5" rx="2.75" fill="#1EB5E5" />

    {/* Right 3 Pins */}
    <rect x="73" y="33" width="10" height="5.5" rx="2.75" fill="#1EB5E5" />
    <rect x="73" y="47.25" width="12" height="5.5" rx="2.75" fill="#1EB5E5" />
    <rect x="73" y="61.5" width="10" height="5.5" rx="2.75" fill="#1EB5E5" />

    {/* Outer Chip Body */}
    <rect
      x="30"
      y="30"
      width="40"
      height="40"
      rx="7"
      stroke="#1EB5E5"
      strokeWidth="5.5"
    />

    {/* Inner Die Core */}
    <rect
      x="39.5"
      y="39.5"
      width="21"
      height="21"
      rx="3.5"
      stroke="#1EB5E5"
      strokeWidth="4.5"
    />
  </svg>
);
