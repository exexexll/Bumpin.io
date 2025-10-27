'use client';

import { useEffect, useRef } from 'react';

/**
 * High-Quality Pixelized Team Photo Background
 * Uses Canvas API to create identical pixel art from source image
 * Maintains all details with high pixel density (100x100 grid)
 */

export function PixelizedTeamPhoto() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Medium pixelation - contours visible, still pixel art aesthetic
    const pixelGrid = 64; // 64x64 grid (contours visible)
    canvas.width = pixelGrid;
    canvas.height = pixelGrid;

    const img = new Image();
    img.crossOrigin = ''; // Allow same-origin images in canvas
    
    img.onload = () => {
      console.log('[PixelArt] ✅ Image loaded successfully, pixelizing...');
      // Draw image at medium size (preserves contours)
      ctx.imageSmoothingEnabled = false; // Critical for pixel art
      ctx.drawImage(img, 0, 0, pixelGrid, pixelGrid);

      // Light color reduction (keeps contours visible)
      const imageData = ctx.getImageData(0, 0, pixelGrid, pixelGrid);
      const data = imageData.data;

      // Reduce to 64 color steps (256 / 4 = 64 shades per channel)
      // Less reduction = more details visible
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(data[i] / 4) * 4;       // Red
        data[i + 1] = Math.floor(data[i + 1] / 4) * 4; // Green
        data[i + 2] = Math.floor(data[i + 2] / 4) * 4; // Blue
      }

      ctx.putImageData(imageData, 0, 0);
      console.log('[PixelArt] Pixelization complete (64x64 grid, contours visible)');
    };

    img.onerror = (e) => {
      console.error('[PixelArt] Image failed to load:', e);
      console.error('[PixelArt] Looking for: /team-photo.jpg');
      // Fallback: Draw gradient if image not available
      const gradient = ctx.createRadialGradient(
        pixelGrid / 2, pixelGrid / 2, 0,
        pixelGrid / 2, pixelGrid / 2, pixelGrid / 2
      );
      gradient.addColorStop(0, '#2a2a2a');
      gradient.addColorStop(0.5, '#1a1a1a');
      gradient.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, pixelGrid, pixelGrid);
    };

    // Load team photo - try both production and dev paths
    const imagePath = process.env.NODE_ENV === 'production' 
      ? '/team-photo.jpg'
      : '/team-photo.jpg';
    
    console.log('[PixelArt] Attempting to load:', imagePath);
    img.src = imagePath;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Canvas renders at small size, CSS scales it up with pixelated rendering */}
      {/* Positioned LEFT and BOTTOM like Zuckerberg's icon */}
      <canvas
        ref={canvasRef}
        className="absolute bottom-0 left-0 opacity-[0.25]"
        style={{
          width: '40%', // Left 40% of section
          height: '60%', // Bottom 60% height
          objectFit: 'cover',
          objectPosition: 'left center', // Focus on faces (left side of photo)
          imageRendering: 'pixelated', // Critical: prevents blurring on upscale
          filter: 'brightness(0.7) contrast(1.2)', // Brighter, visible contours
        }}
      />
      
      {/* Gradient fade (left to right) for text readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0a0a0c]/40 to-[#0a0a0c]/80"
      />
    </div>
  );
}

