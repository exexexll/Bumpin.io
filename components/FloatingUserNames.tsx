'use client';

import { useEffect, useState, useRef } from 'react';
import { getSession } from '@/lib/session';
import { API_BASE } from '@/lib/config';

interface FloatingBox {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function FloatingUserNames() {
  const [boxes, setBoxes] = useState<FloatingBox[]>([]);
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const animRef = useRef<number>();
  const nextId = useRef(0);
  const lastSpawn = useRef(0);

  // Fetch active queue users
  useEffect(() => {
    const session = getSession();
    if (!session) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/room/queue`, {
          headers: { 'Authorization': `Bearer ${session.sessionToken}` },
        });
        const data = await res.json();
        const names = data.users?.map((u: any) => u.name).filter(Boolean) || [];
        setAvailableNames(names);
      } catch (err) {
        setAvailableNames(['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey']);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Spawn new box
  const spawnBox = () => {
    if (boxes.length >= 5 || availableNames.length === 0) return;
    if (Date.now() - lastSpawn.current < 3000) return; // Min 3s between spawns

    const w = window.innerWidth;
    const h = window.innerHeight;
    const side = Math.floor(Math.random() * 4);
    
    let x = 0, y = 0, vx = 0, vy = 0;
    
    if (side === 0) { // top
      x = Math.random() * w;
      y = -100;
      vx = (Math.random() - 0.5) * 3;
      vy = Math.random() * 2 + 1;
    } else if (side === 1) { // right
      x = w + 100;
      y = Math.random() * h;
      vx = -(Math.random() * 2 + 1);
      vy = (Math.random() - 0.5) * 3;
    } else if (side === 2) { // bottom
      x = Math.random() * w;
      y = h + 100;
      vx = (Math.random() - 0.5) * 3;
      vy = -(Math.random() * 2 + 1);
    } else { // left
      x = -100;
      y = Math.random() * h;
      vx = Math.random() * 2 + 1;
      vy = (Math.random() - 0.5) * 3;
    }

    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    
    setBoxes(prev => [...prev, {
      id: nextId.current++,
      name,
      x, y, vx, vy,
    }]);
    
    lastSpawn.current = Date.now();
  };

  // Animation loop
  useEffect(() => {
    if (availableNames.length === 0) return;

    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = (time - lastTime) / 16.67;
      lastTime = time;
      
      setBoxes(prev => {
        const updated = prev.map(box => ({
          ...box,
          x: box.x + box.vx * delta,
          y: box.y + box.vy * delta,
        })).filter(box => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          return box.x > -200 && box.x < w + 200 && box.y > -200 && box.y < h + 200;
        });
        
        return updated;
      });
      
      // Spawn new box occasionally
      if (Math.random() < 0.02) spawnBox();
      
      animRef.current = requestAnimationFrame(animate);
    };
    
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [availableNames.length, boxes.length]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {boxes.map(box => (
        <div
          key={box.id}
          className="absolute px-4 py-2 rounded-lg bg-white/80 border-2 border-[#ffc46a] text-black font-semibold text-sm backdrop-blur-sm"
          style={{
            left: box.x,
            top: box.y,
            boxShadow: '2px 2px 0px rgba(0,0,0,0.2)',
          }}
        >
          {box.name}
        </div>
      ))}
    </div>
  );
}

