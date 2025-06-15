
import React from "react";

const AvaliaServLogo = ({ size = 64 }: { size?: number }) => (
  <svg
    width={size * 5.5}
    height={size}
    viewBox="0 0 440 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
    style={{ display: "block" }}
  >
    <defs>
      <linearGradient id="mainGrad" x1="0" y1="40" x2="440" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#33aaff"/>
        <stop offset="1" stopColor="#23d889"/>
      </linearGradient>
      <linearGradient id="circleGrad" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#23d889"/>
        <stop offset="1" stopColor="#33aaff"/>
      </linearGradient>
    </defs>
    <circle cx="45" cy="40" r="29" fill="url(#circleGrad)" />
    <path d="M31 45c5 8 16 8 20-4 6-15 24-4 24-1" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <text x="86" y="48" fontFamily="'Inter',sans-serif" fontWeight="bold" fontSize="36"
      fill="url(#mainGrad)" letterSpacing="1">
      AvaliaServ Público
    </text>
  </svg>
);

export default AvaliaServLogo;
