import React from 'react';

interface DetectiveSVGProps {
  fill?: string;
  className?: string;
}

export const DetectiveSVG: React.FC<DetectiveSVGProps> = ({
  fill = '#2a170a',
  className = 'w-full h-full'
}) => {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Detective"
    >
      <g fill={fill}>
        {/* Shoulders & Coat */}
        <path d="M8 64 C9 54 15 47 25 45 L41 45 C51 47 57 54 58 64 Z" />
        {/* Collar */}
        <path d="M27 38 L39 38 L40 47 L26 47 Z" />
        {/* Face & Jaw */}
        <path d="M23 29 C23 20 30 17 36 18 C42 19 45 24 45 28 L48 32 L45 33.5 L45.5 36 L44 37 C44 40 41 42 37 42 L31 42 C26 41 23 36 23 29 Z" />
        {/* Deerstalker Crown */}
        <path d="M20 25 C19 14 27 9 34 9 C42 9 47 14 47 23 Z" />
        {/* Deerstalker Front Peak */}
        <path d="M44 21 L56 24.5 L45 26 Z" />
        {/* Deerstalker Back Peak */}
        <path d="M23 21 L11 25 L23 27 Z" />
        {/* Pipe Stem */}
        <path d="M43 36.5 L52 38.5 L52 40.5 L43 38.5 Z" />
        {/* Pipe Bowl */}
        <path d="M50 33 h6 v6.5 a3 3 0 0 1 -6 0 Z" />
      </g>
    </svg>
  );
};
