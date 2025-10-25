'use client';

import { motion } from 'framer-motion';

interface PixelHeartProps {
  type: 'left' | 'right' | 'complete';
  color: 'black' | 'red';
  position: { x: number; y: number };
}

export function PixelHeart({ type, color, position }: PixelHeartProps) {
  const heartColor = color === 'black' ? '#000000' : '#ff1744';
  
  // More pixelized heart design (8-bit style)
  return (
    <motion.div
      className="absolute drop-shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        filter: color === 'red' ? 'drop-shadow(0 0 8px rgba(255, 23, 68, 0.6))' : undefined,
      }}
      animate={{
        scale: type === 'complete' ? [1, 1.15, 1.05, 1] : 1,
        rotate: type === 'complete' ? [0, -5, 5, 0] : 0,
      }}
      transition={{
        duration: 0.8,
        ease: [0.34, 1.56, 0.64, 1], // Bouncy easing
      }}
    >
      <svg width="80" height="80" viewBox="0 0 20 20" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
        {type === 'left' && (
          <g fill={heartColor}>
            {/* Top bumps */}
            <rect x="3" y="4" width="2" height="2"/>
            <rect x="5" y="4" width="1" height="1"/>
            {/* Upper body */}
            <rect x="2" y="6" width="5" height="2"/>
            {/* Mid body */}
            <rect x="3" y="8" width="4" height="2"/>
            {/* Lower body */}
            <rect x="4" y="10" width="3" height="2"/>
            {/* Tip */}
            <rect x="5" y="12" width="2" height="1"/>
            <rect x="6" y="13" width="1" height="1"/>
          </g>
        )}
        
        {type === 'right' && (
          <g fill={heartColor}>
            {/* Top bumps */}
            <rect x="13" y="4" width="1" height="1"/>
            <rect x="14" y="4" width="2" height="2"/>
            {/* Upper body */}
            <rect x="12" y="6" width="5" height="2"/>
            {/* Mid body */}
            <rect x="12" y="8" width="4" height="2"/>
            {/* Lower body */}
            <rect x="12" y="10" width="3" height="2"/>
            {/* Tip */}
            <rect x="12" y="12" width="2" height="1"/>
            <rect x="12" y="13" width="1" height="1"/>
          </g>
        )}
        
        {type === 'complete' && (
          <g fill={heartColor}>
            {/* Top bumps - both sides */}
            <rect x="3" y="4" width="3" height="2"/>
            <rect x="13" y="4" width="3" height="2"/>
            {/* Upper body - connected */}
            <rect x="2" y="6" width="15" height="2"/>
            {/* Mid body */}
            <rect x="3" y="8" width="13" height="2"/>
            {/* Lower body */}
            <rect x="4" y="10" width="11" height="2"/>
            {/* Narrowing */}
            <rect x="6" y="12" width="7" height="1"/>
            <rect x="7" y="13" width="5" height="1"/>
            {/* Tip */}
            <rect x="9" y="14" width="1" height="1"/>
          </g>
        )}
      </svg>
    </motion.div>
  );
}

