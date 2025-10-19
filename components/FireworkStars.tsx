'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Firework {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export function FireworkStars() {
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    // Generate random firework positions
    const positions: Firework[] = [
      { id: 1, x: 15, y: 20, delay: 0 },
      { id: 2, x: 85, y: 30, delay: 0.5 },
      { id: 3, x: 25, y: 60, delay: 1 },
      { id: 4, x: 75, y: 70, delay: 1.5 },
      { id: 5, x: 50, y: 40, delay: 2 },
    ];
    setFireworks(positions);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {fireworks.map((fw) => (
        <Firework key={fw.id} x={fw.x} y={fw.y} delay={fw.delay} />
      ))}
    </div>
  );
}

function Firework({ x, y, delay }: { x: number; y: number; delay: number }) {
  // Generate 8 stars radiating outward
  const starCount = 8;
  const stars = Array.from({ length: starCount }, (_, i) => {
    const angle = (i / starCount) * Math.PI * 2;
    return {
      id: i,
      angle,
      distance: 60 + Math.random() * 40, // Random distance for variety
    };
  });

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      {/* Launch effect - small dot shoots up */}
      <motion.div
        className="absolute w-1 h-1 bg-yellow-400 rounded-full"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: [0, 1, 0] }}
        transition={{
          duration: 0.6,
          delay: delay,
          ease: 'easeOut',
        }}
      />

      {/* Star explosion */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          initial={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: Math.cos(star.angle) * star.distance,
            y: Math.sin(star.angle) * star.distance,
            opacity: [0, 1, 0.8, 0],
            scale: [0, 1.5, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: delay + 0.6,
            ease: 'easeOut',
          }}
        >
          {/* 4-point star shape using CSS */}
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 bg-yellow-300 transform rotate-0" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

