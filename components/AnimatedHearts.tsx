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
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60 FPS
      lastTime = currentTime;
      
      setLeftHeart(prev => {
        let newX = prev.x + leftVelocityRef.current.x * deltaTime;
        let newY = prev.y + leftVelocityRef.current.y * deltaTime;
        
        // Bounce off edges
        if (newY < 0) {
          newY = 0;
          leftVelocityRef.current.y *= -1;
        }
        if (newY > window.innerHeight - 40) {
          newY = window.innerHeight - 40;
          leftVelocityRef.current.y *= -1;
        }
        if (newX < 0) {
          newX = 0;
          leftVelocityRef.current.x *= -1;
        }
        if (newX > window.innerWidth - 40) {
          newX = window.innerWidth - 40;
          leftVelocityRef.current.x *= -1;
        }
        
        return { x: newX, y: newY };
      });
      
      setRightHeart(prev => {
        let newX = prev.x + rightVelocityRef.current.x * deltaTime;
        let newY = prev.y + rightVelocityRef.current.y * deltaTime;
        
        // Bounce off edges
        if (newY < 0) {
          newY = 0;
          rightVelocityRef.current.y *= -1;
        }
        if (newY > window.innerHeight - 40) {
          newY = window.innerHeight - 40;
          rightVelocityRef.current.y *= -1;
        }
        if (newX < 0) {
          newX = 0;
          rightVelocityRef.current.x *= -1;
        }
        if (newX > window.innerWidth - 40) {
          newX = window.innerWidth - 40;
          rightVelocityRef.current.x *= -1;
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
  
  // Collision detection in separate effect for performance
  useEffect(() => {
    if (merged) return;
    
    const checkCollision = () => {
      const distance = Math.sqrt(
        Math.pow(rightHeart.x - leftHeart.x, 2) + 
        Math.pow(rightHeart.y - leftHeart.y, 2)
      );
      
      if (distance < 50) {
        setMerged(true);
        setMergedPosition({
          x: (leftHeart.x + rightHeart.x) / 2,
          y: (leftHeart.y + rightHeart.y) / 2,
        });
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 1500);
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
          <motion.div
            initial={{ scale: 0.5, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{
              position: 'absolute',
              left: mergedPosition.x,
              top: mergedPosition.y,
            }}
          >
            <PixelHeart type="complete" color="red" position={{ x: 0, y: 0 }} />
          </motion.div>
          
          {showSparkle && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-red-500 rounded-full"
                  style={{
                    left: mergedPosition.x + 20,
                    top: mergedPosition.y + 20,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2) * 60,
                    y: Math.sin((i / 8) * Math.PI * 2) * 60,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}


