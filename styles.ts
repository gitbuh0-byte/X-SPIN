import React from 'react';

// CSS-in-JS utility styles object
export const styles = {
  // Layout
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,
  
  flexColCenter: {
    display: 'flex',
    flexDirection: 'column', 
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,

  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } as React.CSSProperties,

  screenFull: {
    width: '100%',
    height: '100vh',
    position: 'relative'
  } as React.CSSProperties,

  // Forms
  input: {
    width: '100%',
    backgroundColor: '#000000',
    border: '2px solid rgba(0, 255, 255, 0.2)',
    padding: '0.5rem',
    color: '#ffffff',
    fontFamily: 'Courier New, monospace',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    outline: 'none',
    transition: 'all 0.3s ease',
    textTransform: 'lowercase'
  } as React.CSSProperties,

  // Text
  neonCyanGlow: {
    color: '#00ffff',
    textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
  } as React.CSSProperties,

  neonPinkGlow: {
    color: '#ff00ff',
    textShadow: '0 0 10px rgba(255, 0, 255, 0.5)'
  } as React.CSSProperties,

  neonGoldGlow: {
    color: '#ffd700',
    textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
  } as React.CSSProperties,

  // Borders & Shadows
  glowShadow: (color: string = 'rgba(0, 255, 255, 0.2)') => ({
    boxShadow: `0 0 30px ${color}`
  } as React.CSSProperties),

  // Containers
  panel: {
    backgroundColor: '#151520',
    border: '1px solid rgba(191, 0, 255, 0.5)',
    borderRadius: '0.375rem',
    padding: '1.5rem'
  } as React.CSSProperties
};
