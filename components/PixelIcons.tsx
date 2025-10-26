'use client';

interface PixelIconProps {
  type: 'football' | 'soccer' | 'music' | 'car' | 'game';
  half: 'left' | 'right' | 'complete';
  color: string;
}

export function PixelIcon({ type, half, color }: PixelIconProps) {
  const size = 64; // Optimized for pixel grid
  
  // Professional pixel art - clean clusters, limited palette, clear shapes
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
      
      {/* 🏈 FOOTBALL - Classic American football */}
      {type === 'football' && half === 'left' && (
        <g>
          {/* Brown leather ball */}
          <rect x="3" y="4" width="1" height="8" fill="#8B4513"/>
          <rect x="4" y="3" width="1" height="10" fill="#8B4513"/>
          <rect x="5" y="3" width="1" height="10" fill="#A0522D"/>
          <rect x="6" y="4" width="1" height="8" fill="#A0522D"/>
          {/* White laces */}
          <rect x="5" y="6" width="1" height="1" fill="white"/>
          <rect x="5" y="8" width="1" height="1" fill="white"/>
          <rect x="5" y="10" width="1" height="1" fill="white"/>
        </g>
      )}
      {type === 'football' && half === 'right' && (
        <g>
          <rect x="9" y="4" width="1" height="8" fill="#A0522D"/>
          <rect x="10" y="3" width="1" height="10" fill="#A0522D"/>
          <rect x="11" y="3" width="1" height="10" fill="#8B4513"/>
          <rect x="12" y="4" width="1" height="8" fill="#8B4513"/>
          <rect x="10" y="6" width="1" height="1" fill="white"/>
          <rect x="10" y="8" width="1" height="1" fill="white"/>
          <rect x="10" y="10" width="1" height="1" fill="white"/>
        </g>
      )}
      {type === 'football' && half === 'complete' && (
        <g>
          {/* Full football */}
          <rect x="5" y="3" width="6" height="10" fill={color}/>
          <rect x="4" y="4" width="1" height="8" fill={color}/>
          <rect x="11" y="4" width="1" height="8" fill={color}/>
          {/* Center line and laces */}
          <line x1="8" y1="4" x2="8" y2="12" stroke="white" strokeWidth="0.5"/>
          <rect x="7" y="6" width="2" height="1" fill="white"/>
          <rect x="7" y="8" width="2" height="1" fill="white"/>
          <rect x="7" y="10" width="2" height="1" fill="white"/>
        </g>
      )}
      
      {/* ⚽ SOCCER - Classic black & white pattern */}
      {type === 'soccer' && half === 'left' && (
        <g>
          {/* White ball base */}
          <rect x="3" y="6" width="1" height="4" fill="white"/>
          <rect x="4" y="5" width="1" height="6" fill="white"/>
          <rect x="5" y="5" width="1" height="6" fill="white"/>
          <rect x="6" y="6" width="1" height="4" fill="white"/>
          {/* Black pentagon */}
          <rect x="4" y="7" width="2" height="2" fill="black"/>
          <rect x="5" y="6" width="1" height="1" fill="black"/>
        </g>
      )}
      {type === 'soccer' && half === 'right' && (
        <g>
          <rect x="9" y="6" width="1" height="4" fill="white"/>
          <rect x="10" y="5" width="1" height="6" fill="white"/>
          <rect x="11" y="5" width="1" height="6" fill="white"/>
          <rect x="12" y="6" width="1" height="4" fill="white"/>
          <rect x="10" y="7" width="2" height="2" fill="black"/>
          <rect x="10" y="6" width="1" height="1" fill="black"/>
        </g>
      )}
      {type === 'soccer' && half === 'complete' && (
        <g>
          {/* Circular ball */}
          <rect x="5" y="3" width="6" height="1" fill="white"/>
          <rect x="4" y="4" width="8" height="1" fill="white"/>
          <rect x="3" y="5" width="10" height="6" fill="white"/>
          <rect x="4" y="11" width="8" height="1" fill="white"/>
          <rect x="5" y="12" width="6" height="1" fill="white"/>
          {/* Black pentagon pattern */}
          <polygon points="8,5 6,7 7,10 9,10 10,7" fill="black"/>
          <circle cx="8" cy="8" r="1.5" fill={color}/>
        </g>
      )}
      
      {/* 🎵 MUSIC - Eighth note */}
      {type === 'music' && half === 'left' && (
        <g>
          {/* Note stem */}
          <rect x="5" y="3" width="1" height="8" fill="#1E90FF"/>
          {/* Note head */}
          <rect x="4" y="10" width="2" height="2" fill="#1E90FF"/>
          <rect x="3" y="11" width="1" height="1" fill="#1E90FF"/>
          {/* Flag */}
          <rect x="6" y="3" width="1" height="3" fill="#1E90FF"/>
        </g>
      )}
      {type === 'music' && half === 'right' && (
        <g>
          <rect x="10" y="3" width="1" height="8" fill="#1E90FF"/>
          <rect x="10" y="10" width="2" height="2" fill="#1E90FF"/>
          <rect x="12" y="11" width="1" height="1" fill="#1E90FF"/>
          <rect x="9" y="3" width="1" height="3" fill="#1E90FF"/>
        </g>
      )}
      {type === 'music' && half === 'complete' && (
        <g>
          {/* Double note */}
          <rect x="6" y="3" width="1" height="8" fill={color}/>
          <rect x="9" y="3" width="1" height="8" fill={color}/>
          {/* Connecting beam */}
          <rect x="6" y="3" width="4" height="2" fill={color}/>
          {/* Note heads */}
          <ellipse cx="6" cy="11" rx="2" ry="1.5" fill={color}/>
          <ellipse cx="9" cy="11" rx="2" ry="1.5" fill={color}/>
        </g>
      )}
      
      {/* 🚗 CAR - Retro side view */}
      {type === 'car' && half === 'left' && (
        <g>
          {/* Car body - red */}
          <rect x="2" y="7" width="5" height="2" fill="#FF6347"/>
          <rect x="3" y="6" width="3" height="1" fill="#FF6347"/>
          {/* Window - cyan */}
          <rect x="4" y="7" width="1" height="1" fill="#87CEEB"/>
          {/* Wheel - black with gray */}
          <rect x="3" y="9" width="2" height="2" fill="#333"/>
          <rect x="4" y="10" width="1" height="1" fill="#999"/>
        </g>
      )}
      {type === 'car' && half === 'right' && (
        <g>
          <rect x="9" y="7" width="5" height="2" fill="#FF6347"/>
          <rect x="10" y="6" width="3" height="1" fill="#FF6347"/>
          <rect x="11" y="7" width="1" height="1" fill="#87CEEB"/>
          <rect x="11" y="9" width="2" height="2" fill="#333"/>
          <rect x="11" y="10" width="1" height="1" fill="#999"/>
        </g>
      )}
      {type === 'car' && half === 'complete' && (
        <g>
          {/* Full car */}
          <rect x="3" y="7" width="10" height="2" fill={color}/>
          <rect x="5" y="6" width="6" height="1" fill={color}/>
          {/* Windows */}
          <rect x="6" y="7" width="1" height="1" fill="#87CEEB"/>
          <rect x="9" y="7" width="1" height="1" fill="#87CEEB"/>
          {/* Wheels */}
          <rect x="5" y="9" width="2" height="2" fill="#333"/>
          <rect x="9" y="9" width="2" height="2" fill="#333"/>
          <rect x="6" y="10" width="1" height="1" fill="#999"/>
          <rect x="9" y="10" width="1" height="1" fill="#999"/>
        </g>
      )}
      
      {/* 🎮 GAME - Retro game controller */}
      {type === 'game' && half === 'left' && (
        <g>
          {/* Controller body - gray */}
          <rect x="2" y="7" width="5" height="3" fill="#7F8C8D"/>
          <rect x="3" y="6" width="3" height="1" fill="#7F8C8D"/>
          <rect x="1" y="8" width="1" height="1" fill="#7F8C8D"/>
          {/* D-pad - black cross */}
          <rect x="4" y="8" width="1" height="1" fill="black"/>
          <rect x="3" y="8" width="1" height="1" fill="black"/>
          <rect x="5" y="8" width="1" height="1" fill="black"/>
          <rect x="4" y="7" width="1" height="1" fill="black"/>
          <rect x="4" y="9" width="1" height="1" fill="black"/>
        </g>
      )}
      {type === 'game' && half === 'right' && (
        <g>
          <rect x="9" y="7" width="5" height="3" fill="#7F8C8D"/>
          <rect x="10" y="6" width="3" height="1" fill="#7F8C8D"/>
          <rect x="14" y="8" width="1" height="1" fill="#7F8C8D"/>
          {/* Colored buttons */}
          <rect x="11" y="7" width="1" height="1" fill="#E74C3C"/>
          <rect x="12" y="8" width="1" height="1" fill="#3498DB"/>
          <rect x="11" y="9" width="1" height="1" fill="#F1C40F"/>
          <rect x="10" y="8" width="1" height="1" fill="#2ECC71"/>
        </g>
      )}
      {type === 'game' && half === 'complete' && (
        <g>
          {/* Full controller */}
          <rect x="3" y="7" width="10" height="3" fill={color}/>
          <rect x="4" y="6" width="8" height="1" fill={color}/>
          <rect x="2" y="8" width="1" height="1" fill={color}/>
          <rect x="13" y="8" width="1" height="1" fill={color}/>
          {/* D-pad (left) */}
          <rect x="5" y="8" width="1" height="1" fill="black"/>
          <rect x="6" y="7" width="1" height="1" fill="black"/>
          <rect x="6" y="9" width="1" height="1" fill="black"/>
          <rect x="7" y="8" width="1" height="1" fill="black"/>
          <rect x="6" y="8" width="1" height="1" fill="white"/>
          {/* ABXY buttons (right) */}
          <rect x="10" y="7" width="1" height="1" fill="#E74C3C"/>
          <rect x="11" y="8" width="1" height="1" fill="#3498DB"/>
          <rect x="10" y="9" width="1" height="1" fill="#F1C40F"/>
          <rect x="9" y="8" width="1" height="1" fill="#2ECC71"/>
        </g>
      )}
    </svg>
  );
}

