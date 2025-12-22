import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { soundManager } from '../services/soundManager.ts';
import { COLOR_HEX } from '../constants.ts';

interface SpinWheelProps {
  spinning: boolean;
  targetIndex: number; 
  onSpinEnd: () => void;
  segments: { label: string; color: string; value: number }[];
  themeColor?: string;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ spinning, targetIndex, onSpinEnd, segments, themeColor = 'neon-gold' }) => {
  const wheelGroupRef = useRef<SVGGElement>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const spinInProgressRef = useRef(false);
  
  const sliceAngle = useMemo(() => 360 / (segments.length || 1), [segments.length]);

  const colorMap: Record<string, string> = {
    'neon-cyan': '#00ffff',
    'neon-green': '#00ff00',
    'neon-pink': '#ff00ff',
    'neon-purple': '#bf00ff',
    'neon-gold': '#ffd700'
  };
  const themeHex = colorMap[themeColor] || '#ffd700';

  useEffect(() => {
    if (!wheelGroupRef.current || !segments.length) return;
    
    const radius = 220;
    const g = d3.select(wheelGroupRef.current);
    g.selectAll("*").remove();

    const pie = d3.pie<any>().value(1).sort(null);
    const arc = d3.arc<any>().innerRadius(45).outerRadius(radius);
    const arcs = g.selectAll("g").data(pie(segments)).enter().append("g");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d) => {
        const hexColor = COLOR_HEX[d.data.color as keyof typeof COLOR_HEX];
        return hexColor ? hexColor + '88' : '#ffffff88'; // Use color with 50% opacity
      })
      .attr("stroke", themeHex)
      .attr("stroke-width", "2")
      .attr("stroke-opacity", "0.6");

    arcs.append("text")
      .attr("transform", d => {
        const [x, y] = arc.centroid(d);
        const angle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
        return `translate(${x * 1.55}, ${y * 1.55}) rotate(${angle - 90})`;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .attr("font-weight", "900")
      .attr("font-family", "Orbitron")
      .text(d => d.data.label);
  }, [segments, themeHex]);

  useEffect(() => {
    // BULLETPROOF: NO DOUBLE SPIN EVER
    // Only reacts to 'spinning' prop changes, ignores all other changes
    
    if (!spinning || spinInProgressRef.current) {
      // Already spinning or not requested to spin
      return;
    }

    // IMMEDIATE LOCK - prevents any re-entry
    spinInProgressRef.current = true;
    console.log('🎡 SPIN LOCKED');
    
    const targetBaseRotation = -(targetIndex * sliceAngle + (sliceAngle / 2));
    const extraFullSpins = 360 * 10;
    const currentMod = ((currentRotation % 360) + 360) % 360;
    let diff = targetBaseRotation - currentMod;
    if (diff < 0) diff += 360;
    const finalRotation = currentRotation + extraFullSpins + diff;

    const startTime = performance.now();
    const duration = 8000;
    let lastTickAngle = currentRotation;
    let animationFrameId: number | null = null;
    let hasEnded = false;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      const frameRot = currentRotation + (finalRotation - currentRotation) * easedProgress;
      
      if (Math.abs(frameRot - lastTickAngle) >= sliceAngle) {
        soundManager.play('tick');
        lastTickAngle = frameRot;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else if (!hasEnded) {
        // Animation complete - call onSpinEnd ONCE
        hasEnded = true;
        console.log('🎡 SPIN ANIMATION COMPLETE');
        soundManager.stop('spin');
        spinInProgressRef.current = false; // RESET FOR NEXT SPIN
        setTimeout(() => {
          console.log('🎡 Calling onSpinEnd');
          onSpinEnd();
        }, 500);
      }
    };

    setIsAnimating(true);
    setCurrentRotation(finalRotation);
    soundManager.play('spin');
    animationFrameId = requestAnimationFrame(step);

    // Only cleanup if component unmounts - don't reset lock on re-runs
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [spinning]); // ONLY react to spinning prop changes

  return (
    <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] flex items-center justify-center select-none overflow-visible">
      {/* Outer Glow Ring */}
      <div className="absolute inset-[-10px] rounded-full border-2 transition-all duration-1000 animate-pulse" 
           style={{ borderColor: themeHex, filter: `drop-shadow(0 0 30px ${themeHex}66)` }}></div>
      
      {/* Top Pointer */}
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 md:z-50 z-10">
        <svg width="40" height="60" viewBox="0 0 40 60">
          <path d="M20 60 L0 0 L40 0 Z" fill={themeHex} filter="drop-shadow(0 0 10px rgba(0,0,0,0.8))" />
        </svg>
      </div>
      
      <svg 
        viewBox="-250 -250 500 500" 
        className="w-full h-full overflow-visible z-20 block"
        style={{ width: '100%', height: '100%' }}
      >
        <g 
          ref={wheelGroupRef} 
          style={{ 
            transition: isAnimating ? 'transform 6s cubic-bezier(0.1, 0, 0, 1)' : 'none',
            transform: `rotate(${currentRotation}deg)`,
            transformOrigin: '0px 0px'
          }}
        />
        {/* Core center piece */}
        <circle r="45" fill="#000" stroke={themeHex} strokeWidth="3" />
        <text 
          textAnchor="middle" 
          dy=".35em" 
          fill="white" 
          className="font-arcade text-[10px] tracking-[0.2em] uppercase animate-pulse"
        >
          CORE
        </text>
      </svg>
    </div>
  );
};

export default SpinWheel;