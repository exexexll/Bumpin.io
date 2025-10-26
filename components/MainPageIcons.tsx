'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PixelIcon } from './PixelIcons';

type IconType = 'football' | 'soccer' | 'music' | 'car' | 'game';

interface IconPair {
  id: number;
  type: IconType;
  left: { x: number; y: number };
  right: { x: number; y: number };
  leftVel: { x: number; y: number };
  rightVel: { x: number; y: number };
  merged: boolean;
  mergedPos?: { x: number; y: number };
  mergedVel?: { x: number; y: number };
  color: string;
}

export function MainPageIcons() {
  const [pairs, setPairs] = useState<IconPair[]>([]);
  const animRef = useRef<number>();
  
  useEffect(() => {
    const iconTypes: IconType[] = ['football', 'soccer', 'music', 'car', 'game'];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
    
    const newPairs: IconPair[] = iconTypes.map((type, i) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      const side1 = Math.floor(Math.random() * 4);
      const side2 = Math.floor(Math.random() * 4);
      
      let leftPos = { x: 0, y: 0 };
      let rightPos = { x: 0, y: 0 };
      let leftVel = { x: 0, y: 0 };
      let rightVel = { x: 0, y: 0 };
      
      if (side1 === 0) {
        leftPos = { x: Math.random() * w, y: -100 };
        leftVel = { x: (Math.random() - 0.5) * 2, y: Math.random() + 0.5 };
      } else if (side1 === 1) {
        leftPos = { x: w + 100, y: Math.random() * h };
        leftVel = { x: -(Math.random() + 0.5), y: (Math.random() - 0.5) * 2 };
      } else if (side1 === 2) {
        leftPos = { x: Math.random() * w, y: h + 100 };
        leftVel = { x: (Math.random() - 0.5) * 2, y: -(Math.random() + 0.5) };
      } else {
        leftPos = { x: -100, y: Math.random() * h };
        leftVel = { x: Math.random() + 0.5, y: (Math.random() - 0.5) * 2 };
      }
      
      if (side2 === 0) {
        rightPos = { x: Math.random() * w, y: -100 };
        rightVel = { x: (Math.random() - 0.5) * 2, y: Math.random() + 0.5 };
      } else if (side2 === 1) {
        rightPos = { x: w + 100, y: Math.random() * h };
        rightVel = { x: -(Math.random() + 0.5), y: (Math.random() - 0.5) * 2 };
      } else if (side2 === 2) {
        rightPos = { x: Math.random() * w, y: h + 100 };
        rightVel = { x: (Math.random() - 0.5) * 2, y: -(Math.random() + 0.5) };
      } else {
        rightPos = { x: -100, y: Math.random() * h };
        rightVel = { x: Math.random() + 0.5, y: (Math.random() - 0.5) * 2 };
      }
      
      return {
        id: i,
        type,
        left: leftPos,
        right: rightPos,
        leftVel,
        rightVel,
        merged: false,
        color: colors[i],
      };
    });
    
    setPairs(newPairs);
  }, []);

  useEffect(() => {
    if (pairs.length === 0) return;

    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.67, 2); // Cap delta to prevent jumps
      lastTime = time;
      
      setPairs(prev => prev.map(pair => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        if (pair.merged && pair.mergedPos && pair.mergedVel) {
          let x = pair.mergedPos.x + pair.mergedVel.x * delta;
          let y = pair.mergedPos.y + pair.mergedVel.y * delta;
          
          // Bounce with slight randomness for organic feel
          if (y < 0 || y > h - 60) {
            y = y < 0 ? 0 : h - 60;
            pair.mergedVel.y = -pair.mergedVel.y * (0.9 + Math.random() * 0.2);
          }
          if (x < 0 || x > w - 60) {
            x = x < 0 ? 0 : w - 60;
            pair.mergedVel.x = -pair.mergedVel.x * (0.9 + Math.random() * 0.2);
          }
          
          return { ...pair, mergedPos: { x, y } };
        }
        
        let lx = pair.left.x + pair.leftVel.x * delta;
        let ly = pair.left.y + pair.leftVel.y * delta;
        let rx = pair.right.x + pair.rightVel.x * delta;
        let ry = pair.right.y + pair.rightVel.y * delta;
        
        // Bounce with randomness
        if (ly < 0 || ly > h - 60) {
          ly = ly < 0 ? 0 : h - 60;
          pair.leftVel.y = -pair.leftVel.y * (0.9 + Math.random() * 0.2);
        }
        if (lx < 0 || lx > w - 60) {
          lx = lx < 0 ? 0 : w - 60;
          pair.leftVel.x = -pair.leftVel.x * (0.9 + Math.random() * 0.2);
        }
        if (ry < 0 || ry > h - 60) {
          ry = ry < 0 ? 0 : h - 60;
          pair.rightVel.y = -pair.rightVel.y * (0.9 + Math.random() * 0.2);
        }
        if (rx < 0 || rx > w - 60) {
          rx = rx < 0 ? 0 : w - 60;
          pair.rightVel.x = -pair.rightVel.x * (0.9 + Math.random() * 0.2);
        }
        
        const dist = Math.sqrt(Math.pow(rx - lx, 2) + Math.pow(ry - ly, 2));
        
        // Larger collision distance for smoother merge
        if (dist < 70 && !pair.merged) {
          return {
            ...pair,
            merged: true,
            mergedPos: { x: (lx + rx) / 2, y: (ly + ry) / 2 },
            mergedVel: { 
              x: (pair.leftVel.x + pair.rightVel.x) / 2, 
              y: (pair.leftVel.y + pair.rightVel.y) / 2 
            },
          };
        }
        
        return { ...pair, left: { x: lx, y: ly }, right: { x: rx, y: ry } };
      }));
      
      animRef.current = requestAnimationFrame(animate);
    };
    
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [pairs.length]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {pairs.map((pair, index) => (
        <motion.div 
          key={pair.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {!pair.merged ? (
            <>
              <motion.div 
                style={{ position: 'absolute', left: pair.left.x, top: pair.left.y }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <PixelIcon type={pair.type} half="left" color="#000000" />
              </motion.div>
              <motion.div 
                style={{ position: 'absolute', left: pair.right.x, top: pair.right.y }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <PixelIcon type={pair.type} half="right" color="#000000" />
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ 
                scale: [0.3, 1.3, 1.1, 1], 
                opacity: 1,
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 1.2,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              whileHover={{ scale: 1.15, rotate: 15 }}
              style={{ 
                position: 'absolute', 
                left: pair.mergedPos!.x, 
                top: pair.mergedPos!.y,
                filter: 'drop-shadow(0 0 8px ' + pair.color + ')'
              }}
            >
              <PixelIcon type={pair.type} half="complete" color={pair.color} />
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

