'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PixelHeart } from './PixelHeart';

interface HeartPair {
  id: number;
  left: { x: number; y: number };
  right: { x: number; y: number };
  leftVelocity: { x: number; y: number };
  rightVelocity: { x: number; y: number };
  merged: boolean;
  mergedPos?: { x: number; y: number };
  mergedVelocity?: { x: number; y: number };
  showSparkle: boolean;
}

export function AnimatedHearts() {
  const [heartPairs, setHeartPairs] = useState<HeartPair[]>([]);
  const animationFrameRef = useRef<number>();
  
  const initializeHeartPair = (id: number): HeartPair => {
    const sides = ['top', 'bottom', 'left', 'right'];
    const leftSide = sides[Math.floor(Math.random() * sides.length)];
    const rightSide = sides[Math.floor(Math.random() * sides.length)];
    
    let leftPos = { x: 0, y: 0 };
    let leftVel = { x: 0, y: 0 };
    let rightPos = { x: 0, y: 0 };
    let rightVel = { x: 0, y: 0 };
    
    // Left heart
    const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1000;
    
    if (leftSide === 'top') {
      leftPos = { x: Math.random() * w, y: -100 };
      leftVel = { x: (Math.random() - 0.5) * 2, y: Math.random() * 1.5 + 0.5 };
    } else if (leftSide === 'bottom') {
      leftPos = { x: Math.random() * w, y: h + 100 };
      leftVel = { x: (Math.random() - 0.5) * 2, y: -(Math.random() * 1.5 + 0.5) };
    } else if (leftSide === 'left') {
      leftPos = { x: -100, y: Math.random() * h };
      leftVel = { x: Math.random() * 1.5 + 0.5, y: (Math.random() - 0.5) * 2 };
    } else {
      leftPos = { x: w + 100, y: Math.random() * h };
      leftVel = { x: -(Math.random() * 1.5 + 0.5), y: (Math.random() - 0.5) * 2 };
    }
    
    // Right heart
    if (rightSide === 'top') {
      rightPos = { x: Math.random() * w, y: -100 };
      rightVel = { x: (Math.random() - 0.5) * 2, y: Math.random() * 1.5 + 0.5 };
    } else if (rightSide === 'bottom') {
      rightPos = { x: Math.random() * w, y: h + 100 };
      rightVel = { x: (Math.random() - 0.5) * 2, y: -(Math.random() * 1.5 + 0.5) };
    } else if (rightSide === 'left') {
      rightPos = { x: -100, y: Math.random() * h };
      rightVel = { x: Math.random() * 1.5 + 0.5, y: (Math.random() - 0.5) * 2 };
    } else {
      rightPos = { x: w + 100, y: Math.random() * h };
      rightVel = { x: -(Math.random() * 1.5 + 0.5), y: (Math.random() - 0.5) * 2 };
    }
    
    return {
      id,
      left: leftPos,
      right: rightPos,
      leftVelocity: leftVel,
      rightVelocity: rightVel,
      merged: false,
      showSparkle: false,
    };
  };

  useEffect(() => {
    // Create 20 pairs of hearts
    const pairs: HeartPair[] = [];
    for (let i = 0; i < 20; i++) {
      pairs.push(initializeHeartPair(i));
    }
    setHeartPairs(pairs);
  }, []);

  useEffect(() => {
    if (heartPairs.length === 0) return;

    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 16.67;
      lastTime = currentTime;
      
      setHeartPairs(prev => prev.map(pair => {
        if (pair.merged && pair.mergedPos && pair.mergedVelocity) {
          // Keep merged heart moving
          let newX = pair.mergedPos.x + pair.mergedVelocity.x * deltaTime;
          let newY = pair.mergedPos.y + pair.mergedVelocity.y * deltaTime;
          
          const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
          const h = typeof window !== 'undefined' ? window.innerHeight : 1000;
          
          if (newY < 0 || newY > h - 40) pair.mergedVelocity.y *= -1;
          if (newX < 0 || newX > w - 40) pair.mergedVelocity.x *= -1;
          
          return {
            ...pair,
            mergedPos: { x: newX, y: newY },
          };
        }
        
        // Move individual hearts
        let newLeftX = pair.left.x + pair.leftVelocity.x * deltaTime;
        let newLeftY = pair.left.y + pair.leftVelocity.y * deltaTime;
        let newRightX = pair.right.x + pair.rightVelocity.x * deltaTime;
        let newRightY = pair.right.y + pair.rightVelocity.y * deltaTime;
        
        const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const h = typeof window !== 'undefined' ? window.innerHeight : 1000;
        
        // Bounce left heart
        if (newLeftY < 0 || newLeftY > h - 40) pair.leftVelocity.y *= -1;
        if (newLeftX < 0 || newLeftX > w - 40) pair.leftVelocity.x *= -1;
        
        // Bounce right heart
        if (newRightY < 0 || newRightY > h - 40) pair.rightVelocity.y *= -1;
        if (newRightX < 0 || newRightX > w - 40) pair.rightVelocity.x *= -1;
        
        // Check collision
        const distance = Math.sqrt(
          Math.pow(newRightX - newLeftX, 2) + 
          Math.pow(newRightY - newLeftY, 2)
        );
        
        if (distance < 50 && !pair.merged) {
          const mergedX = (newLeftX + newRightX) / 2;
          const mergedY = (newLeftY + newRightY) / 2;
          const mergedVelX = (pair.leftVelocity.x + pair.rightVelocity.x) / 2;
          const mergedVelY = (pair.leftVelocity.y + pair.rightVelocity.y) / 2;
          
          return {
            ...pair,
            merged: true,
            mergedPos: { x: mergedX, y: mergedY },
            mergedVelocity: { x: mergedVelX, y: mergedVelY },
            showSparkle: true,
          };
        }
        
        return {
          ...pair,
          left: { x: newLeftX, y: newLeftY },
          right: { x: newRightX, y: newRightY },
        };
      }));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [heartPairs.length]);
  
  // Hide sparkles after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeartPairs(prev => prev.map(pair => ({
        ...pair,
        showSparkle: false,
      })));
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {heartPairs.map(pair => (
        <div key={pair.id}>
          {!pair.merged ? (
            <>
              <div style={{ position: 'absolute', left: pair.left.x, top: pair.left.y, transform: 'translate3d(0,0,0)', willChange: 'transform' }}>
                <PixelHeart type="left" color="black" position={{ x: 0, y: 0 }} />
              </div>
              <div style={{ position: 'absolute', left: pair.right.x, top: pair.right.y, transform: 'translate3d(0,0,0)', willChange: 'transform' }}>
                <PixelHeart type="right" color="black" position={{ x: 0, y: 0 }} />
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.5, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                  position: 'absolute',
                  left: pair.mergedPos!.x,
                  top: pair.mergedPos!.y,
                  transform: 'translate3d(0,0,0)',
                  willChange: 'transform',
                }}
              >
                <PixelHeart type="complete" color="red" position={{ x: 0, y: 0 }} />
              </motion.div>
              
              {pair.showSparkle && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`${pair.id}-sparkle-${i}`}
                      className="absolute w-2 h-2 bg-red-500 rounded-full"
                      style={{
                        left: pair.mergedPos!.x + 20,
                        top: pair.mergedPos!.y + 20,
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
      ))}
    </div>
  );
}





