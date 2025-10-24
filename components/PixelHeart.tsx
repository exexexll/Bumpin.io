'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PixelHeartProps {
  type: 'left' | 'right' | 'complete';
  color: 'black' | 'red';
  position: { x: number; y: number };
  onCollision?: () => void;
}

export function PixelHeart({ type, color, position }: PixelHeartProps) {
  const heartColor = color === 'black' ? '#000000' : '#dc2626';
  
  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        imageRendering: 'pixelated',
      }}
      animate={{
        scale: type === 'complete' ? [1, 1.2, 1] : 1,
      }}
      transition={{
        scale: {
          duration: 0.5,
          ease: 'easeInOut',
        },
      }}
    >
      <svg width="60" height="60" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        {type === 'left' && (
          <g fill={heartColor}>
            <rect x="2" y="3" width="1" height="1"/>
            <rect x="3" y="3" width="1" height="1"/>
            <rect x="1" y="4" width="1" height="1"/>
            <rect x="2" y="4" width="1" height="1"/>
            <rect x="3" y="4" width="1" height="1"/>
            <rect x="4" y="4" width="1" height="1"/>
            <rect x="1" y="5" width="1" height="1"/>
            <rect x="2" y="5" width="1" height="1"/>
            <rect x="3" y="5" width="1" height="1"/>
            <rect x="4" y="5" width="1" height="1"/>
            <rect x="1" y="6" width="1" height="1"/>
            <rect x="2" y="6" width="1" height="1"/>
            <rect x="3" y="6" width="1" height="1"/>
            <rect x="4" y="6" width="1" height="1"/>
            <rect x="2" y="7" width="1" height="1"/>
            <rect x="3" y="7" width="1" height="1"/>
            <rect x="4" y="7" width="1" height="1"/>
            <rect x="3" y="8" width="1" height="1"/>
            <rect x="4" y="8" width="1" height="1"/>
            <rect x="4" y="9" width="1" height="1"/>
          </g>
        )}
        
        {type === 'right' && (
          <g fill={heartColor}>
            <rect x="10" y="3" width="1" height="1"/>
            <rect x="11" y="3" width="1" height="1"/>
            <rect x="9" y="4" width="1" height="1"/>
            <rect x="10" y="4" width="1" height="1"/>
            <rect x="11" y="4" width="1" height="1"/>
            <rect x="12" y="4" width="1" height="1"/>
            <rect x="9" y="5" width="1" height="1"/>
            <rect x="10" y="5" width="1" height="1"/>
            <rect x="11" y="5" width="1" height="1"/>
            <rect x="12" y="5" width="1" height="1"/>
            <rect x="9" y="6" width="1" height="1"/>
            <rect x="10" y="6" width="1" height="1"/>
            <rect x="11" y="6" width="1" height="1"/>
            <rect x="12" y="6" width="1" height="1"/>
            <rect x="9" y="7" width="1" height="1"/>
            <rect x="10" y="7" width="1" height="1"/>
            <rect x="11" y="7" width="1" height="1"/>
            <rect x="9" y="8" width="1" height="1"/>
            <rect x="10" y="8" width="1" height="1"/>
            <rect x="9" y="9" width="1" height="1"/>
          </g>
        )}
        
        {type === 'complete' && (
          <g fill={heartColor}>
            <rect x="2" y="3" width="2" height="1"/>
            <rect x="10" y="3" width="2" height="1"/>
            <rect x="1" y="4" width="4" height="1"/>
            <rect x="9" y="4" width="4" height="1"/>
            <rect x="1" y="5" width="12" height="1"/>
            <rect x="1" y="6" width="12" height="1"/>
            <rect x="2" y="7" width="10" height="1"/>
            <rect x="3" y="8" width="8" height="1"/>
            <rect x="4" y="9" width="6" height="1"/>
            <rect x="5" y="10" width="4" height="1"/>
            <rect x="6" y="11" width="2" height="1"/>
            <rect x="7" y="12" width="1" height="1"/>
          </g>
        )}
      </svg>
    </motion.div>
  );
}

