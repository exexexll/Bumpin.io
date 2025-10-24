'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PixelHeart } from './PixelHeart';

export function AnimatedHearts() {
  const [leftHeart, setLeftHeart] = useState({ x: -100, y: Math.random() * window.innerHeight });
  const [rightHeart, setRightHeart] = useState({ x: window.innerWidth + 100, y: Math.random() * window.innerHeight });
  const [merged, setMerged] = useState(false);
  const [mergedPosition, setMergedPosition] = useState({ x: 0, y: 0 });
  const [showSparkle, setShowSparkle] = useState(false);
  
  // Random starting positions and velocities
  const [leftVelocity] = useState({
    x: Math.random() * 2 + 1,
    y: (Math.random() - 0.5) * 2,
  });
  
  const [rightVelocity] = useState({
    x: -(Math.random() * 2 + 1),
    y: (Math.random() - 0.5) * 2,
  });

  useEffect(() => {
    if (merged) return;

    const interval = setInterval(() => {
      setLeftHeart(prev => {
        let newX = prev.x + leftVelocity.x;
        let newY = prev.y + leftVelocity.y;
        
        // Bounce off edges
        if (newY < 0 || newY > window.innerHeight - 40) {
          leftVelocity.y *= -1;
        }
        
        return { x: newX, y: newY };
      });
      
      setRightHeart(prev => {
        let newX = prev.x + rightVelocity.x;
        let newY = prev.y + rightVelocity.y;
        
        // Bounce off edges
        if (newY < 0 || newY > window.innerHeight - 40) {
          rightVelocity.y *= -1;
        }
        
        return { x: newX, y: newY };
      });
      
      // Check collision (distance between centers < 50px)
      const distance = Math.sqrt(
        Math.pow(rightHeart.x - leftHeart.x, 2) + 
        Math.pow(rightHeart.y - leftHeart.y, 2)
      );
      
      if (distance < 60 && !merged) {
        // Collision! Merge hearts
        setMerged(true);
        setMergedPosition({
          x: (leftHeart.x + rightHeart.x) / 2,
          y: (leftHeart.y + rightHeart.y) / 2,
        });
        setShowSparkle(true);
        
        // Hide sparkle after animation
        setTimeout(() => setShowSparkle(false), 1000);
      }
    }, 50); // 20 FPS
    
    return () => clearInterval(interval);
  }, [leftHeart, rightHeart, merged, leftVelocity, rightVelocity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {!merged ? (
        <>
          <PixelHeart type="left" color="black" position={leftHeart} />
          <PixelHeart type="right" color="black" position={rightHeart} />
        </>
      ) : (
        <>
          <PixelHeart type="complete" color="red" position={mergedPosition} />
          {showSparkle && (
            <motion.div
              className="absolute"
              style={{ left: mergedPosition.x, top: mergedPosition.y }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="text-4xl">✨</div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

