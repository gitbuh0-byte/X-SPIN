import React from 'react';

/**
 * Converts Tailwind CSS utility classes to React inline styles
 * Supports: flexbox, spacing, colors, sizing, borders, shadows, transforms, transitions
 * Responsive classes (sm:, md:, lg:) return desktop-first styles (media queries applied separately)
 */

type CSSProperties = React.CSSProperties;

interface ResponsiveBreakpoints {
  sm?: React.CSSProperties;
  md?: React.CSSProperties;
  lg?: React.CSSProperties;
  xl?: React.CSSProperties;
}

/**
 * Parse spacing values (p, m, gap, etc)
 */
const spacingMap: Record<string, string> = {
  '0': '0',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
};

/**
 * Parse size values (w, h, text-size, etc)
 */
const sizeMap: Record<string, string> = {
  ...spacingMap,
  'full': '100%',
  'screen': '100vw',
  'min': 'min-content',
  'max': 'max-content',
  'fit': 'fit-content',
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '5/6': '83.333333%',
};

/**
 * Font size mapping
 */
const fontSizeMap: Record<string, [string, string]> = {
  'xs': ['0.75rem', '1rem'],
  'sm': ['0.875rem', '1.25rem'],
  'base': ['1rem', '1.5rem'],
  'lg': ['1.125rem', '1.75rem'],
  'xl': ['1.25rem', '1.75rem'],
  '2xl': ['1.5rem', '2rem'],
  '3xl': ['1.875rem', '2.25rem'],
  '4xl': ['2.25rem', '2.5rem'],
  '5xl': ['3rem', '1'],
  '6xl': ['3.75rem', '1'],
  '7xl': ['4.5rem', '1'],
  '8xl': ['6rem', '1'],
  '9xl': ['8rem', '1'],
};

/**
 * Color mapping with hex values
 */
const colorMap: Record<string, string> = {
  // Neon colors (custom)
  'neon-cyan': '#00ffff',
  'neon-green': '#00ff00',
  'neon-pink': '#ff00ff',
  'neon-purple': '#bf00ff',
  'neon-gold': '#ffd700',
  
  // Standard colors
  'white': '#ffffff',
  'black': '#000000',
  'transparent': 'transparent',
  'current': 'currentColor',
  
  // Slate
  'slate-50': '#f8fafc',
  'slate-100': '#f1f5f9',
  'slate-200': '#e2e8f0',
  'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
  
  // Red
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  
  // Green
  'green-500': '#22c55e',
  'green-700': '#15803d',
  
  // Yellow
  'yellow-300': '#fcd34d',
  'yellow-700': '#b45309',
  
  // Blue
  'blue-500': '#3b82f6',
};

/**
 * Border radius mapping
 */
const radiusMap: Record<string, string> = {
  'none': '0',
  'sm': '0.125rem',
  'base': '0.25rem',
  'md': '0.375rem',
  'lg': '0.5rem',
  'xl': '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  'full': '9999px',
};

/**
 * Font weight mapping
 */
const fontWeightMap: Record<string, number> = {
  'thin': 100,
  'extralight': 200,
  'light': 300,
  'normal': 400,
  'medium': 500,
  'semibold': 600,
  'bold': 700,
  'extrabold': 800,
  'black': 900,
};

/**
 * Parse color with opacity (e.g., "black/50" -> "rgba(0, 0, 0, 0.5)")
 */
