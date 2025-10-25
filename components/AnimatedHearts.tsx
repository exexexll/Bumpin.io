'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PixelHeart } from './PixelHeart';

export function AnimatedHearts() {
  const [leftHeart, setLeftHeart] = useState({ x: -100, y: 0 });
  const [rightHeart, setRightHeart] = useState({ x: 0, y: -100 });
  const [merged, setMerged] = useState(false);
  const [mergedPosition, setMergedPosition] = useState({ x: 0, y: 0 });
  const [showSparkle, setShowSparkle] = useState(false);
  const animationFrameRef = useRef<number>();
  
  const leftVelocityRef = useRef({ x: 0, y: 0 });
  const rightVelocityRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize random positions and velocities
    const sides = ['top', 'bottom', 'left', 'right'];
    const leftSide = sides[Math.floor(Math.random() * sides.length)];
    const rightSide = sides[Math.floor(Math.random() * sides.length)];
    
    // Left heart starting position
    if (leftSide === 'top') {
      setLeftHeart({ x: Math.random() * window.innerWidth, y: -100 });
      leftVelocityRef.current = { x: (Math.random() - 0.5) * 3, y: Math.random() * 2 + 1 };
    } else if (leftSide === 'bottom') {
      setLeftHeart({ x: Math.random() * window.innerWidth, y: window.innerHeight + 100 });
      leftVelocityRef.current = { x: (Math.random() - 0.5) * 3, y: -(Math.random() * 2 + 1) };
    } else if (leftSide === 'left') {
      setLeftHeart({ x: -100, y: Math.random() * window.innerHeight });
      leftVelocityRef.current = { x: Math.random() * 2 + 1, y: (Math.random() - 0.5) * 3 };
    } else {
      setLeftHeart({ x: window.innerWidth + 100, y: Math.random() * window.innerHeight });
      leftVelocityRef.current = { x: -(Math.random() * 2 + 1), y: (Math.random() - 0.5) * 3 };
    }
    
    // Right heart starting position
    if (rightSide === 'top') {
      setRightHeart({ x: Math.random() * window.innerWidth, y: -100 });
      rightVelocityRef.current = { x: (Math.random() - 0.5) * 3, y: Math.random() * 2 + 1 };
    } else if (rightSide === 'bottom') {
      setRightHeart({ x: Math.random() * window.innerWidth, y: window.innerHeight + 100 });
      rightVelocityRef.current = { x: (Math.random() - 0.5) * 3, y: -(Math.random() * 2 + 1) };
    } else if (rightSide === 'left') {
      setRightHeart({ x: -100, y: Math.random() * window.innerHeight });
      rightVelocityRef.current = { x: Math.random() * 2 + 1, y: (Math.random() - 0.5) * 3 };
    } else {
      setRightHeart({ x: window.innerWidth + 100, y: Math.random() * window.innerHeight });
      rightVelocityRef.current = { x: -(Math.random() * 2 + 1), y: (Math.random() - 0.5) * 3 };
    }
  }, []);

  useEffect(() => {
    if (merged) return;

    let lastTime = performance.now();
    const attractionStrength = 0.02; // Subtle magnetic attraction before collision
    
    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2); // Cap delta to prevent jumps
      lastTime = currentTime;
      
      setLeftHeart(prev => {
        let newX = prev.x + leftVelocityRef.current.x * deltaTime;
        let newY = prev.y + leftVelocityRef.current.y * deltaTime;
        
        // Bounce off edges with slight randomness for organic feel
        if (newY < 0) {
          newY = 0;
          leftVelocityRef.current.y = Math.abs(leftVelocityRef.current.y) * (0.9 + Math.random() * 0.2);
        }
        if (newY > window.innerHeight - 80) {
          newY = window.innerHeight - 80;
          leftVelocityRef.current.y = -Math.abs(leftVelocityRef.current.y) * (0.9 + Math.random() * 0.2);
        }
        if (newX < 0) {
          newX = 0;
          leftVelocityRef.current.x = Math.abs(leftVelocityRef.current.x) * (0.9 + Math.random() * 0.2);
        }
        if (newX > window.innerWidth - 80) {
          newX = window.innerWidth - 80;
          leftVelocityRef.current.x = -Math.abs(leftVelocityRef.current.x) * (0.9 + Math.random() * 0.2);
        }
        
        return { x: newX, y: newY };
      });
      
      setRightHeart(prev => {
        let newX = prev.x + rightVelocityRef.current.x * deltaTime;
        let newY = prev.y + rightVelocityRef.current.y * deltaTime;
        
        // Bounce off edges with slight randomness
        if (newY < 0) {
          newY = 0;
          rightVelocityRef.current.y = Math.abs(rightVelocityRef.current.y) * (0.9 + Math.random() * 0.2);
        }
        if (newY > window.innerHeight - 80) {
          newY = window.innerHeight - 80;
          rightVelocityRef.current.y = -Math.abs(rightVelocityRef.current.y) * (0.9 + Math.random() * 0.2);
        }
        if (newX < 0) {
          newX = 0;
          rightVelocityRef.current.x = Math.abs(rightVelocityRef.current.x) * (0.9 + Math.random() * 0.2);
        }
        if (newX > window.innerWidth - 80) {
          newX = window.innerWidth - 80;
          rightVelocityRef.current.x = -Math.abs(rightVelocityRef.current.x) * (0.9 + Math.random() * 0.2);
        }
        
        return { x: newX, y: newY };
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [merged]);
  
  // Collision detection with improved animation
  useEffect(() => {
    if (merged) return;
    
    const checkCollision = () => {
      const distance = Math.sqrt(
        Math.pow(rightHeart.x - leftHeart.x, 2) + 
        Math.pow(rightHeart.y - leftHeart.y, 2)
      );
      
      // Trigger at slightly larger distance for smoother merge
      if (distance < 70) {
        setMerged(true);
        setMergedPosition({
          x: (leftHeart.x + rightHeart.x) / 2,
          y: (leftHeart.y + rightHeart.y) / 2,
        });
        // Show sparkle immediately and longer
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 2000);
      }
    };
    
    checkCollision();
  }, [leftHeart, rightHeart, merged]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {!merged ? (
        <>
          <motion.div
            animate={{
              x: leftHeart.x,
              y: leftHeart.y,
            }}
            transition={{ type: 'tween', duration: 0, ease: 'linear' }}
          >
            <PixelHeart type="left" color="black" position={{ x: 0, y: 0 }} />
          </motion.div>
          <motion.div
            animate={{
              x: rightHeart.x,
              y: rightHeart.y,
            }}
            transition={{ type: 'tween', duration: 0, ease: 'linear' }}
          >
            <PixelHeart type="right" color="black" position={{ x: 0, y: 0 }} />
          </motion.div>
        </>
      ) : (
        <>
          {/* Merged heart with enhanced animation */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ 
              scale: [0.3, 1.3, 1.1, 1], 
              opacity: 1,
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 1.2,
              ease: [0.34, 1.56, 0.64, 1], // Bouncy cubic-bezier
            }}
            style={{
              position: 'absolute',
              left: mergedPosition.x,
              top: mergedPosition.y,
            }}
          >
            <PixelHeart type="complete" color="red" position={{ x: 0, y: 0 }} />
          </motion.div>
          
          {/* Enhanced pixelized sparkles */}
          {showSparkle && (
            <>
              {/* Star-shaped pixel sparkles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: mergedPosition.x + 40,
                    top: mergedPosition.y + 40,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 12) * Math.PI * 2) * 90,
                    y: Math.sin((i / 12) * Math.PI * 2) * 90,
                    scale: [0, 1.5, 0],
                    opacity: [1, 1, 0],
                    rotate: [0, 180],
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: i * 0.05 }}
                >
                  {/* Pixelized star */}
                  <svg width="16" height="16" viewBox="0 0 5 5" style={{ imageRendering: 'pixelated' }}>
                    <g fill="#ff1744">
                      <rect x="2" y="0" width="1" height="1"/>
                      <rect x="0" y="2" width="1" height="1"/>
                      <rect x="2" y="2" width="1" height="1"/>
                      <rect x="4" y="2" width="1" height="1"/>
                      <rect x="2" y="4" width="1" height="1"/>
                    </g>
                  </svg>
                </motion.div>
              ))}
              
              {/* Expanding pixel ring */}
              <motion.div
                className="absolute"
                style={{
                  left: mergedPosition.x + 30,
                  top: mergedPosition.y + 30,
                  width: 20,
                  height: 20,
                  border: '4px solid #ff1744',
                  imageRendering: 'pixelated',
                }}
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}


