import React from 'react';

// Color mapping
const colorMap: Record<string, string> = {
  // Neon colors
  'neon-cyan': '#00ffff',
  'neon-pink': '#ff00ff',
  'neon-gold': '#ffd700',
  'neon-green': '#00ff00',
  'neon-purple': '#bf00ff',
  // Standard colors
  'black': '#000000',
  'white': '#ffffff',
  'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
  'red': '#ff0000',
  'green': '#00ff00',
  'blue': '#0099ff',
  'yellow': '#ffff00',
  'gray': '#808080'
};

// Spacing multiplier (rem to px, assuming 16px = 1rem)
const spacingMap: Record<string, string> = {
  '0': '0',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '32': '8rem',
  '40': '10rem',
  '48': '12rem',
  '64': '16rem'
};

const textSizeMap: Record<string, string> = {
  'xs': '0.75rem',
  'sm': '0.875rem',
  'base': '1rem',
  'lg': '1.125rem',
  'xl': '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
  '8xl': '6rem',
  '9xl': '8rem'
};

interface StyleObject extends React.CSSProperties {
  [key: string]: any;
}

function getShadowStyle(shadowClass: string): string {
  const shadowMap: Record<string, string> = {
    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    'shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  };

  // Handle custom shadow patterns like "shadow-[0_0_10px_rgba(...)]"
  if (shadowClass.startsWith('shadow-[')) {
    const match = shadowClass.match(/shadow-\[(.*?)\]/);
    if (match) {
      return match[1].replace(/_/g, ' ');
    }
  }

  return shadowMap[shadowClass] || '';
}

export function tailwindToInline(classString: string): StyleObject {
  const classes = classString.trim().split(/\s+/);
  const styles: StyleObject = {};
  const responsiveClasses: Record<string, string[]> = {};

  for (const cls of classes) {
    // Handle responsive classes
    if (cls.includes(':')) {
      const [breakpoint, utility] = cls.split(':');
      if (!responsiveClasses[breakpoint]) {
        responsiveClasses[breakpoint] = [];
      }
      responsiveClasses[breakpoint].push(utility);
      continue;
    }

    // Display & Layout
    if (cls === 'flex') {
      styles.display = 'flex';
    } else if (cls === 'flex-col') {
      styles.flexDirection = 'column';
    } else if (cls === 'flex-row') {
      styles.flexDirection = 'row';
    } else if (cls === 'items-center') {
      styles.alignItems = 'center';
    } else if (cls === 'items-start') {
      styles.alignItems = 'flex-start';
    } else if (cls === 'items-end') {
      styles.alignItems = 'flex-end';
    } else if (cls === 'justify-center') {
      styles.justifyContent = 'center';
    } else if (cls === 'justify-between') {
      styles.justifyContent = 'space-between';
    } else if (cls === 'justify-end') {
      styles.justifyContent = 'flex-end';
    } else if (cls === 'justify-start') {
      styles.justifyContent = 'flex-start';
    } else if (cls === 'grid') {
      styles.display = 'grid';
    } else if (cls === 'block') {
      styles.display = 'block';
    } else if (cls === 'inline-block') {
      styles.display = 'inline-block';
    } else if (cls === 'inline-flex') {
      styles.display = 'inline-flex';
    } else if (cls === 'hidden') {
      styles.display = 'none';
    } else if (cls.startsWith('gap-')) {
      const value = spacingMap[cls.replace('gap-', '')];
      if (value) styles.gap = value;
    } else if (cls.startsWith('grid-cols-')) {
      const cols = cls.replace('grid-cols-', '');
      styles.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    }

    // Padding
    else if (cls.startsWith('p-')) {
      const value = spacingMap[cls.replace('p-', '')];
      if (value) styles.padding = value;
    } else if (cls.startsWith('px-')) {
      const value = spacingMap[cls.replace('px-', '')];
      if (value) {
        styles.paddingLeft = value;
        styles.paddingRight = value;
      }
    } else if (cls.startsWith('py-')) {
      const value = spacingMap[cls.replace('py-', '')];
      if (value) {
        styles.paddingTop = value;
        styles.paddingBottom = value;
      }
    } else if (cls.startsWith('pt-')) {
      const value = spacingMap[cls.replace('pt-', '')];
      if (value) styles.paddingTop = value;
    } else if (cls.startsWith('pb-')) {
      const value = spacingMap[cls.replace('pb-', '')];
      if (value) styles.paddingBottom = value;
    } else if (cls.startsWith('pl-')) {
      const value = spacingMap[cls.replace('pl-', '')];
      if (value) styles.paddingLeft = value;
    } else if (cls.startsWith('pr-')) {
      const value = spacingMap[cls.replace('pr-', '')];
      if (value) styles.paddingRight = value;
    }

    // Margin
    else if (cls.startsWith('m-')) {
      const value = spacingMap[cls.replace('m-', '')];
      if (value) styles.margin = value;
    } else if (cls === 'mx-auto') {
      styles.marginLeft = 'auto';
      styles.marginRight = 'auto';
    } else if (cls === 'my-auto') {
      styles.marginTop = 'auto';
      styles.marginBottom = 'auto';
    } else if (cls.startsWith('mx-')) {
      const value = spacingMap[cls.replace('mx-', '')];
      if (value) {
        styles.marginLeft = value;
        styles.marginRight = value;
      }
    } else if (cls.startsWith('my-')) {
      const value = spacingMap[cls.replace('my-', '')];
      if (value) {
        styles.marginTop = value;
        styles.marginBottom = value;
      }
    } else if (cls.startsWith('mt-')) {
      const value = spacingMap[cls.replace('mt-', '')];
      if (value) styles.marginTop = value;
    } else if (cls.startsWith('mb-')) {
      const value = spacingMap[cls.replace('mb-', '')];
      if (value) styles.marginBottom = value;
    } else if (cls.startsWith('ml-')) {
      const value = spacingMap[cls.replace('ml-', '')];
      if (value) styles.marginLeft = value;
    } else if (cls.startsWith('mr-')) {
      const value = spacingMap[cls.replace('mr-', '')];
      if (value) styles.marginRight = value;
    }

    // Width
    else if (cls === 'w-full') {
      styles.width = '100%';
    } else if (cls === 'w-screen') {
      styles.width = '100vw';
    } else if (cls.startsWith('w-')) {
      const value = spacingMap[cls.replace('w-', '')];
      if (value) styles.width = value;
    }

    // Height
    else if (cls === 'h-full') {
      styles.height = '100%';
    } else if (cls === 'h-screen') {
      styles.height = '100vh';
    } else if (cls.startsWith('h-')) {
      const value = spacingMap[cls.replace('h-', '')];
      if (value) styles.height = value;
    }

    // Min/Max dimensions
    else if (cls.startsWith('min-h-')) {
      const value = spacingMap[cls.replace('min-h-', '')] || cls.replace('min-h-', '');
      styles.minHeight = value;
    } else if (cls.startsWith('max-w-')) {
      const value = spacingMap[cls.replace('max-w-', '')] || cls.replace('max-w-', '');
      styles.maxWidth = value;
    }

    // Font size
    else if (cls.startsWith('text-')) {
      const sizeOrColor = cls.replace('text-', '');
      if (textSizeMap[sizeOrColor]) {
        styles.fontSize = textSizeMap[sizeOrColor];
      } else if (colorMap[sizeOrColor]) {
        styles.color = colorMap[sizeOrColor];
      }
    }

    // Background
    else if (cls.startsWith('bg-')) {
      const colorName = cls.replace('bg-', '');
      if (colorMap[colorName]) {
        styles.backgroundColor = colorMap[colorName];
      } else if (colorName.includes('[')) {
        // Handle custom colors like bg-[#ff0000]
        const match = colorName.match(/\[(.*?)\]/);
        if (match) {
          styles.backgroundColor = match[1];
        }
      }
    }

    // Border
    else if (cls === 'border') {
      styles.border = '1px solid';
    } else if (cls.startsWith('border-')) {
      const colorName = cls.replace('border-', '');
      if (colorMap[colorName]) {
        styles.borderColor = colorMap[colorName];
      }
    } else if (cls.startsWith('border-\[')) {
      styles.borderWidth = cls.match(/border-\[(.+?)\]/)?.[1] || '1px';
    }

    // Border radius
    else if (cls === 'rounded') {
      styles.borderRadius = '0.375rem';
    } else if (cls === 'rounded-full') {
      styles.borderRadius = '9999px';
    } else if (cls === 'rounded-lg') {
      styles.borderRadius = '0.5rem';
    } else if (cls === 'rounded-md') {
      styles.borderRadius = '0.375rem';
    } else if (cls === 'rounded-sm') {
      styles.borderRadius = '0.125rem';
    }

    // Positioning
    else if (cls === 'relative') {
      styles.position = 'relative';
    } else if (cls === 'absolute') {
      styles.position = 'absolute';
    } else if (cls === 'fixed') {
      styles.position = 'fixed';
    } else if (cls === 'sticky') {
      styles.position = 'sticky';
    } else if (cls === 'inset-0') {
      styles.top = '0';
      styles.right = '0';
      styles.bottom = '0';
      styles.left = '0';
    } else if (cls.startsWith('top-')) {
      const value = spacingMap[cls.replace('top-', '')] || cls.replace('top-', '');
      styles.top = value;
    } else if (cls.startsWith('right-')) {
      const value = spacingMap[cls.replace('right-', '')] || cls.replace('right-', '');
      styles.right = value;
    } else if (cls.startsWith('bottom-')) {
      const value = spacingMap[cls.replace('bottom-', '')] || cls.replace('bottom-', '');
      styles.bottom = value;
    } else if (cls.startsWith('left-')) {
      const value = spacingMap[cls.replace('left-', '')] || cls.replace('left-', '');
      styles.left = value;
    }

    // Z-index
    else if (cls.startsWith('z-')) {
      const zValue = cls.replace('z-', '').replace(/\[/g, '').replace(/\]/g, '');
      styles.zIndex = parseInt(zValue) || zValue;
    }

    // Opacity
    else if (cls.startsWith('opacity-')) {
      const opacityValue = cls.replace('opacity-', '');
      styles.opacity = (parseInt(opacityValue) / 100).toString();
    }

    // Font weight
    else if (cls === 'font-bold') {
      styles.fontWeight = 'bold';
    } else if (cls === 'font-black') {
      styles.fontWeight = '900';
    } else if (cls.startsWith('font-')) {
      const fontName = cls.replace('font-', '');
      if (fontName === 'mono') {
        styles.fontFamily = "'Courier New', monospace";
      } else if (fontName === 'arcade') {
        styles.fontFamily = "'Orbitron', monospace";
      } else if (fontName === 'ui') {
        styles.fontFamily = "'Rajdhani', sans-serif";
      }
    }

    // Text transform
    else if (cls === 'uppercase') {
      styles.textTransform = 'uppercase';
    } else if (cls === 'lowercase') {
      styles.textTransform = 'lowercase';
    } else if (cls === 'capitalize') {
      styles.textTransform = 'capitalize';
    }

    // Letter spacing
    else if (cls === 'tracking-wider') {
      styles.letterSpacing = '0.05em';
    } else if (cls === 'tracking-widest') {
      styles.letterSpacing = '0.1em';
    } else if (cls.startsWith('tracking-')) {
      styles.letterSpacing = cls.replace('tracking-', '');
    }

    // Shadows
    else if (cls.startsWith('shadow')) {
      const shadowValue = getShadowStyle(cls);
      if (shadowValue) styles.boxShadow = shadowValue;
    } else if (cls.startsWith('drop-shadow')) {
      const match = cls.match(/drop-shadow-\[(.*?)\]/);
      if (match) {
        styles.filter = `drop-shadow(${match[1].replace(/_/g, ' ')})`;
      }
    }

    // Overflow
    else if (cls === 'overflow-hidden') {
      styles.overflow = 'hidden';
    } else if (cls === 'overflow-auto') {
      styles.overflow = 'auto';
    } else if (cls === 'overflow-y-auto') {
      styles.overflowY = 'auto';
    } else if (cls === 'overflow-x-hidden') {
      styles.overflowX = 'hidden';
    }

    // Cursor
    else if (cls === 'cursor-pointer') {
      styles.cursor = 'pointer';
    }

    // Pointer events
    else if (cls === 'pointer-events-none') {
      styles.pointerEvents = 'none';
    } else if (cls === 'pointer-events-auto') {
      styles.pointerEvents = 'auto';
    }

    // Flex grow/shrink
    else if (cls === 'flex-1') {
      styles.flex = '1';
    } else if (cls === 'flex-grow') {
      styles.flexGrow = '1';
    } else if (cls === 'flex-shrink-0') {
      styles.flexShrink = '0';
    }

    // Transforms
    else if (cls.startsWith('translate-')) {
      // Handle translate-x, translate-y, etc
      const match = cls.match(/translate-([xy]?)-(.+)/);
      if (match) {
        const [, axis, value] = match;
        const pixelValue = spacingMap[value] || value;
        if (axis === 'x') {
          styles.transform = `translateX(${pixelValue})`;
        } else if (axis === 'y') {
          styles.transform = `translateY(${pixelValue})`;
        }
      }
    }

    // Scale
    else if (cls.startsWith('scale-')) {
      const scaleValue = cls.replace('scale-', '');
      styles.transform = `scale(${parseInt(scaleValue) / 100})`;
    }

    // Transitions
    else if (cls === 'transition-all') {
      styles.transition = 'all 0.3s ease';
    } else if (cls === 'transition-colors') {
      styles.transition = 'color, background-color 0.2s ease';
    } else if (cls === 'transition-opacity') {
      styles.transition = 'opacity 0.3s ease';
    } else if (cls === 'transition-transform') {
      styles.transition = 'transform 0.3s ease';
    } else if (cls.startsWith('duration-')) {
      const duration = cls.replace('duration-', '');
      styles.transitionDuration = `${duration}ms`;
    }

    // Backdrop
    else if (cls === 'backdrop-blur') {
      styles.backdropFilter = 'blur(10px)';
    } else if (cls === 'backdrop-blur-md') {
      styles.backdropFilter = 'blur(12px)';
    } else if (cls === 'backdrop-blur-xl') {
      styles.backdropFilter = 'blur(24px)';
    }
  }

  // Store responsive classes info
  if (Object.keys(responsiveClasses).length > 0) {
    styles.__responsive = responsiveClasses;
  }

  return styles;
}

export function tailwindBatch(classMap: Record<string, string>): Record<string, StyleObject> {
  const result: Record<string, StyleObject> = {};
  for (const [key, classes] of Object.entries(classMap)) {
    result[key] = tailwindToInline(classes);
  }
  return result;
}
