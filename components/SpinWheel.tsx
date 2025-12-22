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
    // TRIPLE-BARRIER SPIN PREVENTION
    // 1. spinning prop must be true
    // 2. animation must not be running
    // 3. spinInProgressRef.current must be false
    // 4. segments must exist
    if (spinning && !isAnimating && !spinInProgressRef.current && segments.length > 0) {
      // LOCK IMMEDIATELY
      spinInProgressRef.current = true;
      
      // Calculate the rotation needed to align targetIndex segment with the top pointer
      // The pointer is at the top (0 degrees), and each segment takes up sliceAngle degrees
      // We need to rotate the wheel so that the TARGET SEGMENT's CENTER aligns with the pointer
      
      // Each segment's center is at (startAngle + sliceAngle/2)
      // We want: wheel rotation = -(targetIndex * sliceAngle + sliceAngle/2) to align segment center with pointer
      const targetBaseRotation = -(targetIndex * sliceAngle + (sliceAngle / 2));
      
      // Add 10 full rotations to make the spin visible
      const extraFullSpins = 360 * 10; 
      
      // Calculate the final rotation, accounting for current position
      const currentMod = ((currentRotation % 360) + 360) % 360;
      let diff = targetBaseRotation - currentMod;
      
      // Normalize the difference to be positive
      if (diff < 0) diff += 360;
      
      // Total rotation: current + extra spins + difference to reach target
      const finalRotation = currentRotation + extraFullSpins + diff;

      console.log('🎡 SPIN INITIATED - Lock acquired', { spinInProgressRef: spinInProgressRef.current });

      setIsAnimating(true);
      setCurrentRotation(finalRotation);
      soundManager.play('spin');

      const startTime = performance.now();
      const duration = 8000; // 8 seconds as per requirements
      let lastTickAngle = currentRotation;

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
          requestAnimationFrame(step);
        } else {
          console.log('🎡 SPIN ENDED - Lock releasing');
          setIsAnimating(false);
          soundManager.stop('spin');
          // DO NOT release the lock early
          spinInProgressRef.current = false;
          setTimeout(onSpinEnd, 500);
        }
      };
      requestAnimationFrame(step);
    }
  }, [spinning, targetIndex, segments, isAnimating, currentRotation, sliceAngle, onSpinEnd]);

  return (
    <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] flex items-center justify-center select-none overflow-visible">
      {/* Outer Glow Ring */}
      <div className="absolute inset-[-10px] rounded-full border-2 transition-all duration-1000 animate-pulse" 
           style={{ borderColor: themeHex, filter: `drop-shadow(0 0 30px ${themeHex}66)` }}></div>
      
      {/* Top Pointer */}
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-50">
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