function parseColorWithOpacity(color: string): string {
  const [colorName, opacityStr] = color.split('/');
  const baseColor = colorMap[colorName] || colorName;
  
  if (!opacityStr) return baseColor;
  
  const opacity = parseInt(opacityStr) / 100;
  
  // Convert hex to rgb
  if (baseColor.startsWith('#')) {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return baseColor;
}

/**
 * Main function to convert Tailwind classes to inline styles
 */
export function tailwindToInline(classNames: string): CSSProperties {
  if (!classNames) return {};
  
  const classes = classNames.split(/\s+/).filter(Boolean);
  const styles: CSSProperties = {};
  const responsiveStyles: ResponsiveBreakpoints = {};
  let currentBreakpoint: keyof ResponsiveBreakpoints = 'sm';

  for (const cls of classes) {
    // Handle responsive prefixes
    if (cls.startsWith('sm:')) {
      currentBreakpoint = 'sm';
      const utilityClass = cls.replace('sm:', '');
      if (!responsiveStyles.sm) responsiveStyles.sm = {};
      applyUtilityClass(utilityClass, responsiveStyles.sm);
      continue;
    }
    if (cls.startsWith('md:')) {
      currentBreakpoint = 'md';
      const utilityClass = cls.replace('md:', '');
      if (!responsiveStyles.md) responsiveStyles.md = {};
      applyUtilityClass(utilityClass, responsiveStyles.md);
      continue;
    }
    if (cls.startsWith('lg:')) {
      currentBreakpoint = 'lg';
      const utilityClass = cls.replace('lg:', '');
      if (!responsiveStyles.lg) responsiveStyles.lg = {};
      applyUtilityClass(utilityClass, responsiveStyles.lg);
      continue;
    }
    if (cls.startsWith('xl:')) {
      currentBreakpoint = 'xl';
      const utilityClass = cls.replace('xl:', '');
      if (!responsiveStyles.xl) responsiveStyles.xl = {};
      applyUtilityClass(utilityClass, responsiveStyles.xl);
      continue;
    }

    // Apply utility class to base styles
    applyUtilityClass(cls, styles);
  }

  // Attach responsive styles metadata (for documentation)
  if (Object.keys(responsiveStyles).length > 0) {
    (styles as any).__responsive = responsiveStyles;
  }

  return styles;
}

/**
 * Apply a single utility class to styles object
 */
function applyUtilityClass(cls: string, styles: CSSProperties): void {
  // Flexbox
  if (cls === 'flex') styles.display = 'flex';
  if (cls === 'flex-col') { styles.display = 'flex'; styles.flexDirection = 'column'; }
  if (cls === 'flex-row') { styles.display = 'flex'; styles.flexDirection = 'row'; }
  if (cls === 'flex-wrap') { styles.display = 'flex'; styles.flexWrap = 'wrap'; }
  if (cls === 'flex-nowrap') { styles.display = 'flex'; styles.flexWrap = 'nowrap'; }
  if (cls === 'flex-1') { styles.flex = '1 1 0%'; }
  if (cls.startsWith('flex-')) {
    const value = cls.replace('flex-', '');
    if (fontWeightMap[value] !== undefined) styles.flex = value;
  }
  
  // Justify content
  if (cls === 'justify-start') styles.justifyContent = 'flex-start';
  if (cls === 'justify-end') styles.justifyContent = 'flex-end';
  if (cls === 'justify-center') styles.justifyContent = 'center';
  if (cls === 'justify-between') styles.justifyContent = 'space-between';
  if (cls === 'justify-around') styles.justifyContent = 'space-around';
  if (cls === 'justify-evenly') styles.justifyContent = 'space-evenly';

  // Align items
  if (cls === 'items-start') styles.alignItems = 'flex-start';
  if (cls === 'items-end') styles.alignItems = 'flex-end';
  if (cls === 'items-center') styles.alignItems = 'center';
  if (cls === 'items-baseline') styles.alignItems = 'baseline';
  if (cls === 'items-stretch') styles.alignItems = 'stretch';

  // Align content
  if (cls === 'content-start') styles.alignContent = 'flex-start';
  if (cls === 'content-end') styles.alignContent = 'flex-end';
  if (cls === 'content-center') styles.alignContent = 'center';
  if (cls === 'content-between') styles.alignContent = 'space-between';
  if (cls === 'content-around') styles.alignContent = 'space-around';

  // Gap
  if (cls.startsWith('gap-')) {
    const value = cls.replace('gap-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.gap = spacing;
  }

  // Padding
  if (cls.startsWith('p-')) {
    const value = cls.replace('p-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.padding = spacing;
  }
  if (cls.startsWith('px-')) {
    const value = cls.replace('px-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.paddingLeft = styles.paddingRight = spacing;
  }
  if (cls.startsWith('py-')) {
    const value = cls.replace('py-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.paddingTop = styles.paddingBottom = spacing;
  }
  if (cls.startsWith('pt-')) {
    const value = cls.replace('pt-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.paddingTop = spacing;
  }
  if (cls.startsWith('pb-')) {
    const value = cls.replace('pb-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.paddingBottom = spacing;
  }
  if (cls.startsWith('pl-')) {
    const value = cls.replace('pl-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.paddingLeft = spacing;
  }
  if (cls.startsWith('pr-')) {
    const value = cls.replace('pr-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.paddingRight = spacing;
  }

  // Margin
  if (cls.startsWith('m-')) {
    const value = cls.replace('m-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.margin = spacing;
  }
  if (cls.startsWith('mx-')) {
    const value = cls.replace('mx-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.marginLeft = styles.marginRight = spacing;
  }
  if (cls.startsWith('my-')) {
    const value = cls.replace('my-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.marginTop = styles.marginBottom = spacing;
  }
  if (cls.startsWith('mt-')) {
    const value = cls.replace('mt-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.marginTop = spacing;
  }
  if (cls.startsWith('mb-')) {
    const value = cls.replace('mb-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.marginBottom = spacing;
  }
  if (cls.startsWith('ml-')) {
    const value = cls.replace('ml-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.marginLeft = spacing;
  }
  if (cls.startsWith('mr-')) {
    const value = cls.replace('mr-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.marginRight = spacing;
  }

  // Width
  if (cls.startsWith('w-')) {
    const value = cls.replace('w-', '');
    const size = sizeMap[value];
    if (size) styles.width = size;
  }

  // Height
  if (cls.startsWith('h-')) {
    const value = cls.replace('h-', '');
    const size = sizeMap[value];
    if (size) styles.height = size;
  }

  // Min/Max width/height
  if (cls.startsWith('min-w-')) {
    const value = cls.replace('min-w-', '');
    const size = sizeMap[value];
    if (size) styles.minWidth = size;
  }
  if (cls.startsWith('max-w-')) {
    const value = cls.replace('max-w-', '');
    const size = sizeMap[value];
    if (size) styles.maxWidth = size;
  }
  if (cls.startsWith('min-h-')) {
    const value = cls.replace('min-h-', '');
    const size = sizeMap[value];
    if (size) styles.minHeight = size;
  }
  if (cls.startsWith('max-h-')) {
    const value = cls.replace('max-h-', '');
    const size = sizeMap[value];
    if (size) styles.maxHeight = size;
  }

  // Text size
  if (cls.startsWith('text-')) {
    const value = cls.replace('text-', '');
    const fontSize = fontSizeMap[value];
    if (fontSize) {
      styles.fontSize = fontSize[0];
      styles.lineHeight = fontSize[1];
    } else {
      // Try as color
      const color = parseColorWithOpacity(value);
      if (color) styles.color = color;
    }
  }

  // Colors
  if (cls.startsWith('bg-')) {
    const value = cls.replace('bg-', '');
    const color = parseColorWithOpacity(value);
    if (color) styles.backgroundColor = color;
  }

  if (cls.startsWith('text-')) {
    const value = cls.replace('text-', '');
    const color = parseColorWithOpacity(value);
    // Only apply if it looks like a color, not a size
    if (color && !fontSizeMap[value]) styles.color = color;
  }

  if (cls.startsWith('border-')) {
    const value = cls.replace('border-', '');
    if (value.startsWith('w-')) {
      const width = value.replace('w-', '');
      if (spacingMap[width]) styles.borderWidth = spacingMap[width];
    } else {
      const color = parseColorWithOpacity(value);
      if (color && !spacingMap[value]) styles.borderColor = color;
    }
  }

  // Border styles
  if (cls.startsWith('border')) {
    if (cls === 'border') styles.borderWidth = '1px';
    if (cls === 'border-2') styles.borderWidth = '2px';
    if (cls === 'border-4') styles.borderWidth = '4px';
    if (cls === 'border-8') styles.borderWidth = '8px';
  }

  // Border radius
  if (cls.startsWith('rounded')) {
    if (cls === 'rounded') styles.borderRadius = radiusMap['base'];
    if (cls === 'rounded-sm') styles.borderRadius = radiusMap['sm'];
    if (cls === 'rounded-md') styles.borderRadius = radiusMap['md'];
    if (cls === 'rounded-lg') styles.borderRadius = radiusMap['lg'];
    if (cls === 'rounded-xl') styles.borderRadius = radiusMap['xl'];
    if (cls === 'rounded-2xl') styles.borderRadius = radiusMap['2xl'];
    if (cls === 'rounded-3xl') styles.borderRadius = radiusMap['3xl'];
    if (cls === 'rounded-full') styles.borderRadius = radiusMap['full'];
  }

  // Font weight
  if (cls.startsWith('font-')) {
    const value = cls.replace('font-', '');
    const weight = fontWeightMap[value];
    if (weight) styles.fontWeight = weight;
  }

  // Font family
  if (cls === 'font-mono') styles.fontFamily = 'monospace';
  if (cls === 'font-arcade') styles.fontFamily = 'Orbitron, monospace';
  if (cls === 'font-ui') styles.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Text alignment
  if (cls === 'text-left') styles.textAlign = 'left';
  if (cls === 'text-center') styles.textAlign = 'center';
  if (cls === 'text-right') styles.textAlign = 'right';
  if (cls === 'text-justify') styles.textAlign = 'justify';

  // Text transform
  if (cls === 'uppercase') styles.textTransform = 'uppercase';
  if (cls === 'lowercase') styles.textTransform = 'lowercase';
  if (cls === 'capitalize') styles.textTransform = 'capitalize';
  if (cls === 'normal-case') styles.textTransform = 'none';

  // Letter spacing
  if (cls.startsWith('tracking-')) {
    const value = cls.replace('tracking-', '');
    const trackingMap: Record<string, string> = {
      'tighter': '-0.05em',
      'tight': '-0.025em',
      'normal': '0',
      'wide': '0.025em',
      'wider': '0.05em',
      'widest': '0.1em',
    };
    if (trackingMap[value]) styles.letterSpacing = trackingMap[value];
  }

  // Display
  if (cls === 'block') styles.display = 'block';
  if (cls === 'inline') styles.display = 'inline';
  if (cls === 'inline-block') styles.display = 'inline-block';
  if (cls === 'hidden') styles.display = 'none';
  if (cls === 'grid') styles.display = 'grid';
  if (cls === 'contents') styles.display = 'contents';

  // Grid
  if (cls.startsWith('grid-cols-')) {
    const value = cls.replace('grid-cols-', '');
    const numCols = parseInt(value);
    if (!isNaN(numCols)) {
      styles.display = 'grid';
      styles.gridTemplateColumns = `repeat(${numCols}, minmax(0, 1fr))`;
    }
  }

  // Overflow
  if (cls === 'overflow-hidden') styles.overflow = 'hidden';
  if (cls === 'overflow-auto') styles.overflow = 'auto';
  if (cls === 'overflow-scroll') styles.overflow = 'scroll';
  if (cls === 'overflow-x-auto') styles.overflowX = 'auto';
  if (cls === 'overflow-y-auto') styles.overflowY = 'auto';
  if (cls === 'overflow-x-hidden') styles.overflowX = 'hidden';
  if (cls === 'overflow-y-hidden') styles.overflowY = 'hidden';

  // Position
  if (cls === 'relative') styles.position = 'relative';
  if (cls === 'absolute') styles.position = 'absolute';
  if (cls === 'fixed') styles.position = 'fixed';
  if (cls === 'sticky') styles.position = 'sticky';

  // Positioning properties
  if (cls === 'inset-0') {
    styles.top = '0';
    styles.right = '0';
    styles.bottom = '0';
    styles.left = '0';
  }
  if (cls.startsWith('top-')) {
    const value = cls.replace('top-', '');
    const spacing = spacingMap[value] || sizeMap[value];
    if (spacing) styles.top = spacing;
  }
  if (cls.startsWith('bottom-')) {
    const value = cls.replace('bottom-', '');
    const spacing = spacingMap[value] || sizeMap[value];
    if (spacing) styles.bottom = spacing;
  }
  if (cls.startsWith('left-')) {
    const value = cls.replace('left-', '');
    const spacing = spacingMap[value] || sizeMap[value];
    if (spacing) styles.left = spacing;
  }
  if (cls.startsWith('right-')) {
    const value = cls.replace('right-', '');
    const spacing = spacingMap[value] || sizeMap[value];
    if (spacing) styles.right = spacing;
  }

  // Z-index
  if (cls.startsWith('z-')) {
    const value = cls.replace('z-', '');
    const zIndex = parseInt(value);
    if (!isNaN(zIndex)) styles.zIndex = zIndex;
  }

  // Opacity
  if (cls.startsWith('opacity-')) {
    const value = cls.replace('opacity-', '');
    const opacity = parseInt(value) / 100;
    if (!isNaN(opacity)) styles.opacity = opacity;
  }

  // Transforms
  if (cls === 'transform') styles.transform = 'auto';
  
  if (cls.startsWith('translate-x-')) {
    const value = cls.replace('translate-x-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.transform = `translateX(${spacing})`;
  }
  
  if (cls.startsWith('translate-y-')) {
    const value = cls.replace('translate-y-', '');
    const spacing = spacingMap[value];
    if (spacing) styles.transform = `translateY(${spacing})`;
  }

  if (cls === '-translate-y-1/2') styles.transform = 'translateY(-50%)';
  if (cls === '-translate-x-1/2') styles.transform = 'translateX(-50%)';

  if (cls.startsWith('scale-')) {
    const value = cls.replace('scale-', '');
    const scale = parseInt(value) / 100;
    if (!isNaN(scale)) styles.transform = `scale(${scale})`;
  }

  if (cls.startsWith('rotate-')) {
    const value = cls.replace('rotate-', '');
    const degrees = parseInt(value);
    if (!isNaN(degrees)) styles.transform = `rotate(${degrees}deg)`;
  }

  // Transition
  if (cls === 'transition') styles.transition = 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)';
  if (cls === 'transition-all') styles.transition = 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)';
  if (cls === 'transition-colors') styles.transition = 'color, background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)';
  if (cls === 'transition-transform') styles.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
  if (cls === 'transition-opacity') styles.transition = 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)';

  if (cls.startsWith('duration-')) {
    const value = cls.replace('duration-', '');
    const duration = parseInt(value);
    if (!isNaN(duration)) styles.transitionDuration = `${duration}ms`;
  }

  // Cursor
  if (cls === 'cursor-pointer') styles.cursor = 'pointer';
  if (cls === 'cursor-default') styles.cursor = 'default';
  if (cls === 'cursor-not-allowed') styles.cursor = 'not-allowed';

  // Pointer events
  if (cls === 'pointer-events-none') styles.pointerEvents = 'none';
  if (cls === 'pointer-events-auto') styles.pointerEvents = 'auto';

  // White space
  if (cls === 'whitespace-nowrap') styles.whiteSpace = 'nowrap';
  if (cls === 'whitespace-normal') styles.whiteSpace = 'normal';
  if (cls === 'whitespace-pre') styles.whiteSpace = 'pre';
  if (cls === 'whitespace-pre-wrap') styles.whiteSpace = 'pre-wrap';

  // Truncate
  if (cls === 'truncate') {
    styles.overflow = 'hidden';
    styles.textOverflow = 'ellipsis';
    styles.whiteSpace = 'nowrap';
  }

  // Object fit
  if (cls === 'object-cover') styles.objectFit = 'cover';
  if (cls === 'object-contain') styles.objectFit = 'contain';
  if (cls === 'object-fill') styles.objectFit = 'fill';

  // Flexbox properties that need special handling
  if (cls.startsWith('flex-grow')) {
    styles.flexGrow = 1;
  }
  if (cls.startsWith('flex-shrink')) {
    styles.flexShrink = 1;
  }

  // Line height
  if (cls === 'leading-tight') styles.lineHeight = '1.25';
  if (cls === 'leading-normal') styles.lineHeight = '1.5';
  if (cls === 'leading-relaxed') styles.lineHeight = '1.625';
  if (cls === 'leading-loose') styles.lineHeight = '2';
}

/**
 * Utility to apply box-shadow (for shadow classes)
 * Note: Complex shadows with drop-shadow need to be handled via box-shadow property
 */
export function getShadowStyle(shadowClass: string): string {
  const shadowMap: Record<string, string> = {
    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    'shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    'shadow-none': 'none',
  };
  return shadowMap[shadowClass] || '';
}

/**
 * Batch convert multiple tailwind utilities
 */
export function tailwindBatch(utilities: Record<string, string>): Record<string, CSSProperties> {
  const result: Record<string, CSSProperties> = {};
  for (const [key, classNames] of Object.entries(utilities)) {
    result[key] = tailwindToInline(classNames);
  }
  return result;
}
