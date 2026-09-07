import React from "react";

interface NumeraLogoProps {
  size?: number;
  className?: string;
  variant?: "dark" | "light" | "monochrome";
}

export function NumeraLogo({ size = 28, className = "", variant = "dark" }: NumeraLogoProps) {
  const isDark = variant === "dark";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
    >
      {/* Background Squircle with Subtle Hairline Bevel */}
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill={isDark ? "#101010" : "#ffffff"}
        stroke={isDark ? "#262626" : "#e5e7eb"}
        strokeWidth="1.2"
      />

      {/* Modern Minimalist Geometric 'N' Matrix Mark */}
      {/* Left Vertical Column Pillar */}
      <path
        d="M9 22.5V9.5"
        stroke={isDark ? "#ffffff" : "#101010"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* High-Precision Diagonal Matrix Vector */}
      <path
        d="M9 10.5L23 21.5"
        stroke={isDark ? "#0099ff" : "#0080ff"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Right Vertical Column Pillar */}
      <path
        d="M23 22.5V9.5"
        stroke={isDark ? "#ffffff" : "#101010"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Data Coordinate Accent Point */}
      <circle
        cx="9"
        cy="9.5"
        r="1.2"
        fill={isDark ? "#ffffff" : "#101010"}
      />
      <circle
        cx="23"
        cy="22.5"
        r="1.2"
        fill={isDark ? "#0099ff" : "#0080ff"}
      />
    </svg>
  );
}

export function NumeraWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <NumeraLogo size={26} />
      <span className="font-semibold text-[15px] tracking-tight text-[#101010] font-sans">
        Numera
      </span>
    </div>
  );
}
